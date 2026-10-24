import { recommendOutfits } from './js/recommend.js';
import { getSingleMoodScore } from './js/moodMatrix.js';

console.log('==================================================');
console.log('🧪 2단계 코디 추천 알고리즘 완료 기준 검증 테스트');
console.log('==================================================');

// 1. 궁합 0점 쌍 확인
console.log('\n[테스트 1] 궁합 점수 계산 검증:');
const amekajiPreppy = getSingleMoodScore('아메카지', '프레피');
const amekajiWorkwear = getSingleMoodScore('아메카지', '워크웨어');
console.log(`- 아메카지 x 프레피: ${amekajiPreppy}점 (기대값: 0점)`);
console.log(`- 아메카지 x 워크웨어: ${amekajiWorkwear}점 (기대값: 2점)`);

// 2. 샘플 옷 데이터셋
const sampleClothes = [
  // 아우터
  { id: 'o1', category: '아우터', name: '아메카지 커버올', thickness: '보통', moods: ['아메카지'], seasons: ['가을'], thumb: 'thumb_o1' },
  { id: 'o2', category: '아우터', name: '헤비 다운 패딩', thickness: '두꺼움', moods: ['워크웨어'], seasons: ['겨울'], thumb: 'thumb_o2' },
  { id: 'o3', category: '아우터', name: '두께 누락 코트', thickness: '', moods: ['빈티지'], seasons: ['가을'], thumb: 'thumb_o3' },
  { id: 'o4', category: '아우터', name: '라이트 윈드브레이커', thickness: '얇음', moods: ['밀리터리'], seasons: ['봄', '가을'], thumb: 'thumb_o4' },

  // 이너
  { id: 'i1', category: '니트', name: '프레피 브이넥 니트', thickness: '보통', moods: ['프레피'], seasons: ['가을'], thumb: 'thumb_i1' },
  { id: 'i2', category: '셔츠', name: '워크웨어 데님 셔츠', thickness: '보통', moods: ['워크웨어'], seasons: ['가을'], thumb: 'thumb_i2' },
  { id: 'i3', category: '맨투맨', name: '빈티지 스웨트셔츠', thickness: '보통', moods: ['빈티지'], seasons: ['가을'], thumb: 'thumb_i3' },
  { id: 'i4', category: '니트', name: '헤비 울 니트', thickness: '두꺼움', moods: ['워크웨어'], seasons: ['겨울'], thumb: 'thumb_i4' },
  { id: 'i5', category: '셔츠', name: '두께 누락 셔츠', thickness: '', moods: ['아이비'], seasons: ['가을'], thumb: 'thumb_i5' },
  { id: 'i6', category: '셔츠', name: '린넨 셔츠', thickness: '얇음', moods: ['아이비'], seasons: ['여름'], thumb: 'thumb_i6' },
  { id: 'i7', category: '맨투맨', name: '아메카지 맨투맨', thickness: '보통', moods: ['아메카지'], seasons: ['가을'], thumb: 'thumb_i7' },
];

// 테스트: 14°C (12~16°C 구간: 아우터 보통/얇음, 이너 보통/얇음)
console.log('\n[테스트 2] 14°C 추천 실행 (12~16°C: 보통, 얇음 두께 구간)');
const res14 = recommendOutfits(sampleClothes, 14, new Date('2026-10-24'));
console.log(`- 추천된 코디 수: ${res14.recommendations.length}개 (최대 3개)`);

res14.recommendations.forEach((rec, idx) => {
  const itemNames = rec.items.map(i => `${i.name}(${i.thickness}, [${i.moods.join(',')}])`).join(' + ');
  console.log(`  [${idx + 1}위] ${itemNames} | 총점: ${rec.score} (${rec.moodLabel})`);
});

// 완료 기준 1: 궁합 0점 쌍 (예: 아메카지 + 프레피) 제외 여부
const hasClash = res14.recommendations.some(rec => 
  rec.items.some(i => i.moods.includes('아메카지')) && 
  rec.items.some(i => i.moods.includes('프레피'))
);
console.log(`- 기준 1: 궁합 0점 쌍(아메카지+프레피) 제외 여부 -> ${!hasClash ? '✅ 통과 (제외됨)' : '❌ 실패'}`);

// 완료 기준 2: 기온에 안 맞는 두께 및 두께 누락 옷 제외 여부
const hasWrongThickness = res14.recommendations.some(rec =>
  rec.items.some(i => i.thickness === '두꺼움')
);
const hasMissingThickness = res14.recommendations.some(rec =>
  rec.items.some(i => !i.thickness)
);
console.log(`- 기준 2-1: 14°C에 맞지 않는 '두꺼움' 제외 여부 -> ${!hasWrongThickness ? '✅ 통과 (제외됨)' : '❌ 실패'}`);
console.log(`- 기준 2-2: 두께 정보 누락 옷 제외 여부 -> ${!hasMissingThickness ? '✅ 통과 (제외됨)' : '❌ 실패'}`);

// 완료 기준 3: 3개 추천 및 다시 추천 시 이미 본 조합 제외 여부
console.log('\n[테스트 3] 다시 추천 (이미 본 조합 제외) 검증:');
const firstShownKeys = res14.recommendations.map(r => r.key);
const res14Next = recommendOutfits(sampleClothes, 14, new Date('2026-10-24'), [], firstShownKeys);
console.log(`- 이전 추천 키 목록:`, firstShownKeys);
console.log(`- 다음 추천 개수: ${res14Next.recommendations.length}개`);
res14Next.recommendations.forEach((rec, idx) => {
  console.log(`  [다시추천 ${idx + 1}위] ${rec.items.map(i => i.name).join(' + ')} | 점수: ${rec.score}`);
});

const hasOverlap = res14Next.recommendations.some(rec => firstShownKeys.includes(rec.key));
console.log(`- 기준 3: 다시 추천 시 기존 조합 제외 여부 -> ${!hasOverlap ? '✅ 통과 (제외됨)' : '❌ 실패'}`);

// 완료 기준 4: 25°C 이너 단독 추천 검증 (23°C 이상: 아우터 없음 허용)
console.log('\n[테스트 4] 25°C (23°C 이상: 아우터 없음, 얇은 이너 단독) 검증:');
const res25 = recommendOutfits(sampleClothes, 25, new Date('2026-07-15'));
console.log(`- 25°C 추천 개수: ${res25.recommendations.length}개`);
res25.recommendations.forEach((rec, idx) => {
  console.log(`  [${idx + 1}위] ${rec.items.map(i => `${i.name}(아이템수: ${rec.items.length})`).join(' + ')} | 점수: ${rec.score}`);
});
const allSingleInner = res25.recommendations.every(rec => rec.items.length === 1 && rec.items[0].thickness === '얇음');
console.log(`- 25°C 이너 단독 및 얇음 두께 만족 여부 -> ${allSingleInner ? '✅ 통과' : '❌ 실패'}`);

// 완료 기준 5: 조건에 맞는 옷 부족 시 누락 카테고리 알림
console.log('\n[테스트 5] 옷 부족 시 누락 안내 문구 검증:');
const noOuterPool = sampleClothes.filter(c => c.category !== '아우터');
const resNoOuter = recommendOutfits(noOuterPool, 10); // 10°C는 아우터 필수
console.log(`- 10°C에서 아우터 없을 때 누락 카테고리:`, resNoOuter.missingCategories);
const hasOuterAlert = resNoOuter.missingCategories.includes('아우터');
console.log(`- 기준 5: 아우터 부족 안내 여부 -> ${hasOuterAlert ? '✅ 통과' : '❌ 실패'}`);
