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
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const CLOTHES_COLLECTION = "clothes";
const OUTFIT_LOGS_COLLECTION = "outfitLogs";
const DATE_ID_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

/* ==========================================================================
   착용 기록 (outfitLogs) - 3단계
   문서 ID = 한국 시간 날짜(YYYY-MM-DD)라서 하루 1건이 자동으로 지켜진다.
   ========================================================================== */

/**
 * 착용 기록 전체 조회 (날짜 내림차순)
 * @returns {Promise<Array<{id: string, wearDate: string, itemIds: string[], weatherSummary: string, moodLabel: string}>>}
 */
export async function getOutfitLogs() {
  assertDbAvailable();
  const snap = await getDocs(collection(db, OUTFIT_LOGS_COLLECTION));
  const list = [];

  snap.forEach((d) => {
    const data = d.data();
    list.push({
      id: d.id,
      ...data,
      wearDate: data.wearDate || d.id,
      itemIds: Array.isArray(data.itemIds) ? data.itemIds : []
    });
  });

  list.sort((a, b) => (a.wearDate < b.wearDate ? 1 : a.wearDate > b.wearDate ? -1 : 0));
  return list;
}

/**
 * 착용 기록 저장 (같은 날짜 문서가 있으면 덮어쓰기)
 * @param {{wearDate: string, itemIds: string[], weatherSummary?: string, moodLabel?: string}} entry
 * @returns {Promise<string>} 저장된 날짜(문서 ID)
 */
export async function saveOutfitLog(entry) {
  assertDbAvailable();
  const wearDate = entry?.wearDate;
  if (!DATE_ID_PATTERN.test(wearDate || "")) {
    throw new Error("착용 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)");
  }
  if (!Array.isArray(entry.itemIds) || entry.itemIds.length === 0) {
    throw new Error("기록할 옷을 1벌 이상 선택해주세요.");
  }

  await setDoc(doc(db, OUTFIT_LOGS_COLLECTION, wearDate), {
    wearDate,
    itemIds: entry.itemIds,
    weatherSummary: entry.weatherSummary || "",
    moodLabel: entry.moodLabel || "",
    createdAt: serverTimestamp()
  });

  return wearDate;
}

/**
 * 착용 기록 삭제(취소)
 * @param {string} wearDate YYYY-MM-DD
 */
export async function deleteOutfitLog(wearDate) {
  assertDbAvailable();
  if (!DATE_ID_PATTERN.test(wearDate || "")) {
    throw new Error("착용 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)");
  }
  await deleteDoc(doc(db, OUTFIT_LOGS_COLLECTION, wearDate));
  return true;
}

/**
 * 옷 한 벌의 마지막 착용일과 총 착용 횟수 (별도 카운터 없이 기록 전체에서 계산)
 * @param {Array<Object>} logs getOutfitLogs() 결과
 * @param {string} clothId
 * @returns {{count: number, lastDate: string|null}}
 */
export function summarizeWear(logs, clothId) {
  let count = 0;
  let lastDate = null;

  for (const log of logs || []) {
    if (!Array.isArray(log.itemIds) || !log.itemIds.includes(clothId)) continue;
    count += 1;
    if (!lastDate || log.wearDate > lastDate) {
      lastDate = log.wearDate;
    }
  }

  return { count, lastDate };
}
