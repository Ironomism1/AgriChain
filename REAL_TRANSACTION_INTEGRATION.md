# 🔄 Real Transaction Integration with Mock System

## Overview

This guide shows you how to **integrate real transactions from your existing backend** with the new payment request system. Users will see:
- ✅ Real payment requests (from PaymentRequest collection)
- ✅ Real escrow transactions (from EscrowTransaction collection)
- ✅ Mock demo data (for testing when real data is unavailable)

---

## Current State

### What Already Exists (Backend)

1. **EscrowTransaction Schema** (`models/EscrowTransaction.js`)
   - 5-stage workflow: pending → funded → confirmed → released → completed
   - Fields: buyerId, sellerId, amount, status, payment details
   - Real transactions between contractors and farmers

2. **Escrow Routes** (`routes/escrow.js`)
   - GET `/api/escrow/user-transactions` - Get user's transactions
   - POST `/api/escrow/initiate` - Create new transaction

3. **Real Demo Data** 
   - Already has transactions between contractors and farmers
   - Ready to display in UI

---

## Solution: Unified Transaction View

### Step 1: Create Backend Endpoint for All Transactions

Add this to `routes/escrow.js`:

```javascript
/**
 * GET /api/escrow/all-transactions
 * Get all transactions (escrow + payment requests) for current user
 */
router.get('/all-transactions', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get escrow transactions
    const escrowTransactions = await EscrowTransaction.find({
      $or: [
        { buyerId: userId },
        { sellerId: userId }
      ]
    })
      .populate('buyerId', 'name phone')
      .populate('sellerId', 'name phone')
      .sort({ createdAt: -1 });

    // Get payment requests (requires PaymentRequest schema)
    const paymentRequests = await PaymentRequest.find({
      $or: [
        { senderId: userId },
        { recipientId: userId }
      ]
    })
      .populate('senderId', 'name phone')
      .populate('recipientId', 'name phone')
      .sort({ createdAt: -1 });

    // Combine and format
    const allTransactions = [
      ...escrowTransactions.map(et => ({
        _id: et._id,
        type: 'escrow',
        crop: et.crop,
        amount: et.amount,
        status: et.status,
        otherParty: et.buyerId._id.toString() === userId 
          ? et.sellerId 
          : et.buyerId,
        createdAt: et.createdAt,
        updatedAt: et.updatedAt,
        paymentMethod: et.payment?.method,
        deliveryStatus: et.delivery?.status,
        escrowStatus: et.status
      })),
      ...paymentRequests.map(pr => ({
        _id: pr._id,
        type: 'payment-request',
        crop: pr.crop,
        amount: pr.amount,
        status: pr.status,
        otherParty: pr.senderId._id.toString() === userId 
          ? pr.recipientId 
          : pr.senderId,
        createdAt: pr.createdAt,
        updatedAt: pr.updatedAt,
        dueDate: pr.dueDate,
        description: pr.description
      }))
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      transactions: allTransactions,
      summary: {
        totalTransactions: allTransactions.length,
        escrowCount: escrowTransactions.length,
        paymentRequestsCount: paymentRequests.length,
        pendingCount: allTransactions.filter(t => t.status === 'pending').length,
        completedCount: allTransactions.filter(t => t.status === 'completed').length
      }
    });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions'
    });
  }
});

module.exports = router;
```

---

### Step 2: Update TransactionHistory Component

Modify `transaction-history.js` to fetch real data:

```javascript
import React, { useState, useEffect } from 'react';
import './transaction-history.css';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, escrow, requests, pending, completed
  const [searchTerm, setSearchTerm] = useState('');

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, filter, searchTerm]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Try fetching real data from backend
      const response = await fetch('http://localhost:8000/api/escrow/all-transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setError('');
      } else {
        // If endpoint doesn't exist yet, use mock data
        loadMockData();
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockTransactions = [
      // Real escrow transactions
      {
        _id: 'txn_1',
        type: 'escrow',
        crop: 'Wheat',
        amount: 15000,
        status: 'funded',
        otherParty: {
          name: 'Rajesh Kumar',
          phone: '9876543210'
        },
        createdAt: '2024-11-18',
        paymentMethod: 'razorpay',
        escrowStatus: 'funded'
      },
      {
        _id: 'txn_2',
        type: 'escrow',
        crop: 'Rice',
        amount: 25000,
        status: 'confirmed',
        otherParty: {
          name: 'Merchant Akhil',
          phone: '9876543211'
        },
        createdAt: '2024-11-15',
        paymentMethod: 'razorpay',
        escrowStatus: 'confirmed'
      },
      // Payment requests
      {
        _id: 'req_1',
        type: 'payment-request',
        crop: 'Groundnut',
        amount: 8000,
        status: 'pending',
        otherParty: {
          name: 'Priya Singh',
          phone: '9876543220'
        },
        createdAt: '2024-11-20',
        dueDate: '2024-12-20',
        description: 'Bulk order for oil extraction'
      },
      {
        _id: 'req_2',
        type: 'payment-request',
        crop: 'Soybean',
        amount: 5000,
        status: 'accepted',
        otherParty: {
          name: 'Arjun Patel',
          phone: '9876543221'
        },
        createdAt: '2024-11-17',
        dueDate: '2024-12-05'
      }
    ];

    setTransactions(mockTransactions);
    setError('Using demo data. Backend connection will show real transactions.');
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Apply status filter
    if (filter === 'pending') {
      filtered = filtered.filter(t => t.status === 'pending');
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.status === 'completed' || t.status === 'released');
    } else if (filter === 'escrow') {
      filtered = filtered.filter(t => t.type === 'escrow');
    } else if (filter === 'requests') {
      filtered = filtered.filter(t => t.type === 'payment-request');
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.otherParty.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const getStatusBadgeClass = (status, type) => {
    if (type === 'payment-request') {
      return `status-${status}`; // pending, accepted, rejected
    } else {
      return `status-${status}`; // pending, funded, confirmed, released, completed
    }
  };

  const getTypeIcon = (type) => {
    return type === 'escrow' ? '💳' : '📋';
  };

  const getStatusLabel = (status, type) => {
    if (type === 'payment-request') {
      const labels = {
        pending: '⏳ Pending',
        accepted: '✅ Accepted',
        rejected: '❌ Rejected',
        paid: '💰 Paid'
      };
      return labels[status] || status;
    } else {
      const labels = {
        pending: '⏳ Pending',
        funded: '💰 Funded',
        confirmed: '✅ Confirmed',
        released: '📦 Released',
        completed: '✅ Completed',
        dispute: '⚠️ Dispute'
      };
      return labels[status] || status;
    }
  };

  return (
    <div className="transaction-history-container">
      <div className="history-header">
        <h1>📊 Transaction History</h1>
        <p className="subtitle">
          {transactions.length} total transactions
          {transactions.length > 0 && ` (${transactions.filter(t => t.status === 'pending').length} pending)`}
        </p>
      </div>

      {error && (
        <div className="info-message">
          ℹ️ {error}
        </div>
      )}

      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by crop or party name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({transactions.length})
          </button>
          <button
            className={`filter-btn ${filter === 'escrow' ? 'active' : ''}`}
            onClick={() => setFilter('escrow')}
          >
            💳 Escrow ({transactions.filter(t => t.type === 'escrow').length})
          </button>
          <button
            className={`filter-btn ${filter === 'requests' ? 'active' : ''}`}
            onClick={() => setFilter('requests')}
          >
            📋 Requests ({transactions.filter(t => t.type === 'payment-request').length})
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            ⏳ Pending
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            ✅ Completed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading transactions...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="empty-state">
          No transactions found {searchTerm && `matching "${searchTerm}"`}
        </div>
      ) : (
        <div className="transactions-list">
          {filteredTransactions.map((transaction) => (
            <div key={transaction._id} className="transaction-card">
              <div className="transaction-header">
                <div className="left">
                  <span className="type-icon">{getTypeIcon(transaction.type)}</span>
                  <div className="transaction-info">
                    <h3>{transaction.crop}</h3>
                    <p className="party-name">
                      {transaction.otherParty.name}
                      <span className="phone"> • {transaction.otherParty.phone}</span>
                    </p>
                  </div>
                </div>
                <div className="right">
                  <div className="amount">₹{transaction.amount.toLocaleString()}</div>
                  <div className={`status-badge ${getStatusBadgeClass(transaction.status, transaction.type)}`}>
                    {getStatusLabel(transaction.status, transaction.type)}
                  </div>
                </div>
              </div>

              <div className="transaction-body">
                <div className="detail-item">
                  <span className="label">Type:</span>
                  <span className="value">
                    {transaction.type === 'escrow' ? 'Escrow Transaction' : 'Payment Request'}
                  </span>
                </div>

                {transaction.description && (
                  <div className="detail-item">
                    <span className="label">Description:</span>
                    <span className="value">{transaction.description}</span>
                  </div>
                )}

                {transaction.dueDate && (
                  <div className="detail-item">
                    <span className="label">Due Date:</span>
                    <span className="value">{transaction.dueDate}</span>
                  </div>
                )}

                <div className="detail-item">
                  <span className="label">Date:</span>
                  <span className="value">{new Date(transaction.createdAt).toLocaleDateString()}</span>
                </div>

                {transaction.type === 'escrow' && transaction.paymentMethod && (
                  <div className="detail-item">
                    <span className="label">Payment Method:</span>
                    <span className="value">{transaction.paymentMethod}</span>
                  </div>
                )}

                {transaction.type === 'escrow' && transaction.deliveryStatus && (
                  <div className="detail-item">
                    <span className="label">Delivery Status:</span>
                    <span className="value">{transaction.deliveryStatus}</span>
                  </div>
                )}
              </div>

              <div className="transaction-actions">
                {transaction.type === 'payment-request' && transaction.status === 'pending' && (
                  <button className="action-btn btn-review">📋 Review Request</button>
                )}
                {transaction.type === 'escrow' && transaction.status === 'pending' && (
                  <button className="action-btn btn-pay">💳 Complete Payment</button>
                )}
                {transaction.type === 'escrow' && transaction.status === 'funded' && (
                  <button className="action-btn btn-track">📦 Track Delivery</button>
                )}
                <button className="action-btn btn-details">📄 View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
```

---

### Step 3: Update PaymentRequest Routes to Support All Endpoint

Add to `routes/paymentRequests.js`:

```javascript
/**
 * GET /api/payment-requests/all
 * Get all payment requests (sent and received)
 */
router.get('/all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Replace with real database query
    // const requests = await PaymentRequest.find({
    //   $or: [
    //     { senderId: userId },
    //     { recipientId: userId }
    //   ]
    // }).sort({ createdAt: -1 });

    // Mock data
    const requests = [
      {
        id: 'req_1',
        senderId: 'user_1',
        crop: 'Wheat',
        amount: 15000,
        status: 'pending'
      }
    ];

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch payment requests'
    });
  }
});
```

---

## Display Real Data: Step-by-Step

### 1. Backend Shows Real Transactions

When user logs in, they see:
```
GET /api/escrow/all-transactions
Returns: [
  { _id: txn_1, type: 'escrow', crop: 'Wheat', amount: 15000, ... },
  { _id: req_1, type: 'payment-request', crop: 'Groundnut', amount: 8000, ... }
]
```

### 2. Frontend Displays Both Types

Transaction History shows unified view:
```
┌─────────────────────────────────────┐
│ 💳 Wheat               | ₹15,000     │  ← Real escrow transaction
│ From: Rajesh Kumar     | ✅ Confirmed│
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📋 Groundnut           | ₹8,000      │  ← Real payment request
│ From: Priya Singh      | ⏳ Pending  │
└─────────────────────────────────────┘
```

### 3. User Can Filter

- **All Transactions** - Shows escrow + requests
- **💳 Escrow** - Only escrow transactions
- **📋 Requests** - Only payment requests
- **⏳ Pending** - Awaiting action
- **✅ Completed** - Finished deals

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────┐
│          Real Backend Database                   │
│                                                  │
│  EscrowTransaction Collection                    │
│  - buyerId, sellerId, amount, status             │
│  - Real deals between contractors/farmers        │
│                                                  │
│  PaymentRequest Collection                       │
│  - senderId, recipientId, amount, status         │
│  - Payment negotiation requests                  │
└──────────────────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────┐
│  Backend API Endpoint                            │
│  GET /api/escrow/all-transactions                │
│  Combines both collections                       │
│  Returns unified transaction array               │
└──────────────────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────┐
│  Frontend (React)                                │
│                                                  │
│  TransactionHistory Component                    │
│  - Fetches from /api/escrow/all-transactions     │
│  - Maps to unified transaction format            │
│  - Displays with filters & search                │
│  - Falls back to mock data if API unavailable    │
└──────────────────────────────────────────────────┘
```

---

## Example: How Real Data Flows

### User: Rajesh Kumar (Farmer)

**Real Transactions in Database:**
```javascript
// Escrow Transaction (He sold wheat)
{
  _id: ObjectId(...),
  buyerId: ObjectId(...),      // Merchant who bought from him
  sellerId: ObjectId('rajesh'),
  crop: 'Wheat',
  amount: 15000,
  status: 'confirmed',
  createdAt: '2024-11-18'
}

// Payment Request (He wants to buy groundnuts)
{
  _id: ObjectId(...),
  senderId: ObjectId('rajesh'),
  recipientId: ObjectId(...),  // Farmer who has groundnuts
  crop: 'Groundnut',
  amount: 8000,
  status: 'pending',
  createdAt: '2024-11-20'
}
```

**When Rajesh Views History:**
```
GET /api/escrow/all-transactions

Response combines both:
[
  {
    type: 'escrow',
    crop: 'Wheat',
    amount: 15000,
    status: 'confirmed',
    otherParty: { name: 'Merchant Akhil', ... }
  },
  {
    type: 'payment-request',
    crop: 'Groundnut',
    amount: 8000,
    status: 'pending',
    otherParty: { name: 'Priya Singh', ... }
  }
]

Displayed in UI:
💳 Wheat        ₹15,000   ✅ Confirmed
📋 Groundnut    ₹8,000    ⏳ Pending
```

---

## Testing

### Test 1: With Real Backend Data
```
1. Ensure EscrowTransaction and PaymentRequest exist in MongoDB
2. Login as user with real transactions
3. Visit /transaction-history
4. Should see real transactions mixed with payment requests
```

### Test 2: Without Real Data (Mock Fallback)
```
1. Disconnect from backend
2. Visit /transaction-history
3. Should show mock demo data
4. All features work the same way
```

### Test 3: Filtering Works
```
1. Have mix of escrow and payment requests
2. Click "💳 Escrow" filter
3. Should show only escrow transactions
4. Click "📋 Requests" filter
5. Should show only payment requests
```

---

## Summary

**You Now Have:**
- ✅ Real transactions from backend (EscrowTransaction)
- ✅ New payment request system (PaymentRequest)
- ✅ Unified transaction history view
- ✅ Mock data fallback
- ✅ Filtering and search capabilities

**What It Does:**
1. User logs in → Backend queries both collections
2. Combines escrow transactions + payment requests
3. Frontend displays unified history
4. User can filter by type, status, or search by crop

**Next Steps:**
1. Implement `/api/escrow/all-transactions` endpoint
2. Test with real data in your database
3. Verify farmers and contractors see correct transactions
4. Add notifications when payment requests received

---

**Status:** ✅ READY FOR IMPLEMENTATION
**Last Updated:** 2024-11-20
