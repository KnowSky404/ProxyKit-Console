import { expect, it, vi } from 'vitest';
import { readPreview } from '../src/lib/preview';
import { PREVIEW_LIMIT } from '../src/config/sources';
import { publicProvider } from '../worker/providers/public';
import worker, { handleApi } from '../worker';
it('preserves UTF-8, newlines and untrusted markup as text', async () => {
  const text = '策略\r\n<script>alert(1)</script>\n';
  expect(await readPreview(new Response(text))).toBe(text);
  expect(await readPreview(new Response(''))).toBe('');
});
it('limits both declared and streamed bytes', async () => {
  await expect(
    readPreview(
      new Response('x', {
        headers: { 'Content-Length': String(PREVIEW_LIMIT + 1) },
      }),
    ),
  ).rejects.toMatchObject({ status: 413 });
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(PREVIEW_LIMIT));
      c.enqueue(new Uint8Array(1));
      c.close();
    },
  });
  await expect(readPreview(new Response(stream))).rejects.toMatchObject({
    status: 413,
  });
  expect(
    (await readPreview(new Response('x'.repeat(PREVIEW_LIMIT)))).length,
  ).toBe(PREVIEW_LIMIT);
});
it('rejects invalid UTF-8, binary and upstream errors', async () => {
  await expect(
    readPreview(new Response(new Uint8Array([255]))),
  ).rejects.toMatchObject({ status: 415 });
  await expect(readPreview(new Response('a\0b'))).rejects.toMatchObject({
    status: 415,
  });
  await expect(
    readPreview(new Response('', { status: 404 })),
  ).rejects.toMatchObject({ status: 404 });
  await expect(
    readPreview(new Response('', { status: 503 })),
  ).rejects.toMatchObject({ status: 502 });
});
it('never fetches SRS or arbitrary IDs, pins text fetches and rejects redirects', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response('DOMAIN,example.test\n'));
  const provider = publicProvider(fetcher);
  expect(
    (await provider.getResource('sing-box/rules/wise.srs')).content,
  ).toBeNull();
  await expect(provider.getResource('https://evil.test')).rejects.toMatchObject(
    { status: 404 },
  );
  expect(fetcher).not.toHaveBeenCalled();
  await provider.getResource('loon/rules/wise.list');
  expect(fetcher).toHaveBeenCalledWith(
    expect.stringMatching(/ProxyKit\/[a-f0-9]{40}\/loon\/rules\/wise.list$/),
    expect.objectContaining({
      redirect: 'manual',
      signal: expect.any(AbortSignal),
    }),
  );
});
it('sanitizes network failures and denies arbitrary URL/query inputs', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockRejectedValue(new Error('sensitive upstream internals'));
  const call = (path: string) =>
    handleApi(new Request(`https://console.test${path}`), fetcher);
  const failure = await call('/api/resource?id=loon%2Frules%2Fwise.list');
  expect(failure.status).toBe(502);
  expect(await failure.json()).toEqual({ error: 'upstream_unavailable' });
  fetcher.mockClear();
  for (const path of [
    '/api/resource?id=https://evil.test',
    '/api/resource?id=../private.list',
    '/api/resource?id=loon/rules/wise.list&url=https://evil.test',
    '/api/resource?id=a&id=b',
    '/api/resource',
    '/api/catalog?url=https://evil.test',
    '/api/private',
  ])
    expect((await call(path)).status).toBeGreaterThanOrEqual(400);
  expect(fetcher).not.toHaveBeenCalled();
  expect(
    (
      await handleApi(
        new Request('https://console.test/api/catalog', { method: 'POST' }),
      )
    ).status,
  ).toBe(405);
  const catalogResponse = await call('/api/catalog');
  expect(catalogResponse.status).toBe(200);
  expect(catalogResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
});
it('propagates a missing upstream file to a clear 404', async () => {
  const response = await handleApi(
    new Request('https://console.test/api/resource?id=loon/rules/wise.list'),
    vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 404 })),
  );
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: 'resource_not_found' });
});

it('Worker entrypoint ignores environment and context as fetcher arguments', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response('runtime preview'));
  vi.stubGlobal('fetch', fetcher);
  try {
    const response = await Reflect.apply(worker.fetch, worker, [
      new Request('https://console.test/api/resource?id=loon/rules/wise.list'),
      {},
      {},
    ]);
    expect(response.status).toBe(200);
    expect((await response.json()).content).toBe('runtime preview');
  } finally {
    vi.unstubAllGlobals();
  }
});
it('rejects upstream redirects without following the target', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(null, {
      status: 302,
      headers: { Location: 'https://evil.test' },
    }),
  );
  await expect(
    publicProvider(fetcher).getResource('loon/rules/wise.list'),
  ).rejects.toMatchObject({ status: 502 });
  expect(fetcher).toHaveBeenCalledTimes(1);
});
