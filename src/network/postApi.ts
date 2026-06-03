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
  // Tạo bài đăng (GV tạo bài tập, hoặc HV nộp bài)
  // GV: chỉ cần left_video + right_video + described (tuỳ chọn)
  // HV: bắt buộc exerciseId + courseId thêm vào
  addPost: async (params: {
    token: string;
    leftVideoUri: string;
    rightVideoUri: string;
    described?: string;
    exerciseId?: string;  // HV: ID bài đăng của GV
    courseId?: string;    // HV: ID user của GV
    onProgress?: (percent: number) => void;
  }) => {
    const formData = new FormData();

    const leftName = params.leftVideoUri.split('/').pop() ?? 'left_video.mp4';
    const rightName = params.rightVideoUri.split('/').pop() ?? 'right_video.mp4';

    formData.append('token', params.token);
    formData.append('left_video', {
      uri: params.leftVideoUri,
      name: leftName,
      type: 'video/mp4',
    } as any);
    formData.append('right_video', {
      uri: params.rightVideoUri,
      name: rightName,
      type: 'video/mp4',
    } as any);
    // device_master là trường bắt buộc theo AddPostDto (IsNotEmpty)
    // left_video tương ứng với góc chính (master), right_video là góc phụ (slave)
    formData.append('device_master', 'front');
    formData.append('device_slave', 'back');
    if (params.exerciseId) {
      formData.append('exercise_id', params.exerciseId);
    }
    if (params.courseId) {
      formData.append('course_id', params.courseId);
    }
    if (params.described) {
      formData.append('described', params.described);
    }

    const response = await apiClient.post('/add_post', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300_000,
      onUploadProgress: event => {
        if (params.onProgress && event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          params.onProgress(percent);
        }
      },
    });
    return unwrapResponse(response.data);
  },

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

  // Bình luận thường hoặc chấm điểm của giáo viên
  // Chỉ được gửi MỘT trong hai: comment HOẶC score (server validate)
  setComment: async (params: {
    token: string;
    id: string;
    comment?: string;          // bình luận thường
    score?: string;            // điểm chấm (GV) — '0' đến '100'
    detail_mistakes?: string;  // ghi chú lỗi kỹ thuật (GV)
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
    user_id?: string;
    index: string;
    count: string;
  }) => {
    const response = await apiClient.post('/search', params);
    return unwrapResponse(response.data);
  },
};
