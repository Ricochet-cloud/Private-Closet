/**
 * recommend.js
 * 날씨, 두께, 무드 궁합 기반 코디 추천 순수 함수 모듈
 * (DOM 및 Firebase를 일체 다루지 않는 순수 로직)
 */

import { 
  INNER_CATEGORIES, 
  OUTER_CATEGORIES, 
  TEMPERATURE_BANDS, 
  SCORE_CONSTANTS, 
  COLOR_CLASH 
} from "./config.js";
import { getPairMoodCompatibility } from "./moodMatrix.js";

/**
 * 날짜 기준 현재 계절 계산 (한국 기준 3~5월 봄, 6~8월 여름, 9~11월 가을, 12~2월 겨울)
 * @param {Date|string} date 
 * @returns {'봄'|'여름'|'가을'|'겨울'}
 */
export function getCurrentSeason(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const month = d.getMonth() + 1; // 1~12
  if (month >= 3 && month <= 5) return '봄';
  if (month >= 6 && month <= 8) return '여름';
  if (month >= 9 && month <= 11) return '가을';
  return '겨울';
}

/**
 * 기온에 해당하는 기온 구간 설정 찾기
 * @param {number} temp 
 * @returns {Object} TEMPERATURE_BANDS 항목
 */
export function getTemperatureBand(temp) {
  for (const band of TEMPERATURE_BANDS) {
    const min = typeof band.minTemp === "number" ? band.minTemp : -Infinity;
    const max = typeof band.maxTemp === "number" ? band.maxTemp : Infinity;
    if (temp >= min && temp <= max) {
      return band;
    }
  }
  // 기본값 (간절기)
  return TEMPERATURE_BANDS[2];
}

/**
 * 코디 구성의 고유 키 생성 (ID 정렬 조합)
 * @param {Array<Object>} items 
 * @returns {string}
 */
export function getOutfitKey(items) {
  return items
    .map(item => item.id)
    .sort()
    .join(",");
}

/**
 * 두 색상이 colorClash 목록에 등록된 충돌 조합인지 확인
 * @param {string} colorA 
 * @param {string} colorB 
 * @returns {boolean}
 */
function isColorClash(colorA, colorB) {
  if (!colorA || !colorB || !Array.isArray(COLOR_CLASH) || COLOR_CLASH.length === 0) {
    return false;
  }
  return COLOR_CLASH.some(pair => {
    return (pair[0] === colorA && pair[1] === colorB) || 
           (pair[0] === colorB && pair[1] === colorA);
  });
}

/**
 * 데일리룩 코디 추천 순수 함수
 * @param {Array<Object>} clothes 옷 전체 목록
 * @param {number} temperature 기준 기온
 * @param {Date|string} todayDate 오늘 날짜
 * @param {Array<Object>} outfitLogs 착용 기록 (3단계 연동용, 2단계에선 수신만 하고 사용 안 함)
 * @param {Array<string>|Set<string>} alreadyShownKeys 이번 세션에서 이미 추천된 조합 키 목록
 * @returns {{
 *   recommendations: Array<{items: Array<Object>, score: number, moodLabel: string, key: string}>,
 *   missingCategories: Array<string>,
 *   totalPossibleCount: number
 * }}
 */
export function recommendOutfits(
  clothes = [],
  temperature = 15,
  todayDate = new Date(),
  outfitLogs = [],
  alreadyShownKeys = []
) {
  const currentSeason = getCurrentSeason(todayDate);
  const band = getTemperatureBand(temperature);
  const shownSet = new Set(alreadyShownKeys);

  // ① 날씨 필터: 두께가 비어 있는 옷은 제외하고 기온 구간에 맞는 옷만 후보로 남김
  const validOuters = clothes.filter(item => {
    if (!OUTER_CATEGORIES.includes(item.category)) return false;
    if (!item.thickness) return false; // 두께가 비어 있는 옷은 제외
    return band.outerThickness.includes(item.thickness);
  });

  const validInners = clothes.filter(item => {
    if (!INNER_CATEGORIES.includes(item.category)) return false;
    if (!item.thickness) return false; // 두께가 비어 있는 옷은 제외
    return band.innerThickness.includes(item.thickness);
  });

  // 카테고리 부족 상태 검사
  const missingCategories = [];
  if (!band.allowNoOuter && validOuters.length === 0) {
    missingCategories.push("아우터");
  }
  if (validInners.length === 0) {
    missingCategories.push("이너(니트/맨투맨/셔츠)");
  }

  // 후보 풀 생성: 아우터 1벌 + 이너 1벌 조합 (+ 허용 시 이너 단독)
  let rawCandidates = [];

  // 아우터 + 이너 조합 (forceNoOuter가 아닐 때)
  if (!band.forceNoOuter) {
    for (const outer of validOuters) {
      for (const inner of validInners) {
        rawCandidates.push({
          items: [outer, inner],
          isSingleInner: false
        });
      }
    }
  }

  // 이너 단독 조합 (아우터 없음 허용 구간일 때)
  if (band.allowNoOuter) {
    for (const inner of validInners) {
      rawCandidates.push({
        items: [inner],
        isSingleInner: true
      });
    }
  }

  // ② 무드 매칭 & ③ 색 보정 & ④ 계절 가산
  const validOutfits = [];

  for (const candidate of rawCandidates) {
    const { items, isSingleInner } = candidate;

    let moodScore = 1;
    let moodLabel = "무드: 데일리";

    if (isSingleInner) {
      // "쌍이 없는 이너 단독 코디의 무드 점수는 1(중립)로 해."
      moodScore = 1;
      const innerMood = items[0].moods?.[0];
      moodLabel = innerMood ? `무드: ${innerMood}` : "무드: 데일리";
    } else {
      // 아우터 1 + 이너 1
      const outer = items[0];
      const inner = items[1];

      // ③ 색 보정: 색 충돌 목록에 있는 색 쌍이면 제외
      if (isColorClash(outer.color, inner.color)) {
        continue;
      }

      // ② 무드 매칭: 궁합 점수 계산
      const comp = getPairMoodCompatibility(outer, inner);
      // "두 옷의 궁합 점수가 0이면 제외한다"
      if (comp.score === 0) {
        continue;
      }

      moodScore = comp.score;
      moodLabel = `무드: ${comp.bestMood}`;
    }

    // ④ 계절 가산: 현재 계절이 계절 태그에 있는 옷은 1벌당 0.1점을 더함
    let seasonBonusTotal = 0;
    for (const item of items) {
      if (Array.isArray(item.seasons) && item.seasons.includes(currentSeason)) {
        seasonBonusTotal += SCORE_CONSTANTS.seasonBonus;
      }
    }

    const finalScore = Math.round((moodScore + seasonBonusTotal) * 100) / 100;
    const key = getOutfitKey(items);

    validOutfits.push({
      items,
      score: finalScore,
      moodScore,
      moodLabel,
      key
    });
  }

  const totalPossibleCount = validOutfits.length;

  // ⑤ 이미 보여준 조합(alreadyShown) 제외
  const freshOutfits = validOutfits.filter(outfit => !shownSet.has(outfit.key));

  // 점수가 같으면 무작위 순서가 되도록 셔플 후 점수 내림차순 정렬
  freshOutfits.sort(() => Math.random() - 0.5);
  freshOutfits.sort((a, b) => b.score - a.score);

  // 상위 3개 선정
  const recommendations = freshOutfits.slice(0, 3);

  return {
    recommendations,
    missingCategories,
    totalPossibleCount,
    remainingCount: freshOutfits.length
  };
}
