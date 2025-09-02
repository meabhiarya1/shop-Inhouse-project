const express = require('express');
const { body } = require('express-validator');
const ProductController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all product routes
router.use(authMiddleware);

// Validation rules for product
const productValidation = [
  body('product_name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),

  body('length')
    .isFloat({ min: 0 })
    .withMessage('Length must be a positive number'),

  body('width')
    .isFloat({ min: 0 })
    .withMessage('Width must be a positive number'),

  body('thickness')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Thickness must be a positive number'),

  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),

  body('weight')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),

  body('brand_id')
    .isInt({ min: 1 })
    .withMessage('Valid brand ID is required'),

  body('shop_id')
    .isInt({ min: 1 })
    .withMessage('Valid shop ID is required'),

  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Valid category ID is required')
];

// Validation for multiple delete
const multipleDeleteValidation = [
  body('productIds')
    .isArray({ min: 1 })
    .withMessage('Product IDs array is required and cannot be empty'),
  
  body('productIds.*')
    .isInt({ min: 1 })
    .withMessage('Each product ID must be a valid integer')
];

// Routes
router.get('/', ProductController.getAllProducts);
// Place the more specific route before the parameterized :id to avoid shadowing
router.get('/shop/:shopId', ProductController.getAllProductsByShopId);
router.get('/:id', ProductController.getProductById);
router.post('/', productValidation, ProductController.createProduct);
router.put('/:id', productValidation, ProductController.updateProduct);
router.delete('/delete/multiple', multipleDeleteValidation, ProductController.deleteMultipleProducts);

module.exports = router;
