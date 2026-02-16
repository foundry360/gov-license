// Simple local development server
const express = require('express');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  console.log('✓ Loaded environment variables from .env.local');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Authentication middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || process.env.LICENSE_SECRET_KEY;

function authenticateToken(req, res, next) {
  // Skip authentication for login and verify-auth endpoints
  if (req.path === '/api/login' || req.path === '/api/verify-auth' || req.path === '/login.html' || 
      req.path === '/dashboard.html' || req.path === '/customers.html' || req.path === '/licenses.html') {
    return next();
  }

  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    // For HTML requests, redirect to login
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('/login.html');
    }
    // For API requests, return 401
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('/login.html');
    }
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Apply authentication to protected routes
app.use('/api/generate-license', authenticateToken);

// Protect main page (but allow login page)
app.get('/', (req, res, next) => {
  // Check if user has token in query or will check via client-side
  // For now, serve the page and let client-side handle redirect
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

// Login API Route
app.post('/api/login', async (req, res) => {
  console.log('POST /api/login received');
  try {
    const loginHandler = require('./api/login');
    await loginHandler(req, res);
  } catch (error) {
    console.error('Error in login handler:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: error.message,
      });
    }
  }
});

// Verify Auth API Route
app.get('/api/verify-auth', async (req, res) => {
  try {
    const verifyAuth = require('./api/verify-auth');
    await verifyAuth(req, res);
  } catch (error) {
    console.error('Error in verify-auth handler:', error);
    res.status(500).json({
      error: 'Internal server error',
      authenticated: false,
    });
  }
});

// Dashboard Stats API Route
app.get('/api/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const dashboardStats = require('./api/dashboard-stats');
    await dashboardStats(req, res);
  } catch (error) {
    console.error('Error in dashboard-stats handler:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// Create Customer API Route
app.post('/api/create-customer', authenticateToken, async (req, res) => {
  try {
    const createCustomer = require('./api/create-customer');
    await createCustomer(req, res);
  } catch (error) {
    console.error('Error in create-customer handler:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// Get Customers API Route
app.get('/api/get-customers', authenticateToken, async (req, res) => {
  console.log('GET /api/get-customers - Route hit');
  try {
    const getCustomers = require('./api/get-customers');
    await getCustomers(req, res);
  } catch (error) {
    console.error('Error in get-customers handler:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: error.message,
      });
    }
  }
});

// Get License Key API Route
app.get('/api/get-license-key/:license_id', authenticateToken, async (req, res) => {
  console.log('GET /api/get-license-key - Route hit, license_id:', req.params.license_id);
  try {
    const getLicenseKey = require('./api/get-license-key');
    // Pass req and res to handler (req.params will be available)
    await getLicenseKey(req, res);
  } catch (error) {
    console.error('Error in get-license-key handler:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: error.message,
      });
    }
  }
});

// Revoke License API Route
app.put('/api/revoke-license/:license_id', authenticateToken, async (req, res) => {
  console.log('PUT /api/revoke-license - Route hit, license_id:', req.params.license_id);
  try {
    const revokeLicense = require('./api/revoke-license');
    await revokeLicense(req, res);
  } catch (error) {
    console.error('Error in revoke-license handler:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: error.message,
      });
    }
  }
});

// Update Customer API Route
app.put('/api/update-customer/:customer_id', authenticateToken, async (req, res) => {
  try {
    const updateCustomer = require('./api/update-customer');
    await updateCustomer(req, res);
  } catch (error) {
    console.error('Error in update-customer handler:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: error.message,
      });
    }
  }
});

// Delete Customer API Route
app.delete('/api/delete-customer/:customer_id', authenticateToken, async (req, res) => {
  try {
    const deleteCustomer = require('./api/delete-customer');
    await deleteCustomer(req, res);
  } catch (error) {
    console.error('Error in delete-customer handler:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: error.message,
      });
    }
  }
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

// Serve login page
app.get('/login.html', (req, res) => {
  const loginPath = path.join(__dirname, 'public', 'login.html');
  if (fs.existsSync(loginPath)) {
    res.sendFile(loginPath);
  } else {
    res.status(404).send('login.html not found');
  }
});

// Serve dashboard page
app.get('/dashboard.html', (req, res) => {
  const dashboardPath = path.join(__dirname, 'public', 'dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('dashboard.html not found');
  }
});

// Serve customers page
app.get('/customers.html', (req, res) => {
  const customersPath = path.join(__dirname, 'public', 'customers.html');
  if (fs.existsSync(customersPath)) {
    res.sendFile(customersPath);
  } else {
    res.status(404).send('customers.html not found');
  }
});

// Serve licenses page
app.get('/licenses.html', (req, res) => {
  const licensesPath = path.join(__dirname, 'public', 'licenses.html');
  if (fs.existsSync(licensesPath)) {
    res.sendFile(licensesPath);
  } else {
    res.status(404).send('licenses.html not found');
  }
});

// Debug: Log unmatched API requests (before static files)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') && req.method === 'GET' && req.path === '/api/get-customers') {
    console.log(`[DEBUG] Request received: ${req.method} ${req.path}`);
    console.log(`[DEBUG] Headers:`, req.headers);
  }
  next();
});

// Static files - serve after API routes
app.use(express.static('public'));

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

