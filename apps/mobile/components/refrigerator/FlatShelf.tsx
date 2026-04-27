import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FoodItem } from '@freshbox/types';
import type { ZoneConfig } from './fridgeConfigs';
import { getFoodEmoji } from '../../constants/foodEmoji';
import { getDaysUntilExpiry } from '../../utils/date';
import { useThemeStore } from '../../store/theme.store';
import type { ThemeColors } from '../../constants/colors';
import { getExpiryUiFromDays } from '../../utils/expiry';

const MAX_VISIBLE = 4;

function getExpiryColor(expiresAt: string | null | undefined, colors: ThemeColors): string {
  const days = getDaysUntilExpiry(expiresAt);
  return getExpiryUiFromDays(days, colors).badge;
}

function getShelfStatus(items: FoodItem[], colors: ThemeColors): { color: string; urgentCount: number } {
  let urgentCount = 0;
  let worstDays = Infinity;

  for (const item of items) {
    const days = getDaysUntilExpiry(item.expiresAt);
    if (days !== null && days <= 3) {
      urgentCount++;
      if (days < worstDays) worstDays = days;
    }
  }

  if (urgentCount === 0) return { color: colors.success, urgentCount: 0 };
  if (worstDays <= 0) return { color: colors.danger, urgentCount };
  return { color: colors.warning, urgentCount };
}

interface FlatShelfProps {
  zone: ZoneConfig;
  shelfNumber: number;
  items: FoodItem[];
  onPress?: () => void;
  compact?: boolean;
}

export function FlatShelf({ zone, shelfNumber, items, onPress, compact = false }: FlatShelfProps) {
  const { colors } = useThemeStore();
  const maxVisible = compact ? 3 : MAX_VISIBLE;
  const visible = items.slice(0, maxVisible);
  const extra = items.length - maxVisible;
  const isEmpty = items.length === 0;
  const { color: statusColor, urgentCount } = getShelfStatus(items, colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{ paddingVertical: compact ? 3 : 6, paddingHorizontal: compact ? 6 : 10 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: compact ? 28 : 32 }}>
        {/* 층 번호 + 채워짐 인디케이터 */}
        <View style={{ width: compact ? 18 : 24, alignItems: 'center' }}>
          <Text style={{ fontSize: compact ? 10 : 11, color: colors.textTertiary, fontWeight: '600' }}>
            {shelfNumber}F
          </Text>
          {/* 미니 채워짐 바 */}
          <View
            style={{
              width: compact ? 12 : 16,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: colors.border,
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
                borderColor: colors.border,
                borderRadius: 8,
                paddingVertical: compact ? 2 : 4,
                gap: 4,
              }}
            >
              <Ionicons name="add-outline" size={compact ? 12 : 14} color={colors.border} />
              <Text style={{ fontSize: compact ? 10 : 11, color: colors.border }}>비어 있음</Text>
            </View>
          ) : (
            visible.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.bgSecondary,
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderLeftWidth: 3,
                  borderLeftColor: getExpiryColor(item.expiresAt, colors),
                  gap: 3,
                }}
              >
                <Text style={{ fontSize: compact ? 12 : 13 }}>{getFoodEmoji(item.name, item.category)}</Text>
                <Text style={{ fontSize: compact ? 11 : 12, color: colors.text, fontWeight: '500' }} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))
          )}
          {extra > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 6,
                paddingVertical: 2,
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <Text style={{ fontSize: compact ? 10 : 11, color: colors.textSecondary, fontWeight: '700' }}>
                +{extra}
              </Text>
              {!compact && (
                <Ionicons name="chevron-forward" size={10} color={colors.textTertiary} />
              )}
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
