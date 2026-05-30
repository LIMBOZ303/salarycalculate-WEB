import axiosClient from './axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { extractArray, extractObject } from '../utils/parseApiData';
import { hasValidId } from '../utils/getEntityId';

function assertEmployeeId(employeeId, action = 'thao tác') {
  if (!hasValidId(employeeId)) {
    throw new Error(`Không tìm thấy ID hồ sơ nhân viên để ${action}`);
  }
}

export const employeeService = {
  getAll: async (params) => {
    const response = await axiosClient.get(ENDPOINTS.employees, { params });
    return extractArray(response.data, ['employees', 'users', 'data']);
  },

  getById: async (employeeId) => {
    assertEmployeeId(employeeId, 'xem chi tiết');
    const response = await axiosClient.get(`${ENDPOINTS.employees}/${employeeId}`);
    return extractObject(response.data, ['employee', 'data']) || response.data?.data || response.data;
  },

  getMe: async () => {
    const response = await axiosClient.get(`${ENDPOINTS.employees}/me`);
    return extractObject(response.data, ['employee', 'data']) || response.data?.data || response.data;
  },

  create: async (payload) => {
    const response = await axiosClient.post(ENDPOINTS.employees, payload);
    return response.data;
  },

  update: async (employeeId, payload) => {
    assertEmployeeId(employeeId, 'cập nhật');
    const response = await axiosClient.put(`${ENDPOINTS.employees}/${employeeId}`, payload);
    return response.data;
  },

  remove: async (employeeId) => {
    assertEmployeeId(employeeId, 'xóa');
    const response = await axiosClient.delete(`${ENDPOINTS.employees}/${employeeId}`);
    return response.data;
  },
};

export default employeeService;
