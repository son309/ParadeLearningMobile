import React, { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';

import { authApi } from '../../network/authApi';
import { isValidPhoneNumber } from '../../utils/validators';
import { MESSAGES } from '../../utils/messages';

export default function ForgotPasswordScreen() {
  const [phone, setPhone] = useState('');

  const handleGetCode = async () => {
    if (!isValidPhoneNumber(phone)) {
      Alert.alert(MESSAGES.INVALID_PHONE);
      return;
    }

    try {
      const data = await authApi.getVerifyCode(phone);
      console.log('Get verify code response:', data);
      Alert.alert(data?.message || 'Đã gửi yêu cầu lấy mã xác thực');
    } catch {
      Alert.alert(MESSAGES.NO_INTERNET);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24 }}>
        Quên mật khẩu
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

      <Button title="Lấy mã xác thực" onPress={handleGetCode} />
    </View>
  );
}
