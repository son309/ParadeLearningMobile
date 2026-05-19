import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { postApi } from '../../network/postApi';

const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('No Internet Connection');
    return false;
  }
  return true;
};

export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useAuthStore();
  const [described, setDescribed] = useState('');
  const [courseId, setCourseId] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isStudent = user?.role === 'HV';
  const canSubmit = useMemo(() => {
    if (!described.trim()) {
      return false;
    }
    if (isStudent) {
      return courseId.trim().length > 0 && exerciseId.trim().length > 0;
    }
    return true;
  }, [described, isStudent, courseId, exerciseId]);

  const submit = async () => {
    if (!token) {
      Alert.alert('Vui long dang nhap lai');
      return;
    }
    if (!canSubmit) {
      Alert.alert('Vui long nhap day du thong tin');
      return;
    }
    if (token === 'mock-token') {
      Alert.alert('Mock mode', 'Da tao bai viet demo');
      navigation.goBack();
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    setSubmitting(true);
    try {
      await postApi.addPost({
        token,
        described: described.trim(),
        device_slave: 'mobile',
        device_master: 'mobile',
        course_id: isStudent ? courseId.trim() : undefined,
        exercise_id: isStudent ? exerciseId.trim() : undefined,
      });
      Alert.alert('Da dang bai');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(error?.message || 'Khong the dang bai');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Create post</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Noi dung</Text>
        <TextInput
          value={described}
          onChangeText={setDescribed}
          placeholder='Ban muon chia se dieu gi?'
          placeholderTextColor={theme.colors.muted}
          style={styles.textArea}
          multiline
        />

        {isStudent && (
          <>
            <Text style={styles.label}>Course ID</Text>
            <TextInput
              value={courseId}
              onChangeText={setCourseId}
              placeholder='Teacher ID'
              placeholderTextColor={theme.colors.muted}
              style={styles.input}
              autoCapitalize='none'
            />
            <Text style={styles.label}>Exercise Post ID</Text>
            <TextInput
              value={exerciseId}
              onChangeText={setExerciseId}
              placeholder='Exercise post ID'
              placeholderTextColor={theme.colors.muted}
              style={styles.input}
              autoCapitalize='none'
            />
          </>
        )}

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Video upload is not implemented in this build.
          </Text>
        </View>

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
          onPress={submit}
          disabled={!canSubmit || submitting}
        >
          <Text style={styles.submitText}>
            {submitting ? 'Dang bai...' : 'Dang bai'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  title: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 50,
  },
  card: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  textArea: {
    minHeight: 120,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
  },
  noteBox: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.sm,
  },
  noteText: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  submitButton: {
    marginTop: theme.spacing.sm,
    height: 44,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
});