import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../network/userApi';
import { MOCK_BLOCKED_USERS } from '../../utils/mockData';

type BlockedUser = {
  id: string;
  name: string;
  avatar?: string;
};

const PAGE_SIZE = 20;

const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('Không có kết nối mạng');
    return false;
  }
  return true;
};

export default function BlockedUsersScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuthStore();
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [unblocking, setUnblocking] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    if (token === 'mock-token') {
      setUsers(MOCK_BLOCKED_USERS);
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    setLoading(true);
    try {
      const data = await userApi.getListBlocks({
        token,
        index: '0',
        count: PAGE_SIZE.toString(),
      });
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (err: any) {
      if (!err?.message?.includes('No data')) {
        Alert.alert(err?.message || 'Không thể tải danh sách');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (userId: string, userName: string) => {
    if (!token) {
      return;
    }
    const confirmed = await new Promise<boolean>(resolve => {
      Alert.alert(
        'Bỏ chặn?',
        `Bỏ chặn ${userName}? Họ sẽ có thể tương tác với bạn trở lại.`,
        [
          { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Bỏ chặn', style: 'destructive', onPress: () => resolve(true) },
        ],
      );
    });
    if (!confirmed) {
      return;
    }
    if (token === 'mock-token') {
      setUsers(prev => prev.filter(u => u.id !== userId));
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    setUnblocking(prev => new Set([...prev, userId]));
    try {
      await userApi.setBlock({ token, userId, type: '1' });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      Alert.alert(err?.message || 'Không thể bỏ chặn');
    } finally {
      setUnblocking(prev => {
        const n = new Set(prev);
        n.delete(userId);
        return n;
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Danh sách đã chặn</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={users}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        ListHeaderComponent={
          <Text style={styles.hint}>
            Những người trong danh sách này không thể xem bài viết của bạn
            hoặc tương tác với bạn.
          </Text>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🚫</Text>
              <Text style={styles.emptyText}>Chưa chặn ai</Text>
              <Text style={styles.emptySubtext}>
                Danh sách những người bạn đã chặn sẽ hiển thị ở đây
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isUnblocking = unblocking.has(item.id);
          return (
            <View style={styles.userRow}>
              <Avatar uri={item.avatar} name={item.name} size={52} />
              <Text style={styles.userName}>{item.name}</Text>
              <Pressable
                style={[
                  styles.unblockBtn,
                  isUnblocking && styles.unblockBtnDisabled,
                ]}
                onPress={() => unblock(item.id, item.name)}
                disabled={isUnblocking}>
                <Text style={styles.unblockBtnText}>
                  {isUnblocking ? '...' : 'Bỏ chặn'}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.divider,
    paddingHorizontal: theme.spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: theme.colors.text,
    fontWeight: '300',
    lineHeight: 32,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.font.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerRight: {
    width: 44,
  },

  // List
  list: {
    paddingBottom: theme.spacing.xl,
  },
  hint: {
    fontSize: theme.font.sm,
    color: theme.colors.muted,
    lineHeight: 20,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.divider,
    marginBottom: theme.spacing.sm,
  },

  // User row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  userName: {
    flex: 1,
    fontSize: theme.font.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  unblockBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unblockBtnDisabled: {
    opacity: 0.5,
  },
  unblockBtnText: {
    fontSize: theme.font.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.font.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.font.sm,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
