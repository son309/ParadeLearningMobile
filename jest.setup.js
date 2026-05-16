/* global jest */

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
});
