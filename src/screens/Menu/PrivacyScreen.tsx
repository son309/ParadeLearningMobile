import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Avatar from '../../components/Avatar';
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

type BlockedUser = {
  id: string;
  name: string;
  avatar?: string;
};

export default function PrivacyScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuthStore();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    if (token === 'mock-token') {
      setBlocked([]);
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    try {
      setLoading(true);
      const data = await userApi.getListBlocks({ token });
      setBlocked(Array.isArray(data?.users) ? data.users : []);
    } catch (error: any) {
      Alert.alert(error?.message || 'Khong the tai danh sach chan');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (userId: string) => {
    if (!token) {
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    try {
      await userApi.setBlock({ token, userId, type: '1' });
      setBlocked(current => current.filter(item => item.id !== userId));
    } catch (error: any) {
      Alert.alert(error?.message || 'Khong the bo chan');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Quyen rieng tu" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Chan</Text>
        <FlatList
          data={blocked}
          keyExtractor={item => item.id}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>Chua chan ai</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Avatar name={item.name} uri={item.avatar} />
                <Text style={styles.rowName}>{item.name}</Text>
              </View>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => unblock(item.id)}
              >
                <Text style={styles.secondaryButtonText}>Bo chan</Text>
              </Pressable>
            </View>
          )}
        />
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
    flex: 1,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rowName: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 36,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.muted,
    marginTop: theme.spacing.lg,
  },
});
