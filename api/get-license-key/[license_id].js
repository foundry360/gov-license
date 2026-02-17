// Get License Key API endpoint for Vercel
// GET /api/get-license-key/:license_id
// This file handles the dynamic route on Vercel

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_SECRET || process.env.LICENSE_SECRET_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Generate license key from license data (same as generate-license.js)
function generateLicenseKey(licenseData) {
  const payload = {
    customer_id: licenseData.customer_id,
    expires_at: licenseData.expires_at,
    features: licenseData.features || [],
    issued_at: new Date().toISOString(), // Always use current time to match generation
  };

  if (!jwtSecret) {
    throw new Error('JWT_SECRET or LICENSE_SECRET_KEY not configured');
  }

  // Calculate expiration time in seconds (same as generate-license.js)
  const expiresIn = Math.floor((new Date(licenseData.expires_at) - new Date()) / 1000);

  return jwt.sign(payload, jwtSecret, {
    expiresIn: expiresIn,
  });
}

// Authentication middleware for Vercel
function authenticateToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    throw new Error('Authentication required');
  }

  if (!jwtSecret) {
    throw new Error('Server configuration error');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Main handler for Vercel serverless function
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate
    try {
      authenticateToken(req);
    } catch (authError) {
      return res.status(401).json({ error: authError.message });
    }

    // Check environment variables first
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      });
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Supabase credentials not configured'
      });
    }

    if (!jwtSecret) {
      console.error('Missing JWT_SECRET or LICENSE_SECRET_KEY');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'JWT_SECRET or LICENSE_SECRET_KEY not configured'
      });
    }

    // Extract license_id from Vercel dynamic route
    // On Vercel, dynamic route parameters are in req.query with the bracket name
    let licenseId = req.query.license_id;
    
    // Fallback: extract from URL path if not in query
    if (!licenseId && req.url) {
      // Vercel dynamic routes: /api/get-license-key/[license_id] 
      // URL will be: /api/get-license-key/actual-license-id
      const match = req.url.match(/\/get-license-key\/([^\/\?]+)/);
      if (match) {
        licenseId = match[1];
      } else {
        // Last resort: get last segment
        const urlParts = req.url.split('/').filter(p => p);
        licenseId = urlParts[urlParts.length - 1];
        // Remove query string if present
        if (licenseId && licenseId.includes('?')) {
          licenseId = licenseId.split('?')[0];
        }
      }
    }
    
    if (!licenseId) {
      console.error('No license ID provided. URL:', req.url, 'Query:', req.query);
      return res.status(400).json({ error: 'License ID is required' });
    }

    console.log('Fetching license key for ID:', licenseId);

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (supabaseError) {
      console.error('Failed to create Supabase client:', supabaseError);
      return res.status(500).json({ 
        error: 'Database connection error',
        details: supabaseError.message
      });
    }

    // Get license from database
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_id', licenseId)
      .single();

    if (licenseError) {
      console.error('Supabase query error:', {
        code: licenseError.code,
        message: licenseError.message,
        details: licenseError.details,
        hint: licenseError.hint
      });
      return res.status(404).json({ 
        error: 'License not found', 
        details: licenseError.message 
      });
    }

    if (!license) {
      console.error('License not found in database for ID:', licenseId);
      return res.status(404).json({ error: 'License not found' });
    }

    console.log('License found:', {
      license_id: license.license_id,
      customer_id: license.customer_id,
      expires_at: license.expires_at,
      status: license.status
    });

    // Validate required fields
    if (!license.customer_id) {
      console.error('License missing customer_id:', license.license_id);
      return res.status(500).json({ 
        error: 'Invalid license data',
        details: 'License is missing customer_id'
      });
    }

    if (!license.expires_at) {
      console.error('License missing expires_at:', license.license_id);
      return res.status(500).json({ 
        error: 'Invalid license data',
        details: 'License is missing expires_at'
      });
    }

    // Regenerate license key from stored data (must match generate-license.js structure)
    const licenseData = {
      customer_id: license.customer_id,
      expires_at: license.expires_at,
      features: license.features || [],
    };

    console.log('Generating key for license data:', {
      customer_id: licenseData.customer_id,
      expires_at: licenseData.expires_at,
      features_count: licenseData.features.length,
      has_secret: !!jwtSecret
    });

    let licenseKey;
    try {
      licenseKey = generateLicenseKey(licenseData);
      console.log('License key generated successfully, length:', licenseKey.length);
    } catch (keyError) {
      console.error('Error generating license key:', {
        error: keyError.message,
        stack: keyError.stack,
        licenseData: {
          customer_id: licenseData.customer_id,
          expires_at: licenseData.expires_at
        }
      });
      return res.status(500).json({
        error: 'Failed to generate license key',
        details: keyError.message,
      });
    }

    return res.status(200).json({
      success: true,
      license_key: licenseKey,
      license_id: license.license_id,
      customer_id: license.customer_id,
    });
  } catch (error) {
    console.error('Unexpected error in get-license-key handler:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      query: req.query
    });
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};

