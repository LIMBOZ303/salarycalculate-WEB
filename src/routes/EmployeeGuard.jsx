import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canAccessEmployeeApp, getHomeRouteForRole } from '../utils/rolePermissions';

export default function EmployeeGuard({ children }) {
  const { user } = useAuth();

  if (!user) return null;

  if (!canAccessEmployeeApp(user.role)) {
    return <Navigate to={getHomeRouteForRole(user.role)} replace />;
  }

  return children;
}
