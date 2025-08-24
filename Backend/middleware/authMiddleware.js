const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and check if still exists and active
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'is_verified', 'is_active']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalid - user not found'
      });
    }

    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Account not verified'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated'
      });
    }

    // Add user ID to request object
    req.userId = user.id;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

module.exports = authMiddleware;