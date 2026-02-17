/**
 * Example: How to use license validation in your application
 * 
 * This demonstrates a simple integration pattern for validating
 * licenses in your deployed VPC software.
 */

const { validateLicense, validateLicenseFromFile } = require('./validate-license');
const fs = require('fs');

// Example 1: Validate license from environment variable or config
function checkLicense() {
  // Get license key from environment, config file, or user input
  const licenseKey = process.env.LICENSE_KEY || 
                     fs.readFileSync('./license.txt', 'utf8').trim();
  
  // Get secret key from environment (same as JWT_SECRET used in generation)
  const secretKey = process.env.LICENSE_SECRET_KEY;
  
  if (!secretKey) {
    console.error('ERROR: LICENSE_SECRET_KEY environment variable not set');
    process.exit(1);
  }
  
  // Validate the license
  const result = validateLicense(licenseKey, secretKey);
  
  if (result.valid) {
    console.log('✅ License is valid!');
    console.log(`   Customer ID: ${result.customer_id}`);
    console.log(`   Expires: ${new Date(result.expires_at).toLocaleDateString()}`);
    console.log(`   Days remaining: ${result.days_remaining}`);
    console.log(`   Features: ${result.features.join(', ') || 'None'}`);
    return true;
  } else {
    console.error(`❌ License validation failed: ${result.error}`);
    return false;
  }
}

// Example 2: Validate and enforce license in application startup
function startApplication() {
  console.log('Starting application...');
  
  // Check license before starting
  if (!checkLicense()) {
    console.error('Application cannot start without a valid license.');
    process.exit(1);
  }
  
  console.log('Application started successfully!');
  // Your application code here...
}

// Example 3: Periodic license check (heartbeat)
function setupLicenseHeartbeat(intervalMinutes = 60) {
  const secretKey = process.env.LICENSE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('WARNING: Cannot set up license heartbeat - secret key not configured');
    return;
  }
  
  setInterval(() => {
    const licenseKey = process.env.LICENSE_KEY;
    if (!licenseKey) return;
    
    const result = validateLicense(licenseKey, secretKey);
    
    if (!result.valid) {
      console.error('License validation failed during heartbeat:', result.error);
      // Optionally: shutdown application, notify user, etc.
      // process.exit(1);
    } else {
      console.log(`License heartbeat OK - ${result.days_remaining} days remaining`);
    }
  }, intervalMinutes * 60 * 1000);
}

// Example 4: Feature gating based on license
function checkFeature(featureName) {
  const licenseKey = process.env.LICENSE_KEY;
  const secretKey = process.env.LICENSE_SECRET_KEY;
  
  if (!licenseKey || !secretKey) {
    return false;
  }
  
  const result = validateLicense(licenseKey, secretKey);
  
  if (!result.valid) {
    return false;
  }
  
  // Check if feature is enabled in license
  return result.features.includes(featureName);
}

// Example usage
if (require.main === module) {
  // Run license check
  checkLicense();
  
  // Start application if license is valid
  // startApplication();
  
  // Setup periodic checks
  // setupLicenseHeartbeat(60);
  
  // Check for specific feature
  // if (checkFeature('premium-feature')) {
  //   console.log('Premium feature is enabled!');
  // } else {
  //   console.log('Premium feature is not available in this license.');
  // }
}

module.exports = {
  checkLicense,
  startApplication,
  setupLicenseHeartbeat,
  checkFeature,
};


