/**
 * imageResize.js
 * 브라우저 캔버스를 이용한 이미지 리사이즈 및 WebP 압축 모듈
 */

import { IMAGE_CONFIG } from "./config.js";

/**
 * 원본 비율을 유지하며 긴 변을 maxDimension에 맞추는 크기 계산
 * @param {number} width 
 * @param {number} height 
 * @param {number} maxDimension 
 * @returns {{width: number, height: number}}
 */
export function calculateDimensions(width, height, maxDimension) {
  let targetWidth = width;
  let targetHeight = height;

  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      targetWidth = maxDimension;
      targetHeight = Math.round((height * maxDimension) / width);
    } else {
      targetHeight = maxDimension;
      targetWidth = Math.round((width * maxDimension) / height);
    }
  }

  return { width: targetWidth, height: targetHeight };
}

/**
 * File 또는 Blob 객체를 HTMLImageElement로 로드
 * @param {File|Blob} file 
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 파일을 읽을 수 없습니다. 올바른 이미지 파일인지 확인해주세요."));
    };

    img.src = url;
  });
}

/**
 * Data URL의 실제 UTF-8/스토리지 바이트 크기 계산
 * @param {string} dataUrl 
 * @returns {number} byte size
 */
export function getDataUrlByteLength(dataUrl) {
  return new Blob([dataUrl]).size;
}

/**
 * 캔버스를 이용해 특정 크기 및 품질의 WebP Data URL로 압축
 * @param {File|Blob} file 
 * @param {number} maxDimension 
 * @param {number} initialQuality 
 * @param {number|null} maxSizeBytes 초과 시 품질을 점진적으로 낮출 기준 바이트
 * @returns {Promise<{dataUrl: string, width: number, height: number, bytes: number, quality: number}>}
 */
export async function resizeImageToDataUrl(file, maxDimension, initialQuality = 0.8, maxSizeBytes = null) {
  const img = await loadImage(file);
  const { width, height } = calculateDimensions(img.width, img.height, maxDimension);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  // 배경 투명 방지 흰색 채우기
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = initialQuality;
  let dataUrl = canvas.toDataURL("image/webp", quality);

  // 브라우저가 WebP를 지원하지 않아 png로 폴백된 경우 대비
  if (!dataUrl.startsWith("data:image/webp")) {
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  let bytes = getDataUrlByteLength(dataUrl);

  // maxSizeBytes(예: 700KB)를 초과하는 경우 품질을 단계적으로 낮춰 재압축
  if (maxSizeBytes && bytes > maxSizeBytes) {
    while (bytes > maxSizeBytes && quality > 0.2) {
      quality = Math.max(0.1, Math.round((quality - 0.1) * 10) / 10);
      dataUrl = canvas.toDataURL("image/webp", quality);
      if (!dataUrl.startsWith("data:image/webp")) {
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      bytes = getDataUrlByteLength(dataUrl);
    }
  }

  return {
    dataUrl,
    width,
    height,
    bytes,
    quality
  };
}

/**
 * 옷 사진 1장을 받아 썸네일(400px)과 보기용 상세 사진(1200px)으로 동시 가공
 * @param {File} file 
 * @returns {Promise<{thumb: string, detail: {dataUrl: string, width: number, height: number, bytes: number}}>}
 */
export async function processClothImage(file) {
  // 1. 보기용 상세 이미지: 긴 변 1200px, 품질 0.8, 약 700KB 이하로 압축
  const detail = await resizeImageToDataUrl(
    file,
    IMAGE_CONFIG.detail.maxDimension,
    IMAGE_CONFIG.detail.initialQuality,
    IMAGE_CONFIG.detail.maxSizeBytes
  );

  // 2. 썸네일: 긴 변 400px, 품질 0.8, 약 30KB 안팎
  const thumb = await resizeImageToDataUrl(
    file,
    IMAGE_CONFIG.thumbnail.maxDimension,
    IMAGE_CONFIG.thumbnail.quality,
    null
  );

  return {
    thumb: thumb.dataUrl,
    detail: {
      dataUrl: detail.dataUrl,
      width: detail.width,
      height: detail.height,
      bytes: detail.bytes
    }
  };
}
