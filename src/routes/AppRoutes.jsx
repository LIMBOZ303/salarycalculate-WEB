import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import PendingEmployees from '../pages/PendingEmployees';
import Employees from '../pages/Employees';
import EmployeeDetail from '../pages/EmployeeDetail';
import Branches from '../pages/Branches';
import Shifts from '../pages/Shifts';
import Attendance from '../pages/Attendance';
import Revenues from '../pages/Revenues';
import Users from '../pages/Users';
import Forbidden from '../pages/Forbidden';
import NotFound from '../pages/NotFound';
import { ROLES } from '../utils/rolePermissions';

const dashboardRoles = [ROLES.ADMIN, ROLES.OWNER, ROLES.BRANCH_MANAGER];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/403" element={<Forbidden />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <RoleRoute allowedRoles={dashboardRoles}>
              <Dashboard />
            </RoleRoute>
          }
        />
        <Route
          path="pending-employees"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <PendingEmployees />
            </RoleRoute>
          }
        />
        <Route
          path="employees"
          element={
            <RoleRoute allowedRoles={dashboardRoles}>
              <Employees />
            </RoleRoute>
          }
        />
        <Route
          path="employees/:id"
          element={
            <RoleRoute allowedRoles={dashboardRoles}>
              <EmployeeDetail />
            </RoleRoute>
          }
        />
        <Route
          path="branches"
          element={
            <RoleRoute allowedRoles={dashboardRoles}>
              <Branches />
            </RoleRoute>
          }
        />
        <Route
          path="shifts"
          element={
            <RoleRoute allowedRoles={dashboardRoles}>
              <Shifts />
            </RoleRoute>
          }
        />
        <Route
          path="attendance"
          element={
            <RoleRoute allowedRoles={dashboardRoles}>
              <Attendance />
            </RoleRoute>
          }
        />
        <Route
          path="revenues"
          element={
            <RoleRoute allowedRoles={dashboardRoles}>
              <Revenues />
            </RoleRoute>
          }
        />
        <Route
          path="users"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <Users />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
