import { describe, expect, it } from 'vitest';
import catalog from '../src/config/catalog.json';
import {
  classifyPath,
  filterResources,
  parseCatalog,
  subscriptionUrl,
} from '../src/lib/catalog';

describe('public catalog trust boundary', () => {
  it('validates the real snapshot, unique IDs and all three platforms', () => {
    const result = parseCatalog(catalog);
    expect(result.resources.length).toBeGreaterThan(0);
    expect(new Set(result.resources.map((r) => r.platform)).size).toBe(3);
    expect(
      result.resources
        .filter((r) => r.format === 'srs')
        .every((r) => r.category === 'Binary Rule Set'),
    ).toBe(true);
    expect(parseCatalog({ ...catalog, resources: [] }).resources).toEqual([]);
  });
  it.each([
    '../loon/rules/wise.list',
    'loon/rules/../wise.list',
    'loon/rules/%2e%2e/wise.list',
    '/loon/rules/wise.list',
    'loon/rules/.gitkeep',
    'shared/rules/wise.yaml',
    'loon/rules/wise.list?x=1',
    'https://evil.test/a.js',
    'loon/scripts/.hidden.js',
    'loon/scripts/a..js',
    'loon/scripts/a.js#x',
  ])('rejects unsupported or unsafe path %s', (path) => {
    expect(classifyPath(path)).toBeNull();
    expect(() => subscriptionUrl(path)).toThrow();
  });
  it('supports only real category locations, including future QX files', () => {
    expect(classifyPath('quantumultx/rewrites/example.conf')?.category).toBe(
      'Rewrite',
    );
    expect(classifyPath('quantumultx/scripts/example.js')?.category).toBe(
      'Script',
    );
    expect(classifyPath('loon/scripts/youtube/response.js')?.category).toBe(
      'Script',
    );
    expect(subscriptionUrl('loon/rules/wise.list')).toBe(
      'https://raw.githubusercontent.com/KnowSky404/ProxyKit/main/loon/rules/wise.list',
    );
    expect(() => subscriptionUrl('loon/rules/wise.list', 'evil/ref')).toThrow();
  });
  it.each([
    { url: 'https://evil.test/file' },
    { path: '../private.list' },
    { format: 'exe' },
    { platform: 'Other' },
    { size: -1 },
    { revision: 'main' },
    { providerId: 'private' },
    { repository: 'other/repo' },
    { name: '' },
  ])('rejects catalog resource tampering %j', (change) => {
    expect(() =>
      parseCatalog({
        ...catalog,
        resources: [{ ...catalog.resources[0], ...change }],
      }),
    ).toThrow();
  });
  it('rejects invalid metadata and duplicate IDs', () => {
    expect(() => parseCatalog(null)).toThrow();
    expect(() => parseCatalog({ ...catalog, revision: 'main' })).toThrow();
    expect(() =>
      parseCatalog({
        ...catalog,
        resources: [catalog.resources[0], catalog.resources[0]],
      }),
    ).toThrow();
  });
  it('filters names, paths, platform and category together', () => {
    const resources = parseCatalog(catalog).resources;
    expect(
      filterResources(resources, ' WISE ', 'Loon', 'Rule').map((r) => r.path),
    ).toEqual(['loon/rules/wise.list']);
    expect(filterResources(resources, '', 'Quantumult X', 'Rewrite')).toEqual(
      [],
    );
    expect(filterResources(resources, 'nonsense', '', '')).toEqual([]);
    expect(filterResources([], '', '', '')).toEqual([]);
  });
});
