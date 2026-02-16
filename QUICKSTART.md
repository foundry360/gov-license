# Quick Start Guide

Get your license management system up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Vercel account (free tier works)
- Git (optional, for version control)

## Step-by-Step Setup

### 1. Install Dependencies (2 minutes)

```bash
cd C:\LicensePortal
npm install
```

### 2. Set Up Supabase (3 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in project details (name, database password)
   - Wait for project to be created (~2 minutes)

2. **Run Database Schema**
   - In Supabase dashboard, go to **SQL Editor**
   - Click "New Query"
   - Copy and paste contents of `database/schema.sql`
   - Click "Run" (or press Ctrl+Enter)
   - You should see "Success. No rows returned"

3. **Get API Credentials**
   - Go to **Settings** → **API**
   - Copy the **Project URL** (you'll need this)
   - Copy the **service_role** key (click "Reveal") - **Keep this secret!**

### 3. Generate JWT Secret (1 minute)

Open a terminal and run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - this is your `JWT_SECRET`. Save it securely!

### 4. Deploy to Vercel (5 minutes)

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link and deploy
vercel

# Set environment variables
vercel env add SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste your service role key when prompted

vercel env add JWT_SECRET
# Paste your generated JWT secret when prompted

# Deploy to production
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. **Connect Repository** (if using Git)
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your Git repository
   - Or drag and drop the project folder

2. **Set Environment Variables**
   - Go to **Settings** → **Environment Variables**
   - Add these three variables:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
     - `JWT_SECRET`: Your generated JWT secret
   - Make sure to enable them for **Production**, **Preview**, and **Development**

3. **Deploy**
   - Vercel will automatically deploy
   - Or click "Deploy" if needed

### 5. Test Your Deployment

1. Visit your Vercel deployment URL (shown after deployment)
2. You should see the license management form
3. Fill in the form:
   - Customer ID: `TEST-001`
   - Expiration Date: Pick a future date
   - Features: `["feature1", "feature2"]` (optional)
4. Click "Generate License Key"
5. You should see a license key generated!

### 6. Test License Validation

Create a test file `test-validation.js`:

```javascript
const { validateLicense } = require('./validation/validate-license');

// Use the license key you just generated
const licenseKey = 'paste-your-license-key-here';
const secretKey = process.env.JWT_SECRET || 'your-jwt-secret-here';

const result = validateLicense(licenseKey, secretKey);
console.log(result);
```

Run it:
```bash
JWT_SECRET=your-secret node test-validation.js
```

You should see `{ valid: true, ... }` if everything works!

## Troubleshooting

### "Missing required environment variables"
- Make sure all 3 environment variables are set in Vercel
- Redeploy after adding variables: `vercel --prod`

### "Failed to store license in database"
- Check Supabase URL and service role key are correct
- Verify the database schema was run successfully
- Check Supabase project is not paused

### License validation fails
- Ensure `JWT_SECRET` matches between generation and validation
- Check the license key wasn't corrupted (no extra spaces/newlines)

### Can't access the web interface
- Check Vercel deployment status
- Verify the `public/index.html` file exists
- Check browser console for errors

## Next Steps

- Read `README.md` for detailed documentation
- Read `ENV_SETUP.md` for environment variable details
- Check `validation/example-usage.js` for integration examples
- Customize the UI in `public/index.html`
- Add authentication to the web interface for production use

## Support

If you encounter issues:
1. Check the error message carefully
2. Verify all environment variables are set correctly
3. Check Supabase and Vercel dashboards for service status
4. Review the logs in Vercel dashboard for API errors

## Production Checklist

Before using in production:

- [ ] Change JWT_SECRET to a production secret
- [ ] Set up proper RLS policies in Supabase
- [ ] Add authentication to the web interface
- [ ] Implement rate limiting on the API endpoint
- [ ] Set up monitoring/alerting
- [ ] Backup your JWT_SECRET securely
- [ ] Test license validation in your actual application
- [ ] Set up proper error logging

---

**That's it!** Your license management system should now be running. 🎉

