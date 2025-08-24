require('dotenv').config();
const { sequelize } = require('../config/database');

// Import all models to register them
const User = require('../models/User');

async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync all models (create tables if they don't exist)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables synchronized');

    // Create indexes
    console.log('🔄 Creating database indexes...');
    
    // You can add custom indexes here if needed
    // await sequelize.query('CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile_number)');
    
    console.log('✅ Database setup completed successfully');
    
    // Display table info
    console.log('\n📋 Database Tables Created:');
    console.log('- users (User authentication and profile)');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;