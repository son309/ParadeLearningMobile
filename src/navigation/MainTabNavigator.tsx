import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/Home/HomeScreen';
import CourseScreen from '../screens/Course/CourseScreen';
import CreatePostScreen from '../screens/Post/CreatePostScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

// Import các màn hình bạn phụ trách
import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatDetailScreen from '../screens/Chat/ChatDetailScreen';
import NotificationScreen from '../screens/Notification/NotificationScreen';

const Tab = createBottomTabNavigator();
const ChatStack = createNativeStackNavigator();

// Cụm điều hướng Stack riêng cho Chat để khi nhắn tin chi tiết sẽ tràn toàn màn hình
function ChatStackNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatListScreen" component={ChatListScreen} />
      <ChatStack.Screen name="ChatDetailScreen" component={ChatDetailScreen} />
    </ChatStack.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Course" component={CourseScreen} />
      <Tab.Screen name="CreatePost" component={CreatePostScreen} />

      {/* Tab điều hướng cụm Chat */}
      <Tab.Screen
        name="ChatTab"
        component={ChatStackNavigator}
        options={{ title: 'Chat' }}
      />

      {/* Tab điều hướng Thông báo */}
      <Tab.Screen name="Notification" component={NotificationScreen} />

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
