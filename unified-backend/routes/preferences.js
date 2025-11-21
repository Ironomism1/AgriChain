const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const UserPreferences = require('../models/UserPreferences');

/**
 * GET /api/preferences/:userId
 * Get user preferences (theme, payment settings, etc.)
 */
router.get('/:userId', async (req, res) => {
  try {
    let preferences = await UserPreferences.findOne({ userId: req.params.userId });
    
    // Create default preferences if not exists
    if (!preferences) {
      preferences = new UserPreferences({
        userId: req.params.userId,
        theme: {
          mode: 'light',
          fontSize: 'normal',
          sidebarCollapsed: false
        },
        payments: {
          mockPaymentEnabled: true,
          mockBalance: 50000,
          preferredPaymentMethod: 'razorpay'
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          inAppNotifications: true
        },
        privacy: {
          profileVisibility: 'public',
          allowMessages: true
        }
      });
      
      await preferences.save();
    }
    
    res.status(200).json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/preferences/:userId/theme
 * Update user theme preferences
 */
router.put('/:userId/theme', authMiddleware, async (req, res) => {
  try {
    const { mode, customColors, fontSize, sidebarCollapsed } = req.body;
    
    // Verify user is updating their own preferences
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Can only update your own preferences' });
    }
    
    let preferences = await UserPreferences.findOne({ userId: req.params.userId });
    
    if (!preferences) {
      preferences = new UserPreferences({ userId: req.params.userId });
    }
    
    // Update theme settings
    if (mode) preferences.theme.mode = mode;
    if (customColors) preferences.theme.customColors = customColors;
    if (fontSize) preferences.theme.fontSize = fontSize;
    if (sidebarCollapsed !== undefined) preferences.theme.sidebarCollapsed = sidebarCollapsed;
    
    await preferences.save();
    
    res.status(200).json({
      success: true,
      message: 'Theme updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/preferences/:userId/payments
 * Update payment settings (mock vs real, balance, etc.)
 */
router.put('/:userId/payments', authMiddleware, async (req, res) => {
  try {
    const { mockPaymentEnabled, mockBalance, preferredPaymentMethod } = req.body;
    
    // Verify user is updating their own preferences
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Can only update your own preferences' });
    }
    
    let preferences = await UserPreferences.findOne({ userId: req.params.userId });
    
    if (!preferences) {
      preferences = new UserPreferences({ userId: req.params.userId });
    }
    
    // Update payment settings
    if (mockPaymentEnabled !== undefined) preferences.payments.mockPaymentEnabled = mockPaymentEnabled;
    if (mockBalance !== undefined) preferences.payments.mockBalance = mockBalance;
    if (preferredPaymentMethod) preferences.payments.preferredPaymentMethod = preferredPaymentMethod;
    
    await preferences.save();
    
    res.status(200).json({
      success: true,
      message: 'Payment settings updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/preferences/:userId/notifications
 * Update notification settings
 */
router.put('/:userId/notifications', authMiddleware, async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, smsNotifications, inAppNotifications, notificationFrequency } = req.body;
    
    // Verify user is updating their own preferences
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Can only update your own preferences' });
    }
    
    let preferences = await UserPreferences.findOne({ userId: req.params.userId });
    
    if (!preferences) {
      preferences = new UserPreferences({ userId: req.params.userId });
    }
    
    // Update notification settings
    if (emailNotifications !== undefined) preferences.notifications.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) preferences.notifications.pushNotifications = pushNotifications;
    if (smsNotifications !== undefined) preferences.notifications.smsNotifications = smsNotifications;
    if (inAppNotifications !== undefined) preferences.notifications.inAppNotifications = inAppNotifications;
    if (notificationFrequency) preferences.notifications.notificationFrequency = notificationFrequency;
    
    await preferences.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/preferences/:userId/privacy
 * Update privacy settings
 */
router.put('/:userId/privacy', authMiddleware, async (req, res) => {
  try {
    const { profileVisibility, showPhoneNumber, showEmail, allowMessages } = req.body;
    
    // Verify user is updating their own preferences
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Can only update your own preferences' });
    }
    
    let preferences = await UserPreferences.findOne({ userId: req.params.userId });
    
    if (!preferences) {
      preferences = new UserPreferences({ userId: req.params.userId });
    }
    
    // Update privacy settings
    if (profileVisibility) preferences.privacy.profileVisibility = profileVisibility;
    if (showPhoneNumber !== undefined) preferences.privacy.showPhoneNumber = showPhoneNumber;
    if (showEmail !== undefined) preferences.privacy.showEmail = showEmail;
    if (allowMessages !== undefined) preferences.privacy.allowMessages = allowMessages;
    
    await preferences.save();
    
    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/preferences/:userId
 * Update all preferences at once
 */
router.put('/:userId', authMiddleware, async (req, res) => {
  try {
    // Verify user is updating their own preferences
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Can only update your own preferences' });
    }
    
    const { theme, payments, notifications, privacy, language, timezone } = req.body;
    
    let preferences = await UserPreferences.findOne({ userId: req.params.userId });
    
    if (!preferences) {
      preferences = new UserPreferences({ userId: req.params.userId });
    }
    
    // Update all fields that are provided
    if (theme) {
      Object.assign(preferences.theme, theme);
    }
    if (payments) {
      Object.assign(preferences.payments, payments);
    }
    if (notifications) {
      Object.assign(preferences.notifications, notifications);
    }
    if (privacy) {
      Object.assign(preferences.privacy, privacy);
    }
    if (language) preferences.language = language;
    if (timezone) preferences.timezone = timezone;
    
    preferences.updatedAt = new Date();
    await preferences.save();
    
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
