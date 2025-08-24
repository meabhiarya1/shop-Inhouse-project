require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

async function backupData() {
  try {
    const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
      }
    );

    // Connect to database
    await sequelize.authenticate();
    console.log('Connected to database');

    // Create backups directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Create timestamped backup folder
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, timestamp);
    fs.mkdirSync(backupPath);

    // Tables to backup
    const tables = ['users', 'shops'];

    // Backup each table
    for (const table of tables) {
      console.log(`Backing up ${table}...`);
      
      // Get all records from the table
      const [results] = await sequelize.query(`SELECT * FROM ${table}`);
      
      // Save to JSON file
      const filePath = path.join(backupPath, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
      
      console.log(`✅ ${table} data backed up successfully`);
    }

    console.log(`\n✅ Backup completed successfully`);
    console.log(`Backup location: ${backupPath}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error backing up data:', error);
    process.exit(1);
  }
}

backupData();
