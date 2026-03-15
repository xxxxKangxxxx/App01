# FreshBox

냉장고 식재료 스마트 관리 앱 (MVP)

## 기술 스택

| 영역 | 기술 |
|------|------|
| 모바일 | React Native + Expo 52 (TypeScript) |
| 백엔드 | NestJS + TypeScript |
| DB | PostgreSQL + Prisma ORM |
| 패키지 | pnpm Workspaces + Turborepo |
| Auth | 카카오/네이버/구글 OAuth + JWT |
| 알림 | Expo Push Notification + NestJS Scheduler |

## 프로젝트 구조

```
freshbox/
├── apps/
│   ├── mobile/       # Expo React Native 앱
│   └── api/          # NestJS 서버
├── packages/
│   └── types/        # 공유 TypeScript 타입
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## 시작하기

### 사전 준비
- Node.js >= 20
- pnpm >= 9
- PostgreSQL

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

### DB 마이그레이션

```bash
pnpm --filter=@freshbox/api prisma:migrate
```

### 개발 서버 실행

```bash
# 전체 (API + Mobile 동시)
pnpm dev

# API만
pnpm dev --filter=@freshbox/api

# Mobile만
pnpm dev --filter=@freshbox/mobile
```

## API 엔드포인트

### Auth
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/auth/kakao | 카카오 로그인 |
| GET | /api/auth/naver | 네이버 로그인 |
| GET | /api/auth/google | 구글 로그인 |
| POST | /api/auth/refresh | 토큰 갱신 |
| DELETE | /api/auth/logout | 로그아웃 |
| GET | /api/auth/me | 내 정보 조회 |
| POST | /api/auth/push-token | 푸시 토큰 저장 |

### Food Items (JWT 필요)
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/food-items | 목록 조회 |
| POST | /api/food-items | 등록 |
| GET | /api/food-items/:id | 단건 조회 |
| PATCH | /api/food-items/:id | 수정 |
| DELETE | /api/food-items/:id | 삭제 |

### 쿼리 파라미터 (GET /api/food-items)
- `category`: VEGETABLES | FRUITS | MEAT | SEAFOOD | DAIRY | BEVERAGE | CONDIMENT | FROZEN | OTHER
- `location`: 냉장 | 냉동 | 문선반 | 실온
- `expiringSoon`: true (D-3 이내)
- `isConsumed`: true | false

## 푸시 알림

매일 오전 9시 실행 (`@Cron('0 9 * * *')`):
- D-3, D-1 유통기한 만료 식재료 사용자에게 알림 발송

테스트 시 `notifications.scheduler.ts`에서 cron 표현식을 `'* * * * *'` (매분)으로 변경 후 확인.

## OAuth 설정

각 플랫폼 개발자 콘솔에서 앱 등록 후 `.env`에 키 입력:
- 카카오: https://developers.kakao.com
- 네이버: https://developers.naver.com
- 구글: https://console.cloud.google.com

딥링크 스킴: `freshbox://auth/callback`
