import { apiClient } from './apiClient';

const unwrapResponse = (payload: any) => {
  const code = payload?.code;
  if (code !== undefined && code !== '1000' && code !== 1000) {
    const message = payload?.message || 'Request failed';
    throw new Error(message);
  }

  return payload?.data ?? payload;
};

export const userApi = {
  getUserInfo: async (params: { token: string; userId?: string }) => {
    const response = await apiClient.post('/get_user_info', params);
    return unwrapResponse(response.data);
  },

  setUserInfo: async (params: {
    token: string;
    username?: string;
    avatar?: string;
    coverImage?: string;
    description?: string;
    link?: string;
    address?: string;
    city?: string;
    country?: string;
  }) => {
    const response = await apiClient.post('/set_user_info', params);
    return unwrapResponse(response.data);
  },

  setAvatar: async (token: string, image: { uri: string; type: string; name: string }) => {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('avatar', image as any);

    const response = await apiClient.post('/set_user_info', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapResponse(response.data);
  },

  setBlock: async (params: {
    token: string;
    userId: string;
    type: '0' | '1';
  }) => {
    const response = await apiClient.post('/set_block', params);
    return unwrapResponse(response.data);
  },

  // GET /users — trả về tất cả users, lọc GV ở client
  getAllUsers: async () => {
    const response = await apiClient.get('/users');
    return unwrapResponse(response.data);
  },

  // Danh sách người dùng đã chặn
  getListBlocks: async (params: {
    token: string;
    index?: string;
    count?: string;
  }) => {
    const response = await apiClient.post('/get_list_blocks', params);
    return unwrapResponse(response.data);
  },
};
