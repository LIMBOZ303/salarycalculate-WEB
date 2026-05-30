import axiosClient from './axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { extractArray } from '../utils/parseApiData';
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
};

export default attendanceService;
