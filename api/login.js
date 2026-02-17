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
// Initialize inside the handler to avoid module-level errors
let supabaseAuth = null;

function getSupabaseAuth() {
  if (supabaseAuth) return supabaseAuth;
  
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('✓ Supabase Auth initialized with anon key');
    } catch (error) {
      console.error('Error initializing Supabase Auth:', error);
      return null;
    }
  } else {
    console.log('⚠️ Supabase Auth NOT initialized - missing SUPABASE_URL or SUPABASE_ANON_KEY');
    if (!SUPABASE_URL) console.log('   Missing: SUPABASE_URL');
    if (!SUPABASE_ANON_KEY) console.log('   Missing: SUPABASE_ANON_KEY');
  }
  
  return supabaseAuth;
}

// Main handler
module.exports = async (req, res) => {
  console.log('=== LOGIN HANDLER CALLED ===');
  console.log('Method:', req.method);
  console.log('JWT_SECRET exists:', !!JWT_SECRET);
  console.log('SUPABASE_URL exists:', !!SUPABASE_URL);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body - Vercel may or may not auto-parse depending on setup
    let body = req.body;
    
    // If body is a string, try to parse it as JSON
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
        return res.status(400).json({
          error: 'Invalid JSON in request body',
        });
      }
    }
    
    // If body is undefined or null, return error
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        error: 'Request body is required',
      });
    }

    console.log('Login attempt received:', { hasUsername: !!body.username, hasEmail: !!body.email, hasPassword: !!body.password });
    const { username, password, email } = body;

    // Validate input
    if ((!username && !email) || !password) {
      return res.status(400).json({
        error: 'Username/email and password are required',
      });
    }

    let authenticated = false;
    let userInfo = {};

    // Try Supabase Auth first if available (requires anon key)
    const authClient = getSupabaseAuth();
    if (authClient && (email || username)) {
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
          const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
            email: loginEmail,
            password: password,
          });

          if (!authError && authData.user) {
            // Check if user email is confirmed
            if (!authData.user.email_confirmed_at && authData.user.confirmed_at) {
              console.log('⚠️ User email not confirmed');
              return res.status(401).json({
                error: 'Email not confirmed. Please check your email and confirm your account.',
              });
            }
            
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
              
              // Provide more specific error messages
              if (authError.message?.includes('Invalid login credentials')) {
                return res.status(401).json({
                  error: 'Invalid email or password',
                });
              } else if (authError.message?.includes('Email not confirmed')) {
                return res.status(401).json({
                  error: 'Email not confirmed. Please check your email and confirm your account.',
                });
              } else if (authError.message) {
                return res.status(401).json({
                  error: authError.message,
                });
              }
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
      console.log('   SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
      console.log('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set' : 'Missing');
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
    console.error('Error stack:', error.stack);
    console.error('Request method:', req.method);
    console.error('Request headers:', JSON.stringify(req.headers));
    console.error('Request body type:', typeof req.body);
    
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred during login',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }
};

