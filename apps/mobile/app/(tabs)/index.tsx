import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFoodItems } from '../../hooks/useFoodItems';
import { useRefrigerators } from '../../hooks/useRefrigerators';
import { FridgeCard } from '../../components/refrigerator/FridgeCard';
import { CATEGORY_LABELS } from '@freshbox/types';
import type { FoodItem, Category, Refrigerator } from '@freshbox/types';
import { getFoodEmoji } from '../../constants/foodEmoji';
import { getDaysUntilExpiry } from '../../utils/date';
import { useThemeStore } from '../../store/theme.store';

// ─── 온보딩 화면 ─────────────────────────────────────────────────
function OnboardingView() {
  const { colors } = useThemeStore();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Ionicons name="snow-outline" size={64} color={colors.info} style={{ marginBottom: 16 }} />
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
        첫 냉장고를 등록해보세요
      </Text>
      <Text style={{ fontSize: 14, color: colors.textTertiary, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
        냉장고를 등록하면{'\n'}식재료를 정확한 위치에 관리할 수 있어요
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/modals/refrigerator-setup')}
        style={{
          backgroundColor: colors.info,
          borderRadius: 14,
          paddingHorizontal: 32,
          paddingVertical: 14,
        }}
      >
        <Text style={{ color: colors.textInverse, fontSize: 16, fontWeight: '700' }}>냉장고 등록하기</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── 통계 요약 카드 ──────────────────────────────────────────────
function StatsSummary({ items }: { items: FoodItem[] }) {
  const { colors } = useThemeStore();
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
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
      }}
    >
      <StatItem
        icon="cube-outline"
        iconColor={colors.info}
        bgColor={colors.infoLight}
        label="전체"
        count={totalCount}
        countColor={colors.info}
      />
      <StatItem
        icon="checkmark-circle-outline"
        iconColor={colors.success}
        bgColor={colors.successLight}
        label="여유"
        count={safeCount}
        countColor={colors.success}
      />
      <StatItem
        icon="alert-circle-outline"
        iconColor={colors.warning}
        bgColor={colors.warningLight}
        label="임박"
        count={expiringCount}
        countColor={colors.warning}
        onPress={expiringCount > 0 ? () => router.push('/(tabs)/alerts') : undefined}
      />
      <StatItem
        icon="close-circle-outline"
        iconColor={colors.danger}
        bgColor={colors.dangerLight}
        label="만료"
        count={expiredCount}
        countColor={colors.danger}
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
  const { colors } = useThemeStore();
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
      <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: '500' }}>{label}</Text>
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
function useExpiryChipColor(expiresAt?: string | null) {
  const { colors } = useThemeStore();
  if (!expiresAt) return { border: colors.border, bg: colors.bgCard, text: colors.text, badge: '', badgeText: '' };
  const days = getDaysUntilExpiry(expiresAt)!;
  if (days < 0)  return { border: colors.border, bg: colors.bgSecondary, text: colors.textTertiary, badge: colors.textTertiary, badgeText: colors.textInverse };
  if (days === 0) return { border: colors.danger, bg: colors.dangerLight, text: colors.danger, badge: colors.danger, badgeText: colors.textInverse };
  if (days <= 3)  return { border: colors.warning, bg: colors.warningLight, text: colors.warning, badge: colors.warning, badgeText: colors.textInverse };
  if (days <= 7)  return { border: colors.caution, bg: colors.cautionLight, text: colors.caution, badge: colors.caution, badgeText: colors.textInverse };
  return { border: colors.success, bg: colors.successLight, text: colors.success, badge: colors.success, badgeText: colors.textInverse };
}

function UnclassifiedChip({ item }: { item: FoodItem }) {
  const days = item.expiresAt ? getDaysUntilExpiry(item.expiresAt) : null;
  const c = useExpiryChipColor(item.expiresAt);
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
  const { colors } = useThemeStore();
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
        backgroundColor: colors.bgCard,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <Text style={{ fontSize: 22, marginRight: 10 }}>
        {getFoodEmoji(item.name, item.category)}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Text style={{ fontSize: 11, color: colors.textTertiary }}>
            {CATEGORY_LABELS[item.category]}
          </Text>
          <Text style={{ fontSize: 11, color: colors.border }}>
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

// ─── 만료 상태 타입 ─────────────────────────────────────────────
type ExpiryStatus = 'safe' | 'expiring' | 'expired';

const EXPIRY_STATUS_LABELS: Record<ExpiryStatus, string> = {
  safe: '여유',
  expiring: '임박',
  expired: '만료',
};

function getExpiryStatus(item: FoodItem): ExpiryStatus {
  if (!item.expiresAt) return 'safe';
  const d = getDaysUntilExpiry(item.expiresAt)!;
  if (d < 0) return 'expired';
  if (d <= 3) return 'expiring';
  return 'safe';
}

// ─── 카테고리 아이콘 ────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  VEGETABLES: 'leaf-outline',
  FRUITS: 'nutrition-outline',
  MEAT: 'flame-outline',
  SEAFOOD: 'fish-outline',
  DAIRY: 'water-outline',
  BEVERAGE: 'cafe-outline',
  CONDIMENT: 'flask-outline',
  FROZEN: 'snow-outline',
  OTHER: 'ellipsis-horizontal-outline',
};

// ─── 검색바 ─────────────────────────────────────────────────────
function SearchBar({
  value,
  onChangeText,
  onFocus,
  onClear,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onClear: () => void;
}) {
  const { colors } = useThemeStore();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCard,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        height: 42,
      }}
    >
      <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder="식재료 검색..."
        placeholderTextColor={colors.textTertiary}
        style={{
          flex: 1,
          marginLeft: 8,
          fontSize: 15,
          color: colors.text,
          paddingVertical: 0,
        }}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── 필터 칩 ────────────────────────────────────────────────────
function FilterChip({
  label,
  icon,
  active,
  onPress,
  activeColor,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  activeColor?: string;
}) {
  const { colors } = useThemeStore();
  const bg = active ? (activeColor ?? colors.primary) : colors.bgCard;
  const textColor = active ? colors.textInverse : colors.textSecondary;
  const borderColor = active ? (activeColor ?? colors.primary) : colors.border;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor,
        marginRight: 8,
        marginBottom: 6,
      }}
    >
      {icon && <Ionicons name={icon} size={14} color={textColor} style={{ marginRight: 4 }} />}
      <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── 필터 섹션 ──────────────────────────────────────────────────
function FilterSection({
  selectedCategory,
  onSelectCategory,
  selectedExpiry,
  onSelectExpiry,
  selectedFridgeId,
  onSelectFridge,
  refrigerators,
}: {
  selectedCategory: Category | null;
  onSelectCategory: (c: Category | null) => void;
  selectedExpiry: ExpiryStatus | null;
  onSelectExpiry: (s: ExpiryStatus | null) => void;
  selectedFridgeId: string | null;
  onSelectFridge: (id: string | null) => void;
  refrigerators: Refrigerator[];
}) {
  const { colors } = useThemeStore();
  const categories = Object.entries(CATEGORY_LABELS) as [Category, string][];
  const expiryStatuses: { key: ExpiryStatus; color: string }[] = [
    { key: 'safe', color: colors.success },
    { key: 'expiring', color: colors.warning },
    { key: 'expired', color: colors.danger },
  ];

  return (
    <View style={{ paddingTop: 8, gap: 8 }}>
      {/* 만료 상태 필터 */}
      <View>
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary, marginLeft: 16, marginBottom: 4 }}>
          상태
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {expiryStatuses.map(({ key, color }) => (
            <FilterChip
              key={key}
              label={EXPIRY_STATUS_LABELS[key]}
              active={selectedExpiry === key}
              onPress={() => onSelectExpiry(selectedExpiry === key ? null : key)}
              activeColor={color}
            />
          ))}
        </ScrollView>
      </View>

      {/* 카테고리 필터 */}
      <View>
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary, marginLeft: 16, marginBottom: 4 }}>
          카테고리
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {categories.map(([key, label]) => (
            <FilterChip
              key={key}
              label={label}
              icon={CATEGORY_ICONS[key]}
              active={selectedCategory === key}
              onPress={() => onSelectCategory(selectedCategory === key ? null : key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* 냉장고 필터 */}
      {refrigerators.length > 0 && (
        <View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary, marginLeft: 16, marginBottom: 4 }}>
            냉장고
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <FilterChip
              label="미분류"
              icon="cube-outline"
              active={selectedFridgeId === 'none'}
              onPress={() => onSelectFridge(selectedFridgeId === 'none' ? null : 'none')}
            />
            {refrigerators.map((f) => (
              <FilterChip
                key={f.id}
                label={f.name}
                icon="snow-outline"
                active={selectedFridgeId === f.id}
                onPress={() => onSelectFridge(selectedFridgeId === f.id ? null : f.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── 검색 결과 아이템 ───────────────────────────────────────────
function SearchResultItem({ item, refrigerators }: { item: FoodItem; refrigerators: Refrigerator[] }) {
  const { colors } = useThemeStore();
  const days = item.expiresAt ? getDaysUntilExpiry(item.expiresAt) : null;
  const dLabel = days === null ? '' : days < 0 ? '만료' : days === 0 ? 'D-day' : `D-${days}`;
  const dColor =
    days === null
      ? colors.textTertiary
      : days < 0
        ? colors.textTertiary
        : days === 0
          ? colors.danger
          : days <= 3
            ? colors.warning
            : days <= 7
              ? colors.caution
              : colors.success;

  const fridge = item.refrigeratorId
    ? refrigerators.find((r) => r.id === item.refrigeratorId)
    : null;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/edit?id=${item.id}`)}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCard,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <Text style={{ fontSize: 26, marginRight: 12 }}>
        {getFoodEmoji(item.name, item.category)}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>
            {CATEGORY_LABELS[item.category]}
          </Text>
          {fridge && (
            <>
              <Text style={{ fontSize: 10, color: colors.border }}>|</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name="snow-outline" size={11} color={colors.textTertiary} />
                <Text style={{ fontSize: 12, color: colors.textTertiary }}>{fridge.name}</Text>
              </View>
            </>
          )}
          {item.quantity > 0 && (
            <>
              <Text style={{ fontSize: 10, color: colors.border }}>|</Text>
              <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                {item.quantity}{item.unit}
              </Text>
            </>
          )}
        </View>
      </View>
      {dLabel ? (
        <View
          style={{
            backgroundColor: dColor + '18',
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: dColor }}>{dLabel}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── 홈 화면 ─────────────────────────────────────────────────────
export default function HomeScreen() {
  const { colors } = useThemeStore();
  const { data: items = [], isLoading: itemsLoading, refetch, isRefetching } = useFoodItems({ isConsumed: false });
  const { data: refrigerators = [], isLoading: fridgesLoading } = useRefrigerators();

  // 검색/필터 상태
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedExpiry, setSelectedExpiry] = useState<ExpiryStatus | null>(null);
  const [selectedFridgeId, setSelectedFridgeId] = useState<string | null>(null);

  const isSearchActive = searchText.length > 0 || selectedCategory !== null || selectedExpiry !== null || selectedFridgeId !== null;
  const activeFilterCount = (selectedCategory ? 1 : 0) + (selectedExpiry ? 1 : 0) + (selectedFridgeId ? 1 : 0);

  // 알림 뱃지: 만료 + 임박(D-3) 수
  const alertCount = useMemo(() => {
    return items.filter((i) => {
      if (!i.expiresAt) return false;
      const d = getDaysUntilExpiry(i.expiresAt)!;
      return d <= 3;
    }).length;
  }, [items]);

  // 필터링된 결과
  const filteredItems = useMemo(() => {
    if (!isSearchActive) return [];
    let result = items;

    if (searchText.length > 0) {
      const query = searchText.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(query));
    }

    if (selectedCategory) {
      result = result.filter((i) => i.category === selectedCategory);
    }

    if (selectedExpiry) {
      result = result.filter((i) => getExpiryStatus(i) === selectedExpiry);
    }

    if (selectedFridgeId === 'none') {
      result = result.filter((i) => !i.refrigeratorId);
    } else if (selectedFridgeId) {
      result = result.filter((i) => i.refrigeratorId === selectedFridgeId);
    }

    return result;
  }, [items, searchText, selectedCategory, selectedExpiry, selectedFridgeId, isSearchActive]);

  const clearAllFilters = useCallback(() => {
    setSearchText('');
    setSelectedCategory(null);
    setSelectedExpiry(null);
    setSelectedFridgeId(null);
    setShowFilters(false);
    Keyboard.dismiss();
  }, []);

  const isLoading = itemsLoading || fridgesLoading;

  const unclassifiedItems = items.filter((i) => !i.refrigeratorId);

  // 최근 추가 아이템 (최신순, 최대 5개)
  const recentItems = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.info} />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
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
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>내 냉장고</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* 알림 벨 */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/alerts')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
              {alertCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: colors.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>
                    {alertCount > 99 ? '99+' : alertCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {/* 필터 토글 */}
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: showFilters || activeFilterCount > 0 ? colors.primary : colors.bgCard,
                borderWidth: 1,
                borderColor: showFilters || activeFilterCount > 0 ? colors.primary : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={showFilters || activeFilterCount > 0 ? colors.textInverse : colors.textSecondary}
              />
              {activeFilterCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: colors.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {/* 냉장고 추가 */}
            <TouchableOpacity
              onPress={() => router.push('/modals/refrigerator-setup')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 검색바 (항상 표시) ── */}
        <View style={{ marginBottom: 8 }}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => {}}
            onClear={() => setSearchText('')}
          />
        </View>

        {/* ── 필터 칩 (토글) ── */}
        {showFilters && (
          <FilterSection
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedExpiry={selectedExpiry}
            onSelectExpiry={setSelectedExpiry}
            selectedFridgeId={selectedFridgeId}
            onSelectFridge={setSelectedFridgeId}
            refrigerators={refrigerators}
          />
        )}

        {/* ── 검색/필터 활성 시: 결과 목록 ── */}
        {isSearchActive ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
            {/* 결과 헤더 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>
                검색 결과 {filteredItems.length}개
              </Text>
              <TouchableOpacity onPress={clearAllFilters}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.info }}>초기화</Text>
              </TouchableOpacity>
            </View>

            {/* 결과 리스트 */}
            {filteredItems.length > 0 ? (
              <View style={{ gap: 8 }}>
                {filteredItems.map((item) => (
                  <SearchResultItem key={item.id} item={item} refrigerators={refrigerators} />
                ))}
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <Ionicons name="search-outline" size={48} color={colors.border} style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textTertiary }}>
                  검색 결과가 없어요
                </Text>
                <Text style={{ fontSize: 13, color: colors.border, marginTop: 4 }}>
                  다른 키워드나 필터를 시도해보세요
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
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
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>냉장고</Text>
                    <Text style={{ fontSize: 12, color: colors.textTertiary }}>{refrigerators.length}대</Text>
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
                        backgroundColor: colors.bgCard,
                        borderRadius: 16,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>최근 추가</Text>
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
                        backgroundColor: colors.bgCard,
                        borderRadius: 16,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
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
                          <Ionicons name="cube-outline" size={18} color={colors.textSecondary} />
                          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>미분류</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: colors.textTertiary }}>{unclassifiedItems.length}개</Text>
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
                      <Ionicons name="snow-outline" size={48} color={colors.border} style={{ marginBottom: 12 }} />
                      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textTertiary }}>냉장고가 비어있어요</Text>
                      <Text style={{ fontSize: 13, color: colors.border, marginTop: 4 }}>
                        + 버튼으로 식재료를 추가해보세요
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
