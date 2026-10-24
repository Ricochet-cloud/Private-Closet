/**
 * firebase.js
 * Firebase 초기화 및 Firestore 오프라인 캐시 설정
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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

export { app, auth, db };
