# Environment Variables Setup Guide

This document provides detailed instructions for setting up environment variables for the License Management System.

## Required Environment Variables

### 1. SUPABASE_URL

**Description**: Your Supabase project URL

**How to get it**:
1. Go to [supabase.com](https://supabase.com) and log in
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)

**Example**: `https://abcdefghijklmnop.supabase.co`

---

### 2. SUPABASE_SERVICE_ROLE_KEY

**Description**: Supabase service role key with full database access

**⚠️ WARNING**: This key has full access to your database. Never expose it in client-side code or commit it to version control.

**How to get it**:
1. In your Supabase project, go to **Settings** → **API**
2. Under **Project API keys**, find the **service_role** key
3. Click **Reveal** and copy the key (starts with `eyJhbGci...`)

**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyfQ...`

---

### 3. JWT_SECRET (or LICENSE_SECRET_KEY)

**Description**: Secret key used to sign and verify JWT license tokens

**⚠️ IMPORTANT**: 
- This must be the same key used for both generation (server) and validation (client)
- Use a strong, random secret (at least 32 characters)
- Keep it secure and consistent across deployments

**How to generate it**:

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Using Python**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**Example output**: `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`

**Note**: You can use either `JWT_SECRET` or `LICENSE_SECRET_KEY` as the variable name. The code checks for both.

---

## Setting Environment Variables in Vercel

### Method 1: Using Vercel CLI

```bash
# Set each variable
vercel env add SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste your service role key when prompted

vercel env add JWT_SECRET
# Paste your generated JWT secret when prompted

# For production environment specifically
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add JWT_SECRET production
```

### Method 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and log in
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. For each variable:
   - **Key**: Enter the variable name (e.g., `SUPABASE_URL`)
   - **Value**: Paste the value
   - **Environment**: Select which environments (Production, Preview, Development)
   - Click **Save**

### Method 3: Using .env.local (for local development)

Create a `.env.local` file in the project root:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
JWT_SECRET=your-generated-secret-key-here
```

**Note**: Never commit `.env.local` to version control (it's already in `.gitignore`)

---

## Verifying Environment Variables

### Check in Vercel Dashboard

1. Go to your project → **Settings** → **Environment Variables**
2. Verify all three variables are listed
3. Ensure they're enabled for the correct environments

### Test Locally

```bash
# Start local development server
vercel dev

# The server will use .env.local if present
# Or you can set them in your shell:
export SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"
export JWT_SECRET="your-secret"
```

### Test API Endpoint

After deployment, test the API:

```bash
curl -X POST https://your-app.vercel.app/api/generate-license \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "TEST-001",
    "expires_at": "2024-12-31",
    "features": ["test"]
  }'
```

If you get an error about missing environment variables, double-check they're set correctly.

---

## Security Best Practices

1. **Never commit secrets to Git**
   - `.env.local` is already in `.gitignore`
   - Double-check before committing

2. **Use different secrets for different environments**
   - Production should have a unique JWT_SECRET
   - Development can use a test secret

3. **Rotate secrets periodically**
   - If a secret is compromised, generate a new one
   - Update both server and client validation code

4. **Limit access to service role key**
   - Only use it in serverless functions
   - Never expose it in client-side code

5. **Use Vercel's environment variable encryption**
   - Vercel automatically encrypts environment variables
   - Use the dashboard for sensitive values

---

## Troubleshooting

### "Missing required environment variables" error

- **Check**: All three variables are set in Vercel
- **Solution**: Add missing variables and redeploy

### "Invalid license key signature" error

- **Check**: JWT_SECRET matches between generation and validation
- **Solution**: Ensure the same secret is used in both places

### Database connection errors

- **Check**: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct
- **Solution**: Verify in Supabase dashboard and update if needed

### Variables not working in local development

- **Check**: `.env.local` file exists and is in the project root
- **Solution**: Create `.env.local` or use `vercel dev` which loads Vercel env vars

---

## Quick Reference

| Variable | Where to Get It | Example |
|----------|----------------|---------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key | `eyJhbGci...` |
| `JWT_SECRET` | Generate using Node.js/OpenSSL/Python | `a1b2c3d4...` (64 char hex) |


