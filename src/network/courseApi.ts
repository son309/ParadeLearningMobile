import { apiClient } from './apiClient';

const unwrapResponse = (payload: any) => {
  const code = payload?.code;
  if (code !== undefined && code !== '1000' && code !== 1000) {
    const message = payload?.message || 'Request failed';
    throw new Error(message);
  }

  return payload?.data ?? payload;
};

export const courseApi = {
  // Danh sách GV users (không phụ thuộc vào bài đăng) + trạng thái enrolled/requested
  getListTeachers: async (params: {
    token: string;
    index: string;
    count: string;
  }) => {
    const response = await apiClient.post('/get_list_teachers', params);
    return unwrapResponse(response.data);
  },

  // Danh sách giáo viên kèm trạng thái is_enrolled / is_requested của học sinh
  getListCourses: async (params: {
    token: string;
    index: string;
    count: string;
  }) => {
    const response = await apiClient.post('/get_list_courses', params);
    return unwrapResponse(response.data);
  },

  getRequestedEnrollment: async (params: {
    token: string;
    index: string;
    count: string;
    user_id?: string;
  }) => {
    const response = await apiClient.post('/get_requested_enrollment', params);
    return unwrapResponse(response.data);
  },

  setApproveEnrollment: async (params: {
    token: string;
    user_id: string;
    is_accept: '0' | '1';
  }) => {
    const response = await apiClient.post('/set_approve_enrollment', params);
    return unwrapResponse(response.data);
  },

  getListStudents: async (params: {
    token: string;
    index: string;
    count: string;
    user_id?: string;
  }) => {
    const response = await apiClient.post('/get_list_students', params);
    return unwrapResponse(response.data);
  },

  setRequestCourse: async (params: {
    token: string;
    course_id: string;
    user_id: string;
  }) => {
    const response = await apiClient.post('/set_request_course', params);
    return unwrapResponse(response.data);
  },

  getListCoursesOfStudent: async (params: {
    token: string;
    index: string;
    count: string;
    user_id: string;
  }) => {
    const response = await apiClient.post(
      '/get_list_courses_of_student',
      params,
    );
    return unwrapResponse(response.data);
  },
};
