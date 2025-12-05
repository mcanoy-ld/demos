# Android Setup Guide

The error `No Android connected device found, and no emulators could be started automatically` means you need to set up an Android emulator or connect a physical device.

## Option 1: Start an Existing Android Emulator (Easiest)

1. **Open Android Studio**
   - If you don't have it: Download from https://developer.android.com/studio

2. **Open AVD Manager** (Android Virtual Device Manager):
   - Click the device icon in the toolbar, or
   - Go to `Tools` > `Device Manager`

3. **Start an emulator:**
   - If you see an emulator listed, click the ▶️ play button next to it
   - Wait for it to boot up (you'll see the Android home screen)

4. **Verify it's running:**
   ```bash
   adb devices
   ```
   You should see your emulator listed

5. **Run the app:**
   ```bash
   npx expo run:android
   ```

## Option 2: Create a New Android Emulator

1. **Open Android Studio**

2. **Open AVD Manager:**
   - Click `Tools` > `Device Manager`
   - Or click the device icon in the toolbar

3. **Create Virtual Device:**
   - Click `+ Create Device`
   - Choose a device (e.g., Pixel 5, Pixel 6)
   - Click `Next`

4. **Select System Image:**
   - Choose a system image (recommended: latest API level, e.g., API 34)
   - If you see "Download" next to it, click to download first
   - Click `Next`

5. **Configure AVD:**
   - Give it a name (e.g., "Pixel_5_API_34")
   - Click `Finish`

6. **Start the emulator:**
   - Click the ▶️ play button next to your new emulator

7. **Run the app:**
   ```bash
   npx expo run:android
   ```

## Option 3: Use a Physical Android Device

1. **Enable Developer Options on your Android device:**
   - Go to `Settings` > `About phone`
   - Tap `Build number` 7 times
   - You'll see "You are now a developer!"

2. **Enable USB Debugging:**
   - Go to `Settings` > `Developer options`
   - Enable `USB debugging`

3. **Connect your device:**
   - Connect via USB cable
   - On your phone, when prompted, tap "Allow USB debugging"

4. **Verify connection:**
   ```bash
   adb devices
   ```
   You should see your device listed

5. **Run the app:**
   ```bash
   npx expo run:android
   ```

## Quick Commands

**Check if any Android devices/emulators are connected:**
```bash
adb devices
```

**List available emulators:**
```bash
emulator -list-avds
```

**Start a specific emulator by name:**
```bash
emulator -avd <emulator-name>
```

**Check if Android SDK is installed:**
```bash
echo $ANDROID_HOME
# or
echo $ANDROID_SDK_ROOT
```

## Troubleshooting

### "adb: command not found"
Install Android SDK Platform Tools:
- **macOS:** `brew install android-platform-tools`
- Or download from: https://developer.android.com/studio/releases/platform-tools

### "ANDROID_HOME not set"
Add to your `~/.zshrc` or `~/.bash_profile`:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

### Emulator won't start
- Make sure virtualization is enabled in your BIOS (Intel VT-x or AMD-V)
- Check if Hyper-V (Windows) or VirtualBox conflicts
- Try creating a new emulator with different settings

### "No space left on device"
- Free up disk space
- Delete old emulators/images you don't use

## Alternative: Use Expo Go (No Build Required)

If you just want to test quickly without building:

1. **Install Expo Go** on your Android device from Google Play Store

2. **Start Expo dev server:**
   ```bash
   npx expo start
   ```

3. **Scan the QR code** with Expo Go app

This doesn't require Android Studio or emulators, but has limitations (no custom native code, slower performance).

## Recommended Setup

For development, I recommend:
1. **Android Studio** installed
2. **One emulator** created (Pixel 5 or 6, API 33 or 34)
3. **ADB** in your PATH
4. **Emulator running** before running `npx expo run:android`

