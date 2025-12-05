# Ski Ticket Purchase App 🏔️

A React Native app built with Expo for buying ski lift tickets. Works on both Android and iOS. Uses LaunchDarkly feature flags to control ticket visibility.

## Features

- 🎿 Browse available ski ticket options
- 💳 Purchase tickets with quantity selection
- 📧 Email confirmation
- 🎨 Beautiful winter-themed UI
- 📱 Works on both Android and iOS
- 🚩 LaunchDarkly integration for feature flag control

## Get Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Run on your device

   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your physical device

## App Structure

- `app/index.tsx` - Home screen with ticket options
- `app/purchase.tsx` - Purchase screen with form
- `app/_layout.tsx` - Root layout configuration

## Screens

### Home Screen
Displays available ski ticket options:
- Full Day Pass ($89)
- Half Day Pass ($59)
- Evening Pass ($45)
- Multi-Day Pass ($249)

### Purchase Screen
Allows users to:
- Select quantity
- Enter name and email
- View total price
- Complete purchase

## LaunchDarkly Setup

1. **Get your Client-side ID (Mobile Key):**
   - Sign up for a LaunchDarkly account at https://launchdarkly.com
   - Create a new project or use an existing one
   - Navigate to Account Settings > Projects to find your Client-side ID
   - For React Native apps, this is referred to as a "mobile key" but uses your client-side ID

2. **Set the Client-side ID:**
   - Create a `.env` file in the root directory:
     ```
     EXPO_PUBLIC_LAUNCHDARKLY_CLIENT_ID=your-client-side-id-here
     ```
   - Or update `app/_layout.tsx` and replace `'your-client-side-id-here'` with your actual Client-side ID

3. **Create Feature Flags:**
   Create the following boolean flags in your LaunchDarkly dashboard with default value `true`:
   - `full-day-pass` - Controls visibility of Full Day Pass (default: `true`)
   - `half-day-pass` - Controls visibility of Half Day Pass (default: `true`)
   - `evening-pass` - Controls visibility of Evening Pass (default: `true`)
   - `multi-day-pass` - Controls visibility of Multi-Day Pass (default: `true`)

4. **Control Ticket Visibility:**
   - Toggle flags in the LaunchDarkly dashboard to show/hide ticket options
   - When a flag is `false`, that ticket option will be hidden
   - When a flag is `true` or not set, the ticket will be visible (default behavior)
   - Flags default to `true` in the code, so tickets are visible by default even if flags don't exist yet

## Deep Linking

The app supports deep linking to set the LaunchDarkly user context dynamically.

### URL Scheme: `darkly://`

### Usage

Open the app with a URL like:
```
darkly://setuser?magicuser=123456
```

This will:
- Extract the `magicuser` parameter from the URL (`123456` in this example)
- Set it as the LaunchDarkly context key
- Update the user context name to `User 123456`
- Re-identify the user with LaunchDarkly using the new context

### Examples

**iOS Simulator:**
```bash
xcrun simctl openurl booted "darkly://setuser?magicuser=123456"
```

**Android Emulator:**
```bash
adb shell am start -W -a android.intent.action.VIEW -d "darkly://setuser?magicuser=123456" com.your.package.name
```

**From Terminal (macOS):**
```bash
open "darkly://setuser?magicuser=123456"
```

**From Browser:**
You can also create an HTML link:
```html
<a href="darkly://setuser?magicuser=123456">Set User Context</a>
```

### Default Context

If no deep link is used, the app defaults to:
- **Key**: `ski-app-user`
- **Name**: `Ski App User`

The context is updated in real-time when a deep link is received, allowing you to test different user segments and targeting rules in LaunchDarkly.

## Requirements

- Node.js 18+ 
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Or Expo Go app on physical device
- LaunchDarkly account (for feature flag functionality)

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [React Native documentation](https://reactnative.dev/)
