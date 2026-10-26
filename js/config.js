/**
 * config.js
 * 내 옷장 프로젝트 설정 및 선택지 상수
 */

// 카테고리 목록 (순서 고정)
export const CATEGORIES = [
  '아우터',
  '니트',
  '스웨트',
  '티셔츠',
  '셔츠',
  '하의',
  '스니커즈',
  '부츠',
  '구두',
  '모자',
  '기타'
];

// 상위 카테고리별 하위 카테고리
export const SUBCATEGORIES = {
  '아우터': ['윈드브레이커', '레더자켓', '데님자켓', '워크자켓', '코트', '패딩', '플리스', '베스트','블레이저', '기타'],
  '니트': ['니트집업', '가디건', '니트 베스트', '기타'],
  '스웨트': ['맨투맨', '후드티', '후드집업', '기타'],
  '티셔츠': ['반팔 티셔츠', '긴팔 티셔츠', '포켓 티셔츠', '프린팅 티셔츠', '기타'],
  '셔츠': ['옥스포드 셔츠', '데님 셔츠', '체크 셔츠', '기타'],
  '하의': ['데님', '치노 팬츠', '슬랙스', '카고 팬츠', '퍼티그 팬츠', '쇼츠', '트레이닝 팬츠', '기타'],
  '스니커즈': ['로우탑', '하이탑', '러닝화', '캔버스화', '트레일화', '기타'],
  '부츠': ['워크 부츠', '첼시 부츠', '서비스 부츠', '모카신 부츠', '기타'],
  '구두': ['더비 슈즈', '옥스퍼드 슈즈', '로퍼', '윙팁', '기타'],
  '모자': ['볼캡', '비니', '버킷햇', '캠프캡', '헌팅캡', '기타'],
  '기타': ['벨트', '가방', '양말', '액세서리', '기타']
};

// 코디 추천 대상 카테고리
export const OUTER_CATEGORIES = ['아우터'];
export const INNER_CATEGORIES = ['니트', '스웨트', '셔츠'];

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

// [4단계] Firebase SDK CDN 주소 (동적으로 불러오는 모듈용)
// firebase.js, auth.js, db.js, imageStore.js 의 import 주소 버전과 반드시 같아야 한다.
// app / auth / firestore / app-check / ai 는 한 가지 버전으로 통일해야 서로 연결된다.
export const FIREBASE_SDK_BASE = "https://www.gstatic.com/firebasejs/13.1.0";

// [4단계] AI 코디 추천 설정 (모델 이름과 호출 제한값은 여기서만 바꾼다)
export const AI_CONFIG = {
  // false 로 두면 AI 버튼이 사라지고 기존 점수 추천만 보인다
  enabled: true,

  // 모델 이름은 Firebase 공식 문서의 "지원 모델" 목록에서 확인한 값만 쓴다.
  // 무료 사용 가능 여부와 한도는 Firebase 콘솔 / AI Studio 의 rate-limit 화면에서 직접 확인한다.
  recommendModel: "gemini-3.5-flash-lite",
  photoModel: "gemini-3.5-flash-lite",

  maxRecommendations: 3,         // 한 번에 보여줄 최대 코디 수
  photoBatchSize: 6,             // 사진 분석 1회 호출에 담는 옷 수
  requestTimeoutMs: 120000,       // 응답을 기다리는 최대 시간 (초과하면 실패 처리, 자동 재시도 없음)
  recommendThinkingLevel: "LOW",  // 추천 시 사고 수준 (LOW / MEDIUM / HIGH)
  recentWearDays: 4,             // AI에게 알려줄 최근 착용 일수 (오늘 제외)
  maxVisualDescriptionChars: 200, // 저장할 시각적 설명의 최대 글자 수
  maxFieldChars: 300,            // 메모·이름 등 사용자 입력을 AI에 보낼 때의 최대 글자 수

  // 사용자 스타일 취향 (AI에게 참고 정보로만 전달)
  stylePreference: "아메카지, 워크웨어, 빈티지, 아이비 계열을 좋아함. 차분한 색 조합을 선호함.",

  // App Check (reCAPTCHA Enterprise). 2026-11-02 부터 AI Logic 사용에 필수.
  // 사이트 키는 비밀 값이 아니지만 콘솔에서 만든 값을 직접 넣어야 한다. 비워 두면 App Check 를 초기화하지 않는다.
  appCheck: {
    recaptchaEnterpriseSiteKey: "6Lcr6AAuAAAAAKDDmy7DIfeKuP2Gtzgr-t4C5sqS",
    useLimitedUseTokens: false
  }
};

// [3단계] 날짜 기준 시간대 (착용 기록 문서 ID와 반복 방지 일수 계산에 사용)
export const TIMEZONE = "Asia/Seoul";

// [3단계] 추천이 아닌 직접 고른 옷으로 기록했을 때 코디 라벨
export const MANUAL_LOG_LABEL = "직접 기록";

// [2단계] 색 충돌 목록 (PRD: 비워 두고 시작하여 추천 결과를 보며 채움)
// 예: [['블랙', '브라운'], ['레드', '그린']]
export const COLOR_CLASH = [];
