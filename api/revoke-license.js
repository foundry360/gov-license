// Revoke License API endpoint
// PUT /api/revoke-license/:license_id

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Main handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow PUT
  if (req.method !== 'PUT') {
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
      return res.status(400).json({ error: 'License ID is required' });
    }

    const supabase = getSupabaseClient();

    // Check if license exists
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_id', licenseId)
      .single();

    if (licenseError || !license) {
      return res.status(404).json({ error: 'License not found' });
    }

    // Check if already revoked
    if (license.status === 'revoked') {
      return res.status(400).json({ error: 'License is already revoked' });
    }

    // Update license status to revoked
    const { data: updatedLicense, error: updateError } = await supabase
      .from('licenses')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('license_id', licenseId)
      .select()
      .single();

    if (updateError) {
      console.error('Error revoking license:', updateError);
      return res.status(500).json({
        error: 'Failed to revoke license',
        details: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'License revoked successfully',
      license: updatedLicense,
    });
  } catch (error) {
    console.error('Error in revoke-license handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};

