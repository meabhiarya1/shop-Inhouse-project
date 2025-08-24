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

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Shops
- `GET /api/shops` - Get all shops
- `GET /api/shops/:id` - Get shop by ID

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

## Error Handling
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

## Scripts

- `npm start` - Start the server
- `node scripts/seedUsers.js` - Initialize users
- `node scripts/seedShops.js` - Initialize shops
