// Create Customer API endpoint
// POST /api/create-customer

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      customer_id,
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
    if (!customer_id) {
      return res.status(400).json({
        error: 'customer_id is required',
      });
    }

    // Check if customer already exists
    const supabase = getSupabaseClient();
    const { data: existingCustomer, error: checkError } = await supabase
      .from('customers')
      .select('customer_id')
      .eq('customer_id', customer_id)
      .single();

    if (existingCustomer) {
      return res.status(409).json({
        error: 'Customer with this ID already exists',
      });
    }

    // Insert new customer
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        customer_id: customer_id.trim(),
        company_name: company_name || null,
        contact_name: contact_name || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        postal_code: postal_code || null,
        notes: notes || null,
        status: status || 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      return res.status(500).json({
        error: 'Failed to create customer',
        details: insertError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer: newCustomer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};

