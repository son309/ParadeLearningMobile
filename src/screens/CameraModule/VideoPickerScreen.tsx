/**
 * VideoPickerScreen
 *
 * Feature:
 *  - Choose or record 2 videos (front + back)
 *  - Preview thumbnail after selection
 *  - Upload to AI server via upload_video API
 *  - Receive error coordinates and navigate to AIResultScreen
 */

import React, { useCallback, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { mediaApi } from '../../network/mediaApi';
import { theme } from '../../constants/theme';
import type { VideoSlot, VideoUploadResult } from '../../types/media';

// Lazy import react-native-image-picker
let launchImageLibrary: any;
let launchCamera: any;
try {
  const rnip = require('react-native-image-picker');
  launchImageLibrary = rnip.launchImageLibrary;
  launchCamera = rnip.launchCamera;
} catch {
  console.warn('Missing react-native-image-picker');
}


type SlotKey = 'front' | 'back';

const SLOT_CONFIG: { key: SlotKey; label: string; icon: string; desc: string }[] =
  [
    {
      key: 'front',
      label: 'Góc trước',
      icon: '🎥',
      desc: 'Camera hướng mặt / vị trí người chơi',
    },
    {
      key: 'back',
      label: 'Góc sau',
      icon: '📹',
      desc: 'Camera hướng lưng / toàn thân',
    },
  ];

export default function VideoPickerScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuthStore();

  const [slots, setSlots] = useState<Partial<Record<SlotKey, VideoSlot>>>({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Choose video

  const pickVideo = useCallback(
    (slotKey: SlotKey, source: 'library' | 'camera') => {
      if (!launchImageLibrary || !launchCamera) {
        Alert.alert(
          'Thiếu thư viện',
          'Vui lòng chạy: npm install react-native-image-picker\nrồi rebuild app.',
        );
        return;
      }

      const options = {
        mediaType: 'video' as const,
        videoQuality: 'high' as const,
        durationLimit: 120, // tối đa 2 phút
        includeBase64: false,
      };

      const launcher =
        source === 'camera' ? launchCamera : launchImageLibrary;

      launcher(options, (response: any) => {
        if (response.didCancel || response.errorCode) {
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) {
          return;
        }

        setSlots(prev => ({
          ...prev,
          [slotKey]: {
            uri: asset.uri,
            fileName: asset.fileName,
            fileSize: asset.fileSize,
            duration: asset.duration,
            angle: slotKey,
          } satisfies VideoSlot,
        }));
      });
    },
    [],
  );

  const showPickOptions = useCallback(
    (slotKey: SlotKey) => {
      Alert.alert(
        slotKey === 'front' ? 'Video góc trước' : 'Video góc sau',
        'Chọn nguồn video',
        [
          {
            text: '📷 Quay video',
            onPress: () => pickVideo(slotKey, 'camera'),
          },
          {
            text: '🖼 Chọn từ thư viện',
            onPress: () => pickVideo(slotKey, 'library'),
          },
          { text: 'Hủy', style: 'cancel' },
        ],
      );
    },
    [pickVideo],
  );

  // Upload & analysis AI

  const handleAnalyze = useCallback(async () => {
    if (!token) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
      return;
    }

    const frontSlot = slots.front;
    const backSlot = slots.back;

    if (!frontSlot || !backSlot) {
      Alert.alert('Chưa đủ video', 'Vui lòng chọn đủ video cho cả 2 góc.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const result: VideoUploadResult = await mediaApi.uploadDualVideo(
        frontSlot.uri,
        backSlot.uri,
        token,
        pct => setProgress(pct),
      );

      // Chuyển sang màn hình kết quả AI
      navigation.navigate('AIResultScreen', {
        result,
        slots: { front: frontSlot, back: backSlot },
      });
    } catch (error: any) {
      Alert.alert(
        'Upload thất bại',
        error?.message || 'Không thể kết nối server. Thử lại sau.',
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [token, slots, navigation]);

  const bothSelected = !!slots.front && !!slots.back;

  // Render

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Nộp bài tập video</Text>
            <Text style={styles.headerSub}>AI sẽ chấm điểm kỹ thuật của bạn</Text>
          </View>
        </View>

        {/* Instruction Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>🤖</Text>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Hướng dẫn quay video</Text>
            <Text style={styles.bannerDesc}>
              Quay 2 góc để AI phân tích chính xác hơn.{'\n'}
              Mỗi video tối đa 2 phút, chất lượng cao.
            </Text>
          </View>
        </View>

        {/* Video Slots */}
        {SLOT_CONFIG.map(slot => {
          const selected = slots[slot.key];
          const durationStr = selected?.duration
            ? `${Math.round(selected.duration)}s`
            : null;
          const sizeStr = selected?.fileSize
            ? `${(selected.fileSize / 1_000_000).toFixed(1)} MB`
            : null;

          return (
            <View key={slot.key} style={styles.slotCard}>
              {/* Slot Header */}
              <View style={styles.slotHeader}>
                <Text style={styles.slotIcon}>{slot.icon}</Text>
                <View style={styles.slotInfo}>
                  <Text style={styles.slotLabel}>{slot.label}</Text>
                  <Text style={styles.slotDesc}>{slot.desc}</Text>
                </View>
                {selected && (
                  <View style={styles.slotBadgeDone}>
                    <Text style={styles.slotBadgeDoneText}>✓ Đã chọn</Text>
                  </View>
                )}
              </View>

              {/* Preview hoặc Placeholder */}
              {selected ? (
                <View style={styles.previewBox}>
                  <View style={styles.previewIconWrap}>
                    <Text style={styles.previewIcon}>🎬</Text>
                  </View>
                  <View style={styles.previewMeta}>
                    <Text
                      style={styles.previewFileName}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      {selected.fileName ?? selected.uri.split('/').pop()}
                    </Text>
                    <View style={styles.previewTags}>
                      {durationStr && (
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>⏱ {durationStr}</Text>
                        </View>
                      )}
                      {sizeStr && (
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>💾 {sizeStr}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyPreview}>
                  <Text style={styles.emptyPreviewIcon}>📂</Text>
                  <Text style={styles.emptyPreviewText}>Chưa có video</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.slotActions}>
                <Pressable
                  style={[styles.actionBtn, styles.actionBtnCamera]}
                  onPress={() => pickVideo(slot.key, 'camera')}>
                  <Text style={styles.actionBtnText}>📷 Quay video</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.actionBtnLibrary]}
                  onPress={() => pickVideo(slot.key, 'library')}>
                  <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>
                    🖼 Thư viện
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {/* Progress Indicator khi upload */}
        {uploading && (
          <View style={styles.progressCard}>
            <ActivityIndicator color={theme.colors.primary} size="small" />
            <Text style={styles.progressLabel}>
              Đang upload lên server AI... {progress}%
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressHint}>
              Quá trình có thể mất vài phút tuỳ kích thước video
            </Text>
          </View>
        )}

        {/* Analyze Button */}
        <Pressable
          style={[
            styles.analyzeBtn,
            (!bothSelected || uploading) && styles.analyzeBtnDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={!bothSelected || uploading}>
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.analyzeBtnIcon}>🤖</Text>
              <Text style={styles.analyzeBtnText}>Phân tích AI</Text>
            </>
          )}
        </Pressable>

        {!bothSelected && !uploading && (
          <Text style={styles.hintText}>
            ⚠️ Cần chọn đủ cả 2 video trước khi phân tích
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
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
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.font.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSub: {
    fontSize: theme.font.xs,
    color: theme.colors.muted,
    marginTop: 2,
  },

  // Banner
  banner: {
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#C5DCFA',
  },
  bannerIcon: {
    fontSize: 28,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontWeight: '700',
    color: theme.colors.primary,
    fontSize: theme.font.sm,
    marginBottom: 4,
  },
  bannerDesc: {
    color: '#166FE5',
    fontSize: theme.font.xs,
    lineHeight: 18,
  },

  // Slot Card
  slotCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  slotIcon: {
    fontSize: 24,
  },
  slotInfo: {
    flex: 1,
  },
  slotLabel: {
    fontWeight: '700',
    color: theme.colors.text,
    fontSize: theme.font.md,
  },
  slotDesc: {
    color: theme.colors.muted,
    fontSize: theme.font.xs,
    marginTop: 2,
  },
  slotBadgeDone: {
    backgroundColor: '#EAFAF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: '#A9DFBF',
  },
  slotBadgeDoneText: {
    color: '#1E8449',
    fontSize: 11,
    fontWeight: '700',
  },

  // Preview
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  previewIconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIcon: {
    fontSize: 24,
  },
  previewMeta: {
    flex: 1,
  },
  previewFileName: {
    fontWeight: '600',
    color: theme.colors.text,
    fontSize: theme.font.xs,
    marginBottom: 4,
  },
  previewTags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  tagText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  emptyPreview: {
    height: 72,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    gap: 4,
  },
  emptyPreviewIcon: {
    fontSize: 20,
  },
  emptyPreviewText: {
    color: theme.colors.muted,
    fontSize: theme.font.xs,
  },

  // Slot Action Buttons
  slotActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnCamera: {
    backgroundColor: theme.colors.primary,
  },
  actionBtnLibrary: {
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionBtnText: {
    fontWeight: '600',
    fontSize: theme.font.sm,
    color: '#fff',
  },
  actionBtnTextSecondary: {
    color: theme.colors.text,
  },

  // Progress
  progressCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 8,
  },
  progressLabel: {
    fontWeight: '600',
    color: theme.colors.primary,
    fontSize: theme.font.sm,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.surface2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressHint: {
    fontSize: theme.font.xs,
    color: theme.colors.muted,
    textAlign: 'center',
  },

  // Analyze Button
  analyzeBtn: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    height: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadow.card,
  },
  analyzeBtnDisabled: {
    backgroundColor: theme.colors.border,
  },
  analyzeBtnIcon: {
    fontSize: 20,
  },
  analyzeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.font.md,
  },
  hintText: {
    textAlign: 'center',
    color: theme.colors.muted,
    fontSize: theme.font.xs,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
});
