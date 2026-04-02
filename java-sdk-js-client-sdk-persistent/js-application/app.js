(function () {
  function showConfigSetupRequired(configScriptFailed) {
    const wrapper = document.querySelector('.wrapper');
    if (!wrapper) return;
    const reason =
      configScriptFailed === true
        ? '<p><strong>config.js</strong> could not be loaded (file missing or not served from this folder).</p>'
        : '<p><strong>config.js</strong> loaded but <code>window.APP_CONFIG</code> was not set. Check the file for errors.</p>';
    wrapper.innerHTML =
      '<div class="config-setup-required">' +
      '<h1>Configuration required</h1>' +
      reason +
      '<p>Create <code>config.js</code> next to <code>index.html</code>. Copy <code>config.example.js</code> to <code>config.js</code> and adjust the values for your environment.</p>' +
      '<p class="config-setup-hint">Then reload this page.</p>' +
      '</div>';
  }

  const cfg = window.APP_CONFIG;
  const configScriptFailed = window.__configJsLoadFailed === true;
  if (!cfg) {
    console.error(
      configScriptFailed
        ? 'config.js failed to load — copy config.example.js to config.js'
        : 'APP_CONFIG missing — ensure config.js defines window.APP_CONFIG (see config.example.js)'
    );
    showConfigSetupRequired(configScriptFailed);
    return;
  }

  const { bootstrapApiUrl, clientSideId, flagKey, context, application } = cfg;
  let apiBootstrapData = null;
  let apiBootstrapClient = null;

  const flagSectionTitle = document.getElementById('flagSectionTitle');
  const flagKeyLabel = document.getElementById('flagKeyLabel');
  if (flagSectionTitle) flagSectionTitle.textContent = flagKey;
  if (flagKeyLabel) flagKeyLabel.textContent = flagKey + ':';

  const evaluationContextEl = document.getElementById('evaluationContextJson');
  if (evaluationContextEl) {
    evaluationContextEl.textContent = JSON.stringify(context, null, 2);
  }

  const bootstrapJsonEl = document.getElementById('bootstrapJson');
  if (bootstrapJsonEl) {
    bootstrapJsonEl.textContent = 'Loading bootstrap from ' + bootstrapApiUrl + '...';
  }

  async function bootstrapAPI() {
    try {
      const response = await fetch(bootstrapApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        const hint = await response.text();
        throw new Error(
          'HTTP ' + response.status + ' ' + response.statusText + (hint ? '\n' + hint.slice(0, 500) : '')
        );
      }

      apiBootstrapData = await response.json();
      console.log(apiBootstrapData);

      if (bootstrapJsonEl) {
        bootstrapJsonEl.textContent = JSON.stringify(apiBootstrapData, null, 2);
      }
    } catch (err) {
      apiBootstrapData = {};
      const message =
        err && err.message ? err.message : String(err);
      console.error('Bootstrap fetch failed:', err);
      if (bootstrapJsonEl) {
        bootstrapJsonEl.textContent =
          'Could not load bootstrap from ' +
          bootstrapApiUrl +
          '.\n\n' +
          (message.indexOf('Failed to fetch') !== -1 || message === 'Load failed'
            ? 'Network error: the server may be down, the URL may be wrong, or the browser blocked the request (e.g. CORS).'
            : message);
      }
    }
  }

  function updateWidget() {
    if (!apiBootstrapClient) return;

    const flagValue = apiBootstrapClient.variation(flagKey, false);
    const widgetCircle = document.getElementById('widgetCircle');
    const widgetValue = document.getElementById('widgetValue');

    if (flagValue === true) {
      widgetCircle.className = 'widget-circle on';
      widgetCircle.textContent = 'ON';
      widgetValue.textContent = 'true';
    } else {
      widgetCircle.className = 'widget-circle off';
      widgetCircle.textContent = 'OFF';
      widgetValue.textContent = 'false';
    }
  }

  (async () => {
    await bootstrapAPI();

    // initialize the SDK with the bootstrap data and app metadata (LaunchDarkly Applications / analytics)
    apiBootstrapClient = LDClient.initialize(clientSideId, context, {
      bootstrap: apiBootstrapData,
      application: application || { id: 'js-with-bootstrap', version: 'v1.0.0' },
      privateAttributes: ['email', 'name'],
    });

    apiBootstrapClient.on('ready', () => {
      console.log('API Bootstrapped SDK ready');
      updateWidget();
    });

    apiBootstrapClient.on('change', () => {
      console.log('API Bootstrapped SDK updated');
      updateWidget();
    });

    apiBootstrapClient.on('change:' + flagKey, () => {
      console.log('Flag changed:', flagKey);
      updateWidget();
    });
  })();
})();
