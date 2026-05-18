import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
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
    Alert.alert('No Internet Connection');
    return false;
  }
  return true;
};

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
      Alert.alert(error?.message || 'Khong the tai thong tin ca nhan');
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

        const data = await postApi.getListPosts({
          token,
          index: '0',
          count: PAGE_SIZE.toString(),
          user_id: user.id,
          last_id:
            isRefresh || posts.length === 0
              ? undefined
              : posts[posts.length - 1].post_id,
        });

        const incoming = Array.isArray(data?.posts) ? data.posts : [];
        if (isRefresh) {
          setPosts(incoming);
          setDone(incoming.length < PAGE_SIZE);
        } else {
          if (incoming.length === 0) {
            setDone(true);
          } else {
            const merged = [
              ...posts,
              ...incoming.filter(
                (p: PostItem) => !posts.find(x => x.post_id === p.post_id),
              ),
            ];
            setPosts(merged);
          }
        }
      } catch (error: any) {
        Alert.alert(error?.message || 'Khong the tai bai viet');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, user?.id, posts],
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
      Alert.alert('Vui long dang nhap lai');
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      Alert.alert('Ten khong duoc de trong');
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
      Alert.alert(error?.message || 'Khong the cap nhat thong tin');
    }
  };

  const renderHeader = () => {
    const coverUri = profile?.coverImage;
    const name = profile?.username || 'Nguoi dung';
    const bio = profile?.description || '';

    return (
      <View>
        <View style={styles.coverWrap}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverFallback} />
          )}
        </View>
        <View style={styles.profileCard}>
          <Avatar uri={profile?.avatar} name={name} size={96} />
          <Text style={styles.name}>{name}</Text>
          {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          {(extras.location || extras.link) && (
            <View style={styles.metaList}>
              {extras.location ? (
                <Text style={styles.metaText}>{extras.location}</Text>
              ) : null}
              {extras.link ? (
                <Text style={[styles.metaText, styles.linkText]}>
                  {extras.link}
                </Text>
              ) : null}
            </View>
          )}
          <View style={styles.actions}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.primaryButtonText}>Edit profile</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={logout}>
              <Text style={styles.secondaryButtonText}>Log out</Text>
            </Pressable>
          </View>
          <Pressable
            style={styles.courseButton}
            onPress={() => navigation.navigate('Courses')}
          >
            <Text style={styles.courseButtonText}>
              {user?.role === 'GV' ? 'Manage students' : 'Course requests'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Posts</Text>
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
            <Text style={styles.footerText}>Dang tai them...</Text>
          ) : done && posts.length > 0 ? (
            <Text style={styles.footerText}>Da xem het</Text>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>Chua co bai viet nao</Text>
          ) : null
        }
      />

      <Modal transparent visible={editing} animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditing(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={event => event.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit profile</Text>
            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              value={draft.name}
              onChangeText={value =>
                setDraft(current => ({ ...current, name: value }))
              }
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={theme.colors.muted}
            />
            <Text style={styles.modalLabel}>Description (max 150)</Text>
            <TextInput
              value={draft.description}
              onChangeText={value =>
                setDraft(current => ({ ...current, description: value }))
              }
              style={[styles.input, styles.textArea]}
              placeholder="Tell something about you"
              placeholderTextColor={theme.colors.muted}
              multiline
              maxLength={150}
            />
            <Text style={styles.modalCount}>
              {draft.description.length}/150
            </Text>
            <Text style={styles.modalLabel}>Location</Text>
            <TextInput
              value={draft.location}
              onChangeText={value =>
                setDraft(current => ({ ...current, location: value }))
              }
              style={styles.input}
              placeholder="Location"
              placeholderTextColor={theme.colors.muted}
            />
            <Text style={styles.modalLabel}>Link</Text>
            <TextInput
              value={draft.link}
              onChangeText={value =>
                setDraft(current => ({ ...current, link: value }))
              }
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={saveProfile}>
                <Text style={styles.primaryButtonText}>Save</Text>
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
    paddingBottom: theme.spacing.lg,
  },
  coverWrap: {
    height: 160,
    backgroundColor: theme.colors.surface,
  },
  coverFallback: {
    flex: 1,
    backgroundColor: theme.colors.primaryLight,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    marginTop: -36,
  },
  name: {
    marginTop: theme.spacing.sm,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  bio: {
    marginTop: theme.spacing.xs,
    color: theme.colors.text,
  },
  metaList: {
    marginTop: theme.spacing.sm,
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: theme.colors.muted,
  },
  linkText: {
    color: theme.colors.primary,
  },
  actions: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  primaryButton: {
    flex: 1,
    height: 42,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    height: 42,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  courseButton: {
    marginTop: theme.spacing.sm,
    height: 40,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.muted,
    paddingVertical: theme.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.muted,
    paddingVertical: theme.spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
  },
  modalHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
  },
  modalCount: {
    textAlign: 'right',
    fontSize: 11,
    color: theme.colors.muted,
  },
  input: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
});
