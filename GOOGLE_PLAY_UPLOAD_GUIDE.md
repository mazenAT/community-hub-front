# 📱 Google Play Console Upload Guide

## ✅ Production Build Ready!

Your Android App Bundle (AAB) is ready for Google Play Console upload.

### File Location:
```
Location: /home/mazen/freelance/smart-community/smart-community-app/android/app/build/outputs/bundle/release/app-release.aab
Desktop Copy: ~/Desktop/Smart-Community-Production.aab
```

**File Size:** 2.9 MB  
**Build Type:** Release (Production)  
**Signed:** ✅ Yes (smart-community-release.keystore)

---

## 📋 Upload to Google Play Console

### Step 1: Login to Google Play Console

1. Go to: https://play.google.com/console
2. Sign in with your Google account
3. Select your app (or create a new one)

### Step 2: Navigate to Production

1. In your app dashboard, click **"Release"** in the left menu
2. Click **"Production"**
3. Click **"Create new release"** (or "Edit release")

### Step 3: Upload the AAB

1. Click **"Upload"** under "App bundles and APKs"
2. Select the file: **`~/Desktop/Smart-Community-Production.aab`**
3. Wait for upload to complete

### Step 4: Fill Required Information

**App Releases:**

1. **Version name:** `1.0.5` (or increment to `1.0.6`)
2. **Release name:** (optional) e.g., "Initial Production Release"

**Content rating:**
- Fill out the questionnaire
- Select appropriate age ratings

**Store listing:**
- App name: Smart Community (or Lite Bite)
- Short description: Parent meal management app
- Full description: (you already have this)
- Screenshots: Upload app screenshots

**Pricing and distribution:**
- Select "Free" or set a price
- Select countries for distribution
- Accept the content rating

### Step 5: Review and Rollout

1. Review all information
2. Click **"Review release"**
3. If everything looks good, click **"Start rollout to Production"**

---

## 🔐 Keystore Information

**Important!** Save these credentials - you'll need them for future updates:

### Keystore Details:
```
Keystore File: smart-community-release.keystore
Location: smart-community-app/android/smart-community-release.keystore

Store Password: 123456
Key Alias: smart-community
Key Password: 123456

Validity: 10,000 days (~27 years)
Key Algorithm: RSA 2048-bit
```

### ⚠️ CRITICAL: Backup Your Keystore!

**You MUST backup your keystore file!** If you lose it, you cannot update your app on Google Play.

```bash
# Backup command:
cp smart-community-release.keystore ~/Desktop/SMART_COMMUNITY_KEYSTORE_BACKUP.keystore

# Also save the passwords somewhere secure!
# Use a password manager or secure document
```

### Future Updates

When you want to upload a new version:

```bash
cd smart-community-app

# 1. Update version in android/app/build.gradle
#    versionCode 7 (increment)
#    versionName "1.0.6" (increment)

# 2. Build new bundle
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease

# 3. Upload new AAB to Google Play Console
```

---

## 📊 App Information for Google Play Console

### App Details:
- **Package Name:** `com.smartcommunity.app`
- **Current Version:** 1.0.5
- **Version Code:** 6
- **App ID:** com.smartcommunity.app

### API Configuration:
✅ **Backend:** Railway Production  
✅ **URL:** https://community-hub-backend-production.up.railway.app/api  
✅ **Environment:** Production  
✅ **Signed:** Yes  

### Required for First Upload:

1. **App Icon** (1024x1024 PNG)
2. **Feature Graphic** (1024x500 PNG) 
3. **Screenshots** (Phone, 7-inch tablet, 10-inch tablet)
4. **Privacy Policy** (URL or text)
5. **Content Rating** (ESRB questionnaire)

### App Permissions:
- Internet (required)
- Network state
- Camera (for profile photos)
- Storage (for downloads)
- Location (optional, if used)

---

## 🚀 Testing Before Release

### Internal Testing Track (Recommended):

Before releasing to production:

1. In Google Play Console, go to **"Internal testing"**
2. Upload the same AAB
3. Add testers (your email, team emails)
4. Test the app thoroughly
5. Then promote to "Production"

### Testing Checklist:

- [ ] App opens without crashing
- [ ] Schools list loads correctly
- [ ] Login/Registration works
- [ ] Meal planner displays meals
- [ ] Wallet recharging works
- [ ] Orders can be created
- [ ] Notifications work (if enabled)
- [ ] Profile updates work
- [ ] All screens navigable
- [ ] No console errors

---

## 📝 Next Steps

### Before Publishing:

1. **Test on real device** (you already have the debug build)
2. **Verify all features** work with Railway backend
3. **Take screenshots** for store listing
4. **Create app icons** (see APP_STORE_ASSETS.md)
5. **Write store description**
6. **Set up privacy policy** (you already have PRIVACY_POLICY.md)

### Publishing Checklist:

- [ ] AAB file uploaded
- [ ] App icon and screenshots added
- [ ] Store description completed
- [ ] Privacy policy URL provided
- [ ] Content rating completed
- [ ] App category selected
- [ ] Pricing set
- [ ] Countries selected
- [ ] All sections reviewed
- [ ] Ready to publish!

---

## 🔧 If You Need to Change the API URL Later

If you need to point to a different backend:

1. **Update `.env` file:**
   ```bash
   VITE_API_URL=https://your-new-backend.com/api
   ```

2. **Rebuild:**
   ```bash
   npm run build
   npx cap sync android
   cd android && ./gradlew bundleRelease
   ```

3. **Update version and upload new AAB**

---

## 📞 Support

If you encounter issues during upload:

1. Check [Google Play Console Help](https://support.google.com/googleplay/android-developer)
2. Verify keystore credentials
3. Check app signing requirements
4. Ensure all required fields are completed

---

## ✅ Summary

**File to Upload:** `~/Desktop/Smart-Community-Production.aab`

**Next Steps:**
1. Upload AAB to Google Play Console
2. Complete app listing information
3. Fill out content rating
4. Add screenshots and icon
5. Submit for review
6. Wait for approval (can take 1-7 days)
7. Release to production!

**Good luck with your app launch! 🚀**



