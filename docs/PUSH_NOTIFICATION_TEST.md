# 푸시 알림 수신 테스트 가이드

## 왜 실기기가 필요한가?

- iOS 시뮬레이터는 APNs(Apple Push Notification Service)를 지원하지 않음
- Expo 푸시는 `Expo → APNs/FCM → 기기`로 전달되므로 물리 기기 필수
- `Notifications.getExpoPushTokenAsync()`도 시뮬레이터에서는 실패하거나 더미 토큰 반환

---

## 테스트 단계

### Step 1: 사전 준비

| 필요 항목 | 설명 |
|-----------|------|
| iPhone 실기기 | USB 연결 또는 같은 Wi-Fi |
| Apple Developer 계정 | 무료도 가능 (프로비저닝 설정 필요) |
| Expo Go 앱 | App Store에서 설치, 또는 Development Build |

### Step 2: 실기기에서 앱 실행

```bash
# 방법 A: Expo Go (가장 간단)
cd /Users/kang-yeongmo/App/freshbox/apps/mobile
pnpm dev
# → QR 코드를 iPhone 카메라로 스캔 → Expo Go에서 열림

# 방법 B: Development Build (네이티브 모듈 필요 시)
pnpm expo run:ios --device
# → 연결된 실기기 선택
```

### Step 3: 토큰 등록 확인

1. 앱에서 로그인
2. 알림 권한 요청 팝업 → **"허용"**
3. 서버 로그에서 `POST /api/auth/push-token` 호출 확인
4. DB에서 해당 유저의 `pushToken` 값 확인:

```bash
cd /Users/kang-yeongmo/App/freshbox
pnpm --filter=@freshbox/api prisma studio
# → User 테이블에서 pushToken 필드가 "ExponentPushToken[...]" 형태인지 확인
```

### Step 4: 즉시 발송 테스트

Cron(매일 09:00)을 기다리지 않고 바로 테스트하는 3가지 방법:

#### 방법 A: Expo Push Tool (가장 간단)

1. https://expo.dev/notifications 접속
2. `ExponentPushToken[...]` 입력
3. 제목/본문 입력 후 "Send" 클릭
4. 기기에서 알림 수신 확인

#### 방법 B: curl로 Expo Push API 직접 호출

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[여기에_토큰]",
    "title": "FreshBox 유통기한 알림",
    "body": "3일 후 유통기한이 만료돼요: 우유, 계란"
  }'
```

#### 방법 C: 스케줄러 Cron 주기 임시 변경

```typescript
// notifications.scheduler.ts에서 임시로 변경
@Cron('*/1 * * * *')  // 1분마다 실행 (테스트 후 반드시 원복)
```

### Step 5: 상태별 확인 체크리스트

| 상태 | 테스트 항목 | 확인 방법 |
|------|-----------|----------|
| 포그라운드 | 앱을 열어놓은 상태에서 알림 수신 | 배너가 뜨는지 확인 |
| 백그라운드 | 앱을 홈으로 보낸 상태에서 수신 | 알림 센터에 표시되는지 |
| 킬 상태 | 앱을 완전히 종료한 상태에서 수신 | 알림 센터에 표시되는지 |
| 알림 탭 | 알림 배너/센터에서 탭 | 앱이 열리는지 |
| 배지 | 알림 수신 후 | 앱 아이콘에 배지 표시되는지 |

### Step 6: 현재 미구현 사항 (테스트 불가)

- 알림 탭 시 `alerts.tsx`로 자동 이동 → `addNotificationResponseReceivedListener` 미구현
- 백그라운드 알림 데이터 처리 → 리스너 미구현

---

## 알림 시간 커스터마이징 구현 계획

### 변경 영역

| 영역 | 작업 |
|------|------|
| **Prisma** | User에 `notifyEnabled`, `notifyTime`, `notifyDaysBefore` 필드 추가 |
| **API** | `PATCH /api/users/me/notification-settings` 엔드포인트 |
| **스케줄러** | 사용자별 알림 시간에 맞춰 발송하도록 로직 변경 (시간대별 배치) |
| **모바일** | 설정 화면에 알림 ON/OFF 토글 + 시간 선택(TimePicker) + D-day 기준 선택 |

### 구체적 작업 목록

**Prisma 스키마**
- `notifyEnabled Boolean @default(true)` — 알림 ON/OFF
- `notifyTime String @default("09:00")` — 알림 시간 (HH:mm)
- `notifyDaysBefore Int[] @default([1, 3])` — D-day 기준 배열

**API 엔드포인트**
- `PATCH /api/users/me/notification-settings` — JWT 보호
- 요청: `{ notifyEnabled?, notifyTime?, notifyDaysBefore? }`
- `GET /api/users/me` 응답에 알림 설정 포함

**스케줄러 변경**
- 현재: `@Cron('0 9 * * *')` 고정 → 모든 유저 동시 발송
- 변경: 매시간(또는 30분마다) Cron 실행 → 해당 시간대 유저만 필터링하여 발송
- `notifyEnabled: false`인 유저는 스킵
- `notifyDaysBefore` 배열에 따라 D-day 기준 동적 조회

**모바일 설정 UI**
- 알림 ON/OFF 토글 (Switch)
- 시간 선택: `@react-native-community/datetimepicker` (이미 설치됨)
- D-day 기준: 다중 선택 칩 (D-1, D-3, D-7)
- 설정 변경 시 `PATCH` API 호출 + optimistic update

### 현재 알림 흐름 요약

```
토큰 등록: 모바일 로그인 → registerForPushNotifications() → POST /api/auth/push-token → DB 저장
스케줄링:  Cron 0 9 * * * → findExpiringSoon(3) + findExpiringSoon(1) → 사용자별 그룹화
발송:      expo-server-sdk → Expo Push API → APNs/FCM → 기기
수신:      setNotificationHandler (포그라운드 자동 표시) — 리스너는 미구현
알림 화면: alerts.tsx (만료 임박 식재료 조회 + 스와이프 소비/폐기)
```
