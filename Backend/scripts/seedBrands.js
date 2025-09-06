require('dotenv').config();
const { sequelize } = require('../config/database');
const Brand = require('../models/Brand');

const brands = [
  { brand_name: "Godrej" },
  { brand_name: "Hettich" },
  { brand_name: "Häfele" },
  { brand_name: "Blum" },
  { brand_name: "Ebco" },
  { brand_name: "Dorset" },
  { brand_name: "Ozone" },
  { brand_name: "Sleek" },
  { brand_name: "Carysil" },
  { brand_name: "Nirali" },
  { brand_name: "Hindware" },
  { brand_name: "Jaquar" },
  { brand_name: "Kohler" },
  { brand_name: "Grohe" },
  { brand_name: "Delta" },
  { brand_name: "Moen" },
  { brand_name: "American Standard" },
  { brand_name: "TOTO" },
  { brand_name: "Duravit" },
  { brand_name: "Roca" },
  { brand_name: "Century Plyboards" },
  { brand_name: "Greenply" },
  { brand_name: "Kitply" },
  { brand_name: "MDF Italia" },
  { brand_name: "Wimpy" },
  { brand_name: "Action TESA" },
  { brand_name: "Fevicol" },
  { brand_name: "Pidilite" },
  { brand_name: "Asian Paints" },
  { brand_name: "Berger Paints" },
  { brand_name: "Nerolac" },
  { brand_name: "Dulux" },
  { brand_name: "ICA" },
  { brand_name: "Anchor" },
  { brand_name: "Legrand" },
  { brand_name: "Schneider Electric" },
  { brand_name: "Havells" },
  { brand_name: "Finolex" },
  { brand_name: "Polycab" },
  { brand_name: "KEI" },
  { brand_name: "Phillips" },
  { brand_name: "Osram" },
  { brand_name: "Bajaj" },
  { brand_name: "Crompton" },
  { brand_name: "Orient" },
  { brand_name: "Usha" },
  { brand_name: "Khaitan" },
  { brand_name: "V-Guard" },
  { brand_name: "Syska" },
  { brand_name: "Wipro" },
  { brand_name: "Tata Tiscon" },
  { brand_name: "JSW Steel" },
  { brand_name: "SAIL" },
  { brand_name: "Jindal" },
  { brand_name: "Bhushan Steel" },
  { brand_name: "Essar Steel" },
  { brand_name: "Vizag Steel" },
  { brand_name: "Rashtriya Ispat" },
  { brand_name: "Kalyani Steel" },
  { brand_name: "Mahindra Steel" },
  { brand_name: "Apollo Pipes" },
  { brand_name: "Supreme" },
  { brand_name: "Astral" },
  { brand_name: "Prince Pipes" },
  { brand_name: "Ashirvad" },
  { brand_name: "Captain Pipes" },
  { brand_name: "Kisan Mouldings" },
  { brand_name: "Jain Irrigation" },
  { brand_name: "Skipper" },
  { brand_name: "Taro Pumps" },
  { brand_name: "Kirloskar" },
  { brand_name: "Crompton Greaves" },
  { brand_name: "Grundfos" },
  { brand_name: "Wilo" },
  { brand_name: "Shakti Pumps" },
  { brand_name: "CRI Pumps" },
  { brand_name: "Lubi Pumps" },
  { brand_name: "Texmo" },
  { brand_name: "Falcon Pumps" },
  { brand_name: "KSB Pumps" },
  { brand_name: "Bosch" },
  { brand_name: "Makita" },
  { brand_name: "DeWalt" },
  { brand_name: "Black & Decker" },
  { brand_name: "Hilti" },
  { brand_name: "Stanley" },
  { brand_name: "Milwaukee" },
  { brand_name: "Ryobi" },
  { brand_name: "Craftsman" },
  { brand_name: "Porter Cable" },
  { brand_name: "Festool" },
  { brand_name: "Hitachi" },
  { brand_name: "Metabo" },
  { brand_name: "Ridgid" },
  { brand_name: "Skil" },
  { brand_name: "Worx" },
  { brand_name: "Ingco" },
  { brand_name: "Total Tools" },
  { brand_name: "Yuri" },
  { brand_name: "Cheston" },
  { brand_name: "KPT" },
  { brand_name: "Eastman" },
  { brand_name: "Cumi" },
  { brand_name: "Groz" },
  { brand_name: "Taparia" }
];

async function seedBrands() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected.');

    // Sync the Brand model with database (create table if it doesn't exist)
    await Brand.sync();
    console.log('Brands table synchronized.');

    // Check for existing brands
    console.log('Checking for existing brands...');
    const existingBrands = await Brand.findAll();
    console.log(`Found ${existingBrands.length} existing brands`);

    // Filter out brands that already exist (based on brand name)
    const existingBrandNames = existingBrands.map(brand => brand.brand_name.toLowerCase());
    const brandsToCreate = brands.filter(brand => 
      !existingBrandNames.includes(brand.brand_name.toLowerCase())
    );

    if (brandsToCreate.length === 0) {
      console.log('All brands already exist in the database. No new brands to create.');
      console.log('Available brands:', existingBrands.map(b => b.brand_name).join(', '));
      process.exit(0);
      return;
    }

    console.log(`Creating ${brandsToCreate.length} new brands...`);

    // Create new brands in batches
    const createdBrands = await Brand.bulkCreate(brandsToCreate, {
      validate: true,
      ignoreDuplicates: true
    });

    console.log(`✅ Successfully created ${createdBrands.length} brands`);
    
    // Show summary of all brands
    const allBrands = await Brand.findAll({ order: [['brand_name', 'ASC']] });
    console.log(`\nTotal brands in database: ${allBrands.length}`);
    console.log('Brand names:', allBrands.map(b => b.brand_name).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding brands:', error);
    process.exit(1);
  }
}

seedBrands();
