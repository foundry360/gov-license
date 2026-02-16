# License Management System

A lightweight license management system built with Supabase (PostgreSQL), Vercel serverless functions, and a simple web UI.

## Features

- ✅ License generation with JWT signing
- ✅ Database storage in Supabase
- ✅ One-page web interface
- ✅ License validation for client applications
- ✅ Free-tier compatible services

## Architecture

- **Database**: Supabase (PostgreSQL)
- **Backend**: Vercel serverless functions (Node.js)
- **Frontend**: Static HTML/JS hosted on Vercel
- **License Format**: JWT (JSON Web Token)

## Setup Instructions

### 1. Supabase Setup

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the SQL from `database/schema.sql`
4. Go to Settings → API and copy:
   - Project URL (SUPABASE_URL)
   - Service Role Key (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret!**

### 2. Generate JWT Secret Key

Generate a secure random secret key for signing licenses:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

Save this key securely - you'll need it for both the serverless function and client validation.

### 3. Vercel Setup

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   vercel link
   ```

4. Set environment variables in Vercel:
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add JWT_SECRET
   # Or use LICENSE_SECRET_KEY as an alias
   vercel env add LICENSE_SECRET_KEY
   ```

   Or set them in the Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Add:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
     - `JWT_SECRET` or `LICENSE_SECRET_KEY`: Your generated JWT secret key

5. Deploy:
   ```bash
   vercel --prod
   ```

### 4. Install Dependencies

```bash
npm install
```

## Environment Variables

Required environment variables (set in Vercel):

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret!) | `eyJhbGci...` |
| `JWT_SECRET` or `LICENSE_SECRET_KEY` | Secret key for signing JWT licenses | `your-random-hex-string` |

## Usage

### Web Interface

1. Deploy to Vercel
2. Visit your Vercel deployment URL
3. Fill in the form:
   - Customer ID
   - Expiration Date
   - Features (optional JSON array)
4. Click "Generate License Key"
5. Copy or download the generated license key

### License Validation (Client Side)

#### Node.js

```javascript
const { validateLicense } = require('./validation/validate-license');

const licenseKey = 'your-license-key-here';
const secretKey = process.env.LICENSE_SECRET_KEY;

const result = validateLicense(licenseKey, secretKey);
if (result.valid) {
  console.log('License valid!');
  console.log('Customer:', result.customer_id);
  console.log('Features:', result.features);
  console.log('Days remaining:', result.days_remaining);
} else {
  console.error('License invalid:', result.error);
}
```

#### Python

```python
from validate_license import validate_license
import os

license_key = 'your-license-key-here'
secret_key = os.getenv('LICENSE_SECRET_KEY')

result = validate_license(license_key, secret_key)
if result['valid']:
    print('License valid!')
    print('Customer:', result['customer_id'])
    print('Features:', result['features'])
    print('Days remaining:', result['days_remaining'])
else:
    print('License invalid:', result['error'])
```

## API Endpoint

### POST /api/generate-license

Generates a new license key.

**Request Body:**
```json
{
  "customer_id": "CUST-001",
  "expires_at": "2024-12-31",
  "features": ["feature1", "feature2"]
}
```

**Response:**
```json
{
  "success": true,
  "license_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "license_id": "uuid-here",
  "customer_id": "CUST-001",
  "expires_at": "2024-12-31T00:00:00.000Z",
  "features": ["feature1", "feature2"]
}
```

## Database Schema

The `licenses` table stores:
- `license_id`: UUID primary key
- `customer_id`: Customer identifier
- `issued_at`: When license was issued
- `expires_at`: Expiration timestamp
- `features`: JSON array of enabled features
- `status`: active, expired, revoked, suspended
- `signature_hash`: SHA256 hash of license data
- `last_heartbeat`: Last validation timestamp

## Security Notes

1. **Never expose** `SUPABASE_SERVICE_ROLE_KEY` or `JWT_SECRET` in client-side code
2. Keep the JWT secret key secure and consistent across deployments
3. Consider implementing rate limiting on the license generation endpoint
4. Use Row Level Security (RLS) policies in Supabase for production
5. Consider adding authentication to the web interface for production use

## License Format

Licenses are JWT tokens with the following payload:
```json
{
  "customer_id": "CUST-001",
  "expires_at": "2024-12-31T00:00:00.000Z",
  "features": ["feature1", "feature2"],
  "issued_at": "2024-01-01T00:00:00.000Z",
  "iat": 1704067200,
  "exp": 1735689600
}
```

## Troubleshooting

### "Missing required environment variables"
- Ensure all environment variables are set in Vercel
- Redeploy after adding environment variables

### "Invalid license key signature"
- Ensure the `JWT_SECRET` used for validation matches the one used for generation
- Check that the license key hasn't been corrupted

### Database connection errors
- Verify Supabase URL and service role key are correct
- Check Supabase project is active and not paused

## License

MIT

