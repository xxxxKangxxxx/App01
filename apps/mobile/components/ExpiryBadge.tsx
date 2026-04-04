import React from 'react';
import { View, Text } from 'react-native';
import { getDaysUntilExpiry } from '../utils/date';

interface ExpiryBadgeProps {
  expiresAt?: string | null;
}

export function ExpiryBadge({ expiresAt }: ExpiryBadgeProps) {
  if (!expiresAt) return null;

  const days = getDaysUntilExpiry(expiresAt)!;

  let label = '';
  let bg = '';
  let textColor = '';

  if (days < 0) {
    label = '만료됨';
    bg = '#e5e7eb';
    textColor = '#4b5563';
  } else if (days === 0) {
    label = 'D-day';
    bg = '#fef2f2';
    textColor = '#b91c1c';
  } else if (days === 1) {
    label = 'D-1';
    bg = '#fef2f2';
    textColor = '#b91c1c';
  } else if (days <= 3) {
    label = `D-${days}`;
    bg = '#fff7ed';
    textColor = '#c2410c';
  } else if (days <= 7) {
    label = `D-${days}`;
    bg = '#fefce8';
    textColor = '#a16207';
  } else {
    label = `D-${days}`;
    bg = '#f0fdf4';
    textColor = '#15803d';
  }

  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: bg }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>{label}</Text>
    </View>
  );
}
