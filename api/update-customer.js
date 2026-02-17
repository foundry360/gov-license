// Update Customer API endpoint
// PUT /api/update-customer/:customer_id

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
    const customerId = req.params.customer_id || req.url.split('/').pop();
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Get customer data from request body
    const {
      company_name,
      contact_name,
      contact_email,
      contact_phone,
      address,
      city,
      state,
      country,
      postal_code,
      notes,
      status
    } = req.body;

    // Validate required fields
    if (!company_name || company_name.trim().length === 0) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const supabase = getSupabaseClient();

    // Check if customer exists
    const { data: existingCustomer, error: checkError } = await supabase
      .from('customers')
      .select('customer_id')
      .eq('customer_id', customerId)
      .single();

    if (checkError || !existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Update customer
    const updateData = {
      company_name: company_name.trim(),
      contact_name: contact_name ? contact_name.trim() : null,
      contact_email: contact_email ? contact_email.trim() : null,
      contact_phone: contact_phone ? contact_phone.trim() : null,
      address: address ? address.trim() : null,
      city: city ? city.trim() : null,
      state: state ? state.trim() : null,
      country: country ? country.trim() : null,
      postal_code: postal_code ? postal_code.trim() : null,
      notes: notes ? notes.trim() : null,
      status: status || 'active',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('customer_id', customerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return res.status(500).json({
        error: 'Failed to update customer',
        details: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: data,
    });
  } catch (error) {
    console.error('Error in update-customer handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};


