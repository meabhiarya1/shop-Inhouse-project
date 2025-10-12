# Cart API Documentation

## Overview
The Cart API provides CRUD operations for managing user shopping carts with product mappings. Each user can have multiple products in their cart with specific quantities.

## Database Schema
**Table:** `cart_user_product_mapping`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key, auto increment |
| user_id | INTEGER | Foreign key to users table |
| product_id | INTEGER | Foreign key to products table |
| quantity | INTEGER | Number of items (min: 1, default: 1) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Record last update time |

**Constraints:**
- Unique constraint on (user_id, product_id) - prevents duplicate entries
- Foreign key constraints with CASCADE delete
- Indexes on user_id for performance

## API Endpoints

### Base URL
```
/api/cart
```

### Authentication
All cart endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Get Cart Items
**GET** `/api/cart`

Retrieves all cart items for the authenticated user with complete product details.

### Response
```json
{
  "success": true,
  "message": "Cart items retrieved successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "quantity": 2,
        "product": {
          "id": 10,
          "product_name": "Steel Sheet",
          "length": 10.50,
          "width": 5.25,
          "thickness": 2.00,
          "weight": 15.75,
          "stock": 50,
          "brand": {
            "id": 1,
            "brand_name": "Tata Steel"
          },
          "shop": {
            "id": 1,
            "shop_name": "Main Warehouse"
          },
          "category": {
            "id": 1,
            "category_name": "Steel Products"
          }
        },
        "created_at": "2025-10-12T10:30:00.000Z",
        "updated_at": "2025-10-12T10:30:00.000Z"
      }
    ],
    "summary": {
      "total_items": 5,
      "total_unique_products": 3
    }
  }
}
```

---

## 2. Add Item to Cart
**POST** `/api/cart`

Adds a product to the cart or updates quantity if already exists.

### Request Body
```json
{
  "product_id": 10,
  "quantity": 2  // Optional, defaults to 1
}
```

### Validation Rules
- `product_id`: Required, must be a valid integer ≥ 1
- `quantity`: Optional, must be a positive integer ≥ 1

### Response
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "product_id": 10,
    "quantity": 2,
    "product": {
      // Complete product details with brand, shop, category
    },
    "created_at": "2025-10-12T10:30:00.000Z",
    "updated_at": "2025-10-12T10:30:00.000Z"
  }
}
```

### Error Responses
- **404**: Product not found
- **400**: Insufficient stock
- **400**: Validation errors

---

## 3. Update Cart Item
**PUT** `/api/cart/:id`

Updates the quantity of a specific cart item.

### Parameters
- `id`: Cart item ID (required)

### Request Body
```json
{
  "quantity": 5
}
```

### Validation Rules
- `id`: Must be a valid integer ≥ 1
- `quantity`: Required, must be a positive integer ≥ 1

### Response
```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": {
    // Updated cart item with complete product details
  }
}
```

### Error Responses
- **404**: Cart item not found
- **400**: Insufficient stock
- **400**: Validation errors

---

## 4. Remove Item from Cart
**DELETE** `/api/cart/:id`

Removes a specific item from the cart.

### Parameters
- `id`: Cart item ID (required)

### Validation Rules
- `id`: Must be a valid integer ≥ 1

### Response
```json
{
  "success": true,
  "message": "Item removed from cart successfully"
}
```

### Error Responses
- **404**: Cart item not found

---

## 5. Clear Cart
**DELETE** `/api/cart`

Removes all items from the user's cart.

### Response
```json
{
  "success": true,
  "message": "Cart cleared successfully. 3 items removed.",
  "data": {
    "deleted_items_count": 3
  }
}
```

---

## 6. Get Cart Summary
**GET** `/api/cart/summary`

Retrieves cart summary statistics.

### Response
```json
{
  "success": true,
  "message": "Cart summary retrieved successfully",
  "data": {
    "total_items": 8,      // Sum of all quantities
    "unique_products": 3   // Number of different products
  }
}
```

---

## Error Handling

### Common Error Responses

#### 400 - Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "product_id",
      "message": "Valid product ID is required"
    }
  ]
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided"
}
```

#### 404 - Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

#### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Failed to add item to cart",
  "error": "Internal server error"
}
```

---

## Usage Examples

### Add Product to Cart
```javascript
// Add 3 units of product ID 15 to cart
const response = await fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + authToken
  },
  body: JSON.stringify({
    product_id: 15,
    quantity: 3
  })
});
```

### Get Cart Items
```javascript
const response = await fetch('/api/cart', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + authToken
  }
});
```

### Update Cart Item Quantity
```javascript
// Update cart item ID 5 to quantity 10
const response = await fetch('/api/cart/5', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + authToken
  },
  body: JSON.stringify({
    quantity: 10
  })
});
```

---

## Features

✅ **User-specific carts**: Each user has their own cart items  
✅ **Stock validation**: Prevents adding more items than available stock  
✅ **Duplicate prevention**: Updates quantity instead of creating duplicates  
✅ **Complete product details**: Returns full product info with brand, shop, category  
✅ **Cart summary**: Quick stats about cart contents  
✅ **Validation**: Comprehensive input validation with error messages  
✅ **Authentication**: Secure access with JWT tokens  
✅ **Performance optimized**: Database indexes for faster queries  

The cart system is now ready for frontend integration!
