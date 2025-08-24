'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      store_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      owner_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      mobile_number: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[6-9]\d{9}$/
        }
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      street_address: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      pincode: {
        type: Sequelize.STRING(6),
        allowNull: true,
        validate: {
          is: /^\d{6}$/
        }
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Add unique constraints in the table creation itself
    await queryInterface.addConstraint('users', {
      fields: ['mobile_number'],
      type: 'unique',
      name: 'unique_mobile_number'
    });

    if (queryInterface.sequelize.options.dialect === 'mysql') {
      await queryInterface.addConstraint('users', {
        fields: ['email'],
        type: 'unique',
        name: 'unique_email'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
