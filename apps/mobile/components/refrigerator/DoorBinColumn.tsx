import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { FoodItem } from '@freshbox/types';
import type { ZoneConfig } from './fridgeConfigs';
import { getFoodEmoji } from '../../constants/foodEmoji';
import { useThemeStore } from '../../store/theme.store';

const MAX_EMOJI = 4;

function DoorShelfDivider() {
  const { colors } = useThemeStore();

  return (
    <View>
      <View
        style={{
          height: 2,
          backgroundColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 2,
        }}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
        style={{ height: 2 }}
      />
    </View>
  );
}

interface DoorBinColumnProps {
  zones: ZoneConfig[];
  items: FoodItem[];
  mirrorShelves?: number;
  onShelfPress?: (zone: ZoneConfig, shelf: number, items: FoodItem[]) => void;
}

export function DoorBinColumn({ zones, items, mirrorShelves, onShelfPress }: DoorBinColumnProps) {
  const { colors } = useThemeStore();

  if (zones.length === 0 && mirrorShelves) {
    return (
      <View style={{ flex: 1 }}>
        {Array.from({ length: mirrorShelves }, (_, idx) => (
          <React.Fragment key={idx}>
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 9, color: colors.textTertiary }}>{idx + 1}</Text>
            </View>
            {idx < mirrorShelves - 1 && <DoorShelfDivider />}
          </React.Fragment>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {zones.map((zone) => {
        const zoneItems = items.filter((i) => i.zone === zone.key);

        return (
          <View key={zone.key} style={{ flex: 1 }}>
            {Array.from({ length: zone.shelves }, (_, idx) => {
              const shelfNum = zone.shelves - idx;
              const shelfItems = zoneItems.filter((i) => i.shelf === shelfNum);
              const unshelfed = zoneItems.filter((i) => !i.shelf);
              const displayItems = shelfNum === 1 ? [...shelfItems, ...unshelfed] : shelfItems;
              const visibleEmoji = displayItems.slice(0, MAX_EMOJI);
              const extra = displayItems.length - MAX_EMOJI;

              return (
                <React.Fragment key={shelfNum}>
                  <TouchableOpacity
                    onPress={
                      onShelfPress
                        ? () => onShelfPress(zone, shelfNum, displayItems)
                        : undefined
                    }
                    activeOpacity={onShelfPress ? 0.7 : 1}
                    style={{
                      flex: 1,
                      paddingHorizontal: 3,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ fontSize: 8, color: colors.textTertiary, fontWeight: '600', marginBottom: 1 }}>
                      {shelfNum}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 1 }}>
                      {visibleEmoji.length === 0 ? (
                        <Text style={{ fontSize: 10, color: colors.border }}>-</Text>
                      ) : (
                        visibleEmoji.map((item) => (
                          <Text key={item.id} style={{ fontSize: 14 }}>
                            {getFoodEmoji(item.name, item.category)}
                          </Text>
                        ))
                      )}
                      {extra > 0 && (
                        <Text style={{ fontSize: 8, color: colors.textTertiary, alignSelf: 'flex-end' }}>
                          +{extra}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {idx < zone.shelves - 1 && <DoorShelfDivider />}
                </React.Fragment>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
