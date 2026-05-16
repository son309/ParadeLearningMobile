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
  }

  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const code = error?.response?.data?.code;

    if (code === '9997' || code === '9998' || code === 9997 || code === 9998) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }

    console.log('API Error:', error?.response?.data || error.message);

    return Promise.reject(error);
  },
);