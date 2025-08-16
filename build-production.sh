#!/bin/bash

echo "🚀 Building Smart Community App for Production..."

# Source nvm and set Node.js version
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check if Node.js 20+ is available
if ! command -v node &> /dev/null || [[ $(node --version | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
    echo "❌ Node.js 20+ is required. Please run: nvm use 20"
    exit 1
fi

echo "✅ Using Node.js $(node --version)"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the app
echo "🔨 Building app for production..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx @capacitor/cli sync

echo ""
echo "🎉 Production build is ready!"
echo ""
echo "Next steps for App Store submission:"
echo ""
echo "📱 Google Play Store:"
echo "1. Open Android Studio: npm run mobile:android"
echo "2. Build > Generate Signed Bundle/APK"
echo "3. Create release keystore (if first time)"
echo "4. Generate .aab file"
echo "5. Upload to Google Play Console"
echo ""
echo "🍎 Apple App Store:"
echo "1. Open Xcode: npm run mobile:ios"
echo "2. Product > Archive"
echo "3. Distribute App"
echo "4. Upload to App Store Connect"
echo ""
echo "📋 Required assets:"
echo "- App icons in multiple sizes"
echo "- Screenshots for different devices"
echo "- App descriptions and metadata"
echo "- Privacy policy URL"
echo ""
echo "📚 See app-store-assets.md for detailed requirements" 