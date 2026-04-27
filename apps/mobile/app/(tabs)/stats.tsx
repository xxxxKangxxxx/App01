import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMonthlyStats } from '../../hooks/useMonthlyStats';
import { CATEGORY_LABELS } from '@freshbox/types';
import type { Category } from '@freshbox/types';
import { getFoodEmoji } from '../../constants/foodEmoji';
import { getCategoryIcon } from '../../constants/categoryUi';
import { useThemeStore } from '../../store/theme.store';

// ─── 월 선택기 ──────────────────────────────────────────────────
function MonthSelector({
  year,
  month,
  onPrev,
  onNext,
  canGoNext,
  onSelectYearMonth,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
  onSelectYearMonth: (y: number, m: number) => void;
}) {
  const { colors } = useThemeStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const openPicker = useCallback(() => {
    setPickerYear(year);
    setPickerOpen(true);
  }, [year]);

  const selectMonth = (m: number) => {
    setPickerOpen(false);
    onSelectYearMonth(pickerYear, m);
  };

  const isFuture = (y: number, m: number) => y > currentYear || (y === currentYear && m > currentMonth);

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          gap: 20,
        }}
      >
        <TouchableOpacity onPress={onPrev} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={openPicker} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
            {year}년 {month}월
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNext}
          disabled={!canGoNext}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-forward" size={24} color={canGoNext ? colors.text : colors.border} />
        </TouchableOpacity>
      </View>

      {/* 년도/월 선택 모달 */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPickerOpen(false)}
          style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 20,
              padding: 20,
              width: 320,
              maxHeight: 420,
            }}
          >
            {/* 년도 선택 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 16 }}>
              <TouchableOpacity onPress={() => setPickerYear(pickerYear - 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, minWidth: 80, textAlign: 'center' }}>
                {pickerYear}년
              </Text>
              <TouchableOpacity
                onPress={() => { if (pickerYear < currentYear) setPickerYear(pickerYear + 1); }}
                disabled={pickerYear >= currentYear}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-forward" size={22} color={pickerYear >= currentYear ? colors.border : colors.text} />
              </TouchableOpacity>
            </View>

            {/* 월 그리드 (4x3) */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const disabled = isFuture(pickerYear, m);
                const selected = pickerYear === year && m === month;
                return (
                  <TouchableOpacity
                    key={m}
                    disabled={disabled}
                    onPress={() => selectMonth(m)}
                    style={{
                      width: '22%',
                      aspectRatio: 1.4,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? colors.primary : 'transparent',
                      opacity: disabled ? 0.3 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: selected ? '800' : '500',
                        color: selected ? colors.textInverse : colors.text,
                      }}
                    >
                      {m}월
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── 요약 카드 ──────────────────────────────────────────────────
function SummaryCards({
  purchased,
  consumed,
  discarded,
  usageRate,
}: {
  purchased: number;
  consumed: number;
  discarded: number;
  usageRate: number;
}) {
  const { colors } = useThemeStore();

  const items: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    bg: string;
    label: string;
    value: string;
  }[] = [
    { icon: 'cart-outline', iconColor: colors.info, bg: colors.infoLight, label: '구매', value: `${purchased}개` },
    { icon: 'checkmark-circle-outline', iconColor: colors.success, bg: colors.successLight, label: '소비', value: `${consumed}개` },
    { icon: 'trash-outline', iconColor: colors.danger, bg: colors.dangerLight, label: '폐기', value: `${discarded}개` },
    { icon: 'trending-up-outline', iconColor: colors.primary, bg: colors.primaryLight, label: '활용률', value: `${usageRate}%` },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        marginHorizontal: 16,
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
      }}
    >
      {items.map((item) => (
        <View key={item.label} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: item.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={item.icon} size={20} color={item.iconColor} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: item.iconColor }}>{item.value}</Text>
          <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: '500' }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── 활용률 바 ──────────────────────────────────────────────────
function UsageRateBar({ consumed, discarded }: { consumed: number; discarded: number }) {
  const { colors } = useThemeStore();
  const total = consumed + discarded;
  if (total === 0) return null;

  const consumedPct = (consumed / total) * 100;
  const discardedPct = (discarded / total) * 100;

  return (
    <View style={{ marginHorizontal: 16, marginTop: 4 }}>
      <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' }}>
        {consumedPct > 0 && (
          <View style={{ flex: consumedPct, backgroundColor: colors.success, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }} />
        )}
        {discardedPct > 0 && (
          <View style={{ flex: discardedPct, backgroundColor: colors.danger, borderTopRightRadius: 6, borderBottomRightRadius: 6 }} />
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
          <Text style={{ fontSize: 11, color: colors.textTertiary }}>소비 {Math.round(consumedPct)}%</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger }} />
          <Text style={{ fontSize: 11, color: colors.textTertiary }}>폐기 {Math.round(discardedPct)}%</Text>
        </View>
      </View>
    </View>
  );
}

// ─── 카테고리별 차트 ────────────────────────────────────────────
function CategoryChart({
  categoryStats,
}: {
  categoryStats: Record<string, { purchased: number; consumed: number; discarded: number }>;
}) {
  const { colors } = useThemeStore();
  const entries = Object.entries(categoryStats)
    .sort((a, b) => b[1].purchased - a[1].purchased);

  if (entries.length === 0) return null;

  const maxCount = Math.max(...entries.map(([, v]) => v.purchased));

  return (
    <View
      style={{
        marginHorizontal: 16,
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <Ionicons name="pie-chart-outline" size={18} color={colors.textSecondary} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>카테고리별</Text>
      </View>
      <View style={{ gap: 10 }}>
        {entries.map(([cat, stat]) => {
          const label = CATEGORY_LABELS[cat as Category] ?? cat;
          const icon = getCategoryIcon(cat as Category);
          const barWidth = maxCount > 0 ? (stat.purchased / maxCount) * 100 : 0;
          return (
            <View key={cat} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={icon} size={14} color={colors.textSecondary} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12, color: colors.info, fontWeight: '600' }}>{stat.purchased}</Text>
                  <Text style={{ fontSize: 12, color: colors.success, fontWeight: '600' }}>{stat.consumed}</Text>
                  {stat.discarded > 0 && (
                    <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '600' }}>{stat.discarded}</Text>
                  )}
                </View>
              </View>
              <View style={{ height: 8, backgroundColor: colors.bgSecondary, borderRadius: 4, overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    backgroundColor: colors.info,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
      {/* 범례 */}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.info }} />
          <Text style={{ fontSize: 11, color: colors.textTertiary }}>구매</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
          <Text style={{ fontSize: 11, color: colors.textTertiary }}>소비</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger }} />
          <Text style={{ fontSize: 11, color: colors.textTertiary }}>폐기</Text>
        </View>
      </View>
    </View>
  );
}

// ─── TOP 아이템 리스트 ──────────────────────────────────────────
function TopItemsList({
  title,
  icon,
  items,
  emptyText,
  accentColor,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: { name: string; count: number; category: string }[];
  emptyText: string;
  accentColor: string;
}) {
  const { colors } = useThemeStore();

  return (
    <View
      style={{
        marginHorizontal: 16,
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{title}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={{ fontSize: 13, color: colors.textTertiary, textAlign: 'center', paddingVertical: 12 }}>
          {emptyText}
        </Text>
      ) : (
        <View style={{ gap: 8 }}>
          {items.map((item, idx) => (
            <View
              key={item.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
                borderBottomWidth: idx < items.length - 1 ? 1 : 0,
                borderBottomColor: colors.divider,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: accentColor, width: 24 }}>
                {idx + 1}
              </Text>
              <Text style={{ fontSize: 20, marginRight: 10 }}>
                {getFoodEmoji(item.name, item.category as Category)}
              </Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text }}>
                {item.name}
              </Text>
              <View
                style={{
                  backgroundColor: accentColor + '18',
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: accentColor }}>
                  {item.count}회
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── 통계 화면 ──────────────────────────────────────────────────
export default function StatsScreen() {
  const { colors } = useThemeStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading, refetch, isRefetching } = useMonthlyStats(year, month);

  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const goPrev = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const goNext = () => {
    if (!canGoNext) return;
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.info} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* 월 선택기 */}
        <MonthSelector
          year={year}
          month={month}
          onPrev={goPrev}
          onNext={goNext}
          canGoNext={canGoNext}
          onSelectYearMonth={(y, m) => { setYear(y); setMonth(m); }}
        />

        {isLoading ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.info} />
          </View>
        ) : !data ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.border} />
            <Text style={{ fontSize: 14, color: colors.textTertiary, marginTop: 8 }}>데이터를 불러올 수 없어요</Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* 요약 */}
            <SummaryCards
              purchased={data.summary.purchased}
              consumed={data.summary.consumed}
              discarded={data.summary.discarded}
              usageRate={data.summary.usageRate}
            />

            {/* 활용률 바 */}
            <UsageRateBar consumed={data.summary.consumed} discarded={data.summary.discarded} />

            {/* 데이터 없을 때 */}
            {data.summary.purchased === 0 && data.summary.consumed === 0 && data.summary.discarded === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="analytics-outline" size={48} color={colors.border} style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textTertiary }}>
                  이 달의 데이터가 없어요
                </Text>
                <Text style={{ fontSize: 13, color: colors.border, marginTop: 4 }}>
                  식재료를 추가하면 통계가 쌓여요
                </Text>
              </View>
            ) : (
              <>
                {/* 카테고리별 */}
                <CategoryChart categoryStats={data.categoryStats} />

                {/* 많이 산 재료 */}
                <TopItemsList
                  title="많이 산 재료"
                  icon="trending-up-outline"
                  items={data.topPurchased}
                  emptyText="구매 기록이 없어요"
                  accentColor={colors.info}
                />

                {/* 자주 버린 재료 */}
                {data.topDiscarded.length > 0 && (
                  <TopItemsList
                    title="자주 버린 재료"
                    icon="trash-outline"
                    items={data.topDiscarded}
                    emptyText=""
                    accentColor={colors.danger}
                  />
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
