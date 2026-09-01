'use strict';

const express = require('express');
const path = require('path');
const { validateInput } = require('./utils/validators');
const { calculateBazi } = require('./engines/bazi');
const { calculateZwds } = require('./engines/zwds');
const { analyzeChineseName, analyzeLatinName } = require('./engines/name-analysis');
const { getGmtOffsetList } = require('./utils/timezone');
const { calculateQmdj } = require('./engines/qmdj');
const { analyzeCompatibility } = require('./engines/compatibility');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// API: KALKULASI LENGKAP (BaZi + Zi Wei + Nama)
// ============================================================
app.post('/api/calculate', (req, res) => {
  const data = req.body;

  // Validasi input
  const errors = validateInput(data);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const result = { success: true, timestamp: new Date().toISOString() };

  // 1. Analisis Nama
  try {
    const latinNames = (data.name || '').split(' ').filter(Boolean);
    const latinAnalysis = latinNames.map(n => analyzeLatinName(n));

    let chineseAnalysis = null;
    if (data.chineseName && /[一-鿿]/.test(data.chineseName)) {
      const surname = data.chineseSurname || data.chineseName[0] || '';
      const givenName = data.chineseName.replace(surname, '') || data.chineseName;
      chineseAnalysis = analyzeChineseName(surname, givenName, null, null);
    }

    result.nameAnalysis = { latin: latinAnalysis, chinese: chineseAnalysis };
  } catch(e) {
    result.nameAnalysis = { error: e.message };
  }

  // 2. BaZi
  try {
    result.bazi = calculateBazi({
      birthYear: data.birthYear,
      birthMonth: data.birthMonth,
      birthDay: data.birthDay,
      birthHour: data.birthHour,
      birthMinute: data.birthMinute || 0,
      gender: data.gender,
      zone: data.timezone,
      longitude: data.longitude,
      latitude: data.latitude,
      midnightSect: parseInt(data.midnightSect) || 2,
      dayunSect: parseInt(data.dayunSect) || 2
    });
    // Update Yong Shen ke analisis nama setelah BaZi diketahui
    if (result.bazi && result.nameAnalysis?.chinese) {
      const yongShen = result.bazi.wuXing?.yongShen;
      const dmElement = result.bazi.dayMaster?.element_cn;
      if (yongShen || dmElement) {
        const surname = data.chineseSurname || (data.chineseName || '')[0] || '';
        const givenName = (data.chineseName || '').replace(surname, '');
        result.nameAnalysis.chinese = analyzeChineseName(surname, givenName, dmElement, yongShen);
      }
    }
  } catch(e) {
    result.bazi = { error: `BaZi calculation error: ${e.message}`, stack: e.stack };
  }

  // 3. Zi Wei Dou Shu
  try {
    result.zwds = calculateZwds({
      birthYear: data.birthYear,
      birthMonth: data.birthMonth,
      birthDay: data.birthDay,
      birthHour: data.birthHour,
      gender: data.gender,
      zone: data.timezone
    });
  } catch(e) {
    result.zwds = { error: `Zi Wei calculation error: ${e.message}`, stack: e.stack };
  }

  // 4. Analisis Menyeluruh (BaZi + ZWDS gabungan)
  try {
    result.comprehensive = buildComprehensiveAnalysis(result.bazi, result.zwds, data);
  } catch(e) {
    result.comprehensive = { error: e.message };
  }

  res.json(result);
});

// ============================================================
// API: QI MEN DUN JIA
// ============================================================
app.post('/api/qmdj', (req, res) => {
  try {
    const { type, birthYear, birthMonth, birthDay } = req.body;
    if (!type || !['nianjia', 'rijia', 'shijia'].includes(type)) {
      return res.status(400).json({ success: false, error: 'type harus: nianjia, rijia, atau shijia' });
    }
    if (type === 'nianjia' && !birthYear) {
      return res.status(400).json({ success: false, error: 'nianjia membutuhkan birthYear' });
    }
    if (type === 'rijia' && (!birthYear || !birthMonth || !birthDay)) {
      return res.status(400).json({ success: false, error: 'rijia membutuhkan birthYear, birthMonth, birthDay' });
    }
    const result = calculateQmdj({ type, birthYear, birthMonth, birthDay });
    res.json({ success: true, qmdj: result });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message, stack: e.stack });
  }
});

// ============================================================
// API: KOMPATIBILITAS (Section 9 / 10 / 11)
// ============================================================
app.post('/api/compatibility', (req, res) => {
  try {
    const { person1, person2, relationshipType } = req.body;
    if (!person1 || !person2) {
      return res.status(400).json({ success: false, error: 'person1 dan person2 diperlukan' });
    }

    // Hitung BaZi untuk kedua orang
    const baziA = calculateBazi({
      birthYear: person1.birthYear, birthMonth: person1.birthMonth,
      birthDay: person1.birthDay,   birthHour: person1.birthHour,
      birthMinute: person1.birthMinute || 0, gender: person1.gender,
      zone: person1.timezone || '+7', midnightSect: 2, dayunSect: 2
    });
    const baziB = calculateBazi({
      birthYear: person2.birthYear, birthMonth: person2.birthMonth,
      birthDay: person2.birthDay,   birthHour: person2.birthHour,
      birthMinute: person2.birthMinute || 0, gender: person2.gender,
      zone: person2.timezone || '+7', midnightSect: 2, dayunSect: 2
    });

    // Hitung ZWDS untuk kedua orang
    let zwdsA = null, zwdsB = null;
    try {
      zwdsA = calculateZwds({ birthYear: person1.birthYear, birthMonth: person1.birthMonth,
        birthDay: person1.birthDay, birthHour: person1.birthHour,
        gender: person1.gender, zone: person1.timezone || '+7' });
    } catch(e) { zwdsA = null; }
    try {
      zwdsB = calculateZwds({ birthYear: person2.birthYear, birthMonth: person2.birthMonth,
        birthDay: person2.birthDay, birthHour: person2.birthHour,
        gender: person2.gender, zone: person2.timezone || '+7' });
    } catch(e) { zwdsB = null; }

    // Hitung QMDJ Nianjia untuk kedua orang
    let qmdjA = null, qmdjB = null;
    try { qmdjA = calculateQmdj({ type: 'nianjia', birthYear: person1.birthYear }); } catch(e) {}
    try { qmdjB = calculateQmdj({ type: 'nianjia', birthYear: person2.birthYear }); } catch(e) {}

    const result = analyzeCompatibility(
      baziA, baziB, zwdsA, zwdsB, qmdjA, qmdjB,
      relationshipType || 'friend',
      person1.name, person2.name
    );

    res.json({ success: true, compatibility: result });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message, stack: e.stack });
  }
});

// ============================================================
// API: DAFTAR GMT OFFSET (untuk dropdown)
// ============================================================
app.get('/api/timezones', (req, res) => {
  res.json(getGmtOffsetList());
});

// ============================================================
// API: TEST KONEKSI
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    libraries: {
      'lunar-javascript': require('./node_modules/lunar-javascript/package.json').version,
      'iztro': require('./node_modules/iztro/package.json').version
    }
  });
});

// ============================================================
// FUNGSI: ANALISIS MENYELURUH
// ============================================================
function buildComprehensiveAnalysis(bazi, zwds, inputData) {
  if (!bazi || bazi.error) return { error: 'BaZi data tidak tersedia' };

  const currentYear = new Date().getFullYear();
  const birthYear = parseInt(inputData.birthYear);
  const age = currentYear - birthYear;

  // Gabungkan karir & bisnis dari BaZi + ZWDS
  const baziCareers = bazi.careers || [];
  const baziBusiness = bazi.businesses || [];
  const baziBusinessAvoid = bazi.businessAvoid || [];
  const zwdsGuanLu = zwds?.palaces?.[8]?.majorStars?.map(s => s.name).join('、') || '—';
  const zwdsCai = zwds?.palaces?.[4]?.majorStars?.map(s => s.name).join('、') || '—';

  // Warna dari Yong Shen + Kua
  const yongShen = bazi.wuXing?.yongShen;
  const WU_XING_COLORS = {
    '木': ['Hijau Tua', 'Hijau Muda', 'Biru-Hijau'], '火': ['Merah', 'Oranye', 'Ungu'],
    '土': ['Kuning', 'Cokelat', 'Oker', 'Krem'], '金': ['Putih', 'Perak', 'Emas'],
    '水': ['Hitam', 'Navy', 'Abu-abu Tua', 'Biru Tua']
  };
  const yongShenColors = WU_XING_COLORS[yongShen] || [];
  const kuaColors = bazi.fengshui?.luckyColors || [];
  const allLuckyColors = [...new Set([...yongShenColors, ...kuaColors])];

  // Hindari warna unsur yang terlalu dominan
  const dominant = bazi.wuXing?.dominant;
  const avoidColors = WU_XING_COLORS[dominant]?.filter(c => !allLuckyColors.includes(c)) || [];

  // Tahun keberuntungan: ambil dari Da Yun dalam 15 tahun ke depan
  const luckyYears = [];
  const warnYears = [];
  const nearDaYuns = (bazi.daYun?.periods || []).filter(dy =>
    dy.yearStart >= currentYear - 2 && dy.yearStart <= currentYear + 15
  );
  // Urutkan Da Yun berdasar score untuk tahu mana terbaik dan terburuk
  const sortedDaYuns = [...nearDaYuns].sort((a,b) => (b.quality?.score||0) - (a.quality?.score||0));
  const bestScore  = sortedDaYuns[0]?.quality?.score ?? 0;
  const worstScore = sortedDaYuns[sortedDaYuns.length-1]?.quality?.score ?? 0;
  // Lucky = score>=1 ATAU merupakan Da Yun terbaik (tidak wajib score tinggi)
  // Warn  = score<=-1 ATAU merupakan Da Yun terburuk (hanya jika lebih buruk dari yang terbaik)
  nearDaYuns.forEach(dy => {
    const score = dy.quality?.score ?? 0;
    const isBest  = score === bestScore;
    const isWorst = score === worstScore && worstScore < bestScore;
    const startY  = Math.max(dy.yearStart, currentYear);
    const endY    = Math.min(dy.yearEnd, currentYear + 10);
    if (score >= 1 || (isBest && score >= 0)) {
      for (let y = startY; y <= endY; y++) luckyYears.push(y);
    } else if (score <= -1 || isWorst) {
      for (let y = startY; y <= endY; y++) warnYears.push(y);
    }
  });

  // Pasangan ideal dari ZWDS 夫妻宫
  const fuqiPalace = zwds?.palaces?.[2];
  const fuqiStars = fuqiPalace?.majorStars?.map(s => s.name).join('、') || '—';

  // Shio serasi
  const shioCompat = bazi.shioCompatibility;

  // Yong Shen & cara memperbaiki nasib
  const WU_XING_REMEDIES = {
    '木': { foods: 'Sayuran hijau, makanan berbahan daun', activities: 'Berkebun, hiking di alam, yoga', direction: 'Timur', materials: 'Kayu, bambu, tanaman hidup', career: 'Bidang yang membutuhkan kreativitas dan pertumbuhan' },
    '火': { foods: 'Makanan merah, paprika, tomat, buah-buahan eksotis', activities: 'Olahraga, sosialisasi, presentasi publik', direction: 'Selatan', materials: 'Lilin, lampu, bahan berkilau', career: 'Seni, hiburan, pendidikan, kepemimpinan' },
    '土': { foods: 'Makanan kuning, ubi, jagung, produk gandum', activities: 'Memasak, berkumpul keluarga, meditasi di tanah', direction: 'Pusat/Tengah', materials: 'Keramik, batu alam, tanah liat', career: 'Bisnis stabil, properti, pertanian, keuangan' },
    '金': { foods: 'Makanan putih, beras putih, susu, makanan berbahan logam mineral', activities: 'Olahraga teratur, meditasi, pernapasan', direction: 'Barat', materials: 'Logam, batu putih, bahan metalik', career: 'Hukum, keuangan, kesehatan, teknik' },
    '水': { foods: 'Makanan hitam, kacang hitam, wijen hitam, ikan laut dalam', activities: 'Berenang, meditasi, refleksi, menulis jurnal', direction: 'Utara', materials: 'Air mengalir, cermin, kaca', career: 'Penelitian, filsafat, spiritual, investasi' }
  };
  const remedy = WU_XING_REMEDIES[yongShen] || {};

  // Perbandingan BaZi vs ZWDS
  const comparison = buildComparison(bazi, zwds);

  // Gambaran kehidupan menyeluruh
  const lifeSummary = buildLifeSummary(bazi, zwds, age, currentYear);

  return {
    professions: {
      fromBazi: baziCareers,
      fromZwds: {
        guanluStars: zwdsGuanLu,
        caiboStars: zwdsCai,
        note: `Dari 官禄宫: ${zwdsGuanLu}. Dari 财帛宫: ${zwdsCai}.`
      },
      combined: baziCareers.slice(0, 5),
      avoid: (() => {
        const AVOID_MAP = {
          '木': ['Birokrasi kaku', 'Pekerjaan rutin repetitif', 'Industri logam berat'],
          '火': ['Pekerjaan administratif tertutup', 'Industri berat tanpa ekspresi', 'Pengarsipan pasif'],
          '土': ['Spekulasi tinggi', 'Pekerjaan cepat berubah', 'Startup tanpa arah jelas'],
          '金': ['Pekerjaan seni bebas tanpa struktur', 'Bidang abu-abu hukum', 'Spekulasi liar'],
          '水': ['Pekerjaan monoton berulang', 'Peran eksekusi tanpa analisis', 'Industri yang menuntut konformitas ketat'],
        };
        return AVOID_MAP[dominant] || [];
      })()
    },
    businesses: {
      suitable: baziBusiness,
      avoid: baziBusinessAvoid,
      yongShenHint: (() => {
        const HINT_MAP = {
          '木': 'Bisnis terbaik Anda berkaitan dengan alam, pertumbuhan organik, pendidikan, tekstil, fashion, tanaman, atau produk sehat.',
          '火': 'Bisnis terbaik Anda berkaitan dengan media, hiburan, restoran, energi, teknologi, marketing, atau kecantikan.',
          '土': 'Bisnis terbaik Anda berkaitan dengan properti, konstruksi, pertanian, makanan & minuman, logistik, atau waralaba.',
          '金': 'Bisnis terbaik Anda berkaitan dengan manufaktur, logam, kesehatan, hukum, keuangan, atau teknologi presisi.',
          '水': 'Bisnis terbaik Anda berkaitan dengan perdagangan, investasi, transportasi, teknologi informasi, komunikasi, atau jasa konsultasi.',
        };
        return HINT_MAP[yongShen] || '';
      })()
    },
    partner: {
      fromZwds: {
        palace: '夫妻宫',
        stars: fuqiStars,
        meaning: fuqiPalace?.personalMeaning || '—'
      },
      shioCompatibility: shioCompat,
      advice: 'Pasangan terbaik bagi Anda adalah seseorang yang unsurnya melengkapi Day Master Anda, dan bintang di 夫妻宫 menggambarkan karakter ideal mereka.'
    },
    luckyYears: {
      years: [...new Set(luckyYears)].sort(),
      warnYears: [...new Set(warnYears)].sort(),
      basis: 'Berdasarkan kualitas Da Yun vs Yong Shen BaZi Anda'
    },
    yongShen: {
      element: yongShen,
      remedies: remedy,
      explanation: `Yong Shen (用神) Anda adalah ${yongShen}. Ini adalah unsur yang paling Anda butuhkan untuk menyeimbangkan chart. Perkuat unsur ini melalui: warna, makanan, aktivitas, dan lingkungan.`
    },
    colors: {
      lucky: allLuckyColors,
      avoid: avoidColors,
      basis: `Dari Yong Shen (${yongShen}) + Kua Number ${bazi.fengshui?.kuaNumber}`
    },
    fengshui: bazi.fengshui || {},
    comparison,
    lifeSummary
  };
}

const ZWDS_STAR_ID = {
  '紫微':'Ziwei (Kaisar)','天机':'Tianji (Strategi)','天機':'Tianji (Strategi)',
  '太阳':'Taiyang (Matahari)','太陽':'Taiyang (Matahari)',
  '武曲':'Wuqu (Keuangan)','天同':'Tiantong (Harmoni)',
  '廉贞':'Lianzhen (Integritas)','廉貞':'Lianzhen (Integritas)',
  '天府':'Tianfu (Kemakmuran)','太阴':'Taiyin (Bulan)','太陰':'Taiyin (Bulan)',
  '贪狼':'Tanlang (Ambisi)','貪狼':'Tanlang (Ambisi)',
  '巨门':'Jumen (Komunikasi)','巨門':'Jumen (Komunikasi)',
  '天相':'Tianxiang (Dukungan)','天梁':'Tianliang (Pelindung)',
  '七杀':'Qisha (Ketegasan)','七殺':'Qisha (Ketegasan)',
  '破军':'Pojun (Perubahan)','破軍':'Pojun (Perubahan)',
  '文昌':'Wenzhang (Akademik)','文曲':'Wenqu (Seni)',
  '左辅':'Zuofu (Asisten Kiri)','右弼':'Youbi (Asisten Kanan)',
  '天魁':'Tiankui (Mentor Pria)','天钺':'Tianyue (Mentor Wanita)','天鉞':'Tianyue (Mentor Wanita)',
  '禄存':'Lucun (Simpanan)','天马':'Tianma (Kuda Langit)','天馬':'Tianma (Kuda Langit)',
};
function translateZwdsStar(name) { return ZWDS_STAR_ID[name] || name; }
function translateZwdsStars(arr) { return arr.map(translateZwdsStar).join('、'); }

function buildComparison(bazi, zwds) {
  const baziDM = bazi.dayMaster?.stem || '—';
  const baziChar = bazi.dayMaster?.character?.substring(0, 80) || '—';
  const mingStarsRaw = zwds?.palaces?.[0]?.majorStars?.map(s => s.name) || [];
  const mingStars = mingStarsRaw.length ? translateZwdsStars(mingStarsRaw) : '(kosong)';

  // Temukan tema-tema yang KONVERGEN antara BaZi dan ZWDS
  const yongShen = bazi.wuXing?.yongShen || '';
  const isDMWeak = !bazi.wuXing?.isDMStrong;
  const dominantTG = bazi.tenGods?.dominant?.god || '';
  const mingStarList = zwds?.palaces?.[0]?.majorStars?.map(s=>s.name) || [];
  const careerStarsRaw = zwds?.palaces?.[8]?.majorStars?.map(s=>s.name) || [];
  const wealthStarsRaw = zwds?.palaces?.[4]?.majorStars?.map(s=>s.name) || [];
  const careerStars = careerStarsRaw.map(translateZwdsStar);
  const wealthStars = wealthStarsRaw.map(translateZwdsStar);
  const baziCurrentDY = bazi.daYun?.current;
  const zwdsCurrentDX = zwds?.daXian?.current;

  // Bangun narasi sintesis
  const convergenceThemes = [];

  // Tema 1: Jalur karir mandiri vs birokrasi
  const isOutputWealth = dominantTG && (dominantTG.includes('食神') || dominantTG.includes('傷官') || dominantTG.includes('財'));
  const hasQiSha = careerStars.some(s => s.includes('七杀'));
  const hasTanLang = mingStarList.some(s => s.includes('贪狼'));
  if (isOutputWealth || hasQiSha || hasTanLang) {
    convergenceThemes.push('💼 <strong>Jalur Mandiri & Kreativitas:</strong> BaZi menunjukkan pola Output-Wealth yang dominan (kemakmuran melalui keahlian & ide pribadi, bukan birokrasi). Zi Wei memperkuat ini melalui energi di Istana Karir ' + (careerStars.join('、') || '—') + ' dan bintang Ming Gong ' + (mingStarList.map(translateZwdsStar).join('、') || '—') + '. Keduanya sepakat: jalur terbaik adalah mandiri atau melalui inisiatif personal, bukan tangga jabatan formal.');
  }

  // Tema 2: Disiplin diri & fokus
  if (isDMWeak) {
    convergenceThemes.push('⚠️ <strong>Disiplin & Fokus:</strong> Day Master yang lemah di BaZi berarti energi mudah terkuras jika terlalu banyak mengambil proyek sekaligus. Bila bintang di Ming Gong bersifat "serba mau" (misalnya 贪狼), kedua sistem bersepakat: potensi besar tersedia, tapi butuh disiplin memilih fokus agar tidak menyebar ke terlalu banyak arah.');
  }

  // Tema 3: Periode saat ini
  if (baziCurrentDY && zwdsCurrentDX) {
    convergenceThemes.push(`📅 <strong>Periode Saat Ini:</strong> BaZi menempatkan Anda di Da Yun <strong>${baziCurrentDY.ganzhi || '—'}</strong> (usia ${baziCurrentDY.ageStart}–${baziCurrentDY.ageEnd}), sementara Zi Wei menempatkan Anda di Da Xian <strong>${zwdsCurrentDX.palaceName || '—'}</strong> (usia ${zwdsCurrentDX.ageStart}–${zwdsCurrentDX.ageEnd}). ${baziCurrentDY.quality?.rating === 'Sangat Baik' || baziCurrentDY.quality?.rating === 'Baik' ? 'Keduanya menunjuk periode ini sebagai waktu penting untuk membangun fondasi — manfaatkan semaksimal mungkin.' : 'Perhatikan tema yang sama dari kedua sistem untuk periode ini.'}`);
  }

  // Tema 4: Tahun berjalan
  const liuNian = zwds?.liuNian;
  if (liuNian) {
    convergenceThemes.push(`🌙 <strong>Tahun ${liuNian.year}:</strong> Dari ZWDS, tahun ini Xiao Xian jatuh di Istana <strong>${liuNian.xiaoxianPalace?.name || '—'}</strong>, dan 四化 tahun ini menyentuh area ${(liuNian.mutagens||[]).map(m=>`${m.type} ${m.star}`).join(', ') || '—'}. Cocokkan ini dengan tahun beruntung/waspada dari BaZi untuk validasi silang.`);
  }

  return {
    synthesis: {
      narrative: convergenceThemes,
      intro: `Kedua sistem dihitung dari data lahir yang sama namun menggunakan kerangka berbeda — BaZi membaca "kimia energi waktu lahir", Zi Wei memetakan "bintang-bintang kehidupan" ke 12 area. Ketika keduanya menunjuk tema yang sama, temuan itu sangat kuat dan layak dijadikan pedoman.`,
      note: 'Perbedaan interpretasi antar sistem adalah hal biasa — bacalah sebagai sudut pandang yang saling melengkapi, bukan bertentangan.'
    },
    karakter: {
      bazi: `Day Master ${baziDM}: ${baziChar}...`,
      zwds: `Bintang Istana Kehidupan (命宫): ${mingStars}`,
      kesimpulan: 'Persamaan karakter di kedua sistem menunjukkan sifat yang benar-benar melekat kuat dalam kepribadian Anda.'
    },
    karir: {
      bazi: (bazi.careers || []).slice(0, 3).join(', '),
      zwds: `Istana Karir (官禄宫): ${careerStars.join('、') || '—'}`,
      kesimpulan: 'Bidang yang muncul di kedua sistem adalah jalur karir paling alami bagi Anda.'
    },
    keuangan: {
      bazi: `Yong Shen: ${bazi.wuXing?.yongShen}, Ten God finansial: ${bazi.tenGods?.byStem?.year_gan?.god || '—'}`,
      zwds: `Istana Keuangan (财帛宫): ${wealthStars.join('、') || '—'}`,
      kesimpulan: 'Perhatikan periode Da Yun yang mendukung dari BaZi, dan tahun-tahun dengan 化禄 di Istana Keuangan dari ZWDS.'
    },
    percintaan: {
      bazi: `Shio serasi: ${(bazi.shioCompatibility?.best || []).join(', ')}`,
      zwds: `Istana Pasangan (夫妻宫): ${translateZwdsStars(zwds?.palaces?.[2]?.majorStars?.map(s=>s.name) || []) || '—'}`,
      kesimpulan: 'Gabungkan kriteria dari keduanya untuk gambaran pasangan ideal yang lebih lengkap.'
    },
    kesehatan: {
      bazi: `Unsur lemah: ${bazi.wuXing?.weakest}`,
      zwds: `Istana Kesehatan (疾厄宫): ${translateZwdsStars(zwds?.palaces?.[5]?.majorStars?.map(s=>s.name) || []) || '—'}`,
      kesimpulan: 'Perhatikan organ/area yang ditunjukkan keduanya untuk pemeriksaan kesehatan preventif.'
    }
  };
}

function buildLifeSummary(bazi, zwds, age, currentYear) {
  const dm = bazi.dayMaster?.stem || '—';
  const dmInfo = bazi.dayMaster || {};
  const mingStars = zwds?.palaces?.[0]?.majorStars?.map(s=>s.name).join(' & ') || '—';
  const yongShen = bazi.wuXing?.yongShen || '—';
  const currentDaYun = bazi.daYun?.current;
  const currentDaXian = zwds?.daXian?.current;

  return {
    coreIdentity: `Anda adalah pribadi dengan Day Master ${dm} (${dmInfo.element || ''}), yang secara fundamental berarti Anda adalah ${dmInfo.character?.substring(0, 100) || '—'} Bintang utama Ming Gong Anda (${mingStars}) memperkuat gambaran ini dari perspektif Zi Wei.`,

    lifePhaseSummary: `Di usia ${age} tahun (${currentYear}), Anda berada di ${currentDaYun ? `Da Yun ${currentDaYun.ganzhi} (${currentDaYun.quality?.rating || 'Netral'})` : 'transisi Da Yun'} dari perspektif BaZi, dan ${currentDaXian ? `Da Xian ${currentDaXian.palaceName}` : 'periode Da Xian'} dari perspektif Zi Wei. ${currentDaYun?.quality?.desc || ''}.`,

    strengthsAndChallenges: `Kekuatan terbesar Anda: ${dmInfo.strength || '—'}. Tantangan yang perlu diwaspadai: ${dmInfo.weakness || '—'}. Kunci untuk mengoptimalkan hidup Anda adalah memperkuat unsur ${yongShen} dalam semua aspek kehidupan.`,

    overallMessage: `Setiap chart BaZi dan Zi Wei Dou Shu adalah unik — tidak ada yang "baik" atau "buruk" secara absolut. Yang terpenting adalah memahami energi alami Anda dan bekerja selaras dengannya, bukan melawannya. Gunakan data ini sebagai kompas, bukan sebagai takdir yang tidak bisa diubah.`
  };
}

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`\n✅ BaZi & Zi Wei Dou Shu Calculator`);
  console.log(`   Buka di browser: http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C untuk menghentikan.\n`);
});
