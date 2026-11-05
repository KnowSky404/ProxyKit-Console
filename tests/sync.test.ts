import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';

it('syncs deterministically, excludes symlinks/placeholders and preserves the old catalog on failure', () => {
  // All GitHub responses here are explicit fixtures; no network or credentials.
  const dir = mkdtempSync(join(tmpdir(), 'proxykit-sync-'));
  try {
    mkdirSync(join(dir, 'src/config'), { recursive: true });
    mkdirSync(join(dir, 'bin'));
    writeFileSync(
      join(dir, 'bin/gh'),
      '#!/bin/sh\ncase "$*" in\n *commits/main*) cat "$FIXTURE_DIR/commit.json" ;;\n *git/trees*) cat "$FIXTURE_DIR/tree.json" ;;\n *) exit 1 ;;\nesac\n',
      { mode: 0o755 },
    );
    writeFileSync(
      join(dir, 'commit.json'),
      JSON.stringify({
        sha: 'a'.repeat(40),
        commit: { committer: { date: '2026-11-05T00:00:00Z' } },
      }),
    );
    const tree = {
      truncated: false,
      tree: [
        {
          path: 'loon/rules/fixture.list',
          mode: '100644',
          type: 'blob',
          size: 10,
        },
        {
          path: 'loon/rules/symlink.list',
          mode: '120000',
          type: 'blob',
          size: 10,
        },
        { path: 'loon/rules/.gitkeep', mode: '100644', type: 'blob', size: 0 },
        {
          path: 'shared/rules/fixture.yaml',
          mode: '100644',
          type: 'blob',
          size: 10,
        },
      ],
    };
    writeFileSync(join(dir, 'tree.json'), JSON.stringify(tree));
    const run = () =>
      execFileSync('bun', [resolve('scripts/sync-catalog.ts')], {
        cwd: dir,
        env: {
          ...process.env,
          PATH: `${dir}/bin:${process.env.PATH}`,
          FIXTURE_DIR: dir,
        },
        stdio: 'pipe',
      });
    run();
    const path = join(dir, 'src/config/catalog.json');
    const first = readFileSync(path, 'utf8');
    expect(
      JSON.parse(first).resources.map((r: { path: string }) => r.path),
    ).toEqual(['loon/rules/fixture.list']);
    run();
    expect(readFileSync(path, 'utf8')).toBe(first);
    writeFileSync(
      join(dir, 'tree.json'),
      JSON.stringify({ ...tree, truncated: true }),
    );
    expect(run).toThrow();
    expect(readFileSync(path, 'utf8')).toBe(first);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
