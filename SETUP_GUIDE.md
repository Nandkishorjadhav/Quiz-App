# Quiz App - Full Stack Setup Guide

## Project Overview

A complete Quiz Application with:
- ✅ Professional Backend (Node.js/Express)
- ✅ SQL Database (SQLite with schema)
- ✅ Secure Authentication (JWT + bcrypt)
- ✅ User Profiles with Data Storage
- ✅ Modern Frontend (React/TypeScript)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

#### 1. Setup Backend

```bash
cd Server
npm install
cp .env.example .env
npm start
```

Server will start on `http://localhost:5000`

#### 2. Setup Frontend

```bash
cd Client
npm install
npm run dev
```

Frontend will start on `http://localhost:5173`

---

## 📁 Project Structure

```
Quiz App/
├── Server/                      # Backend
│   ├── server.js               # Main server file
│   ├── package.json            # Dependencies
│   ├── .env                    # Environment variables
│   ├── config/
│   │   ├── database.js         # SQLite setup
│   │   └── config.js           # App config
│   ├── middleware/
│   │   └── auth.js             # JWT middleware
│   ├── controllers/
│   │   ├── authController.js   # Login/Signup logic
│   │   └── userController.js   # Profile logic
│   ├── models/
│   │   └── userModel.js        # DB operations
│   ├── routes/
│   │   ├── auth.js             # Auth endpoints
│   │   └── users.js            # User endpoints
│   ├── utils/
│   │   ├── passwordUtil.js     # Password hashing
│   │   └── jwtUtil.js          # JWT handling
│   ├── quiz_app.db             # SQLite database (auto-created)
│   └── BACKEND_DOCUMENTATION.md
│
└── Client/                      # Frontend
    ├── src/
    │   ├── services/
    │   │   └── authService.ts  # Backend API calls
    │   ├── types/
    │   │   └── index.ts        # TypeScript types
    │   ├── utils/
    │   │   └── storage.ts      # Token & user storage
    │   └── ...
    ├── package.json
    ├── .env.development        # API URL config
    └── vite.config.ts
```

---

## 🔐 Authentication Flow

### Signup
1. User provides name, email, password
2. Backend validates password strength
3. Password hashed with bcrypt (10 rounds)
4. User created in database
5. JWT token generated & returned
6. Token stored in localStorage

### Login
1. User provides email & password
2. Backend finds user by email
3. Password compared with hash (constant-time)
4. If valid, JWT token generated
5. Token returned & stored locally
6. User data loaded in frontend

### Protected Routes
- JWT token sent in `Authorization: Bearer <token>` header
- Middleware verifies token on backend
- User data extracted from token payload
- Request proceeds if valid, otherwise returns 401

---

## 📊 Database Schema

### Users Table
```sql
id          - Auto-increment primary key
uuid        - Unique user identifier (public)
name        - Full name
email       - Unique email (login credential)
password    - Hashed password (bcrypt)
role        - 'student' or 'admin'
avatar      - Profile picture URL
createdAt   - Account creation time
updatedAt   - Last update time
```

### User Profiles Table
```sql
userId              - Foreign key to users
bio                 - User biography
phone               - Contact number
country             - Country name
state               - State/Province
city                - City name
institution         - School/College name
totalQuizzesAttempted    - Quiz attempt count
totalQuizzesCompleted    - Quiz completion count
averageScore        - Average quiz score
highestScore        - Best quiz score
totalTimeSpent      - Total time on quizzes (seconds)
lastLoginAt         - Last login timestamp
```

---

## 🔑 API Endpoints

### Authentication

#### Register
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "role": "student"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Verify Token
```bash
POST /api/auth/verify
Authorization: Bearer {token}
```

### User Profile

#### Get Profile
```bash
GET /api/users/profile
Authorization: Bearer {token}
```

#### Update Profile
```bash
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "bio": "Student",
  "phone": "9876543210",
  "country": "India",
  "state": "Maharashtra",
  "city": "Mumbai",
  "institution": "IIT Mumbai"
}
```

#### Get Statistics
```bash
GET /api/users/stats
Authorization: Bearer {token}
```

---

## 🔒 Security Features

✅ **Password Security**
- Minimum 8 characters
- Mixed case letters (upper & lower)
- Numbers required
- Special characters required (!@#$%^&*)
- Hashed with bcryptjs (10 rounds)

✅ **JWT Authentication**
- Tokens expire in 7 days
- Verified on every protected request
- Stored in localStorage
- Sent via Authorization header

✅ **Database Security**
- SQL injection prevention (parameterized queries)
- Foreign key constraints
- Unique email constraint
- UUID for public user IDs

✅ **Other Features**
- CORS configured
- Password verification with constant-time comparison
- Error messages don't reveal user existence

---

## 🧪 Testing

### Using cURL

#### Register a User
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

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

#### Get User Profile
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=7d
CLIENT_URL=http://localhost:5173
```

### Frontend (.env.development)
```
VITE_API_URL=http://localhost:5000
```

---

## 🐛 Troubleshooting

### Backend won't start
1. Check if port 5000 is available
2. Ensure Node.js is installed: `node --version`
3. Install dependencies: `npm install`
4. Check error message in terminal

### Frontend can't connect to backend
1. Ensure backend is running on port 5000
2. Check `VITE_API_URL` in `.env.development`
3. Check browser console for CORS errors
4. Verify CORS config in `server.js`

### Database errors
1. Delete `quiz_app.db` to reset database
2. Restart backend (`npm start`)
3. Database will be auto-created

### Password validation errors
- Password must have: uppercase, lowercase, number, special char
- Must be at least 8 characters long

---

## 🚀 Next Steps

### Upcoming Features
- [ ] Quiz attempts & results storage
- [ ] Leaderboard system
- [ ] Email verification
- [ ] Password reset flow
- [ ] Admin dashboard
- [ ] Rate limiting
- [ ] Refresh token rotation
- [ ] User avatar upload

### Database Migration
To switch from SQLite to PostgreSQL:
1. Export data from SQLite
2. Install `pg` package: `npm install pg`
3. Update `config/database.js` to use PostgreSQL
4. Create tables in PostgreSQL
5. Import data

---

## 📚 Additional Resources

- **Backend Docs**: `Server/BACKEND_DOCUMENTATION.md`
- **Node.js Express**: https://expressjs.com
- **SQLite**: https://www.sqlite.org
- **JWT**: https://jwt.io
- **bcryptjs**: https://www.npmjs.com/package/bcryptjs

---

## 💡 Tips

1. **Always use HTTPS in production**
2. **Change JWT_SECRET before deployment**
3. **Use environment variables for sensitive data**
4. **Implement rate limiting**
5. **Add email verification**
6. **Use HTTPS for API calls**
7. **Refresh tokens regularly**
8. **Log security events**

---

## 📞 Support

For issues or questions:
1. Check console errors (browser & terminal)
2. Review BACKEND_DOCUMENTATION.md
3. Verify API endpoints using cURL
4. Check environment variables

---

**Happy Coding! 🎓**
