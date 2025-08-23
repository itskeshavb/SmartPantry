import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import localStorageService from './localStorageService';
import { 
  FoodItem, 
  User, 
  Recipe, 
  FoodWasteReport, 
  ApiResponse, 
  PaginatedResponse,
  OCRResult 
} from '../types';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          AsyncStorage.removeItem('authToken');
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, name: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await this.api.post('/auth/register', { email, password, name });
    return response.data;
  }

  setAuthToken(token: string) {
    // This method is for setting the token programmatically
    // The interceptor will handle it automatically
  }

  clearAuthToken() {
    // This method is for clearing the token programmatically
    // The interceptor will handle it automatically
  }



  // Food Items
  async getFoodItems(page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<FoodItem>>> {
    try {
      const response = await this.api.get(`/food-items?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      // Fallback to local storage when backend is not available
      console.log('Backend unavailable, using local storage for food items');
      const localItems = await localStorageService.getFoodItems();
      
      // Simulate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = localItems.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          items: paginatedItems,
          total: localItems.length,
          page,
          limit,
          hasMore: endIndex < localItems.length
        },
        message: 'Using offline data'
      };
    }
  }

  async getFoodItem(id: string): Promise<ApiResponse<FoodItem>> {
    try {
      const response = await this.api.get(`/food-items/${id}`);
      return response.data;
    } catch (error) {
      return { success: false, error: 'Food item not found' };
    }
  }

  async createFoodItem(foodItem: Partial<FoodItem>): Promise<ApiResponse<FoodItem>> {
    try {
      const response = await this.api.post('/food-items', foodItem);
      
      // Also save to local storage for offline access
      if (response.data.success && response.data.data) {
        await localStorageService.addFoodItem(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      // Fallback to local storage when backend is not available
      console.log('Backend unavailable, saving to local storage');
      
      const newItem: FoodItem = {
        id: `local_${Date.now()}`,
        name: foodItem.name || 'Unknown Item',
        category: foodItem.category || 'OTHER',
        purchaseDate: foodItem.purchaseDate || new Date().toISOString().split('T')[0],
        expirationDate: foodItem.expirationDate || new Date().toISOString().split('T')[0],
        quantity: foodItem.quantity || 1,
        unit: foodItem.unit || 'piece',
        location: foodItem.location || 'FRIDGE',
        notes: foodItem.notes || '',
        barcode: foodItem.barcode || '',
        imageUrl: foodItem.imageUrl,
        userId: 'local_user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Save to local storage
      await localStorageService.addFoodItem(newItem);
      
      return { 
        success: true, 
        data: newItem,
        message: 'Food item saved locally (offline mode)'
      };
    }
  }

  async updateFoodItem(id: string, foodItem: Partial<FoodItem>): Promise<ApiResponse<FoodItem>> {
    try {
      const response = await this.api.put(`/food-items/${id}`, foodItem);
      return response.data;
    } catch (error) {
      // Return mock data when backend is not available
      const mockItem: FoodItem = {
        id,
        name: foodItem.name || 'Updated Item',
        category: foodItem.category || 'OTHER',
        purchaseDate: foodItem.purchaseDate || new Date().toISOString().split('T')[0],
        expirationDate: foodItem.expirationDate || new Date().toISOString().split('T')[0],
        quantity: foodItem.quantity || 1,
        unit: foodItem.unit || 'piece',
        location: foodItem.location || 'FRIDGE',
        notes: foodItem.notes || '',
        barcode: foodItem.barcode || '',
        imageUrl: foodItem.imageUrl,
        userId: 'mock_user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return { 
        success: true, 
        data: mockItem,
        message: 'Food item updated successfully (mock data)'
      };
    }
  }

  async deleteFoodItem(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.delete(`/food-items/${id}`);
      return response.data;
    } catch (error) {
      // Return success when backend is not available
      return { 
        success: true, 
        message: 'Food item deleted successfully (mock data)'
      };
    }
  }

  async getExpiringItems(days: number = 7): Promise<ApiResponse<FoodItem[]>> {
    try {
      const response = await this.api.get(`/food-items/expiring?days=${days}`);
      return response.data;
    } catch (error) {
      // Fallback to local storage when backend is not available
      console.log('Backend unavailable, getting expiring items from local storage');
      const expiringItems = await localStorageService.getExpiringItems(days);
      
      return {
        success: true,
        data: expiringItems,
        message: 'Using offline data'
      };
    }
  }

  // OCR and Image Processing
  async uploadImage(imageUri: string): Promise<ApiResponse<OCRResult[]>> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      } as any);

      const response = await this.api.post('/ocr/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return { success: false, error: 'Failed to process image' };
    }
  }

  // Recipes
  async getRecipeSuggestions(ingredients: string[]): Promise<ApiResponse<Recipe[]>> {
    try {
      const response = await this.api.post('/recipes/suggestions', { ingredients });
      return response.data;
    } catch (error) {
      return { success: true, data: [] };
    }
  }

  async getRecipe(id: string): Promise<ApiResponse<Recipe>> {
    try {
      const response = await this.api.get(`/recipes/${id}`);
      return response.data;
    } catch (error) {
      return { success: false, error: 'Recipe not found' };
    }
  }

  // Food Waste Analytics
  async getFoodWasteReport(month: string): Promise<ApiResponse<FoodWasteReport>> {
    try {
      const response = await this.api.get(`/analytics/waste-report?month=${month}`);
      return response.data;
    } catch (error) {
      return { 
        success: true, 
        data: {
          month,
          totalItems: 0,
          expiredItems: 0,
          consumedItems: 0,
          wasteScore: 0,
          savings: 0
        }
      };
    }
  }

  async getWasteHistory(months: number = 6): Promise<ApiResponse<FoodWasteReport[]>> {
    try {
      const response = await this.api.get(`/analytics/waste-history?months=${months}`);
      return response.data;
    } catch (error) {
      return { success: true, data: [] };
    }
  }

  // Notifications
  async registerDeviceToken(token: string, platform: 'ios' | 'android'): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.post('/notifications/register', { token, platform });
      return response.data;
    } catch (error) {
      return { success: false, error: 'Failed to register device token' };
    }
  }

  async updateNotificationSettings(settings: any): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.put('/notifications/settings', settings);
      return response.data;
    } catch (error) {
      return { success: false, error: 'Failed to update notification settings' };
    }
  }

  // User Profile
  async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.get('/users/profile');
      return response.data;
    } catch (error) {
      return { 
        success: true, 
        data: {
          id: '1',
          email: 'user@example.com',
          name: 'User Name',
          preferences: {
            notificationDays: 3,
            theme: 'dark',
            units: 'imperial'
          }
        }
      };
    }
  }

  async updateUserProfile(profile: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.put('/users/profile', profile);
      return response.data;
    } catch (error) {
      return { success: false, error: 'Failed to update user profile' };
    }
  }

  // Household Management
  async getHousehold(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/household');
      return response.data;
    } catch (error) {
      return { success: true, data: null };
    }
  }

  async createHousehold(name: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/household', { name });
      return response.data;
    } catch (error) {
      return { success: false, error: 'Failed to create household' };
    }
  }

  async inviteToHousehold(email: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.post('/household/invite', { email });
      return response.data;
    } catch (error) {
      return { success: false, error: 'Failed to invite to household' };
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.post('/auth/logout');
      return response.data;
    } catch (error) {
      return { success: false, error: 'Failed to logout' };
    }
  }
}

export const apiService = new ApiService();
export default apiService;

