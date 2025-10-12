const { validationResult } = require("express-validator");
const { sequelize } = require("../config/database");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const Brand = require("../models/Brand");
const Shop = require("../models/Shop");
const Category = require("../models/Category");
const { Op } = require("sequelize");

class CartController {
  // Get all cart items for a user
  static async getCartItems(req, res) {
    try {
      const userId = req.userId; // Auth middleware sets req.userId

      const cartItems = await Cart.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Product,
            as: 'product',
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
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Calculate total items and total value
      let totalItems = 0;
      let totalValue = 0;

      const formattedCartItems = cartItems.map(item => {
        totalItems += item.quantity;
        // Note: We don't have price in Product model, so totalValue calculation is commented
        // totalValue += (item.product.price || 0) * item.quantity;

        return {
          id: item.id,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            product_name: item.product.product_name,
            length: item.product.length,
            width: item.product.width,
            thickness: item.product.thickness,
            weight: item.product.weight,
            stock: item.product.quantity,
            brand: item.product.brand,
            shop: item.product.shop,
            category: item.product.category
          },
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      });

      res.status(200).json({
        success: true,
        message: "Cart items retrieved successfully",
        data: {
          items: formattedCartItems,
          summary: {
            total_items: totalItems,
            total_unique_products: cartItems.length,
            // total_value: totalValue
          }
        }
      });

    } catch (error) {
      console.error("Get cart items error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve cart items",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Add item to cart
  static async addToCart(req, res) {
    try {
        console.log("Add to cart request body:", req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array()
        });
      }

      const userId = req.userId;
      const { product_id, quantity = 1 } = req.body;

      // Check if product exists and has sufficient stock
      const product = await Product.findByPk(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      if (product.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}`
        });
      }

      // Check if item already exists in cart
      const existingCartItem = await Cart.findOne({
        where: {
          user_id: userId,
          product_id: product_id
        }
      });

      let cartItem;

      if (existingCartItem) {
        // Update quantity
        const newQuantity = existingCartItem.quantity + quantity;
        
        if (product.quantity < newQuantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock. Available: ${product.quantity}, Total requested: ${newQuantity}`
          });
        }

        existingCartItem.quantity = newQuantity;
        cartItem = await existingCartItem.save();
      } else {
        // Create new cart item
        cartItem = await Cart.create({
          user_id: userId,
          product_id: product_id,
          quantity: quantity
        });
      }

      // Fetch the cart item with product details for response
      const cartItemWithProduct = await Cart.findByPk(cartItem.id, {
        include: [
          {
            model: Product,
            as: 'product',
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
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: existingCartItem ? "Cart item updated successfully" : "Item added to cart successfully",
        data: cartItemWithProduct
      });

    } catch (error) {
      console.error("Add to cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add item to cart",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update cart item quantity
  static async updateCartItem(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array()
        });
      }

      const userId = req.userId;
      const { id } = req.params;
      const { quantity } = req.body;

      // Find cart item
      const cartItem = await Cart.findOne({
        where: {
          id: id,
          user_id: userId
        },
        include: [
          {
            model: Product,
            as: 'product'
          }
        ]
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found"
        });
      }

      // Check stock availability
      if (cartItem.product.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${cartItem.product.quantity}, Requested: ${quantity}`
        });
      }

      // Update quantity
      cartItem.quantity = quantity;
      await cartItem.save();

      // Fetch updated cart item with full product details
      const updatedCartItem = await Cart.findByPk(cartItem.id, {
        include: [
          {
            model: Product,
            as: 'product',
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
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: "Cart item updated successfully",
        data: updatedCartItem
      });

    } catch (error) {
      console.error("Update cart item error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update cart item",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Remove item from cart
  static async removeFromCart(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      // Find and delete cart item
      const cartItem = await Cart.findOne({
        where: {
          id: id,
          user_id: userId
        }
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found"
        });
      }

      await cartItem.destroy();

      res.status(200).json({
        success: true,
        message: "Item removed from cart successfully"
      });

    } catch (error) {
      console.error("Remove from cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove item from cart",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Clear entire cart
  static async clearCart(req, res) {
    try {
      const userId = req.userId;

      const deletedCount = await Cart.destroy({
        where: {
          user_id: userId
        }
      });

      res.status(200).json({
        success: true,
        message: `Cart cleared successfully. ${deletedCount} items removed.`,
        data: {
          deleted_items_count: deletedCount
        }
      });

    } catch (error) {
      console.error("Clear cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear cart",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get cart summary (total items, unique products count)
  static async getCartSummary(req, res) {
    try {
      const userId = req.userId;

      const summary = await Cart.findAll({
        where: { user_id: userId },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'unique_products'],
          [sequelize.fn('SUM', sequelize.col('quantity')), 'total_items']
        ],
        raw: true
      });

      res.status(200).json({
        success: true,
        message: "Cart summary retrieved successfully",
        data: {
          total_items: parseInt(summary[0].total_items) || 0,
          unique_products: parseInt(summary[0].unique_products) || 0
        }
      });

    } catch (error) {
      console.error("Get cart summary error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve cart summary",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = CartController;
