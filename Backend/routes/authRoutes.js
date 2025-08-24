const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Validation rules for login
const loginValidation = [
  body('mobileNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit mobile number'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { mobileNumber, password }
 */
router.post('/login',
  rateLimitMiddleware.authLimiter,
  loginValidation,
  AuthController.login
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/profile',
  authMiddleware,
  AuthController.getProfile
);

module.exports = router;