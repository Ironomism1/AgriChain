# 🛠️ Developer Reference - Contracts & Escrow

## Quick Facts

| Aspect | Contract | EscrowTransaction |
|--------|----------|-------------------|
| **File** | `models/Contract.js` | `models/EscrowTransaction.js` |
| **Purpose** | Product agreement | Payment tracking |
| **Primary Key** | `_id` | `_id` |
| **Foreign Key Link** | `escrowTransactionId` | (referenced from Contract) |
| **Stages** | negotiation, signed, escrowed, delivery, completed | pending, funded, confirmed, released, refunded |
| **API Route** | `/api/contracts` | `/api/escrow` |
| **Unified View** | ✅ Via `/api/escrow/user-transactions` |
| **User Duration** | Long (weeks/months) | Short (days) |
| **Smart Contract** | On blockchain ✅ | References blockchain |
| **Audit Trail** | stageHistory array | status history |

---

## Code Reference

### Contract Model
```javascript
// Location: models/Contract.js

const contractSchema = {
  buyerId: ObjectId,           // User purchasing
  farmerId: ObjectId,          // Farmer selling
  crop: String,                // "wheat", "rice", etc
  quantityKg: Number,          // 100 kg
  totalValue: Number,          // ₹5000
  stage: String,               // negotiation, signed, escrowed, delivery, completed
  
  // Quality & Delivery
  qualityStandards: {          // ISO standards, moisture %, etc
    moisture: String,
    protein: String,
    falling_number: String
  },
  deliveryWindowStart: Date,   // When to deliver
  deliveryWindowEnd: Date,
  
  // Harvest & Blockchain
  harvestProof: [{             // Photos, GPS, timestamps
    type: String,
    url: String,
    timestamp: Date,
    location: { lat, lng }
  }],
  blockchainHash: String,      // 0xdcd9c078e1f55...
  
  // Verification
  verification: {
    status: String,            // approved, rejected, pending
    approvedBy: ObjectId,
    notes: String,
    timestamp: Date
  },
  
  // THE LINK TO ESCROW
  escrowTransactionId: {        // Foreign Key!
    type: ObjectId,
    ref: 'EscrowTransaction'
  },
  
  // Audit
  stageHistory: [{
    stage: String,
    changedAt: Date,
    changedBy: ObjectId
  }],
  
  createdAt: Date,
  updatedAt: Date
};
```

### EscrowTransaction Model
```javascript
// Location: models/EscrowTransaction.js

const escrowSchema = {
  transactionId: String,       // ESC-1763635907...
  buyerId: ObjectId,           // Who pays
  sellerId: ObjectId,          // Who receives
  listingId: ObjectId,         // Optional: from listing
  
  // Product
  crop: String,                // "wheat"
  quantity: Number,            // 100 kg
  unit: String,                // "kg", "ton", etc
  amount: Number,              // ₹5000
  currency: String,            // "INR"
  
  // Financial
  fees: {
    platformFee: Number,       // ₹100 (2%)
    totalFee: Number,
    sellerAmount: Number       // ₹4900 (after fees)
  },
  
  // Payment
  payment: {
    method: String,            // "razorpay", "mock", "bank"
    status: String,            // pending, confirmed, released, refunded
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    transactionId: String      // From payment gateway
  },
  
  // Delivery & Confirmation
  delivery: {
    shippingAddress: String,
    trackingId: String,
    estimatedDelivery: Date
  },
  
  buyerConfirmation: {
    confirmed: Boolean,
    confirmedAt: Date,
    notes: String
  },
  
  // Status tracking
  status: String,              // pending, funded, confirmed, released, refunded
  stage: String,               // Same as contract stage
  
  // Terms
  terms: {
    details: String,           // Contract terms
    downPaymentPercent: Number, // 20%
    deliveryDays: Number,       // 5 days
    autoReleaseAfter: Number   // 5 days after delivery
  },
  
  createdAt: Date,
  updatedAt: Date
};
```

---

## API Endpoints

### Get Unified Transactions
```bash
GET /api/escrow/user-transactions?status=completed

Authorization: Bearer {token}

Response:
{
  "success": true,
  "count": 1,
  "transactions": [{
    "type": "contract",
    "crop": "wheat",
    "escrowTransactionId": "...",
    "escrowData": { ... }
  }],
  "summary": { ... }
}
```

### Get Single Transaction
```bash
GET /api/escrow/:transactionId
Authorization: Bearer {token}
```

### Get User's Escrow Transactions
```bash
GET /api/escrow/user/transactions?status=released&page=1&limit=10
Authorization: Bearer {token}
```

### Create Contract with Payment
```bash
POST /api/contracts-payment/create-with-payment

Body:
{
  "listingId": "...",
  "farmerId": "...",
  "crop": "wheat",
  "quantityKg": 100,
  "pricePerKg": 50,
  "downPaymentPercent": 20
}
```

### Release Escrow Funds
```bash
POST /api/contracts-payment/:contractId/verify-and-complete

Body:
{
  "verified": true,
  "approvalNotes": "Quality excellent"
}

Result:
- Farmer gets: amount - platformFee
- Escrow status: RELEASED
- Contract stage: COMPLETED
```

---

## Database Queries

### Find User's Contracts
```javascript
const contracts = await Contract.find({
  $or: [
    { buyerId: userId },
    { farmerId: userId }
  ]
})
.populate('escrowTransactionId')
.sort({ createdAt: -1 });
```

### Find User's Escrow Transactions
```javascript
const escrows = await EscrowTransaction.find({
  $or: [
    { buyerId: userId },
    { sellerId: userId }
  ]
})
.sort({ createdAt: -1 });
```

### Find Completed Contracts
```javascript
const completed = await Contract.find({
  stage: 'payment_released',
  buyerId: userId
})
.populate('escrowTransactionId')
.select('crop quantityKg totalValue verification blockchainHash');
```

### Get Earnings by Farmer
```javascript
const earnings = await EscrowTransaction.aggregate([
  { $match: { sellerId: farmerId, status: 'released' } },
  { $group: {
      _id: null,
      totalEarnings: { $sum: '$fees.sellerAmount' },
      count: { $sum: 1 }
    }
  }
]);
```

---

## Testing

### Test Unified Transaction Fetch
```bash
curl -H "Authorization: Bearer your_token" \
  http://localhost:8000/api/escrow/user-transactions?status=completed
```

### Test Data Structure
```javascript
// Should return something like:
{
  type: 'contract',
  crop: 'wheat',
  amount: 5000,
  status: 'payment_released',
  escrowTransactionId: '...',
  escrowData: {
    status: 'released',
    amount: 5000,
    fees: { platformFee: 100 }
  }
}
```

---

## Common Issues & Fixes

### Issue: "Cannot read escrowTransactionId"
**Cause**: Contract doesn't have escrowTransactionId set
**Fix**: Ensure contract creation sets the link:
```javascript
contract.escrowTransactionId = escrowTx._id;
await contract.save();
```

### Issue: Null Escrow Data
**Cause**: Escrow transaction not found
**Fix**: Check if escrow document exists:
```javascript
const escrow = await EscrowTransaction.findById(contract.escrowTransactionId);
```

### Issue: Duplicate Records in Unified View
**Cause**: Contract appears in both merged contracts AND standalone escrows
**Fix**: The code filters this:
```javascript
const hasLinkedContract = contracts.some(c => 
  c.escrowTransactionId._id.toString() === escrow._id.toString()
);
if (!hasLinkedContract) {
  // Add standalone escrow only
}
```

---

## Performance Optimization

### Index Recommendations
```javascript
// In models
Contract.collection.createIndex({ buyerId: 1, createdAt: -1 });
Contract.collection.createIndex({ farmerId: 1, createdAt: -1 });
EscrowTransaction.collection.createIndex({ buyerId: 1, createdAt: -1 });
EscrowTransaction.collection.createIndex({ sellerId: 1, createdAt: -1 });
EscrowTransaction.collection.createIndex({ transactionId: 1 }, { unique: true });
```

### Query Optimization
```javascript
// Use .lean() for read-only operations (faster)
const contracts = await Contract.find({...}).lean();

// Use select() to limit fields
const contracts = await Contract.find({...})
  .select('crop quantityKg totalValue stage blockchainHash');

// Use pagination for large datasets
const limit = 10;
const skip = (page - 1) * limit;
const contracts = await Contract.find({...})
  .limit(limit)
  .skip(skip);
```

---

## Status Flow Diagram

```
PAYMENT WORKFLOW STATES

Contract.stage & EscrowTransaction.status progression:

1. NEGOTIATION / PENDING
   ├─ Contract created
   ├─ Escrow initiated
   └─ Waiting for payment

2. SIGNED / FUNDED
   ├─ Contract agreed
   ├─ Payment locked
   └─ Ready to proceed

3. ESCROWED / CONFIRMED
   ├─ Payment verified
   ├─ Funds held
   └─ Ready for delivery

4. DELIVERY / DELIVERED
   ├─ Harvest submitted
   ├─ Quality check pending
   └─ Awaiting verification

5. VERIFIED / APPROVED
   ├─ Quality verified ✅
   ├─ Ready to release
   └─ Escrow approved

6. COMPLETED / RELEASED
   ├─ Payment sent to farmer ✅
   ├─ Contract finalized
   └─ Order complete

7. DISPUTED / REFUNDED
   ├─ Issue found
   ├─ Funds returned
   └─ Contract cancelled
```

---

## Files to Know

```
Backend:
├─ models/Contract.js ........................ Product agreement
├─ models/EscrowTransaction.js .............. Payment tracking
├─ routes/escrow.js ......................... Unified endpoint
├─ routes/contracts-with-payments.js ........ Combined workflows
└─ routes/contracts.js ...................... Individual contracts

Frontend:
├─ src/views/transaction-history.js ......... Display unified
├─ src/views/contract-details.js ............ Contract view
└─ src/components/escrow-status.js .......... Status tracker

Database:
├─ contracts collection ..................... Product docs
└─ escowtransactions collection ............ Payment docs
```

---

## Key Takeaways

✅ **Every Contract is linked to an EscrowTransaction**
✅ **Link is via Contract.escrowTransactionId**
✅ **Unified view merges both into one API response**
✅ **Frontend receives complete transaction picture**
✅ **Status must stay in sync between Contract and Escrow**
✅ **Payment only releases when Contract verified**
✅ **Audit trail in both models for transparency**

---

**Questions? Check the files or contact the development team!** 🚀
