export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const TOKEN_KEY = 'auth_token';

export const ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    me: '/api/auth/me',
  },
  branches: '/api/branches',
  employees: '/api/employees',
  shifts: '/api/shifts',
  attendance: '/api/attendance',
  attendanceMe: {
    checkIn: '/api/attendance/check-in',
    checkOut: '/api/attendance/check-out',
    today: '/api/attendance/me/today',
    history: '/api/attendance/me/history',
    summary: '/api/attendance/me/summary',
  },
  revenues: '/api/revenues',
  payrolls: '/api/payrolls',
  payrollAdjustments: '/api/payroll-adjustments',
  admin: {
    users: '/api/admin/users',
    pendingEmployees: '/api/admin/employees/pending',
    approveEmployee: (id) => `/api/admin/employees/${id}/approve`,
    rejectEmployee: (id) => `/api/admin/employees/${id}/reject`,
    lockEmployee: (id) => `/api/admin/employees/${id}/lock`,
    unlockEmployee: (id) => `/api/admin/employees/${id}/unlock`,
    updateUserRole: (id) => `/api/admin/users/${id}/role`,
    updateUserStatus: (id) => `/api/admin/users/${id}/status`,
  },
};
