# 🔑 Change Signing Key in Google Play Console

## ✅ Perfect Solution!

You found the **"Change signing key"** link in Google Play Console. This is the right way to fix your keystore mismatch!

## Step-by-Step Instructions

### Step 1: Click "Change signing key"

1. In Google Play Console, on the "Create internal testing release" page
2. Click the **"Change signing key"** link (it's in blue, in the "App integrity" section)
3. This will take you to the signing key management page

### Step 2: Review Current Status

You'll see:
- **Current upload key certificate** (the one Google expects)
- **App signing key certificate** (managed by Google Play)
- Options to reset or change the upload key

### Step 3: Generate Upload Certificate

Google will want you to generate a new upload certificate from your keystore:

```bash
# Run this command with your current keystore
cd smart-community-app/android

keytool -export -rfc -keystore smart-community-release.keystore \
  -alias smart-community -file upload_certificate.pem \
  -storepass 123456
```

This creates `upload_certificate.pem` file that you'll upload to Google Play.

### Step 4: Upload the Certificate

1. In Google Play Console, follow the steps to upload your new certificate
2. You'll upload the `upload_certificate.pem` file
3. Google will verify it
4. Once approved, you can use your new keystore for future uploads

### Step 5: Re-upload Your AAB

After Google approves the new signing key:

1. Your current AAB file should work
2. Or rebuild if needed:
   ```bash
   cd smart-community-app/android
   ./gradlew bundleRelease
   ```
3. Upload the AAB again to Internal Testing

---

## Alternative: Quick Reset (If Available)

Some apps have a simpler option:

1. Look for **"Request upload key reset"** button
2. Click it
3. Follow Google's instructions (may involve email verification)
4. Google will generate a new upload key for you
5. Download the new upload certificate
6. Sign your app with it

---

## What Happens After Changing Signing Key

✅ You can upload apps signed with your NEW keystore (`smart-community-release.keystore`)  
✅ Google Play manages the app signing key internally  
✅ All future updates must use your new upload key  
⚠️ You MUST keep your new keystore safe - you'll need it for all future updates!

---

## Important Notes

### Save Your New Setup

After successfully changing the signing key, document:

```
Upload Keystore: smart-community-release.keystore
Location: smart-community-app/android/smart-community-release.keystore
Store Password: 123456
Key Alias: smart-community
Key Password: 123456

⚠️ BACKUP THIS KEYSTORE - Required for all future updates!
```

### Backup Your Keystore

```bash
# Copy to a safe location
cp smart-community-release.keystore ~/Desktop/BACKUP_SMART_COMMUNITY_KEYSTORE.keystore

# Also copy the certificate
cp upload_certificate.pem ~/Desktop/BACKUP_upload_certificate.pem
```

### Future Updates

After the signing key change is approved, all future uploads must use the same keystore:

```bash
# This is how you'll build future updates:
cd smart-community-app/android
./gradlew bundleRelease  # Uses the upload keystore automatically
```

---

## Troubleshooting

### If "Change signing key" is disabled:

- You may need to contact Google Play support
- Or if this is your first upload, try creating a fresh app listing

### If upload fails after key change:

- Wait a few hours for Google's systems to update
- Make sure you're using the EXACT keystore with password 123456
- Double-check the keystore file hasn't been corrupted

---

## Next Steps After Key Change

1. ✅ Complete the "Change signing key" process
2. ✅ Wait for Google approval (can take hours to a day)
3. ✅ Upload your AAB file again
4. ✅ Complete the release creation
5. ✅ Add internal testers
6. ✅ Publish to internal testing
7. ✅ Test your app
8. ✅ Promote to production when ready

---

## Summary

**You found the solution!** The "Change signing key" option in Google Play Console is exactly what you need. Follow the steps above to:

1. Click "Change signing key"
2. Upload your certificate
3. Get approved
4. Upload your AAB
5. Proceed with internal testing

Good luck! 🚀

