import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../network/apiClient';
import { timeAgoVi } from '../../utils/timeAgo';

interface Conversation {
  id: string;
  partner: {
    id: string;
    username: string;
    avatar: string;
  };
  lastmessage: {
    message: string;
    created: string;
    unread: string;
  } | null;
  created: string;
}

export default function ChatListScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/get_list_conversation', {
        index: '0',
        count: '20',
      });

      if (response.data?.code === '1000' || response.data?.code === 1000) {
        setConversations(response.data?.data?.data || []);
      }
    } catch (error) {
      console.log('Lỗi lấy danh sách chat:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations]),
  );

  const renderItem = ({ item }: { item: Conversation }) => {
    const displayMessage = item.lastmessage?.message || '';
    const isUnread = item.lastmessage?.unread === '1';
    const timeText = timeAgoVi(item.lastmessage?.created || item.created);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          navigation.navigate('ChatDetailScreen', {
            partnerId: item.partner.id,
            partnerName: item.partner.username,
          })
        }
      >
        <Image
          source={
            item.partner.avatar === '-1' || !item.partner.avatar
              ? { uri: 'https://placehold.co/100x100.png' }
              : { uri: item.partner.avatar }
          }
          style={styles.avatar}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.username}>{item.partner.username}</Text>
            <Text style={styles.time}>{timeText}</Text>
          </View>
          <Text
            style={[styles.lastMessage, isUnread && styles.unreadText]}
            numberOfLines={1}
          >
            {displayMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Đoạn chat</Text>
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchConversations}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
              <Text style={styles.emptyDesc}>
                Vào trang cá nhân của ai đó và bấm "Nhắn tin" để bắt đầu.
              </Text>
            </View>
          ) : null
        }
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
  chatItem: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#e4e6eb',
  },
  chatInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  username: { fontSize: 16, fontWeight: '600', color: '#050505' },
  time: { fontSize: 12, color: '#65676b' },
  lastMessage: { fontSize: 14, color: '#65676b' },
  unreadText: { fontWeight: 'bold', color: '#000000' },
  separator: {
    height: 0.5,
    backgroundColor: '#f0f2f5',
    marginLeft: 83,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#050505',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#65676b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
