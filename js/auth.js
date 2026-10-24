/**
 * auth.js
 * Firebase Authentication 로그인, 로그아웃, 인증 상태 감지 모듈
 */

import { auth, isFirebaseConfigured } from "./firebase.js";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

/**
 * Firebase 설정 유효성 검사 헬퍼
 */
function assertAuthAvailable() {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase 설정(firebaseConfig)이 아직 완료되지 않았습니다. js/firebase.js 파일을 먼저 확인해주세요.");
  }
}

/**
 * 이메일 및 비밀번호 로그인
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<User>}
 */
export async function login(email, password) {
  assertAuthAvailable();
  if (!email || !password) {
    throw new Error("이메일과 비밀번호를 모두 입력해주세요.");
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return userCredential.user;
  } catch (error) {
    // 친절한 한국어 에러 메시지로 변환
    let message = "로그인에 실패했습니다.";
    switch (error.code) {
      case "auth/invalid-email":
        message = "올바른 이메일 형식이 아닙니다.";
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        message = "이메일 또는 비밀번호가 일치하지 않습니다.";
        break;
      case "auth/too-many-requests":
        message = "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
        break;
      case "auth/network-request-failed":
        message = "네트워크 연결 상태를 확인해주세요.";
        break;
      default:
        message = error.message || message;
        break;
    }
    const friendlyError = new Error(message);
    friendlyError.code = error.code;
    throw friendlyError;
  }
}

/**
 * 로그아웃
 */
export async function logout() {
  if (!isFirebaseConfigured() || !auth) {
    return;
  }
  await signOut(auth);
}

/**
 * 현재 로그인된 사용자 반환
 * @returns {User|null}
 */
export function getCurrentUser() {
  return auth ? auth.currentUser : null;
}

/**
 * 인증 상태 변경 리스너 등록
 * @param {Function} callback (user) => void
 * @returns {Function} unsubscribe function
 */
export function onAuthChange(callback) {
  if (!isFirebaseConfigured() || !auth) {
    // Firebase 미설정 시 즉시 null 전달
    setTimeout(() => callback(null), 0);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
