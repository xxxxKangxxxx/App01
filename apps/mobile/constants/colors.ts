/**
 * 라이트/다크 테마 색상 팔레트
 */

export interface ThemeColors {
  // 배경
  bg: string;
  bgCard: string;
  bgSecondary: string;
  bgInput: string;

  // 텍스트
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // 테두리
  border: string;
  borderLight: string;
  divider: string;

  // 브랜드
  primary: string;
  primaryLight: string;
  primaryText: string;

  // 상태
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  success: string;
  successLight: string;
  info: string;
  infoLight: string;
  caution: string;
  cautionLight: string;

  // 탭바
  tabActive: string;
  tabInactive: string;
  tabBg: string;
  tabBorder: string;

  // 헤더
  headerBg: string;
  headerText: string;

  // 오버레이
  overlay: string;
}

export const lightColors: ThemeColors = {
  bg: '#f3f4f6',
  bgCard: '#ffffff',
  bgSecondary: '#f9fafb',
  bgInput: '#f9fafb',

  text: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',

  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  divider: '#f3f4f6',

  primary: '#22c55e',
  primaryLight: '#f0fdf4',
  primaryText: '#166534',

  danger: '#ef4444',
  dangerLight: '#fef2f2',
  warning: '#f97316',
  warningLight: '#fff7ed',
  success: '#22c55e',
  successLight: '#f0fdf4',
  info: '#3b82f6',
  infoLight: '#eff6ff',
  caution: '#eab308',
  cautionLight: '#fefce8',

  tabActive: '#22c55e',
  tabInactive: '#9ca3af',
  tabBg: '#ffffff',
  tabBorder: '#e5e7eb',

  headerBg: '#ffffff',
  headerText: '#111827',

  overlay: 'rgba(0,0,0,0.3)',
};

export const darkColors: ThemeColors = {
  bg: '#0f172a',
  bgCard: '#1e293b',
  bgSecondary: '#334155',
  bgInput: '#334155',

  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textInverse: '#0f172a',

  border: '#334155',
  borderLight: '#1e293b',
  divider: '#334155',

  primary: '#4ade80',
  primaryLight: '#14532d',
  primaryText: '#86efac',

  danger: '#f87171',
  dangerLight: '#450a0a',
  warning: '#fb923c',
  warningLight: '#431407',
  success: '#4ade80',
  successLight: '#14532d',
  info: '#60a5fa',
  infoLight: '#1e3a5f',
  caution: '#facc15',
  cautionLight: '#422006',

  tabActive: '#4ade80',
  tabInactive: '#64748b',
  tabBg: '#1e293b',
  tabBorder: '#334155',

  headerBg: '#1e293b',
  headerText: '#f1f5f9',

  overlay: 'rgba(0,0,0,0.6)',
};
