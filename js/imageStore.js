/**
 * imageStore.js
 * 보기용 상세 이미지 저장/읽기/삭제 인터페이스 (Cloud Firestore 기반)
 * 나중에 Cloud Storage 등으로 교체 시 이 파일만 수정하도록 분리됨.
 */

import { db } from "./firebase.js";
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const COLLECTION_NAME = "clothImages";

/**
 * 보기용 상세 사진 저장
 * @param {string} clothId - 옷 문서 ID
 * @param {{dataUrl: string, width: number, height: number, bytes: number}} imageData 
 */
export async function saveImage(clothId, imageData) {
  if (!db) {
    throw new Error("Firebase DB가 초기화되지 않았습니다. firebase.js 설정을 확인해주세요.");
  }
  if (!clothId) {
    throw new Error("clothId가 지정되지 않았습니다.");
  }
  if (!imageData || !imageData.dataUrl) {
    throw new Error("저장할 이미지 데이터가 올바르지 않습니다.");
  }

  const docRef = doc(db, COLLECTION_NAME, clothId);
  await setDoc(docRef, {
    dataUrl: imageData.dataUrl,
    width: imageData.width || 0,
    height: imageData.height || 0,
    bytes: imageData.bytes || 0,
    updatedAt: serverTimestamp()
  });
  return true;
}

/**
 * 보기용 상세 사진 읽기
 * @param {string} clothId - 옷 문서 ID
 * @returns {Promise<{dataUrl: string, width: number, height: number, bytes: number}|null>}
 */
export async function getImage(clothId) {
  if (!db) {
    throw new Error("Firebase DB가 초기화되지 않았습니다. firebase.js 설정을 확인해주세요.");
  }
  if (!clothId) return null;

  const docRef = doc(db, COLLECTION_NAME, clothId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

/**
 * 보기용 상세 사진 삭제
 * @param {string} clothId - 옷 문서 ID
 */
export async function deleteImage(clothId) {
  if (!db) {
    throw new Error("Firebase DB가 초기화되지 않았습니다. firebase.js 설정을 확인해주세요.");
  }
  if (!clothId) return false;

  const docRef = doc(db, COLLECTION_NAME, clothId);
  await deleteDoc(docRef);
  return true;
}
