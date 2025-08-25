require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');

// Initialize Express app
const app = express();

// Connect to MySQL Database
connectDB();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:8000', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Basic Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Basic error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  const ports = [5000, 3000, 8000, 8080];
  
  for (const port of ports) {
    try {
      const result = await new Promise((resolve, reject) => {
        const server = app.listen(port)
          .once('listening', () => {
            console.log(`
=================================
🚀 Server started successfully!
📍 Port: ${port}
🌐 API: http://localhost:${port}
=================================`);
            resolve(server);
          })
          .once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              console.log(`Port ${port} is busy, trying next port...`);
              resolve(null);
            } else {
              reject(err);
            }
          });
      });
      
      if (result) {
        break; // Successfully started server
      }
    } catch (error) {
      console.error(`Failed to start server on port ${port}:`, error);
    }
  }
};

startServer();

module.exports = app;