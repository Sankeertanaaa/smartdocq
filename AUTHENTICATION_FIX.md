# Authentication 401 Error Fix Guide

## Problem Summary

Your application is experiencing 401 authentication errors with the following symptoms:
- `/api/auth/verify` returns 401 Unauthorized
- `/api/upload` returns 401 Unauthorized
- `manifest.json` shows 401 errors (false alarm - now fixed)

## Root Cause

The main issue is **SECRET_KEY mismatch** between:
1. The SECRET_KEY used to **create** the JWT token (during login)
2. The SECRET_KEY used to **verify** the JWT token (during API calls)

This happens when:
- Backend restarts with a different SECRET_KEY
- Production deployment uses a different SECRET_KEY than development
- Environment variables aren't properly configured

## What I Fixed

### 1. Frontend Fixes (✅ Completed)

#### `frontend/src/services/api.js`
- **Fixed manifest.json 401 errors**: Added logic to skip adding Authorization headers to static files
- **Improved error handling**: Added better handling for static file errors in response interceptor

#### `frontend/src/context/AuthContext.js`
- **Better token validation**: Now properly clears invalid tokens on 401 errors
- **Improved logging**: Added console logs to track token verification flow
- **Auto-cleanup**: Removes orphaned user data when token is missing

### 2. Backend Fixes (✅ Completed)

#### `backend/app/api/routes/auth.py`
- **Enhanced debugging**: Added unverified token payload logging to diagnose SECRET_KEY mismatches
- **Better error messages**: More descriptive error messages for token validation failures

## How to Fix the SECRET_KEY Issue

### Option 1: Set SECRET_KEY in Environment Variables (Recommended for Production)

**For Render.com deployment:**
1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add/Update environment variable:
   ```
   SECRET_KEY=your-super-secret-key-here-at-least-32-chars
   ```
5. Save and redeploy

**For local development:**
Create/update `backend/.env` file:
```env
SECRET_KEY=your-super-secret-key-here-at-least-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
MONGODB_URL=your-mongodb-url
```

### Option 2: Use Consistent Default (For Development Only)

The current default in `backend/app/core/config.py` is:
```python
SECRET_KEY: str = Field(default="S@nk33rTaN@", env="SECRET_KEY")
```

**⚠️ WARNING**: This default is only for development. Always use environment variables in production!

## How to Test the Fix

### 1. Clear Old Tokens
Open browser console and run:
```javascript
localStorage.clear();
```
Then refresh the page.

### 2. Login Again
1. Go to `/login`
2. Login with your credentials
3. The app will create a new token with the current SECRET_KEY

### 3. Verify Token Works
Check browser console for:
```
✅ Token verified successfully: {user data}
```

### 4. Test Upload
Try uploading a document - should work without 401 errors.

## Debugging Steps

### Check Backend Logs

Look for these log messages:

**On Login:**
```
🔑 Creating token with SECRET_KEY: S@nk33rTaN...
✅ Token created: eyJhbGciOiJIUzI1NiIs...
```

**On Token Verification:**
```
🔐 Verifying token with SECRET_KEY: S@nk33rTaN... (len: 12)
🔐 Token starts with: eyJhbGciOiJIUzI1NiIs...
🔍 Unverified token payload: {'sub': '...', 'role': '...', 'exp': ...}
✅ Token decoded successfully, user_id: ...
```

**If SECRET_KEY mismatch:**
```
❌ Invalid token (wrong SECRET_KEY?): Signature verification failed
```

### Check Frontend Console

Look for these messages:

**On App Load:**
```
Verifying stored token...
Token verified successfully: {user data}
```

**If token invalid:**
```
Token verification failed: 401
Clearing invalid token and user data
```

## Common Issues and Solutions

### Issue: "Invalid token" error after backend restart
**Solution**: Clear localStorage and login again
```javascript
localStorage.clear();
```

### Issue: Works locally but not in production
**Solution**: Ensure SECRET_KEY environment variable is set in production (Render.com dashboard)

### Issue: manifest.json 401 errors
**Solution**: Already fixed! The axios interceptor now skips adding auth headers to static files.

### Issue: Token expires too quickly
**Solution**: Increase `ACCESS_TOKEN_EXPIRE_MINUTES` in environment variables (default is 1440 = 24 hours)

## Security Best Practices

1. **Never commit SECRET_KEY to git**
   - Already in `.gitignore`
   - Use environment variables

2. **Use strong SECRET_KEY**
   - At least 32 characters
   - Mix of letters, numbers, symbols
   - Generate with: `openssl rand -hex 32`

3. **Different keys for different environments**
   - Development: Can use default
   - Production: Must use environment variable
   - Never reuse keys across environments

4. **Rotate keys periodically**
   - Change SECRET_KEY every few months
   - All users will need to login again

## Next Steps

1. ✅ Frontend fixes applied
2. ✅ Backend debugging improved
3. ⏳ **YOU NEED TO**: Set SECRET_KEY in Render.com environment variables
4. ⏳ **YOU NEED TO**: Clear browser localStorage and login again
5. ⏳ Test the application

## Questions?

If you still see 401 errors after following these steps:
1. Check backend logs for SECRET_KEY value
2. Check if token was created with same SECRET_KEY
3. Verify environment variables are loaded correctly
4. Clear browser cache and localStorage completely
