const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const { Op } = require('sequelize');

class SalesController {
  
  // Create new sale (record product sale)
  static async createSale(req, res) {
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
        product_id,
        shop_id,
        quantity_sold,
        unit_price,
        customer_name,
        customer_phone,
        total_amount,
        payment_method = 'cash',
        sale_date
      } = req.body;

      // Check if product exists and has enough quantity
      const product = await Product.findByPk(product_id, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      if (product.quantity < quantity_sold) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available quantity: ${product.quantity}, Requested: ${quantity_sold}`
        });
      }

      // Check if shop exists
      const shop = await Shop.findByPk(shop_id, { transaction });
      if (!shop) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Shop not found'
        });
      }

      // Calculate total amount
    //   const total_amount = parseFloat(unit_price) * parseInt(quantity_sold);

      // Create sale record
      const sale = await Sale.create({
        product_id,
        shop_id,
        quantity_sold: parseInt(quantity_sold),
        unit_price: parseFloat(unit_price) || null,
        total_amount,
        customer_name: customer_name ? customer_name.trim() : null,
        customer_phone: customer_phone ? customer_phone.trim() : null,
        payment_method,
        sale_date: sale_date ? new Date(sale_date) : new Date()
      }, { transaction });

      // Update product quantity (reduce by sold amount)
      await product.update({
        quantity: product.quantity - quantity_sold
      }, { transaction });

      // Fetch the created sale with associations
      const createdSale = await Sale.findByPk(sale.id, {
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
                model: Category,
                as: 'category',
                attributes: ['id', 'category_name']
              }
            ]
          },
          {
            model: Shop,
            as: 'shop',
            attributes: ['id', 'shop_name']
          }
        ],
        transaction
      });

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Sale recorded successfully',
        data: {
          sale: createdSale,
          updated_product_quantity: product.quantity - quantity_sold
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error creating sale:', error);
      res.status(500).json({
        success: false,
        message: 'Error recording sale'
      });
    }
  }

  // Get all sales
  static async getAllSales(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        shop_id, 
        product_id, 
        payment_method,
        start_date,
        end_date,
        period = 'today' 
      } = req.query;

      // Build where clause
      const whereClause = {};
      
      const isAllShops = typeof shop_id === 'string' && shop_id.trim().toLowerCase() === 'all';
      if (shop_id && !isAllShops) whereClause.shop_id = shop_id;
      if (product_id) whereClause.product_id = product_id;
      if (payment_method) whereClause.payment_method = payment_method;
      
      if (start_date && end_date) {
        const s = new Date(start_date);
        const e = new Date(end_date);
        e.setHours(23,59,59,999);
        whereClause.sale_date = { [Op.between]: [s, e] };
      } else if (start_date) {
        const s = new Date(start_date);
        const e = new Date(start_date);
        e.setHours(23,59,59,999);
        whereClause.sale_date = { [Op.between]: [s, e] };
      } else if (end_date) {
        const s = new Date(end_date);
        const e = new Date(end_date);
        e.setHours(23,59,59,999);
        whereClause.sale_date = { [Op.between]: [s, e] };
      } else if (period) {
        const now = new Date();
        let s, e;
        switch (period) {
          case 'today':
            s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
          case 'yesterday':
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            s = new Date(y.getFullYear(), y.getMonth(), y.getDate());
            e = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
            break;
          case 'lifetime':
            s = new Date('1970-01-01');
            e = new Date();
            break;
          default:
            s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }
        whereClause.sale_date = { [Op.between]: [s, e] };
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const sales = await Sale.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'product_name', 'length', 'width', 'thickness', 'weight'],
            include: [
              {
                model: Brand,
                as: 'brand',
                attributes: ['id', 'brand_name']
              },
              {
                model: Category,
                as: 'category',
                attributes: ['id', 'category_name']
              }
            ]
          },
          {
            model: Shop,
            as: 'shop',
            attributes: ['id', 'shop_name']
          }
        ],
        order: [['sale_date', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.status(200).json({
        success: true,
        data: {
          sales: sales.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(sales.count / parseInt(limit)),
            total_records: sales.count,
            per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching sales data'
      });
    }
  }

  // Get sale by ID
  static async getSaleById(req, res) {
    try {
      const { id } = req.params;

      const sale = await Sale.findByPk(id, {
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
                model: Category,
                as: 'category',
                attributes: ['id', 'category_name']
              }
            ]
          },
          {
            model: Shop,
            as: 'shop',
            attributes: ['id', 'shop_name']
          }
        ]
      });

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'Sale not found'
        });
      }

      res.status(200).json({
        success: true,
        data: sale
      });

    } catch (error) {
      console.error('Error fetching sale:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching sale details'
      });
    }
  }

  // Update sale (for corrections)
  static async updateSale(req, res) {
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
        quantity_sold,
        customer_name,
        customer_phone,
        payment_method,
        sale_date,
        total_amount,
        unit_price
      } = req.body;

      const sale = await Sale.findByPk(id, { transaction });
      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Sale not found'
        });
      }

      // Get the product to update quantity if quantity_sold changed
      const product = await Product.findByPk(sale.product_id, { transaction });
      const oldQuantitySold = sale.quantity_sold;
      const newQuantitySold = parseInt(quantity_sold);
      const quantityDifference = newQuantitySold - oldQuantitySold;

      // Check if product has enough stock for the change
      if (quantityDifference > 0 && product.quantity < quantityDifference) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for quantity increase. Available: ${product.quantity}, Required additional: ${quantityDifference}`
        });
      }

      // Update sale
    //   const total_amount = parseFloat(unit_price) * newQuantitySold;
      
      await sale.update({
        quantity_sold: newQuantitySold,
        total_amount,
        customer_name: customer_name ? customer_name.trim() : sale.customer_name,
        customer_phone: customer_phone ? customer_phone.trim() : sale.customer_phone,
        payment_method: payment_method || sale.payment_method,
        sale_date: sale_date ? new Date(sale_date) : new Date(),
        unit_price: parseFloat(unit_price) || null
      }, { transaction });

      // Update product quantity
      await product.update({
        quantity: product.quantity - quantityDifference
      }, { transaction });

      // Fetch updated sale with associations
      const updatedSale = await Sale.findByPk(id, {
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
                model: Category,
                as: 'category',
                attributes: ['id', 'category_name']
              }
            ]
          },
          {
            model: Shop,
            as: 'shop',
            attributes: ['id', 'shop_name']
          }
        ],
        transaction
      });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Sale updated successfully',
        data: {
          sale: updatedSale,
          product_quantity_change: -quantityDifference
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error updating sale:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating sale'
      });
    }
  }

  // Delete sale (refund/cancel)
  static async deleteSale(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;

      const sale = await Sale.findByPk(id, { transaction });
      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Sale not found'
        });
      }

      // Restore product quantity
      const product = await Product.findByPk(sale.product_id, { transaction });
      await product.update({
        quantity: product.quantity + sale.quantity_sold
      }, { transaction });

      // Delete the sale
      await sale.destroy({ transaction });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Sale deleted and product quantity restored',
        data: {
          restored_quantity: sale.quantity_sold,
          new_product_quantity: product.quantity + sale.quantity_sold
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error deleting sale:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting sale'
      });
    }
  }
}

module.exports = SalesController;
