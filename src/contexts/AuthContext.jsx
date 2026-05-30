import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { setAuthHandlers } from '../services/axiosClient';
import { canAccessDashboard } from '../utils/rolePermissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const token = authService.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const data = await authService.me();
      const userData = data?.user ?? data;
      setUser(userData);
      return userData;
    } catch {
      authService.logout();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setAuthHandlers({
      onUnauthorized: () => {
        authService.logout();
        setUser(null);
        navigate('/login', { replace: true });
      },
    });
  }, [navigate]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const userData = data?.user ?? data;
    const role = userData?.role;

    if (role === 'employee') {
      authService.logout();
      throw new Error('Tài khoản nhân viên vui lòng sử dụng app chấm công.');
    }

    if (!canAccessDashboard(role)) {
      authService.logout();
      throw new Error('Tài khoản không có quyền truy cập hệ thống.');
    }

    setUser(userData);
    return userData;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;
