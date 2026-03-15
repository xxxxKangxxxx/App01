import React from 'react';
import { View, Text } from 'react-native';

interface ExpiryBadgeProps {
  expiresAt?: string | null;
}

function getDaysUntilExpiry(expiresAt: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiresAt);
  expiry.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function ExpiryBadge({ expiresAt }: ExpiryBadgeProps) {
  if (!expiresAt) return null;

  const days = getDaysUntilExpiry(expiresAt);

  let label = '';
  let bgClass = '';
  let textClass = '';

  if (days < 0) {
    label = '만료됨';
    bgClass = 'bg-gray-200';
    textClass = 'text-gray-600';
  } else if (days === 0) {
    label = 'D-day';
    bgClass = 'bg-red-100';
    textClass = 'text-red-700';
  } else if (days === 1) {
    label = 'D-1';
    bgClass = 'bg-red-100';
    textClass = 'text-red-700';
  } else if (days <= 3) {
    label = `D-${days}`;
    bgClass = 'bg-orange-100';
    textClass = 'text-orange-700';
  } else if (days <= 7) {
    label = `D-${days}`;
    bgClass = 'bg-yellow-100';
    textClass = 'text-yellow-700';
  } else {
    label = `D-${days}`;
    bgClass = 'bg-green-100';
    textClass = 'text-green-700';
  }

  return (
    <View className={`rounded-full px-2 py-0.5 ${bgClass}`}>
      <Text className={`text-xs font-semibold ${textClass}`}>{label}</Text>
    </View>
  );
}
