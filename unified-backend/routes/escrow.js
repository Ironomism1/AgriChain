const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const EscrowTransaction = require('../models/EscrowTransaction');
const Contract = require('../models/Contract');
const Review = require('../models/Review');
const UserPerformance = require('../models/UserPerformance');

/**
 * ESCROW WORKFLOW:
 * 
 * STAGE 1: /initiate - Create escrow transaction (status: pending)
 *          Dashboard → Backend escrow creation → Payment preparation
 * 
 * STAGE 2: /api/payments/create-order & verify-payment 
 *          Razorpay payment gateway → Fund locking (status: funded)
 * 
 * STAGE 3: /api/contracts/create-onchain & store-blockchain-hash
 *          MetaMask contract deployment → Smart contract on blockchain (status: confirmed)
 * 
 * STAGE 4: /confirm-delivery - Buyer confirms product received
 * 
 * STAGE 5: /release-funds - Release locked funds to seller (status: released)
 */

/**
 * POST /api/escrow/initiate
 * Initiate an escrow transaction (STAGE 1)
 * Called from Dashboard after form submission
 */
router.post('/initiate', authMiddleware, async (req, res) => {
  try {
    const { crop, quantity, unit, amount, terms, downPaymentPercent, state, pricePerKg, listingId, sellerId } = req.body;

    if (!crop || !quantity || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique transaction ID
    const transactionId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate fees (2% platform fee)
    const platformFee = Math.round(amount * 0.02 * 100) / 100;
    const totalFee = platformFee;
    const sellerAmount = amount - totalFee;

    const escrowTx = new EscrowTransaction({
      transactionId,
      buyerId: req.user.id,
      sellerId: sellerId || null, // Will be set if coming from listing
      listingId: listingId || null,
      crop,
      quantity,
      unit: unit || 'kg',
      amount,
      currency: 'INR',
      fees: {
        platformFee,
        totalFee,
        sellerAmount
      },
      terms: {
        details: terms || '',
        downPaymentPercent: downPaymentPercent || 10,
        deliveryDays: 5,
        autoReleaseAfter: 5
      },
      // Store additional contract details
      contractDetails: {
        state: state || '',
        pricePerKg: pricePerKg || (amount / quantity),
        crop: crop
      },
      status: 'pending' // Escrow created, awaiting payment
    });

    await escrowTx.save();

    res.status(201).json({
      success: true,
      message: 'Escrow transaction initiated. Proceed to payment.',
      transaction: escrowTx,
      transactionId: escrowTx.transactionId,
      nextStep: 'payment' // Frontend knows to go to payment page
    });
  } catch (error) {
    console.error('Escrow initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate escrow transaction' });
  }
});

/**
 * POST /api/escrow/:transactionId/confirm-payment
 * Confirm payment received
 */
router.post('/:transactionId/confirm-payment', authMiddleware, async (req, res) => {
  try {
    const escrowTx = await EscrowTransaction.findOne({ transactionId: req.params.transactionId });

    if (!escrowTx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (escrowTx.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only buyer can confirm payment' });
    }

    escrowTx.payment.status = 'confirmed';
    escrowTx.payment.confirmedAt = new Date();
    escrowTx.funds.inEscrow = escrowTx.amount;
    escrowTx.status = 'funded';

    await escrowTx.save();

    res.status(200).json({
      message: 'Payment confirmed. Funds held in escrow.',
      transaction: escrowTx
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

/**
 * POST /api/escrow/:transactionId/confirm-delivery
 * Buyer confirms product received
 */
router.post('/:transactionId/confirm-delivery', authMiddleware, async (req, res) => {
  try {
    const { photosUploaded, quality } = req.body;
    const escrowTx = await EscrowTransaction.findOne({ transactionId: req.params.transactionId });

    if (!escrowTx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (escrowTx.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only buyer can confirm delivery' });
    }

    escrowTx.buyerConfirmation.status = 'confirmed';
    escrowTx.buyerConfirmation.confirmedAt = new Date();
    escrowTx.buyerConfirmation.photosUploaded = photosUploaded || [];
    escrowTx.delivery.actualDelivery = new Date();
    escrowTx.status = 'confirmed';

    // Schedule auto-release
    const autoReleaseDate = new Date(Date.now() + escrowTx.terms.autoReleaseAfter * 24 * 60 * 60 * 1000);
    escrowTx.releaseAuthorization.buyerAuthorized = true;
    escrowTx.releaseAuthorization.buyerAuthorizedAt = new Date();
    escrowTx.autoReleaseScheduledFor = autoReleaseDate;

    await escrowTx.save();

    res.status(200).json({
      message: 'Delivery confirmed. Auto-release scheduled.',
      transaction: escrowTx,
      autoReleaseDate
    });
  } catch (error) {
    console.error('Delivery confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm delivery' });
  }
});

/**
 * POST /api/escrow/:transactionId/release-funds
 * Release funds to seller (manual or auto)
 */
router.post('/:transactionId/release-funds', authMiddleware, async (req, res) => {
  try {
    const escrowTx = await EscrowTransaction.findOne({ transactionId: req.params.transactionId });

    if (!escrowTx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check authorization (buyer or admin)
    const isBuyer = escrowTx.buyerId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isSeller = escrowTx.sellerId.toString() === req.user.id;

    if (!isBuyer && !isAdmin && !isSeller) {
      return res.status(403).json({ error: 'Not authorized to release funds' });
    }

    // Release funds
    escrowTx.funds.released = escrowTx.amount - escrowTx.fees.totalFee;
    escrowTx.status = 'released';
    escrowTx.releaseAuthorization.adminApproved = true;
    escrowTx.releaseAuthorization.adminApprovedAt = new Date();
    escrowTx.completedAt = new Date();

    await escrowTx.save();

    // Update seller performance
    await updateSellerMetrics(escrowTx.sellerId, escrowTx);

    res.status(200).json({
      message: 'Funds released to seller',
      transaction: escrowTx,
      amountReleased: escrowTx.funds.released
    });
  } catch (error) {
    console.error('Fund release error:', error);
    res.status(500).json({ error: 'Failed to release funds' });
  }
});

/**
 * POST /api/escrow/:transactionId/raise-dispute
 * Buyer raises dispute
 */
router.post('/:transactionId/raise-dispute', authMiddleware, async (req, res) => {
  try {
    const { reason, description, evidence } = req.body;
    const escrowTx = await EscrowTransaction.findOne({ transactionId: req.params.transactionId });

    if (!escrowTx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (escrowTx.buyerId.toString() !== req.user.id && escrowTx.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    escrowTx.dispute.raised = true;
    escrowTx.dispute.raisedBy = req.user.role === 'farmer' ? 'seller' : 'buyer';
    escrowTx.dispute.reason = reason;
    escrowTx.dispute.description = description;
    escrowTx.dispute.evidence = evidence || [];
    escrowTx.dispute.raisedAt = new Date();
    escrowTx.status = 'dispute';

    await escrowTx.save();

    res.status(200).json({
      message: 'Dispute raised. Admin will review.',
      transaction: escrowTx
    });
  } catch (error) {
    console.error('Dispute error:', error);
    res.status(500).json({ error: 'Failed to raise dispute' });
  }
});

/**
 * GET /api/escrow/:transactionId
 * Get transaction details
 */
router.get('/:transactionId', authMiddleware, async (req, res) => {
  try {
    const escrowTx = await EscrowTransaction.findOne({ transactionId: req.params.transactionId })
      .populate('buyerId', 'name farm phone')
      .populate('sellerId', 'name farm phone');

    if (!escrowTx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check authorization
    if (escrowTx.buyerId._id.toString() !== req.user.id && 
        escrowTx.sellerId._id.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this transaction' });
    }

    res.status(200).json(escrowTx);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

/**
 * GET /api/escrow/user/transactions
 * Get all escrow transactions for user
 */
router.get('/user/transactions', authMiddleware, async (req, res) => {
  try {
    const { status, role, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {
      $or: [
        { buyerId: req.user.id },
        { sellerId: req.user.id }
      ]
    };

    if (status) filter.status = status;

    const transactions = await EscrowTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EscrowTransaction.countDocuments(filter);

    res.status(200).json({
      transactions,
      total,
      pages: Math.ceil(total / limit),
      page: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * Helper function to update seller metrics
 */
async function updateSellerMetrics(sellerId, transaction) {
  try {
    const completedTxs = await EscrowTransaction.find({ 
      sellerId, 
      status: 'released' 
    });

    const onTimeCount = completedTxs.filter(tx => {
      const deliveryTime = tx.delivery.actualDelivery - tx.createdAt;
      return deliveryTime <= (tx.terms.deliveryDays * 24 * 60 * 60 * 1000);
    }).length;

    const onTimeRate = completedTxs.length > 0 ? (onTimeCount / completedTxs.length * 100) : 100;

    await UserPerformance.updateOne(
      { userId: sellerId },
      {
        'sellerMetrics.totalProductsSold': completedTxs.length,
        'sellerMetrics.onTimeDeliveryRate': onTimeRate,
        'overallStats.successfulTransactions': completedTxs.length
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error updating seller metrics:', error);
  }
}

/**
 * GET /api/escrow/user-transactions
 * Get unified transactions (contracts + escrow) for logged-in user
 * Merges Contract and EscrowTransaction data for complete order view
 */
router.get('/user-transactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status;

    // Get contracts for this user
    let contracts = [];
    try {
      contracts = await Contract.find({
        $or: [
          { buyerId: userId },
          { farmerId: userId }
        ]
      })
        .populate('buyerId', 'name email phone avatar')
        .populate('farmerId', 'name email phone avatar')
        .populate('escrowTransactionId')
        .sort({ createdAt: -1 })
        .lean();
    } catch (contractError) {
      console.log('Contract fetch warning:', contractError.message);
      // Continue without contracts if fetch fails
    }

    // Get escrow transactions for this user
    let escrows = [];
    try {
      escrows = await EscrowTransaction.find({
        $or: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      })
        .populate('buyerId', 'name email phone avatar')
        .populate('sellerId', 'name email phone avatar')
        .sort({ createdAt: -1 })
        .lean();
    } catch (escrowError) {
      console.log('Escrow fetch warning:', escrowError.message);
      // Continue without escrows if fetch fails
    }

    // Merge into unified transactions
    const unifiedTransactions = [];

    // Add contracts with linked escrow
    if (contracts && contracts.length > 0) {
      contracts.forEach(contract => {
        unifiedTransactions.push({
          id: contract._id,
          type: 'contract',
          crop: contract.crop,
          quantity: contract.quantityKg,
          unit: 'kg',
          amount: contract.totalValue,
          currency: 'INR',
          buyerId: contract.buyerId?._id || contract.buyerId,
          farmerId: contract.farmerId?._id || contract.farmerId,
          sellerId: contract.farmerId?._id || contract.farmerId,
          buyer: contract.buyerId,
          seller: contract.farmerId,
          status: contract.stage,
          stage: contract.stage,
          qualityStandards: contract.qualityStandards,
          deliveryWindowStart: contract.deliveryWindowStart,
          deliveryWindowEnd: contract.deliveryWindowEnd,
          harvestProof: contract.harvestProof,
          verification: contract.verification,
          blockchainHash: contract.blockchainHash,
          escrowTransactionId: contract.escrowTransactionId?._id,
          escrowData: contract.escrowTransactionId,
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt
        });
      });
    }

    // Add standalone escrow transactions (not linked to contracts)
    if (escrows && escrows.length > 0) {
      escrows.forEach(escrow => {
        const hasLinkedContract = contracts && contracts.some(c => 
          c.escrowTransactionId && c.escrowTransactionId._id && 
          c.escrowTransactionId._id.toString() === escrow._id.toString()
        );
        if (!hasLinkedContract) {
          unifiedTransactions.push({
            id: escrow._id,
            type: 'escrow',
            crop: escrow.crop,
            quantity: escrow.quantity,
            unit: escrow.unit || 'unit',
            amount: escrow.amount,
            currency: escrow.currency,
            buyerId: escrow.buyerId?._id || escrow.buyerId,
            sellerId: escrow.sellerId?._id || escrow.sellerId,
            buyer: escrow.buyerId,
            seller: escrow.sellerId,
            status: escrow.status,
            payment: escrow.payment,
            delivery: escrow.delivery,
            buyerConfirmation: escrow.buyerConfirmation,
            createdAt: escrow.createdAt,
            updatedAt: escrow.updatedAt
          });
        }
      });
    }

    // Filter by status
    let filtered = unifiedTransactions;
    if (status && status !== 'all') {
      filtered = unifiedTransactions.filter(t => {
        const txStatus = t.stage || t.status;
        // Map frontend status names to backend statuses
        const statusMap = {
          'completed': ['completed', 'payment_released'],
          'released': ['released', 'payment_released'],
          'pending': ['pending', 'payment_pending', 'negotiation'],
          'dispute': ['dispute', 'disputed']
        };
        
        if (statusMap[status]) {
          return statusMap[status].includes(txStatus);
        }
        return txStatus === status;
      });
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: filtered.length,
      transactions: filtered,
      summary: {
        total: filtered.length,
        byType: {
          contracts: filtered.filter(t => t.type === 'contract').length,
          escrow: filtered.filter(t => t.type === 'escrow').length
        },
        byStatus: {
          pending: filtered.filter(t => t.status === 'pending' || t.stage === 'negotiation').length,
          completed: filtered.filter(t => t.status === 'completed' || t.stage === 'payment_released').length,
          disputed: filtered.filter(t => t.status === 'disputed' || t.stage === 'disputed').length
        }
      }
    });
  } catch (error) {
    console.error('Fetch user transactions error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch transactions',
      details: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/escrow/:transactionId/review
 * Submit review for completed transaction
 */
router.post('/:transactionId/review', authMiddleware, async (req, res) => {
  try {
    const { rating, review, deliveryPhotos } = req.body;
    const escrowId = req.params.transactionId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1-5' });
    }

    const escrow = await EscrowTransaction.findById(escrowId);

    if (!escrow) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only buyer can submit review
    if (escrow.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only buyer can submit review' });
    }

    // Can only review if released
    if (escrow.status !== 'released' && escrow.status !== 'completed') {
      return res.status(400).json({ error: 'Transaction must be released to review' });
    }

    // Update buyer confirmation with review
    escrow.buyerConfirmation = {
      status: 'confirmed',
      confirmedAt: new Date(),
      photosUploaded: deliveryPhotos || []
    };

    // Create review record
    const newReview = new Review({
      transactionId: escrowId,
      reviewerId: req.user.id,
      revieweeId: escrow.sellerId,
      rating: rating,
      review: review,
      photosUploaded: deliveryPhotos || [],
      type: 'buyer_review'
    });

    await newReview.save();
    await escrow.save();

    // Update seller performance
    const sellerPerformance = await UserPerformance.findOne({ userId: escrow.sellerId });
    if (sellerPerformance) {
      sellerPerformance.totalReviews += 1;
      sellerPerformance.totalRating += rating;
      sellerPerformance.averageRating = sellerPerformance.totalRating / sellerPerformance.totalReviews;
      await sellerPerformance.save();
    } else {
      const newPerformance = new UserPerformance({
        userId: escrow.sellerId,
        totalReviews: 1,
        totalRating: rating,
        averageRating: rating,
        transactionsCompleted: 1
      });
      await newPerformance.save();
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

/**
 * GET /api/escrow/all-transactions
 * Get ALL transactions from database with their statuses (admin/analytics view)
 */
router.get('/all-transactions', authMiddleware, async (req, res) => {
  try {
    const status = req.query.status;

    // Get all contracts
    let contracts = [];
    try {
      contracts = await Contract.find({})
        .populate('buyerId', 'name email phone role avatar')
        .populate('farmerId', 'name email phone role avatar')
        .populate('escrowTransactionId')
        .sort({ createdAt: -1 })
        .lean();
    } catch (contractError) {
      console.log('Contract fetch warning:', contractError.message);
    }

    // Get all escrow transactions
    let escrows = [];
    try {
      escrows = await EscrowTransaction.find({})
        .populate('buyerId', 'name email phone role avatar')
        .populate('sellerId', 'name email phone role avatar')
        .sort({ createdAt: -1 })
        .lean();
    } catch (escrowError) {
      console.log('Escrow fetch warning:', escrowError.message);
    }

    // Merge into unified transactions
    const unifiedTransactions = [];

    // Add contracts with linked escrow
    if (contracts && contracts.length > 0) {
      contracts.forEach(contract => {
        unifiedTransactions.push({
          id: contract._id,
          type: 'contract',
          crop: contract.crop,
          quantity: contract.quantityKg,
          unit: 'kg',
          amount: contract.totalValue,
          currency: 'INR',
          buyerId: contract.buyerId?._id || contract.buyerId,
          farmerId: contract.farmerId?._id || contract.farmerId,
          sellerId: contract.farmerId?._id || contract.farmerId,
          buyer: contract.buyerId,
          seller: contract.farmerId,
          status: contract.stage,
          stage: contract.stage,
          qualityStandards: contract.qualityStandards,
          deliveryWindowStart: contract.deliveryWindowStart,
          deliveryWindowEnd: contract.deliveryWindowEnd,
          harvestProof: contract.harvestProof,
          verification: contract.verification,
          blockchainHash: contract.blockchainHash,
          escrowTransactionId: contract.escrowTransactionId?._id,
          escrowData: contract.escrowTransactionId,
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt
        });
      });
    }

    // Add standalone escrow transactions (not linked to contracts)
    if (escrows && escrows.length > 0) {
      escrows.forEach(escrow => {
        const hasLinkedContract = contracts && contracts.some(c => 
          c.escrowTransactionId && c.escrowTransactionId._id && 
          c.escrowTransactionId._id.toString() === escrow._id.toString()
        );
        if (!hasLinkedContract) {
          unifiedTransactions.push({
            id: escrow._id,
            type: 'escrow',
            crop: escrow.crop,
            quantity: escrow.quantity,
            unit: escrow.unit || 'unit',
            amount: escrow.amount,
            currency: escrow.currency,
            buyerId: escrow.buyerId?._id || escrow.buyerId,
            sellerId: escrow.sellerId?._id || escrow.sellerId,
            buyer: escrow.buyerId,
            seller: escrow.sellerId,
            status: escrow.status,
            payment: escrow.payment,
            delivery: escrow.delivery,
            buyerConfirmation: escrow.buyerConfirmation,
            createdAt: escrow.createdAt,
            updatedAt: escrow.updatedAt
          });
        }
      });
    }

    // Filter by status if provided
    let filtered = unifiedTransactions;
    if (status && status !== 'all') {
      filtered = unifiedTransactions.filter(t => {
        const txStatus = t.stage || t.status;
        const statusMap = {
          'completed': ['completed', 'payment_released'],
          'released': ['released', 'payment_released'],
          'pending': ['pending', 'payment_pending', 'negotiation'],
          'dispute': ['dispute', 'disputed']
        };
        
        if (statusMap[status]) {
          return statusMap[status].includes(txStatus);
        }
        return txStatus === status;
      });
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Calculate statistics
    const stats = {
      total: filtered.length,
      byType: {
        contracts: filtered.filter(t => t.type === 'contract').length,
        escrow: filtered.filter(t => t.type === 'escrow').length
      },
      byStatus: {
        pending: filtered.filter(t => t.status === 'pending' || t.stage === 'negotiation').length,
        completed: filtered.filter(t => t.status === 'completed' || t.stage === 'payment_released').length,
        released: filtered.filter(t => t.status === 'released' || t.stage === 'payment_released').length,
        disputed: filtered.filter(t => t.status === 'disputed' || t.stage === 'disputed').length
      },
      totalAmount: filtered.reduce((sum, t) => sum + (t.amount || 0), 0),
      averageAmount: filtered.length > 0 ? Math.round(filtered.reduce((sum, t) => sum + (t.amount || 0), 0) / filtered.length) : 0
    };

    res.status(200).json({
      success: true,
      count: filtered.length,
      transactions: filtered,
      stats: stats
    });
  } catch (error) {
    console.error('Fetch all transactions error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch transactions',
      details: error.message
    });
  }
});

module.exports = router;
