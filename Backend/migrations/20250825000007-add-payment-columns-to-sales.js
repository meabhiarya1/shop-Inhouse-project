'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('sales', 'customer_paid', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Amount actually paid by customer'
    });

    await queryInterface.addColumn('sales', 'discount_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Discount amount given to customer (total_amount - customer_paid)'
    });

    await queryInterface.addColumn('sales', 'rest_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Remaining amount if customer paid partially'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('sales', 'customer_paid');
    await queryInterface.removeColumn('sales', 'discount_amount');
    await queryInterface.removeColumn('sales', 'rest_amount');
  }
};
