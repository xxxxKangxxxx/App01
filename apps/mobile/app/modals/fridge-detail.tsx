import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFoodItems } from '../../hooks/useFoodItems';
import { useRefrigerators } from '../../hooks/useRefrigerators';
import { RefrigeratorView } from '../../components/refrigerator/RefrigeratorView';
import { REFRIGERATOR_TYPE_LABELS } from '@freshbox/types';
import type { FoodItem } from '@freshbox/types';
import type { ZoneConfig } from '../../components/refrigerator/fridgeConfigs';
import { getDaysUntilExpiry } from '../../utils/date';

function SummaryCard({ items }: { items: FoodItem[] }) {
  let expired = 0;
  let expiring = 0;
  let safe = 0;

  for (const item of items) {
    const days = getDaysUntilExpiry(item.expiresAt);
    if (days === null) {
      safe++;
    } else if (days < 0) {
      expired++;
    } else if (days <= 3) {
      expiring++;
    } else {
      safe++;
    }
  }

  const total = items.length;

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <StatBox icon="cube-outline" color="#3b82f6" label="전체" value={total} />
      <StatBox icon="checkmark-circle" color="#22c55e" label="여유" value={safe} />
      <StatBox icon="alert-circle" color="#f97316" label="임박" value={expiring} />
      <StatBox icon="close-circle" color="#ef4444" label="만료" value={expired} />
    </View>
  );
}

function StatBox({
  icon,
  color,
  label,
  value,
}: {
  icon: string;
  color: string;
  label: string;
  value: number;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{value}</Text>
      <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

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

  const fridgeItems = items.filter((i) => i.refrigeratorId === refrigerator.id);

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
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
            {refrigerator.name}
          </Text>
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>
            {REFRIGERATOR_TYPE_LABELS[refrigerator.type]}
          </Text>
        </View>
        <TouchableOpacity onPress={handleEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 14, color: '#3b82f6', fontWeight: '600' }}>편집</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16, paddingBottom: 32, gap: 12 }}>
        {/* 요약 카드 */}
        <SummaryCard items={fridgeItems} />

        {/* 냉장고 뷰 */}
        <RefrigeratorView
          refrigerator={refrigerator}
          items={items}
          onShelfPress={handleShelfPress}
        />
      </View>
    </SafeAreaView>
  );
}
