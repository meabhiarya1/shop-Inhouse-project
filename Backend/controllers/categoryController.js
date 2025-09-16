const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const Category = require("../models/Category");
const Product = require("../models/Product");

class CategoryController {
  // Get all categories
  static async getAllCategories(req, res) {
    try {
      // Validate query (from express-validator in route)
      const errors = require("express-validator").validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      // Pagination: market standard page & limit with sensible defaults and caps
      const rawPage = parseInt(req.query.page || "1", 10);
      const rawLimit = parseInt(req.query.limit || "10", 10);
      const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
      const limitUncapped =
        Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 10;
      const limit = Math.min(Math.max(limitUncapped, 1), 100); // increased cap to match products
      const offset = (page - 1) * limit;

      // Case-insensitive search: compare LOWER(category_name) LIKE %lower(q)%
      // No server-side search; frontend filters locally
      const where = undefined;
      const { count, rows } = await Category.findAndCountAll({
        where,
        order: [["category_name", "ASC"]],
        limit,
        offset,
        distinct: true, // Important for accurate count
      });

      const totalPages = Math.max(Math.ceil(count / limit), 1);

      res.status(200).json({
        success: true,
        data: rows,
        pagination: {
          currentPage: page, // Changed from 'page' to 'currentPage' to match products
          limit,
          total: count,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching categories",
      });
    }
  }

  // Get all products by category ID
  static async getAllProductsByCategoryId(req, res) {
    try {
      const { categoryId } = req.params;

      // Check if category exists
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      // Get all products for this category with associated data
      const products = await Product.findAll({
        where: { category_id: categoryId },
        include: [
          {
            model: require("../models/Brand"),
            as: "brand",
            attributes: ["id", "brand_name"],
          },
          {
            model: require("../models/Shop"),
            as: "shop",
            attributes: ["id", "shop_name"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["id", "category_name"],
          },
        ],
        order: [["product_name", "ASC"]],
      });

      res.status(200).json({
        success: true,
        data: {
          category: category,
          products: products,
          totalProducts: products.length,
        },
      });
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching products for this category",
      });
    }
  }

  // Create new category
  static async createCategory(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { category_name } = req.body;

      // Check if category already exists
      const existingCategory = await Category.findOne({
        where: { category_name: category_name.trim() },
        transaction,
      });

      if (existingCategory) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        });
      }

      const category = await Category.create(
        {
          category_name: category_name.trim(),
        },
        { transaction }
      );

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating category:", error);
      res.status(500).json({
        success: false,
        message: "Error creating category",
      });
    }
  }

  // Update category
  static async updateCategory(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { category_name } = req.body;

      const category = await Category.findByPk(id, { transaction });
      if (!category) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      // Check if another category with the same name exists
      const existingCategory = await Category.findOne({
        where: {
          category_name: category_name.trim(),
          id: { [require("sequelize").Op.ne]: id },
        },
        transaction,
      });

      if (existingCategory) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Another category with this name already exists",
        });
      }

      await category.update(
        {
          category_name: category_name.trim(),
        },
        { transaction }
      );

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating category:", error);
      res.status(500).json({
        success: false,
        message: "Error updating category",
      });
    }
  }

  // Delete category (only if not associated with any product)
  static async deleteCategory(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const category = await Category.findByPk(id, { transaction });
      if (!category) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      // Check if category is associated with any products
      const productCount = await Product.count({
        where: { category_id: id },
        transaction,
      });

      if (productCount > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. It is associated with ${productCount} product(s). Please remove the products first.`,
        });
      }

      await category.destroy({ transaction });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting category:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting category",
      });
    }
  }

  static async getAllCategoriesForDropDown(req, res) {
    try {
      // Validate query (from express-validator in route)
      const errors = require("express-validator").validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }
      const categories = await Category.findAll({
        order: [["category_name", "ASC"]],
      });
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching categories",
      });
    }
  }
}

module.exports = CategoryController;
