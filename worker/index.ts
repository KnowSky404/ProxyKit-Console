import { catalog, publicProvider } from './providers/public';
import { ResourceError } from '../src/lib/preview';

const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};
export async function handleApi(
  request: Request,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const json = (data: unknown, status = 200) =>
    Response.json(data, { status, headers });
  if (!['/api/catalog', '/api/resource'].includes(url.pathname))
    return json({ error: 'not_found' }, 404);
  if (request.method !== 'GET')
    return new Response(null, {
      status: 405,
      headers: { ...headers, Allow: 'GET' },
    });
  if (url.pathname === '/api/catalog')
    return url.search ? json({ error: 'invalid_query' }, 400) : json(catalog);
  if (
    [...url.searchParams.keys()].some((key) => key !== 'id') ||
    url.searchParams.getAll('id').length !== 1
  )
    return json({ error: 'invalid_query' }, 400);
  try {
    return json(
      await publicProvider(fetcher).getResource(
        url.searchParams.get('id')!,
        request.signal,
      ),
    );
  } catch (error) {
    if (error instanceof ResourceError)
      return json({ error: error.code }, error.status);
    return json({ error: 'upstream_unavailable' }, 502);
  }
}
export default {
  fetch(request: Request) {
    return handleApi(request);
  },
};
