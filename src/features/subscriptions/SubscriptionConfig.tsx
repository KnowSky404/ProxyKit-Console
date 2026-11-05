import { useState } from 'react';
import { CopyButton } from '../../components/CopyButton';
import type { Resource } from '../../types/resource';
import { generateConfig } from './generate';
export function SubscriptionConfig({ resource }: { resource: Resource }) {
  const [policy, setPolicy] = useState('');
  let config: string | null = null;
  let error = '';
  try {
    config = generateConfig(resource, policy);
  } catch (e) {
    error = (e as Error).message;
  }
  const supported = [
    'Rule',
    'Filter',
    'Source Rule Set',
    'Binary Rule Set',
  ].includes(resource.category);
  return (
    <section className="subscription">
      <h3>Subscription configuration</h3>
      {supported ? (
        <>
          <label htmlFor="policy">
            {resource.platform === 'sing-box'
              ? 'Existing outbound name'
              : resource.platform === 'Quantumult X'
                ? 'Policy name (force-policy)'
                : 'Policy name'}
          </label>
          <input
            id="policy"
            value={policy}
            placeholder="Enter a policy from your client"
            maxLength={80}
            onChange={(e) => setPolicy(e.target.value)}
            aria-describedby="config-help"
          />
          <p id="config-help" className="muted small">
            {resource.platform === 'sing-box'
              ? 'Merge into route.rule_set and route.rules. Explicit route action requires sing-box 1.11+.'
              : 'Use an existing policy. Merge this snippet into your client configuration.'}
          </p>
          {config ? (
            <>
              <pre className="config-code">
                <code>{config}</code>
              </pre>
              <CopyButton key={config} text={config}>
                Copy configuration
              </CopyButton>
            </>
          ) : (
            <p className="muted small" role={policy ? 'alert' : undefined}>
              {policy
                ? error
                : 'Enter a policy name to generate a configuration.'}
            </p>
          )}
        </>
      ) : (
        <p className="muted">
          {resource.category === 'Plugin'
            ? 'Copy the plugin URL and import it through Loon’s plugin interface. Check the upstream README for minimum Loon versions and limitations.'
            : 'Only the original URL is provided. Script and rewrite installation depends on its calling plugin or client context.'}
        </p>
      )}
    </section>
  );
}
