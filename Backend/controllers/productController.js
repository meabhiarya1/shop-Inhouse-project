const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const { Op } = require('sequelize');

class ProductController {
  // Get all products
  static async getAllProducts(req, res) {
    try {
      const products = await Product.findAll({
        include: [
          {
            model: Brand,
            as: 'brand',
            attributes: ['id', 'brand_name']
          },
          {
            model: Shop,
            as: 'shop',
            attributes: ['id', 'shop_name']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'category_name']
          }
        ],
        order: [['product_name', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: products,
        total: products.length
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching products'
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
            as: 'brand',
            attributes: ['id', 'brand_name']
          },
          {
            model: Shop,
            as: 'shop',
            attributes: ['id', 'shop_name']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'category_name']
          }
        ]
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product details'
      });
    }
  }

  // Get all products by shop ID
  static async getAllProductsByShopId(req, res) {
    try {
      const { shopId } = req.params;

      // Check if shop exists
      const shop = await Shop.findByPk(shopId);
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found'
        });
      }

      const products = await Product.findAll({
        where: { shop_id: shopId },
        include: [
          {
            model: Brand,
            as: 'brand',
            attributes: ['id', 'brand_name']
          },
          {
            model: Shop,
            as: 'shop',
            attributes: ['id', 'shop_name']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'category_name']
          }
        ],
        order: [['product_name', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: {
          shop: shop,
          products: products,
          totalProducts: products.length
        }
      });
    } catch (error) {
      console.error('Error fetching products by shop:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching products for this shop'
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
          message: 'Validation errors',
          errors: errors.array()
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
        shop_id,
        category_id
      } = req.body;

      // Verify foreign key references exist
      const [brand, shop, category] = await Promise.all([
        Brand.findByPk(brand_id, { transaction }),
        Shop.findByPk(shop_id, { transaction }),
        Category.findByPk(category_id, { transaction })
      ]);

      if (!brand) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Brand not found'
        });
      }

      if (!shop) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Shop not found'
        });
      }

      if (!category) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }

      const product = await Product.create({
        product_name: product_name.trim(),
        length,
        width,
        thickness: thickness || null,
        quantity,
        weight: weight || null,
        brand_id,
        shop_id,
        category_id
      }, { transaction });

      // Fetch the created product with associations
      const createdProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: Brand,
            as: 'brand',
            attributes: ['id', 'brand_name']
          },
          {
            model: Shop,
            as: 'shop',
            attributes: ['id', 'shop_name']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'category_name']
          }
        ],
        transaction
      });

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: createdProduct
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating product'
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
          message: 'Validation errors',
          errors: errors.array()
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
        shop_id,
        category_id
      } = req.body;

      const product = await Product.findByPk(id, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Verify foreign key references exist
      const [brand, shop, category] = await Promise.all([
        Brand.findByPk(brand_id, { transaction }),
        Shop.findByPk(shop_id, { transaction }),
        Category.findByPk(category_id, { transaction })
      ]);

      if (!brand) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Brand not found'
        });
      }

      if (!shop) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Shop not found'
        });
      }

      if (!category) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }

      await product.update({
        product_name: product_name.trim(),
        length,
        width,
        thickness: thickness || null,
        quantity,
        weight: weight || null,
        brand_id,
        shop_id,
        category_id
      }, { transaction });

      // Fetch the updated product with associations
      const updatedProduct = await Product.findByPk(id, {
        include: [
          {
            model: Brand,
            as: 'brand',
            attributes: ['id', 'brand_name']
          },
          {
            model: Shop,
            as: 'shop',
            attributes: ['id', 'shop_name']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'category_name']
          }
        ],
        transaction
      });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating product'
      });
    }
  }

  // Multiple delete products
  static async deleteMultipleProducts(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { productIds } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Product IDs array is required and cannot be empty'
        });
      }

      // Check if all products exist
      const products = await Product.findAll({
        where: {
          id: {
            [Op.in]: productIds
          }
        },
        transaction
      });

      if (products.length !== productIds.length) {
        await transaction.rollback();
        const foundIds = products.map(p => p.id);
        const notFoundIds = productIds.filter(id => !foundIds.includes(parseInt(id)));
        
        return res.status(404).json({
          success: false,
          message: `Products not found with IDs: ${notFoundIds.join(', ')}`
        });
      }

      // Delete the products
      const deletedCount = await Product.destroy({
        where: {
          id: {
            [Op.in]: productIds
          }
        },
        transaction
      });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedCount} product(s)`,
        deletedCount: deletedCount
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error deleting products:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting products'
      });
    }
  }
}

module.exports = ProductController;
