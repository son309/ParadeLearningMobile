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
import { useAuthStore } from '../../store/authStore';

interface Message {
  messageId: string;
  message: string;
  created: string;
  unread: string;
  sender: {
    id: string;
    username: string;
    avatar: string;
  };
}

export default function ChatDetailScreen({ route }: any) {
  const {
    partnerId: routePartnerId,
    partnerName: routePartnerName,
    conversationId: routeConversationId,
  } = route.params ?? {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [partnerName, setPartnerName] = useState<string>(routePartnerName || '');
  const [conversationId, setConversationId] = useState<string>(routeConversationId || '');
  const [partnerId, setPartnerId] = useState<string>(routePartnerId || '');

  const socket = getSocket();
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuthStore();

  const fetchMessageHistory = async () => {
    try {
      setLoading(true);
      const body: Record<string, string> = { index: '0', count: '50' };
      if (routeConversationId) {
        body.conversationId = routeConversationId;
      } else if (routePartnerId) {
        body.partnerId = routePartnerId;
      }

      const response = await apiClient.post('/get_conversation', body);

      if (response.data?.code === '1000' || response.data?.code === 1000) {
        const conv = response.data?.data?.conversation;
        const msgs: Message[] = response.data?.data?.data || [];

        if (conv) {
          if (conv.id) setConversationId(conv.id);
          if (!partnerName && conv.partner?.username) setPartnerName(conv.partner.username);
          if (!partnerId && conv.partner?.id) setPartnerId(conv.partner.id);
          socket?.emit('joinchat', { conversationId: conv.id });
        }

        setMessages(msgs);
      }
    } catch (error) {
      console.log('Lỗi lấy lịch sử chat:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessageHistory();

    const readBody: Record<string, string> = {};
    if (routeConversationId) readBody.conversationId = routeConversationId;
    else if (routePartnerId) readBody.partnerId = routePartnerId;
    if (Object.keys(readBody).length > 0) {
      apiClient.post('/set_read_message', readBody).catch(() => {});
    }

    if (socket) {
      socket.on('onmessage', (incomingMsg: any) => {
        const newMsg: Message = {
          messageId: incomingMsg.message_id,
          message: incomingMsg.content,
          created: incomingMsg.created,
          unread: '0',
          sender: {
            id: incomingMsg.sender?.id ?? '',
            username: incomingMsg.sender?.name ?? '',
            avatar: incomingMsg.sender?.avatar ?? '',
          },
        };
        setMessages(prev => [...prev, newMsg]);
      });

      socket.on('deletemessage', (data: any) => {
        const deletedId = data.message_id;
        setMessages(prev =>
          prev.map(m => (m.messageId === deletedId ? { ...m, message: '' } : m)),
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('onmessage');
        socket.off('deletemessage');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const messageContent = inputText.trim();
    setInputText('');

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: Message = {
      messageId: tempId,
      message: messageContent,
      created: new Date().toISOString(),
      unread: '0',
      sender: {
        id: user?.id ?? '',
        username: user?.username ?? '',
        avatar: user?.avatar ?? '',
      },
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const body: Record<string, string> = { message: messageContent };
      if (conversationId) body.conversationId = conversationId;
      else if (partnerId) body.partnerId = partnerId;

      const response = await apiClient.post('/set_send_message', body);

      if (response.data?.code === '1000' || response.data?.code === 1000) {
        const { messageId: realId, conversationId: newConvId } = response.data.data ?? {};
        setMessages(prev =>
          prev.map(m => (m.messageId === tempId ? { ...m, messageId: realId ?? tempId } : m)),
        );
        if (newConvId && !conversationId) {
          setConversationId(newConvId);
          socket?.emit('joinchat', { conversationId: newConvId });
        }
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.messageId !== tempId));
      console.log('Lỗi gửi tin nhắn:', error);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMine = item.sender.id === user?.id;
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
            {item.message}
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
        <Text style={styles.headerTitle}>{partnerName || '...'}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.messageId}
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
          onSubmitEditing={handleSendMessage}
          returnKeyType="send"
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
