# 🎯 Frontend Usage Guide - Review & Escrow System

## Quick Start

Your frontend app is running at **http://localhost:3000**

### Two New Components Available:

1. **Reviews Component** - View seller ratings and submit reviews
2. **Escrow Tracking** - Track transaction status and manage payments

---

## 📋 Component 1: Reviews System

### Location in Code
```
AgriChain/Frontend/src/views/reviews.js
AgriChain/Frontend/src/styles/reviews.css
```

### How to Access

**Option 1: Direct URL Route**
```
http://localhost:3000/reviews/:userId
```
Replace `:userId` with actual MongoDB user ID
```
http://localhost:3000/reviews/507f1f77bcf86cd799439011
```

**Option 2: Programmatically (in your app)**
```jsx
import Reviews from './views/reviews';

// In your component
<Reviews userId={userId} />
```

### What You'll See

#### 📊 Performance Summary Section (Top)
```
┌─────────────────────────────────────────────────┐
│  USER PERFORMANCE SUMMARY                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ⭐ 4.8 / 5.0                                  │
│  Based on 12 reviews                            │
│                                                 │
│  Category Breakdown:                            │
│  ├─ Quality:         ████████░ 4.8              │
│  ├─ Communication:   █████████ 4.9              │
│  ├─ Timeliness:      ████████░ 4.7              │
│  └─ Fairness:        ████████░ 4.8              │
│                                                 │
│  🏆 Trust Badges Earned:                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ ✓ Verified  │ 🏆 Top Seller  │ ⚡ Reliable   │
│  └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 💬 Communicative │ 🚚 Fast Shipper │ 📱 Responsive │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│  Success Rate: 98%                              │
│  Total Transactions: 15                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### ✍️ Review Submission Form
```
┌─────────────────────────────────────────────────┐
│  SUBMIT YOUR REVIEW                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Overall Rating: ⭐⭐⭐⭐⭐ (5 stars)            │
│                                                 │
│  Review Title: [________________]              │
│                                                 │
│  Comments: [_____________________]             │
│            [_____________________]             │
│            [_____________________]             │
│                                                 │
│  CATEGORY RATINGS (1-5 each):                  │
│  ├─ Quality:        ⭐⭐⭐⭐⭐                   │
│  ├─ Communication:  ⭐⭐⭐⭐⭐                   │
│  ├─ Timeliness:     ⭐⭐⭐⭐⭐                   │
│  └─ Fairness:       ⭐⭐⭐⭐⭐                   │
│                                                 │
│  ASPECTS (Check if true):                      │
│  ☑ Delivery On Time                            │
│  ☑ Quality As Described                        │
│  ☑ Communicative                               │
│  ☑ Would Recommend                             │
│                                                 │
│  [SUBMIT REVIEW] [CANCEL]                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 📄 Reviews List (Paginated)
```
┌─────────────────────────────────────────────────┐
│  USER REVIEWS (Page 1 of 3)                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Review 1:                                      │
│  ┌─────────────────────────────────────────┐  │
│  │ ⭐⭐⭐⭐⭐ "Excellent Service"            │  │
│  │ By: John Doe                             │  │
│  │ Date: Nov 20, 2025                       │  │
│  │                                          │  │
│  │ "Great quality crops, delivered on      │  │
│  │  time. Highly recommended!"              │  │
│  │                                          │  │
│  │ Categories:                              │  │
│  │ Quality: ⭐⭐⭐⭐⭐  Communication: ⭐⭐⭐⭐⭐ │  │
│  │ Timeliness: ⭐⭐⭐⭐⭐  Fairness: ⭐⭐⭐⭐⭐   │  │
│  │                                          │  │
│  │ Aspects: ✓ On Time  ✓ Quality  ✓ Comm   │  │
│  │          ✓ Recommend                    │  │
│  │                                          │  │
│  │ 👍 Helpful (12)   [Mark Helpful]        │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  Review 2:                                      │
│  ┌─────────────────────────────────────────┐  │
│  │ ⭐⭐⭐⭐ "Good, But Slow Delivery"        │  │
│  │ By: Jane Smith                           │  │
│  │ Date: Nov 19, 2025                       │  │
│  │                                          │  │
│  │ "Quality was good but took longer than  │  │
│  │  expected. Still satisfied."              │  │
│  │                                          │  │
│  │ 👍 Helpful (5)   [Mark Helpful]         │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  [◀ Previous]  Page 1 of 3  [Next ▶]          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Using the Reviews Component

**Step 1: Import in Your App**
```jsx
import Reviews from './views/reviews';
```

**Step 2: Add to a Route**
```jsx
// In your routing file (e.g., App.js)
<Route path="/reviews/:userId" element={<Reviews />} />
```

**Step 3: Or Use Directly**
```jsx
import Reviews from './views/reviews';

// In a page component
export default function SellerProfile({ sellerId }) {
  return (
    <div>
      <h1>Seller Profile</h1>
      <Reviews userId={sellerId} />
    </div>
  );
}
```

### Submitting a Review

1. **Scroll to "Submit Your Review" form**
2. **Set Overall Rating** - Click stars (1-5)
3. **Enter Title** - e.g., "Excellent Service"
4. **Write Comment** - Describe your experience
5. **Set Category Ratings** - Rate each category (quality, communication, timeliness, fairness)
6. **Check Aspects** - Mark which aspects were true
7. **Click Submit** - Review posted!

**Required Auth Token:**
The component automatically uses your auth token from `localStorage.getItem('token')`

### View Your Reviews

1. **Performance Summary** shows at the top
   - Overall rating with review count
   - Category breakdown with progress bars
   - All earned trust badges

2. **Review List** shows all reviews for this user
   - Paginated (5 reviews per page)
   - Each review shows full details
   - Mark helpful to increase count

---

## 🚚 Component 2: Escrow Tracking System

### Location in Code
```
AgriChain/Frontend/src/views/escrow-tracking.js
AgriChain/Frontend/src/styles/escrow.css
```

### How to Access

**Option 1: Direct URL Route**
```
http://localhost:3000/escrow
```

**Option 2: Programmatically**
```jsx
import EscrowTracking from './views/escrow-tracking';

// In your component
<EscrowTracking userId={userId} />
```

### What You'll See

#### 🔄 Transaction Status Timeline

```
┌─────────────────────────────────────────────────┐
│  ESCROW TRANSACTION TRACKING                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Transaction ID: ESC-1732089600000-A7B2C        │
│  Status: 💰 FUNDED                             │
│                                                 │
│  Timeline Progress:                             │
│  ●────●────●────◯────◯                         │
│  ✓     ✓     ✓    ○    ○                        │
│ Pending Funded Confirmed Released Completed     │
│                                                 │
│  Current Step: Payment Confirmed ✓              │
│  Next Step: Awaiting Delivery                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 💰 Fee Breakdown

```
┌─────────────────────────────────────────────────┐
│  TRANSACTION DETAILS                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  Crop: Paddy                                    │
│  Quantity: 500 kg                               │
│  Unit: kilogram                                 │
│                                                 │
│  PRICE BREAKDOWN:                               │
│  ├─ Product Amount:     ₹50,000                │
│  ├─ Platform Fee (2%):  - ₹1,000               │
│  └─ Seller Receives:    ₹49,000                │
│                                                 │
│  Payment Method: bank_transfer                  │
│  Delivery Days: 3                               │
│  Auto-Release: 5 days after delivery            │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 📦 Transaction Card

```
┌──────────────────────────────────────────────────┐
│  Transaction Card                                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  Status Badge: [💰 FUNDED] (Blue)               │
│                                                  │
│  Transaction ID: ESC-1732089600000-A7B2C        │
│  Crop: Paddy | Quantity: 500 kg                 │
│  Amount: ₹50,000                                 │
│                                                  │
│  Timeline:                                       │
│  ●─────●─────●─────◯─────◯                      │
│  Pending  Funded  Confirmed  Released  Complete │
│                                                  │
│  [Confirm Delivery] [Release Funds] [Dispute]   │
│                                                  │
│  [▼ View Details]                               │
│                                                  │
└──────────────────────────────────────────────────┘
```

#### 🎯 Action Buttons (Context-Aware)

Based on transaction status, different buttons appear:

| Status | Available Actions |
|--------|------------------|
| **pending** | Confirm Payment |
| **funded** | Confirm Delivery |
| **confirmed** | Release Funds, Raise Dispute |
| **released** | None (Complete) |
| **dispute** | None (Admin Review) |
| **refunded** | None (Completed) |
| **completed** | None (Archived) |

#### 🔍 Status Filters

```
┌─────────────────────────────────────────────────┐
│  FILTER BY STATUS:                               │
│  [All] [⏳ Pending] [💰 Funded] [✅ Confirmed]  │
│  [🎉 Released] [↩️  Refunded] [⚠️ Dispute]      │
│  [🏁 Completed]                                 │
└─────────────────────────────────────────────────┘
```

### Using the Escrow Tracking Component

**Step 1: Import in Your App**
```jsx
import EscrowTracking from './views/escrow-tracking';
```

**Step 2: Add to a Route**
```jsx
<Route path="/escrow" element={<EscrowTracking userId={userId} />} />
```

**Step 3: Or Use with Seller Profile**
```jsx
// In your seller/buyer dashboard
<section className="my-transactions">
  <h2>My Transactions</h2>
  <EscrowTracking userId={currentUserId} />
</section>
```

### Transaction Lifecycle (Step-by-Step)

#### **Step 1: Initiate Transaction**
Buyer creates new transaction from market listing
```
API: POST /api/escrow/initiate
{
  sellerId: "507f1f77bcf86cd799439011",
  listingId: "507f1f77bcf86cd799439012",
  crop: "Paddy",
  quantity: 500,
  unit: "kg",
  amount: 50000
}
Status: PENDING ⏳
```

#### **Step 2: Confirm Payment**
Click **[Confirm Payment]** button
```
API: POST /api/escrow/:transactionId/confirm-payment
Status: FUNDED 💰
Funds held in escrow account
```

#### **Step 3: Confirm Delivery**
After product received, click **[Confirm Delivery]**
```
API: POST /api/escrow/:transactionId/confirm-delivery
Can upload photos as proof
Status: CONFIRMED ✅
Auto-release scheduled in 5 days
```

#### **Step 4a: Manual Release (Buyer)**
Click **[Release Funds]** before timer
```
API: POST /api/escrow/:transactionId/release-funds
Status: RELEASED 🎉
Funds go to seller immediately
```

#### **Step 4b: Auto-Release**
After 5 days, funds release automatically
```
Background job processes auto-release
Status: RELEASED 🎉
Seller gets payment
```

#### **Step 5: Complete & Review**
After release:
1. Buyer can submit review via Reviews component
2. Seller can respond with their review
3. Status becomes COMPLETED 🏁

### Raising a Dispute

**If product doesn't match or issues occur:**

1. Click **[Raise Dispute]** button
2. Modal appears:
   ```
   ┌─────────────────────────────────┐
   │  RAISE DISPUTE                   │
   ├─────────────────────────────────┤
   │                                 │
   │  Reason:                        │
   │  [▼ Select Reason]              │
   │    - product_not_received       │
   │    - quality_mismatch           │
   │    - partial_delivery           │
   │    - damaged_product            │
   │    - other                      │
   │                                 │
   │  Description:                   │
   │  [_________________________]    │
   │  [_________________________]    │
   │                                 │
   │  Upload Evidence:               │
   │  [Choose Files]                 │
   │                                 │
   │  [SUBMIT DISPUTE] [CANCEL]     │
   │                                 │
   └─────────────────────────────────┘
   ```

3. Submit dispute
4. Status: DISPUTE ⚠️
5. Admin reviews and makes decision
6. Result: REFUNDED or RELEASED

---

## 🔑 Authentication

Both components require authentication token stored in localStorage:

```javascript
// Get token (usually after login)
const token = localStorage.getItem('token');

// Component uses it automatically in headers
Authorization: Bearer <token>
```

---

## 📊 API Endpoints Used by Components

### Reviews Endpoints

```javascript
// Get reviews for a user
GET /api/reviews/user/:userId?page=1&limit=5

// Get user performance summary (no auth needed)
GET /api/reviews/summary/:userId

// Submit a review
POST /api/reviews/create
Headers: Authorization: Bearer <token>
Body: {
  rating: 5,
  title: "Great!",
  comment: "Excellent quality",
  categoryRatings: {...},
  aspects: {...}
}

// Mark review helpful
PUT /api/reviews/:reviewId/helpful
Headers: Authorization: Bearer <token>
```

### Escrow Endpoints

```javascript
// Get user's escrow transactions
GET /api/escrow/user/transactions?page=1&limit=6&status=all
Headers: Authorization: Bearer <token>

// Get transaction details
GET /api/escrow/:transactionId
Headers: Authorization: Bearer <token>

// Confirm payment
POST /api/escrow/:transactionId/confirm-payment
Headers: Authorization: Bearer <token>

// Confirm delivery
POST /api/escrow/:transactionId/confirm-delivery
Headers: Authorization: Bearer <token>
Body: { photosUploaded: ["url1", "url2"] }

// Release funds
POST /api/escrow/:transactionId/release-funds
Headers: Authorization: Bearer <token>

// Raise dispute
POST /api/escrow/:transactionId/raise-dispute
Headers: Authorization: Bearer <token>
Body: {
  reason: "quality_mismatch",
  description: "Product quality not as described",
  evidence: ["url1"]
}

// Initiate new transaction
POST /api/escrow/initiate
Headers: Authorization: Bearer <token>
Body: {
  sellerId: "...",
  listingId: "...",
  crop: "Paddy",
  quantity: 500,
  unit: "kg",
  amount: 50000
}
```

---

## 🧪 Testing the Components

### Test User IDs (For Demo)

Use any valid MongoDB User ID. Example:
```
507f1f77bcf86cd799439011
507f1f77bcf86cd799439012
507f1f77bcf86cd799439013
```

### Quick Test Flow

**1. View Existing Reviews:**
```
Visit: http://localhost:3000/reviews/507f1f77bcf86cd799439011
See: Performance summary and reviews list
```

**2. View Escrow Transactions:**
```
Visit: http://localhost:3000/escrow
See: All your escrow transactions
```

**3. Test Submission:**
```
POST to: http://localhost:8000/api/reviews/create
With auth token and review data
Should return: Created review with ID
```

---

## 🎨 Styling & Customization

### Reviews Component CSS
File: `AgriChain/Frontend/src/styles/reviews.css` (380 lines)

Includes:
- Performance summary styling
- Badge styling (7 badge types with unique colors)
- Form styling with star inputs
- Review card styling
- Responsive design (mobile, tablet, desktop)

### Escrow Component CSS
File: `AgriChain/Frontend/src/styles/escrow.css` (420 lines)

Includes:
- Transaction card styling
- Status badges with color codes
- Timeline visualization
- Modal styling for dispute form
- Fee breakdown display
- Responsive grid layout

---

## 🚀 Production Deployment

To prepare for production:

1. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-api-domain.com
   ```

2. **Build:**
   ```
   npm run build
   ```

3. **Deploy:**
   - Upload `build/` folder to hosting
   - Configure backend API URL in environment variables

---

## 📱 Mobile Responsive

Both components are fully responsive:
- ✅ Desktop (1024px+)
- ✅ Tablet (768px+)
- ✅ Mobile (480px+)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Auth required" error | Make sure token is in localStorage with key `token` |
| "Failed to load reviews" | Check backend is running on port 8000 |
| "User not found" | Verify userId is a valid MongoDB ObjectId |
| Components not showing | Import CSS file in component |
| Buttons not working | Check if user is authenticated |

---

## 🎉 You're Ready!

Both the Review and Escrow components are production-ready and fully integrated with the backend API. Start using them to build trust in your marketplace!

