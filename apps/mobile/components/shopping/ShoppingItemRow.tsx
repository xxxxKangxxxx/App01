import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ShoppingItem } from '@freshbox/types';
import { getFoodEmoji } from '../../constants/foodEmoji';
import { useThemeStore } from '../../store/theme.store';

interface Props {
  item: ShoppingItem;
  onToggle: (item: ShoppingItem) => void;
  onDelete: (item: ShoppingItem) => void;
}

export default function ShoppingItemRow({ item, onToggle, onDelete }: Props) {
  const { colors } = useThemeStore();
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 15 && Math.abs(gs.dy) < 15,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) translateX.setValue(gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -80) {
          Animated.timing(translateX, {
            toValue: -80,
            duration: 150,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={{ marginBottom: 6, borderRadius: 12, overflow: 'hidden' }}>
      {/* 삭제 배경 */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 80,
          backgroundColor: '#ef4444',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
        }}
      >
        <TouchableOpacity onPress={() => onDelete(item)} style={{ alignItems: 'center' }}>
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff', marginTop: 2 }}>삭제</Text>
        </TouchableOpacity>
      </View>

      {/* 카드 본체 */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggle(item)}
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: 12,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          {/* 체크박스 */}
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              borderWidth: 2,
              borderColor: item.isPurchased ? colors.primary : colors.border,
              backgroundColor: item.isPurchased ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            {item.isPurchased && (
              <Ionicons name="checkmark" size={16} color={colors.textInverse} />
            )}
          </View>

          {/* 이모지 */}
          <Text style={{ fontSize: 22, marginRight: 10 }}>
            {getFoodEmoji(item.name, item.category ?? 'OTHER')}
          </Text>

          {/* 정보 */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: item.isPurchased ? colors.textTertiary : colors.text,
                textDecorationLine: item.isPurchased ? 'line-through' : 'none',
              }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Text style={{ fontSize: 11, color: colors.textTertiary }}>
                {item.quantity} {item.unit}
              </Text>
              {item.isRecommended && item.reason && (
                <Text style={{ fontSize: 10, color: colors.info }}>
                  {item.reason}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
