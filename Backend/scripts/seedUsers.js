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

    // First, let's check if users already exist
    const existingUsers = await User.findAll();
    if (existingUsers.length > 0) {
      console.log('Existing users found:', existingUsers.length);
      console.log('Deleting existing users...');
      await User.destroy({ where: {} });
    }

    // Hash passwords and create users
    for (const userData of users) {
      console.log('\nSeeding user with:', {
        mobile: userData.mobile_number,
        rawPassword: userData.password
      });

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      console.log('Generated hash:', hashedPassword);
      
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        last_login: new Date()
      });

      console.log('Created user:', {
        id: user.id,
        mobile: user.mobile_number,
        store_name: user.store_name,
      });

      // Verify the password works immediately after creation
      const fetchedUser = await User.findByPk(user.id);
      console.log('Stored password hash:', fetchedUser.password);
      
      // Test with both bcrypt directly and the model method
      const directCheck = await bcrypt.compare(userData.password, fetchedUser.password);
      console.log('Direct bcrypt check:', directCheck);
      
      const modelCheck = await fetchedUser.comparePassword(userData.password);
      console.log('Model method check:', modelCheck);
    }

    console.log('✅ Users seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
