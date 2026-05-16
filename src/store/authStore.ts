import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';

export const storage = createMMKV();

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

  login: (token: string, user: User) => void;
  logout: () => void;
  restoreSession: () => void;
};

export const useAuthStore = create<AuthState>(set => ({
  token: null,
  user: null,
  isLoggedIn: false,

  login: (token, user) => {
    storage.set('token', token);
    storage.set('user', JSON.stringify(user));

    set({
      token,
      user,
      isLoggedIn: true,
    });
  },

  logout: () => {
    storage.remove('token');
    storage.remove('user');

    set({
      token: null,
      user: null,
      isLoggedIn: false,
    });
  },

  restoreSession: () => {
    const token = storage.getString('token');
    const userString = storage.getString('user');

    if (token && userString) {
      set({
        token,
        user: JSON.parse(userString),
        isLoggedIn: true,
      });
    }
  },
}));
