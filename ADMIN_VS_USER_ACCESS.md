# Admin vs User Access Control

## Summary
The system now has proper role-based access control where regular users see only their own data, but admins can see everything.

---

## Access Control Rules

### Regular Users (student/guest)
- ✅ See **only their own** chat sessions
- ✅ See **only their own** messages
- ✅ See **only their own** uploaded documents
- ✅ Can delete **only their own** sessions
- ✅ Can search **only their own** messages
- ❌ Cannot see other users' data
- ❌ Cannot access admin endpoints

### Admin Users
- ✅ See **ALL** chat sessions (from all users)
- ✅ See **ALL** messages (from all users)
- ✅ See **ALL** uploaded documents (from all users)
- ✅ Can delete **ANY** session
- ✅ Can manage users
- ✅ Full system access

---

## Current Situation

Based on the database:

### Documents (15 total)
- **Admin (68edd25c08f20b54baace9d6):** 14 documents
  - SE_Final-Unit-1-Notes.pdf
  - SE_Unit_2_Notes.pdf
  - KR23 NLP UNIT 1 Notes Final.pdf
  - And 11 more...
  
- **s123@gmail.com (68edd55f08f20b54baace9d7):** 1 document
  - WT_Unit_1[1].pdf

### Sessions (21 total)
- **Admin:** 21 sessions, 130 messages

---

## What Each User Sees

### When Sankeertana (s123@gmail.com) logs in:
- **Document Library:** 1 document (WT_Unit_1[1].pdf)
- **History:** Only their own chat sessions
- **Search:** Only searches their own messages

### When Admin (admin@smartdoc.com) logs in:
- **Document Library:** All 15 documents
- **History:** All 21 sessions from all users
- **Search:** Searches all messages from all users

---

## How to Get More Documents for s123

Since s123 only has 1 document, to see more documents they need to:

### Option 1: Upload New Documents
1. Log in as s123@gmail.com
2. Go to Upload page
3. Upload a PDF document
4. The document will be tagged with s123's user_id
5. It will appear in s123's Document Library

### Option 2: Reassign Existing Documents (Admin Action)
If you want s123 to see some of the admin's documents, you need to change the user_id in those document chunks from admin's ID to s123's ID.

---

## Technical Implementation

### Documents Endpoint
```python
if user_role == "admin":
    # Return all documents
    return all_docs
else:
    # Filter by user_id
    return [doc for doc in all_docs if doc.user_id == current_user_id]
```

### History Endpoint
```python
if user_role == "admin":
    query = {}  # No filter - get all
else:
    query = {"user_id": current_user_id}  # Filter by user
```

### Sessions Endpoint
```python
if user_role == "admin":
    query_filter = {}  # Admin sees all sessions
else:
    query_filter = {"user_id": user_id}  # Users see only their own
```

---

## Testing

### Test as Regular User (s123)
1. Log in as s123@gmail.com
2. Check Document Library → Should see 1 document
3. Check History → Should see only s123's sessions
4. Upload a new document → Should appear in library
5. Try to access admin's session → Should get 403 Forbidden

### Test as Admin
1. Log in as admin@smartdoc.com
2. Check Document Library → Should see all 15 documents
3. Check History → Should see all 21 sessions
4. Can view any user's sessions
5. Can delete any session

---

## Database Structure

### Document Chunks (ChromaDB)
```javascript
{
  "id": "chunk_uuid",
  "text": "...",
  "metadata": {
    "document_id": "doc_uuid",
    "user_id": "68edd55f08f20b54baace9d7",  // ← Owner
    "filename": "WT_Unit_1[1].pdf",
    "chunk_index": 0
  }
}
```

### Sessions (MongoDB)
```javascript
{
  "session_id": "session_...",
  "user_id": "68edd55f08f20b54baace9d7",  // ← Owner
  "title": "Chat about...",
  "message_count": 8
}
```

### Messages (MongoDB)
```javascript
{
  "session_id": "session_...",
  "user_id": "68edd55f08f20b54baace9d7",  // ← Owner
  "message_type": "user",
  "content": "..."
}
```

---

## Why s123 Sees 0 Documents

The script output showed:
```
1. WT_Unit_1[1].pdf
   User ID: 68edd55f08f20b54baace9d7  ← This is s123's document
   
2-15. Other documents
   User ID: 68edd25c08f20b54baace9d6  ← These belong to admin
```

So s123 should actually see **1 document** (WT_Unit_1[1].pdf), not 0.

If s123 is seeing 0 documents, check the terminal logs when they refresh the Document Library page. The logs will show:
- Total docs in vector store
- User ID and role
- Which documents match the user_id

---

## Summary

✅ **Regular users:** Personal data only
✅ **Admin:** All data from all users
✅ **Documents:** Filtered by user_id (except admin)
✅ **Sessions:** Filtered by user_id (except admin)
✅ **Messages:** Filtered by user_id (except admin)

**The system now properly implements role-based access control!** 🔒
