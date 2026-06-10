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
import PostCard from '../../components/PostCard';
import { theme } from '../../constants/theme';
import { postApi } from '../../network/postApi';
import { useAuthStore } from '../../store/authStore';
import type { PostItem } from '../../types/post';

export default function NewPostScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useAuthStore();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);

  const isTeacher = user?.role === 'GV';

  const loadPosts = useCallback(async () => {
    if (!token || !user?.id) {
      return;
    }
    setLoading(true);
    try {
      const data = await postApi.getListPosts({
        token,
        index: '0',
        count: '20',
        user_id: user.id,
      });
      const fetchedPosts = Array.isArray(data?.posts) ? data.posts : [];
      setPosts(fetchedPosts);
    } catch (error: any) {
      Alert.alert(error?.message || 'Không thể tải bài đăng');
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleCreatePost = () => {
    navigation.navigate('VideoPickerScreen', { isTeacherCreating: true });
  };

  const renderPost = ({ item }: { item: PostItem }) => (
    <PostCard post={item} onChange={loadPosts} />
  );

  if (!isTeacher) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notAllowed}>
          <Text style={styles.notAllowedIcon}>🔒</Text>
          <Text style={styles.notAllowedText}>
            Chức năng này chỉ dành cho giáo viên.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={item => item.post_id}
        renderItem={renderPost}
        refreshing={loading}
        onRefresh={loadPosts}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={styles.screenTitle}>Bài đăng của tôi</Text>

            <Pressable
              style={({ pressed }) => [
                styles.createBtn,
                pressed && styles.createBtnPressed,
              ]}
              onPress={handleCreatePost}
            >
              <Text style={styles.createBtnIcon}>+</Text>
              <Text style={styles.createBtnText}>Tạo bài đăng mới</Text>
            </Pressable>

            {posts.length > 0 && (
              <Text style={styles.sectionLabel}>Các bài đăng của bạn</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>Chưa có bài đăng nào</Text>
              <Text style={styles.emptyDesc}>
                Bấm "Tạo bài đăng mới" để đăng video bài tập cho học viên.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingBottom: 32,
  },
  headerSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  createBtnPressed: {
    opacity: 0.85,
  },
  createBtnIcon: {
    fontSize: 22,
    fontWeight: '300',
    color: '#fff',
    lineHeight: 26,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  notAllowed: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  notAllowedIcon: {
    fontSize: 48,
  },
  notAllowedText: {
    textAlign: 'center',
    fontSize: 16,
    color: theme.colors.muted,
  },
});
