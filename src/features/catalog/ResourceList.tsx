import type { Resource } from '../../types/resource';
export function ResourceList({
  resources,
  selectedId,
  onSelect,
}: {
  resources: Resource[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="resource-list panel" aria-label="Resources">
      <div className="list-head">
        <span>Resource</span>
        <span>Platform</span>
        <span>Category</span>
        <span>Format</span>
      </div>
      {resources.length === 0 ? (
        <p className="empty">No resources match your filters.</p>
      ) : (
        resources.map((r) => (
          <button
            type="button"
            key={r.id}
            className={`resource-row ${selectedId === r.id ? 'selected' : ''}`}
            aria-pressed={selectedId === r.id}
            onClick={() => onSelect(r.id)}
          >
            <span className="resource-name">
              <span className="file-icon" aria-hidden="true">
                <svg
                  width="20"
                  height="24"
                  viewBox="0 0 20 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3 1h9l5 5v17H3zM12 1v6h5M6 12h8M6 16h8" />
                </svg>
              </span>
              <span>
                <strong>{r.name}</strong>
                <small>{r.path}</small>
              </span>
            </span>
            <span className="row-platform">{r.platform}</span>
            <span className="row-category">{r.category}</span>
            <span className="format">.{r.format}</span>
          </button>
        ))
      )}
    </section>
  );
}
