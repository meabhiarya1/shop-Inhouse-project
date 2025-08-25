const express = require('express');
const { body } = require('express-validator');
const SalesController = require('../controllers/salesController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all sales routes
router.use(authMiddleware);

// Validation rules for sale
const saleValidation = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required'),

  body('shop_id')
    .isInt({ min: 1 })
    .withMessage('Valid shop ID is required'),

  body('quantity_sold')
    .isInt({ min: 1 })
    .withMessage('Quantity sold must be at least 1'),

  body('unit_price')
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
    .isIn(['cash', 'card', 'upi', 'bank_transfer', 'credit'])
    .withMessage('Invalid payment method'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Update validation (some fields optional)
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
    .isIn(['cash', 'card', 'upi', 'bank_transfer', 'credit'])
    .withMessage('Invalid payment method'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Routes
router.get('/', SalesController.getAllSales);
router.get('/:id', SalesController.getSaleById);
router.post('/', saleValidation, SalesController.createSale);
router.put('/:id', updateSaleValidation, SalesController.updateSale);
router.delete('/:id', SalesController.deleteSale);

module.exports = router;
