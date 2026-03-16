# 📖 Complete File Reference

## Backend Files Created/Modified

### Core Server Files

| File | Size | Purpose |
|------|------|---------|
| `Server/server.js` | ~200 lines | Main Express server, route setup, middleware |
| `Server/package.json` | New | npm dependencies (express, bcryptjs, jwt, sqlite) |
| `Server/.env.example` | New | Environment variables template |
| `Server/.gitignore` | - | (Create manually) Include: `.env`, `node_modules`, `*.db` |

### Configuration Files

| File | Size | Purpose |
|------|------|---------|
| `Server/config/database.js` | ~108 lines | SQLite setup, table creation, initialization |
| `Server/config/config.js` | ~16 lines | Centralized config from .env |

### Middleware Files

| File | Size | Purpose |
|------|------|---------|
| `Server/middleware/auth.js` | ~77 lines | JWT verification, role authorization, error handling |

### Business Logic (Controllers)

| File | Size | Purpose |
|------|------|---------|
| `Server/controllers/authController.js` | ~163 lines | Login, signup, token verify, logout |
| `Server/controllers/userController.js` | ~193 lines | Profile CRUD, stats, user management |

### Database Access (Models)

| File | Size | Purpose |
|------|------|---------|
| `Server/models/userModel.js` | ~179 lines | User queries: create, find, update, delete |

### Utility Functions

| File | Size | Purpose |
|------|------|---------|
| `Server/utils/passwordUtil.js` | ~63 lines | Hash, compare, validate passwords |
| `Server/utils/jwtUtil.js` | ~38 lines | Generate, verify, decode JWT tokens |

### API Routes

| File | Size | Purpose |
|------|------|---------|
| `Server/routes/auth.js` | ~32 lines | POST signup, login, verify, logout |
| `Server/routes/users.js` | ~36 lines | GET/PUT profile, stats, DELETE account |

### Documentation

| File | Purpose |
|------|---------|
| `Server/BACKEND_DOCUMENTATION.md` | Complete API reference with examples |
| `Server/quiz_app.db` | (Auto-created) SQLite database |

---

## Frontend Files Created/Modified

| File | Status | Purpose |
|------|--------|---------|
| `Client/src/services/authService.ts` | ✏️ Modified | Real backend API calls (replaced fake demo) |
| `Client/src/types/index.ts` | ✏️ Modified | Added UserProfile interface |
| `Client/src/utils/storage.ts` | ✏️ Modified | Added AUTH_TOKEN storage key |
| `Client/.env.development` | ✨ New | Backend API URL config |
| `Client/FRONTEND_INTEGRATION.md` | ✨ New | How to use authService, token management |

---

## Documentation Files

| File | Purpose | For Whom |
|------|---------|----------|
| `README.md` | Project overview, features, quick start | Everyone |
| `SETUP_GUIDE.md` | Installation, configuration, troubleshooting | Setup/Operations |
| `SECURITY_GUIDE.md` | Password policy, security features, deployment | Security/Ops |
| `SETUP_COMPLETE.md` | What was built, summary of changes | Project Tracking |
| `Server/BACKEND_DOCUMENTATION.md` | Complete API reference, examples | Backend Developers |
| `Client/FRONTEND_INTEGRATION.md` | How to use auth service, patterns | Frontend Developers |
| `FILES_REFERENCE.md` | This file! | Quick Lookup |

---

## Database Files

| File | Purpose | Auto-Created? |
|------|---------|---------------|
| `Server/quiz_app.db` | SQLite database with all tables | ✅ Yes (on first run) |

---

## Summary Statistics

### Backend Code
- **Total Files**: 11
- **Total Lines of Code**: ~1,100
- **Database Tables**: 4 (Users, Profiles, Results, Sessions)
- **API Endpoints**: 9
- **Controllers**: 2
- **Models**: 1
- **Routes**: 2
- **Utilities**: 2
- **Middleware**: 1

### Frontend Updates
- **Files Modified**: 3
- **Lines Added**: ~150
- **New Environment Config**: 1

### Documentation
- **Documentation Files**: 6
- **Total Documentation Lines**: ~3,000+

---

## How to Use This Reference

### Need to understand a feature?
1. **Authentication** → `Server/controllers/authController.js`
2. **User Profile** → `Server/controllers/userController.js`
3. **Database** → `Server/models/userModel.js`
4. **Passwords** → `Server/utils/passwordUtil.js`
5. **Tokens** → `Server/utils/jwtUtil.js`

### Need API documentation?
→ `Server/BACKEND_DOCUMENTATION.md`

### Need to integrate frontend?
→ `Client/FRONTEND_INTEGRATION.md`

### Need security info?
→ `SECURITY_GUIDE.md`

### Need to deploy?
→ `SETUP_GUIDE.md` + `SECURITY_GUIDE.md`

---

## File Dependencies

```
server.js
├── config/config.js
├── config/database.js
├── middleware/auth.js
├── routes/auth.js
│   └── controllers/authController.js
│       ├── models/userModel.js
│       │   └── config/database.js
│       ├── utils/passwordUtil.js
│       └── utils/jwtUtil.js
└── routes/users.js
    └── controllers/userController.js
        ├── models/userModel.js
        │   └── config/database.js
        └── utils/passwordUtil.js
```

---

## What Each File Does

### 🔑 Authentication Flow

```
User Input (Email, Password)
        ↓
authService.ts (Frontend)
        ↓
POST /api/auth/login (HTTP Request)
        ↓
server.js routes/auth.js
        ↓
controllers/authController.js
        ├─ Find user: models/userModel.js
        ├─ Compare password: utils/passwordUtil.js
        └─ Generate token: utils/jwtUtil.js
        ↓
Response with JWT Token
        ↓
authService.ts stores in localStorage
```

### 🔐 Protected Request Flow

```
API Request (with JWT Token)
        ↓
server.js + middleware/auth.js
        ├─ Extract token from header
        ├─ Verify token: utils/jwtUtil.js
        └─ Validate user: models/userModel.js
        ↓
Route Handler (controller)
        ↓
Database Operation (model)
        ↓
Response to Client
```

---

## Testing Each File

### Test Authentication
```bash
# Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"SecurePass123!","confirmPassword":"SecurePass123!","role":"student"}'
```

### Test Protected Route
```bash
# Get profile (requires token from login)
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer TOKEN_FROM_LOGIN"
```

---

## Modification Guide

### To Add New Feature

1. **Create route** in `routes/` file
2. **Create controller** in `controllers/` file
3. **Use models** in `models/userModel.js`
4. **Call from frontend** in `authService.ts`
5. **Update types** in `Client/types/index.ts`
6. **Document** in `BACKEND_DOCUMENTATION.md`

### To Change Database

1. Edit `config/database.js` (table creation)
2. Edit `models/userModel.js` (queries)
3. Update controllers as needed
4. Delete `quiz_app.db` to reset
5. Restart server (will recreate)

### To Add Authentication Check

1. Wrap controller with `authenticate` middleware
2. Add `authorize(['admin'])` for roles
3. User data available in `req.user`

---

## Common Tasks

### Change Password Requirements
→ Edit `utils/passwordUtil.js` → `validatePasswordStrength()`

### Change Token Expiry
→ Edit `config/config.js` → `JWT_EXPIRY`

### Change Database Path
→ Edit `config/database.js` → `DB_PATH`

### Add New User Field
1. Add column in `config/database.js`
2. Update `models/userModel.js` queries
3. Update controller return values
4. Update frontend `User` type

### Add New API Endpoint
1. Add route in `routes/` file
2. Create controller method
3. Use model for DB access
4. Document in `BACKEND_DOCUMENTATION.md`
5. Implement frontend call

---

## Checklist Before Production

Before deploying to production:

- [ ] Change `JWT_SECRET` in `.env` (min 32 chars)
- [ ] Set `NODE_ENV=production`
- [ ] Update `CLIENT_URL` to production domain
- [ ] Set `VITE_API_URL` to production API
- [ ] Enable HTTPS for all URLs
- [ ] Run `npm audit` and fix issues
- [ ] Test all API endpoints
- [ ] Test error scenarios
- [ ] Set up database backup
- [ ] Set up logging/monitoring
- [ ] Review `SECURITY_GUIDE.md`

---

## File Sizes (Approximate)

| Component | Lines | Size |
|-----------|-------|------|
| server.js | 200 | 6 KB |
| controllers/ | 356 | 11 KB |
| models/userModel.js | 179 | 5 KB |
| middleware/auth.js | 77 | 2 KB |
| routes/ | 68 | 2 KB |
| utils/ | 101 | 3 KB |
| config/ | 124 | 4 KB |
| **Total** | **~1,100** | **~35 KB** |

---

## Quick Links

📖 **Main README**: [README.md](../README.md)
🚀 **Setup Guide**: [SETUP_GUIDE.md](../SETUP_GUIDE.md)
🔒 **Security**: [SECURITY_GUIDE.md](../SECURITY_GUIDE.md)
📚 **Backend API**: [Server/BACKEND_DOCUMENTATION.md](../Server/BACKEND_DOCUMENTATION.md)
⚛️ **Frontend Guide**: [Client/FRONTEND_INTEGRATION.md](../Client/FRONTEND_INTEGRATION.md)
✅ **Implementation Summary**: [SETUP_COMPLETE.md](../SETUP_COMPLETE.md)

---

**Everything you need is documented and organized!** 🎉

For quick access, refer to this file. For detailed information, check the specific documentation files.
