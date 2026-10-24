/**
 * views/log.js
 * 착용 기록 화면 (1단계에서는 '준비 중' 표시)
 */

export function renderLogView(container) {
  container.innerHTML = `
    <div class="placeholder-page">
      <div class="placeholder-card">
        <div class="placeholder-icon">📅</div>
        <h2>착용 기록 & 데일리 로그</h2>
        <p class="placeholder-badge">3단계 개발 예정</p>
        <p class="placeholder-desc">
          오늘 입은 코디를 기록하고, 최근 입었던 옷의 통계와<br>
          중복 착용 방지(최근 4일) 기능을 제공할 예정입니다.
        </p>
        <div class="mt-4">
          <a href="#/closet" class="btn btn-primary">내 옷장으로 돌아가기</a>
        </div>
      </div>
    </div>
  `;
}
