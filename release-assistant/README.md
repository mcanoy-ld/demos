# Release Assistant (pipelines)

Browser demo and helper scripts for LaunchDarkly **release pipelines**: a user × environment matrix for the flag `feature-lead-widget`, optional **OpenTelemetry** export to LaunchDarkly Observability, production traffic generators, and CLI tools for segments, flags, and release cancellation.

## Run the pipeline demo

From this directory:

```bash
npm start
```

Then open [http://localhost:3000/](http://localhost:3000/). The demo is served at the **site root** (`index.html`).

You can use any static server instead (for example `python3 -m http.server 3000`); `fetch` needs HTTP—opening files as `file://` will not load `env.json` / `context.json`.

### Configure

1. Copy examples and add your LaunchDarkly **client-side** IDs and project data:

   ```bash
   cp env.json.example env.json
   ```

2. Edit `env.json`: set `environments[]` with `env`, `clientId` (client-side ID per environment), optional `attributes.label` and `attributes.order` for card ordering and labels.

3. Edit `context.json`: set `contexts[]` with `key`, `name`, and `access_group` for each simulated user row.

4. Optional **observability** block in `env.json` (see `env.json.example`): when enabled, the first LD client loads `@launchdarkly/observability` and sends OTLP to LaunchDarkly (account must have Observability).

### Demo behavior

- **Matrix**: one card per user × environment; evaluates `feature-lead-widget` and shows ON/OFF with hover details.
- **Client-side IDs**: use **Client-side IDs** to open an overlay. Masked values show as `…` plus the last four characters; **Edit** saves overrides in **localStorage** (browser-only, not `env.json` on disk). **Hide** closes the overlay.
- **Production spam** (optional): buttons send random contexts to the `production` environment at 10/sec (one stream randomizes `access_group`; one stream is beta-only). Each path evaluates the same flag after `identify`.

---

## Shell scripts

All scripts assume a POSIX-capable environment; bash-only scripts re-exec with `bash` when needed. Where noted, install **curl** and **jq**.

| Script | Purpose |
|--------|---------|
| [segment-creator.sh](./segment-creator.sh) | Copy a user segment from a reference environment into target environments via the LaunchDarkly API. Defaults from [segment-creator.env.example](./segment-creator.env.example) or `segment-creator.env`. |
| [clear-flag-targeting.sh](./clear-flag-targeting.sh) | Per `--flag-key`, clear targeting rules and targets for that flag in **all** project environments; set fallthrough to the “off” variation (default index `1`). Uses `segment-creator.env` for API credentials. |
| [cancel-release-pipeline.sh](./cancel-release-pipeline.sh) | Cancel the active release for a flag using the Releases Beta API (`…/release`, then `PUT …/release/phases/{id}` with `{"status":"canceled"}`). See [cancel-release-pipeline.env.example](./cancel-release-pipeline.env.example). |

Typical API variables: `API_KEY` / `LAUNCHDARKLY_API_KEY` / `LD_API_KEY`, `PROJECT_KEY`, optional `API_BASE` (for example EU: `https://app.eu.launchdarkly.com/api/v2`).

---

## Files

| File | Role |
|------|------|
| `index.html` | Demo entry (served at `/`). |
| `pipeline-demo.js`, `pipeline-demo.css` | UI and LaunchDarkly client logic (ES module + CDN SDKs). |
| `env.json`, `context.json` | Runtime config (copy from `*.example` as needed). |
| `package.json` | `npm start` → static server on port 3000. |

---

## Requirements

- **Demo**: modern browser; static HTTP server; LaunchDarkly client-side IDs and flag `feature-lead-widget` in your project if you want real evaluations.
- **Scripts**: API token with appropriate permissions; see each script’s header comment for flags and env vars.
