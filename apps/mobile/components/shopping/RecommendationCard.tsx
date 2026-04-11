import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RecommendedItem } from '@freshbox/types';
import { CATEGORY_LABELS } from '@freshbox/types';
import { getFoodEmoji } from '../../constants/foodEmoji';
import { useThemeStore } from '../../store/theme.store';

interface Props {
  item: RecommendedItem;
  onAdd: (item: RecommendedItem) => void;
}

const REASON_STYLES: Record<string, { bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }> = {
  staple_missing: { bg: '#eff6ff', text: '#3b82f6', icon: 'star-outline' },
  expiring_repurchase: { bg: '#fff7ed', text: '#f97316', icon: 'time-outline' },
  recent_consumed: { bg: '#f0fdf4', text: '#22c55e', icon: 'refresh-outline' },
};

export default function RecommendationCard({ item, onAdd }: Props) {
  const { colors } = useThemeStore();
  const style = REASON_STYLES[item.reasonType] ?? REASON_STYLES.staple_missing;

  return (
    <View
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.borderLight,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      }}
    >
      <Text style={{ fontSize: 28, marginRight: 12 }}>
        {getFoodEmoji(item.name, item.category ?? 'OTHER')}
      </Text>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          {item.category && (
            <Text
              style={{
                fontSize: 10,
                color: colors.textTertiary,
                backgroundColor: colors.bg,
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 1,
              }}
            >
              {CATEGORY_LABELS[item.category]}
            </Text>
          )}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              backgroundColor: style.bg,
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Ionicons name={style.icon} size={10} color={style.text} />
            <Text style={{ fontSize: 10, fontWeight: '600', color: style.text }}>
              {item.reason}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => onAdd(item)}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
        }}
      >
        <Ionicons name="add" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}
