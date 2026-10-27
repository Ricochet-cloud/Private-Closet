/**
 * wearStats.js
 * 착용 기록 통계 순수 함수 모듈 (DOM·Firebase 의존성 없음)
 */

import { getKstDateString, diffDays } from "./dateUtil.js";

// 기본 집계 제외 카테고리 (소품/액세서리류 제외)
export const DEFAULT_EXCLUDED_CATEGORIES = ['모자', '기타'];

/**
 * 날짜 문자열(YYYY-MM-DD)을 기반으로 해당 계절과 시작/종료일을 반환합니다.
 * 봄: 3~5월, 여름: 6~8월, 가을: 9~11월, 겨울: 12~2월
 * @param {string} [dateStr=getKstDateString()]
 * @returns {{season: string, startDate: string, endDate: string}}
 */
export function getCurrentSeason(dateStr = getKstDateString()) {
  const [year, month] = dateStr.split("-").map(Number);

  if (month >= 3 && month <= 5) {
    return {
      season: '봄',
      startDate: `${year}-03-01`,
      endDate: `${year}-05-31`
    };
  }
  if (month >= 6 && month <= 8) {
    return {
      season: '여름',
      startDate: `${year}-06-01`,
      endDate: `${year}-08-31`
    };
  }
  if (month >= 9 && month <= 11) {
    return {
      season: '가을',
      startDate: `${year}-09-01`,
      endDate: `${year}-11-30`
    };
  }

  // 12월
  if (month === 12) {
    const nextYear = year + 1;
    const isLeap = (nextYear % 4 === 0 && nextYear % 100 !== 0) || (nextYear % 400 === 0);
    return {
      season: '겨울',
      startDate: `${year}-12-01`,
      endDate: `${nextYear}-02-${isLeap ? '29' : '28'}`
    };
  }

  // 1월, 2월
  const prevYear = year - 1;
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  return {
    season: '겨울',
    startDate: `${prevYear}-12-01`,
    endDate: `${year}-02-${isLeap ? '29' : '28'}`
  };
}

/**
 * 기간(30d, season, all)에 따라 착용 기록을 필터링합니다.
 * @param {Array<{wearDate: string}>} logs 착용 기록 목록
 * @param {'30d'|'season'|'all'} [period='all'] 필터 기간
 * @param {string} [referenceDateStr=getKstDateString()] 기준 날짜
 * @returns {Array<{wearDate: string}>}
 */
export function filterLogsByPeriod(logs, period = 'all', referenceDateStr = getKstDateString()) {
  if (!Array.isArray(logs) || logs.length === 0) return [];
  if (period === 'all') return logs;

  if (period === '30d') {
    return logs.filter(log => {
      if (!log || !log.wearDate) return false;
      const diff = diffDays(referenceDateStr, log.wearDate);
      return diff >= 0 && diff <= 30;
    });
  }

  if (period === 'season') {
    const seasonInfo = getCurrentSeason(referenceDateStr);
    return logs.filter(log => {
      if (!log || !log.wearDate) return false;
      return log.wearDate >= seasonInfo.startDate && log.wearDate <= seasonInfo.endDate;
    });
  }

  return logs;
}

/**
 * 착용 기록과 옷 목록을 기반으로 가장 많이 입은 옷 TOP N을 집계합니다.
 *
 * [집계 규칙]
 * 1. 착용 횟수 = 해당 옷의 id가 outfitLogs의 itemIds에 포함된 날(기록) 수 (하루 1건 기준)
 * 2. 정렬: 착용 횟수 내림차순 -> 마지막 착용일 최신순 -> 옷 이름(없으면 카테고리) 가나다순
 * 3. 최대 limit개 (기본 5개). 기록이 limit벌보다 적으면 있는 만큼만 반환
 * 4. 이미 삭제된 옷(clothes에 존재하지 않는 id)은 집계에서 제외
 * 5. 모자, 기타 카테고리 옷은 집계에서 제외 (excludedCategories)
 * 6. 기간 필터 지원: 최근 30일('30d') / 이번 계절('season') / 전체('all')
 * 7. 착용 기록이 없거나 유효한 옷이 없는 경우 빈 배열([]) 반환
 *
 * @param {Array<{wearDate: string, itemIds: string[]}>} logs 착용 기록 목록
 * @param {Array<{id: string, name?: string, category?: string, thumb?: string}>} clothes 옷 목록
 * @param {number} [limit=5] 반환할 최대 옷 개수
 * @param {string[]} [excludedCategories=DEFAULT_EXCLUDED_CATEGORIES] 제외할 카테고리 목록
 * @param {'30d'|'season'|'all'} [period='all'] 필터 기간
 * @param {string} [referenceDateStr=getKstDateString()] 기준 날짜 (기본: 오늘)
 * @returns {Array<{rank: number, cloth: Object, count: number, lastDate: string, ratio: number}>}
 */
export function getTopWorn(
  logs,
  clothes,
  limit = 5,
  excludedCategories = DEFAULT_EXCLUDED_CATEGORIES,
  period = 'all',
  referenceDateStr = getKstDateString()
) {
  if (!Array.isArray(logs) || !Array.isArray(clothes) || logs.length === 0 || clothes.length === 0) {
    return [];
  }

  const targetLogs = filterLogsByPeriod(logs, period, referenceDateStr);
  if (targetLogs.length === 0) {
    return [];
  }

  const excludedSet = new Set(Array.isArray(excludedCategories) ? excludedCategories : DEFAULT_EXCLUDED_CATEGORIES);

  const clothMap = new Map();
  for (const c of clothes) {
    if (c && c.id) {
      // 모자, 기타 등 제외 카테고리 필터링
      if (c.category && excludedSet.has(c.category)) {
        continue;
      }
      clothMap.set(c.id, c);
    }
  }

  if (clothMap.size === 0) {
    return [];
  }

  // clothId -> { cloth, count, lastDate }
  const statsMap = new Map();

  for (const log of targetLogs) {
    if (!log || !Array.isArray(log.itemIds) || !log.wearDate) continue;

    // 하루 기록 내 동일 옷 중복 등록이 있더라도 1일 1회로 산정
    const uniqueIds = new Set(log.itemIds);
    for (const id of uniqueIds) {
      const cloth = clothMap.get(id);
      if (!cloth) continue; // 삭제된 옷 제외

      let stat = statsMap.get(id);
      if (!stat) {
        stat = {
          cloth,
          count: 0,
          lastDate: log.wearDate
        };
        statsMap.set(id, stat);
      }
      stat.count += 1;
      if (log.wearDate > stat.lastDate) {
        stat.lastDate = log.wearDate;
      }
    }
  }

  const items = Array.from(statsMap.values());
  if (items.length === 0) {
    return [];
  }

  items.sort((a, b) => {
    // 1) 착용 횟수 내림차순
    if (b.count !== a.count) {
      return b.count - a.count;
    }

    // 2) 마지막 착용일 내림차순 (최근순)
    if (b.lastDate !== a.lastDate) {
      return b.lastDate.localeCompare(a.lastDate);
    }

    // 3) 이름 가나다순 (없으면 카테고리)
    const nameA = a.cloth.name ? a.cloth.name.trim() : (a.cloth.category || "");
    const nameB = b.cloth.name ? b.cloth.name.trim() : (b.cloth.category || "");
    return nameA.localeCompare(nameB, "ko");
  });

  const topItems = items.slice(0, Math.max(0, limit));
  if (topItems.length === 0) {
    return [];
  }

  const maxCount = topItems[0].count;

  return topItems.map((item, index) => ({
    rank: index + 1,
    cloth: item.cloth,
    count: item.count,
    lastDate: item.lastDate,
    ratio: maxCount > 0 ? item.count / maxCount : 0
  }));
}
