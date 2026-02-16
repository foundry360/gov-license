// Dashboard Statistics API
// GET /api/dashboard-stats

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type } = req.query; // 'all', 'active', 'expiring', 'customers'
    const supabase = getSupabaseClient();

    let data = [];

    switch (type) {
      case 'all':
        // Get all licenses
        const { data: allLicenses, error: allError } = await supabase
          .from('licenses')
          .select('*')
          .order('created_at', { ascending: false });

        if (allError) throw allError;

        // Get all customers to map customer_id to company_name
        // If customers table doesn't exist or has error, continue without customer names
        const { data: allCustomers, error: customersError } = await supabase
          .from('customers')
          .select('customer_id, company_name');
        
        if (customersError) {
          console.warn('Warning: Could not fetch customers for name mapping:', customersError.message);
        }

        // Create a map of customer_id to company_name (case-insensitive matching)
        const customerMap = {};
        if (allCustomers && allCustomers.length > 0) {
          allCustomers.forEach(customer => {
            if (customer.customer_id) {
              // Store both original and lowercase for matching
              const key = customer.customer_id.trim();
              customerMap[key] = customer.company_name || null;
            }
          });
        }

        // Add company_name to each license
        let firstLicenseLogged = false;
        data = (allLicenses || []).map(license => {
          const customerId = license.customer_id ? license.customer_id.trim() : null;
          const companyName = customerId ? customerMap[customerId] : null;
          
          // Debug logging for first license
          if (!firstLicenseLogged && allLicenses && allLicenses.length > 0) {
            console.log('Mapping first license:', {
              license_customer_id: license.customer_id,
              trimmed_customer_id: customerId,
              found_in_map: customerId ? (customerId in customerMap) : false,
              company_name: companyName,
              available_customer_ids: Object.keys(customerMap).slice(0, 5)
            });
            firstLicenseLogged = true;
          }
          
          return {
            ...license,
            company_name: companyName !== undefined ? companyName : null,
          };
        });
        
        // Debug logging
        console.log('Total licenses:', data.length);
        console.log('Total customers in map:', Object.keys(customerMap).length);
        if (data.length > 0) {
          console.log('Sample license:', {
            customer_id: data[0].customer_id,
            company_name: data[0].company_name
          });
        }
        break;

      case 'active':
        // Get active licenses (status = 'active' and not expired)
        const now = new Date().toISOString();
        const { data: activeLicenses, error: activeError } = await supabase
          .from('licenses')
          .select('*')
          .eq('status', 'active')
          .gt('expires_at', now)
          .order('expires_at', { ascending: true });

        if (activeError) throw activeError;

        // Get all customers to map customer_id to company_name
        const { data: activeCustomers, error: activeCustomersError } = await supabase
          .from('customers')
          .select('customer_id, company_name');

        // Create a map of customer_id to company_name (case-insensitive matching)
        const activeCustomerMap = {};
        if (activeCustomers && activeCustomers.length > 0) {
          activeCustomers.forEach(customer => {
            if (customer.customer_id) {
              const key = customer.customer_id.trim();
              activeCustomerMap[key] = customer.company_name || null;
            }
          });
        }

        // Add company_name to each license
        data = (activeLicenses || []).map(license => {
          const customerId = license.customer_id ? license.customer_id.trim() : null;
          return {
            ...license,
            company_name: customerId ? (activeCustomerMap[customerId] || null) : null,
          };
        });
        break;

      case 'expiring':
        // Get licenses expiring in next 30 days
        const nowForExpiring = new Date().toISOString();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const { data: expiringLicenses, error: expiringError } = await supabase
          .from('licenses')
          .select('*')
          .eq('status', 'active')
          .gte('expires_at', nowForExpiring)
          .lte('expires_at', thirtyDaysFromNow.toISOString())
          .order('expires_at', { ascending: true });

        if (expiringError) throw expiringError;

        // Get all customers to map customer_id to company_name
        const { data: expiringCustomers, error: expiringCustomersError } = await supabase
          .from('customers')
          .select('customer_id, company_name');

        // Create a map of customer_id to company_name (case-insensitive matching)
        const expiringCustomerMap = {};
        if (expiringCustomers && expiringCustomers.length > 0) {
          expiringCustomers.forEach(customer => {
            if (customer.customer_id) {
              const key = customer.customer_id.trim();
              expiringCustomerMap[key] = customer.company_name || null;
            }
          });
        }

        // Add company_name to each license
        data = (expiringLicenses || []).map(license => {
          const customerId = license.customer_id ? license.customer_id.trim() : null;
          return {
            ...license,
            company_name: customerId ? (expiringCustomerMap[customerId] || null) : null,
          };
        });
        break;

      case 'customers':
        // Get all customers from customers table
        const { data: customersList, error: customersListError } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });

        if (customersListError) {
          console.error('Error fetching customers:', customersListError);
          // If table doesn't exist, return empty array
          if (customersListError.code === 'PGRST116' || customersListError.message.includes('does not exist')) {
            data = [];
            break;
          }
          throw customersListError;
        }

        // Get all licenses to calculate stats for each customer
        const { data: allLicensesForCustomers, error: licensesError } = await supabase
          .from('licenses')
          .select('customer_id, created_at, expires_at, status');

        // Group licenses by customer_id
        const licenseMap = {};
        (allLicensesForCustomers || []).forEach(license => {
          if (!licenseMap[license.customer_id]) {
            licenseMap[license.customer_id] = {
              total_licenses: 0,
              active_licenses: 0,
              latest_license_date: null,
            };
          }
          licenseMap[license.customer_id].total_licenses++;
          if (license.status === 'active' && new Date(license.expires_at) > new Date()) {
            licenseMap[license.customer_id].active_licenses++;
          }
          if (!licenseMap[license.customer_id].latest_license_date || 
              new Date(license.created_at) > new Date(licenseMap[license.customer_id].latest_license_date)) {
            licenseMap[license.customer_id].latest_license_date = license.created_at;
          }
        });

        // Combine customer data with license stats
        data = (customersList || []).map(customer => ({
          ...customer,
          total_licenses: licenseMap[customer.customer_id]?.total_licenses || 0,
          active_licenses: licenseMap[customer.customer_id]?.active_licenses || 0,
          latest_license_date: licenseMap[customer.customer_id]?.latest_license_date || null,
        }));
        break;

      default:
        return res.status(400).json({ error: 'Invalid type parameter. Use: all, active, expiring, or customers' });
    }

    return res.status(200).json({
      success: true,
      type: type,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};

