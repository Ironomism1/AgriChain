const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const Review = require('../models/Review');
const UserPerformance = require('../models/UserPerformance');

/**
 * POST /api/reviews/create
 * Create a review after transaction completion
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { transactionId, reviewedUserId, rating, title, comment, categoryRatings, aspects } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const review = new Review({
      transactionId,
      reviewerId: req.user.id,
      reviewerRole: req.user.role,
      reviewedUserId,
      rating,
      title,
      comment,
      categoryRatings: categoryRatings || {
        quality: rating,
        communication: rating,
        timeliness: rating,
        fairness: rating
      },
      aspects: aspects || {}
    });

    await review.save();

    // Update user performance metrics
    await updateUserPerformance(reviewedUserId);

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

/**
 * GET /api/reviews/user/:userId
 * Get all reviews for a user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ reviewedUserId: req.params.userId, approved: true })
      .populate('reviewerId', 'name farm')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ reviewedUserId: req.params.userId, approved: true });

    res.status(200).json({
      reviews,
      total,
      pages: Math.ceil(total / limit),
      page: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * GET /api/reviews/summary/:userId
 * Get review summary for a user
 */
router.get('/summary/:userId', async (req, res) => {
  try {
    const performance = await UserPerformance.findOne({ userId: req.params.userId });

    if (!performance) {
      return res.status(404).json({
        averageRating: 5,
        totalReviews: 0,
        ratingDistribution: {
          fiveStar: 0,
          fourStar: 0,
          threeStar: 0,
          twoStar: 0,
          oneStar: 0
        }
      });
    }

    res.status(200).json({
      averageRating: performance.reviews.averageRating,
      totalReviews: performance.reviews.totalReviews,
      ratingDistribution: performance.reviews.ratingDistribution,
      categoryAverages: performance.categoryAverages,
      badges: performance.badges,
      successRate: performance.overallStats.successRate
    });
  } catch (error) {
    console.error('Error fetching review summary:', error);
    res.status(500).json({ error: 'Failed to fetch review summary' });
  }
});

/**
 * PUT /api/reviews/:reviewId/helpful
 * Mark review as helpful
 */
router.put('/:reviewId/helpful', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    res.status(200).json({ message: 'Review marked as helpful', review });
  } catch (error) {
    console.error('Error marking review helpful:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

/**
 * Helper function to update user performance metrics
 */
async function updateUserPerformance(userId) {
  try {
    const reviews = await Review.find({ reviewedUserId: userId, approved: true });

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / reviews.length).toFixed(2);

    const ratingDist = {
      fiveStar: reviews.filter(r => r.rating === 5).length,
      fourStar: reviews.filter(r => r.rating === 4).length,
      threeStar: reviews.filter(r => r.rating === 3).length,
      twoStar: reviews.filter(r => r.rating === 2).length,
      oneStar: reviews.filter(r => r.rating === 1).length
    };

    const categoryAvgs = {
      quality: getAverageCategory(reviews, 'quality'),
      communication: getAverageCategory(reviews, 'communication'),
      timeliness: getAverageCategory(reviews, 'timeliness'),
      fairness: getAverageCategory(reviews, 'fairness')
    };

    const badges = generateBadges(avgRating, categoryAvgs, reviews.length);

    await UserPerformance.updateOne(
      { userId },
      {
        'reviews.totalReviews': reviews.length,
        'reviews.averageRating': parseFloat(avgRating),
        'reviews.ratingDistribution': ratingDist,
        'categoryAverages': categoryAvgs,
        'badges': badges
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error updating user performance:', error);
  }
}

function getAverageCategory(reviews, category) {
  const categoryReviews = reviews.filter(r => r.categoryRatings && r.categoryRatings[category]);
  if (categoryReviews.length === 0) return 5;
  const sum = categoryReviews.reduce((total, r) => total + r.categoryRatings[category], 0);
  return parseFloat((sum / categoryReviews.length).toFixed(2));
}

function generateBadges(avgRating, categoryAvgs, totalReviews) {
  return {
    verified: totalReviews >= 1,
    topSeller: avgRating >= 4.8 && totalReviews >= 5,
    topBuyer: avgRating >= 4.8 && totalReviews >= 5,
    reliable: avgRating >= 4.5 && categoryAvgs.fairness >= 4.5,
    communicative: categoryAvgs.communication >= 4.7,
    fastShipper: categoryAvgs.timeliness >= 4.7,
    responsive: categoryAvgs.communication >= 4.5 && totalReviews >= 3
  };
}

module.exports = router;
