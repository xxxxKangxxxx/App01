import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeStore } from '../../store/theme.store';
import { useOnboardingStore } from '../../store/onboarding.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PAGES = [
  {
    icon: 'snow-outline' as const,
    iconColor: 'info' as const,
    iconBg: 'infoLight' as const,
    title: '냉장고를 한눈에',
    description: '냉장고를 등록하고\n식재료를 구역별로 관리하세요',
  },
  {
    icon: 'camera-outline' as const,
    iconColor: 'warning' as const,
    iconBg: 'warningLight' as const,
    title: '영수증 찍고 바로 추가',
    description: '영수증을 스캔하면\n식재료가 자동으로 등록돼요',
  },
  {
    icon: 'cart-outline' as const,
    iconColor: 'primary' as const,
    iconBg: 'primaryLight' as const,
    title: '장보기도 똑똑하게',
    description: '소비 패턴을 분석해서\n맞춤 장보기 목록을 추천해요',
  },
  {
    icon: 'notifications-outline' as const,
    iconColor: 'danger' as const,
    iconBg: 'dangerLight' as const,
    title: '유통기한 놓치지 마세요',
    description: 'D-3, D-1에 알림을 보내\n신선하게 관리해드려요',
  },
];

export default function OnboardingModal() {
  const { colors } = useThemeStore();
  const { setOnboardingComplete } = useOnboardingStore();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const isLastPage = currentPage === PAGES.length - 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const handleNext = () => {
    if (isLastPage) {
      handleComplete();
    } else {
      scrollRef.current?.scrollTo({ x: (currentPage + 1) * SCREEN_WIDTH, animated: true });
    }
  };

  const handleComplete = async () => {
    await setOnboardingComplete();
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* 건너뛰기 */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8 }}>
        {!isLastPage && (
          <TouchableOpacity onPress={handleComplete} style={{ padding: 8 }}>
            <Text style={{ fontSize: 14, color: colors.textTertiary, fontWeight: '500' }}>건너뛰기</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 페이지 콘텐츠 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {PAGES.map((page, idx) => (
          <View
            key={idx}
            style={{
              width: SCREEN_WIDTH,
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 40,
            }}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 36,
                backgroundColor: colors[page.iconBg],
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
              }}
            >
              <Ionicons name={page.icon} size={56} color={colors[page.iconColor]} />
            </View>

            <Text
              style={{
                fontSize: 24,
                fontWeight: '800',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              {page.title}
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 24,
              }}
            >
              {page.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* 하단: 인디케이터 + 버튼 */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        {/* 페이지 인디케이터 */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {PAGES.map((_, idx) => (
            <View
              key={idx}
              style={{
                width: currentPage === idx ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentPage === idx ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>

        {/* 액션 버튼 */}
        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: isLastPage ? colors.primary : colors.info,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.textInverse, fontSize: 16, fontWeight: '700' }}>
            {isLastPage ? '시작하기' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
