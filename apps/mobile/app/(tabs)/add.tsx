import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
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
          backgroundColor: '#f0fdf4',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#bbf7d0',
          borderStyle: 'dashed',
        }}
      >
        <Ionicons name="scan-outline" size={22} color="#16a34a" />
        <Text
          style={{
            marginLeft: 8,
            fontSize: 15,
            fontWeight: '600',
            color: '#16a34a',
          }}
        >
          영수증 스캔으로 추가
        </Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color="#16a34a"
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
        <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
        <Text
          style={{
            marginHorizontal: 12,
            fontSize: 12,
            color: '#9ca3af',
          }}
        >
          또는 직접 입력
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
      </View>

      <FoodForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        submitLabel="추가하기"
      />
    </View>
  );
}
