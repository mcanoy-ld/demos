# Release Pipelines Demo

This demo demonstrates how LaunchDarkly Release Pipelines work across multiple environments and user segments. This is a **client-side only** demo that runs entirely in the browser - no server or SDK key required.

## Overview

This example shows how a release pipeline can be run. It expects environments:
- Dev
- QA
- Int
- Production

In production it is expecting 3 types of users:
- QA (User context with attribute tier = `QA`)
- Beta (Context key prefixed `beta-`)
- Enterprise (Context key prefixed `enterprise-`)

This app will show 6 panels (checkboxes). When the feature flag `release-widget-ui` for that panel is enabled and available, its state will be on. Otherwise off.

## Setup

1. Update `utils.js` file with your LaunchDarkly client-side IDs:
   ```bash
   cp utils.js.example utils.js
   ```
   Then edit `utils.js` with your actual client-side IDs and flag key.

2. Open `index.html` in your web browser:
   - Simply double-click `index.html`, or
   - Use a local web server (optional, but recommended):
     ```bash
     # Using Python
     python3 -m http.server 8000
     
     # Using Node.js (if you have http-server installed)
     npx http-server -p 8000
     ```
   - Then navigate to `http://localhost:8000` in your browser

## Usage

Run your release pipeline in LaunchDarkly to show how the pipeline can change the flag value progressively across environments. The checkboxes will update in real-time as the flag values change.

Hover over each panel to see the context information used for that environment/user segment.

## Scripts

### Rollback Script

The `rollback-pipeline.sh` script allows you to quickly rollback a release pipeline by:
- Turning off the flag in all environments except dev
- Deleting all targeting rules in all environments except dev
- Keeping dev environment on with default rule set to true

### Usage

```bash
./rollback-pipeline.sh --flag-key <flag-key> --api-key <api-key> --project-key <project-key>
```

### Approval Script

The `approve-request.sh` script allows you to manage LaunchDarkly approval requests:
- List pending approval requests for a flag
- Approve approval requests
- Apply approved requests

#### Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your LaunchDarkly credentials:
   ```
   LAUNCHDARKLY_API_KEY=your-api-key-here
   LAUNCHDARKLY_PROJECT_KEY=your-project-key
   LAUNCHDARKLY_FLAG_KEY=release-widget-ui
   LAUNCHDARKLY_ENVIRONMENT=production
   ```

#### Usage

Once `.env` is configured, you can use shorter commands:

```bash
# List approval requests (uses values from .env)
./approve-request.sh --list

# Approve a request
./approve-request.sh --approve --id approval-123

# Apply an approved request
./approve-request.sh --apply --id approval-123
```

You can still override values from `.env` using command-line arguments:

```bash
# Override environment from .env
./approve-request.sh --env qa --list

# Override all values
./approve-request.sh --flag-key other-flag --api-key api-xxx --project-key other-project --env dev --list
```

### Options

- `--flag-key <key>`: The feature flag key to rollback (required)
- `--api-key <key>`: Your LaunchDarkly API access token (required)
- `--project-key <key>`: The LaunchDarkly project key (required)
- `--base-url <url>`: LaunchDarkly API base URL (default: https://app.launchdarkly.com/api/v2)
- `--dry-run`: Show what would be done without making changes
- `--help`: Show help message

### Example

```bash
./rollback-pipeline.sh \
  --flag-key release-widget-ui \
  --api-key sdk-xxxxxxxxxxxx \
  --project-key my-project
```

### Dry Run

To see what the script would do without making changes:

```bash
./rollback-pipeline.sh \
  --flag-key release-widget-ui \
  --api-key sdk-xxxxxxxxxxxx \
  --project-key my-project \
  --dry-run
```

## Files

- `index.html` - Main HTML file (open this in your browser)
- `index.css` - Stylesheet
- `rp.js` - LaunchDarkly client initialization logic
- `utils.js` - Client-side ID configuration (update with your IDs)
- `utils.js.example` - Example configuration file
- `rollback-pipeline.sh` - Script to rollback release pipelines

## Notes

- This demo uses the LaunchDarkly JavaScript Client SDK loaded from CDN
- No server-side code or SDK key is required
- All flag evaluations happen client-side using client-side IDs
- The demo works best when opened via a web server (to avoid CORS issues), but can work with `file://` protocol in some browsers
- The rollback script requires curl and jq (or similar JSON parsing tools) to be installed

