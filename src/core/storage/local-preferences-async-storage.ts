import { ILocalPreferences } from "@/core/storage/i-local-preferences";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Keys held in the OS keychain/keystore instead of AsyncStorage, which stores
 * plain text readable on a rooted or jailbroken device.
 */
const SECURE_KEYS = new Set(["token", "refreshToken"]);

// SecureStore has no web implementation; there we fall back to AsyncStorage.
const secureStoreAvailable = Platform.OS !== "web";

function isSecure(key: string): boolean {
  return secureStoreAvailable && SECURE_KEYS.has(key);
}

export class LocalPreferencesAsyncStorage implements ILocalPreferences {
  private static instance: LocalPreferencesAsyncStorage;

  private constructor() {
    // private so no one can do new LocalPreferencesAsyncStorage() from outside
  }

  static getInstance(): LocalPreferencesAsyncStorage {
    if (!LocalPreferencesAsyncStorage.instance) {
      LocalPreferencesAsyncStorage.instance = new LocalPreferencesAsyncStorage();
    }
    return LocalPreferencesAsyncStorage.instance;
  }

  async storeData<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      if (isSecure(key)) {
        await SecureStore.setItemAsync(key, jsonValue);
      } else {
        await AsyncStorage.setItem(key, jsonValue);
      }
    } catch (e) {
      console.error(`Error storing data for ${key}`, e);
    }
  }

  async retrieveData<T>(key: string): Promise<T | null> {
    try {
      if (isSecure(key)) {
        const secureValue = await SecureStore.getItemAsync(key);
        if (secureValue !== null) return JSON.parse(secureValue);

        // Migration path: sessions created before secure storage still keep their
        // tokens in AsyncStorage. Move them across on first read, then drop the copy.
        const legacyValue = await AsyncStorage.getItem(key);
        if (legacyValue === null) return null;
        await SecureStore.setItemAsync(key, legacyValue);
        await AsyncStorage.removeItem(key);
        return JSON.parse(legacyValue);
      }

      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error(`Error retrieving data for ${key}`, e);
      return null;
    }
  }

  async removeData(key: string): Promise<void> {
    try {
      if (isSecure(key)) {
        await SecureStore.deleteItemAsync(key);
        // Also drop any pre-migration copy left in AsyncStorage.
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.error(`Error removing data for ${key}`, e);
    }
  }

  async storeEntry<T>(key: string, entry: T): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(key);
      const data: T[] = existing ? JSON.parse(existing) : [];
      data.push(entry);
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error storing entry for ${key}`, e);
    }
  }

  async getAllEntries<T>(key: string): Promise<T[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error(`Error reading entries for ${key}`, e);
      return [];
    }
  }

  async replaceEntries<T>(key: string, entries: T[]): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(entries));
    } catch (e) {
      console.error(`Error replacing entries for ${key}`, e);
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      if (secureStoreAvailable) {
        await Promise.all(
          [...SECURE_KEYS].map((key) => SecureStore.deleteItemAsync(key))
        );
      }
    } catch (e) {
      console.error("Error clearing all storage", e);
    }
  }
}
