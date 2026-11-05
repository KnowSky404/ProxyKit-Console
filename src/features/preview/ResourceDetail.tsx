import { useEffect, useState } from 'react';
import { CopyButton } from '../../components/CopyButton';
import type {
  Resource,
  ResourceDetail as Detail,
  ResourceProvider,
} from '../../types/resource';
import { SubscriptionConfig } from '../subscriptions/SubscriptionConfig';
export function ResourceDetail({
  resource,
  provider,
}: {
  resource: Resource;
  provider: ResourceProvider;
}) {
  const [state, setState] = useState<{ detail?: Detail; error?: string }>({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    provider
      .getResource(resource.id, controller.signal)
      .then((detail) => {
        if (!controller.signal.aborted) setState({ detail });
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setState({ error: error.message });
      });
    return () => controller.abort();
  }, [resource.id, provider, attempt]);
  return (
    <article className="detail panel" aria-label="Resource details">
      <h2>{resource.name}</h2>
      <p className="muted">
        {resource.platform} · {resource.category} · .{resource.format}
      </p>
      <p className="path">
        Path <code>{resource.path}</code>
      </p>
      <div className="actions">
        <CopyButton text={resource.url}>Copy URL</CopyButton>
        <a href={resource.url} target="_blank" rel="noreferrer">
          {resource.format === 'srs' ? 'Download SRS ↗' : 'Open source ↗'}
        </a>
      </div>
      <details className="metadata">
        <summary>Source &amp; version</summary>
        <p>{resource.description}</p>
        <p>
          {resource.repository} · {resource.size.toLocaleString()} bytes
        </p>
        <p>Snapshot time: {new Date(resource.updatedAt).toISOString()}</p>
        <p>
          Revision: <code>{resource.revision}</code>
        </p>
        <p className="small">
          Preview is pinned to this catalog revision. Subscription URLs follow
          main.
        </p>
        <a
          href={`https://github.com/${resource.repository}/blob/${resource.revision}/${resource.platform === 'Loon' ? 'loon' : resource.platform === 'Quantumult X' ? 'quantumultx' : 'sing-box'}/README.md`}
          target="_blank"
          rel="noreferrer"
        >
          Compatibility &amp; usage notes ↗
        </a>
      </details>
      <section className="preview">
        <h3>Preview</h3>
        {resource.format === 'srs' ? (
          <p className="muted">
            Binary SRS rule set. Text preview and compilation are unavailable.
            Download the original file or copy its URL.
          </p>
        ) : state.error ? (
          <div role="alert">
            <p>{state.error}</p>
            <button
              onClick={() => {
                setState({});
                setAttempt(attempt + 1);
              }}
            >
              Retry preview
            </button>
          </div>
        ) : state.detail ? (
          <>
            <pre
              className="preview-code"
              tabIndex={0}
              aria-label="Original file content"
            >
              <code>{state.detail.content}</code>
            </pre>
            <CopyButton text={state.detail.content ?? ''}>
              Copy content
            </CopyButton>
          </>
        ) : (
          <p role="status" className="muted">
            Loading preview…
          </p>
        )}
      </section>
      <SubscriptionConfig resource={resource} />
    </article>
  );
}
