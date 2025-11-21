const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const EscrowTransaction = require('../models/EscrowTransaction');
const User = require('../models/User');

/**
 * POST /api/contracts/create-onchain
 * Create smart contract on blockchain AFTER payment is verified
 * This is STAGE 3 of the escrow workflow
 */
router.post('/create-onchain', authMiddleware, async (req, res) => {
  try {
    const { escrowId, userAddress } = req.body;

    if (!escrowId || !userAddress) {
      return res.status(400).json({ error: 'Missing escrowId or userAddress' });
    }

    // Verify escrow exists and has payment confirmed
    const escrow = await EscrowTransaction.findById(escrowId);
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow transaction not found' });
    }

    // Check if payment is verified
    if (escrow.payment.status !== 'confirmed') {
      return res.status(400).json({ 
        error: 'Payment must be confirmed before creating smart contract',
        currentStatus: escrow.payment.status 
      });
    }

    // Check if contract already created
    if (escrow.blockchain.txHash) {
      return res.status(400).json({ error: 'Smart contract already created for this transaction' });
    }

    // Allow both buyer and seller to trigger contract creation (for bidirectional contracts)
    const isBuyer = escrow.buyerId.toString() === req.user.id;
    const isSeller = escrow.sellerId.toString() === req.user.id;
    
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Only involved parties can create smart contract' });
    }

    // Return contract deployment details for frontend to handle via MetaMask
    res.status(200).json({
      success: true,
      message: 'Ready to deploy smart contract. Frontend will handle MetaMask transaction.',
      contractData: {
        escrowId: escrow._id,
        transactionId: escrow.transactionId,
        crop: escrow.crop,
        quantity: escrow.quantity,
        unit: escrow.unit,
        pricePerKg: escrow.amount / escrow.quantity,
        totalAmount: escrow.amount,
        buyerAddress: userAddress,
        sellerAddress: escrow.sellerId,
        terms: escrow.terms,
        downPayment: Math.round(escrow.amount * 0.10), // Assuming 10% as example
        contractAddress: null // Will be filled after deployment
      }
    });
  } catch (error) {
    console.error('Create onchain contract error:', error);
    res.status(500).json({ error: 'Failed to prepare contract deployment' });
  }
});

/**
 * POST /api/contracts/store-blockchain-hash
 * Store blockchain transaction hash after MetaMask confirms
 * Frontend calls this AFTER contract.ReportCrime() is executed on blockchain
 */
router.post('/store-blockchain-hash', authMiddleware, async (req, res) => {
  try {
    const { escrowId, txHash, contractAddress, network } = req.body;

    if (!escrowId || !txHash) {
      return res.status(400).json({ error: 'Missing escrowId or txHash' });
    }

    const escrow = await EscrowTransaction.findById(escrowId);
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow transaction not found' });
    }

    // Update blockchain details
    escrow.blockchain.txHash = txHash;
    escrow.blockchain.smartContractAddress = contractAddress || null;
    escrow.blockchain.network = network || 'ethereum';
    escrow.blockchain.status = 'recorded';
    escrow.blockchain.recordedAt = new Date();

    // Update escrow status to confirmed (contract is now on blockchain)
    escrow.status = 'confirmed';

    await escrow.save();

    // Notify seller
    try {
      const seller = await User.findById(escrow.sellerId);
      if (seller && seller.phone) {
        // Send SMS notification
        console.log(`[SMS] Notifying seller: Contract created on blockchain. Tx: ${txHash.substring(0, 10)}...`);
      }
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    res.status(200).json({
      success: true,
      message: 'Smart contract recorded on blockchain',
      transaction: escrow
    });
  } catch (error) {
    console.error('Store blockchain hash error:', error);
    res.status(500).json({ error: 'Failed to store blockchain hash' });
  }
});

/**
 * GET /api/contracts/:contractId
 * Get contract details
 */
router.get('/:contractId', authMiddleware, async (req, res) => {
  try {
    const escrow = await EscrowTransaction.findById(req.params.contractId)
      .populate('buyerId', 'name email phone')
      .populate('sellerId', 'name email phone');

    if (!escrow) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.status(200).json({
      success: true,
      contract: escrow
    });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

module.exports = router;
