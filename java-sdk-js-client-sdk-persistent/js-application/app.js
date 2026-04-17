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
      '<p>Create <code>config.js</code> next to <code>index.html</code>. Copy <code>config.example.js</code> to <code>config.js</code> and adjust the values for your environment. Ensure <code>demo_contexts.js</code> is present and loaded before <code>config.js</code> (see <code>index.html</code>).</p>' +
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

  const { bootstrapApiUrl, clientSideId, application } = cfg;
  const configFlagKey = typeof cfg.flagKey === 'string' && cfg.flagKey.trim() ? cfg.flagKey.trim() : 'widget-one';

  const FLAG_STORAGE_KEY = 'ld-bootstrap-demo-flag-key';
  function loadStoredFlagKey() {
    try {
      const stored = localStorage.getItem(FLAG_STORAGE_KEY);
      if (typeof stored === 'string' && stored.trim()) return stored.trim();
    } catch (e) {
      /* private mode or blocked storage */
    }
    return configFlagKey;
  }

  function persistFlagKey(key) {
    try {
      if (key === configFlagKey) localStorage.removeItem(FLAG_STORAGE_KEY);
      else localStorage.setItem(FLAG_STORAGE_KEY, key);
    } catch (e) {
      /* ignore */
    }
  }

  let currentFlagKey = loadStoredFlagKey();
  const demoContexts =
    typeof window !== 'undefined' &&
    Array.isArray(window.DEMO_CONTEXTS) &&
    window.DEMO_CONTEXTS.length > 0
      ? window.DEMO_CONTEXTS
      : [];

  const contexts =
    Array.isArray(cfg.contexts) && cfg.contexts.length > 0
      ? cfg.contexts
      : demoContexts.length > 0
        ? demoContexts
        : cfg.context
          ? [cfg.context]
          : [];

  if (contexts.length === 0) {
    console.error(
      'APP_CONFIG must define contexts (array), or load demo_contexts.js before config.js, or set a single legacy context object'
    );
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

  const flagKeyDisplay = document.getElementById('flagKeyDisplay');
  const flagKeyForm = document.getElementById('flagKeyForm');
  const flagKeyInput = document.getElementById('flagKeyInput');
  const flagKeyCancel = document.getElementById('flagKeyCancel');

  function syncFlagKeyDisplay() {
    if (flagKeyDisplay) {
      flagKeyDisplay.textContent = currentFlagKey;
      flagKeyDisplay.setAttribute('aria-label', 'Active flag key: ' + currentFlagKey + '. Click to change.');
    }
  }

  function openFlagKeyEditor() {
    if (!flagKeyForm || !flagKeyInput || !flagKeyDisplay) return;
    flagKeyDisplay.hidden = true;
    flagKeyDisplay.setAttribute('aria-expanded', 'true');
    flagKeyForm.hidden = false;
    flagKeyInput.value = currentFlagKey;
    flagKeyInput.focus();
    flagKeyInput.select();
  }

  function closeFlagKeyEditor() {
    if (!flagKeyForm || !flagKeyDisplay) return;
    flagKeyForm.hidden = true;
    flagKeyDisplay.hidden = false;
    flagKeyDisplay.setAttribute('aria-expanded', 'false');
    if (flagKeyInput && typeof flagKeyInput.blur === 'function') {
      flagKeyInput.blur();
    }
  }

  function applyFlagKeyFromInput() {
    if (!flagKeyInput) return;
    const next = String(flagKeyInput.value || '').trim();
    if (!next) {
      flagKeyInput.focus();
      return;
    }
    currentFlagKey = next;
    persistFlagKey(next);
    syncFlagKeyDisplay();
    closeFlagKeyEditor();
    for (let i = 0; i < rows.length; i++) {
      updateRow(i);
    }
  }

  syncFlagKeyDisplay();

  if (flagKeyDisplay) {
    flagKeyDisplay.addEventListener('click', function () {
      openFlagKeyEditor();
    });
  }
  if (flagKeyCancel) {
    flagKeyCancel.addEventListener('click', function () {
      closeFlagKeyEditor();
    });
  }
  if (flagKeyForm) {
    flagKeyForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      applyFlagKeyFromInput();
    });
  }
  if (flagKeyInput) {
    flagKeyInput.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        closeFlagKeyEditor();
      }
    });
  }

  const contextsEvaluationList = document.getElementById('contextsEvaluationList');
  const bootstrapResultsList = document.getElementById('bootstrapResultsList');
  const contextWidgetsHost = document.getElementById('contextWidgets');

  function bootstrapPanelTitle(ctx) {
    return 'Bootstrapping client for ' + displayName(ctx);
  }

  /** Map browser fetch errors to a stable demo copy. */
  function formatBootstrapUserMessage(raw) {
    const s = raw == null ? '' : String(raw);
    if (s === 'Failed to fetch' || s.indexOf('Failed to fetch') !== -1) {
      return 'Demo Bootstrap unavailable.';
    }
    return s;
  }

  function renderBootstrapLoading(host) {
    if (!host) return;
    host.textContent = '';
    contexts.forEach(function (ctx, i) {
      const item = document.createElement('div');
      item.className = 'context-evaluation-item';
      const title = document.createElement('div');
      title.className = 'context-evaluation-title';
      title.textContent = bootstrapPanelTitle(ctx);
      const pre = document.createElement('pre');
      pre.className = 'json-display evaluation-context-json';
      pre.textContent = 'Loading bootstrap from ' + bootstrapApiUrl + '...';
      item.appendChild(title);
      item.appendChild(pre);
      host.appendChild(item);
    });
  }

  function renderBootstrapResults(host, results) {
    if (!host) return;
    const items = host.querySelectorAll('.context-evaluation-item');
    for (let i = 0; i < results.length; i++) {
      const pre = items[i] && items[i].querySelector('pre');
      if (!pre) continue;
      const result = results[i];
      pre.classList.remove('bootstrap-json-error');
      if (result && result.__bootstrapError) {
        pre.classList.add('bootstrap-json-error');
        pre.textContent = formatBootstrapUserMessage(result.message || 'Bootstrap failed');
      } else {
        pre.textContent = JSON.stringify(result, null, 2);
      }
    }
  }

  function renderBootstrapFatalError(host, message) {
    if (!host) return;
    host.textContent = '';
    const item = document.createElement('div');
    item.className = 'context-evaluation-item';
    const title = document.createElement('div');
    title.className = 'context-evaluation-title';
    title.textContent = 'Bootstrap failed';
    const pre = document.createElement('pre');
    pre.className = 'json-display evaluation-context-json bootstrap-json-error';
    pre.textContent = formatBootstrapUserMessage(message);
    item.appendChild(title);
    item.appendChild(pre);
    host.appendChild(item);
  }

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

  renderBootstrapLoading(bootstrapResultsList);

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

    renderBootstrapResults(bootstrapResultsList, results);

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
      circle.setAttribute('aria-label', displayName(ctx) + ', ' + currentFlagKey + ' is false');
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

    const flagValue = row.client.variation(currentFlagKey, false);
    if (row.circle) {
      row.circle.className = 'widget-circle ' + (flagValue === true ? 'on' : 'off');
      row.circle.setAttribute(
        'aria-label',
        displayName(contexts[i]) + ', ' + currentFlagKey + ' is ' + String(flagValue)
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
      })(i);
    }
  })().catch(function (err) {
    console.error(err);
    renderBootstrapFatalError(
      bootstrapResultsList,
      'Bootstrap step failed.\n\n' + (err && err.message ? err.message : String(err))
    );
  });
})();
