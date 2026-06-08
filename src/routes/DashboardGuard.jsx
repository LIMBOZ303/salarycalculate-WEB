import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canAccessDashboard, ROLES } from '../utils/rolePermissions';

export default function DashboardGuard({ children }) {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === ROLES.EMPLOYEE) {
    return <Navigate to="/employee/home" replace />;
  }

  if (!canAccessDashboard(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
