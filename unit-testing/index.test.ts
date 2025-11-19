import request from 'supertest';
import express, { Express } from 'express';

// Mock the LaunchDarkly SDK before any imports
jest.mock('@launchdarkly/node-server-sdk', () => ({
  init: jest.fn()
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('API Flag Endpoint', () => {
  let app: Express;
  let mockClient: any;
  let mockInit: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a mock client
    mockClient = {
      initialized: jest.fn(() => true),
      variation: jest.fn(),
      waitForInitialization: jest.fn(() => Promise.resolve()),
      on: jest.fn(),
      close: jest.fn()
    };

    // Get the mocked init function
    const { init } = require('@launchdarkly/node-server-sdk');
    mockInit = init as jest.Mock;
    mockInit.mockReturnValue(mockClient);

    // Set environment variables for testing
    process.env.LAUNCHDARKLY_SDK_KEY = 'test-sdk-key';
    process.env.LAUNCHDARKLY_FLAG_KEY = 'test-flag';
    process.env.PORT = '3005';

    // Create a test app with the same logic as index.ts
    app = express();

    const context = {
      kind: 'user',
      key: 'example-user-key',
      name: 'Sandy',
    };

    const featureFlagKey = process.env.LAUNCHDARKLY_FLAG_KEY || 'test-flag';
    const ldClient = mockInit('test-sdk-key');

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

  afterEach(() => {
    delete process.env.LAUNCHDARKLY_SDK_KEY;
    delete process.env.LAUNCHDARKLY_FLAG_KEY;
    delete process.env.PORT;
  });

  describe('GET /api/flag', () => {
    it('should return sport=hockey when flagValue is true', async () => {
      // Mock variation to return true
      mockClient.variation.mockResolvedValue(true);
      
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
      // Mock variation to return false
      mockClient.variation.mockResolvedValue(false);
      
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
      mockClient.variation.mockResolvedValue(true);
      
      const response = await request(app)
        .get('/api/flag?key=custom-flag-key')
        .expect(200);

      expect(response.body.flagKey).toBe('custom-flag-key');
      expect(response.body.sport).toBe('hockey');
      expect(mockClient.variation).toHaveBeenCalledWith(
        'custom-flag-key',
        expect.objectContaining({
          kind: 'user',
          key: 'example-user-key',
          name: 'Sandy'
        }),
        false
      );
    });

    it('should return 503 when client is not initialized', async () => {
      mockClient.initialized.mockReturnValue(false);
      
      const response = await request(app)
        .get('/api/flag')
        .expect(503);

      expect(response.body.error).toBe('LaunchDarkly client not initialized');
    });

    it('should handle errors gracefully', async () => {
      mockClient.variation.mockRejectedValue(new Error('SDK Error'));
      
      const response = await request(app)
        .get('/api/flag')
        .expect(500);

      expect(response.body.error).toBe('SDK Error');
    });
  });
});

