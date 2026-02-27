import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginApi, signupApi, logoutApi, getCurrentUser } from '../lib/api';

export interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { },
  signup: async () => { },
  logout: () => { },
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if there's a valid token in localStorage
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await getCurrentUser();
        setUser({ id: userData.id, email: userData.email });
      } catch {
        // Token is invalid/expired — clear it
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const userData = await loginApi(email, password);
    setUser({ id: userData.id, email: userData.email });
  };

  const signup = async (email: string, password: string) => {
    const userData = await signupApi(email, password);
    setUser({ id: userData.id, email: userData.email });
  };

  const logout = () => {
    logoutApi();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
