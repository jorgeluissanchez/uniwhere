// In-memory stand-in for the native keychain/keystore.
const store = new Map();

module.exports = {
  __store: store,
  setItemAsync: jest.fn(async (key, value) => {
    store.set(key, String(value));
  }),
  getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
  deleteItemAsync: jest.fn(async (key) => {
    store.delete(key);
  }),
  isAvailableAsync: jest.fn(async () => true),
};
