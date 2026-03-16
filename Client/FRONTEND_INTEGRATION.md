# Frontend Integration Guide

## How the Frontend Communicates with Backend

### 1. API Client Setup (authService.ts)

The `authService.ts` handles all backend communication:

```typescript
// Get API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// All requests automatically include JWT token from localStorage
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  
  // Add token to Authorization header
  headers.Authorization = `Bearer ${token}`;
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  // ... handle response
}
```

---

## 2. Using Auth Service in Components

### Login
```typescript
import { authService } from '@/services/authService';

try {
  const response = await authService.login({
    email: 'user@example.com',
    password: 'Password123!'
  });
  
  // Token is automatically stored
  // User is logged in
  console.log('User:', response.data);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Signup
```typescript
const response = await authService.signup({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Password123!',
  confirmPassword: 'Password123!',
  role: 'student'
});
```

### Get Current User Profile
```typescript
const response = await authService.getUserProfile();
console.log('Profile:', response.data);
console.log('Stats:', response.data.profile);
```

### Update Profile
```typescript
const updated = await authService.updateProfile({
  bio: 'Computer Science Student',
  phone: '9876543210',
  country: 'India',
  state: 'Maharashtra',
  city: 'Mumbai',
  institution: 'IIT Mumbai'
});
```

### Logout
```typescript
await authService.logout();
// Token and user are removed from localStorage
```

---

## 3. Token Management

### Automatic Token Handling
- Token stored in `localStorage` with key: `qm_auth_token`
- Automatically included in all API requests
- Removed on logout

### Manual Token Access
```typescript
import { storage, STORAGE_KEYS } from '@/utils/storage';

// Get token
const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);

// Set token (done by authService automatically)
storage.set(STORAGE_KEYS.AUTH_TOKEN, token);

// Remove token
storage.remove(STORAGE_KEYS.AUTH_TOKEN);
```

---

## 4. Error Handling

All API calls throw errors with messages from backend:

```typescript
try {
  await authService.login({ email, password });
} catch (error) {
  // Error message from backend
  const message = error instanceof Error ? error.message : 'Unknown error';
  
  if (message.includes('Invalid email or password')) {
    // Handle authentication error
  } else if (message.includes('Email already registered')) {
    // Handle duplicate email
  }
}
```

---

## 5. User Data Structure

After login/signup, user object contains:

```typescript
interface User {
  id: string;           // UUID (public identifier)
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar?: string;
  createdAt: string;    // ISO timestamp
  profile?: {           // Added after getUserProfile()
    bio?: string;
    phone?: string;
    country?: string;
    state?: string;
    city?: string;
    institution?: string;
    totalQuizzesAttempted?: number;
    totalQuizzesCompleted?: number;
    averageScore?: number;
    highestScore?: number;
    totalTimeSpent?: number;
    lastLoginAt?: string;
  }
}
```

---

## 6. Integration in Auth Context

Example usage in React Context:

```typescript
import { authService } from '@/services/authService';

async function handleLogin(credentials) {
  try {
    const { data: user } = await authService.login(credentials);
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false
    });
  } catch (error) {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: error.message
    });
  }
}

async function handleLoadUser() {
  try {
    const result = await authService.getMe();
    if (result.success && result.data) {
      setAuthState({
        user: result.data,
        isAuthenticated: true,
        isLoading: false
      });
    } else {
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    }
  } catch (error) {
    setAuthState({ user: null, isAuthenticated: false, isLoading: false });
  }
}
```

---

## 7. Making Other API Calls

For quiz results, leaderboard, etc., follow same pattern:

```typescript
// Create custom API endpoint
export async function getQuizResults() {
  const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  
  const response = await fetch('http://localhost:5000/api/quiz/results', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
}

// Or use authService's apiRequest pattern
// Extend authService with additional methods
```

---

## 8. Testing with Browser DevTools

### Check Token
```javascript
// In browser console
localStorage.getItem('qm_auth_token');
localStorage.getItem('qm_auth_user');
```

### Make API Request
```javascript
const token = localStorage.getItem('qm_auth_token');

fetch('http://localhost:5000/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## 9. Environment Configuration

### Development (.env.development)
```
VITE_API_URL=http://localhost:5000
```

### Production (.env.production)
```
VITE_API_URL=https://api.quizapp.com
```

Access in code:
```typescript
const API_URL = import.meta.env.VITE_API_URL;
```

---

## 10. Common Patterns

### Protected Component Example
```typescript
function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data } = await authService.getUserProfile();
        setUser(data);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    }

    const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []);

  if (!user) return <div>Login required</div>;
  return <div>Welcome, {user.name}!</div>;
}
```

---

## Debugging

### Network Tab
1. Open DevTools → Network tab
2. Watch for API calls to `localhost:5000`
3. Check request headers (Authorization)
4. Check response status and data

### Console Errors
- CORS errors? Check backend CORS config
- 401 errors? Check token in localStorage
- 404 errors? Check API endpoint URL

### Backend Logs
```bash
# Terminal running backend
npm start
# Watch for request logs
```

---

**All API calls are now going to real backend with proper authentication!** ✅
