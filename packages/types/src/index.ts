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
  consumedAt?: string | null;
  deletedAt?: string | null;
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

// ── Receipt Scan ──

export interface ParseReceiptRequest {
  ocrText: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  category: Category;
  purchasedAt: string;
  expiresAt: string;
  defaultShelfLifeDays: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ParseReceiptResponse {
  items: ReceiptItem[];
  storeName?: string;
  purchaseDate?: string;
  totalAmount?: number;
}

export interface BulkCreateFoodItemDto {
  items: CreateFoodItemDto[];
}

export interface BulkCreateFoodItemResponse {
  created: FoodItem[];
  count: number;
}

// ── Shelf Life ──

export type StorageMethod = 'REFRIGERATED' | 'FROZEN' | 'ROOM_TEMP';

export const STORAGE_METHOD_LABELS: Record<StorageMethod, string> = {
  REFRIGERATED: '냉장',
  FROZEN: '냉동',
  ROOM_TEMP: '실온',
};

export interface FoodShelfLife {
  id: string;
  name: string;
  category: Category;
  defaultDays: number;
  storageMethod: StorageMethod;
}

// ── Shopping ──

export interface ShoppingList {
  id: string;
  name?: string | null;
  suggestedDate?: string | null;
  isCompleted: boolean;
  userId: string;
  items?: ShoppingItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category?: Category | null;
  quantity: number;
  unit: string;
  isPurchased: boolean;
  isRecommended: boolean;
  reason?: string | null;
  shoppingListId: string;
  createdAt: string;
  updatedAt: string;
}

export type RecommendedItemReasonType =
  | 'staple_missing'
  | 'expiring_repurchase'
  | 'recent_consumed';

export interface RecommendedItem {
  name: string;
  category?: Category | null;
  quantity: number;
  unit: string;
  reason: string;
  reasonType: RecommendedItemReasonType;
  purchaseCount: number;
  avgIntervalDays?: number | null;
  predictedNextDate?: string | null;
}

export interface ShoppingRecommendationResponse {
  recommendations: RecommendedItem[];
  suggestedDate: string | null;
  suggestedDateReason: string | null;
  stapleCount: number;
}

export interface CreateShoppingListDto {
  name?: string;
  suggestedDate?: string;
}

export interface UpdateShoppingListDto {
  name?: string;
  isCompleted?: boolean;
  suggestedDate?: string;
}

export interface AddShoppingItemDto {
  name: string;
  category?: Category;
  quantity?: number;
  unit?: string;
  isRecommended?: boolean;
  reason?: string;
}

export interface UpdateShoppingItemDto {
  name?: string;
  quantity?: number;
  unit?: string;
  isPurchased?: boolean;
}

export interface PurchaseAndAddDto {
  refrigeratorId?: string;
  zone?: string;
  shelf?: number;
  expiresAt?: string;
}

// ── Monthly Stats ──

export interface MonthlyStatsSummary {
  purchased: number;
  consumed: number;
  discarded: number;
  usageRate: number;
}

export interface CategoryStat {
  purchased: number;
  consumed: number;
  discarded: number;
}

export interface TopItem {
  name: string;
  count: number;
  category: string;
}

export interface MonthlyStatsResponse {
  year: number;
  month: number;
  summary: MonthlyStatsSummary;
  categoryStats: Record<string, CategoryStat>;
  topPurchased: TopItem[];
  topDiscarded: TopItem[];
}
