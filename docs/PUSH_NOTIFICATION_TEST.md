# 푸시 알림 수신 테스트 가이드 (Development Build 전용)

본 프로젝트는 `freshbox://` 딥링크 스킴으로 카카오/네이버 OAuth가 구성되어 있고, `pnpm dev` 스크립트가 `--dev-client` 플래그로 Dev Build 전용으로 세팅되어 있음. **Expo Go는 사용하지 않음.**

---

## 왜 실기기 + Dev Build가 필요한가?

- **실기기** — iOS 시뮬레이터는 APNs를 지원하지 않고, `Notifications.getExpoPushTokenAsync()`도 시뮬레이터에서는 실패 또는 더미 토큰 반환
- **Dev Build** — OAuth 딥링크 스킴(`freshbox://`)과 앱 번들ID(`com.freshbox.app`) 유지를 위해 필수. Expo Go는 `exp://` 스킴을 써서 기존 OAuth 콘솔 설정과 맞지 않음
- 푸시 토큰도 프로덕션 번들ID로 발급되어 배포 시 그대로 유효

---

## 0. 사전 설정 (테스트 전에 반드시 확인)

### 0-1. `app.json` — `projectId` 설정

**현재 상태:** `app.json`에 `extra.eas.projectId`가 **없음** → SDK 49+에서 `getExpoPushTokenAsync()` 호출 시 경고/에러 발생.

```bash
cd /Users/kang-yeongmo/App/freshbox/apps/mobile
pnpm dlx eas-cli init      # Expo 계정 연결 + projectId 자동 생성 → app.json에 기록됨
```

수동으로 넣을 경우 `app.json`:
```json
"extra": {
  "eas": {
    "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

그리고 `registerForPushNotifications()`에서 `projectId` 명시:
```ts
import Constants from 'expo-constants';

const projectId = Constants.expoConfig?.extra?.eas?.projectId;
const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
```

### 0-2. iOS 설정 (APNs)

| 항목 | 요건 |
|------|------|
| Apple Developer 계정 | **유료($99/년) 필수** — 실기기 설치 + APNs 사용 모두 필요 |
| Push Notifications capability | `eas credentials`로 자동 설정 또는 Xcode에서 수동 활성 |
| APNs Auth Key (.p8) | Apple Developer → Keys → `+` → Apple Push Notifications service (APNs) 체크 후 다운로드 (한 번 다운로드하면 재다운로드 불가 → 안전 보관) |
| Expo에 키 업로드 | `pnpm dlx eas-cli credentials` → iOS → Push Key 업로드 |
| `UIBackgroundModes` | 백그라운드 데이터 수신 시 `app.json`의 `ios.infoPlist`에 `"UIBackgroundModes": ["remote-notification"]` 추가 |

### 0-3. Android 설정 (FCM)

> 현재 `android/` 폴더 미생성 상태. Android 테스트는 이후 단계에서 진행. iOS부터 완료 후 추가.

| 항목 | 요건 |
|------|------|
| Firebase 프로젝트 | https://console.firebase.google.com 에서 생성 |
| `google-services.json` | Firebase → 프로젝트 설정 → Android 앱 등록 (패키지명: `com.freshbox.app`) 후 다운로드 |
| FCM Server Key | Firebase → 프로젝트 설정 → Cloud Messaging → 서버 키 복사 |
| Expo에 서버 키 등록 | `pnpm dlx eas-cli credentials` → Android → FCM 서버 키 업로드 |
| `app.json` 경로 설정 | `"android": { "googleServicesFile": "./google-services.json" }` |
| Notification Channel | Android 8.0+ 필수 — `Notifications.setNotificationChannelAsync('default', {...})` 호출 추가 |

### 0-4. 권한 플로우 보강

현재 `registerForPushNotifications()`는 권한 거부 시 조용히 종료. 추가 필요:

- `getPermissionsAsync()` 먼저 체크 → `status !== 'granted'` & `canAskAgain === true`일 때만 `requestPermissionsAsync()` 호출
- 한 번 거부한 유저는 `requestPermissionsAsync()`가 다이얼로그를 띄우지 **않음** → `Linking.openSettings()`로 설정 앱 유도
- 설정 화면에 "알림 켜기" 버튼 추가 (재요청 UX)

---

## 1. Dev Build 생성

### 방법 A: 로컬 빌드 (권장 — 이미 iOS 폴더 존재)

```bash
cd /Users/kang-yeongmo/App/freshbox/apps/mobile
pnpm expo run:ios --device
# → 연결된 실기기 선택 → Xcode 빌드 → 앱 설치 → Metro 자동 연결
```

- 최초 빌드: 10~20분
- 이후 JS 변경: `pnpm dev`로 Metro만 재시작하면 됨 (네이티브 변경 없으면 재빌드 불필요)
- 실기기를 Mac에 USB 연결 필요

### 방법 B: EAS Build (클라우드 빌드 — 로컬 Xcode 환경 이슈 시)

```bash
pnpm dlx eas-cli build --profile development --platform ios
# → 빌드 완료 후 QR로 IPA 다운로드 → 기기에 설치
```

- 로컬 머신 부담 없음
- EAS 무료 티어 빌드 시간 제한 있음

---

## 2. 테스트 단계

### Step 1: 토큰 등록 확인

1. Dev Build 앱 실행 → 로그인 (카카오/네이버/구글)
2. 알림 권한 요청 팝업 → **"허용"**
3. 서버 로그에서 `POST /api/auth/push-token` 호출 확인
4. DB에서 `pushToken` 확인:

```bash
cd /Users/kang-yeongmo/App/freshbox
pnpm --filter=@freshbox/api prisma studio
# → User 테이블에서 pushToken이 "ExponentPushToken[...]" 형태인지 확인
```

> 토큰이 `null`이거나 `ExponentPushToken`으로 시작하지 않으면 0-1(projectId) 누락 또는 0-2(APNs 키 업로드) 미완 가능성이 큼.

### Step 2: 즉시 발송 테스트

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
응답의 `data[].id`는 receipt 조회에 사용됨 (Step 3 참고).

#### 방법 C: 스케줄러 Cron 주기 임시 변경 ⚠️

```typescript
// apps/api/src/notifications/notifications.scheduler.ts
@Cron('*/1 * * * *')  // 1분마다 실행
```

> **⚠️ 반드시 원복할 것.** 테스트 후 `'0 9 * * *'`로 되돌리지 않으면 배포 시 매분 알림 폭탄. 브랜치를 나눠 작업하고, 커밋 전에 `git diff`로 확인 권장.

### Step 3: 전달 확인 (Expo Push Receipt)

`sendPushNotificationsAsync` 응답의 `id`를 모아서 15분~24시간 내 조회:

```bash
curl -X POST https://exp.host/--/api/v2/push/getReceipts \
  -H "Content-Type: application/json" \
  -d '{ "ids": ["receipt-id-1", "receipt-id-2"] }'
```

응답 예시:
```json
{
  "data": {
    "receipt-id-1": { "status": "ok" },
    "receipt-id-2": {
      "status": "error",
      "message": "...",
      "details": { "error": "DeviceNotRegistered" }
    }
  }
}
```

**주요 에러 코드:**
- `DeviceNotRegistered` — 토큰 만료/앱 삭제 → DB에서 `pushToken = null` 처리 필요
- `MessageTooBig` — payload 4KB 초과
- `MessageRateExceeded` — 유저 단위 속도 제한
- `InvalidCredentials` — APNs/FCM 키 설정 오류 → 0-2/0-3 재확인

> **현재 구현 미비:** `NotificationsService`는 receipt 조회/에러 처리 로직이 없음. 무효 토큰이 DB에 남아 Expo에 계속 발송됨. 9번 이슈(알림 시간 커스터마이징)와 함께 receipt polling 추가 고려.

### Step 4: 상태별 확인 체크리스트

| 상태 | 테스트 항목 | 확인 방법 |
|------|-----------|----------|
| 포그라운드 | 앱을 열어놓은 상태에서 알림 수신 | 배너가 뜨는지 확인 |
| 백그라운드 | 앱을 홈으로 보낸 상태에서 수신 | 알림 센터에 표시되는지 |
| 킬 상태 | 앱을 완전히 종료한 상태에서 수신 | 알림 센터에 표시되는지 |
| 알림 탭 | 알림 배너/센터에서 탭 | 앱이 열리는지 |
| 배지 | 알림 수신 후 | 앱 아이콘에 배지 표시되는지 |
| 권한 거부 후 설정 복구 | 설정에서 알림 켠 후 재로그인 | `pushToken` 재등록되는지 |
| 앱 삭제 후 재설치 | 재설치 후 로그인 | 새 토큰이 DB에 갱신되는지 |

---

## 3. 트러블슈팅

### 알림이 오지 않을 때 체크리스트

1. **토큰 형식** — DB의 `pushToken`이 `ExponentPushToken[...]`으로 시작하는가?
2. **Expo Push Tool로 직접 발송** (Step 2 방법 A) — 토큰에 수동 발송해서 오는지? 오지 않으면 기기/토큰/APNs 키 이슈, 오면 서버 로직 이슈
3. **Expo Receipt 조회** (Step 3) — 실제로 APNs/FCM에 도달했는지, 에러 코드 확인
4. **기기 설정:**
   - iOS: 설정 → 손안의냉장고 → 알림 → 허용 켜짐
   - iOS: 설정 → 집중 모드(방해 금지) 꺼짐
   - iOS: 저전력 모드에서는 백그라운드 푸시가 지연될 수 있음
   - Android: 설정 → 앱 → 손안의냉장고 → 알림 + 배터리 최적화 예외 추가
5. **네트워크** — VPN/회사 Wi-Fi에서 FCM/APNs가 차단되는 경우 있음
6. **Cron 실행 로그** — API 서버 로그에서 `Running expiry notification check...` 출력 확인
7. **타임존** — `@nestjs/schedule`은 서버 타임존 따름. Docker/배포 서버가 UTC이면 `0 9 * * *`이 한국 18:00 발송이 됨. `CronExpression` 옵션에 `timeZone: 'Asia/Seoul'` 명시 필요
8. **`isConsumed: false` 조건** — 만료 임박 조회가 이미 소비된 아이템을 제외하는지 확인

### Dev Build 고유 이슈

- **토큰이 `null`로 나옴** → 0-1 `projectId` 누락 가장 유력
- **Apple 계정 이슈로 설치 실패** → Xcode → Signing & Capabilities → Team 선택 후 재빌드
- **"Could not find a development build"** → `eas credentials`에서 Push Key 업로드 확인
- **재빌드 시점:**
  - JS/TS 변경 → 재빌드 불필요 (Metro만 재연결)
  - `app.json`의 네이티브 설정 변경 → 재빌드 필요
  - 패키지 추가 (네이티브 모듈 포함) → 재빌드 필요

---

## 4. 현재 구현의 알려진 한계

코드 확인 결과 아래 항목들이 미구현 상태:

| 영역 | 미구현 | 영향 |
|------|--------|------|
| 모바일 | `addNotificationResponseReceivedListener` | 알림 탭 시 `alerts.tsx` 자동 이동 안 됨 |
| 모바일 | 백그라운드 데이터 리스너 | 알림 payload의 `data` 필드 활용 불가 |
| 모바일 | Android notification channel | Android 8.0+에서 알림이 조용히 오거나 차단될 수 있음 |
| 모바일 | `projectId` 전달 | SDK 49+에서 토큰 발급 경고/실패 |
| 모바일 | 권한 거부 시 설정 유도 UX | 한 번 거부한 유저는 알림을 영영 못 받음 |
| 서버 | Expo Push Receipt 조회 | 전달 실패 감지 불가 |
| 서버 | `DeviceNotRegistered` 처리 | 무효 토큰이 DB에 누적됨 |
| 서버 | 타임존 명시 | `@Cron('0 9 * * *')`가 서버 TZ 기준 → 배포 환경에서 한국 9시와 어긋날 수 있음 |

---

## 5. 알림 시간 커스터마이징 구현 계획

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
- 타임존: `CronExpression` 옵션에 `timeZone: 'Asia/Seoul'` 명시

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
수신:      setNotificationHandler (포그라운드 자동 표시) — 응답 리스너는 미구현
알림 화면: alerts.tsx (만료 임박 식재료 조회 + 스와이프 소비/폐기)
```
