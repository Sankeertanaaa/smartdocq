# User Data Privacy & Personal History

## Overview
All user data is now properly isolated. Each user can only see their own chat history, documents, and sessions.

---

## What's Been Implemented

### ✅ Personal Chat History
- **Endpoint:** `/api/history/sessions`
- **Authentication:** Required
- **Filter:** Automatically filters by authenticated user's ID
- **Result:** Each user sees only their own chat sessions

### ✅ Personal Messages
- **Endpoint:** `/api/history`
- **Authentication:** Required  
- **Filter:** Messages filtered by user_id
- **Result:** Users can only view their own messages

### ✅ Personal Documents
- **Endpoint:** `/api/documents`
- **Authentication:** Optional (returns empty if not logged in)
- **Filter:** Documents filtered by user_id in chunks
- **Admin Exception:** Admins can see all documents
- **Result:** Regular users see only documents they uploaded

### ✅ Session Access Control
- **Endpoint:** `/api/history/sessions/{user_id}`
- **Authentication:** Required
- **Authorization:** Users can only access their own sessions (unless admin)
- **Result:** 403 Forbidden if trying to access another user's sessions

### ✅ Search Privacy
- **Endpoint:** `/api/history/search`
- **Authentication:** Required
- **Filter:** Search results limited to user's own messages
- **Result:** Cannot search other users' chat history

### ✅ Delete Protection
- **Endpoint:** `/api/history/{session_id}`
- **Authentication:** Required
- **Authorization:** Can only delete own sessions (unless admin)
- **Result:** 403 Forbidden if trying to delete another user's session

---

## How It Works

### 1. Authentication Flow
```
User logs in → JWT token created with user_id
↓
Token sent with every request
↓
Backend extracts user_id from token
↓
Database queries filtered by user_id
↓
User sees only their own data
```

### 2. Data Isolation

#### Sessions Collection
```javascript
// Query for regular user
db.sessions.find({ "user_id": "68edd25c08f20b54baace9d6" })

// Query for admin (sees all)
db.sessions.find({})
```

#### Messages Collection
```javascript
// Always filtered by user_id
db.messages.find({ "user_id": "68edd25c08f20b54baace9d6" })
```

#### Documents (ChromaDB)
```javascript
// Chunks include user_id metadata
// Filtered when listing documents
chunks.filter(chunk => chunk.user_id === current_user_id)
```

---

## User Roles

### Regular User (student/guest)
- ✅ Can view own chat history
- ✅ Can view own documents
- ✅ Can delete own sessions
- ✅ Can search own messages
- ❌ Cannot see other users' data
- ❌ Cannot access admin endpoints

### Admin User
- ✅ Can view all chat history
- ✅ Can view all documents
- ✅ Can delete any session
- ✅ Can access all user data
- ✅ Can manage users

---

## Current Users in Database

Based on the database check:

1. **admin@smartdoc.com** (Role: admin)
   - ID: 68edd25c08f20b54baace9d6
   - Has: 21 sessions, 130 messages

2. **s123@gmail.com** (Role: student)
   - ID: 68edd55f08f20b54baace9d7
   - Personal data isolated

3. **g123@gmail.com** (Role: guest)
   - ID: 68ee0aa7d176526cc6eaa9a4
   - Personal data isolated

4. **raniya123@gmail.com** (Role: student)
   - ID: 68ee8e1ac7c3773272bfe4ac
   - Personal data isolated

---

## Testing Privacy

### Test 1: Login as Different Users
1. Log in as `s123@gmail.com`
2. Check History page → Should see only s123's sessions
3. Log out
4. Log in as `admin@smartdoc.com`
5. Check History page → Should see admin's sessions (or all if admin view implemented)

### Test 2: Try to Access Another User's Session
1. Log in as regular user
2. Get a session_id from another user
3. Try to access `/api/history/sessions/{other_user_id}`
4. Should get: **403 Forbidden**

### Test 3: Document Privacy
1. User A uploads a document
2. User B logs in
3. User B checks Document Library
4. Should NOT see User A's document

---

## API Endpoints Summary

### Public (No Auth Required)
- `/api/auth/login` - Login
- `/api/auth/register` - Register
- `/api/shared/{session_id}` - View shared sessions

### Authenticated (Personal Data Only)
- `/api/history/sessions` - List own sessions
- `/api/history` - Get own messages
- `/api/history/search` - Search own history
- `/api/documents` - List own documents
- `/api/chat` - Chat (creates own sessions)
- `/api/upload` - Upload (tagged with user_id)

### Admin Only
- `/api/auth/users` - List all users
- Can access all sessions/documents

---

## Database Schema with Privacy

### Sessions
```javascript
{
  "session_id": "session_...",
  "user_id": "68edd25c08f20b54baace9d6",  // ← Privacy key
  "title": "Chat about...",
  "message_count": 8,
  "created_at": ISODate,
  "last_activity": ISODate
}
```

### Messages
```javascript
{
  "session_id": "session_...",
  "user_id": "68edd25c08f20b54baace9d6",  // ← Privacy key
  "message_type": "user" | "ai",
  "content": "...",
  "timestamp": ISODate
}
```

### Document Chunks (ChromaDB)
```javascript
{
  "document_id": "uuid",
  "user_id": "68edd25c08f20b54baace9d6",  // ← Privacy key
  "text": "...",
  "metadata": {
    "filename": "...",
    "page": 1
  }
}
```

---

## Security Features

1. **JWT Authentication** - All sensitive endpoints require valid token
2. **User ID Extraction** - User ID extracted from token, not from request
3. **Query Filtering** - All database queries filtered by user_id
4. **Authorization Checks** - Verify ownership before delete/update
5. **Admin Override** - Admins can access all data when needed
6. **No Data Leakage** - Users cannot see other users' data in any endpoint

---

## What Happens After Logout/Login

### Before (Old Token)
- Token created with old SECRET_KEY
- Cannot be verified → 401 errors
- No data visible

### After (New Token)
- Token created with current SECRET_KEY
- Successfully verified
- Personal data loaded and displayed
- History shows only your sessions
- Documents show only your uploads

---

## Next Steps

After logging out and logging in again:

1. ✅ **History Page** - Will show your 21 sessions (if you're admin)
2. ✅ **Document Library** - Will show documents you uploaded
3. ✅ **Chat** - Will create new sessions tagged with your user_id
4. ✅ **Search** - Will search only your messages
5. ✅ **Delete** - Can delete only your sessions

---

## Privacy Guarantee

**Each user's data is completely isolated:**
- ✅ Cannot view other users' chat history
- ✅ Cannot view other users' documents  
- ✅ Cannot delete other users' sessions
- ✅ Cannot search other users' messages
- ✅ All data queries filtered by authenticated user_id

**The only exception:** Admin users can access all data for management purposes.

---

**Your personal data is now properly protected!** 🔒
