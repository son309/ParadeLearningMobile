import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { authApi } from '../../network/authApi';
import { useAuthStore } from '../../store/authStore';
import { isValidPassword, isValidPhoneNumber } from '../../utils/validators';
import { MESSAGES } from '../../utils/messages';
import { theme } from '../../constants/theme';

export default function LoginScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const loginStore = useAuthStore(state => state.login);

  const handleLogin = async () => {
    if (!isValidPhoneNumber(phone)) {
      Alert.alert(MESSAGES.INVALID_PHONE);
      return;
    }
    if (!isValidPassword(password, phone)) {
      Alert.alert(MESSAGES.INVALID_PASSWORD);
      return;
    }
    try {
      setLoading(true);
      const data = await authApi.login(phone, password);
      if (data?.code !== '1000' && data?.code !== 1000) {
        Alert.alert(data?.message || MESSAGES.LOGIN_FAILED);
        return;
      }
      const token = data?.data?.token || data?.token;
      const user = {
        id: String(data?.data?.id || data?.id),
        username: data?.data?.username || data?.username,
        avatar: data?.data?.avatar || data?.avatar,
        role: data?.data?.role || data?.role,
      };
      if (!token || !user.id) {
        Alert.alert('Server không trả về token hoặc user id');
        return;
      }
      loginStore(token, user);
    } catch {
      Alert.alert(MESSAGES.NO_INTERNET);
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = () => {
    loginStore('mock-token', {
      id: '1',
      username: 'Người dùng test',
      role: 'HV',
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={['#1a6fd8', '#1877F2', '#4a9aff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        {/* Logo / Brand */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={['#ffffff33', '#ffffff55']}
            style={styles.logoCircle}>
            <Text style={styles.logoLetter}>f</Text>
          </LinearGradient>
          <Text style={styles.appName}>facebook</Text>
          <Text style={styles.tagline}>
            Kết nối với bạn bè và thế giới xung quanh bạn
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <TextInput
            placeholder="Số điện thoại"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
            style={[
              styles.input,
              focusedField === 'phone' && styles.inputFocused,
            ]}
            placeholderTextColor={theme.colors.muted}
          />

          <TextInput
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            style={[
              styles.input,
              focusedField === 'password' && styles.inputFocused,
            ]}
            placeholderTextColor={theme.colors.muted}
          />

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed,
              loading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}>
            <Text style={styles.loginButtonText}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Text>
          </Pressable>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotRow}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.mockButton,
              pressed && styles.mockButtonPressed,
            ]}
            onPress={handleMockLogin}>
            <Text style={styles.mockButtonText}>Tiếp tục với Demo</Text>
          </Pressable>
        </View>

        {/* Register Link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Tạo tài khoản mới</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1877F2',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoLetter: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 52,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: theme.spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: theme.font.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: theme.spacing.xl,
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
  loginButton: {
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
    shadowColor: '#0a4fa8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  loginButtonPressed: {
    backgroundColor: theme.colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: theme.font.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  forgotRow: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  forgotText: {
    color: theme.colors.primary,
    fontSize: theme.font.sm,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.divider,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.muted,
    fontSize: theme.font.sm,
    fontWeight: '600',
  },
  mockButton: {
    height: 50,
    backgroundColor: '#42B72A',
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#42B72A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  mockButtonPressed: {
    backgroundColor: '#36A420',
    transform: [{ scale: 0.98 }],
  },
  mockButtonText: {
    color: '#fff',
    fontSize: theme.font.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerPrompt: {
    fontSize: theme.font.sm,
    color: theme.colors.textSecondary,
  },
  registerLink: {
    fontSize: theme.font.sm,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
