export function PrivateState() {
  return (
    <section className="private-state panel">
      <h1>Private resources</h1>
      <p>No Gateway connected.</p>
      <p className="muted">
        Private browsing requires Web user authentication and an approved
        server-side Gateway connection. These capabilities are planned; the
        current Gateway has no catalog discovery API.
      </p>
      <p className="muted">
        Device tokens are for subscription clients. This Console does not
        request or store them.
      </p>
      <a href="https://github.com/KnowSky404/ProxyKit-Console/blob/main/docs/gateway-protocol.md">
        Read the proposed Gateway protocol ↗
      </a>
    </section>
  );
}
