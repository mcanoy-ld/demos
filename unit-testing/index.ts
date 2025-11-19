import { init } from '@launchdarkly/node-server-sdk';
import express, { Request, Response } from 'express';

// Load environment variables from .env file
require('dotenv').config();

// Set sdkKey to your LaunchDarkly SDK key.
const sdkKey = process.env.LAUNCHDARKLY_SDK_KEY ?? 'your-sdk-key';

// Set featureFlagKey to the feature flag key you want to evaluate.
const featureFlagKey = process.env.LAUNCHDARKLY_FLAG_KEY ?? 'sample-feature';

// Server configuration
// Port can be set via PORT environment variable or in .env file
const PORT = parseInt(process.env.PORT || '3005', 10);
const app = express();

function showBanner() {
  console.log(
    `        ██
          ██
      ████████
         ███████
██ LAUNCHDARKLY █
         ███████
      ████████
          ██
        ██
`,
  );
}

function printValueAndBanner(flagValue: boolean) {
  console.log(`*** The '${featureFlagKey}' feature flag evaluates to ${flagValue}.`);

  if (flagValue) showBanner();
}

if (sdkKey === 'your-sdk-key' || !sdkKey) {
  console.log('*** Please specify an SDK key by editing index.ts or setting the LAUNCHDARKLY_SDK_KEY environment variable.');
  process.exit(1);
}

const ldClient = init(sdkKey);

// Set up the context properties. This context should appear on your LaunchDarkly contexts dashboard
// soon after you run the demo.
const context = {
  kind: 'user',
  key: 'example-user-key',
  name: 'Sandy',
};

// API endpoint to get the flag value
// Accepts optional 'key' query parameter to specify which flag to evaluate
// Example: GET /api/flag?key=my-feature-flag
app.get('/api/flag', async (req: Request, res: Response) => {
  try {
    if (!ldClient || !ldClient.initialized()) {
      return res.status(503).json({
        error: 'LaunchDarkly client not initialized'
      });
    }

    // Get flag key from query parameter or use default from environment
    const flagKey = (req.query.key as string) || featureFlagKey;
    console.log('flagKey', flagKey);

    if (!flagKey) {
      return res.status(400).json({
        error: 'Flag key is required. Provide it via ?key=your-flag-key or set LAUNCHDARKLY_FLAG_KEY environment variable'
      });
    }

    const flagValue = await ldClient.variation(flagKey, context, false);
    
    // Set sport based on flag value: hockey if true, baseball if false
    const sport = flagValue ? 'hockey' : 'baseball';
    
    res.json({
      flagKey: flagKey,
      flagValue: flagValue,
      sport: sport,
      context: {
        key: context.key,
        kind: context.kind,
        name: context.name
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      flagKey: (req.query.key as string) || featureFlagKey || 'unknown'
    });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    sdkInitialized: ldClient?.initialized() || false,
    flagKey: featureFlagKey
  });
});

async function main() {
  try {
    await ldClient.waitForInitialization({timeout: 10});

    console.log('*** SDK successfully initialized!');

    const eventKey = `update:${featureFlagKey}`;
    ldClient.on(eventKey, async () => {
      const flagValue = await ldClient.variation(featureFlagKey, context, false);
      printValueAndBanner(flagValue);
    });

    const flagValue = await ldClient.variation(featureFlagKey, context, false);
    printValueAndBanner(flagValue);

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`\n*** API server running on http://localhost:${PORT}`);
      console.log(`*** Flag endpoint: http://localhost:${PORT}/api/flag?key=your-flag-key`);
      console.log(`*** Health check: http://localhost:${PORT}/health`);
    });

    if (typeof process.env.CI !== "undefined") {
      process.exit(0);
    }
  } catch (error) {
    console.log(`*** SDK failed to initialize: ${error}`);
    process.exit(1);
  }
}

main();