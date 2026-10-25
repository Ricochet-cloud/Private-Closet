import { recommendOutfits, getOutfitKeyFromIds } from './js/recommend.js';
import { getSingleMoodScore } from './js/moodMatrix.js';
import { getKstDateString, diffDays, formatLogDate } from './js/dateUtil.js';

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


// ==================================================
// 3단계: 착용 기록 반영 (반복 방지 · 최근 착용 감점 · 입음 표시 · 한국 시간)
// ==================================================
console.log('\n==================================================');
console.log('🧪 3단계 착용 기록 완료 기준 검증 테스트');
console.log('==================================================');

let step3Failed = 0;
function check(label, ok) {
  if (!ok) step3Failed += 1;
  console.log(`- ${label} -> ${ok ? '✅ 통과' : '❌ 실패'}`);
}

// 현재 카테고리 설정(니트/스웻/셔츠)에 맞춰 샘플의 '맨투맨'을 '스웻'으로 바꿔 사용
const clothes3 = sampleClothes.map(c => (c.category === '맨투맨' ? { ...c, category: '스웻' } : c));
const TEMP3 = 14;
const TODAY = new Date('2026-10-25T10:00:00+09:00'); // 한국 시간 2026-10-25

// "다시 추천"을 끝까지 눌러 가능한 모든 코디를 모은다
function collectAll(logs) {
  const shown = [];
  const all = [];
  for (let guard = 0; guard < 50; guard++) {
    const r = recommendOutfits(clothes3, TEMP3, TODAY, logs, shown);
    if (r.recommendations.length === 0) break;
    r.recommendations.forEach(o => { shown.push(o.key); all.push(o); });
  }
  return all;
}

console.log('\n[테스트 6] 한국 시간 기준 날짜 (자정 전후):');
check('UTC 14:59:59 (KST 23:59:59) -> 2026-10-24', getKstDateString(new Date('2026-10-24T14:59:59Z')) === '2026-10-24');
check('UTC 15:00:00 (KST 00:00:00) -> 2026-10-25', getKstDateString(new Date('2026-10-24T15:00:00Z')) === '2026-10-25');
check('KST 23:59:59 -> 같은 날', getKstDateString(new Date('2026-10-24T23:59:59+09:00')) === '2026-10-24');
check('KST 00:00:01 -> 다음 날', getKstDateString(new Date('2026-10-25T00:00:01+09:00')) === '2026-10-25');
check('월말 경계 (KST 11/01 00:30 -> 2026-11-01)', getKstDateString(new Date('2026-10-31T15:30:00Z')) === '2026-11-01');
check('diffDays 월 경계 (11/01 - 10/31 = 1)', diffDays('2026-11-01', '2026-10-31') === 1);
check('표시 형식 2026.10.25 (일)', formatLogDate('2026-10-25') === '2026.10.25 (일)');

const baseline = collectAll([]);
const baseByKey = new Map(baseline.map(o => [o.key, o]));
console.log(`\n[기준] 기록 없이 가능한 코디: ${baseline.length}개`);
check('기준 코디가 2개 이상 있다 (이후 테스트 전제)', baseline.length >= 2);

const target = baseline[0];
const targetIds = target.items.map(i => i.id);
const targetNames = target.items.map(i => i.name).join(' + ');
console.log(`  제외 테스트 대상 코디: ${targetNames}`);

console.log('\n[테스트 7] 반복 방지: 어제~4일 전 같은 구성 제외 (오늘 제외):');
for (const [daysAgo, expectExcluded] of [[1, true], [4, true], [5, false]]) {
  const d = new Date(TODAY.getTime() - daysAgo * 86400000);
  const logs = [{ wearDate: getKstDateString(d), itemIds: [...targetIds].reverse() }]; // 순서가 달라도 같은 구성
  const keys = collectAll(logs).map(o => o.key);
  check(`${daysAgo}일 전에 입은 코디가 추천에서 ${expectExcluded ? '빠짐' : '다시 나옴'}`, keys.includes(target.key) !== expectExcluded);
}
{
  const logs = [{ wearDate: '2026-10-25', itemIds: targetIds }];
  const all = collectAll(logs);
  const found = all.find(o => o.key === target.key);
  check('오늘 입은 코디는 제외되지 않고 wornToday: true 로 표시됨', Boolean(found) && found.wornToday === true);
  check('오늘 입은 코디만 wornToday 이고 나머지는 false', all.filter(o => o.wornToday).length === 1);
  check('오늘 입은 옷은 감점 대상이 아님 (점수 변화 없음)', found && found.score === target.score && found.penalty === 0);
}
{
  const logs = [{ wearDate: '2026-10-26', itemIds: targetIds }]; // 미래 날짜는 무시
  check('미래 날짜 기록은 무시됨', collectAll(logs).some(o => o.key === target.key));
}

console.log('\n[테스트 8] 최근 착용 감점: 최근 기간에 입은 옷 1벌당 0.25점:');
{
  const logs = [{ wearDate: '2026-10-24', itemIds: targetIds }];
  const after = collectAll(logs);
  let allMatch = true;
  let penalized = 0;
  for (const o of after) {
    const base = baseByKey.get(o.key);
    const recentCount = o.items.filter(i => targetIds.includes(i.id)).length;
    const expected = Math.round((base.score - recentCount * 0.25) * 100) / 100;
    if (o.score !== expected) allMatch = false;
    if (recentCount > 0) penalized += 1;
  }
  check(`어제 입은 옷이 들어 있는 코디 ${penalized}개가 옷 1벌당 0.25점씩 낮아짐`, allMatch && penalized > 0);
}
{
  // 직접 기록으로 3벌을 입은 날: 그 3벌 중 2벌이 들어간 코디는 0.5점 감점, 구성이 달라 제외되지는 않음
  const outer = clothes3.find(c => c.id === 'o1');
  const inner = clothes3.find(c => c.id === 'i2');
  const extra = clothes3.find(c => c.id === 'i7');
  const logs = [{ wearDate: '2026-10-24', itemIds: [outer.id, inner.id, extra.id] }];
  const after = collectAll(logs);
  const pair = after.find(o => o.key === getOutfitKeyFromIds([outer.id, inner.id]));
  const basePair = baseByKey.get(getOutfitKeyFromIds([outer.id, inner.id]));
  check('직접 기록한 3벌 중 2벌이 든 코디는 제외되지 않고 0.5점 감점', Boolean(pair) && Boolean(basePair) && pair.score === Math.round((basePair.score - 0.5) * 100) / 100);
}

console.log('\n[테스트 9] 오늘 기록이 있어도 감점 규칙 영향 없음 / 기록 필드 방어:');
{
  const logs = [null, {}, { wearDate: '2026-10-24' }, { wearDate: '2026-10-24', itemIds: [] }];
  const after = collectAll(logs);
  check('깨진 기록 항목이 섞여 있어도 기준과 같은 결과', after.length === baseline.length);
}

if (step3Failed > 0) {
  console.log(`\n❌ 3단계 테스트 ${step3Failed}건 실패`);
  process.exitCode = 1;
} else {
  console.log('\n✅ 3단계 테스트 전부 통과');
}
