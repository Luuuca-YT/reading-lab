import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface AdminUser {
  id: number;
  username: string;
  displayName: string;
  role: string;
}

interface AuthCtxValue {
  admin: AdminUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthCtx = createContext<AuthCtxValue | null>(null);

const API = import.meta.env.VITE_API_URL || '';

async function api(path: string, options?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch {
    throw new Error('Network error. Please check your connection and try again.');
  }

  let data: any;
  try {
    const text = await res.text();
    data = JSON.parse(text);
  } catch {
    throw new Error(`Unexpected server response (${res.status}). Please try again.`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => {
        setAdmin({
          id: data.id,
          username: data.username,
          displayName: data.display_name || data.displayName,
          role: data.role,
        });
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('admin', JSON.stringify(data.admin));
    setToken(data.token);
    setAdmin(data.admin);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setToken(null);
    setAdmin(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ admin, token, login, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

// Helper: fetch with auth header
export function authFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('token');
  return api(path, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
