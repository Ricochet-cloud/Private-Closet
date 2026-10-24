/**
 * views/closet.js
 * 옷장 목록 화면: 카테고리 탭, 보유 수, 썸네일 격자, 정보 부족 표시
 */

import { getClothes } from "../db.js";
import { CATEGORIES } from "../config.js";

// 현재 선택된 탭 상태 유지
let currentCategoryTab = "전체";

export async function renderClosetView(container) {
  container.innerHTML = `
    <div class="closet-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">내 옷장</h1>
          <p class="page-subtitle text-muted">등록된 옷들을 한눈에 확인하고 관리하세요</p>
        </div>
        <div class="header-actions">
          <a href="#/cloth/new" class="btn btn-primary">
            <span>+ 옷 등록</span>
          </a>
        </div>
      </div>

      <!-- 카테고리 통계 및 탭 영역 -->
      <div class="category-tabs-container">
        <div class="category-tabs" id="category-tabs" role="tablist">
          <button class="tab-btn ${currentCategoryTab === '전체' ? 'active' : ''}" data-category="전체">
            전체 <span class="tab-count" id="count-all">0</span>
          </button>
          ${CATEGORIES.map(cat => `
            <button class="tab-btn ${currentCategoryTab === cat ? 'active' : ''}" data-category="${cat}">
              ${cat} <span class="tab-count" id="count-${cat}">0</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 옷 목록 격자 컨테이너 -->
      <div id="closet-grid-container" class="closet-grid-wrapper">
        <div class="loading-state">
          <div class="spinner"></div>
          <p>옷장 목록을 불러오는 중입니다...</p>
        </div>
      </div>
    </div>
  `;

  const gridContainer = container.querySelector("#closet-grid-container");
  const tabButtons = container.querySelectorAll(".tab-btn");

  let allClothes = [];

  try {
    allClothes = await getClothes();
    updateCategoryCounts(allClothes, container);
    renderGrid(allClothes, currentCategoryTab, gridContainer);
  } catch (error) {
    console.error("옷장 데이터를 가져오는 중 오류:", error);
    gridContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>데이터를 불러오지 못했습니다</h3>
        <p class="text-muted">${error.message || 'Firebase 연결 상태 또는 보안 규칙을 확인해주세요.'}</p>
        <button class="btn btn-secondary mt-3" onclick="window.location.reload()">새로고침</button>
      </div>
    `;
    return;
  }

  // 탭 클릭 이벤트 처리
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategoryTab = btn.getAttribute("data-category");
      renderGrid(allClothes, currentCategoryTab, gridContainer);
    });
  });
}

/**
 * 카테고리별 개수 뱃지 갱신
 */
function updateCategoryCounts(clothes, container) {
  const allCountEl = container.querySelector("#count-all");
  if (allCountEl) allCountEl.textContent = clothes.length;

  CATEGORIES.forEach(cat => {
    const countEl = container.querySelector(`#count-${cat}`);
    if (countEl) {
      const count = clothes.filter(item => item.category === cat).length;
      countEl.textContent = count;
    }
  });
}

/**
 * 옷 썸네일 카드 격자 렌더링
 */
function renderGrid(clothes, activeCategory, container) {
  const filtered = activeCategory === "전체" 
    ? clothes 
    : clothes.filter(item => item.category === activeCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👕</div>
        <h3>${activeCategory === '전체' ? '등록된 옷이 없습니다' : `${activeCategory} 카테고리에 옷이 없습니다`}</h3>
        <p class="text-muted">입고 있는 멋진 옷을 사진과 함께 등록해보세요!</p>
        <a href="#/cloth/new" class="btn btn-primary mt-3">+ 새 옷 등록하기</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="cloth-grid">
      ${filtered.map(item => {
        const displayName = item.name && item.name.trim() !== '' ? item.name : item.category;
        const isMissingThickness = !item.thickness;
        const brand = item.brand ? item.brand : '';
        const moods = Array.isArray(item.moods) ? item.moods : [];

        return `
          <a href="#/cloth/${item.id}" class="cloth-card" title="${displayName}">
            <div class="cloth-thumb-wrap">
              <img 
                src="${item.thumb}" 
                alt="${displayName}" 
                class="cloth-thumb" 
                loading="lazy"
                onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\' viewBox=\\'0 0 200 200\\'><rect fill=\\'%23eee\\' width=\\'200\\' height=\\'200\\'/><text fill=\\'%23aaa\\' x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\' dy=\\'.3em\\'>이미지 없음</text></svg>'"
              />
              ${isMissingThickness ? `
                <span class="badge badge-warning" title="두께 정보가 없어 날씨 추천에서 제외됩니다">
                  정보 부족
                </span>
              ` : ''}
              <span class="badge badge-category">
                ${item.category}
              </span>
            </div>

            <div class="cloth-info">
              <div class="cloth-title-row">
                <h4 class="cloth-name">${escapeHtml(displayName)}</h4>
              </div>

              ${brand ? `<p class="cloth-brand text-muted">${escapeHtml(brand)}</p>` : ''}

              <div class="cloth-meta-row">
                ${item.thickness ? `<span class="cloth-chip chip-thickness">${escapeHtml(item.thickness)}</span>` : ''}
                ${item.color ? `<span class="cloth-chip chip-color">${escapeHtml(item.color)}</span>` : ''}
              </div>

              ${moods.length > 0 ? `
                <div class="cloth-moods">
                  ${moods.slice(0, 3).map(m => `<span class="mood-tag">#${escapeHtml(m)}</span>`).join('')}
                  ${moods.length > 3 ? `<span class="mood-tag-more">+${moods.length - 3}</span>` : ''}
                </div>
              ` : ''}
            </div>
          </a>
        `;
      }).join('')}
    </div>
  `;
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
