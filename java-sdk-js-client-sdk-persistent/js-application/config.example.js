/**
 * Local configuration — loaded before app.js.
 * Set clientSideId to your LaunchDarkly client-side ID (use "xxx" to force SDK errors while still using bootstrap).
 */
window.APP_CONFIG = {
  bootstrapApiUrl: 'http://localhost:8080/api/bootstrap',
  clientSideId: 'xxx',
  flagKey: 'widget-one',
  /** Each entry is bootstrapped with its own client. Circles show user.name (multi) or name/key (single user). */
  contexts: [
    {
      kind: 'multi',
      office: { key: 'hq', location: 'HQ' },
      user: { key: 'randy-key', name: 'Randy', kind: 'user' },
    },
    {
      key: 'george-key',
      name: 'George',
      kind: 'user',
    },
  ],
  application: {
    id: 'js-with-bootstrap',
    version: '1',
  },
};
