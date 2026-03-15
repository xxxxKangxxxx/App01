import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FoodForm } from '../../components/FoodForm';
import { useFoodItem, useUpdateFoodItem } from '../../hooks/useFoodItems';
import type { UpdateFoodItemDto } from '@freshbox/types';

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useFoodItem(id);
  const updateMutation = useUpdateFoodItem();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">식재료를 찾을 수 없어요</Text>
      </View>
    );
  }

  const handleSubmit = (data: UpdateFoodItemDto) => {
    updateMutation.mutate(
      { id, data },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <FoodForm
      initialValues={{
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        purchasedAt: item.purchasedAt ?? undefined,
        expiresAt: item.expiresAt ?? undefined,
        location: item.location ?? undefined,
        memo: item.memo ?? undefined,
        refrigeratorId: item.refrigeratorId ?? undefined,
        zone: item.zone ?? undefined,
        shelf: item.shelf ?? undefined,
        depth: item.depth ?? undefined,
        colPosition: item.colPosition ?? undefined,
      }}
      onSubmit={handleSubmit}
      isLoading={updateMutation.isPending}
      submitLabel="수정하기"
    />
  );
}
