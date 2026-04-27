import type { ThemeColors } from '../constants/colors';

export type ExpiryStatus = 'none' | 'expired' | 'today' | 'soon' | 'caution' | 'safe';

export interface ExpiryUi {
  status: ExpiryStatus;
  label: string;
  text: string;
  bg: string;
  border: string;
  badge: string;
  badgeText: string;
}

export function getExpiryStatusFromDays(days: number | null): ExpiryStatus {
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days === 0) return 'today';
  if (days <= 3) return 'soon';
  if (days <= 7) return 'caution';
  return 'safe';
}

export function getExpiryLabelFromDays(days: number | null): string {
  if (days === null) return '';
  if (days < 0) return '만료';
  if (days === 0) return 'D-day';
  return `D-${days}`;
}

export function getExpiryUiFromDays(days: number | null, colors: ThemeColors): ExpiryUi {
  const status = getExpiryStatusFromDays(days);
  const label = getExpiryLabelFromDays(days);

  switch (status) {
    case 'expired':
      return {
        status,
        label,
        text: colors.textTertiary,
        bg: colors.bgSecondary,
        border: colors.border,
        badge: colors.textTertiary,
        badgeText: colors.textInverse,
      };
    case 'today':
      return {
        status,
        label,
        text: colors.danger,
        bg: colors.dangerLight,
        border: colors.danger,
        badge: colors.danger,
        badgeText: colors.textInverse,
      };
    case 'soon':
      return {
        status,
        label,
        text: colors.warning,
        bg: colors.warningLight,
        border: colors.warning,
        badge: colors.warning,
        badgeText: colors.textInverse,
      };
    case 'caution':
      return {
        status,
        label,
        text: colors.caution,
        bg: colors.cautionLight,
        border: colors.caution,
        badge: colors.caution,
        badgeText: colors.textInverse,
      };
    case 'safe':
      return {
        status,
        label,
        text: colors.success,
        bg: colors.successLight,
        border: colors.success,
        badge: colors.success,
        badgeText: colors.textInverse,
      };
    case 'none':
      return {
        status,
        label,
        text: colors.text,
        bg: colors.bgCard,
        border: colors.border,
        badge: colors.border,
        badgeText: colors.text,
      };
  }
}
