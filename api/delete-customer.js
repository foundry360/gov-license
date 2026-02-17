// Delete Customer API endpoint
// DELETE /api/delete-customer/:customer_id

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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const customerId = req.params.customer_id || req.url.split('/').pop();
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const supabase = getSupabaseClient();

    // Check if customer has licenses
    const { data: licenses, error: licensesError } = await supabase
      .from('licenses')
      .select('license_id')
      .eq('customer_id', customerId)
      .limit(1);

    if (licensesError) {
      console.error('Error checking licenses:', licensesError);
    }

    if (licenses && licenses.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing licenses. Please delete or reassign licenses first.' 
      });
    }

    // Delete customer
    const { data, error } = await supabase
      .from('customers')
      .delete()
      .eq('customer_id', customerId)
      .select();

    if (error) {
      console.error('Error deleting customer:', error);
      return res.status(500).json({
        error: 'Failed to delete customer',
        details: error.message,
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Error in delete-customer handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};


