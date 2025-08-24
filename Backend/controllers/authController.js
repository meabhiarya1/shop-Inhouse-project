const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

class AuthController {
  // Generate JWT Token
  static generateToken(userId) {
    return jwt.sign(
      { userId: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
  }

  // This space intentionally left empty as registration and OTP verification are removed
  // Users will be seeded directly in the database

  // Login
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
      }

      const { mobileNumber, password } = req.body;
      
      // Simple mobile number validation
      if (!mobileNumber.match(/^[6-9]\d{9}$/)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
      }

      const user = await User.findOne({ where: { mobile_number: mobileNumber } });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid mobile number or password' });

      if (!user.is_active) {
        return res.status(401).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid mobile number or password' });
      }

      user.last_login = new Date();
      await user.save();

      const token = AuthController.generateToken(user.id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            storeName: user.store_name,
            ownerName: user.owner_name,
            mobileNumber: user.mobile_number,
            email: user.email,
            lastLogin: user.last_login
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Server error during login' });
    }
  }

  // Get Profile
  static async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: { exclude: ['password', 'otp_code', 'otp_expires_at', 'otp_attempts'] }
      });

      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching profile' });
    }
  }
}

module.exports = AuthController;
