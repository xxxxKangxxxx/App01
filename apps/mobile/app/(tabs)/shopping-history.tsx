import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/theme.store';
import { useShoppingLists } from '../../hooks/useShopping';
import type { ShoppingList } from '@freshbox/types';
import { getFoodEmoji } from '../../constants/foodEmoji';

function ListCard({ list }: { list: ShoppingList }) {
  const { colors } = useThemeStore();
  const items = list.items ?? [];
  const purchasedCount = items.filter((i) => i.isPurchased).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  };

  return (
    <View
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 }} numberOfLines={1}>
          {list.name ?? '장보기 목록'}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textTertiary }}>
          {formatDate(list.createdAt)}
        </Text>
      </View>

      {/* 아이템 미리보기 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {items.slice(0, 8).map((item) => (
          <Text key={item.id} style={{ fontSize: 18 }}>
            {getFoodEmoji(item.name, item.category ?? 'OTHER')}
          </Text>
        ))}
        {items.length > 8 && (
          <Text style={{ fontSize: 12, color: colors.textTertiary, alignSelf: 'center' }}>
            +{items.length - 8}
          </Text>
        )}
      </View>

      <Text style={{ fontSize: 12, color: colors.textTertiary }}>
        {purchasedCount}/{items.length}개 구매 완료
      </Text>
    </View>
  );
}

export default function ShoppingHistoryScreen() {
  const { colors } = useThemeStore();
  const { data: lists = [], isLoading, refetch, isRefetching } = useShoppingLists({ isCompleted: true });

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.info} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.info} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {lists.length > 0 ? (
          lists.map((list) => <ListCard key={list.id} list={list} />)
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="receipt-outline" size={56} color={colors.textTertiary} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
              지난 장보기가 없어요
            </Text>
            <Text style={{ fontSize: 13, color: colors.textTertiary, marginTop: 6 }}>
              장보기를 완료하면 여기에 기록돼요
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
