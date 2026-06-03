import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { theme } from '../../constants/theme';
import { userApi } from '../../network/userApi';
import { useAuthStore } from '../../store/authStore';

const PASSWORD_REGEX = /^[a-zA-Z0-9]{6,10}$/;

const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('No Internet Connection');
    return false;
  }
  return true;
};

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [oldPasswordConfirm, setOldPasswordConfirm] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token) {
      Alert.alert('Vui long dang nhap lai');
      return;
    }

    if (!oldPassword || !oldPasswordConfirm || !newPassword) {
      Alert.alert('Vui long nhap day du thong tin');
      return;
    }

    if (oldPassword !== oldPasswordConfirm) {
      Alert.alert('Mat khau cu nhap lai khong khop');
      return;
    }

    if (newPassword === oldPassword) {
      Alert.alert('Mat khau moi khong duoc trung voi mat khau cu');
      return;
    }

    if (!PASSWORD_REGEX.test(oldPassword) || !PASSWORD_REGEX.test(newPassword)) {
      Alert.alert('Mat khau phai tu 6-10 ky tu, chi gom chu va so');
      return;
    }

    if (!(await ensureOnline())) {
      return;
    }

    try {
      setLoading(true);
      await userApi.changePassword({
        token,
        password: oldPassword,
        newPassword,
      });
      Alert.alert('Da doi mat khau');
      setOldPassword('');
      setOldPasswordConfirm('');
      setNewPassword('');
    } catch (error: any) {
      Alert.alert(error?.message || 'Khong the doi mat khau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Bao mat va dang nhap" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.label}>Mat khau cu</Text>
        <TextInput
          value={oldPassword}
          onChangeText={setOldPassword}
          style={styles.input}
          placeholder="Mat khau cu"
          placeholderTextColor={theme.colors.muted}
          secureTextEntry
        />

        <Text style={styles.label}>Nhap lai mat khau cu</Text>
        <TextInput
          value={oldPasswordConfirm}
          onChangeText={setOldPasswordConfirm}
          style={styles.input}
          placeholder="Nhap lai mat khau cu"
          placeholderTextColor={theme.colors.muted}
          secureTextEntry
        />

        <Text style={styles.label}>Mat khau moi</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
          placeholder="Mat khau moi"
          placeholderTextColor={theme.colors.muted}
          secureTextEntry
        />

        <Pressable style={styles.primaryButton} onPress={submit} disabled={loading}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'Dang doi...' : 'Doi mat khau'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type HeaderProps = {
  title: string;
  onBack: () => void;
};

function Header({ title, onBack }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    height: 56,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  backText: {
    fontSize: 20,
    color: theme.colors.text,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
  },
  primaryButton: {
    marginTop: theme.spacing.md,
    height: 44,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
});
