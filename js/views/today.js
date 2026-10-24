/**
 * views/today.js
 * 오늘의 코디 화면 (1단계에서는 '준비 중' 표시)
 */

export function renderTodayView(container) {
  container.innerHTML = `
    <div class="placeholder-page">
      <div class="placeholder-card">
        <div class="placeholder-icon">🌤️</div>
        <h2>오늘의 코디 추천</h2>
        <p class="placeholder-badge">2단계 개발 예정</p>
        <p class="placeholder-desc">
          날씨(Open-Meteo) 정보와 옷들의 무드 궁합표를 기반으로<br>
          오늘 입기 좋은 최적의 코디 3가지를 똑똑하게 추천해 드립니다.
        </p>
        <div class="mt-4">
          <a href="#/closet" class="btn btn-primary">내 옷장으로 돌아가기</a>
        </div>
      </div>
    </div>
  `;
}
