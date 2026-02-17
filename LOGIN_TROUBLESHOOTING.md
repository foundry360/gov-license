# Login Error Troubleshooting for Vercel

## Common Login Errors on Vercel

### 1. **"Internal Server Error" on Login**

#### Most Likely Causes:

**A. Missing JWT_SECRET**
- **Error**: "Server configuration error: JWT_SECRET not set"
- **Fix**: Add `JWT_SECRET` environment variable in Vercel
- **Location**: Vercel Dashboard → Settings → Environment Variables

**B. Missing SUPABASE_ANON_KEY (if using Supabase Auth)**
- **Error**: Login fails for Supabase users
- **Fix**: Add `SUPABASE_ANON_KEY` environment variable
- **Note**: Simple auth (admin/admin123) should still work without this

**C. Request Body Not Parsed**
- **Error**: "Username/email and password are required"
- **Fix**: Ensure Content-Type header is set to `application/json`

### 2. **Quick Fix Checklist**

- [ ] `JWT_SECRET` is set in Vercel environment variables
- [ ] `SUPABASE_URL` is set (if using Supabase Auth)
- [ ] `SUPABASE_ANON_KEY` is set (if using Supabase Auth)
- [ ] Redeployed after adding environment variables
- [ ] Checked Vercel function logs for specific error

### 3. **Test Login Endpoint**

Test the login endpoint directly:

```bash
# Test with admin credentials
curl -X POST https://your-app.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "message": "Login successful",
  "user": "admin"
}
```

**If you get an error**, check:
- The error message in the response
- Vercel function logs (Dashboard → Deployments → Functions tab)

### 4. **Check Vercel Function Logs**

1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **Functions** tab
6. Click on `/api/login`
7. Check the **Logs** section for error messages

### 5. **Common Error Messages**

**"JWT_SECRET not set"**
- **Solution**: Add `JWT_SECRET` in Vercel environment variables
- **Value**: Your JWT secret key (same as LICENSE_SECRET_KEY)

**"Invalid username/email or password"**
- **Solution**: 
  - For admin: Use `admin` / `admin123`
  - For Supabase users: Ensure `SUPABASE_ANON_KEY` is set
  - Check credentials are correct

**"Method not allowed"**
- **Solution**: Ensure you're using POST request, not GET

**"CORS error"**
- **Solution**: CORS headers are set in the function, but check browser console for specific CORS errors

### 6. **Minimal Working Configuration**

For login to work, you need at minimum:

```env
JWT_SECRET=your-secret-key-here
```

This allows the simple admin login to work:
- Username: `admin`
- Password: `admin123`

### 7. **Debug Steps**

1. **Check Environment Variables**
   ```bash
   # In Vercel Dashboard → Settings → Environment Variables
   # Verify these exist:
   - JWT_SECRET ✅
   - SUPABASE_URL (optional)
   - SUPABASE_ANON_KEY (optional)
   ```

2. **Test with curl**
   ```bash
   curl -X POST https://your-app.vercel.app/api/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

3. **Check Function Logs**
   - Look for console.log messages
   - Check for error stack traces
   - Verify environment variables are loaded

4. **Verify API Route**
   - Ensure `/api/login.js` exists
   - Check `vercel.json` routing configuration

### 8. **If Still Not Working**

Share the specific error message from:
1. Browser console (F12 → Console)
2. Vercel function logs
3. Network tab (check the response from `/api/login`)

This will help identify the exact issue.


