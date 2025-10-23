#!/bin/bash

# 🚀 Smart Community App Production Build Script
# This script builds the app for production deployment

set -e

echo "🚀 Starting Smart Community App Production Build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the smart-community-app directory"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version 20 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf build/
rm -rf android/app/build/
rm -rf ios/build/

# Build web assets
print_status "Building web assets..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    print_error "Web build failed - build directory not found"
    exit 1
fi

print_success "Web build completed successfully"

# Sync with Capacitor
print_status "Syncing with Capacitor..."
npx cap sync

# Build for Android
print_status "Building for Android..."
cd android
./gradlew clean
./gradlew assembleRelease

# Check if Android build was successful
if [ ! -f "app/build/outputs/apk/release/app-release.apk" ]; then
    print_error "Android build failed - APK not found"
    exit 1
fi

print_success "Android APK built successfully: app/build/outputs/apk/release/app-release.apk"

# Build Android App Bundle (AAB) for Google Play Store
print_status "Building Android App Bundle (AAB)..."
./gradlew bundleRelease

if [ ! -f "app/build/outputs/bundle/release/app-release.aab" ]; then
    print_error "Android App Bundle build failed - AAB not found"
    exit 1
fi

print_success "Android App Bundle built successfully: app/build/outputs/bundle/release/app-release.aab"

cd ..

# Build for iOS (requires macOS and Xcode)
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Building for iOS..."
    cd ios
    xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -destination generic/platform=iOS -archivePath App.xcarchive archive
    
    if [ ! -d "App.xcarchive" ]; then
        print_error "iOS build failed - archive not found"
        exit 1
    fi
    
    print_success "iOS archive built successfully: App.xcarchive"
    cd ..
else
    print_warning "iOS build skipped - requires macOS and Xcode"
fi

# Create deployment package
print_status "Creating deployment package..."
DEPLOY_DIR="deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy Android builds
cp android/app/build/outputs/apk/release/app-release.apk "$DEPLOY_DIR/"
cp android/app/build/outputs/bundle/release/app-release.aab "$DEPLOY_DIR/"

# Copy iOS build if available
if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios/App.xcarchive" ]; then
    cp -r ios/App.xcarchive "$DEPLOY_DIR/"
fi

# Copy app store assets
cp -r public/ "$DEPLOY_DIR/assets/"
cp STORE_DEPLOYMENT_GUIDE.md "$DEPLOY_DIR/"
cp PRIVACY_POLICY.md "$DEPLOY_DIR/"

# Create build info
cat > "$DEPLOY_DIR/build-info.txt" << EOF
Smart Community App Build Information
=====================================
Build Date: $(date)
Build Version: 1.0.0
Node Version: $(node -v)
NPM Version: $(npm -v)
Capacitor Version: $(npx cap --version)

Android Builds:
- APK: app-release.apk
- AAB: app-release.aab

iOS Build:
- Archive: App.xcarchive (if macOS)

Assets:
- App Store assets in assets/ directory
- Privacy Policy: PRIVACY_POLICY.md
- Deployment Guide: STORE_DEPLOYMENT_GUIDE.md
EOF

print_success "Deployment package created: $DEPLOY_DIR"

# Display build summary
echo ""
echo "🎉 Build Summary"
echo "================"
echo "✅ Web assets built successfully"
echo "✅ Android APK: $DEPLOY_DIR/app-release.apk"
echo "✅ Android AAB: $DEPLOY_DIR/app-release.aab"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ iOS Archive: $DEPLOY_DIR/App.xcarchive"
fi
echo "✅ Assets: $DEPLOY_DIR/assets/"
echo "✅ Documentation: $DEPLOY_DIR/"
echo ""
echo "📱 Next Steps:"
echo "1. Test the APK/AAB on real devices"
echo "2. Upload AAB to Google Play Console"
echo "3. Upload iOS archive to App Store Connect"
echo "4. Complete app store listings"
echo "5. Submit for review"
echo ""
echo "📖 See STORE_DEPLOYMENT_GUIDE.md for detailed instructions"