#!/bin/bash

echo "🚀 Building Smart Community Mobile App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the app
echo "🔨 Building app..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Check if Capacitor is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not installed. Please install npx first."
    exit 1
fi

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx @capacitor/cli sync

echo "🎉 Mobile app is ready!"
echo ""
echo "Next steps:"
echo "1. Add Android platform: npx @capacitor/cli add android"
echo "2. Add iOS platform: npx @capacitor/cli add ios"
echo "3. Open Android Studio: npx @capacitor/cli open android"
echo "4. Open Xcode: npx @capacitor/cli open ios"
echo ""
echo "Or use the npm scripts:"
echo "- npm run mobile:android"
echo "- npm run mobile:ios"
echo "- npm run mobile:sync" 