const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Placeholder routes - to be fully implemented

router.get('/prices', authMiddleware, (req, res) => {
  res.json({ message: 'Get market prices - TODO' });
});

router.get('/opportunities', authMiddleware, (req, res) => {
  res.json({ message: 'Get market opportunities - TODO' });
});

module.exports = router;
