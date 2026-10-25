/**
 * views/log.js
 * 착용 기록 화면 (3단계)
 * - 날짜 내림차순 리스트: 날짜(세리프) / 입은 옷 썸네일 / 무드 라벨 / 날씨 요약
 * - 이미 삭제된 옷의 ID는 "삭제된 옷"으로 표시
 * - 기록 삭제(취소)
 * - 추천과 별개로 실제 입은 옷을 직접 골라 날짜별로 기록
 */

import { getClothes, getOutfitLogs, saveOutfitLog, deleteOutfitLog } from "../db.js";
import { fetchTodayWeather } from "../weather.js";
import { getKstDateString, formatLogDate } from "../dateUtil.js";
import { CATEGORIES, MANUAL_LOG_LABEL } from "../config.js";

export async function renderLogView(container) {
  const todayStr = getKstDateString();

  container.innerHTML = `
    <div class="log-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">착용 기록</h1>
          <p class="page-subtitle text-muted">날짜별로 입었던 데일리룩 아카이브</p>
        </div>
        <div class="header-actions">
          <button type="button" id="btn-toggle-manual-log" class="btn btn-primary btn-sm">직접 기록하기</button>
          <a href="#/closet" class="btn btn-secondary btn-sm">옷장 보기</a>
        </div>
      </div>

      <div id="manual-log-panel" class="manual-log-panel" style="display: none;"></div>

      <div id="log-list-container">
        <div class="loading-state">
          <div class="spinner"></div>
          <p class="mt-2 text-sm text-muted">착용 기록을 불러오는 중입니다...</p>
        </div>
      </div>
    </div>
  `;

  const listContainer = container.querySelector("#log-list-container");
  const panel = container.querySelector("#manual-log-panel");
  const toggleBtn = container.querySelector("#btn-toggle-manual-log");

  let clothes = [];
  let logs = [];

  try {
    [clothes, logs] = await Promise.all([getClothes(), getOutfitLogs()]);
  } catch (err) {
    console.error("착용 기록 로드 실패:", err);
    listContainer.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-title">착용 기록을 불러오지 못했습니다</h3>
        <p class="text-muted text-sm mt-1">${escapeHtml(err.message || "Firebase 연결 상태를 확인해주세요.")}</p>
        <button class="btn btn-secondary mt-3" onclick="window.location.reload()">새로고침</button>
      </div>
    `;
    return;
  }

  const clothMap = new Map(clothes.map(c => [c.id, c]));

  // ----- 기록 리스트 -----
  function renderList() {
    if (logs.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <h3 class="empty-title">기록된 착용 내역이 없습니다</h3>
          <p class="text-muted text-sm mt-1">오늘의 코디에서 "입었어요"를 누르거나, 위의 "직접 기록하기"로 입은 옷을 남겨보세요.</p>
          <a href="#/today" class="btn btn-primary mt-3">오늘의 코디 확인하기</a>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = `
      <div class="log-list">
        ${logs.map(log => {
          const items = log.itemIds.map(id => ({ id, cloth: clothMap.get(id) || null }));
          const names = items.map(({ cloth }) => (cloth ? (cloth.name || cloth.category) : "삭제된 옷"));

          return `
            <div class="log-entry-item" data-date="${escapeHtml(log.wearDate)}">
              <div class="log-date-col">
                <div class="log-date-text">${escapeHtml(formatLogDate(log.wearDate))}</div>
              </div>

              <div class="log-content-col">
                <div class="log-thumbs-row">
                  ${items.map(({ id, cloth }) => cloth ? `
                    <a href="#/cloth/${escapeHtml(id)}" class="log-thumb-link" title="${escapeHtml(cloth.name || cloth.category)}">
                      <img class="log-thumb-compact" src="${cloth.thumb}" alt="${escapeHtml(cloth.name || cloth.category)}" loading="lazy" />
                    </a>
                  ` : `
                    <div class="log-thumb-compact log-thumb-deleted" title="삭제된 옷">삭제된 옷</div>
                  `).join("")}
                </div>

                <div class="log-details-wrap">
                  ${log.moodLabel ? `<span class="log-mood-text">${escapeHtml(log.moodLabel)}</span>` : ""}
                  ${log.weatherSummary ? `<span class="log-weather-text">${escapeHtml(log.weatherSummary)}</span>` : ""}
                  <span class="log-item-names">${names.map(escapeHtml).join(" + ")}</span>
                </div>
              </div>

              <button type="button" class="btn btn-secondary btn-sm btn-log-delete" data-date="${escapeHtml(log.wearDate)}">기록 삭제</button>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  listContainer.addEventListener("click", async (e) => {
    const delBtn = e.target.closest(".btn-log-delete");
    if (!delBtn) return;

    const date = delBtn.getAttribute("data-date");
    if (!confirm(`${formatLogDate(date)} 착용 기록을 삭제할까요?`)) return;

    delBtn.disabled = true;
    try {
      await deleteOutfitLog(date);
      logs = logs.filter(log => log.wearDate !== date);
      renderList();
    } catch (err) {
      console.error("기록 삭제 실패:", err);
      alert("기록을 삭제하지 못했습니다: " + (err.message || "다시 시도해주세요."));
      delBtn.disabled = false;
    }
  });

  // ----- 직접 기록하기 패널 -----
  const picker = { selected: new Set(), category: "전체", date: todayStr };

  function renderPanel() {
    if (clothes.length === 0) {
      panel.innerHTML = `
        <p class="text-sm text-muted">옷장에 등록된 옷이 없어요. 옷을 먼저 등록해주세요.</p>
        <a href="#/cloth/new" class="btn btn-primary btn-sm mt-3">+ 옷 등록하기</a>
      `;
      return;
    }

    const visible = picker.category === "전체"
      ? clothes
      : clothes.filter(c => c.category === picker.category);

    panel.innerHTML = `
      <div class="manual-log-row">
        <div class="form-group manual-log-date">
          <label for="manual-log-date" class="form-label">입은 날짜</label>
          <input type="date" id="manual-log-date" class="form-control" value="${escapeHtml(picker.date)}" max="${todayStr}" />
        </div>
        <p class="text-xs text-muted manual-log-hint">추천과 다르게 입었다면 실제로 입은 옷을 골라 기록하세요. 같은 날짜에 기록이 있으면 새 기록으로 바뀝니다.</p>
      </div>

      <div class="category-tabs manual-log-tabs" role="tablist">
        ${["전체", ...CATEGORIES].map(cat => `
          <button type="button" class="tab-btn ${picker.category === cat ? "active" : ""}" data-category="${cat}">${cat}</button>
        `).join("")}
      </div>

      ${visible.length === 0 ? `
        <p class="text-sm text-muted mt-3">이 카테고리에는 옷이 없어요.</p>
      ` : `
        <div class="pick-grid">
          ${visible.map(c => {
            const label = c.name || c.category;
            const isSel = picker.selected.has(c.id);
            return `
              <button type="button" class="pick-item ${isSel ? "selected" : ""}" data-id="${escapeHtml(c.id)}" aria-pressed="${isSel}">
                <img src="${c.thumb}" alt="${escapeHtml(label)}" loading="lazy" />
                <span class="pick-check">✓</span>
                <span class="pick-item-name">${escapeHtml(label)}</span>
              </button>
            `;
          }).join("")}
        </div>
      `}

      <div class="manual-log-actions">
        <span class="text-sm text-muted" id="manual-log-count">${picker.selected.size}벌 선택</span>
        <div class="actions-right">
          <button type="button" id="btn-manual-cancel" class="btn btn-secondary btn-sm">닫기</button>
          <button type="button" id="btn-manual-save" class="btn btn-primary btn-sm" ${picker.selected.size === 0 ? "disabled" : ""}>이 옷으로 기록</button>
        </div>
      </div>
    `;
  }

  function openPanel() {
    picker.selected = new Set();
    picker.category = "전체";
    picker.date = getKstDateString();
    renderPanel();
    panel.style.display = "block";
    toggleBtn.textContent = "기록 창 닫기";
  }

  function closePanel() {
    panel.style.display = "none";
    toggleBtn.textContent = "직접 기록하기";
  }

  toggleBtn.addEventListener("click", () => {
    if (panel.style.display === "none") openPanel();
    else closePanel();
  });

  panel.addEventListener("change", (e) => {
    if (e.target.id === "manual-log-date") {
      const value = e.target.value;
      // 비어 있거나 미래 날짜면 오늘로 되돌린다
      picker.date = value && value <= getKstDateString() ? value : getKstDateString();
      e.target.value = picker.date;
    }
  });

  panel.addEventListener("click", async (e) => {
    const tab = e.target.closest(".tab-btn");
    if (tab) {
      picker.category = tab.getAttribute("data-category");
      renderPanel();
      return;
    }

    const pick = e.target.closest(".pick-item");
    if (pick) {
      const id = pick.getAttribute("data-id");
      if (picker.selected.has(id)) picker.selected.delete(id);
      else picker.selected.add(id);

      pick.classList.toggle("selected", picker.selected.has(id));
      pick.setAttribute("aria-pressed", String(picker.selected.has(id)));
      panel.querySelector("#manual-log-count").textContent = `${picker.selected.size}벌 선택`;
      panel.querySelector("#btn-manual-save").disabled = picker.selected.size === 0;
      return;
    }

    if (e.target.closest("#btn-manual-cancel")) {
      closePanel();
      return;
    }

    const saveBtn = e.target.closest("#btn-manual-save");
    if (saveBtn) {
      await saveManualLog(saveBtn);
    }
  });

  async function saveManualLog(saveBtn) {
    const date = picker.date;
    const existing = logs.find(log => log.wearDate === date);

    if (existing && !confirm(`${formatLogDate(date)}에는 이미 기록이 있어요. 지금 고른 옷으로 바꿀까요?`)) {
      return;
    }

    // 카테고리 순서(아우터 → 이너 → ...)로 정렬해 저장
    const itemIds = Array.from(picker.selected).sort((a, b) => {
      const ca = CATEGORIES.indexOf(clothMap.get(a)?.category);
      const cb = CATEGORIES.indexOf(clothMap.get(b)?.category);
      return ca - cb;
    });

    saveBtn.disabled = true;
    saveBtn.textContent = "기록 중...";

    try {
      // 오늘 날짜로 기록할 때만 오늘 날씨를 함께 남긴다 (실패해도 기록은 저장)
      let weatherSummary = "";
      if (date === getKstDateString()) {
        const weather = await fetchTodayWeather();
        if (weather.ok) weatherSummary = weather.summary;
      }

      const entry = { wearDate: date, itemIds, weatherSummary, moodLabel: MANUAL_LOG_LABEL };
      await saveOutfitLog(entry);

      logs = [entry, ...logs.filter(log => log.wearDate !== date)]
        .sort((a, b) => (a.wearDate < b.wearDate ? 1 : a.wearDate > b.wearDate ? -1 : 0));
      renderList();
      closePanel();
    } catch (err) {
      console.error("직접 기록 실패:", err);
      alert("기록을 저장하지 못했습니다: " + (err.message || "다시 시도해주세요."));
      saveBtn.disabled = false;
      saveBtn.textContent = "이 옷으로 기록";
    }
  }

  renderList();
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
