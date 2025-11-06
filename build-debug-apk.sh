#!/bin/bash

echo "🔨 Building Debug APK for debugging..."
echo ""

# Build the React app
echo "📦 Building React app..."
npm run build

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# Build debug APK
echo "🔧 Building Debug APK..."
cd android
./gradlew assembleDebug

echo ""
echo "✅ Debug APK built successfully!"
echo "📱 Install it with: adb install -r app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Or run this script which will do it automatically..."
