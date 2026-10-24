/**
 * weather.js
 * Open-Meteo API 연동 날씨 조회 모듈 (API 키 불필요, 브라우저 직접 호출)
 */

import { WEATHER_LOCATION, RAIN_CRITERIA } from "./config.js";

/**
 * 오늘 날씨 정보 가져오기
 * 실패 시 예외를 던지지 않고 { ok: false, error: ... } 형태로 반환하여
 * 화면에서 수동 날씨 선택 UI로 전환할 수 있도록 처리합니다.
 * @returns {Promise<Object>}
 */
export async function fetchTodayWeather() {
  const { latitude, longitude, name } = WEATHER_LOCATION;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FSeoul`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`날씨 서버 응답 에러 (상태 코드: ${response.status})`);
    }

    const data = await response.json();

    const currentTemp = Math.round(data.current?.temperature_2m ?? 0);
    const minTemp = Math.round(data.daily?.temperature_2m_min?.[0] ?? currentTemp);
    const maxTemp = Math.round(data.daily?.temperature_2m_max?.[0] ?? currentTemp);
    const precipProb = data.daily?.precipitation_probability_max?.[0] ?? 0;
    const precipCurrent = data.current?.precipitation ?? 0;

    // 비 판단 기준: 하루 강수확률 50% 이상 또는 현재 강수량 0 초과
    const isRaining = (precipProb >= RAIN_CRITERIA.precipitationProbabilityMax) ||
                      (precipCurrent > RAIN_CRITERIA.precipitationCurrent);

    // PRD 기준: 최저·최고 기온 평균을 체감/판단 기온으로 사용
    const effectiveTemp = Math.round((minTemp + maxTemp) / 2);

    return {
      ok: true,
      locationName: name,
      currentTemp,
      minTemp,
      maxTemp,
      effectiveTemp,
      isRaining,
      precipitationProbability: precipProb,
      currentPrecipitation: precipCurrent,
      summary: `최저 ${minTemp}° / 최고 ${maxTemp}° / ${isRaining ? '비 또는 소나기' : '비 없음'}`
    };
  } catch (err) {
    console.warn("날씨 API 호출 실패 (수동 선택 모드로 전환):", err);
    return {
      ok: false,
      error: err.message || "날씨 정보를 불러올 수 없습니다.",
      locationName: name
    };
  }
}
