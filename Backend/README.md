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
