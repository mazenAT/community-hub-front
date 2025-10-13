# Paymob Payment Integration

This document outlines the frontend implementation of Paymob payment integration for the smart community app, replacing the previous Fawry payment system.

## Overview

The Paymob integration provides two payment methods:
1. **Credit/Debit Card** - Secure card payments via Paymob's iframe
2. **Mobile Wallet** - Payments via Vodafone Cash, Orange Money, etc.

## Components Created/Updated

### New Components

1. **AmountSelector** (`src/components/AmountSelector.tsx`)
   - Allows users to select predefined amounts or enter custom amounts
   - Provides a clean interface for amount selection

2. **PaymentMethodSelector** (`src/components/PaymentMethodSelector.tsx`)
   - Displays available Paymob payment methods
   - Shows card and mobile wallet options with descriptions

3. **PaymentForm** (`src/components/PaymentForm.tsx`)
   - Collects billing information required by Paymob
   - Includes all necessary fields for payment processing

4. **PaymentCallback** (`src/pages/wallet/PaymentCallback.tsx`)
   - Handles payment success/failure callbacks
   - Redirects users back to wallet after payment completion

5. **TransactionHistory** (`src/components/TransactionHistory.tsx`)
   - Displays transaction history with Paymob payment method support
   - Shows payment method details and status

### Updated Components

1. **Wallet** (`src/pages/Wallet.tsx`)
   - Updated recharge button to use Recharge component
   - Integrated TransactionHistory component

2. **RechargeHistory** (`src/pages/wallet/RechargeHistory.tsx`)
   - Updated to show Paymob payment methods instead of Fawry
   - Updated navigation to use new recharge flow

3. **App** (`src/App.tsx`)
   - Added route for PaymentCallback
   - Updated routing structure

## API Integration

### Updated API Services

The `walletApi` in `src/services/api.ts` now includes:

```typescript
recharge: (data: { 
  amount: number; 
  payment_method: string; 
  payment_details: {
    order_id: string;
    item_name: string;
    description: string;
    billing_data: any;
  }
}) => api.post('/wallet/recharge', data)
```

### Payment Flow

1. **Amount Selection**: User selects or enters recharge amount
2. **Payment Method**: User chooses between card or mobile wallet
3. **Billing Information**: User provides required billing details
4. **Payment Processing**: System redirects to Paymob payment page
5. **Callback Handling**: Payment success/failure is handled via callback URL

## Type Definitions

New types are defined in `src/types/payment.ts`:

- `PaymentMethod`: Defines available payment methods
- `BillingData`: Required billing information structure
- `PaymentRequest`: Payment request payload
- `PaymentResponse`: Payment response structure
- `RechargeRecord`: Transaction record structure

## Environment Configuration

The `.env` file includes Paymob configuration:

```env
VITE_API_URL=http://localhost:8000/api
VITE_PAYMOB_CARD_INTEGRATION_ID=5301230
VITE_PAYMOB_WALLET_INTEGRATION_ID=5301229
```

## Routes

New routes added:

- `/recharge` - Recharge flow with Paymob integration (uses Recharge.tsx component)
- `/payment/callback` - Payment callback handler
- `/payment/success` - Payment success page with auto-redirect to wallet

## Features

### Payment Methods
- **Credit/Debit Card**: Secure iframe-based card payments
- **Mobile Wallet**: Support for Egyptian mobile wallets

### Billing Data Collection
- Complete billing information collection
- Required fields: name, email, phone, address details
- Form validation and error handling

### Transaction Management
- Real-time transaction status updates
- Payment method identification
- Transaction history with Paymob details

### Error Handling
- Comprehensive error handling for payment failures
- User-friendly error messages
- Fallback options for failed payments

## Security Considerations

1. **Billing Data**: All billing data is securely transmitted to the backend
2. **Payment Processing**: Actual payment processing is handled by Paymob's secure infrastructure
3. **Token Management**: Authentication tokens are properly managed
4. **Callback Security**: Payment callbacks are validated server-side

## Testing

To test the Paymob integration:

1. Start the development server
2. Navigate to `/recharge` or click "Recharge" from the wallet page
3. Follow the payment flow
4. Test both card and mobile wallet options
5. Verify callback handling and auto-redirect to wallet

## Backend Requirements

The frontend expects the backend to:

1. Handle `/wallet/recharge` endpoint for payment initiation
2. Return Paymob payment URL in response
3. Process payment callbacks at `/payment/callback`
4. Update wallet balance upon successful payment
5. Store transaction records with Paymob details

## Migration from Fawry

The migration from Fawry to Paymob includes:

1. **Removed**: All Fawry-specific payment components
2. **Added**: Paymob payment integration components
3. **Updated**: Transaction display to show Paymob payment methods
4. **Enhanced**: Billing data collection for Paymob requirements

## Future Enhancements

Potential future improvements:

1. **Saved Payment Methods**: Allow users to save payment methods
2. **Recurring Payments**: Support for automatic wallet top-ups
3. **Payment Analytics**: Enhanced transaction analytics
4. **Multi-currency**: Support for multiple currencies
5. **Payment Notifications**: Real-time payment status notifications