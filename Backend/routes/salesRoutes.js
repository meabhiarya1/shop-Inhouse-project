const express = require('express');
const { body } = require('express-validator');
const SalesController = require('../controllers/salesController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all sales routes
router.use(authMiddleware);

// Validation rules for bulk sale (new multi-item structure)
const bulkSaleValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items array is required and must contain at least one item'),

  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required for each item'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1 for each item'),

  body('items.*.unit_price')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number for each item'),

  body('items.*.total')
    .isFloat({ min: 0 })
    .withMessage('Total must be a positive number for each item'),

  body('customer.customer_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Customer name cannot exceed 100 characters'),

  body('customer.customer_phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Customer phone cannot exceed 20 characters'),

  body('customer.payment_method')
    .optional()
    .isIn(['cash', 'upi', 'cash/upi'])
    .withMessage('Invalid payment method'),

  body('customer.customer_paid')
    .isFloat({ min: 0.01 })
    .withMessage('Customer paid amount is required and must be greater than 0'),

  body('totals.total')
    .isFloat({ min: 0.01 })
    .withMessage('Total amount is required and must be greater than 0')
];

// Update validation (some fields optional) - Single sale update
const updateSaleValidation = [
  body('quantity_sold')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity sold must be at least 1'),

  body('unit_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),

  body('customer_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Customer name cannot exceed 100 characters'),

  body('customer_phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Customer phone cannot exceed 20 characters'),

  body('payment_method')
    .optional()
    .isIn(['cash', 'upi', 'cash/upi'])
    .withMessage('Invalid payment method'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Routes
router.get('/', SalesController.getAllSales);

// Search sales - MUST be before /:id route to avoid conflict
router.get('/search', SalesController.searchSales);

router.get('/:id', SalesController.getSaleById);

// Create sale - now handles bulk sales with multiple items
router.post('/', bulkSaleValidation, SalesController.createSale);

// Update single sale (legacy)
router.put('/:id', updateSaleValidation, SalesController.updateSale);

// Delete entire customer sale transaction (all items) - MUST be before /:id route
router.delete('/customer/:id', SalesController.deleteCustomerSale);


module.exports = router;
