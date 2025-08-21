import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
  }

  // Food Items
  async getFoodItems(page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<FoodItem>>> {
    const response = await this.api.get(`/food-items?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getFoodItem(id: string): Promise<ApiResponse<FoodItem>> {
    const response = await this.api.get(`/food-items/${id}`);
    return response.data;
  }

  async createFoodItem(foodItem: Partial<FoodItem>): Promise<ApiResponse<FoodItem>> {
    const response = await this.api.post('/food-items', foodItem);
    return response.data;
  }

  async updateFoodItem(id: string, foodItem: Partial<FoodItem>): Promise<ApiResponse<FoodItem>> {
    const response = await this.api.put(`/food-items/${id}`, foodItem);
    return response.data;
  }

  async deleteFoodItem(id: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/food-items/${id}`);
    return response.data;
  }

  async getExpiringItems(days: number = 7): Promise<ApiResponse<FoodItem[]>> {
    const response = await this.api.get(`/food-items/expiring?days=${days}`);
    return response.data;
  }

  // OCR and Image Processing
  async uploadImage(imageUri: string): Promise<ApiResponse<OCRResult[]>> {
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
  }

  // Recipes
  async getRecipeSuggestions(ingredients: string[]): Promise<ApiResponse<Recipe[]>> {
    const response = await this.api.post('/recipes/suggestions', { ingredients });
    return response.data;
  }

  async getRecipe(id: string): Promise<ApiResponse<Recipe>> {
    const response = await this.api.get(`/recipes/${id}`);
    return response.data;
  }

  // Food Waste Analytics
  async getFoodWasteReport(month: string): Promise<ApiResponse<FoodWasteReport>> {
    const response = await this.api.get(`/analytics/waste-report?month=${month}`);
    return response.data;
  }

  async getWasteHistory(months: number = 6): Promise<ApiResponse<FoodWasteReport[]>> {
    const response = await this.api.get(`/analytics/waste-history?months=${months}`);
    return response.data;
  }

  // Notifications
  async registerDeviceToken(token: string, platform: 'ios' | 'android'): Promise<ApiResponse<void>> {
    const response = await this.api.post('/notifications/register', { token, platform });
    return response.data;
  }

  async updateNotificationSettings(settings: any): Promise<ApiResponse<void>> {
    const response = await this.api.put('/notifications/settings', settings);
    return response.data;
  }

  // User Profile
  async getUserProfile(): Promise<ApiResponse<User>> {
    const response = await this.api.get('/users/profile');
    return response.data;
  }

  async updateUserProfile(profile: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.api.put('/users/profile', profile);
    return response.data;
  }

  // Household Management
  async getHousehold(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/household');
    return response.data;
  }

  async createHousehold(name: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/household', { name });
    return response.data;
  }

  async inviteToHousehold(email: string): Promise<ApiResponse<void>> {
    const response = await this.api.post('/household/invite', { email });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;

