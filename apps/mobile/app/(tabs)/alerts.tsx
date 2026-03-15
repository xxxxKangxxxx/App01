import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useExpiringSoonItems } from '../../hooks/useFoodItems';
import { FoodItemCard } from '../../components/FoodItemCard';

export default function AlertsScreen() {
  const { data: items, isLoading, refetch, isRefetching } = useExpiringSoonItems();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dDayItems = items?.filter((item) => {
    if (!item.expiresAt) return false;
    const d = new Date(item.expiresAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const d1Items = items?.filter((item) => {
    if (!item.expiresAt) return false;
    const d = new Date(item.expiresAt);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    return diff === 1;
  });

  const d3Items = items?.filter((item) => {
    if (!item.expiresAt) return false;
    const d = new Date(item.expiresAt);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    return diff >= 2 && diff <= 3;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#22c55e"
            />
          }
          ListHeaderComponent={
            <View>
              {/* D-day */}
              {dDayItems && dDayItems.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row items-center gap-2 mb-3">
                    <View className="w-2 h-2 rounded-full bg-red-500" />
                    <Text className="text-base font-bold text-gray-900">
                      오늘 만료 ({dDayItems.length})
                    </Text>
                  </View>
                  {dDayItems.map((item) => (
                    <FoodItemCard key={item.id} item={item} />
                  ))}
                </View>
              )}

              {/* D-1 */}
              {d1Items && d1Items.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row items-center gap-2 mb-3">
                    <View className="w-2 h-2 rounded-full bg-orange-400" />
                    <Text className="text-base font-bold text-gray-900">
                      내일 만료 ({d1Items.length})
                    </Text>
                  </View>
                  {d1Items.map((item) => (
                    <FoodItemCard key={item.id} item={item} />
                  ))}
                </View>
              )}

              {/* D-2~3 */}
              {d3Items && d3Items.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row items-center gap-2 mb-3">
                    <View className="w-2 h-2 rounded-full bg-yellow-400" />
                    <Text className="text-base font-bold text-gray-900">
                      3일 내 만료 ({d3Items.length})
                    </Text>
                  </View>
                  {d3Items.map((item) => (
                    <FoodItemCard key={item.id} item={item} />
                  ))}
                </View>
              )}

              {/* 비어있을 때 */}
              {(!items || items.length === 0) && (
                <View className="items-center justify-center py-20">
                  <Ionicons name="checkmark-circle-outline" size={56} color="#22c55e" style={{ marginBottom: 16 }} />
                  <Text className="text-gray-400 text-base font-medium">
                    유통기한 임박 식재료가 없어요
                  </Text>
                  <Text className="text-gray-400 text-sm mt-1">
                    냉장고가 신선하게 관리되고 있어요!
                  </Text>
                </View>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
