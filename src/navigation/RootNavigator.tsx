import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { useAuthStore } from '../store/authStore';
import { connectSocket, disconnectSocket } from '../network/socket';

export default function RootNavigator() {
  const { isLoggedIn, user, restoreSession, logout } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      connectSocket(user.id, () => {
        logout();
        disconnectSocket();
      });
    } else {
      disconnectSocket();
    }
  }, [isLoggedIn, user?.id, logout]);

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}