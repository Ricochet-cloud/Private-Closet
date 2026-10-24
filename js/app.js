/**
 * app.js
 * 애플리케이션 진입점 및 해시 라우터 (인증 가드 포함)
 */

import { onAuthChange, logout, getCurrentUser } from "./auth.js";
import { isFirebaseConfigured } from "./firebase.js";
import { renderLoginView } from "./views/login.js";
import { renderClosetView } from "./views/closet.js";
import { renderClothFormView } from "./views/clothForm.js";
import { renderTodayView } from "./views/today.js";
import { renderLogView } from "./views/log.js";

const appContainer = document.getElementById("app");
const navContainer = document.getElementById("main-nav");

let currentUser = null;
let initialAuthChecked = false;

/**
 * 네비게이션 바 렌더링
 */
function updateNavbar(hash) {
  if (!currentUser) {
    navContainer.innerHTML = "";
    navContainer.style.display = "none";
    return;
  }

  navContainer.style.display = "block";
  navContainer.innerHTML = `
    <header class="app-header">
      <div class="header-inner">
        <a href="#/closet" class="header-brand">
          <span class="brand-icon">🧥</span>
          <span class="brand-text">내 옷장</span>
        </a>

        <nav class="nav-links">
          <a href="#/closet" class="nav-link ${hash.startsWith('#/closet') || hash.startsWith('#/cloth') ? 'active' : ''}">
            옷장
          </a>
          <a href="#/today" class="nav-link ${hash.startsWith('#/today') ? 'active' : ''}">
            오늘의 코디
          </a>
          <a href="#/log" class="nav-link ${hash.startsWith('#/log') ? 'active' : ''}">
            착용 기록
          </a>
        </nav>

        <div class="header-user">
          <span class="user-email text-xs text-muted" title="${currentUser.email || ''}">
            ${currentUser.email || '사용자'}
          </span>
          <button id="btn-logout" class="btn btn-outline btn-sm">
            로그아웃
          </button>
        </div>
      </div>
    </header>
  `;

  const logoutBtn = navContainer.querySelector("#btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await logout();
        window.location.hash = "#/login";
      } catch (err) {
        console.error("로그아웃 실패:", err);
      }
    });
  }
}

/**
 * 라우트 파싱 및 뷰 렌더링
 */
async function router() {
  // 인증 상태 확인 전이면 로딩 표시
  if (!initialAuthChecked) {
    appContainer.innerHTML = `
      <div class="initial-loader">
        <div class="spinner"></div>
        <p class="mt-2 text-muted">옷장을 불러오는 중...</p>
      </div>
    `;
    return;
  }

  let hash = window.location.hash || "#/closet";

  // 로그인 상태가 아닐 때: 로그인 화면만 허용
  if (!currentUser) {
    if (hash !== "#/login") {
      window.location.hash = "#/login";
      return;
    }
    updateNavbar(hash);
    renderLoginView(appContainer);
    return;
  }

  // 로그인 상태일 때: #/login 또는 빈 해시는 #/closet으로 리다이렉트
  if (hash === "#/login" || hash === "#" || hash === "" || hash === "#/") {
    window.location.hash = "#/closet";
    return;
  }

  updateNavbar(hash);

  // 라우팅 분기
  if (hash === "#/closet") {
    await renderClosetView(appContainer);
  } else if (hash === "#/cloth/new") {
    await renderClothFormView(appContainer, { mode: "new" });
  } else if (hash.startsWith("#/cloth/")) {
    const id = hash.replace("#/cloth/", "").split("?")[0];
    if (id) {
      await renderClothFormView(appContainer, { mode: "edit", id });
    } else {
      window.location.hash = "#/closet";
    }
  } else if (hash === "#/today") {
    renderTodayView(appContainer);
  } else if (hash === "#/log") {
    renderLogView(appContainer);
  } else {
    // 정의되지 않은 경로는 옷장 목록으로 이동
    window.location.hash = "#/closet";
  }
}

// 해시 변경 이벤트 리스너
window.addEventListener("hashchange", () => {
  router();
});

// Firebase 인증 상태 리스너 초기화
onAuthChange((user) => {
  currentUser = user;
  initialAuthChecked = true;
  router();
});
