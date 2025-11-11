const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const { Brand } = require('../models/Brand');

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
      { name: 'Asian Paints' },
      { name: 'Havells' },
      { name: 'Fevicol' },
      { name: 'Godrej' },
    ];

    for (const b of brands) {
      const existing = await Brand.findOne({ where: { name: b.name } });
      if (!existing) {
        await Brand.create(b);
        console.log(`✅ Created brand: ${b.name}`);
      } else {
        console.log(`⚠️ Brand already exists: ${b.name}`);
      }
    }

    console.log("✅ Brands seeded successfully!");
    await sequelize.close();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
})();
