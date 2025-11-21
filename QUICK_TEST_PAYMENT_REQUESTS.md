# 🧪 Quick Test Guide - Send/Accept Payment Requests

## 30-Second Setup

**Step 1:** Go to Settings (⚙️ icon in Navbar)
**Step 2:** Navigate to "Payments" tab
**Step 3:** Toggle "🎭 Enable Mock Payments" to ON
**Step 4:** Set Mock Balance to ₹50,000
**Step 5:** Click "Save Settings"

---

## Testing Mock Payments (2 minutes)

### Test 1: Accept a Received Request

```
1. Go to Payment Requests (💳 in navbar)
2. Click "📥 Received" tab
3. You should see payment requests from "Rajesh Kumar" etc.
4. Look at top - should show: "🎭 Mock Payment, Balance: ₹50,000"
5. Click "✅ Accept & Pay" button
6. Modal popup appears:
   - Recipient: Rajesh Kumar
   - Amount: ₹15,000
   - Current Balance: ₹50,000
   - After Payment: ₹35,000
7. Click "✅ Confirm Mock Payment"
8. Success message: "✅ Payment successful! Transaction ID: MOCK-..."
9. Request disappears from "Received" tab
10. Check "✅ Completed" tab - transaction should appear
11. Balance updated in header: ₹35,000
```

### Test 2: Send a Payment Request

```
1. On Payment Requests page
2. Click "➕ Send Request" button
3. Fill in form:
   - Recipient Name: "Demo Farmer"
   - Recipient Phone: "9999999999"
   - Crop: "Wheat"
   - Quantity: "100"
   - Unit: "kg"
   - Amount: "₹12,000"
   - Description: "Test request"
   - Due Date: "2024-12-31"
4. Click "📤 Send Request"
5. Success message: "✅ Payment request sent successfully!"
6. Click "📤 Sent" tab
7. Your request appears in list with status "PENDING"
```

### Test 3: Reject a Request

```
1. Click "📥 Received" tab
2. Click "❌ Reject" button on any request
3. Request status changes to "REJECTED"
4. Can't accept it anymore
```

---

## Observation Checklist

- [ ] Payment method indicator shows in header
- [ ] Can toggle between "🎭 Mock" and "💳 Razorpay" in settings
- [ ] Balance updates correctly after payment
- [ ] Payment modal shows correct amounts
- [ ] Success messages display
- [ ] Requests move between tabs correctly
- [ ] Can send new requests
- [ ] Can receive and accept requests
- [ ] Can reject requests
- [ ] Completed tab shows paid requests

---

## Testing Real Razorpay (Optional)

### Enable Real Payments

```
1. Settings → Payments Tab
2. Toggle "🎭 Mock Payments" to OFF
3. Now shows "💳 Real Payment (Razorpay)"
4. Go to Payment Requests
5. Click "✅ Accept & Pay"
6. Razorpay checkout opens
7. Enter test card: 4111 1111 1111 1111
8. Any 3-digit CVV, any future date
9. Complete payment
10. Success - transaction recorded
```

---

## Troubleshooting

### Payment Modal Doesn't Appear

**Check:**
1. Is mock payment enabled in settings?
2. Is mock balance > 0?
3. Open browser console (F12) for errors

### Balance Not Updating

**Check:**
1. Payment actually completed?
2. Success message showed?
3. Refresh page and check localStorage

### Razorpay Won't Open

**Check:**
1. Real payments enabled in settings?
2. RAZORPAY_KEY_ID in .env?
3. Backend server running?

### Request Not Moving to Completed

**Check:**
1. Did payment modal confirm?
2. Success message display?
3. Browser console for errors

---

## Quick View Structure

```
💳 PAYMENT REQUESTS PAGE

┌──────────────────────────────────────────┐
│ Payment Requests                         │
│ [🎭 Mock Payment] [₹50,000] [⚙️]         │ ← Payment Indicator
│                                          │
│ [➕ Send Request]     [❌ Settings Link] │ ← Action Buttons
│                                          │
│ Success message (if any) or error       │
│                                          │
│ [📥 Received] [📤 Sent] [✅ Completed]  │ ← Tabs
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Request Card                       │  │
│ │                                    │  │
│ │ Rajesh Kumar 📱 9876543210         │  │ ← Sender info
│ │ ┌─ PENDING ─┐                      │  │ ← Status badge
│ │                                    │  │
│ │ Crop: Wheat                        │  │ ← Details
│ │ Quantity: 100 kg                   │  │
│ │ Amount: ₹15,000                    │  │
│ │ Description: High-quality wheat    │  │
│ │ Due Date: 2024-12-15               │  │
│ │                                    │  │
│ │ [✅ Accept & Pay] [❌ Reject]       │  │ ← Actions
│ └────────────────────────────────────┘  │
│                                          │
│ (More cards...)                          │
└──────────────────────────────────────────┘
```

---

## Mockup Payment Flow

```
User clicks          Check Settings    Show Modal
"Accept & Pay"  →                  →          → User Confirms
                                              ↓
                                        Deduct Balance
                                              ↓
                                        Create Transaction
                                              ↓
                                        Success Message
                                              ↓
                                        Refresh List
```

---

## Files to Verify

✅ `Frontend/src/services/paymentService.js` - Created (payment logic)
✅ `Frontend/src/views/payment-requests.js` - Updated (integration)
✅ `Frontend/src/views/payment-requests.css` - Updated (styling)
✅ `Frontend/src/views/settings.js` - Has payment toggle
✅ `Frontend/.env` - Has RAZORPAY_KEY_ID

---

## Key Features to Test

| Feature | How to Test | Expected |
|---------|------------|----------|
| Payment Indicator | Go to Requests page | Shows mode and balance |
| Mock Payment | Accept request | Modal appears |
| Balance Deduct | Accept request with mock | Balance decreases |
| Status Update | Accept request | Tab updates |
| Send Request | Click "Send" | Form opens |
| Reject Request | Click "Reject" | Status changes |
| Settings Link | Click ⚙️ | Goes to settings |
| Tab Navigation | Click tabs | Content changes |
| Loading State | Click accept | Button shows "⏳ Processing" |
| Error Handling | Reject payment | Error message shows |

---

## Console Checks (F12)

**Should see:**
```javascript
// When accepting request:
"🔄 Starting mock payment process..."
"Amount: 8000"
"New Balance: 42000"

// After success:
"✅ Payment successful! Transaction ID: MOCK-..."

// Check transactions:
JSON.parse(localStorage.getItem('mockTransactions'))
// Should show array of completed payments
```

---

## What's Next

After testing payments:

1. ✅ Send/Accept payment requests working
2. 🔄 Create escrow transactions automatically (next step)
3. 🔄 Show delivery tracking
4. 🔄 Release payment to seller
5. 🔄 View complete transaction history

---

**Ready to test?** Start with "Test 1: Accept a Received Request" above! 🚀
