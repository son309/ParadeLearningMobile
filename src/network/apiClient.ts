import axios from 'axios';
import { CONFIG } from '../constants/config';
import { storage } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  const token = storage.getString('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    const code = error?.response?.data?.code;

    if (code === '9997' || code === '9998' || code === 9997 || code === 9998) {
      storage.remove('token');
      storage.remove('user');
    }

    console.log('API Error:', error?.response?.data || error.message);

    return Promise.reject(error);
  },
);
