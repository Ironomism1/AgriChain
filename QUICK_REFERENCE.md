# 🚀 Razorpay Escrow Integration - Quick Reference

## The 5 Stages Explained

### Stage 1️⃣: ESCROW CREATION
**Where**: Dashboard.js → Backend
**What Happens**: 
- User creates contract form
- Escrow transaction created in MongoDB
- Status: `pending`

**Endpoint**: `POST /api/escrow/initiate`
```javascript
// Request
{
  crop: "Wheat",
  quantity: 100,
  unit: "kg",
  amount: 50000,
  terms: "Contract details...",
  state: "Punjab"
}

// Response
{
  transactionId: "ESC-123-abc",
  transaction: { _id, status: "pending", ... },
  nextStep: "payment"
}
```

---

### Stage 2️⃣: RAZORPAY PAYMENT (Escrow Locking)
**Where**: Payment Page → Razorpay Gateway
**What Happens**:
- Razorpay order created
- Payment modal opens
- User pays
- Signature verified
- Funds locked in Razorpay
- Status: `funded`

**Endpoints**:
- `POST /api/payments/create-order`
- `POST /api/payments/verify-payment`

```javascript
// After successful payment
{
  status: "funded",
  funds: { inEscrow: 50000, released: 0 },
  payment: {
    status: "confirmed",
    razorpayOrderId: "order_xxx",
    razorpayPaymentId: "pay_xxx"
  }
}
```

---

### Stage 3️⃣: SMART CONTRACT CREATION
**Where**: Payment Page → MetaMask
**What Happens**:
- "Deploy Smart Contract" button enabled
- MetaMask popup appears
- User confirms
- contract.ReportCrime() executed on blockchain
- Transaction hash stored
- Status: `confirmed`

**Endpoints**:
- `POST /api/contracts/create-onchain` (prepare)
- `POST /api/contracts/store-blockchain-hash` (store result)

```javascript
// After blockchain deployment
{
  status: "confirmed",
  blockchain: {
    txHash: "0x123...",
    contractAddress: "0x456...",
    status: "recorded",
    recordedAt: Date
  }
}
```

---

### Stage 4️⃣: DELIVERY CONFIRMATION
**Where**: Escrow Tracking Page
**What Happens**:
- Seller ships product
- Buyer receives & clicks "Confirm Delivery"
- Photos/evidence uploaded (optional)
- Auto-release timer starts (5 days)
- Status: Still `confirmed` but delivery marked

**Endpoint**: `POST /api/escrow/:id/confirm-delivery`

```javascript
// After delivery confirmed
{
  status: "confirmed",
  delivery: {
    status: "delivered",
    actualDelivery: Date
  },
  buyerConfirmation: {
    status: "confirmed",
    confirmedAt: Date,
    photosUploaded: [...]
  },
  autoReleaseScheduledFor: Date (5 days later)
}
```

---

### Stage 5️⃣: FUND RELEASE
**Where**: Escrow Tracking Page (Auto or Manual)
**What Happens**:
- Auto-release timer expires OR
- Buyer manually releases funds
- Razorpay transfers to seller account
- Status: `released`

**Endpoint**: `POST /api/escrow/:id/release-funds`

```javascript
// After funds released
{
  status: "released",
  funds: { inEscrow: 0, released: 49000 }, // 50000 - 2% fee
  releaseAuthorization: {
    releasedAt: Date,
    releasedBy: "system|buyer"
  },
  completedAt: Date
}
```

---

## Status Flow Diagram

```
pending
  ↓ (after escrow.initiate)
  
funded
  ↓ (after payment verified)
  
confirmed
  ↓ (after blockchain contract + delivery)
  
released
  ↓ (after auto-release or manual release)
  
completed
```

---

## Key Database Fields to Track

```javascript
// IMPORTANT FIELDS
transactionId        // Unique ID: ESC-xxx-xxx
status               // Current stage (pending/funded/confirmed/released)
amount              // Total amount locked
funds.inEscrow      // Amount currently held
funds.released      // Amount released to seller
payment.status      // payment status
razorpayOrderId     // Razorpay order ID
razorpayPaymentId   // Razorpay payment ID
blockchain.txHash   // Blockchain transaction hash
blockchain.contractAddress // Smart contract address
```

---

## Frontend Flow

```
Dashboard (form submission)
    ↓
    POST /api/escrow/initiate
    ↓
    Redirect to /payment?escrowId=xxx&amount=xxx
    ↓
    Payment Page
    ├─ Step 1: Click "Proceed to Razorpay"
    │   ├─ POST /api/payments/create-order
    │   ├─ Razorpay modal opens
    │   └─ User pays
    │
    ├─ Step 2: Payment Verification
    │   ├─ POST /api/payments/verify-payment
    │   └─ Signature verified ✓
    │
    ├─ Step 3: Contract Deployment
    │   ├─ POST /api/contracts/create-onchain
    │   ├─ MetaMask popup
    │   ├─ User confirms
    │   └─ contract.ReportCrime() executed
    │
    └─ Step 4: Complete
        ├─ POST /api/contracts/store-blockchain-hash
        └─ Redirect to /escrow-tracking
```

---

## Important Notes

✅ **Money Flow**:
1. User pays → Razorpay holds money
2. Delivery confirmed → Money still held
3. Auto-release or manual → Money to seller's account

✅ **Blockchain**:
- Smart contract created AFTER payment verified
- Only records the agreement
- Doesn't hold money (Razorpay does)

✅ **Dispute Handling**:
- If dispute raised, funds kept in escrow
- Admin reviews and decides
- Either refund to buyer or release to seller

✅ **Auto-Release**:
- Default 5 days after delivery confirmed
- Can be manual anytime
- Prevents indefinite fund holding

---

## Testing Checklist

- [ ] Create contract on Dashboard
- [ ] Verify redirect to payment page
- [ ] Complete Razorpay payment (test card)
- [ ] Verify payment signature check
- [ ] Click "Deploy Smart Contract"
- [ ] Confirm MetaMask transaction
- [ ] Verify blockchain hash stored
- [ ] Check escrow-tracking shows contract
- [ ] Confirm delivery
- [ ] Wait for auto-release or manually release
- [ ] Verify final status is "released"

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Payment page doesn't load | Check `escrowId`, `transactionId` in URL params |
| MetaMask not showing | Install MetaMask, connect wallet |
| Transaction fails | Check gas fees, network selection |
| Funds not released | Check auto-release timer or click manual release |
| Payment signature mismatch | Verify RAZORPAY_KEY_SECRET in .env |

---

## Files Modified/Created

### Modified:
- ✏️ `dashboard.js` - Removed MetaMask call
- ✏️ `escrow.js` - Enhanced initiate endpoint
- ✏️ `contracts.js` - Full implementation
- ✏️ `index.js` - Added payment route

### Created:
- ✨ `payment-page.js` - Complete payment workflow
- ✨ `payment.css` - Payment page styling
- 📄 `IMPLEMENTATION_COMPLETE.md` - Full guide
- 📄 `RAZORPAY_ESCROW_WORKFLOW.md` - Workflow diagram

---

**Ready to go! 🎉**
