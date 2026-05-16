import React, { useState } from 'react';
import {
  Alert,
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { authApi } from '../../network/authApi';
import { useAuthStore } from '../../store/authStore';
import { isValidPassword, isValidPhoneNumber } from '../../utils/validators';
import { MESSAGES } from '../../utils/messages';

export default function LoginScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const loginStore = useAuthStore(state => state.login);

  const handleLogin = async () => {
    if (!isValidPhoneNumber(phone)) {
      Alert.alert(MESSAGES.INVALID_PHONE);
      return;
    }

    if (!isValidPassword(password, phone)) {
      Alert.alert(MESSAGES.INVALID_PASSWORD);
      return;
    }

    try {
      const data = await authApi.login(phone, password);

      console.log('Login response:', data);

      if (data?.code !== '1000' && data?.code !== 1000) {
        Alert.alert(data?.message || MESSAGES.LOGIN_FAILED);
        return;
      }

      const token = data?.data?.token || data?.token;

      const user = {
        id: String(data?.data?.id || data?.id),
        username: data?.data?.username || data?.username,
        avatar: data?.data?.avatar || data?.avatar,
        role: data?.data?.role || data?.role,
      };

      if (!token || !user.id) {
        Alert.alert('Server không trả về token hoặc user id');
        return;
      }

      loginStore(token, user);
    } catch {
      Alert.alert(MESSAGES.NO_INTERNET);
    }
  };

  const handleMockLogin = () => {
    loginStore('mock-token', {
      id: '1',
      username: 'Người dùng test',
      role: 'HV',
    });
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24 }}>
        Đăng nhập
      </Text>

      <TextInput
        placeholder="Số điện thoại"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={{
          borderWidth: 1,
          borderColor: '#cccccc',
          padding: 12,
          marginBottom: 12,
          borderRadius: 8,
          color: '#000000',
        }}
      />

      <TextInput
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: '#cccccc',
          padding: 12,
          marginBottom: 12,
          borderRadius: 8,
          color: '#000000',
        }}
      />

      <Button title="Đăng nhập" onPress={handleLogin} />

      <View style={{ height: 12 }} />

      <Button title="Mock login để test Tab" onPress={handleMockLogin} />

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={{ marginTop: 16, color: '#000000' }}>
          Chưa có tài khoản? Đăng ký
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={{ marginTop: 8, color: '#000000' }}>Quên mật khẩu?</Text>
      </TouchableOpacity>
    </View>
  );
}
