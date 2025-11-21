const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const Listing = require('../models/Listing');
const { body, validationResult } = require('express-validator');

/**
 * POST /api/listings/create
 * Create a new crop listing
 */
router.post('/create', [
  authMiddleware,
  roleMiddleware(['farmer']),
  body('crop').notEmpty(),
  body('quantityKg').isNumeric(),
  body('pricePerKg').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { crop, quantityKg, pricePerKg, qualityGrade, district, harvestDate, description, photos } = req.body;

    const listing = new Listing({
      farmerId: req.user.id,
      crop,
      quantityKg,
      pricePerKg,
      qualityGrade: qualityGrade || 'B',
      district,
      harvestDate,
      description,
      photos: photos || [],
      status: 'active'
    });

    await listing.save();

    // Broadcast to all connected clients
    const io = req.app.get('io');
    io.emit('new-listing', {
      listingId: listing._id,
      crop,
      district,
      pricePerKg,
      quantityKg
    });

    res.status(201).json({
      message: 'Listing created successfully',
      listing
    });
  } catch (error) {
    console.error('Listing creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/listings/public/all
 * Browse all active listings (PUBLIC - no auth required)
 * Optimized for faster loading with pagination
 */
router.get('/public/all', async (req, res) => {
  try {
    const { crop, district, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = { status: 'active' };

    if (crop) filter.crop = new RegExp(crop, 'i');
    if (district) filter.district = new RegExp(district, 'i');
    if (minPrice || maxPrice) {
      filter.pricePerKg = {};
      if (minPrice) filter.pricePerKg.$gte = parseFloat(minPrice);
      if (maxPrice) filter.pricePerKg.$lte = parseFloat(maxPrice);
    }

    // Fetch with farmerId populated
    const listings = await Listing.find(filter)
      .populate('farmerId', 'name phone')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Listing.countDocuments(filter);

    console.log('API Response - Listings:', listings.length, 'Total:', total);

    res.status(200).json({
      message: 'Listings retrieved',
      listings: listings,
      total: total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      hasMore: skip + listings.length < total
    });
  } catch (error) {
    console.error('Public listings retrieval error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Mock listings data for quick loading
 */
function getMockListings() {
  return [
    { crop: 'Paddy', quantity: 100, pricePerKg: 22, district: 'Hyderabad', season: 'Kharif', status: 'active', postedDate: '2025-11-20' },
    { crop: 'Wheat', quantity: 150, pricePerKg: 21, district: 'Medak', season: 'Rabi', status: 'active', postedDate: '2025-11-20' },
    { crop: 'Arhar', quantity: 80, pricePerKg: 55, district: 'Nizamabad', season: 'Kharif', status: 'active', postedDate: '2025-11-19' },
    { crop: 'Groundnut', quantity: 120, pricePerKg: 65, district: 'Karimnagar', season: 'Kharif', status: 'active', postedDate: '2025-11-19' },
    { crop: 'Sorghum', quantity: 200, pricePerKg: 18, district: 'Warangal', season: 'Kharif', status: 'active', postedDate: '2025-11-18' },
    { crop: 'Sesamum', quantity: 50, pricePerKg: 90, district: 'Khammam', season: 'Kharif', status: 'active', postedDate: '2025-11-18' },
    { crop: 'Maize', quantity: 180, pricePerKg: 19, district: 'Adilabad', season: 'Kharif', status: 'active', postedDate: '2025-11-17' },
    { crop: 'Paddy', quantity: 120, pricePerKg: 23, district: 'Karimnagar', season: 'Rabi', status: 'active', postedDate: '2025-11-17' },
    { crop: 'Groundnut', quantity: 95, pricePerKg: 64, district: 'Nalgonda', season: 'Kharif', status: 'active', postedDate: '2025-11-16' },
    { crop: 'Wheat', quantity: 160, pricePerKg: 20, district: 'Medak', season: 'Rabi', status: 'active', postedDate: '2025-11-16' },
    { crop: 'Arhar', quantity: 75, pricePerKg: 56, district: 'Adilabad', season: 'Kharif', status: 'active', postedDate: '2025-11-15' },
    { crop: 'Maize', quantity: 140, pricePerKg: 20, district: 'Warangal', season: 'Kharif', status: 'active', postedDate: '2025-11-15' }
  ];
}

/**
 * GET /api/listings/all
 * Browse all active listings
 */
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const { crop, district, minPrice, maxPrice, skip = 0, limit = 20 } = req.query;

    let filter = { status: 'active' };

    if (crop) filter.crop = crop;
    if (district) filter.district = district;
    if (minPrice || maxPrice) {
      filter.pricePerKg = {};
      if (minPrice) filter.pricePerKg.$gte = parseFloat(minPrice);
      if (maxPrice) filter.pricePerKg.$lte = parseFloat(maxPrice);
    }

    const listings = await Listing.find(filter)
      .populate('farmerId', 'name phone district')
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Listing.countDocuments(filter);

    res.status(200).json({
      message: 'Listings retrieved',
      listings,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Listings retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/listings/:listingId
 * Get listing details
 */
router.get('/:listingId', authMiddleware, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId)
      .populate('farmerId', 'name phone district email');

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.status(200).json({
      message: 'Listing retrieved',
      listing
    });
  } catch (error) {
    console.error('Listing retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/listings/:listingId/interested
 * Mark buyer as interested in a listing
 */
router.post('/:listingId/interested', [authMiddleware, roleMiddleware(['buyer'])], async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check if already interested
    const alreadyInterested = listing.interestedBuyers.some(b => b.buyerId.toString() === req.user.id);
    if (alreadyInterested) {
      return res.status(400).json({ error: 'Already marked as interested' });
    }

    // Add buyer to interested list
    listing.interestedBuyers.push({
      buyerId: req.user.id,
      interestedAt: new Date()
    });

    await listing.save();

    // Get farmer and buyer details
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const farmer = await User.findById(listing.farmerId);
    const buyer = await User.findById(req.user.id); // Fetch full buyer details from DB

    // Create in-app notification
    if (farmer) {
      try {
        const notification = new Notification({
          userId: listing.farmerId,
          type: 'buyer_interested',
          title: 'New Buyer Interested!',
          message: `${buyer.name || 'A buyer'} is interested in your ${listing.crop} listing`,
          relatedId: listing._id,
          relatedType: 'Listing',
          data: {
            crop: listing.crop,
            quantity: listing.quantityKg,
            buyerName: buyer.name,
            buyerId: buyer._id,
            listingId: listing._id
          },
          emailPreference: true,
          pushPreference: true
        });

        const savedNotification = await notification.save();

        // Send email notification asynchronously
        const emailService = require('../services/emailService');
        emailService.sendBuyerInterestedEmail(
          farmer.email,
          farmer.name,
          buyer.name,
          listing.crop,
          listing.quantityKg
        ).then(emailResult => {
          // Update notification with email status
          if (emailResult.success) {
            Notification.findByIdAndUpdate(
              savedNotification._id,
              {
                emailSent: true,
                emailSentAt: new Date()
              }
            ).catch(err => console.error('Failed to update email status:', err));
          } else {
            Notification.findByIdAndUpdate(
              savedNotification._id,
              {
                emailSent: false,
                emailError: emailResult.error
              }
            ).catch(err => console.error('Failed to update email error:', err));
          }
        }).catch(err => console.error('Email sending error:', err));

        // Mark in-app notification as sent
        await Notification.findByIdAndUpdate(
          savedNotification._id,
          { inAppNotified: true, inAppNotifiedAt: new Date() }
        );
      } catch (notifError) {
        console.error('Notification creation error:', notifError);
      }
    }

    // Send SMS notification to farmer (Twilio) - non-blocking
    try {
      const smsService = require('../services/smsService');
      if (farmer && farmer.phone) {
        // Send SMS asynchronously
        smsService.sendBuyerInterestedSMS(
          farmer.phone,
          listing.crop,
          listing.quantityKg
        ).then(smsResult => {
          if (smsResult.success) {
            console.log('✓ SMS sent to farmer:', farmer.phone);
          } else {
            console.warn('⚠️ SMS not sent:', smsResult.error);
          }
        }).catch(err => console.error('⚠️ SMS service error:', err.message));
      }
    } catch (smsError) {
      console.error('⚠️ SMS service initialization error:', smsError.message);
    }

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(`user-${listing.farmerId}`).emit('buyer-interested', {
      listingId: req.params.listingId,
      buyerName: buyer.name || 'Anonymous Buyer',
      crop: listing.crop,
      quantityKg: listing.quantityKg,
      timestamp: new Date()
    });

    res.status(200).json({
      message: 'Interest marked successfully',
      interestedCount: listing.interestedBuyers.length
    });
  } catch (error) {
    console.error('Interest marking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/listings/my-listings
 * Get farmer's own listings
 */
router.get('/farmer/my-listings', [authMiddleware, roleMiddleware(['farmer'])], async (req, res) => {
  try {
    const listings = await Listing.find({ farmerId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Your listings retrieved',
      listings
    });
  } catch (error) {
    console.error('My listings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
