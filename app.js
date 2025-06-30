const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const APP_CONFIG = require('./config');
const authRoutes = require('./src/routes');
// const servicesRoutes = require('./src/routes/servicesRoutes')
const corsMiddleware = require('./src/./middleware/cors');
const initializeSocket = require('./src/routes/messages/socket'); // Import Socket.IO setup
const app = express();
const PORT = process.env.PORT || APP_CONFIG.SERVER_PORT;

const server = http.createServer(app);


const io = initializeSocket(server);
app.set('io', io);

app.use(corsMiddleware); // Applying CORS middleware

app.use(express.json());
app.use(cookieParser());

// Use the aggregated auth routes
app.use('/', authRoutes);

// Start the server
server.listen(PORT, () => {
  console.log(`Auth service is running on port ${PORT}`);
});
