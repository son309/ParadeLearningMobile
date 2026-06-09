import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/Home/HomeScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import CourseScreen from '../screens/Course/CourseScreen';
import { theme } from '../constants/theme';

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

type TabIconProps = {
  emoji: string;
  label: string;
  focused: boolean;
  badgeCount?: number;
};

function TabIcon({ emoji, label, focused, badgeCount }: TabIconProps) {
  return (
    <View style={tabStyles.iconWrapper}>
      <View
        style={[
          tabStyles.iconContainer,
          focused && tabStyles.iconContainerActive,
        ]}
      >
        <Text style={tabStyles.emoji}>{emoji}</Text>
        {badgeCount ? (
          <View style={tabStyles.badge}>
            <Text style={tabStyles.badgeText}>{badgeCount}</Text>
          </View>
        ) : null}
      </View>
      {focused && <View style={tabStyles.indicator} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    paddingTop: 6,
    width: 60,
  },
  iconContainer: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconContainerActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  emoji: {
    fontSize: 22,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: 40,
    backgroundColor: theme.colors.primary,
    borderRadius: 1.5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
});

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Trang chủ" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" label="Tìm kiếm" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CourseScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📚" label="Khóa học" focused={focused} />
          ),
        }}
      />

      {/* Tab Chat của bạn đã được gắn icon giao diện chuẩn của nhóm */}
      <Tab.Screen
        name="ChatTab"
        component={ChatStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💬" label="Chat" focused={focused} />
          ),
        }}
      />

      {/* Tab Thông báo của bạn đã được gắn icon giao diện chuẩn của nhóm */}
      <Tab.Screen
        name="Notification"
        component={NotificationScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔔" label="Thông báo" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Cá nhân" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.divider,
    height: 56,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 8,
  },
});
