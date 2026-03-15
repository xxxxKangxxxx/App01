import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { FoodItem, Refrigerator } from '@freshbox/types';
import type { ZoneConfig } from './fridgeConfigs';
import { getZonesForType, splitZones } from './fridgeConfigs';
import { FlatShelf } from './FlatShelf';
import { DoorBinColumn } from './DoorBinColumn';
import { REFRIGERATOR_TYPE_LABELS } from '@freshbox/types';

interface RefrigeratorViewProps {
  refrigerator: Refrigerator;
  items: FoodItem[];
  onShelfPress?: (zone: ZoneConfig, shelf: number, items: FoodItem[]) => void;
}

function shadeColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ─── Glass Shelf Divider ───────────────────────────────────────────
function GlassShelfDivider() {
  return (
    <View>
      <View
        style={{
          height: 2,
          backgroundColor: 'rgba(200,220,235,0.7)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
        }}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
        style={{ height: 3 }}
      />
    </View>
  );
}

// ─── Interior (center column) ──────────────────────────────────────
interface FridgeInteriorProps {
  zones: ZoneConfig[];
  items: FoodItem[];
  frameColor: string;
  onShelfPress?: (zone: ZoneConfig, shelf: number, items: FoodItem[]) => void;
}

function FridgeInterior({ zones, items, frameColor, onShelfPress }: FridgeInteriorProps) {
  const isFreezer = (key: string) => key.includes('냉동') || key.includes('서랍');

  return (
    <View style={{ backgroundColor: '#dce8f0' }}>
      {/* LED light bar at top */}
      <LinearGradient
        colors={['rgba(220,240,255,0.95)', 'rgba(200,225,245,0.4)', 'rgba(200,225,245,0)']}
        style={{ height: 18 }}
      />

      {zones.map((zone, zoneIdx) => {
        const zoneItems = items.filter((i) => i.zone === zone.key);
        const bgColor = isFreezer(zone.key) ? '#d4e2ee' : '#dce8f0';

        return (
          <View key={zone.key}>
            {zoneIdx > 0 && (
              <View style={{ height: 4, backgroundColor: shadeColor(frameColor, -30) }}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.15)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            )}
            <View
              style={{
                backgroundColor: bgColor,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#6b7280' }}>
                {zone.label}
              </Text>
            </View>
            <View style={{ backgroundColor: bgColor }}>
              {Array.from({ length: zone.shelves }, (_, idx) => {
                const shelfNum = zone.shelves - idx;
                const shelfItems = zoneItems.filter((i) => i.shelf === shelfNum);
                const unshelfed = zoneItems.filter((i) => !i.shelf);
                const displayItems =
                  shelfNum === 1 ? [...shelfItems, ...unshelfed] : shelfItems;
                return (
                  <React.Fragment key={shelfNum}>
                    <FlatShelf
                      zone={zone}
                      shelfNumber={shelfNum}
                      items={displayItems}
                      compact
                      onPress={
                        onShelfPress
                          ? () => onShelfPress(zone, shelfNum, displayItems)
                          : undefined
                      }
                    />
                    {idx < zone.shelves - 1 && <GlassShelfDivider />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Bottom depth shadow */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.06)']}
        style={{ height: 8 }}
      />
    </View>
  );
}

// ─── Door Panel (closed state overlay) ─────────────────────────────
interface DoorPanelProps {
  color: string;
  isLeft: boolean;
  name?: string;
  typeName?: string;
}

function DoorPanel({ color, isLeft, name, typeName }: DoorPanelProps) {
  const border = shadeColor(color, -18);
  const handle = shadeColor(color, -50);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color,
        borderWidth: 2,
        borderColor: border,
      }}
    >
      {/* Metallic gradient */}
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.05)']}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Handle */}
      <View
        style={{
          position: 'absolute',
          top: '28%',
          bottom: '28%',
          width: 5,
          backgroundColor: handle,
          borderRadius: 2.5,
          ...(isLeft ? { right: 12 } : { left: 12 }),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.25,
          shadowRadius: 2,
        }}
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {isLeft && name ? (
          <>
            <Ionicons name="snow-outline" size={28} color={shadeColor(color, -70)} style={{ marginBottom: 6 }} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: shadeColor(color, -70),
                textAlign: 'center',
                paddingHorizontal: 12,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text style={{ fontSize: 10, color: shadeColor(color, -45), marginTop: 2 }}>
              {typeName}
            </Text>
            <Text style={{ fontSize: 11, color: shadeColor(color, -30), marginTop: 14 }}>
              탭하여 열기
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

// ─── Interior Side Shadow ──────────────────────────────────────────
function InteriorSideShadow({ side }: { side: 'left' | 'right' }) {
  return (
    <LinearGradient
      colors={
        side === 'left'
          ? ['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.03)', 'rgba(0,0,0,0)']
          : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.03)', 'rgba(0,0,0,0.12)']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 12,
        ...(side === 'left' ? { left: 0 } : { right: 0 }),
      }}
      pointerEvents="none"
    />
  );
}

// ─── Wall Strip ────────────────────────────────────────────────────
function WallStrip({ frameColor, side }: { frameColor: string; side: 'left' | 'right' }) {
  const dark = shadeColor(frameColor, -55);
  const mid = shadeColor(frameColor, -35);

  return (
    <View style={{ width: 8, backgroundColor: dark }}>
      <LinearGradient
        colors={side === 'left' ? [mid, dark, dark] : [dark, dark, mid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: 'rgba(255,255,255,0.1)',
          ...(side === 'left' ? { right: 0 } : { left: 0 }),
        }}
      />
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export function RefrigeratorView({ refrigerator, items, onShelfPress }: RefrigeratorViewProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const containerWidth = screenWidth - 32;

  const frameColor = refrigerator.color ?? '#b0b8c1';
  const doorAnim = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);

  const effectiveZones: ZoneConfig[] =
    refrigerator.customZones && refrigerator.customZones.length > 0
      ? (refrigerator.customZones as ZoneConfig[])
      : getZonesForType(refrigerator.type);

  const { interior, leftDoor, rightDoor } = splitZones(effectiveZones);
  const hasDoorZones = leftDoor.length > 0 || rightDoor.length > 0;
  const isKimchi = refrigerator.type === 'KIMCHI';

  const fridgeItems = items.filter((i) => i.refrigeratorId === refrigerator.id);

  const mirrorShelves =
    rightDoor.length === 0 && leftDoor.length > 0
      ? leftDoor.reduce((sum, z) => sum + z.shelves, 0)
      : 0;

  const openDoor = () => {
    if (isOpen) return;
    setIsOpen(true);
    Animated.timing(doorAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeDoor = () => {
    Animated.timing(doorAnim, {
      toValue: 0,
      duration: 450,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const doorHalfW = containerWidth * 0.5;

  const leftTranslateX = doorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -doorHalfW],
  });
  const rightTranslateX = doorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, doorHalfW],
  });
  const doorOpacity = doorAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.6, 0],
  });

  const maxHeight = screenHeight - 180;
  const frameBorder = shadeColor(frameColor, -25);

  return (
    <View
      style={{
        borderWidth: 4,
        borderColor: frameBorder,
        borderRadius: 14,
        backgroundColor: shadeColor(frameColor, -15),
        overflow: 'hidden',
        maxHeight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: frameColor,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: shadeColor(frameColor, -20),
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>
          {refrigerator.name}
        </Text>
        {isOpen && (
          <TouchableOpacity onPress={closeDoor} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>닫기</Text>
              <Ionicons name="close" size={14} color="#6b7280" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      <View style={{ position: 'relative' }}>
        <View style={{ flexDirection: 'row' }}>
          {/* Left door column — perspective angled */}
          {hasDoorZones && !isKimchi && (
            <>
              <View
                style={{
                  width: '18%',
                  backgroundColor: '#e2eaf0',
                  transform: [{ perspective: 400 }, { rotateY: '18deg' }],
                  transformOrigin: '0% 50%',
                  overflow: 'hidden',
                } as any}
              >
                {/* Depth shadow on inner edge */}
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.12)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />
                <DoorBinColumn
                  zones={leftDoor}
                  items={fridgeItems}
                  onShelfPress={onShelfPress}
                />
              </View>
              <WallStrip frameColor={frameColor} side="left" />
            </>
          )}

          {/* Interior (center) */}
          <View style={{ flex: 1, position: 'relative' }}>
            <FridgeInterior
              zones={interior}
              items={fridgeItems}
              frameColor={frameColor}
              onShelfPress={onShelfPress}
            />
            {hasDoorZones && !isKimchi && (
              <>
                <InteriorSideShadow side="left" />
                <InteriorSideShadow side="right" />
              </>
            )}
          </View>

          {/* Right wall strip + door column */}
          {hasDoorZones && !isKimchi && (
            <>
              <WallStrip frameColor={frameColor} side="right" />
              <View
                style={{
                  width: '18%',
                  backgroundColor: '#e2eaf0',
                  transform: [{ perspective: 400 }, { rotateY: '-18deg' }],
                  transformOrigin: '100% 50%',
                  overflow: 'hidden',
                } as any}
              >
                {/* Depth shadow on inner edge */}
                <LinearGradient
                  colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />
                <DoorBinColumn
                  zones={rightDoor}
                  items={fridgeItems}
                  mirrorShelves={mirrorShelves}
                  onShelfPress={onShelfPress}
                />
              </View>
            </>
          )}
        </View>

        {/* Door overlays — translateX animation */}
        {hasDoorZones && !isKimchi && (
          <>
            <Animated.View
              pointerEvents={isOpen ? 'none' : 'auto'}
              style={{
                ...StyleSheet.absoluteFillObject,
                right: '50%',
                transform: [{ translateX: leftTranslateX }],
                opacity: doorOpacity,
              }}
            >
              <DoorPanel
                color={frameColor}
                isLeft={true}
                name={refrigerator.name}
                typeName={REFRIGERATOR_TYPE_LABELS[refrigerator.type]}
              />
            </Animated.View>

            <Animated.View
              pointerEvents={isOpen ? 'none' : 'auto'}
              style={{
                ...StyleSheet.absoluteFillObject,
                left: '50%',
                transform: [{ translateX: rightTranslateX }],
                opacity: doorOpacity,
              }}
            >
              <DoorPanel color={frameColor} isLeft={false} />
            </Animated.View>

            {!isOpen && (
              <TouchableOpacity
                onPress={openDoor}
                activeOpacity={0.92}
                style={StyleSheet.absoluteFillObject}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}
