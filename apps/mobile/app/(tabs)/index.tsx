import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFoodItems } from '../../hooks/useFoodItems';
import { useRefrigerators } from '../../hooks/useRefrigerators';
import { FridgeCard } from '../../components/refrigerator/FridgeCard';
import { CATEGORY_LABELS } from '@freshbox/types';
import type { FoodItem } from '@freshbox/types';
import { getFoodEmoji } from '../../constants/foodEmoji';
import { getDaysUntilExpiry } from '../../utils/date';

// ─── 온보딩 화면 ─────────────────────────────────────────────────
function OnboardingView() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Ionicons name="snow-outline" size={64} color="#3b82f6" style={{ marginBottom: 16 }} />
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
        첫 냉장고를 등록해보세요
      </Text>
      <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
        냉장고를 등록하면{'\n'}식재료를 정확한 위치에 관리할 수 있어요
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/modals/refrigerator-setup')}
        style={{
          backgroundColor: '#3b82f6',
          borderRadius: 14,
          paddingHorizontal: 32,
          paddingVertical: 14,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>냉장고 등록하기</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── 통계 요약 카드 ──────────────────────────────────────────────
function StatsSummary({ items }: { items: FoodItem[] }) {
  const totalCount = items.length;
  const expiredCount = items.filter((i) => {
    if (!i.expiresAt) return false;
    return getDaysUntilExpiry(i.expiresAt)! < 0;
  }).length;
  const expiringCount = items.filter((i) => {
    if (!i.expiresAt) return false;
    const d = getDaysUntilExpiry(i.expiresAt)!;
    return d >= 0 && d <= 3;
  }).length;
  const safeCount = totalCount - expiredCount - expiringCount;

  return (
    <View
      style={{
        flexDirection: 'row',
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 8,
      }}
    >
      <StatItem
        icon="cube-outline"
        iconColor="#3b82f6"
        bgColor="#eff6ff"
        label="전체"
        count={totalCount}
        countColor="#1d4ed8"
      />
      <StatItem
        icon="checkmark-circle-outline"
        iconColor="#22c55e"
        bgColor="#f0fdf4"
        label="여유"
        count={safeCount}
        countColor="#15803d"
      />
      <StatItem
        icon="alert-circle-outline"
        iconColor="#f97316"
        bgColor="#fff7ed"
        label="임박"
        count={expiringCount}
        countColor="#c2410c"
        onPress={expiringCount > 0 ? () => router.push('/(tabs)/alerts') : undefined}
      />
      <StatItem
        icon="close-circle-outline"
        iconColor="#ef4444"
        bgColor="#fef2f2"
        label="만료"
        count={expiredCount}
        countColor="#b91c1c"
        onPress={expiredCount > 0 ? () => router.push('/(tabs)/alerts') : undefined}
      />
    </View>
  );
}

function StatItem({
  icon,
  iconColor,
  bgColor,
  label,
  count,
  countColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  label: string;
  count: number;
  countColor: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: countColor }}>{count}</Text>
      <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '500' }}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

// ─── 미분류 아이템 칩 ────────────────────────────────────────────
function expiryChipColor(expiresAt?: string | null) {
  if (!expiresAt) return { border: '#e5e7eb', bg: '#fff', text: '#374151', badge: '', badgeText: '' };
  const days = getDaysUntilExpiry(expiresAt)!;
  if (days < 0)  return { border: '#d1d5db', bg: '#f3f4f6', text: '#9ca3af', badge: '#9ca3af', badgeText: '#fff' };
  if (days === 0) return { border: '#fca5a5', bg: '#fef2f2', text: '#b91c1c', badge: '#ef4444', badgeText: '#fff' };
  if (days <= 3)  return { border: '#fdba74', bg: '#fff7ed', text: '#c2410c', badge: '#f97316', badgeText: '#fff' };
  if (days <= 7)  return { border: '#fde68a', bg: '#fefce8', text: '#92400e', badge: '#eab308', badgeText: '#fff' };
  return { border: '#86efac', bg: '#f0fdf4', text: '#166534', badge: '#22c55e', badgeText: '#fff' };
}

function UnclassifiedChip({ item }: { item: FoodItem }) {
  const days = item.expiresAt ? getDaysUntilExpiry(item.expiresAt) : null;
  const c = expiryChipColor(item.expiresAt);
  const label = days === null ? '' : days < 0 ? '만료' : days === 0 ? 'D-day' : `D-${days}`;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/edit?id=${item.id}`)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.bg,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        margin: 3,
      }}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 13 }}>{getFoodEmoji(item.name, item.category)}</Text>
      <Text style={{ fontSize: 13, fontWeight: '500', color: c.text }}>{item.name}</Text>
      {label ? (
        <View
          style={{
            marginLeft: 6,
            backgroundColor: c.badge,
            borderRadius: 8,
            paddingHorizontal: 5,
            paddingVertical: 1,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: c.badgeText }}>{label}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── 최근 추가 아이템 ────────────────────────────────────────────
function RecentItem({ item }: { item: FoodItem }) {
  const days = item.expiresAt ? getDaysUntilExpiry(item.expiresAt) : null;
  const dLabel = days === null ? '' : days < 0 ? '만료' : days === 0 ? 'D-day' : `D-${days}`;
  const dColor = days === null ? '#9ca3af' : days < 0 ? '#9ca3af' : days === 0 ? '#ef4444' : days <= 3 ? '#f97316' : days <= 7 ? '#eab308' : '#22c55e';

  // 추가 일시 표시
  const createdDate = new Date(item.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  let timeAgo = '';
  if (diffMins < 1) timeAgo = '방금 전';
  else if (diffMins < 60) timeAgo = `${diffMins}분 전`;
  else if (diffHours < 24) timeAgo = `${diffHours}시간 전`;
  else timeAgo = `${diffDays}일 전`;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/edit?id=${item.id}`)}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#f3f4f6',
      }}
    >
      <Text style={{ fontSize: 22, marginRight: 10 }}>
        {getFoodEmoji(item.name, item.category)}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>
            {CATEGORY_LABELS[item.category]}
          </Text>
          <Text style={{ fontSize: 11, color: '#d1d5db' }}>
            {timeAgo}
          </Text>
        </View>
      </View>
      {dLabel ? (
        <View
          style={{
            backgroundColor: dColor + '18',
            borderRadius: 8,
            paddingHorizontal: 7,
            paddingVertical: 3,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: dColor }}>{dLabel}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── 홈 화면 ─────────────────────────────────────────────────────
export default function HomeScreen() {
  const { data: items = [], isLoading: itemsLoading, refetch, isRefetching } = useFoodItems({ isConsumed: false });
  const { data: refrigerators = [], isLoading: fridgesLoading } = useRefrigerators();

  const isLoading = itemsLoading || fridgesLoading;

  const unclassifiedItems = items.filter((i) => !i.refrigeratorId);

  // 최근 추가 아이템 (최신순, 최대 5개)
  const recentItems = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3b82f6" />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── 상단 헤더 ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827' }}>내 냉장고</Text>
          <TouchableOpacity
            onPress={() => router.push('/modals/refrigerator-setup')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#e5e7eb',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* ── 냉장고 없을 때 온보딩 ── */}
        {refrigerators.length === 0 ? (
          <OnboardingView />
        ) : (
          <View style={{ gap: 16 }}>
            {/* ── 통계 요약 ── */}
            <StatsSummary items={items} />

            {/* ── 냉장고 카드 가로 스크롤 ── */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>냉장고</Text>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>{refrigerators.length}대</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}
              >
                {refrigerators.map((fridge) => (
                  <FridgeCard
                    key={fridge.id}
                    refrigerator={fridge}
                    items={items}
                    onPress={() => router.push(`/modals/fridge-detail?id=${fridge.id}`)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={{ paddingHorizontal: 16, gap: 16 }}>
              {/* ── 최근 추가 ── */}
              {recentItems.length > 0 && (
                <View
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Ionicons name="time-outline" size={18} color="#6b7280" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>최근 추가</Text>
                  </View>
                  <View style={{ gap: 6 }}>
                    {recentItems.map((item) => (
                      <RecentItem key={item.id} item={item} />
                    ))}
                  </View>
                </View>
              )}

              {/* ── 미분류 식재료 ── */}
              {unclassifiedItems.length > 0 && (
                <View
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="cube-outline" size={18} color="#6b7280" />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>미분류</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>{unclassifiedItems.length}개</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {unclassifiedItems.map((item) => (
                      <UnclassifiedChip key={item.id} item={item} />
                    ))}
                  </View>
                </View>
              )}

              {/* ── 아이템 없을 때 ── */}
              {items.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="snow-outline" size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#9ca3af' }}>냉장고가 비어있어요</Text>
                  <Text style={{ fontSize: 13, color: '#d1d5db', marginTop: 4 }}>
                    + 버튼으로 식재료를 추가해보세요
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
