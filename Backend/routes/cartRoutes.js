const express = require("express");
const { body, param } = require("express-validator");
const CartController = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Apply auth middleware to all cart routes
router.use(authMiddleware);

// Validation rules for adding to cart
const addToCartValidation = [
  body("product_id")
    .isInt({ min: 1 })
    .withMessage("Valid product ID is required"),

  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer")
];

// Validation rules for updating cart item
const updateCartItemValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Valid cart item ID is required"),

  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer")
];

// Validation rules for removing cart item
const removeCartItemValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Valid cart item ID is required")
];

// Routes
// GET /api/cart - Get all cart items for the authenticated user
router.get("/", CartController.getCartItems);

// GET /api/cart/summary - Get cart summary (total items count, unique products count)
router.get("/summary", CartController.getCartSummary);

// POST /api/cart - Add item to cart
router.post("/", addToCartValidation, CartController.addToCart);

// PUT /api/cart/:id - Update cart item quantity
router.put("/:id", updateCartItemValidation, CartController.updateCartItem);

// DELETE /api/cart/:id - Remove specific item from cart
router.delete("/:id", removeCartItemValidation, CartController.removeFromCart);

// DELETE /api/cart - Clear entire cart
router.delete("/", CartController.clearCart);

module.exports = router;
