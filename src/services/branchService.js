import axiosClient from './axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { extractArray, extractObject } from '../utils/parseApiData';
import { hasValidId } from '../utils/getEntityId';

function assertBranchId(branchId, action = 'thao tác') {
  if (!hasValidId(branchId)) {
    throw new Error(`Không tìm thấy ID chi nhánh để ${action}`);
  }
}

export const branchService = {
  getAll: async () => {
    const response = await axiosClient.get(ENDPOINTS.branches);
    return extractArray(response.data, ['branches', 'data']);
  },

  getById: async (branchId) => {
    assertBranchId(branchId, 'xem chi tiết');
    const response = await axiosClient.get(`${ENDPOINTS.branches}/${branchId}`);
    return extractObject(response.data, ['branch', 'data']) || response.data?.data || response.data;
  },

  create: async (payload) => {
    const response = await axiosClient.post(ENDPOINTS.branches, payload);
    return response.data;
  },

  update: async (branchId, payload) => {
    assertBranchId(branchId, 'cập nhật');
    const response = await axiosClient.put(`${ENDPOINTS.branches}/${branchId}`, payload);
    return response.data;
  },

  remove: async (branchId) => {
    assertBranchId(branchId, 'xóa');
    const response = await axiosClient.delete(`${ENDPOINTS.branches}/${branchId}`);
    return response.data;
  },
};

export default branchService;
