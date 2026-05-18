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
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../../constants/theme';
import { postApi } from '../../network/postApi';
import { useAuthStore } from '../../store/authStore';
import type { PostItem } from '../../types/post';
import PostCard from '../../components/PostCard';
import { MOCK_SEARCH_RESULTS } from '../../utils/mockData';

const HISTORY_KEY = 'search_history_v1';
const MAX_HISTORY = 20;
const PAGE_SIZE = 10;

const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('No Internet Connection');
    return false;
  }
  return true;
};

export default function SearchScreen() {
  const { token, user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [results, setResults] = useState<PostItem[]>([]);
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
          const parsed = JSON.parse(stored) as string[];
          setHistory(parsed);
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
      if (!trimmed || !token || !user?.id) {
        return;
      }
      if (token === 'mock-token') {
        setResults(MOCK_SEARCH_RESULTS);
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
        setResults([]);
      } else {
        setLoadingMore(true);
      }

      try {
        const data = await postApi.searchPosts({
          token,
          keyword: trimmed,
          user_id: user.id,
          index: nextPage.toString(),
          count: PAGE_SIZE.toString(),
        });

        const incoming = Array.isArray(data?.posts) ? data.posts : [];
        if (nextPage === 0) {
          setResults(incoming);
        } else {
          setResults(current => [...current, ...incoming]);
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
      } catch {
        if (nextPage === 0) {
          setResults([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, user?.id, history],
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
    if (loading || loadingMore || done) {
      return;
    }
    if (!submitted) {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>S</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            placeholder="Posts, hashtags, users..."
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable style={styles.clearButton} onPress={() => setQuery('')}>
              <Text style={styles.clearText}>X</Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={submit} style={styles.searchAction}>
          <Text style={styles.searchActionText}>Search</Text>
        </Pressable>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.post_id}
        renderItem={({ item }) => (
          <PostCard post={item} onChange={() => runSearch(submitted, 0)} />
        )}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={
          !loading && submitted ? (
            <Text style={styles.emptyText}>Khong tim thay ket qua</Text>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <Text style={styles.footerText}>Dang tai them...</Text>
          ) : done && results.length > 0 ? (
            <Text style={styles.footerText}>Da xem het</Text>
          ) : null
        }
      />

      {showHistory && (
        <View style={styles.historyOverlay}>
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent searches</Text>
              {history.length > 0 && (
                <Pressable onPress={clearHistory}>
                  <Text style={styles.clearAllText}>Clear all</Text>
                </Pressable>
              )}
            </View>
            {history.length === 0 ? (
              <Text style={styles.emptyHistory}>No recent searches</Text>
            ) : (
              history.map(item => (
                <View key={item} style={styles.historyItem}>
                  <Pressable
                    style={styles.historyItemText}
                    onPress={() => {
                      setQuery(item);
                      setSubmitted(item);
                      runSearch(item, 0);
                    }}
                  >
                    <Text style={styles.historyLabel}>{item}</Text>
                  </Pressable>
                  <Pressable onPress={() => removeHistoryItem(item)}>
                    <Text style={styles.historyRemove}>X</Text>
                  </Pressable>
                </View>
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface2,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.sm,
    height: 40,
  },
  searchIcon: {
    color: theme.colors.muted,
    fontWeight: '700',
    marginRight: theme.spacing.xs,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
  },
  clearButton: {
    height: 24,
    width: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  clearText: {
    color: theme.colors.muted,
    fontWeight: '700',
  },
  searchAction: {
    paddingHorizontal: theme.spacing.sm,
  },
  searchActionText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  list: {
    paddingVertical: theme.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.muted,
    paddingVertical: theme.spacing.lg,
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.muted,
    paddingVertical: theme.spacing.sm,
  },
  historyOverlay: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    padding: theme.spacing.lg,
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyHistory: {
    textAlign: 'center',
    color: theme.colors.muted,
    paddingVertical: theme.spacing.lg,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  historyItemText: {
    flex: 1,
  },
  historyLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  historyRemove: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
  },
});
