import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import PostCard from '../../components/PostCard';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../network/userApi';
import { postApi } from '../../network/postApi';
import type { ProfileInfo } from '../../types/profile';
import type { PostItem } from '../../types/post';

const PAGE_SIZE = 10;

const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('Không có kết nối mạng');
    return false;
  }
  return true;
};

type Props = {
  route: {
    params: {
      userId: string;
      username?: string;
      avatar?: string;
    };
  };
};

export default function UserProfileScreen({ route }: Props) {
  const { userId, username: initialName, avatar: initialAvatar } = route.params;
  const navigation = useNavigation<any>();
  const { token } = useAuthStore();

  const [profile, setProfile] = useState<ProfileInfo | null>(
    initialName
      ? { id: userId, username: initialName, avatar: initialAvatar, online: '0' }
      : null,
  );
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  // Kiểm tra trạng thái chặn ban đầu bằng cách lấy danh sách đã chặn
  const loadBlockStatus = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const data = await userApi.getListBlocks({ token, index: '0', count: '100' });
      const blockedIds: string[] = (data?.users || []).map((u: any) => u.id);
      setIsBlocked(blockedIds.includes(userId));
    } catch {
      setIsBlocked(false);
    }
  }, [token, userId]);

  const toggleBlock = async () => {
    if (!token) {
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    setBlockLoading(true);
    const type = isBlocked ? '1' : '0';
    try {
      await userApi.setBlock({ token, userId, type });
      setIsBlocked(!isBlocked);
      if (!isBlocked) {
        // Vừa bị chặn → không còn hiển thị bài viết
        setPosts([]);
        Alert.alert('Đã chặn', `Bạn đã chặn ${name}. Họ sẽ không thể tương tác với bạn.`);
      }
    } catch (err: any) {
      Alert.alert(err?.message || (isBlocked ? 'Không thể bỏ chặn' : 'Không thể chặn'));
    } finally {
      setBlockLoading(false);
    }
  };

  const loadProfile = useCallback(async () => {
    if (!token) {
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    try {
      const data = await userApi.getUserInfo({ token, userId });
      setProfile(data);
    } catch {}
  }, [token, userId]);

  const loadPosts = useCallback(
    async (refresh: boolean) => {
      if (!token) {
        return;
      }
      if (!(await ensureOnline())) {
        return;
      }
      setLoading(true);
      try {
        const data = await postApi.getListPosts({
          token,
          index: '0',
          count: PAGE_SIZE.toString(),
          user_id: userId,
        });
        const incoming: PostItem[] = Array.isArray(data?.posts)
          ? data.posts
          : [];
        if (refresh) {
          setPosts(incoming);
          setDone(incoming.length < PAGE_SIZE);
        } else {
          setPosts(prev => [
            ...prev,
            ...incoming.filter(
              p => !prev.find(x => x.post_id === p.post_id),
            ),
          ]);
          if (incoming.length < PAGE_SIZE) {
            setDone(true);
          }
        }
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [token, userId],
  );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadPosts(true);
  }, [loadPosts]);

  useEffect(() => {
    loadBlockStatus();
  }, [loadBlockStatus]);

  const name = profile?.username || initialName || 'Người dùng';
  const coverUri = profile?.coverImage;
  const isOnline = profile?.online === '1';

  const renderHeader = () => (
    <View>
      {/* ─── Cover — 200px ─── */}
      <View style={styles.coverWrap}>
        {coverUri ? (
          <>
            <Image source={{ uri: coverUri }} style={styles.coverImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.35)']}
              style={styles.coverOverlay}
            />
          </>
        ) : (
          <LinearGradient
            colors={['#1a6fd8', '#1877F2', '#6eb3ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverFallback}>
            <Text style={styles.coverEmoji}>👤</Text>
          </LinearGradient>
        )}

        {/* Back button — circle with dark blur-like bg, white chevron */}
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.75 },
          ]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
      </View>

      {/* ─── Profile card ─── */}
      <View style={styles.profileCard}>
        {/* Avatar overlaps cover by ~44px */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarBorder}>
            <Avatar uri={profile?.avatar} name={name} size={90} />
            {isOnline && <View style={styles.onlineDot} />}
          </View>
        </View>

        <Text style={styles.profileName}>{name}</Text>
        {profile?.description ? (
          <Text style={styles.profileBio}>{profile.description}</Text>
        ) : null}

        {/* Stats row — posts count + online status */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {isOnline ? '🟢' : '⚫'}
            </Text>
            <Text style={styles.statLabel}>
              {isOnline ? 'Đang online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Nút chặn / bỏ chặn */}
        <Pressable
          style={({ pressed }) => [
            styles.blockButton,
            isBlocked ? styles.blockButtonActive : styles.blockButtonDefault,
            pressed && { opacity: 0.75 },
            blockLoading && { opacity: 0.5 },
          ]}
          onPress={toggleBlock}
          disabled={blockLoading}>
          <Text style={[
            styles.blockButtonText,
            isBlocked ? styles.blockButtonTextActive : styles.blockButtonTextDefault,
          ]}>
            {blockLoading ? '...' : isBlocked ? '✓ Đã chặn • Bỏ chặn' : '🚫 Chặn người dùng'}
          </Text>
        </Pressable>
      </View>

      {/* ─── Posts section header — 8px separator ─── */}
      <View style={styles.postsSectionHeader}>
        <Text style={styles.postsSectionTitle}>Bài viết</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={item => item.post_id}
        renderItem={({ item }) => (
          <PostCard post={item} onChange={() => loadPosts(true)} />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => loadPosts(true)}
        onEndReached={() => {
          if (!loading && !done) {
            loadPosts(false);
          }
        }}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          done && posts.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Đã xem hết</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
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
    backgroundColor: '#F0F2F5',
  },
  list: {
    paddingBottom: 32,
  },

  // ─── Cover — 200px height ──────────────────────────────────────────────────
  coverWrap: {
    height: 200,
    backgroundColor: '#1877F2',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: {
    fontSize: 52,
  },

  // ─── Back button — circle, rgba dark bg, white chevron ────────────────────
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    // Nudge the chevron to look visually centered
    lineHeight: 32,
    marginTop: -2,
  },

  // ─── Profile card ──────────────────────────────────────────────────────────
  profileCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 8,
    // Shadow underneath the card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  // Avatar overlaps cover by ~44px via negative marginTop
  avatarRow: {
    marginTop: -44,
    marginBottom: 10,
  },
  // White border 4px, no overflow clip so online dot is visible
  avatarBorder: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
    borderRadius: 999,
    overflow: 'visible',
    alignSelf: 'flex-start',
    position: 'relative',
  },
  // Green online dot: 14px, 2px white border
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#31A24C',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  // Name — 22px bold
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#050505',
    marginBottom: 6,
  },
  // Bio — 15px muted, line-height 22
  profileBio: {
    fontSize: 15,
    color: '#65676B',
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '400',
  },
  // Stats row — border top/bottom 0.5px divider
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#E4E6EB',
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#050505',
  },
  statLabel: {
    fontSize: 11,
    color: '#65676B',
    marginTop: 2,
    fontWeight: '400',
  },
  statDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: '#E4E6EB',
  },

  // ─── Block button ─────────────────────────────────────────────────────────
  blockButton: {
    marginTop: 12,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  blockButtonDefault: {
    backgroundColor: '#F0F2F5',
    borderColor: '#CED0D4',
  },
  blockButtonActive: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FA3E3E',
  },
  blockButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  blockButtonTextDefault: {
    color: '#050505',
  },
  blockButtonTextActive: {
    color: '#FA3E3E',
  },

  // ─── Posts section header — 8px F0F2F5 separator above ───────────────────
  postsSectionHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 8,
    borderTopColor: '#F0F2F5',
    marginBottom: 2,
  },
  postsSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#050505',
  },

  // ─── Empty state ───────────────────────────────────────────────────────────
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#65676B',
    fontWeight: '600',
  },

  // ─── Footer ────────────────────────────────────────────────────────────────
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#65676B',
  },
});
