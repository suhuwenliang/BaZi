/**
 * Comprehensive Yong Shen Test Suite for bazi.js
 * Tests all 120 DM × month combinations plus logic invariants
 */
'use strict';

const { calculateBazi } = require('./engines/bazi.js');

// ============================================================
// CLASSICAL REFERENCE TABLE (from 穷通宝鉴 / 三命通会)
// Primary Yong Shen for each DM in each month.
// This is the "ground truth" from classical BaZi masters.
// Format: [DM, month, expectedYS, note]
// ============================================================
const CLASSICAL_REFERENCE = [
  // 癸水 (Yin Water)
  ['癸','巳','金','夏热水干，庚辛金生水源最急'],
  ['癸','午','金','火旺水弱，庚辛金生水最急'],
  ['癸','未','金','燥极，庚辛金生水，润枯救急'],
  ['癸','子','火','丙火调候解寒，辛金滋水源'],
  ['癸','丑','火','丙火暖局，辛金生水'],
  ['癸','亥','金','庚金生水，丙丁暖局'],

  // 壬水 (Yang Water)
  ['壬','巳','金','庚金生水源，再取壬水助力'],
  ['壬','午','金','庚金生水，癸水助壬'],
  ['壬','未','金','辛金生水，甲木疏土'],
  ['壬','子','金','水旺须戊土堤防，庚金为水源'],
  ['壬','亥','土','水旺泛滥，戊土堤防最急'],

  // 甲木 (Yang Wood)
  ['甲','巳','水','夏木易燥，癸水滋润，庚金生水'],
  ['甲','午','水','烈日炎炎，癸水解渴最急'],
  ['甲','未','水','三伏热极，癸水庚金并用'],
  ['甲','子','火','丙火暖局，癸水滋木'],
  ['甲','亥','火','冬水泛滥，丙火暖局为急'],

  // 乙木 (Yin Wood)
  ['乙','巳','水','夏火炎，癸水浇灌为急'],
  ['乙','午','水','乙木被灼，癸水为命'],
  ['乙','未','水','燥土焦木，癸水润之'],
  ['乙','子','火','隆冬寒极，丙火暖局最急'],
  ['乙','亥','火','冬木最需丙火照暖'],

  // 丙火 (Yang Fire) - 调候 for balanced/strong DM
  ['丙','子','水','壬水为财，戊土制水护火'],  // applies for balanced/strong
  ['丙','亥','木','冬水旺，甲木化水生火'],     // for balanced/strong DM

  // 丁火 (Yin Fire)
  ['丁','午','水','火极，壬水调候为要'],
  ['丁','子','木','甲木引火，庚金劈木点燃'],

  // 戊土 (Yang Earth)
  ['戊','午','水','燥热，壬水润土，甲木疏松'],
  ['戊','巳','木','土燥，甲木疏松，壬水润之'],

  // 己土 (Yin Earth)
  ['己','午','水','热极，癸水最为急需'],
  ['己','巳','水','燥热，癸水润己土'],

  // 庚金 (Yang Metal)
  ['庚','午','水','热极，壬水癸水调候'],
  ['庚','巳','水','火旺，壬水解热，戊土护根'],

  // 辛金 (Yin Metal)
  ['辛','午','水','火旺，壬水为急，庚金辅助'],
  ['辛','巳','水','夏热，壬癸水调候解热'],
];

// ============================================================
// MATHEMATICAL INVARIANTS — pure logic checks (no chart data)
// ============================================================
const ELEMENT_PRODUCES  = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
const ELEMENT_CONTROLS  = {'木':'土','火':'金','土':'水','金':'木','水':'火'};
const ELEMENT_FEEDS     = {'木':'水','火':'木','土':'火','金':'土','水':'金'};
// 官 = what controls DM
function getGuan(dmEl) {
  return Object.entries(ELEMENT_CONTROLS).find(([k,v])=>v===dmEl)?.[0] || null;
}

const STEMS   = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const STEM_EL = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const EXTREME_MONTHS = new Set(['巳','午','未','子','丑','亥']);

let passed = 0, failed = 0, warnings = 0;
const failures = [];
const warns = [];

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; failures.push('FAIL: '+msg); }
}
function warn(condition, msg) {
  if (!condition) { warnings++; warns.push('WARN: '+msg); }
}

// ============================================================
// TEST BLOCK 1: Mathematical invariants
// ============================================================
console.log('\n── Test Block 1: Mathematical Invariants ──');

for (const dm of STEMS) {
  const dmEl = STEM_EL[dm];
  // A: Strong DM → yongShen = what DM produces (食伤)
  const strongYS = ELEMENT_PRODUCES[dmEl];
  assert(strongYS, `Strong DM ${dm}(${dmEl}): ELEMENT_PRODUCES is defined`);

  // B: Balanced DM → yongShen = 官 (what controls DM), NOT what DM controls
  const guanEl   = getGuan(dmEl);          // correct: what controls DM
  const wrongEl  = ELEMENT_CONTROLS[dmEl]; // wrong: what DM controls
  assert(guanEl !== wrongEl, `Balanced DM ${dm}(${dmEl}): 官 ${guanEl} ≠ 财 ${wrongEl} (distinct)`);
  assert(ELEMENT_CONTROLS[guanEl] === dmEl, `Balanced DM ${dm}(${dmEl}): ELEMENT_CONTROLS[${guanEl}]=${ELEMENT_CONTROLS[guanEl]} === dmEl ${dmEl}`);

  // C: Weak DM → yongShen = 印 (what feeds DM)
  const inEl = ELEMENT_FEEDS[dmEl];
  assert(ELEMENT_PRODUCES[inEl] === dmEl, `Weak DM ${dm}(${dmEl}): 印 ${inEl} generates DM element ${dmEl}`);

  // D: Six-god consistency — jiShen should attack yongShen
  for (const yongEl of ['木','火','土','金','水']) {
    const jiShen = getGuan(yongEl);  // what controls yongShen
    assert(jiShen && ELEMENT_CONTROLS[jiShen] === yongEl,
      `jiShen for yongShen=${yongEl}: ${jiShen} should control ${yongEl}`);
  }
}
console.log(`  Math invariants: ${passed} passed, ${failed} failed`);

// ============================================================
// HELPER: Find a date with given DM stem in a given month branch
// Scans years 1960-2000 to find a matching chart
// ============================================================
const dateCache = {};

function findDate(targetDM, targetMonthZhi) {
  const key = `${targetDM}|${targetMonthZhi}`;
  if (dateCache[key]) return dateCache[key];

  // Map month branch to approximate calendar months
  const MONTH_ZHI_MONTHS = {
    '子': [12,1], '丑': [1,2], '寅': [2,3], '卯': [3,4], '辰': [4,5],
    '巳': [5,6], '午': [6,7], '未': [7,8], '申': [8,9], '酉': [9,10],
    '戌': [10,11], '亥': [11,12]
  };
  const calMonths = MONTH_ZHI_MONTHS[targetMonthZhi] || [1,2,3,4,5,6,7,8,9,10,11,12];

  for (let year = 1960; year <= 2000; year++) {
    for (const month of calMonths) {
      for (const day of [10, 12, 14, 16, 18, 20, 22, 24]) {
        try {
          const r = calculateBazi({
            birthYear:year, birthMonth:month, birthDay:day,
            birthHour:10, birthMinute:0, gender:'M', zone:7, longitude:107
          });
          if (r.dayMaster?.stem === targetDM && r.pillars?.month?.zhi === targetMonthZhi) {
            dateCache[key] = {year, month, day, result: r};
            return dateCache[key];
          }
        } catch(e) {}
      }
    }
  }
  return null;
}

// ============================================================
// TEST BLOCK 2: Classical reference spot-checks
// ============================================================
console.log('\n── Test Block 2: Classical Reference Spot-checks ──');
let blk2pass = 0, blk2fail = 0;

for (const [dm, monthZhi, expectedYS, note] of CLASSICAL_REFERENCE) {
  const found = findDate(dm, monthZhi);
  if (!found) {
    warns.push(`WARN: No chart found for DM=${dm} month=${monthZhi}`);
    warnings++;
    continue;
  }
  const r = found.result;
  const isDMWeak = r.wuXing?.isDMWeak;
  const isDMStrong = r.wuXing?.isDMStrong;
  const isDMBalanced = r.wuXing?.isDMBalanced;
  const actualYS = r.wuXing?.yongShen;
  const tiaoHouEl = r.wuXing?.tiaoHouYS?.element;

  // For DM-strength-neutral classical refs (pure 调候 cases, e.g. summer water)
  // expectedYS should match actualYS OR match tiaoHouYS.element (informative)
  const ok = (actualYS === expectedYS);
  if (ok) { passed++; blk2pass++; }
  else {
    // Some references may only apply for specific DM strength — classify as warning if close
    const tiaoMatchesExpected = (tiaoHouEl === expectedYS);
    if (tiaoMatchesExpected && isDMWeak) {
      // 调候 matches but not applied (weak DM + controller check)
      warns.push(`WARN [acceptable]: DM=${dm} month=${monthZhi} actualYS=${actualYS}(weak safety) expected=${expectedYS} note: ${note}`);
      warnings++;
    } else {
      failed++; blk2fail++;
      failures.push(`FAIL: DM=${dm} month=${monthZhi} got=${actualYS} expected=${expectedYS} isDMWeak=${isDMWeak} tiaoHou=${tiaoHouEl} — ${note}`);
    }
  }
}
console.log(`  Classical refs: ${blk2pass} passed, ${blk2fail} failed (out of ${CLASSICAL_REFERENCE.length})`);

// ============================================================
// TEST BLOCK 3: All 120 DM × month — structural invariants
// ============================================================
console.log('\n── Test Block 3: All 120 DM × Month — Structural Invariants ──');
let blk3pass = 0, blk3fail = 0, blk3skip = 0;

for (const dm of STEMS) {
  for (const monthZhi of BRANCHES) {
    const found = findDate(dm, monthZhi);
    if (!found) { blk3skip++; continue; }
    const r = found.result;
    const w = r.wuXing;

    // 3a: yongShen (final) is never null/undefined
    assert(w?.yongShen, `DM=${dm} month=${monthZhi}: yongShen not null`);
    if (!w?.yongShen) { blk3fail++; continue; }

    // 3b: yongShen is one of the 5 valid elements
    const VALID_EL = new Set(['木','火','土','金','水']);
    assert(VALID_EL.has(w.yongShen),
      `DM=${dm} month=${monthZhi}: yongShen='${w.yongShen}' is valid element`);

    // 3c: sixGods all defined
    const sg = w.sixGods;
    assert(sg?.jiShen,   `DM=${dm} month=${monthZhi}: sixGods.jiShen defined`);
    assert(sg?.chouShen, `DM=${dm} month=${monthZhi}: sixGods.chouShen defined`);
    assert(sg?.xiShen,   `DM=${dm} month=${monthZhi}: sixGods.xiShen defined`);

    // 3d: jiShen = what controls yongShen
    if (sg?.jiShen && w.yongShen) {
      assert(ELEMENT_CONTROLS[sg.jiShen] === w.yongShen,
        `DM=${dm} month=${monthZhi}: jiShen(${sg.jiShen}) controls yongShen(${w.yongShen}). ELEMENT_CONTROLS[${sg.jiShen}]=${ELEMENT_CONTROLS[sg.jiShen]}`);
    }

    // 3e: For extreme months, yongShenFinal should match tiaoHouYS.element
    //     UNLESS DM is weak AND tiaoHouYS controls DM (safety check)
    if (EXTREME_MONTHS.has(monthZhi) && w.tiaoHouYS?.element) {
      const dmEl = STEM_EL[dm];
      const tiaoControlsDM = (ELEMENT_CONTROLS[w.tiaoHouYS.element] === dmEl);
      const safetyApplied = tiaoControlsDM && w.isDMWeak;
      const specialGeActive = !!(w.geJu?.specialGe); // specialGe overrides 调候 → skip check

      if (specialGeActive) {
        // specialGe (从格/专旺格) correctly overrides everything — verify specialGe.yongShen is used
        assert(w.yongShen === w.geJu.specialGe.yongShen,
          `DM=${dm} month=${monthZhi}: specialGe active, yongShen(${w.yongShen}) == specialGe.yongShen(${w.geJu.specialGe.yongShen})`);
        blk3pass++;
      } else if (!safetyApplied) {
        assert(w.yongShen === w.tiaoHouYS.element,
          `DM=${dm} month=${monthZhi}(extreme): yongShenFinal(${w.yongShen}) == tiaoHouYS(${w.tiaoHouYS.element})`);
        if (w.yongShen !== w.tiaoHouYS.element) blk3fail++;
        else blk3pass++;
      } else {
        // Safety check triggered — yongShen should be base formula result
        const expectedBase = ELEMENT_FEEDS[dmEl];
        assert(w.yongShen === expectedBase,
          `DM=${dm} month=${monthZhi}: safety-check active, yongShen(${w.yongShen}) == 印(${expectedBase})`);
        if (w.yongShen !== expectedBase) blk3fail++; else blk3pass++;
      }
    }

    // 3f: Non-extreme months — should use DM-strength formula (no 调候 override)
    if (!EXTREME_MONTHS.has(monthZhi)) {
      const dmEl = STEM_EL[dm];
      let expectedBase;
      if (w.isDMStrong)    expectedBase = ELEMENT_PRODUCES[dmEl];
      else if (w.isDMBalanced) expectedBase = getGuan(dmEl);
      else                 expectedBase = ELEMENT_FEEDS[dmEl];
      // Allow specialGe override
      const hasSpecialGe = r.wuXing?.geJu?.specialGe;
      if (!hasSpecialGe) {
        assert(w.yongShen === expectedBase,
          `DM=${dm} month=${monthZhi}(moderate): yongShen(${w.yongShen}) == formula(${expectedBase}) [strong=${w.isDMStrong} balanced=${w.isDMBalanced} weak=${w.isDMWeak}]`);
        if (w.yongShen !== expectedBase) blk3fail++; else blk3pass++;
      }
    }
  }
}
console.log(`  Structural (120 combos): pass contribution counted in totals, skip=${blk3skip}`);

// ============================================================
// TEST BLOCK 4: Downstream consistency
// (interpretation, wealth, exportPrompt use yongShenFinal)
// ============================================================
console.log('\n── Test Block 4: Downstream Text Consistency ──');

// Use 癸水 + 巳月 as the reference case (our main bug chart)
const refCase = findDate('癸', '巳');
if (refCase) {
  const r = refCase.result;
  const correctYS = r.wuXing?.yongShen; // should be 金

  // Check interpretation text contains correct yongShen
  const interpText = r.interpretation?.wuXing || '';
  const wealthText = JSON.stringify(r.wealthProfiling?.wealthAnalysis || '');
  const exportText = r.exportPrompt || '';

  assert(correctYS === '金',
    `癸巳月 yongShenFinal=金 (${correctYS})`);

  // interpretation.wuXing should mention 金/Logam not 火/Api as Yong Shen
  const hasGold = interpText.includes('金') || interpText.includes('Logam');
  const hasFire = interpText.match(/Yong Shen.{0,30}Api/) || interpText.match(/用神.{0,10}火/);
  assert(hasGold && !hasFire,
    `Interpretation text uses 金 (Logam) as Yong Shen, not 火 (Api). interpText contains金=${hasGold} hasFire=${hasFire}`);

  // exportPrompt should mention Yong Shen as 金 (actual format: "Yong Shen (用神): 金")
  const exportHasGold = exportText.includes('金') && exportText.includes('用神');
  assert(exportHasGold,
    `exportPrompt mentions Yong Shen 金. snippet: "${exportText.substring(Math.max(0,exportText.indexOf('用神')-5), exportText.indexOf('用神')+25)}"`);

  // Da Yun quality evaluation: a 庚 or 辛 Da Yun should score positively for 金 YS
  const daYunPeriods = r.daYun?.periods || [];
  const jinDaYun = daYunPeriods.find(dy => ['庚','辛'].includes(dy.gan));
  if (jinDaYun) {
    assert((jinDaYun.quality?.score || 0) > 0,
      `DaYun with 庚/辛 gan should score positively for 金 YS. Score=${jinDaYun.quality?.score}`);
  } else {
    warn(false, `No 庚/辛 DaYun period found to validate quality scoring`);
  }
}

// ============================================================
// RESULTS SUMMARY
// ============================================================
console.log('\n══════════════════════════════════════════');
console.log(`TOTAL RESULTS:`);
console.log(`  ✅ PASSED: ${passed}`);
console.log(`  ❌ FAILED: ${failed}`);
console.log(`  ⚠️  WARNS:  ${warnings}`);
console.log('══════════════════════════════════════════');

if (failures.length > 0) {
  console.log('\nFAILURES:');
  failures.forEach(f => console.log('  '+f));
}
if (warns.length > 0) {
  console.log('\nWARNINGS:');
  warns.forEach(w => console.log('  '+w));
}

process.exit(failed > 0 ? 1 : 0);
