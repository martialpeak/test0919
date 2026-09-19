import React, { createContext, useContext, useState, useEffect } from 'react';

// Server-side user accounts (Firebase removed).
// Same interface as before so components don't change.

export interface UserProfileData {
  userId: string;
  username: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// Minimal "User" shape compatible with components that used firebase User
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  username: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserDisplayName: (name: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
  /** extra: raw server register with explicit username */
  registerWithUsername: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
}

const USER_KEY = 'moviebrowser_user_session';
const TOKEN_KEY = 'moviebrowser_user_token';

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

async function api(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-token': getToken(),
      ...(options.headers || {})
    }
  });
  return res.json();
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const s = localStorage.getItem(USER_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [loading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Verify stored session against the server on load
  useEffect(() => {
    if (!getToken()) { setUser(null); return; }
    api('/api/auth/me').then(j => {
      if (j.ok && j.user) {
        setUser({
          uid: j.user.userId,
          email: j.user.email,
          displayName: j.user.displayName,
          photoURL: j.user.photoURL,
          username: j.user.username
        });
      } else {
        setUser(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    }).catch(() => { /* offline — keep local session */ });
  }, []);

  const clearError = () => setError(null);

  const persistSession = (token: string, u: any): AppUser => {
    localStorage.setItem(TOKEN_KEY, token);
    const appUser: AppUser = {
      uid: u.userId, email: u.email, displayName: u.displayName || u.username,
      photoURL: u.photoURL || '', username: u.username
    };
    localStorage.setItem(USER_KEY, JSON.stringify(appUser));
    setUser(appUser);
    return appUser;
  };

  // Google sign-in removed with Firebase. Kept for interface compatibility.
  const signInWithGoogle = async (): Promise<void> => {
    setError('ورود با گوگل دیگر در دسترس نیست — با نام کاربری یا ایمیل وارد شوید.');
    throw new Error('google-removed');
  };

  const registerWithUsername = async (username: string, email: string, password: string, displayName?: string): Promise<void> => {
    setError(null);
    const j = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, displayName })
    });
    if (!j.ok) {
      const msg = j.error || 'خطا در ثبت‌نام';
      setError(msg);
      throw new Error(msg);
    }
    persistSession(j.token, j.user);
  };

  // email field doubles as username-or-email identifier on login
  const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<void> => {
    // Derive a username from email local-part; must be unique on server
    const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, '') || 'user';
    let username = base;
    // The server rejects duplicates; try suffixes
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await registerWithUsername(username, email, password, displayName || base);
        return;
      } catch (err: any) {
        if (String(err.message).includes('قبلاً')) throw new Error('این ایمیل/نام کاربری قبلاً ثبت شده است. لطفاً وارد شوید.');
        username = `${base}${Math.floor(Math.random() * 9000 + 1000)}`;
      }
    }
    throw new Error('ثبت‌نام ناموفق بود. دوباره تلاش کنید.');
  };

  const signInWithEmail = async (identifier: string, password: string): Promise<void> => {
    setError(null);
    const j = await api('/api/auth/user-login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    if (!j.ok) {
      const msg = j.error || 'ایمیل یا رمز عبور اشتباه است';
      setError(msg);
      throw new Error(msg);
    }
    persistSession(j.token, j.user);
  };

  // Ask the server to email a reset link
  const resetPassword = async (email: string): Promise<void> => {
    setError(null);
    const j = await api('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    if (!j.ok) {
      const msg = j.error || 'ارسال ایمیل ناموفق بود';
      setError(msg);
      throw new Error(msg);
    }
    // ok — the email with the link is on its way
  };

  const logout = async (): Promise<void> => {
    try { await api('/api/auth/user-logout', { method: 'POST' }); } catch { /* ignore */ }
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const updateUserDisplayName = async (name: string): Promise<void> => {
    if (!user) return;
    const updated = { ...user, displayName: name };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      signInWithGoogle, signUpWithEmail, signInWithEmail,
      resetPassword, logout, updateUserDisplayName,
      error, clearError, registerWithUsername
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
