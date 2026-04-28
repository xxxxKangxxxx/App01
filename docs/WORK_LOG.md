# 작업 기록

작업 중 발견한 오류, 원인, 해결 방식, 검증 결과를 누적 기록한다.

---

## 2026-04-27 — 모바일 라우팅 타입 오류 및 서버 OCR 구현

### 배경

모바일 타입 검사에서 `/(tabs)/` 라우트 문자열과 OCR 서비스 import 오류가 발생했다. 또한 영수증 스캔 화면은 `/receipt/ocr` 서버 엔드포인트를 호출하지만 API에는 `/receipt/parse`만 구현되어 있어 이미지 OCR 흐름이 런타임에서 실패하는 상태였다.

### 수정 사항

- Expo Router typed routes에 맞춰 홈 이동 경로를 `/(tabs)/`에서 `/`로 변경.
- `shopping-history` 라우팅에서 불필요한 `as any` 제거.
- 모바일 `services/ocr.ts`의 깨진 `api` import를 `apiClient`로 수정.
- 영수증 스캔 화면에 OCR 실패 시 사용할 수 있는 텍스트 직접 입력 fallback 추가.
- API에 `POST /api/receipt/ocr` 엔드포인트 추가.
- Fastify multipart 업로드 처리를 위해 `@fastify/multipart@8.3.1` 추가.
- 서버 OCR 서비스 추가:
  - 업로드 이미지를 임시 파일로 저장.
  - `tesseract` CLI로 텍스트 추출.
  - `OCR_LANGS` 환경변수 지원.
  - 기본 언어 자동 선택: `kor+eng` 가능 시 사용, 없으면 `kor`, 없으면 `eng`.
  - 임시 파일 정리 및 오류 응답 처리.
- `apps/api/.env.example`에 `OCR_LANGS` 문서화.
- 로컬 `apps/api/.env`에 `OCR_LANGS="kor+eng"` 설정.

### 문제와 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 모바일 `tsc --noEmit` 실패 | typed routes가 `/(tabs)/`를 허용하지 않음 | 홈 이동 경로를 `/`로 변경 |
| OCR 서비스 import 실패 | `services/api.ts`에는 `api` export가 없고 `apiClient`만 존재 | `apiClient` import로 수정 |
| 이미지 OCR 호출 실패 | `/api/receipt/ocr` 엔드포인트 미구현 | Fastify multipart + Tesseract 기반 OCR 엔드포인트 구현 |
| `@fastify/multipart@10` 런타임 호환성 위험 | 현재 Nest Fastify는 Fastify 4.x, multipart 10은 Fastify 5.x용 | `@fastify/multipart@8.3.1`로 조정 |
| 한국어 OCR 미지원 | 로컬 Tesseract 언어 목록에 `kor` 없음 | `brew install tesseract-lang` 설치 |
| Prisma DB 연결 실패 | 샌드박스 권한으로 Docker/localhost DB 접근 제한 | 권한 승인 후 마이그레이션/시드 실행 |
| API 서버 3000 포트 실행 실패 | 기존 node 프로세스가 3000 사용 중 | 검증은 3010 포트로 수행, 기존 프로세스는 유지 |

### 검증 결과

- `tesseract --list-langs`에서 `kor`, `eng` 확인.
- Docker `freshbox-postgres` 컨테이너 실행 확인.
- `pnpm --filter=@freshbox/api prisma:generate` 성공.
- `pnpm --filter=@freshbox/api prisma:migrate` 성공: pending migration 없음.
- `pnpm --filter=@freshbox/api prisma:seed` 성공: `FoodShelfLife` 152개 시드.
- `PORT=3010 pnpm --filter=@freshbox/api start`로 API 부팅 확인.
- `/api/receipt/ocr` 라우트 매핑 확인.
- 테스트 이미지 multipart 업로드 결과 OCR 텍스트 반환 확인.
- `pnpm --filter=@freshbox/api build` 통과.
- `pnpm --filter=@freshbox/mobile exec tsc --noEmit` 통과.
- `git diff --check` 통과.

### 남은 주의사항

- 실제 모바일 앱은 기본 `API_BASE_URL`이 `http://localhost:3000/api`이므로, 최신 OCR 코드가 반영된 API를 3000 포트에서 재시작해야 앱에서 바로 OCR을 테스트할 수 있다.
- Tesseract OCR 품질은 이미지 선명도와 영수증 포맷에 민감하다. 실제 영수증 샘플로 인식률을 확인하고 전처리 또는 외부 OCR 도입 여부를 판단해야 한다.

---

## 2026-04-27 — 모바일 UI 색상 중복 및 다크모드 정리

### 배경

모바일 화면 여러 곳에서 카테고리 아이콘, 유통기한 상태 색상, 상태 뱃지 색상이 각 컴포넌트마다 따로 정의되어 있었다. 이로 인해 다크모드에서 일부 화면은 라이트 테마 색상을 그대로 사용하고, 같은 의미의 색상이 화면마다 달라질 수 있는 상태였다.

### 수정 사항

- `apps/mobile/constants/categoryUi.ts` 추가:
  - 카테고리별 아이콘 이름을 공통화.
  - 카테고리별 강조 색상을 현재 테마 색상에서 계산.
- `apps/mobile/utils/expiry.ts` 추가:
  - D-day, 만료, 임박, 주의, 여유 상태 라벨과 색상 토큰을 공통 계산.
- 홈, 통계, 식재료 폼, 유통기한 뱃지, 선반 상세 화면에서 중복 카테고리/유통기한 색상 로직 제거.
- 영수증 스캔 화면의 주요 버튼, 아이콘, 상태 색상을 테마 토큰으로 교체.
- 설정 화면의 `SettingsRow`가 기본 텍스트/보조 텍스트/화살표 색상을 현재 테마에서 가져오도록 변경.
- 장보기 화면과 장보기 아이템 삭제 배경의 danger 색상을 테마 토큰으로 교체.
- 냉장고 상세 요약 카드, 냉장고 카드 뱃지, `FlatShelf`, 식재료 카드 위치 아이콘의 상태 색상을 테마 토큰으로 정리.

### 문제와 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 유통기한 색상 로직 중복 | 컴포넌트마다 D-day 색상 분기를 직접 구현 | `getExpiryUiFromDays`로 통합 |
| 카테고리 아이콘 중복 | 홈/통계/폼에서 별도 `CATEGORY_ICONS` 유지 | `getCategoryIcon`, `getCategoryAccent`로 통합 |
| 다크모드에서 라이트 색상 노출 | 설정/장보기/냉장고 일부 UI에 hex 색상 직접 사용 | `colors.danger`, `colors.warning`, `colors.bgSecondary` 등 테마 토큰 사용 |
| 영수증 스캔 화면 색상 불일치 | static `StyleSheet`와 inline hex 색상이 섞임 | 화면 컴포넌트에서 `useThemeStore` 기반 색상으로 전달 |

### 검증 결과

- `pnpm --filter=@freshbox/mobile exec tsc --noEmit` 통과.
- `pnpm --filter=@freshbox/api build` 통과.

### 남은 주의사항

- 냉장고 3D/일러스트 컴포넌트(`RefrigeratorView`, `DoorBinColumn`)에는 실제 재질 표현용 고정 색상과 상태 색상이 섞여 있다. 이번 작업에서는 기능 UI 색상만 우선 정리했고, 냉장고 렌더링 색상 체계는 별도 디자인 기준을 정한 뒤 정리하는 편이 안전하다.
- 로그인 화면의 카카오/네이버/구글 색상은 브랜드 색상이므로 테마 토큰으로 치환하지 않았다.

---

## 2026-04-27 — 냉장고 렌더링 다크모드 및 시각 체계 정리

### 배경

냉장고 상세 화면의 3D/일러스트 렌더링은 내부 벽, 선반, 문선반, 상태 요약 색상이 고정 hex 값과 상태 색상을 섞어 사용하고 있었다. 라이트 모드에서는 크게 드러나지 않지만, 다크모드에서는 냉장고 내부가 과하게 밝거나 텍스트 대비가 약해지는 문제가 있었다.

### 수정 사항

- `RefrigeratorView`에 냉장고 표면 팔레트 계산 로직 추가.
  - 라이트/다크 모드별 내부 벽, 냉동실, 문선반, 유리 선반, LED 조명 색상을 분리.
  - 기본 냉장고 프레임 색상을 다크모드에서는 어두운 slate 계열로 변경.
- 냉장고 헤더/닫힌 문 화면의 텍스트 색상을 프레임 색상 명도에 따라 자동 대비되도록 변경.
- 존 헤더의 아이콘, 구역명, 개수, 임박/만료 뱃지를 테마 토큰 기반으로 변경.
- 냉장고 상단 요약 바의 배경, 구분선, 상태 게이지, 상태 카운트를 테마 토큰 기반으로 변경.
- `DoorBinColumn`의 선반 번호, 빈 상태, 추가 카운트, 구분선을 테마 토큰으로 변경.
- 직전 작업에서 정리한 `FlatShelf`와 `FoodItemCard`의 보관 위치/유통기한 상태 색상도 함께 유지했다.

### 문제와 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 다크모드에서 냉장고 내부가 과하게 밝음 | 내부/문선반/냉동실 배경이 라이트 전용 색상으로 고정 | `getFridgeSurfaceColors`로 라이트/다크 표면 색상 분리 |
| 닫힌 문 텍스트 대비 불안정 | 프레임 색상을 단순히 어둡게 조정해서 텍스트 색상 생성 | 프레임 명도 기반 `getReadableTextColor` 사용 |
| 구역 헤더와 요약 바 상태 색상 중복 | danger/warning/success 색상을 직접 hex로 사용 | `colors.danger`, `colors.warning`, `colors.success`로 치환 |
| 문선반 빈 상태가 다크모드에서 흐릿함 | 빈 상태와 divider 색상이 라이트 회색으로 고정 | `colors.border`, `colors.textTertiary` 사용 |

### 검증 결과

- `pnpm --filter=@freshbox/mobile exec tsc --noEmit` 통과.
- `pnpm --filter=@freshbox/api build` 통과.

### 남은 주의사항

- 냉장고 렌더링은 실제 시각 확인이 중요하다. 다음 단계에서 Expo 화면을 띄워 라이트/다크 모드 각각의 냉장고 상세, 닫힌 문, 열린 문, 문선반, 김치냉장고 타입을 눈으로 확인해야 한다.
- `RefrigeratorView` 내부에는 재질 표현용 `rgba(...)`, 그림자 색상, 표면 팔레트 색상이 의도적으로 남아 있다. 이 값들은 일반 UI 토큰이라기보다 냉장고 일러스트 전용 팔레트로 관리하는 것이 맞다.

---

## 2026-04-27 — 냉장고 UI 사용성 개선

### 배경

냉장고 렌더링 색상 정리 후, 실제 사용 흐름에서 개선할 수 있는 UI가 남아 있었다. 선반에 표시 가능한 항목보다 많은 식재료가 있을 때 `+N`만 보이면 상세 진입 가능성이 약하게 보이고, 냉장고 색상 선택 화면은 선택 색상이 라이트/다크 배경에서 어떻게 보일지 바로 판단하기 어려웠다.

### 수정 사항

- `FlatShelf`의 추가 항목 표시 pill을 개선.
  - 단순 회색 배경 `+N`에서 테마 카드 배경, 테두리, 강조된 숫자, 비 compact 모드의 chevron으로 변경.
  - 선반 전체가 눌리는 구조와 맞춰 상세 진입 가능성을 시각적으로 강화.
- 냉장고 등록/수정 화면에 색상 미리보기 추가.
  - 선택한 냉장고 색상을 라이트/다크 배경에서 각각 작은 냉장고 형태로 표시.
  - 프레임 색상 명도에 따라 손잡이 대비 색상을 자동 계산.
- 냉장고 삭제 버튼의 danger 색상을 테마 토큰으로 변경.

### 문제와 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 많은 항목이 있는 선반의 상세 진입 affordance가 약함 | `+N` 텍스트만 표시 | 테두리 pill과 chevron으로 더 눌러볼 수 있는 형태로 변경 |
| 색상 선택 결과를 다크모드에서 예측하기 어려움 | 색상 swatch만 제공 | 라이트/다크 미니 냉장고 미리보기 추가 |
| 삭제 버튼 색상 하드코딩 | danger 색상이 hex로 직접 지정 | `colors.danger` 사용 |

### 검증 결과

- `pnpm --filter=@freshbox/mobile exec tsc --noEmit` 통과.
- `pnpm --filter=@freshbox/api build` 통과.

### 남은 주의사항

- 이번 작업은 코드/타입 검증까지 수행했다. 실제 Expo 화면에서 색상 미리보기 폭, 작은 화면 줄바꿈, 선반 pill 터치 느낌은 별도 시각 확인이 필요하다.

---

## 2026-04-27 — iOS 시뮬레이터 Worklets 초기화 오류 해결

### 배경

iOS 시뮬레이터의 손안의 냉장고 앱에서 React Native 오류 화면이 표시되었다. 캡처 결과 오류 메시지는 `[Worklets] Native part of Worklets doesn't seem to be initialized.`였고, call stack에는 `StarParticleLoader.tsx`와 `InterpretScreen.tsx`가 표시되었다.

### 원인

`react-native-reanimated`가 모바일 앱의 직접 dependency로 고정되어 있지 않아 pnpm peer resolution 과정에서 `react-native-reanimated@4.2.2`와 `react-native-worklets@0.7.4`가 선택되었다. 현재 앱은 Expo 52 / React Native 0.76 기반 dev client로 실행 중이므로, Reanimated 4 + Worklets 네이티브 조합과 맞지 않아 앱 부팅 시 네이티브 Worklets 초기화 오류가 발생했다.

### 수정 사항

- `@freshbox/mobile`에 `react-native-reanimated@~3.16.1` 직접 dependency 추가.
  - 실제 설치 결과 `react-native-reanimated@3.16.7`로 고정됨.
  - 의존성 그래프에서 `react-native-worklets` 제거 확인.
- `apps/mobile/babel.config.js`에 `react-native-reanimated/plugin` 추가.
- 기존 Metro 서버를 종료하고 `expo start --dev-client --port 8082 --clear`로 캐시를 비운 새 번들 실행.

### 문제와 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 시뮬레이터 캡처 실패 | 샌드박스에서 CoreSimulatorService 접근 제한 | 권한 승인 후 `xcrun simctl io booted screenshot` 실행 |
| Worklets 네이티브 초기화 오류 | Expo 52 dev client와 Reanimated 4/Worklets 조합 불일치 | Reanimated 3.16 계열 직접 고정 |
| pnpm install 실패 | 기존 node_modules store와 현재 pnpm store 경로 불일치 | 기존 store 경로 `/Users/kang-yeongmo/Library/pnpm/store/v3` 명시 |
| 네트워크 접근 실패 | 샌드박스 DNS 제한 | 권한 승인 후 registry 접근 허용 |
| 기존 오류 화면 유지 가능성 | Metro 캐시가 이전 번들을 보유 | 기존 Metro 종료 후 `--clear`로 재시작 |

### 검증 결과

- `pnpm --filter=@freshbox/mobile why react-native-worklets` 결과 의존성 없음.
- `pnpm --filter=@freshbox/mobile why react-native-reanimated` 결과 `3.16.7` 사용 확인.
- `pnpm --filter=@freshbox/mobile exec tsc --noEmit` 통과.
- `pnpm --filter=@freshbox/api build` 통과.
- 시뮬레이터 앱 재실행 후 오류 화면이 사라지고 로그인 화면 표시 확인.

### 남은 주의사항

- Reanimated 네이티브 dependency가 바뀌었으므로 실제 기기 또는 새 dev client 빌드에서는 iOS pod install/dev client rebuild가 필요할 수 있다.
- Metro 캐시 영향이 큰 오류였으므로 유사한 네이티브 dependency 오류가 반복되면 `expo start --clear`로 먼저 확인한다.

---

## 2026-04-27 — OCR 실제 플로우 서버 점검 및 파서 보정

### 배경

로그인 이후 핵심 플로우에서 오류가 없음을 확인한 뒤, 영수증 OCR 실제 플로우를 점검했다. PostgreSQL, API 서버, Tesseract 언어 데이터, 모바일 API 설정을 확인하고 `/api/receipt/ocr` 및 `/api/receipt/parse`를 실제 요청으로 검증했다.

### 확인 사항

- Docker `freshbox-postgres` 컨테이너 실행 확인.
- API 서버 3000 포트 실행 확인.
- Tesseract 언어 데이터 `kor`, `eng` 사용 가능 확인.
- 모바일 기본 API URL이 `http://localhost:3000/api`임을 확인.
- `POST /api/receipt/ocr` 라우트가 인증 적용 상태로 로드되어 있음을 확인.

### 발견 문제

테스트 OCR 텍스트:

```text
MILK 1 2800
APPLE 2 6000
TOTAL 8800
```

초기 파싱 결과에서 다음 문제가 있었다.

- `TOTAL` 합계 라인이 식재료로 포함됨.
- `MILK 1`, `APPLE 2`처럼 수량이 상품명에 남음.
- 영어 상품명 `MILK`, `APPLE`의 카테고리가 `OTHER`로 추정됨.

### 수정 사항

- `ReceiptParserService`의 skip pattern에 영어 합계/결제 키워드 추가:
  - `total`, `subtotal`, `amount`, `change`, `cash`, `credit`
- `상품명 수량 금액` 형태를 처리하는 파싱 패턴 추가.
  - 예: `MILK 1 2800` -> `name: MILK`, `quantity: 1`
- 영어 식품명 카테고리 추정 보강.
  - `milk`, `cheese`, `yogurt`, `butter` -> `DAIRY`
  - `apple`, `banana`, `orange`, `lemon`, `kiwi`, `mango`, `berry`, `grape` -> `FRUITS`

### 검증 결과

- OCR 업로드 결과:

```json
{"text":"MILK 1 2800\nAPPLE 2 6000\nTOTAL 8800"}
```

- 파싱 결과:

```json
{
  "items": [
    {"name":"MILK","quantity":1,"category":"DAIRY","confidence":"high"},
    {"name":"APPLE","quantity":2,"category":"FRUITS","confidence":"high"}
  ]
}
```

- 실패 케이스 확인:
  - 인증 없음: `401 Unauthorized`
  - 파일 없음: `400 Bad Request`
  - 이미지가 아닌 파일: `400 Bad Request`
- `pnpm --filter=@freshbox/api build` 통과.
- `pnpm --filter=@freshbox/mobile exec tsc --noEmit` 통과.

### 남은 주의사항

- 현재 검증은 서버 엔드포인트와 테스트 이미지 기준이다. 실제 모바일에서 카메라/앨범으로 영수증 이미지를 선택해 업로드하는 end-to-end 확인이 다음 단계다.
- 실제 영수증에는 할인, 행사, 카드 승인, 품번, 단가/수량 순서가 다양하게 섞일 수 있으므로 샘플을 늘리면서 파서 규칙을 보강해야 한다.

---

## 2026-04-27 — 영수증 스캔 완료 후 화면 상태 초기화

### 배경

시뮬레이터에서 영수증 스캔 후 일괄 추가는 정상 동작했지만, 홈 화면으로 이동한 뒤 다시 영수증 스캔 화면에 들어왔을 때 이전 스캔 결과가 남아 있을 수 있는 흐름이 확인되었다. Expo Router 탭 화면은 이동 후에도 컴포넌트 상태가 메모리에 유지될 수 있으므로, 완료 시점에 명시적으로 상태를 초기화해야 한다.

### 수정 사항

- `ReceiptScanScreen`에 `resetScanState` 함수 추가.
  - `step`을 `select`로 변경.
  - 인식된 `items` 초기화.
  - `storeName`, `purchaseDate` 초기화.
  - 수동 입력 fallback용 `manualText` 초기화.
- 일괄 추가 성공 Alert의 확인 버튼에서 상태 초기화 후 홈으로 이동하도록 변경.
- `다시 스캔` 버튼도 동일한 초기화 함수를 사용하도록 변경.

### 문제와 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 영수증 스캔 재진입 시 이전 결과가 남을 수 있음 | 탭 화면 컴포넌트가 라우팅 후에도 언마운트되지 않을 수 있음 | 일괄 추가 성공 시 스캔 상태를 명시적으로 초기화 |
| 다시 스캔 시 일부 메타 상태가 남을 수 있음 | `step`만 `select`로 변경하고 결과/메타 상태는 유지 | `resetScanState`로 모든 관련 상태를 한 번에 초기화 |

### 검증 결과

- `pnpm --filter=@freshbox/mobile exec tsc --noEmit` 통과.
- `pnpm --filter=@freshbox/api build` 통과.

### 남은 주의사항

- 실제 시뮬레이터에서 다시 한 번 `스캔 -> 일괄 추가 -> 홈 -> 영수증 스캔 재진입` 순서로 확인해야 한다.

---

## 2026-04-27 — 작업 마무리 요약 및 다음 작업

### 오늘 완료한 작업

- 모바일 라우팅 타입 오류 수정.
- 서버 OCR 엔드포인트 구현.
  - `POST /api/receipt/ocr`
  - Fastify multipart 업로드 처리.
  - Tesseract 기반 이미지 OCR.
  - `OCR_LANGS` 환경변수 지원.
- PostgreSQL 마이그레이션/시드 상태 확인.
- 모바일 영수증 스캔 fallback 개선.
  - OCR 실패 시 텍스트 직접 입력.
  - 스캔 완료 후 상태 초기화.
- UI/다크모드 색상 중복 정리.
  - 카테고리 UI 공통 유틸 추가.
  - 유통기한 상태 UI 공통 유틸 추가.
  - 설정, 장보기, 홈, 통계, 식재료 폼, 냉장고 UI의 하드코딩 색상 축소.
- 냉장고 렌더링 UI 개선.
  - 라이트/다크 냉장고 표면 팔레트 분리.
  - 선반 추가 항목 pill 개선.
  - 냉장고 색상 선택 라이트/다크 미리보기 추가.
- iOS 시뮬레이터 Worklets 오류 해결.
  - `react-native-reanimated@~3.16.1` 직접 고정.
  - `react-native-reanimated/plugin` Babel 설정 추가.
- OCR 서버 플로우 검증 및 파서 보정.
  - `TOTAL` 같은 합계 라인 제외.
  - `상품명 수량 금액` 패턴 처리.
  - 영어 식품명 일부 카테고리 추정 보강.
- 시뮬레이터에서 영수증 이미지 선택, 스캔, 일괄 추가, 홈 이동, 재진입 초기화 동작 확인.

### 오늘 발생한 주요 문제와 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 모바일 typed route 오류 | Expo Router typed routes에서 `/(tabs)/` 홈 이동 문자열 불일치 | 홈 이동 경로를 `/`로 변경 |
| 서버 OCR 엔드포인트 없음 | 모바일은 `/receipt/ocr` 호출, API는 `/receipt/parse`만 존재 | Fastify multipart + Tesseract OCR 엔드포인트 추가 |
| Tesseract 한국어 미지원 | 로컬 언어 데이터에 `kor` 없음 | `tesseract-lang` 설치 후 `kor+eng` 사용 |
| API multipart 호환성 위험 | Fastify 4 환경에서 multipart 10은 Fastify 5 대상 | `@fastify/multipart@8.3.1` 사용 |
| Worklets 초기화 오류 | Reanimated 4/Worklets 조합이 Expo 52 dev client와 불일치 | Reanimated 3.16 계열 직접 고정 및 Babel plugin 추가 |
| OCR 파싱에 합계 라인 포함 | 영어 `TOTAL` 라인을 skip하지 않음 | 영어 합계/결제 키워드 skip pattern 추가 |
| 수량이 상품명에 남음 | `상품명 수량 금액` 패턴 미지원 | 해당 패턴 추가 |
| 스캔 재진입 시 이전 결과 유지 가능 | 탭 화면 상태가 언마운트되지 않을 수 있음 | 일괄 추가 성공 시 `resetScanState` 호출 |

### 검증한 항목

- `pnpm --filter=@freshbox/api build`
- `pnpm --filter=@freshbox/mobile exec tsc --noEmit`
- `git diff --check`
- Docker PostgreSQL 실행 확인.
- API 3000 포트 실행 확인.
- Metro 8082 포트 실행 확인.
- 시뮬레이터 앱 실행 확인.
- 시뮬레이터 사진 앱에 테스트 영수증 이미지 추가.
- 서버 OCR/parse curl 검증.
- 모바일 영수증 스캔 end-to-end 사용자 확인.

### 다음 작업 후보

1. 실제 영수증 샘플 확대 테스트.
   - 할인, 행사, 단가/수량 순서가 다른 영수증.
   - 한국어 마트 영수증.
   - 흐린 이미지/기울어진 이미지.
2. 영수증 스캔 UX 개선.
   - 낮은 confidence 항목 강조.
   - 중복 항목 병합.
   - 수량/단위/카테고리 편집 UX 개선.
   - OCR 실패 사유별 안내 문구 개선.
3. API 테스트 추가.
   - `ReceiptParserService` 단위 테스트.
   - OCR 엔드포인트 실패 케이스 테스트.
4. 모바일 유틸 테스트 추가.
   - `expiry.ts`
   - `categoryUi.ts`
5. 배포/실기기 테스트 준비.
   - 실기기용 `API_BASE_URL` 정리.
   - iOS dev client rebuild 필요 여부 확인.
   - 권한 문구, 앱 아이콘, 스플래시, 개인정보 관련 안내 점검.

### 다음 작업 시작 시 환경 세팅

작업을 다시 시작할 때는 아래 순서로 환경을 확인한다.

```bash
docker ps
pnpm --filter=@freshbox/api start
pnpm --filter=@freshbox/mobile exec expo start --dev-client --port 8082
```

OCR 테스트가 필요하면 Tesseract 언어를 확인한다.

```bash
tesseract --list-langs
```

iOS 시뮬레이터에 테스트 영수증 이미지를 다시 넣어야 하면 아래 명령을 사용한다.

```bash
xcrun simctl addmedia booted /tmp/freshbox-receipt.html.png
```

### 마무리 시 종료할 자원

- API 서버: `localhost:3000`
- Metro 서버: `localhost:8082`
- iOS 시뮬레이터 앱/시뮬레이터
- 필요 시 임시 OCR 테스트 이미지: `/tmp/freshbox-receipt.html.png`

---

## 2026-04-28 — Receipt Parser 단위 테스트 추가

### 배경

OCR 파서는 규칙 기반으로 동작하므로 실제 영수증 샘플을 늘리며 수정할수록 기존 파싱 규칙이 깨질 위험이 있다. 실제 샘플 확대 테스트 전에 `ReceiptParserService` 단위 테스트를 먼저 추가해 회귀를 빠르게 잡을 수 있도록 했다.

### 수정 사항

- `apps/api/package.json`에 테스트 스크립트 추가.

```bash
pnpm --filter=@freshbox/api test
```

- `apps/api/test/receipt-parser.service.test.ts` 추가.
- Node 내장 test runner와 기존 dev dependency인 `tsx`를 사용해 새 테스트 프레임워크 의존성 없이 실행하도록 구성.
- 테스트 케이스 추가:
  - `MILK 1 2800`, `APPLE 2 6000`, `TOTAL 8800`
  - `서울우유1L 1 2,800 2,800`
  - `2 x 사과 6000`
  - 매장명, 거래일, 할인, 카드 결제, credit 라인 제외

### 발견 문제

`2 x 사과 6000` 케이스가 `수량 x 상품명 금액` 패턴보다 `상품명 금액` 패턴에 먼저 매칭되어 이름이 `2 x 사과`로 남는 문제가 테스트에서 발견되었다.

### 해결

- `ReceiptParserService.parseLine`에서 `수량 x 상품명 금액` 패턴을 `상품명 금액` 패턴보다 먼저 평가하도록 순서를 조정했다.
- 결과적으로 `2 x 사과 6000`은 `name: 사과`, `quantity: 2`로 파싱된다.

### 검증 결과

- `pnpm --filter=@freshbox/api test` 통과.
  - 4개 테스트 통과.
- `pnpm --filter=@freshbox/api build` 통과.
- `pnpm --filter=@freshbox/mobile exec tsc --noEmit` 통과.

### 다음 작업

- 실제 영수증 샘플을 추가로 확보해 파서 테스트 케이스를 늘린다.
- 할인/행사/품번/단가/수량 순서가 다른 케이스를 테스트에 먼저 추가한 뒤 파서 규칙을 보강한다.

---

## 2026-04-28 — Receipt Parser 실제 영수증 패턴 테스트 확장

### 배경

기본 파서 단위 테스트를 추가한 뒤, 실제 마트/편의점 영수증에서 자주 나오는 형태를 테스트에 더 반영했다. 아직 실제 이미지 샘플은 없으므로, OCR 결과에 자주 포함되는 텍스트 패턴을 기준으로 회귀 테스트를 확장했다.

### 추가 테스트 케이스

- 한국 마트형 상품 구역:
  - `품명 수량 단가 금액`
  - `*국내산삼겹살 1 12,900 12,900`
  - `행사할인 -1,000`
  - `@양파 2 1,500 3,000`
  - `면세물품가액`, `과세물품가액`, `총 결제금액`
- 바코드/상품코드가 섞인 편의점형 라인:
  - `8801234567890`
  - `바나나 1 3980`
  - `00012345`
  - `생수 6 3,000`
  - `받을금액 6,980`

### 발견 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| `받을금액 6,980`이 상품으로 파싱됨 | skip pattern에는 `받을 금액` 공백 포함 형태만 total extraction에 있고 product skip에는 없음 | product skip pattern에 `받을\s*금액` 추가 |
| `생수`가 `OTHER`로 분류됨 | 음료 카테고리 키워드에 `생수` 누락 | 음료 패턴에 `생수` 추가 |

### 검증 결과

- `pnpm --filter=@freshbox/api test` 통과.
  - 6개 테스트 통과.
- `pnpm --filter=@freshbox/api build` 통과.
- `pnpm --filter=@freshbox/mobile exec tsc --noEmit` 통과.

### 다음 작업

- 실제 영수증 이미지 OCR 결과를 확보해 테스트 fixture로 추가한다.
- 모바일 스캔 결과 편집 UX에서 카테고리/수량/단위/유통기한을 수정하기 쉽게 개선한다.

---

## 2026-04-28 — 실제 영수증 OCR Fixture 추가 및 파서 보강

### 배경

실제 영수증 이미지 `test_receipt.png`를 기준으로 서버 OCR 엔드포인트 결과를 확인했다. 원본 이미지와 OCR 원문에는 전화번호, 주소, 계좌, 카드, 고객명 등 민감정보가 포함되어 있어 저장소에는 원본 이미지나 전체 OCR 원문을 커밋하지 않고, 민감정보를 제거한 텍스트 fixture만 추가했다.

### 추가 사항

- `apps/api/test/fixtures/receipt-yangyang-mart-ocr.txt` 추가.
  - 실제 OCR 결과에서 개인정보/결제정보를 `REDACTED` 처리.
  - 상품명, 바코드/가격 라인, 결제 합계 주변의 OCR 노이즈는 테스트를 위해 유지.
- `.gitignore`에 `test_receipt.*` 추가.
  - 로컬 실제 영수증 이미지가 실수로 커밋되지 않도록 방지.
- `ReceiptParserService` 테스트에 실제 OCR fixture 기반 회귀 테스트 추가.
  - 구매일 `26-03-28` 추출 확인.
  - 상품명 다음 줄에 바코드/단가/수량/금액이 오는 다중 라인 상품 구조 확인.
  - 바코드/가격 단독 라인이 상품으로 들어가지 않는지 확인.

### 발견 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| `44-06-01353` 같은 사업자/전화번호성 문자열에서 날짜가 잘못 추출될 수 있음 | 날짜 정규식이 긴 숫자열 내부의 `YY-MM-DD` 형태도 허용 | 날짜 정규식에 앞뒤 숫자 경계 조건 추가 |
| `001 상품명` 다음 줄의 `바코드 단가 수량 금액` 구조를 상품으로 묶지 못함 | 기존 파서는 한 줄 단위 상품만 처리 | 상품명 라인과 다음 가격 라인을 함께 읽는 다중 라인 파싱 추가 |
| `880... 1,600 1 1,600` 같은 바코드/가격 단독 줄이 상품 후보가 됨 | 바코드 + 숫자열 메타데이터 필터 부족 | `isLikelyMetadata`에서 바코드성 숫자 시작 라인 제외 |
| `하이트)테라라이트(캔) 3550!`에서 OCR 꼬리 숫자가 상품명에 남음 | `355ml`이 `3550`처럼 깨진 OCR을 제거하지 못함 | 상품명 정리 단계에서 끝의 3~4자리 단독 숫자 제거 |
| `도다리`가 해산물로 분류되지 않음 | 해산물 카테고리 키워드 누락 | 해산물 패턴에 `도다리` 추가 |

### 검증 결과

- `pnpm --filter=@freshbox/api test` 통과.
  - 7개 테스트 통과.
- `pnpm --filter=@freshbox/api build` 통과.
- `pnpm --filter=@freshbox/mobile exec tsc --noEmit` 통과.
- `git diff --check` 통과.

### 주의 사항

- `test_receipt.png`는 실제 개인정보가 포함된 로컬 검증용 파일이므로 커밋 대상에서 제외한다.
- 앞으로 실제 영수증 샘플을 추가할 때도 원본 이미지는 저장소에 넣지 않고, 민감정보를 제거한 OCR 텍스트 fixture만 남긴다.

### 다음 작업

- 모바일 스캔 결과 편집 화면에서 상품별 카테고리/수량/단위/유통기한 수정 UX를 개선한다.
- 실제 OCR 결과가 낮은 품질일 때 수동 보정 흐름을 더 자연스럽게 만든다.
- 실제 샘플을 2~3개 더 확보해 마트/편의점/온라인 주문서 패턴별 fixture를 늘린다.

---

## 2026-04-28 — 영수증 스캔 결과 편집 UX 개선

### 배경

OCR 결과는 상품명과 수량뿐 아니라 카테고리, 단위, 유통기한이 잘못 추정될 수 있다. 기존 스캔 결과 화면에서는 품목명과 수량만 수정할 수 있어, 일괄 추가 전에 실제 냉장고 데이터로 들어갈 값을 충분히 보정하기 어려웠다.

### 수정 사항

- `apps/mobile/app/(tabs)/receipt-scan.tsx`의 스캔 결과 카드 편집 영역 확장.
- 편집 가능 항목 추가:
  - 품목명
  - 수량
  - 단위
  - 카테고리
  - 유통기한
- 단위는 자주 쓰는 단위 chip으로 빠르게 선택하도록 구성.
  - `개`, `팩`, `봉`, `병`, `캔`, `g`, `kg`, `ml`, `L`
- 카테고리는 기존 `categoryUi` 아이콘/색상 규칙을 재사용해 가로 chip으로 선택하도록 구성.
- 유통기한은 직접 입력과 빠른 preset을 함께 제공.
  - 오늘, 3일, 1주, 2주, 1개월
- 편집 시작 시 현재 item 값을 로컬 편집 상태로 복사하고, 취소 시 변경 전 값으로 복원하도록 처리.
- 저장 시 품목명 공백과 날짜 형식을 검증.

### 발견 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| OCR 결과 화면에서 카테고리/단위/유통기한 보정이 불가능 | 기존 편집 UI가 품목명/수량만 지원 | 편집 패널에 단위, 카테고리, 유통기한 컨트롤 추가 |
| 날짜 오입력 가능성 | 유통기한을 문자열로 저장 | `YYYY-MM-DD` 형식 검증 후 저장 |
| 편집 취소 시 입력 중 값이 남을 수 있음 | 편집 상태가 item 값과 동기화되지 않음 | 편집 시작/취소 시 item 값으로 상태 재설정 |

### 검증 결과

- `pnpm --filter=@freshbox/mobile exec tsc --noEmit` 통과.
- `pnpm --filter=@freshbox/api test` 통과.
  - 7개 테스트 통과.
- `pnpm --filter=@freshbox/api build` 통과.
- `git diff --check` 통과.

### 다음 작업

- 시뮬레이터에서 실제 OCR 결과 편집 흐름을 직접 확인한다.
- 유통기한 입력을 텍스트 입력에서 네이티브 날짜 선택 UI로 바꿀지 검토한다.
- OCR 품질이 낮은 상품명에 대해 “직접 추가/제외” 흐름을 더 명확하게 만든다.

---

## 2026-04-28 — 마무리 기록 및 다음 작업 정리

### 오늘 진행한 작업 요약

- Receipt Parser 단위 테스트 환경 추가.
  - `pnpm --filter=@freshbox/api test` 스크립트 추가.
  - `apps/api/test/receipt-parser.service.test.ts` 추가.
- 실제 영수증 이미지 기반 OCR 결과를 비식별 fixture로 추가.
  - 원본 이미지 `test_receipt.png`는 개인정보 포함 가능성이 있어 커밋 제외.
  - `apps/api/test/fixtures/receipt-yangyang-mart-ocr.txt`에 REDACTED 처리된 OCR 텍스트만 보관.
- OCR 파서 보강.
  - 날짜 오인식 방지.
  - 상품명 다음 줄에 바코드/단가/수량/금액이 오는 구조 처리.
  - 바코드/가격 단독 라인 제외.
  - 깨진 용량 꼬리 숫자 제거.
  - `생수`, `하이트`, `테라`, `도다리` 카테고리 인식 보강.
- 영수증 스캔 결과 편집 UX 개선.
  - 품목명, 수량, 단위, 카테고리, 유통기한을 일괄 추가 전에 수정 가능하도록 확장.
  - 편집 취소/저장 흐름과 날짜 형식 검증 추가.
- `.gitignore`에 `test_receipt.*`를 추가해 실제 영수증 이미지가 저장소에 포함되지 않도록 처리.

### 추가로 확인한 문제

| 문제 | 현재 상태 | 다음 해결 방향 |
|------|-----------|----------------|
| 영수증 스캔으로 추가하는 식재료에 냉장고/구역 선택 기능이 없음 | 서버 bulk create와 타입은 위치 필드를 받을 수 있으나 모바일 스캔 화면 payload에서 전달하지 않음 | 스캔 결과 화면 상단에 일괄 보관 위치 선택 영역을 추가하고 모든 품목에 `refrigeratorId`, `zone`, `shelf`, `depth`, `colPosition`, `location`을 적용 |
| 냉장고 탭 우측 상단 `+`가 냉장고 추가로 동작해 식재료 추가와 혼동될 수 있음 | 냉장고 추가 액션이 화면 전역 상단에 있어 문맥이 애매함 | 우측 상단 `+`는 식재료 추가 액션으로 변경하고, 냉장고 추가는 냉장고 목록 carousel의 마지막 카드로 이동 |
| 하단 `추가` 탭이 독립 탭처럼 보이나 실제로는 액션에 가까움 | 주요 내비게이션 탭을 하나 차지함 | 하단 `추가` 탭 제거 후 우측 상단 `+`에서 `직접 추가 / 영수증 스캔으로 추가` 선택 메뉴 제공 |

### 다음 작업 우선순위

1. 영수증 스캔 결과 화면에 일괄 보관 위치 선택 기능 추가.
   - 일반 추가 폼의 냉장고/구역 선택 로직을 참고.
   - 일단 모든 OCR 품목에 동일 위치를 적용하는 방식으로 구현.
   - 이후 필요하면 품목별 위치 override를 추가.
2. 냉장고 탭 액션 구조 개선.
   - 우측 상단 `+`를 식재료 추가 액션 메뉴로 변경.
   - 메뉴 항목은 `직접 추가`, `영수증 스캔으로 추가`.
   - 기존 냉장고 추가 모달은 냉장고 목록 마지막 `냉장고 추가` 카드에서 열도록 이동.
3. 하단 탭 구조 정리.
   - `추가` 탭 제거.
   - 탭 제거 후 라우팅, 헤더, 접근 경로가 깨지지 않는지 점검.
4. 시뮬레이터 UI 검증.
   - 영수증 OCR 결과 편집.
   - 일괄 위치 선택 후 추가.
   - 홈/냉장고 탭에서 식재료 추가 액션 진입.
   - 냉장고 carousel 마지막 카드에서 냉장고 추가.

### 다음 작업 시작 시 환경 세팅

```bash
docker ps
pnpm --filter=@freshbox/api start
pnpm --filter=@freshbox/mobile exec expo start --dev-client --port 8082
```

필요하면 iOS 시뮬레이터를 열고 앱을 다시 실행한다.

```bash
xcrun simctl boot "iPhone 16 Pro"
xcrun simctl launch booted com.freshbox.app
```

### 마무리 시 종료할 자원

- API 서버: `localhost:3000`
- Metro 서버: `localhost:8082`
- iOS 시뮬레이터
- 로컬 실제 영수증 이미지: `test_receipt.png`는 커밋하지 않음
