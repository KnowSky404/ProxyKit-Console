import { useState } from 'react';
import type { Resource } from '../../types/resource';
import { CopyButton } from '../../components/CopyButton';
import { ResourceIcon } from '../../components/ResourceIcon';
import { Icon } from '../../components/Icon';

function ResourceCard({
  resources,
  onSelect,
}: {
  resources: Resource[];
  onSelect: (id: string) => void;
}) {
  const [format, setFormat] = useState('json');
  const r =
    resources.find((resource) => resource.format === format) ?? resources[0];
  const multiple = resources.length > 1;
  return (
    <article
      className="resource-card"
      aria-label={`${r.name} · ${r.platform} · ${multiple ? 'Rule Set' : r.category}`}
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
            {multiple ? 'Rule Set' : r.category}{' '}
            <span aria-hidden="true">·</span>{' '}
            {multiple ? 'JSON / SRS' : `.${r.format}`}
          </span>
          <span className="card-path">{r.path}</span>
        </span>
      </button>
      {multiple && (
        <label className="card-format">
          <span>Format</span>
          <select
            aria-label={`${r.name} format`}
            value={r.format}
            onChange={(event) => setFormat(event.target.value)}
          >
            {resources.map((resource) => (
              <option key={resource.id} value={resource.format}>
                {resource.format === 'json' ? 'JSON' : 'Binary (SRS)'}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="card-actions">
        <CopyButton key={r.id} text={r.url}>
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
  );
}

export function ResourceList({
  groups,
  onSelect,
}: {
  groups: Resource[][];
  onSelect: (id: string) => void;
}) {
  return (
    <section className="resource-grid" aria-label="Resources">
      {groups.length === 0 ? (
        <p className="empty">No resources match your filters.</p>
      ) : (
        groups.map((resources) => (
          <ResourceCard
            key={resources[0].id}
            resources={resources}
            onSelect={onSelect}
          />
        ))
      )}
    </section>
  );
}
