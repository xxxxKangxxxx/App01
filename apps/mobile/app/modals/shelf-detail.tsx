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
import { getExpiryUiFromDays } from '../../utils/expiry';
import { useThemeStore } from '../../store/theme.store';

export default function ShelfDetailModal() {
  const { colors } = useThemeStore();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20 }}>
        {/* 헤더 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            {params.title ?? '선반 상세'}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
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
          const expiryUi = getExpiryUiFromDays(days, colors);

          return (
            <TouchableOpacity
              onPress={() => {
                router.back();
                router.push(`/(tabs)/edit?id=${item.id}`);
              }}
              style={{
                backgroundColor: colors.bgCard,
                borderRadius: 12,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
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
                    backgroundColor: expiryUi.text,
                    marginTop: 2,
                  }}
                />
              </View>

              {/* 이름 + 카테고리 */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>
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
                    backgroundColor: expiryUi.bg,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: expiryUi.text }}>
                    {expiryUi.label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="cube-outline" size={36} color={colors.border} style={{ marginBottom: 8 }} />
            <Text style={{ color: colors.textTertiary, fontSize: 14 }}>이 선반은 비어있어요</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
