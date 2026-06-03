import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { useAuthStore } from '../store/authStore';
import { connectSocket, disconnectSocket } from '../network/socket';
import { VideoPickerScreen, AIResultScreen } from '../screens/CameraModule';
import UserProfileScreen from '../screens/Profile/UserProfileScreen';
import BlockedUsersScreen from '../screens/Menu/BlockedUsersScreen';

const RootStack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
      <RootStack.Screen
        name="VideoPickerScreen"
        component={VideoPickerScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <RootStack.Screen
        name="AIResultScreen"
        component={AIResultScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <RootStack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <RootStack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </RootStack.Navigator>
  );
}

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
      {isLoggedIn ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}