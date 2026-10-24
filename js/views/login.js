/**
 * views/login.js
 * 로그인 화면 (단일 사용자 전용, 회원가입 없음)
 */

import { login } from "../auth.js";
import { isFirebaseConfigured } from "../firebase.js";

export function renderLoginView(container) {
  const isConfigured = isFirebaseConfigured();

  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-brand-wordmark">MY CLOSET</h1>
          <p class="auth-brand-subtitle">나만의 데일리 옷장 관리 & 코디 추천</p>
        </div>

        ${!isConfigured ? `
          <div class="alert alert-warning">
            <strong>⚠️ Firebase 설정 필요</strong>
            <p><code>js/firebase.js</code> 파일의 <code>firebaseConfig</code>에 본인의 Firebase 프로젝트 설정 정보를 입력해주세요.</p>
          </div>
        ` : ''}

        <div id="login-error" class="alert alert-danger" style="display: none;"></div>

        <form id="login-form" class="auth-form" autocomplete="on">
          <div class="form-group">
            <label for="login-email">이메일</label>
            <input 
              type="email" 
              id="login-email" 
              name="email" 
              class="form-control" 
              placeholder="example@email.com" 
              required 
              autocomplete="email"
              ${!isConfigured ? 'disabled' : ''}
            />
          </div>

          <div class="form-group">
            <label for="login-password">비밀번호</label>
            <input 
              type="password" 
              id="login-password" 
              name="password" 
              class="form-control" 
              placeholder="비밀번호 입력" 
              required 
              autocomplete="current-password"
              ${!isConfigured ? 'disabled' : ''}
            />
          </div>

          <button 
            type="submit" 
            id="login-submit-btn" 
            class="btn btn-primary btn-block"
            ${!isConfigured ? 'disabled' : ''}
          >
            로그인
          </button>
        </form>

        <div class="auth-footer">
          <p class="text-muted text-center text-sm">
            본 사이트는 개인 전용 옷장 시스템입니다.<br>
            계정 발급 및 설정은 관리자 콘솔을 이용하세요.
          </p>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector("#login-form");
  const errorBox = container.querySelector("#login-error");
  const submitBtn = container.querySelector("#login-submit-btn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.style.display = "none";
    errorBox.textContent = "";

    const email = form.elements["email"].value;
    const password = form.elements["password"].value;

    submitBtn.disabled = true;
    submitBtn.textContent = "로그인 중...";

    try {
      await login(email, password);
      // 로그인 성공 시 hashchange가 발생하거나 auth observer에 의해 closet으로 이동
      window.location.hash = "#/closet";
    } catch (err) {
      errorBox.textContent = err.message || "로그인에 실패했습니다.";
      errorBox.style.display = "block";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "로그인";
    }
  });
}
