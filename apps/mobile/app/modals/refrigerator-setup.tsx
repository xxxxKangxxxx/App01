import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import type { RefrigeratorType, CustomZone } from '@freshbox/types';
import { REFRIGERATOR_TYPE_LABELS } from '@freshbox/types';
import {
  useCreateRefrigerator,
  useUpdateRefrigerator,
  useDeleteRefrigerator,
} from '../../hooks/useRefrigerators';
import { getZonesForType } from '../../components/refrigerator/fridgeConfigs';

const TYPES: RefrigeratorType[] = ['STANDARD', 'SIDE_BY_SIDE', 'FRENCH_DOOR', 'FREEZER', 'KIMCHI'];

const PRESET_COLORS = [
  '#e5e7eb', // 회색 (기본)
  '#dbeafe', // 파랑
  '#d1fae5', // 초록
  '#fef3c7', // 노랑
  '#fce7f3', // 핑크
  '#ede9fe', // 보라
  '#f0f0f0', // 화이트
];

export default function RefrigeratorSetupModal() {
  const params = useLocalSearchParams<{ id?: string; name?: string; type?: string; color?: string }>();
  const isEdit = !!params.id;

  const [name, setName] = useState(params.name ?? '');
  const [type, setType] = useState<RefrigeratorType>((params.type as RefrigeratorType) ?? 'STANDARD');
  const [color, setColor] = useState(params.color ?? '#e5e7eb');
  const [customZones, setCustomZones] = useState<CustomZone[]>(() =>
    getZonesForType((params.type as RefrigeratorType) ?? 'STANDARD')
  );
  const [editingZoneIdx, setEditingZoneIdx] = useState<number | null>(null);

  const createMutation = useCreateRefrigerator();
  const updateMutation = useUpdateRefrigerator();
  const deleteMutation = useDeleteRefrigerator();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleTypeChange = (newType: RefrigeratorType) => {
    setType(newType);
    setCustomZones(getZonesForType(newType));
    setEditingZoneIdx(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '냉장고 이름을 입력해주세요.');
      return;
    }

    try {
      const payload = { name: name.trim(), type, color, customZones };
      if (isEdit && params.id) {
        await updateMutation.mutateAsync({ id: params.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      router.back();
    } catch {
      Alert.alert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDelete = () => {
    if (!params.id) return;
    Alert.alert(
      '냉장고 삭제',
      `"${name}" 냉장고를 삭제할까요?\n식재료는 삭제되지 않고 미분류로 이동됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(params.id!);
              router.back();
            } catch {
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ],
    );
  };

  const updateZoneLabel = (idx: number, label: string) => {
    setCustomZones((prev) => prev.map((z, i) => (i === idx ? { ...z, label } : z)));
  };

  const updateZoneShelves = (idx: number, delta: number) => {
    setCustomZones((prev) =>
      prev.map((z, i) =>
        i === idx ? { ...z, shelves: Math.max(1, Math.min(8, z.shelves + delta)) } : z
      )
    );
  };

  const addZone = () => {
    const newKey = `zone_${Date.now()}`;
    setCustomZones((prev) => [...prev, { key: newKey, label: '새 구역', shelves: 2 }]);
  };

  const deleteZone = (idx: number) => {
    setCustomZones((prev) => prev.filter((_, i) => i !== idx));
    if (editingZoneIdx === idx) setEditingZoneIdx(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        {/* 헤더 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
            {isEdit ? '냉장고 수정' : '냉장고 등록'}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* 이름 */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
            냉장고 이름 <Text style={{ color: '#ef4444' }}>*</Text>
          </Text>
          <TextInput
            style={{
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: '#111827',
            }}
            placeholder="예: 거실 냉장고, 김치냉장고"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* 타입 선택 */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            냉장고 타입
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => handleTypeChange(t)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: type === t ? '#3b82f6' : '#e5e7eb',
                  backgroundColor: type === t ? '#eff6ff' : '#fff',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: type === t ? '#1d4ed8' : '#6b7280',
                  }}
                >
                  {REFRIGERATOR_TYPE_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 색상 선택 */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            냉장고 색상
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 1.5,
                  borderColor: color === c ? '#3b82f6' : '#d1d5db',
                }}
              />
            ))}
          </View>
        </View>

        {/* 구역 설정 */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            구역 설정
          </Text>

          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              overflow: 'hidden',
            }}
          >
            {customZones.map((zone, idx) => (
              <View key={zone.key}>
                {idx > 0 && <View style={{ height: 1, backgroundColor: '#f3f4f6' }} />}

                <View style={{ padding: 12 }}>
                  {/* 구역 헤더 행 */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {/* 구역 이름 */}
                    {editingZoneIdx === idx ? (
                      <TextInput
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: '600',
                          color: '#111827',
                          borderBottomWidth: 1,
                          borderBottomColor: '#3b82f6',
                          paddingVertical: 2,
                        }}
                        value={zone.label}
                        onChangeText={(text) => updateZoneLabel(idx, text)}
                        onBlur={() => setEditingZoneIdx(null)}
                        autoFocus
                      />
                    ) : (
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' }}>
                        {zone.label}
                      </Text>
                    )}

                    {/* 층수 조절 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>층수</Text>
                      <TouchableOpacity
                        onPress={() => updateZoneShelves(idx, -1)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: '#f3f4f6',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 16, color: '#374151', lineHeight: 18 }}>−</Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', minWidth: 16, textAlign: 'center' }}>
                        {zone.shelves}
                      </Text>
                      <TouchableOpacity
                        onPress={() => updateZoneShelves(idx, 1)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: '#f3f4f6',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 16, color: '#374151', lineHeight: 18 }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 편집/삭제 버튼 */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={() => setEditingZoneIdx(editingZoneIdx === idx ? null : idx)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: '#eff6ff',
                        borderWidth: 1,
                        borderColor: '#bfdbfe',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#1d4ed8', fontWeight: '500' }}>
                        이름 변경
                      </Text>
                    </TouchableOpacity>

                    {customZones.length > 1 && (
                      <TouchableOpacity
                        onPress={() => deleteZone(idx)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 6,
                          backgroundColor: '#fef2f2',
                          borderWidth: 1,
                          borderColor: '#fecaca',
                        }}
                      >
                        <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '500' }}>
                          삭제
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {/* 구역 추가 버튼 */}
            <TouchableOpacity
              onPress={addZone}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: '#f3f4f6',
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 18, color: '#3b82f6' }}>+</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3b82f6' }}>구역 추가</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 미리보기 */}
        <View
          style={{
            borderWidth: 4,
            borderColor: color,
            borderRadius: 16,
            backgroundColor: '#f9fafb',
            padding: 16,
            alignItems: 'center',
          }}
        >
          <Ionicons name="snow-outline" size={28} color="#3b82f6" style={{ marginBottom: 4 }} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
            {name || '냉장고 이름'}
          </Text>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            {REFRIGERATOR_TYPE_LABELS[type]} · 구역 {customZones.length}개
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {customZones.map((z) => (
              <View
                key={z.key}
                style={{
                  backgroundColor: '#eff6ff',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ fontSize: 11, color: '#1d4ed8' }}>
                  {z.label} ({z.shelves}층)
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 저장 버튼 */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading || !name.trim()}
          style={{
            backgroundColor: isLoading || !name.trim() ? '#d1d5db' : '#3b82f6',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            {isLoading ? '저장 중...' : (isEdit ? '수정 완료' : '냉장고 등록')}
          </Text>
        </TouchableOpacity>

        {/* 삭제 버튼 (수정 모드) */}
        {isEdit && (
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
            style={{ alignItems: 'center', paddingVertical: 8 }}
          >
            <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '600' }}>
              냉장고 삭제
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
