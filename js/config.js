/**
 * config.js
 * 내 옷장 프로젝트 설정 및 선택지 상수
 */

// 카테고리 목록 (순서 고정)
export const CATEGORIES = [
  '아우터',
  '니트',
  '스웻',
  '셔츠',
  '하의',
  '신발',
  '기타'
];

// 코디 추천 대상 카테고리
export const OUTER_CATEGORIES = ['아우터'];
export const INNER_CATEGORIES = ['니트', '스웻', '셔츠'];

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

// [2단계] 날씨 위치 설정 (위도·경도 자리표시자 - 서울 기본값)
export const WEATHER_LOCATION = {
  name: "서울",
  latitude: 37.5665,
  longitude: 126.9780
};

// [2단계] 비 판단 기준 (하루 강수확률 50% 이상 또는 현재 강수량 0 초과)
export const RAIN_CRITERIA = {
  precipitationProbabilityMax: 50,
  precipitationCurrent: 0
};

// [2단계] 수동 날씨 선택 시 대표 기온 (추움 / 적당 / 더움)
export const MANUAL_WEATHER_OPTIONS = [
  { label: "추움", temp: 3, description: "두꺼운 옷 위주" },
  { label: "적당", temp: 15, description: "간절기 옷 위주" },
  { label: "더움", temp: 25, description: "가벼운 옷 위주" }
];

// [2단계] 기온 구간 표 (PRD 초안 그대로)
// 기온은 최저·최고 평균 기준 체감 기온으로 사용
export const TEMPERATURE_BANDS = [
  {
    name: "5°C 이하",
    minTemp: -Infinity,
    maxTemp: 5,
    outerThickness: ["두꺼움"],
    innerThickness: ["두꺼움", "보통"],
    allowNoOuter: false
  },
  {
    name: "6~11°C",
    minTemp: 6,
    maxTemp: 11,
    outerThickness: ["두꺼움", "보통"],
    innerThickness: ["보통"],
    allowNoOuter: false
  },
  {
    name: "12~16°C",
    minTemp: 12,
    maxTemp: 16,
    outerThickness: ["보통", "얇음"],
    innerThickness: ["보통", "얇음"],
    allowNoOuter: false
  },
  {
    name: "17~22°C",
    minTemp: 17,
    maxTemp: 22,
    outerThickness: ["얇음"],
    innerThickness: ["얇음", "보통"],
    allowNoOuter: true // 아우터 없이 이너 단독 가능
  },
  {
    name: "23°C 이상",
    minTemp: 23,
    maxTemp: Infinity,
    outerThickness: [], // 아우터 없음
    innerThickness: ["얇음"],
    allowNoOuter: true,
    forceNoOuter: true
  }
];

// [2·3단계] 점수 상수
export const SCORE_CONSTANTS = {
  recentWearPenalty: 0.25, // 최근 착용 감점 (옷 1벌당 0.25점)
  seasonBonus: 0.1,        // 현재 계절 가산 (옷 1벌당 0.1점)
  repeatPreventDays: 4     // 반복 방지 일수 (오늘 제외, 어제부터 4일 전까지)
};

// [3단계] 날짜 기준 시간대 (착용 기록 문서 ID와 반복 방지 일수 계산에 사용)
export const TIMEZONE = "Asia/Seoul";

// [3단계] 추천이 아닌 직접 고른 옷으로 기록했을 때 코디 라벨
export const MANUAL_LOG_LABEL = "직접 기록";

// [2단계] 색 충돌 목록 (PRD: 비워 두고 시작하여 추천 결과를 보며 채움)
// 예: [['블랙', '브라운'], ['레드', '그린']]
export const COLOR_CLASH = [];
