# MongoDB Setup Guide for SmartDocQ

This guide will help you set up MongoDB for the SmartDocQ application to ensure proper data persistence for sessions, messages, feedbacks, and user data.

## Prerequisites

1. **MongoDB Installation**: Make sure MongoDB is installed on your system
   - **Windows**: Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - **macOS**: `brew install mongodb-community`
   - **Linux**: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)

2. **Python Dependencies**: The required packages are already added to `requirements.txt`:
   - `motor==3.3.2` (Async MongoDB driver)
   - `pymongo==4.6.0` (MongoDB driver)

## Installation Steps

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start MongoDB Service

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or run MongoDB manually
mongod --dbpath C:\data\db
```

**macOS:**
```bash
# Start MongoDB service
brew services start mongodb-community

# Or run MongoDB manually
mongod --config /usr/local/etc/mongod.conf
```

**Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or run MongoDB manually
mongod
```

### 3. Configure Environment Variables

Create or update your `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=smartdocq

# Other existing configurations...
GOOGLE_API_KEY=your_gemini_api_key_here
CHROMA_PERSIST_DIRECTORY=./chroma_db
MAX_FILE_SIZE=20971520
UPLOAD_FOLDER=./uploads
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4. Test MongoDB Connection

Run the test script to verify everything is working:

```bash
cd backend
python test_mongodb.py
```

You should see output like:
```
🚀 Starting MongoDB integration tests...

🔧 Testing MongoDB integration...
✅ Successfully connected to MongoDB
📝 Testing user operations...
✅ Created test user with ID: 507f1f77bcf86cd799439011
...
🎉 All MongoDB tests passed successfully!
```

## Database Schema

The application uses the following MongoDB collections:

### 1. Users Collection (`users`)
```javascript
{
  "_id": ObjectId,
  "email": "user@example.com",
  "full_name": "John Doe",
  "hashed_password": "hashed_password_string",
  "role": "student", // or "guest", "admin"
  "is_active": true,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### 2. Sessions Collection (`sessions`)
```javascript
{
  "_id": ObjectId,
  "session_id": "unique_session_id",
  "user_id": "user_object_id", // null for guest sessions
  "title": "Session Title",
  "is_guest": false,
  "created_at": ISODate,
  "last_activity": ISODate,
  "message_count": 10
}
```

### 3. Messages Collection (`messages`)
```javascript
{
  "_id": ObjectId,
  "session_id": "session_id",
  "user_id": "user_object_id", // null for guest messages
  "message_type": "user", // or "ai"
  "content": "Message content",
  "sources": [/* source documents */],
  "timestamp": ISODate,
  "document_id": "document_id"
}
```

### 4. Feedback Collection (`feedback`)
```javascript
{
  "_id": ObjectId,
  "session_id": "session_id",
  "user_id": "user_object_id", // null for guest feedback
  "message_id": "message_object_id",
  "rating": 5, // 1-5 scale
  "comment": "Optional feedback comment",
  "timestamp": ISODate
}
```

### 5. Documents Collection (`documents`)
```javascript
{
  "_id": ObjectId,
  "document_id": "unique_document_id",
  "user_id": "user_object_id", // null for guest documents
  "filename": "document.pdf",
  "file_size": 1024000,
  "file_type": ".pdf",
  "upload_path": "/path/to/file",
  "is_processed": true,
  "chunk_count": 25,
  "uploaded_at": ISODate,
  "processed_at": ISODate
}
```

## Key Features

### ✅ **Data Persistence**
- All user sessions, messages, and feedback are now saved to MongoDB
- Data persists across application restarts
- No more data loss when the server restarts

### ✅ **User Management**
- User registration and authentication stored in MongoDB
- Session management with proper user association
- Guest and registered user support

### ✅ **Session History**
- Complete chat history for each session
- Session metadata (creation time, last activity, message count)
- User-specific session filtering

### ✅ **Feedback System**
- All user feedback stored persistently
- Analytics and statistics available
- Session-based feedback tracking

### ✅ **Document Management**
- Document upload metadata stored in MongoDB
- Processing status tracking
- User-document associations

## API Endpoints

The following endpoints now use MongoDB:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification
- `GET /api/auth/me` - Current user info

### Chat & History
- `POST /api/chat` - Chat with documents (saves messages)
- `GET /api/history` - Get chat history
- `GET /api/history/sessions` - List all sessions
- `GET /api/history/sessions/{user_id}` - User-specific sessions
- `POST /api/history` - Save chat history
- `DELETE /api/history/{session_id}` - Delete session

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get feedback statistics
- `GET /api/feedback/session/{session_id}` - Session feedback
- `GET /api/feedback/analytics` - Detailed analytics

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: Failed to connect to MongoDB
   ```
   **Solution**: Make sure MongoDB is running and the connection string is correct.

2. **Authentication Failed**
   ```
   Error: Authentication failed
   ```
   **Solution**: Check if MongoDB requires authentication and update the connection string.

3. **Database Not Found**
   ```
   Error: Database 'smartdocq' not found
   ```
   **Solution**: The database will be created automatically when first used.

### MongoDB Commands

**Connect to MongoDB shell:**
```bash
mongosh
```

**List databases:**
```javascript
show dbs
```

**Use smartdocq database:**
```javascript
use smartdocq
```

**List collections:**
```javascript
show collections
```

**View sample documents:**
```javascript
db.users.findOne()
db.sessions.findOne()
db.messages.findOne()
```

## Production Considerations

1. **Security**: Use authentication and SSL in production
2. **Backup**: Set up regular MongoDB backups
3. **Monitoring**: Monitor database performance and storage
4. **Scaling**: Consider MongoDB Atlas for cloud deployment
5. **Indexes**: The application automatically creates necessary indexes

## Default Admin User

A default admin user is automatically created on startup:
- **Email**: `admin@smartdoc.com`
- **Password**: `admin123`
- **Role**: `admin`

**⚠️ Important**: Change the default admin password in production!

## Support

If you encounter any issues with MongoDB setup:

1. Check MongoDB service status
2. Verify connection string in `.env` file
3. Run the test script: `python test_mongodb.py`
4. Check MongoDB logs for errors
5. Ensure all dependencies are installed

The application will now properly save and retrieve all user data, session history, and feedback, providing a complete persistent experience for your users!
