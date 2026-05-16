import { apiClient } from './apiClient';

export const authApi = {
  login: async (phonenumber: string, password: string) => {
    const response = await apiClient.post('/login', {
      phonenumber,
      password,
      devtoken: 'mobile-devtoken',
    });

    return response.data;
  },

  signup: async (
    phonenumber: string,
    password: string,
    role: 'GV' | 'HV',
  ) => {
    const response = await apiClient.post('/signup', {
      phonenumber,
      password,
      role,
      uuid: 'mobile-uuid',
    });

    return response.data;
  },

  logout: async (token: string) => {
    const response = await apiClient.post('/logout', {
      token,
    });

    return response.data;
  },

  getVerifyCode: async (phonenumber: string) => {
    const response = await apiClient.post('/get_verify_code', {
      phonenumber,
    });

    return response.data;
  },

  checkVerifyCode: async (phonenumber: string, code: string) => {
    const response = await apiClient.post('/check_verify_code', {
      phonenumber,
      codeVerify: code,
    });

    return response.data;
  },
};
