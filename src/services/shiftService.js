import axiosClient from './axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { extractArray, extractObject } from '../utils/parseApiData';
import { hasValidId } from '../utils/getEntityId';

function assertShiftId(shiftId, action = 'thao tác') {
  if (!hasValidId(shiftId)) {
    throw new Error(`Không tìm thấy ID ca làm để ${action}`);
  }
}

export const shiftService = {
  getAll: async () => {
    const response = await axiosClient.get(ENDPOINTS.shifts);
    return extractArray(response.data, ['shifts', 'data']);
  },

  getById: async (shiftId) => {
    assertShiftId(shiftId, 'xem chi tiết');
    const response = await axiosClient.get(`${ENDPOINTS.shifts}/${shiftId}`);
    return extractObject(response.data, ['shift', 'data']) || response.data?.data || response.data;
  },

  create: async (payload) => {
    const response = await axiosClient.post(ENDPOINTS.shifts, payload);
    return response.data;
  },

  update: async (shiftId, payload) => {
    assertShiftId(shiftId, 'cập nhật');
    const response = await axiosClient.put(`${ENDPOINTS.shifts}/${shiftId}`, payload);
    return response.data;
  },

  remove: async (shiftId) => {
    assertShiftId(shiftId, 'xóa');
    const response = await axiosClient.delete(`${ENDPOINTS.shifts}/${shiftId}`);
    return response.data;
  },
};

export default shiftService;
