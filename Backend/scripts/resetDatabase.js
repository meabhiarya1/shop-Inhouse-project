require('dotenv').config();
const { Sequelize } = require('sequelize');

async function resetDatabase() {
  try {
    const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: console.log
      }
    );

    // Connect to database
    await sequelize.authenticate();
    console.log('Connected to database');

    // Drop tables if they exist
    console.log('Dropping existing tables...');
    await sequelize.query('DROP TABLE IF EXISTS `SequelizeMeta`;');
    await sequelize.query('DROP TABLE IF EXISTS `shops`;');
    await sequelize.query('DROP TABLE IF EXISTS `users`;');
    
    console.log('✅ Tables dropped successfully');
    console.log('\nNow you can run:');
    console.log('npm run migrate');
    console.log('npm run seed:all');
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
