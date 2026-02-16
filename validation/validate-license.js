/**
 * License Validation Module
 * Use this in your deployed VPC software to validate license keys
 * 
 * Installation:
 *   npm install jsonwebtoken
 * 
 * Usage:
 *   const { validateLicense } = require('./validate-license');
 *   const result = validateLicense(licenseKey, publicKey);
 *   if (result.valid) {
 *     console.log('License is valid!');
 *     console.log('Customer:', result.customer_id);
 *     console.log('Features:', result.features);
 *   } else {
 *     console.error('License invalid:', result.error);
 *   }
 */

const jwt = require('jsonwebtoken');

/**
 * Validates a license key
 * @param {string} licenseKey - The JWT license key to validate
 * @param {string} secretKey - The secret key used to sign the license (same as JWT_SECRET)
 * @returns {Object} Validation result with valid flag, data, and error message
 */
function validateLicense(licenseKey, secretKey) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return {
      valid: false,
      error: 'License key is required and must be a string',
    };
  }

  if (!secretKey || typeof secretKey !== 'string') {
    return {
      valid: false,
      error: 'Secret key is required for validation',
    };
  }

  try {
    // Verify and decode the JWT token
    const decoded = jwt.verify(licenseKey, secretKey);

    // Check if required fields exist
    if (!decoded.customer_id || !decoded.expires_at) {
      return {
        valid: false,
        error: 'License key is missing required fields',
      };
    }

    // Check expiration (JWT already checks this, but double-check for safety)
    const expiresAt = new Date(decoded.expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      return {
        valid: false,
        error: 'License has expired',
        customer_id: decoded.customer_id,
        expires_at: decoded.expires_at,
        features: decoded.features || [],
      };
    }

    // License is valid
    return {
      valid: true,
      customer_id: decoded.customer_id,
      expires_at: decoded.expires_at,
      issued_at: decoded.issued_at,
      features: decoded.features || [],
      days_remaining: Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)),
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        valid: false,
        error: 'License has expired',
      };
    } else if (error.name === 'JsonWebTokenError') {
      return {
        valid: false,
        error: 'Invalid license key signature',
      };
    } else {
      return {
        valid: false,
        error: `License validation error: ${error.message}`,
      };
    }
  }
}

/**
 * Validates a license key from a file
 * @param {string} filePath - Path to the license file
 * @param {string} secretKey - The secret key used to sign the license
 * @returns {Object} Validation result
 */
function validateLicenseFromFile(filePath, secretKey) {
  const fs = require('fs');
  
  try {
    const licenseKey = fs.readFileSync(filePath, 'utf8').trim();
    return validateLicense(licenseKey, secretKey);
  } catch (error) {
    return {
      valid: false,
      error: `Failed to read license file: ${error.message}`,
    };
  }
}

// Example usage (commented out)
/*
// Example 1: Validate from string
const licenseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const secretKey = process.env.LICENSE_SECRET_KEY;

const result = validateLicense(licenseKey, secretKey);
if (result.valid) {
  console.log('✅ License is valid!');
  console.log('Customer ID:', result.customer_id);
  console.log('Features:', result.features);
  console.log('Days remaining:', result.days_remaining);
} else {
  console.error('❌ License invalid:', result.error);
}

// Example 2: Validate from file
const fileResult = validateLicenseFromFile('./license.txt', secretKey);
if (fileResult.valid) {
  console.log('License loaded and validated successfully');
} else {
  console.error('License validation failed:', fileResult.error);
}
*/

module.exports = {
  validateLicense,
  validateLicenseFromFile,
};

