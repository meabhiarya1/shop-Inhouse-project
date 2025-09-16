const express = require("express");
const { body, query } = require("express-validator");
const BrandController = require("../controllers/brandController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Apply auth middleware to all brand routes
router.use(authMiddleware);

// Validation rules for brand
const brandValidation = [
  body("brand_name")
    .trim()
    .notEmpty()
    .withMessage("Brand name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Brand name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-_&]+$/)
    .withMessage(
      "Brand name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands"
    ),
];

// Routes
router.get("/", BrandController.getAllBrands);
router.put("/:id", brandValidation, BrandController.updateBrand);

module.exports = router;
