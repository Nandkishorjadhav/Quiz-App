# 🎓 Quiz App - Full Stack Application

> A professional Quiz Application with **secure authentication**, **SQL database**, and **complete backend infrastructure**.

## ✨ Key Features

### 🔐 Authentication & Security
- **User Registration & Login** with email and password
- **Secure Password Hashing** using bcryptjs (10 rounds)
- **JWT Token Authentication** (7-day expiry)
- **Password Strength Validation** (8+ chars, mixed case, numbers, special chars)
- **CORS Protection** for secure API access
- **SQL Injection Prevention** with parameterized queries

### 👤 User Management
- **User Profiles** with extended information
- **Profile Management** (bio, location, institution)
- **User Statistics** (quizzes attempted, scores, activity times)
- **Account Management** (delete account, update profile)

### 🏗️ Backend Infrastructure
- **Structured File Organization** - Clean separation of concerns
- **SQL Database** (SQLite with expandable schema)
- **Express.js Server** with proper middleware
- **RESTful API** endpoints with validation
- **Comprehensive Error Handling**
- **Configuration Management** with environment variables

### ⚛️ Frontend Integration
- **React + TypeScript** modern components
- **Real Backend API Calls** (production-ready)
- **Token-based Authentication** with JWT
- **Secure Token Storage** in localStorage
- **User-friendly Error Handling**

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js v16+ installed
- npm or yarn

### Step 1: Setup Backend
```bash
cd Server
npm install
cp .env.example .env
npm start
```
✅ Backend running on `http://localhost:5000`

### Step 2: Setup Frontend (New Terminal)
```bash
cd Client
npm install
npm run dev
```
✅ Frontend running on `http://localhost:5173`

### Step 3: Test It Out
1. Visit `http://localhost:5173`
2. Click "Sign Up"
3. Create account with password like `SecurePass123!`
4. Login with your credentials
5. View your profile with all user data

---

## 📁 Project Structure

```
Quiz App/
├── README.md                      # This file
├── SETUP_GUIDE.md                 # Detailed setup & troubleshooting
├── SECURITY_GUIDE.md              # Password policy & security details
│
├── Server/                        # Backend (Node.js/Express)
│   ├── server.js                  # Main entry point
│   ├── package.json               # npm dependencies
│   ├── .env.example               # Environment template
│   ├── BACKEND_DOCUMENTATION.md   # Complete API reference
│   ├── quiz_app.db                # SQLite database (auto-created)
│   │
│   ├── config/
│   │   ├── database.js           # Database initialization
│   │   └── config.js             # App configuration
│   │
│   ├── middleware/
│   │   └── auth.js               # JWT & error middleware
│   │
│   ├── controllers/
│   │   ├── authController.js     # Login/Signup logic
│   │   └── userController.js     # Profile operations
│   │
│   ├── models/
│   │   └── userModel.js          # Database queries
│   │
│   ├── routes/
│   │   ├── auth.js               # Auth endpoints
│   │   └── users.js              # User endpoints
│   │
│   └── utils/
│       ├── passwordUtil.js       # Password hashing
│       └── jwtUtil.js            # JWT handling
│
└── Client/                        # Frontend (React/TypeScript)
    ├── src/
    │   ├── services/
    │   │   └── authService.ts    # Backend API calls
    │   ├── types/
    │   │   └── index.ts          # TypeScript types
    │   ├── utils/
    │   │   └── storage.ts        # Token management
    │   ├── ...other files...
    ├── .env.development           # Frontend config
    ├── FRONTEND_INTEGRATION.md    # API usage guide
    └── vite.config.ts
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Installation, configuration, troubleshooting |
| [Server/BACKEND_DOCUMENTATION.md](./Server/BACKEND_DOCUMENTATION.md) | Complete API endpoints, database schema, testing |
| [Client/FRONTEND_INTEGRATION.md](./Client/FRONTEND_INTEGRATION.md) | How to use authService, token management, examples |
| [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) | Password policy, security features, deployment |

---

## 🔐 Authentication Flow

### User Registration
```
User fills form with name, email, password
    ↓
Password validated (8+ chars, mixed case, number, special char)
    ↓
Email checked for duplicates in database
    ↓
Password hashed with bcryptjs (10 rounds)
    ↓
User created in database with hashed password
    ↓
JWT token generated and returned
    ↓
Token stored in localStorage automatically
    ↓
User logged in → Redirected to dashboard
```

### User Login
```
User enters email & password
    ↓
Backend finds user by email
    ↓
Input password compared with stored hash
    ↓
If valid: JWT token generated
    ↓
Token returned to frontend
    ↓
Token stored in localStorage
    ↓
Token sent with every API request in header
```

### Protected Requests
```
Any request to protected endpoint
    ↓
Token extracted from Authorization header
    ↓
Token verified (signature & expiry checked)
    ↓
User data extracted from token
    ↓
Request processed or 401 returned
```

---

## 🔌 API Endpoints

### Authentication Endpoints
```
POST   /api/auth/signup           Register new user
POST   /api/auth/login            Login with email & password
POST   /api/auth/verify           Verify JWT token validity
POST   /api/auth/logout           Logout (client-side token removal)
```

### User Profile Endpoints
```
GET    /api/users/profile         Get current user's full profile
PUT    /api/users/profile         Update bio, location, institution, etc.
GET    /api/users/stats           Get user statistics (quizzes, scores)
GET    /api/users                 Get all users (admin only)
DELETE /api/users/account         Delete user account (needs password)
```

### Full Documentation
👉 See [Server/BACKEND_DOCUMENTATION.md](./Server/BACKEND_DOCUMENTATION.md) for detailed endpoint documentation with examples.

---

## 🗄️ Database Schema

### Users Table
```sql
id           INTEGER (auto-increment)
uuid         TEXT (unique, public identifier)
name         TEXT (full name)
email        TEXT (unique, login credential)
password     TEXT (hashed with bcryptjs)
role         TEXT ('student' or 'admin')
avatar       TEXT (profile picture URL)
createdAt    DATETIME (account creation)
updatedAt    DATETIME (last update)
```

### User Profiles Table
```sql
userId                    INTEGER (foreign key)
bio                       TEXT (user biography)
phone, country, state     TEXT (location info)
city, institution         TEXT (place of study)
totalQuizzesAttempted     INTEGER (quiz count)
totalQuizzesCompleted     INTEGER (completed count)
averageScore              REAL (average quiz score)
highestScore              REAL (best quiz score)
totalTimeSpent            INTEGER (seconds spent)
lastLoginAt               DATETIME (last login time)
isActive                  BOOLEAN (account status)
```

### Quiz Results Table (Ready for implementation)
```sql
userId        INTEGER (foreign key)
category      TEXT (java, python, react, etc.)
difficulty    TEXT (easy, medium, hard)
score         REAL (percentage)
correctAnswers INTEGER (count)
timeSpent     INTEGER (seconds)
attemptedAt   DATETIME (when quiz was taken)
```

---

## 🔒 Security Features

### ✅ Password Security
```
Requirements:
  • Minimum 8 characters
  • Uppercase & lowercase letters
  • At least one number
  • At least one special character (!@#$%^&*)
  
Hashing:
  • Algorithm: bcryptjs
  • Rounds: 10 (significant processing time)
  • Never stored as plain text
  • Non-reversible (one-way hashing)

Valid Examples:
  ✓ SecurePass123!
  ✓ MyQuiz@Password2024
  ✓ Admin#1234

Invalid Examples:
  ✗ password (no numbers)
  ✗ Pass123 (no special char)
  ✗ Pass@12 (too short)
```

### ✅ JWT Authentication
```
Token Structure:
  Header:   Algorithm (HS256) & Type (JWT)
  Payload:  User ID, Email, Role
  Signature: Secret key + HMAC

Expiration: 7 days
Storage:    localStorage
Usage:      Authorization: Bearer {token}

On Invalid Token:
  • 401 Unauthorized response
  • Token removed from localStorage
  • User redirected to login
```

### ✅ Database Security
```
SQL Injection Prevention:
  ✓ Parameterized queries
  ✓ No string concatenation
  ✓ Type validation

Data Integrity:
  ✓ Foreign key constraints
  ✓ Unique email constraint
  ✓ Unique UUID for each user
  ✓ Passwords never in queries
```

### ✅ API Security
```
CORS Protection:
  • Only accept from frontend domain
  • Methods: GET, POST, PUT, DELETE
  • Credentials allowed

Request Validation:
  • Email format validation
  • Password strength checking
  • Input sanitization
  • Type validation

Error Messages:
  • Generic (don't reveal user existence)
  • Production: No stack traces
  • Development: Detailed errors
```

---

## 🧪 Quick API Testing

### Test with cURL

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "role": "student"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### Get Profile (Replace TOKEN with actual token)
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer TOKEN"
```

#### Update Profile
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Computer Science Student",
    "city": "Mumbai",
    "institution": "IIT Mumbai"
  }'
```

---

## 📝 Environment Configuration

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=7d

# CORS
CLIENT_URL=http://localhost:5173
```

### Frontend (.env.development)
```env
VITE_API_URL=http://localhost:5000
```

---

## 🛠️ Technology Stack

### Backend
| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | SQLite |
| Authentication | JWT + bcryptjs |
| Passwords | bcryptjs (10 rounds) |
| Validation | Custom middleware |

### Frontend
| Component | Technology |
|-----------|------------|
| UI Library | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | TailwindCSS |
| Forms | React Hook Form |
| HTTP | Fetch API |

---

## 🚀 What's Implemented

### ✅ Completed
- [x] User registration with strong password requirements
- [x] User login with email & password verification
- [x] JWT token generation & verification
- [x] User profile creation & management
- [x] User profile update (bio, location, institution)
- [x] User statistics (quiz attempts, scores)
- [x] Database schema for users & profiles
- [x] Password hashing with bcryptjs
- [x] CORS protection
- [x] Error handling & validation
- [x] Frontend API integration
- [x] Documentation

### 🔜 Next Steps
- [ ] Save quiz results to database
- [ ] Create leaderboard system
- [ ] User avatar upload
- [ ] Quiz statistics by category
- [ ] Email verification for signup
- [ ] Password reset functionality
- [ ] Refresh token rotation
- [ ] Rate limiting
- [ ] Admin dashboard

---

## 🐛 Common Issues & Solutions

### Backend won't start
```bash
# Make sure dependencies are installed
cd Server
npm install

# Make sure port 5000 is available
lsof -i :5000  # List processes using port 5000

# Check .env file exists
cp .env.example .env
npm start
```

### Frontend can't connect to backend
```bash
# 1. Verify backend is running
curl http://localhost:5000/health

# 2. Check VITE_API_URL in .env.development
VITE_API_URL=http://localhost:5000

# 3. Clear browser cache
# 4. Check browser console for CORS errors
```

### "Invalid password" on signup
Password must contain:
- At least 8 characters
- One uppercase letter (A-Z)
- One lowercase letter (a-z)
- One number (0-9)
- One special character (!@#$%^&*)

Example: `SecurePass123!`

### Database errors
```bash
# Delete old database and let backend recreate it
rm Server/quiz_app.db
cd Server
npm start
```

---

## 📚 Learning Resources

- **Express.js Docs**: https://expressjs.com
- **SQLite Docs**: https://www.sqlite.org/docs.html
- **JWT Guide**: https://jwt.io/introduction
- **bcryptjs**: https://www.npmjs.com/package/bcryptjs
- **React Docs**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org

---

## 💡 Developer Tips

1. ✅ **Never commit .env files** - Use .env.example
2. ✅ **Change JWT_SECRET for production** - Use random 32+ character string
3. ✅ **Always use HTTPS in production** - Not just HTTP
4. ✅ **Update dependencies regularly** - Run `npm audit`
5. ✅ **Test API endpoints** - Use curl or Postman
6. ✅ **Monitor logs** - Check terminal and browser console
7. ✅ **Implement rate limiting** - Before production
8. ✅ **Use HTTPS everywhere** - Once deployed

---

## 📊 Project Statistics

- **Backend Files**: 11 organized files
- **Routes**: 5 RESTful endpoints
- **Database Tables**: 4 (Users, Profiles, Results, Sessions)
- **Authentication Method**: JWT + bcryptjs
- **Security**: Industry-standard practices
- **Documentation**: 4 comprehensive guides

---

## 📄 Project Details

**Framework**: React + Express.js
**Language**: TypeScript + JavaScript
**Database**: SQLite
**Authentication**: JWT + bcryptjs
**Styling**: TailwindCSS
**Build Tool**: Vite

---

**Let's build something awesome! 🚀**

> Made by Nandkishor Jadhav | Production-Ready | 
