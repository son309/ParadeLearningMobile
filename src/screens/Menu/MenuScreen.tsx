import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  BackHandler,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Avatar from '../../components/Avatar';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function MenuScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const name = user?.username || 'Nguoi dung';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <Pressable
          style={styles.iconButton}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.iconText}>S</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={styles.profileCard}
          onPress={() => navigation.navigate('ProfileDetail', { userId: user?.id })}
        >
          <Avatar name={name} uri={user?.avatar} size={56} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileHint}>Xem trang ca nhan</Text>
          </View>
        </Pressable>

        <MenuSection title="Thong tin ca nhan">
          <MenuRow
            label="Ten"
            onPress={() => navigation.navigate('PersonalInfo')}
          />
        </MenuSection>

        <MenuSection title="Cai dat">
          <MenuRow
            label="Quyen rieng tu"
            onPress={() => navigation.navigate('Privacy')}
          />
          <MenuRow
            label="Danh sach da chan"
            onPress={() => navigation.navigate('BlockedUsers')}
          />
        </MenuSection>

        <MenuSection title="Thong bao">
          <MenuRow
            label="Cai dat thong bao"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
        </MenuSection>

        <MenuSection title="Bao mat va dang nhap">
          <MenuRow
            label="Dang nhap/Doi mat khau"
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </MenuSection>

        <MenuSection title="Tro giup & ho tro">
          <MenuRow
            label="Dieu khoan & chinh sach"
            onPress={() => navigation.navigate('Terms')}
          />
        </MenuSection>

        <MenuSection title="Dang xuat">
          <MenuRow label="Dang xuat" onPress={logout} />
          <MenuRow label="Thoat" onPress={() => BackHandler.exitApp()} />
        </MenuSection>
      </ScrollView>
    </SafeAreaView>
  );
}

type MenuSectionProps = {
  title: string;
  children: React.ReactNode;
};

function MenuSection({ title, children }: MenuSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

type MenuRowProps = {
  label: string;
  onPress?: () => void;
};

function MenuRow({ label, onPress }: MenuRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowHint}>›</Text>
    </Pressable>
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  iconButton: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    gap: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  profileHint: {
    marginTop: 2,
    color: theme.colors.muted,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowLabel: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  rowHint: {
    color: theme.colors.muted,
    fontSize: 16,
  },
});
