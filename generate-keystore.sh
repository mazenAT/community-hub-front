#!/bin/bash

# 🔐 Android Keystore Generation Script
# This script generates a release keystore for Android app signing

set -e

echo "🔐 Generating Android Release Keystore..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if keystore already exists
if [ -f "smart-community-release.keystore" ]; then
    print_warning "Keystore already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Keystore generation cancelled"
        exit 0
    fi
fi

# Generate keystore
print_status "Generating release keystore..."

keytool -genkey -v \
    -keystore smart-community-release.keystore \
    -alias smart-community \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass smartcommunity123 \
    -keypass smartcommunity123 \
    -dname "CN=Smart Community, OU=Development, O=Smart Community Solutions, L=City, S=State, C=US"

if [ $? -eq 0 ]; then
    print_success "Keystore generated successfully!"
else
    print_error "Keystore generation failed!"
    exit 1
fi

# Create gradle.properties template
print_status "Creating gradle.properties template..."

cat > gradle.properties.template << EOF
# Android Release Signing Configuration
# DO NOT COMMIT THIS FILE TO VERSION CONTROL
# Copy to gradle.properties and update with your actual values

KEYSTORE_PATH=smart-community-release.keystore
KEYSTORE_PASSWORD=smartcommunity123
KEY_ALIAS=smart-community
KEY_PASSWORD=smartcommunity123
EOF

print_success "gradle.properties.template created"

# Create .gitignore entry
if [ -f ".gitignore" ]; then
    if ! grep -q "gradle.properties" .gitignore; then
        echo "" >> .gitignore
        echo "# Android signing configuration" >> .gitignore
        echo "gradle.properties" >> .gitignore
        echo "*.keystore" >> .gitignore
        print_success "Added keystore files to .gitignore"
    fi
fi

# Display important information
echo ""
echo "🔐 Keystore Information"
echo "====================="
echo "Keystore File: smart-community-release.keystore"
echo "Alias: smart-community"
echo "Algorithm: RSA"
echo "Key Size: 2048 bits"
echo "Validity: 10000 days"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "1. Keep your keystore file secure and backed up"
echo "2. Never commit the keystore or passwords to version control"
echo "3. Use environment variables for production builds"
echo "4. Store passwords securely (password manager recommended)"
echo ""
echo "📝 Next Steps:"
echo "1. Copy gradle.properties.template to gradle.properties"
echo "2. Update passwords in gradle.properties with secure values"
echo "3. Test the build with: ./gradlew assembleRelease"
echo "4. For production, use environment variables instead of gradle.properties"
echo ""
echo "🔧 Production Environment Variables:"
echo "export KEYSTORE_PATH=smart-community-release.keystore"
echo "export KEYSTORE_PASSWORD=your_secure_password"
echo "export KEY_ALIAS=smart-community"
echo "export KEY_PASSWORD=your_secure_password"
