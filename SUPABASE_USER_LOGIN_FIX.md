# Fixing Supabase User Login Issues

## Common Issues When Supabase User Login Doesn't Work

### 1. **Email Not Confirmed** (Most Common)

Supabase requires email confirmation by default. If you created a user but didn't confirm the email:

**Solution:**
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find your user
3. Click on the user
4. Check if "Email Confirmed" is checked
5. If not, click **"Confirm Email"** button

**Or disable email confirmation:**
1. Go to **Authentication** → **Settings** → **Auth Providers** → **Email**
2. Uncheck **"Confirm email"** (for development/testing only)

### 2. **SUPABASE_ANON_KEY Not Set in Vercel**

The login endpoint needs `SUPABASE_ANON_KEY` to authenticate Supabase users.

**Check:**
1. Vercel Dashboard → Settings → Environment Variables
2. Verify `SUPABASE_ANON_KEY` is set
3. **Important:** Redeploy after adding

**Get the Anon Key:**
1. Supabase Dashboard → **Settings** → **API**
2. Copy the **`anon` `public`** key (NOT service_role)
3. Add to Vercel as `SUPABASE_ANON_KEY`

### 3. **Wrong Email or Password**

**Check:**
- Email must match exactly (case-sensitive for some providers)
- Password must be correct
- No extra spaces

**Test:**
- Try logging in via Supabase Dashboard → Authentication → Users → Click user → "Send magic link" to verify email works

### 4. **User Doesn't Exist in Supabase Auth**

The user must be created in **Supabase Authentication**, not just the database.

**Verify:**
1. Supabase Dashboard → **Authentication** → **Users**
2. Check if your user email appears in the list
3. If not, create the user:
   - Go to **Authentication** → **Users** → **Add User**
   - Enter email and password
   - **Important:** Set a password (not just email)

### 5. **Email Format Issues**

The login code tries to detect if username is an email, but it's better to use the email field.

**Best Practice:**
- Use the email field in the login form
- Or ensure username contains `@` if it's an email

## Quick Fix Checklist

- [ ] User exists in Supabase Authentication (not just database)
- [ ] User email is confirmed in Supabase
- [ ] `SUPABASE_ANON_KEY` is set in Vercel environment variables
- [ ] Redeployed after adding `SUPABASE_ANON_KEY`
- [ ] Email and password are correct
- [ ] Using email field (or username with @) in login form

## Testing Steps

1. **Test Admin Login** (should work):
   - Username: `admin`
   - Password: `admin123`

2. **Test Supabase User Login**:
   - Email: Your Supabase user email
   - Password: Your Supabase user password

3. **Check Vercel Logs**:
   - Look for: "✅ Supabase auth successful" or "❌ Supabase auth failed"
   - Check error messages in logs

## Debugging

The login endpoint now provides specific error messages:
- "Email not confirmed" → Confirm email in Supabase
- "Invalid email or password" → Check credentials
- Other errors → Check Vercel logs for details

## If Still Not Working

1. Check Vercel function logs for the exact error
2. Verify user exists in Supabase Authentication (not just database)
3. Confirm email is confirmed in Supabase
4. Test with a new user created directly in Supabase Dashboard


