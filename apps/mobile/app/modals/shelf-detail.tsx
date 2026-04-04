import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFoodItems } from '../../hooks/useFoodItems';
import { getFoodEmoji } from '../../constants/foodEmoji';
import { getDaysUntilExpiry } from '../../utils/date';

function expiryColor(days: number | null): string {
  if (days === null) return '#9ca3af';
  if (days < 0) return '#9ca3af';
  if (days === 0) return '#ef4444';
  if (days <= 3) return '#f97316';
  if (days <= 7) return '#eab308';
  return '#22c55e';
}

export default function ShelfDetailModal() {
  const params = useLocalSearchParams<{
    refrigeratorId?: string;
    zone?: string;
    shelf?: string;
    title?: string;
  }>();

  const { data: allItems = [] } = useFoodItems({ isConsumed: false });

  const items = allItems.filter((item) => {
    if (params.refrigeratorId && item.refrigeratorId !== params.refrigeratorId) return false;
    if (params.zone && item.zone !== params.zone) return false;
    if (params.shelf && item.shelf !== Number(params.shelf)) return false;
    return true;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 20 }}>
        {/* 헤더 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
            {params.title ?? '선반 상세'}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
          {items.length}개의 식재료
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => {
          const days = item.expiresAt ? getDaysUntilExpiry(item.expiresAt) : null;
          const color = expiryColor(days);

          return (
            <TouchableOpacity
              onPress={() => {
                router.back();
                router.push(`/(tabs)/edit?id=${item.id}`);
              }}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
            >
              {/* 이모지 + 유통기한 색상 */}
              <View style={{ alignItems: 'center', marginRight: 10 }}>
                <Text style={{ fontSize: 22 }}>{getFoodEmoji(item.name, item.category)}</Text>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: color,
                    marginTop: 2,
                  }}
                />
              </View>

              {/* 이름 + 카테고리 */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {item.quantity}{item.unit}
                  {item.depth ? ` · ${item.depth === 'front' ? '앞' : item.depth === 'back' ? '뒤' : '중간'}` : ''}
                </Text>
              </View>

              {/* 유통기한 */}
              {days !== null && (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 10,
                    backgroundColor: color + '22',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color }}>
                    {days < 0 ? '만료' : days === 0 ? 'D-day' : `D-${days}`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="cube-outline" size={36} color="#d1d5db" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>이 선반은 비어있어요</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
