import type { Resource } from '../../types/resource';
export function generateConfig(
  resource: Resource,
  policy: string,
): string | null {
  if (
    !['Rule', 'Filter', 'Source Rule Set', 'Binary Rule Set'].includes(
      resource.category,
    )
  )
    return null;
  const value = policy.trim();
  if (
    !value ||
    value.length > 80 ||
    /[,;#=[\]"'\\\r\n\t\p{C}\p{Zl}\p{Zp}]/u.test(value)
  )
    throw new Error(
      'Enter a policy name without commas, comment markers, quotes, brackets, equals signs or control characters (max 80 characters).',
    );
  const tag = `proxykit-${resource.path
    .split('/')
    .at(-1)!
    .replace(/\.[^.]+$/, '')}`;
  if (resource.platform === 'Loon')
    return `[Remote Rule]\n${resource.url}, policy=${value}, enabled=true`;
  if (resource.platform === 'Quantumult X')
    return `[filter_remote]\n${resource.url}, tag=${tag}, force-policy=${value}, enabled=true`;
  return JSON.stringify(
    {
      route: {
        rule_set: [
          {
            type: 'remote',
            tag,
            format: resource.format === 'srs' ? 'binary' : 'source',
            url: resource.url,
          },
        ],
        rules: [{ rule_set: [tag], action: 'route', outbound: value }],
      },
    },
    null,
    2,
  );
}
