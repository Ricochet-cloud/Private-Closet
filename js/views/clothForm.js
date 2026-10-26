/**
 * views/clothForm.js
 * 옷 등록 및 수정/삭제 화면
 * - 등록: #/cloth/new
 * - 수정: #/cloth/:id
 */

import { addCloth, updateCloth, getCloth, deleteCloth, getOutfitLogs, summarizeWear } from "../db.js";
import { formatLogDate } from "../dateUtil.js";
import { getImage } from "../imageStore.js";
import { processClothImage } from "../imageResize.js";
import { 
  CATEGORIES, 
  SUBCATEGORIES,
  COLORS, 
  THICKNESSES, 
  SEASONS, 
  DEFAULT_MOODS 
} from "../config.js";

export async function renderClothFormView(container, params = {}) {
  const isEdit = params.mode === "edit" && Boolean(params.id);
  const clothId = params.id || null;

  container.innerHTML = `
    <div class="form-page">
      <div class="form-header">
        <a href="#/closet" class="btn-back">← 옷장으로 돌아가기</a>
        <h1 class="page-title">${isEdit ? '옷 정보 수정' : '새 옷 등록'}</h1>
      </div>

      <div id="form-loader" class="loading-state" style="${isEdit ? '' : 'display: none;'}">
        <div class="spinner"></div>
        <p>옷 정보를 불러오는 중입니다...</p>
      </div>

      <div id="form-content" style="${isEdit ? 'display: none;' : ''}">
        <div id="form-alert" class="alert alert-danger" style="display: none;"></div>

        <form id="cloth-form" class="cloth-form-grid" novalidate>
          <!-- 좌측: 사진 업로드 및 미리보기 -->
          <div class="form-col-photo">
            <div class="photo-card">
              <label class="form-label required">옷 사진</label>
              
              <div class="photo-preview-area" id="photo-preview-box">
                <img id="photo-preview-img" src="" alt="미리보기" style="display: none;" />
                <div id="photo-placeholder" class="photo-placeholder">
                  <p class="photo-placeholder-title font-serif">사진을 업로드해주세요</p>
                  <span class="text-xs text-muted">선택 시 자동으로 1200px / 400px 최적화 압축됩니다</span>
                </div>
                <div id="photo-loading-overlay" class="photo-loading-overlay" style="display: none;">
                  <div class="spinner"></div>
                  <p id="photo-loading-text">이미지 압축 처리 중...</p>
                </div>
              </div>

              <div class="photo-upload-controls">
                <label for="cloth-photo-input" class="btn btn-secondary btn-block">
                  <span>${isEdit ? '사진 변경하기' : '사진 선택 / 촬영'}</span>
                </label>
                <input 
                  type="file" 
                  id="cloth-photo-input" 
                  accept="image/*" 
                  style="display: none;" 
                />
                <p id="photo-size-info" class="text-xs text-muted mt-1 text-center"></p>
              </div>

              ${isEdit ? `
                <div class="cloth-wear-stat-box">
                  <h4 class="stat-title">착용 기록 정보</h4>
                  <div class="stat-row">
                    <span class="stat-label">마지막 착용일</span>
                    <span class="stat-val" id="last-wear-date">-</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">총 착용 횟수</span>
                    <span class="stat-val" id="total-wear-count">0회</span>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- 우측: 정보 입력 폼 -->
          <div class="form-col-details">
            <div class="details-card">
              <!-- 카테고리 (필수) -->
              <div class="form-group">
                <label class="form-label required">카테고리</label>
                <div class="category-select-grid" id="category-radio-group">
                  ${CATEGORIES.map(cat => `
                    <label class="category-pill-label">
                      <input type="radio" name="category" value="${cat}" class="sr-only" required />
                      <span class="category-pill">${cat}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

          <!-- 하위 카테고리 (선택) -->
          <div class="form-group">
            <label for="cloth-subcategory" class="form-label">
              세부 종류 <span class="text-muted text-xs font-normal">(선택)</span>
              </label>
              <select id="cloth-subcategory" name="subcategory" class="form-control" disabled>
                <option value="">먼저 카테고리를 선택해주세요</option>
            </select>
          </div>


              <!-- 이름 (선택, 비우면 카테고리명) -->
              <div class="form-group">
                <label for="cloth-name" class="form-label">
                  옷 이름 <span class="text-muted text-xs font-normal">(선택)</span>
                </label>
                <input 
                  type="text" 
                  id="cloth-name" 
                  name="name" 
                  class="form-control" 
                  placeholder="비워두면 선택한 카테고리명으로 표시됩니다" 
                  maxlength="50"
                />
              </div>

              <!-- 브랜드 (선택) -->
              <div class="form-group">
                <label for="cloth-brand" class="form-label">
                  브랜드 <span class="text-muted text-xs font-normal">(선택)</span>
                </label>
                <input 
                  type="text" 
                  id="cloth-brand" 
                  name="brand" 
                  class="form-control" 
                  placeholder="예: 바버, 유니클로, 리바이스 등" 
                  maxlength="50"
                />
              </div>

              <!-- 색상 & 두께 그리드 -->
              <div class="form-row-2">
                <!-- 색상 -->
                <div class="form-group">
                  <label for="cloth-color" class="form-label">
                    색상 <span class="text-muted text-xs font-normal">(선택)</span>
                  </label>
                  <select id="cloth-color" name="color" class="form-control">
                    <option value="">색상 선택 안 함</option>
                    ${COLORS.map(c => `<option value="${c}">${c}</option>`).join('')}
                  </select>
                </div>

                <!-- 두께 -->
                <div class="form-group">
                  <label class="form-label">
                    두께 <span class="text-muted text-xs font-normal">(추천에 필수)</span>
                  </label>
                  <div class="chip-select-grid" id="thickness-radio-group">
                    <label class="chip-label">
                      <input type="radio" name="thickness" value="" class="sr-only" checked />
                      <span class="chip-pill">미입력</span>
                    </label>
                    ${THICKNESSES.map(t => `
                      <label class="chip-label">
                        <input type="radio" name="thickness" value="${t}" class="sr-only" />
                        <span class="chip-pill">${t}</span>
                      </label>
                    `).join('')}
                  </div>
                  <span class="field-hint text-xs">두께 미입력 시 날씨 추천에서 제외됩니다.</span>
                </div>
              </div>

              <!-- 계절 (복수 선택) -->
              <div class="form-group">
                <label class="form-label">
                  계절 <span class="text-muted text-xs font-normal">(복수 선택 가능)</span>
                </label>
                <div class="checkbox-pill-group" id="season-group">
                  ${SEASONS.map(s => `
                    <label class="pill-check-label">
                      <input type="checkbox" name="seasons" value="${s}" class="sr-only" />
                      <span class="pill-check-text">${s}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- 무드 태그 (복수 선택 및 직접 추가) -->
              <div class="form-group">
                <label class="form-label">
                  무드 태그 <span class="text-muted text-xs font-normal">(복수 선택 및 직접 추가)</span>
                </label>
                
                <div class="mood-selector-wrap">
                  <div class="mood-preset-chips" id="mood-preset-chips">
                    ${DEFAULT_MOODS.map(m => `
                      <button type="button" class="mood-chip-btn" data-mood="${m}">
                        + ${m}
                      </button>
                    `).join('')}
                  </div>

                  <div class="mood-custom-add-row mt-2">
                    <input 
                      type="text" 
                      id="custom-mood-input" 
                      class="form-control form-control-sm" 
                      placeholder="원하는 무드 태그 직접 입력 (예: 시티보이, 고프코어)" 
                      maxlength="20"
                    />
                    <button type="button" id="btn-add-custom-mood" class="btn btn-secondary btn-sm">
                      추가
                    </button>
                  </div>

                  <!-- 선택된 무드 태그 목록 -->
                  <div class="selected-moods-box mt-2" id="selected-moods-container">
                    <span class="text-xs text-muted" id="no-mood-hint">선택된 무드 태그가 없습니다.</span>
                  </div>
                </div>
              </div>

              <!-- 메모 -->
              <div class="form-group">
                <label for="cloth-memo" class="form-label">
                  메모 <span class="text-muted text-xs font-normal">(선택)</span>
                </label>
                <textarea 
                  id="cloth-memo" 
                  name="memo" 
                  class="form-control" 
                  rows="3" 
                  placeholder="사이즈감, 소재 특징, 세탁 방법 등 자유롭게 기록"
                ></textarea>
              </div>

              <!-- 하단 버튼 바 -->
              <div class="form-actions-row">
                ${isEdit ? `
                  <button type="button" id="btn-delete-cloth" class="btn btn-danger">
                    옷 삭제
                  </button>
                ` : '<div></div>'}

                <div class="actions-right">
                  <a href="#/closet" class="btn btn-secondary">취소</a>
                  <button type="submit" id="btn-submit-cloth" class="btn btn-primary">
                    ${isEdit ? '수정 완료' : '등록 완료'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  // 상태 관리 객체
  const state = {
    selectedMoods: new Set(),
    thumbDataUrl: null,
    detailImageData: null,
    existingCloth: null
  };

  const formLoader = container.querySelector("#form-loader");
  const formContent = container.querySelector("#form-content");
  const clothForm = container.querySelector("#cloth-form");
  const formAlert = container.querySelector("#form-alert");
  const photoInput = container.querySelector("#cloth-photo-input");
  const previewImg = container.querySelector("#photo-preview-img");
  const placeholder = container.querySelector("#photo-placeholder");
  const loadingOverlay = container.querySelector("#photo-loading-overlay");
  const loadingText = container.querySelector("#photo-loading-text");
  const sizeInfo = container.querySelector("#photo-size-info");
  const submitBtn = container.querySelector("#btn-submit-cloth");
  const selectedMoodsContainer = container.querySelector("#selected-moods-container");
  const customMoodInput = container.querySelector("#custom-mood-input");
  const btnAddCustomMood = container.querySelector("#btn-add-custom-mood");
  const subcategorySelect = container.querySelector("#cloth-subcategory");

function updateSubcategoryOptions(category, selectedValue = "") {
  const options = SUBCATEGORIES[category] || [];

  subcategorySelect.innerHTML =
    `<option value="">세부 종류 선택 안 함</option>` +
    options.map(value =>
      `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
    ).join("");

  subcategorySelect.disabled = options.length === 0;

  if (!options.length) {
    subcategorySelect.innerHTML =
      `<option value="">선택 가능한 세부 종류 없음</option>`;
  }

  if (selectedValue && options.includes(selectedValue)) {
    subcategorySelect.value = selectedValue;
  }
}

container.querySelectorAll('input[name="category"]').forEach(radio => {
  radio.addEventListener("change", () => {
    updateSubcategoryOptions(radio.value);
  });
});

  // 무드 태그 렌더링 함수
  function updateMoodChips() {
    if (state.selectedMoods.size === 0) {
      selectedMoodsContainer.innerHTML = `<span class="text-xs text-muted" id="no-mood-hint">선택된 무드 태그가 없습니다.</span>`;
    } else {
      selectedMoodsContainer.innerHTML = Array.from(state.selectedMoods).map(m => `
        <span class="selected-mood-tag">
          #${escapeHtml(m)}
          <button type="button" class="btn-remove-mood" data-remove="${escapeHtml(m)}" title="삭제">×</button>
        </span>
      `).join('');

      selectedMoodsContainer.querySelectorAll(".btn-remove-mood").forEach(btn => {
        btn.addEventListener("click", () => {
          const toRemove = btn.getAttribute("data-remove");
          state.selectedMoods.delete(toRemove);
          updateMoodChips();
        });
      });
    }

    // 프리셋 버튼 active 상태 동기화
    container.querySelectorAll(".mood-chip-btn").forEach(btn => {
      const mood = btn.getAttribute("data-mood");
      if (state.selectedMoods.has(mood)) {
        btn.classList.add("selected");
      } else {
        btn.classList.remove("selected");
      }
    });
  }

  // 기본 무드 프리셋 클릭 이벤트
  container.querySelectorAll(".mood-chip-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const mood = btn.getAttribute("data-mood");
      if (state.selectedMoods.has(mood)) {
        state.selectedMoods.delete(mood);
      } else {
        state.selectedMoods.add(mood);
      }
      updateMoodChips();
    });
  });

  // 커스텀 무드 추가
  function addCustomMood() {
    const val = customMoodInput.value.trim().replace(/^#+/, "");
    if (val) {
      state.selectedMoods.add(val);
      customMoodInput.value = "";
      updateMoodChips();
    }
  }

  btnAddCustomMood.addEventListener("click", addCustomMood);
  customMoodInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomMood();
    }
  });

  // 사진 선택 핸들러
  photoInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    loadingOverlay.style.display = "flex";
    loadingText.textContent = `사진 압축 중... (${(file.size / (1024 * 1024)).toFixed(1)}MB)`;
    formAlert.style.display = "none";

    try {
      const processed = await processClothImage(file);
      state.thumbDataUrl = processed.thumb;
      state.detailImageData = processed.detail;

      // 미리보기 표시
      previewImg.src = processed.thumb;
      previewImg.style.display = "block";
      placeholder.style.display = "none";

      const detailKb = Math.round(processed.detail.bytes / 1024);
      sizeInfo.textContent = `상세 사진: ${processed.detail.width}x${processed.detail.height}px (${detailKb}KB) / 썸네일 생성 완료`;
    } catch (err) {
      console.error("사진 처리 실패:", err);
      formAlert.textContent = err.message || "이미지 처리에 실패했습니다.";
      formAlert.style.display = "block";
    } finally {
      loadingOverlay.style.display = "none";
    }
  });

  // 수정 모드일 때 기존 데이터 불러오기
  if (isEdit) {
    try {
      const cloth = await getCloth(clothId);
      if (!cloth) {
        throw new Error("존재하지 않거나 삭제된 옷입니다.");
      }
      state.existingCloth = cloth;

      // 마지막 착용일·총 착용 횟수: 별도 필드 없이 착용 기록 전체에서 계산 (화면을 막지 않도록 따로 불러옴)
      getOutfitLogs().then(logs => {
        const { count, lastDate } = summarizeWear(logs, clothId);
        const lastEl = container.querySelector("#last-wear-date");
        const countEl = container.querySelector("#total-wear-count");
        if (lastEl) lastEl.textContent = lastDate ? formatLogDate(lastDate) : "-";
        if (countEl) countEl.textContent = `${count}회`;
      }).catch(err => {
        console.warn("착용 기록 로드 실패(통계 표시 생략):", err);
      });

      // 폼 값 채우기
      if (cloth.category) {
        const catRadio = clothForm.querySelector(
          `input[name="category"][value="${cloth.category}"]`
        );

        if (catRadio) catRadio.checked = true;

      updateSubcategoryOptions(
        cloth.category,
        cloth.subcategory || ""
          );
        }

      if (cloth.name) clothForm.elements["name"].value = cloth.name;
      if (cloth.brand) clothForm.elements["brand"].value = cloth.brand;
      if (cloth.color) clothForm.elements["color"].value = cloth.color;
      if (cloth.thickness) {
        const thickRadio = clothForm.querySelector(`input[name="thickness"][value="${cloth.thickness}"]`);
        if (thickRadio) thickRadio.checked = true;
        else if (clothForm.elements["thickness"]) clothForm.elements["thickness"].value = cloth.thickness;
      }
      if (cloth.memo) clothForm.elements["memo"].value = cloth.memo;

      // 계절 체크박스
      if (Array.isArray(cloth.seasons)) {
        cloth.seasons.forEach(s => {
          const chk = clothForm.querySelector(`input[name="seasons"][value="${s}"]`);
          if (chk) chk.checked = true;
        });
      }

      // 무드 태그
      if (Array.isArray(cloth.moods)) {
        cloth.moods.forEach(m => state.selectedMoods.add(m));
        updateMoodChips();
      }

      // 기존 썸네일 미리보기 표시
      if (cloth.thumb) {
        previewImg.src = cloth.thumb;
        previewImg.style.display = "block";
        placeholder.style.display = "none";
        state.thumbDataUrl = cloth.thumb;
      }

      // 비동기로 고화질 상세 사진 로드 확인
      getImage(clothId).then(detailImg => {
        if (detailImg && detailImg.dataUrl) {
          previewImg.src = detailImg.dataUrl;
          sizeInfo.textContent = `상세 사진: ${detailImg.width}x${detailImg.height}px (${Math.round((detailImg.bytes || 0) / 1024)}KB)`;
        }
      }).catch(err => {
        console.warn("상세 사진 로드 실패(썸네일 사용):", err);
      });

      formLoader.style.display = "none";
      formContent.style.display = "block";

      // 삭제 버튼 이벤트
      const btnDelete = container.querySelector("#btn-delete-cloth");
      if (btnDelete) {
        btnDelete.addEventListener("click", async () => {
          const clothDisplayName = cloth.name || cloth.category;
          const ok = confirm(`정말 "${clothDisplayName}" 옷을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 등록된 상세 사진도 함께 삭제됩니다.`);
          if (!ok) return;

          btnDelete.disabled = true;
          btnDelete.textContent = "삭제 중...";

          try {
            await deleteCloth(clothId);
            window.location.hash = "#/closet";
          } catch (delErr) {
            console.error("삭제 실패:", delErr);
            alert("옷 삭제에 실패했습니다: " + (delErr.message || "다시 시도해주세요."));
            btnDelete.disabled = false;
            btnDelete.textContent = "옷 삭제";
          }
        });
      }

    } catch (loadErr) {
      console.error("데이터 로드 실패:", loadErr);
      formLoader.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>${loadErr.message || '옷 정보를 불러올 수 없습니다.'}</h3>
          <a href="#/closet" class="btn btn-secondary mt-3">옷장으로 돌아가기</a>
        </div>
      `;
      return;
    }
  }

  // 폼 제출(등록 / 수정) 핸들러
  clothForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formAlert.style.display = "none";

    // 카테고리 필수 체크
    const categoryInput = clothForm.querySelector('input[name="category"]:checked');
    if (!categoryInput) {
      formAlert.textContent = "카테고리를 선택해주세요.";
      formAlert.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 사진 필수 체크 (새 등록일 때)
    if (!isEdit && !state.thumbDataUrl) {
      formAlert.textContent = "옷 사진을 업로드해주세요.";
      formAlert.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 입력값 취합
    const category = categoryInput.value;
    const subcategory = subcategorySelect.value;
    const name = clothForm.elements["name"].value.trim();
    const brand = clothForm.elements["brand"].value.trim();
    const color = clothForm.elements["color"].value;
    const thicknessInput = clothForm.querySelector('input[name="thickness"]:checked');
    const thickness = thicknessInput ? thicknessInput.value : (clothForm.elements["thickness"]?.value || "");
    const memo = clothForm.elements["memo"].value.trim();

    const seasons = Array.from(clothForm.querySelectorAll('input[name="seasons"]:checked'))
      .map(el => el.value);

    const moods = Array.from(state.selectedMoods);

    const clothData = {
      category,
      subcategory,
      name,
      brand,
      color,
      thickness,
      seasons,
      moods,
      memo,
      thumb: state.thumbDataUrl
    };

    submitBtn.disabled = true;
    submitBtn.textContent = isEdit ? "수정 저장 중..." : "등록 중...";

    try {
      if (isEdit) {
        await updateCloth(clothId, clothData, state.detailImageData);
      } else {
        await addCloth(clothData, state.detailImageData);
      }

      window.location.hash = "#/closet";
    } catch (saveErr) {
      console.error("저장 실패:", saveErr);
      formAlert.textContent = saveErr.message || "저장 중 오류가 발생했습니다.";
      formAlert.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? "수정 완료" : "등록 완료";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
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
