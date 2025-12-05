const express = require('express');
const { init } = require('@launchdarkly/node-server-sdk');
const { RedisFeatureStore } = require('@launchdarkly/node-server-sdk-redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SDK_KEY = process.env.LAUNCHDARKLY_SDK_KEY || '';
const REDIS_URL = process.env.REDIS_URL || '';
const REDIS_PORT = process.env.REDIS_PORT || '';
const FLAG_KEY = process.env.LAUNCHDARKLY_FLAG_KEY || 'nada';
// Parse OFFLINE environment variable (accepts 'true', '1', 'yes', etc.)
const OFFLINE = process.env.OFFLINE === 'true' || process.env.OFFLINE === '1' || process.env.OFFLINE === 'yes';

// Initialize LaunchDarkly client
let ldClient = null;
if (SDK_KEY) {
  console.log('Initializing LaunchDarkly client...');
  
  // Configure LaunchDarkly options
  const options = {};
  
  // Add fake URLs for streaming and polling endpoints ONLY when offline mode is enabled
  if (OFFLINE) {
    options.baseUri = 'https://fake-polling-endpoint.example.com';
    options.streamUri = 'https://fake-streaming-endpoint.example.com';
    console.log(`Configured fake polling endpoint: ${options.baseUri}`);
    console.log(`Configured fake streaming endpoint: ${options.streamUri}`);
  } else {
    // When not offline, use default LaunchDarkly endpoints (don't set baseUri/streamUri)
    console.log('✓ Using LaunchDarkly default endpoints (streaming and polling)');
  }
  
  // Add Redis persistent store if Redis URL is provided
  if (REDIS_URL) {
    console.log(`Configuring Redis persistent store: ${REDIS_URL}`);
    const redisStore = RedisFeatureStore({
      redisOpts: { url: REDIS_URL, port: REDIS_PORT },
      prefix: 'ld', // Optional: key prefix for LaunchDarkly data in Redis
      cacheTTL: 0 // Optional: cache TTL in seconds
    });
    options.featureStore = redisStore;
    console.log('✓ Redis persistent store configured');
  } else {
    console.warn('Warning: REDIS_URL not set. LaunchDarkly will use in-memory store only.');
  }
  
  ldClient = init(SDK_KEY, options);
} else {
  console.warn('Warning: LAUNCHDARKLY_SDK_KEY not set. LaunchDarkly features will be disabled.');
}

// Serve HTML at root endpoint
app.get('/', async (req, res) => {
  let showAboutSection = true; // Default to showing the section
  
  // Get name from URL parameter, default to "Anybody" if not provided
  const userName = req.query.name || 'NadAI';
  
  // Create context for flag evaluation with dynamic name
  const context = {
    kind: 'user',
    key: 'nadai-website-user',
    name: userName
  };

  const detail = await ldClient.variationDetail(FLAG_KEY, context, true);
  showAboutSection = detail.value;
  console.log(`Flag '${FLAG_KEY}' evaluation:`);
  console.log(`  Context name: ${context.name}`);
  console.log(`  Value: ${detail.value}`);
  console.log(`  Reason: ${JSON.stringify(detail.reason, null, 2)}`);

  
  res.send(getHomePageHTML(showAboutSection));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize LaunchDarkly and start server
async function startServer() {
  if (ldClient) {
    try {
      console.log('Waiting for LaunchDarkly client to initialize...');
      await ldClient.waitForInitialization({ timeout: 10 });
      console.log('✓ LaunchDarkly client initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize LaunchDarkly client:', error.message);
      console.log('Continuing without LaunchDarkly...');
    }
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Flag '${FLAG_KEY}' controls the About section visibility`);
    if (REDIS_URL) {
      console.log(`Redis persistent store: ${REDIS_URL}`);
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nShutting down...');
  if (ldClient) {
    await ldClient.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  if (ldClient) {
    await ldClient.close();
  }
  process.exit(0);
});

startServer();

function getHomePageHTML(showAboutSection = true) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NadAI - Intelligent Solutions for Tomorrow</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #FF8C00 0%, #CC5500 100%);
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 1rem 0;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.8rem;
      font-weight: bold;
      background: linear-gradient(135deg, #FF8C00 0%, #CC5500 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-links {
      display: flex;
      list-style: none;
      gap: 2rem;
    }

    .nav-links a {
      text-decoration: none;
      color: #333;
      font-weight: 500;
      transition: color 0.3s;
    }

    .nav-links a:hover {
      color: #CC5500;
    }

    .hero {
      text-align: center;
      padding: 6rem 0;
      color: white;
    }

    .hero h1 {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      animation: fadeInUp 0.8s ease-out;
    }

    .hero p {
      font-size: 1.3rem;
      margin-bottom: 2rem;
      opacity: 0.95;
      animation: fadeInUp 1s ease-out;
    }

    .cta-button {
      display: inline-block;
      padding: 1rem 2.5rem;
      background: white;
      color: #CC5500;
      text-decoration: none;
      border-radius: 50px;
      font-weight: bold;
      font-size: 1.1rem;
      transition: transform 0.3s, box-shadow 0.3s;
      animation: fadeInUp 1.2s ease-out;
    }

    .cta-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }

    .features {
      background: white;
      padding: 5rem 0;
    }

    .features h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 3rem;
      color: #333;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }

    .feature-card {
      background: #f8f9fa;
      padding: 2rem;
      border-radius: 10px;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #CC5500;
    }

    .feature-card p {
      color: #666;
      line-height: 1.8;
    }

    .about {
      background: linear-gradient(135deg, #FF8C00 0%, #CC5500 100%);
      color: white;
      padding: 5rem 0;
      text-align: center;
    }

    .about h2 {
      font-size: 2.5rem;
      margin-bottom: 2rem;
    }

    .about p {
      font-size: 1.2rem;
      max-width: 800px;
      margin: 0 auto;
      opacity: 0.95;
      line-height: 1.8;
    }

    footer {
      background: #1a1a1a;
      color: white;
      padding: 2rem 0;
      text-align: center;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2.5rem;
      }

      .hero p {
        font-size: 1.1rem;
      }

      .nav-links {
        gap: 1rem;
        font-size: 0.9rem;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <nav class="container">
      <div class="logo">NadAI</div>
      <ul class="nav-links">
        <li><a href="#features">Features</a></li>
        ${showAboutSection ? '<li><a href="#about">About</a></li>' : ''}
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <section class="hero">
    <div class="container">
      <h1>Intelligent Solutions for Later</h1>
      <p>Harnessing the power of artificial sweetener to transform high caloric drinks and drive thirst quenching solutions</p>
      <a href="#contact" class="cta-button">Get Started</a>
    </div>
  </section>

  <section class="features" id="features">
    <div class="container">
      <h2>Why Choose NadAI?</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🤖</div>
          <h3>Advanced AI Models</h3>
          <p>State-of-the-art machine learning algorithms powered by cutting-edge research and development.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Lightning Fast</h3>
          <p>Optimized performance with real-time processing capabilities for instant insights and decisions.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h3>Secure & Private</h3>
          <p>Enterprise-grade security with end-to-end encryption to protect your sensitive data.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3>Data Analytics</h3>
          <p>Comprehensive analytics dashboard to track performance and make data-driven decisions.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🌐</div>
          <h3>Scalable Infrastructure</h3>
          <p>Cloud-native architecture that scales seamlessly with your business needs.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>Custom Solutions</h3>
          <p>Tailored AI solutions designed specifically for your unique business requirements.</p>
        </div>
      </div>
    </div>
  </section>

  ${showAboutSection ? `
  <section class="about" id="about">
    <div class="container">
      <h2>About NadAI</h2>
      <p>
        NadAI is a leading artificial intelligence company dedicated to helping businesses unlock 
        the full potential of AI technology. Our team of expert data scientists and engineers work 
        tirelessly to develop innovative solutions that drive growth, efficiency, and competitive advantage.
      </p>
      <p style="margin-top: 1.5rem;">
        With a proven track record of successful implementations across various industries, we're 
        committed to delivering exceptional value and transforming the way businesses operate in 
        the digital age.
      </p>
    </div>
  </section>
  ` : ''}

  <footer id="contact">
    <div class="container">
      <p>&copy; 2024 NadAI. All rights reserved.</p>
      <p style="margin-top: 0.5rem; opacity: 0.8;">Contact: info@nadai.com | +1 (555) 123-4567</p>
    </div>
  </footer>
</body>
</html>`;
}

