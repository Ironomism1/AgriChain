# Razorpay Escrow Integration Workflow

## Current Flow Problem
Currently, when a user creates a contract on the Dashboard, they **directly go to MetaMask** (step 5 below), bypassing the escrow and payment system entirely.

---

## Ideal Workflow: Where Razorpay Escrow Should Work

### **STAGE 1: Contract Creation (Dashboard) → Backend Escrow**
```
Dashboard.js (Submit Contract Form)
         ↓
Contract data (crop, price, quantity, down payment %) 
         ↓
Backend: /api/escrow/initiate (NOT directly to MetaMask)
         ↓
Creates Escrow Transaction in MongoDB
- status: 'pending'
- funds held: 0
- blockchain: not yet created
```

**Current Issue**: Dashboard directly calls `contract.ReportCrime()` via MetaMask

---

### **STAGE 2: Payment Processing (Razorpay)**
```
After escrow created, Frontend triggers:
         ↓
/api/payments/create-order (Razorpay Order)
         ↓
Razorpay Payment Gateway Opens
         ↓
Buyer pays full amount (or down payment % if configured)
         ↓
Payment verified via: /api/payments/verify-payment
         ↓
Escrow Transaction Updated:
- status: 'funded'
- razorpayOrderId: stored
- razorpayPaymentId: stored
- funds.inEscrow: amount locked
- blockchain.txHash: NOT YET (waiting for contract)
```

**This is the escrow stage** - Money is held by Razorpay, not released to seller

---

### **STAGE 3: Smart Contract Creation (MetaMask)**
```
ONLY AFTER payment is verified:
         ↓
Frontend calls: /api/contracts/create-onchain
         ↓
Backend initiates Web3 transaction:
- Calls contract.ReportCrime() with all details
- User gets MetaMask popup for confirmation
- Smart contract records on blockchain
         ↓
Transaction hash stored in:
- EscrowTransaction.blockchain.txHash
- EscrowTransaction.blockchain.contractAddress
         ↓
Smart Contract Status:
- status: 'confirmed'
- blockchain: fully integrated
```

---

### **STAGE 4: Product Delivery & Confirmation**
```
Seller delivers goods
         ↓
Buyer receives and confirms delivery
         ↓
/api/escrow/:transactionId/confirm-delivery
         ↓
Escrow Transaction Status: 'confirmed'
- Buyer can upload photos/evidence
- Quality verified
```

---

### **STAGE 5: Fund Release (Back to Seller)**
```
After delivery confirmation:
         ↓
Auto-release timer starts (configurable days)
OR Manual release by buyer
         ↓
/api/escrow/:transactionId/release-funds
         ↓
Razorpay transfers funds to seller account
- Seller Amount (90% after 2% platform fee)
         ↓
Blockchain marked as completed
         ↓
Transaction Status: 'released'
```

---

### **STAGE 6: Dispute Handling (If Needed)**
```
If buyer/seller disputes:
         ↓
/api/escrow/:transactionId/dispute
         ↓
Admin review
         ↓
Refund or release decision
         ↓
Status: 'refunded' OR proceed to release
```

---

## Current vs. Ideal

### ❌ **Current Problem**
```
Dashboard.js
    ↓
MetaMask Popup (contract.ReportCrime)
    ↓
Blockchain Transaction
    ↓
[MISSING: Payment Gateway, Fund Holding, Verification]
```

### ✅ **Ideal Solution**
```
Dashboard.js (Create Listing)
    ↓
POST /api/escrow/initiate
    ↓
POST /api/payments/create-order (Razorpay)
    ↓
Payment Gateway UI
    ↓
POST /api/payments/verify-payment
    ↓
Fund Locked in Escrow (Razorpay Holding)
    ↓
POST /api/contracts/create-onchain
    ↓
MetaMask Popup (contract.ReportCrime)
    ↓
Blockchain Transaction Created
    ↓
Complete Integration: DB + Payment + Blockchain
```

---

## Database States Throughout Workflow

### Before Payment
```javascript
{
  transactionId: "ESC-...",
  status: "pending",
  funds: { inEscrow: 0, released: 0 },
  payment: { status: "pending" },
  blockchain: { txHash: null }
}
```

### After Razorpay Payment
```javascript
{
  transactionId: "ESC-...",
  status: "funded",
  funds: { inEscrow: 5000, released: 0 },
  payment: { 
    status: "confirmed",
    razorpayOrderId: "order_xxx",
    razorpayPaymentId: "pay_xxx"
  },
  blockchain: { txHash: null } // Still waiting
}
```

### After Smart Contract Created
```javascript
{
  transactionId: "ESC-...",
  status: "confirmed",
  funds: { inEscrow: 5000, released: 0 },
  payment: { status: "confirmed" },
  blockchain: { 
    txHash: "0x123...",
    contractAddress: "0x456...",
    status: "recorded"
  }
}
```

### After Delivery Confirmed
```javascript
{
  transactionId: "ESC-...",
  status: "confirmed",
  funds: { inEscrow: 5000, released: 0 },
  delivery: { 
    status: "confirmed",
    actualDelivery: Date,
    photosUploaded: [...]
  },
  releaseAuthorization: {
    buyerAuthorized: true,
    autoReleaseScheduledFor: Date
  }
}
```

### After Fund Release
```javascript
{
  transactionId: "ESC-...",
  status: "released",
  funds: { inEscrow: 0, released: 5000 },
  releaseAuthorization: { 
    releasedAt: Date,
    releasedBy: "system|buyer"
  },
  blockchain: { status: "completed" }
}
```

---

## Implementation Checklist

### Phase 1: Separate Contract Creation
- [ ] Modify Dashboard to NOT call contract directly
- [ ] Create `/api/listings/create` endpoint (traditional listing)
- [ ] Move MetaMask integration to separate stage

### Phase 2: Add Payment Before Contract
- [ ] Frontend escrow initiation
- [ ] Razorpay order creation
- [ ] Payment verification
- [ ] Fund locking in DB

### Phase 3: Smart Contract After Payment
- [ ] Create `/api/contracts/create-onchain` endpoint
- [ ] Only allow if payment verified
- [ ] Store blockchain hash in escrow record

### Phase 4: Complete Integration
- [ ] Delivery confirmation
- [ ] Auto-release timer
- [ ] Fund transfer to seller
- [ ] Dispute handling

---

## Summary
**Razorpay works as escrow in STAGE 2**, after the listing/contract is created but **BEFORE** the smart contract is deployed on blockchain. The escrow holds the buyer's funds securely until delivery is confirmed.
