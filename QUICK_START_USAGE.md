# ⚡ Quick Start - 5 Minutes to Using Review & Escrow

## Step 1: Access the Components (Right Now! 🚀)

### View Reviews Component
```
Open in browser: http://localhost:3000/reviews/507f1f77bcf86cd799439011
```

Replace with any MongoDB User ID. You'll see:
- User performance summary with badges
- All reviews for that user
- Form to submit new review

### View Escrow Component
```
Open in browser: http://localhost:3000/escrow
```

You'll see:
- All your escrow transactions
- Transaction status timelines
- Action buttons based on status

---

## Step 2: Test with Real Data

### Get Your User ID
```bash
# Open browser console and run:
localStorage.getItem('userId')
```

### View Your Own Reviews
```
http://localhost:3000/reviews/YOUR_USER_ID_HERE
```

### View Your Transactions
```
http://localhost:3000/escrow
```

---

## Step 3: Create Test Transaction (API)

### Option A: Using cURL

```bash
curl -X POST http://localhost:8000/api/escrow/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "sellerId": "507f1f77bcf86cd799439011",
    "listingId": "507f1f77bcf86cd799439012",
    "crop": "Paddy",
    "quantity": 500,
    "unit": "kg",
    "amount": 50000
  }'
```

### Option B: Using Postman

1. **New Request**
2. **Method**: POST
3. **URL**: `http://localhost:8000/api/escrow/initiate`
4. **Headers**: 
   ```
   Authorization: Bearer <your_token>
   Content-Type: application/json
   ```
5. **Body** (raw JSON):
   ```json
   {
     "sellerId": "507f1f77bcf86cd799439011",
     "listingId": "507f1f77bcf86cd799439012",
     "crop": "Paddy",
     "quantity": 500,
     "unit": "kg",
     "amount": 50000
   }
   ```
6. **Send**

### Option C: Using Browser Console

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:8000/api/escrow/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sellerId: '507f1f77bcf86cd799439011',
    listingId: '507f1f77bcf86cd799439012',
    crop: 'Paddy',
    quantity: 500,
    unit: 'kg',
    amount: 50000
  })
})
.then(res => res.json())
.then(data => {
  console.log('Transaction created:', data);
  // Copy the transactionId for next steps
})
.catch(err => console.error('Error:', err));
```

---

## Step 4: Test Transaction Workflow

### After creating transaction, you'll get:
```json
{
  "transactionId": "ESC-1732089600000-A7B2C",
  "status": "pending",
  "amount": 50000,
  "fees": {
    "platformFee": 1000,
    "totalFee": 1000,
    "sellerAmount": 49000
  }
}
```

### Confirm Payment
```bash
curl -X POST http://localhost:8000/api/escrow/ESC-1732089600000-A7B2C/confirm-payment \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Status changes: **pending → FUNDED** 💰

### Confirm Delivery
```bash
curl -X POST http://localhost:8000/api/escrow/ESC-1732089600000-A7B2C/confirm-delivery \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "photosUploaded": ["https://example.com/photo1.jpg"]
  }'
```

Status changes: **funded → CONFIRMED** ✅

### Release Funds
```bash
curl -X POST http://localhost:8000/api/escrow/ESC-1732089600000-A7B2C/release-funds \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Status changes: **confirmed → RELEASED** 🎉

---

## Step 5: Submit Review

### Using cURL

```bash
curl -X POST http://localhost:8000/api/reviews/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "reviewedUserId": "507f1f77bcf86cd799439011",
    "rating": 5,
    "title": "Excellent Service",
    "comment": "Great quality crops delivered on time!",
    "categoryRatings": {
      "quality": 5,
      "communication": 5,
      "timeliness": 5,
      "fairness": 5
    },
    "aspects": {
      "deliveryOnTime": true,
      "qualityAsDescribed": true,
      "communicative": true,
      "wouldRecommend": true
    },
    "transactionId": "ESC-1732089600000-A7B2C"
  }'
```

### Using Browser Console

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:8000/api/reviews/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    reviewedUserId: '507f1f77bcf86cd799439011',
    rating: 5,
    title: 'Excellent Service',
    comment: 'Great quality crops delivered on time!',
    categoryRatings: {
      quality: 5,
      communication: 5,
      timeliness: 5,
      fairness: 5
    },
    aspects: {
      deliveryOnTime: true,
      qualityAsDescribed: true,
      communicative: true,
      wouldRecommend: true
    },
    transactionId: 'ESC-1732089600000-A7B2C'
  })
})
.then(res => res.json())
.then(data => console.log('Review created:', data))
.catch(err => console.error('Error:', err));
```

---

## Step 6: View Updated Performance

### Check Updated Performance Summary
```bash
curl http://localhost:8000/api/reviews/summary/507f1f77bcf86cd799439011
```

You'll see:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "averageRating": 5,
  "totalReviews": 1,
  "ratingDistribution": [0, 0, 0, 0, 1],
  "categoryAverages": {
    "quality": 5,
    "communication": 5,
    "timeliness": 5,
    "fairness": 5
  },
  "trustBadges": {
    "verified": false,
    "topSeller": true,
    "topBuyer": false,
    "reliable": true,
    "communicative": true,
    "fastShipper": true,
    "responsive": false
  }
}
```

### View in Browser
```
Visit: http://localhost:3000/reviews/507f1f77bcf86cd799439011
```

You'll see the updated badges displayed!

---

## Common Test Scenarios

### Scenario 1: Complete Purchase Flow (2 min)
1. ✅ Create escrow transaction
2. ✅ Confirm payment (pending → funded)
3. ✅ Confirm delivery (funded → confirmed)
4. ✅ Release funds (confirmed → released)
5. ✅ Submit review
6. ✅ View updated performance badges

### Scenario 2: Raise Dispute
1. ✅ Create escrow transaction
2. ✅ Confirm payment
3. ✅ Raise dispute before delivery
4. ✅ Status becomes "dispute"
5. ✅ Admin resolves (refund or release)

### Scenario 3: Auto-Release (Automatic)
1. ✅ Create → Confirm payment → Confirm delivery
2. ⏰ Wait 5 days (in real app)
3. ✅ Auto-release job releases funds
4. ✅ Status becomes "released"

### Scenario 4: Multiple Reviews Build Badges
1. ✅ Submit 5+ reviews (all 5 stars)
2. ✅ Get "Top Seller" badge
3. ✅ User sees green badge on profile

---

## Key Endpoints Reference

| Purpose | Method | Endpoint | Auth |
|---------|--------|----------|------|
| **Initiate Transaction** | POST | `/api/escrow/initiate` | ✅ |
| **Confirm Payment** | POST | `/api/escrow/:id/confirm-payment` | ✅ |
| **Confirm Delivery** | POST | `/api/escrow/:id/confirm-delivery` | ✅ |
| **Release Funds** | POST | `/api/escrow/:id/release-funds` | ✅ |
| **Raise Dispute** | POST | `/api/escrow/:id/raise-dispute` | ✅ |
| **Get Transaction** | GET | `/api/escrow/:id` | ✅ |
| **List Transactions** | GET | `/api/escrow/user/transactions` | ✅ |
| **Submit Review** | POST | `/api/reviews/create` | ✅ |
| **View Reviews** | GET | `/api/reviews/user/:userId` | ❌ |
| **View Performance** | GET | `/api/reviews/summary/:userId` | ❌ |
| **Mark Helpful** | PUT | `/api/reviews/:id/helpful` | ✅ |

✅ = Requires Auth Token
❌ = Public (No Auth)

---

## Authentication Token

**How to get your token:**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Paste:
```javascript
localStorage.getItem('token')
```

4. Copy the result
5. Use in API calls as:
```
Authorization: Bearer <paste_token_here>
```

---

## Frontend Integration (Already Done!)

The components are already created at:

```
✅ /AgriChain/Frontend/src/views/reviews.js (250+ lines)
✅ /AgriChain/Frontend/src/views/escrow-tracking.js (280+ lines)
✅ /AgriChain/Frontend/src/styles/reviews.css (380+ lines)
✅ /AgriChain/Frontend/src/styles/escrow.css (420+ lines)
```

Just import and use them in your routes!

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Token missing/expired. Get new token via login |
| 404 Not Found | User ID or Transaction ID doesn't exist |
| CORS Error | Backend running on 8000? Frontend on 3000? |
| "Failed to load" | Backend not running. Run: `npm start` in unified-backend |
| Buttons disabled | Not authenticated. Login first |
| 500 Error | Check backend logs in terminal |

---

## Next Steps

1. **Import components** into your pages
2. **Add routes** to your router
3. **Test the full flow** (create → pay → deliver → review)
4. **Deploy** to production

---

## 📞 Support

For detailed information, see:
- `FRONTEND_USAGE_GUIDE.md` - Complete frontend guide
- `CODE_INTEGRATION_EXAMPLES.md` - 10 code examples
- `ESCROW_SYSTEM_DOCUMENTATION.md` - Technical reference
- `QUICK_START_TESTING.md` - More test scenarios

---

**You're all set! 🎉 Start using the review and escrow systems now!**

