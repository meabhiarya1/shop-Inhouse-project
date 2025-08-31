const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { Op, fn, col, literal } = require('sequelize');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Brand = require('../models/Brand');
const Shop = require('../models/Shop');
const Category = require('../models/Category');

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
      if (shop_id) productWhere.shop_id = shop_id;
      if (category_id) productWhere.category_id = category_id;
      if (brand_id) productWhere.brand_id = brand_id;

      // Get products with their current quantity and aggregated sales data
      // Note: We aggregate sales on the root (Product) to avoid selecting sales.id which breaks ONLY_FULL_GROUP_BY
      const products = await Product.findAll({
        where: productWhere,
        attributes: {
          include: [
            [fn('COALESCE', fn('SUM', col('sales.quantity_sold')), 0), 'total_sold'],
            [fn('COALESCE', fn('SUM', col('sales.total_amount')), 0), 'total_revenue']
          ]
        },
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
            where: {
              sale_date: {
                [Op.between]: [startDate, endDate]
              }
            },
            required: false, // LEFT JOIN to include products with no sales
            attributes: [] // avoid selecting sales.id to satisfy ONLY_FULL_GROUP_BY
          }
        ],
        group: ['Product.id'],
        order: [['product_name', 'ASC']]
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

      // Calculate summary statistics
      const summary = {
        total_products: dashboardData.length,
        total_quantity_sold: dashboardData.reduce((sum, item) => sum + item.quantity_sold, 0),
        total_revenue: dashboardData.reduce((sum, item) => sum + item.total_revenue, 0),
        products_with_sales: dashboardData.filter(item => item.quantity_sold > 0).length,
        products_without_sales: dashboardData.filter(item => item.quantity_sold === 0).length
      };

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

      // Build where clause for sales
      const salesWhere = {
        sale_date: {
          [Op.between]: [startDate, endDate]
        }
      };
      if (shop_id) salesWhere.shop_id = shop_id;

      const topProducts = await Sale.findAll({
        where: salesWhere,
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
        attributes: [
          'product_id',
          [fn('SUM', col('quantity_sold')), 'total_sold'],
          [fn('SUM', col('total_amount')), 'total_revenue'],
          [fn('COUNT', col('Sale.id')), 'total_transactions']
        ],
        group: ['product_id'],
        order: [[fn('SUM', col('quantity_sold')), 'DESC']],
        limit: parseInt(limit)
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
        end_date 
      } = req.query;

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
        where: {
          sale_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: Shop,
            as: 'shop',
    // Shop has no 'location' column; use city/state if needed
    attributes: ['id', 'shop_name', 'shop_type', 'city', 'state']
          }
        ],
        attributes: [
          'shop_id',
          [fn('SUM', col('quantity_sold')), 'total_quantity_sold'],
          [fn('SUM', col('total_amount')), 'total_revenue'],
          [fn('COUNT', col('Sale.id')), 'total_transactions'],
          [fn('COUNT', fn('DISTINCT', col('product_id'))), 'unique_products_sold']
        ],
        group: ['shop_id'],
        order: [[fn('SUM', col('total_amount')), 'DESC']]
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
