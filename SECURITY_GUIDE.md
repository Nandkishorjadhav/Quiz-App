# Security & Password Policy

## Password Requirements

Your system implements industry-standard password validation:

### Minimum Password Criteria
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one digit (0-9)
- ✅ At least one special character (!@#$%^&*)

### Examples

#### Valid Passwords ✅
- `SecurePass123!`
- `MyQuizPassword@2024`
- `Admin#1234`
- `Test$Password99`

#### Invalid Passwords ❌
- `password` - Too simple, no uppercase/numbers/special
- `Pass123` - No special characters
- `PASSWORD123!` - No lowercase
- `Pass@` - Too short
- `abcdefgh` - No uppercase/numbers/special

---

## Backend Security Implementation

### 1. Password Hashing
```
Algorithm: bcryptjs
Rounds: 10
Never stored as plain text
One-way hashing (non-reversible)
```

### 2. Password Verification
```
Constant-time comparison
Prevents timing attacks
Secure against brute force (rounds delay)
```

### 3. Authentication
```
JWT Tokens (JSON Web Tokens)
Expires in 7 days
Verified on each protected request
Stored in localStorage
Sent via Authorization header
```

---

## Database Security

### Data Protection
- SQL injection prevention via parameterized queries
- Foreign key constraints
- Unique email constraint (no duplicate accounts)
- Unique UUID for each user (public ID)
- Passwords never visible in queries

### Privacy
- User IDs never exposed (UUID used instead)
- Password errors generic ("Invalid email or password")
- No information about existing users revealed
- Passwords hashed with salt

---

## API Security

### CORS Protection
```javascript
// Only accept requests from frontend
origin: 'http://localhost:5173' (development)
Methods: GET, POST, PUT, DELETE
```

### Request Validation
- Email format validation
- Password strength checking
- Input sanitization
- Type validation

### Error Handling
- Generic error messages (don't reveal user existence)
- No stack traces in production
- Proper HTTP status codes
- Rate limiting ready (can be added)

---

## JWT Token Details

### Token Structure
```
Header: Algorithm (HS256) & Type (JWT)
Payload: User ID, UUID, Email, Role
Signature: Secret key + HMAC
```

### Expiration
```
Default: 7 days
Refresh: Can implement token refresh
Storage: localStorage
```

### Usage
```
Header: Authorization: Bearer {token}
Every request includes token
Backend verifies on each request
Invalid tokens return 401 Unauthorized
```

---

## Frontend Security Best Practices

### Token Management
```typescript
// ✅ RIGHT: Stored securely
localStorage.setItem('qm_auth_token', token);

// ❌ WRONG: Exposed in URL
// fetch(`http://api.com/profile?token=${token}`)

// ❌ WRONG: Sent in request body
// POST /api/users with token in body
```

### Password Input
```typescript
// ✅ Always use type="password"
<input type="password" name="password" />

// Clear after submission
const password = formData.password;
// ... use password
// password = ''; // Clear from memory if needed
```

### XSS Prevention
- React automatically escapes output
- Don't use dangerouslySetInnerHTML
- Validate all user input

---

## Deployment Security Checklist

### Before Going Live
- [ ] Change JWT_SECRET to random string (min 32 chars)
- [ ] Set NODE_ENV to 'production'
- [ ] Enable HTTPS everywhere
- [ ] Update CORS origin to production URL
- [ ] Use environment variables for secrets
- [ ] Set secure cookies if using cookies
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Set up monitoring/alerting
- [ ] Implement backup strategy
- [ ] Add password reset flow
- [ ] Implement email verification
- [ ] Add 2FA support (optional)

### Sample Production Config
```env
# .env (production)
PORT=5000
NODE_ENV=production
JWT_SECRET=<random-32-char-string>
JWT_EXPIRY=7d
CLIENT_URL=https://quizapp.example.com
DB_PATH=/secure/path/quiz_app.db
```

---

## Common Security Vulnerabilities & Protection

### 1. SQL Injection ❌ → Protected ✅
```sql
/* VULNERABLE */
SELECT * FROM users WHERE email = '" + email + "'

/* PROTECTED */
SELECT * FROM users WHERE email = ?
database.get(query, [email])
```

### 2. Password in Plain Text ❌ → Hashed ✅
```javascript
/* VULNERABLE */
database.set('password', password)

/* PROTECTED */
const hashed = await bcrypt.hash(password, 10);
database.set('password', hashed)
```

### 3. Token in URL ❌ → Header ✅
```javascript
/* VULNERABLE */
fetch(`/api/profile?token=${token}`)

/* PROTECTED */
fetch('/api/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### 4. Timing Attack ❌ → Constant Time ✅
```javascript
/* VULNERABLE */
if (userPassword == inputPassword) // Fast fail

/* PROTECTED */
const match = await bcrypt.compare(input, hash); // Always same time
```

---

## Password Reset Flow (To Implement)

### Current State
- No password reset implemented yet
- Users can delete account but not reset password

### Recommended Implementation
```
1. User clicks "Forgot Password"
2. Enter email address
3. Backend sends reset link via email
4. Link contains time-limited token (15 mins)
5. User verifies link and sets new password
6. Password updated in database
7. Old sessions invalidated
```

---

## Two-Factor Authentication (Future)

### SMS/Email OTP
```
1. User logs in with email/password
2. Backend sends 6-digit code
3. User enters code
4. Session created only after verification
```

### TOTP (Authenticator Apps)
```
1. User scans QR code in authenticator
2. App generates 6-digit codes every 30 seconds
3. User enters during login
4. Server verifies using shared secret
```

---

## Regular Security Maintenance

### Monthly
- Review error logs for patterns
- Check for failed login attempts
- Update npm packages: `npm audit`

### Quarterly
- Review user accounts (delete inactive)
- Audit API access patterns
- Test backup restore process

### Annually
- Security audit of code
- Penetration testing
- Update security policies
- Review compliance requirements

---

## References

- OWASP Top 10: https://owasp.org/Top10/
- Password Requirements: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- bcryptjs: https://github.com/dcodeIO/bcrypt.js
- Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

---

## Support & Questions

For security-related questions or to report vulnerabilities:
1. Review this document
2. Check BACKEND_DOCUMENTATION.md
3. Review source code comments
4. Test with curl/Postman

**Stay secure! 🔒**
