import type { RefrigeratorType } from '@freshbox/types';

export interface ZoneConfig {
  key: string;
  label: string;
  shelves: number;
  isDrawer?: boolean;
  side?: 'left' | 'right';
}

export const FRIDGE_CONFIGS: Record<RefrigeratorType, ZoneConfig[]> = {
  STANDARD: [
    { key: '냉장', label: '냉장실', shelves: 4 },
    { key: '냉동', label: '냉동실', shelves: 2 },
    { key: '문선반', label: '문선반', shelves: 3 },
  ],
  SIDE_BY_SIDE: [
    { key: '냉장', label: '냉장실', shelves: 5, side: 'right' },
    { key: '냉동', label: '냉동실', shelves: 4, side: 'left' },
    { key: '문선반L', label: '문선반(좌)', shelves: 3, side: 'left' },
    { key: '문선반R', label: '문선반(우)', shelves: 3, side: 'right' },
  ],
  FRENCH_DOOR: [
    { key: '냉장L', label: '냉장실(좌)', shelves: 4, side: 'left' },
    { key: '냉장R', label: '냉장실(우)', shelves: 4, side: 'right' },
    { key: '냉동서랍', label: '냉동 서랍', shelves: 2, isDrawer: true },
    { key: '문선반', label: '문선반', shelves: 3 },
  ],
  FREEZER: [
    { key: '냉동', label: '냉동실', shelves: 4 },
    { key: '문선반', label: '문선반', shelves: 2 },
  ],
  KIMCHI: [
    { key: '서랍1', label: '상단 서랍', shelves: 1, isDrawer: true },
    { key: '서랍2', label: '중단 서랍', shelves: 1, isDrawer: true },
    { key: '서랍3', label: '하단 서랍', shelves: 1, isDrawer: true },
  ],
};

export function getZonesForType(type: RefrigeratorType): ZoneConfig[] {
  return FRIDGE_CONFIGS[type] ?? FRIDGE_CONFIGS.STANDARD;
}

export function getZoneLabels(type: RefrigeratorType): { key: string; label: string }[] {
  return getZonesForType(type).map(({ key, label }) => ({ key, label }));
}

export function getShelvesForZone(type: RefrigeratorType, zoneKey: string): number {
  const zone = getZonesForType(type).find((z) => z.key === zoneKey);
  return zone?.shelves ?? 1;
}

export function splitZones(zones: ZoneConfig[]): {
  interior: ZoneConfig[];
  leftDoor: ZoneConfig[];
  rightDoor: ZoneConfig[];
} {
  const interior = zones.filter((z) => !z.key.includes('문선반'));
  const doorZones = zones.filter((z) => z.key.includes('문선반'));
  const leftDoor = doorZones.filter((z) => z.side === 'left' || !z.side);
  const rightDoor = doorZones.filter((z) => z.side === 'right');
  return { interior, leftDoor, rightDoor };
}
