const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.production'});

const { initializeDatabase } = require('./setup/setup');
const routes = require('./routes');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware

app.use(cors({
  origin: '*', // Allow all origins (change to specific URL in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false, // Set to true if you need cookies
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database tables on startup
initializeDatabase()
  .catch((error) => {
    console.error('Error initializing database:', error);
  });

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Project Dashboard API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
    },
  });
});

// All API routes (auth middleware handled in routes/index.js)
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  // console.log(`API endpoint: http://localhost:${PORT}/api/projects`);
});

module.exports = app;

