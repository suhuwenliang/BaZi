'use strict';

/**
 * engines/bazi.js
 * Engine BaZi (四柱八字) — menggunakan library lunar-javascript (6tail)
 *
 * Library: lunar-javascript v1.7.7 (https://github.com/6tail/lunar-javascript)
 * Kaidah yang diimplementasikan library:
 *   - Batas tahun: 立春 (waktu tepat) — metode klasik standar
 *   - Batas bulan: 节 (solar node, waktu tepat ke menit)
 *   - Jam: 子时 lintas tengah malam (2 aliran tersedia)
 *   - Jie Qi: perhitungan astronomis presisi
 *   - Ten Gods: dari Day Master vs semua stems
 *   - Da Yun: 2 aliran (aliran 2 = presisi menit, default)
 *   - Hidden Stems: 本气/中气/余气 dengan 3 lapisan
 */

const { Solar, Lunar } = require('lunar-javascript');
const { toTrueSolarTime } = require('../utils/solar-time');
const { calculateBoneWeight } = require('./bone-weight');
const {
  DAY_MASTER, TEN_GODS, WU_XING, SHEN_SHA,
  KUA_DATA, CAREER_BY_DAYMASTER, BUSINESS_BY_DAYMASTER, BUSINESS_AVOID_BY_ELEMENT, SHIO_COMPATIBILITY,
  calculateKuaNumber
} = require('./interpretations');

// ============================================================
// TABEL REFERENSI
// ============================================================

// Bobot Hidden Stems (藏干) dalam Earthly Branches
// Sumber: 五虎遁年起月法 dan tabel 藏干 klasik
const HIDDEN_STEMS = {
  '子': [{ stem: '癸', weight: 100, type: '本气' }],
  '丑': [{ stem: '己', weight: 60, type: '本气' }, { stem: '癸', weight: 20, type: '中气' }, { stem: '辛', weight: 20, type: '余气' }],
  '寅': [{ stem: '甲', weight: 60, type: '本气' }, { stem: '丙', weight: 20, type: '中气' }, { stem: '戊', weight: 20, type: '余气' }],
  '卯': [{ stem: '乙', weight: 100, type: '本气' }],
  '辰': [{ stem: '戊', weight: 60, type: '本气' }, { stem: '乙', weight: 20, type: '中气' }, { stem: '癸', weight: 20, type: '余气' }],
  '巳': [{ stem: '丙', weight: 60, type: '本气' }, { stem: '庚', weight: 20, type: '中气' }, { stem: '戊', weight: 20, type: '余气' }],
  '午': [{ stem: '丁', weight: 70, type: '本气' }, { stem: '己', weight: 30, type: '中气' }],
  '未': [{ stem: '己', weight: 60, type: '本气' }, { stem: '丁', weight: 20, type: '中气' }, { stem: '乙', weight: 20, type: '余气' }],
  '申': [{ stem: '庚', weight: 60, type: '本气' }, { stem: '壬', weight: 20, type: '中气' }, { stem: '戊', weight: 20, type: '余气' }],
  '酉': [{ stem: '辛', weight: 100, type: '本气' }],
  '戌': [{ stem: '戊', weight: 60, type: '本气' }, { stem: '辛', weight: 20, type: '中气' }, { stem: '丁', weight: 20, type: '余气' }],
  '亥': [{ stem: '壬', weight: 60, type: '本气' }, { stem: '甲', weight: 40, type: '中气' }]
};

// Unsur tiap Heavenly Stem
const STEM_ELEMENT = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

// Unsur tiap Earthly Branch
const BRANCH_ELEMENT = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// Polaritas Heavenly Stem (Yang=奇, Yin=偶)
const STEM_POLARITY = {
  '甲': 'Yang', '乙': 'Yin', '丙': 'Yang', '丁': 'Yin',
  '戊': 'Yang', '己': 'Yin', '庚': 'Yang', '辛': 'Yin',
  '壬': 'Yang', '癸': 'Yin'
};

// Shio per Branch
const BRANCH_SHIO = {
  '子': 'Tikus 🐀', '丑': 'Kerbau 🐂', '寅': 'Macan 🐯', '卯': 'Kelinci 🐇',
  '辰': 'Naga 🐉',  '巳': 'Ular 🐍',   '午': 'Kuda 🐎',  '未': 'Kambing 🐑',
  '申': 'Monyet 🐒','酉': 'Ayam 🐓',   '戌': 'Anjing 🐕','亥': 'Babi 🐗'
};

// Shen Sha calculation bases
// Tian Yi Gui Ren (天乙贵人) — berdasarkan Day Stem
const TIAN_YI = {
  '甲': ['丑', '未'], '戊': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '庚': ['丑', '未'],
  '丁': ['亥', '酉'], '辛': ['午', '寅'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳']
};

// Yi Ma (驿马) — berdasarkan Year/Day Branch
const YI_MA = { '申子辰': '寅', '寅午戌': '申', '亥卯未': '巳', '巳酉丑': '亥' };
function getYiMa(branch) {
  for (const [group, ma] of Object.entries(YI_MA)) {
    if (group.includes(branch)) return ma;
  }
  return null;
}

// Tao Hua (桃花) — berdasarkan Year/Day Branch
const TAO_HUA = { '申子辰': '酉', '寅午戌': '卯', '亥卯未': '子', '巳酉丑': '午' };
function getTaoHua(branch) {
  for (const [group, th] of Object.entries(TAO_HUA)) {
    if (group.includes(branch)) return th;
  }
  return null;
}

// Yang Ren (羊刃) — berdasarkan Day Stem
const YANG_REN = {
  '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳',
  '戊': '午', '己': '巳', '庚': '酉', '辛': '申',
  '壬': '子', '癸': '亥'
};

// Jie Sha (劫煞) — berdasarkan Year Branch group
const JIE_SHA = { '申子辰': '亥', '寅午戌': '巳', '亥卯未': '申', '巳酉丑': '寅' };
function getJieSha(branch) {
  for (const [group, js] of Object.entries(JIE_SHA)) {
    if (group.includes(branch)) return js;
  }
  return null;
}

// Jiang Xing (将星) — berdasarkan Year/Day Branch group
const JIANG_XING = { '申子辰': '子', '寅午戌': '午', '亥卯未': '卯', '巳酉丑': '酉' };
function getJiangXing(branch) {
  for (const [group, jx] of Object.entries(JIANG_XING)) {
    if (group.includes(branch)) return jx;
  }
  return null;
}

// Hong Yan Sha (红艳煞) — berdasarkan Day Stem
const HONG_YAN = {
  '甲': '午', '乙': '午', '丙': '寅', '丁': '未',
  '戊': '辰', '己': '辰', '庚': '戌', '辛': '酉',
  '壬': '子', '癸': '申'
};

// ============================================================
// FUNGSI KALKULASI UTAMA
// ============================================================

/**
 * Hitung chart BaZi lengkap
 * @param {object} params
 * @returns {object} Seluruh data BaZi terstruktur
 */
function calculateBazi(params) {
  const {
    birthYear, birthMonth, birthDay,
    birthHour, birthMinute = 0,
    gender, // 'M' atau 'F'
    zone, longitude, latitude,
    midnightSect = 2,  // aliran子时: 1=hari berikutnya, 2=hari sama (default)
    dayunSect = 2,     // aliran Da Yun: 1=kasar, 2=presisi menit (default)
    unknownHour = false
  } = params;

  const y = parseInt(birthYear), m = parseInt(birthMonth), d = parseInt(birthDay);
  const h = parseInt(birthHour), min = parseInt(birthMinute);

  // Koreksi True Solar Time
  let tstHour = h, tstMinute = min, tstDayOffset = 0, tstNote = '', tstDetails = null;
  if (longitude !== undefined && longitude !== null && longitude !== '') {
    const tst = toTrueSolarTime({ year: y, month: m, day: d, hour: h, minute: min, zone, longitude: parseFloat(longitude) });
    tstHour = tst.hour;
    tstMinute = tst.minute;
    tstDayOffset = tst.dayOffset;
    tstNote = tst.note;
    tstDetails = tst;
  }

  // Sesuaikan tanggal jika TST melewati tengah malam
  let calcDate = new Date(y, m - 1, d + tstDayOffset);
  const calcYear = calcDate.getFullYear();
  const calcMonth = calcDate.getMonth() + 1;
  const calcDay = calcDate.getDate();

  // Buat objek Solar dari lunar-javascript
  const solar = Solar.fromYmdHms(calcYear, calcMonth, calcDay, tstHour, tstMinute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(midnightSect);

  // Ambil Yun (运) untuk Da Yun
  const genderNum = gender === 'M' || gender === 'MALE' || gender === '男' ? 1 : 0;
  const yun = eightChar.getYun(genderNum, dayunSect);

  // ---- EMPAT PILAR ----
  const pillars = {
    year: {
      gan: eightChar.getYearGan(),
      zhi: eightChar.getYearZhi(),
      ganzhi: eightChar.getYear(),
      element_gan: STEM_ELEMENT[eightChar.getYearGan()],
      element_zhi: BRANCH_ELEMENT[eightChar.getYearZhi()],
      polarity: STEM_POLARITY[eightChar.getYearGan()],
      shio: BRANCH_SHIO[eightChar.getYearZhi()],
      nayin: eightChar.getYearNaYin(),
      label: '年柱 (Nián Zhù)'
    },
    month: {
      gan: eightChar.getMonthGan(),
      zhi: eightChar.getMonthZhi(),
      ganzhi: eightChar.getMonth(),
      element_gan: STEM_ELEMENT[eightChar.getMonthGan()],
      element_zhi: BRANCH_ELEMENT[eightChar.getMonthZhi()],
      polarity: STEM_POLARITY[eightChar.getMonthGan()],
      nayin: eightChar.getMonthNaYin(),
      label: '月柱 (Yuè Zhù)'
    },
    day: {
      gan: eightChar.getDayGan(),
      zhi: eightChar.getDayZhi(),
      ganzhi: eightChar.getDay(),
      element_gan: STEM_ELEMENT[eightChar.getDayGan()],
      element_zhi: BRANCH_ELEMENT[eightChar.getDayZhi()],
      polarity: STEM_POLARITY[eightChar.getDayGan()],
      nayin: eightChar.getDayNaYin(),
      label: '日柱 (Rì Zhù)',
      note: 'Batang Langit hari (日干) = Day Master Anda'
    },
    hour: {
      gan: eightChar.getTimeGan(),
      zhi: eightChar.getTimeZhi(),
      ganzhi: eightChar.getTime(),
      element_gan: STEM_ELEMENT[eightChar.getTimeGan()],
      element_zhi: BRANCH_ELEMENT[eightChar.getTimeZhi()],
      polarity: STEM_POLARITY[eightChar.getTimeGan()],
      nayin: eightChar.getTimeNaYin(),
      label: '时柱 (Shí Zhù)'
    }
  };

  const dayMasterStem = pillars.day.gan;
  const dayMasterInfo = DAY_MASTER[dayMasterStem] || {};

  // ---- HIDDEN STEMS (藏干) ----
  const hiddenStems = {};
  for (const [pName, pillar] of Object.entries(pillars)) {
    const branch = pillar.zhi;
    const stems = HIDDEN_STEMS[branch] || [];
    hiddenStems[pName] = {
      branch,
      stems: stems.map(s => ({
        ...s,
        element: STEM_ELEMENT[s.stem],
        tenGod: computeTenGod(dayMasterStem, s.stem)
      }))
    };
  }

  // ---- WU XING DISTRIBUSI ----
  const wuXingScores = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  // Bobot: Gan = 10 poin, Zhi (dari hidden stems berbobot)
  for (const pillar of Object.values(pillars)) {
    wuXingScores[pillar.element_gan] = (wuXingScores[pillar.element_gan] || 0) + 10;
    const hs = HIDDEN_STEMS[pillar.zhi] || [];
    for (const s of hs) {
      const el = STEM_ELEMENT[s.stem];
      wuXingScores[el] = (wuXingScores[el] || 0) + (s.weight / 10);
    }
  }
  const totalScore = Object.values(wuXingScores).reduce((a, b) => a + b, 0);
  const wuXingDistribution = {};
  for (const [el, score] of Object.entries(wuXingScores)) {
    wuXingDistribution[el] = {
      score: Math.round(score * 10) / 10,
      pct: Math.round((score / totalScore) * 100),
      info: WU_XING[el]
    };
  }

  // Identifikasi unsur dominan, lemah, dan Yong Shen
  const sorted = Object.entries(wuXingDistribution).sort((a, b) => b[1].score - a[1].score);
  const dominantElement = sorted[0][0];
  const weakestElement  = sorted[sorted.length - 1][0];
  const ELEMENT_PRODUCES = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const ELEMENT_CONTROLS = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
  const ELEMENT_FEEDS    = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' };
  const dmElement = STEM_ELEMENT[dayMasterStem];

  // ========== LAYER 1: 月令 (Yue Ling) Weighted DM Strength ==========
  // Standard 旺相休囚死 table: seasonal strength of each element in each month branch
  // 旺=4(own season), 相=3(feeds into), 休=2(produced DM), 囚=1.5(controls season), 死=1(controlled by season)
  const YUELIGN = {
    '子': {'木':3,'火':1,'土':1.5,'金':2,'水':4},  // Water season (旺)
    '丑': {'木':1.5,'火':2,'土':4,'金':3,'水':1},  // Earth season — end of Winter
    '寅': {'木':4,'火':3,'土':1,'金':1.5,'水':2},  // Wood season (旺)
    '卯': {'木':4,'火':3,'土':1,'金':1.5,'水':2},  // Wood season (旺)
    '辰': {'木':1.5,'火':2,'土':4,'金':3,'水':1},  // Earth season — end of Spring
    '巳': {'木':2,'火':4,'土':3,'金':1,'水':1.5},  // Fire season (旺)
    '午': {'木':2,'火':4,'土':3,'金':1,'水':1.5},  // Fire season (旺)
    '未': {'木':1.5,'火':2,'土':4,'金':3,'水':1},  // Earth season — end of Summer
    '申': {'木':1,'火':1.5,'土':2,'金':4,'水':3},  // Metal season (旺)
    '酉': {'木':1,'火':1.5,'土':2,'金':4,'水':3},  // Metal season (旺)
    '戌': {'木':1.5,'火':2,'土':4,'金':3,'水':1},  // Earth season — end of Autumn
    '亥': {'木':3,'火':1,'土':1.5,'金':2,'水':4}   // Water season (旺)
  };

  // elemScore: how much does element 'el' support (+) or drain (-) the DM element
  function elemScoreDM(el, dmEl) {
    if (el === dmEl) return 1.0;                          // 比劫: same element
    if (ELEMENT_PRODUCES[el] === dmEl) return 0.75;     // 印星: el produces DM
    if (ELEMENT_PRODUCES[dmEl] === el) return -0.5;     // 食伤: DM produces el
    if (ELEMENT_CONTROLS[dmEl] === el) return -0.75;    // 财星: DM controls el
    if (ELEMENT_CONTROLS[el] === dmEl) return -1.0;     // 官杀: el controls DM
    return 0;
  }

  const monthBranch = pillars.month.zhi;
  const yueLingScore = YUELIGN[monthBranch]?.[dmElement] ?? 2;
  // Yue Ling weight: Month Branch gets 3× base multiplied by Yue Ling factor (0.5–2.0)
  // yueLingFactor: 旺(4)→2.0, 相(3)→1.5, 休(2)→1.0, 囚(1.5)→0.75, 死(1)→0.5
  const yueLingMultiplier = yueLingScore / 2;

  let supScore = 0, drnScore = 0;
  // Heavenly Stems (excluding Day Master itself):
  const stemWeights = [
    { el: STEM_ELEMENT[pillars.year.gan],  w: 1.0 },
    { el: STEM_ELEMENT[pillars.month.gan], w: 2.0 },
    { el: STEM_ELEMENT[pillars.hour.gan],  w: unknownHour ? 0 : 1.5 }
  ];
  for (const { el, w } of stemWeights) {
    const s = elemScoreDM(el, dmElement);
    if (s > 0) supScore += s * w; else drnScore += Math.abs(s) * w;
  }
  // Earthly Branches via Hidden Stems:
  // Month Branch gets 3× weight × Yue Ling multiplier (THE most important factor)
  const branchWeights = [
    { zhi: pillars.year.zhi,  w: 1.0 },
    { zhi: pillars.month.zhi, w: 3.0 * yueLingMultiplier },
    { zhi: pillars.day.zhi,   w: 2.0 },
    { zhi: pillars.hour.zhi,  w: unknownHour ? 0 : 1.5 }
  ];
  for (const { zhi, w } of branchWeights) {
    const hidden = HIDDEN_STEMS[zhi] || [];
    for (const hs of hidden) {
      const s = elemScoreDM(STEM_ELEMENT[hs.stem], dmElement);
      const wt = w * (hs.weight / 100);
      if (s > 0) supScore += s * wt; else drnScore += Math.abs(s) * wt;
    }
  }
  // ========== LAYER 5: 天干五合 (Stem Combinations) ==========
  const STEM_HE={'甲':'己','己':'甲','乙':'庚','庚':'乙','丙':'辛','辛':'丙','丁':'壬','壬':'丁','戊':'癸','癸':'戊'};
  const STEM_HUA_MAP={'甲己':'土','己甲':'土','乙庚':'金','庚乙':'金','丙辛':'水','辛丙':'水','丁壬':'木','壬丁':'木','戊癸':'火','癸戊':'火'};
  const allCharStems=[
    {stem:pillars.year.gan,w:1.0,pos:'year'},{stem:pillars.month.gan,w:2.0,pos:'month'},
    {stem:dayMasterStem,w:0,pos:'day'},{stem:unknownHour?null:pillars.hour.gan,w:unknownHour?0:1.5,pos:'hour'}
  ].filter(x=>x.stem);
  const stemCombos=[];
  for(let i=0;i<allCharStems.length;i++){
    for(let j=i+1;j<allCharStems.length;j++){
      const a=allCharStems[i],b=allCharStems[j];
      if(STEM_HE[a.stem]===b.stem){
        const huaEl=STEM_HUA_MAP[a.stem+b.stem]||null;
        stemCombos.push({s1:a.stem,s2:b.stem,hua:huaEl,w1:a.w,w2:b.w,pos:[a.pos,b.pos]});
        if(a.pos!=='day'&&b.pos!=='day'){
          const e1=elemScoreDM(STEM_ELEMENT[a.stem],dmElement);
          const e2=elemScoreDM(STEM_ELEMENT[b.stem],dmElement);
          if(e1>0)supScore=Math.max(0,supScore-Math.abs(e1)*a.w*0.3);
          else drnScore=Math.max(0,drnScore-Math.abs(e1)*a.w*0.3);
          if(e2>0)supScore=Math.max(0,supScore-Math.abs(e2)*b.w*0.3);
          else drnScore=Math.max(0,drnScore-Math.abs(e2)*b.w*0.3);
          if(huaEl){
            const hs=elemScoreDM(huaEl,dmElement),hw=(a.w+b.w)/2*0.6;
            if(hs>0)supScore+=hs*hw; else drnScore+=Math.abs(hs)*hw;
          }
        }
      }
    }
  }
  // ========== LAYER 6: 地支三合局 (Branch Three-Harmony) ==========
  const BRANCH_TRIO_MAP=[
    {set:['申','子','辰'],element:'水',name:'申子辰三合水局'},
    {set:['寅','午','戌'],element:'火',name:'寅午戌三合火局'},
    {set:['巳','酉','丑'],element:'金',name:'巳酉丑三合金局'},
    {set:['亥','卯','未'],element:'木',name:'亥卯未三合木局'}
  ];
  const chartBranches4=[pillars.year.zhi,pillars.month.zhi,pillars.day.zhi];
  if(!unknownHour)chartBranches4.push(pillars.hour.zhi);
  const branchSet4=new Set(chartBranches4);
  const branchCombos=[];
  for(const trio of BRANCH_TRIO_MAP){
    const present=trio.set.filter(b=>branchSet4.has(b));
    const score=elemScoreDM(trio.element,dmElement);
    if(present.length===3){
      branchCombos.push({type:'三合',name:trio.name,element:trio.element,branches:present,strength:'full'});
      if(score>0)supScore+=Math.abs(score)*2.0; else drnScore+=Math.abs(score)*2.0;
    }else if(present.length===2&&present.includes(pillars.month.zhi)){
      const halfName=trio.name.replace('三合','半合(月令)');
      branchCombos.push({type:'半三合',name:halfName,element:trio.element,branches:present,strength:'half'});
      if(score>0)supScore+=Math.abs(score)*0.8; else drnScore+=Math.abs(score)*0.8;
    }
  }
  // ========== v4b: DM Strength 5-Level System ==========
  // ratio: sup/(sup+drn) — 0~1 scale
  const total = supScore + drnScore;
  const supRatio = total > 0 ? supScore / total : 0.5;
  // 5 levels: 极旺(≥0.72) 偏旺(≥0.57) 中和(≥0.43) 偏弱(≥0.28) 极弱(<0.28)
  let dmLevel, dmLevelLabel, dmLevelEn;
  if      (supRatio >= 0.72) { dmLevel = 5; dmLevelLabel = '极旺'; dmLevelEn = 'extreme-strong'; }
  else if (supRatio >= 0.57) { dmLevel = 4; dmLevelLabel = '偏旺'; dmLevelEn = 'moderate-strong'; }
  else if (supRatio >= 0.43) { dmLevel = 3; dmLevelLabel = '中和'; dmLevelEn = 'balanced'; }
  else if (supRatio >= 0.28) { dmLevel = 2; dmLevelLabel = '偏弱'; dmLevelEn = 'moderate-weak'; }
  else                        { dmLevel = 1; dmLevelLabel = '极弱'; dmLevelEn = 'extreme-weak'; }
  const isDMStrong = dmLevel >= 4;   // 偏旺 or 极旺
  const isDMWeak   = dmLevel <= 2;   // 偏弱 or 极弱
  const isDMBalanced = dmLevel === 3; // 中和

  const dmStrengthDetail={
    sup:Math.round(supScore*10)/10,drn:Math.round(drnScore*10)/10,
    supRatio:Math.round(supRatio*100)/100,
    dmLevel, dmLevelLabel, dmLevelEn,
    yueLing:yueLingScore,
    yueLingLabel:yueLingScore>=4?'旺':yueLingScore>=3?'相':yueLingScore>=2?'休':yueLingScore>=1.5?'囚':'死',
    stemCombos:stemCombos.map(c=>c.s1+c.s2+'合'+(c.hua||'?')),
    branchCombos:branchCombos.map(c=>c.name)
  };

  // Yong Shen base — depends on DM level:
  // 极旺/偏旺 → 食伤 (drain excess) OR 财 (spend energy)
  // 中和 → 官 (structure) or 财 (wealth) — use dominant element's克 as target
  // 偏弱/极弱 → 印 (support DM) or 比劫 (companions)
  let yongShen;
  if (isDMStrong) {
    yongShen = ELEMENT_PRODUCES[dmElement]; // 食伤: DM generates
  } else if (isDMBalanced) {
    // 中和: chart is self-sustaining. Yong Shen = 官 (element that CONTROLS DM = structure)
    // 官 = ELEMENT_CONTROLLED_BY[dmElement] (e.g. 土 for 水DM — Earth controls Water)
    // NOT ELEMENT_CONTROLS[dmElement] which gives 财 (what DM controls)
    // 官 = element that controls DM: reverse-lookup ELEMENT_CONTROLS to find which element 克s DM
    // e.g. ELEMENT_CONTROLS['土']='水' → Earth controls Water → 官 for 水DM = 土
    const guanEl = Object.entries(ELEMENT_CONTROLS).find(([k,v]) => v === dmElement)?.[0]
                   || ELEMENT_FEEDS[dmElement]; // fallback to 印 if lookup fails
    yongShen = guanEl; // 中和 prefers 官 for life structure
  } else {
    yongShen = ELEMENT_FEEDS[dmElement]; // 印: feeds/generates DM
  }

  // ========== LAYER 2: 调候 (Tiao Hou) — Per-DM Classical Table ==========
  // 三命通会/子平真诠: each DM has specific 调候 per month branch.
  // Key insight: e.g. 癸水 in 巳月 needs 庚辛金 (Metal→Water), NOT more Water.
  const TIAO_HOU_PER_DM = {
    '甲':{'子':{primary:'火',secondary:'水',stems:['丙','癸'],label:'甲木子月: 丙火暖局，癸水滋木'},'丑':{primary:'火',secondary:'水',stems:['丙','癸'],label:'甲木丑月: 丙火解冻最急'},'寅':{primary:'火',secondary:'土',stems:['丙','癸'],label:'甲木寅月: 丙火暖木，癸水滋润'},'卯':{primary:'金',secondary:'火',stems:['庚','丙'],label:'甲木卯月: 庚金修剪，丙火调候'},'辰':{primary:'金',secondary:'水',stems:['庚','壬'],label:'甲木辰月: 庚金制木，壬水润之'},'巳':{primary:'水',secondary:'金',stems:['癸','庚'],label:'甲木巳月: 夏木易燥，癸水滋润，庚金生水'},'午':{primary:'水',secondary:'金',stems:['癸','庚'],label:'甲木午月: 烈日炎炎，癸水解渴最急'},'未':{primary:'水',secondary:'金',stems:['癸','庚'],label:'甲木未月: 三伏热极，癸水庚金并用'},'申':{primary:'火',secondary:'水',stems:['丁','壬'],label:'甲木申月: 秋金克木，丁火制金护木'},'酉':{primary:'金',secondary:'火',stems:['庚','丙'],label:'甲木酉月: 金旺过多须丙火解之'},'戌':{primary:'水',secondary:'金',stems:['壬','庚'],label:'甲木戌月: 燥土伤木，壬水润土'},'亥':{primary:'火',secondary:'金',stems:['丙','庚'],label:'甲木亥月: 冬水泛滥，丙火暖局为急'}},
    '乙':{'子':{primary:'火',secondary:null,stems:['丙'],label:'乙木子月: 隆冬寒极，丙火暖局最急'},'丑':{primary:'火',secondary:'水',stems:['丙','癸'],label:'乙木丑月: 丙火解冻，癸水滋润'},'寅':{primary:'火',secondary:'水',stems:['丙','癸'],label:'乙木寅月: 春寒料峭，丙火为主'},'卯':{primary:'火',secondary:'水',stems:['丙','癸'],label:'乙木卯月: 木旺调候，丙火癸水并用'},'辰':{primary:'水',secondary:'火',stems:['癸','丙'],label:'乙木辰月: 癸水滋木，丙火暖局'},'巳':{primary:'水',secondary:'火',stems:['癸','丙'],label:'乙木巳月: 夏火炎，癸水浇灌为急'},'午':{primary:'水',secondary:'火',stems:['癸','丙'],label:'乙木午月: 乙木被灼，癸水为命'},'未':{primary:'水',secondary:'火',stems:['癸','丙'],label:'乙木未月: 燥土焦木，癸水润之'},'申':{primary:'火',secondary:'水',stems:['丙','癸'],label:'乙木申月: 金旺克木，丙火化金护木'},'酉':{primary:'水',secondary:'火',stems:['癸','丙'],label:'乙木酉月: 金克木，癸水生木护根'},'戌':{primary:'水',secondary:'火',stems:['癸','丙'],label:'乙木戌月: 燥土克水，癸水为先'},'亥':{primary:'火',secondary:null,stems:['丙'],label:'乙木亥月: 冬木最需丙火照暖'}},
    '丙':{'子':{primary:'水',secondary:'土',stems:['壬','戊'],label:'丙火子月: 壬水为财，戊土制水护火'},'丑':{primary:'木',secondary:'水',stems:['甲','壬'],label:'丙火丑月: 甲木生火，壬水为财'},'寅':{primary:'水',secondary:'金',stems:['壬','庚'],label:'丙火寅月: 火相月，壬水为财最重'},'卯':{primary:'水',secondary:'金',stems:['壬','庚'],label:'丙火卯月: 壬水为财，庚金生水'},'辰':{primary:'木',secondary:'水',stems:['甲','壬'],label:'丙火辰月: 甲木疏土生火，壬水为财'},'巳':{primary:'水',secondary:'金',stems:['壬','庚'],label:'丙火巳月: 火旺，壬水制之最要'},'午':{primary:'水',secondary:'金',stems:['壬','庚'],label:'丙火午月: 烈火，壬水调候最急'},'未':{primary:'水',secondary:'金',stems:['壬','庚'],label:'丙火未月: 热极，壬水庚金调候'},'申':{primary:'水',secondary:'土',stems:['壬','戊'],label:'丙火申月: 秋火弱，壬水为财，戊土护火'},'酉':{primary:'木',secondary:'水',stems:['甲','壬'],label:'丙火酉月: 甲木生火，壬水为财'},'戌':{primary:'木',secondary:'水',stems:['甲','壬'],label:'丙火戌月: 土旺晦火，甲木疏土'},'亥':{primary:'木',secondary:'水',stems:['甲','壬'],label:'丙火亥月: 冬水旺，甲木化水生火'}},
    '丁':{'子':{primary:'木',secondary:'金',stems:['甲','庚'],label:'丁火子月: 甲木引火，庚金劈木点燃'},'丑':{primary:'木',secondary:'金',stems:['甲','庚'],label:'丁火丑月: 寒冬，甲木庚金并用'},'寅':{primary:'木',secondary:'金',stems:['甲','庚'],label:'丁火寅月: 甲木生丁，庚金劈柴'},'卯':{primary:'金',secondary:'木',stems:['庚','甲'],label:'丁火卯月: 庚金劈木引丁，甲木为薪'},'辰':{primary:'木',secondary:'金',stems:['甲','庚'],label:'丁火辰月: 甲木为薪，庚金相佐'},'巳':{primary:'木',secondary:'金',stems:['甲','庚'],label:'丁火巳月: 甲木庚金并用，壬水调候'},'午':{primary:'水',secondary:'金',stems:['壬','庚'],label:'丁火午月: 火极，壬水调候为要'},'未':{primary:'木',secondary:'水',stems:['甲','壬'],label:'丁火未月: 甲木生丁，壬水调候'},'申':{primary:'木',secondary:'火',stems:['甲','丙'],label:'丁火申月: 秋气寒，甲木丙火助丁'},'酉':{primary:'木',secondary:'火',stems:['甲','丙'],label:'丁火酉月: 甲木生丁，丙火照暖'},'戌':{primary:'木',secondary:'火',stems:['甲','丙'],label:'丁火戌月: 甲木疏土，丙火协助'},'亥':{primary:'木',secondary:'金',stems:['甲','庚'],label:'丁火亥月: 冬水旺，急需甲木引丁火'}},
    '戊':{'子':{primary:'火',secondary:'木',stems:['丙','甲'],label:'戊土子月: 冻土，丙火解冻，甲木疏松'},'丑':{primary:'火',secondary:'木',stems:['丙','甲'],label:'戊土丑月: 寒湿土，丙火暖燥为要'},'寅':{primary:'火',secondary:'木',stems:['丙','甲'],label:'戊土寅月: 丙火暖土，甲木疏土'},'卯':{primary:'火',secondary:'木',stems:['丙','甲'],label:'戊土卯月: 丙火化木生土，甲木疏之'},'辰':{primary:'木',secondary:'火',stems:['甲','丙'],label:'戊土辰月: 土旺，甲木疏土最急'},'巳':{primary:'木',secondary:'水',stems:['甲','壬'],label:'戊土巳月: 土燥，甲木疏松，壬水润之'},'午':{primary:'水',secondary:'木',stems:['壬','甲'],label:'戊土午月: 燥热，壬水润土，甲木疏松'},'未':{primary:'水',secondary:'火',stems:['癸','丙'],label:'戊土未月: 三伏热土，癸水润燥'},'申':{primary:'火',secondary:'木',stems:['丙','甲'],label:'戊土申月: 秋凉，丙火温土，甲木疏松'},'酉':{primary:'火',secondary:'水',stems:['丙','癸'],label:'戊土酉月: 丙火暖土，癸水滋润'},'戌':{primary:'木',secondary:'水',stems:['甲','壬'],label:'戊土戌月: 燥土旺月，甲木癸水为用'},'亥':{primary:'火',secondary:'木',stems:['丙','甲'],label:'戊土亥月: 寒冬，丙火暖土最急'}},
    '己':{'子':{primary:'火',secondary:'木',stems:['丙','甲'],label:'己土子月: 湿冷，丙火暖土为主'},'丑':{primary:'火',secondary:'木',stems:['丙','甲'],label:'己土丑月: 冰冻，丙火解冻急迫'},'寅':{primary:'火',secondary:'水',stems:['丙','癸'],label:'己土寅月: 丙火暖土，癸水润燥'},'卯':{primary:'火',secondary:'水',stems:['丙','癸'],label:'己土卯月: 木旺克土，丙火化木生土'},'辰':{primary:'火',secondary:'木',stems:['丙','甲'],label:'己土辰月: 土旺，丙火癸水调节'},'巳':{primary:'水',secondary:'火',stems:['癸','丙'],label:'己土巳月: 燥热，癸水润己土'},'午':{primary:'水',secondary:'火',stems:['癸','丙'],label:'己土午月: 热极，癸水最为急需'},'未':{primary:'水',secondary:'火',stems:['癸','丙'],label:'己土未月: 燥土，癸水润之'},'申':{primary:'火',secondary:'水',stems:['丙','癸'],label:'己土申月: 秋凉，丙火温暖'},'酉':{primary:'火',secondary:'水',stems:['丙','癸'],label:'己土酉月: 丙火暖局，癸水滋润'},'戌':{primary:'木',secondary:'水',stems:['甲','癸'],label:'己土戌月: 燥土旺月，甲木疏土'},'亥':{primary:'火',secondary:'木',stems:['丙','甲'],label:'己土亥月: 寒湿，丙火急需，甲木疏松'}},
    '庚':{'子':{primary:'火',secondary:'土',stems:['丁','甲'],label:'庚金子月: 丁火煅金为先，甲木引丁'},'丑':{primary:'火',secondary:'木',stems:['丁','甲'],label:'庚金丑月: 寒冬，丁火煅冷金'},'寅':{primary:'土',secondary:'木',stems:['戊','丁'],label:'庚金寅月: 戊土培金，丁火温煅'},'卯':{primary:'火',secondary:'木',stems:['丁','甲'],label:'庚金卯月: 丁火炼庚，甲木引丁'},'辰':{primary:'木',secondary:'火',stems:['甲','丁'],label:'庚金辰月: 甲木引丁，丁火煅金'},'巳':{primary:'水',secondary:'土',stems:['壬','戊'],label:'庚金巳月: 火旺，壬水解热，戊土护根'},'午':{primary:'水',secondary:'水',stems:['壬','癸'],label:'庚金午月: 热极，壬水癸水调候'},'未':{primary:'火',secondary:'木',stems:['丁','甲'],label:'庚金未月: 丁火炼金成器，甲木引丁'},'申':{primary:'火',secondary:'水',stems:['丁','壬'],label:'庚金申月: 金旺宜丁火煅练'},'酉':{primary:'火',secondary:'木',stems:['丁','甲'],label:'庚金酉月: 金极旺，丁火陶冶为要'},'戌':{primary:'木',secondary:'水',stems:['甲','壬'],label:'庚金戌月: 甲木引丁，壬水调候'},'亥':{primary:'火',secondary:'木',stems:['丁','甲'],label:'庚金亥月: 冬寒，丁火煅金暖局'}},
    '辛':{'子':{primary:'水',secondary:'木',stems:['壬','甲'],label:'辛金子月: 壬水洗金，甲木疏水'},'丑':{primary:'水',secondary:'火',stems:['壬','丙'],label:'辛金丑月: 壬水流通，丙火暖局'},'寅':{primary:'土',secondary:'水',stems:['己','壬'],label:'辛金寅月: 己土生金，壬水流通'},'卯':{primary:'水',secondary:'木',stems:['壬','甲'],label:'辛金卯月: 壬水洗净辛金'},'辰':{primary:'水',secondary:'木',stems:['壬','甲'],label:'辛金辰月: 壬水流通，甲木疏土'},'巳':{primary:'水',secondary:'水',stems:['壬','癸'],label:'辛金巳月: 夏热，壬癸水调候解热'},'午':{primary:'水',secondary:'金',stems:['壬','庚'],label:'辛金午月: 火旺，壬水为急，庚金辅助'},'未':{primary:'水',secondary:'金',stems:['壬','庚'],label:'辛金未月: 燥热，壬水庚金为用'},'申':{primary:'水',secondary:'木',stems:['壬','甲'],label:'辛金申月: 壬水洗金，甲木流通秀气'},'酉':{primary:'水',secondary:'木',stems:['壬','甲'],label:'辛金酉月: 金旺，壬水泄秀'},'戌':{primary:'水',secondary:'火',stems:['壬','丙'],label:'辛金戌月: 壬水流通，丙火调候'},'亥':{primary:'水',secondary:'火',stems:['壬','丙'],label:'辛金亥月: 壬水洗金，丙火调节'}},
    '壬':{'子':{primary:'金',secondary:'土',stems:['庚','戊'],label:'壬水子月: 水旺须戊土堤防，庚金为水源'},'丑':{primary:'火',secondary:'木',stems:['丙','甲'],label:'壬水丑月: 寒冬，丙火调候为先'},'寅':{primary:'土',secondary:'金',stems:['戊','庚'],label:'壬水寅月: 戊土堤防，庚金生水'},'卯':{primary:'土',secondary:'金',stems:['戊','庚'],label:'壬水卯月: 戊土制水，庚金生水'},'辰':{primary:'木',secondary:'金',stems:['甲','庚'],label:'壬水辰月: 甲木疏土引水，庚金生水'},'巳':{primary:'金',secondary:'水',stems:['庚','壬'],label:'壬水巳月: 庚金生水源，再取壬水助力'},'午':{primary:'金',secondary:'水',stems:['庚','癸'],label:'壬水午月: 庚金生水，癸水助壬'},'未':{primary:'金',secondary:'木',stems:['辛','甲'],label:'壬水未月: 辛金生水，甲木疏土'},'申':{primary:'土',secondary:'火',stems:['戊','丁'],label:'壬水申月: 金水旺，戊土堤防为急'},'酉':{primary:'木',secondary:'火',stems:['甲','丁'],label:'壬水酉月: 甲木疏水，丁火调候'},'戌':{primary:'木',secondary:'火',stems:['甲','丙'],label:'壬水戌月: 甲木引水，丙火调候'},'亥':{primary:'土',secondary:'木',stems:['戊','甲'],label:'壬水亥月: 水旺泛滥，戊土堤防最急'}},
    '癸':{'子':{primary:'火',secondary:'金',stems:['丙','辛'],label:'癸水子月: 丙火调候解寒，辛金滋水源'},'丑':{primary:'火',secondary:'金',stems:['丙','辛'],label:'癸水丑月: 丙火暖局，辛金生水'},'寅':{primary:'金',secondary:'火',stems:['辛','丙'],label:'癸水寅月: 辛金生水为先，丙火调候次之'},'卯':{primary:'金',secondary:'火',stems:['辛','丙'],label:'癸水卯月: 辛金生水，丙火暖局'},'辰':{primary:'火',secondary:'金',stems:['丙','辛'],label:'癸水辰月: 丙火调候，辛金生水'},'巳':{primary:'金',secondary:'金',stems:['庚','辛'],label:'癸水巳月: 夏热水干，庚辛金生水源最急(非直接加水!)'},'午':{primary:'金',secondary:'金',stems:['庚','辛'],label:'癸水午月: 火旺水弱，庚辛金生水最急'},'未':{primary:'金',secondary:'金',stems:['庚','辛'],label:'癸水未月: 燥极，庚辛金生水，润枯救急'},'申':{primary:'火',secondary:'火',stems:['丁','丙'],label:'癸水申月: 水金旺，丁丙火调候'},'酉':{primary:'火',secondary:'金',stems:['丙','辛'],label:'癸水酉月: 丙火调候，辛金生水'},'戌':{primary:'金',secondary:'火',stems:['辛','丙'],label:'癸水戌月: 辛金生水，丙火调候'},'亥':{primary:'金',secondary:'火',stems:['庚','丙'],label:'癸水亥月: 庚金生水，丙丁暖局'}}
  };
  const perDmEntry=TIAO_HOU_PER_DM[dayMasterStem]?.[monthBranch]||null;
  let tiaoHouYS=null;
  if(perDmEntry){
    tiaoHouYS={element:perDmEntry.primary,support:perDmEntry.secondary,stems:perDmEntry.stems,label:perDmEntry.label,monthBranch,dmStem:dayMasterStem};
  }

  // ---- TEN GODS (十神) ----
  const tenGods = {
    year_gan:  { pillar: '年干', stem: pillars.year.gan,  god: computeTenGod(dayMasterStem, pillars.year.gan),  info: null },
    month_gan: { pillar: '月干', stem: pillars.month.gan, god: computeTenGod(dayMasterStem, pillars.month.gan), info: null },
    day_gan:   { pillar: '日干', stem: pillars.day.gan,   god: '日主 (Day Master)',                              info: dayMasterInfo },
    hour_gan:  { pillar: '时干', stem: pillars.hour.gan,  god: computeTenGod(dayMasterStem, pillars.hour.gan),  info: null }
  };
  // Tambah info Ten God
  for (const tg of Object.values(tenGods)) {
    if (TEN_GODS[tg.god]) tg.info = TEN_GODS[tg.god];
  }

  // Ten Gods dari Hidden Stems (agregat berbobot)
  const tenGodAggregate = {};
  for (const [pName, hs] of Object.entries(hiddenStems)) {
    for (const s of hs.stems) {
      const tg = s.tenGod;
      if (!tenGodAggregate[tg]) tenGodAggregate[tg] = { totalWeight: 0, pillars: [] };
      tenGodAggregate[tg].totalWeight += s.weight;
      tenGodAggregate[tg].pillars.push(`${pName}宫-${s.stem}(${s.weight}%)`);
      if (!tenGodAggregate[tg].info && TEN_GODS[tg]) tenGodAggregate[tg].info = TEN_GODS[tg];
    }
  }
  const dominantTenGod = Object.entries(tenGodAggregate)
    .sort((a, b) => b[1].totalWeight - a[1].totalWeight)[0];

  // ========== v4a: 格局 (Gé Jú) Chart Structure Detection ==========
  // 格局 determines the TRUE pattern of the chart — overrides simple DM-strong/weak Yong Shen
  // Source: 子平真诠, 穷通宝鉴. Month branch 本气 determines 格局 type.
  const YUEZHENG_FORMAT = {
    // month branch → {格: name, 用神 category, 喜: what helps, 忌: what hurts}
    '子':{ ge:'壬水格',type:'印',tenGod:'正印',positive:['木','金'],negative:['土','火'] },
    '丑':{ ge:'己土格',type:'印',tenGod:'偏印',positive:['火','木'],negative:['水','金'] },
    '寅':{ ge:'甲木格',type:'印',tenGod:'正印',positive:['水','火'],negative:['金','土'] },
    '卯':{ ge:'乙木格',type:'印',tenGod:'偏印',positive:['水','火'],negative:['金','土'] },
    '辰':{ ge:'戊土格',type:'印',tenGod:'正印',positive:['火','木'],negative:['水','金'] },
    '巳':{ ge:'丙火格',type:'官',tenGod:'正官',positive:['水','土'],negative:['木'] },
    '午':{ ge:'丁火格',type:'官',tenGod:'偏官',positive:['水','土'],negative:['木'] },
    '未':{ ge:'己土格',type:'印',tenGod:'偏印',positive:['火','木'],negative:['水','金'] },
    '申':{ ge:'庚金格',type:'财',tenGod:'正财',positive:['土','火'],negative:['木','水'] },
    '酉':{ ge:'辛金格',type:'财',tenGod:'偏财',positive:['土','火'],negative:['木','水'] },
    '戌':{ ge:'戊土格',type:'印',tenGod:'正印',positive:['火','木'],negative:['水','金'] },
    '亥':{ ge:'壬水格',type:'印',tenGod:'正印',positive:['木','金'],negative:['土','火'] }
  };
  // Ten-God of month branch 本气 relative to DM → determines 格局 name
  const monthStemHidden = hiddenStems?.month?.stems?.[0]?.stem || null; // 本气 stem
  const TEN_GOD_GE_MAP = {
    '比肩':'建禄格','劫财':'月刃格',
    '食神':'食神格','伤官':'伤官格',
    '正财':'正财格','偏财':'偏财格',
    '正官':'正官格','七杀':'七杀格',
    '正印':'正印格','偏印':'偏印格(枭神格)'
  };
  // Compute ten-god of month branch 本气 stem relative to DM
  function getTenGodRel(stemA, dmStem) {
    const elA = STEM_ELEMENT[stemA], elDM = STEM_ELEMENT[dmStem];
    const samePolarity = (['甲','丙','戊','庚','壬'].includes(stemA)) === (['甲','丙','戊','庚','壬'].includes(dmStem));
    if (elA === elDM) return samePolarity ? '比肩' : '劫财';
    if (ELEMENT_PRODUCES[elA] === elDM) return samePolarity ? '正印' : '偏印';
    if (ELEMENT_PRODUCES[elDM] === elA) return samePolarity ? '伤官' : '食神';
    if (ELEMENT_CONTROLS[elDM] === elA) return samePolarity ? '正财' : '偏财';
    if (ELEMENT_CONTROLS[elA] === elDM) return samePolarity ? '正官' : '七杀';
    return null;
  }
  const monthBenQiTenGod = monthStemHidden ? getTenGodRel(monthStemHidden, dayMasterStem) : null;
  const geJuName = TEN_GOD_GE_MAP[monthBenQiTenGod] || null;

  // 特殊格局: 从格 — DM has almost no support (极弱, < 5% personal qi)
  // 专旺格 — DM element overwhelmingly dominant (>70% distribution)
  const dmDistPct = wuXingDistribution?.[dmElement]?.pct || 0;
  let specialGe = null;
  if (dmLevel === 1 && supRatio < 0.15) {
    // 从格: follow the strongest element
    const strongestEl = Object.entries(wuXingDistribution || {}).sort((a,b)=>b[1].pct-a[1].pct)[0]?.[0];
    specialGe = { type: '从格', name: `从${strongestEl||'?'}格`, followEl: strongestEl,
      yongShen: strongestEl, label: `极弱DM无援 → 从${strongestEl}格，用神随从强者` };
  } else if (dmLevel === 5 && dmDistPct > 65) {
    specialGe = { type: '专旺格', name: `${dayMasterStem}专旺格`, followEl: dmElement,
      yongShen: ELEMENT_PRODUCES[dmElement], label: `DM极旺，专旺格 → 用神食伤泄秀` };
  }

  // Override yongShen priority:
  //   1. DM-strength base (yongShen)
  //   2. 调候 override for extreme season months (when classically authoritative)
  //      — skipped only if 调候 element CONTROLS the DM AND DM is weak (would harm weak DM)
  //   3. specialGe (从格/专旺格) takes absolute final priority
  const EXTREME_SEASON_MONTHS = ['巳','午','未','子','丑','亥']; // full summer + deep winter
  const tiaoHouControlsDM = tiaoHouYS
    ? (ELEMENT_CONTROLS[tiaoHouYS.element] === dmElement)  // tiaoHouYS element 克s DM
    : false;
  const applyTiaoHou = tiaoHouYS
    && EXTREME_SEASON_MONTHS.includes(monthBranch)
    && !(tiaoHouControlsDM && isDMWeak);  // don't harm already-weak DM with its controller
  let yongShenFinal = yongShen;
  if (applyTiaoHou)  yongShenFinal = tiaoHouYS.element;         // 调候 seasonal override
  if (specialGe)     yongShenFinal = specialGe.yongShen || yongShenFinal; // 格局 final priority

  const geJuInfo = {
    name: specialGe ? specialGe.name : (geJuName || '普通格'),
    type: specialGe ? specialGe.type : (monthBenQiTenGod || ''),
    monthBenQi: monthStemHidden || '',
    monthBenQiTenGod: monthBenQiTenGod || '',
    specialGe: specialGe || null,
    yongShenOverride: specialGe ? specialGe.yongShen : null,
    label: specialGe ? specialGe.label : `月令本气${monthStemHidden}(${monthBenQiTenGod}) → ${geJuName||'未知格'}`,
  };



  // ====== v5a: Six-God System (六神体系) — 忌神/仇神 ======
  // Classical BaZi has 6 categories relative to 用神:
  // 用神(yong) 喜神(xi) 忌神(ji) 仇神(chou) 原神(yuan) 闲神(xian)
  const ELEMENT_CONTROLLED_BY = { '木':'金','火':'水','土':'木','金':'火','水':'土' };
  function computeSixGodSystem(dmEl, yongEl) {
    const xiShen   = ELEMENT_FEEDS[yongEl];            // what produces 用神
    const jiShen   = ELEMENT_CONTROLLED_BY[yongEl];   // what attacks 用神 (AVOID)
    const chouShen = ELEMENT_FEEDS[jiShen];            // what produces 忌神 (ENEMY)
    const yuanShen = ELEMENT_FEEDS[xiShen];            // what produces 喜神
    const all5 = ['木','火','土','金','水'];
    const used = new Set([yongEl, xiShen, jiShen, chouShen, yuanShen]);
    const xianShen = all5.find(e => !used.has(e)) || null;
    return { yongShen: yongEl, xiShen, jiShen, chouShen, yuanShen, xianShen };
  }
  const sixGods = computeSixGodSystem(dmElement, yongShenFinal);

  // ====== v5b: 成格/破格 Validation ======
  // Check if the detected 格局 is truly formed (成格) or broken (破格)
  function validateGeJu(geName, tgAgg) {
    const count = (g) => (tgAgg[g]?.totalWeight || 0);
    const hasQiSha   = count('七杀') > 0;
    const hasZGuan   = count('正官') > 0;
    const hasPYin    = count('偏印') > 0;
    const hasShiShen = count('食神') > 0;
    const hasSangGuan= count('伤官') > 0;
    const biJie = count('比肩') + count('劫财');
    const cai   = count('正财') + count('偏财');
    const yin   = count('正印') + count('偏印');
    const guan  = count('正官') + count('七杀');
    let valid = true, reason = '格局成立', note = '';
    if (geName === '食神格') {
      if (hasPYin)                         { valid=false; reason='偏印夺食，格局被破'; note='枭神克制食神，化解生财之道'; }
      else if (hasQiSha && !hasShiShen)    { valid=false; reason='食神格逢七杀无制'; note='七杀乘虚而入，需印星制化'; }
      else                                 { reason='食神格成立，生财有道'; }
    } else if (geName === '七杀格') {
      if (hasShiShen || yin > 0)           { reason='七杀有制(食神/印星)，威权显赫'; }
      else                                 { valid=false; reason='七杀无制，性情偏激'; note='需食神或印星制化七杀方能成格'; }
    } else if (geName === '正官格') {
      if (hasQiSha)                        { valid=false; reason='官杀混杂，功名受阻'; note='正官与七杀并现，浊乱不清'; }
      else if (guan > 40)                  { valid=false; reason='官多为鬼，压力过重'; note='官星过重反成束缚'; }
      else                                 { reason='正官格清纯，仕途顺遂'; }
    } else if (geName === '伤官格') {
      if (hasZGuan)                        { valid=false; reason='伤官见官(祸患百端)'; note='伤官与正官同现为大忌'; }
      else if (yin > 0)                    { reason='伤官配印，才华横溢'; }
      else if (cai > 0)                    { reason='伤官生财，经营有道'; }
      else                                 { reason='伤官格成立，创意独具'; }
    } else if (geName === '正财格' || geName === '偏财格') {
      if (biJie > 40)                      { valid=false; reason='群劫争财，财来财去'; note='比劫过重分夺财星'; }
      else if (guan > 0)                   { reason='官护财星，财富稳固'; }
      else                                 { reason='财星有力，物质充裕'; }
    } else if (geName === '正印格' || geName === '偏印格(枭神格)') {
      if (cai > 40)                        { valid=false; reason='财多坏印，文印受损'; note='财星过重克制印星'; }
      else if (guan > 0)                   { reason='官生印，贵人扶持'; }
      else                                 { reason='印星清纯，贵人扶持'; }
    } else if (geName === '建禄格') {
      if (guan > 0 || cai > 0)            { reason='建禄格得官财，仕途财运兼备'; }
      else                                 { valid=false; reason='建禄无官财，富贵难成'; note='需正官或财星配合'; }
    } else if (geName === '月刃格') {
      if (guan > 0)                        { reason='阳刃得官制，威权显赫'; }
      else                                 { valid=false; reason='阳刃无制，性情刚猛易生是非'; note='需官杀制化阳刃'; }
    } else {
      reason = '格局成立';
    }
    return { isValid: valid, status: valid ? '成格' : '破格', reason, note };
  }
  const geJuValidation = geJuInfo.specialGe
    ? { isValid: true, status: '成格', reason: geJuInfo.specialGe.type + '已成', note: '' }
    : validateGeJu(geJuInfo.name, tenGodAggregate);


  // ---- DA YUN (大运) — Layer 3: 24 Jieqi method ----
  // Menggunakan semua 24 节气 (bukan hanya 12 节) untuk menghitung usia awal Da Yun
  // Referensi: JH-000 manual report, metode mayoritas software modern
  const daYunArr = yun.getDaYun();
  const currentYear = new Date().getFullYear();

  // 24 Jieqi start age calculation
  let yunStart24 = null;
  try {
    const isForward = yun.isForward(); // true=顺行, false=逆行
    const birthLunar = lunar; // lunar object already computed above
    if (!isForward) {
      // 逆行 (reverse): count minutes from PREVIOUS of ALL 24 jieqi to birth date
      const prevJQ = birthLunar.getPrevJieQi();
      if (prevJQ) {
        const prevJQSolar = prevJQ.getSolar();
        const totalMinutes = solar.subtractMinute(prevJQSolar);
        const y24 = Math.floor(totalMinutes / 4320);
        const rem1 = totalMinutes - y24 * 4320;
        const m24 = Math.floor(rem1 / 360);
        const rem2 = rem1 - m24 * 360;
        const d24 = Math.floor(rem2 / 12);
        yunStart24 = {
          years: y24, months: m24, days: d24,
          totalMinutes,
          jieqiName: prevJQ.getName(),
          jieqiDate: prevJQSolar.toYmd(),
          method: '24节气逆行'
        };
      }
    } else {
      // 顺行 (forward): count minutes from birth date to NEXT of ALL 24 jieqi
      const nextJQ = birthLunar.getNextJieQi();
      if (nextJQ) {
        const nextJQSolar = nextJQ.getSolar();
        const totalMinutes = nextJQSolar.subtractMinute(solar);
        const y24 = Math.floor(totalMinutes / 4320);
        const rem1 = totalMinutes - y24 * 4320;
        const m24 = Math.floor(rem1 / 360);
        const rem2 = rem1 - m24 * 360;
        const d24 = Math.floor(rem2 / 12);
        yunStart24 = {
          years: y24, months: m24, days: d24,
          totalMinutes,
          jieqiName: nextJQ.getName(),
          jieqiDate: nextJQSolar.toYmd(),
          method: '24节气顺行'
        };
      }
    }
  } catch(e24) {
    // fallback: yunStart24 remains null → use library default
  }

  // Compute start age in decimal years for period offset
  const startAge24Decimal = yunStart24
    ? yunStart24.years + yunStart24.months / 12 + yunStart24.days / 365
    : null;
  const startAge24Round = startAge24Decimal !== null ? Math.round(startAge24Decimal) : null;

  const daYuns = daYunArr.map((dy, i) => {
    const gz = dy.getGanZhi();
    const dgStem = gz[0];
    const dgBranch = gz[1];

    let yearStart, yearEnd, ageStart, ageEnd;
    if (startAge24Round !== null && i > 0) {
      // 24 Jieqi override: period i (1-based actual Da Yun) starts at birth year + startAge24Round + (i-1)*10
      ageStart = startAge24Round + (i - 1) * 10 + 1;
      ageEnd   = startAge24Round + i * 10;
      yearStart = calcYear + startAge24Round + (i - 1) * 10;
      yearEnd   = calcYear + startAge24Round + i * 10 - 1;
    } else if (startAge24Round !== null && i === 0) {
      // Pre-Da-Yun period (empty GanZhi): from birth to start of first Da Yun
      ageStart = 1;
      ageEnd   = startAge24Round;
      yearStart = calcYear;
      yearEnd   = calcYear + startAge24Round - 1;
    } else {
      // Fallback to library values
      yearStart = dy.getStartYear();
      yearEnd   = dy.getEndYear();
      ageStart  = dy.getStartAge();
      ageEnd    = dy.getEndAge();
    }

    const isCurrent = currentYear >= yearStart && currentYear <= yearEnd;
    return {
      index: i,
      ganzhi: gz,
      gan: dgStem,
      zhi: dgBranch,
      yearStart,
      yearEnd,
      ageStart,
      ageEnd,
      isCurrent,
      element_gan: STEM_ELEMENT[dgStem],
      element_zhi: BRANCH_ELEMENT[dgBranch],
      quality: evaluateDaYunQuality(dgStem, dgBranch, dayMasterStem, yongShenFinal,
        [pillars.year.zhi, pillars.month.zhi, pillars.day.zhi, ...(unknownHour?[]:[pillars.hour.zhi])])
    };
  });

  // Periode Da Yun saat ini
  const currentDaYun = daYuns.find(dy => dy.isCurrent);

  // ---- SHEN SHA (神煞) ----
  const allBranches = [pillars.year.zhi, pillars.month.zhi, pillars.day.zhi, pillars.hour.zhi];
  const shenSha = computeShenSha(dayMasterStem, pillars.year.zhi, pillars.day.zhi, allBranches);

  // ---- INFORMASI LUNAR ----
  const lunarYear  = lunar.getYear();
  const lunarMonth = lunar.getMonth();
  const lunarDay   = lunar.getDay();

  // ---- BERAT TULANG (骨重法) ----
  const boneWeight = calculateBoneWeight(
    pillars.year.gan,
    pillars.year.zhi,
    Math.abs(lunarMonth), // bulan lunar bisa negatif untuk bulan kabisat
    lunarDay,
    pillars.hour.zhi
  );

  // ---- KUA NUMBER & FENG SHUI ----
  const kuaNumber = calculateKuaNumber(y, gender === 'M' ? 'M' : 'F');
  const kuaData = KUA_DATA[kuaNumber] || KUA_DATA[1];
  const fengshui = {
    kuaNumber,
    group: kuaData.group,
    element: kuaData.element,
    shengQi: { dir: kuaData.sheng_qi, meaning: '生气方 — Arah Kemakmuran & Pertumbuhan' },
    tianYi: { dir: kuaData.tian_yi, meaning: '天医方 — Arah Kesehatan & Pemulihan' },
    yanNian: { dir: kuaData.yan_nian, meaning: '延年方 — Arah Umur Panjang & Harmoni' },
    fuWei:  { dir: kuaData.fu_wei,  meaning: '伏位方 — Arah Stabilitas & Kedamaian' },
    jueMing: { dir: kuaData.jue_ming, meaning: '绝命方 — Arah Terburuk (hindari)' },
    wuGui:  { dir: kuaData.wu_gui,  meaning: '五鬼方 — Arah Gangguan (hindari)' },
    liuSha: { dir: kuaData.liu_sha, meaning: '六煞方 — Arah Konflik (hindari)' },
    huoHai: { dir: kuaData.huo_hai, meaning: '祸害方 — Arah Kerugian (hindari)' },
    luckyColors: kuaData.lucky_colors,
    avoidColors: kuaData.avoid_colors,
    // Aplikasi spesifik per kegunaan (八宅 practical guide)
    applications: {
      rumah: {
        label: '🏠 Arah Hadap Rumah / Pintu Utama',
        best: kuaData.sheng_qi,
        bestLabel: '生气 — kemakmuran & peluang mengalir masuk',
        alt: kuaData.yan_nian,
        altLabel: '延年 — harmoni keluarga & relasi jangka panjang',
        avoid: kuaData.jue_ming,
        avoidLabel: '绝命 — hindari sebisa mungkin untuk pintu masuk'
      },
      tempat_tidur: {
        label: '🛏️ Arah Kepala Tempat Tidur',
        best: kuaData.yan_nian,
        bestLabel: '延年 — tidur nyenyak, hubungan & kesehatan jangka panjang',
        alt: kuaData.tian_yi,
        altLabel: '天医 — pemulihan & kesehatan optimal',
        avoid: kuaData.jue_ming,
        avoidLabel: '绝命 — paling buruk untuk posisi tidur'
      },
      meja_kerja: {
        label: '💼 Arah Wajah di Meja Kerja / Belajar',
        best: kuaData.sheng_qi,
        bestLabel: '生气 — produktivitas, karir & kesempatan maksimal',
        alt: kuaData.fu_wei,
        altLabel: '伏位 — konsentrasi & stabilitas untuk belajar/riset',
        avoid: kuaData.wu_gui,
        avoidLabel: '五鬼 — mengganggu konsentrasi & mengundang hambatan'
      },
      dapur: {
        label: '🍳 Arah Kompor / Dapur',
        best: kuaData.tian_yi,
        bestLabel: '天医 — makanan yang dimasak membawa energi penyembuhan',
        alt: kuaData.yan_nian,
        altLabel: '延年 — keharmonisan keluarga saat makan bersama',
        avoid: kuaData.liu_sha,
        avoidLabel: '六煞 — hindari untuk area memasak'
      },
      pintu_kamar: {
        label: '🚪 Arah Pintu Kamar Tidur',
        best: kuaData.yan_nian,
        bestLabel: '延年 — relasi & keharmonisan pasangan',
        alt: kuaData.tian_yi,
        altLabel: '天医 — mendukung pemulihan & kesehatan',
        avoid: kuaData.huo_hai,
        avoidLabel: '祸害 — mengurangi ketenangan & istirahat'
      },
      meditasi: {
        label: '🧘 Arah Meditasi / Doa / Altar',
        best: kuaData.fu_wei,
        bestLabel: '伏位 — ketenangan & stabilitas spiritual',
        alt: kuaData.tian_yi,
        altLabel: '天医 — koneksi dengan energi penyembuhan',
        avoid: kuaData.wu_gui,
        avoidLabel: '五鬼 — mengganggu ketenangan batin'
      }
    },
    source: '八宅風水 (Eight Mansions Feng Shui) — Kua Number method'
  };

  // ---- PROFESI, BISNIS & SHIO ----
  const careers = CAREER_BY_DAYMASTER[dayMasterStem] || [];
  const businesses = BUSINESS_BY_DAYMASTER[dayMasterStem] || [];
  const businessAvoid = BUSINESS_AVOID_BY_ELEMENT[dominantElement] || [];
  const yearShio = BRANCH_SHIO[pillars.year.zhi] || '';
  const shioKey = Object.keys(SHIO_COMPATIBILITY).find(k => k.includes(pillars.year.zhi));
  const shioCompat = shioKey ? SHIO_COMPATIBILITY[shioKey] : null;

  // ---- RANGKUMAN INTERPRETASI ----
  const interpretation = buildBaziInterpretation({
    dayMasterStem, dayMasterInfo, pillars, wuXingDistribution,
    dominantElement, weakestElement, yongShen, isDMStrong, isDMWeak, isDMBalanced, dmStrengthDetail,
    dominantTenGod, currentDaYun, shenSha, fengshui, careers,
    sixGods, geJu: { name: geJuInfo.name, geJuValidation }
  });

  // ---- WEALTH PROFILING ----
  const structures    = computeStructures(tenGodAggregate);
  const profiles      = computeProfiles(tenGodAggregate);
  const aspects       = computeAspects(wuXingDistribution, tenGodAggregate, shenSha);
  const wealthAnalysis = buildWealthStrategistAnalysis({
    dayMasterStem, dmElement, yongShen, isDMStrong,
    tenGodAggregate, hiddenStems, pillars,
    daYuns, currentDaYun, shenSha, wuXingDistribution
  });

  return {
    meta: {
      inputDate: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} ${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
      trueSolarTime: `${String(tstHour).padStart(2,'0')}:${String(tstMinute).padStart(2,'0')}`,
      tstDetails,
      unknownHour,
      lunarDate: `${lunarYear}年 ${Math.abs(lunarMonth)}月${lunarMonth < 0 ? '(闰)' : ''} ${lunarDay}日`,
      gender: gender === 'M' ? 'Pria (男)' : 'Wanita (女)',
      midnightSect: `Aliran ${midnightSect} (子时 = ${midnightSect === 1 ? 'hari berikutnya' : 'hari yang sama'})`,
      dayunSect: `Aliran ${dayunSect} (${dayunSect === 2 ? 'presisi menit' : 'per hari'})`,
      library: 'lunar-javascript v1.7.7 by 6tail (MIT License)',
      source: 'https://github.com/6tail/lunar-javascript'
    },
    dayMaster: {
      stem: dayMasterStem,
      ...dayMasterInfo
    },
    pillars,
    hiddenStems,
    wuXing: {
      distribution: wuXingDistribution,
      dominant: dominantElement,
      weakest: weakestElement,
      yongShen: yongShenFinal,
      yongShenBase: yongShen,
      tiaoHouYS,
      isDMStrong,
      isDMWeak,
      isDMBalanced,
      dmStrengthDetail,
      geJu: geJuInfo,
      geJuValidation,
      sixGods,
      summary: `Day Master Anda (${dayMasterStem}/${dayMasterInfo.element}) ${dmStrengthDetail.dmLevelLabel} — ${dmStrengthDetail.dmLevelEn} (月令${dmStrengthDetail.yueLingLabel}, rasio=${Math.round(dmStrengthDetail.supRatio*100)}%). 格局: ${geJuInfo.name}[${geJuValidation.status}]. 用神: ${yongShenFinal} (${WU_XING[yongShenFinal]?.name_id}) | 忌神: ${sixGods.jiShen} (${WU_XING[sixGods.jiShen]?.name_id}) | 仇神: ${sixGods.chouShen}${geJuInfo.specialGe?' ['+geJuInfo.specialGe.type+']':''}${tiaoHouYS?' | 调候: '+tiaoHouYS.element:''}` 
    },
    tenGods: {
      byStem: tenGods,
      byHiddenStems: tenGodAggregate,
      dominant: dominantTenGod ? { god: dominantTenGod[0], ...dominantTenGod[1] } : null
    },
    daYun: {
      startInfo: yunStart24 ? {
        startYear: yunStart24.years,
        startMonth: yunStart24.months,
        startDay: yunStart24.days,
        description: `Mulai Da Yun: ${yunStart24.years} tahun ${yunStart24.months} bulan ${yunStart24.days} hari setelah lahir (Metode 24节气, dari ${yunStart24.jieqiName} ${yunStart24.jieqiDate})`,
        method: yunStart24.method,
        jieqiName: yunStart24.jieqiName,
        jieqiDate: yunStart24.jieqiDate
      } : {
        startYear: yun.getStartYear(),
        startMonth: yun.getStartMonth(),
        startDay: yun.getStartDay(),
        startHour: yun.getStartHour(),
        description: `Mulai Da Yun: ${yun.getStartYear()} tahun ${yun.getStartMonth()} bulan ${yun.getStartDay()} hari setelah lahir`
      },
      periods: daYuns,
      current: currentDaYun
    },
    shenSha,
    boneWeight,
    fengshui,
    careers,
    businesses,
    businessAvoid,
    shioCompatibility: shioCompat,
    yearShio,
    interpretation,
    exportPrompt: buildClaudeExportPrompt({
      dayMasterStem, pillars, wuXingDistribution, yongShen, dmStrengthDetail, isDMStrong, isDMWeak, isDMBalanced, daYuns, currentDaYun, shenSha, boneWeight, fengshui, careers, shioCompat, sixGods, geJuValidation, geJuInfo
    }),
    wealthProfiling: { structures, profiles, aspects, wealthAnalysis }
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Hitung Ten God dari Day Master vs Stem lain
 * Sumber: tabel klasik 十神
 */
function computeTenGod(dayMaster, targetStem) {
  if (dayMaster === targetStem) return '比肩';

  const SAME_POLARITY = { '甲':'乙','乙':'甲','丙':'丁','丁':'丙','戊':'己','己':'戊','庚':'辛','辛':'庚','壬':'癸','癸':'壬' };
  const dmEl = STEM_ELEMENT[dayMaster];
  const tEl  = STEM_ELEMENT[targetStem];
  const dmYang = STEM_POLARITY[dayMaster] === 'Yang';
  const tYang  = STEM_POLARITY[targetStem] === 'Yang';
  const samePolarity = dmYang === tYang;

  const PRODUCES = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
  const CONTROLS = { '木':'土','火':'金','土':'水','金':'木','水':'火' };

  // 比劫: 同类 (same element)
  if (dmEl === tEl) return samePolarity ? '比肩' : '劫财';
  // 食伤: DM produces target
  if (PRODUCES[dmEl] === tEl) return samePolarity ? '食神' : '伤官';
  // 财: DM controls target
  if (CONTROLS[dmEl] === tEl) return samePolarity ? '偏财' : '正财';
  // 官杀: target controls DM
  if (CONTROLS[tEl] === dmEl) return samePolarity ? '七杀' : '正官';
  // 印: target produces DM
  if (PRODUCES[tEl] === dmEl) return samePolarity ? '偏印' : '正印';

  return '?';
}

/**
 * Evaluasi kualitas Da Yun terhadap Day Master & Yong Shen
 * v4d: tambah 六冲/六合/三刑 antara Da Yun Zhi vs natal branches
 */
function evaluateDaYunQuality(dyGan, dyZhi, dayMaster, yongShen, natalBranches) {
  const PRODUCES = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
  const CONTROLS = { '木':'土','火':'金','土':'水','金':'木','水':'火' };

  // ---- v4d: 六冲 六合 三刑 maps ----
  const LIU_CHONG = {'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
  const LIU_HE    = {'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'};
  const SAN_XING  = { // 三刑: 寅巳申相刑, 丑戌未持势刑, 子卯无礼刑
    '寅':['巳','申'],'巳':['寅','申'],'申':['寅','巳'],
    '丑':['戌','未'],'戌':['丑','未'],'未':['丑','戌'],
    '子':['卯'],'卯':['子']
  };

  const ganEl = STEM_ELEMENT[dyGan];
  const zhiHidden = HIDDEN_STEMS[dyZhi]?.[0];
  const zhiDomEl = zhiHidden ? STEM_ELEMENT[zhiHidden.stem] : BRANCH_ELEMENT[dyZhi];

  let score = 0;
  let ganDesc = '', zhiDesc = '', interDesc = '';

  // Evaluasi Gan
  if (ganEl === yongShen)              { score += 3; ganDesc = `Gan ${dyGan}(${ganEl})=Yong Shen`; }
  else if (PRODUCES[ganEl] === yongShen) { score += 2; ganDesc = `Gan ${dyGan}(${ganEl}) menghasilkan Yong Shen`; }
  else if (ganEl === STEM_ELEMENT[dayMaster]) { score += 1; ganDesc = `Gan ${dyGan}(${ganEl}) memperkuat DM`; }
  else if (CONTROLS[ganEl] === yongShen) { score -= 2; ganDesc = `Gan ${dyGan}(${ganEl}) menekan Yong Shen`; }
  else { ganDesc = `Gan ${dyGan}(${ganEl}) netral`; }

  // Evaluasi Zhi element
  if (zhiDomEl === yongShen)              { score += 2; zhiDesc = `Zhi ${dyZhi}(${zhiDomEl})=Yong Shen`; }
  else if (PRODUCES[zhiDomEl] === yongShen) { score += 1; zhiDesc = `Zhi ${dyZhi}(${zhiDomEl}) menghasilkan Yong Shen`; }
  else if (zhiDomEl === STEM_ELEMENT[dayMaster]) { score += 1; zhiDesc = `Zhi ${dyZhi} memperkuat DM`; }
  else if (CONTROLS[zhiDomEl] === yongShen) { score -= 1; zhiDesc = `Zhi ${dyZhi}(${zhiDomEl}) menekan Yong Shen`; }
  else { zhiDesc = `Zhi ${dyZhi} netral`; }

  // ---- v4d: Branch interactions with natal chart ----
  const interactions = [];
  if (natalBranches && natalBranches.length > 0) {
    for (const nb of natalBranches) {
      if (LIU_CHONG[dyZhi] === nb) {
        interactions.push(`六冲 ${dyZhi}冲${nb}`);
        score -= 2; // clash with natal branch is turbulent
        // If clashed branch = month branch (月令), extra penalty
        if (nb === natalBranches[1]) score -= 1; // index 1 = month
      } else if (LIU_HE[dyZhi] === nb) {
        const heEl = BRANCH_ELEMENT[nb];
        interactions.push(`六合 ${dyZhi}合${nb}(${heEl})`);
        if (heEl === yongShen) score += 2;
        else score += 1;
      }
      const xings = SAN_XING[dyZhi] || [];
      if (xings.includes(nb) && !interactions.some(i => i.includes(nb))) {
        interactions.push(`三刑 ${dyZhi}刑${nb}`);
        score -= 1;
      }
    }
  }
  if (interactions.length > 0) interDesc = ` [${interactions.join(', ')}]`;

  const desc = `${ganDesc}; ${zhiDesc}${interDesc}`;
  if (score >= 5) return { rating: 'Sangat Baik ★★★', score, desc, interactions };
  if (score >= 3) return { rating: 'Baik ★★', score, desc, interactions };
  if (score >= 1) return { rating: 'Netral-Baik ★', score, desc, interactions };
  if (score <= -3) return { rating: 'Sangat Menantang ▼▼', score, desc, interactions };
  if (score <= -1) return { rating: 'Menantang ▼', score, desc, interactions };
  return { rating: 'Netral', score, desc, interactions };
}

/**
 * Hitung Shen Sha 7 utama
 */
function computeShenSha(dayMasterStem, yearBranch, dayBranch, allBranches) {
  const tianYiBranches = TIAN_YI[dayMasterStem] || [];

  // Yi Ma & Tao Hua: cek dari Year Branch DAN Day Branch (ambil unik)
  const yiMaFromYear  = getYiMa(yearBranch);
  const yiMaFromDay   = getYiMa(dayBranch);
  const yiMaBranches  = [...new Set([yiMaFromYear, yiMaFromDay].filter(Boolean))];

  const taoHuaFromYear  = getTaoHua(yearBranch);
  const taoHuaFromDay   = getTaoHua(dayBranch);
  const taoHuaBranches  = [...new Set([taoHuaFromYear, taoHuaFromDay].filter(Boolean))];

  // Jie Sha: berdasarkan Year Branch
  const jieShaBranch = getJieSha(yearBranch);

  // Jiang Xing: berdasarkan Year Branch
  const jiangXingBranch = getJiangXing(yearBranch);

  // Hong Yan Sha: berdasarkan Day Stem
  const hongYanBranch = HONG_YAN[dayMasterStem] || null;

  // Yang Ren: berdasarkan Day Stem
  const yangRenBranch = YANG_REN[dayMasterStem];

  // Wen Chang & Wen Qu: berdasarkan Day Stem
  const WEN_CHANG_MAP = { '甲':'巳','乙':'午','丙':'申','丁':'酉','戊':'申','己':'酉','庚':'亥','辛':'子','壬':'寅','癸':'卯' };
  const WEN_QU_MAP    = { '甲':'亥','乙':'子','丙':'寅','丁':'卯','戊':'寅','己':'卯','庚':'巳','辛':'午','壬':'申','癸':'酉' };
  const wenChangBranch = WEN_CHANG_MAP[dayMasterStem] || null;
  const wenQuBranch    = WEN_QU_MAP[dayMasterStem] || null;

  const findInPillars = (branch) => {
    const names = ['年柱','月柱','日柱','时柱'];
    return allBranches.map((b, i) => b === branch ? names[i] : null).filter(Boolean);
  };
  const findMultiInPillars = (branches) => branches.flatMap(findInPillars);

  return {
    tianYi: {
      name: '天乙贵人 (Tian Yi Gui Ren)',
      branches: tianYiBranches,
      presentIn: findMultiInPillars(tianYiBranches),
      active: tianYiBranches.some(b => allBranches.includes(b)),
      info: SHEN_SHA['天乙贵人']
    },
    wenChang: {
      name: '文昌 (Wen Chang)',
      // 文昌 berdasarkan Day Stem: 甲→巳, 乙→午, 丙→申, 丁→酉, 戊→申, 己→酉, 庚→亥, 辛→子, 壬→寅, 癸→卯
      branches: wenChangBranch ? [wenChangBranch] : [],
      presentIn: wenChangBranch ? findInPillars(wenChangBranch) : [],
      active: wenChangBranch ? allBranches.includes(wenChangBranch) : false,
      info: SHEN_SHA['文昌']
    },
    wenQu: {
      name: '文曲 (Wen Qu)',
      // 文曲 berdasarkan Day Stem: 甲→亥, 乙→子, 丙→寅, 丁→卯, 戊→寅, 己→卯, 庚→巳, 辛→午, 壬→申, 癸→酉
      branches: wenQuBranch ? [wenQuBranch] : [],
      presentIn: wenQuBranch ? findInPillars(wenQuBranch) : [],
      active: wenQuBranch ? allBranches.includes(wenQuBranch) : false,
      info: SHEN_SHA['文曲']
    },
    yiMa: {
      name: '驿马 (Yi Ma)',
      branches: yiMaBranches,
      presentIn: findMultiInPillars(yiMaBranches),
      active: yiMaBranches.some(b => allBranches.includes(b)),
      info: SHEN_SHA['驿马']
    },
    taoHua: {
      name: '桃花 (Tao Hua)',
      branches: taoHuaBranches,
      presentIn: findMultiInPillars(taoHuaBranches),
      active: taoHuaBranches.some(b => allBranches.includes(b)),
      info: SHEN_SHA['桃花']
    },
    yangRen: {
      name: '羊刃 (Yang Ren)',
      branches: yangRenBranch ? [yangRenBranch] : [],
      presentIn: yangRenBranch ? findInPillars(yangRenBranch) : [],
      active: yangRenBranch ? allBranches.includes(yangRenBranch) : false,
      info: SHEN_SHA['羊刃']
    },
    jieSha: {
      name: '劫煞 (Jie Sha)',
      branches: jieShaBranch ? [jieShaBranch] : [],
      presentIn: jieShaBranch ? findInPillars(jieShaBranch) : [],
      active: jieShaBranch ? allBranches.includes(jieShaBranch) : false,
      info: SHEN_SHA['劫煞']
    },
    jiangXing: {
      name: '将星 (Jiang Xing)',
      branches: jiangXingBranch ? [jiangXingBranch] : [],
      presentIn: jiangXingBranch ? findInPillars(jiangXingBranch) : [],
      active: jiangXingBranch ? allBranches.includes(jiangXingBranch) : false,
      info: SHEN_SHA['将星']
    },
    hongYan: {
      name: '红艳煞 (Hong Yan Sha)',
      branches: hongYanBranch ? [hongYanBranch] : [],
      presentIn: hongYanBranch ? findInPillars(hongYanBranch) : [],
      active: hongYanBranch ? allBranches.includes(hongYanBranch) : false,
      info: SHEN_SHA['红艳煞']
    }
  };
}

/**
 * Bangun teks interpretasi rule-based
 */
function buildBaziInterpretation({ dayMasterStem, dayMasterInfo, pillars, wuXingDistribution,
  dominantElement, weakestElement, yongShen, isDMStrong, isDMWeak, isDMBalanced, dmStrengthDetail, dominantTenGod, currentDaYun, shenSha, fengshui, careers, sixGods, geJu }) {

  const dmEl = dayMasterInfo.element || '';
  const sorted = Object.entries(wuXingDistribution).sort((a,b) => b[1].pct - a[1].pct);

  return {
    pillars: {
      intro:      `Anda lahir dengan Day Master ${dayMasterStem} (${dmEl} ${dayMasterInfo.polarity || ''}).`,
      character:  dayMasterInfo.character || '',
      strengths:  `Kekuatan utama Anda: ${dayMasterInfo.strength || '—'}.`,
      weaknesses: `Area yang perlu perhatian: ${dayMasterInfo.weakness || '—'}.`
    },

    hiddenStems: `Di balik Earthly Branch (地支) empat pilar Anda, terdapat berbagai energi tersembunyi (藏干). Unsur tersembunyi yang paling dominan berkontribusi pada kedalaman karakter Anda yang mungkin tidak terlihat di permukaan.`,

    wuXing: `Distribusi Wu Xing (五行) Anda: ${sorted.map(([el, d]) => `${WU_XING[el]?.name_id} ${d.pct}%`).join(', ')}. Unsur terkuat: ${WU_XING[dominantElement]?.name_id}. Unsur paling lemah: ${WU_XING[weakestElement]?.name_id}. Day Master Anda tergolong **${dmStrengthDetail?.dmLevelLabel||'?'}** (${isDMStrong?'旺身':isDMWeak?'弱身':'中和'}). Unsur yang paling Anda butuhkan (用神 Yong Shen) adalah ${WU_XING[yongShen]?.name_id} — ini adalah elemen kunci yang perlu diperkuat dalam kehidupan sehari-hari Anda. **忌神 (Ji Shen — HINDARI): ${WU_XING[sixGods?.jiShen]?.name_id||'—'}** — elemen yang melemahkan 用神 dan merugikan chart Anda. **仇神 (Chou Shen — MUSUH): ${WU_XING[sixGods?.chouShen]?.name_id||'—'}** — elemen yang memperkuat 忌神, harus dihindari. 喜神 (pendukung 用神): ${WU_XING[sixGods?.xiShen]?.name_id||'—'}. 格局 ${geJu?.name||'?'}: ${geJu?.geJuValidation?.status||'?'} — ${geJu?.geJuValidation?.reason||'?'}.`,

    tenGods: dominantTenGod
      ? `Ten God yang paling dominan dalam chart Anda adalah ${dominantTenGod[0]}. ${TEN_GODS[dominantTenGod[0]]?.meaning || ''} Dalam kehidupan, ini tercermin dalam: ${TEN_GODS[dominantTenGod[0]]?.life_area || ''}.`
      : 'Ten God dalam chart Anda tersebar merata, menunjukkan kepribadian yang multidimensi.',

    daYun: currentDaYun
      ? `Anda saat ini berada di Da Yun ${currentDaYun.ganzhi} (${currentDaYun.yearStart}–${currentDaYun.yearEnd}, usia ${currentDaYun.ageStart}–${currentDaYun.ageEnd} tahun). Kualitas periode ini: ${currentDaYun.quality.rating} — ${currentDaYun.quality.desc}.`
      : 'Informasi Da Yun saat ini tidak tersedia.',

    shenSha: Object.entries(shenSha)
      .filter(([,v]) => v.active)
      .map(([,v]) => `${v.name} (aktif): ${v.info?.effect || ''}`)
      .join(' | ') || 'Tidak ada Shen Sha utama yang aktif di pilar utama.',

    career: `Berdasarkan Day Master ${dayMasterStem}, bidang karir yang paling sesuai untuk Anda: ${careers.join(', ')}.`,

    fengshui: `Kua Number Anda: ${fengshui.kuaNumber} (Kelompok ${fengshui.group}). Arah terbaik: ${fengshui.shengQi.dir} (${fengshui.shengQi.meaning}). Warna yang disarankan: ${fengshui.luckyColors.join(', ')}.`
  };
}

/**
 * Generate prompt siap-pakai untuk ekspor ke Claude
 */
function buildClaudeExportPrompt({ dayMasterStem, pillars, wuXingDistribution, yongShen,
  dmStrengthDetail, isDMStrong, isDMWeak, isDMBalanced, sixGods, geJuValidation, geJuInfo,
  daYuns, currentDaYun, shenSha, boneWeight, fengshui, careers, shioCompat }) {
  return `# Data BaZi untuk Interpretasi Naratif

Tolong tulis narasi interpretasi personal yang mendalam, hangat, dan mudah dipahami berdasarkan data BaZi berikut. Gunakan bahasa Indonesia yang natural. Jangan menghitung ulang — hanya tulis narasinya berdasarkan data yang tersedia.

## Empat Pilar
- Tahun: ${pillars.year.ganzhi} (${pillars.year.element_gan}/${pillars.year.element_zhi})
- Bulan: ${pillars.month.ganzhi} (${pillars.month.element_gan}/${pillars.month.element_zhi})
- Hari: ${pillars.day.ganzhi} — Day Master: ${dayMasterStem}
- Jam:  ${pillars.hour.ganzhi}

## Distribusi Wu Xing
${Object.entries(wuXingDistribution).map(([el,d]) => `- ${el}: ${d.pct}%`).join('\n')}
Yong Shen (用神): ${yongShen} (${WU_XING[yongShen]?.name_id||yongShen}) | 忌神 (HINDARI): ${sixGods?.jiShen||'?'} (${WU_XING[sixGods?.jiShen]?.name_id||'?'}) | 仇神 (MUSUH): ${sixGods?.chouShen||'?'} | 喜神 (PENDUKUNG): ${sixGods?.xiShen||'?'}
格局: ${geJuInfo?.name||'?'} — ${geJuValidation?.status||'?'}: ${geJuValidation?.reason||'?'}${geJuValidation?.note?' ('+geJuValidation.note+')':''}
Kekuatan DM: ${dmStrengthDetail?.dmLevelLabel} (${dmStrengthDetail?.dmLevelEn}, rasio ${Math.round((dmStrengthDetail?.supRatio||0)*100)}%)

## Da Yun Saat Ini
${currentDaYun ? `${currentDaYun.ganzhi} (${currentDaYun.yearStart}-${currentDaYun.yearEnd}) — ${currentDaYun.quality.rating}` : 'Tidak tersedia'}

## Shen Sha Aktif
${Object.entries(shenSha).filter(([,v])=>v.active).map(([,v])=>v.name).join(', ') || 'Tidak ada'}

## Berat Tulang
Total: ${boneWeight.total.display}

Tolong tulis narasi yang mencakup: karakter kepribadian, kekuatan & tantangan hidup, tema karir, kehidupan cinta, dan saran praktis.`;
}

// ============================================================
// WEALTH PROFILING ENGINE
// ============================================================

/**
 * Map 10 Ten Gods ke 5 Structures (五型格)
 */
function computeStructures(tenGodAggregate) {
  const STRUCTURE_MAP = {
    '比肩':'biJie','劫财':'biJie',
    '食神':'shiShang','伤官':'shiShang',
    '偏财':'cai','正财':'cai',
    '七杀':'guanSha','正官':'guanSha',
    '偏印':'yin','正印':'yin'
  };
  const META = {
    biJie:    { name:'比劫', label:'Connectors', nameId:'Penghubung (比劫)', color:'#22c55e', desc:'Networker · Kompetitor · Mandiri' },
    shiShang: { name:'食伤', label:'Creators',   nameId:'Kreator (食伤)',    color:'#f59e0b', desc:'Kreatif · Ekspresif · Inovatif' },
    cai:      { name:'财星', label:'Managers',   nameId:'Manajer (财星)',    color:'#f97316', desc:'Pragmatis · Aset · Bisnis' },
    guanSha:  { name:'官杀', label:'Supporters', nameId:'Supporter (官杀)',  color:'#8b5cf6', desc:'Terstruktur · Berkuasa · Disiplin' },
    yin:      { name:'印星', label:'Thinkers',   nameId:'Pemikir (印星)',    color:'#3b82f6', desc:'Intelektual · Intuitif · Bijaksana' }
  };
  const groups = { biJie:0, shiShang:0, cai:0, guanSha:0, yin:0 };
  let total = 0;
  for (const [god, data] of Object.entries(tenGodAggregate)) {
    const g = STRUCTURE_MAP[god];
    if (g) { groups[g] += data.totalWeight; total += data.totalWeight; }
  }
  if (total === 0) total = 1;
  return Object.entries(groups).map(([key, weight]) => ({
    key, ...META[key], weight,
    pct: Math.round((weight / total) * 100)
  }));
}

/**
 * 10 Profiles dari Ten God Aggregate (十神格)
 */
function computeProfiles(tenGodAggregate) {
  const ALL_GODS = ['比肩','劫财','食神','伤官','偏财','正财','七杀','正官','偏印','正印'];
  const total = Object.values(tenGodAggregate).reduce((s,v) => s + v.totalWeight, 0) || 1;
  return ALL_GODS.map(god => {
    const data = tenGodAggregate[god];
    const weight = data?.totalWeight || 0;
    return { god, weight, pct: Math.round((weight / total) * 100), info: data?.info || null };
  });
}

/**
 * 6 Aspects of Life
 */
function computeAspects(wuXingDistribution, tenGodAggregate, shenSha) {
  const total = Object.values(tenGodAggregate).reduce((s,v) => s + v.totalWeight, 0) || 1;
  function tgPct(gods) {
    const w = gods.reduce((s,g) => s + (tenGodAggregate[g]?.totalWeight || 0), 0);
    return Math.min(100, Math.round((w / total) * 150));
  }
  const pcts = Object.values(wuXingDistribution).map(d => d.pct);
  const avg  = pcts.reduce((s,v) => s + v, 0) / 5;
  const variance = pcts.reduce((s,v) => s + Math.pow(v - avg, 2), 0) / 5;
  const wellnessScore = Math.max(10, Math.min(100, Math.round(100 - Math.sqrt(variance) * 2.5)));
  return [
    { key:'lifePurpose',  labelId:'Tujuan Hidup',  icon:'🌟', pct: tgPct(['偏印','正印']),  color:'#3b82f6', tip:'Kekuatan 印星 — kedalaman, wisdom, tujuan hidup' },
    { key:'financial',    labelId:'Finansial',      icon:'💰', pct: tgPct(['偏财','正财']),  color:'#f59e0b', tip:'Kekuatan 财星 — menghasilkan & mengelola kekayaan' },
    { key:'relationship', labelId:'Hubungan',       icon:'❤️', pct: tgPct(['七杀','正官']), color:'#ec4899', tip:'Kekuatan 官杀 — kualitas relasi romantis & sosial' },
    { key:'family',       labelId:'Keluarga',       icon:'🏠', pct: tgPct(['比肩','劫财']),  color:'#22c55e', tip:'Kekuatan 比劫 — dukungan keluarga & peer network' },
    { key:'wellness',     labelId:'Kesehatan',      icon:'🌿', pct: wellnessScore,            color:'#10b981', tip:'Keseimbangan Wu Xing — semakin balance semakin sehat' },
    { key:'contribution', labelId:'Kontribusi',     icon:'✨', pct: tgPct(['食神','伤官']),  color:'#f97316', tip:'Kekuatan 食伤 — kemampuan memberi output & kontribusi' }
  ];
}

/**
 * Bangun narasi Wealth Strategist Analysis (rule-based, dua prompt)
 */
function buildWealthStrategistAnalysis({ dayMasterStem, dmElement, yongShen, isDMStrong,
  tenGodAggregate, hiddenStems, pillars, daYuns, currentDaYun, shenSha, wuXingDistribution }) {

  const EL  = { '木':'Kayu','火':'Api','土':'Tanah','金':'Logam','水':'Air' };
  const CONTROLS = { '木':'土','火':'金','土':'水','金':'木','水':'火' };
  const wealthElement = CONTROLS[dmElement];

  // Hidden 财 in branches
  const hiddenWealth = [];
  for (const [pName, hs] of Object.entries(hiddenStems)) {
    for (const s of hs.stems) {
      if (s.tenGod === '偏财' || s.tenGod === '正财') {
        hiddenWealth.push({ pillar:pName, stem:s.stem, weight:s.weight, type:s.tenGod });
      }
    }
  }

  const structures  = computeStructures(tenGodAggregate);
  const dominantStr = [...structures].sort((a,b) => b.pct - a.pct)[0];
  const totalTGW    = Object.values(tenGodAggregate).reduce((s,v) => s+v.totalWeight, 0) || 1;
  const wealthWeight = (tenGodAggregate['偏财']?.totalWeight||0)+(tenGodAggregate['正财']?.totalWeight||0);
  const wealthPct   = Math.round((wealthWeight/totalTGW)*100);

  // Branch clashes
  const CLASHES = {'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
  const allBr   = [pillars.year.zhi,pillars.month.zhi,pillars.day.zhi,pillars.hour.zhi];
  const BRN     = ['Tahun','Bulan','Hari','Jam'];
  const clashes = [];
  for (let i=0; i<allBr.length; i++) for (let j=i+1; j<allBr.length; j++) {
    if (CLASHES[allBr[i]]===allBr[j]) clashes.push({b1:allBr[i],b2:allBr[j],p1:BRN[i],p2:BRN[j]});
  }

  // Peak & good Da Yuns
  const sortedDY  = [...daYuns].sort((a,b)=>(b.quality.score||0)-(a.quality.score||0));
  const peakDaYun = sortedDY[0];
  const goodDaYuns = daYuns.filter(d=>(d.quality.score||0)>=2);
  const cyear = new Date().getFullYear();

  const DM_PROFILE = {
    '木':{ archetype:'Pertumbuhan Organik',       advice:'Properti, edukasi, konten digital, jaringan distribusi, agrikultur, fesyen, furnitur' },
    '火':{ archetype:'Karisma & Transformasi',    advice:'Entertainment, marketing, branding, event organizer, public speaking, hospitality, kuliner premium' },
    '土':{ archetype:'Fondasi Kuat & Akumulasi',  advice:'Real estate, investasi jangka panjang, bisnis makanan/minuman, manajemen proyek, logistik' },
    '金':{ archetype:'Presisi & Efisiensi',        advice:'Keuangan, teknologi, manufaktur presisi, hukum, konsultasi, mining, perhiasan, trading' },
    '水':{ archetype:'Adaptabilitas & Fleksibilitas', advice:'E-commerce, trading, logistik, media, informasi, investasi multipel, travel, import-export' }
  };
  const dmP = DM_PROFILE[dmElement] || { archetype:'Multidimensional', advice:'Lihat rekomendasi berdasarkan Yong Shen dan struktur dominan' };

  const ARCH_MAP = {
    biJie:   {name:'Kolaborator Kekayaan', desc:'Kekuatan Anda ada pada jaringan dan kemitraan strategis'},
    shiShang:{name:'Kreator Kekayaan',     desc:'Kekuatan Anda ada pada menciptakan produk/jasa/kreasi bernilai'},
    cai:     {name:'Magnet Kekayaan',      desc:'Kekuatan Anda ada pada mengelola, menarik, dan mengakumulasi aset'},
    guanSha: {name:'Pemimpin Kekayaan',    desc:'Kekuatan Anda ada pada posisi otoritas dan kepemimpinan terstruktur'},
    yin:     {name:'Arsitek Kekayaan',     desc:'Kekuatan Anda ada pada pengetahuan, strategi, dan visi jangka panjang'}
  };
  const archetype = ARCH_MAP[dominantStr.key] || {name:'Multidimensi',desc:'Energi Anda tersebar merata di berbagai domain'};

  const YONG_ACT = {
    '木':'Kerjakan di lingkungan hijau/alam · Perkuat networking organik · Partner ideal: elemen Kayu atau Air',
    '火':'Bangun personal brand dan visibilitas · Aktif di social media & public speaking · Partner: elemen Api atau Kayu',
    '土':'Bangun rutinitas stabil dan sistem · Investasikan di aset fisik/properti · Partner: elemen Tanah atau Api',
    '金':'Fokus pada presisi dan kualitas tinggi · Kembangkan bidang teknis/analitis · Partner: elemen Logam atau Tanah',
    '水':'Diversifikasi portfolio penghasilan · Tingkatkan adaptabilitas dan networking · Partner: elemen Air atau Logam'
  };

  const STRUCT_OPEN = {
    biJie:   'Kemitraan strategis dan jaringan. Bisnis co-founding, distribusi melalui mitra, atau value network.',
    shiShang:'Kreasi dan ekspresi. Monetisasi keahlian dan kreativitas secara langsung — setiap karya adalah aset.',
    cai:     'Pengelolaan aset aktif. Anda punya instinct bisnis alami — percayai itu. Akuisisi, optimasi cashflow, dan diversifikasi.',
    guanSha: 'Posisi dan otoritas. Karir terstruktur, kepemimpinan dalam organisasi besar, atau usaha berbasis regulasi.',
    yin:     'Pengetahuan dan strategi. Jual expertise, konsultasi, atau intellectual property. Investasi berbasis riset mendalam.'
  };

  const STRUCT_ACTIONS = {
    biJie:   '• Identifikasi 3-5 partner strategis potensial\n• Bangun sistem revenue sharing yang adil dan sustainable\n• Bergabung dengan mastermind group atau komunitas bisnis',
    shiShang:'• Dokumentasikan dan monetisasi keahlian (kursus, buku, konsultasi)\n• Buat konten bernilai tinggi minimal 1x/minggu untuk membangun authority\n• Kembangkan produk/IP yang bisa diskala tanpa keterlibatan 1:1',
    cai:     '• Review dan optimalkan portofolio aset setiap kuartal\n• Target: 30% penghasilan masuk ke instrumen investasi terstruktur\n• Pelajari 1 aset class baru per tahun (saham, properti, bisnis, dll)',
    guanSha: '• Investasi karir: target posisi leadership dalam 2-3 tahun ke depan\n• Bangun track record tertulis dari setiap pencapaian\n• Network di level atas — mentoring dari senior, bergabung asosiasi profesi',
    yin:     '• Kembangkan intellectual property: buku, sistem, metodologi, framework\n• Jual expertise melalui konsultasi premium, bukan jual waktu\n• Investasi berbasis research mendalam (value investing, niche market)'
  };

  // ---- SECTION: Archetype
  const secArchetype = `Arketipe kekayaan Anda: **${archetype.name}** (dominan ${dominantStr.nameId} ${dominantStr.pct}%). ${archetype.desc}.\n\nSebagai Day Master ${dayMasterStem} (${dmElement}), Anda adalah tipe **${dmP.archetype}** — ${isDMStrong ? 'energi Day Master kuat, kapasitas besar untuk menggerakkan aset dan membuat keputusan.' : 'Day Master membutuhkan support — bangun fondasi kuat sebelum ekspansi agresif.'}\n\nElemen kekayaan (财): **${wealthElement} (${EL[wealthElement]})** yang DM Anda kendalikan. Bintang 财 dalam chart: **${wealthPct}%**${wealthPct < 12 ? ' — lemah, perlu diaktivasi melalui Da Yun yang tepat' : wealthPct > 35 ? ' — kuat, radar bisnis alami Anda tajam' : ' — sehat untuk pertumbuhan finansial berkelanjutan'}.`;

  // ---- SECTION: Opening & Acquisition
  const secOpening = `${isDMStrong
    ? `Day Master **kuat (旺身)** — yang dibutuhkan bukan mengisi energi tapi **menyalurkannya**. Membuka keran rezeki berarti menciptakan OUTPUT yang bernilai.\n\nYong Shen: **${yongShen} (${EL[yongShen]})** adalah "saluran" Anda — aktivitas dan lingkungan yang membawa energi ${yongShen} akan membuka aliran rezeki secara organik.`
    : `Day Master **lemah (弱身)** — sinyal bahwa Anda perlu **fondasi kuat** sebelum ekspansi. Bangun support system: mentor, modal, dan lingkungan yang mendukung.\n\nYong Shen: **${yongShen} (${EL[yongShen]})** adalah "bahan bakar" Anda — cari lingkungan dan partner yang memperkuat elemen ini dalam hidup.`
  }\n\n**Jalur kekayaan berdasarkan struktur dominan:**\n${STRUCT_OPEN[dominantStr.key]||'Multidimensional — fokus pada 1-2 jalur utama agar energi tidak tersebar.'}\n\n**Bidang rekomendasi:** ${dmP.advice}`;

  // ---- SECTION: Day Master & Hidden Wealth
  const PILLAR_D = {year:'Pilar Tahun',month:'Pilar Bulan',day:'Pilar Hari',hour:'Pilar Jam'};
  let secHidden = `Day Master ${dayMasterStem} (${dmElement}) ${isDMStrong ? 'kuat dan dominan' : 'membutuhkan support'} dalam chart ini.\n\n`;
  if (hiddenWealth.length > 0) {
    secHidden += `**Hidden Wealth ditemukan:**\n`;
    hiddenWealth.forEach(hw => {
      secHidden += `• ${PILLAR_D[hw.pillar]}: ${hw.stem} (${hw.type}, ${hw.weight}%) — ${hw.weight>=60?'sumber kekayaan UTAMA — energi kuat dan dominan':hw.weight>=20?'sumber kekayaan menengah — perlu diaktivasi':'kekayaan tersembunyi laten — muncul saat kondisi tepat'}\n`;
    });
    secHidden += `\nHidden Wealth menunjukkan bahwa sumber rezeki Anda tidak selalu terlihat di permukaan — ada potensi tersembunyi yang bisa diungkap dengan timing Da Yun yang tepat.\n\n`;
  } else {
    secHidden += `**Hidden Wealth:** Tidak ada 财 tersembunyi di branch chart. Kekayaan lebih dipengaruhi oleh Heavenly Stems manifest atau diaktivasi melalui Da Yun.\n\n`;
  }
  secHidden += `**Elemen kekayaan: ${wealthElement} (${EL[wealthElement]})** — semua yang bisa Anda "miliki dan kelola". ${isDMStrong ? 'Kapasitas besar untuk memegang kekayaan. Prioritaskan retensi (saving, investasi jangka panjang) sebelum ekspansi agresif.' : 'Fokus pada membangun kapasitas terlebih dulu — mentor, modal eksternal, atau keahlian yang meningkatkan nilai jual — sebelum mengambil risiko besar.'}`;

  // ---- SECTION: Luck Pillars
  let secLuck = '';
  if (currentDaYun) {
    secLuck += `**Da Yun Saat Ini: ${currentDaYun.ganzhi}** (Usia ${currentDaYun.ageStart}–${currentDaYun.ageEnd}, ${currentDaYun.yearStart}–${currentDaYun.yearEnd})\nRating: **${currentDaYun.quality.rating}** | ${currentDaYun.quality.desc}\n\n`;
    const sc = currentDaYun.quality.score||0;
    if (sc >= 2) secLuck += `⭐ **Anda sedang di periode emas.** Ambil langkah berani sekarang — buka bisnis baru, lakukan investasi signifikan, atau expand ke market baru. Jangan biarkan momentum ini berlalu.\n\n`;
    else if (sc >= 0) secLuck += `⚡ **Periode netral-menantang.** Bukan waktu untuk langkah agresif — waktu terbaik untuk konsolidasi, belajar, dan membangun fondasi bagi Da Yun berikutnya.\n\n`;
    else secLuck += `🔴 **Periode menantang.** Fokus pada pertahanan aset, hindari risiko tinggi. Persiapan Anda sekarang menentukan lompatan di Da Yun berikutnya.\n\n`;
  }
  if (peakDaYun) {
    secLuck += `**Puncak Emas: ${peakDaYun.ganzhi}** (Usia ${peakDaYun.ageStart}–${peakDaYun.ageEnd}, ${peakDaYun.yearStart}–${peakDaYun.yearEnd})\n`;
    if (peakDaYun.isCurrent) secLuck += `🌟 **Anda sedang di puncak emas SEKARANG.** Manfaatkan sepenuhnya — setiap keputusan besar memiliki dampak jangka panjang jauh lebih besar dari periode lain.\n\n`;
    else if (peakDaYun.yearStart > cyear) secLuck += `Datang dalam ${peakDaYun.yearStart - cyear} tahun. Bangun fondasi sekarang: modal, jaringan, keahlian, dan track record agar saat puncak tiba Anda siap bergerak penuh.\n\n`;
    else secLuck += `Periode puncak ini sudah berlalu, namun pelajarannya tetap relevan dan Da Yun baik berikutnya masih bisa dimanfaatkan.\n\n`;
  }
  if (goodDaYuns.length > 0) {
    secLuck += `**Semua periode menguntungkan:**\n`;
    goodDaYuns.forEach(dy => {
      const tag = dy.isCurrent ? ' ← SAAT INI' : dy.yearStart > cyear ? ' (mendatang)' : ' (berlalu)';
      secLuck += `• **${dy.ganzhi}** (Usia ${dy.ageStart}–${dy.ageEnd}): ${dy.quality.rating}${tag}\n`;
    });
  }

  // ---- SECTION: Risk & Bottleneck
  const risks = [];
  clashes.forEach(c => risks.push(`**Clash ${c.p1}↔${c.p2} (${c.b1}冲${c.b2})** — benturan energi antar pilar. Hindari perubahan besar (pindah, investasi besar) saat tahun yang berkaitan dengan branch ini aktif. Gunakan harmonisasi elemen (warna, arah Feng Shui) sebagai mitigasi.`));
  if (shenSha?.yangRen?.active) risks.push(`**Yang Ren (羊刃) aktif** — pedang bermata dua. Kemampuan menghasilkan besar tetapi risiko kerugian juga besar. Terapkan disiplin keuangan ketat: selalu sisihkan 20-30% penghasilan, konsultasikan investasi besar dengan advisor sebelum eksekusi.`);
  if (shenSha?.jieSha?.active) risks.push(`**Jie Sha (劫煞) aktif** — risiko kerugian dari pihak ketiga (partner curang, penipuan, persaingan merusak). Perkuat due diligence, gunakan kontrak legal kuat, dan diversifikasi — jangan taruh semua telur dalam satu keranjang.`);
  if (wealthPct < 10) risks.push(`**财 lemah (${wealthPct}%)** — kapasitas menangkap kekayaan terbatas. Kompensasi dengan sistem keuangan otomatis (auto-debit tabungan, investasi rutin) dan pilih profesi dengan penghasilan predictable daripada windfall tidak menentu.`);
  const ysPct = wuXingDistribution[yongShen]?.pct || 0;
  if (ysPct < 15) risks.push(`**Yong Shen ${yongShen}/${EL[yongShen]} lemah (${ysPct}%)** — elemen kunci kurang support dalam chart. Aktifkan melalui lingkungan fisik (warna, material), aktivitas harian, dan partner yang memiliki elemen ${yongShen} kuat.`);
  const outputW = (tenGodAggregate['食神']?.totalWeight||0)+(tenGodAggregate['伤官']?.totalWeight||0);
  const outputPct = Math.round((outputW/totalTGW)*100);
  if (isDMStrong && outputPct < 10) risks.push(`**DM kuat tapi Output/食伤 sangat lemah (${outputPct}%)** — energi personal besar tapi saluran output terbatas. Ciptakan platform untuk mengekspresikan keahlian (teaching, writing, product development, content).`);

  let secRisk = '';
  if (risks.length === 0) {
    secRisk = `✅ **Chart Anda relatif bersih dari risiko finansial besar.** Tidak ditemukan clash signifikan atau bintang pengganggu dominan. Fokus utama adalah optimasi, bukan mitigasi.\n\nTetap terapkan prinsip sehat: diversifikasi aset, emergency fund 6 bulan, dan investasi rutin tanpa menunggu "waktu sempurna".`;
  } else {
    secRisk = `**${risks.length} risiko teridentifikasi dalam chart:**\n\n`;
    risks.forEach((r,i) => { secRisk += `${i+1}. ${r}\n\n`; });
  }

  // ---- SECTION: Strategic Actions
  let secStrategy = `**Bidang Usaha Optimal untuk ${dayMasterStem} (${dmElement}):**\n${dmP.advice}\n\n`;
  secStrategy += `**Aktivasi Yong Shen ${yongShen} (${EL[yongShen]}) dalam keseharian:**\n${YONG_ACT[yongShen]||'—'}\n\n`;
  secStrategy += `**Aksi spesifik untuk ${dominantStr.nameId}:**\n${STRUCT_ACTIONS[dominantStr.key]||'—'}\n\n`;
  if (currentDaYun) {
    secStrategy += `**Timing — kondisi saat ini (${currentDaYun.ganzhi}, ${currentDaYun.quality.rating}):**\n`;
    const sc = currentDaYun.quality.score||0;
    if (sc >= 3) secStrategy += `✅ Ajukan proposal bisnis/investasi besar yang sudah matang dalam 6 bulan ke depan\n✅ Ekspansi kapasitas: hire, tambah produk/layanan, atau masuk market baru\n✅ Aktif di konferensi industri — bangun relationship dengan pemain kunci`;
    else if (sc >= 0) secStrategy += `⚡ Konsolidasi posisi yang sudah ada sebelum buka front baru\n⚡ Investasi di pendidikan/sertifikasi/skill yang meningkatkan nilai jual\n⚡ Jaga dan perkuat relasi yang sudah ada sebagai modal Da Yun berikutnya`;
    else secStrategy += `🔴 Prioritaskan likuiditas — pastikan emergency fund dan cashflow tetap positif\n🔴 Tunda ekspansi atau investasi spekulatif hingga Da Yun berganti\n🔴 Upgrade skill inti untuk meningkatkan kompetensi dan nilai jual Anda`;
  }

  return {
    archetype, dominantStructure: dominantStr, wealthPct, hiddenWealth, clashes, peakDaYun, goodDaYuns,
    sections: {
      archetype: { title:'🏆 Arketipe Kekayaan Anda',                        content: secArchetype },
      opening:   { title:'🔓 Membuka & Mengakuisisi Kekayaan',               content: secOpening  },
      hidden:    { title:'💎 Day Master & Hidden Wealth',                     content: secHidden   },
      luck:      { title:'⏳ Navigasi Luck Pillars — Timing & Milestone',     content: secLuck     },
      risk:      { title:'⚠️ Risk & Bottleneck Management',                  content: secRisk     },
      strategy:  { title:'🎯 Langkah Konkret & Rekomendasi Strategis',       content: secStrategy }
    }
  };
}

module.exports = { calculateBazi, computeTenGod, HIDDEN_STEMS, STEM_ELEMENT, BRANCH_ELEMENT };
