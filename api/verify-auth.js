// Verify authentication token
// GET /api/verify-auth

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.LICENSE_SECRET_KEY;

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
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
        authenticated: false,
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!JWT_SECRET) {
      return res.status(500).json({
        error: 'Server configuration error',
        authenticated: false,
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.status(200).json({
        authenticated: true,
        username: decoded.username,
        role: decoded.role,
      });
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          authenticated: false,
        });
      } else {
        return res.status(401).json({
          error: 'Invalid token',
          authenticated: false,
        });
      }
    }
  } catch (error) {
    console.error('Error verifying auth:', error);
    return res.status(500).json({
      error: 'Internal server error',
      authenticated: false,
    });
  }
};

