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

  const { bootstrapApiUrl, clientSideId, flagKey, application } = cfg;
  const contexts =
    Array.isArray(cfg.contexts) && cfg.contexts.length > 0
      ? cfg.contexts
      : cfg.context
        ? [cfg.context]
        : [];

  if (contexts.length === 0) {
    console.error('APP_CONFIG must define contexts (array) or a single legacy context object');
    showConfigSetupRequired(false);
    return;
  }

  /** User-facing label: multi-context uses user.name; single-kind uses name or key. */
  function displayName(ctx) {
    if (!ctx) return 'user';
    if (ctx.kind === 'multi' && ctx.user && typeof ctx.user.name === 'string' && ctx.user.name.length > 0) {
      return ctx.user.name;
    }
    if (typeof ctx.name === 'string' && ctx.name.length > 0) return ctx.name;
    if (ctx.kind === 'multi' && ctx.user && typeof ctx.user.key === 'string' && ctx.user.key.length > 0) {
      return ctx.user.key;
    }
    if (typeof ctx.key === 'string' && ctx.key.length > 0) return ctx.key;
    return 'user';
  }

  function contextKeyForLabel(ctx) {
    if (ctx && ctx.kind === 'multi' && ctx.user && ctx.user.key) return ctx.user.key;
    if (ctx && ctx.key) return ctx.key;
    return 'no-key';
  }

  const rows = [];

  const flagSectionTitle = document.getElementById('flagSectionTitle');
  if (flagSectionTitle) flagSectionTitle.textContent = flagKey;

  const contextsEvaluationList = document.getElementById('contextsEvaluationList');
  const bootstrapJsonEl = document.getElementById('bootstrapJson');
  const contextWidgetsHost = document.getElementById('contextWidgets');

  if (contextsEvaluationList) {
    contextsEvaluationList.textContent = '';
    contexts.forEach(function (ctx, i) {
      const item = document.createElement('div');
      item.className = 'context-evaluation-item';
      const title = document.createElement('div');
      title.className = 'context-evaluation-title';
      title.textContent = 'Context ' + (i + 1) + ' — ' + displayName(ctx);
      const pre = document.createElement('pre');
      pre.className = 'json-display evaluation-context-json';
      pre.textContent = JSON.stringify(ctx, null, 2);
      item.appendChild(title);
      item.appendChild(pre);
      contextsEvaluationList.appendChild(item);
    });
  }

  if (bootstrapJsonEl) {
    bootstrapJsonEl.textContent = 'Loading bootstrap from ' + bootstrapApiUrl + '...';
  }

  async function bootstrapOne(context) {
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

    return response.json();
  }

  async function bootstrapAll() {
    const results = await Promise.all(
      contexts.map(function (ctx) {
        return bootstrapOne(ctx).catch(function (err) {
          console.error('Bootstrap failed for context', ctx, err);
          return { __bootstrapError: true, message: err && err.message ? err.message : String(err) };
        });
      })
    );

    if (bootstrapJsonEl) {
      const combined = {};
      contexts.forEach(function (ctx, i) {
        const label = (i + 1) + '. ' + displayName(ctx) + ' (' + contextKeyForLabel(ctx) + ')';
        combined[label] = results[i];
      });
      bootstrapJsonEl.textContent = JSON.stringify(combined, null, 2);
    }

    return results;
  }

  function buildWidgets() {
    if (!contextWidgetsHost) return;
    contextWidgetsHost.textContent = '';
    rows.length = 0;

    contexts.forEach(function (ctx) {
      const wrap = document.createElement('div');
      wrap.className = 'context-widget';

      const circle = document.createElement('div');
      circle.className = 'widget-circle off';
      circle.setAttribute('aria-label', displayName(ctx) + ', ' + flagKey + ' is false');
      circle.textContent = displayName(ctx);

      wrap.appendChild(circle);
      contextWidgetsHost.appendChild(wrap);

      rows.push({
        context: ctx,
        bootstrap: {},
        client: null,
        circle: circle,
      });
    });
  }

  function updateRow(i) {
    const row = rows[i];
    if (!row || !row.client) return;

    const flagValue = row.client.variation(flagKey, false);
    if (row.circle) {
      row.circle.className = 'widget-circle ' + (flagValue === true ? 'on' : 'off');
      row.circle.setAttribute(
        'aria-label',
        displayName(contexts[i]) + ', ' + flagKey + ' is ' + String(flagValue)
      );
    }
  }

  buildWidgets();

  (async function () {
    const bootstrapResults = await bootstrapAll();

    for (let i = 0; i < rows.length; i++) {
      rows[i].bootstrap = bootstrapResults[i] || {};
    }

    const appMeta = application || { id: 'js-with-bootstrap', version: 'v1.0.0' };

    for (let i = 0; i < rows.length; i++) {
      const ctx = contexts[i];
      const data = rows[i].bootstrap;
      const payload = data && data.__bootstrapError ? {} : data;

      const client = LDClient.initialize(clientSideId, ctx, {
        bootstrap: payload,
        application: appMeta,
        privateAttributes: ['name'],
      });
      rows[i].client = client;

      (function (index) {
        client.on('ready', function () {
          console.log('API Bootstrapped SDK ready for', displayName(contexts[index]));
          updateRow(index);
        });

        client.on('change', function () {
          updateRow(index);
        });

        client.on('change:' + flagKey, function () {
          console.log('Flag changed:', flagKey, displayName(contexts[index]));
          updateRow(index);
        });
      })(i);
    }
  })().catch(function (err) {
    console.error(err);
    if (bootstrapJsonEl) {
      bootstrapJsonEl.textContent =
        'Bootstrap step failed.\n\n' + (err && err.message ? err.message : String(err));
    }
  });
})();
