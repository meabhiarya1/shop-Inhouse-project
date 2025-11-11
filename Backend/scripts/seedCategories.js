require('dotenv').config();
const { sequelize } = require('../config/database');
const Category = require('../models/Category');

(async () => {
  try {
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
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
})();
