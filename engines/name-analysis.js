'use strict';

/**
 * engines/name-analysis.js
 * Analisis nama: etimologi Latin/Indonesia, analisis karakter Tionghoa,
 * numerologi nama (姓名学), dan keserasian nama dengan BaZi.
 *
 * Sumber stroke count: Kangxi Dictionary (康熙字典) standard
 * Sumber numerologi: 五格剖象法 (Wu Ge Pou Xiang Fa) — Lima Grid Numerologi
 */

// ============================================================
// DATABASE KARAKTER TIONGHOA UMUM
// Stroke count (康熙), makna, dan unsur Wu Xing berdasarkan stroke
// ============================================================
const CHINESE_CHARS = {
  // Marga / Surname umum
  '林': { strokes: 8,  pinyin: 'lín',  meaning: 'Hutan, banyak pohon — melambangkan kemakmuran dan kekuatan kolektif', element: '木', radical: '木' },
  '陈': { strokes: 16, pinyin: 'chén', meaning: 'Kuno, berumur, disusun dengan rapi — marga yang kaya sejarah', element: '金', radical: '阜' },
  '黄': { strokes: 12, pinyin: 'huáng',meaning: 'Kuning, kaisar, agung — simbol kemuliaan dan kebijaksanaan', element: '土', radical: '黄' },
  '李': { strokes: 7,  pinyin: 'lǐ',   meaning: 'Pohon plum — kelembutan, keindahan, dan ketahanan hidup', element: '木', radical: '木' },
  '张': { strokes: 11, pinyin: 'zhāng',meaning: 'Meregang, membuka lebar — ambisi dan ekspansi', element: '木', radical: '弓' },
  '王': { strokes: 4,  pinyin: 'wáng', meaning: 'Raja, penguasa — kebangsawanan dan kepemimpinan', element: '土', radical: '王' },
  '刘': { strokes: 15, pinyin: 'liú',  meaning: 'Membunuh, memenangkan pertempuran — kekuatan dan kemenangan', element: '金', radical: '刀' },
  '吴': { strokes: 7,  pinyin: 'wú',   meaning: 'Kerajaan Wu kuno, nama geografis — identitas dan asal muasal', element: '土', radical: '口' },
  '周': { strokes: 8,  pinyin: 'zhōu', meaning: 'Menyeluruh, merata — kebijaksanaan yang menyeluruh', element: '土', radical: '口' },
  '郭': { strokes: 15, pinyin: 'guō',  meaning: 'Tembok kota luar — perlindungan dan batas', element: '金', radical: '阜' },
  '孙': { strokes: 10, pinyin: 'sūn',  meaning: 'Cucu, keturunan — kesinambungan dan warisan', element: '木', radical: '子' },
  '何': { strokes: 7,  pinyin: 'hé',   meaning: 'Apa, mengapa — intelektualitas dan rasa ingin tahu', element: '水', radical: '人' },
  '许': { strokes: 11, pinyin: 'xǔ',   meaning: 'Mengizinkan, berjanji — kepercayaan dan integritas', element: '金', radical: '言' },
  '邓': { strokes: 11, pinyin: 'dèng', meaning: 'Nama klan kuno — keturunan bangsawan', element: '金', radical: '阜' },
  '蔡': { strokes: 17, pinyin: 'cài',  meaning: 'Tumbuhan liar, sayuran hijau — kemandirian dan adaptabilitas', element: '木', radical: '艸' },
  '冯': { strokes: 12, pinyin: 'féng', meaning: 'Menyeberangi sungai — keberanian dan tekad', element: '水', radical: '冫' },
  '谢': { strokes: 17, pinyin: 'xiè',  meaning: 'Berterima kasih, mundur dengan anggun — rasa syukur dan kebijaksanaan', element: '金', radical: '言' },
  '曾': { strokes: 12, pinyin: 'zēng', meaning: 'Pernah, bertambah — pengalaman yang terakumulasi', element: '土', radical: '八' },
  '杨': { strokes: 13, pinyin: 'yáng', meaning: 'Pohon poplar, bersemangat, cerah — kegembiraan dan semangat', element: '木', radical: '木' },
  '赵': { strokes: 14, pinyin: 'zhào', meaning: 'Marga kerajaan Song — kehormatan dan kepemimpinan', element: '火', radical: '走' },
  // Karakter nama umum
  '明': { strokes: 8,  pinyin: 'míng', meaning: 'Terang, cerdas, bersinar — kecemerlangan pikiran dan cahaya bagi orang lain', element: '火', radical: '日' },
  '华': { strokes: 10, pinyin: 'huá', meaning: 'Megah, indah, budaya Tionghoa — keindahan dan kejayaan', element: '木', radical: '艸' },
  '丽': { strokes: 19, pinyin: 'lì',  meaning: 'Cantik, menawan — keindahan yang mempesona', element: '火', radical: '鹿' },
  '美': { strokes: 9,  pinyin: 'měi', meaning: 'Cantik, baik, lezat — keindahan dalam segala aspek', element: '火', radical: '羊' },
  '英': { strokes: 11, pinyin: 'yīng',meaning: 'Bunga, pahlawan, brilian — keindahan dan keberanian', element: '木', radical: '艸' },
  '伟': { strokes: 11, pinyin: 'wěi', meaning: 'Agung, besar, luar biasa — kehebatan dan kebesaran jiwa', element: '木', radical: '人' },
  '强': { strokes: 12, pinyin: 'qiáng',meaning:'Kuat, tangguh, gigih — kekuatan dan ketangguhan', element: '木', radical: '弓' },
  '志': { strokes: 7,  pinyin: 'zhì', meaning: 'Tekad, ambisi, tulisan — kekuatan niat dan tujuan hidup', element: '火', radical: '心' },
  '文': { strokes: 4,  pinyin: 'wén', meaning: 'Tulisan, budaya, elegan — kecerdasan dan kehalusan budi', element: '木', radical: '文' },
  '德': { strokes: 15, pinyin: 'dé',  meaning: 'Kebajikan, moral, karakter mulia — integritas tertinggi', element: '土', radical: '彳' },
  '福': { strokes: 13, pinyin: 'fú',  meaning: 'Keberuntungan, berkah, kemakmuran — keberkahan hidup', element: '水', radical: '示' },
  '寿': { strokes: 14, pinyin: 'shòu',meaning: 'Umur panjang, kesehatan — harapan panjang umur', element: '土', radical: '老' },
  '瑞': { strokes: 13, pinyin: 'ruì', meaning: 'Pertanda baik, batu giok beruntung — nasib baik', element: '金', radical: '玉' },
  '玉': { strokes: 5,  pinyin: 'yù',  meaning: 'Giok, mulia, berharga — kemurnian dan nilai tinggi', element: '金', radical: '玉' },
  '金': { strokes: 8,  pinyin: 'jīn', meaning: 'Emas, logam mulia, nilai tinggi — kemewahan dan prestise', element: '金', radical: '金' },
  '龙': { strokes: 16, pinyin: 'lóng',meaning: 'Naga, simbol kekaisaran — kekuasaan, keberuntungan, dan kehebatan', element: '木', radical: '龙' },
  '凤': { strokes: 6,  pinyin: 'fèng',meaning: 'Phoenix/Feniks, keanggunan — keindahan, kebangkitan, dan kemuliaan wanita', element: '火', radical: '几' },
  '仁': { strokes: 4,  pinyin: 'rén', meaning: 'Kebajikan, kemanusiaan, cinta sesama — inti dari ajaran Konfusius', element: '木', radical: '人' },
  '义': { strokes: 13, pinyin: 'yì',  meaning: 'Kebenaran, keadilan, kesetiaan — nilai moral tertinggi', element: '金', radical: '羊' },
  '礼': { strokes: 17, pinyin: 'lǐ',  meaning: 'Kesopanan, tata krama, ritual — harmoni sosial', element: '火', radical: '示' },
  '智': { strokes: 12, pinyin: 'zhì', meaning: 'Kebijaksanaan, kecerdasan tinggi — pengetahuan yang mendalam', element: '水', radical: '日' },
  '信': { strokes: 9,  pinyin: 'xìn', meaning: 'Kepercayaan, kejujuran, surat — integritas yang bisa diandalkan', element: '木', radical: '人' },
  '平': { strokes: 5,  pinyin: 'píng',meaning: 'Damai, datar, seimbang — ketenangan dan keseimbangan', element: '木', radical: '干' },
  '安': { strokes: 6,  pinyin: 'ān',  meaning: 'Aman, tenteram, damai — ketentraman lahir dan batin', element: '土', radical: '宀' },
  '宁': { strokes: 14, pinyin: 'níng',meaning: 'Tenang, damai, lebih suka — ketenangan jiwa yang dalam', element: '水', radical: '宀' },
  '泰': { strokes: 10, pinyin: 'tài', meaning: 'Makmur, sangat, Tai Chi — kemakmuran dan ketenangan agung', element: '水', radical: '水' },
  '恩': { strokes: 10, pinyin: 'ēn',  meaning: 'Karunia, belas kasih, kebaikan — budi baik yang diterima dan diberikan', element: '水', radical: '心' },
  '慧': { strokes: 15, pinyin: 'huì', meaning: 'Kecerdasan, budi yang cerah — kebijaksanaan spiritual dan intelektual', element: '火', radical: '心' },
  '雅': { strokes: 12, pinyin: 'yǎ',  meaning: 'Elegan, halus, anggun — keanggunan dan kehalusan budi', element: '木', radical: '隹' },
  '芳': { strokes: 10, pinyin: 'fāng',meaning: 'Harum, bunga yang wangi — keharuman nama dan kebajikan', element: '木', radical: '艸' },
  '梅': { strokes: 11, pinyin: 'méi', meaning: 'Bunga plum — ketabahan, keindahan di musim dingin, kemurnian', element: '木', radical: '木' },
  '兰': { strokes: 23, pinyin: 'lán', meaning: 'Bunga anggrek — keanggunan, kelembutan, dan kemurnian', element: '木', radical: '艸' },
  '莲': { strokes: 13, pinyin: 'lián',meaning: 'Bunga teratai — kemurnian yang bangkit dari lumpur, pencerahan', element: '木', radical: '艸' },
};

// Unsur Wu Xing berdasarkan jumlah stroke (五行数理)
// Sumber: 五格剖象法 numerologi Tionghoa
function getElementByStrokes(strokes) {
  const lastDigit = strokes % 10;
  if (lastDigit === 1 || lastDigit === 2) return '木';
  if (lastDigit === 3 || lastDigit === 4) return '火';
  if (lastDigit === 5 || lastDigit === 0) return '土';
  if (lastDigit === 6 || lastDigit === 7) return '金';
  if (lastDigit === 8 || lastDigit === 9) return '水';
  return '土';
}

/**
 * Analisis satu karakter Tionghoa
 */
function analyzeChineseChar(char) {
  const data = CHINESE_CHARS[char];
  if (data) return { char, ...data, inDatabase: true };

  // Fallback: hitung stroke dari unicode (aproksimasi kasar)
  // Untuk karakter tidak dikenal, berikan info dasar
  const code = char.charCodeAt(0);
  const approxStrokes = (code % 20) + 4; // aproksimasi
  return {
    char,
    strokes: approxStrokes,
    pinyin: '(tidak tersedia)',
    meaning: `Karakter ${char} — silakan konsultasi kamus Kangxi untuk makna lengkap`,
    element: getElementByStrokes(approxStrokes),
    radical: '(tidak tersedia)',
    inDatabase: false,
    note: 'Karakter ini tidak ada dalam database lokal. Stroke count merupakan aproksimasi.'
  };
}

/**
 * Analisis nama Tionghoa lengkap (marga + nama)
 * @param {string} surname - marga (1-2 karakter)
 * @param {string} givenName - nama depan (1-3 karakter)
 * @param {string} dayMasterElement - unsur Day Master untuk cek keserasian
 * @param {string} yongShenElement - unsur Yong Shen (yang dibutuhkan)
 */
function analyzeChineseName(surname, givenName, dayMasterElement, yongShenElement) {
  const fullName = surname + givenName;
  const chars = fullName.split('').filter(c => /[一-鿿]/.test(c));

  if (chars.length === 0) return null;

  const charAnalyses = chars.map(analyzeChineseChar);
  const totalStrokes = charAnalyses.reduce((s, c) => s + c.strokes, 0);

  // Lima Grid (五格): 天格, 人格, 地格, 外格, 总格
  const surnameChars = surname.split('').filter(c => /[一-鿿]/.test(c));
  const givenChars = givenName.split('').filter(c => /[一-鿿]/.test(c));

  const surnameStrokes = surnameChars.reduce((s, c) => s + analyzeChineseChar(c).strokes, 0);
  const givenStrokes = givenChars.reduce((s, c) => s + analyzeChineseChar(c).strokes, 0);

  // Tian Ge (天格) = stroke marga + 1 (untuk marga 1 karakter)
  const tianGe = surnameChars.length === 1 ? surnameStrokes + 1 : surnameStrokes;
  // Ren Ge (人格) = stroke karakter terakhir marga + stroke karakter pertama nama
  const renGe = (surnameChars.length > 0 && givenChars.length > 0)
    ? analyzeChineseChar(surnameChars[surnameChars.length - 1]).strokes +
      analyzeChineseChar(givenChars[0]).strokes
    : surnameStrokes;
  // Di Ge (地格) = stroke karakter pertama nama + 1 (untuk nama 1 karakter) atau total nama
  const diGe = givenChars.length === 1
    ? givenStrokes + 1
    : givenStrokes;
  // Zong Ge (总格) = total semua stroke
  const zongGe = totalStrokes;
  // Wai Ge (外格) = Tian Ge + Di Ge - Ren Ge
  const waiGe = tianGe + diGe - renGe;

  // Unsur per grid
  const grids = {
    tian: { value: tianGe, element: getElementByStrokes(tianGe), name: '天格 (Leluhur/Warisan)' },
    ren:  { value: renGe,  element: getElementByStrokes(renGe),  name: '人格 (Inti Diri/Karir)' },
    di:   { value: diGe,   element: getElementByStrokes(diGe),   name: '地格 (Dasar/Keluarga)' },
    wai:  { value: waiGe,  element: getElementByStrokes(waiGe),  name: '外格 (Sosial/Relasi)' },
    zong: { value: zongGe, element: getElementByStrokes(zongGe), name: '总格 (Nasib Keseluruhan)' }
  };

  // Keserasian dengan BaZi
  let harmonyScore = 0;
  let harmonyNotes = [];
  const ELEMENT_CYCLE = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' }; // yang menghasilkan

  Object.values(grids).forEach(g => {
    if (g.element === yongShenElement) {
      harmonyScore += 2;
      harmonyNotes.push(`${g.name}: unsur ${g.element} = Yong Shen Anda (sangat mendukung)`);
    } else if (g.element === dayMasterElement) {
      harmonyScore += 1;
      harmonyNotes.push(`${g.name}: unsur ${g.element} = Day Master Anda (netral-mendukung)`);
    } else if (ELEMENT_CYCLE[g.element] === dayMasterElement) {
      harmonyScore += 1;
      harmonyNotes.push(`${g.name}: unsur ${g.element} menghasilkan Day Master (mendukung)`);
    }
  });

  const harmonyRating = harmonyScore >= 8 ? 'Sangat Serasi' :
                        harmonyScore >= 5 ? 'Serasi' :
                        harmonyScore >= 3 ? 'Cukup Serasi' : 'Perlu Pertimbangan';

  return {
    fullName,
    chars: charAnalyses,
    totalStrokes,
    grids,
    harmonyWithBazi: {
      score: harmonyScore,
      rating: harmonyRating,
      notes: harmonyNotes,
      yongShenElement,
      dayMasterElement
    },
    source: '五格剖象法 (Wu Ge Pou Xiang Fa) — Five Grid Chinese Name Numerology; Kangxi Dictionary stroke counts'
  };
}

/**
 * Database etimologi nama Latin/Indonesia/internasional (sample)
 */
const LATIN_NAME_MEANINGS = {
  // Nama pria umum Indonesia
  'budi':    { origin: 'Jawa/Sanskrit', meaning: 'Budi pekerti, kebijaksanaan, akal budi yang mulia' },
  'sari':    { origin: 'Sanskrit', meaning: 'Inti sari, yang terbaik, esensi' },
  'indra':   { origin: 'Sanskrit', meaning: 'Dewa hujan dan petir dalam Hindu, raja para dewa' },
  'surya':   { origin: 'Sanskrit', meaning: 'Matahari — cahaya, kekuatan, kehidupan' },
  'dewi':    { origin: 'Sanskrit', meaning: 'Dewi, perempuan suci — keagungan feminim' },
  'putra':   { origin: 'Sanskrit', meaning: 'Anak laki-laki, penerus — generasi berikutnya' },
  'putri':   { origin: 'Sanskrit', meaning: 'Anak perempuan, putri raja — keanggunan' },
  'adi':     { origin: 'Sanskrit/Jawa', meaning: 'Pertama, terbaik, utama — yang teragung' },
  'agung':   { origin: 'Melayu/Jawa', meaning: 'Agung, mulia, besar — kebesaran dan kemuliaan' },
  'bayu':    { origin: 'Sanskrit', meaning: 'Angin — kebebasan, kecepatan, dan semangat' },
  'cahaya':  { origin: 'Melayu', meaning: 'Cahaya — penerang, harapan, dan kecemerlangan' },
  'dian':    { origin: 'Melayu/Jawa', meaning: 'Lilin — cahaya kecil yang menerangi, setia' },
  'eko':     { origin: 'Jawa', meaning: 'Satu, pertama — yang tunggal dan utama' },
  'fajar':   { origin: 'Arab', meaning: 'Fajar, subuh — permulaan baru, harapan' },
  'hendra':  { origin: 'Jawa/Sanskrit', meaning: 'Raja/pemimpin yang bijaksana' },
  'iwan':    { origin: 'Persia (via Arab)', meaning: 'Tuhan itu mulia hati (varian Yahya/Yohanes)' },
  'joko':    { origin: 'Jawa', meaning: 'Pemuda, jejaka — masa muda yang penuh potensi' },
  'kurnia':  { origin: 'Arab (karunia)', meaning: 'Anugerah, karunia Tuhan — berkah dari Yang Maha Kuasa' },
  'lestari': { origin: 'Jawa/Melayu', meaning: 'Abadi, lestari — kelangsungan dan kelestarian' },
  'maulana': { origin: 'Arab', meaning: 'Tuan kami, pemimpin agama — kemuliaan spiritual' },
  'nadia':   { origin: 'Slavik/Arab', meaning: 'Harapan (Slavik) / Memanggil (Arab)' },
  'rama':    { origin: 'Sanskrit', meaning: 'Menyenangkan, tokoh epik Ramayana — pahlawan mulia' },
  'sri':     { origin: 'Sanskrit', meaning: 'Suci, kemakmuran, kecantikan — dewi kemakmuran Lakshmi' },
  'taufik':  { origin: 'Arab', meaning: 'Taufik, keberhasilan, petunjuk Tuhan ke jalan yang benar' },
  'utama':   { origin: 'Sanskrit/Melayu', meaning: 'Terbaik, utama, yang paling mulia' },
  'wahyu':   { origin: 'Arab', meaning: 'Wahyu, inspirasi ilahi — pesan dari Yang Maha Kuasa' },
  'yoga':    { origin: 'Sanskrit', meaning: 'Menyatukan, praktik spiritual — penyatuan jiwa' },
  // Nama internasional
  'alexander': { origin: 'Yunani (Alexandros)', meaning: 'Pelindung manusia — kekuatan dan perlindungan' },
  'victoria':  { origin: 'Latin', meaning: 'Kemenangan — kejayaan dan keberhasilan' },
  'sophia':    { origin: 'Yunani', meaning: 'Kebijaksanaan — kecerdasan dan hikmah' },
  'michael':   { origin: 'Ibrani (Mikha-el)', meaning: 'Siapa yang seperti Tuhan? — pengabdian dan kekuatan' },
  'grace':     { origin: 'Latin (gratia)', meaning: 'Anugerah, keanggunan — karunia dan kehalusan' },
  'kevin':     { origin: 'Gaelik (Caoimhín)', meaning: 'Lahir tampan/mulia — keindahan budi pekerti' },
  'jessica':   { origin: 'Ibrani (Yiskah)', meaning: 'Tuhan melihat, pandangan jauh — kepekaan dan intuisi' },
  'william':   { origin: 'Jermanik (Wilhelm)', meaning: 'Perlindungan yang teguh — ketegasan dan perlindungan' },
  'olivia':    { origin: 'Latin (oliva)', meaning: 'Pohon zaitun — perdamaian dan kebijaksanaan' },
  'david':     { origin: 'Ibrani (Dawid)', meaning: 'Yang dicintai — kasih sayang dan kelembutan' },
};

/**
 * Cari makna nama Latin/Indonesia
 */
function analyzeLatinName(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  const data = LATIN_NAME_MEANINGS[key];
  if (data) return { name, ...data, found: true };
  return {
    name,
    origin: 'Tidak ditemukan dalam database',
    meaning: `Nama "${name}" tidak ada dalam database lokal. Untuk etimologi lengkap, konsultasi sumber seperti behindthename.com atau kamus bahasa asal nama tersebut.`,
    found: false
  };
}

module.exports = { analyzeChineseName, analyzeLatinName, analyzeChineseChar, CHINESE_CHARS };
