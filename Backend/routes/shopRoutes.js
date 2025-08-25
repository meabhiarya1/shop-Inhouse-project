const express = require('express');
const { body } = require('express-validator');
const ShopController = require('../controllers/shopController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all shop routes
router.use(authMiddleware);

// Routes
router.get('/', ShopController.getAllShops);
// router.get('/:id', ShopController.getShopById);

module.exports = router;
