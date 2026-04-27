import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
      {/* 영수증 스캔 버튼 */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/receipt-scan')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 4,
          paddingVertical: 14,
          backgroundColor: colors.successLight,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.success,
          borderStyle: 'dashed',
        }}
      >
        <Ionicons name="scan-outline" size={22} color={colors.success} />
        <Text
          style={{
            marginLeft: 8,
            fontSize: 15,
            fontWeight: '600',
            color: colors.success,
          }}
        >
          영수증 스캔으로 추가
        </Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.success}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          marginVertical: 8,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text
          style={{
            marginHorizontal: 12,
            fontSize: 12,
            color: colors.textTertiary,
          }}
        >
          또는 직접 입력
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      <FoodForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        submitLabel="추가하기"
      />
    </View>
  );
}
