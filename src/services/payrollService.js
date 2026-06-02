import axiosClient from './axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { extractArray, extractObject } from '../utils/parseApiData';
import { hasValidId } from '../utils/getEntityId';

function assertPayrollId(payrollId, action = 'thao tác') {
  if (!hasValidId(payrollId)) {
    throw new Error(`ID bảng lương không hợp lệ để ${action}`);
  }
}

function normalizePayroll(payroll) {
  if (!payroll || typeof payroll !== 'object') return payroll;

  return {
    ...payroll,
    bonus: payroll.totalBonus ?? payroll.bonus ?? 0,
    netPay:
      payroll.payableAmount ??
      payroll.netPay ??
      payroll.payable ??
      payroll.totalPayable ??
      payroll.actualPay ??
      0,
  };
}

export const payrollService = {
  getPayrolls: async (params) => {
    const response = await axiosClient.get(ENDPOINTS.payrolls, { params });
    return extractArray(response.data, ['payrolls', 'data']).map(normalizePayroll);
  },

  getPayrollById: async (id) => {
    assertPayrollId(id, 'xem chi tiết');
    const response = await axiosClient.get(`${ENDPOINTS.payrolls}/${id}`);
    return normalizePayroll(extractObject(response.data, ['payroll', 'data']) || response.data?.data || response.data);
  },

  calculatePayroll: async (payload) => {
    const response = await axiosClient.post(`${ENDPOINTS.payrolls}/calculate`, payload);
    return response.data;
  },

  confirmPayroll: async (id) => {
    assertPayrollId(id, 'chốt lương');
    const response = await axiosClient.post(`${ENDPOINTS.payrolls}/${id}/confirm`);
    return response.data;
  },

  payPayroll: async (id, payload = {}) => {
    assertPayrollId(id, 'thanh toán');
    const response = await axiosClient.post(`${ENDPOINTS.payrolls}/${id}/pay`, payload);
    return response.data;
  },

  updatePayroll: async (id, payload) => {
    assertPayrollId(id, 'cập nhật');
    const response = await axiosClient.put(`${ENDPOINTS.payrolls}/${id}`, payload);
    return response.data;
  },

  deletePayroll: async (id) => {
    assertPayrollId(id, 'xóa');
    const response = await axiosClient.delete(`${ENDPOINTS.payrolls}/${id}`);
    return response.data;
  },

  getMonthlyPayrollSummary: async (params) => {
    const response = await axiosClient.get(`${ENDPOINTS.payrolls}/summary/monthly`, { params });
    return extractObject(response.data, ['summary', 'data']) || response.data?.data || response.data;
  },

  getMyPayroll: async (params) => {
    const response = await axiosClient.get(`${ENDPOINTS.payrolls}/me`, { params });
    return extractObject(response.data, ['payroll', 'data']) || response.data?.data || response.data;
  },
};

export default payrollService;
