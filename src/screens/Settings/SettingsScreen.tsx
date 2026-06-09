import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      <View style={styles.section}>
        <Pressable onPress={() => navigation.navigate('ProfileDetail', { userId: user?.id })} style={styles.row}>
          <Text style={styles.rowText}>Profile</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('PersonalInfo')} style={styles.row}>
          <Text style={styles.rowText}>Personal info</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ChangePassword')} style={styles.row}>
          <Text style={styles.rowText}>Change password</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Privacy')} style={styles.row}>
          <Text style={styles.rowText}>Privacy</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { fontSize: 18, fontWeight: '700', color: theme.colors.text, padding: theme.spacing.lg },
  section: { marginTop: theme.spacing.sm },
  row: { padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  rowText: { color: theme.colors.text, fontWeight: '600' },
});
