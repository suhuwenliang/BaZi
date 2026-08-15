'use strict';

/**
 * engines/compatibility.js
 * Analisis kompatibilitas antara dua individu berdasarkan:
 * - BaZi (八字): interaksi Day Master, elemen, pillar clash/combine
 * - Zi Wei Dou Shu (紫微斗數): palace stars perbandingan
 * - Qi Men Dun Jia (奇門遁甲): interaksi palace Nianjia
 *
 * Tipe relasi: 'spouse' | 'child' | 'parent' | 'sibling_older' | 'sibling_younger' | 'friend' | 'colleague'
 */

// ============================================================
// DATA TABEL
// ============================================================

// Interaksi antar Heavenly Stem (天干合冲)
const STEM_HE = { // Liu He 六合 pasangan
  '甲': '己', '己': '甲',
  '乙': '庚', '庚': '乙',
  '丙': '辛', '辛': '丙',
  '丁': '壬', '壬': '丁',
  '戊': '癸', '癸': '甲' // 戊癸合
};
const STEM_HE_RESULT = {
  '甲己': '土 (Stabilitas & Kepercayaan)',
  '乙庚': '金 (Ketegasan & Komitmen)',
  '丙辛': '水 (Kebijaksanaan & Kedalaman)',
  '丁壬': '木 (Pertumbuhan & Kreativitas)',
  '戊癸': '火 (Semangat & Transformasi)'
};
const STEM_CHONG = { // Clash
  '甲': '庚', '庚': '甲',
  '乙': '辛', '辛': '乙',
  '丙': '壬', '壬': '丙',
  '丁': '癸', '癸': '丁'
};

// Interaksi Branch (地支)
const BRANCH_HE6 = { // 六合
  '子': '丑', '丑': '子',
  '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯',
  '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳',
  '午': '未', '未': '午'
};
const BRANCH_CHONG = { // 六冲
  '子': '午', '午': '子',
  '丑': '未', '未': '丑',
  '寅': '申', '申': '寅',
  '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰',
  '巳': '亥', '亥': '巳'
};
const BRANCH_SANHE = [ // 三合
  ['申', '子', '辰'], // 水局
  ['寅', '午', '戌'], // 火局
  ['亥', '卯', '未'], // 木局
  ['巳', '酉', '丑']  // 金局
];
const BRANCH_SANHE_ELEMENT = { '申子辰': '水', '寅午戌': '火', '亥卯未': '木', '巳酉丑': '金' };

// Unsur Wu Xing
const ELEMENT_NAME = { '木': 'Kayu (木)', '火': 'Api (火)', '土': 'Tanah (土)', '金': 'Logam (金)', '水': 'Air (水)' };
const GENERATES = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }; // A menghasilkan B
const CONTROLS  = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }; // A mengontrol B

// Nama batang langit dalam bahasa Indonesia
const STEM_ID = {
  '甲': 'Jiǎ (Kayu Yang)', '乙': 'Yǐ (Kayu Yin)', '丙': 'Bǐng (Api Yang)',
  '丁': 'Dīng (Api Yin)', '戊': 'Wù (Tanah Yang)', '己': 'Jǐ (Tanah Yin)',
  '庚': 'Gēng (Logam Yang)', '辛': 'Xīn (Logam Yin)', '壬': 'Rén (Air Yang)',
  '癸': 'Guǐ (Air Yin)'
};
const STEM_ELEMENT = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};
const BRANCH_ELEMENT = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// Ten Gods dari perspektif Day Master
const TEN_GOD_TABLE = {
  // [dayMasterElement][otherElement] → Ten God
  '木': { '木': '比肩/劫财', '火': '食神/伤官', '土': '正财/偏财', '金': '正官/七杀', '水': '正印/偏印' },
  '火': { '火': '比肩/劫财', '土': '食神/伤官', '金': '正财/偏财', '水': '正官/七杀', '木': '正印/偏印' },
  '土': { '土': '比肩/劫财', '金': '食神/伤官', '水': '正财/偏财', '木': '正官/七杀', '火': '正印/偏印' },
  '金': { '金': '比肩/劫财', '水': '食神/伤官', '木': '正财/偏财', '火': '正官/七杀', '土': '正印/偏印' },
  '水': { '水': '比肩/劫财', '木': '食神/伤官', '火': '正财/偏财', '土': '正官/七杀', '金': '正印/偏印' },
};

const TEN_GOD_MEANING = {
  '比肩/劫财': 'Saudara Sejawat — setara, saling mendukung namun juga bersaing',
  '食神/伤官': 'Ekspresi & Kreativitas — A menginspirasi dan "melahirkan" B, hubungan kreatif',
  '正财/偏财': 'Rezeki & Kekayaan — B membawa manfaat material dan stabilitas bagi A',
  '正官/七杀': 'Otoritas & Kontrol — B memberi arahan/batasan pada A, bisa mendisiplinkan',
  '正印/偏印': 'Dukungan & Pengasuhan — B memelihara, mendukung, dan memberi energi pada A'
};

// Konteks per tipe relasi
const RELATION_CONTEXT = {
  spouse:           { label: 'Pasangan (Suami/Istri)', pronoun: 'pasangan', icon: '💑' },
  child:            { label: 'Anak',                    pronoun: 'anak',     icon: '👶' },
  parent:           { label: 'Orang Tua',               pronoun: 'orang tua',icon: '👨‍👩‍👧' },
  sibling_older:    { label: 'Kakak',                   pronoun: 'kakak',    icon: '👥' },
  sibling_younger:  { label: 'Adik',                    pronoun: 'adik',     icon: '👥' },
  friend:           { label: 'Teman',                   pronoun: 'teman',    icon: '🤝' },
  colleague:        { label: 'Rekan Kerja',             pronoun: 'rekan',    icon: '💼' }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getElementInteraction(elemA, elemB) {
  if (elemA === elemB) return { type: 'same', label: 'Sesama Unsur', score: 1 };
  if (GENERATES[elemA] === elemB) return { type: 'generates', label: 'A Menghasilkan B (母子)', score: 2 };
  if (GENERATES[elemB] === elemA) return { type: 'generated', label: 'B Menghasilkan A (子母)', score: 2 };
  if (CONTROLS[elemA] === elemB) return { type: 'controls', label: 'A Mengontrol B', score: 0 };
  if (CONTROLS[elemB] === elemA) return { type: 'controlled', label: 'B Mengontrol A', score: -1 };
  return { type: 'neutral', label: 'Netral', score: 1 };
}

function checkStemHe(stemA, stemB) {
  if (STEM_HE[stemA] === stemB) {
    const key = [stemA, stemB].sort().join('') in STEM_HE_RESULT
      ? [stemA, stemB].sort().join('')
      : [stemB, stemA].sort().join('');
    // Try both orders
    const result = STEM_HE_RESULT[stemA+stemB] || STEM_HE_RESULT[stemB+stemA] || 'Harmoni';
    return { he: true, result };
  }
  return { he: false };
}

function checkStemChong(stemA, stemB) {
  return STEM_CHONG[stemA] === stemB;
}

function checkBranchHe(brA, brB) {
  return BRANCH_HE6[brA] === brB;
}

function checkBranchChong(brA, brB) {
  return BRANCH_CHONG[brA] === brB;
}

function checkSanHe(brA, brB) {
  for (const group of BRANCH_SANHE) {
    if (group.includes(brA) && group.includes(brB)) return group;
  }
  return null;
}

// ============================================================
// MAIN COMPATIBILITY ANALYSIS
// ============================================================

function analyzeCompatibility(baziA, baziB, zwdsA, zwdsB, qmdjA, qmdjB, relationshipType, nameA, nameB) {
  const rel = RELATION_CONTEXT[relationshipType] || RELATION_CONTEXT.friend;

  // Ekstrak Day Master
  const dmA = baziA?.dayMaster?.stem || '';
  const dmB = baziB?.dayMaster?.stem || '';
  const elemA = STEM_ELEMENT[dmA] || baziA?.dayMaster?.element_cn || '?';
  const elemB = STEM_ELEMENT[dmB] || baziB?.dayMaster?.element_cn || '?';

  // Ekstrak Day Branch (Earthly Branch of Day Pillar)
  const dayPillarA = baziA?.pillars?.day || {};
  const dayPillarB = baziB?.pillars?.day || {};
  const branchA = dayPillarA.branch || dayPillarA.eb || '';
  const branchB = dayPillarB.branch || dayPillarB.eb || '';

  // Ekstrak Hour Branch
  const hourBrA = baziA?.pillars?.hour?.branch || baziA?.pillars?.hour?.eb || '';
  const hourBrB = baziB?.pillars?.hour?.branch || baziB?.pillars?.hour?.eb || '';

  // Interaksi elemen
  const elemInteract = getElementInteraction(elemA, elemB);

  // Stem interaction
  const stemHeResult   = checkStemHe(dmA, dmB);
  const stemChongResult = checkStemChong(dmA, dmB);

  // Branch interactions
  const dayBrHe    = branchA && branchB && checkBranchHe(branchA, branchB);
  const dayBrChong = branchA && branchB && checkBranchChong(branchA, branchB);
  const sanHe      = branchA && branchB && checkSanHe(branchA, branchB);

  // Ten Gods A→B dan B→A
  const tenGodAB = TEN_GOD_TABLE[elemA]?.[elemB] || '—';
  const tenGodBA = TEN_GOD_TABLE[elemB]?.[elemA] || '—';

  // Skor keseluruhan
  let compatScore = elemInteract.score;
  if (stemHeResult.he) compatScore += 3;
  if (stemChongResult)  compatScore -= 2;
  if (dayBrHe)         compatScore += 2;
  if (dayBrChong)      compatScore -= 2;
  if (sanHe)           compatScore += 2;

  // ZWDS Spouse Palace (夫妻宫 = palace index 1 typically)
  const spouseStarsA = zwdsA?.palaces?.[1]?.majorStars?.map(s => s.name || s).join('、') || '—';
  const spouseStarsB = zwdsB?.palaces?.[1]?.majorStars?.map(s => s.name || s).join('、') || '—';
  const lifeStarsA   = zwdsA?.palaces?.[0]?.majorStars?.map(s => s.name || s).join('、') || '—';
  const lifeStarsB   = zwdsB?.palaces?.[0]?.majorStars?.map(s => s.name || s).join('、') || '—';

  // QMDJ overall quality
  const qmdjQualA = qmdjA?.overallQuality || '—';
  const qmdjQualB = qmdjB?.overallQuality || '—';

  // ============================================================
  // NARASI ANALISIS
  // ============================================================

  const nameAShort = nameA || 'Anda';
  const nameBShort = nameB || `${rel.pronoun}`;

  // 1. Karakter Pasangan/Keluarga/Teman
  const profileB = generateProfileNarasi(baziB, zwdsB, nameBShort, rel);

  // 2. Interaksi Elemen
  const elementNarasi = generateElementNarasi(elemA, elemB, elemInteract, tenGodAB, tenGodBA, nameAShort, nameBShort, rel);

  // 3. Kelebihan & Kekurangan
  const strengthsWeaknesses = generateStrengthsWeaknesses(elemA, elemB, elemInteract, stemHeResult, stemChongResult, dayBrHe, dayBrChong, sanHe, nameAShort, nameBShort, rel);

  // 4. Clash / Kombinasi
  const clashCombine = generateClashCombine(dmA, dmB, branchA, branchB, stemHeResult, stemChongResult, dayBrHe, dayBrChong, sanHe, nameAShort, nameBShort);

  // 5. Potensi ke Depan
  const futureProspect = generateFutureProspect(compatScore, elemInteract, relationshipType, nameAShort, nameBShort, rel);

  // 6. Cara Handle
  const howToHandle = generateHowToHandle(elemA, elemB, elemInteract, tenGodAB, relationshipType, nameAShort, nameBShort, rel);

  // 7. Kesimpulan
  const conclusion = generateConclusion(compatScore, elemInteract, stemHeResult, stemChongResult, nameAShort, nameBShort, rel);

  // 8. Cara Meningkatkan
  const howToImprove = generateHowToImprove(elemA, elemB, elemInteract, qmdjQualA, qmdjQualB, nameAShort, nameBShort, rel);

  return {
    relationshipType,
    relationLabel: rel.label,
    nameA: nameAShort,
    nameB: nameBShort,
    compatScore,
    compatRating: getCompatRating(compatScore),
    summary: {
      dayMasterA: { stem: dmA, element: elemA, label: STEM_ID[dmA] || dmA },
      dayMasterB: { stem: dmB, element: elemB, label: STEM_ID[dmB] || dmB },
      elementInteraction: elemInteract,
      stemHe: stemHeResult,
      stemChong: stemChongResult,
      dayBranchHe: dayBrHe,
      dayBranchChong: dayBrChong,
      sanHe: sanHe ? sanHe.join('') : null,
      tenGodAB, tenGodBA,
      spouseStarsA, spouseStarsB,
      lifeStarsA, lifeStarsB,
      qmdjQualA, qmdjQualB
    },
    sections: {
      profileB,
      elementNarasi,
      strengthsWeaknesses,
      clashCombine,
      futureProspect,
      howToHandle,
      conclusion,
      howToImprove
    }
  };
}

function getCompatRating(score) {
  if (score >= 6) return { label: '🟢 Sangat Harmonis', color: '#15803d' };
  if (score >= 3) return { label: '🔵 Harmonis', color: '#1d4ed8' };
  if (score >= 1) return { label: '⚪ Cukup Serasi', color: '#6b7280' };
  if (score >= -1) return { label: '🟡 Perlu Penyesuaian', color: '#b45309' };
  return { label: '🔴 Banyak Tantangan', color: '#b91c1c' };
}

// ============================================================
// NARASI GENERATORS
// ============================================================

function generateProfileNarasi(baziB, zwdsB, nameB, rel) {
  const dmB  = baziB?.dayMaster?.stem || '';
  const elemB = STEM_ELEMENT[dmB] || '?';
  const strengthB = baziB?.wuXing?.dominant || elemB;
  const dmLabel = STEM_ID[dmB] || dmB;

  const ELEM_PERSONALITY = {
    '木': 'memiliki jiwa yang tumbuh dan berkembang — penuh inisiatif, kreatif, dan berorientasi pada kemajuan. Cenderung idealis dan punya visi jangka panjang, namun terkadang kurang fleksibel ketika bertemu hambatan.',
    '火': 'memiliki kepribadian yang bersemangat dan ekspresif — antusias, karismatik, dan pandai memotivasi orang lain. Emosinya kuat dan tulus, namun perlu menjaga agar semangat tidak padam terlalu cepat.',
    '土': 'memiliki karakter yang stabil dan dapat diandalkan — sabar, setia, dan menjadi fondasi bagi orang-orang di sekitarnya. Cenderung konservatif namun sangat terpercaya dan penuh dedikasi.',
    '金': 'memiliki sifat yang tegas dan berprinsip — jujur, efisien, dan berorientasi pada hasil nyata. Komitmennya kuat, namun terkadang terkesan keras atau kurang fleksibel dalam berkompromi.',
    '水': 'memiliki kepribadian yang dalam dan adaptif — bijaksana, intuitif, dan pandai membaca situasi. Sangat fleksibel dan bisa menyesuaikan diri, namun terkadang menyimpan banyak hal dalam hati.'
  };

  const lifeStars = zwdsB?.palaces?.[0]?.majorStars?.map(s => s.name || s) || [];
  const lifeStarStr = lifeStars.length > 0
    ? ` Dalam Zi Wei Dou Shu, Istana Kehidupan ${nameB} dihuni oleh ${lifeStars.join(' dan ')}, yang menambahkan nuansa ${getStarNuance(lifeStars)} pada kepribadiannya.`
    : '';

  return `**Profil ${rel.label} Anda (${nameB})**

${nameB} lahir dengan Day Master ${dmLabel}, yang berarti ${nameB} ${ELEM_PERSONALITY[elemB] || 'memiliki karakter yang unik dan kompleks.'}${lifeStarStr}

Unsur dominan ${nameB} adalah **${ELEMENT_NAME[strengthB] || strengthB}**, yang membentuk cara ia melihat dunia, membuat keputusan, dan berinteraksi dalam hubungan. Memahami karakter dasar ini adalah langkah pertama untuk membangun hubungan yang lebih dalam dan bermakna.`;
}

function getStarNuance(stars) {
  const starMap = {
    '紫微': 'kepemimpinan dan kebangsawanan',
    '天机': 'kecerdasan dan strategi',
    '太阳': 'kehangatan dan kemurahan hati',
    '武曲': 'ketegasan dan orientasi finansial',
    '天同': 'ketenangan dan kebahagiaan',
    '廉贞': 'ambisi dan daya tarik sosial',
    '天府': 'stabilitas dan kebijaksanaan',
    '太阴': 'kelembutan dan intuisi',
    '贪狼': 'pesona dan multibakat',
    '巨门': 'komunikasi dan analisis kritis',
    '天相': 'dukungan dan kerjasama',
    '天梁': 'perlindungan dan kebijaksanaan tua',
    '七杀': 'semangat juang dan keberanian',
    '破军': 'inovasi dan keberanian mengubah'
  };
  return stars.map(s => starMap[s] || s).join(' serta ');
}

function generateElementNarasi(elemA, elemB, interact, tenGodAB, tenGodBA, nameA, nameB, rel) {
  const interactDesc = {
    same:      `Anda dan ${nameB} berbagi unsur yang sama (${ELEMENT_NAME[elemA]}). Ini menciptakan pemahaman intuitif yang kuat — Anda berdua sering berpikir dengan cara yang serupa dan merespons situasi dengan pola yang mirip.`,
    generates: `Unsur Anda (${ELEMENT_NAME[elemA]}) secara alami **menghasilkan dan memelihara** unsur ${nameB} (${ELEMENT_NAME[elemB]}). Anda adalah sumber energi dan dukungan bagi ${nameB} — ia cenderung tumbuh dan berkembang berkat kehadiran Anda.`,
    generated: `Unsur ${nameB} (${ELEMENT_NAME[elemB]}) secara alami **menghasilkan dan memelihara** unsur Anda (${ELEMENT_NAME[elemA]}). ${nameB} adalah sumber dukungan dan energi bagi Anda — kehadirannya membuat Anda lebih kuat dan lebih percaya diri.`,
    controls:  `Unsur Anda (${ELEMENT_NAME[elemA]}) secara alami **mengontrol** unsur ${nameB} (${ELEMENT_NAME[elemB]}). Ini bisa positif sebagai bimbingan, namun perlu hati-hati agar tidak terasa sebagai dominasi yang membatasi ruang gerak ${nameB}.`,
    controlled:`Unsur ${nameB} (${ELEMENT_NAME[elemB]}) secara alami **mengontrol** unsur Anda (${ELEMENT_NAME[elemA]}). ${nameB} cenderung memberi arahan dan batasan dalam hubungan ini — bisa membantu Anda lebih terstruktur, namun juga bisa terasa membatasi jika tidak dikelola dengan baik.`,
    neutral:   `Interaksi antara unsur Anda (${ELEMENT_NAME[elemA]}) dan ${nameB} (${ELEMENT_NAME[elemB]}) bersifat netral — tidak ada konflik elementer yang kuat, namun juga tidak ada sinergi otomatis.`
  };

  const tenGodDesc = TEN_GOD_MEANING[tenGodAB] || '';
  const tenGodDescBA = TEN_GOD_MEANING[tenGodBA] || '';

  return `**Interaksi Elemen — BaZi, ZWDS & QMDJ**

${interactDesc[interact.type] || ''}

Dari perspektif Anda (${nameA}), ${nameB} berperan sebagai **${tenGodAB}** dalam hidup Anda — artinya ${tenGodDesc}.

Sebaliknya, dari perspektif ${nameB}, Anda berperan sebagai **${tenGodBA}** — artinya ${tenGodDescBA}.

Dalam Zi Wei Dou Shu, interaksi bintang di palace masing-masing mencerminkan dinamika ini lebih dalam lagi — apakah saling melengkapi, saling menguatkan, atau saling membutuhkan penyesuaian.`;
}

function generateStrengthsWeaknesses(elemA, elemB, interact, stemHe, stemChong, brHe, brChong, sanHe, nameA, nameB, rel) {
  const strengths = [];
  const weaknesses = [];

  if (stemHe.he) {
    strengths.push(`**Harmoni Batang Langit (天干六合):** Day Master Anda dan ${nameB} saling berpasangan secara kosmis — ini adalah tanda kuat bahwa hubungan ini memiliki "benang merah" takdir. Kombinasi ini menciptakan daya tarik yang alami dan saling melengkapi.`);
  }
  if (brHe) {
    strengths.push(`**Harmoni Cabang Hari (地支六合):** Day Branch Anda dan ${nameB} berpasangan — menandakan keserasian dalam ritme harian, kebiasaan hidup, dan cara masing-masing menjalani hari.`);
  }
  if (sanHe) {
    strengths.push(`**Tiga Keselarasan (三合局):** Branch Anda dan ${nameB} membentuk bagian dari kelompok 三合 — ini menciptakan sinergi yang memperkuat kedua belah pihak secara bersama-sama.`);
  }
  if (interact.type === 'generates' || interact.type === 'generated') {
    strengths.push(`**Siklus Saling Menghidupi:** Elemen Anda dan ${nameB} berada dalam hubungan "ibu dan anak" — satu pihak secara alami memberi energi kepada yang lain, menciptakan hubungan yang saling mengisi.`);
  }
  if (interact.type === 'same') {
    strengths.push(`**Kesamaan Karakter:** Kesamaan unsur menciptakan rasa saling mengerti yang dalam — Anda berdua sering tidak perlu banyak kata untuk memahami satu sama lain.`);
    weaknesses.push(`**Cerminan Kelemahan:** Karena elemen sama, kelemahan Anda cenderung juga dimiliki ${nameB}. Ini bisa membuat area-area yang perlu dikembangkan tidak tertangani jika tidak disadari bersama.`);
  }
  if (stemChong) {
    weaknesses.push(`**Benturan Batang Langit (天干冲):** Day Master Anda dan ${nameB} saling berhadapan secara elementer — ini bisa menciptakan tegangan karakter yang kuat. Perbedaan cara pandang fundamental sering menjadi sumber gesekan.`);
  }
  if (brChong) {
    weaknesses.push(`**Benturan Cabang Hari (地支冲):** Day Branch berbenturan — menandakan perbedaan dalam ritme hidup, kebiasaan sehari-hari, dan cara merespons situasi. Ini perlu kesabaran ekstra dalam kehidupan bersama.`);
  }
  if (interact.type === 'controls' || interact.type === 'controlled') {
    weaknesses.push(`**Dinamika Kontrol:** Interaksi elementer Anda dengan ${nameB} menciptakan hubungan di mana satu pihak cenderung "mengarahkan" yang lain. Tanpa kesadaran, ini bisa berkembang menjadi dominasi yang menghambat keseimbangan.`);
  }

  if (strengths.length === 0) strengths.push('Hubungan ini memiliki ruang yang luas untuk dibangun melalui usaha sadar dan saling pengertian — tidak ada hambatan kosmis yang tidak bisa diatasi.');
  if (weaknesses.length === 0) weaknesses.push('Tidak terdeteksi benturan elementer yang signifikan — tantangan dalam hubungan ini lebih banyak berasal dari faktor kepribadian dan lingkungan daripada konflik elemental.');

  return `**Kelebihan Hubungan**

${strengths.join('\n\n')}

**Area yang Perlu Perhatian**

${weaknesses.join('\n\n')}`;
}

function generateClashCombine(stemA, stemB, brA, brB, stemHe, stemChong, brHe, brChong, sanHe, nameA, nameB) {
  const items = [];

  if (stemHe.he) {
    items.push(`✅ **六合 Batang Langit (${stemA}${stemB}):** Pasangan batang langit yang melebur menjadi unsur ${stemHe.result}. Ini adalah tanda harmoni takdir yang kuat — kedua individu saling "menarik" satu sama lain secara kosmis.`);
  }
  if (stemChong) {
    items.push(`⚔️ **冲 Batang Langit (${stemA}↔${stemB}):** Batang langit saling berbenturan. Ini menciptakan tegangan energi yang bisa memicu perdebatan ide, perbedaan prinsip, atau kompetisi tersembunyi.`);
  }
  if (brHe && brA && brB) {
    items.push(`✅ **六合 Cabang Hari (${brA}${brB}):** Branch hari saling berpasangan — kecocokan dalam ritme dan kebiasaan hidup sehari-hari.`);
  }
  if (brChong && brA && brB) {
    items.push(`⚔️ **六冲 Cabang Hari (${brA}↔${brB}):** Branch hari saling berbenturan — perlu ekstra sabar dalam rutinitas dan cara hidup bersama.`);
  }
  if (sanHe) {
    items.push(`✅ **三合局 (${sanHe.join('')}):** Branch membentuk tiga keselarasan — sinergi yang memperkuat keduanya dan menciptakan stabilitas jangka panjang.`);
  }
  if (items.length === 0) {
    items.push('⚪ Tidak terdeteksi kombinasi atau benturan mayor antara batang dan cabang hari kedua individu. Dinamika hubungan ini lebih banyak dibentuk oleh kepribadian, komunikasi, dan pilihan sadar sehari-hari.');
  }

  return `**Kombinasi & Benturan Chart**

${items.join('\n\n')}

*Catatan: Analisis ini berfokus pada Day Pillar (Pilar Hari) yang merepresentasikan inti kepribadian dan dinamika hubungan antar individu.*`;
}

function generateFutureProspect(score, interact, relType, nameA, nameB, rel) {
  const relSpecific = {
    spouse: score >= 3
      ? `Secara keseluruhan, hubungan pernikahan antara ${nameA} dan ${nameB} memiliki fondasi kosmis yang kuat. Dinamika elemen yang saling mendukung menunjukkan bahwa hubungan ini berpotensi tumbuh semakin kuat seiring waktu — selama keduanya berkomitmen untuk saling memahami dan menghargai perbedaan.`
      : `Perjalanan pernikahan ${nameA} dan ${nameB} akan membutuhkan usaha yang lebih sadar dibandingkan pasangan lain. Ini bukan berarti hubungan ini tidak bisa berhasil — justru tantangan ini bisa menjadi kekuatan bersama jika keduanya memilih untuk tumbuh bersama daripada saling bertentangan.`,
    child: `Hubungan antara ${nameA} dan ${nameB} sebagai anak memiliki potensi yang sangat bermakna. Setiap anak membawa energi unik yang melengkapi (atau menantang) orang tuanya — ini adalah bagian dari siklus pertumbuhan spiritual yang lebih besar.`,
    parent: `Orang tua adalah guru pertama kita. Dinamika elemen antara ${nameA} dan ${nameB} menunjukkan bagaimana pola energi dari orang tua telah membentuk cara Anda melihat dunia — dan bagaimana Anda bisa berevolusi dari warisan tersebut.`,
    sibling_older: `Hubungan dengan kakak membawa pelajaran tentang hierarki, perlindungan, dan berbagi. Potensi hubungan ini sangat bergantung pada seberapa baik kedua pihak bisa saling menghormati peran masing-masing.`,
    sibling_younger: `Hubungan dengan adik mengajarkan tentang tanggung jawab, pengasuhan, dan keikhlasan berbagi. Interaksi elemental ini menentukan seberapa natural peran kakak-adik ini mengalir.`,
    friend: `Persahabatan antara ${nameA} dan ${nameB} memiliki kualitas yang ${score >= 3 ? 'alami dan mengalir' : 'membutuhkan investasi waktu lebih besar'}. Persahabatan terkuat sering lahir dari mereka yang melengkapi, bukan yang selalu setuju.`,
    colleague: `Kolaborasi profesional antara ${nameA} dan ${nameB} ${score >= 3 ? 'memiliki potensi sinergi yang kuat — keduanya bisa saling melengkapi dalam tim' : 'membutuhkan komunikasi yang lebih eksplisit dan pembagian peran yang jelas untuk mencapai hasil optimal'}.`
  };

  return `**Potensi Hubungan ke Depan**

${relSpecific[relType] || relSpecific.friend}

${score >= 3
  ? `Dengan skor kompatibilitas **${score}** (${getCompatRating(score).label}), hubungan ini memiliki modal yang baik untuk berkembang. Kunci utamanya adalah mempertahankan komunikasi yang terbuka dan menghargai cara pandang masing-masing.`
  : `Dengan skor kompatibilitas **${score}** (${getCompatRating(score).label}), hubungan ini membutuhkan kesadaran lebih untuk berkembang. Justru hubungan dengan tantangan lebih besar sering menghasilkan pertumbuhan yang lebih dalam bagi kedua individu.`
}`;
}

function generateHowToHandle(elemA, elemB, interact, tenGodAB, relType, nameA, nameB, rel) {
  const HANDLE_BY_INTERACT = {
    same:      `Karena Anda dan ${nameB} berbagi energi yang sama, tantangan terbesar adalah menghindari "gema" — di mana kelemahan satu pihak memperkuat kelemahan yang lain. Saling mengingatkan dengan kasih sayang, bukan kritik, adalah kunci.`,
    generates: `Anda memberi energi kepada ${nameB}. Ingatlah bahwa memberi yang berlebihan bisa menguras diri sendiri — tetapkan batas yang sehat sambil tetap hadir sebagai sumber dukungan yang tulus.`,
    generated: `${nameB} memberi energi kepada Anda. Hargai kontribusinya, ekspresikan rasa terima kasih secara konkret, dan pastikan hubungan ini tidak menjadi satu arah di mana ${nameB} selalu yang memberi.`,
    controls:  `Anda secara alami memberi arahan kepada ${nameB}. Gunakan ini dengan bijak — bimbing dengan pertanyaan, bukan perintah. Beri ruang bagi ${nameB} untuk menemukan jawabannya sendiri.`,
    controlled:`${nameB} cenderung memberi arahan atau batasan dalam hidup Anda. Pilih mana yang memang membantu pertumbuhan Anda, dan komunikasikan dengan jelas ketika batasan tersebut terasa tidak pas.`,
    neutral:   `Tidak ada tekanan elemental yang kuat — artinya hubungan ini sangat bergantung pada kualitas komunikasi dan keputusan sadar sehari-hari dari kedua belah pihak.`
  };

  const relTips = {
    spouse:   `Dalam pernikahan, ritme adalah segalanya. Ciptakan "ritual bersama" — baik itu makan malam tanpa gadget, waktu diskusi mingguan, atau tradisi kecil yang menjadi milik berdua. Ritual ini membangun intimasi yang tidak bisa dibeli.`,
    child:    `Dengan anak, bahasa kasih sayang yang spesifik jauh lebih kuat dari nasihat umum. Pelajari bagaimana ${nameB} secara unik menerima cinta — apakah melalui waktu bersama, pujian, sentuhan, hadiah, atau bantuan konkret.`,
    parent:   `Hubungan dengan orang tua sering membawa pola lama yang tidak disadari. Teknik paling efektif adalah "curious inquiry" — tanyakan tentang hidupnya dengan rasa ingin tahu tulus, bukan untuk memvalidasi atau membantah pandangan Anda.`,
    sibling_older: `Dengan kakak, tunjukkan bahwa Anda menghargai pengalaman dan perspektifnya — bahkan ketika Anda tidak setuju. Rasa dihargai adalah fondasi dari hubungan saudara yang sehat.`,
    sibling_younger: `Dengan adik, jadilah teladan yang konsisten — bukan sempurna. Keterbukaan tentang kesalahan dan cara Anda belajar darinya lebih berharga daripada terlihat selalu benar.`,
    friend:   `Persahabatan yang langgeng dibangun dari kejujuran yang aman. Ciptakan ruang di mana ${nameB} merasa bisa jujur tanpa takut dihakimi — dan pastikan Anda pun merasakannya.`,
    colleague:`Di lingkungan kerja, kejelasan ekspektasi adalah investasi terbaik. Diskusikan secara eksplisit bagaimana Anda berdua paling efektif bekerja bersama — jangan asumsikan cara kerja yang sama.`
  };

  return `**Cara Menghandle ${rel.label} Anda**

${HANDLE_BY_INTERACT[interact.type] || ''}

${relTips[relType] || relTips.friend}`;
}

function generateConclusion(score, interact, stemHe, stemChong, nameA, nameB, rel) {
  const rating = getCompatRating(score);

  let headline = '';
  if (score >= 6) headline = `Hubungan antara ${nameA} dan ${nameB} memiliki harmoni elemental yang luar biasa.`;
  else if (score >= 3) headline = `Hubungan antara ${nameA} dan ${nameB} memiliki fondasi yang baik dengan beberapa area yang perlu diperhatikan.`;
  else if (score >= 0) headline = `Hubungan antara ${nameA} dan ${nameB} membutuhkan usaha sadar dari kedua belah pihak untuk mencapai potensi terbaiknya.`;
  else headline = `Hubungan antara ${nameA} dan ${nameB} menghadapi tantangan elemental yang nyata — namun bukan sesuatu yang tidak bisa diatasi dengan kesadaran dan komitmen.`;

  return `**Kesimpulan Hubungan**

${rating.label} — Skor Kompatibilitas: **${score > 0 ? '+' : ''}${score}**

${headline}

${stemHe.he
  ? `Fakta paling menonjol dalam chart ini adalah adanya **六合 (Harmoni Batang Langit)** antara Day Master keduanya — sebuah tanda yang jarang ditemukan dan menunjukkan koneksi yang melampaui kebetulan biasa.`
  : stemChong
  ? `Adanya **冲 (Benturan Batang Langit)** menjadi catatan penting — ini bukan berarti hubungan tidak bisa berhasil, namun menunjukkan bahwa perbedaan mendasar dalam cara pandang perlu secara aktif dijembatani, bukan diabaikan.`
  : `Dinamika utama dalam hubungan ini adalah interaksi ${ELEMENT_NAME[interact.type === 'same' ? 'same' : ''] || 'elemental'} yang membentuk pola energi sehari-hari.`
}

Dalam tradisi metafisika Tiongkok, tidak ada chart yang "sempurna" atau "gagal" — setiap kombinasi membawa pelajarannya sendiri. Yang menentukan kualitas hubungan adalah kesadaran, komunikasi, dan pilihan untuk terus tumbuh bersama.`;
}

function generateHowToImprove(elemA, elemB, interact, qmdjQualA, qmdjQualB, nameA, nameB, rel) {
  const BALANCE_TIPS = {
    '木': 'aktivitas alam terbuka, seni kreatif, proyek yang memberikan hasil nyata dan terlihat, serta percakapan yang membuka kemungkinan baru',
    '火': 'kegiatan sosial yang bermakna, ekspresi emosi yang jujur, perayaan pencapaian kecil bersama, dan menciptakan kenangan yang hangat',
    '土': 'rutinitas yang stabil dan dapat diprediksi, komitmen yang jelas, membangun sesuatu bersama (literatur, rumah, usaha), dan keterbukaan tentang kebutuhan rasa aman',
    '金': 'diskusi yang substantif dan berbobot, komitmen yang tertulis atau terucap dengan jelas, penghargaan atas pencapaian konkret, dan kejujuran yang langsung namun penuh hormat',
    '水': 'ruang untuk refleksi dan ketenangan, percakapan yang dalam dan bermakna, kepercayaan yang dibangun perlahan, dan pengakuan atas intuisi dan perasaan yang tidak selalu terucap'
  };

  const tipA = BALANCE_TIPS[elemA] || 'keseimbangan dan komunikasi yang tulus';
  const tipB = BALANCE_TIPS[elemB] || 'keseimbangan dan komunikasi yang tulus';

  return `**Cara Meningkatkan Hubungan**

**Untuk ${nameA} (unsur ${ELEMENT_NAME[elemA] || elemA}):**
Energi Anda paling hidup melalui ${tipA}. Ketika membawa kualitas ini ke dalam hubungan, Anda secara alami akan terkoneksi lebih dalam dengan ${nameB}.

**Untuk ${nameB} (unsur ${ELEMENT_NAME[elemB] || elemB}):**
${nameB} paling terbuka ketika diajak melalui ${tipB}. Ciptakan pengalaman bersama yang selaras dengan kualitas ini.

**Praktik Bersama yang Disarankan:**
- 📅 **Waktu khusus tanpa agenda** — minimal satu kali seminggu, hanya untuk hadir bersama tanpa tujuan produktif
- 💬 **Check-in emosional rutin** — tanyakan "Apa yang sedang kamu rasakan minggu ini?" dengan sungguh-sungguh mendengarkan
- 🙏 **Apresiasi yang spesifik** — ungkapkan hal konkret yang Anda hargai dari ${nameB}, bukan hanya "terima kasih" yang umum
- 🔄 **Tinjau ulang berkala** — setiap 3-6 bulan, diskusikan bersama: apa yang sudah berjalan baik, apa yang perlu diubah

${qmdjQualA && qmdjQualB
  ? `*Secara QMDJ, chart tahun ${nameA} (${qmdjQualA}) bertemu dengan chart ${nameB} (${qmdjQualB}) — mempertimbangkan momen dan energi yang sedang aktif bisa membantu memilih waktu terbaik untuk percakapan penting atau keputusan besar bersama.*`
  : ''}`;
}

module.exports = { analyzeCompatibility };
