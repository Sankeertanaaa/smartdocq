# Chat History Fix - User Session Tracking

## Problem
Chat history was working but sessions were not visible in the History dashboard because sessions were not being associated with user IDs.

## Root Cause
The `/api/chat` endpoint was creating/updating sessions without capturing the `user_id` field. When the frontend tried to fetch sessions by user ID, no sessions were returned because they had no `user_id` associated with them.

## Changes Made

### 1. Backend Changes - `backend/app/api/routes/chat.py`

#### Added Authentication
- Imported `get_current_user` from auth module
- Added `Depends(get_current_user)` to all chat endpoints to require authentication:
  - `/api/chat` - Main chat endpoint
  - `/api/chat/follow-up` - Follow-up questions
  - `/api/chat/summarize` - Document summarization
  - `/api/chat/key-points` - Key points extraction

#### Updated Session Management
- Extract `user_id` from authenticated user: `user_id = str(current_user["_id"])`
- Added `user_id` to all MessageModel instances when saving messages
- Added `user_id` to session updates in both branches (no chunks found & normal flow)
- Sessions are now created/updated with the user_id field:
  ```python
  "$set": {
      "user_id": user_id,
      "last_activity": timestamp,
      "updated_at": timestamp
  }
  ```

## How It Works Now

1. **User logs in** → JWT token stored in localStorage
2. **User sends chat message** → Token sent in Authorization header
3. **Backend authenticates request** → Extracts user_id from token
4. **Session created/updated** → Includes user_id field
5. **Messages saved** → Include user_id field
6. **History page loads** → Fetches sessions filtered by user_id
7. **Sessions displayed** → User sees only their own chat sessions

## Testing Steps

1. **Clear old sessions (optional)**:
   - Old sessions without user_id won't show up
   - You can manually update them in MongoDB or create new sessions

2. **Test the fix**:
   - Log in to the application
   - Upload a document
   - Start a new chat session
   - Ask questions and get responses
   - Navigate to History page
   - Verify your chat session appears in the list

3. **Verify session data**:
   - Check MongoDB sessions collection
   - Confirm sessions have `user_id` field populated
   - Confirm messages have `user_id` field populated

## Database Schema

### Sessions Collection
```javascript
{
  "_id": ObjectId,
  "session_id": "string",
  "user_id": "string",  // ← Now properly populated
  "title": "string",
  "created_at": ISODate,
  "last_activity": ISODate,
  "message_count": number,
  "document_ids": ["string"],
  // ... other fields
}
```

### Messages Collection
```javascript
{
  "_id": ObjectId,
  "session_id": "string",
  "user_id": "string",  // ← Now properly populated
  "message_type": "user" | "ai",
  "content": "string",
  "timestamp": ISODate,
  // ... other fields
}
```

## Notes

- All chat endpoints now require authentication
- Guest users cannot use chat features (they need to register/login)
- Each user can only see their own chat sessions
- Admin users can see all sessions (if admin filtering is implemented)
- The upload endpoint already had optional authentication and is unchanged

## Future Enhancements

- Add migration script to update old sessions with user_id
- Add admin view to see all user sessions
- Add session sharing functionality
- Add session export/import features
