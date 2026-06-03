import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import PostCard from '../../components/PostCard';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../network/userApi';
import { postApi } from '../../network/postApi';
import type { ProfileExtras, ProfileInfo } from '../../types/profile';
import type { PostItem } from '../../types/post';
import { MOCK_MY_POSTS, MOCK_PROFILE } from '../../utils/mockData';

const PAGE_SIZE = 10;

const extraKey = (userId: string) => `profile_extra_${userId}`;

const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('Không có kết nối mạng');
    return false;
  }
  return true;
};

type InfoRowProps = { emoji: string; text: string; isLink?: boolean };
function InfoRow({ emoji, text, isLink }: InfoRowProps) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.emoji}>{emoji}</Text>
      <Text style={[infoStyles.text, isLink && infoStyles.link]}>{text}</Text>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  emoji: { fontSize: 18, width: 26, textAlign: 'center' },
  text: { fontSize: theme.font.md, color: theme.colors.text, flex: 1 },
  link: { color: theme.colors.primary },
});

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { token, user, logout } = useAuthStore();
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [extras, setExtras] = useState<ProfileExtras>({});
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    location: '',
    link: '',
  });

  const loadExtras = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    const stored = await AsyncStorage.getItem(extraKey(user.id));
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ProfileExtras;
        setExtras(parsed);
      } catch {
        setExtras({});
      }
    }
  }, [user?.id]);

  const loadProfile = useCallback(async () => {
    if (!token) {
      return;
    }
    if (token === 'mock-token') {
      setProfile(MOCK_PROFILE);
      setDraft({
        name: MOCK_PROFILE.username || '',
        description: MOCK_PROFILE.description || '',
        location: extras.location || '',
        link: extras.link || '',
      });
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    try {
      setLoading(true);
      const data = await userApi.getUserInfo({ token });
      setProfile(data);
      setDraft({
        name: data?.username || '',
        description: data?.description || '',
        location: extras.location || '',
        link: extras.link || '',
      });
    } catch (error: any) {
      Alert.alert(error?.message || 'Không thể tải thông tin cá nhân');
    } finally {
      setLoading(false);
    }
  }, [token, extras.location, extras.link]);

  const loadPosts = useCallback(
    async (isRefresh: boolean) => {
      if (!token || !user?.id) {
        return;
      }
      if (token === 'mock-token') {
        setPosts(MOCK_MY_POSTS);
        setDone(true);
        return;
      }
      if (!(await ensureOnline())) {
        return;
      }

      try {
        if (isRefresh) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        let lastPostId: string | undefined;
        if (!isRefresh) {
          setPosts(current => {
            lastPostId = current.length > 0
              ? current[current.length - 1].post_id
              : undefined;
            return current; // không thay đổi state
          });
        }

        const data = await postApi.getListPosts({
          token,
          index: '0',
          count: PAGE_SIZE.toString(),
          user_id: user.id,
          last_id: isRefresh ? undefined : lastPostId,
        });

        const incoming = Array.isArray(data?.posts) ? data.posts : [];
        if (isRefresh) {
          setPosts(incoming);
          setDone(incoming.length < PAGE_SIZE);
        } else {
          if (incoming.length === 0) {
            setDone(true);
          } else {
            setPosts(current => [
              ...current,
              ...incoming.filter(
                (p: PostItem) => !current.find(x => x.post_id === p.post_id),
              ),
            ]);
          }
        }
      } catch (error: any) {
        Alert.alert(error?.message || 'Không thể tải bài viết');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },

    [token, user?.id],
  );

  useEffect(() => {
    loadExtras();
  }, [loadExtras]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadPosts(true);
  }, [loadPosts]);

  const saveProfile = async () => {
    if (!token) {
      Alert.alert('Vui lòng đăng nhập lại');
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      Alert.alert('Tên không được để trống');
      return;
    }

    const description = draft.description.trim().slice(0, 150);

    try {
      await userApi.setUserInfo({
        token,
        username: trimmedName,
        description,
      });

      if (user?.id) {
        const extrasPayload = {
          location: draft.location.trim(),
          link: draft.link.trim(),
        };
        await AsyncStorage.setItem(
          extraKey(user.id),
          JSON.stringify(extrasPayload),
        );
        setExtras(extrasPayload);
      }

      setEditing(false);
      loadProfile();
    } catch (error: any) {
      Alert.alert(error?.message || 'Không thể cập nhật thông tin');
    }
  };

  const renderHeader = () => {
    const coverUri = profile?.coverImage;
    const name = profile?.username || 'Người dùng';
    const bio = profile?.description || '';
    const followerCount = '248';
    const postCount = posts.length;

    return (
      <View>
        {/* ─── Cover Photo ─── */}
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
              <Text style={styles.coverEmoji}>🎓</Text>
              <Text style={styles.coverTagline}>Parade Learning</Text>
            </LinearGradient>
          )}
        </View>

        {/* ─── Profile Info Card ─── */}
        <View style={styles.profileCard}>
          {/* Avatar overlapping cover */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarBorder}>
              <Avatar uri={profile?.avatar} name={name} size={88} />
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.editCoverBtn,
                pressed && { opacity: 0.8 },
              ]}>
              <Text style={styles.editCoverText}>📷</Text>
            </Pressable>
          </View>

          <Text style={styles.profileName}>{name}</Text>

          {bio ? <Text style={styles.profileBio}>{bio}</Text> : null}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{postCount}</Text>
              <Text style={styles.statLabel}>Bài viết</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followerCount}</Text>
              <Text style={styles.statLabel}>Bạn bè</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {user?.role === 'GV' ? 'GV' : 'HV'}
              </Text>
              <Text style={styles.statLabel}>Vai trò</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
              ]}
              onPress={() => setEditing(true)}>
              <LinearGradient
                colors={['#2488ff', '#1877F2', '#0d60d8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtnGradient}>
                <Text style={styles.primaryBtnText}>✏️ Chỉnh sửa</Text>
              </LinearGradient>
            </Pressable>
            {user?.role === 'GV' && (
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.secondaryBtnPressed,
                ]}
                onPress={() =>
                  navigation.navigate('VideoPickerScreen', {
                    isTeacherCreating: true,
                  })
                }>
                <Text style={styles.secondaryBtnText}>📹 Đăng video</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.secondaryBtnPressed,
              ]}
              onPress={() => navigation.navigate('Courses')}>
              <Text style={styles.secondaryBtnText}>
                {user?.role === 'GV' ? '👨‍🏫  Học sinh' : '📚  Khóa học'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && styles.iconBtnPressed,
              ]}
              onPress={logout}>
              <Text style={styles.iconBtnText}>⋯</Text>
            </Pressable>
          </View>

          {/* Info Section */}
          {(extras.location || extras.link || bio) && (
            <View style={styles.infoSection}>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionTitle}>Giới thiệu</Text>
              {bio ? <InfoRow emoji="📝" text={bio} /> : null}
              {extras.location ? (
                <InfoRow emoji="📍" text={extras.location} />
              ) : null}
              {extras.link ? (
                <InfoRow emoji="🔗" text={extras.link} isLink />
              ) : null}
            </View>
          )}
        </View>

        {/* ─── Posts Section Header ─── */}
        <View style={styles.postsSectionHeader}>
          <Text style={styles.postsSectionTitle}>Bài viết</Text>
          <Pressable style={styles.filterBtn}>
            <Text style={styles.filterBtnText}>Bộ lọc  ⌄</Text>
          </Pressable>
        </View>
      </View>
    );
  };

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
          if (!loadingMore && !done) {
            loadPosts(false);
          }
        }}
        onEndReachedThreshold={0.6}
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
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
            </View>
          ) : null
        }
      />

      {/* ─── Edit Profile Modal ─── */}
      <Modal transparent visible={editing} animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditing(false)}>
          <Pressable
            style={styles.modalCard}
            onPress={event => event.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Tên hiển thị</Text>
              <TextInput
                value={draft.name}
                onChangeText={value =>
                  setDraft(current => ({ ...current, name: value }))
                }
                style={styles.input}
                placeholder="Tên của bạn"
                placeholderTextColor={theme.colors.muted}
              />

              <Text style={styles.modalLabel}>Tiểu sử (tối đa 150 ký tự)</Text>
              <TextInput
                value={draft.description}
                onChangeText={value =>
                  setDraft(current => ({ ...current, description: value }))
                }
                style={[styles.input, styles.textArea]}
                placeholder="Kể gì đó về bạn..."
                placeholderTextColor={theme.colors.muted}
                multiline
                maxLength={150}
              />
              <Text style={styles.charCount}>
                {draft.description.length}/150
              </Text>

              <Text style={styles.modalLabel}>Vị trí</Text>
              <TextInput
                value={draft.location}
                onChangeText={value =>
                  setDraft(current => ({ ...current, location: value }))
                }
                style={styles.input}
                placeholder="Thành phố, Quốc gia"
                placeholderTextColor={theme.colors.muted}
              />

              <Text style={styles.modalLabel}>Liên kết</Text>
              <TextInput
                value={draft.link}
                onChangeText={value =>
                  setDraft(current => ({ ...current, link: value }))
                }
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor={theme.colors.muted}
                autoCapitalize="none"
                keyboardType="url"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={saveProfile}>
                <Text style={styles.saveBtnText}>Lưu</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    paddingBottom: theme.spacing.xl,
  },
  coverWrap: {
    height: 220,
    backgroundColor: theme.colors.primaryLight,
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
    gap: theme.spacing.sm,
  },
  coverEmoji: {
    fontSize: 52,
  },
  coverTagline: {
    fontSize: theme.font.md,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: -44,
    marginBottom: theme.spacing.sm,
  },
  avatarBorder: {
    borderWidth: 4,
    borderColor: theme.colors.surface,
    borderRadius: 50,
    overflow: 'hidden',
  },
  editCoverBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  editCoverText: {
    fontSize: 16,
  },
  profileName: {
    fontSize: theme.font.xxl,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  profileBio: {
    fontSize: theme.font.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: theme.colors.divider,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.font.lg,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.font.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: theme.colors.divider,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  primaryBtn: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.font.sm,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  secondaryBtnPressed: {
    backgroundColor: theme.colors.divider,
  },
  secondaryBtnText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: theme.font.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  iconBtnPressed: {
    backgroundColor: theme.colors.divider,
  },
  iconBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  infoSection: {
    marginTop: theme.spacing.xs,
  },
  sectionDivider: {
    height: 0.5,
    backgroundColor: theme.colors.divider,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.font.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  postsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 8,
    borderTopColor: theme.colors.background,
    marginBottom: theme.spacing.sm,
  },
  postsSectionTitle: {
    fontSize: theme.font.xl,
    fontWeight: '800',
    color: theme.colors.text,
  },
  filterBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.md,
  },
  filterBtnText: {
    fontSize: theme.font.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  emptyState: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 0,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.font.md,
    color: theme.colors.textSecondary,
  },
  footer: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.font.sm,
    color: theme.colors.muted,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    paddingTop: theme.spacing.sm,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.font.lg,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: theme.font.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  charCount: {
    textAlign: 'right',
    fontSize: theme.font.xs,
    color: theme.colors.muted,
    marginTop: 2,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.font.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  cancelBtnText: {
    fontSize: theme.font.md,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: theme.font.md,
    fontWeight: '700',
    color: '#fff',
  },
});
