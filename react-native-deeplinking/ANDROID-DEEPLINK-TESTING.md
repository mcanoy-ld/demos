# Testing Deep Links on Android

## Prerequisites

1. **App must be built and installed** on your Android device/emulator
2. **App should be running** (or at least installed)

## Method 1: Using ADB (Recommended)

This is the easiest and most reliable method.

### Step 1: Make sure your device/emulator is connected

```bash
adb devices
```

You should see your device listed. If not:
- For emulator: Make sure it's running
- For physical device: Enable USB debugging and connect via USB

### Step 2: Send the deep link

```bash
adb shell am start -W -a android.intent.action.VIEW -d "darkly://setuser?magicuser=123456" com.anonymous.reactdeeplinking
```

**Note:** Replace `com.anonymous.reactdeeplinking` with your actual package name if different. You can find it in `app.json` under `android.package`.

### Step 3: Check Metro bundler console

You should see logs like:
```
Received deep link: darkly://setuser?magicuser=123456
Setting LaunchDarkly user context to: 123456
LaunchDarkly context updated successfully
```

## Method 2: Using ADB with Expo Go

If you're using Expo Go instead of a development build:

```bash
adb shell am start -W -a android.intent.action.VIEW -d "darkly://setuser?magicuser=123456" host.exp.exponent
```

## Method 3: Create a Test HTML File

1. **Create `test-android.html`:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Android Deep Link Test</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    a {
      display: inline-block;
      padding: 15px 30px;
      margin: 10px 5px;
      background: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-size: 18px;
    }
    a:hover {
      background: #45a049;
    }
  </style>
</head>
<body>
  <h1>Android Deep Link Test</h1>
  <p>Click a link below to test the deep link on your Android device:</p>
  
  <a href="darkly://setuser?magicuser=123456">Set User: 123456</a>
  <br>
  <a href="darkly://setuser?magicuser=789012">Set User: 789012</a>
  <br>
  <a href="darkly://setuser?magicuser=admin123">Set User: admin123</a>
  
  <p style="margin-top: 30px; font-size: 14px; color: #666;">
    <strong>Instructions:</strong><br>
    1. Open this file on your Android device<br>
    2. Click a link - it should open your app<br>
    3. Check Metro bundler console for logs
  </p>
</body>
</html>
```

2. **Transfer to your Android device** (via email, cloud storage, or USB)

3. **Open the HTML file** in Chrome on your Android device

4. **Click the links** - they should open your app

## Method 4: Using Chrome on Android Device

1. **Open Chrome** on your Android device

2. **Type in the address bar:**
   ```
   darkly://setuser?magicuser=123456
   ```

3. **Chrome will ask** "Open in [Your App]?" - tap **Open**

4. **Check Metro bundler** for logs

## Method 5: Using a QR Code

1. **Create a QR code** with the URL: `darkly://setuser?magicuser=123456`

2. **Scan with your Android device** - most QR scanners will recognize the URL scheme

3. **Tap to open** when prompted

## Method 6: From Another App

You can create a simple Android app or use an app like "Intent URI" to send deep links.

## Troubleshooting

### "No app found to handle this URL"

This means the URL scheme isn't registered. Make sure:
1. You've rebuilt the app after adding the scheme to `app.json`
2. The app is installed on the device
3. The scheme in `app.json` matches: `"scheme": ["reactdeeplinking", "darkly"]`

### Deep link doesn't work

1. **Check the package name:**
   ```bash
   # Find your package name
   adb shell pm list packages | grep react
   ```

2. **Verify the scheme is registered:**
   ```bash
   adb shell dumpsys package com.anonymous.reactdeeplinking | grep -A 5 "scheme"
   ```

3. **Check Metro bundler logs** - the deep link handler should log when it receives a URL

### App opens but context doesn't update

1. Check Metro bundler console for errors
2. Verify the URL format is exactly: `darkly://setuser?magicuser=XXX`
3. Make sure LaunchDarkly client is initialized before the deep link arrives

## Quick Test Script

Save this as `test-android-deeplink.sh`:

```bash
#!/bin/bash

PACKAGE_NAME="com.anonymous.reactdeeplinking"
USER_ID="${1:-123456}"

echo "Testing deep link: darkly://setuser?magicuser=$USER_ID"
echo "Package: $PACKAGE_NAME"
echo ""

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device found!"
    echo "Make sure your device/emulator is connected and USB debugging is enabled."
    exit 1
fi

# Send deep link
adb shell am start -W -a android.intent.action.VIEW -d "darkly://setuser?magicuser=$USER_ID" "$PACKAGE_NAME"

echo ""
echo "✅ Deep link sent!"
echo "Check your Metro bundler console for logs."
```

Make it executable and use:
```bash
chmod +x test-android-deeplink.sh
./test-android-deeplink.sh 123456
./test-android-deeplink.sh 789012
```

## Verify It's Working

After sending a deep link, check your Metro bundler console for:

```
Received deep link: darkly://setuser?magicuser=123456
Parsed URL: { scheme: 'darkly', hostname: 'setuser', queryParams: { magicuser: '123456' } }
Setting LaunchDarkly user context to: 123456
Updating LaunchDarkly context: { kind: 'user', key: '123456', name: 'User 123456' }
LaunchDarkly context updated successfully
```

If you see these logs, the deep link is working! 🎉

