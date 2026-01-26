# Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add username/password authentication to lock down the tea app for personal use.

**Architecture:** Single-user auth with JWT tokens. Credentials stored in environment variables (bcrypt hash). Auth middleware protects all `/api/*` routes except login. Frontend shows login page when unauthenticated, stores token in localStorage.

**Tech Stack:** bcrypt (password hashing), jsonwebtoken (JWT), Express middleware, React Context

---

### Task 1: Install Backend Dependencies

**Files:**
- Modify: `tea-app/server/package.json`

**Step 1: Install bcrypt and jsonwebtoken**

Run:
```bash
cd /Users/serena/dev/gf_tea/tea-app/server && npm install bcrypt jsonwebtoken && npm install -D @types/bcrypt @types/jsonwebtoken
```

**Step 2: Verify installation**

Run:
```bash
cd /Users/serena/dev/gf_tea/tea-app/server && npm ls bcrypt jsonwebtoken
```

Expected: Both packages listed without errors

**Step 3: Commit**

```bash
git add tea-app/server/package.json tea-app/server/package-lock.json
git commit -m "chore: add bcrypt and jsonwebtoken dependencies"
```

---

### Task 2: Create Auth Module with Login Endpoint

**Files:**
- Create: `tea-app/server/auth.ts`

**Step 1: Create the auth module**

Create `tea-app/server/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from './logger';

// Environment variable validation
const getAuthConfig = () => {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const jwtSecret = process.env.JWT_SECRET;

  if (!username || !passwordHash || !jwtSecret) {
    const missing = [];
    if (!username) missing.push('ADMIN_USERNAME');
    if (!passwordHash) missing.push('ADMIN_PASSWORD_HASH');
    if (!jwtSecret) missing.push('JWT_SECRET');
    throw new Error(`Missing required auth environment variables: ${missing.join(', ')}`);
  }

  return { username, passwordHash, jwtSecret };
};

// JWT token expiry (30 days in seconds)
const TOKEN_EXPIRY = 30 * 24 * 60 * 60;

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { username: string };
    }
  }
}

// Login handler
export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const config = getAuthConfig();

    // Check username
    if (username !== config.username) {
      logger.warn(`Failed login attempt for username: ${username}`);
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Check password
    const passwordValid = await bcrypt.compare(password, config.passwordHash);
    if (!passwordValid) {
      logger.warn(`Failed login attempt - invalid password for username: ${username}`);
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { username: config.username },
      config.jwtSecret,
      { expiresIn: TOKEN_EXPIRY }
    );

    logger.info(`Successful login for username: ${username}`);
    res.json({ token });
  } catch (error) {
    logger.error('Login error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Auth middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const config = getAuthConfig();
    const decoded = jwt.verify(token, config.jwtSecret) as { username: string };
    req.user = { username: decoded.username };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      logger.error('Auth middleware error:', error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Validate auth config on startup
export const validateAuthConfig = (): void => {
  try {
    getAuthConfig();
    logger.info('Auth configuration validated');
  } catch (error) {
    logger.error('Auth configuration error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};
```

**Step 2: Verify file created**

Run:
```bash
ls -la /Users/serena/dev/gf_tea/tea-app/server/auth.ts
```

Expected: File exists

**Step 3: Commit**

```bash
git add tea-app/server/auth.ts
git commit -m "feat: add auth module with login handler and middleware"
```

---

### Task 3: Integrate Auth into Express Server

**Files:**
- Modify: `tea-app/server/index.ts`

**Step 1: Import auth module**

Add after other imports (around line 14):

```typescript
import { login, requireAuth, validateAuthConfig } from './auth';
```

**Step 2: Add login route (before other routes)**

Add after the debug logging middleware (around line 85), before the `normalizeTeaType` function:

```typescript
// Auth routes (must be before requireAuth middleware)
app.post('/api/auth/login', login);

// Protect all other API routes
app.use('/api', requireAuth);
```

**Step 3: Validate auth config on startup**

Add inside the `app.listen` callback, before "Pre-load the browser" (around line 915):

```typescript
  // Validate auth configuration
  validateAuthConfig();
```

**Step 4: Verify server compiles**

Run:
```bash
cd /Users/serena/dev/gf_tea/tea-app && npx tsc --noEmit -p server/tsconfig.json 2>/dev/null || npx tsx --no-warnings server/index.ts &
sleep 2 && curl -s http://localhost:3001/api/teas | head -c 100
pkill -f "tsx.*server/index.ts" 2>/dev/null
```

Expected: Should return 401 unauthorized (auth is working)

**Step 5: Commit**

```bash
git add tea-app/server/index.ts
git commit -m "feat: integrate auth middleware into Express server"
```

---

### Task 4: Create AuthContext for Frontend

**Files:**
- Create: `tea-app/src/AuthContext.tsx`

**Step 1: Create AuthContext**

Create `tea-app/src/AuthContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'auth_token';

// Check if token is expired by decoding JWT payload
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
    } else if (token) {
      // Token exists but expired, clean up
      localStorage.removeItem(TOKEN_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    setError(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Login failed');
    }

    const { token } = await response.json();
    localStorage.setItem(TOKEN_KEY, token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper to get token for API requests
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};
```

**Step 2: Verify file created**

Run:
```bash
ls -la /Users/serena/dev/gf_tea/tea-app/src/AuthContext.tsx
```

Expected: File exists

**Step 3: Commit**

```bash
git add tea-app/src/AuthContext.tsx
git commit -m "feat: add AuthContext for frontend authentication state"
```

---

### Task 5: Create LoginPage Component

**Files:**
- Create: `tea-app/src/components/LoginPage.tsx`
- Modify: `tea-app/src/components/index.ts`

**Step 1: Create LoginPage component**

Create `tea-app/src/components/LoginPage.tsx`:

```typescript
import { useState, FormEvent } from 'react';
import { useAuth } from '../AuthContext';
import { Coffee } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Coffee size={48} className="login-icon" />
          <h1>Tea Timer</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};
```

**Step 2: Export from components index**

Add to `tea-app/src/components/index.ts`:

```typescript
export { LoginPage } from './LoginPage';
```

**Step 3: Commit**

```bash
git add tea-app/src/components/LoginPage.tsx tea-app/src/components/index.ts
git commit -m "feat: add LoginPage component"
```

---

### Task 6: Add Login Styles

**Files:**
- Modify: `tea-app/src/App.css`

**Step 1: Add login page styles**

Add to the end of `tea-app/src/App.css`:

```css
/* Login Page */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 1rem;
}

.login-container {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-icon {
  color: var(--accent);
  margin-bottom: 0.5rem;
}

.login-header h1 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.login-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.login-form label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.login-form input {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
}

.login-form input:focus {
  outline: none;
  border-color: var(--accent);
}

.login-button {
  padding: 0.75rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5rem;
}

.login-button:hover:not(:disabled) {
  opacity: 0.9;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

**Step 2: Commit**

```bash
git add tea-app/src/App.css
git commit -m "feat: add login page styles"
```

---

### Task 7: Update API Client to Include Auth Token

**Files:**
- Modify: `tea-app/src/api.ts`

**Step 1: Add axios interceptor for auth token**

Replace the entire content of `tea-app/src/api.ts`:

```typescript
import axios from 'axios';
import { z } from 'zod';

import { TeaSchema, CreateTeaSchema } from './types';
import type { Tea, CreateTea } from './types';
import { getAuthToken } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and reload to show login page
      localStorage.removeItem('auth_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const getTeas = async (): Promise<Tea[]> => {
  const response = await api.get('/teas');
  return z.array(TeaSchema).parse(response.data);
};

export const createTea = async (tea: CreateTea): Promise<Tea> => {
  const response = await api.post('/teas', tea);
  return TeaSchema.parse(response.data);
};

export const importTeaFromUrl = async (url: string): Promise<CreateTea> => {
  const response = await api.post('/teas/import', { url });
  return CreateTeaSchema.parse(response.data);
};

export const deleteTea = async (id: string): Promise<void> => {
  await api.delete(`/teas/${id}`);
};

export const updateTea = async (id: string, updates: Partial<Tea>): Promise<Tea> => {
  const response = await api.patch(`/teas/${id}`, updates);
  return TeaSchema.parse(response.data);
};

export const markTeaConsumed = async (id: string): Promise<Tea> => {
  const response = await api.put(`/teas/${id}/lastConsumed`);
  return TeaSchema.parse(response.data);
};
```

**Step 2: Commit**

```bash
git add tea-app/src/api.ts
git commit -m "feat: add auth token to API requests"
```

---

### Task 8: Integrate Auth into App.tsx

**Files:**
- Modify: `tea-app/src/App.tsx`

**Step 1: Import AuthProvider and LoginPage**

Add to imports at top of file:

```typescript
import { AuthProvider, useAuth } from './AuthContext';
import { LoginPage } from './components';
```

**Step 2: Create AuthenticatedApp wrapper**

Add before the main `function App()`:

```typescript
const AuthenticatedApp = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppContent />;
};
```

**Step 3: Rename App to AppContent and create new App wrapper**

1. Rename the existing `function App()` to `function AppContent()`
2. Create new `App` that wraps everything in `AuthProvider`:

```typescript
function App() {
  return (
    <AuthProvider>
      <TimerProvider>
        <AuthenticatedApp />
        <Toaster position="bottom-right" richColors />
      </TimerProvider>
    </AuthProvider>
  );
}
```

**Step 4: Add logout button to header**

In the AppContent function, find the header section and add a logout button. Add import for `LogOut` from lucide-react, then add button in header:

```typescript
import { Clock, Plus, X, Coffee, ExternalLink, Star, LogOut } from 'lucide-react';
```

Add logout button in the header (after the title/filter area):

```typescript
const { logout } = useAuth();
```

And in the header JSX:

```typescript
<button onClick={logout} className="logout-button" title="Logout">
  <LogOut size={20} />
</button>
```

**Step 5: Add logout button style**

Add to `tea-app/src/App.css`:

```css
/* Logout Button */
.logout-button {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-button:hover {
  color: var(--text-primary);
  border-color: var(--text-secondary);
}
```

**Step 6: Verify frontend compiles**

Run:
```bash
cd /Users/serena/dev/gf_tea/tea-app && npm run build
```

Expected: Build succeeds

**Step 7: Commit**

```bash
git add tea-app/src/App.tsx tea-app/src/App.css
git commit -m "feat: integrate auth into App with login gate and logout button"
```

---

### Task 9: Add Environment Variables Template

**Files:**
- Create: `tea-app/server/.env.example`

**Step 1: Create .env.example**

Create `tea-app/server/.env.example`:

```bash
# Authentication
# Generate password hash: npx bcrypt-cli hash "yourpassword"
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$...
JWT_SECRET=generate-a-random-string-here

# Logging
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

**Step 2: Add .env to .gitignore if not present**

Verify `.env` is in `.gitignore`:

```bash
grep -q "^\.env$" /Users/serena/dev/gf_tea/tea-app/server/.gitignore || echo ".env" >> /Users/serena/dev/gf_tea/tea-app/server/.gitignore
```

**Step 3: Commit**

```bash
git add tea-app/server/.env.example
git add tea-app/server/.gitignore 2>/dev/null || true
git commit -m "docs: add .env.example with auth configuration template"
```

---

### Task 10: Create Password Hash Script

**Files:**
- Create: `tea-app/server/scripts/hash-password.ts`

**Step 1: Create hash-password script**

Create `tea-app/server/scripts/hash-password.ts`:

```typescript
import bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npx tsx scripts/hash-password.ts <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nAdd this to your .env file:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('');
```

**Step 2: Verify script works**

Run:
```bash
cd /Users/serena/dev/gf_tea/tea-app/server && npx tsx scripts/hash-password.ts testpassword
```

Expected: Outputs a bcrypt hash

**Step 3: Commit**

```bash
git add tea-app/server/scripts/hash-password.ts
git commit -m "feat: add password hash generation script"
```

---

### Task 11: Update CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add authentication section to CLAUDE.md**

Add a new section after "API Endpoints":

```markdown
### Authentication

The app uses JWT-based authentication for personal access control.

**Environment Variables (server/.env):**
```
ADMIN_USERNAME=yourname
ADMIN_PASSWORD_HASH=$2b$10$...  # Generate with: cd server && npx tsx scripts/hash-password.ts yourpassword
JWT_SECRET=random-secret-string
```

**Auth Flow:**
1. All `/api/*` routes (except `/api/auth/login`) require `Authorization: Bearer <token>` header
2. Frontend stores JWT in localStorage, includes in all API requests
3. Token expires after 30 days, user must re-login

**New API Endpoint:**
```
POST /api/auth/login  # Accepts { username, password }, returns { token }
```
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add authentication documentation to CLAUDE.md"
```

---

### Task 12: End-to-End Test

**Step 1: Create .env file with test credentials**

```bash
cd /Users/serena/dev/gf_tea/tea-app/server
HASH=$(npx tsx scripts/hash-password.ts testpass123 2>/dev/null | grep "ADMIN_PASSWORD_HASH" | cut -d= -f2)
cat > .env << EOF
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$HASH
JWT_SECRET=test-secret-for-development
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:5173
EOF
```

**Step 2: Start the server and test auth flow**

Run:
```bash
cd /Users/serena/dev/gf_tea/tea-app/server && npx tsx index.ts &
sleep 3

# Test unauthenticated request (should fail)
echo "Test 1: Unauthenticated request..."
curl -s http://localhost:3001/api/teas | grep -q "Authorization token required" && echo "PASS: Blocked without token" || echo "FAIL"

# Test login with wrong password
echo "Test 2: Wrong password..."
curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"wrong"}' | grep -q "Invalid username or password" && echo "PASS: Wrong password rejected" || echo "FAIL"

# Test login with correct credentials
echo "Test 3: Correct login..."
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"testpass123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[ -n "$TOKEN" ] && echo "PASS: Got token" || echo "FAIL: No token received"

# Test authenticated request
echo "Test 4: Authenticated request..."
curl -s http://localhost:3001/api/teas -H "Authorization: Bearer $TOKEN" | grep -q "^\[" && echo "PASS: Got teas with token" || echo "FAIL"

pkill -f "tsx.*index.ts"
```

Expected: All 4 tests pass

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete authentication implementation" --allow-empty
```

---

## Summary

This plan implements:
1. Backend auth module with bcrypt password verification and JWT tokens
2. Express middleware protecting all API routes
3. Frontend AuthContext managing login state
4. LoginPage component with form
5. Axios interceptor adding auth headers
6. Password hash generation script
7. Environment variable configuration

After completing all tasks, the app will require login to access any functionality.
