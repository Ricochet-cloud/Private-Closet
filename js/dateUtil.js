/**
 * dateUtil.js
 * 한국 시간(Asia/Seoul) 기준 날짜 문자열 헬퍼 (DOM·Firebase 없음)
 * - 착용 기록 문서 ID(YYYY-MM-DD)와 반복 방지 일수 계산이 모두 이 파일을 거친다.
 */

import { TIMEZONE } from "./config.js";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const kstFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

/**
 * 한국 시간 기준 날짜 문자열(YYYY-MM-DD)
 * 이미 YYYY-MM-DD 형태의 문자열이면 그대로 돌려준다.
 * @param {Date|string} date
 * @returns {string}
 */
export function getKstDateString(date = new Date()) {
  if (typeof date === "string" && DATE_ONLY_PATTERN.test(date)) {
    return date;
  }
  const d = date instanceof Date ? date : new Date(date);
  const parts = kstFormatter.formatToParts(d);
  const pick = (type) => parts.find((p) => p.type === type).value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function toDayNumber(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

/**
 * 두 날짜 문자열의 일수 차이 (laterStr - earlierStr)
 * 예: diffDays("2026-10-25", "2026-10-24") === 1
 */
export function diffDays(laterStr, earlierStr) {
  return toDayNumber(laterStr) - toDayNumber(earlierStr);
}

/**
 * 화면 표시용 날짜: "2026.10.25 (일)"
 * @param {string} dateStr YYYY-MM-DD
 */
export function formatLogDate(dateStr) {
  if (!DATE_ONLY_PATTERN.test(dateStr || "")) return dateStr || "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} (${weekday})`;
}
