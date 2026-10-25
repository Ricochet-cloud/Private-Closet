/**
 * views/today.js
 * 오늘의 코디 추천 화면 (2·3단계)
 * - Open-Meteo 날씨 카드 (비 오면 우산 필요 안내)
 * - 날씨 호출 실패 시 수동 선택 (추움 3°C / 적당 15°C / 더움 25°C)
 * - 무드 궁합 및 기온 필터 기반 코디 3개 추천
 * - "다시 추천" (이미 본 조합 제외) 기능
 * - [3단계] "오늘 이걸 입었어요" 저장·교체·취소, "입음" 표시, 착용 기록 기반 반복 방지·감점
 */

import { fetchTodayWeather } from "../weather.js";
import { recommendOutfits, getOutfitKeyFromIds } from "../recommend.js";
import { getClothes, getOutfitLogs, saveOutfitLog, deleteOutfitLog } from "../db.js";
import { getKstDateString } from "../dateUtil.js";
import { MANUAL_WEATHER_OPTIONS, SCORE_CONSTANTS } from "../config.js";

// 이번 세션에서 이미 본 조합 키 목록
let alreadyShownKeys = new Set();
// 현재 적용 중인 기온 상태
let currentTemperature = null;
let currentWeatherInfo = null;
// [3단계] 사용자가 기온을 직접 고른 경우(기록의 날씨 요약에 반영)
let manualSelection = null;
// [3단계] 착용 기록 (화면을 열 때 한 번 읽고, 저장·취소 때 메모리에서 갱신)
let currentLogs = [];
let logsLoaded = false;
// [3단계] 지금 화면에 보이는 추천 코디 (버튼 클릭 시 구성 옷을 찾는 용도)
let currentRecs = [];

export async function renderTodayView(container) {
  manualSelection = null;
  logsLoaded = false;
  currentRecs = [];

  container.innerHTML = `
    <div class="today-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">오늘의 코디 추천</h1>
          <p class="page-subtitle text-muted">오늘 날씨와 무드 궁합을 바탕으로 추천해 드려요</p>
        </div>
        <div class="header-actions">
          <a href="#/closet" class="btn btn-secondary btn-sm">옷장 보기</a>
        </div>
      </div>

      <!-- 날씨 카드 영역 -->
      <div id="weather-section" class="weather-card-container">
        <div class="loading-state">
          <div class="spinner"></div>
          <p class="mt-2 text-sm text-muted">오늘의 날씨를 확인하는 중입니다...</p>
        </div>
      </div>

      <!-- 누락 카테고리 알림 영역 -->
      <div id="missing-alert-box" style="display: none;"></div>

      <!-- 추천 코디 결과 목록 영역 -->
      <div id="recommendation-section" class="recommendation-wrapper">
        <div class="loading-state">
          <div class="spinner"></div>
          <p class="mt-2 text-sm text-muted">최적의 코디 조합을 구성하고 있습니다...</p>
        </div>
      </div>
    </div>
  `;

  const weatherSection = container.querySelector("#weather-section");
  const missingAlertBox = container.querySelector("#missing-alert-box");
  const recommendationSection = container.querySelector("#recommendation-section");

  // [3단계] "오늘 이걸 입었어요" 버튼 (추천 카드는 다시 그려지므로 위임으로 처리)
  recommendationSection.addEventListener("click", (e) => {
    const wearBtn = e.target.closest(".btn-wear");
    if (wearBtn) {
      handleWearClick(wearBtn, recommendationSection);
    }
  });

  // 1. 날씨 정보 가져오기
  const weather = await fetchTodayWeather();
  currentWeatherInfo = weather;

  if (weather.ok) {
    currentTemperature = weather.effectiveTemp;
    renderWeatherCard(weatherSection, weather, false);
  } else {
    // 날씨 호출 실패 시 기본 기온은 15(적당)로 시작하고 수동 선택 뷰 노출
    currentTemperature = 15;
    renderWeatherCard(weatherSection, weather, true);
  }

  // 2. 전체 옷 목록 불러오기 및 추천 생성
  await updateRecommendations(recommendationSection, missingAlertBox);

  // 날씨 카드 내 이벤트 핸들러 위임
  weatherSection.addEventListener("click", async (e) => {
    const manualBtn = e.target.closest(".btn-manual-weather");
    if (manualBtn) {
      const tempVal = Number(manualBtn.getAttribute("data-temp"));
      currentTemperature = tempVal;
      manualSelection = MANUAL_WEATHER_OPTIONS.find(opt => opt.temp === tempVal) || null;
      alreadyShownKeys.clear(); // 기온 변경 시 이전 본 조합 초기화

      // 버튼 활성 상태 갱신
      weatherSection.querySelectorAll(".btn-manual-weather").forEach(b => b.classList.remove("active"));
      manualBtn.classList.add("active");

      // 날씨 상태 문구 갱신
      const statusText = weatherSection.querySelector("#manual-status-label");
      if (statusText) {
        statusText.textContent = `선택된 기온: ${tempVal}°C (${manualBtn.textContent.trim()})`;
      }

      await updateRecommendations(recommendationSection, missingAlertBox);
    }

    const toggleManualBtn = e.target.closest("#btn-toggle-manual");
    if (toggleManualBtn) {
      const manualBox = weatherSection.querySelector("#manual-picker-box");
      if (manualBox) {
        const isHidden = manualBox.style.display === "none";
        manualBox.style.display = isHidden ? "block" : "none";
        toggleManualBtn.textContent = isHidden ? "기온 수동 선택 닫기" : "기온 직접 선택";
      }
    }
  });
}

/**
 * 날씨 카드 렌더링
 */
function renderWeatherCard(container, weather, isFailureMode) {
  if (isFailureMode) {
    container.innerHTML = `
      <div class="weather-card weather-card-warning">
        <div class="weather-header-row">
          <div class="weather-status-wrap">
            <div>
              <h3 class="weather-title">날씨 정보를 가져올 수 없습니다</h3>
              <p class="text-xs text-muted">${escapeHtml(weather.error || '네트워크 상태를 확인해주세요.')}</p>
            </div>
          </div>
        </div>

        <div class="manual-weather-picker">
          <p class="text-sm font-semibold mb-2">체감 날씨를 직접 선택해주세요:</p>
          <div class="manual-btn-group">
            ${MANUAL_WEATHER_OPTIONS.map(opt => `
              <button 
                type="button" 
                class="btn-manual-weather ${opt.temp === currentTemperature ? 'active' : ''}" 
                data-temp="${opt.temp}"
              >
                ${opt.label} (${opt.temp}°C)
              </button>
            `).join('')}
          </div>
          <p id="manual-status-label" class="text-xs text-muted mt-2">선택된 기온: ${currentTemperature}°C</p>
        </div>
      </div>
    `;
    return;
  }

  // 성공적으로 날씨를 조회한 경우
  container.innerHTML = `
    <div class="weather-card">
      <div class="weather-main-info">
        <div class="weather-left">
          <div>
            <div class="weather-location-row">
              <span class="location-name">${escapeHtml(weather.locationName)}</span>
              <span class="effective-tag">체감 약 ${weather.effectiveTemp}°C</span>
            </div>
            <div class="temp-display">
              <span class="current-temp">${weather.currentTemp}°</span>
              <span class="min-max-temp">최저 ${weather.minTemp}° / 최고 ${weather.maxTemp}°</span>
            </div>
          </div>
        </div>

        <div class="weather-right">
          ${weather.isRaining ? `
            <div class="umbrella-alert">
              <div>
                <strong>우산 필요</strong>
                <span class="text-xs">비 또는 소나기 예보</span>
              </div>
            </div>
          ` : `
            <div class="rain-clear-badge">
              <span>비 예보 없음</span>
            </div>
          `}
          <button type="button" id="btn-toggle-manual" class="btn-text-link text-xs">
            기온 직접 선택
          </button>
        </div>
      </div>

      <!-- 펼치기 가능한 수동 선택 영역 -->
      <div id="manual-picker-box" class="manual-weather-picker mt-3" style="display: none; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
        <p class="text-xs text-muted mb-2">직접 원하는 기온을 선택하여 추천받을 수도 있습니다:</p>
        <div class="manual-btn-group">
          ${MANUAL_WEATHER_OPTIONS.map(opt => `
            <button 
              type="button" 
              class="btn-manual-weather ${opt.temp === currentTemperature ? 'active' : ''}" 
              data-temp="${opt.temp}"
            >
              ${opt.label} (${opt.temp}°C)
            </button>
          `).join('')}
        </div>
        <p id="manual-status-label" class="text-xs text-muted mt-1">현재 적용 기온: ${currentTemperature}°C</p>
      </div>
    </div>
  `;
}

/**
 * 코디 추천 갱신 및 렌더링
 */
async function updateRecommendations(recContainer, alertContainer) {
  recContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p class="mt-2 text-sm text-muted">코디를 계산하는 중입니다...</p>
    </div>
  `;
  alertContainer.style.display = "none";
  alertContainer.innerHTML = "";

  let clothes = [];
  try {
    clothes = await getClothes();
  } catch (err) {
    console.error("옷 데이터 로드 실패:", err);
    recContainer.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-title">옷장 데이터를 불러오지 못했습니다</h3>
        <p class="text-muted text-sm mt-1">${err.message}</p>
      </div>
    `;
    return;
  }

  if (clothes.length === 0) {
    recContainer.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-title">등록된 옷이 없습니다</h3>
        <p class="text-muted text-sm mt-1">내 옷장에 옷을 먼저 등록하면 날씨에 맞는 코디를 추천해 드려요.</p>
        <a href="#/cloth/new" class="btn btn-primary mt-3">+ 새 옷 등록하러 가기</a>
      </div>
    `;
    return;
  }

  // [3단계] 착용 기록 읽기 (화면을 연 뒤 첫 추천 때 한 번만)
  let logLoadFailed = false;
  if (!logsLoaded) {
    try {
      currentLogs = await getOutfitLogs();
      logsLoaded = true;
    } catch (err) {
      console.error("착용 기록 로드 실패:", err);
      currentLogs = [];
      logLoadFailed = true;
    }
  }

  // 순수 함수 호출: recommendOutfits (착용 기록으로 반복 방지·최근 착용 감점 적용)
  const result = recommendOutfits(
    clothes,
    currentTemperature,
    new Date(),
    currentLogs,
    Array.from(alreadyShownKeys)
  );

  const { recommendations, missingCategories, remainingCount, totalPossibleCount, repeatExcludedCount } = result;

  // 알림 영역: 착용 기록 로드 실패 / 조건에 맞는 옷 부족
  const alertHtml = [];
  if (logLoadFailed) {
    alertHtml.push(`
      <div class="alert alert-danger mb-3">
        착용 기록을 불러오지 못해 반복 방지와 최근 착용 감점이 적용되지 않았어요. 새로고침 후 다시 시도해주세요.
      </div>
    `);
  }
  if (missingCategories.length > 0) {
    alertHtml.push(`
      <div class="alert alert-warning mb-3">
        <strong>⚠️ 추천 가능한 옷 부족:</strong>
        이 날씨(${currentTemperature}°C)에 적합한 <strong>[${missingCategories.join(', ')}]</strong>가 없습니다.
        두께(얇음/보통/두꺼움)에 맞는 옷을 등록해보세요.
      </div>
    `);
  }
  if (alertHtml.length > 0) {
    alertContainer.innerHTML = alertHtml.join("");
    alertContainer.style.display = "block";
  }

  // 추천 결과가 없는 경우
  if (recommendations.length === 0) {
    currentRecs = [];

    // 최근 N일 안에 입은 조합을 빼고 나니 남은 코디가 없는 경우
    if (totalPossibleCount === 0 && repeatExcludedCount > 0) {
      recContainer.innerHTML = `
        <div class="empty-state">
          <h3 class="empty-title">최근 ${SCORE_CONSTANTS.repeatPreventDays}일 안에 입은 조합을 빼면 남은 추천이 없어요</h3>
          <p class="text-muted text-sm mt-1">새 옷을 등록하거나 다른 기온을 선택해보세요.</p>
          <a href="#/cloth/new" class="btn btn-primary mt-3">+ 새 옷 등록하기</a>
        </div>
      `;
      return;
    }

    if (alreadyShownKeys.size > 0 && totalPossibleCount > 0) {
      recContainer.innerHTML = `
        <div class="empty-state">
          <h3 class="empty-title">모든 추천 조합을 확인하셨습니다</h3>
          <p class="text-muted text-sm mt-1">처음 추천된 코디부터 다시 확인하시겠어요?</p>
          <button id="btn-reset-shown" class="btn btn-primary mt-3">처음부터 다시 보기</button>
        </div>
      `;
      recContainer.querySelector("#btn-reset-shown")?.addEventListener("click", () => {
        alreadyShownKeys.clear();
        updateRecommendations(recContainer, alertContainer);
      });
      return;
    }

    recContainer.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-title">현재 날씨에 맞는 추천 코디가 없습니다</h3>
        <p class="text-muted text-sm mt-1">기온에 맞는 두께의 아우터 및 이너(니트/맨투맨/셔츠)를 등록하거나 무드 태그를 확인해주세요.</p>
        <a href="#/cloth/new" class="btn btn-primary mt-3">+ 새 옷 등록하기</a>
      </div>
    `;
    return;
  }

  // 이번에 보여준 조합들을 alreadyShownKeys에 누적
  recommendations.forEach(r => alreadyShownKeys.add(r.key));
  currentRecs = recommendations;

  // 추천 카드 3개 렌더링
  recContainer.innerHTML = `
    <div class="recommendations-header">
      <div>
        <h2 class="section-title">오늘의 추천 룩 (${recommendations.length}선)</h2>
        <p class="text-xs text-muted">기온 ${currentTemperature}°C 기준 무드 조화도 상위 코디</p>
      </div>

      <button id="btn-refresh-recommend" class="btn btn-secondary">
        <span>다시 추천</span>
      </button>
    </div>

    <p id="wear-note" class="wear-note text-xs text-muted"></p>

    <div class="outfit-cards-grid">
      ${recommendations.map((outfit, index) => {
        const isSingle = outfit.items.length === 1;

        return `
          <div class="outfit-card" data-index="${index}" data-key="${escapeHtml(outfit.key)}">
            <div class="outfit-card-header">
              <span class="outfit-badge-rank">코디 0${index + 1}</span>
              <span class="outfit-header-right">
                <span class="worn-slot"></span>
                <span class="outfit-mood-label">${escapeHtml(outfit.moodLabel)}</span>
              </span>
            </div>

            <div class="outfit-items-row ${isSingle ? 'single-item-row' : ''}">
              ${outfit.items.map(cloth => {
                const displayName = cloth.name || cloth.category;
                return `
                  <div class="outfit-item">
                    <div class="outfit-item-thumb-box">
                      <img 
                        src="${cloth.thumb}" 
                        alt="${escapeHtml(displayName)}" 
                        class="outfit-item-img"
                        onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\'><rect fill=\\'%23eee\\' width=\\'200\\'/></svg>'"
                      />
                      <span class="badge badge-category outfit-cat-badge">${escapeHtml(cloth.category)}</span>
                    </div>
                    <div class="outfit-item-desc">
                      <strong class="item-name">${escapeHtml(displayName)}</strong>
                      <span class="item-meta text-xs text-muted">${escapeHtml(cloth.thickness || '두께 미입력')} ${cloth.color ? '· ' + escapeHtml(cloth.color) : ''}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="outfit-card-footer">
              <div class="outfit-score-box">
                <span class="score-label">궁합 점수</span>
                <span class="score-value">★ ${outfit.score.toFixed(1)}</span>
              </div>
              <button type="button" class="btn btn-secondary btn-sm btn-wear"></button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // 다시 추천 버튼 클릭 이벤트
  const refreshBtn = recContainer.querySelector("#btn-refresh-recommend");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      updateRecommendations(recContainer, alertContainer);
    });
  }

  // 오늘 입은 코디와 같은 구성에는 "입음" 표시, 버튼 문구 갱신
  refreshWearState(recContainer);
}

/**
 * 오늘(한국 시간) 착용 기록 찾기
 */
function getTodayLog() {
  const todayStr = getKstDateString();
  return currentLogs.find(log => log.wearDate === todayStr) || null;
}

/**
 * 기록에 남길 날씨 요약 문자열
 * - 직접 고른 기온이 있으면 그 값, 아니면 날씨 API 요약("최저 8° / 최고 17° / 비 없음")
 */
function buildWeatherSummary() {
  if (manualSelection) {
    return `${manualSelection.label} ${manualSelection.temp}° (직접 선택)`;
  }
  if (currentWeatherInfo?.ok) {
    return currentWeatherInfo.summary;
  }
  return `기온 ${currentTemperature}° (날씨 정보 없음)`;
}

/**
 * 추천 카드의 "입음" 표시와 버튼 문구를 오늘 기록에 맞춰 갱신 (추천을 다시 계산하지 않음)
 */
function refreshWearState(recContainer) {
  const todayLog = getTodayLog();
  const todayKey = todayLog ? getOutfitKeyFromIds(todayLog.itemIds) : null;

  recContainer.querySelectorAll(".outfit-card").forEach(card => {
    const isWorn = todayKey !== null && card.getAttribute("data-key") === todayKey;
    const slot = card.querySelector(".worn-slot");
    const btn = card.querySelector(".btn-wear");

    card.classList.toggle("outfit-card-worn", isWorn);
    if (slot) slot.innerHTML = isWorn ? `<span class="badge-worn">입음</span>` : "";
    if (btn) {
      btn.classList.toggle("is-worn", isWorn);
      btn.textContent = isWorn ? "입음 · 눌러서 취소" : "오늘 이걸 입었어요";
    }
  });

  const note = recContainer.querySelector("#wear-note");
  if (note) {
    note.textContent = todayLog
      ? `오늘 기록: ${todayLog.moodLabel || "입은 코디"}. 다른 코디를 누르면 기록이 바뀌고, 입음 표시된 코디를 다시 누르면 취소돼요.`
      : "";
  }
}

/**
 * "오늘 이걸 입었어요" 클릭 처리
 * - 오늘 기록이 없거나 다른 코디면 저장(같은 날이면 덮어쓰기)
 * - 이미 입음으로 표시된 코디를 다시 누르면 기록 삭제(취소)
 */
async function handleWearClick(btn, recContainer) {
  const card = btn.closest(".outfit-card");
  const outfit = card ? currentRecs[Number(card.getAttribute("data-index"))] : null;
  if (!outfit) return;

  const todayStr = getKstDateString();
  const todayLog = currentLogs.find(log => log.wearDate === todayStr) || null;
  const isSame = todayLog && getOutfitKeyFromIds(todayLog.itemIds) === outfit.key;

  const wearButtons = recContainer.querySelectorAll(".btn-wear");
  wearButtons.forEach(b => { b.disabled = true; });

  try {
    if (isSame) {
      await deleteOutfitLog(todayStr);
      currentLogs = currentLogs.filter(log => log.wearDate !== todayStr);
    } else {
      const entry = {
        wearDate: todayStr,
        itemIds: outfit.items.map(item => item.id),
        weatherSummary: buildWeatherSummary(),
        moodLabel: outfit.moodLabel
      };
      await saveOutfitLog(entry);
      currentLogs = [entry, ...currentLogs.filter(log => log.wearDate !== todayStr)];
    }
  } catch (err) {
    console.error("착용 기록 저장 실패:", err);
    alert("착용 기록을 저장하지 못했습니다: " + (err.message || "잠시 후 다시 시도해주세요."));
  } finally {
    wearButtons.forEach(b => { b.disabled = false; });
    refreshWearState(recContainer);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
