# Smart Community App Tutorial System Guide

## 🎯 **Overview**

The Smart Community app includes a comprehensive in-app tutorial system that guides new users through all features after they sign in and add family members. The tutorial automatically appears and can be restarted anytime.

## 🚀 **How It Works**

### **1. Automatic Trigger**
- Tutorial starts automatically after user completes family member setup
- Triggered by setting `has-family-members` to `true` in secure storage
- Only shows for first-time users

### **2. Tutorial Flow**
The tutorial covers 11 key steps:

1. **Welcome** - Introduction to the app
2. **Wallet Overview** - Understanding the digital wallet
3. **Add Money** - How to recharge the wallet
4. **Payment Methods** - Paymob payment options (Card & Mobile Wallet)
5. **Card Payments** - Credit/Debit card payment tutorial
6. **Mobile Wallet** - Mobile wallet payment tutorial
7. **Transactions** - Viewing transaction history
8. **Meal Planning** - Introduction to meal planning
9. **Order Meals** - How to order meals
10. **Family Members** - Managing family profiles
11. **Profile & Settings** - Customizing the app
12. **Support** - Getting help

### **3. Interactive Elements**
- **Highlighted Elements**: Orange glow around current feature
- **Tooltips**: Contextual information and instructions
- **Progress Bar**: Shows completion status
- **Navigation**: Previous/Next buttons for step control
- **Payment Method Selection**: Interactive payment method tutorials
- **Security Indicators**: Visual cues for secure payment processing

## 🛠 **Components**

### **TutorialContext** (`src/contexts/TutorialContext.tsx`)
- Manages tutorial state and progress
- Handles storage of tutorial completion
- Provides tutorial control functions

### **TutorialOverlay** (`src/components/TutorialOverlay.tsx`)
- Main tutorial interface
- Highlights target elements
- Shows tooltips and navigation

### **TutorialTrigger** (`src/components/TutorialTrigger.tsx`)
- Button to restart tutorial
- Multiple variants (floating, inline, default)
- Can be placed anywhere in the app

## 📱 **Integration**

### **Adding to App.tsx**
```tsx
import { TutorialProvider } from "@/contexts/TutorialContext";
import TutorialOverlay from "@/components/TutorialOverlay";

const App = () => (
  <TutorialProvider>
    {/* Your app content */}
    <TutorialOverlay />
  </TutorialProvider>
);
```

### **Adding Tutorial Trigger**
```tsx
import TutorialTrigger from "@/components/TutorialTrigger";

// Floating button (recommended for main pages)
<TutorialTrigger variant="floating" />

// Inline button (for specific sections)
<TutorialTrigger variant="inline" />

// Default button (for forms or modals)
<TutorialTrigger />
```

## 🎨 **Customization**

### **Modifying Tutorial Steps**
Edit `defaultTutorialSteps` in `TutorialContext.tsx`:

```tsx
const defaultTutorialSteps: TutorialStep[] = [
  {
    id: 'custom-step',
    title: 'Custom Title',
    description: 'Custom description',
    target: '.css-selector', // CSS selector to highlight
    position: 'top', // tooltip position
    order: 1, // display order
    completed: false,
  },
  // ... more steps
];
```

### **CSS Selectors for Targeting**
Add these classes to elements you want to highlight:

```tsx
// Wallet balance
<div className="wallet-balance">...</div>

// Add money button
<Button className="add-money-btn">...</Button>

// Payment methods
<div className="payment-method-selector">...</div>
<div className="paymob-card-payment">...</div>
<div className="paymob-wallet-payment">...</div>

// Transactions section
<div className="transactions-section">...</div>

// Meal planner
<div className="planner-section">...</div>

// Family members
<div className="family-members">...</div>

// Notifications
<div className="notifications-bell">...</div>

// Profile section
<div className="profile-section">...</div>

// Contact support
<div className="contact-support">...</div>
```

### **Tutorial Positions**
- `top`: Tooltip appears above element
- `bottom`: Tooltip appears below element
- `left`: Tooltip appears to the left
- `right`: Tooltip appears to the right

## 🔧 **Technical Details**

### **Storage Keys**
- `tutorial-progress`: Saves completion status for each step
- `has-family-members`: Triggers tutorial start
- `has-seen-tutorial`: Prevents tutorial from showing again

### **State Management**
- `isTutorialActive`: Controls tutorial visibility
- `currentStepIndex`: Tracks current step
- `tutorialSteps`: Array of all tutorial steps

### **Functions Available**
```tsx
const {
  isTutorialActive,      // Boolean: Is tutorial running?
  currentStep,           // Current step object
  tutorialSteps,         // All tutorial steps
  currentStepIndex,      // Current step number
  startTutorial,         // Start tutorial
  completeStep,          // Complete current step
  skipTutorial,          // Skip entire tutorial
  nextStep,              // Go to next step
  previousStep,          // Go to previous step
  resetTutorial,         // Reset tutorial progress
} = useTutorial();
```

## 💳 **Paymob Payment Tutorial Integration**

### **Payment Method Tutorials**
The tutorial system now includes comprehensive Paymob payment method tutorials:

#### **Card Payment Tutorial**
```tsx
{
  id: 'paymob-card-payment',
  title: 'Card Payments with Paymob 💳',
  description: 'Learn how to pay securely with your credit/debit card:\n\n• Select "Card Payment" from payment options\n• Enter your card details securely\n• Complete billing information\n• Confirm payment and receive instant confirmation',
  target: '[data-tutorial="paymob-card-payment"]',
  position: 'center',
  order: 12,
  completed: false,
  page: 'recharge',
  route: '/recharge',
  highlightElement: true,
  spotlightRadius: 120,
  animation: 'pulse',
  interactive: false,
  paymentMethod: 'paymob_card',
  requiresBilling: true,
  securityLevel: 'high'
}
```

#### **Mobile Wallet Payment Tutorial**
```tsx
{
  id: 'paymob-wallet-payment',
  title: 'Mobile Wallet Payments 📱',
  description: 'Pay using Vodafone Cash, Orange Money, and other wallets:\n\n• Choose "Mobile Wallet" payment method\n• Select your preferred wallet provider\n• Enter wallet phone number\n• Complete payment through wallet app',
  target: '[data-tutorial="paymob-wallet-payment"]',
  position: 'center',
  order: 13,
  completed: false,
  page: 'recharge',
  route: '/recharge',
  highlightElement: true,
  spotlightRadius: 120,
  animation: 'pulse',
  interactive: false,
  paymentMethod: 'paymob_wallet',
  requiresBilling: true,
  securityLevel: 'high'
}
```

### **Payment Tutorial Features**
- **Security Indicators**: Visual cues for secure payment processing
- **Billing Requirements**: Clear indication when billing information is needed
- **Payment Method Validation**: Step validation for payment method selection
- **Analytics Tracking**: Comprehensive tracking of payment tutorial interactions

## 📋 **Adding New Tutorial Steps**

### **1. Define the Step**
```tsx
{
  id: 'new-feature',
  title: 'New Feature',
  description: 'Learn about this new feature',
  target: '.new-feature-selector',
  position: 'bottom',
  order: 11, // After existing steps
  completed: false,
  // Payment-specific properties (optional)
  paymentMethod: 'paymob_card', // or 'paymob_wallet', 'none'
  requiresBilling: false, // true if billing information is required
  securityLevel: 'medium' // 'low', 'medium', 'high'
}
```

### **2. Add CSS Class**
```tsx
<div className="new-feature-selector">
  {/* Your feature content */}
</div>
```

### **3. Update Tutorial Flow**
The step will automatically be included in the tutorial sequence.

## 🎯 **Best Practices**

### **1. Element Targeting**
- Use specific CSS selectors
- Avoid targeting body or generic elements
- Test on different screen sizes

### **2. Content Writing**
- Keep titles short and clear
- Use simple, actionable language
- Include specific instructions

### **3. User Experience**
- Don't overwhelm users with too many steps
- Allow users to skip or restart
- Save progress automatically

### **4. Mobile Optimization**
- Ensure tooltips fit on small screens
- Test touch interactions
- Consider mobile-specific instructions

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Tutorial not starting**
   - Check if `has-family-members` is set to `true`
   - Verify `has-seen-tutorial` is not set

2. **Elements not highlighting**
   - Ensure CSS selectors are correct
   - Check if elements are rendered in DOM
   - Verify element positioning

3. **Tooltip positioning issues**
   - Check viewport dimensions
   - Verify element boundaries
   - Test on different screen sizes

### **Debug Mode**
Add console logs to track tutorial state:

```tsx
useEffect(() => {
  console.log('Tutorial state:', {
    isTutorialActive,
    currentStep,
    currentStepIndex
  });
}, [isTutorialActive, currentStep, currentStepIndex]);
```

## 📚 **Examples**

### **Complete Tutorial Integration**
```tsx
import { useTutorial } from '@/contexts/TutorialContext';
import TutorialTrigger from '@/components/TutorialTrigger';

const MyPage = () => {
  const { isTutorialActive, currentStep } = useTutorial();

  return (
    <div>
      {/* Your page content */}
      <div className="feature-to-highlight">
        This will be highlighted in tutorial
      </div>
      
      {/* Tutorial trigger */}
      <TutorialTrigger variant="inline" />
      
      {/* Tutorial will automatically overlay when active */}
    </div>
  );
};
```

## 🎉 **Conclusion**

The tutorial system provides an engaging way to onboard new users and help them discover all the features of the Smart Community app. It's fully customizable, mobile-optimized, and integrates seamlessly with the existing app architecture.

For questions or customization help, refer to the component files or modify the tutorial steps as needed. 