const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const { Category } = require('../models/Category'); // adjust this path if models folder is elsewhere

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
      { name: 'Furniture', description: 'Home and office furniture' },
      { name: 'Hardware', description: 'Tools and hardware accessories' },
      { name: 'Electrical', description: 'Wires, switches, and electricals' },
      { name: 'Paints', description: 'Wall and wood paints' },
    ];

    for (const cat of categories) {
      const existing = await Category.findOne({ where: { name: cat.name } });
      if (!existing) {
        await Category.create(cat);
        console.log(`✅ Created category: ${cat.name}`);
      } else {
        console.log(`⚠️ Category already exists: ${cat.name}`);
      }
    }

    console.log("✅ Categories seeded successfully!");
    await sequelize.close();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
})();
