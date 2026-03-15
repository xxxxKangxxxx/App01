import React from 'react';
import { router } from 'expo-router';
import { FoodForm } from '../../components/FoodForm';
import { useCreateFoodItem } from '../../hooks/useFoodItems';
import type { CreateFoodItemDto } from '@freshbox/types';

export default function AddScreen() {
  const createMutation = useCreateFoodItem();

  const handleSubmit = (data: CreateFoodItemDto) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        router.replace('/(tabs)/');
      },
    });
  };

  return (
    <FoodForm
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
      submitLabel="추가하기"
    />
  );
}
