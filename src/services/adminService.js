import axiosClient from './axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { extractArray } from '../utils/parseApiData';
import { hasValidId } from '../utils/getEntityId';

function assertUserId(userId, action = 'thao tác') {
  if (!hasValidId(userId)) {
    throw new Error(`Không tìm thấy ID người dùng để ${action}`);
  }
}

export const adminService = {
  getUsers: async () => {
    const response = await axiosClient.get(ENDPOINTS.admin.users);
    return extractArray(response.data, ['users', 'employees', 'data']);
  },

  getPendingEmployees: async () => {
    const response = await axiosClient.get(ENDPOINTS.admin.pendingEmployees);
    return extractArray(response.data, ['users', 'pendingUsers', 'employees', 'data']);
  },

  approveEmployee: async (userId, payload) => {
    assertUserId(userId, 'duyệt nhân viên');
    const response = await axiosClient.post(ENDPOINTS.admin.approveEmployee(userId), payload);
    return response.data;
  },

  rejectEmployee: async (userId, payload = {}) => {
    assertUserId(userId, 'từ chối nhân viên');
    const response = await axiosClient.post(ENDPOINTS.admin.rejectEmployee(userId), payload);
    return response.data;
  },

  lockEmployee: async (userId) => {
    assertUserId(userId, 'khóa tài khoản');
    const response = await axiosClient.post(ENDPOINTS.admin.lockEmployee(userId));
    return response.data;
  },

  unlockEmployee: async (userId) => {
    assertUserId(userId, 'mở khóa tài khoản');
    const response = await axiosClient.post(ENDPOINTS.admin.unlockEmployee(userId));
    return response.data;
  },

  lockUser: async (userId) => adminService.lockEmployee(userId),

  unlockUser: async (userId) => adminService.unlockEmployee(userId),

  updateUserRole: async (userId, payload) => {
    assertUserId(userId, 'cập nhật role');
    const response = await axiosClient.patch(ENDPOINTS.admin.updateUserRole(userId), payload);
    return response.data;
  },

  updateUserStatus: async (userId, payload) => {
    assertUserId(userId, 'cập nhật trạng thái');
    const response = await axiosClient.patch(ENDPOINTS.admin.updateUserStatus(userId), payload);
    return response.data;
  },
};

export default adminService;
