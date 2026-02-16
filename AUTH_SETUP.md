# Authentication Setup

## Default Credentials

The login system uses the following default credentials:

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change these credentials in production!

## How to Change Credentials

### For Local Development

Edit `.env.local` and add:
```env
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=your-secure-password
```

### For Vercel Deployment

Add these environment variables in Vercel dashboard:
- `ADMIN_USERNAME`: Your admin username
- `ADMIN_PASSWORD`: Your secure password

## How Authentication Works

1. **Login**: User enters credentials → Server validates → Returns JWT token
2. **Token Storage**: Token stored in browser's `localStorage`
3. **Protected Routes**: All API calls include token in `Authorization` header
4. **Token Expiry**: Tokens expire after 24 hours
5. **Auto-redirect**: Unauthenticated users are redirected to `/login.html`

## API Endpoints

### POST /api/login
Login endpoint that validates credentials and returns JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

### GET /api/verify-auth
Verifies if the provided token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "authenticated": true,
  "username": "admin",
  "role": "admin"
}
```

## Security Notes

1. **Change Default Credentials**: Never use default credentials in production
2. **Strong Passwords**: Use strong, unique passwords
3. **HTTPS**: Always use HTTPS in production
4. **Token Security**: Tokens are stored in localStorage (consider httpOnly cookies for enhanced security)
5. **Environment Variables**: Keep credentials in environment variables, never in code

## Logout

Users can logout by clicking the "Logout" button, which clears the token and redirects to login page.

