# Testing Deep Linking

This guide explains how to test the `darkly://setuser?magicuser=XXX` deep link functionality.

## Prerequisites

1. **Start the Expo development server:**
   ```bash
   npm start
   # or
   npx expo start
   ```

2. **Run the app on your target platform:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go on physical device

## Testing Methods

### Method 1: iOS Simulator (macOS only)

1. **Make sure your iOS simulator is running** with the app open

2. **Open the deep link from Terminal:**
   ```bash
   xcrun simctl openurl booted "darkly://setuser?magicuser=123456"
   ```

3. **Verify it worked:**
   - Check the Metro bundler console for logs:
     - `Received deep link: darkly://setuser?magicuser=123456`
     - `Setting LaunchDarkly user context to: 123456`
     - `LaunchDarkly context updated successfully`
   - The app should remain open (no visual change, but context is updated)

### Method 2: Android Emulator

1. **Find your app's package name:**
   - Check `app.json` for the `slug` field (e.g., `react-deep-linking`)
   - Or check the Android package name in the Expo output when starting

2. **Open the deep link from Terminal:**
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "darkly://setuser?magicuser=123456" host.exp.exponent
   ```
   
   **Note:** For Expo Go, use `host.exp.exponent`. For a standalone build, use your actual package name.

3. **Verify it worked:**
   - Check the Metro bundler console for the same logs as iOS
   - Use `adb logcat` to see Android logs:
     ```bash
     adb logcat | grep -i "launchdarkly\|darkly\|deep"
     ```

### Method 3: Physical Device (iOS)

1. **On your Mac, open Terminal and run:**
   ```bash
   xcrun simctl openurl booted "darkly://setuser?magicuser=123456"
   ```
   
   **Note:** This only works if your device is connected and recognized. Alternatively, use Method 4.

### Method 4: Physical Device (Android)

1. **Connect your device via USB** and enable USB debugging

2. **Run:**
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "darkly://setuser?magicuser=123456" host.exp.exponent
   ```

### Method 5: Browser/HTML Link (Easiest)

1. **Create a test HTML file** (`test-deeplink.html`):
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>Test Deep Link</title>
   </head>
   <body>
     <h1>Deep Link Test</h1>
     <p>Click the link below to test the deep link:</p>
     <a href="darkly://setuser?magicuser=123456" style="font-size: 20px; padding: 10px; background: #007AFF; color: white; text-decoration: none; border-radius: 5px;">
       Set User Context to 123456
     </a>
     <br><br>
     <a href="darkly://setuser?magicuser=789012" style="font-size: 20px; padding: 10px; background: #34C759; color: white; text-decoration: none; border-radius: 5px;">
       Set User Context to 789012
     </a>
   </body>
   </html>
   ```

2. **Open the HTML file in your browser** (Safari on iOS, Chrome on Android)

3. **Click the link** - it should open your app

4. **Check the Metro bundler console** for the logs

### Method 6: Terminal (macOS)

1. **Open Terminal and run:**
   ```bash
   open "darkly://setuser?magicuser=123456"
   ```

2. **This will:**
   - Try to open the URL with the default handler
   - On macOS, it may prompt you to choose an app
   - Select your Expo app or simulator

### Method 7: Using Expo CLI (Development)

1. **In the Expo development server terminal**, you can also use:
   ```bash
   npx uri-scheme open "darkly://setuser?magicuser=123456" --ios
   # or
   npx uri-scheme open "darkly://setuser?magicuser=123456" --android
   ```

## How to Verify It's Working

### 1. Check Console Logs

Look for these logs in your Metro bundler console:

```
Received deep link: darkly://setuser?magicuser=123456
Parsed URL: { scheme: 'darkly', hostname: 'setuser', queryParams: { magicuser: '123456' } }
Setting LaunchDarkly user context to: 123456
Updating LaunchDarkly context: { kind: 'user', key: '123456', name: 'User 123456' }
LaunchDarkly context updated successfully
```

### 2. Check LaunchDarkly Dashboard

1. Go to your LaunchDarkly dashboard
2. Navigate to **Users** or **Contexts**
3. Search for the user key you set (e.g., `123456`)
4. You should see the context with:
   - **Key**: `123456`
   - **Name**: `User 123456`
   - **Kind**: `user`

### 3. Test Flag Evaluation

1. **Create a flag in LaunchDarkly** that targets specific users
2. **Set up a rule** that targets user key `123456` specifically
3. **Open the app with the deep link** `darkly://setuser?magicuser=123456`
4. **Verify the flag evaluates correctly** for that user

### 4. Test Multiple Users

Try different user IDs to verify the context updates:

```bash
# User 1
open "darkly://setuser?magicuser=user001"

# User 2  
open "darkly://setuser?magicuser=user002"

# User 3
open "darkly://setuser?magicuser=admin123"
```

Each time, check the console logs to confirm the context is updating.

## Troubleshooting

### Deep link doesn't open the app

1. **Make sure the app is running** (not just installed)
2. **Check the URL scheme** is correct: `darkly://setuser?magicuser=XXX`
3. **Verify `app.json`** has `"scheme": ["reactdeeplinking", "darkly"]`
4. **Rebuild the app** if you changed `app.json`:
   ```bash
   # Stop Expo and restart
   npm start
   ```

### No logs appear

1. **Check Metro bundler console** is visible
2. **Check device logs** (for physical devices):
   - iOS: Use Xcode Console or `xcrun simctl spawn booted log stream`
   - Android: Use `adb logcat`

### Context doesn't update

1. **Check LaunchDarkly client is initialized** - look for "LaunchDarkly client initialized successfully"
2. **Verify the deep link URL format** - must be exactly `darkly://setuser?magicuser=XXX`
3. **Check for errors** in the console logs

### Testing on Web

Deep linking doesn't work on web browsers. Use iOS Simulator, Android Emulator, or physical devices.

## Quick Test Script

Save this as `test-deeplink.sh`:

```bash
#!/bin/bash

echo "Testing deep link: darkly://setuser?magicuser=123456"

# iOS Simulator
if command -v xcrun &> /dev/null; then
    echo "Opening on iOS Simulator..."
    xcrun simctl openurl booted "darkly://setuser?magicuser=123456"
fi

# Android Emulator
if command -v adb &> /dev/null; then
    echo "Opening on Android Emulator..."
    adb shell am start -W -a android.intent.action.VIEW -d "darkly://setuser?magicuser=123456" host.exp.exponent
fi

# macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Opening with macOS default handler..."
    open "darkly://setuser?magicuser=123456"
fi

echo "Check your Metro bundler console for logs!"
```

Make it executable and run:
```bash
chmod +x test-deeplink.sh
./test-deeplink.sh
```

