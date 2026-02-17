/**
 * Local test script for license validation
 * 
 * Usage:
 *   node test-local.js <license-key> [secret-key]
 * 
 * Or set environment variables:
 *   LICENSE_KEY=your-key JWT_SECRET=your-secret node test-local.js
 */

const { validateLicense } = require('./validation/validate-license');

// Get license key and secret from command line or environment
const licenseKey = process.argv[2] || process.env.LICENSE_KEY;
const secretKey = process.argv[3] || process.env.JWT_SECRET || process.env.LICENSE_SECRET_KEY;

if (!licenseKey) {
  console.error('❌ Error: License key required');
  console.log('\nUsage:');
  console.log('  node test-local.js <license-key> [secret-key]');
  console.log('\nOr set environment variables:');
  console.log('  LICENSE_KEY=your-key JWT_SECRET=your-secret node test-local.js');
  process.exit(1);
}

if (!secretKey) {
  console.error('❌ Error: Secret key required');
  console.log('\nProvide secret key as:');
  console.log('  1. Second argument: node test-local.js <license-key> <secret-key>');
  console.log('  2. Environment variable: JWT_SECRET=your-secret node test-local.js <license-key>');
  process.exit(1);
}

console.log('🔍 Validating license...\n');
console.log('License Key:', licenseKey.substring(0, 50) + '...');
console.log('Secret Key:', secretKey.substring(0, 20) + '...\n');

// Validate
const result = validateLicense(licenseKey, secretKey);

if (result.valid) {
  console.log('✅ License is VALID!\n');
  console.log('Details:');
  console.log('  Customer ID:', result.customer_id);
  console.log('  Issued At:', result.issued_at ? new Date(result.issued_at).toLocaleString() : 'N/A');
  console.log('  Expires At:', new Date(result.expires_at).toLocaleString());
  console.log('  Days Remaining:', result.days_remaining);
  console.log('  Features:', result.features.length > 0 ? result.features.join(', ') : 'None');
  process.exit(0);
} else {
  console.log('❌ License is INVALID!\n');
  console.log('Error:', result.error);
  if (result.customer_id) {
    console.log('\nLicense Info (expired):');
    console.log('  Customer ID:', result.customer_id);
    console.log('  Expires At:', result.expires_at ? new Date(result.expires_at).toLocaleString() : 'N/A');
  }
  process.exit(1);
}


