import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RoleRoute({ children, allowedRoles = [] }) {
  const { user } = useAuth();

  if (!user) return null;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
