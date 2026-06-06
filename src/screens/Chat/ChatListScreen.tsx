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

interface Conversation {
  id: string;
  partner: {
    id: string;
    username: string;
    avatar: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
}

export default function ChatListScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  // Gọi API get_list_conversation của thầy
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/get_list_conversation', {
        index: 0,
        count: 20,
      });

      if (response.data?.code === '1000') {
        setConversations(response.data?.data || []);
      }
    } catch (error) {
      console.log('Lỗi lấy danh sách chat:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const renderItem = ({ item }: { item: Conversation }) => (
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
          item.partner.avatar === '-1'
            ? { uri: 'https://placehold.co/100x100.png' }
            : { uri: item.partner.avatar }
        }
        style={styles.avatar}
      />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.username}>{item.partner.username}</Text>
          <Text style={styles.time}>10:00</Text>
        </View>
        <Text
          style={[
            styles.lastMessage,
            !item.lastMessage.isRead && styles.unreadText,
          ]}
          numberOfLines={1}
        >
          {item.lastMessage.content}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Đoạn chat</Text>
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchConversations} // Tính năng vuốt để tải lại dữ liệu
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    color: '#000000',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#e4e6eb',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050505',
  },
  time: {
    fontSize: 12,
    color: '#65676b',
  },
  lastMessage: {
    fontSize: 14,
    color: '#65676b',
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#000000',
  },
});
