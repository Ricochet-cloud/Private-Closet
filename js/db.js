/**
 * db.js
 * Firestore 'clothes' 컬렉션 데이터 관리 모듈
 * 사진 저장은 imageStore.js 인터페이스를 통해 처리
 */

import { db } from "./firebase.js";
import * as imageStore from "./imageStore.js";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const CLOTHES_COLLECTION = "clothes";

/**
 * DB 초기화 확인 헬퍼
 */
function assertDbAvailable() {
  if (!db) {
    throw new Error("Firebase DB가 초기화되지 않았습니다. js/firebase.js 설정을 확인해주세요.");
  }
}

/**
 * 전체 옷 목록 조회
 * @returns {Promise<Array<Object>>}
 */
export async function getClothes() {
  assertDbAvailable();
  const colRef = collection(db, CLOTHES_COLLECTION);
  const snap = await getDocs(colRef);
  const list = [];

  snap.forEach((d) => {
    list.push({ id: d.id, ...d.data() });
  });

  // 클라이언트 메모리에서 등록일시 최신순 정렬 (인덱스 불필요)
  list.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
    return bTime - aTime;
  });

  return list;
}

/**
 * 특정 옷 상세 정보 조회
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
export async function getCloth(id) {
  assertDbAvailable();
  if (!id) return null;

  const docRef = doc(db, CLOTHES_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return null;
  }
  return { id: snap.id, ...snap.data() };
}

/**
 * 새 옷 등록
 * clothes 컬렉션에 메타데이터 및 썸네일을 저장하고,
 * 보기용 상세 이미지는 imageStore를 통해 clothImages 컬렉션에 저장합니다.
 * @param {Object} clothData
 * @param {Object} detailImageData { dataUrl, width, height, bytes }
 * @returns {Promise<string>} 생성된 옷 문서 ID
 */
export async function addCloth(clothData, detailImageData) {
  assertDbAvailable();
  if (!clothData.category) {
    throw new Error("카테고리는 필수 항목입니다.");
  }
  if (!clothData.thumb) {
    throw new Error("옷 사진(썸네일)은 필수 항목입니다.");
  }

  const colRef = collection(db, CLOTHES_COLLECTION);
  const payload = {
    category: clothData.category,
    name: clothData.name ? clothData.name.trim() : "",
    brand: clothData.brand ? clothData.brand.trim() : "",
    color: clothData.color || "",
    thickness: clothData.thickness || "",
    seasons: Array.isArray(clothData.seasons) ? clothData.seasons : [],
    moods: Array.isArray(clothData.moods) ? clothData.moods : [],
    memo: clothData.memo ? clothData.memo.trim() : "",
    thumb: clothData.thumb,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(colRef, payload);
  const clothId = docRef.id;

  // 보기용 상세 이미지 저장 (clothImages 컬렉션)
  if (detailImageData) {
    await imageStore.saveImage(clothId, detailImageData);
  }

  return clothId;
}

/**
 * 기존 옷 정보 수정
 * @param {string} id
 * @param {Object} clothData
 * @param {Object|null} newDetailImageData 새 사진으로 교체된 경우에만 전달
 * @returns {Promise<string>}
 */
export async function updateCloth(id, clothData, newDetailImageData = null) {
  assertDbAvailable();
  if (!id) throw new Error("수정할 옷 ID가 필요합니다.");
  if (!clothData.category) throw new Error("카테고리는 필수 항목입니다.");

  const docRef = doc(db, CLOTHES_COLLECTION, id);
  const payload = {
    category: clothData.category,
    name: clothData.name ? clothData.name.trim() : "",
    brand: clothData.brand ? clothData.brand.trim() : "",
    color: clothData.color || "",
    thickness: clothData.thickness || "",
    seasons: Array.isArray(clothData.seasons) ? clothData.seasons : [],
    moods: Array.isArray(clothData.moods) ? clothData.moods : [],
    memo: clothData.memo ? clothData.memo.trim() : "",
    updatedAt: serverTimestamp()
  };

  // 썸네일 이미지가 변경된 경우 함께 업데이트
  if (clothData.thumb) {
    payload.thumb = clothData.thumb;
  }

  await updateDoc(docRef, payload);

  // 보기용 상세 이미지가 변경된 경우 업데이트
  if (newDetailImageData) {
    await imageStore.saveImage(id, newDetailImageData);
  }

  return id;
}

/**
 * 옷 삭제
 * clothes 문서와 clothImages 사진 문서를 모두 함께 삭제합니다.
 * @param {string} id
 */
export async function deleteCloth(id) {
  assertDbAvailable();
  if (!id) return false;

  const docRef = doc(db, CLOTHES_COLLECTION, id);
  await deleteDoc(docRef);
  await imageStore.deleteImage(id);

  return true;
}
