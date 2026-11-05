import { execFileSync } from 'node:child_process';
import { writeFileSync, renameSync } from 'node:fs';
import {
  classifyPath,
  parseCatalog,
  subscriptionUrl,
} from '../src/lib/catalog';
import { PUBLIC_SOURCE } from '../src/config/sources';
import type { Catalog } from '../src/types/resource';

function github(path: string): unknown {
  return JSON.parse(
    execFileSync('gh', ['api', `repos/${PUBLIC_SOURCE.repository}/${path}`], {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    }),
  );
}
const commit = github(`commits/${PUBLIC_SOURCE.ref}`) as {
  sha: string;
  commit: { committer: { date: string } };
};
if (!/^[a-f0-9]{40}$/.test(commit.sha))
  throw new Error('Invalid upstream revision');
const tree = github(`git/trees/${commit.sha}?recursive=1`) as {
  truncated: boolean;
  tree: { path: string; type: string; mode: string; size?: number }[];
};
if (tree.truncated || !Array.isArray(tree.tree))
  throw new Error('Incomplete upstream tree');
const catalog: Catalog = {
  schemaVersion: 1,
  revision: commit.sha,
  updatedAt: commit.commit.committer.date,
  resources: tree.tree
    .flatMap((entry) => {
      const kind = classifyPath(entry.path);
      if (
        !kind ||
        entry.type !== 'blob' ||
        !['100644', '100755'].includes(entry.mode)
      )
        return [];
      const name = entry.path
        .split('/')
        .at(-1)!
        .replace(/\.[^.]+$/, '')
        .split('-')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');
      return [
        {
          id: entry.path,
          name,
          description: `${kind.platform} ${kind.category.toLowerCase()} from ProxyKit. Review the upstream README for compatibility and usage limits.`,
          ...kind,
          providerId: PUBLIC_SOURCE.id,
          repository: PUBLIC_SOURCE.repository,
          path: entry.path,
          url: subscriptionUrl(entry.path),
          revision: commit.sha,
          updatedAt: commit.commit.committer.date,
          size: entry.size!,
        },
      ];
    })
    .sort((a, b) => a.path.localeCompare(b.path, 'en')),
};
parseCatalog(catalog);
writeFileSync(
  'src/config/catalog.json.tmp',
  JSON.stringify(catalog, null, 2) + '\n',
);
renameSync('src/config/catalog.json.tmp', 'src/config/catalog.json');
console.log(
  `Synced ${catalog.resources.length} public resources at ${catalog.revision}`,
);
