/**
 * Demo evaluation contexts — loaded before config.js / app.js.
 * Exposed as window.DEMO_CONTEXTS; config.js may assign APP_CONFIG.contexts from this,
 * and app.js falls back to window.DEMO_CONTEXTS if APP_CONFIG.contexts is empty.
 */
window.DEMO_CONTEXTS = [
  {
    kind: 'multi',
    office: {
      key: 'sf',
      location: 'San Francisco',
    },
    user: {
      kind: 'user',
      key: 'user-randy-cane-key',
      name: 'Rando',
      email: 'rando@launchdarkly.com',
      address: '123 Ocean Ave, San Francisco, CA',
      tier: 'Gen Pop',
      phone_number: '+1-555-0100',
    },
  },
  {
    kind: 'multi',
    office: {
      key: 'burbank',
      location: 'Burbank',
    },
    user: {
      kind: 'user',
      key: 'user-ian-key',
      address: '200 N San Fernando Blvd, Burbank, CA',
      email: 'ian@example.com',
      name: 'Ian',
      tier: 'VIP',
      phone_number: '+1-555-0103',
    },
  },
  {
    kind: 'multi',
    office: {
      key: 'burbank',
      location: 'Burbank',
    },
    user: {
      kind: 'user',
      key: 'user-george-key',
      address: '200 N San Fernando Blvd, Burbank, CA',
      email: 'george@example.com',
      name: 'George',
      tier: 'Beta',
      phone_number: '+1-555-0105',
    },
  },
  {
    kind: 'multi',
    office: {
      key: 'newyork',
      location: 'New York',
    },
    user: {
      kind: 'user',
      key: 'user-evelyn-key',
      address: '789 Hill Rd, New York, NY',
      email: 'Evelyn@example.com',
      name: 'Evelyn',
      tier: 'VIP',
      phone_number: '+1-555-0104',
    },
  },
  {
    kind: 'multi',
    office: {
      key: 'sf',
      location: 'San Francisco',
    },
    user: {
      kind: 'user',
      key: 'user-roisin-key',
      address: '125 Ocean Ave, San Francisco, CA',
      email: 'its-pronounced-rosheen@example.com',
      name: 'Roisin',
      tier: 'Beta',
      phone_number: '+1-555-0101',
    },
  },
];
