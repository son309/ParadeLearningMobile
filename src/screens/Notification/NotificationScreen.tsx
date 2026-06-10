import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../network/apiClient';
import { getSocket } from '../../network/socket';
import { timeAgoVi } from '../../utils/timeAgo';

interface NotificationItem {
  type: string;
  objectId: string;
  title: string;
  notificationId: string;
  created: string;
  avatar: string;
  group: string;
  read: string; // '0' = chưa đọc, '1' = đã đọc
}

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const socket = getSocket();
  const navigation = useNavigation<any>();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/get_notification', {
        index: '0',
        count: '20',
      });

      if (response.data?.code === '1000' || response.data?.code === 1000) {
        setNotifications(response.data?.data?.data || []);
      }
    } catch (error) {
      console.log('Lỗi lấy danh sách thông báo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on('push_notification', (payload: any) => {
        const newNotif: NotificationItem = {
          type: payload.type ?? 'home',
          objectId: payload.object_id ?? payload.objectId ?? '0',
          title: payload.title ?? '',
          notificationId: payload.notificationId ?? '',
          created: payload.created ?? new Date().toISOString(),
          avatar: payload.avatar ?? '',
          group: payload.group ?? '1',
          read: '0',
        };
        if (newNotif.notificationId) {
          setNotifications(prev => [newNotif, ...prev]);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('push_notification');
      }
    };
  }, [socket]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await apiClient.post('/set_read_notification', {
        notificationId,
      });
      if (response.data?.code === '1000' || response.data?.code === 1000) {
        setNotifications(prev =>
          prev.map(item =>
            item.notificationId === notificationId
              ? { ...item, read: '1' }
              : item,
          ),
        );
      }
    } catch (error) {
      console.log('Lỗi đọc thông báo:', error);
    }
  };

  const handlePress = async (item: NotificationItem) => {
    if (item.read === '0') {
      await handleMarkAsRead(item.notificationId);
    }

    if (item.type === 'message' && item.objectId && item.objectId !== '0') {
      navigation.navigate('ChatTab', {
        screen: 'ChatDetailScreen',
        params: { conversationId: item.objectId, partnerName: '' },
      });
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const isUnread = item.read === '0';
    const avatarUri =
      item.avatar && item.avatar !== 'app_icon' && item.avatar !== '-1'
        ? { uri: item.avatar }
        : { uri: 'https://placehold.co/100x100.png' };

    return (
      <TouchableOpacity
        style={[styles.notifItem, isUnread && styles.unreadItem]}
        onPress={() => handlePress(item)}
      >
        <Image source={avatarUri} style={styles.avatar} />
        <View style={styles.notifContent}>
          <Text style={[styles.notifText, isUnread && styles.unreadText]}>
            {item.title}
          </Text>
          <Text style={styles.timeText}>{timeAgoVi(item.created)}</Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Thông báo</Text>
      <FlatList
        data={notifications}
        keyExtractor={item => item.notificationId}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchNotifications}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    color: '#000000',
  },
  notifItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  unreadItem: { backgroundColor: '#e7f3ff' },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e4e6eb',
  },
  notifContent: { flex: 1, marginLeft: 12, paddingRight: 8 },
  notifText: { fontSize: 15, color: '#050505', lineHeight: 20 },
  unreadText: { fontWeight: 'bold', color: '#000000' },
  timeText: { fontSize: 12, color: '#65676b', marginTop: 4 },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1877f2',
  },
});
