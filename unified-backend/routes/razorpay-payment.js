const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const { authMiddleware } = require('../middleware/authMiddleware');
const EscrowTransaction = require('../models/EscrowTransaction');
const User = require('../models/User');

// Initialize Razorpay
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * POST /api/payments/create-order
 * Create Razorpay order for payment
 * Called by buyer when confirming payment
 */
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { escrowId, amount } = req.body;

    if (!escrowId || !amount) {
      return res.status(400).json({ error: 'Missing escrowId or amount' });
    }

    // Verify escrow exists and user is either buyer or seller (for bidirectional contracts)
    const escrow = await EscrowTransaction.findById(escrowId);
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow transaction not found' });
    }

    // Allow both buyer and seller to create payment order (for contracts with bidirectional payments)
    const isBuyer = escrow.buyerId.toString() === req.user.id;
    const isSeller = escrow.sellerId.toString() === req.user.id;
    
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Only involved parties can create payment order' });
    }

    // Prevent duplicate orders
    if (escrow.razorpayOrderId) {
      return res.status(400).json({ error: 'Order already created for this transaction' });
    }

    // Check if Razorpay credentials are properly configured
    const isTestMode = !process.env.RAZORPAY_KEY_SECRET || 
                       process.env.RAZORPAY_KEY_SECRET.includes('NEED_THIS') ||
                       process.env.RAZORPAY_KEY_SECRET.length < 10;

    let order;

    if (isTestMode) {
      // Mock order for testing - when real credentials are not available
      console.log('⚠️ TEST MODE: Using mock Razorpay order. Add real credentials to .env to use live Razorpay');
      order = {
        id: `order_test_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: escrowId.toString(),
        status: 'created'
      };
    } else {
      // Real Razorpay order
      order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: escrowId.toString(),
        notes: {
          escrowId: escrowId,
          crop: escrow.crop,
          quantity: escrow.quantity
        },
        payment_capture: 1 // Auto-capture payment
      });
    }

    // Store order ID in DB
    escrow.razorpayOrderId = order.id;
    await escrow.save();

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      testMode: isTestMode,
      message: isTestMode ? 'Using test/mock payment. Add real Razorpay credentials to .env for live payments.' : 'Using live Razorpay'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create payment order', details: error.message });
  }
});

/**
 * POST /api/payments/verify-payment
 * Verify Razorpay payment signature
 * Called by frontend after buyer completes payment
 */
router.post('/verify-payment', authMiddleware, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // Check if in test mode
    const isTestMode = !process.env.RAZORPAY_KEY_SECRET || 
                       process.env.RAZORPAY_KEY_SECRET.includes('NEED_THIS') ||
                       process.env.RAZORPAY_KEY_SECRET.length < 10;

    // Find escrow by order ID
    const escrow = await EscrowTransaction.findOne({ razorpayOrderId: orderId });
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    // Allow both buyer and seller to verify payment (for bidirectional contracts)
    const isBuyer = escrow.buyerId.toString() === req.user.id;
    const isSeller = escrow.sellerId.toString() === req.user.id;
    
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let verified = false;

    if (isTestMode) {
      // In test mode, auto-verify any payment
      console.log('⚠️ TEST MODE: Auto-verifying payment:', paymentId);
      verified = true;
    } else {
      // Real verification with signature
      if (!signature) {
        return res.status(400).json({ error: 'Missing signature' });
      }

      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).json({ 
          error: 'Payment verification failed - Invalid signature',
          verified: false 
        });
      }

      // Fetch payment details from Razorpay to double-check
      const payment = await razorpay.payments.fetch(paymentId);

      if (payment.status !== 'captured') {
        return res.status(400).json({ 
          error: 'Payment not captured',
          verified: false 
        });
      }

      verified = true;
    }

    if (verified) {
      // Update escrow transaction
      escrow.razorpayPaymentId = paymentId;
      escrow.payment.status = 'confirmed';
      escrow.payment.method = 'online';
      escrow.payment.transactionRef = paymentId;
      escrow.payment.confirmedAt = new Date();
      escrow.status = 'funded'; // Move to funded status
      escrow.funds = escrow.funds || {};
      escrow.funds.inEscrow = escrow.amount;
      escrow.autoReleaseScheduledFor = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days

      await escrow.save();

      // Send SMS to seller (if seller exists)
      try {
        if (escrow.sellerId) {
          const seller = await User.findById(escrow.sellerId);
          if (seller && seller.phone) {
            // await sendSMS(seller.phone, 
            //   `Payment confirmed for your ${escrow.crop} listing. Amount: ₹${escrow.amount}. Please ship the product.`
            // );
          }
        }
      } catch (smsErr) {
        console.error('SMS notification error:', smsErr);
        // Don't fail the payment if SMS fails
      }

      res.status(200).json({
        success: true,
        verified: true,
        message: 'Payment verified successfully',
        transactionId: escrow.transactionId,
        status: escrow.status
      });
    } else {
      return res.status(400).json({ 
        error: 'Payment verification failed',
        verified: false 
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Payment verification failed', details: error.message });
  }
});

/**
 * POST /api/payments/release-funds
 * Release funds to seller's account via Razorpay
 * Called by buyer or automatically after auto-release timer
 */
router.post('/release-funds', authMiddleware, async (req, res) => {
  try {
    const { escrowId } = req.body;

    // Find escrow
    const escrow = await EscrowTransaction.findById(escrowId);
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    // Only buyer can manually release, or system via admin middleware
    if (req.user.id !== escrow.buyerId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only buyer can release funds' });
    }

    if (escrow.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot release funds. Current status: ${escrow.status}` });
    }

    // Get seller's linked account
    const seller = await User.findById(escrow.sellerId);
    if (!seller.razorpayAccountId) {
      return res.status(400).json({ 
        error: 'Seller account not linked. Please contact seller to complete KYC.' 
      });
    }

    // Calculate amount to transfer (2% platform fee)
    const platformFee = Math.round(escrow.amount * 0.02 * 100) / 100;
    const sellerAmount = Math.round((escrow.amount - platformFee) * 100); // Convert to paise

    // Create transfer to seller's linked account
    const transfer = await razorpay.transfers.create({
      account: seller.razorpayAccountId,
      amount: sellerAmount,
      currency: 'INR',
      source: 'payment',
      source_id: escrow.razorpayPaymentId,
      receipt: `RLS-${escrow._id}-${Date.now()}`,
      notes: {
        escrowId: escrow._id.toString(),
        crop: escrow.crop,
        quantity: escrow.quantity
      }
    });

    // Update escrow
    escrow.razorpayTransferId = transfer.id;
    escrow.funds.released = escrow.amount - platformFee;
    escrow.status = 'released';
    escrow.releaseAuthorization.buyerAuthorized = true;
    escrow.releaseAuthorization.releaseTime = new Date();
    await escrow.save();

    // Send notifications
    try {
      const buyer = await User.findById(escrow.buyerId);
      await sendSMS(buyer.phone, 
        `Funds released to seller. Amount: ₹${(escrow.amount - platformFee)/100}. Transaction complete.`
      );
      await sendSMS(seller.phone, 
        `Funds received! Amount: ₹${(escrow.amount - platformFee)/100} transferred to your bank account.`
      );
    } catch (err) {
      console.error('Notification error:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Funds released successfully',
      transfer: {
        transferId: transfer.id,
        amount: sellerAmount / 100,
        status: transfer.status
      }
    });
  } catch (error) {
    console.error('Release funds error:', error);
    res.status(500).json({ error: error.message || 'Failed to release funds' });
  }
});

/**
 * POST /api/payments/webhook
 * Razorpay webhook for payment events
 * Handles: payment authorized, transfer settled, etc.
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body.toString();

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature');
      return res.sendStatus(400);
    }

    const event = JSON.parse(body);

    console.log('Webhook event:', event.event);

    switch (event.event) {
      case 'payment.authorized':
        await handlePaymentAuthorized(event.payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case 'transfer.settled':
        await handleTransferSettled(event.payload.transfer.entity);
        break;

      default:
        console.log('Unhandled event:', event.event);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(400);
  }
});

// ==================== HELPER FUNCTIONS ====================

async function handlePaymentAuthorized(payment) {
  try {
    const escrow = await EscrowTransaction.findOne({ 
      razorpayPaymentId: payment.id 
    });

    if (escrow) {
      console.log('Payment authorized:', payment.id);
      // Could send additional confirmation here
    }
  } catch (err) {
    console.error('Error handling payment authorized:', err);
  }
}

async function handlePaymentFailed(payment) {
  try {
    const escrow = await EscrowTransaction.findOne({ 
      razorpayOrderId: payment.order_id 
    });

    if (escrow) {
      console.log('Payment failed:', payment.id);
      
      // Update escrow status
      escrow.payment.status = 'failed';
      escrow.status = 'pending';
      await escrow.save();

      // Notify buyer
      const buyer = await User.findById(escrow.buyerId);
      await sendSMS(buyer.phone, 
        `Payment failed for ${escrow.crop} listing. Please try again.`
      );
    }
  } catch (err) {
    console.error('Error handling payment failed:', err);
  }
}

async function handleTransferSettled(transfer) {
  try {
    const escrow = await EscrowTransaction.findOne({ 
      razorpayTransferId: transfer.id 
    });

    if (escrow) {
      console.log('Transfer settled:', transfer.id);
      
      // Update escrow status
      escrow.funds.released = transfer.amount / 100;
      escrow.releaseAuthorization.adminApproved = true;
      await escrow.save();

      // Could trigger review reminder here
    }
  } catch (err) {
    console.error('Error handling transfer settled:', err);
  }
}

/**
 * Mock SMS function - Replace with actual Twilio integration
 */
async function sendSMS(phone, message) {
  // For now, just log
  console.log(`SMS to ${phone}: ${message}`);
  
  // TODO: Integrate Twilio
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   body: message,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phone
  // });
}

/**
 * GET /api/payments/transactions/:userId
 * Get all transactions for a user with payment details
 */
router.get('/transactions/:userId', authMiddleware, async (req, res) => {
  try {
    const transactions = await EscrowTransaction.find({
      $or: [
        { buyerId: req.params.userId },
        { sellerId: req.params.userId }
      ]
    })
    .populate('buyerId', 'name email phone')
    .populate('sellerId', 'name email phone')
    .select('-__v')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
