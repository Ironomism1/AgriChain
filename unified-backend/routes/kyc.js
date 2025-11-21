const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const User = require('../models/User');

const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * POST /api/kyc/link-bank-account
 * Seller links their bank account for receiving payments
 * This creates a Razorpay linked account (sub-merchant)
 */
router.post('/link-bank-account', authMiddleware, roleMiddleware('farmer'), async (req, res) => {
  try {
    const { 
      accountHolderName, 
      accountNumber, 
      ifscCode, 
      accountType, 
      email,
      phone,
      businessType 
    } = req.body;

    // Validation
    if (!accountHolderName || !accountNumber || !ifscCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await User.findById(req.user.id);

    // Create or update Razorpay linked account (sub-merchant)
    try {
      const linkedAccount = await razorpay.accounts.create({
        email: email || user.email,
        phone: phone || user.phone,
        type: 'route',
        legal_business_name: user.name,
        customer_facing_business_name: user.name,
        legal_info: {
          pan: 'XXXXP0000X', // TODO: Collect from user
          gst: '', // TODO: Optional
        },
        notes: {
          userId: user._id.toString(),
          farmerName: user.name,
          businessType: businessType || 'agriculture'
        },
        contact_email: email || user.email,
        contact_mobile: phone || user.phone,
      });

      // Update user with linked account ID
      user.razorpayAccountId = linkedAccount.id;
      user.bankAccount = {
        holderName: accountHolderName,
        accountNumber: accountNumber.slice(-4), // Store only last 4 digits for security
        ifscCode: ifscCode,
        accountType: accountType || 'savings',
        verified: false,
        linkedAt: new Date()
      };
      user.kycStatus = 'pending';

      await user.save();

      // Create bank verification (returns a verification URL)
      // This is optional but recommended for security
      const verification = await verifyBankAccount(
        linkedAccount.id,
        accountNumber,
        ifscCode
      );

      res.status(200).json({
        success: true,
        message: 'Bank account linked successfully',
        accountId: linkedAccount.id,
        kycStatus: 'pending',
        verification: verification ? {
          verificationUrl: verification.url,
          verificationId: verification.id
        } : null,
        nextStep: 'Your account is pending verification. You can receive payments once verified.'
      });
    } catch (razorpayErr) {
      console.error('Razorpay account creation error:', razorpayErr);
      
      // If Razorpay account creation fails, still store locally for manual verification
      user.bankAccount = {
        holderName: accountHolderName,
        accountNumber: accountNumber.slice(-4),
        ifscCode: ifscCode,
        accountType: accountType || 'savings',
        verified: false,
        linkedAt: new Date()
      };
      user.kycStatus = 'pending_manual';
      await user.save();

      res.status(202).json({
        success: true,
        message: 'Bank account submitted for manual verification',
        kycStatus: 'pending_manual',
        nextStep: 'Our team will verify your account within 24 hours'
      });
    }
  } catch (error) {
    console.error('Link bank account error:', error);
    res.status(500).json({ error: 'Failed to link bank account' });
  }
});

/**
 * POST /api/kyc/verify-otp
 * Verify OTP for bank account (Razorpay bank account verification)
 */
router.post('/verify-otp', authMiddleware, async (req, res) => {
  try {
    const { verificationId, otp } = req.body;

    if (!verificationId || !otp) {
      return res.status(400).json({ error: 'Missing verification ID or OTP' });
    }

    // Call Razorpay verification API
    const verification = await razorpay.verifications.verify({
      id: verificationId,
      otp: otp
    });

    const user = await User.findById(req.user.id);

    if (verification.status === 'verified') {
      user.bankAccount.verified = true;
      user.kycStatus = 'verified';
      await user.save();

      res.json({
        success: true,
        message: 'Bank account verified successfully',
        kycStatus: 'verified'
      });
    } else {
      res.status(400).json({ 
        error: 'Verification failed', 
        status: verification.status 
      });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * GET /api/kyc/status
 * Check KYC/bank account linking status
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'kycStatus bankAccount razorpayAccountId'
    );

    res.json({
      kycStatus: user.kycStatus,
      bankLinked: !!user.razorpayAccountId,
      bankAccount: user.bankAccount ? {
        holderName: user.bankAccount.holderName,
        accountNumberLast4: user.bankAccount.accountNumber,
        ifscCode: user.bankAccount.ifscCode,
        verified: user.bankAccount.verified,
        linkedAt: user.bankAccount.linkedAt
      } : null,
      canReceivePayments: user.kycStatus === 'verified' && user.razorpayAccountId
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

/**
 * PUT /api/kyc/update-bank-account
 * Update bank account details
 */
router.put('/update-bank-account', authMiddleware, async (req, res) => {
  try {
    const { 
      accountHolderName, 
      accountNumber, 
      ifscCode, 
      accountType 
    } = req.body;

    const user = await User.findById(req.user.id);

    // Check if user already has a linked account
    if (user.razorpayAccountId && user.bankAccount.verified) {
      return res.status(400).json({ 
        error: 'Cannot update verified bank account. Please contact support.' 
      });
    }

    user.bankAccount = {
      holderName: accountHolderName,
      accountNumber: accountNumber.slice(-4),
      ifscCode: ifscCode,
      accountType: accountType || user.bankAccount.accountType,
      verified: false,
      linkedAt: new Date()
    };
    user.kycStatus = 'pending';

    await user.save();

    res.json({
      success: true,
      message: 'Bank account updated. Please verify again.',
      bankAccount: user.bankAccount
    });
  } catch (error) {
    console.error('Update bank account error:', error);
    res.status(500).json({ error: 'Failed to update bank account' });
  }
});

/**
 * Helper: Verify bank account via Razorpay
 * This initiates a bank account verification flow
 */
async function verifyBankAccount(accountId, accountNumber, ifscCode) {
  try {
    // For production, you would call Razorpay's bank account verification API
    // This is a placeholder implementation
    
    // const verification = await razorpay.verifications.create({
    //   account_number: accountNumber,
    //   ifsc: ifscCode,
    //   max_amount: 0,
    //   mode: 'NEFT'
    // });
    // return verification;

    return null; // For now, skip automatic verification
  } catch (err) {
    console.error('Bank verification error:', err);
    return null;
  }
}

module.exports = router;
