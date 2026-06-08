import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../../constants/theme';
import { postApi } from '../../network/postApi';
import { useAuthStore } from '../../store/authStore';
import type { PostItem } from '../../types/post';
import PostCard from '../../components/PostCard';
import Avatar from '../../components/Avatar';
import { MOCK_SEARCH_RESULTS } from '../../utils/mockData';

const HISTORY_KEY = 'search_history_v1';
const MAX_HISTORY = 20;
const PAGE_SIZE = 10;

type UserSearchItem = {
  id: string;
  username: string;
  avatar?: string;
  role?: string;
};

const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('Không có kết nối mạng');
    return false;
  }
  return true;
};

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [postResults, setPostResults] = useState<PostItem[]>([]);
  const [userResults, setUserResults] = useState<UserSearchItem[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);

  const showHistory = useMemo(() => query.trim().length === 0, [query]);

  useEffect(() => {
    const loadHistory = async () => {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) {
        try {
          setHistory(JSON.parse(stored) as string[]);
        } catch {
          setHistory([]);
        }
      }
    };
    loadHistory();
  }, []);

  const persistHistory = async (items: string[]) => {
    setHistory(items);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  };

  const runSearch = useCallback(
    async (term: string, nextPage = 0) => {
      const trimmed = term.trim();
      if (!trimmed || !token) {
        return;
      }
      if (token === 'mock-token') {
        setPostResults(MOCK_SEARCH_RESULTS);
        setUserResults([]);
        setDone(true);
        setLoading(false);
        setLoadingMore(false);
        setPage(0);
        return;
      }
      if (!(await ensureOnline())) {
        return;
      }

      if (nextPage === 0) {
        setLoading(true);
        setDone(false);
        setPostResults([]);
        setUserResults([]);
      } else {
        setLoadingMore(true);
      }

      try {
        const data = await postApi.searchPosts({
          token,
          keyword: trimmed,
          // Không truyền user_id để tìm kiếm toàn cục (không chỉ bài của mình)
          index: nextPage.toString(),
          count: PAGE_SIZE.toString(),
        });

        const incoming: PostItem[] = Array.isArray(data?.posts) ? data.posts : [];

        if (nextPage === 0) {
          setPostResults(incoming);
          // Users chỉ trả về ở trang đầu
          setUserResults(Array.isArray(data?.users) ? data.users : []);
        } else {
          setPostResults(current => [
            ...current,
            ...incoming.filter(p => !current.find(x => x.post_id === p.post_id)),
          ]);
        }
        setDone(incoming.length < PAGE_SIZE);
        setPage(nextPage);

        if (nextPage === 0) {
          const lower = trimmed.toLowerCase();
          const nextHistory = [
            trimmed,
            ...history.filter(item => item.toLowerCase() !== lower),
          ].slice(0, MAX_HISTORY);
          await persistHistory(nextHistory);
        }
      } catch (err: any) {
        // NO_DATA bình thường — không phải lỗi
        if (!err?.message?.includes('No data')) {
          Alert.alert(err?.message || 'Không thể tìm kiếm');
        }
        if (nextPage === 0) {
          setPostResults([]);
          setUserResults([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, history],
  );

  const submit = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    setSubmitted(trimmed);
    runSearch(trimmed, 0);
  };

  const loadMore = () => {
    if (loading || loadingMore || done || !submitted) {
      return;
    }
    runSearch(submitted, page + 1);
  };

  const clearHistory = async () => {
    await persistHistory([]);
  };

  const removeHistoryItem = async (term: string) => {
    await persistHistory(history.filter(item => item !== term));
  };

  const hasResults = postResults.length > 0 || userResults.length > 0;

  // Header của FlatList: section "Mọi người"
  const ListHeaderUsers = userResults.length > 0 ? (
    <View style={styles.usersSection}>
      <Text style={styles.sectionTitle}>Mọi người</Text>
      {userResults.map(u => (
        <Pressable
          key={u.id}
          style={({ pressed }) => [styles.userRow, pressed && styles.userRowPressed]}
          onPress={() =>
            navigation.navigate('UserProfile', {
              userId: u.id,
              username: u.username,
              avatar: u.avatar,
            })
          }>
          <Avatar uri={u.avatar} name={u.username} size={48} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{u.username}</Text>
            <Text style={styles.userRole}>
              {u.role === 'GV' ? 'Giáo viên' : 'Học viên'}
            </Text>
          </View>
          <Text style={styles.userChevron}>›</Text>
        </Pressable>
      ))}
      {postResults.length > 0 && (
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>Bài viết</Text>
        </View>
      )}
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIconText}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            placeholder="Tìm bài viết, hashtag, người dùng..."
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable style={styles.clearButton} onPress={() => setQuery('')}>
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={submit} style={styles.searchActionBtn}>
          <Text style={styles.searchActionText}>Tìm</Text>
        </Pressable>
      </View>

      {/* Results */}
      <FlatList
        data={postResults}
        keyExtractor={item => item.post_id}
        renderItem={({ item }) => (
          <PostCard post={item} onChange={() => runSearch(submitted, 0)} />
        )}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListHeaderComponent={ListHeaderUsers}
        ListEmptyComponent={
          !loading && submitted ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
              <Text style={styles.emptySubtext}>
                Thử từ khóa khác hoặc tìm theo hashtag #tag
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Đang tải thêm...</Text>
            </View>
          ) : done && postResults.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>✓ Đã xem hết</Text>
            </View>
          ) : null
        }
      />

      {/* Lịch sử tìm kiếm */}
      {showHistory && (
        <View style={styles.historyOverlay}>
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Tìm kiếm gần đây</Text>
              {history.length > 0 && (
                <Pressable onPress={clearHistory}>
                  <Text style={styles.clearAllText}>Xóa tất cả</Text>
                </Pressable>
              )}
            </View>
            {history.length === 0 ? (
              <Text style={styles.emptyHistory}>Chưa có lịch sử tìm kiếm</Text>
            ) : (
              history.map(item => (
                <Pressable
                  key={item}
                  style={styles.historyItem}
                  onPress={() => {
                    setQuery(item);
                    setSubmitted(item);
                    runSearch(item, 0);
                  }}>
                  <Text style={styles.historyIcon}>🕐</Text>
                  <Text style={styles.historyLabel}>{item}</Text>
                  <Pressable
                    style={styles.historyRemoveBtn}
                    onPress={() => removeHistoryItem(item)}>
                    <Text style={styles.historyRemove}>✕</Text>
                  </Pressable>
                </Pressable>
              ))
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Search bar
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.divider,
    gap: theme.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface2,
    borderRadius: 22,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    gap: theme.spacing.sm,
  },
  searchIconText: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.font.md,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  searchActionBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  searchActionText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: theme.font.md,
  },

  // List
  list: {
    paddingBottom: theme.spacing.xl,
  },

  // Users section
  usersSection: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.font.lg,
    fontWeight: '800',
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  sectionDivider: {
    borderTopWidth: 8,
    borderTopColor: theme.colors.background,
    marginTop: theme.spacing.xs,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  userRowPressed: {
    backgroundColor: theme.colors.surface2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.font.md,
    fontWeight: '700',
    color: theme.colors.text,
  },
  userRole: {
    fontSize: theme.font.sm,
    color: theme.colors.muted,
    marginTop: 2,
  },
  userChevron: {
    fontSize: 22,
    color: theme.colors.muted,
    fontWeight: '300',
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

  // Footer
  footer: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.font.sm,
    color: theme.colors.muted,
  },

  // History overlay
  historyOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
    paddingBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  historyTitle: {
    fontSize: theme.font.sm,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: theme.font.sm,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyHistory: {
    textAlign: 'center',
    color: theme.colors.muted,
    paddingVertical: theme.spacing.xl,
    fontSize: theme.font.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    gap: theme.spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.divider,
  },
  historyIcon: {
    fontSize: 16,
  },
  historyLabel: {
    flex: 1,
    fontSize: theme.font.md,
    color: theme.colors.text,
  },
  historyRemoveBtn: {
    padding: theme.spacing.xs,
  },
  historyRemove: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
  },
});
