# 손안의냉장고 — CLAUDE.md

냉장고 식재료 스마트 관리 앱. MVP 범위: 식재료 CRUD + 유통기한 푸시 알림 + SNS 로그인(카카오/네이버/구글)
앱 표시 이름: **손안의냉장고** (코드베이스 내부 이름: freshbox)

---

## 프로젝트 구조

```
freshbox/                        ← 모노레포 루트
├── apps/
│   ├── api/                     ← NestJS 서버 (포트 3000)
│   └── mobile/                  ← Expo React Native 앱
├── packages/
│   └── types/                   ← 공유 TypeScript 타입/DTO
├── CLAUDE.md
├── package.json                 ← 루트 워크스페이스
├── pnpm-workspace.yaml
├── turbo.json
└── .npmrc                       ← shamefully-hoist=true (필수)
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 모바일 | React Native 0.76.9 + Expo 52 + expo-router v4 + NativeWind v4 |
| 백엔드 | NestJS 10 + Fastify adapter + TypeScript |
| DB | PostgreSQL 16 (Docker) + Prisma 6 ORM |
| 패키지 | pnpm Workspaces + Turborepo |
| Auth | 카카오/네이버/구글 OAuth (커스텀 axios 전략) + JWT (passport-jwt) |
| 상태관리 | Zustand (클라이언트) + React Query (서버) |
| 다크모드 | Zustand 테마 스토어 + AsyncStorage + 중앙 색상 상수 (system/light/dark) |
| 알림 | expo-server-sdk + @nestjs/schedule (Cron) |
| 토큰 저장 | expo-secure-store |
| SVG/3D | react-native-svg + expo-linear-gradient (3D 냉장고 뷰) |
| 아이콘 | @expo/vector-icons (Ionicons) — UI 아이콘 전담 |
| 날짜 선택 | @react-native-community/datetimepicker (네이티브) |
| OCR | @react-native-ml-kit/text-recognition (온디바이스) |
| 이미지 선택 | expo-image-picker (카메라 + 갤러리) |

---

## 현재 개발 상태 (2026-04-22 업데이트, 5차)

### 완료된 작업
- [x] 모노레포 초기화 (pnpm workspaces + Turborepo)
- [x] 공유 타입 패키지 (`packages/types`)
- [x] NestJS API 서버 전체 구현
  - [x] Prisma 스키마 + DB 마이그레이션
  - [x] Auth 모듈 (카카오/네이버/구글 OAuth + JWT)
  - [x] Food Items CRUD API
  - [x] 알림 스케줄러 (매일 오전 9시 D-3, D-1 만료 알림)
- [x] Expo 모바일 앱 전체 구현
  - [x] 로그인 화면 (카카오/네이버/구글 SNS 버튼)
  - [x] 식재료 추가 폼
  - [x] 식재료 수정 폼
  - [x] 유통기한 임박 알림 탭
  - [x] Auth Guard (토큰 유무에 따라 화면 라우팅)
  - [x] Zustand + SecureStore 토큰 관리
  - [x] Axios + JWT 인터셉터 (401 시 자동 리프레시)
- [x] iOS 시뮬레이터 빌드 성공 + 앱 로고 적용
- [x] Expo Go 제거 — 개발 빌드(com.freshbox.app)만 사용, `--dev-client --port 8082` 고정
- [x] 구글 OAuth E2E 테스트 완료
- [x] **냉장고 3D UI 전면 개선** (2026-03-03)
  - [x] Prisma: `RefrigeratorType` enum + `Refrigerator` 모델 추가
  - [x] Prisma: `FoodItem`에 `refrigeratorId`, `zone`, `shelf`, `depth`, `colPosition` 필드 추가
  - [x] NestJS: Refrigerators 모듈 (CRUD) — `GET/POST /api/refrigerators`, `PATCH/DELETE /api/refrigerators/:id`
  - [x] 공유 타입: `Refrigerator`, `RefrigeratorType`, `REFRIGERATOR_TYPE_LABELS`, `CreateRefrigeratorDto` 추가
  - [x] 모바일: `refrigeratorsApi` + `useRefrigerators` 훅 추가
  - [x] 모바일: `fridgeConfigs.ts` — 5가지 냉장고 타입별 구역/층 설정
  - [x] 모바일: `IsometricShelf.tsx` — react-native-svg 아이소메트릭 선반 컴포넌트
  - [x] 모바일: `ZoneSection.tsx` — 구역별 선반 적층 뷰
  - [x] 모바일: `RefrigeratorView.tsx` — 타입별 레이아웃 분기 (STANDARD/SIDE_BY_SIDE/FRENCH_DOOR/FREEZER/KIMCHI)
  - [x] 모바일: `FoodForm.tsx` — 5단계 위치 선택 UI (냉장고→구역→층→깊이→좌우)
  - [x] 모바일: `index.tsx` 전면 재설계 — 냉장고 탭 + 아이소메트릭 뷰 + 온보딩
  - [x] 모바일: `modals/refrigerator-setup.tsx` — 냉장고 등록/수정/삭제 모달
  - [x] 모바일: `modals/shelf-detail.tsx` — 선반 상세 모달 (해당 층 식재료 목록)
  - [x] metro.config.js: `unstable_enableSymlinks` + pnpm store 경로 추가 (NativeWind 심링크 해결)
  - [x] E2E 확인: PostgreSQL 연결, API 서버 정상 동작, 시뮬레이터 실행

- [x] **냉장고 뷰 3열 레이아웃 + 3D 재설계** (2026-03-08)
  - [x] `fridgeConfigs.ts`: `splitZones()` 유틸 추가 — 존을 내부/좌문/우문으로 분리
  - [x] `FlatShelf.tsx`: `compact` prop 추가 (작은 폰트/패딩, MAX_VISIBLE 3)
  - [x] `DoorBinColumn.tsx`: **신규** — 문선반 칼럼 (이모지 전용, 투명 선반 구분선)
  - [x] `RefrigeratorView.tsx`: **전면 재작성**
    - 3열 레이아웃: [문선반L 18%] [벽 8px] [내부 flex:1] [벽 8px] [문선반R 18%]
    - `translateX` + `opacity` 도어 슬라이딩 애니메이션 (`useNativeDriver: true`)
    - 문선반 원근감: `perspective: 400` + `rotateY: ±18deg` 정적 변환
    - `expo-linear-gradient` 3D 효과: LED 조명, 유리 선반, 벽 깊이, 내부 오목 그림자, 메탈릭 문
    - `maxHeight: screenHeight - 180` 크기 제한
    - KIMCHI 타입: 문 없이 내부만 전체 폭 표시
  - [x] `fridge-detail.tsx`: `ScrollView` → `View` (maxHeight 제약이 내부에 있으므로 불필요)

- [x] **식재료 이모지 개별 매핑** (2026-03-15)
  - [x] `constants/foodEmoji.ts`: 200+ 한국어 식재료명 → 개별 이모지 매핑 + `getFoodEmoji()` 함수
  - [x] `FlatShelf.tsx`: 카테고리 이모지 → 식재료별 이모지로 변경
  - [x] `DoorBinColumn.tsx`: 동일 적용
  - [x] `FoodItemCard.tsx`: 아이템명 왼쪽에 식재료 이모지 추가
  - [x] `shelf-detail.tsx`: 색상 인디케이터 → 이모지 + 색상 인디케이터로 개선
  - [x] `index.tsx` (홈): 미분류 칩에 식재료 이모지 추가

- [x] **날짜 선택 UI 개선** (2026-03-15)
  - [x] `@react-native-community/datetimepicker` 설치 (네이티브)
  - [x] `FoodForm.tsx`: TextInput → DateField 컴포넌트 (iOS 스피너 모달)
  - [x] 유통기한 빠른 선택 프리셋 (오늘, +3일, +1주, +2주, +1개월, +3개월)
  - [x] D-day 뱃지 색상 실시간 표시

- [x] **UI 아이콘 체계 통일** (2026-03-15)
  - [x] `@expo/vector-icons` (Ionicons) 도입 — 모든 UI 이모지를 벡터 아이콘으로 교체
  - [x] 탭바: `snow-outline` / `add-circle-outline` / `notifications-outline`
  - [x] 모달 닫기: `close` 아이콘 (3곳)
  - [x] 홈 화면: `alert-circle` (임박), `settings-outline` (설정), `cube-outline` (미분류)
  - [x] 로그인: `chatbubble` (카카오), `logo-google` (구글)
  - [x] 냉장고 카드/뷰: `snow-outline`, `alert-circle`
  - [x] DateField: `calendar` / `calendar-outline`
  - [x] 빈 상태: `checkmark-circle-outline` (알림), `cube-outline` (선반)
  - [x] FoodItemCard 위치: `snow-outline` (냉장), `snow` (냉동), `grid-outline` (문선반), `sunny-outline` (실온)

- [x] **홈 화면 리디자인** (2026-03-15)
  - [x] `StatsSummary` 컴포넌트: 전체/여유/임박/만료 4칸 통계 카드 (색상 아이콘 + 숫자)
  - [x] `FridgeCard` 개선: 130px→160px, 식재료 이모지 미리보기(최대 5개), 만료/임박 분리 뱃지
  - [x] `RecentItem` 컴포넌트: 최근 추가 5개 (이모지 + 이름 + 카테고리 + 시간 경과 + D-day)
  - [x] 헤더 간소화: 부제/임박 뱃지 제거 → 통계 카드로 이동
  - [x] 냉장고 섹션 제목 + 대수 표시 추가
  - [x] 색상 범례 삭제

- [x] **탭 네비게이션 재구성 + 설정 화면** (2026-03-15)
  - [x] 3탭 → 4탭: 냉장고 / 추가 / 알림 / 설정 (`settings-outline`)
  - [x] `edit.tsx`: `href: null`로 탭바에서 숨김 (라우트로만 접근)
  - [x] `settings.tsx`: 프로필 카드, 냉장고 관리, 알림 설정, 로그아웃, 앱 정보(v1.0.0)
  - [x] 홈 헤더: 설정 아이콘(`settings-outline`) → 추가 아이콘(`add`)으로 변경

- [x] **앱 이름 변경** (2026-03-15)
  - [x] FreshBox → 손안의냉장고 (app.json, 헤더, 로그인, 설정 화면)

- [x] **영수증 스캔 — 식재료 자동 추가** (2026-03-15)
  - [x] Prisma: `FoodShelfLife` 모델 + `StorageMethod` enum 추가
  - [x] 시드 데이터: 120개+ 식재료 유통기한 + 9개 카테고리 폴백
  - [x] 공유 타입: `ReceiptItem`, `ParseReceiptResponse`, `BulkCreateFoodItemDto`, `FoodShelfLife` 등
  - [x] API: `receipt` 모듈 — `POST /api/receipt/parse` (정규식 + 휴리스틱 파서)
  - [x] API: `shelf-life` 모듈 — `GET /api/shelf-life`, `GET /api/shelf-life/search`
  - [x] API: `POST /api/food-items/bulk` 일괄 추가 엔드포인트
  - [x] 모바일: `expo-image-picker` + `@react-native-ml-kit/text-recognition` 설치
  - [x] 모바일: `services/ocr.ts` — ML Kit 온디바이스 텍스트 인식
  - [x] 모바일: `hooks/useReceiptScan.ts` — 파싱/일괄추가 React Query 훅
  - [x] 모바일: `add.tsx` — 상단 "영수증 스캔으로 추가" 버튼 + 구분선
  - [x] 모바일: `receipt-scan.tsx` — 3단계 UX (이미지 선택 → 스캔 중 → 미리보기/수정/일괄추가)

- [x] **FoodForm UX 개선** (2026-03-15)
  - [x] 카테고리: 수평 스크롤 → 3열 그리드 (Ionicons 아이콘 + 라벨)
  - [x] 단위: TextInput → 프리셋 칩 (개, g, kg, ml, L, 봉, 팩, 병, 근, 마리) + 직접 입력
  - [x] 수량: -/+ 스텝퍼 버튼 추가

- [x] **알림 탭 개선** (2026-03-15)
  - [x] 스와이프 액션 카드 (우→소비, 좌→삭제)
  - [x] 만료/오늘/내일/3일내 섹션 분리 + 아이콘 헤더
  - [x] 상단 요약 카드 (만료/오늘/내일/3일 카운트)

- [x] **RefrigeratorView 디테일 개선** (2026-03-15)
  - [x] `FlatShelf.tsx`: 빈 선반 점선 테두리 + add 아이콘, 미니 채워짐 인디케이터, 임박 경고 아이콘
  - [x] `RefrigeratorView.tsx`: `ZoneHeader` (구역 아이콘 + 아이템 수 + 임박 뱃지), `HeaderSummary` (채워짐 게이지 + 상태 뱃지)
  - [x] `fridge-detail.tsx`: 요약 카드 (전체/여유/임박/만료) + 냉장고 타입 서브텍스트

- [x] **유통기한 자동 제안** (2026-04-02)
  - [x] `FoodForm.tsx`: 이름 입력 시 400ms debounce → `shelf-life/search` API 호출 → 인라인 제안 목록
  - [x] 제안 선택 시 이름 + 카테고리 + 유통기한(오늘+defaultDays) 자동 설정
  - [x] 사용자가 직접 유통기한 설정 시 자동 입력 덮어쓰지 않음
  - [x] race condition 방지: requestId 카운터 패턴 적용
  - [x] `packages/types`: `STORAGE_METHOD_LABELS` 상수 추가 (CATEGORY_LABELS 패턴과 일치)

- [x] **다크모드 지원** (2026-04-04)
  - [x] `constants/colors.ts`: 라이트/다크 색상 팔레트 (ThemeColors 인터페이스)
  - [x] `store/theme.store.ts`: Zustand 테마 스토어 (system/light/dark + AsyncStorage 저장)
  - [x] `settings.tsx`: 3단 테마 토글 UI (시스템 설정/라이트/다크)
  - [x] 17개 화면/컴포넌트 하드코딩 색상 → `colors.*` 전환
  - [x] 루트/탭 레이아웃, 로그인, 홈, 추가, 수정, 알림, 영수증 스캔
  - [x] FoodForm, ExpiryBadge, FridgeCard, 모달 3개
  - [x] ExpiryBadge: NativeWind className → inline styles 전환
  - [x] 냉장고 3D 뷰(RefrigeratorView/FlatShelf/DoorBinColumn)는 냉장고 자체 색상 사용 — 테마 변경 불필요

- [x] **장보기 추천 — 규칙 기반 쇼핑 리스트** (2026-04-11)
  - [x] Prisma: `ShoppingList` + `ShoppingItem` 모델 추가, `User` 관계 추가
  - [x] 공유 타입: `ShoppingList`, `ShoppingItem`, `RecommendedItem`, `ShoppingRecommendationResponse` 등 10개 타입 추가
  - [x] API: `shopping` 모듈 — CRUD + 추천 알고리즘 + 구매→냉장고 추가
  - [x] API: `ShoppingRecommendationService` — 소비 이력 패턴 분석 (단골 감지, 구매 주기, 3가지 추천 사유)
  - [x] API: 12개 엔드포인트 (`GET /recommendations`, `GET/POST/PATCH/DELETE /lists`, 아이템 CRUD, `POST /purchase`)
  - [x] 모바일: `shoppingApi` 서비스 + `useShopping.ts` React Query 훅 11개
  - [x] 모바일: 4탭→5탭 변경 (냉장고/추가/쇼핑/알림/설정), `cart-outline` 아이콘
  - [x] 모바일: `shopping.tsx` — 날짜 제안 카드 + 추천 목록 + 장보기 체크리스트 + 수동 추가
  - [x] 모바일: `shopping-history.tsx` — 완료된 장보기 이력 (숨김 라우트)
  - [x] 모바일: 컴포넌트 4개 (`SuggestedDateCard`, `RecommendationCard`, `ShoppingItemRow`, `AddItemInline`)
  - [x] 구매 체크 시 "냉장고에 추가?" Alert → `FoodItem` 자동 생성
  - [x] 다크모드 완전 지원 (모든 컴포넌트 `useThemeStore()` 사용)
  - [x] 빈 상태: "장보기 추천이 없어요 / 식재료를 추가하고 소비하면 맞춤 추천해드려요"

- [x] **다크모드 하드코딩 색상 전면 수정 + 캐시 버그 해결** (2026-04-11)
  - [x] `constants/colors.ts`: `caution`/`cautionLight` 색상 추가 (D-4~7 노란색 다크모드)
  - [x] `FoodItemCard.tsx`: NativeWind `className` → 인라인 스타일 + 테마 색상 전면 전환
  - [x] `ExpiryBadge.tsx`: 하드코딩 색상 → `useThemeStore()` 테마 색상
  - [x] `index.tsx`: StatItem 하드코딩 색상 → 테마, `expiryChipColor` → `useExpiryChipColor` hook
  - [x] `alerts.tsx`: dStyle, 요약 카드, 섹션 헤더, 스와이프 배경, 액션 버튼 전부 테마 적용
  - [x] `refrigerator-setup.tsx`: 구역 편집/삭제 버튼 테마 적용
  - [x] `RecommendationCard.tsx`: `REASON_STYLES` → 동적 테마 색상
  - [x] `useShopping.ts`: 추천→리스트 생성, 구매 완료 시 `shopping-recommendations` 캐시 갱신 추가

- [x] **온보딩 튜토리얼 + 로그인 브랜딩 개선** (2026-04-11)
  - [x] `store/onboarding.store.ts`: Zustand + AsyncStorage 온보딩 상태 관리
  - [x] `app/modals/onboarding.tsx`: 4페이지 스와이프 튜토리얼 (냉장고/영수증/장보기/알림)
  - [x] `app/_layout.tsx`: 첫 로그인 시 온보딩 모달 자동 표시
  - [x] `app/(auth)/login.tsx`: 기능 하이라이트 3줄 + 간편 로그인 구분선
  - [x] `app/(tabs)/settings.tsx`: "앱 사용 가이드" 링크 (튜토리얼 다시 보기)

- [x] **식재료 검색/필터** (2026-04-11)
  - [x] API: `GET /api/food-items`에 `search`, `refrigeratorId` 쿼리 파라미터 추가
  - [x] 모바일: 홈 화면 헤더 아래 검색바 (이름 실시간 검색)
  - [x] 모바일: 필터 토글 버튼 (활성 필터 수 뱃지 표시)
  - [x] 모바일: 3종 필터 칩 — 상태(여유/임박/만료), 카테고리(9종), 냉장고별(미분류 포함)
  - [x] 모바일: 검색/필터 활성 시 결과 리스트 전환 (이모지 + 이름 + 카테고리/냉장고/수량 + D-day)
  - [x] 모바일: 초기화 버튼 + 빈 결과 안내 + 다크모드 지원
  - [x] 클라이언트 사이드 필터링 (기존 데이터 활용, 네트워크 없이 즉시 반응)

- [x] **소비 통계 + 탭 네비게이션 개편** (2026-04-11)
  - [x] Prisma: `FoodItem`에 `consumedAt`, `deletedAt` 필드 추가 (soft delete)
  - [x] API: `GET /api/food-items/stats/monthly?year=&month=` 통계 엔드포인트
  - [x] API: 소비 시 `consumedAt` 자동 기록, 삭제 → soft delete(`deletedAt`)
  - [x] API: `findAll`, `findOne`, `findExpiringSoon` soft delete 필터링
  - [x] 공유 타입: `MonthlyStatsResponse`, `CategoryStat`, `TopItem` 등 추가
  - [x] 모바일: 탭 변경 — 알림 탭 → **통계 탭**(`stats-chart-outline`)으로 교체
  - [x] 모바일: 알림은 홈 헤더 우측 벨 아이콘으로 이동 (임박 수 뱃지)
  - [x] 모바일: `stats.tsx` — 월별 통계 화면 (요약 카드, 활용률 바, 카테고리 차트, TOP 랭킹)
  - [x] 모바일: 년도/월 선택 모달 (4x3 월 그리드 + 년도 좌우) + 좌우 화살표 이동
  - [x] 모바일: 식재료 "삭제" → "폐기"로 용어 통일 (alerts.tsx, FoodItemCard.tsx)
  - [x] `hooks/useMonthlyStats.ts`, `services/api.ts`에 `foodItemsStatsApi` 추가

- [x] **카카오 OAuth E2E 완료** (2026-04-12)
  - [x] 카카오 개발자 앱 등록 + REST API 키/클라이언트 시크릿 발급
  - [x] 플랫폼 키 > 카카오 로그인 리다이렉트 URI 등록
  - [x] `kakao.strategy.ts`: `client_secret` 파라미터 추가
  - [x] `.env`: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` 설정
  - [x] 시뮬레이터 E2E 로그인 테스트 성공

- [x] **네이버 OAuth E2E 완료** (2026-04-12)
  - [x] 네이버 개발자 앱 등록 + Client ID/Secret 발급
  - [x] Callback URL 등록 (`http://localhost:3000/api/auth/naver/callback`)
  - [x] `naver.strategy.ts`: 토큰 에러 응답 체크 추가
  - [x] `.env`: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 설정
  - [x] 시뮬레이터 E2E 로그인 테스트 성공

- [x] **OAuth 계정 통합 + 로그아웃 캐시 버그 수정** (2026-04-12)
  - [x] `auth.service.ts`: 이메일 중복 시 기존 계정에 소셜 ID 자동 연결 (카카오/네이버/구글)
  - [x] `users.service.ts`: `linkKakaoId`, `linkNaverId`, `linkGoogleId` 메서드 추가
  - [x] `auth.store.ts`: 로그아웃 시 `queryClient.clear()` 호출 — React Query 캐시 초기화
  - [x] `lib/queryClient.ts`: QueryClient 인스턴스 분리 (순환 참조 방지)

- [x] **푸시 알림 테스트 준비** (2026-04-22)
  - [x] EAS 프로젝트 생성 + `projectId` 발급 (`f86a4053-...`)
  - [x] `app.json`: `extra.eas.projectId` + `owner` 추가
  - [x] `_layout.tsx`: `getExpoPushTokenAsync({ projectId })` 전달하도록 수정
  - [x] 푸시 알림 테스트 문서 Dev Build 전용으로 재작성

### 남은 작업 — 푸시 알림 실기기 테스트
- [ ] iOS APNs 키 업로드 (Apple Developer 유료 계정 필요)
- [ ] 권한 플로우 보강 (거부 시 `Linking.openSettings()` 유도)
- [ ] Dev Build 생성 (`expo run:ios --device`)
- [ ] 토큰 등록 + 즉시 발송 + Receipt 확인 + 상태별 체크
- [ ] 서버: Receipt 조회 + `DeviceNotRegistered` 토큰 정리
- [ ] 서버: Cron 타임존 `Asia/Seoul` 명시
- [ ] 모바일: 알림 탭 리스너 (`addNotificationResponseReceivedListener`)

---

## 계획된 신규 기능

### ~~1. 영수증 스캔~~ → 완료 (2026-03-15)

### ~~2. 유통기한 자동 제안~~ → 완료 (2026-04-02)
> 식재료 이름 입력 시 ShelfLife DB를 활용하여 유통기한 자동 제안

### ~~3. 장보기 추천~~ → 완료 (2026-04-11)
> 소비 이력 패턴 분석 → 단골 식재료 감지 → 쇼핑 리스트 자동 생성 + 장보기 날짜 추천 (규칙 기반, Claude API 미사용)

### ~~4. 식재료 검색/필터~~ → 완료 (2026-04-11)
> 홈 화면에 검색바 + 상태/카테고리/냉장고 필터 칩. 클라이언트 사이드 즉시 필터링

### ~~5. 소비 통계~~ → 완료 (2026-04-11)
> 월별 구매/소비/폐기 통계 + 카테고리 분포 + TOP 랭킹. soft delete로 폐기 데이터 보존

---

### 6. 레시피 추천
> 냉장고에 있는 식재료로 만들 수 있는 요리와 레시피를 AI가 추천

**필요한 작업**
- [ ] `@anthropic-ai/sdk` 설치 + `.env`에 `ANTHROPIC_API_KEY` 추가
- [ ] API: `ai` 모듈 — `POST /api/ai/recipe-suggestions` (냉장고 식재료 목록 → Claude API → 레시피 추천)
- [ ] API: 프롬프트 설계 (보유 식재료, 카테고리, 수량 전달 → 요리명/재료/조리법/난이도 반환)
- [ ] 공유 타입: `RecipeSuggestion`, `RecipeIngredient` 등
- [ ] 모바일: 레시피 추천 화면 (탭 or 홈에서 진입)
- [ ] 모바일: 레시피 카드 (요리명, 소요 시간, 난이도, 재료 목록)
- [ ] 모바일: "이 재료 소비" 버튼 → `isConsumed: true` + `consumedAt` 일괄 처리
- [ ] 로딩 UX (Claude API 응답 대기 중 스켈레톤/스피너)

---

### 7. 장보기 추천 AI 강화 (추후)
> 현재 규칙 기반 추천을 Claude API로 고도화 — 레시피 연계, 계절 추천 등

**필요한 작업**
- [ ] 레시피 추천과 연계: "이 레시피에 부족한 재료" → 장보기 리스트 자동 추가
- [ ] 계절/날씨 기반 추천 (현재 월, 제철 식재료)
- [ ] 영양 균형 분석 (최근 소비 패턴 기반 부족 영양소 추천)

---

### 8. 냉장고 공유 (가족 기능)
> 가족 구성원이 같은 냉장고를 공유하여 함께 식재료를 관리

**필요한 작업**
- [ ] Prisma: `RefrigeratorMember` 모델 (userId + refrigeratorId + role) 또는 다대다 관계
- [ ] API: 냉장고 초대/수락/탈퇴 엔드포인트
- [ ] API: 공유 냉장고의 식재료 조회 시 모든 멤버의 아이템 포함
- [ ] 모바일: 냉장고 설정에서 "멤버 초대" (초대 코드 or 링크)
- [ ] 모바일: 멤버 목록/관리 UI
- [ ] 알림: 공유 냉장고 변경 사항 푸시 알림

---

### 9. 알림 시간 커스터마이징
> 현재 오전 9시 고정 → 사용자가 원하는 시간과 D-day 기준을 설정
> 상세 계획 및 테스트 가이드: **[docs/PUSH_NOTIFICATION_TEST.md](docs/PUSH_NOTIFICATION_TEST.md)**

**필요한 작업**
- [ ] Prisma: `User`에 `notifyEnabled(Boolean)`, `notifyTime(String "HH:mm")`, `notifyDaysBefore(Int[])` 필드 추가 + 마이그레이션
- [ ] API: `PATCH /api/users/me/notification-settings` 엔드포인트 (JWT 보호)
- [ ] API: `GET /api/users/me` 응답에 알림 설정 포함
- [ ] API: 스케줄러 변경 — 매시간 Cron → 해당 시간대 유저만 필터링하여 발송, `notifyDaysBefore` 동적 조회
- [ ] 모바일: 알림 설정 전용 UI (ON/OFF 토글 + TimePicker + D-day 다중선택 칩)
- [ ] 모바일: 설정 변경 시 API 호출 + optimistic update

---

### 10. 바코드 스캔
> 제품 바코드를 스캔하여 식재료 정보 자동 입력

**필요한 작업**
- [ ] `expo-barcode-scanner` 또는 `expo-camera` 바코드 모드 설치
- [ ] 외부 API 연동 (식품안전나라 OpenAPI 또는 상품 DB)
- [ ] API: 바코드 → 상품 정보 조회 프록시 엔드포인트
- [ ] 모바일: 추가 화면에 "바코드 스캔" 버튼 + 카메라 뷰
- [ ] 바코드 인식 → 상품명/카테고리/유통기한 자동 채움

---

### 11. iOS 위젯
> 만료 임박 식재료를 홈 화면 위젯으로 빠르게 확인

**필요한 작업**
- [ ] `expo-widgets` 또는 네이티브 WidgetKit 모듈
- [ ] 위젯 데이터 공유 (App Groups + UserDefaults 또는 로컬 DB)
- [ ] Small/Medium 위젯: 임박 아이템 3~5개 표시 (이모지 + 이름 + D-day)

---

### 12. 데이터 내보내기/백업
> 식재료 데이터를 CSV/JSON으로 내보내기, 또는 클라우드 백업

**필요한 작업**
- [ ] API: `GET /api/food-items/export?format=csv|json` 엔드포인트
- [ ] 모바일: 설정 → "데이터 내보내기" (공유 시트로 파일 전송)
- [ ] (선택) iCloud/Google Drive 자동 백업

---

## 신규 기능 공통 사항

### Claude API 연동 구조 (레시피 추천 시 사용 예정)
```
모바일 → 서버 AI 엔드포인트 → Claude API (Anthropic SDK) → 결과 반환 → 모바일
```
- 모든 AI 처리는 서버에서 수행 (API 키 보안)
- `@anthropic-ai/sdk` 를 `apps/api`에 추가
- `.env`에 `ANTHROPIC_API_KEY` 추가

### 네비게이션 탭 구성
```
현재: 냉장고 | 추가 | 쇼핑 | 통계 | 설정   (5탭)
      snow-outline / add-circle-outline / cart-outline / stats-chart-outline / settings-outline
      알림은 홈 헤더 우측 벨 아이콘 (숨김 라우트 `alerts.tsx`)
향후: 레시피 탭 추가 시 재구성 예정
```

---

## 개발 환경 실행 방법

> 상세 가이드: **[docs/DEV_SETUP.md](docs/DEV_SETUP.md)** (터미널 명령어 순서, 시뮬레이터 유틸, 클린 빌드 등)

### 빠른 시작 (이미 초기 설정 완료 시)
```bash
# 1. DB 시작
docker start freshbox-postgres

# 2. API 서버 [터미널 1]
cd /Users/kang-yeongmo/App/freshbox && pnpm --filter=@freshbox/api dev

# 3. 모바일 앱 [터미널 2] — 포그라운드 필수
cd /Users/kang-yeongmo/App/freshbox/apps/mobile && pnpm ios   # 최초/네이티브 변경
cd /Users/kang-yeongmo/App/freshbox/apps/mobile && pnpm dev   # JS만 변경
```

---

## 주요 파일 경로

### API (`apps/api/src/`)
| 파일 | 역할 |
|------|------|
| `main.ts` | Fastify bootstrap, 포트 3000, 글로벌 prefix `/api` |
| `auth/auth.controller.ts` | OAuth 콜백, JWT 리프레시, 로그아웃, /me |
| `auth/auth.service.ts` | loginWithKakao/Naver/Google, generateTokens |
| `auth/strategies/kakao.strategy.ts` | 카카오 axios 기반 커스텀 전략 |
| `auth/strategies/naver.strategy.ts` | 네이버 axios 기반 커스텀 전략 |
| `auth/strategies/google.strategy.ts` | 구글 axios 기반 커스텀 전략 |
| `auth/strategies/jwt.strategy.ts` | passport-jwt 전략 |
| `food-items/food-items.service.ts` | CRUD + findExpiringSoon |
| `food-items/food-items.controller.ts` | REST endpoints |
| `food-items/dto/create-food-item.dto.ts` | 위치 필드 포함 (refrigeratorId, zone, shelf, depth, colPosition) |
| `refrigerators/refrigerators.service.ts` | 냉장고 CRUD (userId 소유권 검증) |
| `refrigerators/refrigerators.controller.ts` | JWT 보호 REST endpoints |
| `notifications/notifications.scheduler.ts` | Cron `0 9 * * *`, Expo Push API |
| `receipt/receipt-parser.service.ts` | OCR 텍스트 → 정규식/휴리스틱 파싱 (품목/수량/날짜 추출) |
| `receipt/receipt.controller.ts` | `POST /api/receipt/parse` |
| `shelf-life/shelf-life.service.ts` | 유통기한 DB 조회 (정확/부분/카테고리 폴백) |
| `shelf-life/shelf-life.controller.ts` | `GET /api/shelf-life`, `GET /api/shelf-life/search` |
| `shopping/shopping.controller.ts` | 장보기 리스트 CRUD + 아이템 CRUD + 구매→냉장고 추가 |
| `shopping/shopping.service.ts` | ShoppingList/ShoppingItem CRUD + 추천→리스트 자동 생성 |
| `shopping/shopping-recommendation.service.ts` | 소비 이력 패턴 분석 → 단골 감지 → 추천 생성 |
| `prisma/prisma.service.ts` | PrismaClient 싱글턴 |
| `prisma/schema.prisma` | User + FoodItem + Refrigerator + FoodShelfLife + ShoppingList + ShoppingItem + enums |
| `prisma/seed.ts` | FoodShelfLife 시드 데이터 (120개+ 식재료 + 카테고리 폴백) |

### 모바일 (`apps/mobile/`)
| 파일 | 역할 |
|------|------|
| `app/_layout.tsx` | 루트 레이아웃, QueryClientProvider, Auth Guard, 모달 라우트 |
| `app/(auth)/login.tsx` | SNS 로그인 화면 (카카오/네이버/구글 버튼) |
| `app/(tabs)/index.tsx` | 홈 — 통계 요약 + 냉장고 카드 + 최근 추가 + 미분류 + 온보딩 |
| `app/(tabs)/add.tsx` | 식재료 추가 (영수증 스캔 버튼 포함) |
| `app/(tabs)/receipt-scan.tsx` | 영수증 스캔 — 이미지 선택 → OCR → 파싱 → 미리보기 → 일괄 추가 |
| `app/(tabs)/edit.tsx` | 식재료 수정 (탭바 숨김, 라우트로만 접근) |
| `app/(tabs)/shopping.tsx` | 장보기 — 추천 + 체크리스트 + 수동 추가 |
| `app/(tabs)/shopping-history.tsx` | 지난 장보기 이력 (탭바 숨김) |
| `app/(tabs)/alerts.tsx` | 유통기한 임박 목록 |
| `app/(tabs)/settings.tsx` | 설정 — 프로필, 냉장고 관리, 알림, 로그아웃, 앱 정보 |
| `app/modals/refrigerator-setup.tsx` | 냉장고 등록/수정/삭제 모달 |
| `app/modals/shelf-detail.tsx` | 선반 상세 모달 (해당 층 식재료 목록) |
| `store/auth.store.ts` | Zustand + SecureStore 토큰 관리 |
| `store/theme.store.ts` | Zustand 테마 스토어 (system/light/dark + AsyncStorage) |
| `constants/colors.ts` | 라이트/다크 색상 팔레트 (ThemeColors 인터페이스) |
| `services/api.ts` | axios 인스턴스 + JWT 인터셉터 + receiptApi/shelfLifeApi 포함 |
| `services/ocr.ts` | ML Kit 온디바이스 텍스트 인식 유틸 |
| `hooks/useRefrigerators.ts` | 냉장고 CRUD React Query 훅 |
| `hooks/useReceiptScan.ts` | 영수증 파싱 + 일괄 추가 React Query 훅 |
| `hooks/useShopping.ts` | 장보기 추천/리스트/아이템 React Query 훅 (11개) |
| `components/shopping/SuggestedDateCard.tsx` | 장보기 날짜 제안 헤더 카드 |
| `components/shopping/RecommendationCard.tsx` | 추천 아이템 카드 (이모지 + 사유 뱃지) |
| `components/shopping/ShoppingItemRow.tsx` | 체크리스트 아이템 (체크박스 + 스와이프 삭제) |
| `components/shopping/AddItemInline.tsx` | 수동 추가 인라인 폼 |
| `components/FoodForm.tsx` | 식재료 입력 폼 (5단계 위치 선택 UI) |
| `components/refrigerator/fridgeConfigs.ts` | 5종 냉장고 타입별 구역/층 설정 + `splitZones()` 유틸 |
| `components/refrigerator/FlatShelf.tsx` | 2D 선반 아이템 렌더링 (compact 모드 지원) |
| `components/refrigerator/DoorBinColumn.tsx` | 문선반 칼럼 (이모지 전용, 투명 선반 구분선) |
| `components/refrigerator/RefrigeratorView.tsx` | 3열 레이아웃 + translateX 도어 + 3D 효과 (expo-linear-gradient) |
| `components/refrigerator/IsometricShelf.tsx` | SVG 아이소메트릭 선반 (유통기한 색상 원형, 레거시) |
| `components/refrigerator/ZoneSection.tsx` | 구역별 선반 적층 렌더링 (레거시) |
| `constants/categoryEmoji.ts` | 카테고리 → 이모지 매핑 (9종, 폴백용) |
| `constants/foodEmoji.ts` | 식재료명 → 개별 이모지 매핑 (200+ 키워드) + `getFoodEmoji()` |
| `metro.config.js` | NativeWind + pnpm symlink + pnpm store 경로 설정 |
| `babel.config.js` | jsxImportSource: nativewind |

### 공유 타입 (`packages/types/src/index.ts`)
- `Category`, `FoodItem`, `User`
- `Refrigerator`, `RefrigeratorType`, `REFRIGERATOR_TYPE_LABELS`
- `CreateFoodItemDto`, `UpdateFoodItemDto` (위치 필드 포함)
- `CreateRefrigeratorDto`, `UpdateRefrigeratorDto`
- `ReceiptItem`, `ParseReceiptRequest/Response`, `BulkCreateFoodItemDto/Response`
- `FoodShelfLife`, `StorageMethod`
- `ShoppingList`, `ShoppingItem`, `RecommendedItem`, `RecommendedItemReasonType`
- `ShoppingRecommendationResponse`
- `CreateShoppingListDto`, `UpdateShoppingListDto`, `AddShoppingItemDto`, `UpdateShoppingItemDto`, `PurchaseAndAddDto`
- `AuthTokens`, `LoginResponse`

---

## 환경변수 (`apps/api/.env`)

```env
DATABASE_URL="postgresql://freshbox:freshbox1234@localhost:5432/freshbox?schema=public"
JWT_SECRET="freshbox-dev-jwt-secret-change-in-production"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
APP_URL="http://localhost:3000"
MOBILE_DEEP_LINK="freshbox://"

# 아래 키를 각 플랫폼 개발자 콘솔에서 발급받아 입력
KAKAO_CLIENT_ID="your-kakao-rest-api-key"
KAKAO_REDIRECT_URI="http://localhost:3000/api/auth/kakao/callback"
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"
NAVER_REDIRECT_URI="http://localhost:3000/api/auth/naver/callback"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

---

## API 엔드포인트

```
# Auth
GET    /api/auth/kakao              ← 카카오 OAuth 시작
GET    /api/auth/kakao/callback     ← 카카오 OAuth 콜백 → JWT 발급 → 딥링크로 앱에 전달
GET    /api/auth/naver              ← 네이버 OAuth 시작
GET    /api/auth/naver/callback
GET    /api/auth/google
GET    /api/auth/google/callback
POST   /api/auth/refresh            ← JWT 리프레시
DELETE /api/auth/logout
GET    /api/auth/me                 ← 내 정보 조회

# Food Items (JWT 필요)
GET    /api/food-items              ← 목록 (query: category, location, expiringSoon, isConsumed)
POST   /api/food-items
POST   /api/food-items/bulk         ← 일괄 추가 (영수증 스캔용)
GET    /api/food-items/:id
PATCH  /api/food-items/:id
DELETE /api/food-items/:id

# Receipt (JWT 필요)
POST   /api/receipt/parse           ← OCR 텍스트 → 품목 파싱

# Shelf Life (JWT 필요)
GET    /api/shelf-life              ← 전체 유통기한 목록
GET    /api/shelf-life/search       ← 유통기한 검색 (query: q)

# Refrigerators (JWT 필요)
GET    /api/refrigerators           ← 내 냉장고 목록
POST   /api/refrigerators           ← 냉장고 등록
PATCH  /api/refrigerators/:id       ← 냉장고 수정 (이름/색상/순서)
DELETE /api/refrigerators/:id       ← 냉장고 삭제 (food items는 SetNull)

# Users (JWT 필요)
PATCH  /api/users/me/push-token     ← 푸시 토큰 저장

# Shopping (JWT 필요)
GET    /api/shopping/recommendations              ← 추천 조회 (on-the-fly 패턴 분석)
GET    /api/shopping/lists                         ← 장보기 목록 (query: isCompleted)
POST   /api/shopping/lists                         ← 새 리스트
POST   /api/shopping/lists/from-recommendations    ← 추천으로 리스트 자동 생성
GET    /api/shopping/lists/:id                     ← 단건 조회 (items 포함)
PATCH  /api/shopping/lists/:id                     ← 수정 (name, isCompleted)
DELETE /api/shopping/lists/:id                     ← 삭제
POST   /api/shopping/lists/:id/items               ← 아이템 추가
PATCH  /api/shopping/lists/:id/items/:itemId       ← 아이템 수정 (isPurchased 등)
DELETE /api/shopping/lists/:id/items/:itemId       ← 아이템 삭제
POST   /api/shopping/lists/:id/items/:itemId/purchase  ← 구매 완료 + 냉장고 추가
```

---

## OAuth 딥링크 플로우

```
앱 → expo-web-browser로 서버 OAuth URL 열기
  → 유저가 SNS 로그인
  → 서버 콜백 처리 → JWT 발급
  → 서버가 freshbox://auth/callback?accessToken=...&refreshToken=... 로 리다이렉트
  → 앱이 딥링크 수신 → SecureStore에 토큰 저장 → 홈으로 이동
```

---

## 알려진 이슈 및 해결책

| 이슈 | 해결책 |
|------|--------|
| pnpm + Metro 모듈 해석 실패 | `.npmrc`에 `shamefully-hoist=true` 설정 (이미 적용됨) |
| 포트 8081 점유 (Docker backend) | `--port 8082` 고정 (package.json 스크립트에 반영됨) |
| iOS 빌드 후 헤더 파일 오류 | `ios/` 폴더 + Xcode DerivedData 삭제 후 재빌드 |
| `@freshbox/types` dist 없음 | `pnpm --filter=@freshbox/types build` 먼저 실행 |
| Xcode 경로 이슈 | `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` |
| Metro 시작 시 Expo Go 자동 설치 시도 | `--dev-client` 플래그 사용, Expo Go는 시뮬레이터에서 제거됨 |
| OAuth 로그인 후 로그인 화면으로 복귀 | `openAuthSessionAsync`의 return값에서 직접 URL 파싱 (login.tsx `handleOAuth` 참고) |
| Prisma client 타입 오류 (`user` 없음) | `pnpm --filter=@freshbox/api prisma:generate` 실행 필요 |
| pod install "pathname contains null byte" (react-native-svg 설치 후) | `cd apps/mobile/ios && pod install --repo-update` 먼저 실행 후 `pnpm ios` |
| `react-native-css-interop/jsx-runtime` module not found | `metro.config.js`에 `unstable_enableSymlinks = true` + `node_modules/.pnpm/node_modules` 경로 추가 (이미 적용됨) |
| `RNSVGSvgView` 컴포넌트 없음 에러 | react-native-svg 네이티브 모듈 → `pnpm ios`로 전체 재빌드 필요 |
| Green screen / HostTarget crash | `pnpm ios`를 반드시 포그라운드(터미널 직접)로 실행. `&` 백그라운드 실행 금지 |
| API 서버 `PrismaClientInitializationError` | Docker Desktop이 실행 중인지 확인 후 `docker start freshbox-postgres` |
| `expo-linear-gradient` 모듈 해석 실패 | pnpm 심링크 문제 → `pnpm ios`로 네이티브 리빌드하면 해결. JS만 변경 시 Metro 캐시 클리어: `npx expo start --dev-client --port 8082 --clear` |
| `@react-native-ml-kit/text-recognition` pod install 실패 (deployment target) | ML Kit이 iOS 15.5+ 요구하지만 프로젝트 기본 15.1 → **해결: ML Kit 제거 후 서버 사이드 OCR로 대체** (`services/ocr.ts`에서 `POST /receipt/ocr`로 이미지 전송). ML Kit은 디바이스 전용 바이너리(MLImage.framework)를 포함하여 Apple Silicon 시뮬레이터에서 링킹 오류 발생 |
| `xcodebuild` 시뮬레이터 destination 못 찾음 (error code 70) | Xcode 26.x + expo prebuild 조합에서 발생. `npx expo prebuild --clean --platform ios` 후 `pnpm ios` 재빌드로 해결. DerivedData 캐시도 정리: `rm -rf ~/Library/Developer/Xcode/DerivedData/app-*` |
| `expo-image-picker` 모듈 없음 (Metro 빨간 화면) | `npx expo install expo-image-picker` 설치 후 `pnpm ios` 네이티브 리빌드 필요 (네이티브 모듈) |

---

## Prisma 스키마 요약

```
User: id, email, name, kakaoId, naverId, googleId, pushToken, timestamps
      → refrigerators Refrigerator[], shoppingLists ShoppingList[]

FoodItem: id, name, category(enum), quantity, unit, purchasedAt, expiresAt,
          location(레거시), memo, isConsumed, timestamps, userId(FK)
          refrigeratorId(FK→Refrigerator, nullable), zone, shelf(Int), depth, colPosition

Refrigerator: id, name, type(RefrigeratorType), color, sortOrder, userId(FK), timestamps

FoodShelfLife: id, name, category(enum), defaultDays(Int), storageMethod(StorageMethod), timestamps
              @@unique([name, storageMethod])

Category enum: VEGETABLES, FRUITS, MEAT, SEAFOOD, DAIRY, BEVERAGE, CONDIMENT, FROZEN, OTHER
RefrigeratorType enum: STANDARD, SIDE_BY_SIDE, FRENCH_DOOR, FREEZER, KIMCHI
ShoppingList: id, name?, suggestedDate?, isCompleted, userId(FK), timestamps
              → items ShoppingItem[]

ShoppingItem: id, name, category?(enum), quantity, unit, isPurchased, isRecommended, reason?,
              shoppingListId(FK→ShoppingList), timestamps

StorageMethod enum: REFRIGERATED, FROZEN, ROOM_TEMP
```
