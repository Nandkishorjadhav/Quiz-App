# Quiz App Backend Documentation

## Overview

Professional backend for Quiz App with SQL database, JWT authentication, and secure password management.

## File Structure

```
Server/
├── server.js                 # Main server entry point
├── package.json             # Dependencies
├── .env.example             # Environment variables template
├── config/
│   ├── database.js         # SQLite database setup
│   └── config.js           # Configuration management
├── middleware/
│   └── auth.js             # JWT authentication & error handling
├── controllers/
│   ├── authController.js   # Login/signup logic
│   └── userController.js   # User profile logic
├── models/
│   └── userModel.js        # Database operations
├── routes/
│   ├── auth.js             # Authentication routes
│   └── users.js            # User routes
├── utils/
│   ├── passwordUtil.js     # Password hashing & validation
│   └── jwtUtil.js          # JWT token generation & verification
└── quiz_app.db             # SQLite database file (auto-created)
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL (hashed with bcryptjs),
  role TEXT DEFAULT 'student',
  avatar TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### User Profiles Table
```sql
CREATE TABLE user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER UNIQUE NOT NULL,
  bio TEXT,
  phone TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  institution TEXT,
  totalQuizzesAttempted INTEGER DEFAULT 0,
  totalQuizzesCompleted INTEGER DEFAULT 0,
  averageScore REAL DEFAULT 0,
  highestScore REAL DEFAULT 0,
  totalTimeSpent INTEGER DEFAULT 0,
  lastLoginAt DATETIME,
  isActive BOOLEAN DEFAULT 1,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
)
```

### Quiz Results Table
```sql
CREATE TABLE quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score REAL NOT NULL,
  totalQuestions INTEGER NOT NULL,
  correctAnswers INTEGER NOT NULL,
  timeSpent INTEGER NOT NULL,
  attemptedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
)
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
)
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd Server
npm install
```

### 2. Create Environment File
```bash
cp .env.example .env
```

Edit `.env` and set:
- `JWT_SECRET`: Strong random string (min 32 chars)
- `CLIENT_URL`: Frontend URL (default: http://localhost:5173)
- `PORT`: Server port (default: 5000)

### 3. Start Server
```bash
npm start           # Production
npm run dev         # Development (with nodemon)
```

Server will start on `http://localhost:5000`

## API Endpoints

### Authentication

#### Register User
```
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "role": "student"
}

Response 201:
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Verify Token
```
POST /api/auth/verify
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Token is valid",
  "data": {...user data}
}
```

#### Logout
```
POST /api/auth/logout
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Logout successful"
}
```

### User Profile

#### Get Current User Profile
```
GET /api/users/profile
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "avatar": null,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "profile": {
      "bio": null,
      "phone": null,
      "country": null,
      "state": null,
      "city": null,
      "institution": null,
      "totalQuizzesAttempted": 0,
      "totalQuizzesCompleted": 0,
      "averageScore": 0,
      "highestScore": 0,
      "totalTimeSpent": 0,
      "lastLoginAt": null
    }
  }
}
```

#### Update User Profile
```
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "bio": "Computer Science Student",
  "phone": "9876543210",
  "country": "India",
  "state": "Maharashtra",
  "city": "Mumbai",
  "institution": "IIT Mumbai"
}

Response 200:
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {...updated user data}
}
```

#### Get User Statistics
```
GET /api/users/stats
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "totalQuizzesAttempted": 5,
    "totalQuizzesCompleted": 4,
    "averageScore": "78.50",
    "highestScore": "95.00",
    "totalTimeSpent": 1800,
    "joinedOn": "2024-01-01T12:00:00.000Z",
    "lastLoginAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get All Users (Admin Only)
```
GET /api/users
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": 1,
      "uuid": "uuid-1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

#### Delete Account
```
DELETE /api/users/account
Authorization: Bearer {token}
Content-Type: application/json

{
  "password": "SecurePass123!"
}

Response 200:
{
  "success": true,
  "message": "Account deleted successfully"
}
```

## Security Features

✅ **Password Hashing**: bcryptjs with 10 rounds
✅ **JWT Authentication**: Secure token-based auth
✅ **Password Validation**: 
- Minimum 8 characters
- Uppercase & lowercase letters
- Numbers & special characters (!@#$%^&*)

✅ **CORS Protection**: Configured for frontend origin
✅ **SQL Injection Prevention**: Parameterized queries
✅ **UUID for Public IDs**: Never expose internal IDs
✅ **Password Verification**: Constant-time comparison

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Error message"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (email exists)
- `500` - Server Error

## Testing with Curl

### Register
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!",
    "role": "student"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Get Profile (replace TOKEN with actual token)
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer TOKEN"
```

## Next Steps

1. **Frontend Integration**: Update Client service files to use real backend
2. **Quiz Results**: Add endpoints to save/retrieve quiz results
3. **Leaderboard**: Create ranking system
4. **Admin Panel**: Implement admin features
5. **Email Verification**: Add email confirmation for signups
6. **Password Reset**: Implement forgot password flow
7. **Rate Limiting**: Add request throttling
8. **Logging**: Implement comprehensive logging

