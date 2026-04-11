import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useURL } from 'expo-linking';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import { API_BASE_URL } from '../../constants/api';

WebBrowser.maybeCompleteAuthSession();

const OAUTH_URLS = {
  kakao: `${API_BASE_URL}/auth/kakao`,
  naver: `${API_BASE_URL}/auth/naver`,
  google: `${API_BASE_URL}/auth/google`,
};

export default function LoginScreen() {
  const url = useURL();
  const { setTokens } = useAuthStore();
  const { colors } = useThemeStore();

  // 딥링크로 토큰 받기 (freshbox://auth/callback?accessToken=...&refreshToken=...)
  useEffect(() => {
    if (!url) return;
    const parsed = new URL(url);
    if (parsed.pathname === '/auth/callback') {
      const accessToken = parsed.searchParams.get('accessToken');
      const refreshToken = parsed.searchParams.get('refreshToken');
      if (accessToken && refreshToken) {
        setTokens(accessToken, refreshToken).then(() => {
          router.replace('/(tabs)/');
        });
      }
    }
  }, [url, setTokens]);

  const handleOAuth = async (provider: keyof typeof OAUTH_URLS) => {
    const result = await WebBrowser.openAuthSessionAsync(
      OAUTH_URLS[provider],
      'freshbox://auth/callback',
    );

    if (result.type === 'success' && result.url) {
      const parsed = new URL(result.url);
      const accessToken = parsed.searchParams.get('accessToken');
      const refreshToken = parsed.searchParams.get('refreshToken');
      if (accessToken && refreshToken) {
        await setTokens(accessToken, refreshToken);
        router.replace('/(tabs)/');
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCard }}>
      {/* 상단 브랜딩 */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 112, height: 112, marginBottom: 24 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 30, fontWeight: '700', color: colors.text, marginBottom: 8 }}>손안의냉장고</Text>
        <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          냉장고 식재료를 스마트하게 관리하세요
        </Text>

        {/* 기능 하이라이트 */}
        <View style={{ gap: 10 }}>
          {[
            { icon: 'snow-outline' as const, text: '냉장고 식재료 한눈에 관리' },
            { icon: 'notifications-outline' as const, text: '유통기한 자동 알림' },
            { icon: 'cart-outline' as const, text: '맞춤 장보기 추천' },
          ].map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name={item.icon} size={18} color={colors.primary} />
              <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: '500' }}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 소셜 로그인 버튼 */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 48, gap: 12 }}>
        {/* 구분선 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={{ fontSize: 13, color: colors.textTertiary, paddingHorizontal: 12 }}>간편 로그인</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        {/* 카카오 */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE500', borderRadius: 16, paddingVertical: 16, gap: 12 }}
          onPress={() => handleOAuth('kakao')}
        >
          <Ionicons name="chatbubble" size={20} color="#3C1E1E" />
          <Text style={{ color: '#3C1E1E', fontSize: 16, fontWeight: '600' }}>
            카카오로 로그인
          </Text>
        </TouchableOpacity>

        {/* 네이버 */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#03C75A', borderRadius: 16, paddingVertical: 16, gap: 12 }}
          onPress={() => handleOAuth('naver')}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>N</Text>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            네이버로 로그인
          </Text>
        </TouchableOpacity>

        {/* 구글 */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 16, gap: 12 }}
          onPress={() => handleOAuth('google')}
        >
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
            Google로 로그인
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
