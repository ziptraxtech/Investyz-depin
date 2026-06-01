import axios from 'axios';
import { getFrontendApiUrl } from './apiConfig';

let authContextProvider = null;

const encodeHeaderValue = (value) => {
  if (!value) return '';
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const apiClient = axios.create({
  baseURL: getFrontendApiUrl(),
  withCredentials: true,
  timeout: 20000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('investyz_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  if (authContextProvider) {
    const authContext = await authContextProvider();
    if (authContext?.token) {
      config.headers.Authorization = `Bearer ${authContext.token}`;
    }
    if (authContext?.user) {
      config.headers['X-Clerk-User-Data'] = encodeHeaderValue(authContext.user);
    }
  }

  return config;
});

export const setApiAuthProvider = (provider) => {
  authContextProvider = provider;
};

export const unwrap = (response) => response.data?.data ?? response.data;

export default apiClient;
