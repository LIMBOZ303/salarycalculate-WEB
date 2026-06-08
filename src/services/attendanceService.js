import axiosClient from './axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { extractArray, extractObject } from '../utils/parseApiData';
import { hasValidId } from '../utils/getEntityId';

function assertAttendanceId(attendanceId, action = 'thao tác') {
  if (!hasValidId(attendanceId)) {
    throw new Error(`Không tìm thấy ID bản công để ${action}`);
  }
}

export const attendanceService = {
  getAll: async (params) => {
    const response = await axiosClient.get(ENDPOINTS.attendance, { params });
    return extractArray(response.data, ['attendances', 'attendance', 'data']);
  },

  getSuspicious: async () => {
    const response = await axiosClient.get(`${ENDPOINTS.attendance}/suspicious`);
    return extractArray(response.data, ['attendances', 'attendance', 'data']);
  },

  update: async (attendanceId, payload) => {
    assertAttendanceId(attendanceId, 'cập nhật');
    const response = await axiosClient.put(`${ENDPOINTS.attendance}/${attendanceId}`, payload);
    return response.data;
  },

  lock: async (attendanceId) => {
    assertAttendanceId(attendanceId, 'khóa');
    const response = await axiosClient.post(`${ENDPOINTS.attendance}/${attendanceId}/lock`);
    return response.data;
  },

  getMyToday: async () => {
    const response = await axiosClient.get(ENDPOINTS.attendanceMe.today);
    return response.data;
  },

  checkIn: async (payload) => {
    const response = await axiosClient.post(ENDPOINTS.attendanceMe.checkIn, payload);
    return extractObject(response.data, ['attendance', 'data']) || response.data?.data || response.data;
  },

  checkOut: async (payload) => {
    const response = await axiosClient.post(ENDPOINTS.attendanceMe.checkOut, payload);
    return extractObject(response.data, ['attendance', 'data']) || response.data?.data || response.data;
  },

  getMyHistory: async (params) => {
    const response = await axiosClient.get(ENDPOINTS.attendanceMe.history, { params });
    return extractArray(response.data, ['attendances', 'attendance', 'history', 'data']);
  },

  getMySummary: async (params) => {
    const response = await axiosClient.get(ENDPOINTS.attendanceMe.summary, { params });
    return extractObject(response.data, ['summary', 'attendance', 'data']) || response.data?.data || response.data;
  },
};

export default attendanceService;
