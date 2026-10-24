# 내 옷장 (My Closet) - 1단계: 옷장 관리

나만의 데일리 옷장 관리 및 코디 추천 웹 애플리케이션입니다.  
별도의 백엔드 서버 없이 브라우저(ES 모듈)와 Firebase(Auth, Firestore)만으로 동작하며, GitHub Pages를 통해 무료로 호스팅됩니다.

---

## 📁 프로젝트 구조 (1단계)

```text
/
├─ index.html           # 메인 HTML (단일 페이지 해시 라우팅)
├─ css/
│  └─ style.css         # 모바일/PC 반응형 스타일시트
├─ js/
│  ├─ app.js            # 시작점 및 해시 라우터 (인증 가드 포함)
│  ├─ firebase.js       # Firebase 초기화 및 오프라인 캐시 설정 (firebaseConfig 입력 위치)
│  ├─ auth.js           # 이메일/비밀번호 로그인, 세션 유지, 로그아웃
│  ├─ db.js             # Firestore 'clothes' 컬렉션 CRUD 연동
│  ├─ imageResize.js    # Canvas 기반 고화질(1200px) 및 썸네일(400px) WebP 압축
│  ├─ imageStore.js     # 사진 저장/조회/삭제 인터페이스 ('clothImages' 컬렉션)
│  ├─ config.js         # 카테고리, 두께, 계절, 무드 태그 등 공통 상수
│  └─ views/
│     ├─ login.js       # 로그인 뷰 (#/login)
│     ├─ closet.js      # 옷장 목록 뷰 (#/closet)
│     ├─ clothForm.js   # 옷 등록/수정/삭제 뷰 (#/cloth/new, #/cloth/:id)
│     ├─ today.js       # 오늘의 코디 (2단계 준비 중)
│     └─ log.js         # 착용 기록 (3단계 준비 중)
├─ firestore.rules      # Firestore 보안 규칙 사본 (OWNER_UID 교체용)
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
   const { getDocs, collection } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
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
