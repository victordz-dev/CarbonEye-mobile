import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const KEYS = {
  TOKEN: '@carboneye:token',
  USER: '@carboneye:user',
  THEME: '@carboneye:theme',
  FAVORITES: '@carboneye:favorites',
};

export const storage = {
  async getFavorites(): Promise<string[]> {
    try {
      const favStr = await AsyncStorage.getItem(KEYS.FAVORITES);
      return favStr ? (JSON.parse(favStr) as string[]) : [];
    } catch (e) {
      console.error('Failed to get favorites from storage', e);
      return [];
    }
  },

  async toggleFavorite(areaId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const index = favorites.indexOf(areaId);
      let isFav = false;
      if (index > -1) {
        favorites.splice(index, 1);
      } else {
        favorites.push(areaId);
        isFav = true;
      }
      await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
      return isFav;
    } catch (e) {
      console.error('Failed to toggle favorite in storage', e);
      return false;
    }
  },

  async isFavorite(areaId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.includes(areaId);
    } catch (e) {
      return false;
    }
  },
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.TOKEN);
    } catch (e) {
      console.error('Failed to get token from storage', e);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.TOKEN, token);
    } catch (e) {
      console.error('Failed to set token in storage', e);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.TOKEN);
    } catch (e) {
      console.error('Failed to remove token from storage', e);
    }
  },

  async getUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem(KEYS.USER);
      if (!userStr) return null;
      return JSON.parse(userStr) as User;
    } catch (e) {
      console.error('Failed to get user from storage', e);
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to set user in storage', e);
    }
  },

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.USER);
    } catch (e) {
      console.error('Failed to remove user from storage', e);
    }
  },

  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER]);
    } catch (e) {
      console.error('Failed to clear session from storage', e);
    }
  },
};
