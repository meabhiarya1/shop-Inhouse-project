require('dotenv').config();
const { sequelize } = require('../config/database');
const Brand = require('../models/Brand');

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const brands = [
      { brand_name: 'Asian Paints' },
      { brand_name: 'Havells' },
      { brand_name: 'Fevicol' },
      { brand_name: 'Godrej' },
    ];

    for (const b of brands) {
      const existing = await Brand.findOne({ where: { brand_name: b.brand_name } });
      if (!existing) {
        await Brand.create(b);
        console.log(`✅ Created brand: ${b.brand_name}`);
      } else {
        console.log(`⚠️ Brand already exists: ${b.brand_name}`);
      }
    }

    console.log("✅ Brands seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
})();
