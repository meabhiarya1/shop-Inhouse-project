const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Category extends Model {}

Category.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  category_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Category name is required' }
    }
  }
}, {
  sequelize,
  modelName: 'Category',
  tableName: 'categories'
});

module.exports = Category;
