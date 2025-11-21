const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const User = require('../models/User');
const EscrowTransaction = require('../models/EscrowTransaction');
const PaymentRequest = require('../models/PaymentRequest');

// PaymentRequest Schema Model
// Note: You may want to create a separate PaymentRequest schema in your models folder
// For now, we'll use a pseudo-implementation that can be expanded

/**
 * CREATE PAYMENT REQUEST
 * POST /api/payment-requests/create
 * Send a payment request to another user
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const {
      recipientName,
      recipientPhone,
      crop,
      quantity,
      unit,
      amount,
      advancePercentage,
      description,
      dueDate,
      senderName,
      senderPhone,
      allowBidirectional
    } = req.body;

    // Validation: Check required fields
    if (!recipientName || !crop || !amount || !recipientPhone) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Validate name: must be at least 2 characters
    if (recipientName.trim().length < 2) {
      return res.status(400).json({
        error: 'Recipient name must be at least 2 characters'
      });
    }

    // Allow letters, numbers, and spaces in names
    if (!/^[a-zA-Z0-9\s]+$/.test(recipientName)) {
      return res.status(400).json({
        error: 'Name can only contain letters, numbers, and spaces'
      });
    }

    // Validate phone: must be 10 digits
    const cleanPhone = recipientPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        error: 'Phone number must be 10 digits'
      });
    }

    // Validate amount is positive
    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0'
      });
    }

    // Validate advance percentage is one of the allowed values
    const validPercentages = [10, 20, 30];
    const advPercent = parseInt(advancePercentage) || 20;
    if (!validPercentages.includes(advPercent)) {
      return res.status(400).json({
        error: 'Advance percentage must be 10%, 20%, or 30%'
      });
    }

    // Find recipient by name/phone
    const recipient = await User.findOne({
      $or: [{ name: recipientName }, { phone: cleanPhone }]
    });

    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found. Please verify the phone number.'
      });
    }

    // Calculate advance amount
    const advanceAmount = Math.round(amount * (advPercent / 100));

    // Create and save PaymentRequest document
    const paymentRequest = new PaymentRequest({
      senderId: req.user.id,
      senderName: senderName || req.user.name,
      senderPhone: senderPhone || req.user.phone,
      recipientId: recipient._id,
      recipientName: recipientName,
      recipientPhone: cleanPhone,
      crop: crop,
      quantity: quantity,
      unit: unit || 'kg',
      amount: amount,
      advancePercentage: advPercent,
      advanceAmount: advanceAmount,
      allowBidirectional: allowBidirectional !== false,
      isContract: true,
      description: description,
      status: 'pending',
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await paymentRequest.save();

    // Send notification to recipient (optional)
    try {
      const Notification = require('../models/Notification');
      const notification = new Notification({
        userId: recipient._id,
        type: 'contract_received',
        title: 'New Contract Request',
        message: `${senderName || 'Someone'} sent you a contract for ${crop}`,
        relatedId: paymentRequest._id,
        relatedType: 'PaymentRequest',
        data: {
          crop: crop,
          amount: amount,
          advanceAmount: advanceAmount,
          senderName: senderName
        }
      });
      await notification.save();
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Contract created successfully',
      request: paymentRequest
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({
      error: 'Failed to create contract'
    });
  }
});

/**
 * GET RECEIVED PAYMENT REQUESTS
 * GET /api/payment-requests/received
 * Get all payment requests received by the logged-in user
 */
router.get('/received', authMiddleware, async (req, res) => {
  try {
    const requests = await PaymentRequest.find({
      recipientId: req.user.id,
      status: { $in: ['pending', 'accepted'] }
    })
      .populate('senderId', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching received requests:', error);
    res.status(500).json({
      error: 'Failed to fetch payment requests'
    });
  }
});

/**
 * GET SENT PAYMENT REQUESTS
 * GET /api/payment-requests/sent
 * Get all payment requests sent by the logged-in user
 */
router.get('/sent', authMiddleware, async (req, res) => {
  try {
    const requests = await PaymentRequest.find({
      senderId: req.user.id
    })
      .populate('recipientId', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({
      error: 'Failed to fetch payment requests'
    });
  }
});

/**
 * GET COMPLETED PAYMENT REQUESTS
 * GET /api/payment-requests/completed
 * Get all completed payment requests (both sent and received)
 */
router.get('/completed', authMiddleware, async (req, res) => {
  try {
    const completed = await PaymentRequest.find({
      $or: [{ senderId: req.user.id }, { recipientId: req.user.id }],
      status: 'paid'
    })
      .populate('senderId', 'name phone')
      .populate('recipientId', 'name phone')
      .sort({ paidAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: completed
    });
  } catch (error) {
    console.error('Error fetching completed requests:', error);
    res.status(500).json({
      error: 'Failed to fetch completed requests'
    });
  }
});

/**
 * ACCEPT PAYMENT REQUEST
 * POST /api/payment-requests/:requestId/accept
 * Accept a payment request and create an EscrowTransaction
 */
router.post('/:requestId/accept', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { paymentMethod } = req.body;

    // Validate requestId
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      return res.status(400).json({
        error: 'Invalid payment request ID'
      });
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(requestId)) {
      return res.status(400).json({
        error: 'Invalid payment request ID format'
      });
    }

    // Get payment request from database
    const paymentRequest = await PaymentRequest.findById(requestId);

    if (!paymentRequest) {
      return res.status(404).json({
        error: 'Payment request not found'
      });
    }

    // Check if user is the recipient
    if (paymentRequest.recipientId.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Unauthorized to accept this request'
      });
    }

    // Check if already accepted or paid
    if (paymentRequest.status === 'accepted' || paymentRequest.status === 'paid') {
      return res.status(400).json({
        error: 'Payment request already accepted or paid'
      });
    }

    // Determine payment method (default to razorpay if not specified)
    const method = paymentMethod && ['mock', 'razorpay'].includes(paymentMethod) ? paymentMethod : 'razorpay';

    // Create an EscrowTransaction from the payment request
    const escrowTransaction = new EscrowTransaction({
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      buyerId: paymentRequest.senderId,
      sellerId: paymentRequest.recipientId,
      crop: paymentRequest.crop,
      quantity: paymentRequest.quantity,
      unit: paymentRequest.unit,
      amount: paymentRequest.amount,
      status: 'pending', // Start at pending, waiting for payment
      paymentRequestId: paymentRequest._id,
      payment: {
        amount: paymentRequest.amount,
        status: 'pending',
        method: method
      },
      createdAt: new Date()
    });

    await escrowTransaction.save();

    // Update payment request status to 'accepted'
    paymentRequest.status = 'accepted';
    paymentRequest.acceptedAt = new Date();
    paymentRequest.escrowTransactionId = escrowTransaction._id;
    paymentRequest.updatedAt = new Date();
    await paymentRequest.save();

    res.status(200).json({
      success: true,
      message: 'Payment request accepted. Moving to payment...',
      transaction: {
        id: escrowTransaction._id,
        transactionId: escrowTransaction.transactionId,
        amount: escrowTransaction.amount
      },
      escrowId: escrowTransaction._id,
      redirectTo: `/payment?escrowId=${escrowTransaction._id}&transactionId=${escrowTransaction.transactionId}&amount=${escrowTransaction.amount}`
    });
  } catch (error) {
    console.error('Error accepting payment request:', error);
    res.status(500).json({
      error: 'Failed to accept payment request: ' + error.message
    });
  }
});

/**
 * REJECT PAYMENT REQUEST
 * POST /api/payment-requests/:requestId/reject
 * Reject a payment request
 */
router.post('/:requestId/reject', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;

    // Validate requestId
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      return res.status(400).json({
        error: 'Invalid payment request ID'
      });
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(requestId)) {
      return res.status(400).json({
        error: 'Invalid payment request ID format'
      });
    }

    const paymentRequest = await PaymentRequest.findById(requestId);

    if (!paymentRequest) {
      return res.status(404).json({
        error: 'Payment request not found'
      });
    }

    // Check if user is the recipient
    if (paymentRequest.recipientId.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Unauthorized to reject this request'
      });
    }

    // Update payment request
    paymentRequest.status = 'rejected';
    paymentRequest.rejectedAt = new Date();
    paymentRequest.rejectionReason = rejectionReason || 'No reason provided';
    paymentRequest.updatedAt = new Date();
    await paymentRequest.save();

    res.status(200).json({
      success: true,
      message: 'Payment request rejected',
      request: paymentRequest
    });
  } catch (error) {
    console.error('Error rejecting payment request:', error);
    res.status(500).json({
      error: 'Failed to reject payment request: ' + error.message
    });
  }
});

/**
 * GET PAYMENT REQUEST DETAILS
 * GET /api/payment-requests/:requestId
 * Get details of a specific payment request
 */
router.get('/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Validate requestId
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      return res.status(400).json({
        error: 'Invalid payment request ID'
      });
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(requestId)) {
      return res.status(400).json({
        error: 'Invalid payment request ID format'
      });
    }

    const request = await PaymentRequest.findById(requestId)
      .populate('senderId', 'name phone email')
      .populate('recipientId', 'name phone email');

    if (!request) {
      return res.status(404).json({
        error: 'Payment request not found'
      });
    }

    // Check if user is authorized to view this request
    const userId = req.user.id;
    if (request.senderId._id.toString() !== userId && request.recipientId._id.toString() !== userId) {
      return res.status(403).json({
        error: 'Unauthorized to view this request'
      });
    }

    res.status(200).json({
      success: true,
      request: request
    });
  } catch (error) {
    console.error('Error fetching payment request:', error);
    res.status(500).json({
      error: 'Failed to fetch payment request: ' + error.message
    });
  }
});

module.exports = router;
