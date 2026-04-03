const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const payslipRoutes = require('./routes/payslip');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/payslips', payslipRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Payslip Generator API is running',
    timestamp: new Date().toISOString(),
  });
});

const path = require('path');

// Serve frontend in production (or locally via single server)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// API 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API Route not found' });
});

// Catch-all route for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Connect to MongoDB then start server
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/payslip_generator';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    // Vercel handles starting the server internally, so we only listen on a port if NOT on Vercel
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`🚀 Server running → http://localhost:${PORT}`);
        console.log(`📋 API Health   → http://localhost:${PORT}/api/health`);
      });
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Export the app so Vercel Serverless Functions can use it
module.exports = app;
