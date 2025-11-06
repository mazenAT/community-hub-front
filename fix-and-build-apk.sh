#!/bin/bash

# Fix and Build APK Script
# This script fixes common issues and builds a release APK for testing

set -e

echo "🔧 Fixing and Building Smart Community App..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the smart-community-app directory${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Current directory: $(pwd)${NC}"

# Step 1: Clean previous builds
echo ""
echo -e "${YELLOW}Step 1: Cleaning previous builds...${NC}"
rm -rf build
rm -rf android/app/build
rm -rf android/app/src/main/assets
rm -rf android/.gradle
echo -e "${GREEN}✓ Cleaned build directories${NC}"

# Step 2: Install dependencies
echo ""
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
npm ci --production=false
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Build web assets
echo ""
echo -e "${YELLOW}Step 3: Building web assets...${NC}"
npm run build
echo -e "${GREEN}✓ Web assets built${NC}"

# Step 4: Sync with Capacitor
echo ""
echo -e "${YELLOW}Step 4: Syncing with Capacitor...${NC}"
npx cap sync android
echo -e "${GREEN}✓ Synced with Capacitor${NC}"

# Step 5: Build Android APK (Debug version first for testing)
echo ""
echo -e "${YELLOW}Step 5: Building Android Debug APK...${NC}"
cd android
./gradlew clean
./gradlew assembleDebug
echo -e "${GREEN}✓ Debug APK built${NC}"

# Step 6: Build Release APK
echo ""
echo -e "${YELLOW}Step 6: Building Android Release APK...${NC}"
./gradlew assembleRelease
echo -e "${GREEN}✓ Release APK built${NC}"

# Step 7: Show build results
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Build Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}APK Files:${NC}"
echo -e "  Debug:   android/app/build/outputs/apk/debug/app-debug.apk"
echo -e "  Release: android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo -e "${YELLOW}AAB File (for Google Play):${NC}"
echo -e "  Android: android/app/build/outputs/bundle/release/app-release.aab"
echo ""

# Check if device is connected
if command -v adb &> /dev/null; then
    DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l)
    if [ $DEVICES -gt 0 ]; then
        echo -e "${YELLOW}Connected devices detected. Install APK? (y/n)${NC}"
        read -r INSTALL_APK
        if [ "$INSTALL_APK" = "y" ] || [ "$INSTALL_APK" = "Y" ]; then
            echo ""
            echo -e "${YELLOW}Installing debug APK...${NC}"
            adb install -r android/app/build/outputs/apk/debug/app-debug.apk
            echo -e "${GREEN}✓ APK installed${NC}"
            
            echo ""
            echo -e "${YELLOW}Opening logcat. Press Ctrl+C to stop.${NC}"
            echo -e "${YELLOW}Now launch the app to test for crashes.${NC}"
            sleep 2
            
            # Monitor logs for crashes
            adb logcat -c  # Clear logs
            adb logcat | grep -E "FATAL|AndroidRuntime|smartcommunity" --color=never
        fi
    fi
fi

cd ..

echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Test the APK on your device"
echo "2. Check for crashes using: adb logcat | grep -i 'crash\|fatal'"
echo "3. Upload AAB to Google Play Console for testing"
echo "4. See CRASH_DEBUGGING_GUIDE.md for detailed debugging info"
echo ""
