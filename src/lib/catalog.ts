import { PUBLIC_SOURCE } from '../config/sources';
import type { Catalog, Category, Platform, Resource } from '../types/resource';
import { RESOURCE_ICON_IDS } from '../types/resource';

const patterns: [RegExp, Platform, Category][] = [
  [/^loon\/rules\/[a-z0-9-]+\.list$/, 'Loon', 'Rule'],
  [/^loon\/plugins\/[a-z0-9.-]+\.plugin$/, 'Loon', 'Plugin'],
  [/^loon\/scripts\/(?:[a-z0-9-]+\/)*[a-z0-9.-]+\.js$/, 'Loon', 'Script'],
  [/^quantumultx\/filters\/[a-z0-9-]+\.list$/, 'Quantumult X', 'Filter'],
  [
    /^quantumultx\/rewrites\/[a-z0-9-]+\.(?:conf|rewrite)$/,
    'Quantumult X',
    'Rewrite',
  ],
  [
    /^quantumultx\/scripts\/(?:[a-z0-9-]+\/)*[a-z0-9.-]+\.js$/,
    'Quantumult X',
    'Script',
  ],
  [/^sing-box\/rules\/[a-z0-9-]+\.json$/, 'sing-box', 'Source Rule Set'],
  [/^sing-box\/rules\/[a-z0-9-]+\.srs$/, 'sing-box', 'Binary Rule Set'],
];
export function classifyPath(path: string) {
  if (
    path.split('/').some((part) => part.startsWith('.')) ||
    path.includes('..')
  )
    return null;
  const match = patterns.find(([pattern]) => pattern.test(path));
  return match
    ? {
        platform: match[1],
        category: match[2],
        format: path.split('.').at(-1)!,
      }
    : null;
}
export function subscriptionUrl(
  path: string,
  ref: string = PUBLIC_SOURCE.ref,
): string {
  if (!classifyPath(path) || !(ref === 'main' || /^[a-f0-9]{40}$/.test(ref)))
    throw new Error('Invalid public resource path or revision');
  return `https://raw.githubusercontent.com/${PUBLIC_SOURCE.repository}/${ref}/${path}`;
}
export function parseCatalog(input: unknown): Catalog {
  if (!input || typeof input !== 'object') throw new Error('Invalid catalog');
  const c = input as Partial<Catalog>;
  if (
    c.schemaVersion !== 1 ||
    typeof c.revision !== 'string' ||
    !/^[a-f0-9]{40}$/.test(c.revision) ||
    typeof c.updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(c.updatedAt)) ||
    !Array.isArray(c.resources) ||
    c.resources.length > 2000
  )
    throw new Error('Invalid catalog metadata');
  const ids = new Set<string>();
  for (const r of c.resources) {
    if (!r || typeof r !== 'object' || typeof r.path !== 'string')
      throw new Error('Invalid resource');
    const kind = classifyPath(r.path);
    if (
      !kind ||
      r.id !== r.path ||
      ids.has(r.id) ||
      r.providerId !== PUBLIC_SOURCE.id ||
      r.repository !== PUBLIC_SOURCE.repository ||
      r.url !== subscriptionUrl(r.path) ||
      r.platform !== kind.platform ||
      r.category !== kind.category ||
      r.format !== kind.format ||
      r.revision !== c.revision ||
      r.updatedAt !== c.updatedAt ||
      typeof r.name !== 'string' ||
      !r.name.trim() ||
      r.name.length > 160 ||
      typeof r.description !== 'string' ||
      r.description.length > 1000 ||
      (r.icon !== undefined &&
        !RESOURCE_ICON_IDS.some((id) => id === r.icon)) ||
      !Number.isSafeInteger(r.size) ||
      r.size < 0
    )
      throw new Error('Invalid catalog resource');
    ids.add(r.id);
  }
  return c as Catalog;
}
export function filterResources(
  resources: Resource[],
  query: string,
  platform: string,
  category: string,
) {
  const search = query.trim().toLocaleLowerCase();
  return resources.filter(
    (r) =>
      (!platform || r.platform === platform) &&
      (!category || r.category === category) &&
      `${r.name} ${r.description} ${r.path} ${r.platform}`
        .toLocaleLowerCase()
        .includes(search),
  );
}
