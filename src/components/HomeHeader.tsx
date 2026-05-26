import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

type HomeHeaderProps = {
  onSearchPress?: () => void;
  onChatPress?: () => void;
};

function SearchIcon() {
  return (
    <Text style={{ fontSize: 16, color: theme.colors.text }}>🔍</Text>
  );
}

function MessengerIcon() {
  return (
    <Text style={{ fontSize: 16, color: theme.colors.text }}>💬</Text>
  );
}

export default function HomeHeader({
  onSearchPress,
  onChatPress,
}: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Brand */}
      <Text style={styles.brand}>facebook</Text>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}
          onPress={onSearchPress}>
          <SearchIcon />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}
          onPress={onChatPress}>
          <MessengerIcon />
          {/* Notification badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  brand: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  iconButton: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: theme.colors.divider,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
});
