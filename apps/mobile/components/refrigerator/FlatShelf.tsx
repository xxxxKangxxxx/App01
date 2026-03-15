import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FoodItem } from '@freshbox/types';
import type { ZoneConfig } from './fridgeConfigs';
import { getFoodEmoji } from '../../constants/foodEmoji';

const MAX_VISIBLE = 4;

function getDaysUntilExpiry(expiresAt?: string | null): number | null {
  if (!expiresAt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAt);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / 86400000);
}

function getExpiryColor(expiresAt?: string | null): string {
  const days = getDaysUntilExpiry(expiresAt);
  if (days === null) return '#9ca3af';
  if (days < 0) return '#9ca3af';
  if (days === 0) return '#ef4444';
  if (days <= 3) return '#f97316';
  if (days <= 7) return '#eab308';
  return '#22c55e';
}

function getShelfStatus(items: FoodItem[]): { color: string; urgentCount: number } {
  let urgentCount = 0;
  let worstDays = Infinity;

  for (const item of items) {
    const days = getDaysUntilExpiry(item.expiresAt);
    if (days !== null && days <= 3) {
      urgentCount++;
      if (days < worstDays) worstDays = days;
    }
  }

  if (urgentCount === 0) return { color: '#22c55e', urgentCount: 0 };
  if (worstDays <= 0) return { color: '#ef4444', urgentCount };
  return { color: '#f97316', urgentCount };
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
  const isEmpty = items.length === 0;
  const { color: statusColor, urgentCount } = getShelfStatus(items);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{ paddingVertical: compact ? 3 : 6, paddingHorizontal: compact ? 6 : 10 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: compact ? 28 : 32 }}>
        {/* 층 번호 + 채워짐 인디케이터 */}
        <View style={{ width: compact ? 18 : 24, alignItems: 'center' }}>
          <Text style={{ fontSize: compact ? 10 : 11, color: '#9ca3af', fontWeight: '600' }}>
            {shelfNumber}F
          </Text>
          {/* 미니 채워짐 바 */}
          <View
            style={{
              width: compact ? 12 : 16,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: '#e5e7eb',
              marginTop: 2,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: isEmpty ? 0 : '100%',
                height: '100%',
                borderRadius: 1.5,
                backgroundColor: isEmpty ? 'transparent' : statusColor,
              }}
            />
          </View>
        </View>

        {/* 아이템 목록 */}
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginLeft: 4 }}>
          {isEmpty ? (
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#d1d5db',
                borderRadius: 8,
                paddingVertical: compact ? 2 : 4,
                gap: 4,
              }}
            >
              <Ionicons name="add-outline" size={compact ? 12 : 14} color="#d1d5db" />
              <Text style={{ fontSize: compact ? 10 : 11, color: '#d1d5db' }}>비어 있음</Text>
            </View>
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

        {/* 임박 경고 아이콘 */}
        {urgentCount > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4, gap: 2 }}>
            <Ionicons name="alert-circle" size={compact ? 12 : 14} color={statusColor} />
            <Text style={{ fontSize: compact ? 9 : 10, color: statusColor, fontWeight: '700' }}>
              {urgentCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
