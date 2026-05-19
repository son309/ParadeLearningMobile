import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import HomeHeader from '../../components/HomeHeader';
import BottomNav from '../../components/BottomNav';
import Avatar from '../../components/Avatar';
import PostCard from '../../components/PostCard';
import { postApi } from '../../network/postApi';
import { theme } from '../../constants/theme';
import type { PostItem } from '../../types/post';
import { useAuthStore } from '../../store/authStore';
import { MOCK_POSTS } from '../../utils/mockData';

const CACHE_KEY = 'feed_cache_v1';
const PAGE_SIZE = 10;

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useAuthStore();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const loadCache = async () => {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as PostItem[];
          setPosts(parsed);
        } catch {
          setPosts([]);
        }
      }
    };

    loadCache();
  }, []);

  const refresh = useCallback(async () => {
    if (!token) {
      return;
    }
    if (token === 'mock-token') {
      setPosts(MOCK_POSTS);
      setDone(true);
      return;
    }
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert('No Internet Connection');
      return;
    }

    setRefreshing(true);
    try {
      const data = await postApi.getListPosts({
        token,
        index: '0',
        count: PAGE_SIZE.toString(),
      });
      const incoming = Array.isArray(data?.posts) ? data.posts : [];
      const filtered = incoming.filter(
        (item: PostItem) => item.is_blocked !== '1',
      );
      setPosts(filtered);
      setDone(filtered.length < PAGE_SIZE);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
    } catch {
      Alert.alert('Khong the tai bang tin');
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (!token || loadingMore || done || posts.length === 0) {
      return;
    }
    if (token === 'mock-token') {
      setDone(true);
      return;
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert('No Internet Connection');
      return;
    }

    setLoadingMore(true);
    try {
      const data = await postApi.getListPosts({
        token,
        index: '0',
        count: PAGE_SIZE.toString(),
        last_id: posts[posts.length - 1].post_id,
      });
      const incoming = Array.isArray(data?.posts) ? data.posts : [];
      const filtered = incoming.filter(
        (item: PostItem) => item.is_blocked !== '1',
      );
      if (filtered.length === 0) {
        setDone(true);
      } else {
        const merged = [
          ...posts,
          ...filtered.filter(
            (p: PostItem) => !posts.find(x => x.post_id === p.post_id),
          ),
        ];
        setPosts(merged);
      }
    } catch {
      Alert.alert('Khong the tai them bai viet');
    } finally {
      setLoadingMore(false);
    }
  }, [token, loadingMore, done, posts]);

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader
        onSearchPress={() => navigation.navigate('Search')}
        onChatPress={() => navigation.navigate('Profile')}
      />
      <FlatList
        data={posts}
        keyExtractor={item => item.post_id}
        renderItem={({ item }) => <PostCard post={item} onChange={refresh} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListHeaderComponent={
          <Pressable
            style={styles.composer}
            onPress={() => navigation.navigate('CreatePost')}
          >
            <Avatar
              uri={user?.avatar}
              name={user?.username}
              size={40}
            />
            <View style={styles.composerInput}>
              <Text style={styles.composerText}>What's on your mind?</Text>
            </View>
          </Pressable>
        }
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chua co bai viet nao</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <Text style={styles.footerText}>Dang tai them...</Text>
          ) : done && posts.length > 0 ? (
            <Text style={styles.footerText}>Da xem het</Text>
          ) : null
        }
      />
      <BottomNav
        active="Home"
        onPressHome={() => navigation.navigate('Home')}
        onPressSearch={() => navigation.navigate('Search')}
        onPressCourses={() => navigation.navigate('Courses')}
        onPressProfile={() => navigation.navigate('Profile')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg + 72,
  },
  composer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  composerInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface2,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  composerText: {
    color: theme.colors.muted,
  },
  emptyState: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.muted,
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.muted,
    paddingVertical: theme.spacing.sm,
  },
});
