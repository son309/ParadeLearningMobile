import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type User = {
  id: string;
  username?: string;
  avatar?: string;
  role?: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  isRestoring: boolean;

  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>(set => ({
  token: null,
  user: null,
  isLoggedIn: false,
  isRestoring: true,

  login: async (token, user) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    set({
      token,
      user,
      isLoggedIn: true,
    });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');

    set({
      token: null,
      user: null,
      isLoggedIn: false,
    });
  },

  restoreSession: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userString = await AsyncStorage.getItem('user');

      if (token && userString) {
        set({
          token,
          user: JSON.parse(userString),
          isLoggedIn: true,
          isRestoring: false,
        });
        return;
      }

      set({
        token: null,
        user: null,
        isLoggedIn: false,
        isRestoring: false,
      });
    } catch {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      set({
        token: null,
        user: null,
        isLoggedIn: false,
        isRestoring: false,
      });
    }
  },
}));