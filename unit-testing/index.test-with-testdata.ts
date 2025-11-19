import request from 'supertest';
import express, { Express } from 'express';
import { init } from '@launchdarkly/node-server-sdk';
import { TestData } from '@launchdarkly/node-server-sdk/integrations';

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('API Flag Endpoint with TestData', () => {
  let app: Express;
  let testData: any;
  let ldClient: any;

  beforeEach(async () => {
    // Set environment variables for testing
    process.env.LAUNCHDARKLY_SDK_KEY = 'test-sdk-key';
    process.env.LAUNCHDARKLY_FLAG_KEY = 'test-flag';
    process.env.PORT = '3005';

    // Create TestData instance
    testData = new TestData();

    // Initialize LaunchDarkly client with TestData
    // In SDK v9, use getFactory() to get the data source factory
    ldClient = init('test-sdk-key', {
      updateProcessor: testData.getFactory()
    });

    // Wait for client to be ready
    await ldClient.waitForInitialization({ timeout: 5 });

    // Create a test app with the same logic as index.ts
    app = express();

    const context = {
      kind: 'user',
      key: 'example-user-key',
      name: 'Sandy',
    };

    const featureFlagKey = process.env.LAUNCHDARKLY_FLAG_KEY || 'test-flag';

    // Set up the same routes as the main app
    app.get('/api/flag', async (req, res) => {
      try {
        if (!ldClient || !ldClient.initialized()) {
          return res.status(503).json({
            error: 'LaunchDarkly client not initialized'
          });
        }

        const flagKey = (req.query.key as string) || featureFlagKey;

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
  });

  afterEach(async () => {
    // Close the client
    if (ldClient) {
      await ldClient.close();
    }
    delete process.env.LAUNCHDARKLY_SDK_KEY;
    delete process.env.LAUNCHDARKLY_FLAG_KEY;
    delete process.env.PORT;
  });

  describe('GET /api/flag', () => {
    it('should return sport=hockey when flagValue is true', async () => {
      // Set flag value to true using TestData
      testData.update(
        testData.flag('test-flag')
          .booleanFlag()
          .variationForAll(true)
      );

      // Wait a moment for the update to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await request(app)
        .get('/api/flag')
        .expect(200);

      expect(response.body).toMatchObject({
        flagKey: 'test-flag',
        flagValue: true,
        sport: 'hockey',
        context: {
          key: 'example-user-key',
          kind: 'user',
          name: 'Sandy'
        }
      });
    });

    it('should return sport=baseball when flagValue is false', async () => {
      // Set flag value to false using TestData
      testData.update(
        testData.flag('test-flag')
          .booleanFlag()
          .variationForAll(false)
      );

      // Wait a moment for the update to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await request(app)
        .get('/api/flag')
        .expect(200);

      expect(response.body).toMatchObject({
        flagKey: 'test-flag',
        flagValue: false,
        sport: 'baseball',
        context: {
          key: 'example-user-key',
          kind: 'user',
          name: 'Sandy'
        }
      });
    });

    it('should use the key query parameter when provided', async () => {
      const customFlagKey = 'custom-flag-key';
      
      // Set flag value to true for the custom flag
      testData.update(
        testData.flag(customFlagKey)
          .booleanFlag()
          .variationForAll(true)
      );

      // Wait a moment for the update to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await request(app)
        .get(`/api/flag?key=${customFlagKey}`)
        .expect(200);

      expect(response.body.flagKey).toBe(customFlagKey);
      expect(response.body.flagValue).toBe(true);
      expect(response.body.sport).toBe('hockey');
    });

    it('should return default value when flag does not exist', async () => {
      // Don't set up the flag, so it will return the default value (false)
      const response = await request(app)
        .get('/api/flag?key=non-existent-flag')
        .expect(200);

      expect(response.body.flagKey).toBe('non-existent-flag');
      expect(response.body.flagValue).toBe(false); // Default value
      expect(response.body.sport).toBe('baseball'); // false -> baseball
    });

    it('should handle flag value changes dynamically', async () => {
      // Start with false
      testData.update(
        testData.flag('test-flag')
          .booleanFlag()
          .variationForAll(false)
      );
      await new Promise(resolve => setTimeout(resolve, 100));

      let response = await request(app)
        .get('/api/flag')
        .expect(200);
      
      expect(response.body.flagValue).toBe(false);
      expect(response.body.sport).toBe('baseball');

      // Change to true
      testData.update(
        testData.flag('test-flag')
          .booleanFlag()
          .variationForAll(true)
      );
      await new Promise(resolve => setTimeout(resolve, 100));

      response = await request(app)
        .get('/api/flag')
        .expect(200);
      
      expect(response.body.flagValue).toBe(true);
      expect(response.body.sport).toBe('hockey');
    });
  });
});

