const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Placeholder route

router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Get recommendations - TODO' });
});

module.exports = router;
