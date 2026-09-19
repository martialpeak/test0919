// Admin Authentication Service — server-side verification
// Password is stored hashed on the server (data/admin_auth.json).
// A session token (7 days) is kept in localStorage.
import { apiFetch } from './apiFetch';

const ADMIN_STORAGE_KEY = 'moviebrowser_admin_auth';
const ADMIN_TOKEN_KEY = 'moviebrowser_admin_token';

export interface AdminAuthState {
  isAdmin: boolean;
  username: string;
  loginTime?: number;
}

function getToken(): string {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

async function authFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await apiFetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': getToken(),
      ...(options.headers || {})
    }
  });
  return res.json();
}

export const AuthService = {
  // Check if admin is currently authenticated (has local session flag)
  isAdminAuthenticated(): boolean {
    try {
      const data = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (!data) return false;
      const parsed = JSON.parse(data);
      return Boolean(parsed && parsed.isAdmin && this.getToken());
    } catch {
      return false;
    }
  },

  // Verify the token against the server (call when needed)
  async verifyWithServer(): Promise<boolean> {
    if (!getToken()) return false;
    try {
      const r = await authFetch('/api/auth/check');
      return Boolean(r.ok);
    } catch {
      return false;
    }
  },

  getToken,

  // Get current auth state
  getAuthState(): AdminAuthState {
    try {
      const data = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (!data) return { isAdmin: false, username: '' };
      const parsed = JSON.parse(data);
      return {
        isAdmin: Boolean(parsed?.isAdmin),
        username: parsed?.username || 'admin',
        loginTime: parsed?.loginTime,
      };
    } catch {
      return { isAdmin: false, username: '' };
    }
  },

  // Attempt login — verified by the server
  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const r = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const j = await r.json();
      if (j.ok && j.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, j.token);
        const sessionData: AdminAuthState = {
          isAdmin: true,
          username: (username || 'admin').trim().toLowerCase(),
          loginTime: Date.now(),
        };
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(sessionData));
        return { success: true };
      }
      return { success: false, error: j.error || 'نام کاربری یا رمز عبور اشتباه است' };
    } catch {
      return { success: false, error: 'خطا در ارتباط با سرور' };
    }
  },

  // Logout — invalidates the server-side session too
  logout(): void {
    authFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  // Change admin password — verified & stored on the server
  async changePassword(currentPass: string, newPass: string): Promise<{ success: boolean; error?: string }> {
    try {
      const j = await authFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
      });
      if (j.ok) return { success: true };
      return { success: false, error: j.error || 'خطا در تغییر رمز عبور' };
    } catch {
      return { success: false, error: 'خطا در ارتباط با سرور' };
    }
  }
};
