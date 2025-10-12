'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create customer_sale_mapping table
    await queryInterface.createTable('customer_sale_mappings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: [0], msg: 'Total amount must be non-negative' }
        }
      },
      customer_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      customer_phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'upi', 'cash/upi'),
        allowNull: true,
        defaultValue: 'cash'
      },
      sale_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      customer_paid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: [0], msg: 'Customer paid amount must be non-negative' }
        }
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
        validate: {
          min: { args: [0], msg: 'Discount amount must be non-negative' }
        }
      },
      rest_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
        validate: {
          min: { args: [0], msg: 'Rest amount must be non-negative' }
        }
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add customer_sale_id to sales table
    await queryInterface.addColumn('sales', 'customer_sale_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Make it nullable initially to avoid issues with existing data
      references: {
        model: 'customer_sale_mappings',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index on customer_sale_id for better performance
    await queryInterface.addIndex('sales', ['customer_sale_id'], {
      name: 'idx_sales_customer_sale_id'
    });

    // Add indexes to customer_sale_mappings for better query performance
    await queryInterface.addIndex('customer_sale_mappings', ['sale_date'], {
      name: 'idx_customer_sale_mappings_sale_date'
    });

    await queryInterface.addIndex('customer_sale_mappings', ['payment_method'], {
      name: 'idx_customer_sale_mappings_payment_method'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('sales', 'idx_sales_customer_sale_id');
    await queryInterface.removeIndex('customer_sale_mappings', 'idx_customer_sale_mappings_sale_date');
    await queryInterface.removeIndex('customer_sale_mappings', 'idx_customer_sale_mappings_payment_method');

    // Remove customer_sale_id column from sales table
    await queryInterface.removeColumn('sales', 'customer_sale_id');

    // Drop customer_sale_mappings table
    await queryInterface.dropTable('customer_sale_mappings');
  }
};
