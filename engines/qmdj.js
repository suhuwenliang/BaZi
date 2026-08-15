'use strict';

/**
 * Qi Men Dun Jia (奇门遁甲) Engine
 * Plain JavaScript port of bigfishmarquis-qimen (MIT)
 * Supports: 年家 (Nianjia), 日家 (Rijia), 时家 (Shijia)
 */

const { Solar } = require('lunar-javascript');

// ═══════════════════════════════════════════════════
//  A. CONSTANTS
// ═══════════════════════════════════════════════════

const STEMS     = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES  = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// 三奇六仪 fixed sequence
const SAN_QI_LIU_YI = ['戊','己','庚','辛','壬','癸','丁','丙','乙'];

// 洛书顺时针 (Yang traversal, skip center 5)
const YANG_ORDER = [1, 8, 3, 4, 9, 2, 7, 6];
const YIN_ORDER  = [1, 6, 7, 2, 9, 4, 3, 8];

// 洛书顺时针 (used in shijia, starting from 2)
const PALACE_CLOCKWISE = [2, 7, 6, 1, 8, 3, 4, 9];
const PALACE_COUNTER_CLOCKWISE = [2, 9, 4, 3, 8, 1, 6, 7];

const PALACE_NAMES = { 1:'坎', 2:'坤', 3:'震', 4:'巽', 5:'中', 6:'乾', 7:'兑', 8:'艮', 9:'离' };
const PALACE_ELEMENTS = { 1:'水', 2:'土', 3:'木', 4:'木', 5:'土', 6:'金', 7:'金', 8:'土', 9:'火' };

const NINE_STARS = ['天蓬','天芮','天冲','天辅','天禽','天心','天柱','天任','天英'];
const STAR_HOME  = { '天蓬':1,'天芮':2,'天冲':3,'天辅':4,'天禽':5,'天心':6,'天柱':7,'天任':8,'天英':9 };
const STAR_ELEM  = { '天蓬':'水','天芮':'土','天冲':'木','天辅':'木','天禽':'土','天心':'金','天柱':'金','天任':'土','天英':'火' };

// 九星转盘序 (8-element, excludes 天禽)
const STAR_TRAVERSE = ['天蓬','天任','天冲','天辅','天英','天芮','天柱','天心'];
// Shijia uses different start: ['天心','天蓬','天任','天冲','天辅','天英','天芮','天柱']
const STAR_SEQ_SHIJIA = ['天心','天蓬','天任','天冲','天辅','天英','天芮','天柱'];

const EIGHT_DOORS = ['休门','死门','伤门','杜门','景门','开门','惊门','生门'];
const DOOR_HOME  = { '休门':1,'死门':2,'伤门':3,'杜门':4,'景门':9,'开门':6,'惊门':7,'生门':8 };
const DOOR_ELEM  = { '休门':'水','死门':'土','伤门':'木','杜门':'木','景门':'火','开门':'金','惊门':'金','生门':'土' };
const DOOR_ORDER = ['休门','生门','伤门','杜门','景门','死门','惊门','开门'];

const EIGHT_GODS = ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天'];
const GOD_SHORT  = { '值符':'符','螣蛇':'蛇','腾蛇':'蛇','太阴':'阴','六合':'合','白虎':'虎','玄武':'玄','九地':'地','九天':'天' };

const STEM_ELEM  = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
const GRAVE_MAP  = { '火':[6],'水':[4],'金':[8],'木':[2],'土':[4] };
const STEM_GRAVE = { '甲':2,'乙':6,'丙':6,'丁':8,'戊':6,'己':8,'庚':8,'辛':4,'壬':4,'癸':2 };

const BRANCH_TO_PALACE = { '子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6 };
const PALACE_BRANCHES  = { 1:['子'],2:['未','申'],3:['卯'],4:['辰','巳'],5:[],6:['戌','亥'],7:['酉'],8:['丑','寅'],9:['午'] };

const XUN_SHOU_TABLE = [
  { xunShou:'甲子', liuYi:'戊', palace:1, zhiFuStar:'天蓬', zhiShiDoor:'休门' },
  { xunShou:'甲戌', liuYi:'己', palace:2, zhiFuStar:'天芮', zhiShiDoor:'死门' },
  { xunShou:'甲申', liuYi:'庚', palace:3, zhiFuStar:'天冲', zhiShiDoor:'伤门' },
  { xunShou:'甲午', liuYi:'辛', palace:4, zhiFuStar:'天辅', zhiShiDoor:'杜门' },
  { xunShou:'甲辰', liuYi:'壬', palace:5, zhiFuStar:'天禽', zhiShiDoor:'死门' },
  { xunShou:'甲寅', liuYi:'癸', palace:6, zhiFuStar:'天心', zhiShiDoor:'开门' },
];

// 六甲旬首→遁干 (for shijia)
const LIUJIA_XUN = {
  '甲子':'戊','甲戌':'己','甲申':'庚','甲午':'辛','甲辰':'壬','甲寅':'癸'
};

const PALACE_ORIGINAL_STAR = { 1:'天蓬',2:'天芮',3:'天冲',4:'天辅',5:'天禽',6:'天心',7:'天柱',8:'天任',9:'天英' };

const YI_MA_MAP = {
  '申':'寅','子':'寅','辰':'寅', '巳':'亥','酉':'亥','丑':'亥',
  '寅':'申','午':'申','戌':'申', '亥':'巳','卯':'巳','未':'巳'
};

// Jiazi anchor: 2000-01-07 = 甲子日
const JIAZI_ANCHOR = new Date(2000, 0, 7);

// ═══════════════════════════════════════════════════
//  B. SHARED UTILITIES
// ═══════════════════════════════════════════════════

function wxRestricts(a, b) {
  const table = { '金':'木','木':'土','土':'水','水':'火','火':'金' };
  return table[a] === b;
}

function gzIndex(stem, branch) {
  const si = STEMS.indexOf(stem);
  const bi = BRANCHES.indexOf(branch);
  if (si === -1 || bi === -1) return -1;
  for (let n = 0; n < 60; n++) {
    if (n % 10 === si && n % 12 === bi) return n;
  }
  return -1;
}

function dayGzIdx(y, m, d) {
  const target = new Date(y, m - 1, d);
  const diff = Math.round((target.getTime() - JIAZI_ANCHOR.getTime()) / 86400000);
  return ((diff % 60) + 60) % 60;
}

function getDayGanZhi(y, m, d) {
  const idx = dayGzIdx(y, m, d);
  return { stem: STEMS[idx % 10], branch: BRANCHES[idx % 12], gzIdx: idx };
}

function findXunShou(stem, branch) {
  const idx = gzIndex(stem, branch);
  if (idx === -1) return XUN_SHOU_TABLE[0];
  return XUN_SHOU_TABLE[Math.floor(idx / 10)];
}

function getXunShouStr(ganzhi) {
  // ganzhi = e.g. '己未'
  const stem = ganzhi[0], branch = ganzhi[1];
  const idx = gzIndex(stem, branch);
  if (idx < 0) return '甲子';
  const xunIdx = Math.floor(idx / 10) * 10;
  return STEMS[xunIdx % 10] + BRANCHES[xunIdx % 12];
}

function getKongWang(stem, branch) {
  const si = STEMS.indexOf(stem);
  const bi = BRANCHES.indexOf(branch);
  if (si === -1 || bi === -1) return [];
  const xunStart = (bi - si + 12) % 12;
  return [BRANCHES[(xunStart + 10) % 12], BRANCHES[(xunStart + 11) % 12]];
}

// Layout earth plate: 三奇六仪 onto 9 palaces
function layoutEarthPlate(juNumber, dun) {
  const plate = new Map();
  const step = dun === 'yang' ? 1 : -1;
  let palace = juNumber;
  for (let i = 0; i < 9; i++) {
    plate.set(palace, SAN_QI_LIU_YI[i]);
    palace += step;
    if (palace > 9) palace = 1;
    if (palace < 1) palace = 9;
  }
  return plate;
}

// Layout earth plate for shijia (slightly different implementation)
function arrangeDiPan(juShu, isYang) {
  const result = new Map();
  if (isYang) {
    SAN_QI_LIU_YI.forEach((stem, i) => {
      const pos = ((juShu - 1 + i) % 9) + 1;
      result.set(pos, stem);
    });
  } else {
    SAN_QI_LIU_YI.forEach((stem, i) => {
      let pos = juShu - i;
      while (pos < 1) pos += 9;
      result.set(pos, stem);
    });
  }
  return result;
}

function findStemOnEarth(plate, stem) {
  for (const [palace, s] of plate.entries()) {
    if (s === stem) return palace;
  }
  return 1;
}

function resolveZhiFuShi(stem, branch, earthPlate) {
  const xun = findXunShou(stem, branch);
  const liuYi = xun.liuYi;
  const liuYiPalace = findStemOnEarth(earthPlate, liuYi);
  const effectivePalace = liuYiPalace === 5 ? 2 : liuYiPalace;
  const zhiFuStar = PALACE_ORIGINAL_STAR[effectivePalace] || '天蓬';
  const zhiShiDoor = DOOR_HOME[Object.keys(DOOR_HOME).find(k => DOOR_HOME[k] === effectivePalace)] || '休门';
  // Lookup door by palace:
  const doorByPalace = {};
  Object.keys(DOOR_HOME).forEach(d => { doorByPalace[DOOR_HOME[d]] = d; });
  const zhiShiDoorActual = doorByPalace[effectivePalace] || '死门';
  return { zhiFuStar, zhiShiDoor: zhiShiDoorActual, liuYiPalace, liuYi };
}

function getTraversalOrder(dun) { return dun === 'yang' ? YANG_ORDER : YIN_ORDER; }

function traverse(startPalace, steps, dun) {
  const order = getTraversalOrder(dun);
  const start = startPalace === 5 ? 2 : startPalace;
  const startIdx = order.indexOf(start);
  if (startIdx === -1) return start;
  return order[(startIdx + steps) % order.length];
}

// Layout sky stars: 值符星飞到目标干在地盘的宫位
function layoutSkyStars(zhiFuStar, flyStem, earthPlate) {
  const skyStars = new Map();
  const targetPalace = findStemOnEarth(earthPlate, flyStem);
  const finalTarget = targetPalace === 5 ? 2 : targetPalace;

  skyStars.set(finalTarget, zhiFuStar);

  const zhiFuIdx = STAR_TRAVERSE.indexOf(zhiFuStar);
  if (zhiFuIdx === -1) { skyStars.set(2, zhiFuStar); return skyStars; }

  const startIdx = YANG_ORDER.indexOf(finalTarget);
  for (let i = 1; i < 8; i++) {
    const starIdx = (zhiFuIdx + i) % STAR_TRAVERSE.length;
    const star = STAR_TRAVERSE[starIdx];
    const palaceIdx = (startIdx + i) % YANG_ORDER.length;
    const palace = YANG_ORDER[palaceIdx];
    if (star === '天禽') continue; // 天禽寄坤
    skyStars.set(palace, star);
  }
  // 天禽寄: always follow 天芮
  return skyStars;
}

// Layout doors: 值使门飞到目标落宫
function layoutDoorsFromPalace(zhiShiDoor, targetPalace, dun) {
  const doors = new Map();
  const finalTarget = targetPalace === 5 ? 2 : targetPalace;
  const zhiShiIdx = DOOR_ORDER.indexOf(zhiShiDoor);
  const order = getTraversalOrder(dun);
  const startIdx = order.indexOf(finalTarget);
  for (let i = 0; i < 8; i++) {
    const doorIdx = (zhiShiIdx + i) % 8;
    const palaceIdx = (startIdx + i) % order.length;
    doors.set(order[palaceIdx], DOOR_ORDER[doorIdx]);
  }
  return doors;
}

// Layout gods: 值符神落值符星宫
function layoutGods(zhiFuPalace, dun) {
  const gods = new Map();
  const palace = zhiFuPalace === 5 ? 2 : zhiFuPalace;
  const godOrder = dun === 'yang'
    ? ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天']
    : ['值符','九天','九地','玄武','白虎','六合','太阴','螣蛇'];
  const order = getTraversalOrder(dun);
  const startIdx = order.indexOf(palace);
  for (let i = 0; i < 8; i++) {
    gods.set(order[(startIdx + i) % order.length], godOrder[i]);
  }
  return gods;
}

// Layout 地八神
function layoutDiGods(earthPlate, xunYi, dun) {
  const diGods = new Map();
  const DI_RING = [6, 1, 8, 3, 4, 9, 2, 7];
  const DI_GOD_YANG = ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天'];
  const DI_GOD_YIN  = ['值符','九天','九地','玄武','白虎','六合','太阴','螣蛇'];
  const godSeq = dun === 'yang' ? DI_GOD_YANG : DI_GOD_YIN;
  let startPalace = findStemOnEarth(earthPlate, xunYi);
  if (startPalace === 5) startPalace = 2;
  const startIdx = DI_RING.indexOf(startPalace);
  if (startIdx === -1) return diGods;
  for (let i = 0; i < 8; i++) {
    diGods.set(DI_RING[(startIdx + i) % 8], godSeq[i]);
  }
  return diGods;
}

function getSkyPlateStem(skyStars, earthPlate, palaceNum) {
  const star = skyStars.get(palaceNum);
  if (!star) return earthPlate.get(palaceNum) || '';
  const home = STAR_HOME[star];
  if (!home) return earthPlate.get(palaceNum) || '';
  const homePalace = (home === 5 && earthPlate.has(5)) ? 5 : (home === 5 ? 2 : home);
  return earthPlate.get(homePalace) || '';
}

function assemblePalaces(earthPlate, skyStars, doors, gods, kongWang, diGods, customHiddenStems) {
  const LIU_YI_TO_JIA = { '戊':'甲子','己':'甲戌','庚':'甲申','辛':'甲午','壬':'甲辰','癸':'甲寅' };
  const palaces = [];

  // Find 天芮 location for 寄宫
  let jiGongTarget = 0;
  for (const [p, s] of skyStars.entries()) {
    if (s === '天芮' && p !== 5) { jiGongTarget = p; break; }
  }
  const jiGanStemVal = earthPlate.get(5) || '';

  for (let num = 1; num <= 9; num++) {
    const eStem = earthPlate.get(num) || ''; // 地盘干
    const tStem = num !== 5 ? getSkyPlateStem(skyStars, earthPlate, num) : (earthPlate.get(5) || earthPlate.get(2) || ''); // 天盘干
    const star  = skyStars.get(num) || (num === 5 ? '天禽' : '');
    const door  = doors.get(num) || '';
    const god   = gods.get(num) || '';

    // ⚠️ Historical naming reversal: earthStem field = 天盘干, skyStem field = 地盘干
    const earthStemField = tStem; // 天盘干 (displayed upper)
    const skyStemField   = eStem; // 地盘干 (displayed lower)

    // Hidden stems
    let hiddenStems;
    if (customHiddenStems && customHiddenStems.has(num)) {
      hiddenStems = customHiddenStems.get(num);
    } else {
      hiddenStems = [];
      const jia = LIU_YI_TO_JIA[eStem] || LIU_YI_TO_JIA[tStem];
      if (jia) hiddenStems.push(jia);
    }

    const marks = [];

    // 空亡
    const pBranches = PALACE_BRANCHES[num] || [];
    if (pBranches.some(b => kongWang.includes(b))) marks.push('空');

    // 门迫
    const dElem = DOOR_ELEM[door];
    const pElem = PALACE_ELEMENTS[num];
    if (dElem && pElem && wxRestricts(dElem, pElem)) marks.push('迫');

    // 六仪击刑 (天盘干)
    const tianPanGan = earthStemField;
    if ((tianPanGan==='戊'&&num===3)||(tianPanGan==='己'&&num===2)||(tianPanGan==='庚'&&num===8)||
        (tianPanGan==='辛'&&num===9)||(tianPanGan==='壬'&&num===4)||(tianPanGan==='癸'&&num===4))
      marks.push('刑');

    // 六仪入墓
    let hasMu = false;
    const sElem = STEM_ELEM[tianPanGan];
    if (sElem && GRAVE_MAP[sElem] && GRAVE_MAP[sElem].includes(num)) { marks.push('墓'); hasMu = true; }
    if (!hasMu && STEM_GRAVE[tianPanGan] === num) marks.push('墓');

    palaces.push({
      palaceNumber: num,
      palaceName: PALACE_NAMES[num] || '',
      palaceElement: PALACE_ELEMENTS[num] || '',
      skyStem: skyStemField,   // 地盘干
      earthStem: earthStemField, // 天盘干
      hiddenStems,
      star,
      starElement: STAR_ELEM[star] || '',
      door,
      doorElement: DOOR_ELEM[door] || '',
      god,
      godShort: GOD_SHORT[god] || '',
      marks,
      diGod: diGods ? (GOD_SHORT[diGods.get(num)] || '') : '',
      jiGanStem: (jiGongTarget && num === jiGongTarget) ? jiGanStemVal : undefined,
    });
  }
  return palaces;
}

// ═══════════════════════════════════════════════════
//  C. SOLAR TERM CALCULATION (for ju/dun)
// ═══════════════════════════════════════════════════

function getSolsticeBeforeDate(year, month, day) {
  const currentDate = new Date(year, month - 1, day);
  const candidates = [];

  // Query 2 years to get all relevant dongzhi/xiazhi
  for (const y of [year - 1, year]) {
    try {
      const s = Solar.fromYmd(y, 7, 1);
      const t = s.getLunar().getJieQiTable();
      if (t['冬至']) {
        const dz = t['冬至'];
        candidates.push({ date: new Date(dz.getYear(), dz.getMonth()-1, dz.getDay()), type: 'dong' });
      }
      if (t['夏至']) {
        const xz = t['夏至'];
        candidates.push({ date: new Date(xz.getYear(), xz.getMonth()-1, xz.getDay()), type: 'xia' });
      }
    } catch(e) { /* skip */ }
  }
  // Also query current date's table
  try {
    const s = Solar.fromYmd(year, month, day);
    const t = s.getLunar().getJieQiTable();
    if (t['冬至']) {
      const dz = t['冬至'];
      candidates.push({ date: new Date(dz.getYear(), dz.getMonth()-1, dz.getDay()), type: 'dong' });
    }
    if (t['夏至']) {
      const xz = t['夏至'];
      candidates.push({ date: new Date(xz.getYear(), xz.getMonth()-1, xz.getDay()), type: 'xia' });
    }
  } catch(e) { /* skip */ }

  const valid = candidates.filter(c => c.date <= currentDate);
  valid.sort((a, b) => b.date.getTime() - a.date.getTime());
  return valid.length > 0 ? valid[0] : null;
}

function getJuAndDun(year, month, day) {
  const nearest = getSolsticeBeforeDate(year, month, day);
  if (!nearest) return { juNumber: 1, dun: 'yang', yuan: '上' };

  const currentDate = new Date(year, month - 1, day);
  const totalDays = Math.round((currentDate.getTime() - nearest.date.getTime()) / 86400000);
  const chartGzIdx = dayGzIdx(year, month, day);

  let n = Math.floor(totalDays / 60);
  if (totalDays > 0 && chartGzIdx === 0 && totalDays % 60 !== 0) n += 1;

  const isAfterDongZhi = nearest.type === 'dong';
  const yangSeq = [1, 7, 4];
  const yinSeq  = [9, 3, 6];
  const seq = isAfterDongZhi ? yangSeq : yinSeq;
  const dun = isAfterDongZhi ? 'yang' : 'yin';
  const yuan = ['上','中','下'][n % 3];

  return { juNumber: seq[n % 3], dun, yuan };
}

// ═══════════════════════════════════════════════════
//  D. HOUR STEM/BRANCH CALCULATION
// ═══════════════════════════════════════════════════

function getHourBranch(hour) {
  // hour = 0-23
  if (hour === 23 || hour === 0) return '子';
  const idx = Math.floor((hour + 1) / 2);
  return BRANCHES[idx] || '子';
}

function getHourStem(dayStem, hourBranch) {
  // 五鼠遁日起时: day stem → 子 hour stem
  const ZI_STEMS = { '甲':0,'乙':2,'丙':4,'丁':6,'戊':8,'己':0,'庚':2,'辛':4,'壬':6,'癸':8 };
  const ziBranchOffset = BRANCHES.indexOf(hourBranch);
  const ziStemIdx = ZI_STEMS[dayStem] !== undefined ? ZI_STEMS[dayStem] : 0;
  return STEMS[(ziStemIdx + ziBranchOffset) % 10];
}

// Get four pillars from lunar-javascript
function getFourPillars(year, month, day, hourBranch) {
  try {
    const s = Solar.fromYmd(year, month, day);
    const ec = s.getLunar().getEightChar();
    const dayGz = getDayGanZhi(year, month, day);
    const hourStem = getHourStem(dayGz.stem, hourBranch);
    return {
      year:  { gan: String(ec.getYearGan()),  zhi: String(ec.getYearZhi()) },
      month: { gan: String(ec.getMonthGan()), zhi: String(ec.getMonthZhi()) },
      day:   { gan: dayGz.stem, zhi: dayGz.branch },
      hour:  { gan: hourStem, zhi: hourBranch },
    };
  } catch(e) {
    const dayGz = getDayGanZhi(year, month, day);
    const hourStem = getHourStem(dayGz.stem, hourBranch);
    return {
      year:  { gan:'', zhi:'' }, month: { gan:'', zhi:'' },
      day:   { gan: dayGz.stem, zhi: dayGz.branch },
      hour:  { gan: hourStem, zhi: hourBranch },
    };
  }
}

// Compute customHiddenStems via gear rotation
function computeHiddenStems(earthPlate, doorHomeP, doorFinalEff, xunShouStr) {
  const xunStemIdx = STEMS.indexOf(xunShouStr[0]);
  const xunBranchIdx = BRANCHES.indexOf(xunShouStr[1]);
  const branchOffset = ((xunBranchIdx - xunStemIdx) % 12 + 12) % 12;

  const doorHomePalace = doorHomeP === 5 ? 2 : doorHomeP;
  const dHomeIdx = YANG_ORDER.indexOf(doorHomePalace);
  const dCurrIdx = YANG_ORDER.indexOf(doorFinalEff);
  const gearSteps = ((dCurrIdx - dHomeIdx) % 8 + 8) % 8;

  const customHiddenStems = new Map();

  // Center (palace 5)
  const stem5 = earthPlate.get(5) || '';
  if (stem5) {
    const si5 = STEMS.indexOf(stem5);
    const bi5 = (si5 + branchOffset) % 12;
    customHiddenStems.set(5, [stem5 + BRANCHES[bi5]]);
  }

  // Outer 8 palaces
  for (const num of YANG_ORDER) {
    const palRingIdx = YANG_ORDER.indexOf(num);
    const srcRingIdx = ((palRingIdx - gearSteps) % 8 + 8) % 8;
    const srcPalace = YANG_ORDER[srcRingIdx];
    const hidStem = earthPlate.get(srcPalace) || '';
    if (!hidStem) continue;
    const si = STEMS.indexOf(hidStem);
    const bi = (si + branchOffset) % 12;
    customHiddenStems.set(num, [hidStem + BRANCHES[bi]]);
  }
  return customHiddenStems;
}

// ═══════════════════════════════════════════════════
//  E. NIANJIA ENGINE (年家奇门)
// ═══════════════════════════════════════════════════

function generateNianJia(year) {
  // STEP 1: 三元局数
  const offset = ((year - 1864) % 180 + 180) % 180;
  let yuan, juNumber;
  if (offset < 60)       { yuan = '上'; juNumber = 1; }
  else if (offset < 120) { yuan = '中'; juNumber = 4; }
  else                   { yuan = '下'; juNumber = 7; }

  // STEP 2: 年干支
  const idx = ((year - 4) % 60 + 60) % 60;
  const yearGz = { stem: STEMS[idx % 10], branch: BRANCHES[idx % 12] };

  // STEP 3: 地盘 (统一阴遁)
  const earthPlate = layoutEarthPlate(juNumber, 'yin');

  // STEP 4: 值符/值使 (from year ganzhi)
  const xun = findXunShou(yearGz.stem, yearGz.branch);
  const { zhiFuStar, zhiShiDoor, liuYiPalace } = resolveZhiFuShi(yearGz.stem, yearGz.branch, earthPlate);
  const yearStemForFind = yearGz.stem === '甲' ? xun.liuYi : yearGz.stem;

  // STEP 5: 天盘九星
  const skyStars = layoutSkyStars(zhiFuStar, yearStemForFind, earthPlate);

  // STEP 6: 人盘八门 (branch-distance walk from liuYiPalace)
  const xunBranchIdx = BRANCHES.indexOf(xun.xunShou[1]);
  const yearBranchIdx = BRANCHES.indexOf(yearGz.branch);
  const branchSteps = ((yearBranchIdx - xunBranchIdx) % 12 + 12) % 12;

  let zhiShiLandPalace = liuYiPalace;
  for (let s = 0; s < branchSteps; s++) {
    zhiShiLandPalace--;
    if (zhiShiLandPalace < 1) zhiShiLandPalace = 9;
  }
  const zhiShiFinal = zhiShiLandPalace === 5 ? 2 : zhiShiLandPalace;

  const zhiShiIdx = DOOR_ORDER.indexOf(zhiShiDoor);
  const doors = new Map();
  const yangStartIdx = YANG_ORDER.indexOf(zhiShiFinal);
  for (let i = 0; i < 8; i++) {
    doors.set(YANG_ORDER[(yangStartIdx + i) % 8], DOOR_ORDER[(zhiShiIdx + i) % 8]);
  }

  // STEP 7: 天盘八神 (yin sequence + YANG_ORDER)
  const zhiFuPalace = findStemOnEarth(earthPlate, yearStemForFind);
  const zhiFuEff = zhiFuPalace === 5 ? 2 : zhiFuPalace;
  const godOrderYin = ['值符','九天','九地','玄武','白虎','六合','太阴','螣蛇'];
  const gods = new Map();
  const godStart = YANG_ORDER.indexOf(zhiFuEff);
  for (let i = 0; i < 8; i++) {
    gods.set(YANG_ORDER[(godStart + i) % 8], godOrderYin[i]);
  }

  // STEP 8: 空亡
  const kongWang = getKongWang(yearGz.stem, yearGz.branch);

  // STEP 9: 地八神
  const diGods = layoutDiGods(earthPlate, xun.liuYi, 'yin');

  // STEP 10: 暗干支 (gear rotation)
  const doorHomePalace = DOOR_HOME[zhiShiDoor] || 1;
  const customHiddenStems = computeHiddenStems(earthPlate, doorHomePalace, zhiShiFinal, xun.xunShou);

  // Assemble
  const palaces = assemblePalaces(earthPlate, skyStars, doors, gods, kongWang, diGods, customHiddenStems);

  // 驿马
  const yiMaBranch = YI_MA_MAP[yearGz.branch] || '';
  const horsePalace = yiMaBranch ? (BRANCH_TO_PALACE[yiMaBranch] || 0) : 0;
  if (horsePalace) {
    const p = palaces.find(x => x.palaceNumber === horsePalace);
    if (p && !p.marks.includes('马')) p.marks.push('马');
  }

  // 寄宫干
  const jiGanVal = earthPlate.get(5) || '';
  let jiGongTarget = 0;
  for (const [pal, star] of skyStars.entries()) {
    if (star === '天芮' && pal !== 5) { jiGongTarget = pal; break; }
  }
  if (jiGongTarget) {
    const p = palaces.find(x => x.palaceNumber === jiGongTarget);
    if (p) p.jiGanStem = jiGanVal;
  }

  return {
    palaces,
    zhiFuStar, zhiShiDoor,
    zhiFuPalace: zhiFuEff, zhiShiPalace: zhiShiFinal,
    dun: 'yin', juNumber, yuan,
    type: 'nianjia', kongWang,
    ganzhi: yearGz,
    label: `Natal Tahun ${year} · Tahun (年家) · Yuan ${yuan} Periode ${juNumber} · Mundur Yin (阴遁)`,
    fourPillars: { year: yearGz, month:{gan:'',zhi:''}, day:{gan:'',zhi:''}, hour:{gan:'',zhi:''} }
  };
}

// ═══════════════════════════════════════════════════
//  F. RIJIA ENGINE (日家奇门)
// ═══════════════════════════════════════════════════

function generateRiJia(year, month, day) {
  const dayGz = getDayGanZhi(year, month, day);
  const { juNumber, dun, yuan } = getJuAndDun(year, month, day);
  const isYang = dun === 'yang';

  const earthPlate = layoutEarthPlate(juNumber, dun);
  const xun = findXunShou(dayGz.stem, dayGz.branch);
  const { zhiFuStar, zhiShiDoor, liuYiPalace } = resolveZhiFuShi(dayGz.stem, dayGz.branch, earthPlate);

  const stemForFind = dayGz.stem === '甲' ? xun.liuYi : dayGz.stem;
  const stemPalace = findStemOnEarth(earthPlate, stemForFind);
  const stemPalaceEff = stemPalace === 5 ? 2 : stemPalace;

  // 天盘九星
  const skyStars = layoutSkyStars(zhiFuStar, stemForFind, earthPlate);

  // 人盘八门 (posInXun method)
  const posInXun = dayGz.gzIdx % 10; // 0=甲...9=癸
  const doorHomePalace = DOOR_HOME[zhiShiDoor] || 1;
  let doorFinalPalace = doorHomePalace;
  for (let i = 0; i < posInXun; i++) {
    if (isYang) {
      doorFinalPalace = (doorFinalPalace % 9) + 1;
    } else {
      doorFinalPalace = ((doorFinalPalace - 2 + 9) % 9) + 1;
    }
  }
  const doorFinalEff = doorFinalPalace === 5 ? 2 : doorFinalPalace;

  const zhiShiIdx = DOOR_ORDER.indexOf(zhiShiDoor);
  const yangStartIdx = YANG_ORDER.indexOf(doorFinalEff);
  const doors = new Map();
  for (let i = 0; i < 8; i++) {
    doors.set(YANG_ORDER[(yangStartIdx + i) % 8], DOOR_ORDER[(zhiShiIdx + i) % 8]);
  }

  // 天盘八神
  const godSeq = isYang
    ? ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天']
    : ['值符','九天','九地','玄武','白虎','六合','太阴','螣蛇'];
  const gods = new Map();
  const godStartIdx = YANG_ORDER.indexOf(stemPalaceEff);
  for (let i = 0; i < 8; i++) {
    gods.set(YANG_ORDER[(godStartIdx + i) % 8], godSeq[i]);
  }

  const kongWang = getKongWang(dayGz.stem, dayGz.branch);
  const diGods = layoutDiGods(earthPlate, xun.liuYi, dun);
  const customHiddenStems = computeHiddenStems(earthPlate, doorHomePalace, doorFinalEff, xun.xunShou);

  const palaces = assemblePalaces(earthPlate, skyStars, doors, gods, kongWang, diGods, customHiddenStems);

  // 驿马
  const yiMaBranch = YI_MA_MAP[dayGz.branch] || '';
  const horsePalace = yiMaBranch ? (BRANCH_TO_PALACE[yiMaBranch] || 0) : 0;
  if (horsePalace) {
    const p = palaces.find(x => x.palaceNumber === horsePalace);
    if (p && !p.marks.includes('马')) p.marks.push('马');
  }

  const jiGanVal = earthPlate.get(5) || '';
  let jiGongTarget = 0;
  for (const [pal, star] of skyStars.entries()) {
    if (star === '天芮' && pal !== 5) { jiGongTarget = pal; break; }
  }
  if (jiGongTarget) {
    const p = palaces.find(x => x.palaceNumber === jiGongTarget);
    if (p) p.jiGanStem = jiGanVal;
  }

  // Get four pillars
  const fourPillars = getFourPillars(year, month, day, '子');

  const dunLabel = isYang ? 'Maju Yang (阳遁)' : 'Mundur Yin (阴遁)';
  return {
    palaces,
    zhiFuStar, zhiShiDoor,
    zhiFuPalace: stemPalaceEff, zhiShiPalace: doorFinalEff,
    dun, juNumber, yuan,
    type: 'rijia', kongWang,
    ganzhi: dayGz,
    label: `Natal Hari ${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')} · Harian (日家) · Yuan ${yuan} Periode ${juNumber} · ${dunLabel}`,
    fourPillars
  };
}

// ═══════════════════════════════════════════════════
//  G. SHIJIA ENGINE (时家奇门 — Real-time)
// ═══════════════════════════════════════════════════

function generateShiJia(now) {
  if (!now) now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();

  const hourBranch = getHourBranch(hour);
  const dayGz = getDayGanZhi(year, month, day);
  const hourStem = getHourStem(dayGz.stem, hourBranch);
  const shiGanZhi = hourStem + hourBranch;

  const { juNumber, dun, yuan } = getJuAndDun(year, month, day);
  const isYang = dun === 'yang';

  // Earth plate (shijia uses arrangeDiPan)
  const earthPlate = arrangeDiPan(juNumber, isYang);

  // 旬首
  const xunShouStr = getXunShouStr(shiGanZhi);
  const zhiFuStemLookup = LIUJIA_XUN[xunShouStr] || '戊';

  // 值符宫 (where 旬首仪 falls on earth plate)
  let zhiFuGong = 5;
  for (const [pos, s] of earthPlate.entries()) {
    if (s === zhiFuStemLookup) { zhiFuGong = pos; break; }
  }
  const zhiFuStar = PALACE_ORIGINAL_STAR[zhiFuGong === 5 ? 2 : zhiFuGong] || '天禽';

  // 值使门 (door at 值符宫 mapped position)
  const doorByPalace = {};
  Object.keys(DOOR_HOME).forEach(d => { doorByPalace[DOOR_HOME[d]] = d; });
  const actualZhiFuGong = zhiFuGong === 5 ? 2 : zhiFuGong;
  const zhiShiGate = doorByPalace[actualZhiFuGong] || '休门';

  // 值符落宫 (where 时干 falls)
  const timeStemRaw = hourStem;
  const actualTimeStem = timeStemRaw === '甲' ? zhiFuStemLookup : timeStemRaw;
  let rawPosition = 5;
  for (const [pos, s] of earthPlate.entries()) {
    if (s === actualTimeStem) { rawPosition = pos; break; }
  }
  const zhiFuLuoGong = rawPosition === 5 ? 2 : rawPosition;

  // 天盘九星 (PALACE_CLOCKWISE with STAR_SEQ_SHIJIA)
  const effectiveStar = zhiFuStar === '天禽' ? '天芮' : zhiFuStar;
  const zhiFuIdxS = STAR_SEQ_SHIJIA.indexOf(effectiveStar);
  const startIdxS = PALACE_CLOCKWISE.indexOf(zhiFuLuoGong);
  const tianPan = new Map();
  for (let i = 0; i < 8; i++) {
    const palace = PALACE_CLOCKWISE[(startIdxS + i) % 8];
    const star = STAR_SEQ_SHIJIA[(zhiFuIdxS + i) % 8];
    const originPalace = STAR_HOME[star] || 1;
    const stem = earthPlate.get(originPalace) || '';
    tianPan.set(palace, { star, heavenlyStem: stem });
  }
  tianPan.set(5, { star: '天禽', heavenlyStem: earthPlate.get(5) || '' });

  // 八门 (step from zhiFuGong by branch distance)
  const xunBranchIdx2 = BRANCHES.indexOf(xunShouStr[1]);
  const hourBranchIdx = BRANCHES.indexOf(hourBranch);
  const steps = ((hourBranchIdx - xunBranchIdx2) + 12) % 12;
  let zhiShiPos = zhiFuGong; // start from raw (including 5)
  for (let i = 0; i < steps; i++) {
    if (isYang) { zhiShiPos++; if (zhiShiPos > 9) zhiShiPos = 1; }
    else        { zhiShiPos--; if (zhiShiPos < 1) zhiShiPos = 9; }
  }
  if (zhiShiPos === 5) zhiShiPos = 2;

  const gateSeq = ['休门','生门','伤门','杜门','景门','死门','惊门','开门'];
  const gateStartIdx = PALACE_CLOCKWISE.indexOf(zhiShiPos);
  const gateHomeIdx = gateSeq.indexOf(zhiShiGate);
  const gates = new Map();
  for (let i = 0; i < 8; i++) {
    gates.set(PALACE_CLOCKWISE[(gateStartIdx + i) % 8], gateSeq[(gateHomeIdx + i) % 8]);
  }

  // 八神 (阳顺阴逆 from 值符落宫)
  const DEITIES_YANG = ['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];
  const DEITIES_YIN  = ['值符','九天','九地','玄武','白虎','六合','太阴','腾蛇'];
  const deitySeq = isYang ? DEITIES_YANG : DEITIES_YIN;
  const deityOrder = isYang ? PALACE_CLOCKWISE : PALACE_COUNTER_CLOCKWISE;
  const deityStart = deityOrder.indexOf(zhiFuLuoGong);
  const gods = new Map();
  for (let i = 0; i < 8; i++) {
    gods.set(deityOrder[(deityStart + i) % 8], deitySeq[i]);
  }

  // 空亡
  const kongWang = getKongWang(hourStem, hourBranch);

  // 地八神
  const DI_RING = [6,1,8,3,4,9,2,7];
  const DI_GOD_YANG = ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天'];
  const DI_GOD_YIN  = ['值符','九天','九地','玄武','白虎','六合','太阴','螣蛇'];
  const diGodOrder = isYang ? DI_GOD_YANG : DI_GOD_YIN;
  let diStart = 1;
  for (const [pos, s] of earthPlate.entries()) {
    if (s === zhiFuStemLookup) { diStart = pos === 5 ? 2 : pos; break; }
  }
  const diStartIdx = DI_RING.indexOf(diStart);
  const diGods = new Map();
  for (let g = 0; g < 8; g++) {
    diGods.set(DI_RING[(diStartIdx + g) % 8], diGodOrder[g]);
  }

  // 驿马
  const yiMaBranch = YI_MA_MAP[hourBranch] || '';
  const horsePalace = yiMaBranch ? (BRANCH_TO_PALACE[yiMaBranch] || 0) : 0;

  // 寄宫
  let jiGongTarget2 = 0;
  const jiGanStem2 = earthPlate.get(5) || '';
  for (const [palace, info] of tianPan.entries()) {
    if (info.star === '天芮' && palace !== 5) { jiGongTarget2 = palace; break; }
  }

  // Build palaces
  const STEM_WX = STEM_ELEM;
  const GATE_ORIG = DOOR_HOME;
  const xunBranchOffset = BRANCHES.indexOf(xunShouStr[1]);
  function getDarkBranch(stem) {
    const idx2 = STEMS.indexOf(stem);
    return idx2 >= 0 ? BRANCHES[((xunBranchOffset + idx2) % 12)] : '';
  }

  const palaces = [];
  for (let i = 1; i <= 9; i++) {
    const isCtr = i === 5;
    const eStem = earthPlate.get(i) || '';
    const tInfo = tianPan.get(i);
    const hStem = tInfo ? tInfo.heavenlyStem : '';
    const star  = tInfo ? tInfo.star : (isCtr ? '天禽' : '');
    const door  = isCtr ? '' : (gates.get(i) || '');
    const god   = isCtr ? '' : (gods.get(i) || '');

    // Hidden stems: door → home → earth stem
    let hiddenStems = [];
    if (isCtr) {
      if (eStem) hiddenStems = [eStem, getDarkBranch(eStem)];
    } else if (door) {
      const origP = GATE_ORIG[door];
      const darkStem = origP ? (earthPlate.get(origP) || '') : '';
      if (darkStem) hiddenStems = [darkStem, getDarkBranch(darkStem)];
    }

    const marks = [];
    const pBranches = PALACE_BRANCHES[i] || [];
    if (pBranches.some(b => kongWang.includes(b))) marks.push('空');
    if (i === horsePalace) marks.push('马');

    // 门迫
    const dElem = DOOR_ELEM[door];
    const pElem = PALACE_ELEMENTS[i];
    if (dElem && pElem && wxRestricts(dElem, pElem)) marks.push('迫');

    // 六仪击刑 (天盘干 = hStem)
    if (!isCtr && hStem &&
        ((hStem==='戊'&&i===3)||(hStem==='己'&&i===2)||(hStem==='庚'&&i===8)||
         (hStem==='辛'&&i===9)||(hStem==='壬'&&i===4)||(hStem==='癸'&&i===4)))
      marks.push('刑');

    // 入墓
    let hasMu = false;
    if (!isCtr && hStem) {
      const sEl = STEM_WX[hStem];
      if (sEl && GRAVE_MAP[sEl] && GRAVE_MAP[sEl].includes(i)) { marks.push('墓'); hasMu=true; }
    }
    if (!hasMu && !isCtr && hStem && STEM_GRAVE[hStem] === i) marks.push('墓');

    const diGodShort = isCtr ? '' : (GOD_SHORT[diGods.get(i)] || '');

    palaces.push({
      palaceNumber: i, palaceName: PALACE_NAMES[i]||'',
      palaceElement: PALACE_ELEMENTS[i]||'',
      skyStem: eStem, earthStem: isCtr ? '' : hStem,
      hiddenStems, star, starElement: STAR_ELEM[star]||'',
      door, doorElement: DOOR_ELEM[door]||'',
      god, godShort: GOD_SHORT[god]||'',
      marks, diGod: diGodShort,
      jiGanStem: (jiGongTarget2 && i===jiGongTarget2 && !isCtr) ? jiGanStem2 : undefined,
    });
  }

  const fourPillars = getFourPillars(year, month, day, hourBranch);
  const dunLabel = isYang ? 'Maju Yang (阳遁)' : 'Mundur Yin (阴遁)';
  const timeStr = `${String(hour).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  return {
    palaces,
    zhiFuStar, zhiShiDoor: zhiShiGate,
    zhiFuPalace: zhiFuLuoGong, zhiShiPalace: zhiShiPos,
    dun, juNumber, yuan,
    type: 'shijia', kongWang,
    ganzhi: { stem: hourStem, branch: hourBranch },
    label: `Sekarang ${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')} ${timeStr} · Per Jam (时家) · Yuan ${yuan} Periode ${juNumber} · ${dunLabel}`,
    fourPillars, hourStem, hourBranch
  };
}

// ═══════════════════════════════════════════════════
//  H. INTERPRETATION ENGINE
// ═══════════════════════════════════════════════════

const DOOR_DATA = {
  '开门': { nature:'大吉', summary:'Membuka Peluang & Meraih Prestasi', advice:'Sangat baik untuk memulai usaha, melamar jabatan, bepergian, negosiasi, dan membangun karir. Semua urusan yang membutuhkan inisiatif dan keberanian sangat didukung arah ini.', icon:'🔓' },
  '休门': { nature:'大吉', summary:'Ketenangan & Pertolongan Penolong', advice:'Baik untuk beristirahat, mengunjungi sahabat, mencari tokoh penolong, dan mengajukan permohonan. Ada tokoh penting yang diam-diam mendukung Anda.', icon:'🌙' },
  '生门': { nature:'大吉', summary:'Keuangan Melimpah & Pertumbuhan', advice:'Sangat baik untuk mencari uang, investasi, berdagang, dan membeli properti. Ini adalah Pintu terbaik untuk urusan finansial.', icon:'🌱' },
  '伤门': { nature:'中凶', summary:'Kompetisi & Aksi Agresif', advice:'Cocok untuk kompetisi, olahraga, dan urusan militer. Tidak baik untuk urusan dokumen dan diplomatik — waspadai konflik lisan dan pertengkaran.', icon:'⚡' },
  '杜门': { nature:'小凶', summary:'Tertutup & Tersembunyi', advice:'Baik untuk menyembunyikan informasi, urusan rahasia, dan hal-hal yang membutuhkan kerahasiaan. Tidak baik untuk ekspansi dan membuka peluang baru.', icon:'🚪' },
  '景门': { nature:'中吉', summary:'Kreativitas & Keahlian Presentasi', advice:'Baik untuk ujian tulis, presentasi, dan menampilkan bakat verbal. Untuk urusan bisnis praktis, perlu lebih teliti agar tidak hanya tampak bagus di permukaan.', icon:'🎆' },
  '死门': { nature:'大凶', summary:'Stagnan & Terjebak', advice:'Tidak baik untuk hampir semua hal. Hindari memulai sesuatu, bepergian jauh, atau mengambil keputusan besar. Energi di arah ini sangat berat dan membebani.', icon:'💀' },
  '惊门': { nature:'小凶', summary:'Kejutan & Ketidakstabilan', advice:'Waspadai berita mengejutkan, gosip, konflik verbal, dan ketidakstabilan emosi. Dapat digunakan untuk menciptakan momentum atau menangkap peluang dalam keadaan darurat.', icon:'⚠️' },
};

const STAR_DATA = {
  '天蓬': { nature:'凶', summary:'Keras & Penuh Risiko', advice:'Bintang ini membawa energi keras dan berbahaya. Waspadai pencurian, penipuan, dan urusan air. Tidak baik untuk perjalanan dan keputusan besar.', icon:'🌊' },
  '天芮': { nature:'凶', summary:'Kesehatan & Ancaman Tersembunyi', advice:'Waspadai masalah kesehatan, musuh tersembunyi, dan penipuan halus. Lebih baik diam dan tidak mengambil keputusan besar di arah ini.', icon:'🌑' },
  '天冲': { nature:'中吉', summary:'Energi & Tekad Maju', advice:'Bintang penuh semangat dan dorongan maju. Baik untuk kompetisi, inovasi, dan urusan yang membutuhkan keberanian. Energi keras tapi produktif.', icon:'🐉' },
  '天辅': { nature:'大吉', summary:'Berkah & Kemakmuran Budaya', advice:'Bintang paling suportif — baik untuk urusan intelektual, diplomatik, pendidikan, dan bertemu tokoh berpengaruh. Membawa keberuntungan alami.', icon:'⭐' },
  '天禽': { nature:'中性', summary:'Stabil & Penengah', advice:'Bintang netral yang menjaga keseimbangan. Ditempatkan di Pusat (Ruas 5) dan membantu energi keseluruhan chart. Tidak digunakan untuk penilaian arah langsung.', icon:'🦅' },
  '天心': { nature:'大吉', summary:'Kecerdasan & Cahaya Ilahi', advice:'Bintang keberuntungan tinggi. Sangat baik untuk penyembuhan, melamar jabatan, dan merencanakan langkah penting. Ada pertolongan langit yang menyertai.', icon:'💡' },
  '天柱': { nature:'凶', summary:'Pertikaian & Kerusakan', advice:'Bintang yang membawa konflik dan kerusakan. Waspadai pertengkaran, masalah hukum, dan kerusakan aset. Jaga tutur kata di arah ini.', icon:'💥' },
  '天任': { nature:'大吉', summary:'Tanggung Jawab & Kekokohan', advice:'Bintang yang stabil dan dapat diandalkan. Sangat baik untuk pertanian, properti, dan pembangunan fondasi jangka panjang yang kokoh.', icon:'🏔' },
  '天英': { nature:'中凶', summary:'Cahaya Semu & Keangkuhan', advice:'Penampilan luar lebih baik dari realita. Baik untuk menampilkan bakat dan kreativitas, tapi kurang efektif untuk urusan bisnis praktis. Jangan terlalu percaya diri.', icon:'🌟' },
};

const GOD_DATA = {
  '值符': { nature:'大吉', summary:'Pemimpin Tertinggi — Pertolongan Langit', advice:'Dewa paling auspicous. Kehadiran Dewa ini di sebuah ruas berarti segala urusan mendapat bantuan tak terduga dari langit — semua rencana cenderung berhasil.', icon:'👑' },
  '螣蛇': { nature:'凶',  summary:'Ular Terbang — Ilusi & Kebohongan', advice:'Waspadai berita bohong, mimpi buruk, dan konflik verbal. Jangan mudah percaya informasi yang beredar di arah ini.', icon:'🐍' },
  '腾蛇': { nature:'凶',  summary:'Ular Terbang — Ilusi & Kebohongan', advice:'Waspadai berita bohong, mimpi buruk, dan konflik verbal. Jangan mudah percaya informasi yang beredar di arah ini.', icon:'🐍' },
  '太阴': { nature:'吉',  summary:'Yin Besar — Strategi Tersembunyi', advice:'Baik untuk rencana rahasia, diplomasi diam-diam, dan urusan yang membutuhkan kerahasiaan. Ada dukungan dari tokoh wanita berpengaruh secara diam-diam.', icon:'🌙' },
  '六合': { nature:'吉',  summary:'Enam Harmoni — Relasi & Kerjasama', advice:'Sangat baik untuk menjalin relasi, negosiasi, mediasi, dan semua bentuk kerjasama. Energi arah ini membawa kecocokan dan saling menguntungkan.', icon:'🤝' },
  '白虎': { nature:'凶',  summary:'Harimau Putih — Bahaya & Kekerasan', advice:'Waspadai kecelakaan fisik, perkelahian, dan masalah medis mendadak. Hindari perjalanan dan aktivitas berisiko tinggi di arah ini.', icon:'🐅' },
  '玄武': { nature:'凶',  summary:'Kura Hitam — Pencurian & Penipuan', advice:'Waspadai penipuan, pencurian, dan pengkhianatan. Jangan sembarangan mempercayai orang baru atau menandatangani kontrak di arah ini.', icon:'🌑' },
  '九地': { nature:'吉',  summary:'Sembilan Bumi — Fondasi & Kekokohan', advice:'Baik untuk membangun fondasi jangka panjang, investasi properti, dan menjaga posisi saat ini. Energinya stabil dan memberikan perlindungan.', icon:'🌍' },
  '九天': { nature:'吉',  summary:'Sembilan Langit — Ambisi & Promosi', advice:'Baik untuk melamar jabatan tinggi, ekspansi bisnis, dan memperluas pengaruh. Energinya membawa visibilitas dan dukungan dari atasan.', icon:'☀️' },
};

// 五行生克文字
const WX_SHENG = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
const WX_KE   = { '木':'土','火':'金','土':'水','金':'木','水':'火' };

function wxRelation(a, b) {
  if (WX_SHENG[a] === b) return `${a}生${b}`;
  if (WX_KE[a] === b)    return `${a}克${b}`;
  if (WX_SHENG[b] === a) return `${b}生${a}`;
  if (WX_KE[b] === a)    return `${b}克${a}`;
  if (a === b)           return `${a}${b}比和`;
  return '';
}

function interpretPalace(p) {
  const lines = [];
  const doorD = DOOR_DATA[p.door] || {};
  const starD = STAR_DATA[p.star] || {};
  const godD  = GOD_DATA[p.god]  || GOD_DATA[p.godShort] || {};

  // Overall palace quality
  const goodDoors = ['开门','休门','生门'];
  const badDoors  = ['死门','惊门'];
  const goodStars = ['天辅','天心','天任'];
  const badStars  = ['天蓬','天芮','天柱'];
  const goodGods  = ['值符','九天','九地','六合','太阴'];
  const badGods   = ['螣蛇','腾蛇','白虎','玄武'];

  let score = 0;
  if (goodDoors.includes(p.door)) score += 2;
  else if (badDoors.includes(p.door)) score -= 2;
  if (goodStars.includes(p.star)) score++;
  else if (badStars.includes(p.star)) score--;
  if (goodGods.includes(p.god)) score++;
  else if (badGods.includes(p.god)) score--;
  if (p.marks.includes('刑')) score -= 2;
  if (p.marks.includes('墓')) score -= 1;
  if (p.marks.includes('迫')) score -= 1;
  if (p.marks.includes('空')) score -= 1;

  let quality, qIcon;
  if (score >= 3)        { quality = 'Sangat Baik (大吉)'; qIcon = '🟢'; }
  else if (score >= 1)   { quality = 'Baik (小吉)';        qIcon = '🔵'; }
  else if (score === 0)  { quality = 'Netral (中平)';      qIcon = '⚪'; }
  else if (score >= -1)  { quality = 'Kurang Baik (小凶)'; qIcon = '🟡'; }
  else                   { quality = 'Berbahaya (大凶)';   qIcon = '🔴'; }

  // Star-Door relation
  const starElem = p.starElement;
  const doorElem = p.doorElement;
  const starDoorRel = starElem && doorElem ? wxRelation(starElem, doorElem) : '';

  // Star-Palace relation
  const palElem = p.palaceElement;
  const starPalRel = starElem && palElem ? wxRelation(starElem, palElem) : '';

  return {
    quality, qIcon, score,
    doorSummary:  doorD.summary || '',
    doorAdvice:   doorD.advice  || '',
    starSummary:  starD.summary || '',
    starAdvice:   starD.advice  || '',
    godSummary:   godD.summary  || '',
    godAdvice:    godD.advice   || '',
    starDoorRel, starPalRel,
    marks: p.marks,
  };
}

// Detect special patterns (格局)
function detectPatterns(palaces, chart) {
  const found = [];

  // Find things by palace
  const byNum = {};
  palaces.forEach(p => { byNum[p.palaceNumber] = p; });

  for (const p of palaces) {
    const tStem = p.earthStem; // 天盘干 (despite field name)
    const dStem = p.skyStem;   // 地盘干
    const door  = p.door;
    const god   = p.god || p.godShort;
    const star  = p.star;

    // 三奇升殿 (Tiga Bintang Istimewa Naik Tahta)
    if (tStem === '乙' && p.palaceNumber === 3) found.push({ name:'乙奇升殿 · Bintang Hari Naik Tahta', type:'吉', desc:'Bintang 乙 (Hari/Kayu Yin) berada di Ruas Timur-Petir (3) — posisi paling kuat. Peluang besar terbuka lebar, tokoh pelindung dan pemberi keberuntungan akan muncul. Sangat baik untuk memulai usaha, maju, dan bepergian.' });
    if (tStem === '丙' && p.palaceNumber === 9) found.push({ name:'丙奇升殿 · Bintang Bulan Naik Tahta', type:'吉', desc:'Bintang 丙 (Bulan/Api Yang) berada di Ruas Selatan-Api (9) — cahaya terang bersinar penuh. Sangat menguntungkan untuk bepergian, mencari rezeki, promosi, dan semua urusan yang membutuhkan visibilitas.' });
    if (tStem === '丁' && p.palaceNumber === 7) found.push({ name:'丁奇升殿 · Bintang Bintang Naik Tahta', type:'吉', desc:'Bintang 丁 (Bintang/Api Yin) berada di Ruas Barat-Danau (7) — bintang sastra dan kecerdasan bersinar. Sangat baik untuk ujian, melamar pekerjaan, presentasi, dan semua urusan akademik atau intelektual.' });

    // 三奇入墓 (Tiga Bintang Istimewa Masuk Kuburan)
    if (tStem === '乙' && p.palaceNumber === 2) found.push({ name:'乙奇入墓 · Bintang Hari Masuk Kuburan', type:'凶', desc:'Bintang 乙 (Hari) jatuh ke Ruas Barat Daya (2, unsur Tanah Kuburan) — tokoh pelindung tidak muncul, urusan surat-menyurat dan dokumen penting terhambat. Hindari meminta bantuan atau melamar sesuatu di periode ini.' });
    if (tStem === '丙' && p.palaceNumber === 6) found.push({ name:'丙奇入墓 · Bintang Bulan Masuk Kuburan', type:'凶', desc:'Bintang 丙 (Bulan) jatuh ke Ruas Barat Laut (6, unsur Tanah Kuburan) — cahaya tertutup, rezeki dan finansial terhambat. Hindari pengeluaran besar dan investasi di periode ini.' });
    if (tStem === '丁' && p.palaceNumber === 8) found.push({ name:'丁奇入墓 · Bintang Bintang Masuk Kuburan', type:'凶', desc:'Bintang 丁 (Bintang) jatuh ke Ruas Timur Laut (8, unsur Tanah Kuburan) — komunikasi terputus, dokumen terhambat. Tidak baik untuk ujian, presentasi, atau urusan yang membutuhkan kecerdasan verbal.' });

    // 六仪击刑 (Enam Yi Menyerang)
    if (p.marks.includes('刑')) {
      found.push({ name:`六仪击刑 · Bentrokan Energi (${tStem} di ${p.palaceName}${p.palaceNumber})`, type:'凶', desc:`Elemen batang langit (${tStem}) dan Ruas ${p.palaceName}${p.palaceNumber} saling bertabrakan secara energetik — waspadai kecelakaan, masalah hukum/penalti, kerugian finansial besar. Hindari semua tindakan penting di arah ${p.palaceName} ini.` });
    }

    // 奇仪相合 (Harmoni Langit-Bumi)
    const combos = [['乙','庚'],['丙','辛'],['丁','壬'],['戊','癸']];
    for (const [a,b] of combos) {
      if ((tStem===a&&dStem===b)||(tStem===b&&dStem===a)) {
        found.push({ name:`奇仪相合 · Harmoni Langit-Bumi (${a}${b})`, type:'吉', desc:'Langit dan Bumi berpadu dalam harmoni sempurna — semua urusan berjalan mulus dan alami. Sangat menguntungkan untuk transaksi bisnis, kerjasama, negosiasi, mediasi, dan perjanjian damai.' });
      }
    }

    // 太白临宫 / 飞干格 (Logam Putih Mendominasi)
    if (tStem === '庚') found.push({ name:`太白临宫 · Logam Putih Menguasai ${p.palaceName}宫`, type:'凶', desc:`庚 (Logam Yang, simbol konflik) mendominasi Ruas ${p.palaceName}${p.palaceNumber} — usaha di arah ini mudah gagal atau terhambat, bepergian bisa merugi. Segala rencana besar di arah ${p.palaceName} perlu ditunda atau ekstra waspada.` });

    // 天网地网 (Jaring Langit-Bumi)
    if ((tStem==='癸'&&dStem==='壬')||(tStem==='壬'&&dStem==='癸')||(tStem==='癸'&&dStem==='癸')) {
      found.push({ name:'天网地网 · Jaring Langit dan Bumi', type:'凶', desc:'Energi Air berlapis ganda (壬癸 tumpang tindih) — seperti terjebak dalam jaring. Semua tindakan terperangkap, sangat tidak menguntungkan untuk maju atau bergerak. Lebih baik diam dan menunggu kondisi membaik.' });
    }

    // 门迫 (Gerbang Menekan Ruas)
    if (p.marks.includes('迫')) {
      found.push({ name:`门迫 · Gerbang Menekan Ruas (${door} di ${p.palaceName}宫)`, type:'凶', desc:`Gerbang ${door} menyerang unsur Ruas ${p.palaceName}${p.palaceNumber} — memaksa situasi justru memperburuk keadaan. Jika gerbang ini adalah gerbang buruk, efek negatifnya berlipat ganda. Jangan paksa keadaan di arah ini.` });
    }

    // 值符伏吟 (Bintang Pemimpin Kembali ke Asal)
    if (star === chart.zhiFuStar && STAR_HOME[star] === p.palaceNumber) {
      found.push({ name:'值符伏吟 · Bintang Pemimpin Balik ke Asal', type:'凶', desc:'Bintang pemimpin (值符) kembali ke posisi asalnya — chart masuk kondisi sangat statis dan stagnan. Segala urusan terhenti dan mengalami penundaan panjang. Lebih baik diam, menunggu, dan tidak mengambil keputusan besar.' });
    }

    // 天遁 / 地遁 / 人遁 (Tiga Penyelamatan)
    if (tStem==='丙' && door==='生门') found.push({ name:'天遁 · Penyelamatan Langit', type:'吉', desc:'Bintang 丙 (Api) bertemu Pintu Kehidupan (生门) — energi paling auspicous di QMDJ. Sinar surya bersatu dengan gerbang kehidupan: sangat baik untuk promosi jabatan, mencari rezeki, bertemu tokoh penting, dan memulai usaha baru. Gunakan arah ini untuk tindakan penting.' });
    if (tStem==='乙' && door==='开门') found.push({ name:'地遁 · Penyelamatan Bumi', type:'吉', desc:'Bintang 乙 (Kayu Yin) bertemu Pintu Terbuka (开门) — energi bumi bersinar menerangi jalan. Sangat baik untuk konstruksi, investasi jangka panjang, pertahanan posisi, dan membangun fondasi yang kuat.' });
    if (tStem==='丁' && door==='休门' && (god==='太阴'||god==='阴')) found.push({ name:'人遁 · Penyelamatan Manusia', type:'吉', desc:'Bintang 丁 + Pintu Istirahat (休门) + Dewa Tersembunyi (太阴) berpadu — tiga energi manusia harmonis. Sangat baik untuk negosiasi rahasia, membangun relasi penting, dan urusan yang membutuhkan kepercayaan dan kerahasiaan.' });

    // 三奇得门 (Tiga Bintang + Gerbang Baik)
    if (['开门','休门','生门'].includes(door) && ['乙','丙','丁'].includes(tStem)) {
      const doorNames = {'开门':'Pintu Terbuka','休门':'Pintu Istirahat','生门':'Pintu Kehidupan'};
      const stemNames = {'乙':'Hari (乙)','丙':'Bulan (丙)','丁':'Bintang (丁)'};
      found.push({ name:`三奇得门 · Bintang Istimewa + Gerbang Baik (${tStem}+${door})`, type:'吉', desc:`Bintang istimewa ${stemNames[tStem]||tStem} bertemu ${doorNames[door]||door} — dua kekuatan positif berpadu. Apapun yang direncanakan di arah ini akan berhasil. Ini adalah salah satu pertanda paling menguntungkan dalam QMDJ.` });
    }
  }

  // 空亡 (Kekosongan Waktu)
  if (chart.kongWang && chart.kongWang.length > 0) {
    const kongPalaces = palaces.filter(p => p.marks.includes('空')).map(p => p.palaceName+p.palaceNumber);
    if (kongPalaces.length > 0) {
      found.push({ name:`时空亡 · Jam/Hari Masuk Kekosongan (${chart.kongWang.join('')})`, type:'凶', desc:`Elemen waktu jatuh ke kekosongan (空亡) — Ruas yang terpengaruh: ${kongPalaces.join('、')}. Energi di ruas-ruas ini melemah secara signifikan: tindakan yang dilakukan di arah ini cenderung tidak membuahkan hasil nyata. Tunda urusan penting dari ruas-ruas tersebut.` });
    }
  }

  return found;
}

function buildChartInterpretation(chart) {
  const { palaces, zhiFuStar, zhiShiDoor, zhiFuPalace, zhiShiPalace, dun, juNumber, yuan, type, kongWang } = chart;

  // Find key palaces
  const zhiFuP = palaces.find(p => p.palaceNumber === zhiFuPalace) || palaces[0];
  const zhiShiP = palaces.find(p => p.palaceNumber === zhiShiPalace) || palaces[0];

  // Overall quality
  const patterns = detectPatterns(palaces, chart);
  const jiPatterns = patterns.filter(p => p.type === '吉');
  const xiongPatterns = patterns.filter(p => p.type === '凶');

  let overallQuality;
  const jScore = jiPatterns.length * 2 - xiongPatterns.length * 1.5;
  if (jScore > 2)        overallQuality = '🟢 Baik (吉局)';
  else if (jScore > 0)   overallQuality = '🔵 Cukup Baik (小吉局)';
  else if (jScore === 0) overallQuality = '⚪ Netral (中平局)';
  else if (jScore > -2)  overallQuality = '🟡 Perlu Waspada (小凶局)';
  else                   overallQuality = '🔴 Kurang Menguntungkan (凶局)';

  // Individual palace interpretations
  const palaceInterps = palaces.map(p => ({ ...p, interp: interpretPalace(p) }));

  // Summary
  const dunText = dun === 'yang' ? 'Maju Yang (阳遁)' : 'Mundur Yin (阴遁)';
  const typeText = { nianjia:'Natal Tahun (年家)', rijia:'Natal Hari (日家)', shijia:'Per Jam (时家)' }[type] || type;
  const PAL_DIR_ID = {1:'Utara',2:'Barat Daya',3:'Timur',4:'Tenggara',5:'Pusat',6:'Barat Laut',7:'Barat',8:'Timur Laut',9:'Selatan'};
  const summary = `Yuan ${yuan} Periode ${juNumber} · ${dunText} | Bintang Pemimpin (值符): ${zhiFuStar} → ${PALACE_NAMES[zhiFuPalace]||''}${zhiFuPalace} (${PAL_DIR_ID[zhiFuPalace]||''}) | Gerbang Pemimpin (值使): ${zhiShiDoor} → ${PALACE_NAMES[zhiShiPalace]||''}${zhiShiPalace} (${PAL_DIR_ID[zhiShiPalace]||''})`;

  // Best direction (best palace)
  const sorted = [...palaceInterps].filter(p => p.palaceNumber !== 5).sort((a,b) => b.interp.score - a.interp.score);
  const bestPalace = sorted[0];
  const worstPalace = sorted[sorted.length - 1];

  const PALACE_DIRECTIONS = { 1:'北', 2:'西南', 3:'东', 4:'东南', 6:'西北', 7:'西', 8:'东北', 9:'南' };

  return {
    summary,
    overallQuality,
    label: chart.label,
    typeText,
    dunText,
    juNumber,
    yuan,
    zhiFuStar, zhiShiDoor,
    zhiFuPalace, zhiShiPalace,
    zhiFuPalaceName: PALACE_NAMES[zhiFuPalace] || '',
    zhiShiPalaceName: PALACE_NAMES[zhiShiPalace] || '',
    kongWang,
    patterns: { ji: jiPatterns, xiong: xiongPatterns, all: patterns },
    palaces: palaceInterps,
    bestDirection: bestPalace ? {
      palace: bestPalace.palaceNumber,
      palaceName: PALACE_NAMES[bestPalace.palaceNumber] || '',
      direction: PALACE_DIRECTIONS[bestPalace.palaceNumber] || '中',
      quality: bestPalace.interp.quality,
      reason: `${bestPalace.star}+${bestPalace.door}+${bestPalace.god}`,
    } : null,
    cautionDirection: worstPalace ? {
      palace: worstPalace.palaceNumber,
      palaceName: PALACE_NAMES[worstPalace.palaceNumber] || '',
      direction: PALACE_DIRECTIONS[worstPalace.palaceNumber] || '中',
      quality: worstPalace.interp.quality,
    } : null,
    fourPillars: chart.fourPillars,
    ganzhi: chart.ganzhi,
  };
}

// ═══════════════════════════════════════════════════
//  I. PUBLIC API
// ═══════════════════════════════════════════════════

function calculateQmdj({ type, birthYear, birthMonth, birthDay }) {
  let chart;
  if (type === 'nianjia') {
    chart = generateNianJia(parseInt(birthYear));
  } else if (type === 'rijia') {
    chart = generateRiJia(parseInt(birthYear), parseInt(birthMonth), parseInt(birthDay));
  } else if (type === 'shijia') {
    chart = generateShiJia(new Date());
  } else {
    throw new Error('Invalid QMDJ type. Use: nianjia, rijia, or shijia');
  }
  return buildChartInterpretation(chart);
}

module.exports = { calculateQmdj, generateNianJia, generateRiJia, generateShiJia, buildChartInterpretation };
