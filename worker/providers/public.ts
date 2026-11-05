import catalogData from '../../src/config/catalog.json';
import { parseCatalog, subscriptionUrl } from '../../src/lib/catalog';
import { readPreview, ResourceError } from '../../src/lib/preview';
import type { ResourceProvider } from '../../src/types/resource';
const catalog = parseCatalog(catalogData);
export function publicProvider(
  fetcher: typeof fetch = fetch,
): ResourceProvider {
  return {
    id: 'github-public',
    name: 'ProxyKit Public',
    async listResources() {
      return catalog.resources;
    },
    async getResource(id, signal) {
      const resource = catalog.resources.find((r) => r.id === id);
      if (!resource) throw new ResourceError('resource_not_found', 404);
      if (resource.format === 'srs') return { resource, content: null };
      const response = await fetcher(
        subscriptionUrl(resource.path, resource.revision),
        {
          redirect: 'manual',
          signal: signal
            ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
            : AbortSignal.timeout(10000),
          headers: { Accept: 'text/plain' },
        },
      );
      return { resource, content: await readPreview(response) };
    },
  };
}
export { catalog };
