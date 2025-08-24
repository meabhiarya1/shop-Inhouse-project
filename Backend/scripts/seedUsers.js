require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const User = require('../models/User');

const users = [
  {
    store_name: "Hardware Hub",
    owner_name: "Abhijeet Kumar",
    mobile_number: "7004106646",
    email: "abhijeet@hardwarehub.com",
    password: "password123",
    street_address: "123 Main Street, Gandhi Chowk",
    city: "Hajipur",
    state: "Bihar",
    pincode: "844101",
    is_verified: true,
    is_active: true
  }
  // Add more users as needed
];

async function seedUsers() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected.');

    // Hash passwords and create users
    for (const userData of users) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      await User.create({
        ...userData,
        password: hashedPassword,
        last_login: new Date()
      });
    }

    console.log('✅ Users seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
