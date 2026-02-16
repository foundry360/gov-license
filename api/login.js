// Login API endpoint
// POST /api/login
// Supports both Supabase Auth and simple username/password

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Get configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; // For user auth
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || process.env.LICENSE_SECRET_KEY;

// Token expiration (24 hours)
const TOKEN_EXPIRY = '24h';

// Initialize Supabase client for user auth (needs anon key, not service role)
let supabaseAuth = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✓ Supabase Auth initialized with anon key');
} else {
  console.log('⚠️ Supabase Auth NOT initialized - missing SUPABASE_URL or SUPABASE_ANON_KEY');
  if (!SUPABASE_URL) console.log('   Missing: SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) console.log('   Missing: SUPABASE_ANON_KEY');
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
    console.log('Login attempt received:', { hasUsername: !!req.body.username, hasEmail: !!req.body.email, hasPassword: !!req.body.password });
    const { username, password, email } = req.body;

    // Validate input
    if ((!username && !email) || !password) {
      return res.status(400).json({
        error: 'Username/email and password are required',
      });
    }

    let authenticated = false;
    let userInfo = {};

    // Try Supabase Auth first if available (requires anon key)
    if (supabaseAuth && (email || username)) {
      try {
        // Determine the email - if username contains @, treat as email, otherwise try both
        let loginEmail = email;
        if (!loginEmail && username) {
          if (username.includes('@')) {
            loginEmail = username;
          } else {
            // Try username as email (in case user entered email in username field)
            loginEmail = username;
          }
        }
        
        if (loginEmail) {
          console.log('Attempting Supabase auth for:', loginEmail);
          const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
            email: loginEmail,
            password: password,
          });

          if (!authError && authData.user) {
            authenticated = true;
            userInfo = {
              username: authData.user.email || username,
              id: authData.user.id,
              role: 'admin',
            };
            console.log('✅ Supabase auth successful for:', userInfo.username);
          } else {
            console.log('❌ Supabase auth failed');
            console.log('   Error:', authError?.message || 'Unknown error');
            console.log('   Error code:', authError?.status || 'N/A');
            if (authError) {
              console.log('   Full error:', JSON.stringify(authError, null, 2));
            }
          }
        } else {
          console.log('⚠️ No email provided for Supabase auth');
        }
      } catch (supabaseError) {
        console.log('❌ Supabase auth error:', supabaseError.message);
      }
    } else {
      console.log('⚠️ Supabase Auth not configured (missing SUPABASE_ANON_KEY)');
    }

    // Fallback to simple username/password if Supabase auth fails or not configured
    if (!authenticated) {
      console.log('Trying simple auth fallback...');
      // Only try simple auth if username matches (not email)
      if (!username.includes('@') && username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        authenticated = true;
        userInfo = {
          username: username,
          role: 'admin',
        };
        console.log('✅ Simple auth successful for:', username);
      } else if (username.includes('@')) {
        console.log('❌ Email provided but Supabase auth failed, and simple auth only works with username (not email)');
      } else {
        console.log('❌ Simple auth failed - username/password mismatch');
      }
    }

    if (authenticated) {
      // Generate JWT token
      if (!JWT_SECRET) {
        return res.status(500).json({
          error: 'Server configuration error: JWT_SECRET not set',
        });
      }

      const token = jwt.sign(
        { 
          username: userInfo.username,
          userId: userInfo.id,
          role: userInfo.role,
          iat: Math.floor(Date.now() / 1000)
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      return res.status(200).json({
        success: true,
        token: token,
        message: 'Login successful',
        user: userInfo.username,
      });
    } else {
      return res.status(401).json({
        error: 'Invalid username/email or password',
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};

