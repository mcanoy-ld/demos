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
- QA Pass ($0) - Internal use only, controlled by deep linking

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
   Create the following boolean flags in your LaunchDarkly dashboard:
   - `full-day-pass` - Controls visibility of Full Day Pass (default: `true`)
   - `half-day-pass` - Controls visibility of Half Day Pass (default: `true`)
   - `evening-pass` - Controls visibility of Evening Pass (default: `true`)
   - `multi-day-pass` - Controls visibility of Multi-Day Pass (default: `true`)
   - `qa-pass` - Controls visibility of QA Pass (default: `false`) - **Controlled by deep linking**

4. **Control Ticket Visibility:**
   - Toggle flags in the LaunchDarkly dashboard to show/hide ticket options
   - When a flag is `false`, that ticket option will be hidden
   - When a flag is `true` or not set, the ticket will be visible (default behavior)
   - Flags default to `true` in the code, so tickets are visible by default even if flags don't exist yet
   - **The `qa-pass` flag defaults to `false` and is designed to be controlled via deep linking and individual user targeting**

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

### Using Deep Linking with LaunchDarkly Targeting

The `magicuser` parameter from the deep link becomes the LaunchDarkly context key. This allows you to set up **individual targeting** in LaunchDarkly based on specific user keys.

#### Example: QA Pass Flag Targeting

The `qa-pass` flag is designed to be controlled via deep linking. Here's how to set it up:

1. **Create the `qa-pass` flag** in LaunchDarkly (boolean, default: `false`)

2. **Add Individual Targets** in the LaunchDarkly dashboard:
   - Go to the `qa-pass` flag settings
   - Scroll to "Individual targeting"
   - Click "Add individual targets"
   - Add specific user keys (e.g., `123456`, `qa-user-1`, `admin123`)
   - Set the variation to `true` for those users

3. **Test with Deep Links:**
   ```bash
   # User 123456 will see QA Pass (if targeted)
   adb shell am start -W -a android.intent.action.VIEW -d "darkly://setuser?magicuser=123456" com.anonymous.reactdeeplinking
   
   # User 789012 won't see QA Pass (if not targeted)
   adb shell am start -W -a android.intent.action.VIEW -d "darkly://setuser?magicuser=789012" com.anonymous.reactdeeplinking
   ```

4. **How It Works:**
   - When you open the app with `darkly://setuser?magicuser=123456`, the LaunchDarkly context key becomes `123456`
   - LaunchDarkly evaluates the `qa-pass` flag for that specific user key
   - If `123456` is in the individual targets list with `true`, the QA Pass ticket will appear
   - If `123456` is not targeted or set to `false`, the QA Pass ticket will be hidden

This allows you to:
- Grant QA Pass access to specific internal users by their user keys
- Test different user scenarios without changing flag rules
- Control access dynamically by updating individual targets in LaunchDarkly

## Requirements

- Node.js 18+ 
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Or Expo Go app on physical device
- LaunchDarkly account (for feature flag functionality)

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [React Native documentation](https://reactnative.dev/)
