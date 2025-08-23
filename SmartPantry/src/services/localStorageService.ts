import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, User, FoodWasteReport } from '../types';

const STORAGE_KEYS = {
  FOOD_ITEMS: 'food_items',
  USER_PROFILE: 'user_profile',
  WASTE_REPORTS: 'waste_reports',
  AUTH_TOKEN: 'auth_token',
};

class LocalStorageService {
  // Food Items
  async getFoodItems(): Promise<FoodItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FOOD_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get food items from storage:', error);
      return [];
    }
  }

  async saveFoodItems(items: FoodItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FOOD_ITEMS, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save food items to storage:', error);
    }
  }

  async addFoodItem(item: FoodItem): Promise<void> {
    try {
      const existingItems = await this.getFoodItems();
      const updatedItems = [...existingItems, item];
      await this.saveFoodItems(updatedItems);
    } catch (error) {
      console.error('Failed to add food item to storage:', error);
    }
  }

  async updateFoodItem(id: string, updatedItem: Partial<FoodItem>): Promise<void> {
    try {
      const existingItems = await this.getFoodItems();
      const itemIndex = existingItems.findIndex(item => item.id === id);
      
      if (itemIndex !== -1) {
        existingItems[itemIndex] = { ...existingItems[itemIndex], ...updatedItem };
        await this.saveFoodItems(existingItems);
      }
    } catch (error) {
      console.error('Failed to update food item in storage:', error);
    }
  }

  async deleteFoodItem(id: string): Promise<void> {
    try {
      const existingItems = await this.getFoodItems();
      const filteredItems = existingItems.filter(item => item.id !== id);
      await this.saveFoodItems(filteredItems);
    } catch (error) {
      console.error('Failed to delete food item from storage:', error);
    }
  }

  async getExpiringItems(days: number = 7): Promise<FoodItem[]> {
    try {
      const allItems = await this.getFoodItems();
      const today = new Date();
      
      return allItems.filter(item => {
        const expirationDate = new Date(item.expirationDate);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return daysUntilExpiration <= days && daysUntilExpiration >= 0;
      });
    } catch (error) {
      console.error('Failed to get expiring items from storage:', error);
      return [];
    }
  }

  // User Profile
  async getUserProfile(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get user profile from storage:', error);
      return null;
    }
  }

  async saveUserProfile(profile: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save user profile to storage:', error);
    }
  }

  // Waste Reports
  async getWasteReport(month: string): Promise<FoodWasteReport | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WASTE_REPORTS);
      const reports = data ? JSON.parse(data) : {};
      return reports[month] || null;
    } catch (error) {
      console.error('Failed to get waste report from storage:', error);
      return null;
    }
  }

  async saveWasteReport(month: string, report: FoodWasteReport): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WASTE_REPORTS);
      const reports = data ? JSON.parse(data) : {};
      reports[month] = report;
      await AsyncStorage.setItem(STORAGE_KEYS.WASTE_REPORTS, JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to save waste report to storage:', error);
    }
  }

  // Auth Token
  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to get auth token from storage:', error);
      return null;
    }
  }

  async saveAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Failed to save auth token to storage:', error);
    }
  }

  async clearAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to clear auth token from storage:', error);
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Failed to clear all data from storage:', error);
    }
  }
}

export const localStorageService = new LocalStorageService();
export default localStorageService;
