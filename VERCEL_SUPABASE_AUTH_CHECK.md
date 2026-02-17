# Checking Supabase Auth in Vercel

## Quick Diagnosis Steps

### 1. **Check if SUPABASE_ANON_KEY is Set in Vercel**

This is the #1 reason Supabase user login fails on Vercel but works locally.

**Steps:**
1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Environment Variables**
3. Look for `SUPABASE_ANON_KEY`
4. **If it's missing**, add it:
   - Key: `SUPABASE_ANON_KEY`
   - Value: Your anon key from Supabase (Settings → API → anon public key)
   - Environment: Select all (Production, Preview, Development)
   - Click **Save**
5. **Redeploy** after adding

### 2. **Check Vercel Function Logs**

After deploying, check the logs when you try to login:

1. Vercel Dashboard → **Deployments** → Latest deployment
2. Click **Functions** tab
3. Click `/api/login`
4. Try logging in with your Supabase user
5. Check the **Logs** section

**Look for these messages:**
- `⚠️ Supabase Auth not configured (missing SUPABASE_ANON_KEY)` = Anon key not set
- `⚠️ Supabase Auth NOT initialized` = Missing SUPABASE_URL or SUPABASE_ANON_KEY
- `❌ Supabase auth failed` = Check the error message
- `✅ Supabase auth successful` = Working!

### 3. **Verify Your User in Supabase**

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find your user email
3. Verify:
   - User exists
   - Email is confirmed (should be auto-confirmed)
   - Has a password set

### 4. **Test Credentials**

Make sure you're using:
- **Exact email** (case-sensitive)
- **Correct password**
- No extra spaces

### 5. **Check the Login Form**

The login form should send:
- `email` field if username contains `@`
- `username` field if no `@`

**In browser console (F12), check:**
- What data is being sent to `/api/login`
- What error response you get back

## Most Common Issue

**SUPABASE_ANON_KEY not set in Vercel**

Even if it works locally (because it's in `.env.local`), Vercel needs it in their environment variables.

## Quick Fix

1. Get your anon key from Supabase Dashboard → Settings → API
2. Add to Vercel: Settings → Environment Variables → Add `SUPABASE_ANON_KEY`
3. Redeploy
4. Try login again
5. Check logs for "✅ Supabase auth successful"


