'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shops', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      shop_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      shop_type: {
        type: Sequelize.ENUM('retail', 'wholesale', 'both'),
        allowNull: false,
        defaultValue: 'both'
      },
      phone_number: {
        type: Sequelize.STRING(10),
        allowNull: false,
        validate: {
          is: /^[6-9]\d{9}$/
        }
      },
      street_address: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      state: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      pincode: {
        type: Sequelize.STRING(6),
        allowNull: false,
        validate: {
          is: /^\d{6}$/
        }
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add unique constraint in the table creation itself
    await queryInterface.addConstraint('shops', {
      fields: ['phone_number'],
      type: 'unique',
      name: 'unique_phone_number'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('shops');
  }
};
