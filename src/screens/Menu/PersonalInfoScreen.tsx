import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
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

const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('No Internet Connection');
    return false;
  }
  return true;
};

export default function PersonalInfoScreen() {
  const navigation = useNavigation<any>();
  const { token, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!token) {
        return;
      }
      if (token === 'mock-token') {
        return;
      }
      if (!(await ensureOnline())) {
        return;
      }

      try {
        setLoading(true);
        const data = await userApi.getUserInfo({ token });
        setFullName(data?.username || '');
      } catch (error: any) {
        Alert.alert(error?.message || 'Khong the tai thong tin ca nhan');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const save = async () => {
    if (!token) {
      Alert.alert('Vui long dang nhap lai');
      return;
    }

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      Alert.alert('Vui long nhap ho va ten');
      return;
    }

    if (!(await ensureOnline())) {
      return;
    }

    try {
      setLoading(true);
      await userApi.setUserInfo({ token, username: trimmedName });
      await updateUser({ username: trimmedName });
      Alert.alert('Da cap nhat ten');
    } catch (error: any) {
      Alert.alert(error?.message || 'Khong the cap nhat thong tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Thong tin ca nhan" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
          placeholder="Nhập họ và tên đầy đủ"
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="words"
        />

        <Text style={styles.notice}>
          Xin lưu ý rằng thông tin này sẽ hiển thị trên hồ sơ của bạn.
        </Text>

        <Pressable style={styles.primaryButton} onPress={save} disabled={loading}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'Dang luu...' : 'Luu thay doi'}
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
  notice: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    fontSize: 12,
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
