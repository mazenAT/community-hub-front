#!/bin/bash

echo "📱 Installing Debug APK on your phone..."
echo ""

# Check if device is connected
if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found. Install it with:"
    echo "sudo apt-get install android-tools-adb"
    exit 1
fi

# Check for connected device
DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l)
if [ $DEVICES -eq 0 ]; then
    echo "❌ No device connected!"
    echo ""
    echo "Make sure:"
    echo "1. Phone is connected via USB"
    echo "2. USB debugging is enabled"
    echo "3. You've accepted the USB debugging prompt"
    echo ""
    echo "Run 'adb devices' to check"
    exit 1
fi

echo "✅ Device connected!"

# Install the debug APK
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ]; then
    echo "❌ Debug APK not found at: $APK_PATH"
    echo "Building it now..."
    
    # Build the APK
    cd android
    ./gradlew assembleDebug
    cd ..
fi

echo ""
echo "Installing debug APK..."
adb install -r "$APK_PATH"

echo ""
echo "✅ Done! Open the app on your phone."
echo "Then go to chrome://inspect to debug!"



