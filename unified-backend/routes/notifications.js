const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

/**
 * GET /notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({
      userId,
      read: false
    });

    res.json({ success: true, unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /notifications/user/preferences
 * Get user's notification preferences
 */
router.get('/user/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch user preferences from first notification
    const notification = await Notification.findOne({ userId });
    
    const preferences = {
      emailPreference: notification?.emailPreference ?? true,
      pushPreference: notification?.pushPreference ?? true
    };

    res.json({ success: true, preferences });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /notifications/user/preferences
 * Update user's notification preferences
 */
router.put('/user/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { emailPreference, pushPreference } = req.body;

    // Update all notifications for this user
    const result = await Notification.updateMany(
      { userId },
      {
        emailPreference: emailPreference !== undefined ? emailPreference : true,
        pushPreference: pushPreference !== undefined ? pushPreference : true
      }
    );

    res.json({
      success: true,
      message: `Preferences updated for ${result.modifiedCount} notifications`,
      preferences: {
        emailPreference,
        pushPreference
      }
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /notifications/mark-all-read
 * Mark all notifications as read
 */
router.put('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /notifications
 * Fetch user's notifications with optional filtering
 * Query params: page, limit, read, type
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { read, type } = req.query;

    // Build filter
    const filter = { userId };
    if (read !== undefined) {
      filter.read = read === 'true';
    }
    if (type) {
      filter.type = type;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Fetch notifications
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /notifications/:id
 * Get single notification by ID
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /notifications/:id/read
 * Mark single notification as read
 */
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id
      },
      {
        read: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
