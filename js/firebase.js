/**
 * firebase.js
 * Firebase 초기화 및 Firestore 오프라인 캐시 설정
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore 
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

import { AI_CONFIG, FIREBASE_SDK_BASE } from "./config.js";

// Firebase 콘솔에서 복사한 웹 앱 설정값 (자리표시자)
export const firebaseConfig = {
  apiKey: "AIzaSyBqvEi7VaKChSygbEyaO5_oOKZ4XFI6A7w",
  authDomain: "private-closet.firebaseapp.com",
  projectId: "private-closet",
  storageBucket: "private-closet.firebasestorage.app",
  messagingSenderId: "967050470336",
  appId: "1:967050470336:web:3aced804228413a25a5e25"
};

/**
 * firebaseConfig가 실제 값으로 설정되었는지 확인
 */
export function isFirebaseConfigured() {
  return (
    Boolean(firebaseConfig.apiKey) &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    Boolean(firebaseConfig.projectId) &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
}

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // 로그인 상태 로컬 스토리지에 유지 (Local Persistence)
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("Auth persistence error:", err);
    });

    // Firestore 오프라인 영구 캐시 활성화 (읽기 횟수 절약 및 다중 탭 지원)
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (cacheErr) {
      console.warn("Firestore persistent cache fallback to default:", cacheErr);
      db = getFirestore(app);
    }
  } catch (err) {
    console.error("Firebase 초기화 중 오류 발생:", err);
  }
}

let appCheckPromise = null;

/**
 * App Check(reCAPTCHA Enterprise) 초기화 — AI 호출 직전에 한 번만 실행한다.
 * 사이트 키가 비어 있으면 초기화하지 않고 이유만 돌려준다. (옷장·로그인 등 기존 기능에는 영향 없음)
 * localhost 에서는 디버그 모드를 켜서 콘솔에 디버그 토큰이 출력되게 한다.
 * (토큰은 Firebase 콘솔 > 앱 체크 > 앱 > 디버그 토큰 관리에 등록. 토큰을 코드에 적지 않는다.)
 * @returns {Promise<{ok: boolean, reason?: string, error?: Error}>}
 */
export function ensureAppCheck() {
  if (!app) return Promise.resolve({ ok: false, reason: "no-app" });

  if (!appCheckPromise) {
    appCheckPromise = (async () => {
      const siteKey = AI_CONFIG.appCheck.recaptchaEnterpriseSiteKey;
      if (!siteKey) return { ok: false, reason: "no-site-key" };

      const { initializeAppCheck, ReCaptchaEnterpriseProvider } =
        await import(`${FIREBASE_SDK_BASE}/firebase-app-check.js`);

      const host = globalThis.location?.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }

      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
      return { ok: true };
    })().catch((error) => {
      console.error("App Check 초기화 실패:", error);
      return { ok: false, reason: "error", error };
    });
  }

  return appCheckPromise;
}

export { app, auth, db };
