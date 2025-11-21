# AgriTrust Escrow & Review System Documentation

## Overview

The AgriTrust platform now includes a complete escrow transaction system with integrated reviews and performance tracking. This enables secure buyer-seller transactions with multi-party accountability.

---

## 1. Review System

### Database Models

#### Review Model (`/unified-backend/models/Review.js`)

Stores user reviews after transactions with comprehensive rating system.

**Fields:**
- `transactionId` (String, required) - Links to transaction
- `reviewedUserId` (ObjectId, required) - User being reviewed
- `reviewerId` (ObjectId, required) - User leaving review
- `rating` (Number 1-5, required) - Overall rating
- `title` (String) - Review headline
- `comment` (String) - Detailed review text
- `categoryRatings` - Object with 4 categories:
  - `quality` (1-5)
  - `communication` (1-5)
  - `timeliness` (1-5)
  - `fairness` (1-5)
- `aspects` - Boolean flags:
  - `deliveryOnTime`
  - `qualityAsDescribed`
  - `communicative`
  - `wouldRecommend`
- `verifiedPurchase` (Boolean) - Purchase verified
- `helpfulCount` (Number) - Helpful votes
- `approved` (Boolean) - Admin approval status
- `flaggedForReview` (Boolean) - Flagged by system

**Indexes:**
- Compound index on `reviewedUserId` + `status`
- Single indexes on `transactionId`, `reviewerId` for query performance

### Review API Endpoints

Base URL: `/api/reviews`

#### 1. Create Review
```http
POST /api/reviews/create
Authorization: Bearer <token>

Body:
{
  "transactionId": "ESC-...",
  "reviewedUserId": "user_id",
  "rating": 5,
  "title": "Great seller!",
  "comment": "Very professional and quick delivery",
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
}

Response:
{
  "message": "Review created successfully",
  "review": { ...review data... }
}
```

#### 2. Get User Reviews
```http
GET /api/reviews/user/:userId?page=1&limit=10
(No authentication required)

Response:
{
  "reviews": [ ...array of reviews... ],
  "total": 25,
  "pages": 3,
  "page": 1
}
```

#### 3. Get Review Summary
```http
GET /api/reviews/summary/:userId
(No authentication required)

Response:
{
  "averageRating": 4.8,
  "totalReviews": 45,
  "ratingDistribution": {
    "5": 40,
    "4": 5,
    "3": 0,
    "2": 0,
    "1": 0
  },
  "categoryAverages": {
    "quality": 4.9,
    "communication": 4.8,
    "timeliness": 4.7,
    "fairness": 4.8
  },
  "trustBadges": {
    "verified": true,
    "topSeller": true,
    "topBuyer": false,
    "reliable": true,
    "communicative": true,
    "fastShipper": true,
    "responsive": true
  },
  "overallStats": {
    "successRate": 98.5
  }
}
```

#### 4. Mark Review as Helpful
```http
PUT /api/reviews/:reviewId/helpful
Authorization: Bearer <token>

Response:
{
  "message": "Marked as helpful",
  "helpfulCount": 15
}
```

### Badge System

Badges are automatically generated based on metrics:

| Badge | Criteria |
|-------|----------|
| **Verified** | Email or KYC verified |
| **Top Seller** | Average rating ≥4.8 AND ≥5 reviews |
| **Top Buyer** | Positive transaction history |
| **Reliable** | Average rating ≥4.5 AND fairness ≥4.5 |
| **Communicative** | Communication rating ≥4.7 |
| **Fast Shipper** | Timeliness rating ≥4.7 |
| **Responsive** | Quick response to inquiries |

---

## 2. UserPerformance Tracking

### Database Model

#### UserPerformance Model (`/unified-backend/models/UserPerformance.js`)

Comprehensive metrics for user accountability and trust.

**Key Sections:**

1. **Overall Stats**
   - `totalTransactions` - Lifetime transactions
   - `successfulTransactions` - Completed successfully
   - `successRate` - Percentage (calculated)

2. **Reviews**
   - `averageRating` - Mean rating (1-5)
   - `totalReviews` - Count of reviews
   - `ratingDistribution` - Breakdown by star count

3. **Category Averages**
   - `quality` - Average quality rating
   - `communication` - Response/communication rating
   - `timeliness` - Delivery timeliness rating
   - `fairness` - Fair dealing rating

4. **Trust Badges** - Boolean flags for each badge type

5. **Seller Metrics**
   - `totalProductsSold`
   - `deliveryTime`
   - `onTimeDeliveryRate` - Percentage
   - `returnRate` - Product returns %
   - `refundRate` - Refund %

6. **Buyer Metrics**
   - `purchaseCount` - Total purchases
   - `totalSpent` - Rupees spent
   - `avgOrderValue` - Average order value
   - `repeatPurchaseRate` - Percentage

7. **Risk Profile**
   - `level` - low | medium | high
   - `flags` - Array of risk factors
   - `warningCount` - Total warnings

8. **Insights**
   - `strengths` - Strong points
   - `improvements` - Areas to improve
   - `recommendation` - AI-generated advice

**Auto-Updates:** Performance metrics automatically update whenever a review is created.

---

## 3. Escrow Transaction System

### Database Model

#### EscrowTransaction Model (`/unified-backend/models/EscrowTransaction.js`)

Manages secure payment holding and release.

**Key Features:**

1. **Transaction Identifiers**
   - `transactionId` - Unique ID (format: ESC-timestamp-random)
   - `buyerId` - ObjectId of buyer
   - `sellerId` - ObjectId of seller
   - `listingId` - Related listing

2. **Product Details**
   - `crop` - Crop name
   - `quantity` - Amount
   - `unit` - Unit of measurement

3. **Financial**
   - `amount` - Total amount in INR
   - `fees` - Object with:
     - `platformFee` - 2% of transaction
     - `totalFee` - Total deductions
     - `sellerAmount` - Amount seller receives

4. **Payment Tracking**
   - `payment.method` - bank_transfer | upi | wallet
   - `payment.status` - pending | confirmed | failed
   - `payment.transactionRef` - Payment reference
   - `payment.confirmedAt` - Confirmation timestamp

5. **Delivery Tracking**
   - `delivery.status` - pending | in_transit | delivered
   - `delivery.trackingId` - Courier tracking ID
   - `delivery.estimatedDelivery` - Expected date
   - `delivery.actualDelivery` - Actual delivery date
   - `delivery.pickupLocation` - Seller location
   - `delivery.deliveryLocation` - Buyer location

6. **Buyer Confirmation**
   - `buyerConfirmation.status` - pending | confirmed | rejected
   - `buyerConfirmation.confirmedAt` - Confirmation time
   - `buyerConfirmation.photosUploaded` - Proof images
   - `buyerConfirmation.rejectionReason` - If rejected

7. **Dispute Resolution**
   - `dispute.raised` - Boolean
   - `dispute.raisedBy` - buyer | seller
   - `dispute.reason` - Dispute category
   - `dispute.description` - Details
   - `dispute.evidence` - Evidence URLs
   - `dispute.resolution` - Settlement

8. **Release Authorization** (Multi-party approval)
   - `releaseAuthorization.buyerAuthorized` - Buyer approved
   - `releaseAuthorization.sellerVerified` - Seller verified
   - `releaseAuthorization.adminApproved` - Admin approved

9. **Funds Management**
   - `funds.inEscrow` - Amount held
   - `funds.released` - Amount paid to seller
   - `funds.refunded` - Amount returned to buyer

10. **Terms**
    - `terms.deliveryDays` - Estimated delivery (default: 3)
    - `terms.autoReleaseAfter` - Auto-release window (default: 5 days)
    - `terms.returnWindow` - Return period (default: 7 days)

11. **Status Flow**
    ```
    pending → funded → confirmed → released → completed
                                  ↘ dispute → (resolved)
                                  ↘ refunded → completed
    ```

12. **Auto-Release Scheduling**
    - `autoReleaseScheduledFor` - Scheduled release date
    - Background job processes pending auto-releases

### Escrow API Endpoints

Base URL: `/api/escrow`

#### 1. Initiate Escrow Transaction
```http
POST /api/escrow/initiate
Authorization: Bearer <token>

Body:
{
  "listingId": "listing_id",
  "sellerId": "seller_id",
  "crop": "Rice",
  "quantity": 100,
  "unit": "kg",
  "amount": 50000
}

Response:
{
  "message": "Escrow transaction initiated",
  "transaction": { ...escrow data... },
  "transactionId": "ESC-1234567890-abc123"
}
```

#### 2. Confirm Payment
```http
POST /api/escrow/:transactionId/confirm-payment
Authorization: Bearer <token>
(Buyer confirms payment)

Response:
{
  "message": "Payment confirmed. Funds held in escrow.",
  "transaction": { ...updated transaction... }
}
```

#### 3. Confirm Delivery
```http
POST /api/escrow/:transactionId/confirm-delivery
Authorization: Bearer <token>
(Buyer confirms product received)

Body:
{
  "photosUploaded": [],
  "quality": "good"
}

Response:
{
  "message": "Delivery confirmed. Auto-release scheduled.",
  "transaction": { ...updated transaction... },
  "autoReleaseDate": "2024-01-15T10:30:00Z"
}
```

#### 4. Release Funds
```http
POST /api/escrow/:transactionId/release-funds
Authorization: Bearer <token>
(Buyer, seller, or admin can release)

Response:
{
  "message": "Funds released to seller",
  "transaction": { ...updated transaction... },
  "amountReleased": 49000
}
```

#### 5. Raise Dispute
```http
POST /api/escrow/:transactionId/raise-dispute
Authorization: Bearer <token>

Body:
{
  "reason": "quality_mismatch",
  "description": "Received damaged product",
  "evidence": ["url1", "url2"]
}

Response:
{
  "message": "Dispute raised. Admin will review.",
  "transaction": { ...updated transaction... }
}
```

#### 6. Get Transaction Details
```http
GET /api/escrow/:transactionId
Authorization: Bearer <token>

Response:
{
  ...complete escrow transaction object...
}
```

#### 7. Get User Transactions
```http
GET /api/escrow/user/transactions?page=1&limit=10&status=confirmed
Authorization: Bearer <token>

Query Parameters:
- status: all | pending | funded | confirmed | released | dispute
- page: Page number (default: 1)
- limit: Items per page (default: 10)

Response:
{
  "transactions": [ ...array of escrow transactions... ],
  "total": 25,
  "pages": 3,
  "page": 1
}
```

---

## 4. Frontend Components

### Reviews Component (`/AgriChain/Frontend/src/views/reviews.js`)

Display user reviews and performance metrics.

**Features:**
- Overall rating display with star visualization
- Category ratings with progress bars
- Trust badges display
- Risk profile indicator
- Review submission form with star ratings
- Category-specific ratings for quality, communication, timeliness, fairness
- Review listing with pagination
- Helpful vote functionality

**Usage:**
```jsx
import Reviews from '../views/reviews.js';

<Reviews userId={userId} />
```

### Escrow Tracking Component (`/AgriChain/Frontend/src/views/escrow-tracking.js`)

Track escrow transactions in real-time.

**Features:**
- Transaction status filtering
- Visual timeline showing transaction progress
- Fee breakdown display
- Payment and delivery details
- Dispute submission form
- Auto-release scheduling visualization
- Pagination support

**Usage:**
```jsx
import EscrowTracking from '../views/escrow-tracking.js';

<EscrowTracking userId={userId} />
```

---

## 5. Integration Flow

### Typical Transaction Workflow

```
1. INITIATE
   ├─ Buyer selects crop from listing
   ├─ Backend creates EscrowTransaction (status: pending)
   └─ Funds not held yet

2. PAYMENT
   ├─ Buyer confirms payment method
   ├─ Payment gateway processes (or mock)
   ├─ Backend marks payment as confirmed
   └─ Status changes to: funded
   └─ Funds now held in escrow

3. DELIVERY
   ├─ Seller ships product with tracking
   ├─ Delivery status updated in real-time
   └─ Status remains: funded

4. RECEIPT CONFIRMATION
   ├─ Buyer receives product and confirms
   ├─ Buyer can upload photos as proof
   ├─ Status changes to: confirmed
   └─ Auto-release timer started (default: 5 days)

5. FUNDS RELEASE
   ├─ Option 1: Buyer manually releases before auto-release
   ├─ Option 2: Auto-release triggers after window expires
   ├─ Status changes to: released
   └─ Funds transferred to seller

6. COMPLETION
   ├─ Both parties can leave reviews
   ├─ Reviews linked to transaction
   ├─ UserPerformance metrics auto-update
   ├─ Badges recalculated
   └─ Status changes to: completed

DISPUTE ALTERNATIVE:
├─ At any point before release, buyer can raise dispute
├─ Status changes to: dispute
├─ Admin reviews evidence
├─ Resolution: refunded → completed OR released → completed
```

### Dispute Resolution

When a dispute is raised:

1. **Submission**
   - Buyer/seller provides reason, description, evidence
   - Status changes to `dispute`
   - Funds remain held in escrow

2. **Admin Review**
   - Admin examines all evidence and communications
   - Contacts both parties if needed
   - Makes determination

3. **Resolution**
   - Refund: Funds returned to buyer → status: refunded
   - Release: Funds released to seller → status: released
   - Partial: Both parties receive portions

4. **Completion**
   - Dispute marked as resolved
   - Status changes to: completed
   - Both parties can leave reviews

---

## 6. Auto-Release Background Job

**Purpose:** Automatically release funds after buyer confirmation window expires

**Implementation:**
```javascript
// Runs periodically (e.g., every hour)
const processAutoReleases = async () => {
  const now = new Date();
  
  const transactions = await EscrowTransaction.find({
    status: 'confirmed',
    autoReleaseScheduledFor: { $lte: now },
    'releaseAuthorization.adminApproved': false
  });

  for (const tx of transactions) {
    // Release funds
    tx.status = 'released';
    tx.funds.released = tx.amount - tx.fees.totalFee;
    await tx.save();
    
    // Update seller performance
    await updateSellerMetrics(tx.sellerId, tx);
    
    // Send notifications
    await sendNotification(tx.buyerId, 'Funds auto-released');
    await sendNotification(tx.sellerId, 'Payment received');
  }
};
```

**Scheduler:** Should be implemented using:
- `node-cron` for scheduled tasks
- Or external job queue (Bull, Bee-Queue)
- Or database polling

---

## 7. Security Considerations

1. **Authentication**
   - All transaction endpoints require valid JWT token
   - Users can only view their own transactions
   - Admins can view all transactions

2. **Authorization**
   - Buyers can confirm payments and deliveries
   - Sellers can verify deliveries
   - Admins can release funds and resolve disputes
   - Role-based access control enforced

3. **Fund Safety**
   - Funds held in separate escrow account
   - No direct buyer-seller payments
   - Multi-step verification before release
   - Dispute resolution before release possible

4. **Data Integrity**
   - All state changes timestamped
   - Transaction history immutable
   - Audit trail of all actions

---

## 8. Testing the System

### Manual Testing

1. **Create Transaction**
   ```bash
   curl -X POST http://localhost:8000/api/escrow/initiate \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "listingId": "...",
       "sellerId": "...",
       "crop": "Rice",
       "quantity": 100,
       "unit": "kg",
       "amount": 50000
     }'
   ```

2. **Confirm Payment**
   ```bash
   curl -X POST http://localhost:8000/api/escrow/ESC-123/confirm-payment \
     -H "Authorization: Bearer <token>"
   ```

3. **Check Transaction Status**
   ```bash
   curl -X GET http://localhost:8000/api/escrow/ESC-123 \
     -H "Authorization: Bearer <token>"
   ```

### Frontend Testing

1. Navigate to Escrow Tracking page
2. Create new transaction via listing page
3. Confirm payment in tracking component
4. Confirm delivery with photos
5. Test auto-release simulation
6. Create review after transaction completes

---

## 9. API Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| 201 | Created | Successful transaction creation |
| 200 | OK | Successful operation |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Transaction not found |
| 409 | Conflict | Invalid state transition |
| 500 | Server Error | Internal server error |

---

## 10. Performance Optimization

1. **Indexing**
   - Compound indexes on `buyerId+status` and `sellerId+status`
   - Index on `autoReleaseScheduledFor` for background jobs
   - Prevents full collection scans

2. **Queries**
   - Use `.lean()` for read-only queries
   - Pagination enforced (max 50 per page)
   - Avoid N+1 queries with `.populate()`

3. **Caching**
   - Cache user performance summary (TTL: 1 hour)
   - Cache badge calculations
   - Invalidate on review creation

---

## 11. Future Enhancements

1. **Payment Gateway Integration**
   - Stripe/Razorpay integration for actual payments
   - Webhook handling for payment confirmations
   - Refund processing

2. **Insurance**
   - Optional transaction insurance
   - Claims processing system
   - Premium calculation

3. **Rating Insights**
   - AI analysis of reviews
   - Sentiment analysis
   - Recommendation engine

4. **Notifications**
   - Email alerts for status changes
   - SMS for critical updates
   - In-app push notifications

5. **Reporting**
   - User reputation reports
   - Transaction history exports
   - Performance dashboards

---

## Support & Debugging

### Common Issues

1. **"Transaction not found"**
   - Verify transactionId format
   - Check user permissions
   - Ensure transaction exists

2. **"Only buyer can confirm payment"**
   - Ensure you're logged in as buyer
   - Check transaction buyerId matches

3. **"Auto-release not triggered"**
   - Verify background job is running
   - Check autoReleaseScheduledFor date
   - Monitor job logs

### Logs Location

- Backend logs: Console output
- Frontend errors: Browser console
- Database queries: MongoDB logs

---

## Contact & Support

For issues or questions:
- Backend Issues: Check `/unified-backend/routes/escrow.js`
- Frontend Issues: Check `/AgriChain/Frontend/src/views/escrow-tracking.js`
- Database Issues: Check MongoDB collections

---

**Last Updated:** January 2024
**Version:** 1.0
**Status:** Production Ready
