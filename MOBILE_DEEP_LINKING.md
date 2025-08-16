# 📱 Mobile App Deep Linking Guide

## 🎯 **Overview**

Smart Community mobile app supports deep linking to provide seamless user experience when opening links from emails, notifications, or other apps.

## 🔗 **Deep Link Scheme**

**Primary Scheme:** `smartcommunity://`

**Example URLs:**
```
smartcommunity://reset-password?token=abc123&email=user@example.com
smartcommunity://wallet
smartcommunity://planner
smartcommunity://profile
```

## 📧 **Password Reset Deep Linking**

### **How It Works:**

1. **User requests password reset** → enters email
2. **Backend sends email** with deep link: `smartcommunity://reset-password?token=abc123&email=user@example.com`
3. **User taps email link** → app opens automatically
4. **App navigates** to reset password screen
5. **Token and email** are pre-filled from deep link

### **Email Template:**
```html
<a href="smartcommunity://reset-password?token={{ $token }}&email={{ $user->email }}" class="reset-button">
    Open App & Reset Password
</a>
```

## 🏗️ **Technical Implementation**

### **1. Capacitor Configuration**
```typescript
// capacitor.config.ts
plugins: {
  DeepLinks: {
    appLinks: {
      android: {
        scheme: 'smartcommunity',
        host: 'smartcommunity.com'
      },
      ios: {
        scheme: 'smartcommunity',
        host: 'smartcommunity.com'
      }
    }
  }
}
```

### **2. React Hook**
```typescript
// useDeepLinking.ts
export const useDeepLinking = () => {
  // Handles deep links and navigates to appropriate screens
  // Supports: reset-password, wallet, planner, profile
};
```

### **3. Android Manifest**
```xml
<!-- Deep Link Intent Filter -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="smartcommunity" />
</intent-filter>
```

### **4. iOS Info.plist**
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.smartcommunity.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>smartcommunity</string>
        </array>
    </dict>
</array>
```

## 🎨 **Supported Deep Link Screens**

| Screen | Deep Link | Description |
|--------|------------|-------------|
| **Reset Password** | `smartcommunity://reset-password` | Password reset with token & email |
| **Wallet** | `smartcommunity://wallet` | Open wallet dashboard |
| **Planner** | `smartcommunity://planner` | Open meal planner |
| **Profile** | `smartcommunity://profile` | Open user profile |

## 🔄 **Deep Link Flow**

### **Password Reset Flow:**
```
Email Link → App Opens → Parse URL → Navigate to Reset Password → Pre-fill Data
```

### **General Deep Link Flow:**
```
Deep Link → App Opens → Parse URL → Navigate to Screen → Handle Parameters
```

## 📱 **Mobile App Integration**

### **1. App.tsx Integration**
```typescript
const AppContent = () => {
  // Initialize deep linking for mobile app
  useDeepLinking();
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Your routes */}
      </Routes>
    </BrowserRouter>
  );
};
```

### **2. Component Usage**
```typescript
// ResetPassword.tsx
const ResetPassword = () => {
  const location = useLocation();
  
  useEffect(() => {
    // First check if we have data from deep linking (mobile app)
    if (location.state?.token && location.state?.email) {
      setToken(location.state.token);
      setEmail(location.state.email);
      return;
    }
    
    // Fallback to URL parameters
    // ... existing code
  }, [location.state]);
};
```

## 🧪 **Testing Deep Links**

### **Android Testing:**
```bash
# Test password reset deep link
adb shell am start -W -a android.intent.action.VIEW \
  -d "smartcommunity://reset-password?token=test123&email=test@example.com" \
  com.smartcommunity.app

# Test wallet deep link
adb shell am start -W -a android.intent.action.VIEW \
  -d "smartcommunity://wallet" \
  com.smartcommunity.app
```

### **iOS Testing:**
```bash
# Test password reset deep link
xcrun simctl openurl booted "smartcommunity://reset-password?token=test123&email=test@example.com"

# Test wallet deep link
xcrun simctl openurl booted "smartcommunity://wallet"
```

### **Web Testing (Development):**
```javascript
// In browser console
window.location.href = "smartcommunity://reset-password?token=test123&email=test@example.com";
```

## 🚀 **Production Deployment**

### **1. App Store Submission**
- **No changes needed** - deep linking works automatically
- **App handles URLs** internally without external web hosting
- **Users download app** from stores and deep links work immediately

### **2. Email Configuration**
```env
# Backend .env - no frontend URL needed
# APP_FRONTEND_URL is not used for mobile apps
```

### **3. Deep Link Validation**
- **Test all deep links** before app store submission
- **Verify navigation** works correctly
- **Check parameter parsing** for password reset

## 🔒 **Security Considerations**

### **1. Token Validation**
- **Backend validates** reset tokens before allowing password change
- **Tokens expire** after 24 hours
- **One-time use** - tokens are deleted after use

### **2. Deep Link Security**
- **App-only scheme** - `smartcommunity://` is internal to your app
- **No external access** - deep links don't expose app internals
- **Parameter validation** - all parameters are validated server-side

## 📋 **Implementation Checklist**

### **Backend (Laravel):**
- [x] **EmailService** uses `smartcommunity://` scheme
- [x] **Password reset** generates deep links
- [x] **Welcome emails** use deep links
- [x] **Token validation** and expiration

### **Frontend (React):**
- [x] **useDeepLinking hook** handles deep links
- [x] **ResetPassword component** supports deep link data
- [x] **App.tsx** initializes deep linking
- [x] **Navigation** works for all deep link screens

### **Mobile Configuration:**
- [x] **Capacitor config** with deep linking plugin
- [x] **Android manifest** with intent filters
- [x] **iOS Info.plist** with URL schemes
- [x] **Deep link testing** on both platforms

## 🎉 **Benefits**

### **User Experience:**
- **Seamless password reset** - no manual copying/pasting
- **Direct navigation** to specific app screens
- **Professional email experience** with clickable buttons

### **Developer Experience:**
- **No web hosting required** for mobile apps
- **Unified deep linking** across platforms
- **Easy testing** and debugging

### **Business Benefits:**
- **Higher conversion rates** for password resets
- **Better user engagement** with direct app access
- **Professional appearance** in email communications

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Deep links not working:**
   - Check Capacitor configuration
   - Verify Android manifest and iOS Info.plist
   - Test with adb/xcrun commands

2. **Navigation not working:**
   - Check useDeepLinking hook integration
   - Verify route definitions
   - Check console for errors

3. **Parameters not parsing:**
   - Verify URL format in email templates
   - Check parameter extraction in components
   - Test with different parameter combinations

### **Debug Commands:**
```bash
# Check Capacitor sync
npx @capacitor/cli sync

# Build and test
npm run build:mobile
npx @capacitor/cli run android
npx @capacitor/cli run ios
```

---

## 📚 **Additional Resources**

- [Capacitor Deep Links Documentation](https://capacitorjs.com/docs/guides/deep-links)
- [Android App Links](https://developer.android.com/training/app-links)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [React Router Deep Linking](https://reactrouter.com/docs/en/v6/start/overview)

---

**Your Smart Community app now has enterprise-grade deep linking for seamless mobile experience!** 🚀📱✨ 