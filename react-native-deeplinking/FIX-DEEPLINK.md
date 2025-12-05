# Fixing Deep Link Error (-10814)

The error `OSStatus error -10814` means the URL scheme isn't registered in the iOS Simulator. Here's how to fix it:

## Solution 1: Rebuild the App (Recommended)

After adding the `darkly` scheme to `app.json`, you need to rebuild the app:

1. **Stop the Expo server** (Ctrl+C)

2. **Clear Expo cache:**
   ```bash
   npx expo start --clear
   ```

3. **Rebuild for iOS:**
   ```bash
   npx expo run:ios
   ```
   
   This will rebuild the native iOS app with the new URL scheme registered.

4. **Once the app is running**, try the deep link again:
   ```bash
   xcrun simctl openurl booted "darkly://setuser?magicuser=123456"
   ```

## Solution 2: Use Expo Development Build

If you're using Expo Go, URL schemes might not work properly. Use a development build instead:

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Create a development build:**
   ```bash
   eas build --profile development --platform ios
   ```

3. **Install the build on your simulator** and try the deep link

## Solution 3: Test While App is Running

Make sure the app is **actively running** in the simulator before trying to open the deep link:

1. **Start the app:**
   ```bash
   npm start
   ```
   Press `i` to open iOS Simulator

2. **Wait for the app to fully load** (you should see the ski ticket screen)

3. **Then run the deep link command:**
   ```bash
   xcrun simctl openurl booted "darkly://setuser?magicuser=123456"
   ```

## Solution 4: Use Expo's Built-in Deep Link Testing

Expo provides a way to test deep links:

1. **Make sure your app is running**

2. **Use Expo's linking API:**
   ```bash
   npx expo start
   ```

3. **In the Expo Dev Tools**, there should be an option to test deep links, or use:
   ```bash
   npx uri-scheme open "darkly://setuser?magicuser=123456" --ios
   ```

## Solution 5: Verify URL Scheme Registration

Check if the scheme is registered:

1. **In the iOS Simulator**, open Safari

2. **Type in the address bar:**
   ```
   darkly://setuser?magicuser=123456
   ```

3. **If it asks "Open in [Your App]?"**, the scheme is registered
4. **If it says "Safari cannot open the page"**, the scheme isn't registered (need to rebuild)

## Quick Fix Steps:

```bash
# 1. Stop current server
# Press Ctrl+C

# 2. Clear cache and rebuild
cd react-native-deeplinking
npx expo start --clear

# 3. In another terminal, rebuild iOS
npx expo run:ios

# 4. Once app is running, test deep link
xcrun simctl openurl booted "darkly://setuser?magicuser=123456"
```

## Alternative: Test via Notes App

If the command doesn't work, try this:

1. **Open Notes app in the iOS Simulator**

2. **Type:** `darkly://setuser?magicuser=123456`

3. **Tap on the link** - it should open your app

4. **Check Metro bundler console** for the logs

## Debugging

Add this to see what's happening:

```bash
# Check if simulator can open the URL
xcrun simctl openurl booted "darkly://test"

# List all registered URL schemes (requires app to be installed)
xcrun simctl get_app_container booted host.exp.Exponent | xargs ls -la
```

The most common fix is **Solution 1** - rebuilding the app after adding the URL scheme to `app.json`.

