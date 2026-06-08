import React from 'react';
import { Text } from 'react-native';

type IconProps = {
  color?: string;
  size?: number;
};

function Search({ color = '#000', size = 20 }: IconProps) {
  return <Text style={{ color, fontSize: size, lineHeight: size + 4 }}>{'🔍'}</Text>;
}

function MessageCircle({ color = '#000', size = 20 }: IconProps) {
  return <Text style={{ color, fontSize: size, lineHeight: size + 4 }}>{'💬'}</Text>;
}

const Icons = { Search, MessageCircle };

export default Icons;
