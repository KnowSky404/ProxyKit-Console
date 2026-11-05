import { defineConfig } from 'cf/config';
export default defineConfig({
  worker: {
    name: 'proxykit-console',
    entrypoint: './worker/index.ts',
    compatibilityDate: '2026-11-05',
    assets: {
      notFoundHandling: 'single-page-application',
      runWorkerFirst: ['/api/*'],
    },
    observability: {
      enabled: true,
      redactQueryString: true,
      traces: { enabled: true },
    },
  },
});
