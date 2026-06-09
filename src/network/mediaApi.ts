import { apiClient } from './apiClient';
import type { VideoUploadResult } from '../types/media';

// Helper

const unwrapResponse = (payload: any) => {
  const code = payload?.code;
  if (code !== undefined && code !== '1000' && code !== 1000) {
    const message = payload?.message || 'Upload thất bại';
    throw new Error(message);
  }
  return payload?.data ?? payload;
};

// Media API
export const mediaApi = {
  /**
   *
   * @param frontVideoUri  - URI video góc trước (camera trước)
   * @param backVideoUri   - URI video góc sau (camera sau)
   * @param token          - Auth token
   * @param onProgress     - Callback tiến trình upload 0–100
   *
   * TODO: Khi Backend xác nhận tên param cho video 2 góc,
   *       cập nhật 'video_front' và 'video_back' cho đúng.
   *       Hiện tại tạm dùng 'video' cho góc trước và 'video_back' cho góc sau.
   */
  uploadDualVideo: async (
    frontVideoUri: string,
    backVideoUri: string,
    token: string,
    onProgress?: (percent: number) => void,
  ): Promise<VideoUploadResult> => {
    const formData = new FormData();

    // Lấy tên file từ URI
    const frontFileName = frontVideoUri.split('/').pop() ?? 'front_video.mp4';
    const backFileName = backVideoUri.split('/').pop() ?? 'back_video.mp4';

    // Append video góc trước
    formData.append('video', {
      uri: frontVideoUri,
      name: frontFileName,
      type: 'video/mp4',
    } as any);

    // Append video góc sau
    // TODO: Xác nhận tên parameter với Backend
    formData.append('video_back', {
      uri: backVideoUri,
      name: backFileName,
      type: 'video/mp4',
    } as any);

    formData.append('token', token);

    const response = await apiClient.post('/upload_video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: event => {
        if (onProgress && event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        }
      },
      // Upload video có thể lâu – tăng timeout lên 5 phút
      timeout: 300_000,
    });

    return unwrapResponse(response.data) as VideoUploadResult;
  },

  // Upload 1 video (fallback khi chỉ có 1 góc).
  uploadSingleVideo: async (
    videoUri: string,
    token: string,
    onProgress?: (percent: number) => void,
  ): Promise<VideoUploadResult> => {
    const formData = new FormData();
    const fileName = videoUri.split('/').pop() ?? 'video.mp4';

    formData.append('video', {
      uri: videoUri,
      name: fileName,
      type: 'video/mp4',
    } as any);

    formData.append('token', token);

    const response = await apiClient.post('/upload_video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: event => {
        if (onProgress && event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        }
      },
      timeout: 300_000,
    });

    return unwrapResponse(response.data) as VideoUploadResult;
  },
};
