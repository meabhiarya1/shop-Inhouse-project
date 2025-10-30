
const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const CustomerSaleMapping = require('../models/CustomerSaleMapping');
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
        items,
        customer,
        totals
      } = req.body;

      // Validate required data structure
      if (!items || !Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Items array is required and must contain at least one item'
        });
      }

      if (!customer || !totals) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Customer and totals information are required'
        });
      }

      // Validate customer payment
      const customerPaidAmount = parseFloat(customer.customer_paid || totals.customer_paid);
      if (!customerPaidAmount || customerPaidAmount <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Customer paid amount is required and must be greater than 0'
        });
      }

      // Extract customer and sale info
      const {
        customer_name,
        customer_phone,
        payment_method = 'cash',
        sale_date
      } = customer;

      const grandTotal = parseFloat(totals.total);
      const discountAmount = parseFloat(totals.discount_amount || totals.discount || 0);
      const restAmount = parseFloat(totals.rest_amount || 0);

      // Validate payment logic
      if (customerPaidAmount > grandTotal) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Customer paid amount cannot be greater than total amount'
        });
      }

      // First create the customer sale mapping record
      const customerSaleMapping = await CustomerSaleMapping.create({
        total_amount: grandTotal,
        customer_name: customer_name ? customer_name.trim() : null,
        customer_phone: customer_phone ? customer_phone.trim() : null,
        payment_method,
        sale_date: sale_date ? new Date(sale_date) : new Date(),
        customer_paid: customerPaidAmount,
        discount_amount: discountAmount > 0 ? discountAmount : null,
        rest_amount: restAmount > 0 ? restAmount : null
      }, { transaction });

      const createdSales = [];
      const updatedProducts = [];

      // Process each item
      for (const item of items) {
        const {
          product_id,
          quantity,
          unit_price,
          total,
          shop_id
        } = item;

        // Validate shop_id is provided
        if (!shop_id) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Shop ID is required for each item'
          });
        }

        // Check if product exists and has enough quantity
        const product = await Product.findByPk(product_id, { transaction });
        if (!product) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: `Product with ID ${product_id} not found`
          });
        }

        if (product.quantity < quantity) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product ${product.product_name}. Available: ${product.quantity}, Requested: ${quantity}`
          });
        }

        // Check if shop exists
        const shopRecord = await Shop.findByPk(shop_id, { transaction });
        if (!shopRecord) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: `Shop with ID ${shop_id} not found`
          });
        }

        // Create sale record for this item (linking to customer sale mapping)
        const sale = await Sale.create({
          product_id,
          shop_id,
          customer_sale_id: customerSaleMapping.id,
          quantity_sold: parseInt(quantity),
          unit_price: parseFloat(unit_price)
        }, { transaction });

        // Update product quantity (reduce by sold amount)
        await product.update({
          quantity: product.quantity - quantity
        }, { transaction });

        // Store for response
        updatedProducts.push({
          product_id,
          old_quantity: product.quantity + quantity,
          new_quantity: product.quantity - quantity,
          sold_quantity: quantity
        });

        createdSales.push(sale.id);
      }

      // Fetch all created sales with associations
      const salesWithDetails = await Sale.findAll({
        where: {
          id: createdSales
        },
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
          },
          {
            model: CustomerSaleMapping,
            as: 'customerSale'
          }
        ],
        transaction
      });

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: `Sale recorded successfully with ${items.length} items`,
        data: {
          customer_sale_mapping_id: customerSaleMapping.id,
          sales: salesWithDetails,
          transaction_summary: {
            total_items: items.length,
            grand_total: grandTotal,
            customer_paid: customerPaidAmount,
            discount_amount: discountAmount,
            rest_amount: restAmount,
            payment_method,
            customer_name,
            customer_phone,
            sale_date: customerSaleMapping.sale_date
          },
          updated_products: updatedProducts
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error creating sale:', error);
      res.status(500).json({
        success: false,
        message: 'Error recording sale',
        error: error.message
      });
    }
  }

  // Get all sales (Customer-based data structure)
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

      const isAllShops = typeof shop_id === 'string' && shop_id.trim().toLowerCase() === 'all';
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause for CustomerSaleMapping
      const customerSaleWhereClause = {};
      
      // Date and payment method filters for CustomerSaleMapping
      if (start_date && end_date) {
        const s = new Date(start_date);
        const e = new Date(end_date);
        e.setHours(23,59,59,999);
        customerSaleWhereClause.sale_date = { [Op.between]: [s, e] };
      } else if (start_date) {
        const s = new Date(start_date);
        const e = new Date(start_date);
        e.setHours(23,59,59,999);
        customerSaleWhereClause.sale_date = { [Op.between]: [s, e] };
      } else if (end_date) {
        const s = new Date(end_date);
        const e = new Date(end_date);
        e.setHours(23,59,59,999);
        customerSaleWhereClause.sale_date = { [Op.between]: [s, e] };
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
        customerSaleWhereClause.sale_date = { [Op.between]: [s, e] };
      }

      if (payment_method) customerSaleWhereClause.payment_method = payment_method;

      // Build where clause for Sale items filtering
      const saleItemsWhereClause = {};
      if (shop_id && !isAllShops) saleItemsWhereClause.shop_id = shop_id;
      if (product_id) saleItemsWhereClause.product_id = product_id;

      // First get CustomerSaleMapping records with pagination
      const customerSales = await CustomerSaleMapping.findAndCountAll({
        where: customerSaleWhereClause,
        include: [
          {
            model: Sale,
            as: 'sales', // Use correct association name
            where: Object.keys(saleItemsWhereClause).length > 0 ? saleItemsWhereClause : undefined,
            required: Object.keys(saleItemsWhereClause).length > 0, // INNER JOIN only if filtering by shop/product
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
            ]
          }
        ],
        order: [['sale_date', 'DESC']],
        limit: parseInt(limit),
        offset: offset,
        distinct: true // Important for correct count with includes
      });

      // Transform the data to have a better structure
      const transformedSales = customerSales.rows.map(customerSale => {
        // Calculate totals from items
        const totalItems = customerSale.sales ? customerSale.sales.length : 0;
        const totalQuantity = customerSale.sales ? 
          customerSale.sales.reduce((sum, item) => sum + item.quantity_sold, 0) : 0;
        
        // Get unique shops involved in this sale
        const shopsInvolved = customerSale.sales ? 
          [...new Set(customerSale.sales.map(item => item.shop.shop_name))] : [];

        return {
          id: customerSale.id,
          customer_name: customerSale.customer_name,
          customer_phone: customerSale.customer_phone,
          payment_method: customerSale.payment_method,
          sale_date: customerSale.sale_date,
          total_amount: customerSale.total_amount,
          customer_paid: customerSale.customer_paid,
          discount_amount: customerSale.discount_amount,
          rest_amount: customerSale.rest_amount,
          createdAt: customerSale.createdAt,
          updatedAt: customerSale.updatedAt,
          
          // Summary information
          total_items: totalItems,
          total_quantity: totalQuantity,
          shops_involved: shopsInvolved,
          
          // Product details for modal/details view
          items: customerSale.sales ? customerSale.sales.map(item => ({
            id: item.id,
            quantity_sold: item.quantity_sold,
            unit_price: item.unit_price,
            total_price: (parseFloat(item.unit_price) * item.quantity_sold).toFixed(2),
            product: item.product,
            shop: item.shop,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          })) : []
        };
      });

      const currentPage = parseInt(page);
      const perPage = parseInt(limit);
      const totalRecords = customerSales.count;
      const totalPages = Math.ceil(totalRecords / perPage);

      res.status(200).json({
        success: true,
        data: {
          sales: transformedSales,
          pagination: {
            currentPage: currentPage,
            limit: perPage,
            total: totalRecords,
            totalPages: totalPages,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1
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

  // Get sale by ID (Customer Sale Transaction)
  static async getSaleById(req, res) {
    try {
      const { id } = req.params;

      // The id is customer_sale_id from customer_sale_mappings table
      const customerSale = await CustomerSaleMapping.findByPk(id, {
        include: [
          {
            model: Sale,
            as: 'sales',
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
            ]
          }
        ]
      });

      if (!customerSale) {
        return res.status(404).json({
          success: false,
          message: 'Sale not found'
        });
      }

      // Transform to match the structure used in getAllSales
      const totalItems = customerSale.sales ? customerSale.sales.length : 0;
      const totalQuantity = customerSale.sales ? 
        customerSale.sales.reduce((sum, item) => sum + item.quantity_sold, 0) : 0;
      const shopsInvolved = customerSale.sales ? 
        [...new Set(customerSale.sales.map(item => item.shop.shop_name))] : [];

      const transformedSale = {
        id: customerSale.id,
        customer_name: customerSale.customer_name,
        customer_phone: customerSale.customer_phone,
        payment_method: customerSale.payment_method,
        sale_date: customerSale.sale_date,
        total_amount: customerSale.total_amount,
        customer_paid: customerSale.customer_paid,
        discount_amount: customerSale.discount_amount,
        rest_amount: customerSale.rest_amount,
        createdAt: customerSale.createdAt,
        updatedAt: customerSale.updatedAt,
        
        // Summary information
        total_items: totalItems,
        total_quantity: totalQuantity,
        shops_involved: shopsInvolved,
        
        // Product details
        items: customerSale.sales ? customerSale.sales.map(item => ({
          id: item.id,
          quantity_sold: item.quantity_sold,
          unit_price: item.unit_price,
          total_price: (parseFloat(item.unit_price) * item.quantity_sold).toFixed(2),
          product: item.product,
          shop: item.shop,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        })) : []
      };

      res.status(200).json({
        success: true,
        data: transformedSale
      });

    } catch (error) {
      console.error('Error fetching sale:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching sale details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update sale (Customer Sale Transaction with items)
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

      const { id } = req.params; // This is customer_sale_id
      const {
        items,      // Array of sale items to update with their IDs
        customer,   // Customer info (customer_name, customer_phone, payment_method, sale_date)
        totals      // Totals (total, customer_paid, discount_amount, rest_amount)
      } = req.body;

      // Validate required data structure
      if (!customer || !totals) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Customer and totals information are required'
        });
      }

      // Find the customer sale mapping
      const customerSaleMapping = await CustomerSaleMapping.findByPk(id, {
        include: [{
          model: Sale,
          as: 'sales'
        }],
        transaction
      });

      if (!customerSaleMapping) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Sale transaction not found'
        });
      }

      // Extract customer and totals data
      const {
        customer_name,
        customer_phone,
        payment_method,
        sale_date
      } = customer;

      const grandTotal = parseFloat(totals.total_amount);
      const customerPaidAmount = parseFloat(totals.customer_paid);
      const discountAmount = parseFloat(totals.discount_amount || 0);
      const restAmount = parseFloat(totals.rest_amount || 0);

      // Validate customer payment
      if (!customerPaidAmount || customerPaidAmount <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Customer paid amount is required and must be greater than 0'
        });
      }

      if (customerPaidAmount > grandTotal) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Customer paid amount cannot be greater than total amount'
        });
      }

      // Update CustomerSaleMapping
      const customerSaleUpdateData = {
        total_amount: grandTotal,
        customer_name: customer_name ? customer_name.trim() : null,
        customer_phone: customer_phone ? customer_phone.trim() : null,
        payment_method: payment_method || 'cash',
        sale_date: sale_date ? new Date(sale_date) : customerSaleMapping.sale_date,
        customer_paid: customerPaidAmount,
        discount_amount: discountAmount > 0 ? discountAmount : null,
        rest_amount: restAmount > 0 ? restAmount : null
      };

      await customerSaleMapping.update(customerSaleUpdateData, { transaction });

      // Update individual sale items if provided
      const updatedItems = [];
      const productQuantityChanges = [];

      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const {
            id: saleItemId,
            product_id,
            quantity_sold: quantity,
            unit_price,
            shop_id
          } = item;

          // Find the sale item
          const saleItem = await Sale.findByPk(saleItemId, { transaction });
          
          if (!saleItem) {
            await transaction.rollback();
            return res.status(404).json({
              success: false,
              message: `Sale item with ID ${saleItemId} not found`
            });
          }

          // Verify this sale item belongs to this customer sale
          if (saleItem.customer_sale_id !== parseInt(id)) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: `Sale item ${saleItemId} does not belong to this transaction`
            });
          }

          // Get the product
          const product = await Product.findByPk(saleItem.product_id, { transaction });
          if (!product) {
            await transaction.rollback();
            return res.status(404).json({
              success: false,
              message: `Product not found for sale item ${saleItemId}`
            });
          }

          const saleUpdateData = {};
          let quantityDifference = 0;

          // Update quantity if changed
          if (quantity !== undefined) {
            const oldQuantitySold = saleItem.quantity_sold;
            const newQuantitySold = parseInt(quantity);
            quantityDifference = newQuantitySold - oldQuantitySold;

            // Check if product has enough stock for the change
            if (quantityDifference > 0 && product.quantity < quantityDifference) {
              await transaction.rollback();
              return res.status(400).json({
                success: false,
                message: `Insufficient stock for product ${product.product_name}. Available: ${product.quantity}, Required additional: ${quantityDifference}`
              });
            }

            saleUpdateData.quantity_sold = newQuantitySold;

            // Update product quantity
            await product.update({
              quantity: product.quantity - quantityDifference
            }, { transaction });

            productQuantityChanges.push({
              product_id: product.id,
              product_name: product.product_name,
              quantity_change: -quantityDifference,
              new_stock: product.quantity - quantityDifference
            });
          }

          // Update unit price if provided
          if (unit_price !== undefined) {
            saleUpdateData.unit_price = parseFloat(unit_price);
          }

          // Update shop if provided
          // if (shop_id !== undefined && shop_id !== saleItem.shop_id) {
          //   // Verify shop exists
          //   const shop = await Shop.findByPk(shop_id, { transaction });
          //   if (!shop) {
          //     await transaction.rollback();
          //     return res.status(404).json({
          //       success: false,
          //       message: `Shop with ID ${shop_id} not found`
          //     });
          //   }
          //   saleUpdateData.shop_id = shop_id;
          // }

          // Update the sale item
          if (Object.keys(saleUpdateData).length > 0) {
            await saleItem.update(saleUpdateData, { transaction });
          }

          updatedItems.push(saleItemId);
        }
      }

      // Fetch the updated customer sale with all associations
      const updatedCustomerSale = await CustomerSaleMapping.findByPk(id, {
        include: [
          {
            model: Sale,
            as: 'sales',
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
          }
        ],
        transaction
      });

      await transaction.commit();

      // Transform response similar to getAllSales structure
      const totalItems = updatedCustomerSale.sales ? updatedCustomerSale.sales.length : 0;
      const totalQuantity = updatedCustomerSale.sales ? 
        updatedCustomerSale.sales.reduce((sum, item) => sum + item.quantity_sold, 0) : 0;
      const shopsInvolved = updatedCustomerSale.sales ? 
        [...new Set(updatedCustomerSale.sales.map(item => item.shop.shop_name))] : [];

      const transformedSale = {
        id: updatedCustomerSale.id,
        customer_name: updatedCustomerSale.customer_name,
        customer_phone: updatedCustomerSale.customer_phone,
        payment_method: updatedCustomerSale.payment_method,
        sale_date: updatedCustomerSale.sale_date,
        total_amount: updatedCustomerSale.total_amount,
        customer_paid: updatedCustomerSale.customer_paid,
        discount_amount: updatedCustomerSale.discount_amount,
        rest_amount: updatedCustomerSale.rest_amount,
        createdAt: updatedCustomerSale.createdAt,
        updatedAt: updatedCustomerSale.updatedAt,
        total_items: totalItems,
        total_quantity: totalQuantity,
        shops_involved: shopsInvolved,
        items: updatedCustomerSale.sales ? updatedCustomerSale.sales.map(item => ({
          id: item.id,
          quantity_sold: item.quantity_sold,
          unit_price: item.unit_price,
          total_price: (parseFloat(item.unit_price) * item.quantity_sold).toFixed(2),
          product: item.product,
          shop: item.shop,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        })) : []
      };

      res.status(200).json({
        success: true,
        message: 'Sale transaction updated successfully',
        data: {
          sale: transformedSale,
          updated_items_count: updatedItems.length,
          product_quantity_changes: productQuantityChanges
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error updating sale:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating sale transaction',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete entire customer sale transaction (all items)
  static async deleteCustomerSale(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params; // customer_sale_id

      // Find the customer sale mapping with all associated sales
      const customerSale = await CustomerSaleMapping.findByPk(id, {
        include: [{
          model: Sale,
          as: 'sales'
        }],
        transaction
      });

      if (!customerSale) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Customer sale transaction not found'
        });
      }

      const restoredProducts = [];

      // Restore product quantities for all items in this sale
      if (customerSale.sales && customerSale.sales.length > 0) {
        for (const saleItem of customerSale.sales) {
          // Get the product
          const product = await Product.findByPk(saleItem.product_id, { transaction });
          
          if (product) {
            const oldQuantity = product.quantity;
            const restoredQuantity = saleItem.quantity_sold;
            const newQuantity = oldQuantity + restoredQuantity;

            // Restore product quantity
            await product.update({
              quantity: newQuantity
            }, { transaction });

            restoredProducts.push({
              product_id: product.id,
              product_name: product.product_name,
              restored_quantity: restoredQuantity,
              old_quantity: oldQuantity,
              new_quantity: newQuantity
            });
          }

          // Delete the sale item
          await saleItem.destroy({ transaction });
        }
      }

      // Delete the customer sale mapping
      await customerSale.destroy({ transaction });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Customer sale transaction deleted and product quantities restored',
        data: {
          customer_sale_id: id,
          deleted_items: customerSale.sales ? customerSale.sales.length : 0,
          restored_products: restoredProducts
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error deleting customer sale:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting customer sale transaction',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
    // Search sales by query (customer name, phone, shop, product, etc.)
  static async searchSales(req, res) {
    try {
      const { q = "", limit = 50, page = 1 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      if (!q || q.trim().length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: "Query string must be at least 2 characters" 
        });
      }

      const searchQuery = q.trim();

      // Build search conditions for customer name and phone (case-insensitive for MySQL)
      const searchCondition = {
        [Op.or]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('customer_name')),
            'LIKE',
            `%${searchQuery.toLowerCase()}%`
          ),
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('customer_phone')),
            'LIKE',
            `%${searchQuery.toLowerCase()}%`
          )
        ]
      };

      // Find matching CustomerSaleMappings with related sales data
      const customerSales = await CustomerSaleMapping.findAndCountAll({
        where: searchCondition,
        include: [
          {
            model: Sale,
            as: "sales",
            required: false,
            include: [
              {
                model: Product,
                as: "product",
                required: false,
                attributes: ['id', 'product_name', 'length', 'width', 'thickness', 'weight'],
                include: [
                  { 
                    model: Brand, 
                    as: "brand", 
                    attributes: ["id", "brand_name"] 
                  },
                  { 
                    model: Category, 
                    as: "category", 
                    attributes: ["id", "category_name"] 
                  }
                ]
              },
              {
                model: Shop,
                as: "shop",
                required: false,
                attributes: ["id", "shop_name"]
              }
            ]
          }
        ],
        order: [["sale_date", "DESC"]],
        limit: parseInt(limit),
        offset,
        distinct: true,
        subQuery: false
      });

      // Also search in products and shops separately for better results
      const productMatches = await CustomerSaleMapping.findAndCountAll({
        include: [
          {
            model: Sale,
            as: "sales",
            required: true,
            include: [
              {
                model: Product,
                as: "product",
                required: true,
                where: sequelize.where(
                  sequelize.fn('LOWER', sequelize.col('product_name')),
                  'LIKE',
                  `%${searchQuery.toLowerCase()}%`
                ),
                attributes: ['id', 'product_name', 'length', 'width', 'thickness', 'weight'],
                include: [
                  { model: Brand, as: "brand", attributes: ["id", "brand_name"] },
                  { model: Category, as: "category", attributes: ["id", "category_name"] }
                ]
              },
              {
                model: Shop,
                as: "shop",
                required: false,
                attributes: ["id", "shop_name"]
              }
            ]
          }
        ],
        order: [["sale_date", "DESC"]],
        limit: parseInt(limit),
        offset,
        distinct: true,
        subQuery: false
      });

      const shopMatches = await CustomerSaleMapping.findAndCountAll({
        include: [
          {
            model: Sale,
            as: "sales",
            required: true,
            include: [
              {
                model: Product,
                as: "product",
                required: false,
                attributes: ['id', 'product_name', 'length', 'width', 'thickness', 'weight'],
                include: [
                  { model: Brand, as: "brand", attributes: ["id", "brand_name"] },
                  { model: Category, as: "category", attributes: ["id", "category_name"] }
                ]
              },
              {
                model: Shop,
                as: "shop",
                required: true,
                where: sequelize.where(
                  sequelize.fn('LOWER', sequelize.col('shop_name')),
                  'LIKE',
                  `%${searchQuery.toLowerCase()}%`
                ),
                attributes: ["id", "shop_name"]
              }
            ]
          }
        ],
        order: [["sale_date", "DESC"]],
        limit: parseInt(limit),
        offset,
        distinct: true,
        subQuery: false
      });

      // Combine and deduplicate results
      const allResults = new Map();
      
      [...customerSales.rows, ...productMatches.rows, ...shopMatches.rows].forEach(sale => {
        if (!allResults.has(sale.id)) {
          allResults.set(sale.id, sale);
        }
      });

      const uniqueSales = Array.from(allResults.values())
        .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
        .slice(offset, offset + parseInt(limit));

      // Transform results
      const transformedSales = uniqueSales.map(customerSale => {
        const totalItems = customerSale.sales ? customerSale.sales.length : 0;
        const totalQuantity = customerSale.sales ? 
          customerSale.sales.reduce((sum, item) => sum + item.quantity_sold, 0) : 0;
        const shopsInvolved = customerSale.sales ? 
          [...new Set(customerSale.sales.map(item => item.shop?.shop_name).filter(Boolean))] : [];
        
        return {
          id: customerSale.id,
          customer_name: customerSale.customer_name,
          customer_phone: customerSale.customer_phone,
          payment_method: customerSale.payment_method,
          sale_date: customerSale.sale_date,
          total_amount: customerSale.total_amount,
          customer_paid: customerSale.customer_paid,
          discount_amount: customerSale.discount_amount,
          rest_amount: customerSale.rest_amount,
          createdAt: customerSale.createdAt,
          updatedAt: customerSale.updatedAt,
          total_items: totalItems,
          total_quantity: totalQuantity,
          shops_involved: shopsInvolved,
          items: customerSale.sales ? customerSale.sales.map(item => ({
            id: item.id,
            quantity_sold: item.quantity_sold,
            unit_price: item.unit_price,
            total_price: (parseFloat(item.unit_price) * item.quantity_sold).toFixed(2),
            product: item.product,
            shop: item.shop,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          })) : []
        };
      });

      const totalRecords = allResults.size;
      const currentPage = parseInt(page);
      const perPage = parseInt(limit);
      const totalPages = Math.ceil(totalRecords / perPage);

      res.status(200).json({
        success: true,
        data: {
          sales: transformedSales,
          pagination: {
            currentPage,
            limit: perPage,
            total: totalRecords,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1
          }
        }
      });
    } catch (error) {
      console.error("Error searching sales:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error searching sales",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = SalesController;
