require('dotenv').config();
const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Shop = require('../models/Shop');

// Product name templates organized by category types
const productTemplates = {
  plywood: [
    'Marine Plywood Sheet', 'Commercial Plywood Sheet', 'Decorative Plywood Panel',
    'Waterproof Plywood Board', 'BWR Grade Plywood', 'Fire Retardant Plywood',
    'Flexible Plywood Sheet', 'Calibrated Plywood Board', 'Gurjan Plywood Panel'
  ],
  hardware: [
    'Cabinet Hinge Set', 'Drawer Slide Rail', 'Door Handle Set', 'Cabinet Knob',
    'Soft Close Hinge', 'Ball Bearing Drawer Slide', 'Concealed Hinge',
    'Tower Bolt', 'Door Lock Set', 'Window Handle', 'Furniture Leg',
    'Corner Bracket', 'Shelf Bracket', 'L-Bracket', 'T-Hinge'
  ],
  doors: [
    'Flush Door Panel', 'Panel Door Frame', 'Sliding Door Track',
    'Folding Door System', 'Glass Door Panel', 'Wooden Door Frame',
    'Door Shutter', 'Security Door', 'Designer Door Panel'
  ],
  tiles: [
    'Ceramic Floor Tile', 'Vitrified Tile', 'Wall Tile', 'Mosaic Tile',
    'Granite Tile', 'Marble Tile', 'Digital Print Tile', 'Wooden Texture Tile',
    'Stone Texture Tile', 'Anti-Skid Tile', 'Parking Tile'
  ],
  sanitary: [
    'Wash Basin', 'Toilet Seat', 'Kitchen Sink', 'Bathroom Faucet',
    'Shower Head', 'Water Closet', 'Urinal', 'Bidet', 'Soap Dispenser',
    'Towel Rod', 'Paper Holder', 'Health Faucet', 'Angle Valve'
  ],
  electrical: [
    'Electrical Wire', 'Switch Socket', 'MCB Breaker', 'LED Bulb',
    'Tube Light', 'Ceiling Fan', 'Exhaust Fan', 'Distribution Board',
    'Cable Tray', 'Conduit Pipe', 'Junction Box', 'Panel Board'
  ],
  tools: [
    'Drill Machine', 'Angle Grinder', 'Circular Saw', 'Jigsaw',
    'Router Machine', 'Planer Machine', 'Sanders', 'Impact Driver',
    'Measuring Tape', 'Spirit Level', 'Chisel Set', 'Hammer',
    'Screwdriver Set', 'Wrench Set', 'Pliers Set'
  ],
  paint: [
    'Emulsion Paint', 'Enamel Paint', 'Primer Coat', 'Wood Stain',
    'Varnish', 'Thinner', 'Putty', 'Texture Paint', 'Distemper',
    'Wall Putty', 'Ceiling Paint', 'Metal Paint'
  ],
  steel: [
    'Steel Rod', 'Steel Pipe', 'Steel Angle', 'Steel Channel',
    'Steel Plate', 'Steel Beam', 'Reinforcement Bar', 'Steel Mesh',
    'Steel Coil', 'Galvanized Pipe', 'Square Tube', 'Round Tube'
  ],
  adhesive: [
    'Wood Adhesive', 'PVC Adhesive', 'Epoxy Adhesive', 'Contact Adhesive',
    'Silicone Sealant', 'Acrylic Sealant', 'Thread Locker', 'Super Glue',
    'Hot Melt Adhesive', 'Structural Adhesive'
  ]
};

// Common dimensions for different product types
const dimensionRanges = {
  sheet: { length: [1220, 2440], width: [610, 1220], thickness: [4, 25] },
  tile: { length: [200, 800], width: [200, 800], thickness: [6, 20] },
  pipe: { length: [1000, 6000], width: [25, 200], thickness: [2, 10] },
  hardware: { length: [50, 500], width: [25, 200], thickness: [2, 20] },
  tool: { length: [150, 600], width: [50, 300], thickness: [30, 150] },
  door: { length: [1980, 2100], width: [750, 900], thickness: [30, 50] }
};

// Generate random number within range
function randomInRange(min, max, decimals = 0) {
  const value = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value);
}

// Get random item from array
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate realistic product name with brand
function generateProductName(template, brandName) {
  const variations = [
    `${brandName} ${template}`,
    `${template} by ${brandName}`,
    `${brandName} Premium ${template}`,
    `${template} - ${brandName}`,
    `${brandName} ${template} Pro`
  ];
  return randomChoice(variations);
}

// Get dimensions based on product type
function getDimensions(categoryName) {
  const name = categoryName.toLowerCase();
  
  if (name.includes('plywood') || name.includes('sheet')) {
    return dimensionRanges.sheet;
  } else if (name.includes('tile')) {
    return dimensionRanges.tile;
  } else if (name.includes('pipe')) {
    return dimensionRanges.pipe;
  } else if (name.includes('door')) {
    return dimensionRanges.door;
  } else if (name.includes('hardware') || name.includes('hinge') || name.includes('handle')) {
    return dimensionRanges.hardware;
  } else if (name.includes('tool') || name.includes('machine')) {
    return dimensionRanges.tool;
  }
  
  // Default dimensions
  return { length: [100, 1000], width: [50, 500], thickness: [5, 50] };
}

// Generate product templates based on category
function getProductTemplatesForCategory(categoryName) {
  const name = categoryName.toLowerCase();
  
  if (name.includes('plywood') || name.includes('wood')) return productTemplates.plywood;
  if (name.includes('hardware') || name.includes('hinge') || name.includes('handle')) return productTemplates.hardware;
  if (name.includes('door')) return productTemplates.doors;
  if (name.includes('tile')) return productTemplates.tiles;
  if (name.includes('sanitary') || name.includes('bathroom') || name.includes('kitchen')) return productTemplates.sanitary;
  if (name.includes('electrical') || name.includes('wire') || name.includes('switch')) return productTemplates.electrical;
  if (name.includes('tool') || name.includes('machine')) return productTemplates.tools;
  if (name.includes('paint') || name.includes('color')) return productTemplates.paint;
  if (name.includes('steel') || name.includes('iron') || name.includes('metal')) return productTemplates.steel;
  if (name.includes('adhesive') || name.includes('glue')) return productTemplates.adhesive;
  
  // Default to hardware if category doesn't match
  return productTemplates.hardware;
}

async function generateProducts(brands, categories, shops, count = 200) {
  const products = [];
  
  console.log(`Generating ${count} products...`);
  console.log(`Available brands: ${brands.length}`);
  console.log(`Available categories: ${categories.length}`);
  console.log(`Available shops: ${shops.length}`);
  
  for (let i = 0; i < count; i++) {
    const brand = randomChoice(brands);
    const category = randomChoice(categories);
    const shop = randomChoice(shops);
    
    // Get appropriate templates for this category
    const templates = getProductTemplatesForCategory(category.category_name);
    const template = randomChoice(templates);
    
    // Generate product name
    const productName = generateProductName(template, brand.brand_name);
    
    // Get dimensions based on category
    const dimRange = getDimensions(category.category_name);
    const length = randomInRange(dimRange.length[0], dimRange.length[1], 2);
    const width = randomInRange(dimRange.width[0], dimRange.width[1], 2);
    const thickness = randomInRange(dimRange.thickness[0], dimRange.thickness[1], 2);
    
    // Generate other properties
    const quantity = randomInRange(10, 500);
    const weight = randomInRange(0.5, 50, 2);
    
    products.push({
      product_name: productName.substring(0, 200), // Ensure it fits in DB field
      length,
      width,
      thickness,
      quantity,
      weight,
      brand_id: brand.id,
      shop_id: shop.id,
      category_id: category.id
    });
    
    if ((i + 1) % 50 === 0) {
      console.log(`Generated ${i + 1}/${count} products...`);
    }
  }
  
  return products;
}

async function seedProducts() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected.');

    // Sync models
    await sequelize.sync();
    console.log('Database synchronized.');

    // Fetch all required data
    console.log('Fetching brands, categories, and shops...');
    
    const [brands, categories, shops] = await Promise.all([
      Brand.findAll({ order: [['brand_name', 'ASC']] }),
      Category.findAll({ order: [['category_name', 'ASC']] }),
      Shop.findAll({ where: { is_active: true }, order: [['shop_name', 'ASC']] })
    ]);

    if (brands.length === 0) {
      console.log('❌ No brands found. Please run seed:brands first.');
      process.exit(1);
    }

    if (categories.length === 0) {
      console.log('❌ No categories found. Please run seed:categories first.');
      process.exit(1);
    }

    if (shops.length === 0) {
      console.log('❌ No active shops found. Please run seed:shops first.');
      process.exit(1);
    }

    console.log(`✅ Found ${brands.length} brands, ${categories.length} categories, ${shops.length} shops`);

    // Check existing products
    const existingProductsCount = await Product.count();
    console.log(`Found ${existingProductsCount} existing products`);

    // Generate products
    const productsToCreate = await generateProducts(brands, categories, shops, 200);
    
    console.log(`\nCreating ${productsToCreate.length} products in batches...`);
    
    // Create products in batches to avoid memory issues
    const batchSize = 50;
    let createdCount = 0;
    
    for (let i = 0; i < productsToCreate.length; i += batchSize) {
      const batch = productsToCreate.slice(i, i + batchSize);
      
      try {
        const createdProducts = await Product.bulkCreate(batch, {
          validate: true,
          returning: true
        });
        
        createdCount += createdProducts.length;
        console.log(`✅ Created batch ${Math.floor(i/batchSize) + 1}: ${createdProducts.length} products (Total: ${createdCount})`);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error creating batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        // Continue with next batch
      }
    }

    // Final summary
    const totalProducts = await Product.count();
    console.log(`\n✅ Product seeding completed!`);
    console.log(`Total products created: ${createdCount}`);
    console.log(`Total products in database: ${totalProducts}`);
    
    // Show sample of created products
    const sampleProducts = await Product.findAll({
      limit: 5,
      include: [
        { model: Brand, as: 'brand', attributes: ['brand_name'] },
        { model: Category, as: 'category', attributes: ['category_name'] },
        { model: Shop, as: 'shop', attributes: ['shop_name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log('\nSample products created:');
    sampleProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.product_name}`);
      console.log(`   Brand: ${product.brand.brand_name} | Category: ${product.category.category_name} | Shop: ${product.shop.shop_name}`);
      console.log(`   Dimensions: ${product.length}x${product.width}x${product.thickness}mm | Qty: ${product.quantity}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
