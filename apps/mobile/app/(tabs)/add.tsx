import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { FoodForm } from '../../components/FoodForm';
import { useCreateFoodItem } from '../../hooks/useFoodItems';
import type { CreateFoodItemDto } from '@freshbox/types';
import { useThemeStore } from '../../store/theme.store';

export default function AddScreen() {
  const { colors } = useThemeStore();
  const createMutation = useCreateFoodItem();

  const handleSubmit = (data: CreateFoodItemDto) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        router.replace('/');
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCard }}>
      <FoodForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        submitLabel="추가하기"
      />
    </View>
  );
}
