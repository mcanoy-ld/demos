# Progressive Rollout Grid

A JavaScript application that displays a 10x10 grid of users, with each grid cell controlled by its own LaunchDarkly client instance and context. Using this grid can help demonstrated the use of different types of rollouts.

## Features

- **10x10 Grid**: 100 unique users displayed in a grid layout
- **Individual LaunchDarkly Clients**: Each grid cell has its own LaunchDarkly client instance
- **Unique Contexts**: Each user has a unique context (key, name, favoriteColor) from `users.json`
- **Real-time Updates**: Grid cells update automatically when flag values change via streaming
- **Visual Indicators**: 
  - Blue cells when flag is `true` (enabled)
  - Red cells when flag is `false` (disabled)
- **Dynamic Counts**: Shows the count of blue and red cells in real-time
- **User Names**: Each cell displays the user's name from `users.json`

## Prerequisites

- A web server
- LaunchDarkly account with a Client-side ID
- A feature flag named `progressive-rollout-example` in your LaunchDarkly project (You can change the flag key on line 88 of `index.html` )
   ```javascript
   const flagKey = 'progressive-rollout-example';
   ```

## Setup

1. **Set your LaunchDarkly Client ID:**
   
   You have two options:
   
   **Option A - Set in the UI:**
   - Start the application (see step 2)
   - Enter your LaunchDarkly Client-side ID in the input box at the top of the page
   - Click "Update" or press Enter
   - The grid will initialize with your Client ID
   
   **Option B - Set in the code:**
   - Open `index.html` and find the `clientId` variable:
   ```javascript
   var clientId = 'your-client-id-here'
   ```
   - Replace `'your-client-id-here'` with your actual LaunchDarkly Client-side ID

2. **Start the application:**
   
   **Using Python:**
   ```bash
   python3 -m http.server 3002
   ```
   
   **Or using any web server:**
   Serve the `index.html` and `users.json` files from any web server of your choice.

3. **Open in browser:**
   Navigate to `http://localhost:3002`
   
   **Note:** Opening `index.html` directly in a browser (file://) may not work due to CORS restrictions when loading `users.json`. A local web server is recommended.

## How It Works

1. Enter your LaunchDarkly Client ID in the input box at the top and click "Update"
2. The application loads `users.json` containing 100 users
3. Creates a 10x10 grid with each cell displaying a user's name
4. Initializes 100 separate LaunchDarkly client instances, one for each user
5. Each client uses the user's context (key, name, favoriteColor) to evaluate the `progressive-rollout-example` flag
6. Cells turn blue with a checkmark (✓) when the flag is `true`, red with an X (✗) when `false`
7. The counts at the bottom update automatically as flag values change
8. Changes to the flag in LaunchDarkly update the grid in real-time via streaming
9. You can change the Client ID at any time using the input box - all clients will be reinitialized with the new ID

## Project Structure

```
progressive-rollout--v2/
├── index.html       # Main HTML file (contains all CSS and JavaScript)
├── users.json       # Array of 100 users with keys, names, and favorite colors
└── README.md        # This file
```

The app is just HTML, CSS, and JavaScript with no build step or dependencies required.

## LaunchDarkly Configuration

- **Flag Key**: `progressive-rollout-example`
- **Flag Type**: Boolean
- **Client Type**: Client-side SDK (JavaScript)
- **Streaming**: Enabled by default

Each user context includes:
- `key`: Unique user identifier (e.g., "user-001")
- `name`: User's name (e.g., "Alice")
- `favoriteColor`: User's favorite color (e.g., "red")

## Troubleshooting

- **Grid not updating**: Check browser console for errors. Ensure your Client ID is correct.
- **All cells red**: The flag may be off for all users, or there may be an initialization issue.
- **SDK not loading**: Check your internet connection and ensure the LaunchDarkly SDK CDN is accessible.

