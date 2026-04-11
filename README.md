# 손안의냉장고

냉장고 식재료 스마트 관리 앱 — 유통기한 추적, 영수증 스캔, 장보기 추천까지

## 주요 기능

- **냉장고 3D 뷰** — 5종 냉장고 타입별 3열 레이아웃, 도어 애니메이션, 구역/층/깊이 위치 관리
- **식재료 관리** — CRUD + 카테고리/위치 필터 + 200개 식재료 이모지 매핑
- **영수증 스캔** — 이미지 촬영/갤러리 → 서버 OCR → 품목 자동 파싱 → 일괄 추가
- **유통기한 자동 제안** — 식재료명 입력 시 120개+ DB에서 유통기한 자동 추천
- **장보기 추천** — 소비 패턴 분석 → 단골 식재료 감지 → 쇼핑 리스트 자동 생성 + 날짜 추천
- **구매→냉장고 연동** — 장보기 체크 시 냉장고에 자동 추가
- **유통기한 알림** — 매일 오전 9시 D-3, D-1 만료 식재료 푸시 알림
- **SNS 로그인** — 카카오/네이버/구글 OAuth
- **다크모드** — 시스템 설정/라이트/다크 3단 전환

## 기술 스택

| 영역 | 기술 |
|------|------|
| 모바일 | React Native 0.76 + Expo 52 + expo-router v4 + NativeWind v4 |
| 상태관리 | Zustand (클라이언트) + React Query (서버) |
| 백엔드 | NestJS 10 + Fastify adapter + TypeScript |
| DB | PostgreSQL 16 (Docker) + Prisma 6 ORM |
| 패키지 | pnpm Workspaces + Turborepo |
| Auth | 카카오/네이버/구글 OAuth (커스텀 전략) + JWT |
| 알림 | expo-server-sdk + @nestjs/schedule (Cron) |
| 3D/SVG | react-native-svg + expo-linear-gradient |
| 아이콘 | @expo/vector-icons (Ionicons) |

## 프로젝트 구조

```
freshbox/
├── apps/
│   ├── api/                     # NestJS 서버 (포트 3000)
│   │   ├── src/
│   │   │   ├── auth/            # OAuth + JWT
│   │   │   ├── food-items/      # 식재료 CRUD
│   │   │   ├── refrigerators/   # 냉장고 CRUD
│   │   │   ├── receipt/         # 영수증 OCR 파싱
│   │   │   ├── shelf-life/      # 유통기한 DB
│   │   │   ├── shopping/        # 장보기 추천 + 리스트
│   │   │   └── notifications/   # 푸시 알림 스케줄러
│   │   └── prisma/              # 스키마 + 마이그레이션 + 시드
│   └── mobile/                  # Expo React Native 앱
│       ├── app/
│       │   ├── (auth)/          # 로그인
│       │   ├── (tabs)/          # 탭 화면 (냉장고/추가/쇼핑/알림/설정)
│       │   └── modals/          # 냉장고 설정, 선반 상세
│       ├── components/
│       │   ├── refrigerator/    # 3D 냉장고 뷰 컴포넌트
│       │   └── shopping/        # 장보기 컴포넌트
│       ├── store/               # Zustand (auth, theme)
│       ├── services/            # API 클라이언트, OCR
│       ├── hooks/               # React Query 훅
│       └── constants/           # 색상, 이모지 매핑
├── packages/
│   └── types/                   # 공유 TypeScript 타입/DTO
├── docs/
│   └── DEV_SETUP.md             # 개발 환경 상세 가이드
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## 시작하기

### 사전 준비
- Node.js >= 20
- pnpm >= 9
- Docker (PostgreSQL 컨테이너)
- Xcode (iOS 시뮬레이터)

### 설치

```bash
cd freshbox
pnpm install
```

### 환경변수 설정

```bash
cp apps/api/.env.example apps/api/.env
# .env 파일 편집 (DB URL, OAuth 키 등 설정)
```

### DB 시작 및 마이그레이션

```bash
docker start freshbox-postgres
pnpm --filter=@freshbox/api prisma:migrate
```

### 개발 서버 실행

```bash
# 터미널 1: API 서버
pnpm --filter=@freshbox/api dev

# 터미널 2: 모바일 앱
cd apps/mobile && pnpm ios     # 최초 / 네이티브 변경 시
cd apps/mobile && pnpm dev     # JS만 변경 시
```

> 상세 가이드: [docs/DEV_SETUP.md](docs/DEV_SETUP.md)

## 탭 네비게이션

```
냉장고(snow-outline) | 추가(add-circle-outline) | 쇼핑(cart-outline) | 알림(notifications-outline) | 설정(settings-outline)
```

숨김 라우트: `edit.tsx` (식재료 수정), `receipt-scan.tsx` (영수증 스캔), `shopping-history.tsx` (지난 장보기)

## API 엔드포인트

모든 엔드포인트는 `/api` 프리픽스 사용. Auth를 제외한 엔드포인트는 JWT 인증 필요.

### Auth
| Method | Path | 설명 |
|--------|------|------|
| GET | /auth/kakao | 카카오 OAuth 시작 |
| GET | /auth/naver | 네이버 OAuth 시작 |
| GET | /auth/google | 구글 OAuth 시작 |
| POST | /auth/refresh | JWT 토큰 갱신 |
| DELETE | /auth/logout | 로그아웃 |
| GET | /auth/me | 내 정보 조회 |

### Food Items
| Method | Path | 설명 |
|--------|------|------|
| GET | /food-items | 목록 조회 (query: category, location, expiringSoon, isConsumed) |
| POST | /food-items | 등록 |
| POST | /food-items/bulk | 일괄 추가 (영수증 스캔) |
| GET | /food-items/:id | 단건 조회 |
| PATCH | /food-items/:id | 수정 |
| DELETE | /food-items/:id | 삭제 |

### Refrigerators
| Method | Path | 설명 |
|--------|------|------|
| GET | /refrigerators | 내 냉장고 목록 |
| POST | /refrigerators | 냉장고 등록 |
| PATCH | /refrigerators/:id | 수정 (이름/색상/순서) |
| DELETE | /refrigerators/:id | 삭제 |

### Receipt / Shelf Life
| Method | Path | 설명 |
|--------|------|------|
| POST | /receipt/parse | OCR 텍스트 → 품목 파싱 |
| GET | /shelf-life | 유통기한 전체 목록 |
| GET | /shelf-life/search | 유통기한 검색 (query: q) |

### Shopping
| Method | Path | 설명 |
|--------|------|------|
| GET | /shopping/recommendations | 추천 조회 (소비 패턴 분석) |
| GET | /shopping/lists | 장보기 목록 (query: isCompleted) |
| POST | /shopping/lists | 새 리스트 |
| POST | /shopping/lists/from-recommendations | 추천으로 리스트 자동 생성 |
| GET | /shopping/lists/:id | 단건 조회 |
| PATCH | /shopping/lists/:id | 수정 |
| DELETE | /shopping/lists/:id | 삭제 |
| POST | /shopping/lists/:id/items | 아이템 추가 |
| PATCH | /shopping/lists/:id/items/:itemId | 아이템 수정 |
| DELETE | /shopping/lists/:id/items/:itemId | 아이템 삭제 |
| POST | /shopping/lists/:id/items/:itemId/purchase | 구매 완료 + 냉장고 추가 |

### Users
| Method | Path | 설명 |
|--------|------|------|
| PATCH | /users/me/push-token | 푸시 토큰 저장 |

## 장보기 추천 알고리즘

규칙 기반으로 동작하며 외부 API 호출 없이 서버 DB만 사용 (비용 0원):

1. **단골 식재료 감지** — 소비 이력(`isConsumed: true`)을 이름 기준 그룹핑, 2회+ 구매 시 단골로 판정
2. **구매 주기 계산** — 각 단골 식재료의 평균 구매 간격 산출 → 다음 구매 예상일 계산
3. **3가지 추천 사유**:
   - `staple_missing` — 단골인데 현재 냉장고에 없음
   - `expiring_repurchase` — D-3 임박 + 단골 (재구매 권장)
   - `recent_consumed` — 7일 내 소비 + 단골 + 현재 없음
4. **장보기 날짜 제안** — 추천 항목 중 가장 빠른 예상 구매일 기준

## 푸시 알림

매일 오전 9시 실행 (`@Cron('0 9 * * *')`):
- D-3, D-1 유통기한 만료 식재료 사용자에게 Expo 푸시 알림 발송

## OAuth 설정

각 플랫폼 개발자 콘솔에서 앱 등록 후 `.env`에 키 입력:
- 카카오: https://developers.kakao.com
- 네이버: https://developers.naver.com
- 구글: https://console.cloud.google.com

딥링크 스킴: `freshbox://auth/callback`

## DB 스키마

```
User → Refrigerator[] → FoodItem[]
     → ShoppingList[] → ShoppingItem[]
FoodShelfLife (유통기한 시드 데이터 120개+)
```

냉장고 타입: `STANDARD` | `SIDE_BY_SIDE` | `FRENCH_DOOR` | `FREEZER` | `KIMCHI`
카테고리: `VEGETABLES` | `FRUITS` | `MEAT` | `SEAFOOD` | `DAIRY` | `BEVERAGE` | `CONDIMENT` | `FROZEN` | `OTHER`
