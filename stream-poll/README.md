# LaunchDarkly Streaming vs Polling Demo

A Node.js application that demonstrates how to dynamically switch a LaunchDarkly client between streaming and polling update modes.

## Features

- **Dynamic Mode Switching**: Toggle between streaming and polling modes at runtime
- **Real-time Status Display**: See the current update mode and client status
- **Web Interface**: Simple, modern UI to control the LaunchDarkly client
- **Environment Configuration**: SDK key managed via `.env` file

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- LaunchDarkly SDK key

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure SDK key**:
   - Copy `.env` file (if it doesn't exist, create it)
   - Add your LaunchDarkly SDK key:
     ```
     LAUNCHDARKLY_SDK_KEY=your-actual-sdk-key-here
     ```

3. **Run the application**:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:3000`

## Usage

1. **View Current Status**: The page displays the current update mode (streaming or polling) and client initialization status.

2. **Toggle Mode**: Click the "Switch to Polling Mode" or "Switch to Streaming Mode" button to dynamically change the update mode.

3. **Monitor Changes**: The status updates automatically every 2 seconds, or you can refresh the page.

## API Endpoints

- `GET /api/status` - Get current update mode and client status
- `POST /api/toggle` - Toggle between streaming and polling modes
- `GET /api/flag/:flagKey` - Get a flag value (for testing)

## How It Works

### Streaming Mode
- Uses WebSocket connection to LaunchDarkly
- Receives real-time updates when flags change
- Lower latency, more efficient for frequent updates

### Polling Mode
- Periodically checks for flag updates (every 5 seconds)
- Uses HTTP requests instead of WebSocket
- Better for environments where WebSocket connections are restricted

### Dynamic Switching
The application can switch between modes without restarting by:
1. Closing the existing LaunchDarkly client
2. Creating a new client with the desired update mode configuration
3. Re-initializing the connection

## Configuration

The application uses the following environment variables:

- `LAUNCHDARKLY_SDK_KEY` - Your LaunchDarkly SDK key (required)
- `PORT` - Server port (default: 3000)

## Troubleshooting

- **404 Error**: Make sure the server is running and you're accessing the correct port
- **Client Not Initialized**: Check that your SDK key is set correctly in the `.env` file
- **Toggle Fails**: Ensure the LaunchDarkly client is properly initialized before toggling

## License

ISC

