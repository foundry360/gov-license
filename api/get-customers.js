// Get Customers API endpoint
// GET /api/get-customers

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
  console.log('get-customers.js handler called, method:', req.method);
  
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
    const supabase = getSupabaseClient();

    // Get all customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('Supabase error:', customersError);
      // If table doesn't exist, return empty array instead of error
      if (customersError.code === 'PGRST116' || customersError.message.includes('does not exist')) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }
      throw customersError;
    }

    // Get license counts for each customer
    const { data: licenses, error: licensesError } = await supabase
      .from('licenses')
      .select('customer_id, status, expires_at');

    if (licensesError) throw licensesError;

    // Add license statistics to each customer
    const customersWithStats = (customers || []).map(customer => {
      const customerLicenses = (licenses || []).filter(l => l.customer_id === customer.customer_id);
      const now = new Date();
      
      return {
        ...customer,
        total_licenses: customerLicenses.length,
        active_licenses: customerLicenses.filter(l => 
          l.status === 'active' && new Date(l.expires_at) > now
        ).length,
        latest_license_date: customerLicenses.length > 0 
          ? customerLicenses.sort((a, b) => new Date(b.expires_at) - new Date(a.expires_at))[0].expires_at
          : null
      };
    });

    return res.status(200).json({
      success: true,
      count: customersWithStats.length,
      data: customersWithStats,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};

