# LaunchDarkly sample TypeScript Node.js (server-side) application

We've built a simple console application that demonstrates how LaunchDarkly's SDK works.

Below, you'll find the build procedure. For more comprehensive instructions, you can visit your Quickstart page or the [Node.js (server-side) reference guide](https://docs.launchdarkly.com/sdk/server-side/node-js).

The LaunchDarkly server-side SDK for Node.js is designed primarily for use in multi-user systems such as web servers and applications. It follows the server-side LaunchDarkly model for multi-user contexts. It is not intended for use in desktop and embedded systems applications.

For a sample application demonstrating how to use LaunchDarkly in _client-side_ Node.js applications, refer to our Client-side Node.js SDK sample application.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A LaunchDarkly account and SDK key

## Build instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your LaunchDarkly SDK key:
   
   Option A: Set as environment variable:
   ```bash
   export LAUNCHDARKLY_SDK_KEY="your-sdk-key-here"
   ```
   
   Option B: Create a `.env` file (not included in git):
   ```
   LAUNCHDARKLY_SDK_KEY=your-sdk-key-here
   LAUNCHDARKLY_FLAG_KEY=my-flag
   PORT=3005
   ```

3. (Optional) Set the feature flag key you want to evaluate:
   ```bash
   export LAUNCHDARKLY_FLAG_KEY="my-flag"
   ```
   
   Or edit `index.ts` and change the `featureFlagKey` constant:
   ```typescript
   const featureFlagKey = 'my-flag';
   ```

4. (Optional) Set the server port (defaults to 3005):
   ```bash
   export PORT=3005
   ```
   
   Or add to your `.env` file:
   ```
   PORT=3005
   ```

5. Build the TypeScript code:
   ```bash
   npm run build
   ```

6. Run the application:
   ```bash
   npm start
   ```

   Or run directly with ts-node (no build step required):
   ```bash
   npm run dev
   ```

## What this app does

1. Initializes a LaunchDarkly client with your SDK key
2. Waits for the client to be ready
3. Creates a context (representing a user or entity)
4. Evaluates a feature flag for that context
5. Prints the flag value to the console
6. Starts an Express API server with the following endpoints:
   - `GET /api/flag` - Returns the current flag value
   - `GET /health` - Health check endpoint

## API Endpoints

### GET /api/flag
Returns the current value of a feature flag. The flag key can be specified via a query parameter or will default to `LAUNCHDARKLY_FLAG_KEY` environment variable.

**Query Parameters:**
- `key` (optional): The feature flag key to evaluate. If not provided, uses the value from `LAUNCHDARKLY_FLAG_KEY` environment variable.

**Examples:**
```bash
# Using query parameter
GET /api/flag?key=my-feature-flag

# Using default from environment variable
GET /api/flag
```

**Response:**
```json
{
  "flagKey": "my-feature-flag",
  "flagValue": true,
  "sport": "hockey",
  "context": {
    "key": "example-user-key",
    "kind": "user",
    "name": "Sandy"
  }
}
```

**Note:** The `sport` field is automatically set based on the flag value:
- If `flagValue` is `true`, `sport` is set to `"hockey"`
- If `flagValue` is `false`, `sport` is set to `"baseball"`

### GET /health
Returns the health status of the application and SDK.

**Response:**
```json
{
  "status": "ok",
  "sdkInitialized": true,
  "flagKey": "sample-feature"
}
```

## Troubleshooting

- **"SDK key is not set"**: Make sure you've set the `LAUNCHDARKLY_SDK_KEY` environment variable or updated the code
- **"Client initialization timeout"**: Check your internet connection and verify your SDK key is correct
- **Flag returns default value**: Make sure the flag key exists in your LaunchDarkly project and is enabled

## Learn more

- [LaunchDarkly Documentation](https://docs.launchdarkly.com)
- [Node.js Server-side SDK Reference](https://docs.launchdarkly.com/sdk/server-side/node-js)
- [TypeScript Support](https://docs.launchdarkly.com/sdk/server-side/node-js#typescript-support)

