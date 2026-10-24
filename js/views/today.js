/**
 * views/today.js
 * 오늘의 코디 추천 화면 (2단계)
 * - Open-Meteo 날씨 카드 (비 오면 우산 필요 안내)
 * - 날씨 호출 실패 시 수동 선택 (추움 3°C / 적당 15°C / 더움 25°C)
 * - 무드 궁합 및 기온 필터 기반 코디 3개 추천
 * - "다시 추천" (이미 본 조합 제외) 기능
 */

import { fetchTodayWeather } from "../weather.js";
import { recommendOutfits } from "../recommend.js";
import { getClothes } from "../db.js";
import { MANUAL_WEATHER_OPTIONS } from "../config.js";

// 이번 세션에서 이미 본 조합 키 목록
let alreadyShownKeys = new Set();
// 현재 적용 중인 기온 상태
let currentTemperature = null;
let currentWeatherInfo = null;

export async function renderTodayView(container) {
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

  // 순수 함수 호출: recommendOutfits
  const result = recommendOutfits(
    clothes,
    currentTemperature,
    new Date(),
    [], // outfitLogs (2단계에선 빈 배열)
    Array.from(alreadyShownKeys)
  );

  const { recommendations, missingCategories, remainingCount, totalPossibleCount } = result;

  // 조건에 맞는 옷 부족 시 안내 문구 표시
  if (missingCategories.length > 0) {
    alertContainer.innerHTML = `
      <div class="alert alert-warning mb-3">
        <strong>⚠️ 추천 가능한 옷 부족:</strong> 
        이 날씨(${currentTemperature}°C)에 적합한 <strong>[${missingCategories.join(', ')}]</strong>가 없습니다.
        두께(얇음/보통/두꺼움)에 맞는 옷을 등록해보세요.
      </div>
    `;
    alertContainer.style.display = "block";
  }

  // 추천 결과가 없는 경우
  if (recommendations.length === 0) {
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

    <div class="outfit-cards-grid">
      ${recommendations.map((outfit, index) => {
        const isSingle = outfit.items.length === 1;

        return `
          <div class="outfit-card">
            <div class="outfit-card-header">
              <span class="outfit-badge-rank">코디 0${index + 1}</span>
              <span class="outfit-mood-label">${escapeHtml(outfit.moodLabel)}</span>
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
