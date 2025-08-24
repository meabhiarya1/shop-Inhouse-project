const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

class User extends Model {
  // Instance method to compare password
  async comparePassword(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      console.error('Password comparison error:', error);
      return false;
    }
  }

  // Override toJSON to exclude sensitive data
  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}

// Define User model
User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Basic Information
  owner_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Owner name is required' },
      len: {
        args: [2, 50],
        msg: 'Owner name must be between 2 and 50 characters'
      }
    }
  },
  
  // Contact Information
  mobile_number: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: {
      name: 'mobile_unique',
      msg: 'Mobile number already exists'
    },
    validate: {
      notEmpty: { msg: 'Mobile number is required' },
      is: {
        args: /^[6-9]\d{9}$/,
        msg: 'Please enter a valid 10-digit Indian mobile number'
      }
    }
  },
  
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: {
      name: 'email_unique',
      msg: 'Email already exists'
    },
    validate: {
      isEmail: { msg: 'Please enter a valid email address' }
    }
  },
  
  // Authentication
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Password is required' },
      len: {
        args: [6, 255],
        msg: 'Password must be at least 6 characters'
      }
    }
  },
  
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Account Status
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // Last login timestamp
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  
  // Hooks
  hooks: {
    // Hash password before creating user
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    
    // Hash password before updating if changed
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  
  // Indexes for performance
  indexes: [
    {
      unique: true,
      fields: ['mobile_number']
    },
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['is_verified']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = User;