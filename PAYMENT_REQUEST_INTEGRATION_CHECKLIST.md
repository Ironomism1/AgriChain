# 🔗 Quick Integration Guide: Payment Request System

## Step 1: Add Route Handler to Backend Server

In your main `app.js` or `server.js` file, add this:

```javascript
// Add after other route definitions
const paymentRequestsRoutes = require('./routes/paymentRequests');

// Mount the routes
app.use('/api/payment-requests', paymentRequestsRoutes);

console.log('✅ Payment Requests API mounted at /api/payment-requests');
```

**Example placement in server.js:**
```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Existing routes
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/escrow', escrowRoutes);

// NEW: Add payment requests
app.use('/api/payment-requests', paymentRequestsRoutes);

// Start server
app.listen(8000, () => console.log('Server running...'));
```

---

## Step 2: Update PaymentRequest Model Import

In `paymentRequests.js`, ensure the PaymentRequest model is imported correctly:

```javascript
// At the top of paymentRequests.js
const PaymentRequest = require('../models/PaymentRequest');  // Add this line
const User = require('../models/User');
const EscrowTransaction = require('../models/EscrowTransaction');
```

---

## Step 3: Uncomment Database Operations

In `paymentRequests.js`, replace TODO comments with actual database calls:

### For POST /create endpoint:
```javascript
// Replace mock response with:
const newRequest = new PaymentRequest(paymentRequest);
await newRequest.save();

// Notify recipient (optional - requires notifications system)
// await NotificationService.sendPaymentRequestNotification(recipient._id, newRequest);

res.status(201).json({
  success: true,
  message: 'Payment request sent successfully',
  request: newRequest
});
```

### For GET /received endpoint:
```javascript
const requests = await PaymentRequest.find({
  recipientId: req.user.id,
  status: { $in: ['pending', 'accepted'] }
}).populate('senderId', 'name phone').sort({ createdAt: -1 });

res.status(200).json({
  success: true,
  requests: requests
});
```

### For POST /:id/accept endpoint:
```javascript
const paymentRequest = await PaymentRequest.findById(requestId);

if (!paymentRequest) {
  return res.status(404).json({
    error: 'Payment request not found'
  });
}

if (paymentRequest.recipientId.toString() !== req.user.id) {
  return res.status(403).json({
    error: 'Unauthorized to accept this request'
  });
}

// Create escrow transaction
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

// Update payment request
await paymentRequest.updateOne({
  status: 'accepted',
  escrowTransactionId: escrowTransaction._id,
  acceptedAt: new Date()
});

res.status(200).json({
  success: true,
  message: 'Payment request accepted. Moving to payment...',
  transaction: escrowTransaction,
  redirectTo: '/payment'
});
```

---

## Step 4: Add Database Indexes (Optional but Recommended)

Run this in MongoDB to improve query performance:

```javascript
// In MongoDB shell or compass
db.paymentrequests.createIndex({ recipientId: 1, status: 1 });
db.paymentrequests.createIndex({ senderId: 1, createdAt: -1 });
db.paymentrequests.createIndex({ status: 1, createdAt: -1 });
```

Or add to your database initialization file:

```javascript
const setupIndexes = async () => {
  await PaymentRequest.collection.createIndex({ recipientId: 1, status: 1 });
  await PaymentRequest.collection.createIndex({ senderId: 1, createdAt: -1 });
  console.log('✅ Database indexes created');
};

// Call on server startup
setupIndexes();
```

---

## Step 5: Update Transaction History Component

In `transaction-history.js`, add payment requests to the display:

```javascript
// At the top of component
import PaymentRequests from './payment-requests';

// In the render method, add a tab for payment requests:
<div className="transaction-tabs">
  <button 
    onClick={() => setTab('transactions')}
    className={tab === 'transactions' ? 'active' : ''}
  >
    Transactions
  </button>
  <button 
    onClick={() => setTab('requests')}
    className={tab === 'requests' ? 'active' : ''}
  >
    Payment Requests
  </button>
</div>

{tab === 'transactions' && <TransactionList />}
{tab === 'requests' && <PaymentRequests />}
```

---

## Step 6: Test the Integration

### Using Postman/Insomnia:

1. **Create a Payment Request:**
   ```
   POST http://localhost:8000/api/payment-requests/create
   Headers: Authorization: Bearer YOUR_TOKEN
   
   Body:
   {
     "recipientName": "Priya Singh",
     "recipientPhone": "9876543220",
     "crop": "Groundnut",
     "quantity": 200,
     "unit": "kg",
     "amount": 8000,
     "description": "Bulk order",
     "dueDate": "2024-12-20",
     "senderName": "Akhil",
     "senderPhone": "9876543211"
   }
   ```

2. **Get Received Requests:**
   ```
   GET http://localhost:8000/api/payment-requests/received
   Headers: Authorization: Bearer YOUR_TOKEN
   ```

3. **Accept a Request:**
   ```
   POST http://localhost:8000/api/payment-requests/req_123/accept
   Headers: Authorization: Bearer YOUR_TOKEN
   ```

---

## Step 7: Handle Real Transactions in History

Update `transaction-history.js` to fetch and display real payment requests:

```javascript
const fetchAllTransactions = async () => {
  try {
    const token = localStorage.getItem('token');
    
    // Get real escrow transactions
    const escrowRes = await fetch('http://localhost:8000/api/escrow/user-transactions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const escrowData = await escrowRes.json();
    
    // Get real payment requests
    const requestRes = await fetch('http://localhost:8000/api/payment-requests/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const requestData = await requestRes.json();
    
    // Combine both
    const allTransactions = [
      ...escrowData.transactions,
      ...requestData.requests
    ];
    
    // Sort by date
    allTransactions.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    setTransactions(allTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    // Fall back to mock data
  }
};
```

---

## Step 8: Add Environment Variables (Optional)

If using environment-specific API URLs:

```javascript
// In .env file
REACT_APP_API_URL=http://localhost:8000
REACT_APP_PAYMENT_REQUESTS_ENDPOINT=/api/payment-requests

// In payment-requests.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const ENDPOINT = process.env.REACT_APP_PAYMENT_REQUESTS_ENDPOINT || '/api/payment-requests';

const response = await fetch(`${API_URL}${ENDPOINT}/received`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Troubleshooting

### Issue: "Cannot read property 'recipientId' of undefined"
**Solution:** Ensure PaymentRequest is properly imported and saved to database

### Issue: 404 on /api/payment-requests/received
**Solution:** Make sure route handler is mounted in main app.js:
```javascript
app.use('/api/payment-requests', paymentRequestsRoutes);
```

### Issue: "Recipient not found"
**Solution:** Verify recipient exists in User collection:
```javascript
const user = await User.findOne({ name: 'Priya Singh' });
console.log(user); // Should not be null
```

### Issue: No data showing in frontend
**Solution:** Check browser console for errors, verify:
1. Auth token is valid
2. API endpoint is correct
3. CORS is enabled in backend
4. Database connection is active

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                 Frontend (React)                        │
│                                                         │
│  PaymentRequests Component                             │
│  ├── Send Form (payment-requests.js)                   │
│  ├── Received Tab (Inbox)                              │
│  ├── Sent Tab (Tracking)                               │
│  └── Completed Tab (History)                           │
└────────────────┬──────────────────────────────────────┘
                 │
        HTTP Requests with Auth Token
                 │
┌────────────────▼──────────────────────────────────────┐
│           Backend (Express.js)                        │
│                                                       │
│  paymentRequests.js Routes                           │
│  ├── POST /create                                    │
│  ├── GET /received                                   │
│  ├── GET /sent                                       │
│  ├── POST /:id/accept                                │
│  └── POST /:id/reject                                │
│                                                       │
│  Middleware: verifyToken (auth)                      │
└────────────────┬──────────────────────────────────────┘
                 │
        Database Operations
                 │
┌────────────────▼──────────────────────────────────────┐
│            MongoDB Collections                        │
│                                                       │
│  users (verify recipient)                            │
│  paymentrequests (store requests)                    │
│  escrowtransactions (create on accept)               │
└───────────────────────────────────────────────────────┘
```

---

## Next: Add Real Transaction Integration

Once payment requests are working with mock data, integrate real transactions:

```javascript
// Step 1: Get payment requests from DB
const paymentRequests = await PaymentRequest.find({
  $or: [{ senderId: userId }, { recipientId: userId }]
});

// Step 2: Get escrow transactions from DB
const escrowTransactions = await EscrowTransaction.find({
  $or: [{ buyerId: userId }, { sellerId: userId }]
});

// Step 3: Combine for display
const allTransactions = [
  ...paymentRequests.map(pr => ({ ...pr, type: 'request' })),
  ...escrowTransactions.map(et => ({ ...et, type: 'transaction' }))
];

// Step 4: Return to frontend
return res.json({ success: true, transactions: allTransactions });
```

---

## Support & Documentation

- 📄 Full docs: `PAYMENT_REQUEST_SYSTEM_GUIDE.md`
- 🔧 Backend routes: `routes/paymentRequests.js`
- 📊 Data model: `models/PaymentRequest.js`
- 🎨 Frontend component: `views/payment-requests.js`

---

**Status:** ✅ READY FOR INTEGRATION
**Last Updated:** 2024-11-20
