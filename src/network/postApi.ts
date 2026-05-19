import { apiClient } from './apiClient';

const unwrapResponse = (payload: any) => {
  const code = payload?.code;
  if (code !== undefined && code !== '1000' && code !== 1000) {
    const message = payload?.message || 'Request failed';
    throw new Error(message);
  }

  return payload?.data ?? payload;
};

export const postApi = {
  getListPosts: async (params: {
    token: string;
    index: string;
    count: string;
    last_id?: string;
    user_id?: string;
  }) => {
    const response = await apiClient.post('/get_list_posts', params);
    return unwrapResponse(response.data);
  },

  likePost: async (params: { token: string; id: string }) => {
    const response = await apiClient.post('/like_post', params);
    return unwrapResponse(response.data);
  },

  getComments: async (params: {
    token: string;
    id: string;
    index: string;
    count: string;
  }) => {
    const response = await apiClient.post('/get_comment', params);
    return unwrapResponse(response.data);
  },

  setComment: async (params: {
    token: string;
    id: string;
    comment: string;
    index: string;
    count: string;
  }) => {
    const response = await apiClient.post('/set_comment', params);
    return unwrapResponse(response.data);
  },

  deletePost: async (id: string) => {
    const response = await apiClient.delete(`/delete_post/${id}`);
    return unwrapResponse(response.data);
  },

  editPost: async (params: {
    token: string;
    id: string;
    described: string;
  }) => {
    const response = await apiClient.post('/edit_post', params);
    return unwrapResponse(response.data);
  },

  searchPosts: async (params: {
    token: string;
    keyword: string;
    user_id: string;
    index: string;
    count: string;
  }) => {
    const response = await apiClient.post('/search', params);
    return unwrapResponse(response.data);
  },

  addPost: async (params: {
    token: string;
    described: string;
    device_slave: string;
    device_master?: string;
    course_id?: string;
    exercise_id?: string;
  }) => {
    const form = new FormData();
    form.append("token", params.token);
    form.append("described", params.described);
    form.append("device_slave", params.device_slave);
    if (params.device_master) {
      form.append("device_master", params.device_master);
    }
    if (params.course_id) {
      form.append("course_id", params.course_id);
    }
    if (params.exercise_id) {
      form.append("exercise_id", params.exercise_id);
    }

    const response = await apiClient.post("/add_post", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return unwrapResponse(response.data);
  },
};
