import { getBranchId } from './getEntityId';

export const ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  BRANCH_MANAGER: 'branch_manager',
  EMPLOYEE: 'employee',
};

export const ROLE_LABELS = {
  admin: 'Quản trị viên',
  owner: 'Chủ sở hữu',
  branch_manager: 'Quản lý chi nhánh',
  employee: 'Nhân viên',
};

export const STATUS_LABELS = {
  active: 'Hoạt động',
  inactive: 'Ngưng hoạt động',
  pending: 'Chờ duyệt',
  locked: 'Đã khóa',
  rejected: 'Từ chối',
  resigned: 'Nghỉ việc',
};

export function canAccessDashboard(role) {
  return [ROLES.ADMIN, ROLES.OWNER, ROLES.BRANCH_MANAGER].includes(role);
}

export function canWrite(role) {
  return role === ROLES.ADMIN;
}

export function canApproveEmployees(role) {
  return role === ROLES.ADMIN;
}

export function canManageUsers(role) {
  return role === ROLES.ADMIN;
}

export function getMenuItems(role) {
  const allItems = [
    { path: '/dashboard', label: 'Bàn làm việc', desc: 'Tổng quan hệ thống', icon: 'LayoutDashboard', roles: [ROLES.ADMIN, ROLES.OWNER, ROLES.BRANCH_MANAGER] },
    { path: '/pending-employees', label: 'Chờ duyệt', desc: 'Duyệt nhân viên mới', icon: 'UserCheck', roles: [ROLES.ADMIN] },
    { path: '/employees', label: 'Nhân sự', desc: 'Quản lý nhân viên', icon: 'Users', roles: [ROLES.ADMIN, ROLES.OWNER, ROLES.BRANCH_MANAGER] },
    { path: '/branches', label: 'Chi nhánh', desc: 'Quản lý chi nhánh', icon: 'Store', roles: [ROLES.ADMIN, ROLES.OWNER, ROLES.BRANCH_MANAGER] },
    { path: '/shifts', label: 'Ca làm', desc: 'Quản lý ca làm việc', icon: 'Clock', roles: [ROLES.ADMIN, ROLES.OWNER, ROLES.BRANCH_MANAGER] },
    { path: '/attendance', label: 'Bảng công', desc: 'Chấm công chi tiết', icon: 'CalendarClock', roles: [ROLES.ADMIN, ROLES.OWNER, ROLES.BRANCH_MANAGER] },
    { path: '/users', label: 'Tài khoản', desc: 'Quản lý người dùng', icon: 'Shield', roles: [ROLES.ADMIN] },
  ];

  return allItems.filter((item) => item.roles.includes(role));
}

export function filterByBranch(items, user, branchKey = 'branchId') {
  if (!user || user.role !== ROLES.BRANCH_MANAGER) return items;
  const branchId = getUserBranchId(user);
  if (!branchId) return items;
  return items.filter((item) => {
    const itemBranchId = getBranchId(item) || getBranchId(item[branchKey]) || item[branchKey];
    return String(itemBranchId) === String(branchId);
  });
}

export function getUserBranchId(user) {
  if (!user) return null;
  return getBranchId(user) || getBranchId(user.employee) || null;
}

export function getUserDisplayName(user) {
  return user?.fullName || user?.name || user?.employee?.fullName || user?.email || 'Người dùng';
}

export function getUserRole(user) {
  return user?.role || null;
}
