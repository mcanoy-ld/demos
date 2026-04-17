/**
 * Local configuration — loaded before app.js (after demo_contexts.js).
 * Copy to config.js and adjust values. index.html loads demo_contexts.js first;
 * for a single-file setup, replace `contexts: window.DEMO_CONTEXTS` with your own array.
 */
window.APP_CONFIG = {
  bootstrapApiUrl: 'http://localhost:8080/api/bootstrap',
  clientSideId: 'LD_CLIENT_KEY',
  flagKey: 'LD_FLAG_KEY',
  contexts: window.DEMO_CONTEXTS,
  application: {
    id: 'js-with-bootstrap',
    version: '1',
  },
};
