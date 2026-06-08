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
import { isValidPassword, isValidPhoneNumber } from '../../utils/validators';
import { MESSAGES } from '../../utils/messages';
import { theme } from '../../constants/theme';

export default function RegisterScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'GV' | 'HV' | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!isValidPhoneNumber(phone)) {
      Alert.alert(MESSAGES.INVALID_PHONE);
      return;
    }
    if (!isValidPassword(password, phone)) {
      Alert.alert(MESSAGES.INVALID_PASSWORD);
      return;
    }
    if (!role) {
      Alert.alert(MESSAGES.REQUIRED_ROLE);
      return;
    }
    try {
      setLoading(true);
      const data = await authApi.signup(phone, password, role);
      if (data?.code !== '1000' && data?.code !== 1000) {
        Alert.alert(data?.message || MESSAGES.SIGNUP_FAILED);
        return;
      }
      Alert.alert('Đăng ký thành công', 'Hãy đăng nhập để tiếp tục', [
        { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') },
      ]);
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        {/* Gradient Header */}
        <LinearGradient
          colors={['#1877F2', '#4a9aff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.brand}>facebook</Text>
        </LinearGradient>

        <View style={styles.titleSection}>
          <Text style={styles.title}>Tạo tài khoản mới</Text>
          <Text style={styles.subtitle}>
            Nhanh chóng và dễ dàng, hoàn toàn miễn phí.
          </Text>
        </View>

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

          {/* Role selector */}
          <Text style={styles.roleLabel}>Bạn là:</Text>
          <View style={styles.roleRow}>
            <Pressable
              style={[
                styles.roleButton,
                role === 'HV' && styles.roleButtonActive,
              ]}
              onPress={() => setRole('HV')}>
              <Text
                style={[
                  styles.roleButtonText,
                  role === 'HV' && styles.roleButtonTextActive,
                ]}>
                🎓 Học viên
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.roleButton,
                role === 'GV' && styles.roleButtonActive,
              ]}
              onPress={() => setRole('GV')}>
              <Text
                style={[
                  styles.roleButtonText,
                  role === 'GV' && styles.roleButtonTextActive,
                ]}>
                👨‍🏫 Giáo viên
              </Text>
            </Pressable>
          </View>

          <Text style={styles.termsText}>
            Khi nhấn <Text style={styles.termsLink}>Đăng ký</Text>, bạn đồng ý
            với{' '}
            <Text style={styles.termsLink}>Điều khoản</Text>,{' '}
            <Text style={styles.termsLink}>Chính sách quyền riêng tư</Text>.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.registerButton,
              pressed && styles.registerButtonPressed,
              loading && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}>
            <LinearGradient
              colors={['#2488ff', '#1877F2', '#0d60d8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.registerBtnGradient}>
              <Text style={styles.registerButtonText}>
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  gradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    marginHorizontal: -theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  brand: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  titleSection: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.font.xxl,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.font.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  formCard: {
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
  roleLabel: {
    fontSize: theme.font.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  roleRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  roleButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.inputBg,
  },
  roleButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  roleButtonText: {
    fontSize: theme.font.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  roleButtonTextActive: {
    color: theme.colors.primary,
  },
  termsText: {
    fontSize: theme.font.xs,
    color: theme.colors.textSecondary,
    lineHeight: 17,
    marginBottom: theme.spacing.lg,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  registerButton: {
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    shadowColor: '#0a4fa8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  registerBtnGradient: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
  },
  registerButtonPressed: {
    opacity: 0.85,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: theme.font.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    fontSize: theme.font.sm,
    color: theme.colors.textSecondary,
  },
  loginLink: {
    fontSize: theme.font.sm,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
