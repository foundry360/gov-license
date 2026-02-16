// Vercel Serverless Function for License Generation
// POST /api/generate-license

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_SECRET || process.env.LICENSE_SECRET_KEY;

// Note: Supabase client will be initialized at runtime to avoid errors if env vars aren't set yet
function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Generate a unique signature hash for tracking
function generateSignatureHash(licenseData) {
  const dataString = JSON.stringify(licenseData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// Generate signed license key
function generateLicenseKey(licenseData) {
  const payload = {
    customer_id: licenseData.customer_id,
    expires_at: licenseData.expires_at,
    features: licenseData.features,
    issued_at: new Date().toISOString(),
  };

  // Sign with JWT (using HS256 algorithm)
  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: Math.floor((new Date(licenseData.expires_at) - new Date()) / 1000),
  });

  return token;
}

// Main handler
module.exports = async (req, res) => {
  // Check environment variables at runtime
  if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'Missing required environment variables. Please set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and JWT_SECRET.',
    });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customer_id, expires_at, features } = req.body;

    // Validate input
    if (!customer_id || !expires_at) {
      return res.status(400).json({
        error: 'Missing required fields: customer_id and expires_at are required',
      });
    }

    // Validate expiration date
    const expirationDate = new Date(expires_at);
    if (isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
      return res.status(400).json({
        error: 'Invalid expiration date. Must be a future date.',
      });
    }

    // Normalize features (ensure it's an array)
    const normalizedFeatures = Array.isArray(features) ? features : 
                               (features ? [features] : []);

    // Prepare license data
    const licenseData = {
      customer_id: String(customer_id),
      expires_at: expirationDate.toISOString(),
      features: normalizedFeatures,
    };

    // Generate license key
    const licenseKey = generateLicenseKey(licenseData);
    const signatureHash = generateSignatureHash(licenseData);

    // Store in Supabase
    const supabase = getSupabaseClient();
    const { data: licenseRecord, error: dbError } = await supabase
      .from('licenses')
      .insert({
        customer_id: licenseData.customer_id,
        expires_at: licenseData.expires_at,
        features: normalizedFeatures,
        status: 'active',
        signature_hash: signatureHash,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        error: 'Failed to store license in database',
        details: dbError.message,
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      license_key: licenseKey,
      license_id: licenseRecord.license_id,
      customer_id: licenseData.customer_id,
      expires_at: licenseData.expires_at,
      features: normalizedFeatures,
    });
  } catch (error) {
    console.error('Error generating license:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};

