import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useURL } from 'expo-linking';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
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
    <View className="flex-1 bg-white">
      {/* 상단 브랜딩 */}
      <View className="flex-1 items-center justify-center px-8">
        <Image
          source={require('../../assets/logo.png')}
          className="w-28 h-28 mb-6"
          resizeMode="contain"
        />
        <Text className="text-3xl font-bold text-gray-900 mb-2">손안의냉장고</Text>
        <Text className="text-base text-gray-500 text-center">
          냉장고 식재료를 스마트하게 관리하세요
        </Text>
      </View>

      {/* 소셜 로그인 버튼 */}
      <View className="px-6 pb-12 gap-3">
        <Text className="text-sm text-gray-400 text-center mb-2">
          SNS 계정으로 간편 로그인
        </Text>

        {/* 카카오 */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-[#FEE500] rounded-2xl py-4 gap-3"
          onPress={() => handleOAuth('kakao')}
        >
          <Ionicons name="chatbubble" size={20} color="#3C1E1E" />
          <Text className="text-[#3C1E1E] text-base font-semibold">
            카카오로 로그인
          </Text>
        </TouchableOpacity>

        {/* 네이버 */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-[#03C75A] rounded-2xl py-4 gap-3"
          onPress={() => handleOAuth('naver')}
        >
          <Text className="text-white text-lg font-bold">N</Text>
          <Text className="text-white text-base font-semibold">
            네이버로 로그인
          </Text>
        </TouchableOpacity>

        {/* 구글 */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-white border border-gray-200 rounded-2xl py-4 gap-3"
          onPress={() => handleOAuth('google')}
        >
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text className="text-gray-700 text-base font-semibold">
            Google로 로그인
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
