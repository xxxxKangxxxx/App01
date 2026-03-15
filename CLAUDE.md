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
| 알림 | expo-server-sdk + @nestjs/schedule (Cron) |
| 토큰 저장 | expo-secure-store |
| SVG/3D | react-native-svg + expo-linear-gradient (3D 냉장고 뷰) |
| 아이콘 | @expo/vector-icons (Ionicons) — UI 아이콘 전담 |
| 날짜 선택 | @react-native-community/datetimepicker (네이티브) |
| OCR | @react-native-ml-kit/text-recognition (온디바이스) |
| 이미지 선택 | expo-image-picker (카메라 + 갤러리) |

---

## 현재 개발 상태 (2026-03-15 업데이트, 3차)

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

### 남은 작업 — UI 개선 (진행 중)
- [ ] 다크모드 지원
- [ ] 온보딩/튜토리얼 플로우
- [ ] 로그인 화면 브랜딩 강화

### 남은 작업 — OAuth / 알림
- [ ] 카카오 개발자 앱 등록 → `KAKAO_CLIENT_ID` 입력 후 E2E 테스트
- [ ] 네이버 개발자 앱 등록 → `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 입력 후 E2E 테스트
- [ ] 푸시 알림 수신 테스트

---

## 계획된 신규 기능

### ~~1. 영수증 스캔~~ → 완료 (2026-03-15)

### 2. 유통기한 자동 제안
> 식재료 이름 입력 시 ShelfLife DB를 활용하여 유통기한 자동 제안 (영수증 스캔에서 부분 구현됨)

**필요한 작업**
- [ ] 모바일: `FoodForm`에서 이름 입력 시 `shelf-life/search` API 호출 → 유통기한 자동 입력

---

### 3. 레시피 추천
> 냉장고에 있는 식재료로 만들 수 있는 요리와 레시피를 AI가 추천

**필요한 작업**
- [ ] API 서버에 `/ai/recipe-suggestions` 엔드포인트 추가
- [ ] 모바일: 레시피 추천 탭 (`app/(tabs)/recipes.tsx`)
- [ ] 레시피 → "이 재료 소비" 버튼으로 `isConsumed: true` 일괄 처리

---

### 4. 장보기 추천 — 쇼핑 리스트 & 날짜 제안
> 소비·구매 패턴을 분석해 다음 장보기 날짜와 필요한 쇼핑 리스트를 추천

**필요한 작업**
- [ ] Prisma 스키마: `ShoppingList` 모델 추가
- [ ] API 서버에 `/ai/shopping-suggestion` + `/shopping-lists` CRUD 추가
- [ ] 모바일: 쇼핑 리스트 화면 (`app/(tabs)/shopping.tsx`)

---

## 신규 기능 공통 사항

### Claude API 연동 구조
```
모바일 → 서버 AI 엔드포인트 → Claude API (Anthropic SDK) → 결과 반환 → 모바일
```
- 모든 AI 처리는 서버에서 수행 (API 키 보안)
- `@anthropic-ai/sdk` 를 `apps/api`에 추가
- `.env`에 `ANTHROPIC_API_KEY` 추가

### 네비게이션 탭 구성 변경 (예정)
```
현재: 냉장고 | 추가 | 알림 | 설정   (Ionicons: snow-outline / add-circle-outline / notifications-outline / settings-outline)
변경: 냉장고 | 스캔 | 레시피 | 쇼핑 | 설정
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
| `prisma/prisma.service.ts` | PrismaClient 싱글턴 |
| `prisma/schema.prisma` | User + FoodItem + Refrigerator + FoodShelfLife + enums |
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
| `app/(tabs)/alerts.tsx` | 유통기한 임박 목록 |
| `app/(tabs)/settings.tsx` | 설정 — 프로필, 냉장고 관리, 알림, 로그아웃, 앱 정보 |
| `app/modals/refrigerator-setup.tsx` | 냉장고 등록/수정/삭제 모달 |
| `app/modals/shelf-detail.tsx` | 선반 상세 모달 (해당 층 식재료 목록) |
| `store/auth.store.ts` | Zustand + SecureStore 토큰 관리 |
| `services/api.ts` | axios 인스턴스 + JWT 인터셉터 + receiptApi/shelfLifeApi 포함 |
| `services/ocr.ts` | ML Kit 온디바이스 텍스트 인식 유틸 |
| `hooks/useRefrigerators.ts` | 냉장고 CRUD React Query 훅 |
| `hooks/useReceiptScan.ts` | 영수증 파싱 + 일괄 추가 React Query 훅 |
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
      → refrigerators Refrigerator[]

FoodItem: id, name, category(enum), quantity, unit, purchasedAt, expiresAt,
          location(레거시), memo, isConsumed, timestamps, userId(FK)
          refrigeratorId(FK→Refrigerator, nullable), zone, shelf(Int), depth, colPosition

Refrigerator: id, name, type(RefrigeratorType), color, sortOrder, userId(FK), timestamps

FoodShelfLife: id, name, category(enum), defaultDays(Int), storageMethod(StorageMethod), timestamps
              @@unique([name, storageMethod])

Category enum: VEGETABLES, FRUITS, MEAT, SEAFOOD, DAIRY, BEVERAGE, CONDIMENT, FROZEN, OTHER
RefrigeratorType enum: STANDARD, SIDE_BY_SIDE, FRENCH_DOOR, FREEZER, KIMCHI
StorageMethod enum: REFRIGERATED, FROZEN, ROOM_TEMP
```
