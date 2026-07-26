import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';

const prefs = LocalPreferencesAsyncStorage.getInstance();

describe('LocalPreferencesAsyncStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    (SecureStore as any).__store.clear();
    jest.clearAllMocks();
  });

  describe('sensitive keys', () => {
    it('writes tokens to SecureStore and not to AsyncStorage', async () => {
      await prefs.storeData('token', 'jwt-value');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', JSON.stringify('jwt-value'));
      await expect(AsyncStorage.getItem('token')).resolves.toBeNull();
      await expect(prefs.retrieveData('token')).resolves.toBe('jwt-value');
    });

    it('removes tokens from SecureStore', async () => {
      await prefs.storeData('refreshToken', 'refresh-value');
      await prefs.removeData('refreshToken');

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
      await expect(prefs.retrieveData('refreshToken')).resolves.toBeNull();
    });

    it('migrates a pre-existing AsyncStorage token on first read', async () => {
      // Simulate a session created before secure storage existed.
      await AsyncStorage.setItem('token', JSON.stringify('legacy-jwt'));

      await expect(prefs.retrieveData('token')).resolves.toBe('legacy-jwt');

      // Moved into SecureStore and the plain-text copy dropped.
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', JSON.stringify('legacy-jwt'));
      await expect(AsyncStorage.getItem('token')).resolves.toBeNull();
      await expect(prefs.retrieveData('token')).resolves.toBe('legacy-jwt');
    });

    it('clearAll wipes both stores', async () => {
      await prefs.storeData('token', 'jwt-value');
      await prefs.storeData('email', 'user@example.com');

      await prefs.clearAll();

      await expect(prefs.retrieveData('token')).resolves.toBeNull();
      await expect(prefs.retrieveData('email')).resolves.toBeNull();
    });
  });

  describe('non-sensitive keys', () => {
    it('round-trips values through AsyncStorage', async () => {
      await prefs.storeData('role', 'student');

      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
      await expect(AsyncStorage.getItem('role')).resolves.toBe(JSON.stringify('student'));
      await expect(prefs.retrieveData('role')).resolves.toBe('student');
    });

    it('returns null for a missing key', async () => {
      await expect(prefs.retrieveData('nope')).resolves.toBeNull();
    });
  });

  describe('entry lists', () => {
    it('appends, reads and replaces entries', async () => {
      await prefs.storeEntry('ar_route', { x: 1 });
      await prefs.storeEntry('ar_route', { x: 2 });
      await expect(prefs.getAllEntries('ar_route')).resolves.toEqual([{ x: 1 }, { x: 2 }]);

      await prefs.replaceEntries('ar_route', [{ x: 3 }]);
      await expect(prefs.getAllEntries('ar_route')).resolves.toEqual([{ x: 3 }]);
    });

    it('returns an empty list for an unknown key', async () => {
      await expect(prefs.getAllEntries('unknown')).resolves.toEqual([]);
    });
  });
});
