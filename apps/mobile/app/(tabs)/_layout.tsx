import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/theme.store';

export default function TabsLayout() {
  const { colors } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.tabBorder,
          backgroundColor: colors.tabBg,
          paddingTop: 4,
        },
        headerStyle: { backgroundColor: colors.headerBg },
        headerTitleStyle: { fontWeight: '700', color: colors.headerText },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '냉장고',
          headerTitle: '손안의냉장고',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="snow-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '추가',
          headerTitle: '식재료 추가',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: '쇼핑',
          headerTitle: '장보기',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '통계',
          headerTitle: '소비 통계',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          href: null,
          headerTitle: '유통기한 임박',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          headerTitle: '설정',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="receipt-scan"
        options={{
          href: null,
          headerTitle: '영수증 스캔',
        }}
      />
      <Tabs.Screen
        name="edit"
        options={{
          href: null,
          headerTitle: '식재료 수정',
        }}
      />
      <Tabs.Screen
        name="shopping-history"
        options={{
          href: null,
          headerTitle: '지난 장보기',
        }}
      />
    </Tabs>
  );
}
