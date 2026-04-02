/**
 * Local configuration — loaded before app.js.
 * Set clientSideId to your LaunchDarkly client-side ID (use "xxx" to force SDK errors while still using bootstrap).
 */
window.APP_CONFIG = {
  bootstrapApiUrl: 'http://localhost:8080/api/bootstrap',
  clientSideId: 'xxx',
  flagKey: 'widget-one',
  context: {
    key: 'randy-key',
    name: 'Randy',
    kind: 'user',
  },
  application: {
    id: 'js-with-bootstrap',
    version: '1',
  },
};
