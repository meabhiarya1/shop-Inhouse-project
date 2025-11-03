const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { Op, fn, col, literal } = require('sequelize');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Brand = require('../models/Brand');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const CustomerSaleMapping = require('../models/CustomerSaleMapping');

class DashboardController {
  
  // Get dashboard analytics for products with sales data
  static async getDashboardAnalytics(req, res) {
    try {
      const { 
        period = 'today',
        start_date,
        end_date,
        shop_id,
        category_id,
        brand_id 
      } = req.query;

      // Normalize shop filter and treat 'all' as no filter
      const isAllShops = typeof shop_id === 'string' && shop_id.trim().toLowerCase() === 'all';

      // Calculate date range based on parameters
      let startDate, endDate;
      const now = new Date();
      
      // If start_date and end_date are provided, use them directly
      if (start_date && end_date) {
        startDate = new Date(start_date);
        endDate = new Date(end_date);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
      } else if (start_date) {
        // If only start_date provided, use it as single day
        startDate = new Date(start_date);
        endDate = new Date(start_date);
        endDate.setHours(23, 59, 59, 999);
      } else if (end_date) {
        // If only end_date provided, use it as single day
        startDate = new Date(end_date);
        endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Fall back to period-based logic
        switch (period) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
            
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
            break;
            
          case 'lifetime':
            startDate = new Date('1970-01-01');
            endDate = new Date();
            break;
            
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        }
      }

      // Build where clause for products
  const productWhere = {};
  if (shop_id && !isAllShops) productWhere.shop_id = shop_id;
      if (category_id) productWhere.category_id = category_id;
      if (brand_id) productWhere.brand_id = brand_id;

      // Get products with their current quantity and aggregated sales data
      const products = await Product.findAll({
        where: productWhere,
        attributes: [
          'id',
          'product_name',
          'quantity',
          'length',
          'width',
          'thickness',
          'weight',
          'updatedAt',
          [fn('COALESCE', fn('SUM', col('sales.quantity_sold')), 0), 'total_sold'],
          [fn('COALESCE', fn('SUM', literal('sales.quantity_sold * sales.unit_price')), 0), 'total_revenue']
        ],
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
          },
          {
            model: Sale,
            as: 'sales',
            required: false,
            attributes: [],
            include: [
              {
                model: CustomerSaleMapping,
                as: 'customerSale',
                where: {
                  sale_date: {
                    [Op.between]: [startDate, endDate]
                  }
                },
                required: true,
                attributes: []
              }
            ]
          }
        ],
        group: [
          'Product.id',
          'brand.id',
          'shop.id',
          'category.id'
        ],
        order: [['product_name', 'ASC']],
        subQuery: false
      });

      // Process the data to get cleaner format
      const dashboardData = products.map(product => {
        const totalSold = parseInt(product.get('total_sold')) || 0;
        const totalRevenue = parseFloat(product.get('total_revenue')) || 0;

        return {
          id: product.id,
          product_name: product.product_name,
          current_quantity: product.quantity,
          quantity_sold: totalSold,
          remaining_quantity: Math.max(0, (product.quantity || 0) - totalSold),
          total_revenue: totalRevenue,
          dimensions: {
            length: product.length,
            width: product.width,
            thickness: product.thickness,
            weight: product.weight
          },
          brand: product.brand,
          shop: product.shop,
          category: product.category,
          last_updated: product.updatedAt
        };
      });

      // Calculate summary statistics based on sales data
      const summary = {
        total_products: dashboardData.length,
        total_quantity_sold: dashboardData.reduce((sum, item) => sum + item.quantity_sold, 0),
        total_customer_paid: 0,
        total_due_amount: 0
      };

      // Get payment summary from CustomerSaleMapping
      const paymentSummary = await CustomerSaleMapping.findOne({
        where: {
          sale_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [fn('COALESCE', fn('SUM', col('customer_paid')), 0), 'total_paid'],
          [fn('COALESCE', fn('SUM', col('rest_amount')), 0), 'total_due']
        ],
        raw: true
      });

      if (paymentSummary) {
        summary.total_customer_paid = parseFloat(paymentSummary.total_paid) || 0;
        summary.total_due_amount = parseFloat(paymentSummary.total_due) || 0;
      }

      res.status(200).json({
        success: true,
        message: `Dashboard data${start_date || end_date ? ' for date range' : ` for ${period}`}`,
        data: {
          period: start_date || end_date ? 'custom_range' : period,
          date_range: {
            start: startDate,
            end: endDate,
            start_date: start_date || null,
            end_date: end_date || null
          },
          summary: summary,
          products: dashboardData
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard analytics'
      });
    }
  }

  // Get top selling products
  static async getTopSellingProducts(req, res) {
    try {
      const { 
        period = 'today',
        start_date,
        end_date,
        limit = 10,
        shop_id 
      } = req.query;

      // Normalize shop filter and treat 'all' as no filter
      const isAllShops = typeof shop_id === 'string' && shop_id.trim().toLowerCase() === 'all';

      // Calculate date range
      let startDate, endDate;
      const now = new Date();
      
      // If start_date and end_date are provided, use them directly
      if (start_date && end_date) {
        startDate = new Date(start_date);
        endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
      } else if (start_date) {
        startDate = new Date(start_date);
        endDate = new Date(start_date);
        endDate.setHours(23, 59, 59, 999);
      } else if (end_date) {
        startDate = new Date(end_date);
        endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Fall back to period-based logic
        switch (period) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
            break;
          case 'lifetime':
            startDate = new Date('1970-01-01');
            endDate = new Date();
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        }
      }

      const topProducts = await Sale.findAll({
        where: shop_id && !isAllShops ? { shop_id } : {},
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
              },
              {
                model: Shop,
                as: 'shop',
                attributes: ['id', 'shop_name']
              }
            ]
          },
          {
            model: Shop,
            as: 'shop',
            attributes: []
          },
          {
            model: CustomerSaleMapping,
            as: 'customerSale',
            where: {
              sale_date: {
                [Op.between]: [startDate, endDate]
              }
            },
            required: true,
            attributes: []
          }
        ],
        attributes: [
          'product_id',
          [fn('SUM', col('Sale.quantity_sold')), 'total_sold'],
          [fn('SUM', literal('Sale.quantity_sold * Sale.unit_price')), 'total_revenue'],
          [fn('COUNT', col('Sale.id')), 'total_transactions'],
          [fn('COALESCE', fn('SUM', col('customerSale.customer_paid')), 0), 'total_customer_paid'],
          [fn('COALESCE', fn('SUM', col('customerSale.discount_amount')), 0), 'total_discount'],
          [fn('COALESCE', fn('SUM', col('customerSale.rest_amount')), 0), 'total_due']
        ],
        group: [
          'product_id',
          'product.id',
          'product.product_name',
          'product.length',
          'product.width',
          'product.thickness',
          'product.weight',
          'product->brand.id',
          'product->brand.brand_name',
          'product->category.id',
          'product->category.category_name',
          'product->shop.id',
          'product->shop.shop_name'
        ],
        order: [[fn('SUM', col('Sale.quantity_sold')), 'DESC']],
        limit: parseInt(limit),
        subQuery: false
      });

      res.status(200).json({
        success: true,
        message: `Top ${limit} selling products${start_date || end_date ? ' for date range' : ` for ${period}`}`,
        data: {
          period: start_date || end_date ? 'custom_range' : period,
          date_range: { 
            start: startDate, 
            end: endDate,
            start_date: start_date || null,
            end_date: end_date || null
          },
          top_products: topProducts
        }
      });

    } catch (error) {
      console.error('Error fetching top selling products:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching top selling products'
      });
    }
  }

  // Get sales summary by shop
  static async getSalesSummaryByShop(req, res) {
    try {
      const { 
        period = 'today',
        start_date,
        end_date,
        shop_id 
      } = req.query;

      // Normalize shop filter and treat 'all' as no filter
      const isAllShops = typeof shop_id === 'string' && shop_id.trim().toLowerCase() === 'all';

      // Calculate date range
      let startDate, endDate;
      const now = new Date();
      
      // If start_date and end_date are provided, use them directly
      if (start_date && end_date) {
        startDate = new Date(start_date);
        endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
      } else if (start_date) {
        startDate = new Date(start_date);
        endDate = new Date(start_date);
        endDate.setHours(23, 59, 59, 999);
      } else if (end_date) {
        startDate = new Date(end_date);
        endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Fall back to period-based logic
        switch (period) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
            break;
          case 'lifetime':
            startDate = new Date('1970-01-01');
            endDate = new Date();
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        }
      }

  const shopSummary = await Sale.findAll({
        where: shop_id && !isAllShops ? { shop_id } : {},
        include: [
          {
            model: Shop,
            as: 'shop',
            attributes: ['id', 'shop_name', 'shop_type', 'city', 'state']
          },
          {
            model: CustomerSaleMapping,
            as: 'customerSale',
            where: {
              sale_date: {
                [Op.between]: [startDate, endDate]
              }
            },
            required: true,
            attributes: []
          }
        ],
        attributes: [
          'shop_id',
          [fn('SUM', col('Sale.quantity_sold')), 'total_quantity_sold'],
          [fn('SUM', literal('Sale.quantity_sold * Sale.unit_price')), 'total_revenue'],
          [fn('COUNT', col('Sale.id')), 'total_transactions'],
          [fn('COUNT', fn('DISTINCT', col('Sale.product_id'))), 'unique_products_sold']
        ],
        group: [
          'shop_id',
          'shop.id',
          'shop.shop_name',
          'shop.shop_type',
          'shop.city',
          'shop.state'
        ],
        order: [[fn('SUM', literal('Sale.quantity_sold * Sale.unit_price')), 'DESC']],
        subQuery: false
      });

      res.status(200).json({
        success: true,
        message: `Sales summary by shop${start_date || end_date ? ' for date range' : ` for ${period}`}`,
        data: {
          period: start_date || end_date ? 'custom_range' : period,
          date_range: { 
            start: startDate, 
            end: endDate,
            start_date: start_date || null,
            end_date: end_date || null
          },
          shop_summary: shopSummary
        }
      });

    } catch (error) {
      console.error('Error fetching sales summary by shop:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching sales summary'
      });
    }
  }
}

module.exports = DashboardController;
