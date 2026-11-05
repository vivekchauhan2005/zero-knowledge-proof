const express = require('express');
const cors = require('cors');
require('dotenv').config();

const zkpRoutes = require('./routes/zkpRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server and local clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Request logger for demonstration visibility
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root greeting
app.get('/', (req, res) => {
  res.json({
    project: 'Zero Knowledge Proof (ZKP) Authentication System',
    protocol: 'Schnorr Zero-Knowledge Identification Protocol',
    course: 'Cryptography & Network Security',
    apiRoot: '/api/zkp',
    docs: '/api/zkp/params'
  });
});

// ZKP API routes
app.use('/api/zkp', zkpRoutes);
app.use('/api', zkpRoutes); // Allow both /api/health and /api/zkp/health

// Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  Zero Knowledge Proof (Schnorr) Verifier Backend`);
    console.log(`  Subject: Cryptography & Network Security`);
    console.log(`  Server running at: http://localhost:${PORT}`);
    console.log(`  Public Parameters: p=23, q=11, g=2`);
    console.log(`=======================================================`);
  });
}

module.exports = app;

