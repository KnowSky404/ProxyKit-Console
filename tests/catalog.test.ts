import { describe, expect, it } from 'vitest';
import catalog from '../src/config/catalog.json';
import {
  classifyPath,
  filterResources,
  groupResources,
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

it('supports optional reviewed icon IDs, rejects image URLs and ships every mapped asset', async () => {
  const { RESOURCE_ICON_IDS } = await import('../src/types/resource');
  const { resourceIcon } = await import('../src/config/resource-icons');
  const { existsSync } = await import('node:fs');
  const legacy = { ...catalog.resources[0], icon: undefined };
  expect(
    parseCatalog({ ...catalog, resources: [legacy] }).resources[0].icon,
  ).toBeUndefined();
  for (const icon of [
    'https://evil.test/a.svg',
    '../private',
    '',
    null,
    4,
    '<svg/>',
  ]) {
    expect(() =>
      parseCatalog({ ...catalog, resources: [{ ...legacy, icon }] }),
    ).toThrow();
  }
  expect(resourceIcon('loon/rules/unknown.list')).toBeUndefined();
  expect(resourceIcon('loon/scripts/youtube/request.js')).toBe('youtube');
  for (const icon of RESOURCE_ICON_IDS)
    expect(existsSync(`public/icons/${icon}.svg`)).toBe(true);
  for (const r of catalog.resources) expect(r.icon).toBe(resourceIcon(r.path));
});

it('groups only matching sing-box file stems, defaults to JSON and preserves real variants', () => {
  const resources = parseCatalog(catalog).resources;
  const groups = groupResources(resources);
  expect(groups).toHaveLength(27);
  expect(
    groups.filter((group) => group[0].platform === 'sing-box'),
  ).toHaveLength(7);
  expect(
    groups
      .filter((group) => group[0].platform !== 'sing-box')
      .every((group) => group.length === 1),
  ).toBe(true);
  const json = resources.find((r) => r.path === 'sing-box/rules/wise.json')!;
  const binary = resources.find((r) => r.path === 'sing-box/rules/wise.srs')!;
  const reversed = [binary, json];
  expect(groupResources(reversed)).toEqual([[json, binary]]);
  expect(reversed).toEqual([binary, json]);
  expect(groupResources([json])).toEqual([[json]]);
  expect(groupResources([binary])).toEqual([[binary]]);
  expect(groupResources([])).toEqual([]);
  const other = resources.find((r) => r.path === 'sing-box/rules/binance.srs')!;
  expect(groupResources([json, { ...other, name: json.name }])).toHaveLength(2);
  for (const change of [
    { providerId: 'other' },
    { repository: 'other/repo' },
    { revision: 'a'.repeat(40) },
  ]) {
    expect(groupResources([json, { ...binary, ...change }])).toHaveLength(2);
  }
  expect(
    groupResources(filterResources(resources, 'wise.srs', 'sing-box', '')),
  ).toEqual([[binary]]);
  expect(
    groupResources(
      filterResources(resources, 'wise', 'sing-box', 'Source Rule Set'),
    ),
  ).toEqual([[json]]);
});
