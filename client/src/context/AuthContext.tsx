import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  createdAt?: string;
}

export interface SessionInfo {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  isCurrentSession: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'schema_studio_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Session invalid');
      }

      const json = await res.json();
      if (json.success && json.data.user) {
        setUser(json.data.user);
      } else {
        throw new Error('Malformed profile');
      }
    } catch {
      // Clear token if invalid or expired
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize and verify authentication on app boot
  useEffect(() => {
    if (token) {
      void fetchProfile(token);
    } else {
      setIsLoading(false);
    }
  }, [token, fetchProfile]);

  const login = async (email: string, password: string, rememberMe = true) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || 'Invalid email address or password.',
        };
      }

      const receivedToken = json.data.token;
      if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, receivedToken);
      } else {
        sessionStorage.setItem(TOKEN_KEY, receivedToken);
      }

      setToken(receivedToken);
      setUser(json.data.user);
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Unable to connect to authentication server. Please try again.',
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || 'Failed to create account.',
        };
      }

      const receivedToken = json.data.token;
      localStorage.setItem(TOKEN_KEY, receivedToken);
      setToken(receivedToken);
      setUser(json.data.user);
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Unable to connect to registration server. Please try again.',
      };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Ignore network errors on logout
      }
    }

    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (name: string) => {
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to update profile' };
      }

      setUser((prev) => (prev ? { ...prev, name } : null));
      return { success: true };
    } catch {
      return { success: false, error: 'Network error updating profile' };
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
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
