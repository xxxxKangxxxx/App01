import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/theme.store';

interface Props {
  suggestedDate: string | null;
  suggestedDateReason: string | null;
  stapleCount: number;
  onCreateList: () => void;
  isCreating?: boolean;
}

export default function SuggestedDateCard({
  suggestedDate,
  suggestedDateReason,
  stapleCount,
  onCreateList,
  isCreating,
}: Props) {
  const { colors } = useThemeStore();

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[d.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
  };

  return (
    <View
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.infoLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.info} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
            다음 장보기 추천일
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 2 }}>
            {suggestedDate ? formatDate(suggestedDate) : '데이터 수집 중'}
          </Text>
        </View>
      </View>

      {suggestedDateReason && (
        <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 12 }}>
          {suggestedDateReason}
        </Text>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            backgroundColor: colors.primaryLight,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>
            단골 식재료 {stapleCount}개 감지
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={onCreateList}
          disabled={isCreating}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            opacity: isCreating ? 0.6 : 1,
          }}
        >
          <Ionicons name="list-outline" size={16} color={colors.textInverse} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textInverse }}>
            목록 만들기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
