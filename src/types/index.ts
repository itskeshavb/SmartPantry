export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  purchaseDate: string;
  expirationDate: string;
  quantity: number;
  unit: string;
  location: StorageLocation;
  imageUrl?: string;
  barcode?: string;
  notes?: string;
  userId: string;
  householdId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum FoodCategory {
  DAIRY = 'dairy',
  MEAT = 'meat',
  PRODUCE = 'produce',
  PANTRY = 'pantry',
  FROZEN = 'frozen',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  CONDIMENTS = 'condiments',
  OTHER = 'other'
}

export enum StorageLocation {
  FRIDGE = 'fridge',
  FREEZER = 'freezer',
  PANTRY = 'pantry',
  COUNTER = 'counter'
}

export interface User {
  id: string;
  email: string;
  name: string;
  householdId?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  notificationDays: number;
  theme: 'light' | 'dark';
  units: 'metric' | 'imperial';
}

export interface Household {
  id: string;
  name: string;
  members: string[];
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  matchingIngredients?: string[];
}

export interface FoodWasteReport {
  month: string;
  totalItems: number;
  expiredItems: number;
  consumedItems: number;
  wasteScore: number;
  savings: number;
}

export interface NotificationSettings {
  enabled: boolean;
  daysBeforeExpiration: number;
  timeOfDay: string;
  categories: FoodCategory[];
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

