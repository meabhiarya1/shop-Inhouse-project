const express = require('express');
const { body } = require('express-validator');
const CategoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all category routes
router.use(authMiddleware);

// Validation rules for category
const categoryValidation = [
  body('category_name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands')
];

// Routes
router.get('/', CategoryController.getAllCategories);
router.get('/:categoryId/products', CategoryController.getAllProductsByCategoryId);
router.post('/', categoryValidation, CategoryController.createCategory);
router.put('/:id', categoryValidation, CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

module.exports = router;
