import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { FoodItem, Refrigerator } from '@freshbox/types';
import { REFRIGERATOR_TYPE_LABELS } from '@freshbox/types';
import { Ionicons } from '@expo/vector-icons';
import { getFoodEmoji } from '../../constants/foodEmoji';
import { getDaysUntilExpiry } from '../../utils/date';
import { useThemeStore } from '../../store/theme.store';

function shadeColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

interface FridgeCardProps {
  refrigerator: Refrigerator;
  items: FoodItem[];
  onPress: () => void;
}

export function FridgeCard({ refrigerator, items, onPress }: FridgeCardProps) {
  const { colors } = useThemeStore();
  const color = refrigerator.color ?? '#e5e7eb';
  const border = shadeColor(color, -18);
  const handle = shadeColor(color, -45);
  const innerEdge = shadeColor(color, -30);

  const fridgeItems = items.filter((i) => i.refrigeratorId === refrigerator.id);
  const expiredCount = fridgeItems.filter((i) => {
    if (!i.expiresAt) return false;
    return getDaysUntilExpiry(i.expiresAt)! < 0;
  }).length;
  const expiringCount = fridgeItems.filter((i) => {
    if (!i.expiresAt) return false;
    const days = getDaysUntilExpiry(i.expiresAt)!;
    return days >= 0 && days <= 3;
  }).length;

  // 식재료 이모지 미리보기 (최대 5개)
  const previewItems = fridgeItems.slice(0, 5);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={{
        width: 160,
        marginRight: 12,
        borderWidth: 2.5,
        borderColor: border,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: color,
      }}
    >
      {/* 문 패널 */}
      <View style={{ height: 90, position: 'relative' }}>
        {/* 왼쪽 문 */}
        <View
          style={{
            position: 'absolute',
            top: 0, bottom: 0, left: 0, right: '50%',
            backgroundColor: color,
            borderRightWidth: 2.5,
            borderRightColor: innerEdge,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: '30%',
              bottom: '30%',
              width: 4,
              right: 10,
              backgroundColor: handle,
              borderRadius: 2,
            }}
          />
        </View>

        {/* 오른쪽 문 */}
        <View
          style={{
            position: 'absolute',
            top: 0, bottom: 0, right: 0, left: '50%',
            backgroundColor: color,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: '30%',
              bottom: '30%',
              width: 4,
              left: 10,
              backgroundColor: handle,
              borderRadius: 2,
            }}
          />
        </View>

        {/* 중앙 아이콘 */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="snow-outline" size={24} color={shadeColor(color, -50)} />
        </View>
      </View>

      {/* 정보 영역 */}
      <View
        style={{
          backgroundColor: colors.bgCard,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderTopWidth: 2,
          borderTopColor: border,
          gap: 6,
        }}
      >
        {/* 이름 + 타입 */}
        <View>
          <Text
            style={{ fontSize: 13, fontWeight: '700', color: colors.text }}
            numberOfLines={1}
          >
            {refrigerator.name}
          </Text>
          <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 1 }}>
            {REFRIGERATOR_TYPE_LABELS[refrigerator.type]}
          </Text>
        </View>

        {/* 식재료 이모지 미리보기 */}
        {previewItems.length > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {previewItems.map((item) => (
              <Text key={item.id} style={{ fontSize: 14 }}>
                {getFoodEmoji(item.name, item.category)}
              </Text>
            ))}
            {fridgeItems.length > 5 && (
              <Text style={{ fontSize: 10, color: colors.textTertiary, marginLeft: 2 }}>
                +{fridgeItems.length - 5}
              </Text>
            )}
          </View>
        ) : (
          <Text style={{ fontSize: 11, color: colors.border }}>비어있음</Text>
        )}

        {/* 하단 상태 표시 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 10, color: colors.textSecondary }}>{fridgeItems.length}개</Text>
          {expiringCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningLight, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1, gap: 2 }}>
              <Ionicons name="alert-circle" size={10} color={colors.warning} />
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.warning }}>{expiringCount}</Text>
            </View>
          )}
          {expiredCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.dangerLight, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1, gap: 2 }}>
              <Ionicons name="close-circle" size={10} color={colors.danger} />
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.danger }}>{expiredCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
