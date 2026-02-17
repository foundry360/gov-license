// Script to populate vendor_api_keys table from existing licenses
// Run this once after creating the vendor_api_keys table
//
// Usage: node database/populate_vendor_api_keys.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_SECRET || process.env.LICENSE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
  console.error('Missing required environment variables:');
  console.error('  - SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('  - JWT_SECRET or LICENSE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate license key from license data (same as generate-license.js)
function generateLicenseKey(licenseData) {
  const payload = {
    customer_id: licenseData.customer_id,
    expires_at: licenseData.expires_at,
    features: licenseData.features || [],
    issued_at: licenseData.issued_at || new Date().toISOString(),
  };

  const expiresAt = new Date(licenseData.expires_at);
  const now = new Date();
  const expiresIn = Math.max(1, Math.floor((expiresAt - now) / 1000));

  return jwt.sign(payload, jwtSecret, {
    expiresIn: expiresIn,
  });
}

// Generate SHA256 hash of license key
function hashLicenseKey(licenseKey) {
  return crypto.createHash('sha256').update(licenseKey).digest('hex');
}

async function populateVendorApiKeys() {
  console.log('Starting vendor_api_keys population...\n');

  // Get all licenses
  const { data: licenses, error: licensesError } = await supabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: true });

  if (licensesError) {
    console.error('Error fetching licenses:', licensesError);
    process.exit(1);
  }

  console.log(`Found ${licenses.length} licenses to process\n`);

  // Get all existing vendor_api_keys to avoid duplicates
  const { data: existingKeys, error: existingError } = await supabase
    .from('vendor_api_keys')
    .select('license_id');

  if (existingError) {
    console.error('Error fetching existing vendor_api_keys:', existingError);
    process.exit(1);
  }

  const existingLicenseIds = new Set(existingKeys?.map(k => k.license_id) || []);
  console.log(`Found ${existingLicenseIds.size} existing vendor_api_keys entries\n`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  // Process each license
  for (const license of licenses) {
    // Skip if already exists
    if (existingLicenseIds.has(license.license_id)) {
      console.log(`⏭️  Skipping license ${license.license_id} (already exists)`);
      skipped++;
      continue;
    }

    try {
      // Generate license key
      const licenseData = {
        customer_id: license.customer_id,
        expires_at: license.expires_at,
        features: license.features || [],
        issued_at: license.issued_at || license.created_at || new Date().toISOString(),
      };

      const licenseKey = generateLicenseKey(licenseData);
      const apiKeyHash = hashLicenseKey(licenseKey);

      // Get customer info
      const { data: customer } = await supabase
        .from('customers')
        .select('company_name, contact_email')
        .eq('customer_id', license.customer_id)
        .single();

      // Insert into vendor_api_keys
      const { data: vendorKey, error: insertError } = await supabase
        .from('vendor_api_keys')
        .insert({
          license_id: license.license_id,
          api_key_hash: apiKeyHash,
          status: license.status,
          customer_code: license.customer_id,
          customer_name: customer?.company_name || null,
          contact_email: customer?.contact_email || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Error inserting license ${license.license_id}:`, insertError.message);
        errors++;
      } else {
        console.log(`✅ Processed license ${license.license_id} (${license.customer_id})`);
        processed++;
      }
    } catch (error) {
      console.error(`❌ Error processing license ${license.license_id}:`, error.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Population complete!');
  console.log(`  ✅ Processed: ${processed}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log('='.repeat(50));
}

// Run the population
populateVendorApiKeys()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });

