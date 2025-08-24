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

    // Check for existing users without deleting them
    console.log('Checking for existing users...');
    const existingUsers = await User.findAll();
    console.log(`Found ${existingUsers.length} existing users`);

    // Filter out users that already exist (based on mobile number)
    const existingMobileNumbers = existingUsers.map(user => user.mobile_number);
    const usersToCreate = users.filter(user => !existingMobileNumbers.includes(user.mobile_number));

    if (usersToCreate.length === 0) {
      console.log('All users already exist in the database. No new users to create.');
      process.exit(0);
      return;
    }

    console.log(`Creating ${usersToCreate.length} new users...`);

    // Hash passwords and create only new users
    for (const userData of usersToCreate) {
      console.log('\nCreating new user:', {
        store: userData.store_name,
        mobile: userData.mobile_number
      });

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        last_login: new Date()
      });

      console.log('✅ Successfully created user:', {
        id: user.id,
        store: user.store_name,
        mobile: user.mobile_number
      });

      // Verify the password works
      const passwordCheck = await user.comparePassword(userData.password);
      console.log('Password verification:', passwordCheck ? 'PASSED' : 'FAILED');
    }

    console.log('✅ Users seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
