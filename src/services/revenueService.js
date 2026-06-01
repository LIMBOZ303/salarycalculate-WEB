import axiosClient from './axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { extractArray, extractObject } from '../utils/parseApiData';
import { hasValidId } from '../utils/getEntityId';

function assertRevenueId(revenueId, action = 'thao tác') {
  if (!hasValidId(revenueId)) {
    throw new Error('ID doanh thu không hợp lệ');
  }
}

export const revenueService = {
  getRevenues: async (params) => {
    const response = await axiosClient.get(ENDPOINTS.revenues, { params });
    return extractArray(response.data, ['revenues', 'data']);
  },

  getRevenueById: async (id) => {
    assertRevenueId(id, 'xem chi tiết');
    const response = await axiosClient.get(`${ENDPOINTS.revenues}/${id}`);
    return extractObject(response.data, ['revenue', 'data']) || response.data?.data || response.data;
  },

  createRevenue: async (payload) => {
    const response = await axiosClient.post(ENDPOINTS.revenues, payload);
    return response.data;
  },

  updateRevenue: async (id, payload) => {
    assertRevenueId(id, 'cập nhật');
    // Must be PUT /api/revenues/:id (never /undefined)
    const response = await axiosClient.put(`/api/revenues/${id}`, payload);
    return response.data;
  },

  deleteRevenue: async (id) => {
    assertRevenueId(id, 'xóa');
    const response = await axiosClient.delete(`${ENDPOINTS.revenues}/${id}`);
    return response.data;
  },

  confirmRevenue: async (id) => {
    assertRevenueId(id, 'xác nhận');
    const response = await axiosClient.post(`${ENDPOINTS.revenues}/${id}/confirm`);
    return response.data;
  },

  getMonthlySummary: async (params) => {
    const response = await axiosClient.get(`${ENDPOINTS.revenues}/summary/monthly`, { params });
    return extractObject(response.data, ['summary', 'data']) || response.data?.data || response.data;
  },

  getQuarterlySummary: async (params) => {
    const response = await axiosClient.get(`${ENDPOINTS.revenues}/summary/quarterly`, { params });
    return extractObject(response.data, ['summary', 'data']) || response.data?.data || response.data;
  },
};

export default revenueService;
