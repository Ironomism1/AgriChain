# 🔄 RAZORPAY ESCROW FLOW - DETAILED STAGE BREAKDOWN

## 📊 COMPLETE PAYMENT JOURNEY (8 STAGES)

```
┌─────────────────────────────────────────────────────────────┐
│         AGRICHAIN PAYMENT SYSTEM - FULL FLOW                │
└─────────────────────────────────────────────────────────────┘
```

---

## **STAGE 1: BUYER DECIDES TO BUY** 
**Where:** Frontend (React UI)
**What Happens:**
- Buyer sees crop listing
- Clicks **"Buy Now"** button
- Payment page opens
- Shows order summary

**Razorpay Role:** ❌ NOT YET INVOLVED

**MetaMask Role:** ❌ NOT YET INVOLVED

```
BUYER
  ↓
Clicks "Buy Now"
  ↓
Payment Page Opens
```

---

## **STAGE 2: CREATE PAYMENT ORDER**
**Where:** Backend + Razorpay
**What Happens:**
- Frontend calls: `POST /api/payments/create-order`
- Backend receives order details
- Backend calls **Razorpay API**
- Razorpay creates an ORDER

**Razorpay Role:** ✅ **STARTS ESCROW PROCESS**

```
Frontend
  ↓
Backend Route: /api/payments/create-order
  ↓
Razorpay API: Create Order
  ↓
Razorpay Returns:
  - orderId: order_1234567890
  - keyId: rzp_test_Rhuq60d7LnJkhu
  - amount: 500000 paise (₹5000)
```

**Code Example (Backend):**
```javascript
// /unified-backend/routes/razorpay-payment.js

const order = await razorpay.orders.create({
  amount: Math.round(amount * 100),      // Convert to paise
  currency: 'INR',
  receipt: escrowId.toString(),
  notes: {
    escrowId: escrowId,
    listingId: listingId,
    buyerId: buyerId
  }
});

// Razorpay now holds this money in escrow
// Return orderId to frontend
return { orderId: order.id, keyId, amount };
```

---

## **STAGE 3: RAZORPAY CHECKOUT OPENS** ⭐ **ESCROW ACTIVATED**
**Where:** Razorpay Hosted Checkout (Popup)
**What Happens:**
- Frontend opens Razorpay checkout UI
- Buyer enters payment details (Card/UPI/Wallet)
- **RAZORPAY HOLDS MONEY IN ESCROW** (not transferred anywhere)
- Payment is authorized but NOT settled

**Razorpay Role:** ✅ **MONEY IS NOW IN ESCROW** 🔒

```
RAZORPAY CHECKOUT POPUP
  ├─ Buyer enters card: 4111 1111 1111 1111
  ├─ Buyer enters expiry: 12/25
  ├─ Buyer enters CVV: 123
  ├─ Payment processed
  │
  └─ ✅ RAZORPAY NOW HOLDS MONEY IN ESCROW
      (Money NOT given to seller yet)
      (Buyer CAN request refund)
```

**Frontend Code:**
```javascript
// /AgriChain/Frontend/src/views/payment.js

const options = {
  key: order.keyId,                    // rzp_test_Rhuq60d7LnJkhu
  amount: order.amount,                // 500000 paise
  currency: 'INR',
  order_id: order.orderId,             // order_1234567890
  handler: async (response) => {
    // Payment successful
    // Now go to STAGE 4
  }
};

const razorpay = new window.Razorpay(options);
razorpay.open();  // Opens checkout
```

**MetaMask Role:** ❌ NOT INVOLVED (Razorpay uses card/UPI/wallet, not crypto)

---

## **STAGE 4: VERIFY PAYMENT SIGNATURE** ⭐ **ESCROW CONFIRMED**
**Where:** Backend (Node.js)
**What Happens:**
- Razorpay sends payment confirmation to frontend
- Frontend gets: `paymentId`, `signature`, `orderId`
- Frontend sends to backend: `/api/payments/verify-payment`
- Backend verifies SHA256 signature with Razorpay
- **Escrow is now CONFIRMED**
- Create escrow transaction in MongoDB

**Razorpay Role:** ✅ **ESCROW LOCKED IN** 🔐

```
Razorpay Returns:
  - paymentId: pay_1234567890abcdef
  - signature: abc123def456...
  - orderId: order_1234567890

Frontend sends to Backend:
  POST /api/payments/verify-payment
  {
    orderId,
    paymentId,
    signature
  }

Backend verifies with Razorpay:
  SHA256_HMAC(orderId + paymentId, KEY_SECRET) == signature?

If YES:
  ✅ Payment VERIFIED
  ✅ Escrow CONFIRMED
  ✅ Money LOCKED in Razorpay
  ✅ Create transaction in DB
  ✅ Set status: "funded"
  ✅ Start 5-day timer
```

**Backend Code:**
```javascript
// /unified-backend/routes/razorpay-payment.js

router.post('/verify-payment', authMiddleware, async (req, res) => {
  const { orderId, paymentId, signature } = req.body;
  
  // Verify signature with Razorpay
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(orderId + '|' + paymentId)
    .digest('hex');
  
  if (hash !== signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  // Signature verified! Payment is REAL
  // Update escrow status to "funded"
  const escrow = await EscrowTransaction.findByIdAndUpdate(
    escrowId,
    { status: 'funded', razorpayPaymentId: paymentId },
    { new: true }
  );
  
  // Send SMS to seller
  // Record on blockchain (next stage)
  
  return res.json({ verified: true, transaction: escrow });
});
```

**MetaMask Role:** ❌ NOT INVOLVED YET

---

## **STAGE 5: RECORD ON BLOCKCHAIN** ⛓️ **TRANSPARENCY LAYER**
**Where:** Smart Contract on Polygon
**What Happens:**
- Backend calls smart contract
- Creates immutable record of transaction
- Records: buyer, seller, amount, delivery date, crop details
- Stores on Polygon blockchain
- This is for **transparency & dispute proof**, NOT payment

**Razorpay Role:** ✅ **MONEY STILL IN ESCROW**

**MetaMask Role:** ❌ **NOT USER-FACING** (backend handles it, users don't see MetaMask)

```
Backend:
  ↓
Call Smart Contract: createTransaction()
  ↓
Polygon Blockchain:
  ├─ Transaction recorded
  ├─ Immutable record created
  ├─ txHash: 0x1234567890...
  ├─ Cannot be altered
  └─ Proof for disputes

Razorpay:
  ├─ Money STILL in escrow
  ├─ Waiting for delivery confirmation
  └─ Or 5-day auto-release
```

**Smart Contract Code:**
```solidity
// Smart contract on Polygon (not in MetaMask yet for users)

function createTransaction(
  address _seller,
  string memory _crop,
  uint _quantity,
  uint _deliveryDate
) public {
  TransactionRecord memory record = TransactionRecord({
    id: ++transactionCount,
    buyer: msg.sender,
    seller: _seller,
    amount: escrowAmount,
    crop: _crop,
    quantity: _quantity,
    deliveryDate: _deliveryDate,
    status: 'pending',
    createdAt: block.timestamp,
    deliveryProofHash: ''
  });
  
  transactions[transactionCount] = record;
  emit TransactionCreated(transactionCount, msg.sender, _seller);
}
```

---

## **STAGE 6: SELLER CONFIRMS DELIVERY** 📦
**Where:** Frontend (Farmer App)
**What Happens:**
- Seller receives SMS/email (from Stage 4)
- Seller marks delivery as done
- Seller uploads delivery proof (photo)
- Photo is converted to IPFS hash
- Hash recorded on blockchain

**Razorpay Role:** ✅ **MONEY STILL IN ESCROW** (waiting for confirmation)

**MetaMask Role:** ❌ NOT INVOLVED

```
Seller:
  ↓
Receives SMS: "Payment received! ₹5000 in escrow"
  ↓
Logs into app
  ↓
Clicks "Confirm Delivery"
  ↓
Uploads proof photo
  ↓
Photo → IPFS → Hash: QmXxxx...
  ↓
Backend records hash on blockchain
  ↓
emit DeliveryConfirmed() event
```

---

## **STAGE 7: AUTO-RELEASE TRIGGER** ✅ **ESCROW RELEASES**
**Where:** Razorpay + Backend
**What Happens:**
- 5 days pass without dispute
- Cron job triggers
- Backend calls: `POST /api/payments/release-funds`
- Backend calls **Razorpay Transfer API**
- **Razorpay RELEASES money from escrow**
- **Money transferred to seller's linked bank account**
- Platform fee (2%) deducted automatically
- Seller receives money in 1-2 business days

**Razorpay Role:** ✅ **ESCROW RELEASES MONEY TO SELLER** 💰

```
5-DAY TIMER EXPIRES
  ↓
No dispute raised
  ↓
Cron Job Triggers
  ↓
Backend: POST /api/payments/release-funds
  ↓
Razorpay Transfer API:
  ├─ Release ₹5000 from escrow
  ├─ Deduct 2% fee (₹100)
  ├─ Transfer ₹4900 to seller's bank
  └─ Create Transfer ID
  ↓
Razorpay Webhook:
  ├─ transfer.settled event
  ├─ Money confirmed in seller's account
  └─ Send SMS to seller
```

**Backend Code:**
```javascript
// Auto-release after 5 days (in cron job)

const escrow = await EscrowTransaction.findById(escrowId);

// Check if 5 days have passed
if (new Date() > escrow.autoReleaseScheduledFor) {
  
  // Release funds to seller
  const transfer = await razorpay.transfers.create({
    account: process.env.RAZORPAY_ACCOUNT_ID,
    amount: Math.round(amount * 0.98 * 100),  // 2% fee deducted
    currency: 'INR',
    recipient_settlement_id: escrow.razorpayPaymentId
  });
  
  // Update escrow
  await EscrowTransaction.findByIdAndUpdate(escrowId, {
    status: 'released',
    razorpayTransferId: transfer.id,
    releaseTime: new Date()
  });
  
  // Send SMS to seller
  sendSMS(seller.phone, 'Payment released! ₹' + (amount * 0.98) + ' transferred to your account');
}
```

**MetaMask Role:** ❌ NOT INVOLVED

---

## **STAGE 8: COMPLETE & SETTLE** ✨
**Where:** MongoDB + Blockchain
**What Happens:**
- Seller receives money in bank account (1-2 days)
- Buyer can now submit review
- Final blockchain record created with settlement hash
- Transaction marked as "completed"

**Razorpay Role:** ✅ **ESCROW TRANSACTION COMPLETE**

**MetaMask Role:** ❌ NOT INVOLVED

```
Seller's Bank Account:
  ↓
Receives ₹4900 (after 1-2 business days)
  ↓
Transaction marked: "settled"
  ↓
Buyer can submit review
  ↓
Final blockchain record with:
  ├─ txHash (from Stage 5)
  ├─ deliveryHash (from Stage 6)
  ├─ settledAt
  └─ sellerRating
  ↓
TRANSACTION COMPLETE ✅
```

---

## 🎯 SUMMARY: WHERE RAZORPAY ACTS AS ESCROW

| Stage | Activity | Razorpay Status |
|-------|----------|-----------------|
| 1 | Buyer clicks Buy | ❌ Not involved |
| 2 | Create Order | ✅ **ORDER CREATED** |
| **3** | **Checkout & Payment** | **✅ ESCROW STARTS** 🔒 |
| 4 | Verify Payment | ✅ **ESCROW LOCKED** 🔐 |
| 5 | Blockchain Record | ✅ Escrow still locked |
| 6 | Seller Confirms | ✅ Waiting for release |
| **7** | **Auto-Release** | **✅ ESCROW RELEASES** 💰 |
| 8 | Complete | ✅ Transaction settled |

---

## 🌐 WHERE BLOCKCHAIN COMES IN (NOT MetaMask Pop-ups)

**IMPORTANT:** Blockchain is **NOT** for payment processing!

```
RAZORPAY:
  Handles real money
  ├─ Stage 2-3: Receives payment
  ├─ Stage 4: Locks in escrow
  ├─ Stage 7: Releases to seller
  └─ Stage 8: Settlement complete

BLOCKCHAIN:
  Records transactions immutably
  ├─ Stage 5: Record transaction
  ├─ Stage 6: Record delivery proof
  ├─ Stage 8: Final settlement hash
  └─ PURPOSE: Dispute proof & transparency
```

---

## 🚫 WHERE METAMASK DOES NOT APPEAR

**Users will NOT see MetaMask popups for payments!**

```
❌ NOT for Razorpay payments
   (Razorpay handles payments with cards/UPI/wallets)

❌ NOT for each transaction
   (Blockchain recorded by backend, not users)

❌ NOT during checkout
   (Only Razorpay checkout appears)

✅ ONLY for (FUTURE):
   - Dispute resolution with proof
   - Direct seller-to-buyer payments (optional feature)
   - Admin functions
   - Farmer wallet transactions
```

---

## 📱 USER EXPERIENCE (Step by Step)

### BUYER'S JOURNEY:
```
1. Browse listings (Frontend)
2. Click "Buy" (Frontend)
3. See Razorpay checkout (Razorpay Popup)
4. Enter card details (Razorpay Popup)
5. Payment done! ✅ (No MetaMask)
6. See "Payment received" message (Frontend)
7. Money in escrow (Razorpay, not visible to user)
8. Wait for delivery (Frontend)
```

### SELLER'S JOURNEY:
```
1. Receive SMS "Payment received ₹5000 in escrow"
2. Prepare & deliver product
3. Mark delivery done in app (Frontend)
4. Upload proof photo (Frontend)
5. Wait 5 days (automatic)
6. Receive SMS "Payment released ₹4900"
7. Check bank account ✅ (Money arrived!)
```

---

## 💡 SIMPLIFIED VIEW

```
┌─────────────────────────────────────────┐
│   RAZORPAY ESCROW (ACTUAL MONEY)        │
├─────────────────────────────────────────┤
│ Stage 3: Money received & locked ✅      │
│ Stage 4: Escrow confirmed 🔐             │
│ Stage 7: Money released to seller 💰    │
│ Timeline: Payment → 5 days → Release     │
│ Fee: 2% deducted automatically           │
│ Safety: Buyer protected, seller paid    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   BLOCKCHAIN RECORDING (TRANSPARENCY)   │
├─────────────────────────────────────────┤
│ Stage 5: Record transaction on-chain    │
│ Stage 6: Record delivery proof hash     │
│ Stage 8: Final settlement hash          │
│ Purpose: Dispute proof & audit trail    │
│ Cost: $0.01-0.10 per transaction        │
│ Network: Polygon (low gas fees)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   METAMASK (WALLET - NOT USED)          │
├─────────────────────────────────────────┤
│ Users: Do NOT need MetaMask             │
│ Payments: Via Razorpay (card/UPI)       │
│ Blockchain: Backend handles it          │
│ Popups: None for regular users          │
│ Future: Optional for direct transfers   │
└─────────────────────────────────────────┘
```

---

## ✅ KEY TAKEAWAY

**When does Razorpay work as escrow?**

```
ANSWER: STAGES 3-7 (The entire payment process)

Stage 3: Money enters Razorpay escrow ✅
         (Not with buyer, not with seller, not in your app)
         
Stage 4: Escrow is locked 🔐
         (Payment verified & cannot be reversed)
         
Stage 7: Escrow releases to seller 💰
         (Money transferred to seller's bank account)
         (After delivery confirmed or 5 days pass)
```

**MetaMask appears when?**

```
ANSWER: NEVER for regular payments!

MetaMask is for:
  - Crypto wallets
  - Direct blockchain transactions
  - Smart contract interactions (admin only)
  
NOT for:
  - Razorpay payments (use card/UPI)
  - Regular buyers/sellers
  - Payment checkout
```

---

## 🎉 WHAT YOU HAVE NOW

✅ **Real Razorpay integration** - Actual escrow service activated  
✅ **Blockchain recording** - Immutable transaction history  
✅ **Backend payment routes** - All 5 endpoints ready  
✅ **KYC system** - Seller verification ready  
✅ **Database updated** - Payment & blockchain fields added  

---

**You're all set! Razorpay will work as escrow from Stage 3-7!** 🚀

