# 내 옷장 (Private Closet)

나만의 데일리 옷장 관리 + 코디 추천 웹 애플리케이션입니다.  
별도의 백엔드 서버 없이 브라우저(ES 모듈)와 Firebase(Auth, Firestore, AI Logic)만으로 동작하며, GitHub Pages로 무료 호스팅합니다. 빌드 도구나 npm 설치는 필요 없습니다.

---

## ✨ 기능 한눈에 보기

| 화면 | 주소 | 하는 일 |
|---|---|---|
| 옷장 | `#/closet` | 옷 사진 격자 목록, 카테고리 탭, 검색·정렬, 한 줄에 보이는 개수(2/3/4/6개) 선택, 상단 배너 |
| 옷 등록·수정 | `#/cloth/new`, `#/cloth/:id` | 사진·카테고리·색·두께·계절·무드·메모 입력, 마지막 착용일·착용 횟수 표시 |
| 오늘의 코디 | `#/today` | 오늘 날씨 확인 → **AI 추천** 또는 **기존 방식(점수)** 으로 코디 3개 추천, "입었어요" 기록 |
| 착용 기록 | `#/log` | 날짜별 착용 기록, 직접 기록하기, 기록 삭제 |

### 코디 추천 두 가지 방식
- **기존 방식 (점수)**: 기온 구간표, 무드 궁합, 계절 가산, 최근 착용 감점을 계산하는 규칙 기반 추천입니다. AI 없이 항상 동작합니다.
- **AI 추천**: 옷장 전체·오늘 날씨·최근 4일 착용 기록을 AI(Gemini)가 보고 코디를 최대 3개 고르고, 레이어 순서와 이유를 설명합니다. 버튼을 누를 때만 호출합니다.

### 같은 옷 반복 방지
최근 4일(오늘 제외) 안에 입은 옷은 추천에서 제외되거나 옷 1벌당 0.25점이 감점됩니다. 날짜는 한국 시간(Asia/Seoul) 기준입니다.

---

## 📁 프로젝트 구조

```text
/
├─ index.html           # 메인 HTML (단일 페이지 해시 라우팅)
├─ images/              # 옷장 상단 배너 등 정적 이미지 (예: banner.jpg)
├─ css/
│  └─ style.css         # 모바일/PC 반응형 스타일시트
├─ js/
│  ├─ app.js            # 시작점 및 해시 라우터 (인증 가드 포함)
│  ├─ firebase.js       # Firebase 초기화, 오프라인 캐시, App Check 초기화
│  ├─ auth.js           # 이메일/비밀번호 로그인, 세션 유지, 로그아웃
│  ├─ db.js             # Firestore 'clothes' CRUD, 'outfitLogs'(착용 기록) 저장·삭제·조회
│  ├─ dateUtil.js       # 한국 시간(Asia/Seoul) 기준 날짜 계산·표시 헬퍼
│  ├─ weather.js        # Open-Meteo 날씨 조회 (API 키 불필요)
│  ├─ aiRecommend.js    # AI 코디 추천·옷 사진 분석 (Firebase AI Logic), 응답 검증, 오류 분류
│  ├─ recommend.js      # 점수 기반 추천 규칙 (날씨·무드·반복 방지·감점, 순수 함수)
│  ├─ moodMatrix.js     # 무드 궁합표
│  ├─ imageResize.js    # Canvas 기반 고화질(1200px)·썸네일(400px) WebP 압축
│  ├─ imageStore.js     # 사진 저장/조회/삭제 ('clothImages' 컬렉션)
│  ├─ config.js         # 카테고리·두께·계절·무드 상수, AI 설정(AI_CONFIG), SDK 버전 주소
│  └─ views/
│     ├─ login.js       # 로그인 (#/login)
│     ├─ closet.js      # 옷장 목록 (#/closet)
│     ├─ clothForm.js   # 옷 등록/수정/삭제 (#/cloth/new, #/cloth/:id)
│     ├─ today.js       # 오늘의 코디 (#/today): AI / 기존 방식 탭
│     └─ log.js         # 착용 기록 (#/log)
├─ firestore.rules      # Firestore 보안 규칙 사본 (OWNER_UID 교체용)
├─ test-recommend.js    # 추천 규칙 확인용 테스트
├─ test-recommend.html  # 위 테스트의 브라우저 버전
├─ PRD.md               # 프로젝트 요구사항 정의서
└─ README.md            # 설정 및 배포 가이드
```

---

## 🛠️ 처음 설정하는 순서

### 1. Firebase 프로젝트 생성 (Spark 요금제)
1. [Firebase 콘솔](https://console.firebase.google.com/)에서 새 프로젝트를 만듭니다. (애널리틱스는 선택)
2. 요금제는 기본값인 **Spark(무료)** 를 유지합니다.

### 2. Firebase Authentication 설정
1. **빌드 > Authentication > 시작하기**에서 **이메일/비밀번호**를 사용 설정합니다.
2. **Users** 탭에서 **사용자 추가**로 본인 계정 1개를 만들고, 생성된 **사용자 UID**를 복사해 둡니다.

### 3. Cloud Firestore 생성
**빌드 > Firestore Database > 데이터베이스 만들기**, 위치는 **`asia-northeast3 (서울)`** 을 선택합니다.

### 4. `js/firebase.js`에 `firebaseConfig` 입력
1. 프로젝트 설정(⚙️) > **내 앱**에서 웹(`</>`) 앱을 **한 번만** 등록합니다. (여러 번 등록하면 앱이 중복됩니다. 앱 ID로 구별하세요.)
2. 표시된 `firebaseConfig` 값을 [js/firebase.js](js/firebase.js)에 붙여 넣습니다.
   ```javascript
   export const firebaseConfig = {
     apiKey: "실제_API_KEY",
     authDomain: "내프로젝트.firebaseapp.com",
     projectId: "내프로젝트_ID",
     storageBucket: "내프로젝트.firebasestorage.app",
     messagingSenderId: "실제_SENDER_ID",
     appId: "실제_APP_ID"
   };
   ```
   이 값들은 공개되어도 되는 설정값입니다. 보호는 아래 보안 규칙과 API 키 제한으로 합니다.

### 5. `firestore.rules` 보안 규칙 게시
1. [firestore.rules](firestore.rules)의 `'OWNER_UID'`를 2단계에서 복사한 **내 UID**로 바꿉니다.
   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null
           && request.auth.uid == '실제_내_UID';
       }
     }
   }
   ```
2. 콘솔 **Firestore Database > 규칙** 탭에 그대로 붙여 넣고 **게시**합니다.

### 6. Authentication 승인된 도메인 등록
**Authentication > 설정 > 승인된 도메인**에 `{내_깃허브_아이디}.github.io`를 추가합니다. (`localhost`는 기본 포함)

---

## 💻 로컬에서 실행하고 테스트하기

`file://`로는 ES 모듈이 동작하지 않으므로 로컬 웹 서버를 사용합니다.

```powershell
python -m http.server 8000
```
브라우저에서 `http://localhost:8000` 접속 후 로그인합니다.

### 추천 규칙 테스트
Node.js 22 이상, 프로젝트 루트에서 실행합니다.

```powershell
node --experimental-default-type=module test-recommend.js
```
한국 시간 날짜 경계, 최근 4일 반복 방지, 감점, "입음" 표시 규칙을 확인합니다.

### 로그아웃 상태에서 Firestore 거부 확인
1. `http://localhost:8000/#/login`에서 `F12` > Console을 엽니다.
2. 아래를 실행합니다.
   ```javascript
   const { db } = await import('./js/firebase.js');
   const { getDocs, collection } = await import('https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js');
   await getDocs(collection(db, 'clothes'));
   ```
3. `permission-denied` 오류가 나면 비로그인 접근이 차단된 것입니다.

---

## 🚀 GitHub Pages 배포

1. 공개(Public) 저장소를 만듭니다.
2. 커밋하고 푸시합니다.
   ```powershell
   git add .
   git commit -m "변경 내용"
   git push
   ```
   푸시가 `rejected (fetch first)`로 막히면 서버에 내 컴퓨터에 없는 커밋이 있다는 뜻입니다. `git pull --no-rebase`로 합치고(충돌이 나면 `<<<<<<<` 표시를 정리), 다시 `git push` 하세요. `--force`는 쓰지 않습니다.
3. 저장소 **Settings > Pages > Build and deployment**에서 `Deploy from a branch`, `main` / `/(root)`를 선택하고 **Save**합니다.
4. 1~2분 뒤 발급된 주소로 접속합니다. 수정이 안 보이면 주소 뒤에 `?v=숫자`를 붙이거나 캐시를 지웁니다.
5. 이미지(`images/…`)는 파일 이름 대소문자까지 정확해야 합니다. (GitHub Pages는 대소문자를 구분합니다.)

---

## 🖼️ 옷장 화면 꾸미기와 보기 설정

### 상단 배너
- 사진을 `images/banner.jpg`로 저장하고 `closet.js`의 `.closet-banner` 영역에서 불러옵니다.
- 가로 2000px 이상, 500KB 안팎을 권장합니다. 모바일에서는 높이가 줄어듭니다.

### 한 줄에 보이는 옷 개수
- 옷장 목록 위의 **2개 / 3개 / 4개 / 6개** 버튼으로 바꿉니다.
- 처음에는 화면 폭에 맞는 값(폰 2개, 태블릿 3개, PC 4개)이고, 한 번 고르면 그 브라우저에 저장됩니다.
- 4개 이상에서는 사진과 이름 중심으로 보이고 브랜드·칩·무드 태그는 숨습니다.

---

## 🤖 AI 코디 추천 설정

오늘의 코디 화면에 **AI 추천** 탭이 있습니다. 기존 점수 방식은 **기존 방식 (점수)** 탭에 그대로 남아 있습니다.

### 쓰는 방법
1. `#/today` → **AI 추천** 탭에서 **사진 분석하기**를 누르면 AI가 옷 사진의 색·패턴·핏을 짧게 적어 옷 문서에 저장합니다. 분석이 없는 옷만 한 번에 `photoBatchSize`벌씩 처리합니다. 새 옷이나 사진을 바꾼 옷만 다시 분석합니다.
2. **AI 코디 추천 받기**를 누르면 옷장 전체 + 오늘 날씨 + 최근 4일 착용 기록을 보고 코디를 최대 3개 고릅니다.
3. 마음에 들면 **오늘 이걸 입었어요**로 기록합니다.

AI 호출은 **버튼을 누를 때만** 일어납니다. 실패해도 자동으로 다시 보내지 않습니다.

### Firebase 콘솔에서 해야 할 설정
1. **AI Logic 켜기**: 콘솔 > **AI Logic** > 시작하기 > **Gemini Developer API**. Spark(무료)로 시작할 수 있습니다. 결제 계정을 연결하면 그때부터 모든 사용량이 종량제입니다.
2. **App Check (2026-11-02부터 필수)**: 콘솔 > 보안 > **App Check** > 웹 앱 등록 > **reCAPTCHA Enterprise**.
   - **등록하는 앱은 `firebase.js`의 `appId`와 같은 앱이어야 합니다.** 앱이 여러 개면 앱 ID로 확인하세요.
   - 발급된 사이트 키를 `js/config.js`의 `AI_CONFIG.appCheck.recaptchaEnterpriseSiteKey`에 넣습니다.
   - App Check > API 탭에서 **Firebase AI Logic**을 **시행됨**으로 바꿉니다. reCAPTCHA Enterprise는 월 1만 건까지 무료이고 결제 계정 없이 쓸 수 있습니다.
   - `localhost`에서 테스트하면 브라우저 콘솔에 디버그 토큰이 출력됩니다. 콘솔 > App Check > 앱 > **디버그 토큰 관리**에 등록하세요. 디버그 토큰은 저장소에 올리지 마세요. `localhost`를 reCAPTCHA 허용 도메인에 추가하지 마세요.
3. **API 키 제한**: Google Cloud 콘솔 > API 및 서비스 > 사용자 인증 정보 > 웹 API 키에서 *애플리케이션 제한*을 HTTP 리퍼러(`https://<내 GitHub 아이디>.github.io/*`)로 두고, *API 제한*에 **Firebase AI Logic API**(`firebasevertexai.googleapis.com`)를 포함합니다.
4. **사용량 확인**: 콘솔 AI Logic 모니터링을 켜고, 모델별 무료 한도(분당 요청, 분당 토큰, 하루 요청)는 [AI Studio rate-limit 화면](https://aistudio.google.com/rate-limit)에서 직접 확인합니다. 한도는 예고 없이 바뀔 수 있습니다.
5. **배포한 실제 주소**에서 AI 추천을 한 번 눌러 확인합니다.

### AI 설정값 (`js/config.js`의 `AI_CONFIG`)

| 항목 | 기본값 | 설명 |
|---|---|---|
| `enabled` | `true` | `false`면 AI 탭이 사라지고 기존 점수 추천만 보입니다 |
| `recommendModel` | `gemini-3.5-flash-lite` | 코디 추천에 쓰는 모델 |
| `photoModel` | `gemini-3.5-flash-lite` | 사진 분석에 쓰는 모델 |
| `recommendThinkingLevel` | `LOW` | 추천 모델의 생각 깊이(`MINIMAL`/`LOW`/`MEDIUM`/`HIGH`, 빈 값이면 모델 기본값). 응답이 느리면 낮추세요. 모델이 거부하면 빈 값으로 두세요 |
| `requestTimeoutMs` | `120000` | 응답을 기다리는 최대 시간(ms). 넘으면 실패 처리 |
| `maxRecommendations` | `3` | 한 번에 보여 줄 코디 수 |
| `photoBatchSize` | `6` | 사진 분석 1회에 담는 옷 수 |
| `recentWearDays` | `4` | AI에게 알려 줄 최근 착용 일수 |
| `maxFieldChars` | `300` | 메모·이름 등을 AI에 보낼 때의 최대 글자 수 |
| `maxVisualDescriptionChars` | `200` | 저장할 사진 설명의 최대 글자 수 |
| `stylePreference` | (직접 수정) | 내 취향 문장. AI에게 참고 정보로만 전달됩니다 |

모델 이름은 Firebase 공식 문서의 *지원 모델* 목록에 있는 것만 쓰세요. 모델이 종료되면 "설정된 AI 모델을 찾을 수 없어요"가 뜹니다.

### 토큰과 한도 가늠하기
- 코디 추천 1회 입력은 옷 1벌당 대략 100~150토큰입니다. (옷 23벌에서 6~7천 토큰이 확인됐습니다.)
- 사진 분석은 옷 6벌 1회에 약 9천 토큰 안팎입니다.
- 옷이 많아져서 느려지거나 한도에 걸리면 `maxFieldChars`를 줄이거나, 계절·기온에 안 맞는 옷을 미리 걸러서 보내도록 코드를 개선하세요.

### Firebase SDK 버전
AI Logic을 위해 SDK를 **13.1.0**으로 맞췄습니다. `firebase.js`, `auth.js`, `db.js`, `imageStore.js`의 import 주소와 `config.js`의 `FIREBASE_SDK_BASE`는 **항상 같은 버전**이어야 합니다. 버전을 바꿀 땐 이 5곳을 함께 고치세요.

### 개인정보
사진 분석을 누르면 옷 사진이 Google의 Gemini API로 전송되고, 추천을 받을 때는 옷 이름·브랜드·메모 등이 전송됩니다. 개인적인 내용을 메모에 적지 마세요. 무료 이용 시 데이터 사용 조건은 Gemini API 약관에서 확인하세요.

### 오류 해결

| 화면 메시지 | 확인할 것 |
|---|---|
| App Check 인증에 실패했어요 | 사이트 키 입력, 앱 ID 일치, 도메인 허용, 로컬이면 디버그 토큰 등록 |
| AI Logic이 아직 켜져 있지 않아요 | 콘솔에서 AI Logic 시작하기를 했는지 |
| AI 호출 권한이 거부됐어요 | API 키 제한(리퍼러·API 목록) |
| 요청 한도를 넘었어요 | 잠시 뒤 재시도, AI Studio에서 한도·사용량 확인 |
| 지금 AI 모델에 사용자가 몰렸어요 (500, high demand) | 구글 서버 혼잡입니다. 몇 분 뒤 재시도하거나 `recommendModel`을 다른 모델로 바꿉니다 |
| AI 응답이 너무 오래 걸려요 | `recommendThinkingLevel`을 낮추거나 다른 모델로 바꿉니다 |
| AI 서버와 연결이 끊겼어요 | 인터넷 확인, 응답을 기다리는 동안 화면을 끄거나 앱을 나가지 않기, 광고 차단 앱 확인 |
| 모델을 찾을 수 없어요 | `config.js`의 모델 이름 |
| 응답 형식이 올바르지 않아요 | 다시 시도 (잘못된 응답은 화면에 쓰지 않고 버립니다) |

---

## 🔐 비밀 값 관리

- 저장소에 올려도 되는 값: `firebaseConfig`, reCAPTCHA **사이트 키**.
- 저장소에 올리면 안 되는 값: reCAPTCHA **비밀 키**, App Check **디버그 토큰**, 관리자 서비스 계정 키, 개인 이메일·비밀번호.
- 모든 데이터 접근은 Firestore 보안 규칙(본인 UID만 허용)과 API 키 제한이 지킵니다.
