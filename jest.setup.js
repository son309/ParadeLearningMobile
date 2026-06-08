/* global jest */

jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-mmkv', () => {
  const data = new Map();

  return {
    createMMKV: () => ({
      set: (key, value) => data.set(key, value),
      getString: key => data.get(key),
      remove: key => data.delete(key),
      clearAll: () => data.clear(),
    }),
  };
}, { virtual: true });

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
    }),
  ),
}));

jest.mock('react-native-video', () => 'Video');
