const express = require('express');
const { init, LDContext } = require('@launchdarkly/node-server-sdk');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(express.static('public'));

let ldClient = null;
let currentUpdateMode = 'streaming'; // 'streaming' or 'polling'
let isInitialized = false;

// Helper function to determine update mode from ldClient object
function getUpdateModeFromClient(client) {
  if (!client) {
    return null;
  }
  
  // Check the _updateProcessor property to determine the mode
  const updateProcessor = client._updateProcessor;
  if (!updateProcessor) {
    return null;
  }
  
  // Check if it's a polling processor by looking for pollInterval or polling-related properties
  // In SDK v9, we can check the processor type
  const processorType = updateProcessor.constructor?.name || '';
  
  if (processorType.toLowerCase().includes('poll')) {
    return 'polling';
  } else if (processorType.toLowerCase().includes('stream')) {
    return 'streaming';
  }
  
  // Fallback: check for pollInterval property
  if (updateProcessor._pollInterval !== undefined || updateProcessor.pollInterval !== undefined) {
    return 'polling';
  }
  
  // Default to streaming if we can't determine
  return 'streaming';
}

// Initialize LaunchDarkly client
function initializeLDClient(updateMode) {
  return new Promise((resolve, reject) => {
    const sdkKey = process.env.LAUNCHDARKLY_SDK_KEY;
    
    if (!sdkKey || sdkKey === 'your-sdk-key-here') {
      reject(new Error('Please set LAUNCHDARKLY_SDK_KEY in .env file'));
      return;
    }

    // Close existing client if any
    if (ldClient) {
      ldClient.close();
    }

    // Configure LaunchDarkly with the specified update mode
    // In SDK v9, pass options object to init - streaming is default
    let options = {};
    
    if (updateMode === 'polling') {
      // For polling mode, disable streaming (which enables polling)
      options = {
        stream: false,
        pollInterval: 5 // Poll every 5 seconds
      };
    }
    // For streaming mode, use default (no options needed, or explicitly set stream: true)

    ldClient = init(sdkKey, options);

    ldClient.once('ready', () => {
      isInitialized = true;
      currentUpdateMode = updateMode;
      
      // Detect the actual mode from the client object
      const detectedMode = getUpdateModeFromClient(ldClient);
      const processorType = ldClient._updateProcessor?.constructor?.name || 'unknown';
      
      console.log(`LaunchDarkly client initialized in ${updateMode} mode`);
      console.log(`  - Configured mode: ${updateMode}`);
      console.log(`  - Detected mode from client: ${detectedMode || 'unknown'}`);
      console.log(`  - Processor type: ${processorType}`);
      
      resolve(ldClient);
    });

    ldClient.on('error', (error) => {
      console.error('LaunchDarkly client error:', error);
      reject(error);
    });
  });
}

// Initialize on startup
initializeLDClient('streaming').catch(err => {
    console.log(process.env.LAUNCHDARKLY_SDK_KEY)
;  console.error('Failed to initialize LaunchDarkly:', err.message);
});

// API endpoint to get current status
app.get('/api/status', (req, res) => {
  // Try to get the mode from the client object itself
  const detectedMode = getUpdateModeFromClient(ldClient);
  const actualMode = detectedMode || currentUpdateMode;
  
  res.json({
    updateMode: actualMode,
    detectedMode: detectedMode, // Mode detected from client object
    configuredMode: currentUpdateMode, // Mode we configured
    isInitialized: isInitialized,
    isConnected: ldClient && ldClient.isOffline() === false,
    processorInfo: ldClient?._updateProcessor ? {
      type: ldClient._updateProcessor.constructor?.name,
      hasPollInterval: ldClient._updateProcessor._pollInterval !== undefined || ldClient._updateProcessor.pollInterval !== undefined
    } : null
  });
});

// API endpoint to toggle between streaming and polling
app.post('/api/toggle', async (req, res) => {
  try {
    const newMode = currentUpdateMode === 'streaming' ? 'polling' : 'streaming';
    
    console.log(`Switching from ${currentUpdateMode} to ${newMode}...`);
    
    await initializeLDClient(newMode);
    
    res.json({
      success: true,
      updateMode: newMode,
      message: `Successfully switched to ${newMode} mode`
    });
  } catch (error) {
    console.error('Error toggling update mode:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API endpoint to get a flag value (for testing)
app.get('/api/flag/:flagKey', async (req, res) => {
  if (!ldClient || !isInitialized) {
    return res.status(503).json({
      error: 'LaunchDarkly client not initialized'
    });
  }

  try {
    const flagKey = req.params.flagKey;
    const context = LDContext.builder('example-user-key')
      .kind('user')
      .name('Example User')
      .build();

    const flagValue = await ldClient.variation(flagKey, context, false);
    
    res.json({
      flagKey: flagKey,
      flagValue: flagValue,
      updateMode: currentUpdateMode
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  if (ldClient) {
    ldClient.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`LaunchDarkly SDK Key: ${process.env.LAUNCHDARKLY_SDK_KEY}`);
});

