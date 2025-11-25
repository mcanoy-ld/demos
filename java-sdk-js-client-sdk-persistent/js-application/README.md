# LaunchDarkly Bootstrap Demo - JavaScript Application

This JavaScript application demonstrates using the LaunchDarkly JS SDK (client-side) with bootstrapping data from a server-side API. The application automatically fetches bootstrap data on page load and displays it alongside a visual flag indicator.

## Features

- **Automatic Bootstrap Integration**: Automatically fetches flag data from the Java backend API (`/api/bootstrap`) on page load
- **LaunchDarkly JS SDK**: Uses the client-side SDK initialized with bootstrap data
- **Visual Flag Status**: Displays a visual indicator (green/red circle) for the `widget-one` flag showing ON or OFF
- **Bootstrap Payload Display**: Shows the raw JSON bootstrap data received from the server in a formatted code block
- **Real-time Updates**: Automatically updates the widget indicator when flag values change

## Prerequisites

- Node.js and npm installed
- The Java Spring Boot application running on `http://localhost:8080`
- A LaunchDarkly account (for the client-side SDK key)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update the client-side SDK key:**
   
   Edit `index.html` and replace the `CLIENT_SIDE_ID` constant with your actual LaunchDarkly client-side SDK key:
   ```javascript
   const CLIENT_SIDE_ID = 'your-actual-client-side-id';
   ```

3. **Update the context (optional):**
   
   The default context is set in `index.html`. You can modify it if needed:
   ```javascript
   context = {
     key: 'randy-key',
     name: 'Randy',
     kind: 'user'
   }
   ```

4. **Start the application:**
   ```bash
   npm start
   ```

   This will start a local HTTP server on port 3333.

5. **Open in browser:**
   Navigate to `http://localhost:3333`

## Usage

The application automatically:
1. Fetches bootstrap data from the Java backend when the page loads
2. Initializes the LaunchDarkly JS SDK with the bootstrap data
3. Displays the bootstrap JSON payload in the left box
4. Evaluates the `widget-one` flag and shows its status in the right box

**View Results:**
- **Bootstrap Payload** (left box): Shows the raw JSON data received from the bootstrap API
- **Widget Flag** (right box): Visual indicator showing whether `widget-one` is ON (green) or OFF (red)

The widget indicator automatically updates when the flag value changes.

## How It Works

1. **Page Load**: When the page loads, the script automatically executes
2. **Bootstrap API Call**: The app sends a POST request to `http://localhost:8080/api/bootstrap` with the context JSON
3. **Bootstrap Data**: The Java backend evaluates all flags for the given context and returns the flag state
4. **SDK Initialization**: The LaunchDarkly JS SDK is initialized with the bootstrap data, allowing it to work immediately without waiting for a network connection
5. **Flag Evaluation**: The app evaluates the `widget-one` flag and displays its status visually with a color-coded circle
6. **Real-time Updates**: The app listens for flag changes and updates the display automatically

## API Integration

The application expects the bootstrap API to:
- Accept POST requests at `http://localhost:8080/api/bootstrap`
- Accept JSON body with context: `{"key": "randy-key", "kind": "user", "name": "Randy"}`
- Return JSON with flag values: `{"widget-one": true, "other-flag": false, ...}`

## File Structure

- `index.html` - Main HTML file with embedded JavaScript
- `style.css` - CSS stylesheet for the application
- `package.json` - Node.js dependencies and scripts

## Troubleshooting

**"Cannot connect to bootstrap API"**
- Make sure the Java Spring Boot application is running on `http://localhost:8080`
- Check that the `/api/bootstrap` endpoint is accessible
- Verify CORS is properly configured on the Java backend

**Flag shows as "OFF" or doesn't update**
- Verify the `widget-one` flag exists in your LaunchDarkly project
- Check that the bootstrap data includes the flag
- Ensure the LaunchDarkly client-side SDK key is set correctly in `index.html`
- Check browser console for error messages

**SDK initialization fails**
- Verify your LaunchDarkly client-side SDK key is correct in `index.html`
- Check browser console for error messages
- Ensure the bootstrap data format is correct
- Note: Even with an invalid SDK key, the bootstrap data should still work (you'll see errors in console but the app will function)

**Bootstrap data not loading**
- Check browser console for network errors
- Verify the Java backend is running and accessible
- Ensure the context format matches what the API expects

## Learn More

- [LaunchDarkly JS SDK Documentation](https://docs.launchdarkly.com/sdk/client-side/javascript)
- [Bootstrap Documentation](https://docs.launchdarkly.com/sdk/client-side/javascript#bootstrapping)

