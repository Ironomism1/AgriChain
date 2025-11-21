const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.user.id = req.user.id || req.user._id; // Support both id formats
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Debug logging for role checking
    console.log(`Role check: User role='${req.user.role}', Allowed roles='${allowedRoles.join(', ')}'`);
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied', 
        userRole: req.user.role, 
        allowedRoles: allowedRoles,
        message: `Your role '${req.user.role}' is not allowed. Allowed roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
