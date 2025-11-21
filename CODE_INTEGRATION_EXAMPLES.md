# 💻 Code Integration Examples

## Example 1: Add to Main App Router

### File: `AgriChain/Frontend/src/App.js`

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Reviews from './views/reviews';
import EscrowTracking from './views/escrow-tracking';

// Import other components
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';

export default function App() {
  const userId = localStorage.getItem('userId'); // Get from auth

  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/profile" element={<Profile />} />

        {/* NEW ROUTES - Review & Escrow Systems */}
        <Route path="/reviews/:userId" element={<Reviews />} />
        <Route path="/escrow" element={<EscrowTracking userId={userId} />} />
      </Routes>
    </Router>
  );
}
```

---

## Example 2: Add Reviews to Seller Profile Page

### File: `AgriChain/Frontend/src/pages/SellerProfile.js`

```jsx
import React, { useState, useEffect } from 'react';
import Reviews from '../views/reviews';
import axios from 'axios';

export default function SellerProfile({ sellerId }) {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch seller details
    const fetchSeller = async () => {
      try {
        const res = await axios.get(`/api/users/${sellerId}`);
        setSeller(res.data);
      } catch (err) {
        console.error('Error fetching seller:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [sellerId]);

  if (loading) return <div>Loading...</div>;
  if (!seller) return <div>Seller not found</div>;

  return (
    <div className="seller-profile">
      {/* Seller Basic Info */}
      <div className="seller-header">
        <img src={seller.profileImage} alt={seller.name} />
        <h1>{seller.name}</h1>
        <p>{seller.email}</p>
      </div>

      {/* NEW: Reviews & Performance Section */}
      <div className="seller-reviews-section">
        <h2>Reviews & Ratings</h2>
        <Reviews userId={sellerId} />
      </div>

      {/* Other seller info */}
      <div className="seller-listings">
        <h2>Active Listings</h2>
        {/* List listings */}
      </div>
    </div>
  );
}
```

---

## Example 3: Add Escrow to Dashboard

### File: `AgriChain/Frontend/src/pages/Dashboard.js`

```jsx
import React from 'react';
import EscrowTracking from '../views/escrow-tracking';
import '../styles/dashboard.css';

export default function Dashboard() {
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole'); // 'buyer' or 'seller'

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>My Dashboard</h1>
        <p>Welcome back, {userRole === 'buyer' ? 'Buyer' : 'Seller'}!</p>
      </header>

      {/* Quick Stats */}
      <section className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Transactions</h3>
          <p className="stat-value">15</p>
        </div>
        <div className="stat-card">
          <h3>Pending Orders</h3>
          <p className="stat-value">3</p>
        </div>
        <div className="stat-card">
          <h3>Rating</h3>
          <p className="stat-value">4.8 ⭐</p>
        </div>
      </section>

      {/* NEW: Escrow Transactions Section */}
      <section className="dashboard-escrow">
        <h2>My Escrow Transactions</h2>
        <EscrowTracking userId={userId} />
      </section>

      {/* Other dashboard sections */}
    </div>
  );
}
```

---

## Example 4: Programmatically Create Escrow Transaction

### File: `AgriChain/Frontend/src/components/BuyButton.js`

```jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function BuyButton({ listing, sellerId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuyNow = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const buyerId = localStorage.getItem('userId');

      // Create escrow transaction
      const response = await axios.post(
        '/api/escrow/initiate',
        {
          sellerId: sellerId,
          listingId: listing._id,
          crop: listing.crop,
          quantity: listing.quantity,
          unit: listing.unit,
          amount: listing.price
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Escrow transaction created! Transaction ID: ' + response.data.transactionId);

      // Redirect to escrow tracking
      window.location.href = '/escrow';
    } catch (err) {
      setError('Failed to create transaction: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="buy-button-container">
      {error && <p className="error">{error}</p>}
      <button
        onClick={handleBuyNow}
        disabled={loading}
        className="buy-btn"
      >
        {loading ? 'Processing...' : 'Buy Now via Escrow'}
      </button>
    </div>
  );
}
```

---

## Example 5: Display Performance Badges in Product Card

### File: `AgriChain/Frontend/src/components/ProductCard.js`

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductCard({ listing }) {
  const [sellerPerformance, setSellerPerformance] = useState(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await axios.get(
          `/api/reviews/summary/${listing.sellerId}`
        );
        setSellerPerformance(res.data);
      } catch (err) {
        console.error('Error fetching seller performance:', err);
      }
    };

    fetchPerformance();
  }, [listing.sellerId]);

  return (
    <div className="product-card">
      {/* Product Image & Name */}
      <img src={listing.image} alt={listing.crop} />
      <h3>{listing.crop}</h3>
      <p className="price">₹{listing.price}</p>

      {/* NEW: Seller Info with Badges */}
      {sellerPerformance && (
        <div className="seller-info">
          <div className="seller-rating">
            <span className="rating-stars">⭐ {sellerPerformance.averageRating}</span>
            <span className="review-count">({sellerPerformance.totalReviews} reviews)</span>
          </div>

          {/* Trust Badges */}
          <div className="trust-badges">
            {sellerPerformance.trustBadges?.topSeller && (
              <span className="badge badge-top-seller" title="Top Seller">🏆</span>
            )}
            {sellerPerformance.trustBadges?.reliable && (
              <span className="badge badge-reliable" title="Reliable">⚡</span>
            )}
            {sellerPerformance.trustBadges?.fastShipper && (
              <span className="badge badge-fast-shipper" title="Fast Shipper">🚚</span>
            )}
            {sellerPerformance.trustBadges?.communicative && (
              <span className="badge badge-communicative" title="Communicative">💬</span>
            )}
          </div>
        </div>
      )}

      {/* Buy Button */}
      <button onClick={() => handleBuy(listing)} className="buy-btn">
        Buy via Escrow
      </button>
    </div>
  );
}
```

---

## Example 6: Customer Review Request After Purchase

### File: `AgriChain/Frontend/src/components/ReviewPrompt.js`

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Reviews from '../views/reviews';

export default function ReviewPrompt({ transactionId, sellerUserId }) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    // Check if transaction is ready for review (status: RELEASED)
    const checkTransaction = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/escrow/${transactionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransaction(res.data);

        // Show review prompt if delivered
        if (res.data.status === 'released' || res.data.status === 'completed') {
          setShowReviewForm(true);
        }
      } catch (err) {
        console.error('Error fetching transaction:', err);
      }
    };

    checkTransaction();
  }, [transactionId]);

  return (
    <div className="review-prompt">
      {showReviewForm && (
        <div className="review-modal">
          <h2>How was your experience?</h2>
          <p>Please review your recent purchase</p>
          <Reviews userId={sellerUserId} />
        </div>
      )}
    </div>
  );
}
```

---

## Example 7: Buyer Navigation Menu

### File: `AgriChain/Frontend/src/components/Navigation.js`

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/navigation.css';

export default function Navigation() {
  const userRole = localStorage.getItem('userRole');
  const userId = localStorage.getItem('userId');

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">🌾 AgriTrust</Link>
      </div>

      <div className="nav-menu">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/marketplace" className="nav-link">Marketplace</Link>

        {/* NEW: Transaction Links */}
        {userRole && (
          <>
            <Link to="/escrow" className="nav-link">
              📦 My Transactions
            </Link>
            <Link to={`/reviews/${userId}`} className="nav-link">
              ⭐ My Reviews
            </Link>
          </>
        )}

        <Link to="/profile" className="nav-link">Profile</Link>
      </div>
    </nav>
  );
}
```

---

## Example 8: API Call for Manual Fund Release

### File: (Use in any component)

```jsx
import axios from 'axios';

// Release funds manually after confirmation
async function releaseFunds(transactionId) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `/api/escrow/${transactionId}/release-funds`,
      {}, // No body needed
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('Funds released:', response.data);
    alert('Funds released successfully!');
    
    // Reload transactions
    window.location.reload();
    
  } catch (err) {
    console.error('Error releasing funds:', err);
    alert('Failed to release funds: ' + err.response?.data?.message);
  }
}

// Usage:
// <button onClick={() => releaseFunds(transactionId)}>Release Funds</button>
```

---

## Example 9: CSS Integration for Reviews & Escrow

### File: `AgriChain/Frontend/src/styles/main.css`

```css
/* Import the new component styles */
@import './reviews.css';
@import './escrow.css';

/* Optional: Custom layout for dashboard sections */
.dashboard-escrow {
  margin: 3rem 0;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.seller-reviews-section {
  margin-top: 3rem;
  padding: 2rem;
  border-top: 1px solid #e0e0e0;
}

.trust-badges {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.badge {
  font-size: 1.2rem;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  cursor: help;
}

.seller-info {
  margin: 1rem 0;
  padding: 1rem;
  background: #f0f7ff;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.seller-rating {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 500;
}
```

---

## Example 10: Error Handling & Loading States

### File: (Generic error handler)

```jsx
import axios from 'axios';

// API request interceptor
const api = axios.create({
  baseURL: 'http://localhost:8000'
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Usage in Components:

```jsx
import api from './api';

// Instead of axios.get, use api.get
const res = await api.get('/api/escrow/user/transactions');
```

---

## 🚀 Implementation Checklist

- [ ] Add reviews and escrow routes to App.js
- [ ] Import both components in pages that need them
- [ ] Add CSS imports to main stylesheet
- [ ] Update navigation with links to /escrow and /reviews
- [ ] Add auth token to localStorage on login
- [ ] Test creating escrow transaction
- [ ] Test confirming payment
- [ ] Test submitting review
- [ ] Test viewing performance badges
- [ ] Deploy to production

