require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

async function restoreData(backupPath) {
  if (!backupPath) {
    console.error('Please provide the backup folder path');
    console.log('Usage: node scripts/restoreData.js <backupFolderName>');
    process.exit(1);
  }

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

    // Full path to backup
    const fullBackupPath = path.join(__dirname, '../backups', backupPath);
    
    if (!fs.existsSync(fullBackupPath)) {
      console.error(`Backup folder not found: ${fullBackupPath}`);
      process.exit(1);
    }

    // Tables to restore
    const tables = ['users', 'shops'];

    // Restore each table
    for (const table of tables) {
      const filePath = path.join(fullBackupPath, `${table}.json`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${table}: backup file not found`);
        continue;
      }

      console.log(`\nRestoring ${table}...`);
      
      // Read backup file
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (data.length === 0) {
        console.log(`No data to restore for ${table}`);
        continue;
      }

      // Get column names from first record
      const columns = Object.keys(data[0]);
      
      // Clear existing data
      await sequelize.query(`DELETE FROM ${table}`);
      
      // Prepare bulk insert query
      const values = data.map(record => 
        '(' + columns.map(col => {
          const value = record[col];
          return value === null ? 'NULL' : 
            typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : 
            value;
        }).join(', ') + ')'
      ).join(',\n');

      const query = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES ${values}
      `;

      await sequelize.query(query);
      console.log(`✅ ${table} data restored successfully (${data.length} records)`);
    }

    console.log('\n✅ All data restored successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error restoring data:', error);
    process.exit(1);
  }
}

// Get backup folder name from command line argument
const backupFolder = process.argv[2];
restoreData(backupFolder);
