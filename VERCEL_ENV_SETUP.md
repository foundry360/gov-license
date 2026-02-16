# Setting Environment Variables in Vercel

## Quick Setup for Your Project

You need to add these 3 environment variables to your Vercel project:

### Required Variables

1. **SUPABASE_URL**
   - Value: `https://utfpfrqnqcqibnnayize.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZnBmcnFucWNxaWJubmF5aXplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI1MTc1NSwiZXhwIjoyMDg2ODI3NzU1fQ.41mvebtrHWGdstDW9ugpjSv1i_YtnnhSX6aQCnD8j1Q`

3. **JWT_SECRET** (or LICENSE_SECRET_KEY)
   - Value: `19f523efb6699b0fd87f50f9fc860682088efbffe83383db4792ebc9d9bdf7e4`

## How to Add Them

### Method 1: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and log in
2. Select your project: **gov-license** (or whatever you named it)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New** for each variable:
   - **Key**: `SUPABASE_URL`
   - **Value**: `https://utfpfrqnqcqibnnayize.supabase.co`
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**
   
   Repeat for:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`

5. **Important**: After adding variables, redeploy your project:
   - Go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Click **Redeploy**

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login
vercel login

# Add environment variables
vercel env add SUPABASE_URL
# Paste: https://utfpfrqnqcqibnnayize.supabase.co
# Select: Production, Preview, Development

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZnBmcnFucWNxaWJubmF5aXplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI1MTc1NSwiZXhwIjoyMDg2ODI3NzU1fQ.41mvebtrHWGdstDW9ugpjSv1i_YtnnhSX6aQCnD8j1Q
# Select: Production, Preview, Development

vercel env add JWT_SECRET
# Paste: 19f523efb6699b0fd87f50f9fc860682088efbffe83383db4792ebc9d9bdf7e4
# Select: Production, Preview, Development

# Redeploy
vercel --prod
```

## When Do You Need This?

- ✅ **For Vercel deployments** (production/preview): YES, you need to add them
- ✅ **For local development**: NO, `.env.local` is sufficient
- ✅ **After adding variables**: Always redeploy for changes to take effect

## Verification

After deployment, test your API:
```bash
curl -X POST https://your-app.vercel.app/api/generate-license \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "TEST-001",
    "expires_at": "2024-12-31",
    "features": ["test"]
  }'
```

If you get errors about missing environment variables, double-check they're set correctly in Vercel.

