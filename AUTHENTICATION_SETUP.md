# Authentication System Setup

This document describes the authentication system implemented for the SmartDocQ application.

## Features Implemented

### 🔐 Authentication System
- **JWT-based authentication** with secure token handling
- **Role-based access control** (Admin, Student, Guest)
- **Password hashing** using bcrypt
- **Protected routes** with automatic redirects

### 📝 Registration Page (`/register`)
- **Form validation** with real-time feedback
- **Password strength requirements**:
  - Minimum 8 characters
  - Uppercase letter
  - Lowercase letter
  - Number
  - Special character
- **Role selection** (Student, Guest only)
- **Email validation** and duplicate checking
- **Success/error messaging**

### 🔑 Login Page (`/login`)
- **Email/password authentication**
- **Role-based redirects**:
  - Admin → `/admin-dashboard`
  - Student → `/student-dashboard`
  - Guest → `/guest-dashboard`
- **Password visibility toggle**
- **Error handling** for invalid credentials

### 🏠 Dashboard Pages
- **Admin Dashboard**: Full system access, user management, analytics
- **Student Dashboard**: Document upload, chat, history access
- **Guest Dashboard**: View-only access to public content

### 🛡️ Route Protection
- **Protected routes** require authentication
- **Role-based access** control
- **Automatic redirects** for unauthorized access
- **Loading states** during authentication checks

## Backend API Endpoints

### Authentication Routes (`/api/auth/`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /verify` - Token verification
- `POST /logout` - User logout
- `GET /me` - Current user info
- `GET /users` - List all users (admin only)
- `POST /users/{id}/deactivate` - Deactivate user (admin only)

## Default Admin Account
For testing purposes, a default admin account is created:
- **Email**: `admin@smartdoc.com`
- **Password**: `admin123`
- **Role**: `admin`

## Role Permissions

### Admin
- ✅ Full system access
- ✅ Upload and manage documents
- ✅ Chat with documents
- ✅ View all history
- ✅ Manage users
- ✅ View analytics
- ✅ Access all features

### Student
- ✅ Upload documents
- ✅ Chat with documents
- ✅ View personal history
- ✅ Browse documents
- ❌ User management
- ❌ System analytics

### Guest
- ❌ Upload documents
- ❌ Start new chat sessions
- ✅ View public responses
- ✅ Browse public documents
- ✅ View public history
- ❌ User management

## Security Features

- **JWT tokens** with expiration (30 minutes)
- **Password hashing** using bcrypt
- **Email validation** and sanitization
- **Role-based authorization**
- **Protected API endpoints**
- **CORS configuration**

## Getting Started

1. **Install dependencies**:
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd backend
   pip install -r requirements.txt
   ```

2. **Start the application**:
   ```bash
   # Backend (from backend directory)
   uvicorn main:app --reload
   
   # Frontend (from frontend directory)
   npm start
   ```

3. **Access the application**:
   - Open `http://localhost:3000`
   - Register as a student or guest
   - Or login with admin credentials: `admin@smartdoc.com` / `admin123`

## File Structure

### Frontend
```
src/
├── context/
│   └── AuthContext.js          # Authentication context
├── components/
│   ├── ProtectedRoute.js       # Route protection component
│   └── Header.js               # Updated header with auth
├── pages/
│   ├── LoginPage.js            # Login page
│   ├── RegisterPage.js         # Registration page
│   ├── AdminDashboard.js       # Admin dashboard
│   ├── StudentDashboard.js     # Student dashboard
│   └── GuestDashboard.js       # Guest dashboard
└── services/
    └── api.js                  # Updated with auth endpoints
```

### Backend
```
app/
├── api/routes/
│   └── auth.py                 # Authentication routes
├── models/
│   └── schemas.py              # Updated with auth models
└── main.py                     # Updated with auth routes
```

## Environment Variables

Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key-here
```

## Testing the Authentication

1. **Register a new user**:
   - Go to `/register`
   - Fill in the form with valid data
   - Select role (Student or Guest)
   - Submit and verify success message

2. **Login with credentials**:
   - Go to `/login`
   - Enter email and password
   - Verify role-based redirect

3. **Test protected routes**:
   - Try accessing `/upload` as a guest (should redirect)
   - Access as student/admin (should work)

4. **Test logout**:
   - Click logout from user menu
   - Verify redirect to login page

## Notes

- The current implementation uses in-memory storage for users
- For production, integrate with a proper database (PostgreSQL, MongoDB)
- Consider implementing refresh tokens for better security
- Add email verification for registration
- Implement password reset functionality
