import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, iconColor, iconBg, label, sub, onPress, danger }: SettingsRowProps) {
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
        <Text style={{ fontSize: 15, fontWeight: '500', color: danger ? '#ef4444' : '#111827' }}>
          {label}
        </Text>
        {sub ? <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
    </TouchableOpacity>
  );
}

function SectionDivider() {
  return <View style={{ height: 1, backgroundColor: '#f3f4f6', marginLeft: 62 }} />;
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 프로필 카드 */}
        <View
          style={{
            margin: 16,
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#eff6ff',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <Ionicons name="person" size={24} color="#3b82f6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>
              {user?.name ?? '사용자'}
            </Text>
            {user?.email ? (
              <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{user.email}</Text>
            ) : null}
          </View>
        </View>

        {/* 냉장고 관리 */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: '#fff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            overflow: 'hidden',
          }}
        >
          <SettingsRow
            icon="snow-outline"
            iconColor="#3b82f6"
            iconBg="#eff6ff"
            label="냉장고 관리"
            sub="냉장고 추가, 수정, 삭제"
            onPress={() => router.push('/modals/refrigerator-setup')}
          />
          <SectionDivider />
          <SettingsRow
            icon="notifications-outline"
            iconColor="#f97316"
            iconBg="#fff7ed"
            label="알림 설정"
            sub="유통기한 알림 관리"
            onPress={() => router.push('/(tabs)/alerts')}
          />
        </View>

        {/* 계정 */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#9ca3af', marginLeft: 28, marginTop: 24, marginBottom: 8 }}>
          계정
        </Text>
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: '#fff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            overflow: 'hidden',
          }}
        >
          <SettingsRow
            icon="log-out-outline"
            iconColor="#ef4444"
            iconBg="#fef2f2"
            label="로그아웃"
            onPress={handleLogout}
            danger
          />
        </View>

        {/* 앱 정보 */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#9ca3af', marginLeft: 28, marginTop: 24, marginBottom: 8 }}>
          앱 정보
        </Text>
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: '#fff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            overflow: 'hidden',
          }}
        >
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
                backgroundColor: '#f0fdf4',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="leaf-outline" size={18} color="#22c55e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#111827' }}>손안의냉장고</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>v1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
