# Razorpay Payment Integration - Setup & Testing Guide

## Overview
This guide walks you through setting up Razorpay for the AgriChain platform and testing the payment routes that are already implemented in the backend.

---

## STEP 1: Create Razorpay Account

### 1.1 Sign Up
1. Go to https://razorpay.com
2. Click **"Sign Up"** (top right)
3. Enter your email and password
4. Verify email
5. Complete business registration (you can use test information for now)

### 1.2 Access API Keys
1. Log in to https://dashboard.razorpay.com
2. Click on **Account Settings** (gear icon, top right)
3. Click **API Keys** (left sidebar)
4. You'll see two keys:
   - **Key ID** (starts with `rzp_test_` or `rzp_live_`)
   - **Key Secret** (long alpha-numeric string)

### 1.3 Get Account ID
1. From dashboard, click **Settings** → **Account Settings**
2. Find your **Account ID** (looks like `acc_1234567890abc`)
3. Or from API Keys page, look for "Account ID"

---

## STEP 2: Configure .env File

### 2.1 Update Backend .env
Open `/unified-backend/.env` and update the Razorpay section:

```env
# ==================== RAZORPAY CONFIGURATION ====================
# Get these from: https://dashboard.razorpay.com/
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX          # ← Replace with your Key ID
RAZORPAY_KEY_SECRET=XXXXXXXXXXXX               # ← Replace with your Key Secret
RAZORPAY_ACCOUNT_ID=acc_XXXXXXXXXXXX           # ← Replace with your Account ID
RAZORPAY_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX     # ← Get from Webhooks page
```

### 2.2 Generate Webhook Secret
1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click **+ Add New Webhook**
3. Enter URL: `http://localhost:8000/api/payments/webhook`
4. Select events:
   - `payment.authorized`
   - `payment.failed`
   - `transfer.settled`
5. Click **Create Webhook**
6. Copy the **Webhook Secret** and paste into `.env` as `RAZORPAY_WEBHOOK_SECRET`

### 2.3 Save .env
After updating all values, save the file.

---

## STEP 3: Restart Backend Server

```powershell
cd "c:\Users\Shriyansh Mishra\Documents\Codes\Projects\P\unified-backend"
npm start
```

Expected output:
```
✓ Connected to MongoDB
Port: 8000
Environment: development
```

---

## STEP 4: Test Payment Routes

### 4.1 Test Create Order Endpoint

**Endpoint:** `POST /api/payments/create-order`

**Request:**
```bash
curl -X POST http://localhost:8000/api/payments/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "escrowId": "650a1b2c3d4e5f6g7h8i9j0k",
    "amount": 5000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "orderId": "order_1234567890abcdef",
  "keyId": "rzp_test_XXXXXXXXXXXX",
  "amount": 500000,
  "currency": "INR",
  "receipt": "650a1b2c3d4e5f6g7h8i9j0k"
}
```

### 4.2 Test Verify Payment Endpoint

**Endpoint:** `POST /api/payments/verify-payment`

After completing payment in Razorpay UI, you'll get:
- `payment_id`
- `signature`

**Request:**
```bash
curl -X POST http://localhost:8000/api/payments/verify-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderId": "order_1234567890abcdef",
    "paymentId": "pay_1234567890abcdef",
    "signature": "signature_from_razorpay"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "verified": true,
  "message": "Payment verified and escrow funded",
  "transaction": {
    "_id": "transaction_id",
    "status": "funded",
    "razorpayOrderId": "order_1234567890abcdef",
    "razorpayPaymentId": "pay_1234567890abcdef"
  }
}
```

### 4.3 Test KYC Bank Account Linking

**Endpoint:** `POST /api/kyc/link-bank-account`

**Request:**
```bash
curl -X POST http://localhost:8000/api/kyc/link-bank-account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SELLER_JWT_TOKEN" \
  -d '{
    "accountHolderName": "Farmer John",
    "accountNumber": "1234567890123456",
    "ifscCode": "SBIN0001234",
    "accountType": "savings"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Bank account linked successfully",
  "accountId": "linked_account_id",
  "kycStatus": "pending",
  "bankDetails": {
    "holderName": "Farmer John",
    "accountLast4": "3456",
    "ifscCode": "SBIN0001234",
    "accountType": "savings"
  }
}
```

---

## STEP 5: Using Postman (Recommended for Testing)

### 5.1 Create New Request
1. Open **Postman** (download from postman.com if you don't have it)
2. Create a new **POST** request

### 5.2 Set Headers
- Key: `Content-Type` → Value: `application/json`
- Key: `Authorization` → Value: `Bearer YOUR_JWT_TOKEN`

### 5.3 Set Body (raw JSON)
```json
{
  "escrowId": "YOUR_ESCROW_ID",
  "amount": 5000
}
```

### 5.4 Send Request
Click **Send** to test the endpoint.

---

## STEP 6: Using Test Payment Method

### 6.1 Complete Payment Flow in Frontend

When testing on frontend:
1. Customer adds item to listing
2. Buyer clicks "Buy" → goes to payment page
3. Payment page calls `/api/payments/create-order`
4. Razorpay checkout opens
5. Use test card: **4111 1111 1111 1111**
   - Expiry: Any future date (e.g., 12/25)
   - CVV: Any 3 digits (e.g., 123)
6. Complete payment
7. Frontend receives `payment_id` and `signature`
8. Frontend calls `/api/payments/verify-payment`
9. Backend verifies and updates escrow

### 6.2 Test Cards
| Card Number | Result |
|-------------|--------|
| 4111 1111 1111 1111 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 0069 | 3D Secure |

---

## STEP 7: Troubleshooting

### Issue: "RAZORPAY_KEY_ID is undefined"
**Solution:** Make sure you restarted the server after updating .env
```powershell
# Stop current server (Ctrl+C)
# Then restart
npm start
```

### Issue: "Invalid API Key"
**Solution:** 
1. Verify you're using TEST keys (starts with `rzp_test_`)
2. Copy-paste directly from Razorpay dashboard (no extra spaces)
3. Check that KEY_ID and KEY_SECRET are both present

### Issue: "Signature Verification Failed"
**Solution:**
1. Ensure webhook secret is correctly set in .env
2. Verify the payment ID and order ID are correct
3. Check that signature format matches Razorpay spec

### Issue: "CORS error in frontend"
**Solution:**
1. Make sure server is running on http://localhost:8000
2. Check FRONTEND_URL in .env is http://localhost:3000
3. Ensure CORS middleware is enabled in server.js

### Issue: "MongoDB connection error"
**Solution:**
1. Ensure MongoDB is running locally on port 27017
2. Or update DB_URI in .env to your MongoDB cloud connection

---

## STEP 8: Security Considerations

### 8.1 Never Commit Real Credentials
- `.env` file should NOT be committed to Git
- Add `.env` to `.gitignore` if not already there
- Use environment variables in production

### 8.2 Use Test Keys First
- Always test with `rzp_test_` keys before using `rzp_live_` keys
- Never use production keys in development

### 8.3 Webhook Validation
- Always verify webhook signatures before processing
- Route already does this automatically in `/api/payments/webhook`

### 8.4 Bank Account Security
- Bank account details are encrypted in database
- Only last 4 digits shown in frontend
- Full details only visible to seller during linking

---

## STEP 9: Backend Route Details

### Payment Routes Created

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/payments/create-order` | POST | Create Razorpay order |
| `/api/payments/verify-payment` | POST | Verify payment signature |
| `/api/payments/release-funds` | POST | Release funds to seller |
| `/api/payments/webhook` | POST | Handle Razorpay events |
| `/api/payments/transactions/:userId` | GET | Fetch user transactions |

### KYC Routes Created

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/kyc/link-bank-account` | POST | Link seller bank account |
| `/api/kyc/verify-otp` | POST | Verify OTP for bank account |
| `/api/kyc/status` | GET | Check KYC status |
| `/api/kyc/update-bank-account` | PUT | Update bank details |

---

## STEP 10: Complete Payment Flow Example

### Buyer Perspective:
1. **Login** → Get JWT token
2. **Browse listings** → See farmer products
3. **Click "Buy"** → Goes to checkout
4. **System calls** `/api/payments/create-order`
   - Response: Razorpay order ID + Key ID
5. **Razorpay checkout opens** → Buyer enters card details
6. **After payment** → Gets payment ID and signature
7. **System calls** `/api/payments/verify-payment`
   - Backend verifies signature with Razorpay
8. **Funds held in escrow** → Status changes to "funded"
9. **Auto-release in 5 days** OR after seller confirms delivery

### Seller Perspective:
1. **Account setup** → Completes KYC
2. **Link bank account** → Calls `/api/kyc/link-bank-account`
3. **Verify bank account** → OTP verification
4. **Receive payment** → When buyer confirms delivery, system calls `/api/payments/release-funds`
5. **Money transferred** → Direct bank transfer to linked account

---

## STEP 11: Next Steps After Testing

After successful payment route testing:

1. **Create Frontend Payment Component**
   - UI for Razorpay checkout
   - MetaMask wallet integration (optional)
   - Order review screen

2. **Deploy Smart Contract**
   - Connect to Polygon Mumbai testnet
   - Record transactions on blockchain
   - Test contract functions

3. **Set Up Automation**
   - Cron jobs for auto-release
   - Email notifications
   - Review reminders

4. **Production Deployment**
   - Switch to live Razorpay keys
   - Deploy to production servers
   - Setup monitoring and alerts

---

## Quick Reference

```bash
# Install dependencies
cd unified-backend
npm install razorpay

# Start backend
npm start

# Test endpoint (with curl)
curl -X POST http://localhost:8000/api/payments/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"escrowId":"xxx","amount":5000}'

# Check if routes are registered
curl http://localhost:8000/api/payments/transactions/YOUR_USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Support

For issues or questions:
1. Check logs in terminal where `npm start` is running
2. Verify all .env values are correct
3. Ensure MongoDB is running
4. Check Razorpay dashboard for webhook events
5. Review backend route files for error messages

**Razorpay Documentation:** https://razorpay.com/docs/
**Smart Contract Audit:** Coming in Phase 2

