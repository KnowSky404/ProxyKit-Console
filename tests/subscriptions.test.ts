import { expect, it } from 'vitest';
import catalog from '../src/config/catalog.json';
import { parseCatalog } from '../src/lib/catalog';
import { generateConfig } from '../src/features/subscriptions/generate';
const resources = parseCatalog(catalog).resources;
const resource = (path: string) => resources.find((r) => r.path === path)!;
it('generates Loon and QX snippets with explicit user policy', () => {
  const loon = resource('loon/rules/wise.list');
  expect(generateConfig(loon, 'My Policy')).toBe(
    `[Remote Rule]\n${loon.url}, policy=My Policy, enabled=true`,
  );
  const qx = resource('quantumultx/filters/wise.list');
  expect(generateConfig(qx, '香港策略')).toBe(
    `[filter_remote]\n${qx.url}, tag=proxykit-wise, force-policy=香港策略, enabled=true`,
  );
});
it.each(['json', 'srs'])(
  'generates sing-box %s with correct format and selected outbound',
  (extension) => {
    const r = resource(`sing-box/rules/wise.${extension}`);
    const config = JSON.parse(generateConfig(r, 'My Outbound')!);
    expect(config.route.rule_set[0]).toEqual({
      type: 'remote',
      tag: 'proxykit-wise',
      format: extension === 'srs' ? 'binary' : 'source',
      url: r.url,
    });
    expect(config.route.rules[0]).toEqual({
      rule_set: ['proxykit-wise'],
      action: 'route',
      outbound: 'My Outbound',
    });
  },
);
it.each([
  '',
  '   ',
  'a,b',
  'a#b',
  'a;b',
  'a\u2028b',
  'a\n[General]',
  'a=PROXY',
  'a\0b',
  'a"b',
  'x'.repeat(81),
])('rejects ambiguous or injected policy %j', (policy) => {
  expect(() =>
    generateConfig(resource('loon/rules/wise.list'), policy),
  ).toThrow();
});
it('only offers original URLs for plugin/script contexts', () => {
  expect(
    generateConfig(resource('loon/plugins/sidestore.plugin'), ''),
  ).toBeNull();
  expect(
    generateConfig(resource('loon/scripts/youtube/request.js'), ''),
  ).toBeNull();
});
