import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';

export default function TermsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Dieu khoan & chinh sach" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.title}>Dieu khoan & chinh sach</Text>
        <Text style={styles.text}>
          Noi dung dieu khoan va chinh sach se duoc cap nhat tai day.
        </Text>
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
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  text: {
    color: theme.colors.muted,
  },
});
