import axiosClient from './axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { extractArray, extractObject } from '../utils/parseApiData';
import { hasValidId } from '../utils/getEntityId';

function assertAdjustmentId(adjustmentId, action = 'thao tác') {
  if (!hasValidId(adjustmentId)) {
    throw new Error(`ID điều chỉnh lương không hợp lệ để ${action}`);
  }
}

export const payrollAdjustmentService = {
  getAdjustments: async (params) => {
    const response = await axiosClient.get(ENDPOINTS.payrollAdjustments, { params });
    return extractArray(response.data, ['adjustments', 'data']);
  },

  createAdjustment: async (payload) => {
    const response = await axiosClient.post(ENDPOINTS.payrollAdjustments, payload);
    return extractObject(response.data, ['adjustment', 'data']) || response.data;
  },

  updateAdjustment: async (id, payload) => {
    assertAdjustmentId(id, 'cập nhật');
    const response = await axiosClient.put(`${ENDPOINTS.payrollAdjustments}/${id}`, payload);
    return extractObject(response.data, ['adjustment', 'data']) || response.data;
  },

  deleteAdjustment: async (id) => {
    assertAdjustmentId(id, 'xóa');
    const response = await axiosClient.delete(`${ENDPOINTS.payrollAdjustments}/${id}`);
    return response.data;
  },
};

export default payrollAdjustmentService;
