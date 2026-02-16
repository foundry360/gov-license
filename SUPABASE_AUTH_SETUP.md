# Setting Up Supabase Auth for Login

## Why Admin Works But Supabase User Doesn't

The system has two authentication methods:
1. **Simple Auth** (admin/admin123) - Works immediately
2. **Supabase Auth** - Requires the anon key to be configured

## How to Enable Supabase Auth

### Step 1: Get Your Supabase Anon Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/utfpfrqnqcqibnnayize
2. Navigate to **Settings** → **API**
3. Find the **Project API keys** section
4. Copy the **`anon` `public`** key (NOT the service_role key)
   - It looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - It's labeled as "anon" and "public"

### Step 2: Add to .env.local

Add this line to your `.env.local` file:

```env
SUPABASE_ANON_KEY=your-anon-key-here
```

Your complete `.env.local` should look like:

```env
SUPABASE_URL=https://utfpfrqnqcqibnnayize.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=your-jwt-secret
LICENSE_SECRET_KEY=your-jwt-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Step 3: Restart Server

After adding the anon key, restart your server:

```bash
# Stop server (Ctrl+C)
npm run dev
```

## How It Works

1. **If SUPABASE_ANON_KEY is set**: System tries Supabase Auth first
   - Uses the email/password you created in Supabase
   - If that fails, falls back to simple auth

2. **If SUPABASE_ANON_KEY is NOT set**: Only simple auth works
   - Only admin/admin123 will work

## Testing

After adding the anon key and restarting:

1. Try logging in with your Supabase user email and password
2. Check server console for logs:
   - `✅ Supabase auth successful` = Working!
   - `❌ Supabase auth failed` = Check email/password
   - `⚠️ Supabase Auth not configured` = Anon key missing

## Troubleshooting

### "Supabase auth failed" error
- Verify the email matches exactly what you used in Supabase
- Check the password is correct
- Make sure the user exists in Supabase Auth (not just the database)

### Still using simple auth
- Check `.env.local` has `SUPABASE_ANON_KEY` set
- Restart the server after adding it
- Check server logs on startup for "Supabase Auth not configured" message

### User created in database but not in Auth
- Supabase Auth users are separate from database users
- Create the user in **Authentication** → **Users** in Supabase dashboard
- Or use the Supabase Auth signup flow

