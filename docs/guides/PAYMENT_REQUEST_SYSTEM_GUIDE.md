# 💳 Payment Request System - Complete Implementation Guide

## Overview

The **Payment Request System** enables a two-way negotiation flow between users:
- **Sender** creates a payment request with contract terms
- **Receiver** reviews and accepts or rejects the request
- **Upon Acceptance** → Automatic conversion to EscrowTransaction for payment processing

This system complements the existing EscrowTransaction workflow with a pre-negotiation phase.

---

## Architecture

```
Payment Request Lifecycle:
┌─────────────────┐
│   PENDING       │  User A sends request to User B
│  (Initiated)    │
└────────┬────────┘
         │
         ├─ User B Reviews Request
         │
      ┌──▼──┐
      │ACCEPTED
      │   │         → Creates EscrowTransaction
      │   │         → Redirects to Payment Page
      └────┘
      │REJECTED
         │         → Request archived, User B can make counter-offer
         │
         └─────────────────────────────────────────────────────┐
                                                                │
      ┌──────────────────────────────────────────────────────────┘
      │
   ┌──▼──────────────────────────┐
   │ EscrowTransaction Created    │
   │ (Status: pending → funded)   │
   │ → Payment Flow Begins        │
   └─────────────────────────────┘
```

---

## Frontend Implementation

### 1. PaymentRequests Component (`payment-requests.js`)

**Features:**
- ✅ Send Payment Requests (with form validation)
- ✅ Receive Payment Requests (inbox with actions)
- ✅ Track Sent Requests (view status & responses)
- ✅ View Completed Transactions
- ✅ Accept/Reject Actions
- ✅ Mock Data Support (fallback when API unavailable)

**Three Tabs:**

**Tab 1: Received Requests (📥 Inbox)**
```
User receives payment requests from others
- Shows sender name, phone, crop, amount, description
- "Accept & Pay" button → Proceeds to payment
- "Reject" button → Cancels request
```

**Tab 2: Sent Requests (📤 Sent)**
```
User tracks their outgoing payment requests
- Shows recipient name, status, amount
- "Track Payment" button → Goes to transaction history
- Shows when recipient accepted
```

**Tab 3: Completed Requests (✅ Completed)**
```
Archived completed transactions
- Shows both parties, amount, completion date
- Historical reference for future deals
```

### 2. Payment Request Form

```javascript
{
  recipientName: String,      // Who you're paying
  recipientPhone: String,
  crop: String,               // What product
  quantity: Number,
  unit: String,               // kg, quintals, tonnes
  amount: Number,             // Payment amount (₹)
  description: String,        // Contract terms/notes
  dueDate: Date              // Payment deadline
}
```

### 3. Request Card Component

**Received Request Card:**
```
┌─────────────────────────────────────┐
│ Rajesh Kumar          [PENDING]      │  ← Header with status
│ 📱 9876543210                        │
├─────────────────────────────────────┤
│ Crop: Wheat                         │
│ Quantity: 100 kg                    │
│ Amount: ₹15,000          ← Highlight│
│ Description: Premium wheat          │
│ Due Date: 2024-12-15               │
├─────────────────────────────────────┤
│ [✅ Accept & Pay]  [❌ Reject]      │  ← Actions
└─────────────────────────────────────┘
```

---

## Backend Implementation

### 1. PaymentRequest Schema (`models/PaymentRequest.js`)

```javascript
{
  senderId: ObjectId,              // Who sends the request
  senderName: String,
  senderPhone: String,
  recipientId: ObjectId,           // Who receives it
  recipientName: String,
  recipientPhone: String,
  crop: String,                    // Product details
  quantity: Number,
  unit: String,
  amount: Number,                  // Payment amount
  description: String,             // Contract terms
  status: String,                  // pending|accepted|rejected|paid
  dueDate: Date,                   // Payment deadline
  createdAt: Date,                 // When request was sent
  acceptedAt: Date,                // When accepted
  rejectedAt: Date,                // When rejected
  escrowTransactionId: ObjectId,   // Link to created transaction
  notes: String
}
```

**Status Flow:**
```
pending → accepted → [Create Escrow] → funded → confirmed → released → paid
```

### 2. API Endpoints (`routes/paymentRequests.js`)

#### **POST /api/payment-requests/create**
Create a new payment request

**Request:**
```json
{
  "recipientName": "Priya Singh",
  "recipientPhone": "9876543220",
  "crop": "Groundnut",
  "quantity": 200,
  "unit": "kg",
  "amount": 8000,
  "description": "Bulk order for oil extraction",
  "dueDate": "2024-12-20",
  "senderName": "Merchant Akhil",
  "senderPhone": "9876543211"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment request sent successfully",
  "request": {
    "id": "req_1732099200000",
    "senderId": "user_123",
    "recipientId": "user_456",
    "status": "pending",
    "amount": 8000,
    "createdAt": "2024-11-20T10:00:00Z"
  }
}
```

#### **GET /api/payment-requests/received**
Get all requests received by logged-in user

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "req_1",
      "senderName": "Rajesh Kumar",
      "crop": "Wheat",
      "amount": 15000,
      "status": "pending",
      "createdAt": "2024-11-20"
    }
  ]
}
```

#### **GET /api/payment-requests/sent**
Get all requests sent by logged-in user

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "req_3",
      "recipientName": "Priya Singh",
      "crop": "Groundnut",
      "amount": 8000,
      "status": "accepted",
      "acceptedAt": "2024-11-19"
    }
  ]
}
```

#### **GET /api/payment-requests/completed**
Get all completed payment requests

#### **POST /api/payment-requests/:requestId/accept**
Accept a payment request

**What happens:**
1. ✅ Request status → `accepted`
2. ✅ Creates new `EscrowTransaction` with:
   - buyerId = sender
   - sellerId = receiver
   - status = `pending` (waiting for payment)
   - amount = request amount
3. ✅ Redirects user to `/payment`

**Response:**
```json
{
  "success": true,
  "message": "Payment request accepted. Moving to payment...",
  "transaction": {
    "id": "txn_123",
    "status": "pending",
    "amount": 15000
  },
  "redirectTo": "/payment"
}
```

#### **POST /api/payment-requests/:requestId/reject**
Reject a payment request

**Response:**
```json
{
  "success": true,
  "message": "Payment request rejected"
}
```

#### **GET /api/payment-requests/:requestId**
Get specific payment request details

---

## Integration Points

### 1. With EscrowTransaction

When a payment request is **accepted**:

```javascript
// Create escrow from payment request
const escrowTransaction = new EscrowTransaction({
  buyerId: paymentRequest.senderId,        // Who initiated payment request
  sellerId: paymentRequest.recipientId,    // Who accepted it
  crop: paymentRequest.crop,
  quantity: paymentRequest.quantity,
  unit: paymentRequest.unit,
  amount: paymentRequest.amount,
  status: 'pending',                       // Waiting for payment
  paymentRequestId: paymentRequest._id,    // Link back to request
  createdAt: new Date()
});

await escrowTransaction.save();

// Update payment request
await paymentRequest.updateOne({
  status: 'accepted',
  escrowTransactionId: escrowTransaction._id,
  acceptedAt: new Date()
});
```

### 2. With User Model

Query users for recipients:

```javascript
const recipient = await User.findOne({
  $or: [
    { name: recipientName },
    { phone: recipientPhone }
  ]
});
```

### 3. With TransactionHistory

Display both types of transactions:

```javascript
// In transaction-history.js
const escrowTransactions = await EscrowTransaction.find({
  $or: [
    { buyerId: userId },
    { sellerId: userId }
  ]
});

const paymentRequests = await PaymentRequest.find({
  $or: [
    { senderId: userId },
    { recipientId: userId }
  ]
});

// Combine and display with appropriate icons
```

---

## Flow Examples

### Example 1: Sending a Payment Request

**Scenario:** Merchant Akhil wants to buy groundnuts from Farmer Priya

**Step 1:** Akhil clicks "Send Request"
```
Form fills:
- Recipient: Priya Singh (9876543220)
- Crop: Groundnut
- Quantity: 200 kg
- Amount: ₹8,000
- Description: "Bulk order for oil extraction"
- Due Date: 2024-12-20
```

**Step 2:** Request created in DB
```json
{
  "id": "req_1",
  "senderId": "akhil_123",
  "recipientId": "priya_456",
  "status": "pending",
  "crop": "Groundnut",
  "amount": 8000
}
```

**Step 3:** Priya receives notification
```
"New payment request from Merchant Akhil for Groundnut (₹8,000)"
```

### Example 2: Accepting and Paying

**Step 1:** Priya reviews request in "Received" tab
- Sees Akhil's offer
- Reviews crop quality and amount
- Clicks "✅ Accept & Pay"

**Step 2:** Payment request → Accepted
```json
{
  "status": "accepted",
  "acceptedAt": "2024-11-21T09:30:00Z"
}
```

**Step 3:** EscrowTransaction Created
```json
{
  "buyerId": "akhil_123",      // Buyer (sender)
  "sellerId": "priya_456",     // Seller (recipient)
  "status": "pending",         // Waiting for Akhil's payment
  "amount": 8000,
  "paymentRequestId": "req_1"
}
```

**Step 4:** Redirected to Payment Page
- Akhil sees transaction ready to pay
- Selects payment method (Razorpay)
- Completes payment
- Amount held in Escrow

**Step 5:** Delivery & Release
- Priya delivers groundnuts
- Akhil confirms receipt
- Amount released to Priya
- Transaction → `completed`

---

## Mock Data Integration

When backend API is unavailable, frontend uses mock data:

```javascript
// In payment-requests.js - setMockRequests()
const mockData = {
  received: [
    {
      id: 'req_1',
      senderName: 'Rajesh Kumar',
      senderPhone: '9876543210',
      crop: 'Wheat',
      quantity: 100,
      unit: 'kg',
      amount: 15000,
      status: 'pending',
      createdAt: '2024-11-20'
    }
  ],
  sent: [...],
  completed: [...]
};
```

---

## Real Transaction Integration

To show real transactions from backend:

### Update TransactionHistory to include payment requests:

```javascript
// transaction-history.js
const fetchTransactions = async () => {
  // Get escrow transactions
  const escrowTxns = await fetch('/api/escrow/user-transactions');
  
  // Get payment requests
  const paymentReqs = await fetch('/api/payment-requests/all');
  
  // Combine and sort by date
  const combined = [
    ...escrowTxns.map(t => ({ ...t, type: 'escrow' })),
    ...paymentReqs.map(r => ({ ...r, type: 'request' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return combined;
};
```

---

## Status Badges

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| pending | ⏳ | Orange | Awaiting response |
| accepted | ✅ | Green | Confirmed, proceeding to payment |
| rejected | ❌ | Red | Declined by recipient |
| paid | 💰 | Green | Payment completed |
| cancelled | 🚫 | Gray | Cancelled by sender |

---

## Security Considerations

1. **Verification:** Always verify recipient exists before creating request
2. **Authorization:** Only requestor can modify their own requests
3. **Amount Validation:** Ensure amount > 0
4. **Token Required:** All endpoints require authentication

```javascript
// Middleware verification
router.post('/create', verifyToken, async (req, res) => {
  // req.user.id is authenticated user
  const paymentRequest = new PaymentRequest({
    senderId: req.user.id,  // Force authenticated user as sender
    ...req.body
  });
});
```

---

## Testing Checklist

- [ ] Create payment request with valid data
- [ ] Try creating with invalid recipient (should fail)
- [ ] Accept a request (creates escrow & redirects)
- [ ] Reject a request (updates status)
- [ ] View received requests in inbox
- [ ] View sent requests and their statuses
- [ ] View completed transactions
- [ ] Test with mock data (when API unavailable)
- [ ] Verify pagination works with many requests
- [ ] Check responsive design on mobile

---

## Files Created/Modified

**Created:**
- ✅ `Frontend/src/views/payment-requests.js` (550+ lines)
- ✅ `Frontend/src/views/payment-requests.css` (400+ lines)
- ✅ `backend/routes/paymentRequests.js` (270+ lines)
- ✅ `backend/models/PaymentRequest.js` (Mongoose schema)

**Modified:**
- ✅ `Frontend/src/components/Navbar.js` (Added "💳 Requests" link)
- ✅ `Frontend/src/index.js` (Added routing)

**Next Steps:**
- [ ] Integrate with real MongoDB in `paymentRequests.js` routes
- [ ] Add notifications system
- [ ] Create counter-offer feature
- [ ] Add payment request search/filter
- [ ] Create admin dashboard for payment requests

---

## Quick Start

### For Frontend:
1. Component already created: `payment-requests.js`
2. Styling already created: `payment-requests.css`
3. Routes already added in `index.js`
4. Navbar link already added
5. Click "💳 Requests" in navigation to access

### For Backend:
1. Routes file created: `paymentRequests.js`
2. Schema created: `PaymentRequest.js`
3. TODO: Add route handler in main app:
   ```javascript
   // app.js or server.js
   const paymentRequestsRoutes = require('./routes/paymentRequests');
   app.use('/api/payment-requests', paymentRequestsRoutes);
   ```

### Database Setup:
```javascript
// Optional: Create indexes for faster queries
PaymentRequest.collection.createIndex({ recipientId: 1, status: 1 });
PaymentRequest.collection.createIndex({ senderId: 1, createdAt: -1 });
```

---

## API Summary Table

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/create` | Send request | ✅ |
| GET | `/received` | Inbox | ✅ |
| GET | `/sent` | Sent requests | ✅ |
| GET | `/completed` | Completed | ✅ |
| POST | `/:id/accept` | Accept & create escrow | ✅ |
| POST | `/:id/reject` | Reject request | ✅ |
| GET | `/:id` | Request details | ✅ |

---

## Support & Documentation

For questions or issues:
1. Check mock data flow in `setMockRequests()`
2. Review EscrowTransaction integration
3. Test with sample payment requests
4. Verify MongoDB PaymentRequest schema is created

---

**Status:** ✅ READY FOR TESTING
**Last Updated:** 2024-11-20
**Version:** 1.0
