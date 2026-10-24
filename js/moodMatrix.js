/**
 * moodMatrix.js
 * 무드 궁합표 및 무드 점수 계산 모듈
 */

// PRD "무드 궁합 규칙"의 표 그대로 정의
export const MOOD_MATRIX = {
  "아메카지": {
    "아메카지": 2,
    "워크웨어": 2,
    "밀리터리": 2,
    "빈티지": 2,
    "아이비": 1,
    "프레피": 0
  },
  "워크웨어": {
    "아메카지": 2,
    "워크웨어": 2,
    "밀리터리": 2,
    "빈티지": 2,
    "아이비": 1,
    "프레피": 0
  },
  "밀리터리": {
    "아메카지": 2,
    "워크웨어": 2,
    "밀리터리": 2,
    "빈티지": 1,
    "아이비": 1,
    "프레피": 0
  },
  "빈티지": {
    "아메카지": 2,
    "워크웨어": 2,
    "밀리터리": 1,
    "빈티지": 2,
    "아이비": 2,
    "프레피": 1
  },
  "아이비": {
    "아메카지": 1,
    "워크웨어": 1,
    "밀리터리": 1,
    "빈티지": 2,
    "아이비": 2,
    "프레피": 2
  },
  "프레피": {
    "아메카지": 0,
    "워크웨어": 0,
    "밀리터리": 0,
    "빈티지": 1,
    "아이비": 2,
    "프레피": 2
  }
};

/**
 * 두 개별 무드 태그 간의 궁합 점수 (0, 1, 2)
 * @param {string} moodA 
 * @param {string} moodB 
 * @returns {number}
 */
export function getSingleMoodScore(moodA, moodB) {
  if (!moodA || !moodB) return 1;
  if (moodA === moodB) return 2;

  if (MOOD_MATRIX[moodA] && typeof MOOD_MATRIX[moodA][moodB] === "number") {
    return MOOD_MATRIX[moodA][moodB];
  }
  if (MOOD_MATRIX[moodB] && typeof MOOD_MATRIX[moodB][moodA] === "number") {
    return MOOD_MATRIX[moodB][moodA];
  }

  // 표에 없는 무드는 같은 무드끼리 2점, 그 밖은 1점
  return 1;
}

/**
 * 두 옷 간의 무드 궁합 점수 계산
 * - 옷에 무드 태그가 여러 개면 두 옷 사이에서 가장 높은 궁합 값을 사용
 * - 무드 태그가 없는 옷은 1점(중립)으로 봄
 * @param {Object} clothA 
 * @param {Object} clothB 
 * @returns {{ score: number, bestMood: string }}
 */
export function getPairMoodCompatibility(clothA, clothB) {
  const moodsA = Array.isArray(clothA.moods) && clothA.moods.length > 0 ? clothA.moods : [];
  const moodsB = Array.isArray(clothB.moods) && clothB.moods.length > 0 ? clothB.moods : [];

  // 둘 중 하나라도 무드 태그가 없으면 1점(중립)
  if (moodsA.length === 0 || moodsB.length === 0) {
    const fallbackMood = moodsA[0] || moodsB[0] || "캐주얼";
    return {
      score: 1,
      bestMood: fallbackMood
    };
  }

  let maxScore = -1;
  let bestMood = moodsA[0];

  for (const mA of moodsA) {
    for (const mB of moodsB) {
      const score = getSingleMoodScore(mA, mB);
      if (score > maxScore) {
        maxScore = score;
        bestMood = (score === 2 && mA === mB) ? mA : (score === 2 ? `${mA} & ${mB}` : mA);
      }
    }
  }

  return {
    score: maxScore >= 0 ? maxScore : 1,
    bestMood
  };
}
