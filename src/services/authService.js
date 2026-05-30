import axiosClient from './axiosClient';
import { ENDPOINTS, TOKEN_KEY } from '../config/apiConfig';

export const authService = {
  login: async (email, password) => {
    const response = await axiosClient.post(ENDPOINTS.auth.login, { email, password });
    const data = response.data?.data ?? response.data;
    if (data?.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    return data;
  },

  me: async () => {
    const response = await axiosClient.get(ENDPOINTS.auth.me);
    return response.data?.data ?? response.data;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),
};

export default authService;
