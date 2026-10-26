# 내 옷장 (My Closet)

나만의 데일리 옷장 관리 및 코디 추천 웹 애플리케이션입니다.  
별도의 백엔드 서버 없이 브라우저(ES 모듈)와 Firebase(Auth, Firestore)만으로 동작하며, GitHub Pages를 통해 무료로 호스팅됩니다.

---

## 📁 프로젝트 구조

```text
/
├─ index.html           # 메인 HTML (단일 페이지 해시 라우팅)
├─ css/
│  └─ style.css         # 모바일/PC 반응형 스타일시트
├─ js/
│  ├─ app.js            # 시작점 및 해시 라우터 (인증 가드 포함)
│  ├─ firebase.js       # Firebase 초기화 및 오프라인 캐시 설정 (firebaseConfig 입력 위치)
│  ├─ auth.js           # 이메일/비밀번호 로그인, 세션 유지, 로그아웃
│  ├─ db.js             # Firestore 'clothes' CRUD, 'outfitLogs'(착용 기록) 저장·삭제·조회
│  ├─ dateUtil.js       # 한국 시간(Asia/Seoul) 기준 날짜 계산·표시 헬퍼
│  ├─ weather.js        # Open-Meteo 날씨 조회 (API 키 불필요)
│  ├─ aiRecommend.js    # [4단계] AI 코디 추천·옷 사진 분석 (Firebase AI Logic), 응답 검증
│  ├─ recommend.js      # 추천 규칙 (날씨·무드·반복 방지·최근 착용 감점, 순수 함수)
│  ├─ moodMatrix.js     # 무드 궁합표
│  ├─ imageResize.js    # Canvas 기반 고화질(1200px) 및 썸네일(400px) WebP 압축
│  ├─ imageStore.js     # 사진 저장/조회/삭제 인터페이스 ('clothImages' 컬렉션)
│  ├─ config.js         # 카테고리, 두께, 계절, 무드 태그 등 공통 상수
│  └─ views/
│     ├─ login.js       # 로그인 뷰 (#/login)
│     ├─ closet.js      # 옷장 목록 뷰 (#/closet)
│     ├─ clothForm.js   # 옷 등록/수정/삭제 뷰 (#/cloth/new, #/cloth/:id)
│     ├─ today.js       # 오늘의 코디 (#/today): 날씨·추천 3개·"입었어요" 체크
│     └─ log.js         # 착용 기록 (#/log): 날짜별 기록, 삭제, 직접 기록
├─ firestore.rules      # Firestore 보안 규칙 사본 (OWNER_UID 교체용)
├─ test-recommend.js    # 추천 규칙 확인용 테스트 (2·3단계)
├─ test-recommend.html  # 위 테스트의 브라우저 버전
├─ PRD.md               # 프로젝트 요구사항 정의서
└─ README.md            # 설정 및 배포 가이드
```

---

## 🛠️ 내가 해야 할 설정 순서

애플리케이션을 실행하고 배포하기 위해 아래 단계를 순서대로 진행해주세요.

### 1. Firebase 프로젝트 생성 (Spark 요금제)
1. [Firebase 콘솔](https://console.firebase.google.com/)에 접속하여 새 프로젝트를 만듭니다. (Google 애널리틱스는 선택 사항이며 끄셔도 됩니다)
2. 요금제는 기본값인 **Spark(무료)** 요금제를 그대로 유지합니다.

### 2. Firebase Authentication 설정
1. 좌측 메뉴 **빌드 > Authentication**으로 이동합니다.
2. **시작하기**를 누르고 **로그인 방법** 탭에서 **이메일/비밀번호**를 사용 설정합니다.
3. **Users(사용자)** 탭으로 이동하여 **[사용자 추가]** 버튼을 누르고, 본인이 사용할 이메일과 비밀번호로 계정 1개를 생성합니다.
4. 생성된 사용자의 **사용자 UID**(예: `aB3dEf9Gh...`)를 복사해 둡니다.

### 3. Cloud Firestore 데이터베이스 생성
1. 좌측 메뉴 **빌드 > Firestore Database**로 이동하여 **[데이터베이스 만들기]**를 클릭합니다.
2. 데이터베이스 위치는 **`asia-northeast3 (서울)`**을 선택합니다.

### 4. `js/firebase.js`에 `firebaseConfig` 입력
1. Firebase 프로젝트 개요 옆의 ⚙️(프로젝트 설정) 아이콘을 누르고 **내 앱** 섹션에서 웹(`</>`) 아이콘을 클릭하여 앱을 등록합니다.
2. 화면에 표시되는 `firebaseConfig` 객체 값을 복사합니다.
3. 프로젝트 내 [js/firebase.js](file:///C:/My_Project_Pri/Private_closet/js/firebase.js) 파일을 열어 `firebaseConfig` 객체에 실제 값들을 붙여넣습니다:
   ```javascript
   export const firebaseConfig = {
     apiKey: "실제_API_KEY",
     authDomain: "내프로젝트.firebaseapp.com",
     projectId: "내프로젝트_ID",
     storageBucket: "내프로젝트.appspot.com",
     messagingSenderId: "실제_SENDER_ID",
     appId: "실제_APP_ID"
   };
   ```

### 5. `firestore.rules` 보안 규칙 설정 및 게시
1. 프로젝트 루트의 [firestore.rules](file:///C:/My_Project_Pri/Private_closet/firestore.rules) 파일을 엽니다.
2. `'OWNER_UID'` 부분을 앞서 2단계에서 복사한 본인의 **실제 사용자 UID**로 바꿉니다.
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
3. Firebase 콘솔의 **Firestore Database > 규칙** 탭에 위 내용을 그대로 붙여넣고 **[게시(Publish)]** 버튼을 클릭합니다.

### 6. Authentication 승인된 도메인 등록
1. Firebase 콘솔 **Authentication > 설정 > 승인된 도메인** 탭으로 이동합니다.
2. **도메인 추가**를 누르고 GitHub Pages 도메인(`{내_깃허브_아이디}.github.io`)을 추가합니다. (로컬 테스트용 `localhost`는 기본 포함되어 있습니다)

---

## 💻 로컬에서 실행하고 테스트하기

브라우저 보안(CORS 및 ES 모듈) 정책상 `file://` 대신 로컬 웹 서버로 열어야 합니다:

```powershell
# 프로젝트 폴더에서 로컬 웹서버 실행
python -m http.server 8000
```
브라우저에서 `http://localhost:8000` 접속 후 로그인하여 테스트합니다.

---

## 🔒 로그아웃 상태에서 Firestore 거부 확인 방법

보안 규칙이 제대로 적용되어 로그인하지 않은 외부인이 내 옷 데이터에 접근할 수 없는지 확인하는 방법입니다:

1. 브라우저에서 `http://localhost:8000/#/login`으로 접속합니다 (로그아웃 상태).
2. `F12`를 눌러 **개발자 도구 > Console(콘솔)** 탭을 엽니다.
3. 콘솔 창에 아래 명령어를 입력하고 실행합니다:
   ```javascript
   const { db } = await import('./js/firebase.js');
   const { getDocs, collection } = await import('https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js');
   await getDocs(collection(db, 'clothes'));
   ```
4. **확인 결과:** 콘솔에 `FirebaseError: [code=permission-denied]: Missing or insufficient permissions.` 에러가 발생하면 비인가 접근이 완벽히 차단된 것입니다.

---

## 🚀 GitHub Pages 배포 방법

1. GitHub에서 공개(Public) 저장소를 생성합니다.
2. 로컬 저장소를 커밋하고 푸시합니다:
   ```powershell
   git init
   git add .
   git commit -m "feat: 1단계 옷장 관리 웹페이지 구현"
   git branch -M main
   git remote add origin https://github.com/{내_깃허브_아이디}/{저장소명}.git
   git push -u origin main
   ```
3. GitHub 저장소의 **Settings > Pages** 메뉴로 이동합니다.
4. **Build and deployment > Source**에서 `Deploy from a branch`를 선택하고, **Branch**를 `main` / `/(root)`로 지정한 뒤 **Save**를 누릅니다.
5. 1~2분 후 제공되는 GitHub Pages URL로 접속하여 이용합니다.

---

## 🧪 추천 규칙 테스트 실행

Node.js 22 이상이면 프로젝트 루트에서 아래처럼 실행할 수 있습니다. (`package.json`이 없어서 ES 모듈로 인식시키는 옵션이 필요합니다.)

```powershell
node --experimental-default-type=module test-recommend.js
```

한국 시간 날짜 경계, 최근 4일 반복 방지, 옷 1벌당 0.25점 감점, "입음" 표시 규칙을 확인합니다.

---

## 🤖 4단계: AI 코디 추천 설정

오늘의 코디 화면에 **AI 추천** 탭이 생깁니다. 기존 점수 방식은 **기존 방식 (점수)** 탭으로 그대로 남아 있습니다.

### 쓰는 방법

1. `#/today` → **AI 추천** 탭에서 **사진 분석하기**를 누르면 AI가 옷 사진의 색·패턴·핏을 짧게 적어 옷 문서에 저장합니다. (분석이 없는 옷만, 한 번에 `photoBatchSize`벌씩)
2. **AI 코디 추천 받기**를 누르면 AI가 옷장 전체 + 오늘 날씨 + 최근 4일 착용 기록을 보고 코디를 최대 3개 고릅니다. 레이어 순서와 이유가 함께 나옵니다.
3. 마음에 들면 **오늘 이걸 입었어요**로 기록합니다. (기존 착용 기록과 같은 기능)

AI 호출은 **버튼을 누를 때만** 일어납니다. 화면에 들어오기만 해서는 호출하지 않고, 실패해도 자동으로 다시 보내지 않습니다.

### 내가 해야 할 설정 (Firebase 콘솔)

1. **AI Logic 켜기**: Firebase 콘솔 > **AI Logic** > 시작하기 > **Gemini Developer API**를 고릅니다. 요금제는 Spark(무료)를 유지해도 시작할 수 있습니다. (결제 계정을 연결하면 그때부터 모든 사용량이 종량제입니다)
2. **App Check (필수, 2026-11-02부터)**: 콘솔 > 보안 > **App Check** > 웹 앱 등록 > **reCAPTCHA Enterprise**. 발급된 사이트 키를 `js/config.js`의 `AI_CONFIG.appCheck.recaptchaEnterpriseSiteKey`에 넣고, App Check > API 탭에서 **Firebase AI Logic**을 **시행됨**으로 바꿉니다. reCAPTCHA Enterprise는 월 1만 건까지 무료이고 결제 계정 없이 쓸 수 있습니다.
   - 로컬(`localhost`)에서 테스트하면 브라우저 콘솔에 디버그 토큰이 출력됩니다. 콘솔 > App Check > 앱 > **디버그 토큰 관리**에 등록하세요. 디버그 토큰은 저장소에 올리지 마세요. `localhost`를 reCAPTCHA 허용 도메인에 추가하지 마세요.
3. **API 키 제한**: Google Cloud 콘솔 > API 및 서비스 > 사용자 인증 정보 > 웹 API 키에서 *애플리케이션 제한*을 HTTP 리퍼러(`https://<내 GitHub 아이디>.github.io/*`)로 두고, *API 제한*에 **Firebase AI Logic API**(`firebasevertexai.googleapis.com`)를 포함합니다.
4. **사용량 관리**: AI Logic 화면에서 모니터링을 켜고 사용자별 요청 제한을 확인합니다. 모델별 무료 한도는 문서에 숫자가 없으므로 [AI Studio의 rate-limit 화면](https://aistudio.google.com/rate-limit)에서 직접 확인하세요.
5. **GitHub Pages에 배포**한 뒤 실제 주소에서 AI 추천을 한 번 눌러 확인합니다.

### 모델 이름 바꾸기

모델 이름은 `js/config.js`의 `AI_CONFIG.recommendModel`(코디 추천), `AI_CONFIG.photoModel`(사진 분석)에서만 바꿉니다. Firebase 공식 문서의 *지원 모델* 목록에 있는 이름만 쓰세요. 모델이 종료되면 "설정된 AI 모델을 찾을 수 없어요"가 뜹니다.

### Firebase SDK 버전

AI Logic을 쓰려고 SDK를 **13.1.0**으로 올렸습니다. `firebase.js`, `auth.js`, `db.js`, `imageStore.js`의 import 주소와 `config.js`의 `FIREBASE_SDK_BASE`는 **항상 같은 버전**이어야 합니다. 버전을 바꿀 땐 이 5곳을 함께 고치세요.

### 개인정보

사진 분석을 누르면 옷 사진이 Google의 Gemini API로 전송되고, 추천을 받을 때는 옷 이름·브랜드·메모 등 옷장 정보가 전송됩니다. 개인적인 내용을 메모에 적지 마세요. 무료 이용 시 데이터 사용 조건은 Gemini API 약관에서 직접 확인하세요.

### 오류 해결

| 화면 메시지 | 확인할 것 |
|---|---|
| App Check 인증에 실패했어요 | 사이트 키 입력, 도메인 허용, 로컬이면 디버그 토큰 등록 |
| AI Logic이 아직 켜져 있지 않아요 | 콘솔에서 AI Logic 시작하기를 했는지 |
| AI 호출 권한이 거부됐어요 | API 키 제한(리퍼러·API 목록) |
| 요청 한도를 넘었어요 | 잠시 뒤 재시도, AI Studio에서 한도·사용량 확인 |
| 모델을 찾을 수 없어요 | `config.js`의 모델 이름 |
| 응답 형식이 올바르지 않아요 | 다시 시도 (잘못된 응답은 화면에 쓰지 않고 버립니다) |
