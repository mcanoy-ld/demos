# LaunchDarkly Streaming vs Polling Demo (Ruby)

A Ruby application that demonstrates how to dynamically switch a LaunchDarkly client between streaming and polling update modes.

## Features

- **Dynamic Mode Switching**: Toggle between streaming and polling modes at runtime
- **Real-time Status Display**: See the current update mode and client status
- **Web Interface**: Simple, modern UI to control the LaunchDarkly client
- **Environment Configuration**: SDK key managed via `.env` file

## Prerequisites

- Ruby (2.7 or higher)
- Bundler gem
- LaunchDarkly SDK key

## Setup

1. **Install bundler** (if not already installed):
   ```bash
   gem install bundler
   ```

2. **Install dependencies**:
   ```bash
   bundle install
   ```
   
   Or run the setup script:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Configure SDK key**:
   - Create a `.env` file in the project root
   - Add your LaunchDarkly SDK key:
     ```
     LAUNCHDARKLY_SDK_KEY=your-actual-sdk-key-here
     ```

3. **Run the application**:
   ```bash
   ruby app.rb
   ```
   
   Or using rackup:
   ```bash
   rackup
   ```

4. **Open in browser**:
   Navigate to `http://localhost:3002`

## Usage

1. **View Current Status**: The page displays the current update mode (streaming or polling) and client initialization status.

2. **Toggle Mode**: Click the "Switch to Polling Mode" or "Switch to Streaming Mode" button to dynamically change the update mode.

3. **Monitor Changes**: The status updates automatically every 2 seconds, or you can refresh the page.

## API Endpoints

- `GET /api/status` - Get current update mode and client status
- `POST /api/toggle` - Toggle between streaming and polling modes
- `GET /api/flag/:flag_key` - Get a flag value (for testing)

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
- `PORT` - Server port (default: 3002)

## Troubleshooting

### Common Errors

1. **"cannot load such file -- sinatra"** or similar gem errors:
   - Make sure you've run `bundle install`
   - Check that you're using the correct Ruby version (2.7+)

2. **"Could not find 'bundler'"**:
   - Install bundler: `gem install bundler`
   - Then run: `bundle install`

3. **"Please set LAUNCHDARKLY_SDK_KEY in .env file"**:
   - Create a `.env` file in the project root
   - Add: `LAUNCHDARKLY_SDK_KEY=your-actual-sdk-key-here`

4. **"uninitialized constant LaunchDarkly"**:
   - Make sure the LaunchDarkly SDK gem is installed: `bundle install`
   - Check that you're requiring it correctly in the code

5. **404 Error**: Make sure the server is running and you're accessing the correct port
6. **Client Not Initialized**: Check that your SDK key is set correctly in the `.env` file
7. **Toggle Fails**: Ensure the LaunchDarkly client is properly initialized before toggling

### Getting Help

If you encounter an error, please share:
- The full error message
- Ruby version: `ruby -v`
- Whether gems are installed: `bundle check`

## License

ISC

