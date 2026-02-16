// Simple local development server
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// API Route - Import and use the handler
app.post('/api/generate-license', async (req, res) => {
  try {
    // Dynamically import to avoid errors if env vars aren't set yet
    const generateLicense = require('./api/generate-license');
    
    // Create a compatible response object
    const vercelRes = {
      setHeader: (name, value) => res.setHeader(name, value),
      status: (code) => ({
        json: (data) => res.status(code).json(data),
        end: () => res.status(code).end(),
      }),
    };
    
    // Call the handler
    await generateLicense(req, vercelRes);
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 License Management System - Development Server');
  console.log('================================================');
  console.log(`📱 Web UI: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api/generate-license`);
  console.log('');
  console.log('⚠️  Make sure to set environment variables:');
  console.log('   - SUPABASE_URL');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY');
  console.log('   - JWT_SECRET (or LICENSE_SECRET_KEY)');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

