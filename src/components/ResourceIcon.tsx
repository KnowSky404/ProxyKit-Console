import { useState } from 'react';
import type { Resource } from '../types/resource';
import { Icon } from './Icon';

export function ResourceIcon({ resource }: { resource: Resource }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="resource-icon" aria-hidden="true">
      {resource.icon && !failed ? (
        <img
          src={`/icons/${resource.icon}.svg`}
          alt=""
          width="72"
          height="72"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon name="file" />
      )}
    </span>
  );
}
