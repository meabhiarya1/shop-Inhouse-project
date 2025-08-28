# Shop Management Backend

This is the backend service for the Shop Management System, providing APIs for shop listing and user authentication.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn package manager

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/meabhiarya1/shop-Inhouse-project.git
   cd shop-Inhouse-project/Backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the Backend directory with the following variables:
   ```env
   # Server Configuration
   PORT=5000

   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=hardware_inventory_db

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h
   ```

4. **Initialize Database**
   - Make sure your MySQL server is running
   - Create a database named `hardware_inventory_db`
   ```sql
   CREATE DATABASE hardware_inventory_db;
   ```

5. **Run Database Scripts**
   Run these scripts in order to set up initial data:
   ```bash
   # Seed users (including admin user)
   node scripts/seedUsers.js

   # Seed sample shops
   node scripts/seedShops.js
   ```

6. **Start the Server**
   ```bash
   npm start
   ```
   The server will automatically try ports 5000, 3000, 8000, and 8080 if previous ports are busy.

## API Documentation

### Public Routes (No Authentication Required)

#### Authentication
- **POST** `/api/auth/login` - User login
  ```json
  // Request Body
  {
    "mobileNumber": "7004106646",
    "password": "password123"
  }
  
  // Success Response
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "jwt_token_here",
      "user": {
        "id": 1,
        "ownerName": "Abhijeet Kumar",
        "mobileNumber": "7004106646",
        "email": "abhijeet@hardwarehub.com",
        "lastLogin": "2025-08-24T..."
      }
    }
  }
  ```

### Private Routes (Authentication Required)
*All private routes require Authorization header: `Bearer <jwt_token>`*

#### User Profile
- **GET** `/api/auth/profile` - Get user profile

#### Shops
- **GET** `/api/shops` - Get all shops

#### Categories
- **GET** `/api/categories` - Get all categories
- **GET** `/api/categories/:categoryId/products` - Get all products by category ID
- **POST** `/api/categories` - Create new category
  ```json
  // Request Body
  {
    "category_name": "Wood"
  }
  ```
- **PUT** `/api/categories/:id` - Update category
  ```json
  // Request Body
  {
    "category_name": "Updated Category Name"
  }
  ```
- **DELETE** `/api/categories/:id` - Delete category (only if not associated with products)

#### Products
- **GET** `/api/products` - Get all products with brand, shop, and category details
- **GET** `/api/products/:id` - Get product by ID
- **GET** `/api/products/shop/:shopId` - Get all products by shop ID
- **POST** `/api/products` - Create new product
  ```json
  // Request Body
  {
    "product_name": "Wooden Chair",
    "length": 60.5,
    "width": 45.0,
    "thickness": 5.0,  // Optional, can be null
    "quantity": 25,
    "weight": 12.5,    // Optional, can be null
    "brand_id": 1,
    "shop_id": 1,
    "category_id": 1
  }
  ```
- **PUT** `/api/products/:id` - Update product
  ```json
  // Request Body (same as create)
  {
    "product_name": "Updated Product Name",
    "length": 65.0,
    "width": 50.0,
    "thickness": null,
    "quantity": 30,
    "weight": 15.0,
    "brand_id": 2,
    "shop_id": 1,
    "category_id": 2
  }
  ```
- **DELETE** `/api/products/delete/multiple` - Delete multiple products
  ```json
  // Request Body
  {
    "productIds": [1, 2, 3, 4]
  }
  ```

#### Sales Management
- **GET** `/api/sales` - Get all sales with filtering and pagination
  ```bash
  # Query Parameters:
  # page=1, limit=50, shop_id, product_id, payment_method
  # start_date=2024-08-26, end_date=2024-08-26
  
  # Examples:
  GET /api/sales?start_date=2024-08-26&end_date=2024-08-26
  GET /api/sales?shop_id=1&payment_method=cash&page=1&limit=20
  ```

- **GET** `/api/sales/:id` - Get sale details by ID

- **POST** `/api/sales` - Record new sale (automatically reduces product quantity)
  ```json
  // Request Body
  {
    "product_id": 1,
    "shop_id": 1,
    "quantity_sold": 3,
    "unit_price": 500.00,        // Optional
    "total_amount": 1500.00,     // Required
    "customer_name": "John Doe", // Optional
    "customer_phone": "9876543210", // Optional
    "payment_method": "cash",    // Optional: cash/card/upi/bank_transfer/credit
    "sale_date": "2024-08-26"    // Optional, defaults to current time
  }
  ```

- **PUT** `/api/sales/:id` - Update sale (adjusts product quantity accordingly)
  ```json
  // Request Body (all fields optional)
  {
    "quantity_sold": 5,
    "total_amount": 2500.00,
    "customer_name": "Jane Doe",
    "payment_method": "card"
  }
  ```

- **DELETE** `/api/sales/:id` - Cancel sale and restore product quantity

#### Dashboard Analytics
- **GET** `/api/dashboard/analytics` - Main dashboard with product analytics
  ```bash
  # Query Parameters (choose one approach):
  
  # Option 1: Date Range (Recommended)
  # start_date=2024-08-01, end_date=2024-08-28
  # start_date=2024-08-26 (single date)
  # end_date=2024-08-26 (single date)
  
  # Option 2: Period-based (Still supported)
  # period=today/yesterday/lifetime
  
  # Optional filters: shop_id, category_id, brand_id
  
  # Examples:
  GET /api/dashboard/analytics?start_date=2024-08-01&end_date=2024-08-28
  GET /api/dashboard/analytics?start_date=2024-08-26
  GET /api/dashboard/analytics?period=today
  GET /api/dashboard/analytics?start_date=2024-08-01&end_date=2024-08-31&shop_id=1
  ```
  
  ```json
  // Response includes:
  {
    "success": true,
    "message": "Dashboard data for date range",
    "data": {
      "period": "custom_range",    // Shows "custom_range" when using dates
      "date_range": {
        "start": "2024-08-01T00:00:00Z",
        "end": "2024-08-28T23:59:59Z",
        "start_date": "2024-08-01",  // Original input
        "end_date": "2024-08-28"     // Original input
      },
      "summary": {
        "total_products": 25,
        "total_quantity_sold": 47,
        "total_revenue": 15670.50,
        "products_with_sales": 8,
        "products_without_sales": 17
      },
      "products": [
        {
          "id": 1,
          "product_name": "Steel Rod",
          "current_quantity": 95,      // Current stock
          "quantity_sold": 5,          // Sold in selected period
          "total_revenue": 2500.00,    // Revenue in selected period
          "brand": {...},
          "shop": {...},
          "category": {...}
        }
      ]
    }
  }
  ```

- **GET** `/api/dashboard/top-products` - Top selling products by volume
  ```bash
  # Query Parameters (choose one approach):
  
  # Option 1: Date Range (Recommended)
  # start_date=2024-08-01, end_date=2024-08-28
  # start_date=2024-08-26 (single date)
  
  # Option 2: Period-based (Still supported)
  # period=today/yesterday/lifetime
  
  # Additional parameters: limit=10, shop_id
  
  # Examples:
  GET /api/dashboard/top-products?start_date=2024-08-01&end_date=2024-08-31&limit=5
  GET /api/dashboard/top-products?start_date=2024-08-26&limit=10
  GET /api/dashboard/top-products?period=today&limit=5
  GET /api/dashboard/top-products?period=lifetime&limit=10&shop_id=1
  ```

- **GET** `/api/dashboard/shop-summary` - Sales performance by shop
  ```bash
  # Query Parameters (choose one approach):
  
  # Option 1: Date Range (Recommended)
  # start_date=2024-08-01, end_date=2024-08-28
  # start_date=2024-08-26 (single date)
  
  # Option 2: Period-based (Still supported)
  # period=today/yesterday/lifetime
  
  # Examples:
  GET /api/dashboard/shop-summary?start_date=2024-08-01&end_date=2024-08-31
  GET /api/dashboard/shop-summary?start_date=2024-08-26
  GET /api/dashboard/shop-summary?period=today
  GET /api/dashboard/shop-summary?period=lifetime
  ```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_name VARCHAR(50) NOT NULL,
  mobile_number VARCHAR(10) NOT NULL UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_login DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

### Shops Table
```sql
CREATE TABLE shops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_name VARCHAR(100) NOT NULL,
  shop_type ENUM('retail', 'wholesale', 'both') NOT NULL DEFAULT 'both',
  phone_number VARCHAR(10) NOT NULL UNIQUE,
  street_address VARCHAR(200) NOT NULL,
  city VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  pincode VARCHAR(6) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

### Categories Table
```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

### Brands Table
```sql
CREATE TABLE brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

### Products Table
```sql
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(200) NOT NULL,
  length DECIMAL(10,2) NOT NULL,
  width DECIMAL(10,2) NOT NULL,
  thickness DECIMAL(10,2) NULL,
  quantity INT NOT NULL,
  weight DECIMAL(10,2) NULL,
  brand_id INT NOT NULL,
  shop_id INT NOT NULL,
  category_id INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (shop_id) REFERENCES shops(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Sales Table
```sql
CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  shop_id INT NOT NULL,
  quantity_sold INT NOT NULL,
  unit_price DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  payment_method ENUM('cash', 'card', 'upi', 'bank_transfer', 'credit') DEFAULT 'cash',
  sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);
```
The API uses standard HTTP response codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Security Features
- Password hashing using bcrypt
- JWT-based authentication
- Rate limiting for API endpoints
- Input validation and sanitization

## Development

To make changes:
1. Create a new branch
2. Make your changes
3. Test thoroughly
4. Create a pull request

## Troubleshooting

1. **Database Connection Issues**
   - Check if MySQL server is running
   - Verify database credentials in .env file
   - Ensure database exists

2. **Port Already in Use**
   - The server will automatically try different ports
   - Check for processes using required ports:
     ```bash
     lsof -i :5000
     ```

3. **Authentication Issues**
   - Verify JWT_SECRET in .env file
   - Check token expiration time
   - Ensure user credentials are correct

## Available Scripts

### Development
- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon
- `npm test` - Run tests with Jest

### Database Management
- `npm run setup-db` - Set up database and create tables
- `npm run migrate` - Run pending database migrations
- `npm run migrate:undo` - Undo last migration
- `npm run migrate:undo:all` - Undo all migrations
- `npm run db:reset` - Reset entire database (caution: deletes all data)

### Data Management
- `npm run seed:all` - Seed database with initial users and shops
- `npm run backup` - Create backup of database
- `npm run restore` - Restore database from backup

### Individual Scripts
- `node scripts/setupDatabase.js` - Database setup
- `node scripts/seedUsers.js` - Initialize users
- `node scripts/seedShops.js` - Initialize shops
- `node scripts/backupData.js` - Create data backup
- `node scripts/restoreData.js` - Restore from backup
- `node scripts/resetDatabase.js` - Reset database
