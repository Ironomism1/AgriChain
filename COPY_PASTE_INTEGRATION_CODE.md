# 🔧 Copy-Paste Integration Code

This file contains exact code snippets you can copy-paste to integrate the payment request system into your existing codebase.

---

## 1️⃣ MOUNT ROUTES IN BACKEND

### In your main `app.js` or `server.js`:

**Find this section:**
```javascript
// Where you have your other routes mounted
app.use('/api/escrow', escrowRoutes);
app.use('/api/listings', listingRoutes);
// ... other routes
```

**Add this line after existing routes:**
```javascript
const paymentRequestsRoutes = require('./routes/paymentRequests');
app.use('/api/payment-requests', paymentRequestsRoutes);
```

**Complete example:**
```javascript
const express = require('express');
const app = express();

// Routes
const userRoutes = require('./routes/user');
const listingRoutes = require('./routes/listings');
const escrowRoutes = require('./routes/escrow');
const paymentRequestsRoutes = require('./routes/paymentRequests'); // ← ADD THIS

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/payment-requests', paymentRequestsRoutes); // ← ADD THIS

app.listen(8000, () => {
  console.log('✅ Server running on port 8000');
  console.log('✅ Payment Requests API at /api/payment-requests');
});
```

---

## 2️⃣ ADD DATABASE INDEXES (Optional but Recommended)

### In MongoDB connection file or seed script:

```javascript
const setupPaymentRequestIndexes = async () => {
  try {
    const PaymentRequest = require('./models/PaymentRequest');
    
    // Create indexes for faster queries
    await PaymentRequest.collection.createIndex({ recipientId: 1, status: 1 });
    await PaymentRequest.collection.createIndex({ senderId: 1, createdAt: -1 });
    await PaymentRequest.collection.createIndex({ status: 1, createdAt: -1 });
    
    console.log('✅ PaymentRequest indexes created');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

// Call on server startup
setupPaymentRequestIndexes();
```

---

## 3️⃣ ENABLE CORS (If Not Already Enabled)

### In your backend (if using CORS):

```javascript
const cors = require('cors');

// Add to app.js
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8000'],
  credentials: true
}));
```

---

## 4️⃣ UNCOMMENT DATABASE OPERATIONS IN ROUTES

### In `routes/paymentRequests.js`, replace TODO sections:

**For POST /create endpoint (around line 15-40):**

Find:
```javascript
// TODO: Save to MongoDB PaymentRequest collection
// await PaymentRequest.create(paymentRequest);
```

Replace with:
```javascript
const newRequest = new PaymentRequest(paymentRequest);
await newRequest.save();

// Optional: Send notification to recipient
// await NotificationService.notify(recipient._id, `New payment request from ${senderName}`);
```

**For GET /received endpoint (around line 70-95):**

Find:
```javascript
// TODO: Query PaymentRequest collection
// const requests = await PaymentRequest.find({...
```

Replace with:
```javascript
const requests = await PaymentRequest.find({
  recipientId: req.user.id,
  status: { $in: ['pending', 'accepted'] }
}).populate('senderId', 'name phone').sort({ createdAt: -1 });
```

**For GET /sent endpoint (around line 110-140):**

Find:
```javascript
// TODO: Query PaymentRequest collection
// const requests = await PaymentRequest.find({...
```

Replace with:
```javascript
const requests = await PaymentRequest.find({
  senderId: req.user.id
}).populate('recipientId', 'name phone').sort({ createdAt: -1 });
```

**For GET /completed endpoint (around line 160-180):**

Find:
```javascript
// TODO: Query PaymentRequest collection
// const completed = await PaymentRequest.find({...
```

Replace with:
```javascript
const completed = await PaymentRequest.find({
  $or: [{ senderId: req.user.id }, { recipientId: req.user.id }],
  status: 'paid'
}).sort({ completedAt: -1 });
```

**For POST /:id/accept endpoint (around line 195-250):**

Find:
```javascript
// TODO: Get payment request from PaymentRequest collection
// const paymentRequest = await PaymentRequest.findById(requestId);

// Mock payment request
const paymentRequest = { ... };

// TODO: Save escrow transaction
// await escrowTransaction.save();

// TODO: Update payment request status to 'accepted'
// await PaymentRequest.findByIdAndUpdate(...)
```

Replace with:
```javascript
const paymentRequest = await PaymentRequest.findById(requestId);

if (!paymentRequest) {
  return res.status(404).json({ error: 'Payment request not found' });
}

if (paymentRequest.recipientId.toString() !== req.user.id) {
  return res.status(403).json({ error: 'Unauthorized to accept this request' });
}

const escrowTransaction = new EscrowTransaction({
  buyerId: paymentRequest.senderId,
  sellerId: paymentRequest.recipientId,
  crop: paymentRequest.crop,
  quantity: paymentRequest.quantity,
  unit: paymentRequest.unit,
  amount: paymentRequest.amount,
  status: 'pending',
  paymentRequestId: paymentRequest._id,
  createdAt: new Date()
});

await escrowTransaction.save();

await paymentRequest.updateOne({
  status: 'accepted',
  escrowTransactionId: escrowTransaction._id,
  acceptedAt: new Date()
});
```

---

## 5️⃣ ADD IMPORT STATEMENT AT TOP

### In `routes/paymentRequests.js`, line 1-5:

Find:
```javascript
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const User = require('../models/User');
const EscrowTransaction = require('../models/EscrowTransaction');
```

Add after line 5:
```javascript
const PaymentRequest = require('../models/PaymentRequest');
```

Should become:
```javascript
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const User = require('../models/User');
const EscrowTransaction = require('../models/EscrowTransaction');
const PaymentRequest = require('../models/PaymentRequest');
```

---

## 6️⃣ UPDATE ESCROW ROUTES (Optional Enhancement)

### Add this endpoint to `routes/escrow.js`:

```javascript
/**
 * GET /api/escrow/all-transactions
 * Get all transactions (escrow + payment requests) for current user
 */
router.get('/all-transactions', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get escrow transactions
    const escrowTransactions = await EscrowTransaction.find({
      $or: [
        { buyerId: userId },
        { sellerId: userId }
      ]
    })
      .populate('buyerId', 'name phone')
      .populate('sellerId', 'name phone')
      .sort({ createdAt: -1 });

    // Get payment requests
    const paymentRequests = await PaymentRequest.find({
      $or: [
        { senderId: userId },
        { recipientId: userId }
      ]
    })
      .populate('senderId', 'name phone')
      .populate('recipientId', 'name phone')
      .sort({ createdAt: -1 });

    // Combine
    const allTransactions = [
      ...escrowTransactions.map(et => ({
        _id: et._id,
        type: 'escrow',
        crop: et.crop,
        amount: et.amount,
        status: et.status,
        otherParty: et.buyerId._id.toString() === userId ? et.sellerId : et.buyerId,
        createdAt: et.createdAt
      })),
      ...paymentRequests.map(pr => ({
        _id: pr._id,
        type: 'payment-request',
        crop: pr.crop,
        amount: pr.amount,
        status: pr.status,
        otherParty: pr.senderId._id.toString() === userId ? pr.recipientId : pr.senderId,
        createdAt: pr.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      transactions: allTransactions
    });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});
```

---

## 7️⃣ UPDATE TRANSACTION HISTORY COMPONENT (Optional)

### In `Frontend/src/views/transaction-history.js`, update fetch:

**Current (if you have it):**
```javascript
const fetchTransactions = async () => {
  const response = await fetch('http://localhost:8000/api/escrow/user-transactions');
  const data = await response.json();
  setTransactions(data.transactions);
};
```

**Updated:**
```javascript
const fetchTransactions = async () => {
  try {
    const token = localStorage.getItem('token');
    
    // Fetch unified transactions (escrow + requests)
    const response = await fetch('http://localhost:8000/api/escrow/all-transactions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setTransactions(data.transactions);
    } else {
      console.error('Failed to fetch transactions');
      loadMockData();
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    loadMockData();
  }
};
```

---

## 8️⃣ TEST WITH POSTMAN/INSOMNIA

### 1. Create Payment Request

**Method:** POST
**URL:** http://localhost:8000/api/payment-requests/create
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (JSON):**
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

### 2. Get Received Requests

**Method:** GET
**URL:** http://localhost:8000/api/payment-requests/received
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. Get Sent Requests

**Method:** GET
**URL:** http://localhost:8000/api/payment-requests/sent
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4. Accept Request

**Method:** POST
**URL:** http://localhost:8000/api/payment-requests/req_123/accept
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Replace `req_123` with actual request ID from response

### 5. Reject Request

**Method:** POST
**URL:** http://localhost:8000/api/payment-requests/req_123/reject
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 9️⃣ VERIFY INSTALLATION

### Check if everything works:

```bash
# 1. Test API is mounted
curl http://localhost:8000/api/payment-requests/received \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: Either real data or error (not 404)

# 2. Test Frontend
# Go to http://localhost:3000
# Click "💳 Requests" in navbar
# Should see Payment Requests page

# 3. Check Console
# Open browser console (F12)
# No errors about missing components
```

---

## 🔟 DATABASE SETUP

### Create PaymentRequest Collection

```javascript
// In MongoDB shell or Compass
db.paymentrequests.insertOne({
  senderId: ObjectId("..."),
  recipientId: ObjectId("..."),
  crop: "Test",
  amount: 1000,
  status: "pending",
  createdAt: new Date()
});

// Create indexes
db.paymentrequests.createIndex({ recipientId: 1, status: 1 });
db.paymentrequests.createIndex({ senderId: 1, createdAt: -1 });
```

---

## 🔗 Environment Variables (Optional)

### Create `.env` in backend:

```env
# Payment Request API
PAYMENT_REQUEST_TIMEOUT=30000
ENABLE_PAYMENT_REQUESTS=true

# Database
MONGODB_URI=mongodb://localhost:27017/agritrust
DB_ENABLE_INDEXES=true
```

### Create `.env` in frontend:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_PAYMENT_REQUESTS_ENABLED=true
```

---

## ⚠️ TROUBLESHOOTING

### Issue: 404 on /api/payment-requests/received

**Solution:**
```javascript
// Check if route is mounted
// In app.js, verify you have:
app.use('/api/payment-requests', paymentRequestsRoutes);

// Check if file exists:
// ./routes/paymentRequests.js should exist and export router
```

### Issue: "Cannot read property 'recipientId' of undefined"

**Solution:**
```javascript
// In paymentRequests.js routes, uncomment the database queries
// Replace mock responses with:
const request = await PaymentRequest.findById(requestId);
// Not the mock object
```

### Issue: "Authorization header missing"

**Solution:**
```javascript
// Make sure you're sending token:
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}` // ← Include this
  }
})
```

### Issue: No mock data showing

**Solution:**
```javascript
// If backend not responding, component falls back to mock
// Check browser console for errors
// Try without mounting routes (uses mock automatically)
```

---

## ✅ FINAL CHECKLIST

- [ ] Copied routes mount code to app.js
- [ ] Uncommented database operations in paymentRequests.js
- [ ] Added PaymentRequest import at top of routes
- [ ] Created indexes in database (optional)
- [ ] Tested with Postman/Insomnia
- [ ] Verified "💳 Requests" shows in navbar
- [ ] Tested creating a request
- [ ] Tested accepting a request
- [ ] Checked browser console for errors
- [ ] Verified responsive design on mobile
- [ ] Tested complete flow: Send → Receive → Accept → Pay

---

## 🎉 DONE!

System is now integrated. Users can:
- ✅ Send payment requests
- ✅ Receive and manage requests
- ✅ Accept/reject with actions
- ✅ View complete history
- ✅ Track all transactions

**Testing:** Try sending a request between two accounts!

---

**Last Updated:** 2024-11-20
**Version:** 1.0
**Ready to Deploy:** YES ✅
