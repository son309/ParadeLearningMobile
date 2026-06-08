import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import Video from 'react-native-video';
import { postApi } from '../network/postApi';
import { userApi } from '../network/userApi';
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
  const navigation = useNavigation<any>();
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
  // Chấm điểm — chỉ dùng khi GV xem bài nộp của HV
  const [scoringOpen, setScoringOpen] = useState(false);
  const [scoreInput, setScoreInput] = useState('');
  const [mistakesInput, setMistakesInput] = useState('');

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

  // HV xem bài của GV → có thể nộp bài
  const isStudentViewingExercise =
    user?.role === 'HV' && post.author?.role === 'GV';
  // GV xem bài nộp của HV → có thể chấm điểm
  const isTeacherViewingSubmission =
    user?.role === 'GV' && !!(post.exercise_id && post.exercise_id !== '');
  const commentLabel = formatCount(commentCount);

  const videoItems = useMemo(() => post.video || [], [post.video]);

  const toggleLike = async () => {
    if (!token) {
      Alert.alert('Vui lòng đăng nhập lại');
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    // Optimistic update
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));

    try {
      const data = await postApi.likePost({ token, id: post.post_id });
      // Đồng bộ với số like thực từ server
      if (data?.is_liked !== undefined) {
        setLiked(data.is_liked === '1');
      }
      if (data?.like !== undefined) {
        setLikeCount(Number(data.like));
      }
    } catch {
      // Rollback nếu lỗi
      setLiked(prevLiked);
      setLikeCount(prevCount);
      Alert.alert('Không thể cập nhật like');
    }
  };

  const toggleComments = async () => {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (!next) {
      return;
    }
    if (!token) {
      Alert.alert('Vui lòng đăng nhập lại');
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
      setComments(Array.isArray(data?.data) ? data.data : []);
    } catch (err: any) {
      // NO_DATA = chưa có bình luận nào — hiện list rỗng, không alert lỗi
      if (!err?.message?.includes('No data')) {
        Alert.alert('Không thể tải bình luận');
      }
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text) {
      return;
    }
    if (!token) {
      Alert.alert('Vui lòng đăng nhập lại');
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    try {
      const data = await postApi.setComment({
        token,
        id: post.post_id,
        comment: text,
        index: '0',
        count: COMMENT_PAGE_SIZE.toString(),
      });
      setCommentText('');
      // Server trả lại toàn bộ danh sách comment mới nhất
      setComments(Array.isArray(data?.data) ? data.data : []);
      setCommentCount(current => current + 1);
    } catch (err: any) {
      Alert.alert(err?.message || 'Không thể gửi bình luận');
    }
  };

  const confirmDelete = () => {
    Alert.alert('Xóa bài viết?', 'Hành động này không thể hoàn tác', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          if (!(await ensureOnline())) {
            return;
          }
          try {
            await postApi.deletePost(post.post_id);
            onChange();
          } catch (err: any) {
            Alert.alert(err?.message || 'Không thể xóa bài viết');
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

  const blockAuthor = async () => {
    if (!token || !post.author?.id) {
      return;
    }
    const authorName = post.author.username || 'người dùng này';
    const confirmed = await new Promise<boolean>(resolve => {
      Alert.alert(
        `Chặn ${authorName}?`,
        'Họ sẽ không còn thấy bài viết của bạn và không thể tương tác với bạn.',
        [
          { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Chặn', style: 'destructive', onPress: () => resolve(true) },
        ],
      );
    });
    if (!confirmed) {
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    try {
      await userApi.setBlock({ token, userId: post.author.id, type: '0' });
      setMenuOpen(false);
      // Refresh feed — bài của người bị chặn sẽ biến mất
      onChange();
    } catch (err: any) {
      Alert.alert(err?.message || 'Không thể chặn người dùng');
    }
  };

  const submitScore = async () => {
    if (!token) {
      return;
    }
    const scoreNum = parseInt(scoreInput.trim(), 10);
    if (!scoreInput.trim() || isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      Alert.alert('Điểm không hợp lệ', 'Vui lòng nhập điểm từ 0 đến 100');
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    try {
      await postApi.setComment({
        token,
        id: post.post_id,
        score: scoreInput.trim(),
        detail_mistakes: mistakesInput.trim() || undefined,
        index: '0',
        count: '10',
      });
      setScoringOpen(false);
      setScoreInput('');
      setMistakesInput('');
      Alert.alert('✅ Đã chấm điểm', `Điểm: ${scoreInput}/100`);
      onChange();
    } catch (err: any) {
      Alert.alert(err?.message || 'Không thể gửi điểm');
    }
  };

  return (
    <View style={styles.card}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Pressable
          style={styles.authorArea}
          onPress={() => {
            if (post.author?.id) {
              navigation.navigate('UserProfile', {
                userId: post.author.id,
                username: post.author.username,
                avatar: post.author.avatar,
              });
            }
          }}>
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
        </Pressable>

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
        <View style={[styles.videoWrap, videoItems.length === 2 && styles.videoWrapTwo]}>
          {videoItems.map((item, index) => (
            <Video
              key={`${post.post_id}-video-${index}`}
              source={{ uri: item.url }}
              controls
              style={[
                styles.video,
                videoItems.length === 2 && styles.videoTwo,
              ]}
              resizeMode="cover"
            />
          ))}
        </View>
      )}

      {/* ─── Reaction summary ─── */}
      {(likeCount > 0 || commentCount > 0) && (
        <View style={styles.countRow}>
          {likeCount > 0 && (
            <View style={styles.reactionSummary}>
              <View style={[styles.reactionBubble, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.reactionBubbleEmoji}>👍</Text>
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
        {/* Like button — BUG FIX: text turns blue when liked */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            liked && styles.actionButtonLiked,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={toggleLike}>
          <Text style={styles.actionEmoji}>👍</Text>
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

      {/* ─── Nộp bài (HV xem bài GV) ─── */}
      {isStudentViewingExercise && (
        <Pressable
          style={styles.submitBanner}
          onPress={() =>
            navigation.navigate('VideoPickerScreen', {
              exerciseId: post.post_id,
              courseId: post.author?.id,
              exerciseTitle: (post.described || '').slice(0, 60),
            })
          }>
          <Text style={styles.submitBannerIcon}>📤</Text>
          <Text style={styles.submitBannerText}>Nộp bài tập video cho bài này</Text>
          <Text style={styles.submitBannerArrow}>›</Text>
        </Pressable>
      )}

      {/* ─── Chấm điểm (GV xem bài nộp HV) ─── */}
      {isTeacherViewingSubmission && (
        <Pressable
          style={styles.scoreBanner}
          onPress={() => setScoringOpen(true)}>
          <Text style={styles.scoreBannerIcon}>⭐</Text>
          <Text style={styles.scoreBannerText}>Chấm điểm bài nộp này</Text>
          <Text style={styles.scoreBannerArrow}>›</Text>
        </Pressable>
      )}

      {/* ─── Comments Section ─── */}
      {commentsOpen && (
        <View style={styles.comments}>
          <View style={styles.divider} />

          {loadingComments ? (
            <Text style={styles.loadingText}>Đang tải bình luận...</Text>
          ) : comments.length === 0 ? (
            <Text style={styles.emptyComments}>Chưa có bình luận nào. Hãy là người đầu tiên!</Text>
          ) : (
            <View style={styles.commentList}>
              {comments.map(comment => (
                <View key={comment.id} style={styles.commentItem}>
                  <Pressable
                    onPress={() => {
                      if (comment.poster?.id) {
                        navigation.navigate('UserProfile', {
                          userId: comment.poster.id,
                          username: comment.poster.name,
                          avatar: comment.poster.avatar,
                        });
                      }
                    }}>
                    <Avatar
                      uri={comment.poster?.avatar}
                      name={comment.poster?.name}
                      size={32}
                    />
                  </Pressable>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>
                      {comment.poster?.name || 'Người dùng'}
                    </Text>
                    {comment.comment ? (
                      <Text style={styles.commentText}>{comment.comment}</Text>
                    ) : null}
                    {comment.created ? (
                      <Text style={styles.commentTime}>
                        {timeAgoVi(comment.created)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
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

            {/* Chặn người dùng — chỉ hiện cho bài của người khác */}
            {!canEdit && post.author?.id && (
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={blockAuthor}>
                <Text style={styles.menuItemEmoji}>🚫</Text>
                <Text style={[styles.menuText, styles.menuDangerText]}>
                  Chặn {post.author.username || 'người dùng này'}
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

      {/* ─── Scoring Modal (GV chấm điểm bài HV) ─── */}
      <Modal transparent visible={scoringOpen} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.editSheet}>
            <View style={styles.menuHandle} />
            <Text style={styles.editTitle}>⭐ Chấm điểm bài nộp</Text>

            <Text style={styles.scoreLabel}>Điểm (0 – 100)</Text>
            <TextInput
              value={scoreInput}
              onChangeText={setScoreInput}
              keyboardType="numeric"
              maxLength={3}
              placeholder="VD: 85"
              placeholderTextColor={theme.colors.muted}
              style={styles.scoreInput}
            />

            <Text style={styles.scoreLabel}>Nhận xét / Lỗi kỹ thuật (tuỳ chọn)</Text>
            <TextInput
              value={mistakesInput}
              onChangeText={setMistakesInput}
              multiline
              placeholder="VD: Tư thế tay chưa đúng, cần điều chỉnh góc khuỷu..."
              placeholderTextColor={theme.colors.muted}
              style={[styles.editInput, { minHeight: 80 }]}
            />

            <View style={styles.editActions}>
              <Pressable
                style={styles.editCancelButton}
                onPress={() => {
                  setScoringOpen(false);
                  setScoreInput('');
                  setMistakesInput('');
                }}>
                <Text style={styles.editCancelText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.editSaveButton} onPress={submitScore}>
                <Text style={styles.editSaveText}>Gửi điểm</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
  // ─── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: theme.colors.surface,
    // FB feed gap is natively handled by the parent's gap or this bottom margin
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },

  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  authorArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.online,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontWeight: theme.fontWeight.semibold,
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
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.regular,
  },
  metaSep: {
    fontSize: theme.font.xs,
    color: theme.colors.textSecondary,
  },
  metaIcon: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  // 3-dot menu
  menuButton: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  menuButtonPressed: {
    backgroundColor: theme.colors.surfaceHover,
  },
  menuIcon: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1.5,
  },

  // ─── Content ───────────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  text: {
    fontSize: theme.font.md,
    lineHeight: 22,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.regular,
  },
  seeMore: {
    marginTop: 4,
    fontSize: theme.font.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },

  // ─── Media ─────────────────────────────────────────────────────────────────
  videoWrap: {
    backgroundColor: '#000',
  },
  videoWrapTwo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  video: {
    width: '100%',
    height: 360,
  },
  videoTwo: {
    width: '49.8%',
    height: 400,
  },

  // ─── Reaction summary row ──────────────────────────────────────────────────
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
    gap: 6,
  },
  reactionBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
  },
  reactionBubbleEmoji: {
    fontSize: 11,
  },
  countText: {
    fontSize: theme.font.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.regular,
  },

  // ─── Divider ───────────────────────────────────────────────────────────────
  divider: {
    height: 0.5,
    backgroundColor: theme.colors.divider,
    marginHorizontal: theme.spacing.lg,
  },

  // ─── Action buttons ────────────────────────────────────────────────────────
  actions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: theme.radius.sm,
  },
  actionButtonLiked: {
    backgroundColor: theme.colors.primaryLight,
  },
  actionButtonPressed: {
    backgroundColor: theme.colors.surfaceHover,
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionText: {
    fontSize: theme.font.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  actionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },

  // ─── Comments section ──────────────────────────────────────────────────────
  comments: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  loadingText: {
    fontSize: theme.font.sm,
    color: theme.colors.textSecondary,
    paddingVertical: theme.spacing.sm,
    textAlign: 'center',
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
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  commentText: {
    fontSize: theme.font.sm,
    color: theme.colors.text,
    lineHeight: 18,
    fontWeight: theme.fontWeight.regular,
  },
  commentTime: {
    fontSize: theme.font.xs,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  emptyComments: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.font.sm,
    paddingVertical: theme.spacing.md,
    fontStyle: 'italic',
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
    marginLeft: 4,
  },
  sendText: {
    fontSize: theme.font.md,
    fontWeight: theme.fontWeight.extrabold,
    color: '#fff',
  },
  lockedText: {
    fontSize: theme.font.sm,
    color: theme.colors.textSecondary,
    paddingVertical: theme.spacing.sm,
    textAlign: 'center',
  },

  // ─── Modal overlay ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },

  // ─── Options menu sheet ────────────────────────────────────────────────────
  menuSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    paddingTop: theme.spacing.sm,
    ...theme.shadow.elevated,
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
    fontSize: theme.font.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: theme.spacing.md,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  menuItemPressed: {
    backgroundColor: theme.colors.surfaceHover,
  },
  menuItemEmoji: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: theme.font.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  menuDangerText: {
    color: theme.colors.danger,
  },

  // ─── Edit sheet ────────────────────────────────────────────────────────────
  editSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    paddingTop: theme.spacing.sm,
    ...theme.shadow.elevated,
  },
  editTitle: {
    fontSize: theme.font.lg,
    fontWeight: theme.fontWeight.bold,
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
    lineHeight: 22,
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
    fontWeight: theme.fontWeight.semibold,
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
    fontWeight: theme.fontWeight.bold,
    color: '#fff',
  },

  // ─── Submit banner (HV nộp bài) ───────────────────────────────────────────
  submitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.divider,
  },
  submitBannerIcon: { fontSize: 18 },
  submitBannerText: {
    flex: 1,
    fontSize: theme.font.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primaryDark,
  },
  submitBannerArrow: {
    fontSize: theme.font.xl,
    color: theme.colors.primaryDark,
    fontWeight: theme.fontWeight.regular,
  },

  // ─── Score banner (GV chấm điểm) ─────────────────────────────────────────
  scoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.divider,
  },
  scoreBannerIcon: { fontSize: 18 },
  scoreBannerText: {
    flex: 1,
    fontSize: theme.font.sm,
    fontWeight: theme.fontWeight.semibold,
    color: '#B45309',
  },
  scoreBannerArrow: {
    fontSize: theme.font.xl,
    color: '#B45309',
    fontWeight: theme.fontWeight.regular,
  },

  // ─── Score input in scoring modal ─────────────────────────────────────────
  scoreLabel: {
    fontSize: theme.font.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: 4,
  },
  scoreInput: {
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.font.xxl,
    fontWeight: theme.fontWeight.bold,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    textAlign: 'center',
  },
});
