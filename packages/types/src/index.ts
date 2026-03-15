// RefrigeratorType
export type RefrigeratorType = 'STANDARD' | 'SIDE_BY_SIDE' | 'FRENCH_DOOR' | 'FREEZER' | 'KIMCHI';

export interface CustomZone {
  key: string;
  label: string;
  shelves: number;
}

export const REFRIGERATOR_TYPE_LABELS: Record<RefrigeratorType, string> = {
  STANDARD: '일반형',
  SIDE_BY_SIDE: '양문형',
  FRENCH_DOOR: '프렌치도어',
  FREEZER: '냉동고',
  KIMCHI: '김치냉장고',
};

export interface Refrigerator {
  id: string;
  name: string;
  type: RefrigeratorType;
  color?: string | null;
  sortOrder: number;
  customZones?: CustomZone[] | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateRefrigeratorDto = Pick<Refrigerator, 'name' | 'type'> & {
  color?: string;
  sortOrder?: number;
  customZones?: CustomZone[];
};
export type UpdateRefrigeratorDto = Partial<CreateRefrigeratorDto>;

// Category enum
export type Category =
  | 'VEGETABLES'
  | 'FRUITS'
  | 'MEAT'
  | 'SEAFOOD'
  | 'DAIRY'
  | 'BEVERAGE'
  | 'CONDIMENT'
  | 'FROZEN'
  | 'OTHER';

export const CATEGORY_LABELS: Record<Category, string> = {
  VEGETABLES: '채소',
  FRUITS: '과일',
  MEAT: '육류',
  SEAFOOD: '해산물',
  DAIRY: '유제품',
  BEVERAGE: '음료',
  CONDIMENT: '양념/소스',
  FROZEN: '냉동식품',
  OTHER: '기타',
};

// User
export interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  pushToken?: string | null;
  createdAt: string;
  updatedAt: string;
}

// FoodItem
export interface FoodItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  purchasedAt?: string | null;
  expiresAt?: string | null;
  location?: string | null;
  memo?: string | null;
  isConsumed: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  refrigeratorId?: string | null;
  zone?: string | null;
  shelf?: number | null;
  depth?: string | null;
  colPosition?: string | null;
}

// DTOs
export interface CreateFoodItemDto {
  name: string;
  category: Category;
  quantity?: number;
  unit?: string;
  purchasedAt?: string;
  expiresAt?: string;
  location?: string;
  memo?: string;
  refrigeratorId?: string;
  zone?: string;
  shelf?: number;
  depth?: string;
  colPosition?: string;
}

export interface UpdateFoodItemDto {
  name?: string;
  category?: Category;
  quantity?: number;
  unit?: string;
  purchasedAt?: string;
  expiresAt?: string;
  location?: string;
  memo?: string;
  isConsumed?: boolean;
  refrigeratorId?: string;
  zone?: string;
  shelf?: number;
  depth?: string;
  colPosition?: string;
}

export interface FoodItemFilters {
  category?: Category;
  location?: string;
  expiringSoon?: boolean;
  isConsumed?: boolean;
}

// Auth
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

// Push Notification
export interface UpdatePushTokenDto {
  pushToken: string;
}

// API Response
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
