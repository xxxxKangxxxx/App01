import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { FoodItem, CATEGORY_LABELS } from '@freshbox/types';
import { ExpiryBadge } from './ExpiryBadge';
import { useDeleteFoodItem, useUpdateFoodItem } from '../hooks/useFoodItems';
import { router } from 'expo-router';
import { getFoodEmoji } from '../constants/foodEmoji';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/theme.store';

interface FoodItemCardProps {
  item: FoodItem;
}

const LOCATION_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  냉장: 'snow-outline',
  냉동: 'snow',
  문선반: 'grid-outline',
  실온: 'sunny-outline',
};

export function FoodItemCard({ item }: FoodItemCardProps) {
  const { colors } = useThemeStore();
  const deleteMutation = useDeleteFoodItem();
  const updateMutation = useUpdateFoodItem();

  const handleDelete = () => {
    Alert.alert('폐기 확인', `${item.name}을(를) 폐기할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '폐기',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(item.id),
      },
    ]);
  };

  const handleConsume = () => {
    updateMutation.mutate({ id: item.id, data: { isConsumed: true } });
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
      onPress={() => router.push(`/(tabs)/edit?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 18 }}>{getFoodEmoji(item.name, item.category)}</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
              {item.name}
            </Text>
            {item.location && LOCATION_ICON_MAP[item.location] && (
              <Ionicons
                name={LOCATION_ICON_MAP[item.location]}
                size={14}
                color={item.location === '실온' ? colors.warning : colors.info}
              />
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                backgroundColor: colors.bgSecondary,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 2,
                overflow: 'hidden',
              }}
            >
              {CATEGORY_LABELS[item.category]}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {item.quantity} {item.unit}
            </Text>
          </View>

          {item.memo ? (
            <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }} numberOfLines={1}>
              {item.memo}
            </Text>
          ) : null}
        </View>

        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <ExpiryBadge expiresAt={item.expiresAt} />

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
              onPress={handleConsume}
            >
              <Text style={{ color: colors.textInverse, fontSize: 12, fontWeight: '500' }}>소비</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: colors.dangerLight,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
              onPress={handleDelete}
            >
              <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '500' }}>폐기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
