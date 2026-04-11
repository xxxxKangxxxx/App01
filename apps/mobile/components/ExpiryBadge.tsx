import React from 'react';
import { View, Text } from 'react-native';
import { getDaysUntilExpiry } from '../utils/date';
import { useThemeStore } from '../store/theme.store';

interface ExpiryBadgeProps {
  expiresAt?: string | null;
}

export function ExpiryBadge({ expiresAt }: ExpiryBadgeProps) {
  const { colors } = useThemeStore();

  if (!expiresAt) return null;

  const days = getDaysUntilExpiry(expiresAt)!;

  let label = '';
  let bg = '';
  let textColor = '';

  if (days < 0) {
    label = '만료됨';
    bg = colors.border;
    textColor = colors.textTertiary;
  } else if (days <= 1) {
    label = days === 0 ? 'D-day' : 'D-1';
    bg = colors.dangerLight;
    textColor = colors.danger;
  } else if (days <= 3) {
    label = `D-${days}`;
    bg = colors.warningLight;
    textColor = colors.warning;
  } else if (days <= 7) {
    label = `D-${days}`;
    bg = colors.cautionLight;
    textColor = colors.caution;
  } else {
    label = `D-${days}`;
    bg = colors.successLight;
    textColor = colors.success;
  }

  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: bg }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>{label}</Text>
    </View>
  );
}
