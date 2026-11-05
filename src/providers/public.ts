import { parseCatalog } from '../lib/catalog';
import type { ResourceDetail, ResourceProvider } from '../types/resource';
async function api(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(path, { signal });
  if (!response.ok) {
    const messages: Record<number, string> = {
      404: 'This resource is no longer available.',
      413: 'This file exceeds the 128 KiB preview limit. Open the source to read it.',
      415: 'This file is not valid UTF-8 text.',
    };
    throw new Error(
      messages[response.status] ??
        'Could not load resources. Please try again.',
    );
  }
  return response.json();
}
export const publicProvider: ResourceProvider = {
  id: 'github-public',
  name: 'ProxyKit Public',
  async listResources(signal) {
    return parseCatalog(await api('/api/catalog', signal)).resources;
  },
  async getResource(id, signal) {
    return (await api(
      `/api/resource?id=${encodeURIComponent(id)}`,
      signal,
    )) as ResourceDetail;
  },
};
