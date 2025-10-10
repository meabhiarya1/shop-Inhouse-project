const { validationResult } = require("express-validator");
const { sequelize } = require("../config/database");
const Product = require("../models/Product");
const Brand = require("../models/Brand");
const Shop = require("../models/Shop");
const Category = require("../models/Category");
const { Op } = require("sequelize");

class ProductController {
  // Get all products
  static async getAllProducts(req, res) {
    try {
      const {
        period,
        start_date,
        end_date,
        shop_id,
        page = 1,
        limit = 10,
      } = req.query;

      // Pagination parameters
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10))); // Max 100 per page
      const offset = (pageNum - 1) * limitNum;

      // Build where clause based on optional filters
      const where = {};
      // Shop filter: if provided and not 'all', filter; if 'all' or missing, no filter
      if (shop_id && String(shop_id).toLowerCase() !== "all") {
        where.shop_id = shop_id;
      }

      // Date filter based on createdAt
      let rangeStart = null;
      let rangeEnd = null;
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );
      const endOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );

      if (period) {
        const p = String(period).toLowerCase();
        if (p === "today") {
          rangeStart = startOfToday;
          rangeEnd = endOfToday;
        } else if (p === "yesterday") {
          const y = new Date(startOfToday);
          y.setDate(y.getDate() - 1);
          rangeStart = y;
          rangeEnd = new Date(startOfToday.getTime() - 1);
        } else if (p === "lifetime") {
          // no range filter
        }
      }

      if (!rangeStart && start_date && end_date) {
        const s = new Date(start_date);
        const e = new Date(end_date);
        if (!isNaN(s) && !isNaN(e)) {
          rangeStart = s;
          rangeEnd = e;
        }
      }

      if (rangeStart && rangeEnd) {
        where.createdAt = { [Op.between]: [rangeStart, rangeEnd] };
      }

      // Get products with pagination and total count
      const { count, rows: products } = await Product.findAndCountAll({
        where,
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: ["id", "brand_name"],
          },
          {
            model: Shop,
            as: "shop",
            attributes: ["id", "shop_name"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["id", "category_name"],
          },
        ],
        order: [
          ["updatedAt", "DESC"],
          ["createdAt", "DESC"],
          ["product_name", "ASC"],
        ],
        limit: limitNum,
        offset: offset,
        distinct: true, // Important for accurate count with includes
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      res.status(200).json({
        success: true,
        data: products,
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          total: count,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
        },
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching products",
      });
    }
  }

  // Get product by ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id, {
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: ["id", "brand_name"],
          },
          {
            model: Shop,
            as: "shop",
            attributes: ["id", "shop_name"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["id", "category_name"],
          },
        ],
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching product details",
      });
    }
  }

  // Get all products by shop ID
  static async getAllProductsByShopId(req, res) {
    try {
      const { shopId } = req.params;
      const { period, start_date, end_date, page = 1, limit = 10 } = req.query;

      // Pagination parameters
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10))); // Max 100 per page
      const offset = (pageNum - 1) * limitNum;

      // Build where clause
      const where = {};
      let shop = null;
      const isAll = String(shopId).toLowerCase() === "all";
      if (!isAll) {
        // Check if shop exists
        shop = await Shop.findByPk(shopId);
        if (!shop) {
          return res.status(404).json({
            success: false,
            message: "Shop not found",
          });
        }
        where.shop_id = shopId;
      }

      // Date filter based on createdAt
      let rangeStart = null;
      let rangeEnd = null;
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );
      const endOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );

      if (period) {
        const p = String(period).toLowerCase();
        if (p === "today") {
          rangeStart = startOfToday;
          rangeEnd = endOfToday;
        } else if (p === "yesterday") {
          const y = new Date(startOfToday);
          y.setDate(y.getDate() - 1);
          rangeStart = y;
          rangeEnd = new Date(startOfToday.getTime() - 1);
        } else if (p === "lifetime") {
          // no range filter
        }
      }

      if (!rangeStart && start_date && end_date) {
        const s = new Date(start_date);
        const e = new Date(end_date);
        if (!isNaN(s) && !isNaN(e)) {
          rangeStart = s;
          rangeEnd = e;
        }
      }

      if (rangeStart && rangeEnd) {
        where.createdAt = { [Op.between]: [rangeStart, rangeEnd] };
      }

      // Get products with pagination and total count
      const { count, rows: products } = await Product.findAndCountAll({
        where,
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: ["id", "brand_name"],
          },
          {
            model: Shop,
            as: "shop",
            attributes: ["id", "shop_name"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["id", "category_name"],
          },
        ],
        order: [
          ["updatedAt", "DESC"],
          ["createdAt", "DESC"],
          ["product_name", "ASC"],
        ],
        limit: limitNum,
        offset: offset,
        distinct: true, // Important for accurate count with includes
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      res.status(200).json({
        success: true,
        data: {
          shop: shop,
          products: products,
          totalProducts: count,
        },
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          total: count,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
        },
      });
    } catch (error) {
      console.error("Error fetching products by shop:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching products for this shop",
      });
    }
  }

  // Create new product
  static async createProduct(req, res) {
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

      const {
        product_name,
        length,
        width,
        thickness,
        quantity,
        weight,
        brand_id,
        brand_name,
        shop_id,
        category_id,
        category_name,
      } = req.body;

      // Handle brand - either use provided ID or find/create by name
      let finalBrandId;
      if (brand_id) {
        const brand = await Brand.findByPk(brand_id, { transaction });
        if (!brand) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Brand not found",
          });
        }
        finalBrandId = brand_id;
      } else if (brand_name) {
        let brand = await Brand.findOne({
          where: { brand_name: brand_name.trim().toLowerCase() },
          transaction,
        });
        if (!brand) {
          brand = await Brand.create(
            {
              brand_name: brand_name.trim().toLowerCase(),
            },
            { transaction }
          );
        }
        finalBrandId = brand.id;
      } else {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Either brand_id or brand_name is required",
        });
      }

      // Handle category - either use provided ID or find/create by name
      let finalCategoryId;
      if (category_id) {
        const category = await Category.findByPk(category_id, { transaction });
        if (!category) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Category not found",
          });
        }
        finalCategoryId = category_id;
      } else if (category_name) {
        let category = await Category.findOne({
          where: { category_name: category_name.trim().toLowerCase() },
          transaction,
        });
        if (!category) {
          category = await Category.create(
            {
              category_name: category_name.trim().toLowerCase(),
            },
            { transaction }
          );
        }
        finalCategoryId = category.id;
      } else {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Either category_id or category_name is required",
        });
      }

      // Verify shop exists
      const shop = await Shop.findByPk(shop_id, { transaction });
      if (!shop) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Shop not found",
        });
      }

      const product = await Product.create(
        {
          product_name: product_name.trim().toLowerCase(),
          length,
          width,
          thickness: thickness || null,
          quantity,
          weight: weight || null,
          brand_id: finalBrandId,
          shop_id,
          category_id: finalCategoryId,
        },
        { transaction }
      );

      // Fetch the created product with associations
      const createdProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: ["id", "brand_name"],
          },
          {
            model: Shop,
            as: "shop",
            attributes: ["id", "shop_name"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["id", "category_name"],
          },
        ],
        transaction,
      });

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: createdProduct,
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating product:", error);
      res.status(500).json({
        success: false,
        message: "Error creating product",
      });
    }
  }

  // Update product
  static async updateProduct(req, res) {
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
      const {
        product_name,
        length,
        width,
        thickness,
        quantity,
        weight,
        brand_id,
        brand_name,
        shop_id,
        category_id,
        category_name,
      } = req.body;

      const product = await Product.findByPk(id, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Handle brand - either use provided ID or find/create by name
      let finalBrandId;
      if (brand_id) {
        const brand = await Brand.findByPk(brand_id, { transaction });
        if (!brand) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Brand not found",
          });
        }
        finalBrandId = brand_id;
      } else if (brand_name) {
        let brand = await Brand.findOne({
          where: { brand_name: brand_name.trim() },
          transaction,
        });
        if (!brand) {
          brand = await Brand.create(
            {
              brand_name: brand_name.trim(),
            },
            { transaction }
          );
        }
        finalBrandId = brand.id;
      } else {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Either brand_id or brand_name is required",
        });
      }

      // Handle category - either use provided ID or find/create by name
      let finalCategoryId;
      if (category_id) {
        const category = await Category.findByPk(category_id, { transaction });
        if (!category) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Category not found",
          });
        }
        finalCategoryId = category_id;
      } else if (category_name) {
        let category = await Category.findOne({
          where: { category_name: category_name.trim() },
          transaction,
        });
        if (!category) {
          category = await Category.create(
            {
              category_name: category_name.trim(),
            },
            { transaction }
          );
        }
        finalCategoryId = category.id;
      } else {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Either category_id or category_name is required",
        });
      }

      // Verify shop exists
      const shop = await Shop.findByPk(shop_id, { transaction });
      if (!shop) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Shop not found",
        });
      }

      await product.update(
        {
          product_name: product_name.trim().toLowerCase(),
          length,
          width,
          thickness: thickness || null,
          quantity,
          weight: weight || null,
          brand_id: finalBrandId,
          shop_id,
          category_id: finalCategoryId,
        },
        { transaction }
      );

      // Fetch the updated product with associations
      const updatedProduct = await Product.findByPk(id, {
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: ["id", "brand_name"],
          },
          {
            model: Shop,
            as: "shop",
            attributes: ["id", "shop_name"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["id", "category_name"],
          },
        ],
        transaction,
      });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating product:", error);
      res.status(500).json({
        success: false,
        message: "Error updating product",
      });
    }
  }

  // Multiple delete products
  static async deleteMultipleProducts(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { productIds } = req.body;

      if (
        !productIds ||
        !Array.isArray(productIds) ||
        productIds.length === 0
      ) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Product IDs array is required and cannot be empty",
        });
      }

      // Check if all products exist
      const products = await Product.findAll({
        where: {
          id: {
            [Op.in]: productIds,
          },
        },
        transaction,
      });

      if (products.length !== productIds.length) {
        await transaction.rollback();
        const foundIds = products.map((p) => p.id);
        const notFoundIds = productIds.filter(
          (id) => !foundIds.includes(parseInt(id))
        );

        return res.status(404).json({
          success: false,
          message: `Products not found with IDs: ${notFoundIds.join(", ")}`,
        });
      }

      // Delete the products
      const deletedCount = await Product.destroy({
        where: {
          id: {
            [Op.in]: productIds,
          },
        },
        transaction,
      });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedCount} product(s)`,
        deletedCount: deletedCount,
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting products:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting products",
      });
    }
  }

  // Search products by query string
  static async searchProducts(req, res) {
    try {
      const { q, page = 1, limit = 50, shop_id } = req.query;

      // Validate search query
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      // Pagination parameters
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10))); // Max 100 per page
      const offset = (pageNum - 1) * limitNum;

      // Build where clause
      const where = {};
      let shop = null;

      // Add shop filter if shop_id is provided and not 'all'
      if (shop_id && String(shop_id).toLowerCase() !== "all") {
        // Check if shop exists
        shop = await Shop.findByPk(shop_id);
        if (!shop) {
          return res.status(404).json({
            success: false,
            message: "Shop not found",
          });
        }
        where.shop_id = shop_id;
      }

      // Add search query - search across multiple fields
      const searchTerm = q.trim().toLowerCase();
      where[Op.and] = [
        ...(where[Op.and] || []),
        {
          [Op.or]: [
            { product_name: { [Op.like]: `%${searchTerm}%` } },
            { "$brand.brand_name$": { [Op.like]: `%${searchTerm}%` } },
            { "$shop.shop_name$": { [Op.like]: `%${searchTerm}%` } },
            { "$category.category_name$": { [Op.like]: `%${searchTerm}%` } },
          ],
        },
      ];

      // Get products with pagination and total count - includes all product fields
      const { count, rows: products } = await Product.findAndCountAll({
        where,
        attributes: [
          'id', 
          'product_name', 
          'length', 
          'width', 
          'thickness', 
          'quantity', 
          'weight', 
          'brand_id', 
          'shop_id', 
          'category_id',
          'createdAt',
          'updatedAt'
        ],
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: ["id", "brand_name"],
          },
          {
            model: Shop,
            as: "shop",
            attributes: ["id", "shop_name"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["id", "category_name"],
          },
        ],
        order: [
          ["updatedAt", "DESC"],
          ["createdAt", "DESC"],
          ["product_name", "ASC"],
        ],
        limit: limitNum,
        offset: offset,
        distinct: true, // Important for accurate count with includes
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      res.status(200).json({
        success: true,
        data: {
          shop: shop,
          products: products,
          totalProducts: count,
          searchQuery: q,
        },
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          total: count,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
        },
      });
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({
        success: false,
        message: "Error searching products",
      });
    }
  }
}

module.exports = ProductController;
