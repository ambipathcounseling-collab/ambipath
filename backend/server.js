const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const enquiryRoutes = require('./routes/enquiry');
const adminRoutes = require('./routes/admin');

const app = express();

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:60050',
  'http://127.0.0.1:60050',
  'null'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed by server'));
    }
  },
  credentials: true
}));

// Body Parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// MongoDB Connection
const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log(`✅ MongoDB Connected Successfully to ${dbURI}`);

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/enquiry', enquiryRoutes);
    app.use('/api/admin', adminRoutes);

    // Health Check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', message: 'Ambipath API is running', timestamp: new Date() });
    });

    // 404 Handler
    app.use('*', (req, res) => {
      res.status(404).json({ success: false, message: 'Route not found' });
    });

    // Global Error Handler
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
      });
    });

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Ambipath Server running on port ${PORT}`);
      console.log(`🌐 API available at http://localhost:${PORT}/api`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Set PORT to a free port or stop the process using it.`);
        process.exit(1);
      }
      throw err;
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.error('The server will not start until MongoDB is available.');
    process.exit(1);
  });
