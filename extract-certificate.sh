#!/bin/bash

echo "🔑 Certificate Extractor for Google Play AAB/APK"
echo "=================================================="
echo ""

# Check if file was provided
if [ -z "$1" ]; then
    echo "Usage: $0 <path-to-aab-or-apk>"
    echo ""
    echo "Example:"
    echo "  $0 ~/Downloads/app-release.aab"
    echo "  $0 ~/Desktop/old-release.apk"
    exit 1
fi

FILE="$1"

# Check if file exists
if [ ! -f "$FILE" ]; then
    echo "❌ Error: File not found: $FILE"
    exit 1
fi

echo "📦 Analyzing file: $FILE"
echo ""

# Check file type and extract accordingly
if [[ "$FILE" == *.aab ]]; then
    echo "📱 Detected: Android App Bundle (AAB)"
    echo "   Extracting certificate..."
    
    # Create temp directory
    TMP_DIR=$(mktemp -d)
    cd "$TMP_DIR"
    
    # Unzip the AAB
    unzip -q "$FILE" META-INF/*.RSA 2>/dev/null || unzip -q "$FILE" META-INF/*.DSA 2>/dev/null || unzip -q "$FILE" META-INF/*.EC 2>/dev/null
    
    # Find certificate files
    CERT_FILE=$(find META-INF -name "*.RSA" -o -name "*.DSA" -o -name "*.EC" 2>/dev/null | head -1)
    
    if [ -z "$CERT_FILE" ]; then
        echo "❌ Could not find certificate in AAB"
        rm -rf "$TMP_DIR"
        exit 1
    fi
    
    echo "✅ Found certificate: $CERT_FILE"
    echo ""
    
    # Extract certificate info
    keytool -printcert -file "$CERT_FILE"
    
    # Cleanup
    cd -
    rm -rf "$TMP_DIR"
    
elif [[ "$FILE" == *.apk ]]; then
    echo "📱 Detected: Android APK"
    echo "   Extracting certificate..."
    
    # Extract certificate info directly
    keytool -printcert -jarfile "$FILE"
    
else
    echo "❌ Error: File must be .aab or .apk"
    echo "   Got: $FILE"
    exit 1
fi

echo ""
echo "✅ Certificate extraction complete!"
echo ""
echo "📋 Summary:"
echo "   Look for the 'Certificate fingerprints' section above"
echo "   The SHA1 is what Google Play Console expects"
echo ""

