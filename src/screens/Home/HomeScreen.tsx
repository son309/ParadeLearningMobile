import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../components/HomeHeader';
import PostCard from '../../components/PostCard';
import Avatar from '../../components/Avatar';
import { postApi } from '../../network/postApi';
import { theme } from '../../constants/theme';
import type { PostItem } from '../../types/post';
import { useAuthStore } from '../../store/authStore';
import { MOCK_POSTS } from '../../utils/mockData';

const CACHE_KEY = 'feed_cache_v1';
const PAGE_SIZE = 10;

// Mock stories data
const MOCK_STORIES = [
  { id: '1', name: 'Của bạn', isOwn: true, emoji: '➕' },
  { id: '2', name: 'Minh Tuấn', emoji: '🎓' },
  { id: '3', name: 'Lan Anh', emoji: '📖' },
  { id: '4', name: 'Hải Long', emoji: '🏆' },
  { id: '5', name: 'Thu Hà', emoji: '✨' },
];

function StoriesBar({ user }: { user: any }) {
  return (
    <View style={storyStyles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={storyStyles.scroll}>
        {MOCK_STORIES.map((story, index) => (
          <Pressable
            key={story.id}
            style={({ pressed }) => [
              storyStyles.storyCard,
              pressed && storyStyles.storyCardPressed,
            ]}>
            {story.isOwn ? (
              <View style={storyStyles.ownRingWrap}>
                <LinearGradient
                  colors={['#1877F2', '#42B72A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={storyStyles.addStoryCircle}>
                  <Text style={storyStyles.addIcon}>+</Text>
                </LinearGradient>
              </View>
            ) : (
              <LinearGradient
                colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={storyStyles.avatarRing}>
                <View style={storyStyles.avatarRingInner}>
                  <View style={storyStyles.storyEmoji}>
                    <Text style={{ fontSize: 28 }}>{story.emoji}</Text>
                  </View>
                </View>
              </LinearGradient>
            )}
            <Text style={storyStyles.storyName} numberOfLines={1}>
              {story.isOwn ? (user?.username?.split(' ')[0] || 'Bạn') : story.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const storyStyles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  scroll: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  storyCard: {
    width: 88,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  storyCardPressed: {
    opacity: 0.85,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingInner: {
    width: 63,
    height: 63,
    borderRadius: 31.5,
    backgroundColor: theme.colors.surface,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownRingWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStoryCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
    lineHeight: 32,
  },
  storyEmoji: {
    width: 59,
    height: 59,
    borderRadius: 29.5,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyName: {
    fontSize: theme.font.xs,
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'center',
    width: 80,
  },
});

function CreatePostBar({ user }: { user: any }) {
  return (
    <View style={createStyles.container}>
      <View style={createStyles.row}>
        <Avatar uri={user?.avatar} name={user?.username} size={40} />
        <Pressable
          style={({ pressed }) => [
            createStyles.inputFake,
            pressed && createStyles.inputFakePressed,
          ]}>
          <Text style={createStyles.inputText}>
            {user?.username
              ? `${user.username.split(' ')[0]} ơi, bạn đang nghĩ gì thế?`
              : 'Bạn đang nghĩ gì thế?'}
          </Text>
        </Pressable>
      </View>
      <View style={createStyles.divider} />
      <View style={createStyles.actions}>
        <Pressable style={createStyles.actionBtn}>
          <Text style={createStyles.actionEmoji}>🔴</Text>
          <Text style={createStyles.actionText}>Video trực tiếp</Text>
        </Pressable>
        <View style={createStyles.actionDivider} />
        <Pressable style={createStyles.actionBtn}>
          <Text style={createStyles.actionEmoji}>🖼️</Text>
          <Text style={createStyles.actionText}>Ảnh/Video</Text>
        </Pressable>
        <View style={createStyles.actionDivider} />
        <Pressable style={createStyles.actionBtn}>
          <Text style={createStyles.actionEmoji}>😊</Text>
          <Text style={createStyles.actionText}>Cảm xúc</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  inputFake: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  inputFakePressed: {
    backgroundColor: theme.colors.divider,
  },
  inputText: {
    fontSize: theme.font.sm,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 0.5,
    backgroundColor: theme.colors.divider,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    gap: 4,
  },
  actionDivider: {
    width: 0.5,
    backgroundColor: theme.colors.divider,
    alignSelf: 'stretch',
    marginVertical: theme.spacing.xs,
  },
  actionEmoji: {
    fontSize: 16,
  },
  actionText: {
    fontSize: theme.font.xs,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
});

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
      Alert.alert('Không có kết nối mạng');
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
      Alert.alert('Không thể tải bảng tin');
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
      Alert.alert('Không thể tải thêm bài viết');
    } finally {
      setLoadingMore(false);
    }
  }, [token, loadingMore, done, posts]);

  const ListHeader = (
    <View>
      <StoriesBar user={user} />
      <CreatePostBar user={user} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader
        onSearchPress={() => navigation.navigate('Search')}
        onChatPress={() => navigation.navigate('Profile')}
      />

      {/* Navigation Tabs (Facebook-style) */}
      <View style={styles.navTabs}>
        <Pressable style={[styles.navTab, styles.navTabActive]}>
          <Text style={styles.navTabEmoji}>🏠</Text>
          <View style={styles.navTabIndicator} />
        </Pressable>
        <Pressable
          style={styles.navTab}
          onPress={() => navigation.navigate('Search')}>
          <Text style={styles.navTabEmoji}>📺</Text>
        </Pressable>
        <Pressable style={styles.navTab}>
          <Text style={styles.navTabEmoji}>🛍️</Text>
        </Pressable>
        <Pressable style={styles.navTab}>
          <Text style={styles.navTabEmoji}>👥</Text>
        </Pressable>
        <Pressable style={styles.navTab}>
          <Text style={styles.navTabEmoji}>🔔</Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>5</Text>
          </View>
        </Pressable>
        <Pressable
          style={styles.navTab}
          onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.navTabEmoji}>☰</Text>
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.post_id}
        renderItem={({ item }) => <PostCard post={item} onChange={refresh} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
              <Text style={styles.emptySubText}>
                Kết nối với bạn bè để xem bảng tin của bạn
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Đang tải thêm...</Text>
            </View>
          ) : done && posts.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>✓ Bạn đã xem hết rồi</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.divider,
  },
  navTab: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navTabActive: {},
  navTabEmoji: {
    fontSize: 22,
  },
  navTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 1.5,
  },
  tabBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  list: {
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
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
  emptySubText: {
    fontSize: theme.font.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.font.sm,
    color: theme.colors.muted,
  },
});
