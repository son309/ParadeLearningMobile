import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import MenuScreen from '../screens/Menu/MenuScreen';
import NewPostScreen from '../screens/NewPost/NewPostScreen';
import TeachersEnrollScreen from '../screens/Teachers/TeachersEnrollScreen';
import MainTabNavigator from './MainTabNavigator';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="HomeStack"
        component={MainTabNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="NewPost"
        component={NewPostScreen}
        options={{ tabBarLabel: 'New Post' }}
      />
      <Tab.Screen
        name="Teachers"
        component={TeachersEnrollScreen}
        options={{ tabBarLabel: 'Teachers' }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{ tabBarLabel: 'Menu' }}
      />
    </Tab.Navigator>
  );
}
