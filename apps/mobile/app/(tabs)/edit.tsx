import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FoodForm } from '../../components/FoodForm';
import { useFoodItem, useUpdateFoodItem } from '../../hooks/useFoodItems';
import type { UpdateFoodItemDto } from '@freshbox/types';
import { useThemeStore } from '../../store/theme.store';

export default function EditScreen() {
  const { colors } = useThemeStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useFoodItem(id);
  const updateMutation = useUpdateFoodItem();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <Text style={{ color: colors.textTertiary }}>식재료를 찾을 수 없어요</Text>
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
