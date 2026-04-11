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
import { useThemeStore } from '../../store/theme.store';

function formatExpiryDate(expiresAt: string): string {
  const d = new Date(expiresAt);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── 스와이프 카드 ───────────────────────────────────────────────
function SwipeableAlertCard({ item }: { item: FoodItem }) {
  const { colors } = useThemeStore();
  const deleteMutation = useDeleteFoodItem();
  const updateMutation = useUpdateFoodItem();
  const translateX = useRef(new Animated.Value(0)).current;

  const days = item.expiresAt ? getDaysUntilExpiry(item.expiresAt) : null;
  const dLabel = days === null ? '' : days < 0 ? '만료' : days === 0 ? 'D-day' : `D-${days}`;

  const dStyle = days === null || days < 0
    ? { bg: colors.bgSecondary, text: colors.textTertiary }
    : days <= 1
      ? { bg: colors.dangerLight, text: colors.danger }
      : days <= 3
        ? { bg: colors.warningLight, text: colors.warning }
        : { bg: colors.cautionLight, text: colors.caution };

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
          // 왼쪽 스와이프 → 폐기
          Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: true }).start(() => {
            Alert.alert('폐기 확인', `${item.name}을(를) 폐기할까요?`, [
              {
                text: '취소',
                onPress: () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start(),
              },
              {
                text: '폐기',
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
    Alert.alert('폐기 확인', `${item.name}을(를) 폐기할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '폐기', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
    ]);
  };

  return (
    <View style={{ marginBottom: 8, borderRadius: 14, overflow: 'hidden' }}>
      {/* 스와이프 배경 */}
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row' }}>
        {/* 왼쪽: 소비 */}
        <View style={{ flex: 1, backgroundColor: colors.success, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 20 }}>
          <Ionicons name="checkmark-circle" size={24} color={colors.textInverse} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textInverse, marginTop: 2 }}>소비</Text>
        </View>
        {/* 오른쪽: 폐기 */}
        <View style={{ flex: 1, backgroundColor: colors.danger, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 20 }}>
          <Ionicons name="trash" size={24} color={colors.textInverse} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textInverse, marginTop: 2 }}>폐기</Text>
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
            backgroundColor: colors.bgCard,
            borderRadius: 14,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.borderLight,
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
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Text style={{ fontSize: 11, color: colors.textTertiary, backgroundColor: colors.bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                {CATEGORY_LABELS[item.category]}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textTertiary }}>
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
                backgroundColor: colors.successLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark" size={18} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: colors.dangerLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
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
  const { colors } = useThemeStore();
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
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 }}>{title}</Text>
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
  const { colors } = useThemeStore();
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
        {/* 요약 */}
        {totalAlerts > 0 && (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 8,
            }}
          >
            {expiredItems.length > 0 && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textTertiary }}>{expiredItems.length}</Text>
                <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2 }}>만료</Text>
              </View>
            )}
            {dDayItems.length > 0 && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.danger }}>{dDayItems.length}</Text>
                <Text style={{ fontSize: 10, color: colors.danger, marginTop: 2 }}>오늘</Text>
              </View>
            )}
            {d1Items.length > 0 && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.warning }}>{d1Items.length}</Text>
                <Text style={{ fontSize: 10, color: colors.warning, marginTop: 2 }}>내일</Text>
              </View>
            )}
            {d3Items.length > 0 && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.caution }}>{d3Items.length}</Text>
                <Text style={{ fontSize: 10, color: colors.caution, marginTop: 2 }}>3일 내</Text>
              </View>
            )}
          </View>
        )}

        {/* 스와이프 힌트 */}
        {totalAlerts > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="arrow-forward" size={12} color={colors.success} />
              <Text style={{ fontSize: 10, color: colors.textTertiary }}>밀어서 소비</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="arrow-back" size={12} color={colors.danger} />
              <Text style={{ fontSize: 10, color: colors.textTertiary }}>밀어서 폐기</Text>
            </View>
          </View>
        )}

        {/* 만료됨 */}
        {expiredItems.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <SectionHeader icon="close-circle" iconColor={colors.textTertiary} bgColor={colors.bgSecondary} title="만료됨" count={expiredItems.length} />
            {expiredItems.map((item) => (
              <SwipeableAlertCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* D-day */}
        {dDayItems.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <SectionHeader icon="alert-circle" iconColor={colors.danger} bgColor={colors.dangerLight} title="오늘 만료" count={dDayItems.length} />
            {dDayItems.map((item) => (
              <SwipeableAlertCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* D-1 */}
        {d1Items.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <SectionHeader icon="alert-circle-outline" iconColor={colors.warning} bgColor={colors.warningLight} title="내일 만료" count={d1Items.length} />
            {d1Items.map((item) => (
              <SwipeableAlertCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* D-2~3 */}
        {d3Items.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <SectionHeader icon="time-outline" iconColor={colors.caution} bgColor={colors.cautionLight} title="3일 내 만료" count={d3Items.length} />
            {d3Items.map((item) => (
              <SwipeableAlertCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* 비어있을 때 */}
        {totalAlerts === 0 && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <Ionicons name="checkmark-circle-outline" size={56} color={colors.success} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
              임박한 식재료가 없어요
            </Text>
            <Text style={{ fontSize: 13, color: colors.textTertiary, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
              냉장고가 신선하게 관리되고 있어요!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
