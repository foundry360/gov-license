// Get License Key API endpoint
// GET /api/get-license-key/:license_id

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const licenseSecretKey = process.env.LICENSE_SECRET_KEY || process.env.JWT_SECRET;

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
    issued_at: licenseData.issued_at || new Date().toISOString(),
  };

  if (!licenseSecretKey) {
    throw new Error('LICENSE_SECRET_KEY not configured');
  }

  // Calculate expiration time in seconds
  const expiresAt = new Date(licenseData.expires_at);
  const now = new Date();
  const expiresIn = Math.max(1, Math.floor((expiresAt - now) / 1000));

  return jwt.sign(payload, licenseSecretKey, {
    expiresIn: expiresIn,
  });
}

// Main handler
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
    // Extract license_id from params (Express route parameter)
    let licenseId = req.params?.license_id;
    
    // Fallback: extract from URL if params not available
    if (!licenseId && req.url) {
      const urlParts = req.url.split('/');
      licenseId = urlParts[urlParts.length - 1];
      // Remove query string if present
      if (licenseId && licenseId.includes('?')) {
        licenseId = licenseId.split('?')[0];
      }
    }
    
    if (!licenseId) {
      console.error('No license ID provided. URL:', req.url, 'Params:', req.params);
      return res.status(400).json({ error: 'License ID is required' });
    }

    console.log('Fetching license key for ID:', licenseId);

    const supabase = getSupabaseClient();

    // Get license from database
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_id', licenseId)
      .single();

    if (licenseError) {
      console.error('Supabase error:', licenseError);
      return res.status(404).json({ error: 'License not found', details: licenseError.message });
    }

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    console.log('License found:', license.license_id);

    // Regenerate license key from stored data
    const licenseData = {
      customer_id: license.customer_id,
      expires_at: license.expires_at,
      features: license.features || [],
      issued_at: license.issued_at || license.created_at || new Date().toISOString(),
    };

    console.log('Generating key for license data:', {
      customer_id: licenseData.customer_id,
      expires_at: licenseData.expires_at,
      has_secret: !!licenseSecretKey
    });

    let licenseKey;
    try {
      licenseKey = generateLicenseKey(licenseData);
      console.log('License key generated successfully');
    } catch (keyError) {
      console.error('Error generating license key:', keyError);
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
    console.error('Error in get-license-key handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};

