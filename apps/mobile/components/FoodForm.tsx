import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Category, CATEGORY_LABELS, CreateFoodItemDto, FoodShelfLife, STORAGE_METHOD_LABELS } from '@freshbox/types';
import { useRefrigerators } from '../hooks/useRefrigerators';
import { getZonesForType, getShelvesForZone } from './refrigerator/fridgeConfigs';
import { shelfLifeApi } from '../services/api';

// ── 카테고리 아이콘 매핑 ──
const CATEGORY_ICONS: Record<Category, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  VEGETABLES: { name: 'leaf-outline', color: '#22c55e' },
  FRUITS: { name: 'nutrition-outline', color: '#f97316' },
  MEAT: { name: 'flame-outline', color: '#ef4444' },
  SEAFOOD: { name: 'fish-outline', color: '#3b82f6' },
  DAIRY: { name: 'water-outline', color: '#a855f7' },
  BEVERAGE: { name: 'cafe-outline', color: '#06b6d4' },
  CONDIMENT: { name: 'flask-outline', color: '#eab308' },
  FROZEN: { name: 'snow-outline', color: '#6366f1' },
  OTHER: { name: 'ellipsis-horizontal-outline', color: '#6b7280' },
};

const CATEGORIES: Category[] = [
  'VEGETABLES', 'FRUITS', 'MEAT',
  'SEAFOOD', 'DAIRY', 'BEVERAGE',
  'CONDIMENT', 'FROZEN', 'OTHER',
];

// ── 단위 프리셋 ──
const UNIT_PRESETS = ['개', 'g', 'kg', 'ml', 'L', '봉', '팩', '병', '근', '마리'];

// ── 날짜 유틸 ──
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function getDaysFromToday(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

// ── 빠른 선택 프리셋 ──
const QUICK_PRESETS = [
  { label: '오늘', days: 0 },
  { label: '+3일', days: 3 },
  { label: '+1주', days: 7 },
  { label: '+2주', days: 14 },
  { label: '+1개월', days: 30 },
  { label: '+3개월', days: 90 },
];

// ── 섹션 카드 ──
function SectionCard({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 14,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={16} color="#6b7280" />
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ── DateField 컴포넌트 ──
interface DateFieldProps {
  label: string;
  value: string;
  onChange: (dateStr: string) => void;
  showPresets?: boolean;
}

function DateField({ label, value, onChange, showPresets = false }: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const parsed = parseDate(value);
  const daysFromToday = parsed ? getDaysFromToday(parsed) : null;

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) {
      onChange(formatDate(selectedDate));
    }
  };

  const handlePreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    onChange(formatDate(d));
  };

  const handleClear = () => {
    onChange('');
    setShowPicker(false);
  };

  const getBadgeStyle = () => {
    if (daysFromToday === null) return null;
    if (daysFromToday < 0) return { bg: '#f3f4f6', text: '#9ca3af', label: '만료' };
    if (daysFromToday === 0) return { bg: '#fef2f2', text: '#ef4444', label: 'D-day' };
    if (daysFromToday <= 3) return { bg: '#fff7ed', text: '#f97316', label: `D-${daysFromToday}` };
    if (daysFromToday <= 7) return { bg: '#fefce8', text: '#eab308', label: `D-${daysFromToday}` };
    return { bg: '#f0fdf4', text: '#22c55e', label: `D-${daysFromToday}` };
  };

  const badge = getBadgeStyle();

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{label}</Text>

      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={{
          backgroundColor: '#f9fafb',
          borderWidth: 1,
          borderColor: value ? '#3b82f6' : '#e5e7eb',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name={value ? 'calendar' : 'calendar-outline'} size={18} color={value ? '#3b82f6' : '#9ca3af'} />
          <Text style={{ fontSize: 14, color: value ? '#111827' : '#9ca3af', fontWeight: value ? '600' : '400' }}>
            {value || '날짜 선택'}
          </Text>
        </View>
        {badge && (
          <View style={{ backgroundColor: badge.bg, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: badge.text }}>{badge.label}</Text>
          </View>
        )}
      </TouchableOpacity>

      {showPresets && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {QUICK_PRESETS.map((preset) => {
              const presetDate = new Date();
              presetDate.setDate(presetDate.getDate() + preset.days);
              const presetStr = formatDate(presetDate);
              const isSelected = value === presetStr;

              return (
                <TouchableOpacity
                  key={preset.days}
                  onPress={() => handlePreset(preset.days)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
                    backgroundColor: isSelected ? '#eff6ff' : '#f9fafb',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? '#1d4ed8' : '#6b7280' }}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {value ? (
              <TouchableOpacity
                onPress={handleClear}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: '#fca5a5',
                  backgroundColor: '#fef2f2',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#ef4444' }}>초기화</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      )}

      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6',
              }}>
                <TouchableOpacity onPress={handleClear}>
                  <Text style={{ fontSize: 15, color: '#ef4444', fontWeight: '600' }}>초기화</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{label}</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={{ fontSize: 15, color: '#3b82f6', fontWeight: '700' }}>완료</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={parsed ?? new Date()}
                mode="date"
                display="spinner"
                onChange={handleChange}
                locale="ko-KR"
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={parsed ?? new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const DEPTH_OPTIONS = [
  { key: 'front', label: '앞' },
  { key: 'middle', label: '중간' },
  { key: 'back', label: '뒤' },
];

const COL_OPTIONS = [
  { key: 'left', label: '좌' },
  { key: 'center', label: '중' },
  { key: 'right', label: '우' },
];

interface FoodFormProps {
  initialValues?: Partial<CreateFoodItemDto>;
  onSubmit: (data: CreateFoodItemDto) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function FoodForm({
  initialValues,
  onSubmit,
  isLoading,
  submitLabel = '저장',
}: FoodFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [category, setCategory] = useState<Category>(initialValues?.category ?? 'OTHER');
  const [quantity, setQuantity] = useState(String(initialValues?.quantity ?? 1));
  const [unit, setUnit] = useState(initialValues?.unit ?? '개');
  const [showCustomUnit, setShowCustomUnit] = useState(!UNIT_PRESETS.includes(initialValues?.unit ?? '개'));
  const [expiresAt, setExpiresAt] = useState(initialValues?.expiresAt ?? '');
  const [purchasedAt, setPurchasedAt] = useState(initialValues?.purchasedAt ?? '');
  const [memo, setMemo] = useState(initialValues?.memo ?? '');

  // 위치 정보
  const [refrigeratorId, setRefrigeratorId] = useState(initialValues?.refrigeratorId ?? '');
  const [zone, setZone] = useState(initialValues?.zone ?? '');
  const [shelf, setShelf] = useState(initialValues?.shelf ?? 1);
  const [depth, setDepth] = useState(initialValues?.depth ?? '');
  const [colPosition, setColPosition] = useState(initialValues?.colPosition ?? '');

  // ── 유통기한 자동 제안 ──
  const [suggestions, setSuggestions] = useState<FoodShelfLife[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [appliedSuggestion, setAppliedSuggestion] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const userSetExpiry = useRef(!!initialValues?.expiresAt);

  const searchShelfLife = useCallback(async (query: string) => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    const id = ++requestIdRef.current;
    setIsSearching(true);
    try {
      const res = await shelfLifeApi.search(query.trim());
      if (id === requestIdRef.current) setSuggestions(res.data ?? []);
    } catch {
      if (id === requestIdRef.current) setSuggestions([]);
    } finally {
      if (id === requestIdRef.current) setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!name.trim() || appliedSuggestion === name.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => searchShelfLife(name), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [name, searchShelfLife, appliedSuggestion]);

  const handleSelectSuggestion = (item: FoodShelfLife) => {
    setName(item.name);
    setCategory(item.category);
    setAppliedSuggestion(item.name);
    setSuggestions([]);

    // 사용자가 직접 유통기한을 설정하지 않았을 때만 자동 입력
    if (!userSetExpiry.current) {
      const d = new Date();
      d.setDate(d.getDate() + item.defaultDays);
      setExpiresAt(formatDate(d));
    }
  };

  const handleExpiresAtChange = (dateStr: string) => {
    setExpiresAt(dateStr);
    if (dateStr) userSetExpiry.current = true;
    else userSetExpiry.current = false;
  };

  const { data: refrigerators = [] } = useRefrigerators();

  const selectedFridge = refrigerators.find((r) => r.id === refrigeratorId);
  const zones = selectedFridge ? getZonesForType(selectedFridge.type) : [];
  const maxShelves = selectedFridge && zone ? getShelvesForZone(selectedFridge.type, zone) : 0;

  const handleFridgeSelect = (id: string) => {
    setRefrigeratorId(id);
    setZone('');
    setShelf(1);
  };

  const handleZoneSelect = (zoneKey: string) => {
    setZone(zoneKey);
    setShelf(1);
  };

  const handleUnitSelect = (u: string) => {
    setUnit(u);
    setShowCustomUnit(false);
  };

  const handleQuantityStep = (delta: number) => {
    const current = parseFloat(quantity) || 0;
    const next = Math.max(0, current + delta);
    setQuantity(next % 1 === 0 ? String(next) : next.toFixed(1));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      category,
      quantity: parseFloat(quantity) || 1,
      unit: unit.trim() || '개',
      expiresAt: expiresAt || undefined,
      purchasedAt: purchasedAt || undefined,
      memo: memo.trim() || undefined,
      refrigeratorId: refrigeratorId || undefined,
      zone: zone || undefined,
      shelf: zone ? shelf : undefined,
      depth: depth || undefined,
      colPosition: colPosition || undefined,
      location: zone || undefined,
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <View style={{ padding: 16, gap: 14 }}>

        {/* ── 기본 정보 ── */}
        <SectionCard title="기본 정보" icon="create-outline">
          {/* 이름 + 유통기한 자동 제안 */}
          <View>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
              이름 <Text style={{ color: '#ef4444' }}>*</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: '#f9fafb',
                  borderWidth: 1,
                  borderColor: suggestions.length > 0 ? '#3b82f6' : '#e5e7eb',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  paddingRight: isSearching ? 40 : 16,
                  color: '#111827',
                  fontSize: 15,
                }}
                placeholder="예: 당근, 닭가슴살"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (appliedSuggestion) setAppliedSuggestion(null);
                }}
              />
              {isSearching && (
                <ActivityIndicator
                  size="small"
                  color="#3b82f6"
                  style={{ position: 'absolute', right: 14 }}
                />
              )}
            </View>

            {/* 자동 제안 목록 (인라인) */}
            {suggestions.length > 0 && (
              <View
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e0e7ff',
                  marginTop: 8,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    backgroundColor: '#eef2ff',
                    borderBottomWidth: 1,
                    borderBottomColor: '#e0e7ff',
                  }}
                >
                  <Ionicons name="sparkles" size={12} color="#6366f1" />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#4f46e5' }}>
                    유통기한 자동 제안
                  </Text>
                </View>
                {suggestions.slice(0, 5).map((item, idx) => {
                  const storageLabel = STORAGE_METHOD_LABELS[item.storageMethod];
                  return (
                    <TouchableOpacity
                      key={item.id ?? `${item.name}-${idx}`}
                      onPress={() => handleSelectSuggestion(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderBottomWidth: idx < Math.min(suggestions.length, 5) - 1 ? 1 : 0,
                        borderBottomColor: '#f3f4f6',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                          {CATEGORY_LABELS[item.category]}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                          backgroundColor: '#f0fdf4',
                          borderRadius: 8,
                          paddingHorizontal: 7,
                          paddingVertical: 3,
                        }}
                      >
                        <Ionicons name="time-outline" size={11} color="#22c55e" />
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#16a34a' }}>
                          {item.defaultDays}일 ({storageLabel})
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 자동 제안 적용 안내 */}
            {appliedSuggestion && !userSetExpiry.current && expiresAt && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 6,
                  paddingHorizontal: 4,
                }}
              >
                <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                <Text style={{ fontSize: 11, color: '#22c55e', fontWeight: '500' }}>
                  유통기한이 자동 설정되었습니다 ({expiresAt})
                </Text>
              </View>
            )}
          </View>

          {/* 카테고리 — 3열 그리드 */}
          <View>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>카테고리</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const iconInfo = CATEGORY_ICONS[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={{
                      width: '31%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: isSelected ? iconInfo.color : '#e5e7eb',
                      backgroundColor: isSelected ? iconInfo.color + '14' : '#f9fafb',
                    }}
                  >
                    <Ionicons
                      name={iconInfo.name}
                      size={16}
                      color={isSelected ? iconInfo.color : '#9ca3af'}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isSelected ? iconInfo.color : '#6b7280',
                      }}
                      numberOfLines={1}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 수량 & 단위 */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* 수량 + 스테퍼 */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>수량</Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#f9fafb',
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <TouchableOpacity
                  onPress={() => handleQuantityStep(-1)}
                  style={{
                    width: 40,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f3f4f6',
                  }}
                >
                  <Ionicons name="remove" size={18} color="#6b7280" />
                </TouchableOpacity>
                <TextInput
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    color: '#111827',
                    fontSize: 15,
                    fontWeight: '600',
                    paddingVertical: 10,
                  }}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  onPress={() => handleQuantityStep(1)}
                  style={{
                    width: 40,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f3f4f6',
                  }}
                >
                  <Ionicons name="add" size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 단위 */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>단위</Text>
              {showCustomUnit ? (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: '#f9fafb',
                      borderWidth: 1,
                      borderColor: '#3b82f6',
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: '#111827',
                      fontSize: 14,
                    }}
                    placeholder="단위 입력"
                    value={unit}
                    onChangeText={setUnit}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => {
                      if (UNIT_PRESETS.includes(unit)) setShowCustomUnit(false);
                    }}
                    style={{
                      width: 40,
                      borderRadius: 12,
                      backgroundColor: '#f3f4f6',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="checkmark" size={18} color="#22c55e" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowCustomUnit(true)}
                  style={{
                    backgroundColor: '#f9fafb',
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{unit}</Text>
                  <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 단위 프리셋 칩 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {UNIT_PRESETS.map((u) => {
                const isSelected = unit === u && !showCustomUnit;
                return (
                  <TouchableOpacity
                    key={u}
                    onPress={() => handleUnitSelect(u)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
                      backgroundColor: isSelected ? '#eff6ff' : '#f9fafb',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? '#1d4ed8' : '#6b7280' }}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => setShowCustomUnit(true)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: showCustomUnit ? '#3b82f6' : '#e5e7eb',
                  backgroundColor: showCustomUnit ? '#eff6ff' : '#f9fafb',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: showCustomUnit ? '#1d4ed8' : '#6b7280' }}>
                  직접 입력
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SectionCard>

        {/* ── 보관 위치 ── */}
        <SectionCard title="보관 위치" icon="location-outline">
          {/* 냉장고 선택 */}
          {refrigerators.length > 0 && (
            <View>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>냉장고</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleFridgeSelect('')}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: !refrigeratorId ? '#3b82f6' : '#e5e7eb',
                      backgroundColor: !refrigeratorId ? '#eff6ff' : '#f9fafb',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: !refrigeratorId ? '#1d4ed8' : '#9ca3af' }}>
                      미지정
                    </Text>
                  </TouchableOpacity>
                  {refrigerators.map((fridge) => (
                    <TouchableOpacity
                      key={fridge.id}
                      onPress={() => handleFridgeSelect(fridge.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 20,
                        borderWidth: 1.5,
                        borderColor: refrigeratorId === fridge.id ? '#3b82f6' : '#e5e7eb',
                        backgroundColor: refrigeratorId === fridge.id ? '#eff6ff' : '#f9fafb',
                      }}
                    >
                      {fridge.color && (
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: fridge.color }} />
                      )}
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: refrigeratorId === fridge.id ? '#1d4ed8' : '#374151',
                        }}
                      >
                        {fridge.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* 구역 선택 */}
          {selectedFridge && zones.length > 0 && (
            <View>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>구역</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {zones.map((z) => (
                  <TouchableOpacity
                    key={z.key}
                    onPress={() => handleZoneSelect(z.key)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: zone === z.key ? '#3b82f6' : '#e5e7eb',
                      backgroundColor: zone === z.key ? '#eff6ff' : '#f9fafb',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: zone === z.key ? '#1d4ed8' : '#374151',
                      }}
                    >
                      {z.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 층 선택 */}
          {zone && maxShelves > 0 && (
            <View>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>층</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {Array.from({ length: maxShelves }, (_, i) => i + 1).map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setShelf(n)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 1.5,
                      borderColor: shelf === n ? '#3b82f6' : '#e5e7eb',
                      backgroundColor: shelf === n ? '#eff6ff' : '#f9fafb',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: shelf === n ? '#1d4ed8' : '#374151',
                      }}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 깊이 선택 */}
          {zone && (
            <View>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>깊이</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {DEPTH_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d.key}
                    onPress={() => setDepth(depth === d.key ? '' : d.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: depth === d.key ? '#3b82f6' : '#e5e7eb',
                      backgroundColor: depth === d.key ? '#eff6ff' : '#f9fafb',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: depth === d.key ? '#1d4ed8' : '#6b7280',
                      }}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 좌/우 위치 */}
          {zone && (
            <View>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>좌/우 위치 (선택)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {COL_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => setColPosition(colPosition === c.key ? '' : c.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: colPosition === c.key ? '#3b82f6' : '#e5e7eb',
                      backgroundColor: colPosition === c.key ? '#eff6ff' : '#f9fafb',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: colPosition === c.key ? '#1d4ed8' : '#6b7280',
                      }}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </SectionCard>

        {/* ── 날짜 ── */}
        <SectionCard title="날짜" icon="calendar-outline">
          <DateField label="구매일" value={purchasedAt} onChange={setPurchasedAt} />
          <DateField label="유통기한" value={expiresAt} onChange={handleExpiresAtChange} showPresets />
        </SectionCard>

        {/* ── 메모 ── */}
        <SectionCard title="메모" icon="chatbubble-ellipses-outline">
          <TextInput
            style={{
              backgroundColor: '#f9fafb',
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              color: '#111827',
              fontSize: 14,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            placeholder="메모를 입력하세요"
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={3}
          />
        </SectionCard>

        {/* ── 저장 버튼 ── */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading || !name.trim()}
          style={{
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            backgroundColor: isLoading || !name.trim() ? '#d1d5db' : '#3b82f6',
            marginTop: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            {isLoading ? '저장 중...' : submitLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
