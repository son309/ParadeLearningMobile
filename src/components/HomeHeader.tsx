import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import Icons from './Icons';

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
          <Icons.Search color={theme.colors.text} size={22} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}
          onPress={onChatPress}>
          <Icons.MessageCircle color={theme.colors.text} size={22} />
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
    // FB Header has no heavy shadow, just relies on grey feed background for contrast
  },
  brand: {
    fontSize: 28, // Slightly larger
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
    letterSpacing: -1, // tighter kerning for that iconic FB logo feel
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
    backgroundColor: theme.colors.surfaceHover,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.extrabold,
    color: '#fff',
    lineHeight: 12,
  },
});
