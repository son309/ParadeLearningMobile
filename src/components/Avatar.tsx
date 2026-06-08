import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

type AvatarProps = {
  uri?: string;
  name?: string;
  size?: number;
};

export default function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: theme.colors.surface2,
  },
  fallback: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
