import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { FoodItem } from '@freshbox/types';
import type { ZoneConfig } from './fridgeConfigs';
import { getFoodEmoji } from '../../constants/foodEmoji';

const MAX_VISIBLE = 4;

function getExpiryColor(expiresAt?: string | null): string {
  if (!expiresAt) return '#9ca3af';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAt);
  exp.setHours(0, 0, 0, 0);
  const days = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0) return '#9ca3af';
  if (days === 0) return '#ef4444';
  if (days <= 3) return '#f97316';
  if (days <= 7) return '#eab308';
  return '#22c55e';
}

interface FlatShelfProps {
  zone: ZoneConfig;
  shelfNumber: number;
  items: FoodItem[];
  onPress?: () => void;
  compact?: boolean;
}

export function FlatShelf({ zone, shelfNumber, items, onPress, compact = false }: FlatShelfProps) {
  const maxVisible = compact ? 3 : MAX_VISIBLE;
  const visible = items.slice(0, maxVisible);
  const extra = items.length - maxVisible;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{ paddingVertical: compact ? 3 : 6, paddingHorizontal: compact ? 6 : 10 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: compact ? 28 : 32 }}>
        {/* 층 번호 */}
        <Text style={{ fontSize: compact ? 10 : 11, color: '#9ca3af', width: compact ? 18 : 24, fontWeight: '600' }}>
          {shelfNumber}F
        </Text>

        {/* 아이템 목록 */}
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {visible.length === 0 ? (
            <Text style={{ fontSize: compact ? 11 : 12, color: '#d1d5db', fontStyle: 'italic' }}>비어 있음</Text>
          ) : (
            visible.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#f9fafb',
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderLeftWidth: 3,
                  borderLeftColor: getExpiryColor(item.expiresAt),
                  gap: 3,
                }}
              >
                <Text style={{ fontSize: compact ? 12 : 13 }}>{getFoodEmoji(item.name, item.category)}</Text>
                <Text style={{ fontSize: compact ? 11 : 12, color: '#374151', fontWeight: '500' }} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))
          )}
          {extra > 0 && (
            <View
              style={{
                backgroundColor: '#e5e7eb',
                borderRadius: 8,
                paddingHorizontal: 6,
                paddingVertical: 2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '600' }}>+{extra}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 선반 구분선 — removed, glass divider now handled by parent */}
    </TouchableOpacity>
  );
}
