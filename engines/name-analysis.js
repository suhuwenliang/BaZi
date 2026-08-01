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
  // Marga lainnya
  '徐': { strokes: 10, pinyin: 'xú',   meaning: 'Berjalan perlahan namun pasti — ketenangan dan keteguhan', element: '水', radical: '彳' },
  '朱': { strokes: 6,  pinyin: 'zhū',  meaning: 'Pohon merah, warna merah — keberuntungan dan semangat hidup', element: '火', radical: '木' },
  '胡': { strokes: 9,  pinyin: 'hú',   meaning: 'Nama geografis kuno — keterbukaan dan toleransi', element: '土', radical: '肉' },
  '高': { strokes: 10, pinyin: 'gāo',  meaning: 'Tinggi, agung — pencapaian dan kemuliaan', element: '土', radical: '高' },
  '马': { strokes: 3,  pinyin: 'mǎ',   meaning: 'Kuda — kebebasan, kecepatan, dan semangat petualangan', element: '火', radical: '马' },
  '韩': { strokes: 12, pinyin: 'hán',  meaning: 'Negara kuno Han — kebanggaan dan identitas kuat', element: '土', radical: '韦' },
  '唐': { strokes: 10, pinyin: 'táng', meaning: 'Dinasti Tang — keagungan dan kejayaan peradaban', element: '土', radical: '口' },
  '苏': { strokes: 7,  pinyin: 'sū',   meaning: 'Bangkit, menghidupkan kembali — regenerasi dan kesegaran', element: '木', radical: '艸' },
  '程': { strokes: 12, pinyin: 'chéng',meaning: 'Jarak, standar, perjalanan — keteraturan dan pencapaian bertahap', element: '木', radical: '禾' },
  '罗': { strokes: 19, pinyin: 'luó',  meaning: 'Jaring, himpunan — kemampuan mengumpulkan dan menyatukan', element: '木', radical: '网' },
  '彭': { strokes: 12, pinyin: 'péng', meaning: 'Nama klan kuno — panjang umur dan kekokohan', element: '木', radical: '彡' },
  '潘': { strokes: 15, pinyin: 'pān',  meaning: 'Nama sungai, marga kuno — kelembutan mengalir', element: '水', radical: '氵' },
  '卓': { strokes: 8,  pinyin: 'zhuō', meaning: 'Luar biasa, menonjol — keunggulan yang membedakan', element: '土', radical: '十' },
  '洪': { strokes: 9,  pinyin: 'hóng', meaning: 'Air besar, banjir — kekuatan dahsyat dan kemurahan hati', element: '水', radical: '氵' },
  '叶': { strokes: 5,  pinyin: 'yè',   meaning: 'Daun — kehidupan, siklus alam, dan kelenturan', element: '木', radical: '口' },
  '方': { strokes: 4,  pinyin: 'fāng', meaning: 'Arah, persegi, cara — keteguhan dan integritas', element: '土', radical: '方' },
  '卢': { strokes: 5,  pinyin: 'lú',   meaning: 'Tungku, tempat api — kehangatan dan keramahan', element: '火', radical: '卜' },
  '傅': { strokes: 12, pinyin: 'fù',   meaning: 'Mengajar, membimbing — kebijaksanaan dan dedikasi', element: '木', radical: '人' },
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
  // Karakter nama pria umum
  '建': { strokes: 9,  pinyin: 'jiàn', meaning: 'Membangun, mendirikan — semangat konstruktif dan pencapaian besar', element: '土', radical: '廴' },
  '国': { strokes: 11, pinyin: 'guó',  meaning: 'Negara, bangsa — patriotisme dan rasa tanggung jawab kolektif', element: '土', radical: '囗' },
  '军': { strokes: 9,  pinyin: 'jūn',  meaning: 'Militer, pasukan — disiplin, keberanian, dan perlindungan', element: '金', radical: '冖' },
  '民': { strokes: 5,  pinyin: 'mín',  meaning: 'Rakyat, warga — keberpihakan pada komunitas dan keberagaman', element: '土', radical: '民' },
  '浩': { strokes: 10, pinyin: 'hào',  meaning: 'Luas seperti samudra — kebesaran jiwa dan kemurahan hati tanpa batas', element: '水', radical: '氵' },
  '博': { strokes: 12, pinyin: 'bó',   meaning: 'Luas ilmu, unggul — pengetahuan mendalam dan wawasan luas', element: '土', radical: '十' },
  '杰': { strokes: 8,  pinyin: 'jié',  meaning: 'Pahlawan, luar biasa — kepribadian unggul dan bakat istimewa', element: '木', radical: '木' },
  '豪': { strokes: 14, pinyin: 'háo',  meaning: 'Gagah berani, dermawan — jiwa besar dan kepemimpinan yang menginspirasi', element: '木', radical: '豕' },
  '宇': { strokes: 6,  pinyin: 'yǔ',   meaning: 'Alam semesta, ruang angkasa — pikiran yang luas dan visi jauh ke depan', element: '水', radical: '宀' },
  '轩': { strokes: 7,  pinyin: 'xuān', meaning: 'Elegan, tinggi hati yang baik — keanggunan dan ambisi mulia', element: '木', radical: '车' },
  '磊': { strokes: 15, pinyin: 'lěi',  meaning: 'Batu-batu besar, terus terang — kejujuran dan karakter kokoh', element: '土', radical: '石' },
  '晨': { strokes: 11, pinyin: 'chén', meaning: 'Fajar, pagi hari — awal yang segar dan semangat baru setiap hari', element: '火', radical: '日' },
  '阳': { strokes: 6,  pinyin: 'yáng', meaning: 'Matahari, yang positif — keceriaan, optimisme, dan energi yang memancar', element: '火', radical: '阜' },
  '涛': { strokes: 10, pinyin: 'tāo',  meaning: 'Gelombang besar samudra — kekuatan yang mengalir dan tekad yang tak terbendung', element: '水', radical: '氵' },
  '辉': { strokes: 12, pinyin: 'huī',  meaning: 'Sinar, kilau cahaya — bersinar terang dalam kegelapan dan menginspirasi', element: '火', radical: '光' },
  '凯': { strokes: 10, pinyin: 'kǎi',  meaning: 'Menang, kemenangan — keberhasilan melewati tantangan dengan gagah', element: '金', radical: '几' },
  '鑫': { strokes: 24, pinyin: 'xīn',  meaning: 'Tiga emas — kelimpahan berlapis, kemakmuran yang terus bertumbuh', element: '金', radical: '金' },
  '远': { strokes: 7,  pinyin: 'yuǎn', meaning: 'Jauh, visi panjang — pandangan visioner dan tujuan yang mulia', element: '水', radical: '辶' },
  '昌': { strokes: 8,  pinyin: 'chāng',meaning: 'Makmur, berkembang — pertumbuhan yang konsisten dan keberlimpahan', element: '火', radical: '日' },
  '盛': { strokes: 11, pinyin: 'shèng',meaning: 'Melimpah, jaya — masa keemasan, kejayaan, dan kepenuhan hidup', element: '土', radical: '皿' },
  '昊': { strokes: 8,  pinyin: 'hào',  meaning: 'Langit yang luas, agung — jiwa besar dan semangat yang tak terbatas', element: '火', radical: '日' },
  '峻': { strokes: 10, pinyin: 'jùn',  meaning: 'Gunung tinggi nan gagah — kepribadian kuat, tegas, dan dihormati', element: '土', radical: '山' },
  '宏': { strokes: 7,  pinyin: 'hóng', meaning: 'Besar, agung — ambisi besar dan kapasitas yang luar biasa', element: '土', radical: '宀' },
  '达': { strokes: 6,  pinyin: 'dá',   meaning: 'Mencapai, sukses — kemampuan meraih tujuan dan komunikasi yang lancar', element: '木', radical: '辶' },
  '乾': { strokes: 11, pinyin: 'qián', meaning: 'Langit, yang murni — kekuatan surgawi, kepemimpinan, dan kreativitas tertinggi', element: '金', radical: '乙' },
  '成': { strokes: 6,  pinyin: 'chéng',meaning: 'Berhasil, terwujud — keberhasilan nyata dari kerja keras dan ketekunan', element: '金', radical: '戈' },
  '峰': { strokes: 10, pinyin: 'fēng', meaning: 'Puncak gunung — ambisi mencapai puncak dan prestasi tertinggi', element: '土', radical: '山' },
  '旭': { strokes: 6,  pinyin: 'xù',   meaning: 'Matahari terbit — harapan baru, awal cerah, dan semangat yang membarakan', element: '火', radical: '日' },
  '坚': { strokes: 7,  pinyin: 'jiān', meaning: 'Teguh, kokoh — keteguhan hati yang tidak goyah menghadapi cobaan', element: '土', radical: '土' },
  '浩': { strokes: 10, pinyin: 'hào',  meaning: 'Luas seperti samudra — kebesaran jiwa dan kemurahan hati tanpa batas', element: '水', radical: '氵' },
  '海': { strokes: 10, pinyin: 'hǎi',  meaning: 'Laut, samudra — keluasan pikiran, kedalaman jiwa, dan kemurahan hati', element: '水', radical: '氵' },
  '江': { strokes: 6,  pinyin: 'jiāng',meaning: 'Sungai besar — aliran kehidupan yang terus berkembang dan memberikan', element: '水', radical: '氵' },
  // Karakter nama wanita umum
  '婷': { strokes: 12, pinyin: 'tíng', meaning: 'Anggun, elegan — kecantikan yang menawan dan keanggunan alami', element: '木', radical: '女' },
  '娟': { strokes: 10, pinyin: 'juān', meaning: 'Cantik, halus — keindahan yang lembut dan pesona yang tulus', element: '木', radical: '女' },
  '燕': { strokes: 16, pinyin: 'yàn', meaning: 'Burung walet — ketangkasan, kebebasan, dan kesetiaan pada rumah', element: '火', radical: '火' },
  '珍': { strokes: 9,  pinyin: 'zhēn', meaning: 'Berharga, mulia — diri yang bernilai tinggi dan hati yang tulus', element: '金', radical: '玉' },
  '艳': { strokes: 20, pinyin: 'yàn', meaning: 'Indah menawan, berwarna — kecantikan yang memukau dan penuh pesona', element: '火', radical: '色' },
  '清': { strokes: 11, pinyin: 'qīng', meaning: 'Jernih, murni, bersih — pikiran yang bening dan jiwa yang tulus', element: '水', radical: '氵' },
  '香': { strokes: 9,  pinyin: 'xiāng',meaning: 'Harum, wangi — keharuman nama yang abadi dan jiwa yang indah', element: '木', radical: '香' },
  '静': { strokes: 14, pinyin: 'jìng', meaning: 'Tenang, damai, hening — ketenangan batin yang memberikan kekuatan', element: '水', radical: '青' },
  '敏': { strokes: 11, pinyin: 'mǐn', meaning: 'Cerdas, tangkas, responsif — kecerdasan yang tajam dan adaptabilitas tinggi', element: '木', radical: '攴' },
  '洁': { strokes: 9,  pinyin: 'jié', meaning: 'Bersih, murni — integritas yang tak ternoda dan hati yang tulus', element: '水', radical: '氵' },
  '翠': { strokes: 14, pinyin: 'cuì', meaning: 'Giok hijau, zamrud — keindahan alami yang memesona dan kelangkaan', element: '木', radical: '羽' },
  '素': { strokes: 10, pinyin: 'sù',  meaning: 'Murni, sederhana, polos — keindahan dalam kesederhanaan dan kemurnian hati', element: '金', radical: '糸' },
  '红': { strokes: 6,  pinyin: 'hóng',meaning: 'Merah, semangat — keberuntungan, kegembiraan, dan vitalitas yang menggebu', element: '火', radical: '糸' },
  '凌': { strokes: 10, pinyin: 'líng',meaning: 'Melampaui, melintasi es — semangat untuk mengatasi rintangan dan bangkit', element: '水', radical: '冫' },
  '彤': { strokes: 7,  pinyin: 'tóng',meaning: 'Merah keemasan — kecantikan bersinar dan semangat penuh gairah', element: '火', radical: '彡' },
  '欣': { strokes: 8,  pinyin: 'xīn', meaning: 'Gembira, bahagia — kesenangan hidup yang tulus dan semangat yang terpancar', element: '木', radical: '欠' },
  '颖': { strokes: 13, pinyin: 'yǐng',meaning: 'Cerdas, bakat menonjol — kecerdasan yang cemerlang dan bakat yang terpancar', element: '木', radical: '页' },
  '嘉': { strokes: 14, pinyin: 'jiā', meaning: 'Baik, unggul, terpuji — karakter mulia yang diterima dan dihargai semua orang', element: '土', radical: '口' },
  '怡': { strokes: 8,  pinyin: 'yí',  meaning: 'Gembira, puas, harmonis — kebahagiaan yang mengalir dan keselarasan jiwa', element: '火', radical: '心' },
  '倩': { strokes: 10, pinyin: 'qiàn',meaning: 'Cantik, memesona — kecantikan yang natural dan daya tarik yang memukau', element: '木', radical: '人' },
  '佳': { strokes: 8,  pinyin: 'jiā', meaning: 'Baik, cantik, sempurna — kebaikan yang tulus dan kemampuan membawa kebahagiaan', element: '木', radical: '人' },
  '若': { strokes: 8,  pinyin: 'ruò', meaning: 'Seperti, seumpama, fleksibel — kebijaksanaan yang lentur dan pikiran yang terbuka', element: '木', radical: '艸' },
  '青': { strokes: 8,  pinyin: 'qīng',meaning: 'Hijau-biru, masa muda — vitalitas muda, harapan, dan kesegaran abadi', element: '木', radical: '青' },
  '碧': { strokes: 14, pinyin: 'bì',  meaning: 'Hijau giok, biru jernih — kemurnian dan keindahan alam yang memesona', element: '木', radical: '石' },
  '紫': { strokes: 12, pinyin: 'zǐ',  meaning: 'Ungu, warna kerajaan — kebangsawanan, kebijaksanaan, dan spiritualitas', element: '火', radical: '糸' },
  '丹': { strokes: 4,  pinyin: 'dān', meaning: 'Sinaber merah, pil sakti — ketulusan hati dan semangat yang membara', element: '火', radical: '丹' },
  '晓': { strokes: 10, pinyin: 'xiǎo',meaning: 'Fajar, paham, memahami — pencerahan pengetahuan dan awal yang menjanjikan', element: '火', radical: '日' },
  '秀': { strokes: 7,  pinyin: 'xiù', meaning: 'Elegan, berbakat, indah — bakat terpendam yang bersinar pada saat yang tepat', element: '木', radical: '禾' },
  '菁': { strokes: 11, pinyin: 'jīng',meaning: 'Bunga putih, murni, terampil — kemurnian dan keahlian yang terus berkembang', element: '木', radical: '艸' },
  '珊': { strokes: 9,  pinyin: 'shān',meaning: 'Terumbu karang, indah — keindahan yang unik terbentuk dari waktu dan ketekunan', element: '金', radical: '玉' },
  '诗': { strokes: 8,  pinyin: 'shī', meaning: 'Puisi — jiwa seni yang tinggi, kepekaan estetis, dan ekspresi yang indah', element: '木', radical: '言' },
  '蕾': { strokes: 16, pinyin: 'lěi', meaning: 'Kuncup bunga — potensi yang belum mekar, masa depan yang cerah menanti', element: '木', radical: '艸' },
  // Karakter nilai/kebajikan
  '勇': { strokes: 9,  pinyin: 'yǒng',meaning: 'Berani, gagah — keberanian sejati yang bersumber dari hati yang kuat', element: '金', radical: '力' },
  '廉': { strokes: 13, pinyin: 'lián',meaning: 'Jujur, bersih hati — integritas tanpa kompromi dan hidup yang lurus', element: '金', radical: '广' },
  '道': { strokes: 12, pinyin: 'dào', meaning: 'Jalan, prinsip hidup — kebijaksanaan dalam menjalani hidup sesuai alam semesta', element: '水', radical: '辶' },
  '诚': { strokes: 8,  pinyin: 'chéng',meaning: 'Tulus, jujur, ikhlas — kejujuran yang tulus dan kepercayaan yang tak tergoyahkan', element: '土', radical: '言' },
  '善': { strokes: 12, pinyin: 'shàn',meaning: 'Kebaikan, kebajikan — hati yang selalu cenderung pada kebaikan dan kebenaran', element: '土', radical: '口' },
  '真': { strokes: 10, pinyin: 'zhēn',meaning: 'Nyata, tulus, benar — kejujuran yang murni dan keaslian tanpa kepura-puraan', element: '土', radical: '目' },
  '纯': { strokes: 7,  pinyin: 'chún',meaning: 'Murni, polos, tanpa campuran — kemurnian niat dan kesucian hati yang terjaga', element: '金', radical: '糸' },
  '谦': { strokes: 13, pinyin: 'qiān',meaning: 'Rendah hati, tawadhu — kebijaksanaan dalam menyadari bahwa selalu ada ruang untuk belajar', element: '土', radical: '言' },
  '正': { strokes: 5,  pinyin: 'zhèng',meaning: 'Benar, tegak, adil — kebenaran yang diperjuangkan dan keadilan yang ditegakkan', element: '土', radical: '止' },
  // Alam dan musim
  '春': { strokes: 9,  pinyin: 'chūn',meaning: 'Musim semi — pembaruan, harapan, dan awal kehidupan yang penuh potensi', element: '木', radical: '日' },
  '夏': { strokes: 10, pinyin: 'xià', meaning: 'Musim panas — energi yang penuh, vitalitas memuncak, dan keberlimpahan', element: '火', radical: '夊' },
  '秋': { strokes: 9,  pinyin: 'qiū', meaning: 'Musim gugur — kematangan, hasil panen kehidupan, dan kedewasaan', element: '金', radical: '禾' },
  '冬': { strokes: 5,  pinyin: 'dōng',meaning: 'Musim dingin — ketenangan dalam penantian dan kekuatan yang tersimpan', element: '水', radical: '冫' },
  '天': { strokes: 4,  pinyin: 'tiān',meaning: 'Langit, surga, alam — koneksi dengan yang lebih tinggi dan jiwa yang bebas', element: '金', radical: '大' },
  '地': { strokes: 6,  pinyin: 'dì',  meaning: 'Bumi, tanah — keteguhan, kesuburan, dan kemampuan menopang kehidupan', element: '土', radical: '土' },
  '云': { strokes: 4,  pinyin: 'yún', meaning: 'Awan — kebebasan, transformasi, dan kemampuan mengisi ruang yang dibutuhkan', element: '水', radical: '二' },
  '星': { strokes: 9,  pinyin: 'xīng',meaning: 'Bintang — cahaya yang terus bersinar dalam kegelapan, tujuan yang menginspirasi', element: '火', radical: '日' },
  '月': { strokes: 4,  pinyin: 'yuè', meaning: 'Bulan — kelembutan, siklus, dan keindahan yang hadir dalam ketenangan malam', element: '水', radical: '月' },
  '风': { strokes: 4,  pinyin: 'fēng',meaning: 'Angin — kebebasan, kecepatan, dan kemampuan menyentuh semua yang dilewati', element: '木', radical: '风' },
  '晓': { strokes: 10, pinyin: 'xiǎo',meaning: 'Fajar, memahami — pencerahan dan awal yang penuh kemungkinan', element: '火', radical: '日' },
  // Karakter nama lainnya yang umum
  '锋': { strokes: 12, pinyin: 'fēng',meaning: 'Ujung tajam, pelopor — ketajaman pikiran dan kemampuan memimpin di garis terdepan', element: '金', radical: '金' },
  '俊': { strokes: 9,  pinyin: 'jùn', meaning: 'Tampan, berbakat, unggul — kombinasi penampilan memukau dan kemampuan luar biasa', element: '木', radical: '人' },
  '亮': { strokes: 9,  pinyin: 'liàng',meaning: 'Bersinar, terang, cemerlang — pikiran yang cerah dan prestasi yang gemilang', element: '火', radical: '亠' },
  '超': { strokes: 12, pinyin: 'chāo',meaning: 'Melampaui, mengatasi — tekad untuk selalu melebihi ekspektasi dan batas', element: '木', radical: '走' },
  '鹏': { strokes: 13, pinyin: 'péng',meaning: 'Burung raksasa mitologi — ambisi setinggi langit dan potensi yang tak terbatas', element: '木', radical: '鸟' },
  '康': { strokes: 11, pinyin: 'kāng',meaning: 'Sehat, makmur, tenteram — kesehatan yang prima dan kemakmuran yang berkelanjutan', element: '土', radical: '广' },
  '兴': { strokes: 6,  pinyin: 'xīng',meaning: 'Bangkit, berkembang, gembira — semangat yang terus tumbuh dan kebahagiaan berbagi', element: '木', radical: '八' },
  '庆': { strokes: 6,  pinyin: 'qìng',meaning: 'Merayakan, berkah — setiap hari adalah perayaan dan setiap momen adalah berkah', element: '木', radical: '广' },
  '祥': { strokes: 11, pinyin: 'xiáng',meaning: 'Pertanda baik, keberuntungan — aura positif yang menarik keberuntungan', element: '土', radical: '示' },
  '和': { strokes: 8,  pinyin: 'hé',  meaning: 'Harmoni, damai — kemampuan menciptakan keselarasan di mana pun berada', element: '木', radical: '口' },
  '泽': { strokes: 8,  pinyin: 'zé',  meaning: 'Rawa berkah, kemurahan — limpahan karunia yang dibagikan kepada sesama', element: '水', radical: '氵' },
  '烨': { strokes: 12, pinyin: 'yè',  meaning: 'Bersinar, menyala-nyala — semangat membara dan cahaya yang menghangatkan', element: '火', radical: '火' },
  '睿': { strokes: 14, pinyin: 'ruì', meaning: 'Bijaksana, cerdas mendalam — kebijaksanaan yang menembus hal-hal tersembunyi', element: '水', radical: '目' },
  '源': { strokes: 13, pinyin: 'yuán',meaning: 'Sumber, asal — kembali ke akar dan menjadi sumber bagi banyak orang', element: '水', radical: '氵' },
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
