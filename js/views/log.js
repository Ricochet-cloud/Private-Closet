/**
 * views/log.js
 * 착용 기록 화면
 * - 날짜: 세리프 서체
 * - 항목 사이: 1px 선으로 구분
 * - 썸네일: 컴팩트한 크기
 */

export function renderLogView(container) {
  container.innerHTML = `
    <div class="log-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">착용 기록</h1>
          <p class="page-subtitle text-muted">날짜별로 입었던 데일리룩 아카이브</p>
        </div>
        <div class="header-actions">
          <a href="#/closet" class="btn btn-secondary btn-sm">옷장 보기</a>
        </div>
      </div>

      <div id="log-list-container">
        <div class="empty-state">
          <h3 class="empty-title">기록된 착용 내역이 없습니다</h3>
          <p class="text-muted text-sm mt-1">오늘의 코디에서 입은 옷을 기록하면 날짜별로 아카이브에 보관됩니다.</p>
          <a href="#/today" class="btn btn-primary mt-3">오늘의 코디 확인하기</a>
        </div>
      </div>
    </div>
  `;
}
