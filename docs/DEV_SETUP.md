# FreshBox 개발 환경 실행 가이드

로컬에서 앱을 빌드하고 시뮬레이터에서 확인하기까지의 전체 순서.
**터미널 3개**를 사용한다 (DB, API 서버, Metro/빌드).

---

## 사전 조건

- Docker Desktop 실행 중
- Xcode 설치 + `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
- pnpm 전역 설치: `npm install -g pnpm`
- iOS 시뮬레이터 최소 1대 설치 (Xcode → Settings → Platforms)

---

## 1단계: PostgreSQL 시작

```bash
# 컨테이너가 있으면 시작
docker start freshbox-postgres

# 최초 생성 시
docker run -d \
  --name freshbox-postgres \
  -e POSTGRES_USER=freshbox \
  -e POSTGRES_PASSWORD=freshbox1234 \
  -e POSTGRES_DB=freshbox \
  -p 5432:5432 \
  postgres:16-alpine
```

확인:
```bash
docker ps --filter "name=freshbox-postgres"
# STATUS가 "Up ..." 이면 정상
```

---

## 2단계: 의존성 설치 + 타입 빌드

```bash
cd /Users/kang-yeongmo/App/freshbox
pnpm install
pnpm --filter=@freshbox/types build
```

---

## 3단계: DB 마이그레이션 (최초 또는 스키마 변경 시)

```bash
pnpm --filter=@freshbox/api prisma:migrate
```

Prisma 클라이언트만 재생성할 때:
```bash
pnpm --filter=@freshbox/api prisma:generate
```

시드 데이터 적용:
```bash
pnpm --filter=@freshbox/api prisma:seed
```

---

## 3-1단계: 서버 OCR 준비

영수증 이미지 OCR은 API 서버에서 `tesseract` CLI를 사용한다.

```bash
# Tesseract 본체가 없으면 설치
brew install tesseract

# 한국어 언어팩 설치
brew install tesseract-lang

# kor, eng 확인
tesseract --list-langs
```

`apps/api/.env`:
```env
OCR_LANGS="kor+eng"
```

OCR 엔드포인트:
```text
POST /api/receipt/ocr
Content-Type: multipart/form-data
field: image
```

주의:
- `@fastify/multipart`는 현재 Fastify 4.x와 맞는 `8.x` 버전을 사용한다.
- 서버에 `kor.traineddata`가 없으면 한국어 OCR 품질이 크게 떨어진다.
- 배포 서버에서도 `tesseract-ocr`와 한국어 언어팩을 별도로 설치해야 한다.

---

## 4단계: API 서버 실행 [터미널 1]

```bash
cd /Users/kang-yeongmo/App/freshbox
pnpm --filter=@freshbox/api dev
```

확인:
```bash
curl http://localhost:3000/api/auth/google
# HTTP 302 리다이렉트 → 정상
```

---

## 5단계: iOS 시뮬레이터 + 앱 실행 [터미널 2]

### A. 최초 빌드 또는 네이티브 모듈 변경 시

반드시 **포그라운드**에서 실행 (백그라운드 `&` 금지):
```bash
cd /Users/kang-yeongmo/App/freshbox/apps/mobile
pnpm ios
```
- Xcode 빌드 → 시뮬레이터에 앱 설치 → Metro 시작 → 앱 자동 실행
- 최초 빌드는 3~5분 소요

### B. JS만 변경했을 때 (네이티브 변경 없음)

이미 빌드된 앱이 시뮬레이터에 있으면 Metro만 띄우면 됨:
```bash
cd /Users/kang-yeongmo/App/freshbox/apps/mobile
pnpm dev
```
시뮬레이터에서 FreshBox 앱을 탭하면 자동으로 Metro에 연결됨.

### C. Metro 캐시 클리어가 필요할 때

```bash
cd /Users/kang-yeongmo/App/freshbox/apps/mobile
npx expo start --dev-client --port 8082 --clear
```

---

## 시뮬레이터 유틸 명령어

```bash
# 부팅된 시뮬레이터 확인
xcrun simctl list devices booted

# 특정 시뮬레이터 부팅
xcrun simctl boot "iPhone 16"

# 시뮬레이터에 설치된 앱 확인
xcrun simctl listapps booted | grep -i "fresh"

# 시뮬레이터에서 URL 열기 (딥링크 테스트 등)
xcrun simctl openurl booted "freshbox://auth/callback?accessToken=test"

# 시뮬레이터 앱 삭제 (재빌드 필요할 때)
xcrun simctl uninstall booted com.freshbox.app
```

---

## 전체 클린 빌드 (문제 발생 시)

```bash
cd /Users/kang-yeongmo/App/freshbox/apps/mobile

# 1. ios 폴더 + DerivedData 삭제
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/FreshBox-*

# 2. Pod 재설치
cd ios && pod install --repo-update && cd ..

# 3. 전체 재빌드
pnpm ios
```

---

## 포트 정리

| 서비스 | 포트 | 비고 |
|--------|------|------|
| PostgreSQL | 5432 | Docker 컨테이너 |
| API 서버 (NestJS) | 3000 | `/api` prefix |
| Metro (Expo) | 8082 | 8081은 Docker에 점유됨 |

---

## 주의사항

- `pnpm ios`는 반드시 **포그라운드(터미널 직접)**에서 실행. 백그라운드 실행 시 Metro ↔ 앱 연결 실패
- Expo Go는 사용하지 않음. 개발 빌드(`com.freshbox.app`)만 사용
- 네이티브 모듈(expo-camera 등) 추가 시 반드시 `pnpm ios`로 전체 재빌드 필요
- API 서버가 꺼져 있으면 구글 로그인 시 "네트워크 서버에 연결할 수 없습니다" 에러 발생 → 4단계 확인
- 작업 중 오류/해결/검증 결과는 [WORK_LOG.md](WORK_LOG.md)에 누적 기록
