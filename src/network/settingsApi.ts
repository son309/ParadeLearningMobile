import { apiClient } from './apiClient';

const unwrapResponse = (payload: any) => {
    const code = payload?.code;
    if (code !== undefined && code !== '1000' && code !== 1000) {
        const message = payload?.message || 'Request failed';
        throw new Error(message);
    }

    return payload?.data ?? payload;
};

export const settingsApi = {
    getPushSettings: async (token: string) => {
        const response = await apiClient.post('/get_push_settings', { token });
        return unwrapResponse(response.data);
    },

    setPushSettings: async (params: {
        token: string;
        likeComment?: string;
        fromFriends?: string;
        requestedFriend?: string;
        suggestedFriend?: string;
        birthday?: string;
        video?: string;
        report?: string;
        soundOn?: string;
        notificationOn?: string;
        vibrantOn?: string;
        ledOn?: string;
    }) => {
        const response = await apiClient.post('/set_push_settings', params);
        return unwrapResponse(response.data);
    },
};
