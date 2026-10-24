/**
 * config.js
 * 내 옷장 프로젝트 설정 및 선택지 상수
 */

// 카테고리 목록 (순서 고정)
export const CATEGORIES = [
  '아우터',
  '니트',
  '맨투맨',
  '셔츠',
  '하의',
  '신발',
  '기타'
];

// 색상 선택지
export const COLORS = [
  '블랙',
  '화이트',
  '그레이',
  '네이비',
  '베이지',
  '브라운',
  '카키',
  '블루',
  '그린',
  '레드',
  '옐로우',
  '기타'
];

// 두께 선택지
export const THICKNESSES = [
  '얇음',
  '보통',
  '두꺼움'
];

// 계절 선택지
export const SEASONS = [
  '봄',
  '여름',
  '가을',
  '겨울'
];

// 무드 태그 기본 목록 (사용자가 직접 추가 가능)
export const DEFAULT_MOODS = [
  '아메카지',
  '워크웨어',
  '밀리터리',
  '빈티지',
  '아이비',
  '프레피'
];

// 이미지 리사이즈 및 압축 설정
export const IMAGE_CONFIG = {
  detail: {
    maxDimension: 1200,     // 긴 변 최대 1200px
    initialQuality: 0.8,    // 초기 WebP 품질
    maxSizeBytes: 700 * 1024 // 초과 시 품질을 낮춰 재압축할 기준 (약 700KB)
  },
  thumbnail: {
    maxDimension: 400,      // 긴 변 최대 400px
    quality: 0.8            // WebP 품질
  }
};
