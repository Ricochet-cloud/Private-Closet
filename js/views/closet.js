/**
 * views/closet.js
 * 옷장 목록 화면: 요약 통계, 검색/정렬, 카테고리 탭, 썸네일 격자
 */
import { getClothes } from "../db.js";
import { CATEGORIES } from "../config.js";

let currentCategoryTab = "전체";

export async function renderClosetView(container) {
  container.innerHTML = `
    <div class="closet-page closet-page--refined">
      <section class="closet-hero">
        <div class="closet-hero-copy">
        <div class="closet-banner">
          <img src="images/banner.webp" alt="" /> </div>
          <p class="closet-eyebrow">YOUR PERSONAL ARCHIVE</p>
          <h1 class="page-title">내 옷장<span class="closet-title-period">.</span></h1>
          <p class="page-subtitle text-muted">가지고 있는 옷을 기록하고, 나만의 스타일을 쌓아보세요.</p>
        </div>
        <div class="closet-hero-actions">
          <a href="#/today" class="btn btn-secondary">오늘의 코디 <span aria-hidden="true">↗</span></a>
          <a href="#/cloth/new" class="btn btn-primary"><span aria-hidden="true">＋</span> 옷 등록</a>
        </div>
      </section>

      <section class="closet-overview" aria-label="옷장 요약">
        <div class="closet-stat closet-stat--primary">
          <span class="closet-stat-label">TOTAL PIECES</span>
          <div class="closet-stat-value"><strong id="closet-total-count">—</strong><span>벌</span></div>
          <span class="closet-stat-note">내 옷장에 등록된 전체 옷</span>
        </div>
        <div class="closet-stat">
          <span class="closet-stat-label">CATEGORIES</span>
          <div class="closet-stat-value"><strong id="closet-category-count">—</strong><span>종류</span></div>
          <span class="closet-stat-note">옷을 분류해 정리하기</span>
        </div>
        <div class="closet-stat">
          <span class="closet-stat-label">NEEDS DETAILS</span>
          <div class="closet-stat-value"><strong id="closet-incomplete-count">—</strong><span>벌</span></div>
          <span class="closet-stat-note">두께 정보가 비어 있는 옷</span>
        </div>
      </section>

      <section class="closet-library" aria-label="옷 목록">
        <div class="closet-section-heading">
          <div>
            <p class="closet-eyebrow">THE COLLECTION</p>
            <h2>옷장 아카이브</h2>
          </div>
          <span class="closet-result-count" id="closet-result-count">불러오는 중</span>
        </div>

        <div class="closet-tools">
          <label class="closet-search">
            <span class="closet-search-icon" aria-hidden="true">⌕</span>
            <span class="sr-only">옷 검색</span>
            <input id="closet-search-input" type="search" placeholder="옷 이름, 브랜드, 색상 검색" autocomplete="off">
            <kbd>SEARCH</kbd>
          </label>
          <label class="closet-sort-label" for="closet-sort-select">정렬</label>
          <select id="closet-sort-select" class="form-control closet-sort-select">
            <option value="recent">최근 등록순</option>
            <option value="name">이름순</option>
            <option value="brand">브랜드순</option>
            <option value="category">카테고리순</option>
          </select>
        </div>

        <div class="category-tabs-container closet-category-wrap">
          <div class="category-tabs" id="category-tabs" role="tablist" aria-label="카테고리 필터">
            <button type="button" class="tab-btn ${currentCategoryTab === '전체' ? 'active' : ''}" data-category="전체" role="tab" aria-selected="${currentCategoryTab === '전체'}">
              전체 <span class="tab-count" data-count-category="전체">0</span>
            </button>
            ${CATEGORIES.map(cat => `
              <button type="button" class="tab-btn ${currentCategoryTab === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}" role="tab" aria-selected="${currentCategoryTab === cat}">
                ${escapeHtml(cat)} <span class="tab-count" data-count-category="${escapeHtml(cat)}">0</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div id="closet-grid-container" class="closet-grid-wrapper">
          <div class="loading-state"><div class="spinner"></div><p>옷장 목록을 불러오는 중입니다...</p></div>
        </div>
      </section>
    </div>
  `;

  const gridContainer = container.querySelector("#closet-grid-container");
  const tabButtons = [...container.querySelectorAll(".tab-btn")];
  const searchInput = container.querySelector("#closet-search-input");
  const sortSelect = container.querySelector("#closet-sort-select");
  let allClothes = [];

  try {
    allClothes = await getClothes();
    updateOverview(allClothes, container);
    updateCategoryCounts(allClothes, container);
    renderGrid(allClothes, currentCategoryTab, searchInput.value, sortSelect.value, gridContainer, container);
  } catch (error) {
    console.error("옷장 데이터를 가져오는 중 오류:", error);
    gridContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">!</div>
        <h3>데이터를 불러오지 못했습니다</h3>
        <p class="text-muted">${escapeHtml(error.message || "Firebase 연결 상태 또는 보안 규칙을 확인해주세요.")}</p>
        <button type="button" class="btn btn-secondary mt-3" id="closet-reload-button">새로고침</button>
      </div>`;
    container.querySelector("#closet-reload-button")?.addEventListener("click", () => window.location.reload());
    return;
  }

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      currentCategoryTab = button.dataset.category;
      tabButtons.forEach(tab => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      renderGrid(allClothes, currentCategoryTab, searchInput.value, sortSelect.value, gridContainer, container);
    });
  });

  searchInput.addEventListener("input", () => {
    renderGrid(allClothes, currentCategoryTab, searchInput.value, sortSelect.value, gridContainer, container);
  });
  sortSelect.addEventListener("change", () => {
    renderGrid(allClothes, currentCategoryTab, searchInput.value, sortSelect.value, gridContainer, container);
  });
}

function updateOverview(clothes, container) {
  container.querySelector("#closet-total-count").textContent = clothes.length;
  container.querySelector("#closet-category-count").textContent = new Set(clothes.map(item => item.category).filter(Boolean)).size;
  container.querySelector("#closet-incomplete-count").textContent = clothes.filter(item => !item.thickness).length;
}

function updateCategoryCounts(clothes, container) {
  container.querySelectorAll("[data-count-category]").forEach(countEl => {
    const category = countEl.dataset.countCategory;
    const count = category === "전체" ? clothes.length : clothes.filter(item => item.category === category).length;
    countEl.textContent = count;
  });
}

function renderGrid(clothes, activeCategory, searchText, sortBy, container, pageContainer) {
  const query = searchText.trim().toLocaleLowerCase();
  let filtered = clothes.filter(item => {
    const categoryMatch = activeCategory === "전체" || item.category === activeCategory;
    const searchable = [item.name, item.brand, item.category, item.subcategory, item.color, item.thickness, ...(Array.isArray(item.moods) ? item.moods : [])]
      .filter(Boolean).join(" ").toLocaleLowerCase();
    return categoryMatch && (!query || searchable.includes(query));
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "name") return valueOf(a.name || a.category).localeCompare(valueOf(b.name || b.category), "ko");
    if (sortBy === "brand") return valueOf(a.brand).localeCompare(valueOf(b.brand), "ko") || valueOf(a.name).localeCompare(valueOf(b.name), "ko");
    if (sortBy === "category") return valueOf(a.category).localeCompare(valueOf(b.category), "ko") || valueOf(a.name).localeCompare(valueOf(b.name), "ko");
    return 0; // 기본값은 DB에서 반환된 순서를 유지
  });

  pageContainer.querySelector("#closet-result-count").textContent = `${filtered.length} / ${clothes.length}벌`;

  if (filtered.length === 0) {
    const hasQuery = Boolean(query);
    container.innerHTML = `
      <div class="empty-state closet-empty-state">
        <div class="closet-empty-mark" aria-hidden="true">${hasQuery ? "⌕" : "＋"}</div>
        <h3 class="empty-title">${hasQuery ? "검색 결과가 없습니다" : activeCategory === "전체" ? "아직 등록된 옷이 없습니다" : `${escapeHtml(activeCategory)} 카테고리에 옷이 없습니다`}</h3>
        <p class="text-muted text-sm mt-1">${hasQuery ? "다른 검색어를 입력하거나 카테고리를 바꿔보세요." : "자주 입는 옷부터 하나씩 기록해보세요."}</p>
        ${hasQuery ? `<button type="button" class="btn btn-secondary mt-3" id="closet-clear-search">검색 초기화</button>` : `<a href="#/cloth/new" class="btn btn-primary mt-3">＋ 첫 번째 옷 등록하기</a>`}
      </div>`;
    pageContainer.querySelector("#closet-clear-search")?.addEventListener("click", () => {
      pageContainer.querySelector("#closet-search-input").value = "";
      renderGrid(clothes, activeCategory, "", pageContainer.querySelector("#closet-sort-select").value, container, pageContainer);
    });
    return;
  }

  container.innerHTML = `<div class="cloth-grid">${filtered.map(item => {
    const displayName = item.name && item.name.trim() ? item.name : item.category || "이름 없는 옷";
    const brand = item.brand || "";
    const moods = Array.isArray(item.moods) ? item.moods : [];
    const image = item.thumb || "";
    return `
      <a href="#/cloth/${encodeURIComponent(item.id)}" class="cloth-card" title="${escapeHtml(displayName)}">
        <div class="cloth-thumb-wrap">
          ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(displayName)}" class="cloth-thumb" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.hidden=false">` : ""}
          <div class="closet-image-fallback" ${image ? "hidden" : ""}>NO IMAGE</div>
          ${!item.thickness ? `<span class="badge badge-warning" title="두께 정보가 없어 날씨 추천에서 제외됩니다">정보 부족</span>` : ""}
          <span class="badge badge-category">${escapeHtml(item.category || "기타")}</span><span class="badge badge-category">
            ${escapeHtml(item.category || "기타")}${item.subcategory ? ` · ${escapeHtml(item.subcategory)}` : ""}
              </span>
        </div>
        <div class="cloth-info">
          <div class="cloth-title-row"><h4 class="cloth-name">${escapeHtml(displayName)}</h4></div>
          ${brand ? `<p class="cloth-brand text-muted">${escapeHtml(brand)}</p>` : `<p class="cloth-brand text-muted closet-no-brand">브랜드 미등록</p>`}
          <div class="cloth-meta-row">
            ${item.thickness ? `<span class="cloth-chip chip-thickness">${escapeHtml(item.thickness)}</span>` : ""}
            ${item.color ? `<span class="cloth-chip chip-color">${escapeHtml(item.color)}</span>` : ""}
          </div>
          ${moods.length ? `<div class="cloth-moods">${moods.slice(0, 3).map(mood => `<span class="mood-tag">#${escapeHtml(mood)}</span>`).join("")}${moods.length > 3 ? `<span class="mood-tag-more">+${moods.length - 3}</span>` : ""}</div>` : ""}
        </div>
      </a>`;
  }).join("")}</div>`;
}

function valueOf(value) {
  return String(value || "").toLocaleLowerCase();
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
