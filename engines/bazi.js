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
  KUA_DATA, CAREER_BY_DAYMASTER, SHIO_COMPATIBILITY,
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
    dayunSect = 2      // aliran Da Yun: 1=kasar, 2=presisi menit (default)
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
  // Yong Shen = unsur yang paling dibutuhkan untuk menyeimbangkan
  // Rule sederhana: jika Day Master kuat (banyak dukungan), Yong Shen = yang melemahkan DM
  //                 jika Day Master lemah, Yong Shen = yang menguatkan DM
  // (Analisis penuh memerlukan konteks lengkap; ini aproksimasi)
  const ELEMENT_PRODUCES = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const ELEMENT_CONTROLS = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
  const dmElement = STEM_ELEMENT[dayMasterStem];
  const dmScore = wuXingDistribution[dmElement]?.score || 0;
  const avgScore = totalScore / 5;
  const isDMStrong = dmScore > avgScore * 1.2;
  const yongShen = isDMStrong ? ELEMENT_CONTROLS[dmElement] : ELEMENT_PRODUCES[ELEMENT_CONTROLS[dmElement]];

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

  // ---- DA YUN (大运) ----
  const daYunArr = yun.getDaYun();
  const currentYear = new Date().getFullYear();
  const daYuns = daYunArr.map((dy, i) => {
    const startYear = dy.getStartYear();
    const endYear = dy.getEndYear();
    const isCurrent = currentYear >= startYear && currentYear <= endYear;
    const gz = dy.getGanZhi();
    const dgStem = gz[0]; // Gan Da Yun
    const dgBranch = gz[1]; // Zhi Da Yun
    return {
      index: i,
      ganzhi: gz,
      gan: dgStem,
      zhi: dgBranch,
      yearStart: startYear,
      yearEnd: endYear,
      ageStart: dy.getStartAge(),
      ageEnd: dy.getEndAge(),
      isCurrent,
      element_gan: STEM_ELEMENT[dgStem],
      element_zhi: BRANCH_ELEMENT[dgBranch],
      // Evaluasi kualitas: apakah Da Yun menguntungkan Day Master
      quality: evaluateDaYunQuality(dgStem, dgBranch, dayMasterStem, yongShen)
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

  // ---- PROFESI & SHIO ----
  const careers = CAREER_BY_DAYMASTER[dayMasterStem] || [];
  const yearShio = BRANCH_SHIO[pillars.year.zhi] || '';
  const shioKey = Object.keys(SHIO_COMPATIBILITY).find(k => k.includes(pillars.year.zhi));
  const shioCompat = shioKey ? SHIO_COMPATIBILITY[shioKey] : null;

  // ---- RANGKUMAN INTERPRETASI ----
  const interpretation = buildBaziInterpretation({
    dayMasterStem, dayMasterInfo, pillars, wuXingDistribution,
    dominantElement, weakestElement, yongShen, isDMStrong,
    dominantTenGod, currentDaYun, shenSha, fengshui, careers
  });

  return {
    meta: {
      inputDate: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} ${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
      trueSolarTime: `${String(tstHour).padStart(2,'0')}:${String(tstMinute).padStart(2,'0')}`,
      tstDetails,
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
      yongShen,
      isDMStrong,
      summary: `Day Master Anda (${dayMasterStem}/${dayMasterInfo.element}) ${isDMStrong ? 'kuat' : 'perlu dukungan'}. Unsur yang dibutuhkan (用神): ${yongShen} (${WU_XING[yongShen]?.name_id})`
    },
    tenGods: {
      byStem: tenGods,
      byHiddenStems: tenGodAggregate,
      dominant: dominantTenGod ? { god: dominantTenGod[0], ...dominantTenGod[1] } : null
    },
    daYun: {
      startInfo: {
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
    shioCompatibility: shioCompat,
    yearShio,
    interpretation,
    exportPrompt: buildClaudeExportPrompt({
      dayMasterStem, pillars, wuXingDistribution, yongShen, daYuns, currentDaYun, shenSha, boneWeight, fengshui, careers, shioCompat
    })
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
 */
function evaluateDaYunQuality(dyGan, dyZhi, dayMaster, yongShen) {
  const dyEl = STEM_ELEMENT[dyGan];
  const PRODUCES = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
  const CONTROLS = { '木':'土','火':'金','土':'水','金':'木','水':'火' };

  if (dyEl === yongShen) return { rating: 'Sangat Baik', score: 3, desc: `Unsur Da Yun (${dyEl}) = Yong Shen — periode sangat mendukung` };
  if (PRODUCES[dyEl] === yongShen) return { rating: 'Baik', score: 2, desc: `Da Yun menghasilkan Yong Shen — periode mendukung` };
  if (dyEl === STEM_ELEMENT[dayMaster]) return { rating: 'Netral-Baik', score: 1, desc: `Da Yun memperkuat Day Master` };
  if (CONTROLS[dyEl] === yongShen) return { rating: 'Menantang', score: -1, desc: `Da Yun melemahkan Yong Shen — periode perlu strategi` };
  return { rating: 'Netral', score: 0, desc: 'Periode netral' };
}

/**
 * Hitung Shen Sha 7 utama
 */
function computeShenSha(dayMasterStem, yearBranch, dayBranch, allBranches) {
  const tianYiBranches = TIAN_YI[dayMasterStem] || [];
  const yiMaBranch = getYiMa(yearBranch);
  const taoHuaBranch = getTaoHua(yearBranch);
  const yangRenBranch = YANG_REN[dayMasterStem];
  const jieSha = getJieSha(yearBranch);

  const findInPillars = (branch) => {
    const names = ['年柱','月柱','日柱','时柱'];
    return allBranches.map((b, i) => b === branch ? names[i] : null).filter(Boolean);
  };

  return {
    tianYi: {
      name: '天乙贵人 (Tian Yi Gui Ren)',
      branches: tianYiBranches,
      presentIn: tianYiBranches.flatMap(findInPillars),
      active: tianYiBranches.some(b => allBranches.includes(b)),
      info: SHEN_SHA['天乙贵人']
    },
    wenChang: {
      name: '文昌 (Wen Chang)',
      // 文昌 berdasarkan Year Stem: 甲→巳, 乙→午, 丙→申, 丁→酉, 戊→申, 己→酉, 庚→亥, 辛→子, 壬→寅, 癸→卯
      branches: [{ '甲':'巳','乙':'午','丙':'申','丁':'酉','戊':'申','己':'酉','庚':'亥','辛':'子','壬':'寅','癸':'卯' }[dayMasterStem]].filter(Boolean),
      presentIn: [],
      active: false,
      info: SHEN_SHA['文昌']
    },
    wenQu: {
      name: '文曲 (Wen Qu)',
      branches: [{ '甲':'亥','乙':'子','丙':'寅','丁':'卯','戊':'寅','己':'卯','庚':'巳','辛':'午','壬':'申','癸':'酉' }[dayMasterStem]].filter(Boolean),
      presentIn: [],
      active: false,
      info: SHEN_SHA['文曲']
    },
    yiMa: {
      name: '驿马 (Yi Ma)',
      branches: yiMaBranch ? [yiMaBranch] : [],
      presentIn: yiMaBranch ? findInPillars(yiMaBranch) : [],
      active: yiMaBranch ? allBranches.includes(yiMaBranch) : false,
      info: SHEN_SHA['驿马']
    },
    taoHua: {
      name: '桃花 (Tao Hua)',
      branches: taoHuaBranch ? [taoHuaBranch] : [],
      presentIn: taoHuaBranch ? findInPillars(taoHuaBranch) : [],
      active: taoHuaBranch ? allBranches.includes(taoHuaBranch) : false,
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
      branches: jieSha ? [jieSha] : [],
      presentIn: jieSha ? findInPillars(jieSha) : [],
      active: jieSha ? allBranches.includes(jieSha) : false,
      info: SHEN_SHA['劫煞']
    }
  };
}

/**
 * Bangun teks interpretasi rule-based
 */
function buildBaziInterpretation({ dayMasterStem, dayMasterInfo, pillars, wuXingDistribution,
  dominantElement, weakestElement, yongShen, isDMStrong, dominantTenGod, currentDaYun, shenSha, fengshui, careers }) {

  const dmEl = dayMasterInfo.element || '';
  const sorted = Object.entries(wuXingDistribution).sort((a,b) => b[1].pct - a[1].pct);

  return {
    pillars: `Anda lahir dengan Day Master ${dayMasterStem} (${dmEl} ${dayMasterInfo.polarity || ''}). ${dayMasterInfo.character || ''} Kekuatan utama Anda: ${dayMasterInfo.strength || '—'}. Area yang perlu perhatian: ${dayMasterInfo.weakness || '—'}.`,

    hiddenStems: `Di balik Earthly Branch (地支) empat pilar Anda, terdapat berbagai energi tersembunyi (藏干). Unsur tersembunyi yang paling dominan berkontribusi pada kedalaman karakter Anda yang mungkin tidak terlihat di permukaan.`,

    wuXing: `Distribusi Wu Xing (五行) Anda: ${sorted.map(([el, d]) => `${WU_XING[el]?.name_id} ${d.pct}%`).join(', ')}. Unsur terkuat: ${WU_XING[dominantElement]?.name_id}. Unsur paling lemah: ${WU_XING[weakestElement]?.name_id}. Day Master Anda ${isDMStrong ? 'tergolong kuat (旺身)' : 'memerlukan dukungan (弱身)'}. Unsur yang paling Anda butuhkan (用神 Yong Shen) adalah ${WU_XING[yongShen]?.name_id} — ini adalah elemen kunci yang perlu diperkuat dalam kehidupan sehari-hari Anda.`,

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
Yong Shen (unsur dibutuhkan): ${yongShen}

## Da Yun Saat Ini
${currentDaYun ? `${currentDaYun.ganzhi} (${currentDaYun.yearStart}-${currentDaYun.yearEnd}) — ${currentDaYun.quality.rating}` : 'Tidak tersedia'}

## Shen Sha Aktif
${Object.entries(shenSha).filter(([,v])=>v.active).map(([,v])=>v.name).join(', ') || 'Tidak ada'}

## Berat Tulang
Total: ${boneWeight.total.display}

Tolong tulis narasi yang mencakup: karakter kepribadian, kekuatan & tantangan hidup, tema karir, kehidupan cinta, dan saran praktis.`;
}

module.exports = { calculateBazi, computeTenGod, HIDDEN_STEMS, STEM_ELEMENT, BRANCH_ELEMENT };
