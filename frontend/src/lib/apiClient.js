import axios from 'axios';
import { getFrontendApiUrl } from './apiConfig';

const apiClient = axios.create({
  baseURL: getFrontendApiUrl(),
  withCredentials: true,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('investyz_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const unwrap = (response) => response.data?.data ?? response.data;

export default apiClient;
