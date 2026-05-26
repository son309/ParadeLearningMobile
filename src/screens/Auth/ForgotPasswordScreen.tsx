import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { authApi } from '../../network/authApi';
import { isValidPhoneNumber } from '../../utils/validators';
import { MESSAGES } from '../../utils/messages';
import { theme } from '../../constants/theme';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(false);

  const handleGetCode = async () => {
    if (!isValidPhoneNumber(phone)) {
      Alert.alert(MESSAGES.INVALID_PHONE);
      return;
    }
    try {
      setLoading(true);
      const data = await authApi.getVerifyCode(phone);
      Alert.alert('Thành công', data?.message || 'Đã gửi mã xác thực về số điện thoại của bạn');
    } catch {
      Alert.alert(MESSAGES.NO_INTERNET);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.brand}>facebook</Text>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🔒</Text>
        </View>

        <Text style={styles.title}>Quên mật khẩu?</Text>
        <Text style={styles.description}>
          Nhập số điện thoại đã đăng ký, chúng tôi sẽ gửi mã xác thực để giúp
          bạn đặt lại mật khẩu.
        </Text>

        <View style={styles.formCard}>
          <TextInput
            placeholder="Số điện thoại"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
            onFocus={() => setFocusedField(true)}
            onBlur={() => setFocusedField(false)}
            style={[styles.input, focusedField && styles.inputFocused]}
            placeholderTextColor={theme.colors.muted}
          />

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleGetCode}
            disabled={loading}>
            <Text style={styles.submitButtonText}>
              {loading ? 'Đang gửi...' : 'Lấy mã xác thực'}
            </Text>
          </Pressable>
        </View>

        <TouchableOpacity
          onPress={() => navigation?.navigate?.('Login')}
          style={styles.backToLogin}>
          <Text style={styles.backToLoginText}>← Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  backIcon: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: '600',
  },
  brand: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: theme.font.xxl,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.font.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  formCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: theme.spacing.lg,
  },
  input: {
    height: 50,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.font.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  submitButton: {
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonPressed: {
    backgroundColor: theme.colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: theme.font.md,
    fontWeight: '700',
  },
  backToLogin: {
    marginTop: theme.spacing.md,
  },
  backToLoginText: {
    color: theme.colors.primary,
    fontSize: theme.font.sm,
    fontWeight: '600',
  },
});
