import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Video from 'react-native-video';
import { postApi } from '../network/postApi';
import { theme } from '../constants/theme';
import { formatCount } from '../utils/format';
import { minutesSince, timeAgoVi } from '../utils/timeAgo';
import type { CommentItem, PostItem } from '../types/post';
import { useAuthStore } from '../store/authStore';
import Avatar from './Avatar';

const MAX_CHARS = 280;
const COMMENT_PAGE_SIZE = 20;

type PostCardProps = {
  post: PostItem;
  onChange: () => void;
};

const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('No Internet Connection');
    return false;
  }
  return true;
};

export default function PostCard({ post, onChange }: PostCardProps) {
  const { token, user } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(post.is_liked === '1');
  const [likeCount, setLikeCount] = useState(Number(post.like || 0));
  const [commentCount, setCommentCount] = useState(Number(post.comment || 0));
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.described || '');

  const isLong = (post.described || '').length > MAX_CHARS;
  const visibleText =
    expanded || !isLong
      ? post.described || ''
      : `${post.described?.slice(0, MAX_CHARS) || ''}...`;

  const canEdit =
    post.can_edit === '1' || (user?.id && user.id === post.author?.id);
  const canComment = post.can_comment !== '0';
  const createdMins = minutesSince(post.created);
  const isOnline = post.author?.online === '1';
  const timeColor =
    createdMins < 10 && isOnline
      ? theme.colors.primaryLight
      : theme.colors.muted;

  const name = post.author?.username || 'Nguoi dung';
  const avatarUrl = post.author?.avatar;

  const hasMedia = post.video && post.video.length > 0;
  const likeLabel = formatCount(likeCount);
  const commentLabel = formatCount(commentCount);

  const videoItems = useMemo(() => post.video || [], [post.video]);

  const toggleLike = async () => {
    if (!token) {
      Alert.alert('Vui long dang nhap lai');
      return;
    }
    if (token === 'mock-token') {
      const nextLiked = !liked;
      setLiked(nextLiked);
      setLikeCount(current => current + (nextLiked ? 1 : -1));
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));

    try {
      await postApi.likePost({ token, id: post.post_id });
    } catch (error) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      Alert.alert('Khong the cap nhat like');
    }
  };

  const toggleComments = async () => {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (!next || comments.length > 0) {
      return;
    }
    if (!token) {
      Alert.alert('Vui long dang nhap lai');
      return;
    }
    if (token === 'mock-token') {
      setComments([
        {
          id: 'mock-comment-1',
          comment: 'Bai tap rat huu ich!',
          poster: { id: 'mock-user-2', name: 'Hoc vien demo' },
        },
      ]);
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    try {
      setLoadingComments(true);
      const data = await postApi.getComments({
        token,
        id: post.post_id,
        index: '0',
        count: COMMENT_PAGE_SIZE.toString(),
      });
      setComments(data?.data || []);
    } catch {
      Alert.alert('Khong the tai binh luan');
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) {
      return;
    }
    if (!token) {
      Alert.alert('Vui long dang nhap lai');
      return;
    }
    if (token === 'mock-token') {
      setComments(current => [
        {
          id: `mock-${Date.now()}`,
          comment: commentText.trim(),
          poster: {
            id: user?.id || 'mock-user',
            name: user?.username || 'Ban',
          },
        },
        ...current,
      ]);
      setCommentText('');
      setCommentCount(current => current + 1);
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    try {
      const data = await postApi.setComment({
        token,
        id: post.post_id,
        comment: commentText.trim(),
        index: '0',
        count: COMMENT_PAGE_SIZE.toString(),
      });
      setCommentText('');
      setComments(data?.data || []);
      setCommentCount(current => current + 1);
    } catch {
      Alert.alert('Khong the gui binh luan');
    }
  };

  const confirmDelete = () => {
    Alert.alert('Xoa bai viet?', 'Hanh dong nay khong the hoan tac', [
      { text: 'Huy', style: 'cancel' },
      {
        text: 'Xoa',
        style: 'destructive',
        onPress: async () => {
          if (token === 'mock-token') {
            onChange();
            return;
          }
          if (!(await ensureOnline())) {
            return;
          }
          try {
            await postApi.deletePost(post.post_id);
            onChange();
          } catch {
            Alert.alert('Khong the xoa bai viet');
          }
        },
      },
    ]);
  };

  const submitEdit = async () => {
    if (!token) {
      Alert.alert('Vui long dang nhap lai');
      return;
    }
    if (!editText.trim()) {
      Alert.alert('Noi dung khong duoc de trong');
      return;
    }
    if (token === 'mock-token') {
      setEditing(false);
      onChange();
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    try {
      await postApi.editPost({
        token,
        id: post.post_id,
        described: editText.trim(),
      });
      setEditing(false);
      onChange();
    } catch {
      Alert.alert('Khong the cap nhat bai viet');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar uri={avatarUrl} name={name} size={40} />
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.time, { color: timeColor }]}>
            {timeAgoVi(post.created)}
          </Text>
        </View>
        <Pressable style={styles.menuButton} onPress={() => setMenuOpen(true)}>
          <Text style={styles.menuIcon}>...</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.text} selectable>
          {visibleText}
        </Text>
        {isLong && (
          <Pressable onPress={() => setExpanded(current => !current)}>
            <Text style={styles.seeMore}>
              {expanded ? 'See less' : 'See more'}
            </Text>
          </Pressable>
        )}
      </View>

      {hasMedia && (
        <View style={styles.videoWrap}>
          {videoItems.map((item, index) => (
            <Video
              key={`${post.post_id}-video-${index}`}
              source={{ uri: item.url }}
              controls
              style={styles.video}
              resizeMode="contain"
            />
          ))}
        </View>
      )}

      {(likeCount > 0 || commentCount > 0) && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {likeCount > 0 ? `${likeLabel} likes` : ''}
          </Text>
          <Text style={styles.countText}>
            {commentCount > 0 ? `${commentLabel} comments` : ''}
          </Text>
        </View>
      )}

      <View style={styles.divider} />
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={toggleLike}>
          <Text style={[styles.actionText, liked && styles.actionActive]}>
            Like
          </Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={toggleComments}>
          <Text style={styles.actionText}>Comment</Text>
        </Pressable>
      </View>

      {commentsOpen && (
        <View style={styles.comments}>
          {loadingComments ? (
            <Text style={styles.loadingText}>Dang tai binh luan...</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.commentList}>
              {comments.map(comment => (
                <View key={comment.id} style={styles.commentItem}>
                  <Avatar
                    uri={comment.poster?.avatar}
                    name={comment.poster?.name}
                    size={28}
                  />
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>
                      {comment.poster?.name || 'Nguoi dung'}
                    </Text>
                    <Text style={styles.commentText}>{comment.comment}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {canComment ? (
            <View style={styles.commentInputRow}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor={theme.colors.muted}
                style={styles.commentInput}
              />
              <Pressable style={styles.sendButton} onPress={submitComment}>
                <Text style={styles.sendText}>Send</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.lockedText}>Commenting is disabled</Text>
          )}
        </View>
      )}

      <Modal transparent visible={menuOpen} animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuOpen(false)}
        >
          <View style={styles.menuSheet}>
            {canEdit && (
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  setEditing(true);
                }}
              >
                <Text style={styles.menuText}>Edit post</Text>
              </Pressable>
            )}
            {canEdit && (
              <Pressable
                style={[styles.menuItem, styles.menuDanger]}
                onPress={() => {
                  setMenuOpen(false);
                  confirmDelete();
                }}
              >
                <Text style={[styles.menuText, styles.menuDangerText]}>
                  Delete post
                </Text>
              </Pressable>
            )}
            {!canEdit && (
              <Pressable
                style={styles.menuItem}
                onPress={() => setMenuOpen(false)}
              >
                <Text style={styles.menuText}>Close</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={editing} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.editSheet}>
            <Text style={styles.editTitle}>Edit post</Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              style={styles.editInput}
            />
            <View style={styles.editActions}>
              <Pressable
                style={styles.editButton}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.editCancel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.editButton} onPress={submitEdit}>
                <Text style={styles.editSave}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  headerText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  name: {
    fontWeight: '700',
    fontSize: 14,
    color: theme.colors.text,
  },
  time: {
    fontSize: 12,
    marginTop: 2,
  },
  menuButton: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.surface2,
  },
  menuIcon: {
    fontSize: 18,
    color: theme.colors.muted,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
    textAlign: 'justify',
  },
  seeMore: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  videoWrap: {
    backgroundColor: '#000000',
    marginTop: theme.spacing.sm,
  },
  video: {
    width: '100%',
    height: 240,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  countText: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  actionActive: {
    color: theme.colors.like,
  },
  comments: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface2,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  loadingText: {
    fontSize: 12,
    color: theme.colors.muted,
    paddingVertical: theme.spacing.sm,
  },
  commentList: {
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  commentItem: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  commentText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  commentInput: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
  },
  sendButton: {
    paddingHorizontal: theme.spacing.sm,
  },
  sendText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  lockedText: {
    fontSize: 12,
    color: theme.colors.muted,
    paddingVertical: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  menuSheet: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
  },
  menuItem: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  menuDanger: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  menuDangerText: {
    color: theme.colors.like,
  },
  editSheet: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  editInput: {
    minHeight: 120,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  editButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  editCancel: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  editSave: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
