# Quick Start: Testing Escrow & Review System

## 🎯 5-Minute Setup

### Prerequisites
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:3000`
- MongoDB connected
- Valid JWT token for testing

---

## 📋 Test Scenarios

### Scenario 1: Create & Track Escrow Transaction

#### Step 1: Create Transaction
```bash
curl -X POST http://localhost:8000/api/escrow/initiate \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "listing_123",
    "sellerId": "seller_user_id",
    "crop": "Basmati Rice",
    "quantity": 50,
    "unit": "kg",
    "amount": 25000
  }'
```

**Expected Response:**
```json
{
  "message": "Escrow transaction initiated",
  "transaction": {
    "transactionId": "ESC-1704067234567-abc123def",
    "status": "pending",
    "amount": 25000,
    "fees": {
      "platformFee": 500,
      "totalFee": 500,
      "sellerAmount": 24500
    }
  }
}
```

**Save the `transactionId` for next steps!**

#### Step 2: Confirm Payment
```bash
curl -X POST http://localhost:8000/api/escrow/ESC-1704067234567-abc123def/confirm-payment \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json"
```

**Status Changes:** pending → **funded** ✅

#### Step 3: Confirm Delivery
```bash
curl -X POST http://localhost:8000/api/escrow/ESC-1704067234567-abc123def/confirm-delivery \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "photosUploaded": [],
    "quality": "good"
  }'
```

**Status Changes:** funded → **confirmed** ✅
**Auto-Release Scheduled:** 5 days from now

#### Step 4: Release Funds
```bash
curl -X POST http://localhost:8000/api/escrow/ESC-1704067234567-abc123def/release-funds \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json"
```

**Status Changes:** confirmed → **released** ✅
**Seller Receives:** ₹24,500

#### Step 5: Check Transaction Status
```bash
curl -X GET http://localhost:8000/api/escrow/ESC-1704067234567-abc123def \
  -H "Authorization: Bearer <your-token>"
```

---

### Scenario 2: Submit Review & Check Performance

#### Step 1: Create Review
```bash
curl -X POST http://localhost:8000/api/reviews/create \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "ESC-1704067234567-abc123def",
    "reviewedUserId": "seller_user_id",
    "rating": 5,
    "title": "Excellent quality rice!",
    "comment": "Fresh, well-packaged, fast delivery. Highly recommended!",
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
    }
  }'
```

**Result:** Review created & UserPerformance auto-updated ✅

#### Step 2: Check Seller Performance
```bash
curl -X GET http://localhost:8000/api/reviews/summary/seller_user_id
```

**Expected Response:**
```json
{
  "averageRating": 5.0,
  "totalReviews": 1,
  "ratingDistribution": {
    "5": 1,
    "4": 0,
    "3": 0,
    "2": 0,
    "1": 0
  },
  "categoryAverages": {
    "quality": 5.0,
    "communication": 5.0,
    "timeliness": 5.0,
    "fairness": 5.0
  },
  "trustBadges": {
    "verified": true,
    "topSeller": false,  // Needs 5 reviews
    "reliable": true,
    "communicative": true,
    "fastShipper": true
  },
  "overallStats": {
    "successRate": 100
  }
}
```

#### Step 3: Get All Reviews for User
```bash
curl -X GET "http://localhost:8000/api/reviews/user/seller_user_id?page=1&limit=5"
```

---

### Scenario 3: Raise Dispute

#### Step 1: Create Another Transaction (for dispute testing)
```bash
# Follow Scenario 1, Steps 1-3 to create and confirm delivery
```

#### Step 2: Raise Dispute
```bash
curl -X POST http://localhost:8000/api/escrow/ESC-xxxxx/raise-dispute \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "quality_mismatch",
    "description": "Received damaged bags, some rice was moldy",
    "evidence": ["photo_url_1", "photo_url_2"]
  }'
```

**Status Changes:** confirmed → **dispute** ⚠️

**Admin Now Needs To:**
1. Review the dispute evidence
2. Contact buyer and seller
3. Make decision (refund or release)

---

## 🌐 Frontend Testing

### Test Reviews Component
1. Navigate to `/reviews/seller_user_id`
2. Verify displays:
   - ✅ Average rating
   - ✅ Category breakdowns
   - ✅ Trust badges
   - ✅ Review list with pagination

### Test Escrow Tracking
1. Navigate to `/escrow`
2. Verify displays:
   - ✅ Transaction cards with status
   - ✅ Timeline progress
   - ✅ Fee breakdown
   - ✅ Action buttons (confirm payment, delivery, release)
3. Test filters: pending, funded, confirmed, released
4. Test pagination

### Create Review via UI
1. Complete full transaction flow
2. Click "Write a Review" button
3. Fill form with:
   - Star rating (1-5)
   - Title
   - Comment
   - Category ratings
   - Aspects checkboxes
4. Submit
5. Verify review appears in list

---

## 🧪 Test Data Examples

### Buyer User ID
```
65a2b3c4d5e6f7g8h9i0j1k2
```

### Seller User ID
```
65a2b3c4d5e6f7g8h9i0j1k3
```

### Sample Listings
- Listing 1: Basmati Rice (50kg) → ₹25,000
- Listing 2: Groundnut (100kg) → ₹15,000
- Listing 3: Cotton (500kg) → ₹75,000

### Sample Token
Get from login: `POST /api/auth/login`

```json
{
  "email": "buyer@example.com",
  "password": "password123"
}
```

---

## ✅ Verification Checklist

### Backend Endpoints
- [ ] `POST /api/escrow/initiate` - Creates transaction ✅
- [ ] `POST /api/escrow/:id/confirm-payment` - Updates status ✅
- [ ] `POST /api/escrow/:id/confirm-delivery` - Schedules release ✅
- [ ] `POST /api/escrow/:id/release-funds` - Releases funds ✅
- [ ] `POST /api/escrow/:id/raise-dispute` - Raises dispute ✅
- [ ] `GET /api/escrow/:id` - Gets transaction ✅
- [ ] `GET /api/escrow/user/transactions` - Lists transactions ✅
- [ ] `POST /api/reviews/create` - Creates review ✅
- [ ] `GET /api/reviews/user/:userId` - Gets reviews ✅
- [ ] `GET /api/reviews/summary/:userId` - Gets summary ✅
- [ ] `PUT /api/reviews/:id/helpful` - Marks helpful ✅

### Frontend Components
- [ ] Reviews page loads ✅
- [ ] Escrow tracking page loads ✅
- [ ] Status filters work ✅
- [ ] Pagination works ✅
- [ ] Action buttons functional ✅
- [ ] Forms submit correctly ✅
- [ ] Styling responsive on mobile ✅

### Database
- [ ] Review records created ✅
- [ ] EscrowTransaction records created ✅
- [ ] UserPerformance auto-updated ✅
- [ ] Indexes working (fast queries) ✅

---

## 🐛 Debugging Tips

### Check Backend Logs
```bash
# Terminal where backend is running
# Look for:
# - ✓ Connected to MongoDB
# - ✓ Server running on port 8000
# - POST /api/escrow/initiate 201 Created
```

### Check Frontend Logs
```javascript
// Browser Console (F12 → Console tab)
// Look for successful API responses
// No CORS errors (if routes properly registered)
```

### Verify Database
```bash
# MongoDB shell
db.escowtransactions.find({})
db.reviews.find({})
db.userperformances.find({})
```

### Check Token Validity
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

---

## 📊 Expected Performance

| Operation | Expected Time | Notes |
|-----------|---|---|
| Create escrow | <100ms | Instant |
| Confirm payment | <50ms | Quick |
| List transactions | <200ms | With pagination |
| Create review | <150ms | Includes performance update |
| Get performance | <100ms | Should be cached |

---

## 🎬 Live Testing Flow (10 mins total)

```
1. CREATE TRANSACTION (1 min)
   curl POST /escrow/initiate
   
2. CONFIRM PAYMENT (30 sec)
   curl POST /escrow/:id/confirm-payment
   
3. CONFIRM DELIVERY (30 sec)
   curl POST /escrow/:id/confirm-delivery
   
4. CREATE REVIEW (1 min)
   curl POST /reviews/create
   
5. CHECK PERFORMANCE (30 sec)
   curl GET /reviews/summary/:userId
   
6. FRONTEND TEST (5 mins)
   Navigate to /escrow
   Navigate to /reviews/:userId
   Test filters & forms
   
7. RAISE DISPUTE (1 min)
   curl POST /escrow/:id/raise-dispute
```

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Auto-release job configured and running
- [ ] Payment gateway integrated (Razorpay/Stripe)
- [ ] Email notifications enabled
- [ ] SMS alerts configured
- [ ] Admin dashboard created
- [ ] Dispute resolution workflow finalized
- [ ] Security audit completed
- [ ] Load testing done
- [ ] Database backups configured
- [ ] Monitoring & alerts setup
- [ ] Documentation updated
- [ ] User training complete

---

## 📞 Support

**Having issues?**

1. Check `/unified-backend/routes/escrow.js` for route definitions
2. Check `/unified-backend/models/EscrowTransaction.js` for schema
3. Check browser console for frontend errors
4. Verify MongoDB is running
5. Verify all tokens are valid

**Need to reset?**

```bash
# Clear all test data
db.escowtransactions.deleteMany({})
db.reviews.deleteMany({})
db.userperformances.deleteMany({})
```

---

**Happy Testing! 🎉**

Last Updated: January 2024  
Version: 1.0  
Status: Ready for Testing
