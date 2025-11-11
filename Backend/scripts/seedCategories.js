const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const Category = require('../models/Category'); // Remove destructuring - it's a default export

dotenv.config();

(async () => {
  try {
    console.log("Connecting to database...");
    const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false,
      }
    );

    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const categories = [
      { category_name: 'Furniture' },
      { category_name: 'Hardware' },
      { category_name: 'Electrical' },
      { category_name: 'Paints' },
    ];

    for (const cat of categories) {
      const existing = await Category.findOne({ where: { category_name: cat.category_name } });
      if (!existing) {
        await Category.create(cat);
        console.log(`✅ Created category: ${cat.category_name}`);
      } else {
        console.log(`⚠️ Category already exists: ${cat.category_name}`);
      }
    }

    console.log("✅ Categories seeded successfully!");
    await sequelize.close();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
})();
