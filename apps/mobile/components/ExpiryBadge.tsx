import React from 'react';
import { View, Text } from 'react-native';
import { getDaysUntilExpiry } from '../utils/date';
import { getExpiryUiFromDays } from '../utils/expiry';
import { useThemeStore } from '../store/theme.store';

interface ExpiryBadgeProps {
  expiresAt?: string | null;
}

export function ExpiryBadge({ expiresAt }: ExpiryBadgeProps) {
  const { colors } = useThemeStore();

  if (!expiresAt) return null;

  const days = getDaysUntilExpiry(expiresAt);
  const expiryUi = getExpiryUiFromDays(days, colors);
  const label = expiryUi.status === 'expired' ? '만료됨' : expiryUi.label;

  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: expiryUi.bg }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: expiryUi.text }}>{label}</Text>
    </View>
  );
}
