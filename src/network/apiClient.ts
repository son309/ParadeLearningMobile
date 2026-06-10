import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CONFIG } from '../constants/config';

export const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    if (config.method?.toUpperCase() === 'POST' && !(config.data instanceof FormData)) {
      if (!config.data) {
        config.data = { token };
      } else if (typeof config.data === 'string') {
        try {
          const parsed = JSON.parse(config.data);
          if (!parsed.token) parsed.token = token;
          config.data = JSON.stringify(parsed);
        } catch(e) {}
      } else if (typeof config.data === 'object') {
        if (!config.data.token) {
          config.data.token = token;
        }
      }
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const code = error?.response?.data?.code;

    if (code === '9997' || code === '9998' || code === 9997 || code === 9998) {
      await AsyncStorage.multiRemove(['token', 'user']);
      const { useAuthStore } = require('../store/authStore');
      useAuthStore.getState().logout();
    }

    console.log('API Error:', error?.response?.data || error.message);

    return Promise.reject(error);
  },
);