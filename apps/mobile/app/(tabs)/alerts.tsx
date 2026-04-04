import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFoodItems, useDeleteFoodItem, useUpdateFoodItem } from '../../hooks/useFoodItems';
import { CATEGORY_LABELS } from '@freshbox/types';
import type { FoodItem } from '@freshbox/types';
import { getFoodEmoji } from '../../constants/foodEmoji';
import { getDaysUntilExpiry } from '../../utils/date';

function formatExpiryDate(expiresAt: string): string {
  const d = new Date(expiresAt);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── 스와이프 카드 ───────────────────────────────────────────────
function SwipeableAlertCard({ item }: { item: FoodItem }) {
  const deleteMutation = useDeleteFoodItem();
  const updateMutation = useUpdateFoodItem();
  const translateX = useRef(new Animated.Value(0)).current;

  const days = item.expiresAt ? getDaysUntilExpiry(item.expiresAt) : null;
  const dLabel = days === null ? '' : days < 0 ? '만료' : days === 0 ? 'D-day' : `D-${days}`;

  const dStyle = days === null
    ? { bg: '#f3f4f6', text: '#9ca3af' }
    : days < 0
      ? { bg: '#f3f4f6', text: '#9ca3af' }
      : days === 0
        ? { bg: '#fef2f2', text: '#ef4444' }
        : days <= 1
          ? { bg: '#fef2f2', text: '#ef4444' }
          : days <= 3
            ? { bg: '#fff7ed', text: '#f97316' }
            : { bg: '#fefce8', text: '#eab308' };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 15,
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 80) {
          // 오른쪽 스와이프 → 소비
          Animated.timing(translateX, { toValue: 400, duration: 200, useNativeDriver: true }).start(() => {
            updateMutation.mutate({ id: item.id, data: { isConsumed: true } });
          });
        } else if (gestureState.dx < -80) {
          // 왼쪽 스와이프 → 삭제
          Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: true }).start(() => {
            Alert.alert('삭제 확인', `${item.name}을(를) 삭제할까요?`, [
              {
                text: '취소',
                onPress: () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start(),
              },
              {
                text: '삭제',
                style: 'destructive',
                onPress: () => deleteMutation.mutate(item.id),
              },
            ]);
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  const handleConsume = () => {
    updateMutation.mutate({ id: item.id, data: { isConsumed: true } });
  };

  const handleDelete = () => {
    Alert.alert('삭제 확인', `${item.name}을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
    ]);
  };

  return (
    <View style={{ marginBottom: 8, borderRadius: 14, overflow: 'hidden' }}>
      {/* 스와이프 배경 */}
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row' }}>
        {/* 왼쪽: 소비 */}
        <View style={{ flex: 1, backgroundColor: '#22c55e', alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 20 }}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff', marginTop: 2 }}>소비</Text>
        </View>
        {/* 오른쪽: 삭제 */}
        <View style={{ flex: 1, backgroundColor: '#ef4444', alignItems: 'flex-end', justifyContent: 'center', paddingRight: 20 }}>
          <Ionicons name="trash" size={24} color="#fff" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff', marginTop: 2 }}>삭제</Text>
        </View>
      </View>

      {/* 카드 본체 */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/edit?id=${item.id}`)}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#f3f4f6',
          }}
        >
          {/* D-day 뱃지 */}
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: dStyle.bg,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '800', color: dStyle.text }}>{dLabel}</Text>
            {item.expiresAt && (
              <Text style={{ fontSize: 9, color: dStyle.text, marginTop: 1 }}>
                {formatExpiryDate(item.expiresAt)}
              </Text>
            )}
          </View>

          {/* 식재료 정보 */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 18 }}>{getFoodEmoji(item.name, item.category)}</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Text style={{ fontSize: 11, color: '#9ca3af', backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                {CATEGORY_LABELS[item.category]}
              </Text>
              <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                {item.quantity} {item.unit}
              </Text>
            </View>
          </View>

          {/* 액션 버튼 */}
          <View style={{ flexDirection: 'row', gap: 8, marginLeft: 8 }}>
            <TouchableOpacity
              onPress={handleConsume}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: '#f0fdf4',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark" size={18} color="#22c55e" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: '#fef2f2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── 섹션 헤더 ───────────────────────────────────────────────────
function SectionHeader({
  icon,
  iconColor,
  bgColor,
  title,
  count,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  title: string;
  count: number;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={15} color={iconColor} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 }}>{title}</Text>
      <View
        style={{
          backgroundColor: bgColor,
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 2,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: iconColor }}>{count}</Text>
      </View>
    </View>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────────────
export default function AlertsScreen() {
  const { data: allItems = [], isLoading, refetch, isRefetching } = useFoodItems({ isConsumed: false });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const categorize = (item: FoodItem) => {
    if (!item.expiresAt) return null;
    const days = getDaysUntilExpiry(item.expiresAt)!;
    if (days < 0) return 'expired';
    if (days === 0) return 'dday';
    if (days === 1) return 'd1';
    if (days <= 3) return 'd3';
    return null;
  };

  const expiredItems = allItems.filter((i) => categorize(i) === 'expired');
  const dDayItems = allItems.filter((i) => categorize(i) === 'dday');
  const d1Items = allItems.filter((i) => categorize(i) === 'd1');
  const d3Items = allItems.filter((i) => categorize(i) === 'd3');

  const totalAlerts = expiredItems.length + dDayItems.length + d1Items.length + d3Items.length;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }} edges={['bottom']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3b82f6" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* 요약 */}
        {totalAlerts > 0 && (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              gap: 8,
            }}
          >
            {expiredItems.length > 0 && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#9ca3af' }}>{expiredItems.length}</Text>
                <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>만료</Text>
              </View>
            )}
            {dDayItems.length > 0 && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#ef4444' }}>{dDayItems.length}</Text>
                <Text style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>오늘</Text>
              </View>
            )}
            {d1Items.length > 0 && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#f97316' }}>{d1Items.length}</Text>
                <Text style={{ fontSize: 10, color: '#f97316', marginTop: 2 }}>내일</Text>
              </View>
            )}
            {d3Items.length > 0 && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#eab308' }}>{d3Items.length}</Text>
                <Text style={{ fontSize: 10, color: '#eab308', marginTop: 2 }}>3일 내</Text>
              </View>
            )}
          </View>
        )}

        {/* 스와이프 힌트 */}
        {totalAlerts > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="arrow-forward" size={12} color="#22c55e" />
              <Text style={{ fontSize: 10, color: '#9ca3af' }}>밀어서 소비</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="arrow-back" size={12} color="#ef4444" />
              <Text style={{ fontSize: 10, color: '#9ca3af' }}>밀어서 삭제</Text>
            </View>
          </View>
        )}

        {/* 만료됨 */}
        {expiredItems.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <SectionHeader icon="close-circle" iconColor="#9ca3af" bgColor="#f3f4f6" title="만료됨" count={expiredItems.length} />
            {expiredItems.map((item) => (
              <SwipeableAlertCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* D-day */}
        {dDayItems.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <SectionHeader icon="alert-circle" iconColor="#ef4444" bgColor="#fef2f2" title="오늘 만료" count={dDayItems.length} />
            {dDayItems.map((item) => (
              <SwipeableAlertCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* D-1 */}
        {d1Items.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <SectionHeader icon="alert-circle-outline" iconColor="#f97316" bgColor="#fff7ed" title="내일 만료" count={d1Items.length} />
            {d1Items.map((item) => (
              <SwipeableAlertCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* D-2~3 */}
        {d3Items.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <SectionHeader icon="time-outline" iconColor="#eab308" bgColor="#fefce8" title="3일 내 만료" count={d3Items.length} />
            {d3Items.map((item) => (
              <SwipeableAlertCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* 비어있을 때 */}
        {totalAlerts === 0 && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <Ionicons name="checkmark-circle-outline" size={56} color="#22c55e" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#374151' }}>
              임박한 식재료가 없어요
            </Text>
            <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
              냉장고가 신선하게 관리되고 있어요!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
