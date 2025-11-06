#!/bin/bash

echo "🚀 Building and Installing Debug APK for Chrome DevTools debugging..."
echo ""

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found. Installing..."
    sudo apt-get update && sudo apt-get install -y android-tools-adb
fi

# Build the React app
echo "📦 Step 1: Building React app..."
npm run build

# Sync with Capacitor
echo "🔄 Step 2: Syncing with Capacitor..."
npx cap sync android

# Build debug APK
echo "🔧 Step 3: Building Debug APK..."
cd android
./gradlew assembleDebug

# Install debug APK
echo ""
echo "📱 Step 4: Installing Debug APK..."
adb install -r app/build/outputs/apk/debug/app-debug.apk

echo ""
echo "✅ Done! Now:"
echo "1. Open the app on your phone"
echo "2. Go to chrome://inspect"
echo "3. You should see 'WebView in com.smartcommunity.app'"
echo "4. Click 'inspect' to debug!"



