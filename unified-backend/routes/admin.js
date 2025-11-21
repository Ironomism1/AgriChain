const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Placeholder routes - Admin only

router.get('/contracts-review', [authMiddleware, roleMiddleware(['admin'])], (req, res) => {
  res.json({ message: 'Review contracts - TODO' });
});

router.get('/users', [authMiddleware, roleMiddleware(['admin'])], (req, res) => {
  res.json({ message: 'Manage users - TODO' });
});

module.exports = router;
