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
import { isValidPassword, isValidPhoneNumber } from '../../utils/validators';
import { MESSAGES } from '../../utils/messages';

export default function RegisterScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'GV' | 'HV' | null>(null);

  const handleRegister = async () => {
    if (!isValidPhoneNumber(phone)) {
      Alert.alert(MESSAGES.INVALID_PHONE);
      return;
    }

    if (!isValidPassword(password, phone)) {
      Alert.alert(MESSAGES.INVALID_PASSWORD);
      return;
    }

    if (!role) {
      Alert.alert(MESSAGES.REQUIRED_ROLE);
      return;
    }

    try {
      const data = await authApi.signup(phone, password, role);

      console.log('Signup response:', data);

      if (data?.code !== '1000' && data?.code !== 1000) {
        Alert.alert(data?.message || MESSAGES.SIGNUP_FAILED);
        return;
      }

      Alert.alert('Đăng ký thành công');
      navigation.navigate('Login');
    } catch {
      Alert.alert(MESSAGES.NO_INTERNET);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24 }}>
        Đăng ký
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

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <Button title="Học viên" onPress={() => setRole('HV')} />
        <Button title="Giáo viên" onPress={() => setRole('GV')} />
      </View>

      <Text style={{ marginBottom: 12, color: '#000000' }}>
        Vai trò đã chọn: {role || 'Chưa chọn'}
      </Text>

      <Button title="Đăng ký" onPress={handleRegister} />

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ marginTop: 16, color: '#000000' }}>
          Đã có tài khoản? Đăng nhập
        </Text>
      </TouchableOpacity>
    </View>
  );
}
