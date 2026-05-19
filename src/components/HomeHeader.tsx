import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

type HomeHeaderProps = {
  onSearchPress?: () => void;
  onChatPress?: () => void;
};

export default function HomeHeader({
  onSearchPress,
  onChatPress,
}: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>edubook</Text>
      <View style={styles.actions}>
        <Pressable style={styles.iconButton} onPress={onSearchPress}>
          <Text style={styles.iconText}>S</Text>
        </Pressable>
        <Pressable style={styles.iconButton} onPress={onChatPress}>
          <Text style={styles.iconText}>C</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.primary,
    textTransform: 'lowercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
});
