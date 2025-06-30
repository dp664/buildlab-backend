const cors = require('cors');
const APP_CONFIG = require('../../config');

// console.log(APP_CONFIG);
// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3001','http://localhost:3000', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;
