# Node.js AI Company Home Page

A simple Node.js application to show the ability of FDNv2 to persist to redis in order fallback during an LaunchDarkly outage. The application will continue to serve from cache at all times. When an outage occurs the application will be able to start and fill cache from a redis database. When the LD outage recovers, updates will be consumed from LaunchDarkly. In your `.env` file you can choose between online and offline mode and set your flag key and sdk key.


## Simple Testing

- Deploy the app in online mode (OFFLINE=false). This will populate the db.
- Observe the flag result is display as expected (The about section and link can be present or not)
- Deploy the app in offline mode (OFFLINE=true). This will initialize the ldclient from the db. You should see messages in the log
- Observe the flag result is the same.
- Change the flag on LD. 
- Observe the flag result is the same.
- Deploy the app in online mode.
- Observe the flag result has changed.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure LaunchDarkly and Redis:
   - Copy `.env.example` to `.env`
   - Add your LaunchDarkly SDK key to `.env`:
   ```
   LAUNCHDARKLY_SDK_KEY=your-sdk-key-here
   ```
   - (Optional) Set the feature flag key (defaults to `nada`):
   ```
   LAUNCHDARKLY_FLAG_KEY=your-flag-key
   ```
   - (Optional) Configure Redis for persistent feature store:
   ```
   REDIS_URL=redis://localhost:6379
   ```
   - (Optional) Set offline mode to use fake endpoints (for testing without LaunchDarkly):
   ```
   OFFLINE=true
   ```
   - If Redis is not configured, LaunchDarkly will use an in-memory store (data lost on restart)
   - If `OFFLINE=true`, fake endpoints will be used instead of LaunchDarkly's default endpoints

3. Start Redis (if using persistent store):
   ```bash
   # Using Docker/Podman
   docker run -d --name redis -p 6379:6379 redis:latest
   # or
   podman run -d --name redis -p 6379:6379 redis:latest
   
   # Or use a local Redis installation
   redis-server
   ```

4. Create a flag in LaunchDarkly:
   - Flag key: `nada` (or set `LAUNCHDARKLY_FLAG_KEY` in `.env` to use a different key)
   - Type: Boolean
   - Default: `true` (shows the About section)
   - When set to `false`, the About section and navigation link will be hidden

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000` by default.

You can change the port by setting the `PORT` environment variable:
```bash
PORT=8080 npm start
```

## Endpoints

- `GET /` - Serves the AI company home page HTML (About section visibility controlled by `nada` flag)
  - Query parameter: `?name=xxx` - Sets the LaunchDarkly context name (defaults to "NadAI" if not provided)
  - Example: `http://localhost:3000/?name=John` - Evaluates flag with context name "John"
- `GET /health` - Health check endpoint (returns JSON status)

## LaunchDarkly Integration

The application uses LaunchDarkly to control the visibility of the "About NadAI" section:
- **Flag Key**: Configurable via `LAUNCHDARKLY_FLAG_KEY` environment variable (defaults to `nada`)
- **Flag Type**: Boolean
- **Default Value**: `true` (shows the About section)
- **When `false`**: Both the About section and the "About" navigation link are hidden from the page

The flag is evaluated on each page load using `variationDetail`, which provides detailed evaluation reasons. The evaluation details (value and reason) are logged to the console for debugging purposes.

### Dynamic Context

You can customize the LaunchDarkly context by passing a `name` query parameter:
- `http://localhost:3000/?name=John` - Evaluates the flag with context name "John"
- `http://localhost:3000/` - Uses default context name "NadAI"

This allows you to test different user targeting rules in LaunchDarkly by changing the context name.

### Redis Persistent Store

The application supports Redis as a persistent feature store for LaunchDarkly:
- **Benefits**: 
  - Feature flags persist across server restarts
  - Faster startup times (loads from Redis cache)
  - Resilience when LaunchDarkly service is temporarily unavailable
- **Configuration**: Set `REDIS_URL` in your `.env` file
- **Cache TTL**: 0 (no expiration - cache persists indefinitely)
- **Key Prefix**: `ld` (all LaunchDarkly keys in Redis are prefixed with `ld:`)

If Redis is not configured, the SDK will use an in-memory store, which means flag data will be lost on server restart.

## Features

- Modern, responsive design
- Gradient backgrounds (burnt orange theme)
- Smooth animations
- Mobile-friendly layout
- Professional AI company branding
- LaunchDarkly feature flag integration

