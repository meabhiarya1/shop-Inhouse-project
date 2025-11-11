const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const Brand = require('../models/Brand'); // Remove destructuring - it's a default export

dotenv.config();

(async () => {
  try {
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
    await sequelize.close();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
})();
