import React, { useCallback, useEffect, useState } from 'react';
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
import PostCard from '../../components/PostCard';
import { theme } from '../../constants/theme';
import { postApi } from '../../network/postApi';
import { useAuthStore } from '../../store/authStore';
import type { PostItem } from '../../types/post';

export default function NewPostScreen() {
  const { token, user } = useAuthStore();
  const [content, setContent] = useState('');
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

  const submitPost = async () => {
    if (!token || !user?.id) {
      Alert.alert('Vui lòng đăng nhập');
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      Alert.alert('Nội dung không được để trống');
      return;
    }

    setLoading(true);
    try {
      await postApi.addPost({
        token,
        described: trimmedContent,
        device_master: 'mobile',
      });
      setContent('');
      Alert.alert('Thành công', 'Bài đăng đã được tạo');
      loadPosts();
    } catch (error: any) {
      Alert.alert(error?.message || 'Không thể tạo bài đăng');
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }: { item: PostItem }) => (
    <PostCard post={item} onChange={loadPosts} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Teacher Post Management</Text>
      {isTeacher ? (
        <View style={styles.content}>
          <View style={styles.formCard}>
            <TextInput
              placeholder="Write your post here..."
              placeholderTextColor={theme.colors.muted}
              value={content}
              onChangeText={setContent}
              multiline
              style={[styles.input, styles.textArea]}
            />
            <Pressable
              style={[styles.button, (!content.trim() || loading) && styles.buttonDisabled]}
              onPress={submitPost}
              disabled={!content.trim() || loading}
            >
              <Text style={styles.buttonText}>Create Post</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>My Posts</Text>
          <FlatList
            data={posts}
            keyExtractor={(item) => item.post_id}
            renderItem={renderPost}
            refreshing={loading}
            onRefresh={loadPosts}
            ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Chưa có bài đăng nào</Text> : null}
            contentContainerStyle={styles.list}
          />
        </View>
      ) : (
        <View style={styles.notAllowed}>
          <Text style={styles.notAllowedText}>
            Chức năng này chỉ dành cho giáo viên.
          </Text>
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
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  input: {
    minHeight: 120,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    color: theme.colors.text,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 140,
  },
  button: {
    marginTop: theme.spacing.md,
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  list: {
    paddingBottom: theme.spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.muted,
    marginTop: theme.spacing.lg,
  },
  notAllowed: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  notAllowedText: {
    textAlign: 'center',
    fontSize: 16,
    color: theme.colors.muted,
  },
});
