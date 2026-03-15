import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFoodItems } from '../../hooks/useFoodItems';
import { useRefrigerators } from '../../hooks/useRefrigerators';
import { RefrigeratorView } from '../../components/refrigerator/RefrigeratorView';
import type { FoodItem } from '@freshbox/types';
import type { ZoneConfig } from '../../components/refrigerator/fridgeConfigs';

export default function FridgeDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: refrigerators = [], isLoading: fridgesLoading } = useRefrigerators();
  const { data: items = [], isLoading: itemsLoading } = useFoodItems({ isConsumed: false });

  const refrigerator = refrigerators.find((r) => r.id === id);

  const handleShelfPress = (zone: ZoneConfig, shelf: number, shelfItems: FoodItem[]) => {
    if (!refrigerator) return;
    router.push(
      `/modals/shelf-detail?refrigeratorId=${refrigerator.id}&zone=${zone.key}&shelf=${shelf}&title=${refrigerator.name} ${zone.label} ${shelf}층`,
    );
  };

  const handleEdit = () => {
    if (!refrigerator) return;
    router.push(
      `/modals/refrigerator-setup?id=${refrigerator.id}&name=${refrigerator.name}&type=${refrigerator.type}&color=${refrigerator.color ?? ''}`,
    );
  };

  if (fridgesLoading || itemsLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (!refrigerator) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9ca3af' }}>냉장고를 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      {/* 헤더 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color="#6b7280" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
          {refrigerator.name}
        </Text>
        <TouchableOpacity onPress={handleEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 14, color: '#3b82f6', fontWeight: '600' }}>편집</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16, paddingBottom: 32 }}>
        <RefrigeratorView
          refrigerator={refrigerator}
          items={items}
          onShelfPress={handleShelfPress}
        />
      </View>
    </SafeAreaView>
  );
}
