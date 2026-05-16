import React from 'react';
import { Text, View } from 'react-native';

export default function App() {
  console.log('APP RENDERED');

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#000000', fontSize: 30, fontWeight: 'bold' }}>
        APP OK
      </Text>
    </View>
  );
}