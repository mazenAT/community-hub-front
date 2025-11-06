# 🚀 iOS CI/CD Release Guide

This guide will help you set up automated iOS releases using GitHub Actions.

## 📋 Prerequisites

1. **Apple Developer Account** ($99/year)
   - Active Apple Developer Program membership
   - App ID created in Apple Developer Portal
   - Provisioning Profile for App Store distribution

2. **App Store Connect API Key** (Recommended)
   - OR App-Specific Password for App Store Connect
   - OR use Xcode Cloud (alternative)

3. **GitHub Repository**
   - Repository with push access
   - GitHub Actions enabled

## 🔑 Required GitHub Secrets

You need to add these secrets to your GitHub repository:
- **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Required Secrets:

#### 1. **APPLE_TEAM_ID**
- Your Apple Developer Team ID
- Find it at: https://developer.apple.com/account/
- Example: `ABC123DEF4`

#### 2. **APPLE_APPLE_ID**
- Your Apple ID email used for App Store Connect
- Example: `your-email@example.com`

#### 3. **APPLE_APP_SPECIFIC_PASSWORD**
- App-specific password for App Store Connect
- Create at: https://appleid.apple.com/account/manage
- **Security** → **App-Specific Passwords** → **Generate Password**
- Label it: "GitHub Actions iOS Release"

#### 4. **APPLE_CERTIFICATE_BASE64** (For Manual Signing)
- Your distribution certificate in base64 format
- Export from Keychain Access as `.p12` file
- Convert to base64:
  ```bash
  base64 -i Certificate.p12 -o certificate_base64.txt
  ```

#### 5. **APPLE_CERTIFICATE_PASSWORD**
- Password you used when exporting the `.p12` certificate

#### 6. **KEYCHAIN_PASSWORD**
- Temporary password for GitHub Actions keychain
- Any secure random string (e.g., use password generator)

#### 7. **APPLE_PROVISIONING_PROFILE_BASE64** (For Manual Signing)
- Your App Store provisioning profile in base64 format
- Download from Apple Developer Portal
- Convert to base64:
  ```bash
  base64 -i profile.mobileprovision -o profile_base64.txt
  ```

#### 8. **PROVISIONING_PROFILE_NAME**
- Name of your provisioning profile (as shown in Xcode)
- Example: `Smart Community App Store`

#### 9. **APPLE_DEVELOPER_ID** (Optional)
- Your Apple Developer account username (if different from APPLE_ID)

## 📝 Setup Steps

### Step 1: Create Export Options File

1. Update `ios/ExportOptions.plist`:
   ```xml
   <key>teamID</key>
   <string>YOUR_TEAM_ID</string>  <!-- Replace with your Team ID -->
   
   <key>provisioningProfiles</key>
   <dict>
       <key>com.smartcommunity.app</key>
       <string>YOUR_PROVISIONING_PROFILE_NAME</string>  <!-- Replace with your profile name -->
   </dict>
   ```

### Step 2: Configure Workflow

The workflow is located at: `.github/workflows/ios-release.yml`

**Default configuration:**
- Triggers on tags: `ios-v*.*.*` (e.g., `ios-v1.0.0`)
- Manual trigger available via GitHub Actions UI
- Uses Xcode 15.0 (update if needed)
- Runs on macOS-14 runner

**To update Xcode version:**
```yaml
XCODE_VERSION: '15.0'  # Change to your required version
```

### Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret listed above

## 🚀 How to Trigger iOS Release

### Option 1: Using Git Tags (Recommended)

```bash
# Create and push a tag
git tag ios-v1.0.0
git push origin ios-v1.0.0
```

The workflow will automatically:
1. Extract version from tag (`1.0.0`)
2. Use timestamp as build number
3. Build and upload to TestFlight

### Option 2: Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **iOS Release** workflow
3. Click **Run workflow**
4. Fill in:
   - **Version**: `1.0.0`
   - **Build number**: `1`
5. Click **Run workflow**

### Option 3: Using GitHub CLI

```bash
gh workflow run ios-release.yml \
  -f version=1.0.0 \
  -f build_number=1
```

## 📦 Build Output

After the workflow completes:

1. **IPA file** will be uploaded as an artifact
   - Download from **Actions** → **Workflow run** → **Artifacts**
   - Valid for 30 days

2. **TestFlight Upload** (if configured)
   - App will be uploaded to App Store Connect
   - Available in TestFlight for testing
   - Wait 5-30 minutes for processing

## 🔄 Workflow Steps Breakdown

1. ✅ **Checkout** - Gets the code
2. ✅ **Setup Node.js** - Installs Node.js and npm
3. ✅ **Install Dependencies** - Runs `npm ci`
4. ✅ **Build Web App** - Runs `npm run build`
5. ✅ **Sync Capacitor iOS** - Syncs web build to iOS project
6. ✅ **Setup Xcode** - Installs required Xcode version
7. ✅ **Update Version** - Sets version and build number in Info.plist
8. ✅ **Install Certificate** - Sets up code signing certificate
9. ✅ **Install Provisioning Profile** - Installs distribution profile
10. ✅ **Build Archive** - Creates Xcode archive
11. ✅ **Export IPA** - Exports signed IPA file
12. ✅ **Upload to TestFlight** - Uploads to App Store Connect
13. ✅ **Upload Artifact** - Saves IPA as GitHub artifact

## 🛠️ Troubleshooting

### Issue: Certificate Import Fails

**Solution:**
- Ensure certificate is exported as `.p12` with private key
- Check that certificate password is correct
- Verify certificate is valid (not expired)

### Issue: Provisioning Profile Not Found

**Solution:**
- Check that profile name matches exactly (case-sensitive)
- Ensure profile is for App Store distribution
- Verify profile is for correct Bundle ID (`com.smartcommunity.app`)

### Issue: Build Fails with Signing Error

**Solution:**
- Verify Team ID is correct
- Check that certificate matches provisioning profile
- Ensure all secrets are set correctly

### Issue: Upload to TestFlight Fails

**Solution:**
- Check App-Specific Password is correct
- Verify Apple ID has App Manager or Admin role
- Ensure app exists in App Store Connect

### Issue: Workflow Times Out

**Solution:**
- Increase timeout in workflow (currently 60 minutes)
- Check runner availability (macOS runners can be limited)
- Optimize build process

## 🔐 Alternative: Using Fastlane (Recommended for Advanced Users)

For more control and features, consider using Fastlane:

1. Install Fastlane:
   ```bash
   sudo gem install fastlane
   ```

2. Initialize Fastlane in iOS project:
   ```bash
   cd ios/App
   fastlane init
   ```

3. Configure Fastlane for App Store:
   - Edit `Fastfile`
   - Add match or manual signing
   - Configure upload to TestFlight

4. Update workflow to use Fastlane:
   ```yaml
   - name: 🚀 Fastlane Release
     run: |
       cd ios/App
       fastlane release
   ```

## 📱 Next Steps After Release

1. **TestFlight Testing**
   - Wait for processing (5-30 minutes)
   - Add internal/external testers
   - Test the app thoroughly

2. **App Store Submission**
   - Create App Store listing (if first release)
   - Add screenshots and descriptions
   - Submit for review

3. **Release Notes**
   - Document changes in App Store Connect
   - Communicate updates to users

## 📚 Useful Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Apple Developer Portal](https://developer.apple.com/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Xcode Archive Guide](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)

## ✅ Checklist

Before first release:

- [ ] Apple Developer Account active
- [ ] App ID created in Apple Developer Portal
- [ ] Provisioning Profile created for App Store
- [ ] Distribution Certificate exported and base64 encoded
- [ ] All GitHub Secrets configured
- [ ] ExportOptions.plist updated with Team ID and profile name
- [ ] Workflow tested with manual trigger
- [ ] TestFlight access verified

## 🎯 Quick Start Commands

```bash
# Tag and release (recommended)
git tag ios-v1.0.0
git push origin ios-v1.0.0

# Manual workflow trigger via GitHub UI
# Actions → iOS Release → Run workflow

# Check workflow status
gh run list --workflow=ios-release.yml

# Download IPA artifact
gh run download <run-id> -n ios-app-*
```

---

**Ready to release?** Just push a tag or trigger manually! 🚀

