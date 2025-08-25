const express = require('express');
const DashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

// Dashboard Analytics Routes
router.get('/analytics', DashboardController.getDashboardAnalytics);
router.get('/top-products', DashboardController.getTopSellingProducts);
router.get('/shop-summary', DashboardController.getSalesSummaryByShop);

module.exports = router;
