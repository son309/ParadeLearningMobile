import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ChatListScreen from '../screens/Chat/ChatListScreen';
import CourseScreen from '../screens/Course/CourseScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import CreatePostScreen from '../screens/Post/CreatePostScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Course" component={CourseScreen} />
      <Tab.Screen name="CreatePost" component={CreatePostScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
