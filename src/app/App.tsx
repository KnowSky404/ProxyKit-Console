import { useEffect, useState } from 'react';
import type { Resource, ResourceProvider } from '../types/resource';
import { publicProvider } from '../providers/public';
import { filterResources } from '../lib/catalog';
import { ResourceList } from '../features/catalog/ResourceList';
import { ResourceDetail } from '../features/preview/ResourceDetail';
import { PrivateState } from '../features/gateways/PrivateState';

function initialTheme(): string {
  try {
    return (
      localStorage.getItem('theme') ??
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    );
  } catch {
    return 'light';
  }
}
export function App({
  provider = publicProvider,
}: {
  provider?: ResourceProvider;
}) {
  const [tab, setTab] = useState('public');
  const [theme, setTheme] = useState(initialTheme);
  const [resources, setResources] = useState<Resource[]>([]);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('');
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState('');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* Storage is optional. */
    }
  }, [theme]);
  useEffect(() => {
    const controller = new AbortController();
    provider
      .listResources(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setResources(items);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });
    return () => controller.abort();
  }, [provider, attempt]);
  const visible = filterResources(resources, query, platform, category);
  const selected = visible.find((r) => r.id === selectedId) ?? visible[0];
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to resources
      </a>
      <header className="topbar">
        <a className="brand" href="/">
          <span className="monogram" aria-hidden="true">
            P
          </span>
          ProxyKit Console
        </a>
        <nav aria-label="Resource access">
          <button
            aria-current={tab === 'public' ? 'page' : undefined}
            onClick={() => setTab('public')}
          >
            Public
          </button>
          <button
            aria-current={tab === 'private' ? 'page' : undefined}
            onClick={() => setTab('private')}
          >
            Private
          </button>
        </nav>
        <div className="header-controls">
          <label className="sr-only" htmlFor="source">
            Resource source / Gateway
          </label>
          <select id="source" value="public" onChange={() => {}}>
            <option value="public">GitHub · Public source</option>
            <option disabled>Gateway connections · planned</option>
          </select>
          <button
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? '☼ Light' : '☾ Dark'}
          </button>
        </div>
      </header>
      <main id="main">
        {tab === 'private' ? (
          <PrivateState />
        ) : (
          <>
            <div className="page-heading">
              <h1>Public resources</h1>
              <p className="muted">
                Browse rules, plugins and scripts from ProxyKit.
              </p>
            </div>
            <div className="filters">
              <label className="search">
                <span aria-hidden="true">⌕</span>
                <input
                  aria-label="Search resources"
                  placeholder="Search resources"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label className="sr-only" htmlFor="platform">
                Platform
              </label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="">All platforms</option>
                {['Loon', 'Quantumult X', 'sing-box'].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {[
                  'Rule',
                  'Plugin',
                  'Script',
                  'Filter',
                  'Rewrite',
                  'Source Rule Set',
                  'Binary Rule Set',
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            {status === 'loading' ? (
              <p role="status">Loading resources…</p>
            ) : status === 'error' ? (
              <div role="alert">
                <p>Could not load the public catalog.</p>
                <button
                  onClick={() => {
                    setStatus('loading');
                    setAttempt(attempt + 1);
                  }}
                >
                  Retry catalog
                </button>
              </div>
            ) : (
              <>
                <p className="result-count muted small" aria-live="polite">
                  {visible.length} resources{platform ? ` · ${platform}` : ''}
                </p>
                <div className="workspace">
                  <ResourceList
                    resources={visible}
                    selectedId={selected?.id}
                    onSelect={setSelectedId}
                  />
                  {selected ? (
                    <ResourceDetail
                      key={selected.id}
                      resource={selected}
                      provider={provider}
                    />
                  ) : (
                    <div className="detail panel empty">
                      Select different filters to browse available resources.
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
      <footer>
        <span>
          Public repository:{' '}
          <a
            href="https://github.com/KnowSky404/ProxyKit"
            target="_blank"
            rel="noreferrer"
          >
            KnowSky404/ProxyKit ↗
          </a>
        </span>
        <span>
          Catalog revision:{' '}
          <code>{resources[0]?.revision.slice(0, 7) ?? '—'}</code>
        </span>
        <span>Private &amp; multi-Gateway access planned</span>
      </footer>
    </>
  );
}
