#!/bin/bash

# Android Deep Link Test Script
# Usage: ./test-android-deeplink.sh [user-id]
# Example: ./test-android-deeplink.sh 123456

PACKAGE_NAME="com.anonymous.reactdeeplinking"
USER_ID="${1:-123456}"

echo "🧪 Testing Android Deep Link"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "URL: darkly://setuser?magicuser=$USER_ID"
echo "Package: $PACKAGE_NAME"
echo ""

# Check if ADB is available
if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found!"
    echo "Please add Android SDK platform-tools to your PATH:"
    echo "export PATH=\$PATH:\$HOME/Library/Android/sdk/platform-tools"
    exit 1
fi

# Check if device is connected
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')
if [ "$DEVICES" -eq 0 ]; then
    echo "❌ No Android device found!"
    echo ""
    echo "Make sure:"
    echo "  1. Your Android emulator is running, OR"
    echo "  2. Your physical device is connected via USB with USB debugging enabled"
    echo ""
    echo "Check with: adb devices"
    exit 1
fi

echo "✅ Found $DEVICES device(s)"
echo ""

# Send deep link
echo "📤 Sending deep link..."
adb shell am start -W -a android.intent.action.VIEW -d "darkly://setuser?magicuser=$USER_ID" "$PACKAGE_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deep link sent successfully!"
    echo ""
    echo "📋 Check your Metro bundler console for logs:"
    echo "   - Received deep link: darkly://setuser?magicuser=$USER_ID"
    echo "   - Setting LaunchDarkly user context to: $USER_ID"
    echo "   - LaunchDarkly context updated successfully"
else
    echo ""
    echo "❌ Failed to send deep link"
    echo "Make sure your app is installed on the device"
fi

