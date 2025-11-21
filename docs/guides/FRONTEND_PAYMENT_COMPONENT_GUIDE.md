# Frontend Payment Component - Implementation Guide

This guide shows how to create the payment UI component for the AgriChain frontend.

---

## File Location
**Path:** `/AgriChain/Frontend/src/views/payment.js`

---

## Component Overview

The payment component needs to:
1. Display listing details and price
2. Create escrow transaction (backend)
3. Open Razorpay payment checkout
4. Handle payment success/failure
5. Verify payment with backend
6. Redirect to order confirmation

---

## Implementation Code

### Step 1: Create Component File

```jsx
// /AgriChain/Frontend/src/views/payment.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/payment.css';

const PaymentView = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);

  // Get auth token from localStorage
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const BACKEND_URL = 'http://localhost:8000';

  // Fetch listing details
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/listings/${listingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setListing(response.data.listing);
        setLoading(false);
      } catch (err) {
        setError('Failed to load listing details');
        setLoading(false);
      }
    };

    if (listingId && token) {
      fetchListing();
    }
  }, [listingId, token]);

  // Update total amount when quantity changes
  useEffect(() => {
    if (listing) {
      setTotalAmount(listing.pricePerUnit * quantity);
    }
  }, [quantity, listing]);

  // Step 1: Create Escrow Transaction
  const createEscrowTransaction = async () => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/escrow/create`,
        {
          listingId,
          buyerId: userId,
          quantity,
          totalAmount
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.transaction._id; // Return escrow ID
    } catch (err) {
      throw new Error('Failed to create escrow transaction');
    }
  };

  // Step 2: Create Payment Order with Razorpay
  const createPaymentOrder = async (escrowId) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/payments/create-order`,
        {
          escrowId,
          amount: totalAmount
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data; // { orderId, keyId, amount, currency }
    } catch (err) {
      throw new Error('Failed to create payment order');
    }
  };

  // Step 3: Verify Payment with Backend
  const verifyPayment = async (escrowId, paymentId, signature) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/payments/verify-payment`,
        {
          orderId: orderId, // From payment response
          paymentId,
          signature
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data; // { verified: true, transaction: {...} }
    } catch (err) {
      throw new Error('Payment verification failed');
    }
  };

  // Step 4: Handle Payment Button Click
  const handlePaymentClick = async () => {
    try {
      setProcessing(true);
      setError(null);

      // 1. Create escrow transaction first
      console.log('📝 Creating escrow transaction...');
      const escrowId = await createEscrowTransaction();
      console.log('✓ Escrow created:', escrowId);

      // 2. Create payment order
      console.log('💳 Creating payment order with Razorpay...');
      const paymentOrder = await createPaymentOrder(escrowId);
      console.log('✓ Order created:', paymentOrder.orderId);

      // 3. Open Razorpay checkout
      console.log('🛒 Opening Razorpay checkout...');
      const options = {
        key: paymentOrder.keyId, // Razorpay Key ID
        amount: paymentOrder.amount, // In paise (cents)
        currency: paymentOrder.currency,
        name: 'AgriChain',
        description: `${listing.cropName} (${quantity} units)`,
        order_id: paymentOrder.orderId,
        
        // Handler called after payment is processed
        handler: async (response) => {
          try {
            console.log('✓ Payment processed by Razorpay');
            console.log('📋 Verifying payment signature...');

            // 4. Verify payment with backend
            const verifyResponse = await verifyPayment(
              escrowId,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verifyResponse.verified) {
              console.log('✓ Payment verified successfully!');
              
              // 5. Show success message and redirect
              alert('✓ Payment successful! Order confirmed.');
              navigate(`/order-confirmation/${escrowId}`);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (err) {
            console.error('❌ Verification error:', err);
            setError('Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },

        // Handler called if user closes checkout
        modal: {
          ondismiss: () => {
            console.log('User closed Razorpay checkout');
            setProcessing(false);
          }
        },

        // Handler for payment failures
        onFailure: (error) => {
          console.error('❌ Payment failed:', error);
          setError('Payment failed. Please try again.');
          setProcessing(false);
        },

        // Handler called on any error
        onError: (error) => {
          console.error('❌ Error:', error);
          setError('An error occurred. Please try again.');
          setProcessing(false);
        }
      };

      // Initialize Razorpay
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      console.error('❌ Error:', err.message);
      setError(err.message);
      setProcessing(false);
    }
  };

  // Render loading state
  if (loading) {
    return <div className="payment-container loading">Loading listing details...</div>;
  }

  // Render error state
  if (error) {
    return (
      <div className="payment-container error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }

  // Render main component
  if (!listing) {
    return <div className="payment-container">Listing not found</div>;
  }

  return (
    <div className="payment-container">
      {/* Header */}
      <div className="payment-header">
        <h1>Confirm Purchase & Payment</h1>
        <p className="subtitle">Review your order before completing payment</p>
      </div>

      {/* Order Summary */}
      <div className="payment-card order-summary">
        <div className="summary-header">
          <h2>Order Summary</h2>
        </div>

        {/* Product Details */}
        <div className="product-details">
          <div className="product-image">
            {listing.images && listing.images[0] ? (
              <img src={listing.images[0]} alt={listing.cropName} />
            ) : (
              <div className="no-image">No image</div>
            )}
          </div>

          <div className="product-info">
            <h3>{listing.cropName}</h3>
            <p className="seller-info">
              Seller: <strong>{listing.farmerName}</strong>
            </p>
            <p className="location">
              📍 {listing.district}, {listing.state}
            </p>
            
            {/* Product Specs */}
            <div className="specs">
              <div className="spec-item">
                <span className="spec-label">Available Quantity:</span>
                <span className="spec-value">{listing.quantity} units</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Price Per Unit:</span>
                <span className="spec-value">₹{listing.pricePerUnit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="quantity-section">
          <label htmlFor="quantity">Quantity to Purchase:</label>
          <div className="quantity-input">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={processing}
            >
              −
            </button>
            <input 
              type="number" 
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max={listing.quantity}
              disabled={processing}
            />
            <button 
              onClick={() => setQuantity(Math.min(listing.quantity, quantity + 1))}
              disabled={processing}
            >
              +
            </button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="price-breakdown">
          <div className="price-row">
            <span>Subtotal ({quantity} units × ₹{listing.pricePerUnit}):</span>
            <span>₹{(listing.pricePerUnit * quantity).toFixed(2)}</span>
          </div>
          <div className="price-row">
            <span>Platform Fee (2%):</span>
            <span>₹{((listing.pricePerUnit * quantity) * 0.02).toFixed(2)}</span>
          </div>
          <div className="price-row total">
            <span><strong>Total Amount:</strong></span>
            <span><strong>₹{totalAmount.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="payment-method">
          <h3>Payment Method</h3>
          <div className="method-info">
            <p>💳 Razorpay Secure Payment</p>
            <p className="method-details">
              Card, UPI, Wallet, Netbanking - All accepted
            </p>
          </div>
        </div>

        {/* Escrow Guarantee */}
        <div className="escrow-guarantee">
          <h4>🛡️ Buyer Protection</h4>
          <ul>
            <li>Payment secured in escrow</li>
            <li>Money held until delivery confirmed</li>
            <li>5-day auto-release after delivery</li>
            <li>Dispute resolution available</li>
            <li>RBI-regulated payment processor</li>
          </ul>
        </div>
      </div>

      {/* Delivery Address Card */}
      <div className="payment-card delivery-card">
        <h3>📍 Delivery Information</h3>
        <div className="info-section">
          <p><strong>Farmer Location:</strong></p>
          <p>{listing.district}, {listing.state}</p>
        </div>
        <div className="info-section">
          <p><strong>Delivery Details:</strong></p>
          <p>{listing.description || 'Contact farmer for specific delivery details'}</p>
        </div>
        <button className="secondary-btn">
          📞 Contact Farmer
        </button>
      </div>

      {/* Terms & Conditions */}
      <div className="terms-section">
        <label className="checkbox">
          <input type="checkbox" defaultChecked required />
          <span>I agree to the <a href="#terms">Terms & Conditions</a> and <a href="#privacy">Privacy Policy</a></span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="secondary-btn"
          onClick={() => navigate(`/listing/${listingId}`)}
          disabled={processing}
        >
          Cancel
        </button>
        <button 
          className="primary-btn pay-btn"
          onClick={handlePaymentClick}
          disabled={processing || quantity === 0}
        >
          {processing ? '⏳ Processing...' : `💳 Pay ₹${totalAmount.toFixed(2)}`}
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default PaymentView;
```

---

## Step 2: Create CSS Styling

```css
/* /AgriChain/Frontend/src/styles/payment.css */

.payment-container {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f8f9fa;
  border-radius: 10px;
}

.payment-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #27ae60;
  padding-bottom: 20px;
}

.payment-header h1 {
  color: #2c3e50;
  font-size: 28px;
  margin: 0 0 10px 0;
}

.payment-header .subtitle {
  color: #7f8c8d;
  font-size: 14px;
  margin: 0;
}

.payment-card {
  background: white;
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-header {
  border-bottom: 1px solid #ecf0f1;
  margin-bottom: 20px;
  padding-bottom: 15px;
}

.summary-header h2 {
  color: #2c3e50;
  font-size: 20px;
  margin: 0;
}

/* Product Details */
.product-details {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px 0;
  border-bottom: 1px solid #ecf0f1;
}

.product-image {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #ecf0f1;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;;
  background: #bdc3c7;
  color: white;
  font-size: 12px;
}

.product-info {
  flex: 1;
}

.product-info h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 18px;
}

.seller-info,
.location {
  margin: 5px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.specs {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.spec-label {
  font-size: 12px;
  color: #95a5a6;
  text-transform: uppercase;
}

.spec-value {
  font-weight: 600;
  color: #2c3e50;
}

/* Quantity Section */
.quantity-section {
  margin: 20px 0;
}

.quantity-section label {
  display: block;
  margin-bottom: 10px;
  color: #2c3e50;
  font-weight: 500;
}

.quantity-input {
  display: flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
}

.quantity-input button {
  width: 40px;
  height: 40px;
  border: 1px solid #bdc3c7;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  color: #2c3e50;
  transition: all 0.3s;
}

.quantity-input button:hover:not(:disabled) {
  background: #27ae60;
  color: white;
  border-color: #27ae60;
}

.quantity-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-input input {
  width: 80px;
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  text-align: center;
  font-size: 16px;
  color: #2c3e50;
}

/* Price Breakdown */
.price-breakdown {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  color: #2c3e50;
  font-size: 14px;
}

.price-row.total {
  border-top: 2px solid #27ae60;
  padding-top: 10px;
  margin-top: 15px;
  font-size: 18px;
  color: #27ae60;
}

/* Payment Method */
.payment-method {
  background: #e8f8f5;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
  border-left: 4px solid #27ae60;
}

.payment-method h3 {
  margin: 0 0 10px 0;
  color: #27ae60;
  font-size: 16px;
}

.method-info p {
  margin: 5px 0;
  color: #2c3e50;
}

.method-details {
  color: #7f8c8d;
  font-size: 13px;
}

/* Escrow Guarantee */
.escrow-guarantee {
  background: #fef9e7;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #f39c12;
}

.escrow-guarantee h4 {
  margin: 0 0 10px 0;
  color: #f39c12;
}

.escrow-guarantee ul {
  margin: 0;
  padding-left: 20px;
  color: #2c3e50;
  font-size: 13px;
}

.escrow-guarantee li {
  margin: 5px 0;
}

/* Delivery Card */
.delivery-card {
  background: white;
}

.delivery-card h3 {
  color: #2c3e50;
  margin-top: 0;
}

.info-section {
  margin: 15px 0;
  padding: 10px 0;
  border-bottom: 1px solid #ecf0f1;
}

.info-section p {
  margin: 5px 0;
  color: #2c3e50;
}

.info-section strong {
  color: #2c3e50;
}

.secondary-btn {
  padding: 10px 20px;
  border: 1px solid #bdc3c7;
  background: white;
  color: #2c3e50;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.secondary-btn:hover {
  background: #ecf0f1;
  border-color: #7f8c8d;
}

/* Terms Section */
.terms-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
}

.checkbox input {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.checkbox a {
  color: #27ae60;
  text-decoration: none;
}

.checkbox a:hover {
  text-decoration: underline;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}

.primary-btn {
  padding: 14px 35px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
}

.primary-btn:hover:not(:disabled) {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pay-btn {
  min-width: 180px;
}

/* Error Message */
.error-message {
  background: #fadbd8;
  border-left: 4px solid #e74c3c;
  color: #c0392b;
  padding: 15px;
  border-radius: 6px;
  margin-top: 20px;
  font-size: 14px;
}

/* Loading & Error States */
.payment-container.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  font-size: 16px;
  color: #7f8c8d;
}

.payment-container.error {
  text-align: center;
  padding: 40px;
  background: #fadbd8;
  border-radius: 10px;
}

.payment-container.error h2 {
  color: #c0392b;
  margin: 0 0 15px 0;
}

.payment-container.error p {
  color: #922b21;
  margin: 10px 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .payment-container {
    padding: 15px;
    margin: 10px;
  }

  .product-details {
    flex-direction: column;
  }

  .product-image {
    width: 100%;
    height: 200px;
  }

  .specs {
    flex-direction: column;
  }

  .action-buttons {
    flex-direction: column-reverse;
  }

  .action-buttons button {
    width: 100%;
  }

  .price-row {
    font-size: 12px;
  }

  .payment-header h1 {
    font-size: 22px;
  }
}
```

---

## Step 3: Add Route to Index.js

```jsx
// In /AgriChain/Frontend/src/index.js

import PaymentView from './views/payment';

// Add to your routes:
<Route path="/payment/:listingId" element={<PaymentView />} />
```

---

## Step 4: Add Razorpay Script to HTML

```html
<!-- In /AgriChain/Frontend/public/index.html -->
<!-- Add this before closing </head> tag -->

<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## Step 5: Link from Listing View

```jsx
// In your listing view, add button:
<button onClick={() => navigate(`/payment/${listingId}`)}>
  Proceed to Payment
</button>
```

---

## Testing the Payment Flow

### 1. Navigate to Payment Page
```
http://localhost:3000/payment/[LISTING_ID]
```

### 2. Review Order
- Check crop name, quantity, price
- Adjust quantity if needed
- Review escrow guarantee

### 3. Click "Pay" Button
- Razorpay checkout opens
- Select payment method (Card, UPI, Wallet)

### 4. Complete Payment
Use test card: **4111 1111 1111 1111**
- Expiry: Any future date
- CVV: Any 3 digits

### 5. Verify Payment
- Backend verifies signature
- Escrow transaction created
- Redirect to confirmation page

---

## What Happens Next

After payment verification:
1. ✅ Escrow created with status: "funded"
2. ✅ Money held in Razorpay (not on app)
3. ✅ 5-day auto-release timer starts
4. ✅ Seller notified via SMS
5. ✅ Blockchain records transaction
6. ✅ Delivery process begins

---

## Error Handling

The component handles:
- Network errors
- Invalid listings
- Payment signature failures
- Razorpay API errors
- User cancellation
- Database errors

All errors show user-friendly messages.

---

## Security Notes

✅ JWT token required for all API calls  
✅ Payment signature verified server-side  
✅ Never store sensitive payment data  
✅ HTTPS required in production  
✅ CSP headers for Razorpay script  

---

**Status:** Ready to implement  
**Estimated Time:** 30-45 minutes  
**Difficulty:** Intermediate  

