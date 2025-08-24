require('dotenv').config();
const { sequelize } = require('../config/database');
const Shop = require('../models/Shop');

const shops = [
  {
    shop_name: "Anil Furniture",
    shop_type: "retail",
    phone_number: "9470064716",
    street_address: "45 Gandhi Chowk Road",
    city: "Hajipur",
    state: "Bihar",
    pincode: "844101",
    is_active: true
  },
  {
    shop_name: "Balaji Furniture",
    shop_type: "wholesale",
    phone_number: "7004106646",
    street_address: "12 Chanddralay",
    city: "Hajipur",
    state: "Bihar",
    pincode: "844101",
    is_active: true
  }
  // Add more shops as needed
];

async function seedShops() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected.');

    // Sync the Shop model with database (create table if it doesn't exist)
    await Shop.sync();
    console.log('Shops table synchronized.');

    // Check for existing shops
    console.log('Checking for existing shops...');
    const existingShops = await Shop.findAll();
    console.log(`Found ${existingShops.length} existing shops`);

    // Filter out shops that already exist (based on phone number)
    const existingPhoneNumbers = existingShops.map(shop => shop.phone_number);
    const shopsToCreate = shops.filter(shop => !existingPhoneNumbers.includes(shop.phone_number));

    if (shopsToCreate.length === 0) {
      console.log('All shops already exist in the database. No new shops to create.');
      process.exit(0);
      return;
    }

    console.log(`Creating ${shopsToCreate.length} new shops...`);

    // Create new shops
    for (const shopData of shopsToCreate) {
      console.log('\nCreating new shop:', {
        name: shopData.shop_name,
        phone: shopData.phone_number
      });
      
      const shop = await Shop.create(shopData);

      console.log('✅ Successfully created shop:', {
        id: shop.id,
        name: shop.shop_name,
        phone: shop.phone_number
      });
    }

    console.log('✅ Shops seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding shops:', error);
    process.exit(1);
  }
}

seedShops();
