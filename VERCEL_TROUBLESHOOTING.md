# Vercel Deployment Troubleshooting

## Common Issues and Solutions

### Issue: Internal Server Error

#### 1. **Check Environment Variables**
The most common cause is missing environment variables.

**Verify in Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Ensure these are set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET` (or `LICENSE_SECRET_KEY`)
   - `SUPABASE_ANON_KEY` (if using Supabase Auth)

3. **Important:** After adding/updating variables, **redeploy** your project

#### 2. **Check Vercel.json Configuration**
The current `vercel.json` uses the old format. Update it:

**Current (may cause issues):**
```json
{
  "version": 2,
  "builds": [...]
}
```

**Should be (simpler, modern format):**
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

#### 3. **Check Function Logs**
1. Go to Vercel Dashboard → **Deployments**
2. Click on the failed deployment
3. Click **Functions** tab
4. Check the logs for specific error messages

#### 4. **Common Error Messages**

**"Missing required environment variables"**
- Solution: Add all required env vars in Vercel dashboard
- Redeploy after adding

**"Cannot find module '@supabase/supabase-js'"**
- Solution: Ensure `package.json` has dependencies
- Vercel should auto-install, but check build logs

**"JWT_SECRET not configured"**
- Solution: Add `JWT_SECRET` or `LICENSE_SECRET_KEY` env var

**"Supabase credentials not configured"**
- Solution: Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

#### 5. **Test Individual API Endpoints**

Test each endpoint to find which one is failing:

```bash
# Test login
curl -X POST https://your-app.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Test generate license (requires auth token)
curl -X POST https://your-app.vercel.app/api/generate-license \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"customer_id":"TEST","expires_at":"2024-12-31"}'
```

#### 6. **Check Function Timeout**
Vercel free tier has 10-second timeout for serverless functions.

If your functions are slow:
- Check Supabase connection
- Optimize database queries
- Consider upgrading to Pro plan (60-second timeout)

#### 7. **Verify API Function Format**
Each API file should export a default async function:

```javascript
module.exports = async (req, res) => {
  // Your code here
}
```

## Quick Fix Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] Redeployed after adding env vars
- [ ] Checked function logs for specific errors
- [ ] Verified `package.json` has all dependencies
- [ ] Tested individual API endpoints
- [ ] Checked `vercel.json` configuration

## Next Steps

1. Check Vercel function logs for the specific error
2. Verify environment variables are set
3. Test each API endpoint individually
4. Share the specific error message from logs for more targeted help


