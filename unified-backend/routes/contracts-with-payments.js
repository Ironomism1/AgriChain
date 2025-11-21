const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const Contract = require('../models/Contract');
const EscrowTransaction = require('../models/EscrowTransaction');
const PaymentRequest = require('../models/PaymentRequest');
const User = require('../models/User');

/**
 * POST /api/contracts/create
 * Create a contract (basic contract creation endpoint)
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const {
      listingId,
      farmerId,
      crop,
      quantityKg,
      pricePerUnit,
      totalAmount,
      downPaymentPercent,
      deliveryWindowStart,
      deliveryWindowEnd
    } = req.body;

    const buyerId = req.user.id;

    // Validate required fields
    if (!farmerId || !crop || !quantityKg || !pricePerUnit) {
      return res.status(400).json({ error: 'Missing required contract fields' });
    }

    // Calculate values
    const pricePerKg = pricePerUnit;
    const totalValue = totalAmount || (quantityKg * pricePerKg);
    const downPaymentAmount = totalValue * ((downPaymentPercent || 20) / 100);

    // Create contract
    const contract = new Contract({
      listingId: listingId || null,
      buyerId,
      farmerId,
      crop,
      quantityKg,
      pricePerKg,
      totalValue,
      downPaymentPercent: downPaymentPercent || 20,
      downPaymentAmount,
      deliveryWindowStart: deliveryWindowStart ? new Date(deliveryWindowStart) : null,
      deliveryWindowEnd: deliveryWindowEnd ? new Date(deliveryWindowEnd) : null,
      stage: 'negotiation',
      stageHistory: [
        {
          stage: 'negotiation',
          timestamp: new Date(),
          updatedBy: buyerId
        }
      ]
    });

    await contract.save();

    // Create escrow transaction for payment
    const escrowTransaction = new EscrowTransaction({
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      buyerId,
      sellerId: farmerId,
      contractId: contract._id,
      amount: downPaymentAmount,
      fullAmount: totalValue,
      crop,
      quantity: quantityKg,
      stage: 'payment_pending',
      payment: {
        amount: downPaymentAmount,
        status: 'pending',
        method: 'razorpay',
        orderId: null,
        signatureId: null
      },
      blockchain: {
        network: 'sepolia',
        verified: false
      }
    });

    await escrowTransaction.save();

    // Update contract with escrow ID
    contract.escrowTransactionId = escrowTransaction._id;
    await contract.save();

    res.status(201).json({
      success: true,
      message: 'Contract created successfully. Ready for payment.',
      contract: {
        _id: contract._id,
        id: contract._id,
        stage: contract.stage,
        totalValue,
        downPaymentAmount
      },
      escrow: {
        id: escrowTransaction._id,
        transactionId: escrowTransaction.transactionId,
        status: escrowTransaction.stage
      }
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contracts/create-with-payment
 * Create a contract and link it with payment request
 * When buyer clicks "Accept & Pay", this endpoint is called
 */
router.post('/create-with-payment', authMiddleware, async (req, res) => {
  try {
    const {
      listingId,
      farmerId,
      crop,
      quantityKg,
      pricePerKg,
      downPaymentPercent,
      deliveryWindowStart,
      deliveryWindowEnd,
      paymentRequestId
    } = req.body;

    const buyerId = req.user.id;

    // Validate required fields
    if (!listingId || !farmerId || !crop || !quantityKg || !pricePerKg) {
      return res.status(400).json({ error: 'Missing required contract fields' });
    }

    // Calculate total value
    const totalValue = quantityKg * pricePerKg;
    const downPaymentAmount = totalValue * (downPaymentPercent / 100);

    // Create contract
    const contract = new Contract({
      listingId,
      buyerId,
      farmerId,
      crop,
      quantityKg,
      pricePerKg,
      totalValue,
      downPaymentPercent,
      downPaymentAmount,
      deliveryWindowStart,
      deliveryWindowEnd,
      stage: 'negotiation',
      stageHistory: [
        {
          stage: 'negotiation',
          timestamp: new Date(),
          updatedBy: buyerId
        }
      ]
    });

    // Save contract
    await contract.save();

    // If payment request ID provided, link it
    if (paymentRequestId) {
      await PaymentRequest.findByIdAndUpdate(
        paymentRequestId,
        {
          linkedContractId: contract._id,
          status: 'contract_created',
          linkedAt: new Date()
        }
      );
    }

    // Create escrow transaction for payment
    const escrowTransaction = new EscrowTransaction({
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      buyerId,
      sellerId: farmerId,
      contractId: contract._id,
      amount: downPaymentAmount,
      fullAmount: totalValue,
      crop,
      quantity: quantityKg,
      stage: 'payment_pending', // Payment not made yet
      payment: {
        amount: downPaymentAmount,
        status: 'pending', // Waiting for payment
        method: 'razorpay', // Default method
        orderId: null,
        signatureId: null
      },
      blockchain: {
        network: 'sepolia',
        verified: false
      }
    });

    await escrowTransaction.save();

    // Update contract with escrow ID
    contract.escrowTransactionId = escrowTransaction._id;
    await contract.save();

    res.status(201).json({
      success: true,
      message: 'Contract created successfully. Ready for payment.',
      contract: {
        id: contract._id,
        stage: contract.stage,
        totalValue,
        downPaymentAmount
      },
      escrow: {
        id: escrowTransaction._id,
        transactionId: escrowTransaction.transactionId,
        status: escrowTransaction.stage
      }
    });
  } catch (error) {
    console.error('Error creating contract with payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contracts/:contractId/payment-confirmed
 * Called when payment is confirmed (from payment service)
 * Moves contract to next stage after payment
 */
router.post('/:contractId/payment-confirmed', authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { paymentResult, transactionId } = req.body;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Verify buyer is the one paying
    if (contract.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only buyer can confirm payment' });
    }

    // Update contract stage
    contract.stage = 'escrowed'; // Payment made, funds escrowed
    contract.stageHistory.push({
      stage: 'escrowed',
      timestamp: new Date(),
      updatedBy: req.user.id
    });

    // Mark down payment as escrowed
    contract.downPaymentStatus = 'escrowed';

    await contract.save();

    // Update escrow transaction
    const escrow = await EscrowTransaction.findById(contract.escrowTransactionId);
    if (escrow) {
      escrow.stage = 'fund_escrowed'; // Funds have been escrowed
      escrow.payment.status = 'confirmed';
      escrow.payment.signatureId = paymentResult.signatureId || transactionId;
      escrow.updatedAt = new Date();
      await escrow.save();

      // Emit notification to farmer
      // io.to(`user-${contract.farmerId}`).emit('payment-confirmed', {
      //   contractId: contract._id,
      //   amount: contract.downPaymentAmount,
      //   message: 'Buyer has made payment. Please proceed with harvest.'
      // });
    }

    res.status(200).json({
      success: true,
      message: 'Payment confirmed. Contract moved to escrowed stage.',
      contract: {
        id: contract._id,
        stage: contract.stage,
        downPaymentStatus: contract.downPaymentStatus
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contracts/:contractId/submit-harvest
 * Farmer submits harvest proof (STAGE 4)
 */
router.post('/:contractId/submit-harvest', authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { photos, gpsLat, gpsLng, description } = req.body;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Only farmer can submit harvest
    if (contract.farmerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only farmer can submit harvest' });
    }

    // Can only submit if payment is confirmed
    if (contract.downPaymentStatus !== 'escrowed') {
      return res.status(400).json({ 
        error: 'Payment must be confirmed before submitting harvest',
        currentStatus: contract.downPaymentStatus
      });
    }

    // Update harvest proof
    contract.harvestProof = {
      photos: photos || [],
      gpsCoordinates: {
        lat: gpsLat,
        lng: gpsLng
      },
      submittedDate: new Date(),
      submittedByFarmer: true,
      description
    };

    // Move to harvest verification stage
    contract.stage = 'harvest_submitted';
    contract.stageHistory.push({
      stage: 'harvest_submitted',
      timestamp: new Date(),
      updatedBy: req.user.id
    });

    await contract.save();

    // Update escrow
    const escrow = await EscrowTransaction.findById(contract.escrowTransactionId);
    if (escrow) {
      escrow.stage = 'goods_delivered_verification_pending';
      await escrow.save();
    }

    res.status(200).json({
      success: true,
      message: 'Harvest proof submitted for verification',
      contract: {
        id: contract._id,
        stage: contract.stage,
        harvestProofSubmitted: true
      }
    });
  } catch (error) {
    console.error('Error submitting harvest:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contracts/:contractId/verify-and-complete
 * Admin/Buyer verifies harvest and completes delivery
 * Money is released to farmer only after this
 */
router.post('/:contractId/verify-and-complete', authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { verified, rejectionReason } = req.body;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Only buyer can verify (or admin)
    if (contract.buyerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only buyer can verify harvest' });
    }

    if (!verified) {
      // Harvest rejected
      contract.stage = 'disputed';
      contract.verification = {
        verifiedByAdmin: false,
        verified: false,
        verificationDate: new Date(),
        verificationNotes: rejectionReason || 'Harvest quality not acceptable'
      };

      contract.stageHistory.push({
        stage: 'disputed',
        timestamp: new Date(),
        updatedBy: req.user.id
      });

      await contract.save();

      // Refund escrow to buyer
      const escrow = await EscrowTransaction.findById(contract.escrowTransactionId);
      if (escrow) {
        escrow.stage = 'refund_initiated';
        escrow.payment.status = 'refunded';
        await escrow.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Harvest rejected. Escrow will be refunded to buyer.',
        contract: {
          id: contract._id,
          stage: contract.stage,
          verified: false
        }
      });
    }

    // Harvest verified - complete delivery and release payment
    contract.stage = 'delivered';
    contract.verification = {
      verifiedByAdmin: true,
      verified: true,
      verificationDate: new Date(),
      verificationNotes: 'Quality verified and accepted'
    };

    contract.stageHistory.push({
      stage: 'delivered',
      timestamp: new Date(),
      updatedBy: req.user.id
    });

    await contract.save();

    // Update escrow - mark for payment release
    const escrow = await EscrowTransaction.findById(contract.escrowTransactionId);
    if (escrow) {
      escrow.stage = 'verified_goods_received';
      escrow.verification = {
        verified: true,
        verifiedByAdmin: req.user.role === 'admin',
        verifiedAt: new Date()
      };
      await escrow.save();

      // RELEASE PAYMENT TO FARMER - Only after verification
      try {
        const farmer = await User.findById(contract.farmerId);
        if (farmer) {
          farmer.totalAmountEarned += contract.downPaymentAmount;
          farmer.totalTransactions += 1;
          await farmer.save();
        }

        // Update escrow final stage
        escrow.stage = 'payment_released';
        escrow.releaseDate = new Date();
        await escrow.save();
      } catch (error) {
        console.error('Error releasing payment to farmer:', error);
      }
    }

    // Move contract to final stage
    contract.stage = 'payment_released';
    contract.stageHistory.push({
      stage: 'payment_released',
      timestamp: new Date(),
      updatedBy: req.user.id
    });

    contract.stage = 'completed';
    contract.stageHistory.push({
      stage: 'completed',
      timestamp: new Date(),
      updatedBy: req.user.id
    });

    await contract.save();

    res.status(200).json({
      success: true,
      message: 'Harvest verified! Payment released to farmer.',
      contract: {
        id: contract._id,
        stage: contract.stage,
        verified: true,
        paymentReleased: true
      }
    });
  } catch (error) {
    console.error('Error verifying harvest:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/contracts/:contractId/order-status
 * Get current order/contract status
 */
router.get('/:contractId/order-status', async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId)
      .populate('buyerId', 'name email phone')
      .populate('farmerId', 'name email phone');

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const escrow = await EscrowTransaction.findById(contract.escrowTransactionId);

    // Determine payment completion status
    const isPaid = contract.downPaymentStatus === 'escrowed' || 
                   escrow?.payment?.status === 'confirmed';
    
    const isCompleted = contract.stage === 'completed' && 
                        escrow?.stage === 'payment_released';

    res.status(200).json({
      success: true,
      contract: {
        id: contract._id,
        stage: contract.stage,
        currentStatus: isCompleted ? 'completed' : isPaid ? 'payment_confirmed' : 'pending',
        isPaid,
        isCompleted,
        downPaymentAmount: contract.downPaymentAmount,
        totalAmount: contract.totalValue,
        buyerName: contract.buyerId.name,
        farmerName: contract.farmerId.name,
        crop: contract.crop,
        quantity: contract.quantityKg,
        harvestVerified: contract.verification?.verified || false,
        paymentReleased: isCompleted
      },
      escrow: {
        transactionId: escrow?.transactionId,
        status: escrow?.stage
      }
    });
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
