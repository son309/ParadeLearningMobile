import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { apiClient } from '../../network/apiClient';
import { getSocket } from '../../network/socket';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export default function ChatDetailScreen({ route }: any) {
  const { partnerId, partnerName } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const socket = getSocket();
  const flatListRef = useRef<FlatList>(null);

  // Gọi API get_conversation lấy lịch sử tin nhắn cũ
  const fetchMessageHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/get_conversation', {
        partner_id: partnerId,
        index: 0,
        count: 50,
      });

      if (response.data?.code === '1000') {
        setMessages(response.data?.data?.reverse() || []);
      }
    } catch (error) {
      console.log('Lỗi lấy lịch sử chat:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessageHistory();

    // Lắng nghe Socket realtime
    if (socket) {
      socket.on('new_message', (incomingMessage: any) => {
        if (
          incomingMessage.senderId === partnerId ||
          incomingMessage.receiverId === partnerId
        ) {
          setMessages(prevMessages => [...prevMessages, incomingMessage]);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new_message');
      }
    };
  }, [partnerId, socket]);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const messageContent = inputText.trim();
    setInputText('');

    try {
      // Đánh dấu đã đọc tin nhắn hội thoại này
      await apiClient.post('/set_read_message', { partner_id: partnerId });

      // Gửi realtime qua Socket cho đối phương
      if (socket) {
        socket.emit('send_message', {
          receiverId: partnerId,
          content: messageContent,
        });
      }

      // Cập nhật tin nhắn của chính mình lên giao diện tạm thời
      const myNewMsg: Message = {
        id: String(Date.now()),
        senderId: 'MY_ID',
        content: messageContent,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, myNewMsg]);
    } catch (error) {
      console.log('Lỗi gửi tin nhắn:', error);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMine = item.senderId !== partnerId;
    return (
      <View
        style={[styles.messageRow, isMine ? styles.myRow : styles.partnerRow]}
      >
        <View
          style={[
            styles.bubble,
            isMine ? styles.myBubble : styles.partnerBubble,
          ]}
        >
          <Text style={isMine ? styles.myText : styles.partnerText}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{partnerName}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={{ padding: 16 }}
        refreshing={loading}
        onRefresh={fetchMessageHistory}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#65676b"
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#050505' },
  messageRow: { flexDirection: 'row', marginBottom: 8, width: '100%' },
  myRow: { justifyContent: 'flex-end' },
  partnerRow: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  myBubble: { backgroundColor: '#0084ff' },
  partnerBubble: { backgroundColor: '#e4e6eb' },
  myText: { color: '#ffffff', fontSize: 15 },
  partnerText: { color: '#050505', fontSize: 15 },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e4e6eb',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#000000',
  },
  sendButton: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8 },
  sendButtonText: { color: '#0084ff', fontWeight: 'bold', fontSize: 16 },
});
