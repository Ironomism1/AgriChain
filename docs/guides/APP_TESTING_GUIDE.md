# 🧪 APP TESTING GUIDE - FEATURES & RAZORPAY EXPLANATION

## ✅ SERVERS RUNNING

```
✓ Backend Server:  http://localhost:8000
✓ Frontend App:    http://localhost:3000
✓ MongoDB:         Connected ✓
```

Open your browser and go to: **http://localhost:3000**

---

## ❓ YOUR QUESTIONS ANSWERED

### Q1: "Is Razorpay an Escrow Service?"

**YES - Razorpay IS an Escrow Service!**

Here's how it works:

```
┌──────────────┐
│    BUYER     │
│   Pays ₹500  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│  Razorpay Escrow Account     │ ← Money held HERE
│  (RBI Regulated & Secure)    │
└──────┬───────────────────────┘
       │
       ├─ Money NOT given to seller immediately
       ├─ Money held in escrow for 5 days
       ├─ Buyer can request refund if needed
       │
       ▼
  SELLER DELIVERS
       │
       ▼
  BUYER CONFIRMS DELIVERY
       │
       ▼
  AUTO-RELEASE (5 days)
       │
       ▼
┌──────────────────────────────┐
│  Money Transferred to Seller  │
│  (Direct Bank Transfer)       │
└──────────────────────────────┘
```

**Key Points:**
- ✅ Razorpay **holds the money** (not your app servers)
- ✅ Money held in **secure escrow** (RBI-regulated)
- ✅ Buyer protected if seller doesn't deliver
- ✅ Seller gets paid after delivery confirmed
- ✅ Platform fee (2%) deducted automatically
- ✅ Direct bank transfer to seller's account

---

### Q2: "My Localhost Website Won't Be Approved"

**THIS IS NORMAL & EXPECTED!**

Here's what's happening:

```
┌─────────────────────────────────────────┐
│        Razorpay Approval Process        │
├─────────────────────────────────────────┤
│                                         │
│  TEST PHASE (What you're doing now):    │
│  • Use TEST API keys                    │
│  • No website verification needed       │
│  • Test with test cards                 │
│  • Localhost works fine                 │
│                                         │
│  PRODUCTION PHASE (Later):              │
│  • Get LIVE API keys                    │
│  • Website needs to be live             │
│  • Razorpay reviews your business       │
│  • Takes 24-48 hours                    │
│                                         │
└─────────────────────────────────────────┘
```

**For NOW (Testing):**
```
✅ You DON'T need production approval
✅ Use TEST API keys from Razorpay
✅ Use test cards: 4111 1111 1111 1111
✅ Test everything on localhost
✅ No website needed for testing
```

**For LATER (Production):**
```
⏳ Deploy website to live URL (not localhost)
⏳ Get LIVE API keys from Razorpay
⏳ Razorpay reviews your business (24-48 hours)
⏳ Then switch to production
```

---

## 🧪 TESTING FEATURES - STEP BY STEP

### TEST 1: Sign Up as Farmer/Seller

**Steps:**
1. Open http://localhost:3000
2. Click **Sign Up**
3. Enter:
   - Name: "Test Farmer"
   - Email: "farmer@test.com"
   - Phone: "9999999999"
   - Password: "Test@123"
   - Role: Select **Farmer**
   - District: Select any (e.g., "Hyderabad")
4. Click **Register**

**Expected Result:**
```
✅ Account created
✅ Redirected to login
✅ Message: "Signup successful"
```

---

### TEST 2: Login as Farmer

**Steps:**
1. Enter Email: "farmer@test.com"
2. Enter Password: "Test@123"
3. Click **Login**

**Expected Result:**
```
✅ Logged in successfully
✅ Dashboard loaded
✅ See "Create Listing" button in navbar
✅ Token stored in localStorage
```

**Verify Token Stored:**
```
Open Browser Console (F12)
Type: localStorage.getItem('token')
Should see: eyJhbGc... (JWT token)
```

---

### TEST 3: Create a Listing (Farmer)

**Steps:**
1. Click **Create Listing** (in navbar)
2. Fill form:
   - Crop Name: "Rice"
   - Quantity: "100"
   - Unit: "kg"
   - Price: "5000"
   - District: "Hyderabad"
   - Description: "High quality rice"
3. Click **Create Listing**

**Expected Result:**
```
✅ Listing created
✅ Message: "Listing created successfully"
✅ Redirected to My Listings page
✅ Your listing appears in the list
```

---

### TEST 4: Browse Listings (Buyer)

**Steps:**
1. Click **Logout**
2. Sign up as Buyer:
   - Name: "Test Buyer"
   - Email: "buyer@test.com"
   - Role: Select **Buyer**
3. Login with buyer account
4. Go to **Browse Listings** or **Marketplace**

**Expected Result:**
```
✅ See all listings
✅ See the rice listing you created
✅ Price: ₹5000
✅ Quantity: 100 kg
✅ Seller name visible
```

---

### TEST 5: Send Interested Message (Buyer Feature)

**Steps:**
1. Find the rice listing
2. Click **Interested** button
3. Enter message: "Is this available?"
4. Click **Send**

**Expected Result:**
```
✅ Message sent successfully
✅ Backend receives message
✅ Seller can see it in their messages
✅ No error in browser console
```

---

### TEST 6: Test Payment Endpoints (Advanced)

**Use Postman or curl:**

```bash
# 1. Create a payment order
curl -X POST http://localhost:8000/api/payments/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "escrowId": "test_escrow_id",
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
  "currency": "INR"
}
```

---

### TEST 7: Test KYC Routes (Seller Feature)

**Check KYC Status:**
```bash
curl -X GET http://localhost:8000/api/kyc/status \
  -H "Authorization: Bearer SELLER_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "kycStatus": "not_started",
  "bankLinked": false,
  "canReceivePayments": false
}
```

---

## 🎮 FEATURE CHECKLIST - WHAT TO TEST

### Existing Features (Should Work)
```
✅ User Authentication
  └─ Sign Up
  └─ Login
  └─ Logout
  └─ Token management

✅ Farmer Features
  └─ Create Listing
  └─ View My Listings
  └─ Update Listing
  └─ Delete Listing
  └─ View Messages

✅ Buyer Features
  └─ View All Listings
  └─ Send Interested Message
  └─ Filter by crop/district
  └─ Search functionality

✅ Messaging
  └─ Send message
  └─ View messages
  └─ Real-time notifications (Socket.io)
```

### New Features (Phase 1 - Backend Only)
```
✅ Payment Routes (Backend)
  └─ POST /api/payments/create-order
  └─ POST /api/payments/verify-payment
  └─ POST /api/payments/release-funds
  └─ POST /api/payments/webhook
  └─ GET /api/payments/transactions

✅ KYC Routes (Backend)
  └─ POST /api/kyc/link-bank-account
  └─ POST /api/kyc/verify-otp
  └─ GET /api/kyc/status
  └─ PUT /api/kyc/update-bank-account
```

### Frontend Features (Phase 2 - Not Yet Built)
```
⏳ Payment Component (UI)
  └─ Razorpay checkout button
  └─ Order review screen
  └─ Payment status display

⏳ KYC Component (UI)
  └─ Bank account linking form
  └─ OTP verification UI
  └─ KYC status display

⏳ Order Management (UI)
  └─ Active orders
  └─ Order history
  └─ Delivery confirmation
```

---

## 🔧 TROUBLESHOOTING

### Issue: "Invalid or expired token"
```
Solution:
1. Clear localStorage: F12 → Application → localStorage → Delete token
2. Log out completely
3. Log in again
4. Should get new token
```

### Issue: "Cannot find listing"
```
Solution:
1. Make sure farmer created listing while logged in
2. Check MongoDB has data: npm run db-check
3. Try creating listing again
```

### Issue: "Message not sending"
```
Solution:
1. Check browser console (F12) for errors
2. Verify backend is running (http://localhost:8000 should show JSON)
3. Check network tab in F12 for failed requests
4. Restart both servers
```

### Issue: "Razorpay routes returning 404"
```
Solution:
1. Verify server.js has these lines:
   app.use('/api/payments', require('./routes/razorpay-payment'));
   app.use('/api/kyc', require('./routes/kyc'));
2. Restart backend server
3. Check routes exist: 
   ls /unified-backend/routes/
```

---

## 📊 TEST SCENARIOS

### Scenario 1: Complete Farmer Registration & Listing
```
1. Sign up as farmer
2. Create listing with details
3. View in listings page
4. Verify data in MongoDB
5. Check listing appears for buyers
```

### Scenario 2: Complete Buyer Purchase Flow
```
1. Sign up as buyer
2. View listings
3. Send interested message
4. (Later) Complete payment
5. Confirm delivery
6. Leave review
```

### Scenario 3: Payment Flow (Backend Only)
```
1. Create escrow transaction in MongoDB
2. Call POST /api/payments/create-order
3. Verify Razorpay order created
4. Simulate payment response
5. Call POST /api/payments/verify-payment
6. Check escrow status updated
```

### Scenario 4: KYC Flow (Backend Only)
```
1. Farmer logs in
2. Call POST /api/kyc/link-bank-account
3. Verify Razorpay linked account created
4. Check KYC status: "pending"
5. Call POST /api/kyc/verify-otp
6. Check KYC status: "verified"
```

---

## 📱 TEST WITH POSTMAN

### Step 1: Create Request
1. Open Postman
2. New → HTTP Request
3. Method: POST
4. URL: http://localhost:8000/api/kyc/status

### Step 2: Add Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### Step 3: Get JWT Token
```
1. Sign up/login through UI
2. Open Browser Console (F12)
3. Type: localStorage.getItem('token')
4. Copy the token
5. Paste in Postman Authorization header
```

### Step 4: Send Request
Click Send → See response

---

## 🎯 WHAT WORKS RIGHT NOW

```
✅ Frontend UI:          Complete
✅ Backend Authentication: Working
✅ Listings CRUD:        Working
✅ Messaging System:     Working
✅ Database:             Connected
✅ Payment Routes:       Ready (need credentials)
✅ KYC Routes:           Ready (need testing)
✅ Smart Contracts:      Code ready (need deployment)
```

---

## ⏳ WHAT'S NEXT AFTER TESTING

1. **Get Razorpay Credentials** (30 min)
   - Go to https://razorpay.com
   - Get TEST API keys
   - Add to .env file

2. **Test Payment Routes** (1 hour)
   - Use Postman
   - Test create-order endpoint
   - Test verify-payment endpoint

3. **Create Payment UI** (2-3 hours)
   - Add payment button to listing
   - Show Razorpay checkout
   - Handle payment response

4. **Deploy Smart Contract** (2-3 hours)
   - Deploy to Polygon testnet
   - Get contract address
   - Integrate with backend

---

## 📝 TEST LOG TEMPLATE

Use this to track your testing:

```
TEST NAME: Sign Up as Farmer
DATE: 2025-11-20
RESULT: ✅ PASS / ❌ FAIL
DETAILS: [What you observed]
ERRORS: [Any console errors]

TEST NAME: Create Listing
DATE: 2025-11-20
RESULT: ✅ PASS / ❌ FAIL
DETAILS: [What you observed]
ERRORS: [Any console errors]

... continue for each test ...
```

---

## 🚀 QUICK START TESTING

### 5-Minute Quick Test:
```bash
1. Open http://localhost:3000
2. Sign up as farmer
3. Create a listing
4. Log out
5. Sign up as buyer
6. View listing
7. Send interested message
✅ Done! Core features working
```

### 30-Minute Full Test:
```bash
1. Complete 5-minute test
2. Test KYC endpoint in Postman
3. Test payment endpoint in Postman
4. Check MongoDB for data
5. Test all validation errors
✅ Done! Full system tested
```

---

## 📞 DEBUG CHECKLIST

Before reporting an issue:
- [ ] Browser console checked (F12)
- [ ] Network tab checked (F12)
- [ ] Both servers running?
- [ ] MongoDB connected?
- [ ] Token in localStorage?
- [ ] Backend .env correct?
- [ ] Restarted after changes?
- [ ] Cleared browser cache?
- [ ] No typos in endpoints?
- [ ] CORS enabled in backend?

---

## 🎉 YOU'RE READY TO TEST!

Everything is running. Start with the sign-up flow and test each feature.

**Current Status:**
```
✅ Servers: Running
✅ Database: Connected
✅ Code: Ready
✅ You: Ready to test!
```

Good luck! 🚀

