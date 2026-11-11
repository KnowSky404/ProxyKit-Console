import { afterEach, expect, it, vi } from 'vitest';
import { publicProvider } from '../src/providers/public';
import catalog from '../src/config/catalog.json';
import { PREVIEW_LIMIT } from '../src/config/sources';
const resource = catalog.resources[0];
afterEach(() => vi.unstubAllGlobals());
function respond(input: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(input)));
}
it('validates detail identity, public metadata, icon and content at the browser boundary', async () => {
  respond({ resource, content: '<script>inert</script>\n策略\r\n' });
  expect((await publicProvider.getResource(resource.id)).content).toContain(
    '策略',
  );
  for (const input of [
    null,
    { resource, content: 12 },
    { resource: { ...resource, id: 'different' }, content: '' },
    { resource: { ...resource, url: 'https://evil.test' }, content: '' },
    {
      resource: { ...resource, icon: 'https://evil.test/icon.svg' },
      content: '',
    },
    { resource, content: null },
    { resource, content: 'a\0b' },
    { resource, content: '策'.repeat(Math.ceil(PREVIEW_LIMIT / 3)) },
  ]) {
    respond(input);
    await expect(publicProvider.getResource(resource.id)).rejects.toThrow();
  }
  respond({ resource, content: '' });
  await expect(
    publicProvider.getResource('loon/rules/wise.list'),
  ).rejects.toThrow();
  const binary = catalog.resources.find((r) => r.format === 'srs')!;
  respond({ resource: binary, content: null });
  expect((await publicProvider.getResource(binary.id)).content).toBeNull();
  respond({ resource: binary, content: 'binary' });
  await expect(publicProvider.getResource(binary.id)).rejects.toThrow();
});
