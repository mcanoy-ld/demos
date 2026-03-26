/**
 * LaunchDarkly release-pipeline demo: each user in context.json × each environment in
 * env.json = one box. Uses launchdarkly-js-client-sdk + @launchdarkly/observability
 * (OpenTelemetry metrics/traces → LaunchDarkly). Observability attaches to the first client only.
 */
import { initialize } from 'https://unpkg.com/launchdarkly-js-client-sdk@3.9.0/dist/ldclient.es.js';
import Observability from 'https://unpkg.com/@launchdarkly/observability@1.0.3/dist/index.js';

const FLAG_KEY = 'feature-lead-widget';
const POLL_MS = 4000;

const APP_ID = 'release-assistant-pipeline-demo';
const APP_VERSION = '1.0.0';

const baseClientOptions = {
  application: { id: APP_ID, version: APP_VERSION },
};

/** @type {Array<{ close: () => void }>} */
let activeClients = [];
let pollTimer = null;
let lastBundle = '';
let ldClientSerial = 0;

const elError = () => document.getElementById('pipeline-demo-error');
const elBoxes = () => document.getElementById('pipeline-demo-boxes');

const PROD_ENV_KEY = 'production';
const SPAM_INTERVAL_MS = 100;
const ACCESS_GROUPS = ['dev', 'qa', 'beta', 'general'];

const spamClientOptions = {
  application: { id: APP_ID + '-prod-spam', version: APP_VERSION },
};

const spamBetaClientOptions = {
  application: { id: APP_ID + '-prod-spam-beta', version: APP_VERSION },
};

/** Dedicated client for production identify spam (separate from grid clients) */
let spammerClient = null;
/** @type {ReturnType<typeof setInterval> | null} */
let spammerInterval = null;
let spammerRequestCount = 0;
let spammerStarting = false;

/** Beta-only production spam (access_group always beta) — separate client + counter */
let spammerBetaClient = null;
/** @type {ReturnType<typeof setInterval> | null} */
let spammerBetaInterval = null;
let spammerBetaRequestCount = 0;
let spammerBetaStarting = false;

const elSpamCount = () => document.getElementById('prod-spam-count');
const elSpamBtn = () => document.getElementById('prod-spam-toggle');
const elSpamBetaCount = () => document.getElementById('prod-spam-beta-count');
const elSpamBetaBtn = () => document.getElementById('prod-spam-beta-toggle');

let prodSpamClickDelegated = false;

const CLIENT_IDS_STORAGE_KEY = 'release-assistant-pipeline-demo-clientids';

/** Effective env.json after merging file + localStorage clientId overrides (used by LD + panel). */
let lastEffectiveEnvJson = null;

let clientIdsPanelWired = false;
/** @type {HTMLElement | null} */
let clientIdEditingRow = null;

/**
 * @param {unknown} raw
 * @returns {unknown}
 */
function mergeEnvJsonWithOverrides(raw) {
  const merged = JSON.parse(JSON.stringify(raw));
  let overrides = {};
  try {
    overrides = JSON.parse(
      localStorage.getItem(CLIENT_IDS_STORAGE_KEY) || '{}'
    );
  } catch (e) {
    overrides = {};
  }
  const list = merged && merged.environments;
  if (!Array.isArray(list)) return merged;
  let i;
  for (i = 0; i < list.length; i++) {
    const row = list[i];
    if (
      row &&
      row.env &&
      typeof overrides[row.env] === 'string' &&
      overrides[row.env].length > 0
    ) {
      row.clientId = overrides[row.env];
    }
  }
  return merged;
}

function loadEnvJsonMerged() {
  return loadJSON('env.json').then(mergeEnvJsonWithOverrides);
}

/**
 * @param {string} id
 */
function formatClientIdMasked(id) {
  if (!id || typeof id !== 'string') return '—';
  const tail = id.length <= 4 ? id : id.slice(-4);
  return '...' + tail;
}

/**
 * @param {string} envKey
 */
function getEffectiveClientId(envKey) {
  if (!lastEffectiveEnvJson || !lastEffectiveEnvJson.environments) return '';
  const list = lastEffectiveEnvJson.environments;
  let i;
  for (i = 0; i < list.length; i++) {
    const row = list[i];
    if (row && row.env === envKey && typeof row.clientId === 'string') {
      return row.clientId;
    }
  }
  return '';
}

/**
 * @param {string} envKey
 * @param {string} newId
 */
function saveClientIdOverride(envKey, newId) {
  let raw = {};
  try {
    raw = JSON.parse(localStorage.getItem(CLIENT_IDS_STORAGE_KEY) || '{}');
  } catch (e) {
    raw = {};
  }
  const trimmed = newId.trim();
  if (trimmed === '') {
    delete raw[envKey];
  } else {
    raw[envKey] = trimmed;
  }
  localStorage.setItem(CLIENT_IDS_STORAGE_KEY, JSON.stringify(raw));
}

/**
 * @param {HTMLElement} li
 * @param {boolean} editing
 */
function setClientIdRowEditing(li, editing) {
  const idGroup = li.querySelector('.pipeline-demo-clientids__id-group');
  const masked = li.querySelector('[data-clientid-masked]');
  const input = li.querySelector('.pipeline-demo-clientids__input');
  const editBtn = li.querySelector('[data-clientid-action="edit"]');
  const saveBtn = li.querySelector('[data-clientid-action="save"]');
  const cancelBtn = li.querySelector('[data-clientid-action="cancel"]');
  const envKey = li.dataset.clientidEnv;
  if (!input || !editBtn || !saveBtn || !cancelBtn || !envKey) return;

  if (editing) {
    input.value = getEffectiveClientId(envKey);
    if (idGroup) idGroup.style.display = 'none';
    input.style.display = '';
    editBtn.style.display = 'none';
    saveBtn.style.display = '';
    cancelBtn.style.display = '';
    input.focus();
  } else {
    const cid = getEffectiveClientId(envKey);
    if (masked) masked.textContent = formatClientIdMasked(cid);
    if (idGroup) idGroup.style.display = '';
    input.style.display = 'none';
    editBtn.style.display = '';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
  }
}

/**
 * @param {boolean} open
 */
function setClientIdOverlayOpen(open) {
  if (!open && clientIdEditingRow) {
    setClientIdRowEditing(clientIdEditingRow, false);
    clientIdEditingRow = null;
  }

  const overlay = document.getElementById('pipeline-demo-clientids-overlay');
  const openBtn = document.getElementById('pipeline-demo-clientids-open');
  if (!overlay) return;

  overlay.hidden = !open;
  overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (openBtn) {
    openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    window.requestAnimationFrame(function () {
      const hide = overlay.querySelector('[data-clientid-overlay-hide]');
      if (hide) hide.focus();
    });
  } else if (openBtn) {
    openBtn.focus();
  }
}

/**
 * @param {unknown} envJson
 */
function renderClientIdPanel(envJson) {
  const root = document.getElementById('pipeline-demo-clientids');
  if (!root) return;

  let wasOpen = false;
  const prevOverlay = document.getElementById('pipeline-demo-clientids-overlay');
  if (prevOverlay && !prevOverlay.hidden) wasOpen = true;

  root.innerHTML = '';

  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.id = 'pipeline-demo-clientids-open';
  openBtn.className = 'pipeline-demo-clientids__launch';
  openBtn.dataset.clientidOpenOverlay = 'true';
  openBtn.setAttribute('aria-expanded', 'false');
  openBtn.setAttribute('aria-haspopup', 'dialog');
  openBtn.setAttribute(
    'aria-label',
    'Open client-side ID editor for all environments'
  );
  openBtn.textContent = 'Client-side IDs';

  const overlay = document.createElement('div');
  overlay.id = 'pipeline-demo-clientids-overlay';
  overlay.className = 'pipeline-demo-clientids__overlay';
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');

  const backdrop = document.createElement('div');
  backdrop.className = 'pipeline-demo-clientids__backdrop';
  backdrop.dataset.clientidOverlayBackdrop = 'true';
  backdrop.setAttribute('aria-hidden', 'true');

  const dialog = document.createElement('div');
  dialog.className = 'pipeline-demo-clientids__dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute(
    'aria-labelledby',
    'pipeline-demo-clientids-dialog-title'
  );

  const headRow = document.createElement('div');
  headRow.className = 'pipeline-demo-clientids__head';

  const title = document.createElement('h3');
  title.id = 'pipeline-demo-clientids-dialog-title';
  title.className = 'pipeline-demo-clientids__title';
  title.textContent = 'Client-side IDs (browser)';

  const hideBtn = document.createElement('button');
  hideBtn.type = 'button';
  hideBtn.className =
    'pipeline-demo-clientids__btn pipeline-demo-clientids__btn--hide';
  hideBtn.dataset.clientidOverlayHide = 'true';
  hideBtn.setAttribute(
    'aria-label',
    'Close client-side ID editor and hide from view'
  );
  hideBtn.textContent = 'Hide';

  headRow.appendChild(title);
  headRow.appendChild(hideBtn);

  const listEl = document.createElement('ul');
  listEl.className = 'pipeline-demo-clientids__list';
  listEl.id = 'pipeline-demo-clientids-list';

  const list = envJson && envJson.environments;
  if (!Array.isArray(list)) {
    dialog.appendChild(headRow);
    dialog.appendChild(listEl);
    overlay.appendChild(backdrop);
    overlay.appendChild(dialog);
    root.appendChild(openBtn);
    root.appendChild(overlay);
    if (wasOpen) setClientIdOverlayOpen(true);
    return;
  }

  let i;
  for (i = 0; i < list.length; i++) {
    const row = list[i];
    if (!row || !row.env) continue;
    const targetLabel = row.attributes && row.attributes.label;
    const label = targetLabel ? String(targetLabel) : row.env;
    const id = typeof row.clientId === 'string' ? row.clientId : '';

    const li = document.createElement('li');
    li.className = 'pipeline-demo-clientids__row';
    li.dataset.clientidEnv = row.env;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'pipeline-demo-clientids__label';
    labelSpan.textContent = label;

    const idGroup = document.createElement('span');
    idGroup.className = 'pipeline-demo-clientids__id-group';

    const maskedSpan = document.createElement('span');
    maskedSpan.className = 'pipeline-demo-clientids__masked';
    maskedSpan.dataset.clientidMasked = 'masked';
    maskedSpan.textContent = formatClientIdMasked(id);

    idGroup.appendChild(maskedSpan);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'pipeline-demo-clientids__input';
    input.spellcheck = false;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Client-side ID for ' + label);
    input.style.display = 'none';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'pipeline-demo-clientids__btn';
    editBtn.dataset.clientidAction = 'edit';
    editBtn.textContent = 'Edit';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'pipeline-demo-clientids__btn';
    saveBtn.dataset.clientidAction = 'save';
    saveBtn.textContent = 'Save';
    saveBtn.style.display = 'none';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'pipeline-demo-clientids__btn';
    cancelBtn.dataset.clientidAction = 'cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.display = 'none';

    li.appendChild(labelSpan);
    li.appendChild(idGroup);
    li.appendChild(input);
    li.appendChild(editBtn);
    li.appendChild(saveBtn);
    li.appendChild(cancelBtn);

    listEl.appendChild(li);
  }

  dialog.appendChild(headRow);
  dialog.appendChild(listEl);
  overlay.appendChild(backdrop);
  overlay.appendChild(dialog);
  root.appendChild(openBtn);
  root.appendChild(overlay);

  if (wasOpen) setClientIdOverlayOpen(true);
}

function wireClientIdPanel() {
  if (clientIdsPanelWired) return;
  clientIdsPanelWired = true;

  const panel = document.getElementById('pipeline-demo-clientids');
  if (!panel) return;

  panel.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-clientid-open-overlay]')) {
      setClientIdOverlayOpen(true);
      return;
    }
    if (
      ev.target.closest('[data-clientid-overlay-hide]') ||
      ev.target.closest('[data-clientid-overlay-backdrop]')
    ) {
      setClientIdOverlayOpen(false);
      return;
    }

    const btn = ev.target.closest('[data-clientid-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-clientid-action');
    const li = btn.closest('[data-clientid-env]');
    if (!li) return;
    const envKey = li.dataset.clientidEnv;
    if (!envKey) return;

    if (action === 'edit') {
      if (clientIdEditingRow && clientIdEditingRow !== li) {
        setClientIdRowEditing(clientIdEditingRow, false);
      }
      clientIdEditingRow = li;
      setClientIdRowEditing(li, true);
    } else if (action === 'cancel') {
      setClientIdRowEditing(li, false);
      if (clientIdEditingRow === li) clientIdEditingRow = null;
    } else if (action === 'save') {
      const input = li.querySelector('.pipeline-demo-clientids__input');
      const newId = input ? input.value : '';
      saveClientIdOverride(envKey, newId);
      clientIdEditingRow = null;
      Promise.all([loadJSON('env.json'), loadJSON('context.json')])
        .then(function (pair) {
          const merged = mergeEnvJsonWithOverrides(pair[0]);
          initFromData(merged, pair[1]);
        })
        .catch(function (err) {
          console.error(err);
          showError(err.message || 'Could not reload after saving client ID.');
        });
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    const overlay = document.getElementById('pipeline-demo-clientids-overlay');
    if (!overlay || overlay.hidden) return;
    ev.preventDefault();
    setClientIdOverlayOpen(false);
  });
}

/**
 * @param {unknown} envJson
 * @returns {{ env: string, clientId: string, attributes?: Record<string, unknown> } | null}
 */
function findProductionEnvironment(envJson) {
  const list = envJson && envJson.environments;
  if (!Array.isArray(list)) return null;
  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    if (row && row.env === PROD_ENV_KEY && typeof row.clientId === 'string') {
      return row;
    }
  }
  return null;
}

function randomSpamId() {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 12) +
    '-' +
    performance.now().toString(36).replace(/\./g, '')
  );
}

/** Unique random user context targeting production (env attribute + access_group). */
function randomProductionContext() {
  const id = randomSpamId();
  const access_group =
    ACCESS_GROUPS[Math.floor(Math.random() * ACCESS_GROUPS.length)];
  return {
    kind: 'user',
    key: 'spam-' + id,
    name: 'Random ' + id.slice(-10),
    env: PROD_ENV_KEY,
    access_group: access_group,
  };
}

/** Same as random production traffic, but access_group is always beta. */
function randomProductionContextBetaOnly() {
  const id = randomSpamId();
  return {
    kind: 'user',
    key: 'spam-beta-' + id,
    name: 'Beta ' + id.slice(-10),
    env: PROD_ENV_KEY,
    access_group: 'beta',
  };
}

function updateSpamCounter() {
  const el = elSpamCount();
  if (el) el.textContent = String(spammerRequestCount);
}

function updateSpamButton() {
  const btn = elSpamBtn();
  if (!btn) return;
  const on = spammerInterval != null;
  btn.classList.toggle('is-active', on);
  btn.textContent = on
    ? 'Stop sending to production'
    : 'Start random contexts → production (10/sec)';
}

function stopSpammer() {
  if (spammerInterval != null) {
    clearInterval(spammerInterval);
    spammerInterval = null;
  }
  setSpamBtnDisabled(false);
  updateSpamButton();
}

function teardownSpamClient() {
  stopSpammer();
  if (spammerClient) {
    try {
      spammerClient.close();
    } catch (e) {
      console.warn('LD spammer client close:', e);
    }
    spammerClient = null;
  }
}

function spammerEvaluateFlag() {
  const client = spammerClient;
  if (!client) return;
  try {
    if (typeof client.variationDetail === 'function') {
      client.variationDetail(FLAG_KEY, false);
    }
  } catch (e) {
    console.warn('variationDetail (' + FLAG_KEY + '):', e);
  }
}

function startSpamInterval() {
  if (spammerInterval != null) return;
  spammerInterval = window.setInterval(function () {
    if (!spammerClient) return;
    const ctx = randomProductionContext();
    spammerRequestCount += 1;
    updateSpamCounter();
    try {
      if (typeof spammerClient.identify === 'function') {
        const p = spammerClient.identify(ctx);
        if (p && typeof p.then === 'function') {
          p.then(function () {
            if (!spammerClient) return;
            spammerEvaluateFlag();
          }).catch(function (e) {
            console.warn('identify:', e);
          });
        } else {
          spammerEvaluateFlag();
        }
      }
    } catch (e) {
      console.warn('identify:', e);
    }
  }, SPAM_INTERVAL_MS);
  updateSpamButton();
}

function setSpamBtnDisabled(disabled) {
  const btn = elSpamBtn();
  if (btn) btn.disabled = disabled;
}

function startSpammer() {
  if (spammerInterval != null) return;
  if (spammerClient) {
    startSpamInterval();
    return;
  }
  if (spammerStarting) return;
  spammerStarting = true;
  setSpamBtnDisabled(true);
  loadEnvJsonMerged()
    .then(function (envJson) {
      const prod = findProductionEnvironment(envJson);
      if (!prod) {
        showError(
          'No environment with env "' + PROD_ENV_KEY + '" in env.json (required for spam).'
        );
        spammerStarting = false;
        setSpamBtnDisabled(false);
        return;
      }
      const first = randomProductionContext();
      spammerClient = initialize(prod.clientId, first, spamClientOptions);
      spammerClient.on('failed', function () {
        showError('Production spam client failed to initialize. Check clientId for production.');
        spammerStarting = false;
        setSpamBtnDisabled(false);
        teardownSpamClient();
        updateSpamButton();
      });
      spammerClient.on('ready', function () {
        spammerStarting = false;
        setSpamBtnDisabled(false);
        startSpamInterval();
      });
    })
    .catch(function (err) {
      console.error(err);
      spammerStarting = false;
      setSpamBtnDisabled(false);
      showError(err.message || 'Could not load env.json for production spam.');
    });
}

function updateSpamBetaCounter() {
  const el = elSpamBetaCount();
  if (el) el.textContent = String(spammerBetaRequestCount);
}

function updateSpamBetaButton() {
  const btn = elSpamBetaBtn();
  if (!btn) return;
  const on = spammerBetaInterval != null;
  btn.classList.toggle('is-active', on);
  btn.textContent = on
    ? 'Stop beta-only → production'
    : 'Start beta-only contexts → production (10/sec)';
}

function stopSpammerBeta() {
  if (spammerBetaInterval != null) {
    clearInterval(spammerBetaInterval);
    spammerBetaInterval = null;
  }
  setSpamBetaBtnDisabled(false);
  updateSpamBetaButton();
}

function teardownSpamBetaClient() {
  stopSpammerBeta();
  if (spammerBetaClient) {
    try {
      spammerBetaClient.close();
    } catch (e) {
      console.warn('LD beta spammer client close:', e);
    }
    spammerBetaClient = null;
  }
}

function spammerBetaEvaluateFlag() {
  const client = spammerBetaClient;
  if (!client) return;
  try {
    if (typeof client.variationDetail === 'function') {
      client.variationDetail(FLAG_KEY, false);
    }
  } catch (e) {
    console.warn('variationDetail (' + FLAG_KEY + '):', e);
  }
}

function startSpamBetaInterval() {
  if (spammerBetaInterval != null) return;
  spammerBetaInterval = window.setInterval(function () {
    if (!spammerBetaClient) return;
    const ctx = randomProductionContextBetaOnly();
    spammerBetaRequestCount += 1;
    updateSpamBetaCounter();
    try {
      if (typeof spammerBetaClient.identify === 'function') {
        const p = spammerBetaClient.identify(ctx);
        if (p && typeof p.then === 'function') {
          p.then(function () {
            if (!spammerBetaClient) return;
            spammerBetaEvaluateFlag();
          }).catch(function (e) {
            console.warn('identify:', e);
          });
        } else {
          spammerBetaEvaluateFlag();
        }
      }
    } catch (e) {
      console.warn('identify:', e);
    }
  }, SPAM_INTERVAL_MS);
  updateSpamBetaButton();
}

function setSpamBetaBtnDisabled(disabled) {
  const btn = elSpamBetaBtn();
  if (btn) btn.disabled = disabled;
}

function startSpammerBeta() {
  if (spammerBetaInterval != null) return;
  if (spammerBetaClient) {
    startSpamBetaInterval();
    return;
  }
  if (spammerBetaStarting) return;
  spammerBetaStarting = true;
  setSpamBetaBtnDisabled(true);
  loadEnvJsonMerged()
    .then(function (envJson) {
      const prod = findProductionEnvironment(envJson);
      if (!prod) {
        showError(
          'No environment with env "' + PROD_ENV_KEY + '" in env.json (required for beta spam).'
        );
        spammerBetaStarting = false;
        setSpamBetaBtnDisabled(false);
        return;
      }
      const first = randomProductionContextBetaOnly();
      spammerBetaClient = initialize(prod.clientId, first, spamBetaClientOptions);
      spammerBetaClient.on('failed', function () {
        showError(
          'Production beta spam client failed to initialize. Check clientId for production.'
        );
        spammerBetaStarting = false;
        setSpamBetaBtnDisabled(false);
        teardownSpamBetaClient();
        updateSpamBetaButton();
      });
      spammerBetaClient.on('ready', function () {
        spammerBetaStarting = false;
        setSpamBetaBtnDisabled(false);
        startSpamBetaInterval();
      });
    })
    .catch(function (err) {
      console.error(err);
      spammerBetaStarting = false;
      setSpamBetaBtnDisabled(false);
      showError(err.message || 'Could not load env.json for production beta spam.');
    });
}

function wireProdSpamControls() {
  window.__pipelineToggleSpam = function () {
    if (spammerInterval != null) {
      stopSpammer();
    } else {
      startSpammer();
    }
  };

  window.__pipelineToggleSpamBeta = function () {
    if (spammerBetaInterval != null) {
      stopSpammerBeta();
    } else {
      startSpammerBeta();
    }
  };

  if (!prodSpamClickDelegated) {
    prodSpamClickDelegated = true;
    document.addEventListener('click', function (ev) {
      const node = ev.target;
      if (!node) return;
      const el =
        node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      if (!el || typeof el.closest !== 'function') return;
      if (el.closest('#prod-spam-toggle')) {
        window.__pipelineToggleSpam();
        return;
      }
      if (el.closest('#prod-spam-beta-toggle')) {
        window.__pipelineToggleSpamBeta();
      }
    });
  }

  updateSpamButton();
  updateSpamBetaButton();
}

function showError(msg) {
  const n = elError();
  if (!n) return;
  n.textContent = msg;
  n.classList.add('is-visible');
}

function clearError() {
  const n = elError();
  if (!n) return;
  n.textContent = '';
  n.classList.remove('is-visible');
}

function loadJSON(url) {
  return fetch(url, { cache: 'no-store' }).then(function (r) {
    if (!r.ok) {
      throw new Error('Failed to load ' + url + ' (' + r.status + ')');
    }
    return r.json();
  });
}

/**
 * @param {{ key: string, name: string, access_group: string }} user
 * @param {string} envKey LaunchDarkly environment column (matches env.json `env`)
 */
function buildLDContext(user, envKey) {
  return {
    kind: 'user',
    key: user.key,
    name: user.name,
    env: envKey,
    access_group: user.access_group,
  };
}

/** Safe class suffix for user-row border/background tint */
function accessGroupSlug(g) {
  return String(g == null ? '' : g)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

/**
 * Observability plugin options for LaunchDarkly (OTLP → otel.observability.app.launchdarkly.com).
 * See https://launchdarkly.com/docs/sdk/observability/javascript
 *
 * @param {unknown} envJson
 */
function buildObservabilityOptions(envJson) {
  const o = (envJson && envJson.observability) || {};
  if (o.enabled === false) {
    return null;
  }
  const otlpEndpoint =
    typeof o.otlpEndpoint === 'string' && o.otlpEndpoint
      ? o.otlpEndpoint
      : 'https://otel.observability.app.launchdarkly.com';
  const environment =
    typeof o.environment === 'string' && o.environment ? o.environment : 'development';
  return {
    environment: environment,
    enablePerformanceRecording: o.enablePerformanceRecording !== false,
    otel: {
      otlpEndpoint: otlpEndpoint,
    },
  };
}

/**
 * @param {unknown} envJson
 * @param {number} serial
 */
function getClientOptions(envJson, serial) {
  const opts = Object.assign({}, baseClientOptions);
  if (serial === 0) {
    const obsOpts = buildObservabilityOptions(envJson);
    if (obsOpts) {
      opts.plugins = [new Observability(obsOpts)];
    }
  }
  return opts;
}

function teardownClients() {
  activeClients.forEach(function (c) {
    try {
      c.close();
    } catch (e) {
      console.warn('LD client close:', e);
    }
  });
  activeClients = [];
  ldClientSerial = 0;
}

/**
 * @param {HTMLElement} boxEl
 * @param {*} client
 * @param {{ key: string, name: string, access_group: string }} user
 * @param {{ env: string, clientId: string, attributes?: Record<string, unknown> }} envRow
 */
function renderBox(boxEl, client, user, envRow) {
  const detail = client.variationDetail(FLAG_KEY, false);
  const on = !!detail.value;

  boxEl.classList.toggle('box--on', on);
  boxEl.classList.toggle('box--off', !on);

  const badge = boxEl.querySelector('[data-status-badge]');
  if (badge) {
    badge.textContent = on ? 'ON' : 'OFF';
    badge.className = 'status-badge ' + (on ? 'status-badge--on' : 'status-badge--off');
  }

  const targetLabel = envRow.attributes && envRow.attributes.label;
  const title = boxEl.querySelector('[data-env-title]');
  if (title) {
    title.textContent = targetLabel ? String(targetLabel) : envRow.env;
  }

  const ctxPre = boxEl.querySelector('[data-ld-context]');
  if (ctxPre) {
    ctxPre.textContent = JSON.stringify(buildLDContext(user, envRow.env), null, 2);
  }

  const varPre = boxEl.querySelector('[data-variation-detail]');
  if (varPre) {
    varPre.textContent = JSON.stringify(detail, null, 2);
  }
}

/**
 * @param {{ key: string, name: string, access_group: string }} user
 * @param {{ env: string, clientId: string, attributes?: Record<string, unknown> }} envRow
 * @param {number} index
 */
function createBoxElement(user, envRow, index) {
  const box = document.createElement('article');
  box.className = 'env-box box--off';
  box.setAttribute('tabindex', '0');
  box.setAttribute(
    'title',
    'Hover or focus this card to see user context and variation detail'
  );
  box.dataset.index = String(index);
  box.dataset.userKey = user.key;
  box.dataset.envKey = envRow.env;
  box.innerHTML =
    '<div class="env-box__top">' +
    '<div class="env-box__titles">' +
    '<h2 data-env-title></h2>' +
    '<span data-access-chip class="access-chip"></span>' +
    '</div>' +
    '<span data-status-badge class="status-badge status-badge--off">OFF</span>' +
    '</div>' +
    '<div class="env-box__hover-detail">' +
    '<div class="env-box__section">' +
    '<h3>User context → LaunchDarkly</h3>' +
    '<pre data-ld-context></pre>' +
    '</div>' +
    '<div class="env-box__section">' +
    '<h3>Variation detail (' +
    FLAG_KEY +
    ')</h3>' +
    '<pre data-variation-detail></pre>' +
    '</div>' +
    '</div>';

  return box;
}

/**
 * @param {unknown} envJson
 * @returns {Array<{ env: string, clientId: string, attributes?: Record<string, unknown> }>}
 */
function getOrderedEnvironments(envJson) {
  const list = envJson && envJson.environments;
  if (!Array.isArray(list)) {
    throw new Error('env.json must contain an "environments" array');
  }
  const rows = [];
  list.forEach(function (row) {
    if (!row || typeof row.env !== 'string' || typeof row.clientId !== 'string') {
      throw new Error('Each env entry needs "env" and "clientId"');
    }
    rows.push(row);
  });
  rows.sort(function (a, b) {
    const ao = a.attributes && typeof a.attributes.order === 'number' ? a.attributes.order : null;
    const bo = b.attributes && typeof b.attributes.order === 'number' ? b.attributes.order : null;
    if (ao !== null && bo !== null) return ao - bo;
    return 0;
  });
  return rows;
}

/**
 * @param {unknown} contextJson
 */
function getContexts(contextJson) {
  const list = contextJson && contextJson.contexts;
  if (!Array.isArray(list)) {
    throw new Error('context.json must contain a "contexts" array');
  }
  return list;
}

/**
 * @param {unknown} envJson
 * @param {unknown} contextJson
 */
function initFromData(envJson, contextJson) {
  if (typeof initialize !== 'function') {
    showError('LaunchDarkly SDK not loaded.');
    return;
  }

  teardownClients();
  const root = elBoxes();
  if (!root) return;
  root.innerHTML = '';

  let envList;
  try {
    envList = getOrderedEnvironments(envJson);
  } catch (e) {
    showError(e.message || String(e));
    return;
  }

  if (envList.length === 0) {
    showError('env.json has no environments.');
    return;
  }

  let contexts;
  try {
    contexts = getContexts(contextJson);
  } catch (e) {
    showError(e.message || String(e));
    return;
  }

  let i;
  for (i = 0; i < contexts.length; i++) {
    const c = contexts[i];
    if (
      !c ||
      typeof c.key !== 'string' ||
      typeof c.name !== 'string' ||
      typeof c.access_group !== 'string'
    ) {
      showError(
        'Invalid context at index ' +
          i +
          ': require key, name, access_group (env is not used per user).'
      );
      return;
    }
  }

  clearError();

  lastEffectiveEnvJson = envJson;

  let boxIndex = 0;
  for (i = 0; i < contexts.length; i++) {
    (function (user) {
      const section = document.createElement('section');
      section.className =
        'user-row user-row--access-' + accessGroupSlug(user.access_group);
      section.dataset.userKey = user.key;
      section.dataset.accessGroup = user.access_group;

      const head = document.createElement('div');
      head.className = 'user-row__head';

      const heading = document.createElement('h2');
      heading.className = 'user-row__title';
      heading.textContent = user.name;

      const accessPill = document.createElement('span');
      const agSlug = accessGroupSlug(user.access_group);
      accessPill.className =
        'user-row__access-chip user-row__access-chip--' + agSlug;
      accessPill.textContent = user.access_group;

      head.appendChild(heading);
      head.appendChild(accessPill);

      const grid = document.createElement('div');
      grid.className = 'user-row__boxes boxes-grid';

      section.appendChild(head);
      section.appendChild(grid);
      root.appendChild(section);

      let j;
      for (j = 0; j < envList.length; j++) {
        (function (envRow) {
          const box = createBoxElement(user, envRow, boxIndex++);
          grid.appendChild(box);

          const ldContext = buildLDContext(user, envRow.env);
          const serial = ldClientSerial++;
          const opts = getClientOptions(envJson, serial);
          const client = initialize(envRow.clientId, ldContext, opts);
          activeClients.push(client);

          client.on('failed', function () {
            showError(
              'LaunchDarkly failed for env "' +
                envRow.env +
                '" / user "' +
                user.key +
                '". Check clientId in env.json.'
            );
          });

          client.on('ready', function () {
            renderBox(box, client, user, envRow);
          });

          client.on('change', function () {
            renderBox(box, client, user, envRow);
          });
        })(envList[j]);
      }
    })(contexts[i]);
  }

  renderClientIdPanel(envJson);
}

function bundleSignature(envJson, contextJson) {
  return JSON.stringify(envJson) + '\n' + JSON.stringify(contextJson);
}

function run() {
  Promise.all([loadJSON('env.json'), loadJSON('context.json')])
    .then(function (pair) {
      const envJsonRaw = pair[0];
      const contextJson = pair[1];
      const sig = bundleSignature(envJsonRaw, contextJson);
      lastBundle = sig;
      initFromData(mergeEnvJsonWithOverrides(envJsonRaw), contextJson);
    })
    .catch(function (err) {
      console.error(err);
      showError(
        err.message ||
          'Could not load env.json or context.json. Serve this folder over HTTP (e.g. npx serve .) and copy env.json.example to env.json.'
      );
    });
}

function poll() {
  Promise.all([loadJSON('env.json'), loadJSON('context.json')])
    .then(function (pair) {
      const sig = bundleSignature(pair[0], pair[1]);
      if (sig !== lastBundle) {
        lastBundle = sig;
        initFromData(mergeEnvJsonWithOverrides(pair[0]), pair[1]);
      }
    })
    .catch(function () {
      /* keep last good state */
    });
}

function boot() {
  wireClientIdPanel();
  wireProdSpamControls();
  run();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

pollTimer = window.setInterval(poll, POLL_MS);
window.addEventListener('beforeunload', function () {
  if (pollTimer) window.clearInterval(pollTimer);
  teardownSpamClient();
  teardownSpamBetaClient();
  teardownClients();
});
