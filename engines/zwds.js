'use strict';

/**
 * engines/zwds.js
 * Engine Zi Wei Dou Shu (紫微斗數) — menggunakan library iztro (SylarLong)
 *
 * Library: iztro v2.5.8 (https://github.com/SylarLong/iztro)
 * Kaidah yang diimplementasikan:
 *   - Penempatan 14 bintang utama (紫微/天府 series)
 *   - 12 istana dengan Gan Zhi
 *   - Empat Transformasi 四化 (aliran default iztro)
 *   - Da Xian (大限) 12 periode
 *   - Xiao Xian (小限) tahun berjalan
 *   - Liu Nian 四化 tahun berjalan
 *   - Ming Gong & Shen Gong
 *   - Lima Unsur Struktur (五行局)
 */

const { astro } = require('iztro');
const { PALACE_INFO } = require('./interpretations');

// Nama istana dalam urutan iztro (0-11)
const PALACE_NAMES_ZH = [
  '命宫','兄弟宫','夫妻宫','子女宫','财帛宫','疾厄宫',
  '迁移宫','交友宫','官禄宫','田宅宫','福德宫','父母宫'
];

// Terjemahan kecerahan bintang
// v4e: Star brightness weight multipliers
const BRIGHTNESS_WEIGHT = { '庙': 1.5, '旺': 1.2, '利': 1.0, '平': 0.8, '陷': 0.5, '': 1.0 };

const BRIGHTNESS_ID = {
  '庙': 'Miao (Sangat Kuat ★★★★★)',
  '旺': 'Wang (Kuat ★★★★)',
  '得': 'De (Cukup Kuat ★★★)',
  '利': 'Li (Sedang ★★)',
  '平': 'Ping (Lemah ★)',
  '不': 'Bu (Sangat Lemah)',
  '陷': 'Xian (Terlemah)',
  '': 'Tidak Ditentukan'
};

// 长生十二神 — 12 Tahap Kehidupan ZWDS
const LIFE_STAGES_ZH = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
const LIFE_STAGE_ID = {
  '长生': { id: 'Chang Sheng', label: 'Lahir Baru', icon: '🌱', desc: 'Energi segar dimulai — potensi penuh, fase pertumbuhan baru' },
  '沐浴': { id: 'Mu Yu',       label: 'Mandi',      icon: '💧', desc: 'Belajar & beradaptasi — rentan namun penuh kemungkinan' },
  '冠带': { id: 'Guan Dai',    label: 'Mahkota',    icon: '👑', desc: 'Tumbuh berkembang — sedang membangun identitas & kemampuan' },
  '临官': { id: 'Lin Guan',    label: 'Jabatan',    icon: '⚡', desc: 'Puncak persiapan — siap mengemban tanggung jawab besar' },
  '帝旺': { id: 'Di Wang',     label: 'Puncak',     icon: '🌟', desc: 'Kekuatan tertinggi — area kehidupan ini berada di puncaknya' },
  '衰':   { id: 'Shuai',       label: 'Melemah',    icon: '🍂', desc: 'Fase transisi — energi mulai mengendur, butuh adaptasi' },
  '病':   { id: 'Bing',        label: 'Sakit',      icon: '⚠️', desc: 'Tantangan & hambatan — area yang butuh perhatian ekstra' },
  '死':   { id: 'Si',          label: 'Pelepasan',  icon: '🌙', desc: 'Pelepasan lama — transformasi menuju siklus baru' },
  '墓':   { id: 'Mu',          label: 'Penyimpanan',icon: '📦', desc: 'Energi tersimpan dalam — potensi terkubur yang bisa digali' },
  '绝':   { id: 'Jue',         label: 'Terputus',   icon: '🔄', desc: 'Regenerasi — titik terbawah sebelum siklus baru dimulai' },
  '胎':   { id: 'Tai',         label: 'Janin',      icon: '🥚', desc: 'Awal baru dalam kandungan — benih yang belum terwujud' },
  '养':   { id: 'Yang',        label: 'Diasuh',     icon: '🤲', desc: 'Persiapan akhir — dipelihara menjelang lahir kembali' }
};

// Posisi cabang bumi tempat 长生 dimulai, per Ju
const JU_CHANGSHENG_BRANCH = {
  2: '申', // 水二局 → 长生 di 申
  3: '亥', // 木三局 → 长生 di 亥
  4: '巳', // 金四局 → 长生 di 巳
  5: '申', // 土五局 → 长生 di 申
  6: '寅'  // 火六局 → 长生 di 寅
};
const BRANCH_ORDER = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// Hitung tahap 长生十二神 untuk satu istana
function calcLifeStage(earthlyBranch, juNumber, yearStemIsYin, isMale) {
  const startBranch = JU_CHANGSHENG_BRANCH[juNumber];
  if (!startBranch) return null;
  const startIdx = BRANCH_ORDER.indexOf(startBranch);
  const branchIdx = BRANCH_ORDER.indexOf(earthlyBranch);
  if (branchIdx === -1 || startIdx === -1) return null;

  // 阳男/阴女 → 顺行; 阴男/阳女 → 逆行
  const isForward = (isMale && !yearStemIsYin) || (!isMale && yearStemIsYin);
  const distance = isForward
    ? (branchIdx - startIdx + 12) % 12
    : (startIdx - branchIdx + 12) % 12;

  const stage = LIFE_STAGES_ZH[distance];
  return { stage, ...(LIFE_STAGE_ID[stage] || {}) };
}

// Lima Unsur Struktur (五行局)
const WU_XING_JU = {
  '水二局': { number: 2, element: 'Air', desc: 'Bintang Zi Wei di posisi 2. Struktural Air — kebijaksanaan, adaptabilitas, dan kekuatan tersembunyi.' },
  '木三局': { number: 3, element: 'Kayu', desc: 'Bintang Zi Wei di posisi 3. Struktural Kayu — pertumbuhan, kreativitas, dan vitalitas.' },
  '金四局': { number: 4, element: 'Logam', desc: 'Bintang Zi Wei di posisi 4. Struktural Logam — ketegasan, presisi, dan nilai tinggi.' },
  '土五局': { number: 5, element: 'Tanah', desc: 'Bintang Zi Wei di posisi 5. Struktural Tanah — stabilitas, keandalan, dan kemampuan medasi.' },
  '火六局': { number: 6, element: 'Api', desc: 'Bintang Zi Wei di posisi 6. Struktural Api — semangat, ekspresi, dan karisma.' }
};

/**
 * Hitung chart Zi Wei Dou Shu lengkap
 * @param {object} params
 * @returns {object} Seluruh data ZWDS terstruktur
 */
function calculateZwds(params) {
  const {
    birthYear, birthMonth, birthDay,
    birthHour,
    gender,
    zone // tidak dipakai oleh iztro (iztro pakai tanggal solar langsung)
  } = params;

  const y = parseInt(birthYear), m = parseInt(birthMonth), d = parseInt(birthDay);
  const h = parseInt(birthHour);
  const genderStr = (gender === 'M' || gender === 'MALE' || gender === '男') ? '男' : '女';

  // iztro: bySolar(dateStr, hourIndex, gender, isLeapMonth, lang)
  // hourIndex: 0=子 (23-1), 1=丑 (1-3), ..., 11=亥 (21-23)
  const hourIndex = Math.floor(((h + 1) % 24) / 2);
  const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  let astrolabe;
  try {
    astrolabe = astro.bySolar(dateStr, hourIndex, genderStr, false, 'zh-CN');
  } catch (e) {
    return { error: `Gagal menghitung Zi Wei Dou Shu: ${e.message}` };
  }

  // ---- INFORMASI DASAR ----
  const solarDate = astrolabe.solarDate;
  const lunarDate = astrolabe.lunarDate;
  const rawPalaces = astrolabe.palaces || [];

  // Ming Gong & Shen Gong
  const mingGongIdx = rawPalaces.findIndex(p => p.name === '命宫' || p.isBodyPalace === false && p.index === 0);
  const shenGongIdx = rawPalaces.findIndex(p => p.isBodyPalace === true);

  // 五行局
  const fiveElementsStr = astrolabe.fiveElementsClass || '';
  const fiveElements = WU_XING_JU[fiveElementsStr] || { desc: fiveElementsStr };
  const juNumber = fiveElements.number || 2;

  // Tentukan apakah Batang Tahun bersifat Yin (untuk hitung arah 长生十二神)
  // Stem 甲乙丙丁戊己庚辛壬癸 → tahun Masehi: 4=甲 5=乙 6=丙 7=丁 8=戊 9=己 0=庚 1=辛 2=壬 3=癸
  // Stem Yin (乙丁己辛癸) = tahun berakhiran 5,7,9,1,3
  // Lebih andal dari parsing astrolabe.rawDates.chineseDate yang bisa berupa objek di beberapa versi iztro
  const yearStemIsYin = [1, 3, 5, 7, 9].includes(y % 10);
  const isMale = genderStr === '男';

  // ---- 12 ISTANA ----
  const palaces = rawPalaces.map((palace, idx) => {
    const palaceName = palace.name || PALACE_NAMES_ZH[idx] || `宫${idx}`;
    const palaceInfo = PALACE_INFO[palaceName] || {};

    // Bintang di istana ini
    const majorStars = (palace.majorStars || []).map(star => ({
      name: star.name,
      brightness: star.brightness,
      brightness_id: BRIGHTNESS_ID[star.brightness] || star.brightness,
      mutagen: star.mutagen || null
    }));

    const minorStars = (palace.minorStars || []).map(star => ({
      name: star.name,
      brightness: star.brightness || '',
      mutagen: star.mutagen || null,
      type: star.type || 'minor'
    }));

    // 四化 di istana ini
    const mutagens = [
      ...majorStars.filter(s => s.mutagen).map(s => ({ star: s.name, type: s.mutagen })),
      ...minorStars.filter(s => s.mutagen).map(s => ({ star: s.name, type: s.mutagen }))
    ];

    // Interpretasi personal
    const personalMeaning = buildPalaceInterpretation(palaceName, majorStars, mutagens, palace);

    // 长生十二神 — tahap kehidupan istana ini
    const eb = palace.earthlyBranch || '';
    const lifeStage = calcLifeStage(eb, juNumber, yearStemIsYin, isMale);

    // v4e: brightness-weighted quality score for this palace
    const brightScore = majorStars.reduce((sum, s) => sum + (BRIGHTNESS_WEIGHT[s.brightness||''] || 1.0), 0);
    const palaceQuality = majorStars.length > 0 ? brightScore / majorStars.length : 1.0;
    const palaceQualityLabel = palaceQuality >= 1.4 ? '庙旺' : palaceQuality >= 1.1 ? '旺' : palaceQuality <= 0.65 ? '陷' : '平';

    return {
      index: idx,
      name: palaceName,
      name_id: palaceInfo.name_id || palaceName,
      heavenlyStem: palace.heavenlyStem || '',
      earthlyBranch: eb,
      isBodyPalace: palace.isBodyPalace || false,
      isSelf: palaceName === '命宫',
      majorStars,
      minorStars,
      mutagens,
      lifeStage,
      brightScore: Math.round(palaceQuality * 100) / 100,
      brightLabel: palaceQualityLabel,
      purpose: palaceInfo.purpose || '',
      whatToLook: palaceInfo.what_to_look || '',
      personalMeaning,
      advice: palaceInfo.advice_template || ''
    };
  });

  // ---- v4c: 三方四正 (Tri-Party Palace System) ----
  // Each palace + its opposition + two tri-party palaces = 4 palaces total read together
  // Classical ZWDS: 命宫 三方四正 = 命宫 + 迁移 + 官禄 + 财帛
  const SAN_FANG_MAP = {
    '命宫':   ['命宫','迁移','官禄','财帛'],
    '兄弟':   ['兄弟','交友','田宅','福德'],
    '夫妻':   ['夫妻','官禄','子女','迁移'],
    '子女':   ['子女','疾厄','夫妻','交友'],
    '财帛':   ['财帛','命宫','福德','官禄'],
    '疾厄':   ['疾厄','迁移','子女','田宅'],
    '迁移':   ['迁移','命宫','疾厄','官禄'],
    '交友':   ['交友','兄弟','官禄','疾厄'],
    '官禄':   ['官禄','财帛','命宫','夫妻'],
    '田宅':   ['田宅','福德','兄弟','子女'],
    '福德':   ['福德','田宅','财帛','兄弟'],
    '父母':   ['父母','疾厄','兄弟','交友']
  };
  // Helper to get stars for palace by name
  const findPalaceByName = name => palaces.find(p => p.name === name || p.name + '宫' === name || p.name === name + '宫');
  // Build tri-party star aggregate for each palace
  palaces.forEach(palace => {
    const triNames = SAN_FANG_MAP[palace.name] || SAN_FANG_MAP[palace.name.replace('宫','')] || [palace.name];
    const triPalaces = triNames.map(n => findPalaceByName(n)).filter(Boolean);
    const triStars = triPalaces.flatMap(p => p.majorStars.map(s => ({ ...s, fromPalace: p.name })));
    const triMutagens = triPalaces.flatMap(p => p.mutagens.map(m => ({ ...m, fromPalace: p.name })));
    const triBrightScore = triStars.length > 0
      ? triStars.reduce((sum, s) => sum + (BRIGHTNESS_WEIGHT[s.brightness||''] || 1.0), 0) / triStars.length
      : 1.0;
    palace.triParty = {
      palaceNames: triNames,
      stars: triStars,
      mutagens: triMutagens,
      brightScore: Math.round(triBrightScore * 100) / 100,
      brightLabel: triBrightScore >= 1.4 ? '庙旺强局' : triBrightScore >= 1.1 ? '旺' : triBrightScore <= 0.65 ? '陷弱' : '平'
    };
  });

  // ---- DA XIAN (大限) ----
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - y;

  // iztro menyediakan data horoscope per Da Xian
  let daXians = [];
  try {
    // Hitung 12 Da Xian berdasarkan struktur iztro
    // Setiap Da Xian = 10 tahun, mulai dari Ming Gong
    const startAge = fiveElements.number || 2;
    for (let i = 0; i < 12; i++) {
      const ageStart = startAge + (i * 10);
      const ageEnd = ageStart + 9;
      const yearStart = y + ageStart;
      const yearEnd = y + ageEnd;
      const palaceIdx = (mingGongIdx + i) % 12;
      const isCurrent = currentAge >= ageStart && currentAge <= ageEnd;

      // 大限四化: derive 4 transformations from this Da Xian palace's heavenly stem
      const dxPalace = palaces[palaceIdx] || {};
      const dxStem = dxPalace.heavenlyStem || '';
      const dxMutagens = (LIUNIAN_MUTAGEN_TABLE[dxStem] || []).map(m => {
        // Find which palace this star resides in
        let starPalace = null;
        for (const p of palaces) {
          const found = (p.majorStars || []).concat(p.minorStars || []).find(s => s.name === m.star);
          if (found) { starPalace = p.name; break; }
        }
        return { ...m, palace: starPalace, meaning: MUTAGEN_MEANING[m.type] || m.type };
      });
      daXians.push({
        index: i,
        ageStart,
        ageEnd,
        yearStart,
        yearEnd,
        isCurrent,
        palace: dxPalace,
        palaceName: PALACE_NAMES_ZH[palaceIdx] || `宫${palaceIdx}`,
        majorStars: dxPalace.majorStars || [],
        daXianStem: dxStem,
        daXianMutagens: dxMutagens,
        meaning: buildDaXianMeaning(PALACE_NAMES_ZH[palaceIdx], dxPalace, ageStart, ageEnd, isCurrent)
      });
    }
  } catch(e) {
    daXians = [{ error: e.message }];
  }

  const currentDaXian = daXians.find(dx => dx.isCurrent);

  // ---- XIAO XIAN & LIU NIAN (流年) ----
  let liuNian = null;
  try {
    // Liu Nian — tahun berjalan
    const liuNianPalaceIdx = (mingGongIdx + (currentAge % 12)) % 12;
    const liuNianGanzhi = astrolabe.solarDate ? getLiuNianGanzhi(currentYear) : '—';

    // Empat Transformasi Liu Nian — dari Heavenly Stem tahun berjalan
    // Build star → palace map so each mutagen entry includes which palace it activates
    const starPalaceMap = {};
    palaces.forEach(p => {
      [...(p.majorStars || []), ...(p.minorStars || [])].forEach(s => {
        starPalaceMap[s.name] = p.name;
      });
    });
    const liuNianMutagens = getLiuNianMutagens(currentYear).map(m => ({
      ...m,
      palace: starPalaceMap[m.star] || null
    }));

    liuNian = {
      year: currentYear,
      age: currentAge,
      ganzhi: liuNianGanzhi,
      xiaoxianPalace: {
        index: liuNianPalaceIdx,
        name: PALACE_NAMES_ZH[liuNianPalaceIdx],
        stars: palaces[liuNianPalaceIdx]?.majorStars || []
      },
      mutagens: liuNianMutagens,
      meaning: buildLiuNianMeaning(currentYear, currentAge, PALACE_NAMES_ZH[liuNianPalaceIdx], liuNianMutagens, currentDaXian)
    };
  } catch(e) {
    liuNian = { error: e.message, year: currentYear };
  }


  // ====== v5c: 双忌 Detection (Double 化忌) ======
  // When both 大限 and 流年 produce 化忌 on the SAME star, it's 双忌 — a critical warning
  let shuangJiWarnings = [];
  try {
    if (currentDaXian && liuNian && !liuNian.error) {
      const dxJiStars = (currentDaXian.daXianMutagens || [])
        .filter(m => m.type === '忌')
        .map(m => ({ star: m.star, palace: m.palace, source: '大限化忌' }));
      const lyJiStars = (liuNian.mutagens || [])
        .filter(m => m.type === '忌')
        .map(m => ({ star: m.star, palace: m.palace || null, source: '流年化忌' }));
      for (const dx of dxJiStars) {
        for (const ly of lyJiStars) {
          if (dx.star === ly.star) {
            shuangJiWarnings.push({
              star: dx.star,
              palace: dx.palace || ly.palace || '未知宫',
              dxStem: currentDaXian.daXianStem,
              lyYear: currentYear,
              severity: '⚠️ 双化忌 — 重大风险',
              meaning: `大限${currentDaXian.daXianStem}干化忌与流年${currentYear}化忌同时落在${dx.star}，` +
                `在${dx.palace||'?'}宫形成双忌。此为重要预警——本年度${dx.palace||'?'}宫相关事务(` +
                `感情、财务、健康、事业视宫位而定)需格外谨慎，避免重大决策、投资或冲动行为。`
            });
          }
        }
      }
    }
    // Also check ALL da xian periods for future/past 双忌 preview
    const allShuangJi = [];
    for (const dx of daXians) {
      if (!dx.daXianMutagens) continue;
      const dxJi = (dx.daXianMutagens || []).filter(m => m.type === '忌');
      if (dxJi.length === 0) continue;
      // Check each year in this da xian period
      for (let yr = dx.yearStart; yr <= dx.yearEnd; yr++) {
        const lyMutagensForYear = getLiuNianMutagens(yr);
        const lyJi = lyMutagensForYear.filter(m => m.type === '忌');
        for (const d of dxJi) {
          for (const l of lyJi) {
            if (d.star === l.star) {
              allShuangJi.push({
                year: yr,
                star: d.star,
                palace: d.palace,
                dxPeriod: `${dx.ageStart}-${dx.ageEnd}岁 (${dx.yearStart}-${dx.yearEnd})`,
                dxStem: dx.daXianStem,
                severity: '双化忌',
              });
            }
          }
        }
      }
    }
    shuangJiWarnings._all = allShuangJi;
  } catch(e) {
    shuangJiWarnings._error = e.message;
  }

  // ---- EMPAT TRANSFORMASI (四化) NATAL ----
  const natalMutagens = [];
  palaces.forEach(p => {
    p.mutagens.forEach(m => {
      natalMutagens.push({ ...m, palace: p.name });
    });
  });

  // ---- ANALISIS PERBANDINGAN BAZI-ZWDS ----
  // (data BaZi akan digabung di server.js)

  return {
    meta: {
      solarDate,
      lunarDate,
      gender: genderStr === '男' ? 'Pria (男)' : 'Wanita (女)',
      hourIndex,
      library: 'iztro v2.5.8 by SylarLong (MIT License)',
      source: 'https://github.com/SylarLong/iztro',
      school: 'Aliran default iztro — 四化 berdasarkan sistem 紫微斗数 standar'
    },
    fiveElements: {
      value: fiveElementsStr,
      ...fiveElements
    },
    mingGong: palaces.find(p => p.name === '命宫') || palaces[mingGongIdx] || null,
    shenGong: palaces.find(p => p.isBodyPalace) || null,
    palaces,
    natalMutagens,
    daXian: {
      periods: daXians,
      current: currentDaXian
    },
    liuNian,
    shuangJiWarnings,
    exportPrompt: buildZwdsExportPrompt({ palaces, fiveElementsStr, natalMutagens, daXians, currentDaXian, liuNian, currentYear, shuangJiWarnings })
  };
}

// ============================================================
// HELPER: INTERPRETASI ISTANA
// ============================================================
function buildPalaceInterpretation(palaceName, majorStars, mutagens, palace) {
  if (!majorStars || majorStars.length === 0) {
    return `Istana ${palaceName} Anda adalah istana kosong (空宫). Dalam Zi Wei, istana kosong berarti energi istana ini lebih dipengaruhi oleh istana yang berhadapan (对宫). Ini bukan pertanda buruk — justru menunjukkan fleksibilitas dan kemampuan adaptasi di area kehidupan ini.`;
  }

  const starNames = majorStars.map(s => `${s.name}(${s.brightness || ''})`).join('、');
  const topStar = majorStars[0];
  const mutagenDesc = mutagens.length > 0
    ? ` Terdapat transformasi ${mutagens.map(m => `${m.type}化${m.star}`).join('、')}.`
    : '';

  // Rule-based berdasarkan bintang utama
  const STAR_MEANINGS = {
    '紫微': 'Zi Wei (紫微) — Raja Bintang. Kehadiran bintang ini membawa otoritas, kepemimpinan, dan kemampuan menarik dukungan dari orang-orang penting.',
    '天机': 'Tian Ji (天机) — Bintang Strategi. Membawa kecerdasan, kemampuan analisis, dan fleksibilitas berpikir yang luar biasa.',
    '太阳': 'Tai Yang (太阳) — Matahari. Membawa kemurahan hati, kepemimpinan, popularitas, dan karisma publik.',
    '武曲': 'Wu Qu (武曲) — Bintang Pejuang. Membawa ketangguhan, kemampuan finansial dari kerja keras, dan determinasi.',
    '天同': 'Tian Tong (天同) — Bintang Kebahagiaan. Membawa kesenangan, kreativitas, dan kemampuan menikmati hidup.',
    '廉贞': 'Lian Zhen (廉贞) — Bintang Penjara/Keindahan. Energi yang intens — bisa membawa kemewahan atau konflik tergantung konteks.',
    '天府': 'Tian Fu (天府) — Bintang Perbendaharaan. Membawa stabilitas, kemakmuran, dan kemampuan mengakumulasi kekayaan.',
    '太阴': 'Tai Yin (太阴) — Bulan. Membawa kelembutan, intuisi, keindahan estetis, dan kekayaan dari properti.',
    '贪狼': 'Tan Lang (贪狼) — Bintang Serigala Serakah. Membawa daya tarik, ambisi, bakat seni, dan kehidupan cinta yang aktif.',
    '巨门': 'Ju Men (巨门) — Gerbang Besar. Membawa kemampuan verbal, perdebatan, dan kekuatan komunikasi yang unik.',
    '天相': 'Tian Xiang (天相) — Bintang Perdana Menteri. Membawa kemampuan diplomasi, administrasi, dan dukungan dari orang berpengaruh.',
    '天梁': 'Tian Liang (天梁) — Bintang Pelindung. Membawa kemampuan melindungi orang lain, panjang umur, dan kebijaksanaan.',
    '七杀': 'Qi Sha (七杀) — Tujuh Pembunuh. Energi yang sangat kuat dan berani — bisa membawa kehebatan atau konflik ekstrem.',
    '破军': 'Po Jun (破军) — Pembongkar. Membawa energi perubahan radikal, pembaruan, dan kemampuan mendobrak status quo.'
  };

  const starMeaning = STAR_MEANINGS[topStar?.name] || `Bintang ${topStar?.name}`;

  return `Bintang di istana ini: ${starNames}.${mutagenDesc} ${starMeaning} Ini menunjukkan bahwa area kehidupan yang diwakili istana ini memiliki energi yang ${topStar?.brightness === '庙' || topStar?.brightness === '旺' ? 'sangat kuat dan menguntungkan' : topStar?.brightness === '陷' ? 'perlu diperhatikan lebih seksama' : 'cukup seimbang'}.`;
}

function buildDaXianMeaning(palaceName, palace, ageStart, ageEnd, isCurrent) {
  const stars = palace?.majorStars || [];
  // v4e: brightness-weighted star quality score
  let brightScore = 0;
  const starDesc = stars.length > 0 ? stars.map(s => {
    const bw = BRIGHTNESS_WEIGHT[s.brightness || ''] || 1.0;
    brightScore += bw;
    return `${s.name}(${s.brightness||'?'})`;
  }).join('、') : 'istana kosong';
  const avgBright = stars.length > 0 ? brightScore / stars.length : 1.0;
  const brightLabel = avgBright >= 1.4 ? '(庙旺强局)' : avgBright >= 1.1 ? '(气势佳)' : avgBright <= 0.65 ? '(星耀偏陷，需谨慎)' : '';
  const currentMark = isCurrent ? ' [PERIODE SAAT INI]' : '';
  return `Usia ${ageStart}-${ageEnd} tahun${currentMark}: Fokus pada istana ${palaceName}${brightLabel} dengan bintang ${starDesc}. ${PALACE_INFO[palaceName]?.purpose || ''}`;
}

function buildLiuNianMeaning(year, age, xiaoxianPalace, mutagens, currentDaXian) {
  const mutagenDesc = mutagens.length > 0
    ? `四化 tahun ${year}: ${mutagens.map(m => `化${m.type}→${m.star}`).join(', ')}.`
    : `Tidak ada 四化 khusus yang menonjol di tahun ${year}.`;

  return `Tahun ${year} (usia ${age} tahun): Xiao Xian aktif di ${xiaoxianPalace}. ${mutagenDesc} ${currentDaXian ? `Dikombinasikan dengan Da Xian ${currentDaXian.palaceName} (${currentDaXian.ageStart}-${currentDaXian.ageEnd}), tahun ini` : 'Tahun ini'} merupakan waktu untuk memperhatikan tema ${PALACE_INFO[xiaoxianPalace]?.purpose || xiaoxianPalace}.`;
}

// ============================================================
// HELPER: GANZI TAHUNAN & MUTAGEN
// ============================================================
const HEAVENLY_STEMS_ORDER = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const EARTHLY_BRANCHES_ORDER = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

function getLiuNianGanzhi(year) {
  // Tahun 甲子 = 1984
  const base = 1984;
  const diff = year - base;
  const stem = HEAVENLY_STEMS_ORDER[((diff % 10) + 10) % 10];
  const branch = EARTHLY_BRANCHES_ORDER[((diff % 12) + 12) % 12];
  return stem + branch;
}

// 四化 berdasarkan Heavenly Stem tahun berjalan
// Sumber: tabel 四化 standar Zi Wei Dou Shu
const LIUNIAN_MUTAGEN_TABLE = {
  '甲': [{ type: '禄', star: '廉贞' }, { type: '权', star: '破军' }, { type: '科', star: '武曲' }, { type: '忌', star: '太阳' }],
  '乙': [{ type: '禄', star: '天机' }, { type: '权', star: '天梁' }, { type: '科', star: '紫微' }, { type: '忌', star: '太阴' }],
  '丙': [{ type: '禄', star: '天同' }, { type: '权', star: '天机' }, { type: '科', star: '文昌' }, { type: '忌', star: '廉贞' }],
  '丁': [{ type: '禄', star: '太阴' }, { type: '权', star: '天同' }, { type: '科', star: '天机' }, { type: '忌', star: '巨门' }],
  '戊': [{ type: '禄', star: '贪狼' }, { type: '权', star: '太阴' }, { type: '科', star: '右弼' }, { type: '忌', star: '天机' }],
  '己': [{ type: '禄', star: '武曲' }, { type: '权', star: '贪狼' }, { type: '科', star: '天梁' }, { type: '忌', star: '文曲' }],
  '庚': [{ type: '禄', star: '太阳' }, { type: '权', star: '武曲' }, { type: '科', star: '太阴' }, { type: '忌', star: '天同' }],
  '辛': [{ type: '禄', star: '巨门' }, { type: '权', star: '太阳' }, { type: '科', star: '文曲' }, { type: '忌', star: '文昌' }],
  '壬': [{ type: '禄', star: '天梁' }, { type: '权', star: '紫微' }, { type: '科', star: '左辅' }, { type: '忌', star: '武曲' }],
  '癸': [{ type: '禄', star: '破军' }, { type: '权', star: '巨门' }, { type: '科', star: '太阴' }, { type: '忌', star: '贪狼' }]
};

const MUTAGEN_MEANING = {
  '禄': '化禄 — Rezeki & Kemakmuran: energi positif yang mendatangkan peluang dan kelancaran di bidang yang terkena',
  '权': '化权 — Kekuasaan & Otoritas: energi yang memperkuat posisi, pengambilan keputusan, dan kepemimpinan',
  '科': '化科 — Reputasi & Ilmu: energi yang meningkatkan reputasi, pembelajaran, dan pengakuan publik',
  '忌': '化忌 — Hambatan & Perhatian: energi yang perlu diwaspadai — bukan nasib buruk, tetapi area yang memerlukan perhatian ekstra'
};

function getLiuNianMutagens(year) {
  const gz = getLiuNianGanzhi(year);
  const stem = gz[0];
  const mutagens = LIUNIAN_MUTAGEN_TABLE[stem] || [];
  return mutagens.map(m => ({
    ...m,
    meaning: MUTAGEN_MEANING[m.type] || m.type
  }));
}

// ============================================================
// EXPORT PROMPT UNTUK CLAUDE
// ============================================================
function buildZwdsExportPrompt({ palaces, fiveElementsStr, natalMutagens, currentDaXian, liuNian, currentYear, shuangJiWarnings }) {
  // iztro returns most palace names WITHOUT 宫 suffix (e.g., '财帛' not '财帛宫'), except '命宫'
  const findPalace = name => palaces.find(p => p.name === name) || palaces.find(p => p.name + '宫' === name);
  const mingStars = findPalace('命宫')?.majorStars?.map(s => s.name).join('、') || '(kosong)';
  const caiStars  = findPalace('财帛')?.majorStars?.map(s => s.name).join('、') || '(kosong)';
  const guanStars = findPalace('官禄')?.majorStars?.map(s => s.name).join('、') || '(kosong)';
  const fuqiStars = findPalace('夫妻')?.majorStars?.map(s => s.name).join('、') || '(kosong)';

  return `# Data Zi Wei Dou Shu untuk Interpretasi Naratif

Tolong tulis narasi interpretasi personal berdasarkan data Zi Wei Dou Shu berikut. Bahasa Indonesia. Jangan menghitung ulang.

## Lima Unsur Struktur: ${fiveElementsStr}

## Istana Kunci:
- 命宫 (Ming Gong): ${mingStars}
- 财帛宫 (Keuangan): ${caiStars}
- 官禄宫 (Karir): ${guanStars}
- 夫妻宫 (Pasangan): ${fuqiStars}

## Empat Transformasi Natal: ${natalMutagens.map(m => `${m.type}化${m.star}(${m.palace})`).join(', ')}

## 三方四正命宫 (Ming Gong Tri-Party):
${(() => {
  const mg = palaces.find(p => p.name === '命宫');
  if (!mg || !mg.triParty) return '(tidak tersedia)';
  const triStars = mg.triParty.stars.map(s => `${s.name}(${s.brightness||'?'})@${s.fromPalace}`).join('、');
  const triMut = mg.triParty.mutagens.map(m => `${m.type}化${m.star}@${m.fromPalace}`).join(', ');
  return `Bintang tri-party: ${triStars||'(kosong)'}\nMutagen tri-party: ${triMut||'(tidak ada)'}\nKualitas brightness: ${mg.triParty.brightLabel} (${mg.triParty.brightScore})`;
})()}

## Da Xian Saat Ini: ${currentDaXian ? `${currentDaXian.palaceName} (${currentDaXian.ageStart}-${currentDaXian.ageEnd} tahun)` : 'Tidak tersedia'}
${currentDaXian && currentDaXian.daXianStem ? `### 大限四化 (天干 ${currentDaXian.daXianStem}):
${(currentDaXian.daXianMutagens||[]).map(m => `- ${m.type}化${m.star} → 在${m.palace||'未知'}宫: ${m.meaning}`).join('\n')}` : ''}

## Liu Nian ${currentYear}: ${liuNian?.ganzhi || '—'}, Xiao Xian di ${liuNian?.xiaoxianPalace?.name || '—'}
四化: ${liuNian?.mutagens?.map(m => `化${m.type}→${m.star}`).join(', ') || 'Tidak ada'}

## ⚠️ 双化忌 Peringatan (Tahun Ini)
${shuangJiWarnings && shuangJiWarnings.length > 0
  ? shuangJiWarnings.map(w => `- ${w.severity}: ${w.meaning}`).join('\n')
  : 'Tidak ada 双忌 tahun ini — tidak ada bintang yang terkena 化忌 ganda.'}

## 双化忌 Preview (Semua Periode)
${shuangJiWarnings?._all?.length > 0
  ? shuangJiWarnings._all.slice(0,10).map(w => `${w.year}年: ${w.star} 双忌 di ${w.palace||'?'} (${w.dxPeriod})`).join('\n')
  : 'Tidak ada 双忌 terdeteksi.'}

Tolong tulis narasi yang mencakup: karakter dari bintang Ming Gong, peluang karir, kehidupan cinta, kondisi keuangan, dan saran untuk tahun ${currentYear}.`;
}

module.exports = { calculateZwds, getLiuNianGanzhi, getLiuNianMutagens, LIUNIAN_MUTAGEN_TABLE };
