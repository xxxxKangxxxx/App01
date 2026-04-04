import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore, ThemeMode } from '../../store/theme.store';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
  textColor?: string;
  subColor?: string;
  chevronColor?: string;
}

function SettingsRow({ icon, iconColor, iconBg, label, sub, onPress, danger, textColor, subColor, chevronColor }: SettingsRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: danger ? '#ef4444' : (textColor ?? '#111827') }}>
          {label}
        </Text>
        {sub ? <Text style={{ fontSize: 12, color: subColor ?? '#9ca3af', marginTop: 1 }}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={chevronColor ?? '#d1d5db'} />
    </TouchableOpacity>
  );
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'system', label: '시스템 설정', icon: 'phone-portrait-outline' },
  { mode: 'light', label: '라이트', icon: 'sunny-outline' },
  { mode: 'dark', label: '다크', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { colors, mode, setMode } = useThemeStore();

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const cardStyle = {
    marginHorizontal: 16,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden' as const,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 프로필 카드 */}
        <View
          style={{
            margin: 16,
            backgroundColor: colors.bgCard,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.infoLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <Ionicons name="person" size={24} color={colors.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
              {user?.name ?? '사용자'}
            </Text>
            {user?.email ? (
              <Text style={{ fontSize: 13, color: colors.textTertiary, marginTop: 2 }}>{user.email}</Text>
            ) : null}
          </View>
        </View>

        {/* 화면 모드 */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textTertiary, marginLeft: 28, marginTop: 8, marginBottom: 8 }}>
          화면 모드
        </Text>
        <View style={cardStyle}>
          <View style={{ flexDirection: 'row', padding: 8, gap: 6 }}>
            {THEME_OPTIONS.map((opt) => {
              const isSelected = mode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  onPress={() => setMode(opt.mode)}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: isSelected ? colors.primary + '18' : 'transparent',
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.primary : 'transparent',
                  }}
                >
                  <Ionicons
                    name={opt.icon}
                    size={16}
                    color={isSelected ? colors.primary : colors.textTertiary}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: isSelected ? colors.primary : colors.textSecondary,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 냉장고 관리 */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textTertiary, marginLeft: 28, marginTop: 24, marginBottom: 8 }}>
          관리
        </Text>
        <View style={cardStyle}>
          <SettingsRow
            icon="snow-outline"
            iconColor={colors.info}
            iconBg={colors.infoLight}
            label="냉장고 관리"
            sub="냉장고 추가, 수정, 삭제"
            onPress={() => router.push('/modals/refrigerator-setup')}
            textColor={colors.text}
            subColor={colors.textTertiary}
            chevronColor={colors.textTertiary}
          />
          <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 62 }} />
          <SettingsRow
            icon="notifications-outline"
            iconColor={colors.warning}
            iconBg={colors.warningLight}
            label="알림 설정"
            sub="유통기한 알림 관리"
            onPress={() => router.push('/(tabs)/alerts')}
            textColor={colors.text}
            subColor={colors.textTertiary}
            chevronColor={colors.textTertiary}
          />
        </View>

        {/* 계정 */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textTertiary, marginLeft: 28, marginTop: 24, marginBottom: 8 }}>
          계정
        </Text>
        <View style={cardStyle}>
          <SettingsRow
            icon="log-out-outline"
            iconColor={colors.danger}
            iconBg={colors.dangerLight}
            label="로그아웃"
            onPress={handleLogout}
            danger
            textColor={colors.text}
            subColor={colors.textTertiary}
            chevronColor={colors.textTertiary}
          />
        </View>

        {/* 앱 정보 */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textTertiary, marginLeft: 28, marginTop: 24, marginBottom: 8 }}>
          앱 정보
        </Text>
        <View style={cardStyle}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: colors.successLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="leaf-outline" size={18} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>손안의냉장고</Text>
              <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 1 }}>v1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
