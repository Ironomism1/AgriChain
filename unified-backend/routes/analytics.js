const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Placeholder routes - to be fully implemented

router.get('/farm-performance', authMiddleware, (req, res) => {
  res.json({ message: 'Get farm performance - TODO' });
});

router.get('/income-report', authMiddleware, (req, res) => {
  res.json({ message: 'Get income report - TODO' });
});

module.exports = router;
