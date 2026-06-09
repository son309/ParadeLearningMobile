import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { theme } from '../../constants/theme';
import { settingsApi } from '../../network/settingsApi';
import { useAuthStore } from '../../store/authStore';

type PushSettings = {
  likeComment: boolean;
  fromFriends: boolean;
  requestedFriend: boolean;
  suggestedFriend: boolean;
  birthday: boolean;
  video: boolean;
  report: boolean;
};

const DEFAULT_SETTINGS: PushSettings = {
  likeComment: true,
  fromFriends: true,
  requestedFriend: true,
  suggestedFriend: true,
  birthday: true,
  video: true,
  report: true,
};

const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('No Internet Connection');
    return false;
  }
  return true;
};

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuthStore();
  const [settings, setSettings] = useState<PushSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

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
        const data = await settingsApi.getPushSettings(token);
        setSettings({
          likeComment: data?.likeComment === '1',
          fromFriends: data?.fromFriends === '1',
          requestedFriend: data?.requestedFriend === '1',
          suggestedFriend: data?.suggestedFriend === '1',
          birthday: data?.birthday === '1',
          video: data?.video === '1',
          report: data?.report === '1',
        });
      } catch (error: any) {
        Alert.alert(error?.message || 'Khong the tai cai dat thong bao');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const updateField = (key: keyof PushSettings, value: boolean) => {
    setSettings(current => ({ ...current, [key]: value }));
  };

  const save = async () => {
    if (!token) {
      Alert.alert('Vui long dang nhap lai');
      return;
    }

    if (!(await ensureOnline())) {
      return;
    }

    try {
      setLoading(true);
      await settingsApi.setPushSettings({
        token,
        likeComment: settings.likeComment ? '1' : '0',
        fromFriends: settings.fromFriends ? '1' : '0',
        requestedFriend: settings.requestedFriend ? '1' : '0',
        suggestedFriend: settings.suggestedFriend ? '1' : '0',
        birthday: settings.birthday ? '1' : '0',
        video: settings.video ? '1' : '0',
        report: settings.report ? '1' : '0',
      });
      Alert.alert('Da luu cai dat thong bao');
    } catch (error: any) {
      Alert.alert(error?.message || 'Khong the luu cai dat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Thong bao" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <SettingRow
          label="Binh luan/Thich bai viet"
          value={settings.likeComment}
          onValueChange={value => updateField('likeComment', value)}
        />
        <SettingRow
          label="Cap nhat tu ban be"
          value={settings.fromFriends}
          onValueChange={value => updateField('fromFriends', value)}
        />
        <SettingRow
          label="Loi moi ket ban"
          value={settings.requestedFriend}
          onValueChange={value => updateField('requestedFriend', value)}
        />
        <SettingRow
          label="Nhung nguoi ban co the biet"
          value={settings.suggestedFriend}
          onValueChange={value => updateField('suggestedFriend', value)}
        />
        <SettingRow
          label="Sinh nhat"
          value={settings.birthday}
          onValueChange={value => updateField('birthday', value)}
        />
        <SettingRow
          label="Video cua ban duoc duyet"
          value={settings.video}
          onValueChange={value => updateField('video', value)}
        />
        <SettingRow
          label="Phan hoi ve bao cao bai viet"
          value={settings.report}
          onValueChange={value => updateField('report', value)}
        />

        <Pressable style={styles.primaryButton} onPress={save} disabled={loading}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'Dang luu...' : 'Luu thay doi'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type SettingRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function SettingRow({ label, value, onValueChange }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
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
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rowLabel: {
    flex: 1,
    color: theme.colors.text,
    fontWeight: '600',
    marginRight: theme.spacing.md,
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
