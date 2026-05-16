import React from 'react';
import { Button, Text, View } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const logout = useAuthStore(state => state.logout);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Cá nhân</Text>
      <Button title="Đăng xuất" onPress={logout} />
    </View>
  );
}