import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeStore } from '../../store/theme.store';
import {
  useShoppingRecommendations,
  useShoppingLists,
  useCreateListFromRecommendations,
  useAddShoppingItem,
  useUpdateShoppingItem,
  useDeleteShoppingItem,
  usePurchaseShoppingItem,
  useUpdateShoppingList,
} from '../../hooks/useShopping';
import type { RecommendedItem, ShoppingItem } from '@freshbox/types';
import SuggestedDateCard from '../../components/shopping/SuggestedDateCard';
import RecommendationCard from '../../components/shopping/RecommendationCard';
import ShoppingItemRow from '../../components/shopping/ShoppingItemRow';
import AddItemInline from '../../components/shopping/AddItemInline';

export default function ShoppingScreen() {
  const { colors } = useThemeStore();

  const {
    data: recData,
    isLoading: recLoading,
    refetch: refetchRec,
    isRefetching: recRefetching,
  } = useShoppingRecommendations();

  const {
    data: lists = [],
    isLoading: listsLoading,
    refetch: refetchLists,
    isRefetching: listsRefetching,
  } = useShoppingLists({ isCompleted: false });

  const createFromRec = useCreateListFromRecommendations();
  const addItem = useAddShoppingItem();
  const updateItem = useUpdateShoppingItem();
  const deleteItem = useDeleteShoppingItem();
  const purchaseItem = usePurchaseShoppingItem();
  const updateList = useUpdateShoppingList();

  // 가장 최근 활성 리스트
  const activeList = lists.length > 0 ? lists[0] : null;
  const activeItems = activeList?.items ?? [];

  const isLoading = recLoading || listsLoading;
  const isRefreshing = recRefetching || listsRefetching;

  const onRefresh = () => {
    refetchRec();
    refetchLists();
  };

  // 추천 전체 → 리스트 생성
  const handleCreateList = () => {
    createFromRec.mutate(undefined);
  };

  // 개별 추천 → 활성 리스트에 추가
  const handleAddRecommendation = (rec: RecommendedItem) => {
    if (!activeList) {
      // 리스트 없으면 전체 생성
      createFromRec.mutate(undefined);
      return;
    }
    addItem.mutate({
      listId: activeList.id,
      data: {
        name: rec.name,
        category: rec.category ?? undefined,
        quantity: rec.quantity,
        unit: rec.unit,
        isRecommended: true,
        reason: rec.reason,
      },
    });
  };

  // 아이템 체크 토글
  const handleToggle = (item: ShoppingItem) => {
    if (!activeList) return;

    if (!item.isPurchased) {
      // 체크 시 냉장고 추가 여부 묻기
      Alert.alert(
        '구매 완료',
        `${item.name}을(를) 냉장고에도 추가할까요?`,
        [
          {
            text: '체크만',
            onPress: () =>
              updateItem.mutate({
                listId: activeList.id,
                itemId: item.id,
                data: { isPurchased: true },
              }),
          },
          {
            text: '냉장고에 추가',
            onPress: () =>
              purchaseItem.mutate({
                listId: activeList.id,
                itemId: item.id,
              }),
          },
          { text: '취소', style: 'cancel' },
        ],
      );
    } else {
      // 체크 해제
      updateItem.mutate({
        listId: activeList.id,
        itemId: item.id,
        data: { isPurchased: false },
      });
    }
  };

  // 아이템 삭제
  const handleDeleteItem = (item: ShoppingItem) => {
    if (!activeList) return;
    Alert.alert('삭제', `${item.name}을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          deleteItem.mutate({ listId: activeList.id, itemId: item.id }),
      },
    ]);
  };

  // 수동 아이템 추가
  const handleAddManual = (name: string) => {
    if (!activeList) {
      // 리스트 없으면 먼저 생성 후 추가
      createFromRec.mutate(undefined, {
        onSuccess: (list) => {
          addItem.mutate({ listId: list.id, data: { name } });
        },
      });
      return;
    }
    addItem.mutate({ listId: activeList.id, data: { name } });
  };

  // 장보기 완료
  const handleCompleteList = () => {
    if (!activeList) return;
    Alert.alert('장보기 완료', '이 목록을 완료 처리할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '완료',
        onPress: () =>
          updateList.mutate({
            id: activeList.id,
            data: { isCompleted: true },
          }),
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator size="large" color={colors.info} />
      </SafeAreaView>
    );
  }

  const recommendations = recData?.recommendations ?? [];
  const hasRecommendations = recommendations.length > 0;
  const hasActiveList = activeList && activeItems.length > 0;
  const purchasedCount = activeItems.filter((i) => i.isPurchased).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.info} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* 섹션 1: 장보기 날짜 제안 */}
        {(hasRecommendations || recData) && (
          <View style={{ marginBottom: 20 }}>
            <SuggestedDateCard
              suggestedDate={recData?.suggestedDate ?? null}
              suggestedDateReason={recData?.suggestedDateReason ?? null}
              stapleCount={recData?.stapleCount ?? 0}
              onCreateList={handleCreateList}
              isCreating={createFromRec.isPending}
            />
          </View>
        )}

        {/* 섹션 2: 추천 식재료 */}
        {hasRecommendations && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: colors.infoLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="sparkles-outline" size={15} color={colors.info} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 }}>
                추천 식재료
              </Text>
              <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                {recommendations.length}개
              </Text>
            </View>
            {recommendations.map((rec, idx) => (
              <RecommendationCard
                key={`${rec.name}-${idx}`}
                item={rec}
                onAdd={handleAddRecommendation}
              />
            ))}
          </View>
        )}

        {/* 섹션 3: 현재 장보기 목록 */}
        {hasActiveList && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="cart-outline" size={15} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 }}>
                {activeList.name ?? '장보기 목록'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                {purchasedCount}/{activeItems.length}
              </Text>
            </View>

            {/* 진행 바 */}
            <View
              style={{
                height: 4,
                backgroundColor: colors.border,
                borderRadius: 2,
                marginBottom: 12,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${activeItems.length > 0 ? (purchasedCount / activeItems.length) * 100 : 0}%`,
                  backgroundColor: colors.primary,
                  borderRadius: 2,
                }}
              />
            </View>

            {/* 스와이프 힌트 */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 4,
                marginBottom: 10,
              }}
            >
              <Ionicons name="arrow-back" size={12} color="#ef4444" />
              <Text style={{ fontSize: 10, color: colors.textTertiary }}>밀어서 삭제</Text>
            </View>

            {activeItems.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onDelete={handleDeleteItem}
              />
            ))}

            {/* 수동 추가 */}
            <View style={{ marginTop: 8 }}>
              <AddItemInline onAdd={handleAddManual} />
            </View>

            {/* 장보기 완료 */}
            <TouchableOpacity
              onPress={handleCompleteList}
              style={{
                backgroundColor: purchasedCount === activeItems.length ? colors.primary : colors.bgSecondary,
                borderRadius: 12,
                padding: 14,
                alignItems: 'center',
                marginTop: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: purchasedCount === activeItems.length ? colors.textInverse : colors.textSecondary,
                }}
              >
                장보기 완료
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 활성 리스트 없고 추천도 없음 → 수동 추가만 */}
        {!hasActiveList && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="cart-outline" size={15} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                장보기 목록
              </Text>
            </View>
            <AddItemInline onAdd={handleAddManual} />
          </View>
        )}

        {/* 빈 상태 */}
        {!hasRecommendations && !hasActiveList && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="cart-outline" size={56} color={colors.textTertiary} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
              장보기 추천이 없어요
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textTertiary,
                marginTop: 6,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              식재료를 추가하고 소비하면{'\n'}사용 패턴을 분석해서 맞춤 추천해드려요
            </Text>
          </View>
        )}

        {/* 지난 장보기 링크 */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/shopping-history' as any)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            paddingVertical: 12,
          }}
        >
          <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
          <Text style={{ fontSize: 13, color: colors.textTertiary }}>지난 장보기 보기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
