import { Ionicons } from '@expo/vector-icons';
import type { Category } from '@freshbox/types';
import type { ThemeColors } from './colors';

export type CategoryIconName = keyof typeof Ionicons.glyphMap;

export const CATEGORY_ICON_NAMES: Record<Category, CategoryIconName> = {
  VEGETABLES: 'leaf-outline',
  FRUITS: 'nutrition-outline',
  MEAT: 'flame-outline',
  SEAFOOD: 'fish-outline',
  DAIRY: 'water-outline',
  BEVERAGE: 'cafe-outline',
  CONDIMENT: 'flask-outline',
  FROZEN: 'snow-outline',
  OTHER: 'ellipsis-horizontal-outline',
};

export function getCategoryAccent(category: Category, colors: ThemeColors): string {
  switch (category) {
    case 'VEGETABLES':
      return colors.success;
    case 'FRUITS':
      return colors.warning;
    case 'MEAT':
      return colors.danger;
    case 'SEAFOOD':
      return colors.info;
    case 'DAIRY':
      return colors.primary;
    case 'BEVERAGE':
      return colors.info;
    case 'CONDIMENT':
      return colors.caution;
    case 'FROZEN':
      return colors.info;
    case 'OTHER':
      return colors.textSecondary;
  }
}

export function getCategoryIcon(category: Category): CategoryIconName {
  return CATEGORY_ICON_NAMES[category];
}
