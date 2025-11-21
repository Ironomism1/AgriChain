# 🏗️ Payment Request System - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   PAYMENT REQUEST SYSTEM                     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         FRONTEND - React Component Layer             │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────┐        │   │
│  │  │  PaymentRequests Component              │        │   │
│  │  │  - Receive/Send/Completed Tabs         │        │   │
│  │  │  - Create Request Form                 │        │   │
│  │  │  - Accept/Reject Actions               │        │   │
│  │  │  - Payment Method Indicator            │        │   │
│  │  └─────────────────┬───────────────────────┘        │   │
│  │                    │                                 │   │
│  │  ┌─────────────────▼───────────────────────┐        │   │
│  │  │  PaymentService (paymentService.js)     │        │   │
│  │  │  - processPaymentRequest()              │        │   │
│  │  │  - processMockPayment()                 │        │   │
│  │  │  - processRazorpayPayment()             │        │   │
│  │  │  - processCryptoPayment()               │        │   │
│  │  │  - getPaymentSettings()                 │        │   │
│  │  └──┬────────────────────────┬─────────┬───┘        │   │
│  │     │                        │         │             │   │
│  │     ▼                        ▼         ▼             │   │
│  │  ┌──────────┐  ┌────────────────┐  ┌──────────┐    │   │
│  │  │ Mock     │  │ Razorpay       │  │ Crypto   │    │   │
│  │  │ Payment  │  │ Payment        │  │ Wallet   │    │   │
│  │  │ (Modal)  │  │ (Checkout)     │  │ (Web3)   │    │   │
│  │  └──────────┘  └────────────────┘  └──────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    SETTINGS LAYER - Configure Payment Method        │   │
│  │                                                       │   │
│  │  localStorage:                                       │   │
│  │  - mockPaymentEnabled: true/false                    │   │
│  │  - mockBalance: 10000-50000                          │   │
│  │  - walletAddress: 0x...                              │   │
│  │  - mockTransactions: [...] ← payment history         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  STYLING LAYER - payment-requests.css               │   │
│  │                                                       │   │
│  │  - Payment indicator styles                         │   │
│  │  - Modal animations                                 │   │
│  │  - Button states (normal/disabled/loading)         │   │
│  │  - Responsive design                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND - Node.js/Express                  │
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Payment Request Routes - paymentRequests.js       │    │
│  │                                                    │    │
│  │  POST /create              (Send request)         │    │
│  │  GET  /received            (Get inbox)            │    │
│  │  GET  /sent                (Get sent)             │    │
│  │  GET  /completed           (Get history)          │    │
│  │  POST /:id/accept          (Accept request)       │    │
│  │  POST /:id/reject          (Reject request)       │    │
│  │  GET  /:id                 (Get details)          │    │
│  └────────────────────────────────────────────────────┘    │
│                              │                              │
│  ┌──────────────────────────▼──────────────────────────┐   │
│  │ Payment Routes - /api/payments/                     │    │
│  │                                                    │    │
│  │  POST /create-order        (Razorpay order)       │    │
│  │  POST /verify              (Verify payment)        │    │
│  │  GET  /status/:paymentId   (Check status)          │    │
│  └────────────────────────────────────────────────────┘    │
│                              │                              │
│  ┌──────────────────────────▼──────────────────────────┐   │
│  │  Database Layer - MongoDB                          │    │
│  │                                                    │    │
│  │  ├─ PaymentRequest Collection                      │    │
│  │  │  ├─ senderId → User                             │    │
│  │  │  ├─ recipientId → User                          │    │
│  │  │  ├─ amount                                       │    │
│  │  │  ├─ status (pending/accepted/paid)              │    │
│  │  │  ├─ escrowTransactionId                         │    │
│  │  │  └─ timestamps                                   │    │
│  │  │                                                  │    │
│  │  ├─ EscrowTransaction Collection                   │    │
│  │  │  ├─ buyerId                                      │    │
│  │  │  ├─ sellerId                                     │    │
│  │  │  ├─ amount                                       │    │
│  │  │  ├─ status (pending/funded/confirmed/...)       │    │
│  │  │  └─ paymentId (Razorpay)                        │    │
│  │  │                                                  │    │
│  │  └─ User Collection                                │    │
│  │     ├─ name, email, phone                          │    │
│  │     ├─ walletAddress (crypto)                      │    │
│  │     └─ paymentMethods                              │    │
│  │                                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Integration
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               EXTERNAL SERVICES                              │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐   │
│  │  RAZORPAY        │  │  METAMASK        │  │ EMAIL    │   │
│  │  Payment Gateway │  │  Crypto Wallet   │  │ Service  │   │
│  │                  │  │                  │  │ (Notify) │   │
│  │  - Create Order  │  │  - Web3 Provider │  │          │   │
│  │  - Process Pay   │  │  - Send TX       │  │  - Send  │   │
│  │  - Verify Sig    │  │  - Sign TX       │  │    alerts│   │
│  │                  │  │                  │  │          │   │
│  └──────────────────┘  └──────────────────┘  └──────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Payment Request Lifecycle

```
START
  │
  ▼
┌─────────────────────────────┐
│ Create Payment Request      │
│ POST /api/payment-requests/ │
│       create               │
└────────────┬────────────────┘
             │
      ┌──────▼──────┐
      │ PENDING     │ ← In inbox, awaiting response
      └──────┬──────┘
             │
      ┌──────▼──────┐
      │   User      │
      │ accepts or  │
      │ rejects?    │
      └──┬────────┬─┘
    ✅  │        │ ❌
       │        │
       │   ┌────▼──────────┐
       │   │ REJECTED      │ ← Archived
       │   └───────────────┘
       │
       ▼
  ┌─────────────────────────────────────┐
  │ ACCEPTED - Payment Processing       │
  │ POST /:id/accept                    │
  │                                     │
  │ 1. Check payment method (settings)  │
  │ 2. If MOCK:                         │
  │    - Show confirmation modal        │
  │    - User confirms                  │
  │    - Deduct balance                 │
  │ 3. If RAZORPAY:                     │
  │    - Create order                   │
  │    - Open checkout                  │
  │    - User pays securely             │
  │    - Verify signature               │
  │ 4. If CRYPTO:                       │
  │    - Show web3 confirmation         │
  │    - Send blockchain tx             │
  │    - Wait for confirmation          │
  └────────┬──────────────────────────────┘
           │
      ┌────▼────┐
      │ PAID    │ ← Payment successful
      └────┬────┘
           │
           ▼
  ┌──────────────────────────┐
  │ Create EscrowTransaction │
  │ (Auto on accept)         │
  │                          │
  │ - buyerId = sender       │
  │ - sellerId = recipient   │
  │ - amount = payment       │
  │ - status = pending       │
  └────────┬─────────────────┘
           │
           ▼
  ┌──────────────────────────┐
  │ Delivery & Confirmation  │
  │ (Future steps)           │
  │                          │
  │ - User delivers goods    │
  │ - Recipient confirms     │
  │ - Dispute handling       │
  │ - Payment release        │
  └────────┬─────────────────┘
           │
           ▼
  ┌──────────────────────────┐
  │ COMPLETED ✅             │
  │                          │
  │ - Payment released       │
  │ - Ratings/reviews        │
  │ - Archived in history    │
  └──────────────────────────┘
           │
           ▼
         END
```

---

## Data Flow: Accept & Pay

```
USER INTERACTION:
┌──────────────────────────┐
│ User clicks:             │
│ "✅ Accept & Pay"        │
└────────┬─────────────────┘
         │
         ▼
COMPONENT LOGIC:
┌─────────────────────────────────────┐
│ handleAcceptRequest(requestId)       │
│                                     │
│ 1. Get request details              │
│ 2. Call processPaymentRequest()     │
│ 3. Pass: amount, recipientName      │
└────────┬────────────────────────────┘
         │
         ▼
SERVICE ROUTER:
┌─────────────────────────────────────────┐
│ paymentService.processPaymentRequest()  │
│                                         │
│ const settings = getPaymentSettings()   │
│ if (settings.useMockPayment) {          │
│   return processMockPayment()           │
│ } else {                                │
│   return processRazorpayPayment()       │
│ }                                       │
└──────┬──────────────────────────────────┘
       │
    ┌──▼──────────────────────────────────────┐
    │                                         │
    ▼                                    ▼
MOCK PATH:                    RAZORPAY PATH:
┌──────────────────┐         ┌────────────────────┐
│ Show Modal:      │         │ Create Order       │
│ - Amount         │         │ POST /create-order │
│ - Balance        │         │                    │
│ - New Balance    │         │ Get orderId        │
│                  │         │                    │
│ User confirms    │         │ Open Checkout      │
│ OR cancels       │         │                    │
│                  │         │ User enters card   │
│ If confirm:      │         │                    │
│ - Deduct balance │         │ API processes pay  │
│ - Record tx      │         │                    │
│ - localStorage   │         │ Verify Signature   │
│                  │         │ POST /verify       │
│ Return result    │         │                    │
│                  │         │ Return result      │
└────────┬─────────┘         └──────┬─────────────┘
         │                          │
         └──────────┬───────────────┘
                    │
                    ▼
          RESULT HANDLING:
          ┌─────────────────┐
          │ success: true   │
          │ transactionId   │
          └────────┬────────┘
                   │
                   ▼
          UPDATE UI:
          ┌──────────────────────────┐
          │ 1. Show success message  │
          │ 2. Update request status │
          │ 3. Refresh request list  │
          │ 4. Move to Completed tab │
          │ 5. Highlight transaction│
          └──────────────────────────┘
```

---

## File Structure

```
AgriChain/Frontend/
│
├── src/
│   ├── services/
│   │   └── paymentService.js          ← NEW (Payment logic)
│   │
│   ├── views/
│   │   ├── payment-requests.js        ← UPDATED
│   │   ├── payment-requests.css       ← UPDATED
│   │   ├── settings.js                (Has payment toggle)
│   │   └── ...
│   │
│   ├── components/
│   │   ├── Navbar.js                  (Has Requests link)
│   │   └── ...
│   │
│   └── index.js                       (Routes config)
│
├── .env                               (RAZORPAY_KEY_ID)
└── package.json

Backend/
│
├── routes/
│   ├── paymentRequests.js             (7 endpoints)
│   ├── payments.js                    (Razorpay integration)
│   └── ...
│
├── models/
│   ├── PaymentRequest.js              (Data schema)
│   ├── User.js
│   ├── EscrowTransaction.js
│   └── ...
│
├── middleware/
│   ├── auth.js                        (verifyToken)
│   └── ...
│
└── app.js                             (Route mounting)
```

---

## Component Hierarchy

```
PaymentRequests (Main)
│
├─ PaymentMethodIndicator
│  ├─ Badge (mock/razorpay)
│  ├─ Balance display
│  └─ Settings link
│
├─ Header
│  ├─ Title
│  └─ Create button
│
├─ Tabs
│  ├─ Received
│  ├─ Sent
│  └─ Completed
│
├─ RequestCard (x multiple)
│  ├─ Header (name + status)
│  ├─ Body (details)
│  └─ Actions
│     ├─ Accept button (if pending)
│     └─ Reject button (if pending)
│
└─ Modal (when accepting)
   ├─ Confirmation details
   ├─ Amount calculation
   └─ Confirm/Cancel actions
```

---

## State Management

```
PaymentRequests Component:
├─ activeTab: 'received' | 'sent' | 'completed'
├─ requests: PaymentRequest[]
├─ loading: boolean
├─ error: string
├─ paymentLoading: boolean          ← NEW
├─ showCreateForm: boolean
├─ successMessage: string
├─ formData: {
│  ├─ recipientName
│  ├─ recipientPhone
│  ├─ crop
│  ├─ quantity
│  ├─ unit
│  ├─ amount
│  ├─ description
│  └─ dueDate
│  }
└─ (from localStorage):
   ├─ userId
   ├─ userName
   ├─ userPhone
   ├─ token
   ├─ mockPaymentEnabled       ← Settings
   ├─ mockBalance              ← Settings
   └─ mockTransactions         ← Payment history
```

---

## API Contract

### Frontend → Backend

```javascript
// 1. Create Payment Request
POST /api/payment-requests/create
Headers: { Authorization: Bearer <token> }
Body: {
  recipientName,
  recipientPhone,
  crop,
  quantity,
  unit,
  amount,
  description,
  dueDate,
  senderName,
  senderPhone
}
Response: { success, requestId, message }

// 2. Accept Payment Request
POST /api/payment-requests/:requestId/accept
Headers: { Authorization: Bearer <token> }
Response: { success, escrowId, message }

// 3. Reject Payment Request
POST /api/payment-requests/:requestId/reject
Headers: { Authorization: Bearer <token> }
Response: { success, message }

// 4. Get Payment Requests
GET /api/payment-requests/received
GET /api/payment-requests/sent
GET /api/payment-requests/completed
Headers: { Authorization: Bearer <token> }
Response: { requests: PaymentRequest[] }
```

---

## Settings Integration Flow

```
Settings Page:
┌─────────────────────────────┐
│ Payments Tab                │
├─────────────────────────────┤
│ Enable Mock Payments?       │
│ [Toggle: ON/OFF]            │
│                             │
│ Mock Balance:               │
│ [Input: 10000]              │
│                             │
│ [Save Settings]             │
└────────┬────────────────────┘
         │ Save
         ▼
localStorage:
┌─────────────────────────────┐
│ mockPaymentEnabled: true    │
│ mockBalance: 10000          │
└────────┬────────────────────┘
         │ Read on
         │ Payment
         │ Requests
         ▼
PaymentService:
┌─────────────────────────────┐
│ getPaymentSettings()        │
│ → returns settings          │
│                             │
│ processPaymentRequest()     │
│ → routes based on setting   │
└─────────────────────────────┘
         │
    ┌────┴─────┐
    ▼          ▼
 MOCK    RAZORPAY
```

---

## Error Handling Strategy

```
Try {
  Accept Request
    │
    ├─ Request not found
    │  └─ setError("Request not found")
    │
    └─ processPaymentRequest()
       │
       ├─ Mock Payment
       │  ├─ Insufficient balance
       │  │  └─ Reject with message
       │  └─ User cancels
       │     └─ Reject with message
       │
       └─ Razorpay Payment
          ├─ Order creation failed
          │  └─ Catch and throw
          └─ Verification failed
             └─ Catch and throw
          
  Catch {
    setError(error.message)
    setPaymentLoading(false)
    Show friendly error to user
  }
}
```

---

## Performance Considerations

```
Optimization Points:
├─ Lazy load payment service
├─ Memoize payment settings
├─ Batch API requests
├─ Cache request lists
├─ Optimize re-renders
├─ Debounce form inputs
└─ Minimize modal size
```

---

**This architecture ensures:**
✅ Clean separation of concerns
✅ Easy to add new payment methods
✅ Settings control behavior
✅ Proper error handling
✅ Scalable data structure
✅ Production-ready code
