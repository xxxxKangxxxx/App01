import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { FoodItem, CATEGORY_LABELS } from '@freshbox/types';
import { ExpiryBadge } from './ExpiryBadge';
import { useDeleteFoodItem, useUpdateFoodItem } from '../hooks/useFoodItems';
import { router } from 'expo-router';
import { getFoodEmoji } from '../constants/foodEmoji';

interface FoodItemCardProps {
  item: FoodItem;
}

import { Ionicons } from '@expo/vector-icons';

const LOCATION_ICON_MAP: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  냉장: { name: 'snow-outline', color: '#3b82f6' },
  냉동: { name: 'snow', color: '#6366f1' },
  문선반: { name: 'grid-outline', color: '#8b5cf6' },
  실온: { name: 'sunny-outline', color: '#f59e0b' },
};

export function FoodItemCard({ item }: FoodItemCardProps) {
  const deleteMutation = useDeleteFoodItem();
  const updateMutation = useUpdateFoodItem();

  const handleDelete = () => {
    Alert.alert('삭제 확인', `${item.name}을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
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
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
      onPress={() => router.push(`/(tabs)/edit?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text style={{ fontSize: 18 }}>{getFoodEmoji(item.name, item.category)}</Text>
            <Text className="text-base font-semibold text-gray-900">
              {item.name}
            </Text>
            {item.location && LOCATION_ICON_MAP[item.location] && (
              <Ionicons
                name={LOCATION_ICON_MAP[item.location].name}
                size={14}
                color={LOCATION_ICON_MAP[item.location].color}
              />
            )}
          </View>

          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
              {CATEGORY_LABELS[item.category]}
            </Text>
            <Text className="text-xs text-gray-500">
              {item.quantity} {item.unit}
            </Text>
          </View>

          {item.memo ? (
            <Text className="text-xs text-gray-400 mt-1" numberOfLines={1}>
              {item.memo}
            </Text>
          ) : null}
        </View>

        <View className="items-end gap-2">
          <ExpiryBadge expiresAt={item.expiresAt} />

          <View className="flex-row gap-2 mt-2">
            <TouchableOpacity
              className="bg-primary-500 rounded-lg px-3 py-1.5"
              onPress={handleConsume}
            >
              <Text className="text-white text-xs font-medium">소비</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-50 rounded-lg px-3 py-1.5"
              onPress={handleDelete}
            >
              <Text className="text-red-500 text-xs font-medium">삭제</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
