import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import type {
  AIAnnotation,
  CommentAnnotationPayload,
  VideoUploadResult,
  VideoSlot,
} from '../../types/media';

// Mock Annotations
// TODO: Xóa khi backend đã trả đủ annotations trong data

const MOCK_ANNOTATIONS: AIAnnotation[] = [
  {
    timestamp: 3.5,
    x: 0.42,
    y: 0.61,
    label: 'Tư thế tay chưa đúng',
    score: 0.91,
    cameraAngle: 'front',
  },
  {
    timestamp: 7.2,
    x: 0.55,
    y: 0.38,
    label: 'Góc khuỷu tay không đúng',
    score: 0.87,
    cameraAngle: 'back',
  },
  {
    timestamp: 12.0,
    x: 0.3,
    y: 0.75,
    label: 'Vị trí chân chưa chuẩn',
    score: 0.76,
    cameraAngle: 'front',
  },
  {
    timestamp: 18.5,
    x: 0.6,
    y: 0.5,
    label: 'Trọng tâm lệch',
    score: 0.83,
    cameraAngle: 'back',
  },
];

// Helper

const formatTimestamp = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
};

const scoreColor = (score: number) => {
  if (score >= 0.85) {
    return '#C0392B';
  } // lỗi nghiêm trọng → đỏ
  if (score >= 0.7) {
    return '#E67E22';
  } // lỗi vừa → cam
  return '#F1C40F'; // lỗi nhẹ → vàng
};

const scoreLabel = (aiScore?: number) => {
  if (!aiScore) {
    return { label: '—', color: theme.colors.muted };
  }
  if (aiScore >= 85) {
    return { label: 'Xuất sắc', color: '#1E8449' };
  }
  if (aiScore >= 70) {
    return { label: 'Tốt', color: '#2980B9' };
  }
  if (aiScore >= 50) {
    return { label: 'Trung bình', color: '#E67E22' };
  }
  return { label: 'Cần cải thiện', color: '#C0392B' };
};

// Component

type RouteParams = {
  result: VideoUploadResult;
  slots: { front: VideoSlot; back: VideoSlot };
};

export default function AIResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { result, slots } = route.params as RouteParams;

  const [filterAngle, setFilterAngle] = useState<'all' | 'front' | 'back'>('all');

  // Dùng annotations từ server nếu có, fallback mock
  const allAnnotations: AIAnnotation[] = useMemo(
    () =>
      result?.annotations && result.annotations.length > 0
        ? result.annotations
        : MOCK_ANNOTATIONS,
    [result?.annotations],
  );

  const filteredAnnotations = useMemo(() => {
    if (filterAngle === 'all') {
      return allAnnotations;
    }
    return allAnnotations.filter(a => a.cameraAngle === filterAngle);
  }, [allAnnotations, filterAngle]);

  const sl = scoreLabel(result?.aiScore);

  //  Chia sẻ sang bình luận 
  const handleShareComment = () => {
    const payload: CommentAnnotationPayload = {
      videoUrl: result?.video ?? '',
      thumbUrl: result?.thumb ?? '',
      annotations: allAnnotations,
      aiScore: result?.aiScore,
      aiFeedback: result?.aiFeedback,
    };

    /**
     * Chuyển giao payload cho Người 3 (màn hình bình luận).
     *
     * Cách tích hợp:
     *   navigation.navigate('PostDetail', {
     *     annotationPayload: payload,
     *     autoComment: true,
     *   });
     *
     * Hoặc nếu dùng Zustand store:
     *   useCommentStore.getState().setAnnotationPayload(payload);
     *   navigation.goBack();
     *
     * TODO: Thay đoạn dưới bằng navigate thực tế khi Người 3 đã làm xong.
     */
    Alert.alert(
      'Chia sẻ thành công ✅',
      `Đã chuyển ${allAnnotations.length} nhận xét AI sang phần bình luận.`,
      [
        {
          text: 'OK',
          onPress: () => {
            // TODO: navigation.navigate('PostDetail', { annotationPayload: payload })
            navigation.popToTop();
          },
        },
      ],
    );
  };

  // Render

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Kết quả AI</Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={filteredAnnotations}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Score Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>
                  {result?.aiScore ?? '—'}
                </Text>
                {result?.aiScore != null && (
                  <Text style={styles.scoreUnit}>/100</Text>
                )}
              </View>
              <View style={styles.scoreInfo}>
                <Text style={[styles.scoreGrade, { color: sl.color }]}>
                  {sl.label}
                </Text>
                <Text style={styles.scoreFeedback}>
                  {result?.aiFeedback ??
                    'AI đang phân tích… kết quả chi tiết sẽ có ngay bên dưới.'}
                </Text>
              </View>
            </View>

            {/* Video Info */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>🎥</Text>
                <Text style={styles.infoText}>Góc trước đã upload</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📹</Text>
                <Text style={styles.infoText}>Góc sau đã upload</Text>
              </View>
            </View>

            {/* Annotations Header + Filter */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                🔍 Tọa độ lỗi được phát hiện ({allAnnotations.length})
              </Text>
            </View>
            <View style={styles.filterRow}>
              {(['all', 'front', 'back'] as const).map(f => (
                <Pressable
                  key={f}
                  style={[
                    styles.filterBtn,
                    filterAngle === f && styles.filterBtnActive,
                  ]}
                  onPress={() => setFilterAngle(f)}>
                  <Text
                    style={[
                      styles.filterText,
                      filterAngle === f && styles.filterTextActive,
                    ]}>
                    {f === 'all' ? 'Tất cả' : f === 'front' ? 'Góc trước' : 'Góc sau'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <View style={styles.annotationCard}>
            {/* Timeline badge */}
            <View style={styles.timelineBadge}>
              <Text style={styles.timelineText}>
                {formatTimestamp(item.timestamp)}
              </Text>
            </View>

            <View style={styles.annotationBody}>
              <View style={styles.annotationTopRow}>
                <Text style={styles.annotationIndex}>#{index + 1}</Text>
                <View
                  style={[
                    styles.angleBadge,
                    item.cameraAngle === 'front'
                      ? styles.angleFront
                      : styles.angleBack,
                  ]}>
                  <Text style={styles.angleBadgeText}>
                    {item.cameraAngle === 'front' ? '🎥 Góc trước' : '📹 Góc sau'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.severityDot,
                    { backgroundColor: scoreColor(item.score) },
                  ]}
                />
              </View>

              <Text style={styles.annotationLabel}>{item.label}</Text>

              <View style={styles.annotationMeta}>
                <Text style={styles.coordText}>
                  📍 X: {(item.x * 100).toFixed(0)}%  Y: {(item.y * 100).toFixed(0)}%
                </Text>
                <Text
                  style={[
                    styles.confidenceText,
                    { color: scoreColor(item.score) },
                  ]}>
                  Độ tin cậy: {(item.score * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>
              Không phát hiện lỗi nào ở góc này!
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* Share Button (sticky bottom) */}
      <View style={styles.stickyFooter}>
        <Pressable style={styles.shareBtn} onPress={handleShareComment}>
          <Text style={styles.shareBtnIcon}>💬</Text>
          <Text style={styles.shareBtnText}>Chia sẻ lên bình luận</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// Styles

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: theme.colors.text,
    lineHeight: 26,
  },
  headerTitle: {
    fontSize: theme.font.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },

  listContent: {
    paddingBottom: 20,
  },

  // Score Card
  scoreCard: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
    lineHeight: 28,
  },
  scoreUnit: {
    fontSize: 10,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreGrade: {
    fontSize: theme.font.xl,
    fontWeight: '800',
    marginBottom: 4,
  },
  scoreFeedback: {
    color: theme.colors.muted,
    fontSize: theme.font.xs,
    lineHeight: 16,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#A9DFBF',
    backgroundColor: '#EAFAF1',
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#1E8449',
  },

  // Section
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    color: theme.colors.text,
    fontSize: theme.font.md,
  },

  // Filter
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  filterTextActive: {
    color: '#fff',
  },

  // Annotation Card
  annotationCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  timelineBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#C5DCFA',
  },
  timelineText: {
    fontWeight: '700',
    color: theme.colors.primary,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  annotationBody: {
    padding: theme.spacing.md,
    gap: 6,
  },
  annotationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  annotationIndex: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: '700',
  },
  angleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  angleFront: {
    backgroundColor: '#EBF5FB',
  },
  angleBack: {
    backgroundColor: '#FEF9E7',
  },
  angleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 'auto',
  },
  annotationLabel: {
    fontWeight: '700',
    color: theme.colors.text,
    fontSize: theme.font.sm,
  },
  annotationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordText: {
    fontSize: 11,
    color: theme.colors.muted,
    fontVariant: ['tabular-nums'],
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty
  emptyBox: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: theme.font.sm,
    fontWeight: '600',
  },

  // Sticky Footer
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  shareBtn: {
    height: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadow.card,
  },
  shareBtnIcon: {
    fontSize: 20,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.font.md,
  },
});
