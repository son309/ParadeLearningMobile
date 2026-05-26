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
    createdMins < 10 && isOnline ? theme.colors.online : theme.colors.muted;

  const name = post.author?.username || 'Người dùng';
  const avatarUrl = post.author?.avatar;

  const hasMedia = post.video && post.video.length > 0;
  const likeLabel = formatCount(likeCount);
  const commentLabel = formatCount(commentCount);

  const videoItems = useMemo(() => post.video || [], [post.video]);

  const toggleLike = async () => {
    if (!token) {
      Alert.alert('Vui lòng đăng nhập lại');
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
      Alert.alert('Không thể cập nhật like');
    }
  };

  const toggleComments = async () => {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (!next || comments.length > 0) {
      return;
    }
    if (!token) {
      Alert.alert('Vui lòng đăng nhập lại');
      return;
    }
    if (token === 'mock-token') {
      setComments([
        {
          id: 'mock-comment-1',
          comment: 'Bài tập rất hữu ích! 👍',
          poster: { id: 'mock-user-2', name: 'Học viên demo' },
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
      Alert.alert('Không thể tải bình luận');
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) {
      return;
    }
    if (!token) {
      Alert.alert('Vui lòng đăng nhập lại');
      return;
    }
    if (token === 'mock-token') {
      setComments(current => [
        {
          id: `mock-${Date.now()}`,
          comment: commentText.trim(),
          poster: {
            id: user?.id || 'mock-user',
            name: user?.username || 'Bạn',
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
      Alert.alert('Không thể gửi bình luận');
    }
  };

  const confirmDelete = () => {
    Alert.alert('Xóa bài viết?', 'Hành động này không thể hoàn tác', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
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
            Alert.alert('Không thể xóa bài viết');
          }
        },
      },
    ]);
  };

  const submitEdit = async () => {
    if (!token) {
      Alert.alert('Vui lòng đăng nhập lại');
      return;
    }
    if (!editText.trim()) {
      Alert.alert('Nội dung không được để trống');
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
      Alert.alert('Không thể cập nhật bài viết');
    }
  };

  return (
    <View style={styles.card}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Avatar uri={avatarUrl} name={name} size={42} />
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.time, { color: timeColor }]}>
              {timeAgoVi(post.created)}
            </Text>
            <Text style={styles.metaSep}> · </Text>
            <Text style={styles.metaIcon}>🌐</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.menuButton,
            pressed && styles.menuButtonPressed,
          ]}
          onPress={() => setMenuOpen(true)}>
          <Text style={styles.menuIcon}>•••</Text>
        </Pressable>
      </View>

      {/* ─── Content ─── */}
      <View style={styles.content}>
        <Text style={styles.text} selectable>
          {visibleText}
        </Text>
        {isLong && (
          <Pressable onPress={() => setExpanded(current => !current)}>
            <Text style={styles.seeMore}>
              {expanded ? 'Thu gọn' : 'Xem thêm'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* ─── Media ─── */}
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

      {/* ─── Reaction summary ─── */}
      {(likeCount > 0 || commentCount > 0) && (
        <View style={styles.countRow}>
          {likeCount > 0 && (
            <View style={styles.reactionSummary}>
              <View style={styles.reactionEmojis}>
                <View style={[styles.reactionBubble, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.reactionBubbleEmoji}>👍</Text>
                </View>
              </View>
              <Text style={styles.countText}>{likeLabel}</Text>
            </View>
          )}
          {commentCount > 0 && (
            <Text style={styles.countText}>{commentLabel} bình luận</Text>
          )}
        </View>
      )}

      {/* ─── Divider ─── */}
      <View style={styles.divider} />

      {/* ─── Actions ─── */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={toggleLike}>
          <Text style={styles.actionEmoji}>{liked ? '👍' : '👍'}</Text>
          <Text
            style={[styles.actionText, liked && styles.actionTextActive]}>
            Thích
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={toggleComments}>
          <Text style={styles.actionEmoji}>💬</Text>
          <Text style={styles.actionText}>Bình luận</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}>
          <Text style={styles.actionEmoji}>↗️</Text>
          <Text style={styles.actionText}>Chia sẻ</Text>
        </Pressable>
      </View>

      {/* ─── Comments Section ─── */}
      {commentsOpen && (
        <View style={styles.comments}>
          <View style={styles.divider} />

          {loadingComments ? (
            <Text style={styles.loadingText}>Đang tải bình luận...</Text>
          ) : (
            <ScrollView
              contentContainerStyle={styles.commentList}
              nestedScrollEnabled>
              {comments.map(comment => (
                <View key={comment.id} style={styles.commentItem}>
                  <Avatar
                    uri={comment.poster?.avatar}
                    name={comment.poster?.name}
                    size={32}
                  />
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>
                      {comment.poster?.name || 'Người dùng'}
                    </Text>
                    <Text style={styles.commentText}>{comment.comment}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {canComment ? (
            <View style={styles.commentInputRow}>
              <Avatar uri={user?.avatar} name={user?.username} size={32} />
              <View style={styles.commentInputWrap}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Viết bình luận..."
                  placeholderTextColor={theme.colors.muted}
                  style={styles.commentInput}
                  onSubmitEditing={submitComment}
                  returnKeyType="send"
                />
                {commentText.trim().length > 0 && (
                  <Pressable style={styles.sendButton} onPress={submitComment}>
                    <Text style={styles.sendText}>↑</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.lockedText}>🔒 Bình luận bị tắt</Text>
          )}
        </View>
      )}

      {/* ─── Options Menu Modal ─── */}
      <Modal transparent visible={menuOpen} animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuOpen(false)}>
          <Pressable
            style={styles.menuSheet}
            onPress={e => e.stopPropagation()}>
            <View style={styles.menuHandle} />
            <Text style={styles.menuTitle}>Tùy chọn bài viết</Text>

            {canEdit && (
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={() => {
                  setMenuOpen(false);
                  setEditing(true);
                }}>
                <Text style={styles.menuItemEmoji}>✏️</Text>
                <Text style={styles.menuText}>Chỉnh sửa bài viết</Text>
              </Pressable>
            )}

            {canEdit && (
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={() => {
                  setMenuOpen(false);
                  confirmDelete();
                }}>
                <Text style={styles.menuItemEmoji}>🗑️</Text>
                <Text style={[styles.menuText, styles.menuDangerText]}>
                  Xóa bài viết
                </Text>
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuItemEmoji}>❌</Text>
              <Text style={styles.menuText}>Đóng</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Edit Modal ─── */}
      <Modal transparent visible={editing} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.editSheet}>
            <View style={styles.menuHandle} />
            <Text style={styles.editTitle}>Chỉnh sửa bài viết</Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              style={styles.editInput}
              placeholderTextColor={theme.colors.muted}
              placeholder="Nội dung bài viết..."
            />
            <View style={styles.editActions}>
              <Pressable
                style={styles.editCancelButton}
                onPress={() => setEditing(false)}>
                <Text style={styles.editCancelText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.editSaveButton} onPress={submitEdit}>
                <Text style={styles.editSaveText}>Lưu</Text>
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
    marginBottom: theme.spacing.sm,
    // Facebook posts have no border radius on mobile — full-width cards
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.online,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  headerText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  name: {
    fontWeight: '700',
    fontSize: theme.font.md,
    color: theme.colors.text,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: theme.font.xs,
  },
  metaSep: {
    fontSize: theme.font.xs,
    color: theme.colors.muted,
  },
  metaIcon: {
    fontSize: 10,
  },
  menuButton: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  menuButtonPressed: {
    backgroundColor: theme.colors.surface2,
  },
  menuIcon: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  text: {
    fontSize: theme.font.md,
    lineHeight: 22,
    color: theme.colors.text,
  },
  seeMore: {
    marginTop: 4,
    fontSize: theme.font.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  videoWrap: {
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: 240,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  reactionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionEmojis: {
    flexDirection: 'row',
  },
  reactionBubble: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
  },
  reactionBubbleEmoji: {
    fontSize: 10,
  },
  countText: {
    fontSize: theme.font.xs,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  divider: {
    height: 0.5,
    backgroundColor: theme.colors.divider,
    marginHorizontal: theme.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: theme.radius.sm,
  },
  actionButtonPressed: {
    backgroundColor: theme.colors.surface2,
  },
  actionEmoji: {
    fontSize: 16,
    opacity: 0.8,
  },
  actionText: {
    fontSize: theme.font.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  actionTextActive: {
    color: theme.colors.like,
  },
  comments: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  loadingText: {
    fontSize: theme.font.sm,
    color: theme.colors.muted,
    paddingVertical: theme.spacing.sm,
  },
  commentList: {
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  commentItem: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  commentAuthor: {
    fontSize: theme.font.xs,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  commentText: {
    fontSize: theme.font.sm,
    color: theme.colors.text,
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  commentInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    minHeight: 38,
  },
  commentInput: {
    flex: 1,
    fontSize: theme.font.sm,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  sendText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  lockedText: {
    fontSize: theme.font.sm,
    color: theme.colors.muted,
    paddingVertical: theme.spacing.sm,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  menuHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  menuTitle: {
    fontSize: theme.font.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
  },
  menuItemPressed: {
    backgroundColor: theme.colors.surface2,
  },
  menuItemEmoji: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  menuText: {
    fontSize: theme.font.md,
    color: theme.colors.text,
    fontWeight: '500',
  },
  menuDangerText: {
    color: theme.colors.danger,
  },
  editSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  editTitle: {
    fontSize: theme.font.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  editInput: {
    minHeight: 120,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: theme.spacing.md,
    color: theme.colors.text,
    textAlignVertical: 'top',
    fontSize: theme.font.md,
    backgroundColor: theme.colors.surface2,
  },
  editActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  editCancelButton: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCancelText: {
    fontSize: theme.font.md,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  editSaveButton: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveText: {
    fontSize: theme.font.md,
    fontWeight: '700',
    color: '#fff',
  },
});
