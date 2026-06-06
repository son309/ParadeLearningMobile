import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { apiClient } from '../../network/apiClient';
import { getSocket } from '../../network/socket';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  avatar: string;
}

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const socket = getSocket();

  // Gọi API get_notification đồng bộ dữ liệu cũ
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/get_notification', {
        index: 0,
        count: 20,
      });

      if (response.data?.code === '1000') {
        setNotifications(response.data?.data || []);
      }
    } catch (error) {
      console.log('Lỗi lấy danh sách thông báo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Nghe thông báo Realtime từ socket nhóm làm sẵn
    if (socket) {
      socket.on('push_notification', (newNotification: any) => {
        setNotifications(prevNotifs => [newNotification, ...prevNotifs]);
      });
    }

    return () => {
      if (socket) {
        socket.off('push_notification');
      }
    };
  }, [socket]);

  // Đánh dấu đã đọc thông báo khi người dùng nhấn vào
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await apiClient.post('/set_read_notification', {
        notification_id: notificationId,
      });
      if (response.data?.code === '1000') {
        setNotifications(prev =>
          prev.map(item =>
            item.id === notificationId ? { ...item, isRead: true } : item,
          ),
        );
      }
    } catch (error) {
      console.log('Lỗi đọc thông báo:', error);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notifItem, !item.isRead && styles.unreadItem]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <Image
        source={
          item.avatar === '-1'
            ? { uri: 'https://placehold.co/100x100.png' }
            : { uri: item.avatar }
        }
        style={styles.avatar}
      />
      <View style={styles.notifContent}>
        <Text style={[styles.notifText, !item.isRead && styles.unreadText]}>
          <Text style={styles.boldText}>{item.title} </Text>
          {item.content}
        </Text>
        <Text style={styles.timeText}>Vừa xong</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Thông báo</Text>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
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
  boldText: { fontWeight: 'bold' },
  unreadText: { color: '#000000' },
  timeText: { fontSize: 12, color: '#65676b', marginTop: 4 },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1877f2',
  },
});
