import type { Resource } from '../../types/resource';
import { CopyButton } from '../../components/CopyButton';
import { ResourceIcon } from '../../components/ResourceIcon';
import { Icon } from '../../components/Icon';

export function ResourceList({
  resources,
  onSelect,
}: {
  resources: Resource[];
  onSelect: (id: string) => void;
}) {
  return (
    <section className="resource-grid" aria-label="Resources">
      {resources.length === 0 ? (
        <p className="empty">No resources match your filters.</p>
      ) : (
        resources.map((r) => (
          <article
            key={r.id}
            className="resource-card"
            aria-label={`${r.name} · ${r.platform} · ${r.category}`}
          >
            <span className="card-platform">{r.platform}</span>
            <button
              className="card-main"
              onClick={() => onSelect(r.id)}
              aria-label={`View ${r.name} details`}
            >
              <ResourceIcon resource={r} />
              <span className="card-info">
                <strong>{r.name}</strong>
                <span className="card-kind">
                  {r.category} <span aria-hidden="true">·</span> .{r.format}
                </span>
                <span className="card-path">{r.path}</span>
              </span>
            </button>
            <div className="card-actions">
              <CopyButton text={r.url}>
                <Icon name="copy" /> Copy URL
              </CopyButton>
              <button
                className="detail-link"
                onClick={() => onSelect(r.id)}
                aria-label={`View ${r.name} details`}
              >
                View details <Icon name="arrow" />
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
