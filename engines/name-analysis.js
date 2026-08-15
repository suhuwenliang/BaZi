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
  '许': { strokes: 6,  pinyin: 'xǔ',   meaning: 'Mengizinkan, berjanji — kepercayaan, integritas, dan keteguhan janji', element: '金', radical: '言' },
  '邓': { strokes: 4,  pinyin: 'dèng', meaning: 'Marga kuno, nama negeri — tradisi dan identitas yang mengakar kuat', element: '土', radical: '阜' },
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
  '义': { strokes: 3,  pinyin: 'yì', meaning: 'Kebenaran, keadilan — moralitas yang teguh dan kesetiaan sejati', element: '金', radical: '丶' },
  '礼': { strokes: 17, pinyin: 'lǐ',  meaning: 'Kesopanan, tata krama, ritual — harmoni sosial', element: '火', radical: '示' },
  '智': { strokes: 12, pinyin: 'zhì', meaning: 'Kebijaksanaan, kecerdasan tinggi — pengetahuan yang mendalam', element: '水', radical: '日' },
  '信': { strokes: 9,  pinyin: 'xìn', meaning: 'Kepercayaan, kejujuran, surat — integritas yang bisa diandalkan', element: '木', radical: '人' },
  '平': { strokes: 5,  pinyin: 'píng',meaning: 'Damai, datar, seimbang — ketenangan dan keseimbangan', element: '木', radical: '干' },
  '安': { strokes: 6,  pinyin: 'ān',  meaning: 'Aman, tenteram, damai — ketentraman lahir dan batin', element: '土', radical: '宀' },
  '宁': { strokes: 5,  pinyin: 'níng', meaning: 'Tenang, damai — ketenangan jiwa yang mendalam dan kebijaksanaan', element: '水', radical: '宀' },
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
  '海': { strokes: 10, pinyin: 'hǎi',  meaning: 'Laut, samudra — keluasan pikiran, kedalaman jiwa, dan kemurahan hati', element: '水', radical: '氵' },
  '江': { strokes: 6,  pinyin: 'jiāng',meaning: 'Sungai besar — aliran kehidupan yang terus berkembang dan memberikan', element: '水', radical: '氵' },
  // Karakter cahaya, sinar, kemuliaan
  '光': { strokes: 6,  pinyin: 'guāng',meaning: 'Cahaya, sinar, kemuliaan — kecemerlangan yang menerangi dan menginspirasi sekitar', element: '火', radical: '儿' },
  '灿': { strokes: 7,  pinyin: 'càn',  meaning: 'Bersinar cemerlang — kejayaan yang menyilaukan dan penuh semangat', element: '火', radical: '火' },
  '耀': { strokes: 20, pinyin: 'yào',  meaning: 'Bersinar terang, jaya — kemegahan yang memancar dan diakui semua orang', element: '火', radical: '羽' },
  '亮': { strokes: 9,  pinyin: 'liàng',meaning: 'Cerah, bersinar — kejernihan pikiran dan kejujuran yang terang', element: '火', radical: '亠' },
  '炎': { strokes: 8,  pinyin: 'yán',  meaning: 'Api berkobar — semangat yang membara dan vitalitas yang kuat', element: '火', radical: '火' },
  '焱': { strokes: 12, pinyin: 'yàn', meaning: 'Api besar menyala — semangat besar yang berkobar tanpa henti', element: '火', radical: '火' },
  // Karakter alam dan langit
  '云': { strokes: 4,  pinyin: 'yún',  meaning: 'Awan — kebebasan, perubahan, dan imajinasi yang tak terbatas', element: '水', radical: '二' },
  '雨': { strokes: 8,  pinyin: 'yǔ',   meaning: 'Hujan — berkah, kesuburan, dan pembaruan kehidupan', element: '水', radical: '雨' },
  '风': { strokes: 4,  pinyin: 'fēng', meaning: 'Angin — kebebasan bergerak dan kemampuan menyesuaikan diri', element: '木', radical: '风' },
  '雪': { strokes: 11, pinyin: 'xuě',  meaning: 'Salju — kemurnian, ketenangan, dan keistimewaan yang memukau', element: '水', radical: '雨' },
  '雷': { strokes: 13, pinyin: 'léi',  meaning: 'Guntur — kekuatan yang menggelegar dan ketegasan yang tak terbendung', element: '木', radical: '雨' },
  '晴': { strokes: 12, pinyin: 'qíng', meaning: 'Cerah, langit biru — optimisme, kejernihan, dan hari-hari yang menyenangkan', element: '火', radical: '日' },
  '曦': { strokes: 20, pinyin: 'xī',   meaning: 'Sinar matahari pagi — keindahan fajar dan awal yang penuh harapan', element: '火', radical: '日' },
  '熙': { strokes: 13, pinyin: 'xī',   meaning: 'Cahaya hangat matahari — kehangatan jiwa dan kebahagiaan yang memancar', element: '火', radical: '火' },
  // Karakter kekuatan dan karakter
  '刚': { strokes: 6,  pinyin: 'gāng', meaning: 'Keras, teguh baja — karakter kuat yang tak mudah goyah', element: '金', radical: '刀' },
  '毅': { strokes: 15, pinyin: 'yì',   meaning: 'Tekad bulat, gigih — keteguhan hati dalam menapaki jalan hidup', element: '金', radical: '殳' },
  '勇': { strokes: 9,  pinyin: 'yǒng', meaning: 'Berani, pemberani — keberanian menghadapi tantangan dan mengambil tindakan', element: '金', radical: '力' },
  '超': { strokes: 12, pinyin: 'chāo', meaning: 'Melampaui, unggul — kemampuan melewati batas dan meraih lebih banyak', element: '木', radical: '走' },
  '飞': { strokes: 3,  pinyin: 'fēi',  meaning: 'Terbang — ambisi tinggi dan kebebasan yang tak terbatas', element: '木', radical: '飞' },
  '腾': { strokes: 13, pinyin: 'téng', meaning: 'Melonjak, melesat — kemajuan pesat dan semangat yang tak tertahankan', element: '火', radical: '月' },
  '康': { strokes: 11, pinyin: 'kāng', meaning: 'Sehat, sejahtera — kesehatan sempurna dan kehidupan penuh berkah', element: '金', radical: '广' },
  '和': { strokes: 8,  pinyin: 'hé',   meaning: 'Harmonis, selaras — keselarasan dengan sesama dan keseimbangan alam', element: '木', radical: '口' },
  '顺': { strokes: 9,  pinyin: 'shùn', meaning: 'Lancar, sesuai — perjalanan hidup yang mulus dan penuh kemudahan', element: '水', radical: '页' },
  '兴': { strokes: 6,  pinyin: 'xīng', meaning: 'Maju, bersemangat — semangat tumbuh dan berkembang tanpa henti', element: '火', radical: '八' },
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
  '星': { strokes: 9,  pinyin: 'xīng',meaning: 'Bintang — cahaya yang terus bersinar dalam kegelapan, tujuan yang menginspirasi', element: '火', radical: '日' },
  '月': { strokes: 4,  pinyin: 'yuè', meaning: 'Bulan — kelembutan, siklus, dan keindahan yang hadir dalam ketenangan malam', element: '水', radical: '月' },
  // Karakter nama lainnya yang umum
  '锋': { strokes: 12, pinyin: 'fēng',meaning: 'Ujung tajam, pelopor — ketajaman pikiran dan kemampuan memimpin di garis terdepan', element: '金', radical: '金' },
  '俊': { strokes: 9,  pinyin: 'jùn', meaning: 'Tampan, berbakat, unggul — kombinasi penampilan memukau dan kemampuan luar biasa', element: '木', radical: '人' },
  '鹏': { strokes: 13, pinyin: 'péng',meaning: 'Burung raksasa mitologi — ambisi setinggi langit dan potensi yang tak terbatas', element: '木', radical: '鸟' },
  '庆': { strokes: 6,  pinyin: 'qìng',meaning: 'Merayakan, berkah — setiap hari adalah perayaan dan setiap momen adalah berkah', element: '木', radical: '广' },
  '祥': { strokes: 11, pinyin: 'xiáng',meaning: 'Pertanda baik, keberuntungan — aura positif yang menarik keberuntungan', element: '土', radical: '示' },
  '泽': { strokes: 8,  pinyin: 'zé',  meaning: 'Rawa berkah, kemurahan — limpahan karunia yang dibagikan kepada sesama', element: '水', radical: '氵' },
  '烨': { strokes: 12, pinyin: 'yè',  meaning: 'Bersinar, menyala-nyala — semangat membara dan cahaya yang menghangatkan', element: '火', radical: '火' },
  '睿': { strokes: 14, pinyin: 'ruì', meaning: 'Bijaksana, cerdas mendalam — kebijaksanaan yang menembus hal-hal tersembunyi', element: '水', radical: '目' },
  '源': { strokes: 13, pinyin: 'yuán',meaning: 'Sumber, asal — kembali ke akar dan menjadi sumber bagi banyak orang', element: '水', radical: '氵' },
  // ── Marga tambahan (百家姓) ───────────────────────────────────────
  '钱': { strokes: 10, pinyin: 'qián', meaning: 'Uang, logam berharga — kemakmuran dan nilai kehidupan', element: '金', radical: '金' },
  '孔': { strokes: 4,  pinyin: 'kǒng', meaning: 'Lubang, marga Konfusius — kebijaksanaan abadi dan kebesaran budaya', element: '木', radical: '子' },
  '曹': { strokes: 11, pinyin: 'cáo', meaning: 'Kelompok, marga kerajaan Wei — kepemimpinan dan strategi', element: '木', radical: '曰' },
  '严': { strokes: 17, pinyin: 'yán', meaning: 'Ketat, disiplin, serius — integritas yang teguh dan disiplin diri', element: '木', radical: '口' },
  '尹': { strokes: 4,  pinyin: 'yǐn', meaning: 'Pemimpin, direktur — otoritas dan kebijaksanaan kepemimpinan', element: '木', radical: '乙' },
  '姜': { strokes: 9,  pinyin: 'jiāng', meaning: 'Jahe, marga kuno — kekuatan dan kehangatan yang bertahan lama', element: '火', radical: '女' },
  '戴': { strokes: 17, pinyin: 'dài', meaning: 'Mengenakan, membawa — tanggung jawab dan kebanggaan yang dijunjung', element: '木', radical: '戈' },
  '龚': { strokes: 11, pinyin: 'gōng', meaning: 'Marga bangsawan kuno — kemuliaan dan tradisi yang dihormati', element: '木', radical: '龙' },
  '温': { strokes: 12, pinyin: 'wēn', meaning: 'Hangat, lembut — keramahan tulus dan kehangatan hati', element: '水', radical: '氵' },
  '卞': { strokes: 4,  pinyin: 'biàn', meaning: 'Marga kuno, perubahan — adaptasi dan ketangkasan', element: '木', radical: '卜' },
  '柯': { strokes: 9,  pinyin: 'kē', meaning: 'Gagang kapak, cabang — keteguhan dan dukungan yang kuat', element: '木', radical: '木' },
  '段': { strokes: 9,  pinyin: 'duàn', meaning: 'Bagian, memotong — ketegasan dan kemampuan analisis', element: '金', radical: '殳' },
  '钟': { strokes: 12, pinyin: 'zhōng', meaning: 'Lonceng, berfokus — ritme hidup dan konsentrasi penuh', element: '金', radical: '金' },
  '萧': { strokes: 16, pinyin: 'xiāo', meaning: 'Bambu hutan, sepi — ketenangan dan keindahan yang jauh dari keramaian', element: '木', radical: '艸' },
  '汪': { strokes: 7,  pinyin: 'wāng', meaning: 'Luas dan dalam seperti air — keluasan pikiran dan kedalaman jiwa', element: '水', radical: '氵' },
  '薛': { strokes: 17, pinyin: 'xuē', meaning: 'Tumbuhan liar, marga kuno — kemandirian dan vitalitas alam', element: '木', radical: '艸' },
  '贺': { strokes: 9,  pinyin: 'hè', meaning: 'Merayakan, memberi selamat — kegembiraan dan semangat berbagi kebaikan', element: '土', radical: '贝' },
  '邵': { strokes: 11, pinyin: 'shào', meaning: 'Nama geografis kuno — identitas kuat dan akar yang kokoh', element: '金', radical: '阜' },
  '齐': { strokes: 14, pinyin: 'qí', meaning: 'Sejajar, rata, kerajaan Qi — keseimbangan dan harmoni', element: '木', radical: '齐' },
  '魏': { strokes: 18, pinyin: 'wèi', meaning: 'Kerajaan Wei kuno — keagungan dan kekuatan yang mengakar', element: '土', radical: '鬼' },
  '史': { strokes: 5,  pinyin: 'shǐ', meaning: 'Sejarah, pejabat kuno — kebijaksanaan dari masa lalu', element: '水', radical: '口' },
  '侯': { strokes: 9,  pinyin: 'hóu', meaning: 'Pangeran, bangsawan — kedudukan tinggi dan tanggung jawab besar', element: '土', radical: '人' },
  '袁': { strokes: 10, pinyin: 'yuán', meaning: 'Jubah panjang, marga kuno — keanggunan dan tradisi', element: '土', radical: '衣' },
  '宋': { strokes: 7,  pinyin: 'sòng', meaning: 'Dinasti Song — kebudayaan tinggi dan keagungan peradaban', element: '木', radical: '宀' },
  '孟': { strokes: 8,  pinyin: 'mèng', meaning: 'Pertama, sulung, marga Mencius — intelektualitas dan moralitas', element: '水', radical: '子' },
  '秦': { strokes: 10, pinyin: 'qín', meaning: 'Dinasti Qin, kuno — tekad besi dan kemampuan menyatukan', element: '金', radical: '禾' },
  '尚': { strokes: 8,  pinyin: 'shàng', meaning: 'Menghargai, agung — penghargaan terhadap nilai-nilai luhur', element: '土', radical: '小' },
  '崔': { strokes: 11, pinyin: 'cuī', meaning: 'Gunung tinggi, mendesak — ambisi tinggi dan tekad yang mendesak maju', element: '土', radical: '山' },
  '范': { strokes: 8,  pinyin: 'fàn', meaning: 'Model, contoh — menjadi teladan dan standar kebaikan', element: '水', radical: '艸' },
  '薄': { strokes: 16, pinyin: 'bó', meaning: 'Tipis, sedikit — kesederhanaan dan ketidakmelekatan pada hal duniawi', element: '木', radical: '艸' },
  '纪': { strokes: 6,  pinyin: 'jì', meaning: 'Catatan, abad — sejarah yang terukir dan nilai yang abadi', element: '木', radical: '糸' },
  '鲁': { strokes: 15, pinyin: 'lǔ', meaning: 'Negara kuno Lu (tanah Konfusius) — kearifan dan tradisi', element: '水', radical: '鱼' },
  '倪': { strokes: 10, pinyin: 'ní', meaning: 'Marga kuno — ketenangan dan ketahanan', element: '土', radical: '人' },
  '龘': { strokes: 48, pinyin: 'dá', meaning: 'Tiga naga, puncak keagungan — kekuatan tertinggi dan ambisi setinggi langit', element: '木', radical: '龙' },
  '翔': { strokes: 12, pinyin: 'xiáng', meaning: 'Melayang tinggi, terbang bebas — kebebasan, ambisi, dan pandangan jauh', element: '木', radical: '羽' },
  '浦': { strokes: 10, pinyin: 'pǔ', meaning: 'Tepi sungai, pelabuhan — keterbukaan dan kemampuan menghubungkan', element: '水', radical: '氵' },
  '乐': { strokes: 5,  pinyin: 'lè', meaning: 'Bahagia, musik, senang — kegembiraan hidup dan harmoni jiwa', element: '木', radical: '木' },
  '璋': { strokes: 15, pinyin: 'zhāng', meaning: 'Giok setengah lingkaran — kemuliaan dan bakat yang cemerlang', element: '金', radical: '玉' },
  '栋': { strokes: 9,  pinyin: 'dòng', meaning: 'Balok utama rumah — tulang punggung keluarga dan dukungan kuat', element: '木', radical: '木' },
  '昱': { strokes: 9,  pinyin: 'yù', meaning: 'Cahaya matahari bersinar — kecemerlangan yang terus memancar', element: '火', radical: '日' },
  '璟': { strokes: 17, pinyin: 'jǐng', meaning: 'Kilau giok — bakat yang bersinar dan karakter yang mulia', element: '金', radical: '玉' },
  '奕': { strokes: 9,  pinyin: 'yì', meaning: 'Besar, megah, bermain catur — keagungan dan kecerdasan strategis', element: '火', radical: '大' },
  '煜': { strokes: 13, pinyin: 'yù', meaning: 'Bercahaya, bersinar — semangat dan kecemerlangan yang tak padam', element: '火', radical: '火' },
  '祺': { strokes: 13, pinyin: 'qí', meaning: 'Keberuntungan, pertanda baik — nasib baik yang mengiringi sepanjang hidup', element: '土', radical: '示' },
  '铭': { strokes: 14, pinyin: 'míng', meaning: 'Prasasti, terukir — warisan yang abadi dan nama yang dikenang', element: '金', radical: '金' },
  '霖': { strokes: 16, pinyin: 'lín', meaning: 'Hujan lebat yang menyegarkan — berkah melimpah dan kemurahan hati', element: '水', radical: '雨' },
  '晋': { strokes: 10, pinyin: 'jìn', meaning: 'Maju, naik, Dinasti Jin — kemajuan pesat dan kejayaan', element: '火', radical: '日' },
  '澈': { strokes: 15, pinyin: 'chè', meaning: 'Jernih, bening — pikiran yang bersih dan jiwa yang transparan', element: '水', radical: '氵' },
  '彬': { strokes: 11, pinyin: 'bīn', meaning: 'Santun, beradab — keseimbangan sempurna antara budaya dan karakter', element: '木', radical: '木' },
  '玮': { strokes: 9,  pinyin: 'wěi', meaning: 'Giok berharga, luar biasa — keunikan dan nilai yang tak ternilai', element: '金', radical: '玉' },
  '逸': { strokes: 11, pinyin: 'yì', meaning: 'Bebas, santai, melampaui — jiwa yang merdeka dan bakat yang mengalir', element: '水', radical: '辶' },
  '熠': { strokes: 16, pinyin: 'yì', meaning: 'Berkilau, bersinar — cahaya yang terus bersinar tanpa redup', element: '火', radical: '火' },
  '珩': { strokes: 10, pinyin: 'héng', meaning: 'Giok hias, ornamen mulia — keindahan dan kedudukan terhormat', element: '金', radical: '玉' },
  '浚': { strokes: 9,  pinyin: 'jùn', meaning: 'Dalam, menggali — kedalaman pemikiran dan kemampuan menggali potensi', element: '水', radical: '氵' },
  '锐': { strokes: 12, pinyin: 'ruì', meaning: 'Tajam, lancip — ketajaman pikiran dan kecepatan dalam bertindak', element: '金', radical: '金' },
  '煊': { strokes: 13, pinyin: 'xuān', meaning: 'Bersinar terang — kemuliaan yang memancar dan semangat yang membara', element: '火', radical: '火' },
  '璞': { strokes: 17, pinyin: 'pú', meaning: 'Giok yang belum diasah — potensi besar yang menunggu dikembangkan', element: '金', radical: '玉' },
  '曜': { strokes: 18, pinyin: 'yào', meaning: 'Bersinar cemerlang, bintang — kecemerlangan dan cahaya yang menginspirasi', element: '火', radical: '日' },
  '俨': { strokes: 10, pinyin: 'yǎn', meaning: 'Agung, berwibawa — wibawa alami yang menarik kepercayaan orang', element: '木', radical: '人' },
  '栩': { strokes: 9,  pinyin: 'xǔ', meaning: 'Pohon ek, hidup — vitalitas dan pertumbuhan yang subur', element: '木', radical: '木' },
  '祎': { strokes: 8,  pinyin: 'yī', meaning: 'Indah, baik — keindahan karakter dan kebajikan yang tulus', element: '火', radical: '示' },
  '弘': { strokes: 5,  pinyin: 'hóng', meaning: 'Besar, luas — jiwa yang lapang dan pikiran yang tidak sempit', element: '水', radical: '弓' },
  '晟': { strokes: 11, pinyin: 'shèng', meaning: 'Terang bersinar — cahaya yang menerangi dan semangat yang meluap', element: '火', radical: '日' },
  '柏': { strokes: 9,  pinyin: 'bǎi', meaning: 'Pohon cemara — keteguhan, kesucian, dan umur panjang', element: '木', radical: '木' },
  '奎': { strokes: 9,  pinyin: 'kuí', meaning: 'Bintang literasi, unggul — bakat intelektual dan kepemimpinan budaya', element: '火', radical: '大' },
  '旻': { strokes: 8,  pinyin: 'mín', meaning: 'Langit musim gugur — ketenangan agung dan wawasan yang jernih', element: '金', radical: '日' },
  '润': { strokes: 10, pinyin: 'rùn', meaning: 'Lembab, menutrisi — memberi manfaat dan memelihara pertumbuhan', element: '水', radical: '氵' },
  '粲': { strokes: 13, pinyin: 'càn', meaning: 'Bersinar cemerlang — kecantikan dan kecemerlangan yang memukau', element: '火', radical: '米' },
  '凛': { strokes: 15, pinyin: 'lǐn', meaning: 'Teguh, berwibawa, dingin — kewibawaan yang menebarkan rasa hormat', element: '水', radical: '冫' },
  // ── Karakter nama wanita tambahan ───────────────────────────────
  '璃': { strokes: 15, pinyin: 'lí', meaning: 'Kaca, giok transparan — kejernihan dan keindahan yang tembus cahaya', element: '金', radical: '玉' },
  '瑶': { strokes: 13, pinyin: 'yáo', meaning: 'Giok indah, permata surgawi — keindahan langka dan kemuliaan', element: '金', radical: '玉' },
  '漫': { strokes: 14, pinyin: 'màn', meaning: 'Melimpah, luas, bebas — kebebasan ekspresi dan jiwa yang tak terbatas', element: '水', radical: '氵' },
  '妍': { strokes: 7,  pinyin: 'yán', meaning: 'Cantik, indah — kecantikan alami yang menawan tanpa kepura-puraan', element: '木', radical: '女' },
  '涵': { strokes: 11, pinyin: 'hán', meaning: 'Mengandung, memelihara — kebijaksanaan yang menampung dan jiwa besar', element: '水', radical: '氵' },
  '馨': { strokes: 20, pinyin: 'xīn', meaning: 'Wangi harum — nama yang harum dan pengaruh positif yang jauh terasa', element: '火', radical: '香' },
  '萱': { strokes: 12, pinyin: 'xuān', meaning: 'Bunga daylily — melupakan kesedihan, keibuan, dan kebaikan hati', element: '木', radical: '艸' },
  '婉': { strokes: 11, pinyin: 'wǎn', meaning: 'Lembut, sopan, elegan — kelembutan yang memukau dan budi pekerti halus', element: '木', radical: '女' },
  '璐': { strokes: 17, pinyin: 'lù', meaning: 'Giok berkilau — kemuliaan dan keindahan yang langka', element: '金', radical: '玉' },
  '蓉': { strokes: 13, pinyin: 'róng', meaning: 'Bunga hibiskus, melebur — keindahan dan kemampuan menyatukan semua', element: '木', radical: '艸' },
  '梦': { strokes: 13, pinyin: 'mèng', meaning: 'Mimpi, impian — visi dan harapan yang menginspirasi tindakan nyata', element: '水', radical: '夕' },
  '琪': { strokes: 12, pinyin: 'qí', meaning: 'Giok mulia, istimewa — keistimewaan dan nilai yang membedakan', element: '金', radical: '玉' },
  '妮': { strokes: 8,  pinyin: 'nī', meaning: 'Gadis kecil, manis — kelucuan dan pesona yang memikat hati', element: '土', radical: '女' },
  '媛': { strokes: 12, pinyin: 'yuàn', meaning: 'Wanita cantik, berbakat — kecantikan yang disertai bakat dan kepribadian', element: '木', radical: '女' },
  '钰': { strokes: 10, pinyin: 'yù', meaning: 'Emas permata — nilai yang tinggi dan kemurnian yang tak ternilai', element: '金', radical: '金' },
  '檀': { strokes: 17, pinyin: 'tán', meaning: 'Kayu cendana — keharuman abadi dan nilai spiritual yang tinggi', element: '木', radical: '木' },
  '菲': { strokes: 11, pinyin: 'fēi', meaning: 'Harum, bunga — keharuman yang lembut dan keindahan yang alami', element: '木', radical: '艸' },
  '岚': { strokes: 8,  pinyin: 'lán', meaning: 'Kabut gunung, embun pagi — misteri indah dan kesegaran alam', element: '木', radical: '山' },
  '蔓': { strokes: 14, pinyin: 'màn', meaning: 'Tanaman merambat — pertumbuhan yang meluas dan kemampuan beradaptasi', element: '木', radical: '艸' },
  '韵': { strokes: 13, pinyin: 'yùn', meaning: 'Rima, irama, pesona — keindahan yang berirama dan pesona yang halus', element: '金', radical: '音' },
  '悦': { strokes: 10, pinyin: 'yuè', meaning: 'Senang, menyenangkan — kebahagiaan tulus dan kemampuan membuat orang lain gembira', element: '火', radical: '心' },
  '雯': { strokes: 12, pinyin: 'wén', meaning: 'Awan bermotif indah — keindahan yang penuh nuansa dan kecerdasan budaya', element: '水', radical: '雨' },
  '嫣': { strokes: 14, pinyin: 'yān', meaning: 'Cantik gemilang, menawan — kecantikan yang mempesona dan senyum yang membuai', element: '火', radical: '女' },
  '琳': { strokes: 12, pinyin: 'lín', meaning: 'Batu giok indah — kecantikan berharga dan karakter mulia', element: '金', radical: '玉' },
  '瑾': { strokes: 15, pinyin: 'jǐn', meaning: 'Giok terbaik — nilai karakter tertinggi dan kebajikan yang sempurna', element: '金', radical: '玉' },
  '滢': { strokes: 14, pinyin: 'yíng', meaning: 'Air jernih mengalir — pikiran bening dan perasaan yang mengalir tulus', element: '水', radical: '氵' },
  '霏': { strokes: 16, pinyin: 'fēi', meaning: 'Hujan salju turun lembut — kelembutan dan keindahan yang hening', element: '水', radical: '雨' },
  '昕': { strokes: 8,  pinyin: 'xīn', meaning: 'Fajar awal, sinar matahari pertama — harapan baru dan awal yang cerah', element: '火', radical: '日' },
  '汐': { strokes: 6,  pinyin: 'xī', meaning: 'Air pasang malam — ketenangan dan ritme alam yang memesona', element: '水', radical: '氵' },
  '伊': { strokes: 6,  pinyin: 'yī', meaning: 'Dia, orang itu, nama sungai — identitas yang kuat dan kepribadian yang diingat', element: '木', radical: '人' },
  '柔': { strokes: 9,  pinyin: 'róu', meaning: 'Lembut, fleksibel — kekuatan dalam kelembutan dan adaptabilitas yang bijak', element: '木', radical: '木' },
  '霓': { strokes: 16, pinyin: 'ní', meaning: 'Pelangi kedua, keindahan surgawi — pesona yang langka dan memukau', element: '水', radical: '雨' },
  '璨': { strokes: 18, pinyin: 'càn', meaning: 'Permata bercahaya — kecemerlangan dan keindahan yang tak tertandingi', element: '金', radical: '玉' },
  // ── Karakter alam & konsep tambahan ────────────────────────────
  '曙': { strokes: 17, pinyin: 'shǔ', meaning: 'Fajar, menyingsing — awal baru yang menjanjikan dan cahaya setelah kegelapan', element: '火', radical: '日' },
  '霄': { strokes: 15, pinyin: 'xiāo', meaning: 'Langit tinggi, angkasa — cita-cita setinggi langit dan jiwa yang bebas', element: '水', radical: '雨' },
  '澜': { strokes: 16, pinyin: 'lán', meaning: 'Gelombang besar, riak — kekuatan yang mengalir dan pengaruh yang meluas', element: '水', radical: '氵' },
  '洲': { strokes: 9,  pinyin: 'zhōu', meaning: 'Benua, pulau sungai — keluasan dan kemandirian yang teguh', element: '水', radical: '氵' },
  '崧': { strokes: 11, pinyin: 'sōng', meaning: 'Gunung tinggi kokoh — keteguhan dan kedudukan yang dihormati', element: '土', radical: '山' },
  '岳': { strokes: 8,  pinyin: 'yuè', meaning: 'Gunung besar, mertua — otoritas dan kekuatan yang dihormati', element: '土', radical: '山' },
  '嵩': { strokes: 13, pinyin: 'sōng', meaning: 'Gunung Songshan, tinggi kokoh — kekokohan dan ketinggian cita-cita', element: '土', radical: '山' },
  '淙': { strokes: 11, pinyin: 'cóng', meaning: 'Suara air mengalir — ketenangan alam dan kejernihan pikiran', element: '水', radical: '氵' },
  '溪': { strokes: 13, pinyin: 'xī', meaning: 'Sungai kecil, anak sungai — aliran hidup yang tenang dan konsisten', element: '水', radical: '氵' },
  '莺': { strokes: 13, pinyin: 'yīng', meaning: 'Burung kutilang — nyanyian kehidupan, kebebasan, dan kegembiraan', element: '火', radical: '鸟' },
  '鹤': { strokes: 16, pinyin: 'hè', meaning: 'Burung bangau — umur panjang, keanggunan, dan kebijaksanaan', element: '土', radical: '鸟' },
  '麟': { strokes: 23, pinyin: 'lín', meaning: 'Qilin (unicorn Tiongkok) — keberuntungan langka dan kebajikan tertinggi', element: '木', radical: '鹿' },
  '璿': { strokes: 18, pinyin: 'xuán', meaning: 'Giok langka, bintang Utara — kemuliaan langit dan bintang penuntun', element: '金', radical: '玉' },
  // ── Kebajikan & konsep tambahan ─────────────────────────────────
  '孝': { strokes: 7,  pinyin: 'xiào', meaning: 'Berbakti kepada orang tua — nilai fundamental dan fondasi moral', element: '木', radical: '老' },
  '恒': { strokes: 9,  pinyin: 'héng', meaning: 'Kekonstanan, ketekunan — konsistensi yang membawa keberhasilan jangka panjang', element: '水', radical: '心' },
  '勤': { strokes: 13, pinyin: 'qín', meaning: 'Rajin, tekun, giat — ketekunan sebagai kunci segala pencapaian', element: '木', radical: '力' },
  '节': { strokes: 5,  pinyin: 'jié', meaning: 'Simpul, integritas, hemat — pengendalian diri dan prinsip yang tak tergoyahkan', element: '木', radical: '竹' },
  '睦': { strokes: 13, pinyin: 'mù', meaning: 'Harmonis, bersahabat — kerukunan dan kedamaian dalam hubungan', element: '土', radical: '目' },
  '端': { strokes: 14, pinyin: 'duān', meaning: 'Benar, tegak, awal — integritas sempurna dan awal yang baik', element: '木', radical: '立' },
  '毓': { strokes: 13, pinyin: 'yù', meaning: 'Melahirkan, mendidik — pemberi kehidupan dan pendidik generasi', element: '水', radical: '毋' },
  '贞': { strokes: 9,  pinyin: 'zhēn', meaning: 'Setia, lurus, bertanya — kesetiaan teguh dan karakter yang tak tergoyahkan', element: '火', radical: '贝' },
  '淑': { strokes: 11, pinyin: 'shū', meaning: 'Baik, murni, berbudi — kebaikan hati yang tulus dan perilaku yang mulia', element: '水', radical: '氵' },
  // ── Karakter angka & keberuntungan ─────────────────────────────
  '亿': { strokes: 3,  pinyin: 'yì', meaning: 'Seratus juta, tak terbatas — kemakmuran dalam jumlah tak terhitung', element: '木', radical: '人' },
  '吉': { strokes: 6,  pinyin: 'jí', meaning: 'Beruntung, auspisious — keberuntungan dan pertanda baik di setiap langkah', element: '土', radical: '口' },
  '禄': { strokes: 12, pinyin: 'lù', meaning: 'Rezeki, keberuntungan karir — kelimpahan material dan kemajuan jabatan', element: '木', radical: '示' },
  '财': { strokes: 7,  pinyin: 'cái', meaning: 'Kekayaan, harta — kemakmuran material dan kecerdasan finansial', element: '金', radical: '贝' },
  '旺': { strokes: 8,  pinyin: 'wàng', meaning: 'Makmur, penuh semangat — vitalitas yang meluap dan kemakmuran yang berkembang', element: '火', radical: '日' },
  '盈': { strokes: 9,  pinyin: 'yíng', meaning: 'Penuh, melimpah — kelimpahan dan kepenuhan dalam segala aspek', element: '水', radical: '皿' },
  // ── Karakter khusus Taiwan / tradisional ────────────────────────
  '謙': { strokes: 17, pinyin: 'qiān', meaning: 'Rendah hati (tradisional) — kebijaksanaan sejati dalam ketawadhu-an', element: '土', radical: '言' },
  '諺': { strokes: 16, pinyin: 'yàn', meaning: 'Peribahasa, amsal — kebijaksanaan yang diwariskan lewat generasi', element: '木', radical: '言' },
  '弈': { strokes: 9,  pinyin: 'yì', meaning: 'Bermain catur Go — kecerdasan strategis dan ketenangan dalam kompetisi', element: '木', radical: '弋' },
  // ── Karakter posisi / jabatan ────────────────────────────────────
  '帅': { strokes: 9,  pinyin: 'shuài', meaning: 'Panglima, tampan, memimpin — kepemimpinan kharismatik dan penampilan yang mengesankan', element: '金', radical: '巾' },
  '将': { strokes: 9,  pinyin: 'jiāng', meaning: 'Jenderal, akan, membawa — kepemimpinan militer dan kemampuan membawa perubahan', element: '木', radical: '寸' },
  '卿': { strokes: 10, pinyin: 'qīng', meaning: 'Pejabat tinggi, panggilan akrab — kedudukan terhormat dan hubungan yang erat', element: '金', radical: '卩' },
  '爵': { strokes: 17, pinyin: 'jué', meaning: 'Gelar bangsawan, cangkir giok — kehormatan tertinggi dan kemewahan terhormat', element: '金', radical: '爪' },
  // ── Marga umum Tionghoa Indonesia yang belum ada ────────────────
  '郑': { strokes: 8,  pinyin: 'zhèng', meaning: 'Negara Zheng kuno, tegak lurus — identitas kuat dan karakter yang lurus', element: '土', radical: '阜' },
  '蒋': { strokes: 13, pinyin: 'jiǎng', meaning: 'Sejenis tanaman air — marga terhormat dengan sejarah panjang', element: '木', radical: '艸' },
  '白': { strokes: 5,  pinyin: 'bái',  meaning: 'Putih, murni, bersih — kejernihan hati dan kepolosan jiwa yang tulus', element: '金', radical: '白' },
  '田': { strokes: 5,  pinyin: 'tián', meaning: 'Ladang, sawah — kerja keras, kesuburan, dan hasil dari ketekunan', element: '土', radical: '田' },
  '杜': { strokes: 7,  pinyin: 'dù',   meaning: 'Menghentikan, pohon pear liar — ketegasan dan kemampuan menetapkan batas', element: '木', radical: '木' },
  '丁': { strokes: 2,  pinyin: 'dīng', meaning: 'Paku besi, ke-4 dari Sepuluh Batang — keteguhan dan kekuatan dasar', element: '火', radical: '一' },
  '沈': { strokes: 7,  pinyin: 'shěn', meaning: 'Tenggelam, dalam — kedalaman pemikiran dan kemampuan memahami hal tersembunyi', element: '水', radical: '氵' },
  '阮': { strokes: 7,  pinyin: 'ruǎn', meaning: 'Marga kuno, alat musik — keindahan seni dan warisan budaya yang kaya', element: '金', radical: '阜' },
  '莫': { strokes: 10, pinyin: 'mò',   meaning: 'Jangan, tidak ada — kebijaksanaan dalam menahan diri dan ketenangan batin', element: '木', radical: '艸' },
  '常': { strokes: 11, pinyin: 'cháng',meaning: 'Konstan, sering, normal — ketekunan konsisten yang membawa kemakmuran abadi', element: '火', radical: '巾' },
  '吕': { strokes: 6,  pinyin: 'lǚ',   meaning: 'Tulang punggung, nada musik — struktur yang kuat dan harmoni dalam kehidupan', element: '土', radical: '口' },
  '熊': { strokes: 14, pinyin: 'xióng',meaning: 'Beruang — kekuatan besar, keberanian, dan perlindungan yang teguh', element: '火', radical: '火' },
  '谭': { strokes: 14, pinyin: 'tán',  meaning: 'Kolam dalam, mendalam — kebijaksanaan yang dalam dan wawasan yang tak terduga', element: '水', radical: '言' },
  '于': { strokes: 3,  pinyin: 'yú',   meaning: 'Di, pada, saat — kehadiran penuh dan koneksi dengan momen', element: '土', radical: '二' },
  '陶': { strokes: 10, pinyin: 'táo',  meaning: 'Tanah liat, membentuk, menyenangkan — kreativitas dalam membentuk dan kegembiraan hidup', element: '土', radical: '阜' },
  '乔': { strokes: 6,  pinyin: 'qiáo', meaning: 'Tinggi menjulang, marga kuno — ambisi tinggi dan kepribadian yang menonjol', element: '木', radical: '乙' },
  '邱': { strokes: 7,  pinyin: 'qiū',  meaning: 'Bukit kecil, marga kuno — keteguhan dan pandangan yang luas dari ketinggian', element: '土', radical: '阜' },
  '石': { strokes: 5,  pinyin: 'shí',  meaning: 'Batu, solid — keteguhan, kekuatan, dan fondasi yang tak tergoyahkan', element: '土', radical: '石' },
  '廖': { strokes: 14, pinyin: 'liào', meaning: 'Marga kuno, luas — keluasan wawasan dan jiwa yang lapang', element: '金', radical: '广' },
  '庄': { strokes: 6,  pinyin: 'zhuāng',meaning: 'Desa, serius, megah — kestabilan dan keseriusan yang dihormati', element: '木', radical: '士' },
  '邝': { strokes: 8,  pinyin: 'kuàng',meaning: 'Marga Kanton kuno — identitas budaya yang kuat dan tradisi luhur', element: '土', radical: '阜' },
  // ── Nama wanita paling umum yang belum ada ──────────────────────
  '爱': { strokes: 10, pinyin: 'ài',   meaning: 'Cinta, kasih sayang — hati yang penuh cinta tulus dan kemampuan memberi tanpa pamrih', element: '水', radical: '心' },
  '娜': { strokes: 9,  pinyin: 'nà',   meaning: 'Anggun, luwes — keanggunan alami dan kelenturan dalam menghadapi hidup', element: '木', radical: '女' },
  '珠': { strokes: 10, pinyin: 'zhū',  meaning: 'Mutiara, permata — keindahan yang tersembunyi dan nilai yang tak ternilai', element: '金', radical: '玉' },
  '花': { strokes: 8,  pinyin: 'huā',  meaning: 'Bunga, mekar — keindahan yang mekar pada waktunya dan semangat yang harum', element: '木', radical: '艸' },
  '玲': { strokes: 9,  pinyin: 'líng', meaning: 'Gemerincing lembut, jernih — kepribadian yang menyenangkan dan pikiran yang jernih', element: '金', radical: '玉' },
  '芬': { strokes: 7,  pinyin: 'fēn',  meaning: 'Harum, semerbak — keharuman nama yang menyebar jauh dan pengaruh positif', element: '木', radical: '艸' },
  '莉': { strokes: 10, pinyin: 'lì',   meaning: 'Bunga jasmin — keharuman lembut yang mengharumkan sekitar', element: '木', radical: '艸' },
  '彩': { strokes: 11, pinyin: 'cǎi',  meaning: 'Warna-warni, berwarna — kehidupan yang penuh warna dan bakat yang beragam', element: '木', radical: '彡' },
  '惠': { strokes: 12, pinyin: 'huì',  meaning: 'Anugerah, kebaikan hati — kemurahan hati yang mengalir kepada sesama', element: '水', radical: '心' },
  '荣': { strokes: 9,  pinyin: 'róng', meaning: 'Jaya, mekar, terhormat — kejayaan yang terus mekar dan nama yang dimuliakan', element: '木', radical: '木' },
  '桂': { strokes: 10, pinyin: 'guì',  meaning: 'Pohon osmanthus, kemuliaan — keharuman abadi dan pencapaian yang diakui', element: '木', radical: '木' },
  '锦': { strokes: 13, pinyin: 'jǐn',  meaning: 'Kain brokat emas — keindahan yang kaya dan bakat yang berlapis-lapis', element: '金', radical: '金' },
  '萍': { strokes: 12, pinyin: 'píng', meaning: 'Teratai air, terapung — kelenturan hidup dan kemampuan beradaptasi dengan arus', element: '木', radical: '艸' },
  '慈': { strokes: 13, pinyin: 'cí',   meaning: 'Belas kasih, kemurahan — cinta kasih yang besar dan kelembutan seorang ibu', element: '水', radical: '心' },
  '芸': { strokes: 10, pinyin: 'yún',  meaning: 'Sejenis tanaman wangi — keharuman yang halus dan manfaat yang diam-diam dirasakan', element: '木', radical: '艸' },
  '蕊': { strokes: 15, pinyin: 'ruǐ',  meaning: 'Putik bunga — potensi tersembunyi dan awal kehidupan yang penuh kemungkinan', element: '木', radical: '艸' },
  '冰': { strokes: 6,  pinyin: 'bīng', meaning: 'Es, bening seperti kristal — kemurnian absolut dan kejernihan yang memukau', element: '水', radical: '冫' },
  '欢': { strokes: 22, pinyin: 'huān', meaning: 'Gembira, suka cita — kebahagiaan yang tulus dan kemampuan membawa keceriaan', element: '木', radical: '欠' },
  '绿': { strokes: 11, pinyin: 'lǜ',   meaning: 'Hijau, penuh kehidupan — vitalitas alam dan harapan yang selalu hidup', element: '木', radical: '糸' },
  '仙': { strokes: 5,  pinyin: 'xiān', meaning: 'Peri, abadi — keindahan yang melampaui dunia dan kemurnian surgawi', element: '木', radical: '人' },
  '缘': { strokes: 15, pinyin: 'yuán', meaning: 'Takdir, jalinan — hubungan yang terjalin oleh takdir dan ikatan yang bermakna', element: '木', radical: '糸' },
  '娇': { strokes: 9,  pinyin: 'jiāo', meaning: 'Manja, lembut, cantik menggemaskan — kelembutan yang memikat dan pesona alamiah', element: '木', radical: '女' },
  '绮': { strokes: 12, pinyin: 'qǐ',   meaning: 'Kain sutra bermotif indah — keindahan yang kompleks dan bakat yang berlapis', element: '木', radical: '糸' },
  '菊': { strokes: 11, pinyin: 'jú',   meaning: 'Bunga krisan — ketahanan di musim dingin, keanggunan yang tak layu', element: '木', radical: '艸' },
  '蓓': { strokes: 13, pinyin: 'bèi',  meaning: 'Kuncup bunga yang belum mekar — potensi tersembunyi yang siap mekar', element: '木', radical: '艸' },
  '苑': { strokes: 8,  pinyin: 'yuàn', meaning: 'Taman, kebun bunga — tempat keindahan tumbuh dan jiwa yang terpelihara', element: '木', radical: '艸' },
  '苓': { strokes: 8,  pinyin: 'líng', meaning: 'Poria cocos, tanaman obat — manfaat tersembunyi dan kualitas yang menyembuhkan', element: '木', radical: '艸' },
  '苗': { strokes: 8,  pinyin: 'miáo', meaning: 'Bibit tanaman, keturunan — awal yang segar dan potensi yang belum terwujud', element: '木', radical: '艸' },
  '妙': { strokes: 7,  pinyin: 'miào', meaning: 'Ajaib, indah, sempurna — keistimewaan yang mengundang kekaguman', element: '火', radical: '女' },
  '颂': { strokes: 10, pinyin: 'sòng', meaning: 'Memuji, merayakan — semangat berbagi keindahan dan menghargai hal baik', element: '金', radical: '页' },
  '好': { strokes: 6,  pinyin: 'hǎo',  meaning: 'Baik, bagus, suka — kebaikan yang nyata dan daya tarik positif yang alami', element: '木', radical: '女' },
  '念': { strokes: 8,  pinyin: 'niàn', meaning: 'Rindu, mengingat, pemikiran — hati yang setia dan kenangan yang indah', element: '水', radical: '心' },
  '思': { strokes: 9,  pinyin: 'sī',   meaning: 'Berpikir, merindukan — kedalaman pikiran dan kecintaan pada kebijaksanaan', element: '水', radical: '心' },
  // ── Nama pria paling umum yang belum ada ────────────────────────
  '辰': { strokes: 7,  pinyin: 'chén', meaning: 'Benda langit, waktu — koneksi dengan kosmik dan kemampuan memanfaatkan waktu', element: '土', radical: '辰' },
  '翰': { strokes: 16, pinyin: 'hàn',  meaning: 'Kuas tulis, berbulu — bakat literatur dan kemampuan mengekspresikan gagasan', element: '木', radical: '羽' },
  '才': { strokes: 3,  pinyin: 'cái',  meaning: 'Bakat, kemampuan — potensi alami yang berkembang dan kecakapan yang menonjol', element: '木', radical: '十' },
  '威': { strokes: 9,  pinyin: 'wēi',  meaning: 'Wibawa, kekuatan, otoritas — kewibawaan alami yang menginspirasi kepercayaan', element: '火', radical: '女' },
  '富': { strokes: 12, pinyin: 'fù',   meaning: 'Kaya, berlimpah — kemakmuran sejati yang datang dari kebijaksanaan dan kerja keras', element: '水', radical: '宀' },
  '君': { strokes: 7,  pinyin: 'jūn',  meaning: 'Pemimpin, tuan, pria mulia — kepemimpinan yang bijaksana dan karakter yang mulia', element: '土', radical: '口' },
  '武': { strokes: 8,  pinyin: 'wǔ',   meaning: 'Ksatria, seni bela diri — keberanian yang disiplin dan kekuatan yang terlatih', element: '土', radical: '止' },
  '进': { strokes: 7,  pinyin: 'jìn',  meaning: 'Maju, naik, berkembang — kemajuan yang konsisten dan semangat untuk terus bertumbuh', element: '金', radical: '辶' },
  '雄': { strokes: 12, pinyin: 'xióng',meaning: 'Jantan, gagah, pahlawan — keberanian maskulin dan kekuatan yang menginspirasi', element: '火', radical: '隹' },
  '亨': { strokes: 7,  pinyin: 'hēng', meaning: 'Makmur, lancar, sukses — kemakmuran yang mengalir dan kelancaran di setiap langkah', element: '火', radical: '亠' },
  '利': { strokes: 7,  pinyin: 'lì',   meaning: 'Menguntungkan, tajam, manfaat — ketajaman pikiran dan kemampuan memberi manfaat', element: '金', radical: '刀' },
  '宝': { strokes: 8,  pinyin: 'bǎo',  meaning: 'Harta, berharga, permata — nilai yang tak ternilai dan kelebihan yang langka', element: '金', radical: '宀' },
  '贤': { strokes: 15, pinyin: 'xián', meaning: 'Berbudi luhur, berbakat, bijak — kebijaksanaan dan bakat yang menjadi teladan', element: '金', radical: '贝' },
  '健': { strokes: 11, pinyin: 'jiàn', meaning: 'Sehat, kuat, tegap — vitalitas yang prima dan semangat yang selalu segar', element: '木', radical: '人' },
  '彦': { strokes: 9,  pinyin: 'yàn',  meaning: 'Cendekiawan, berbakat — kecerdasan dan bakat yang diakui oleh semua', element: '火', radical: '彡' },
  '启': { strokes: 7,  pinyin: 'qǐ',   meaning: 'Membuka, memulai, mencerahkan — kemampuan membuka jalan baru dan menginspirasi', element: '木', radical: '户' },
  '书': { strokes: 4,  pinyin: 'shū',  meaning: 'Buku, menulis — kecintaan pada pengetahuan dan kemampuan mengabadikan gagasan', element: '木', radical: '乙' },
  '学': { strokes: 8,  pinyin: 'xué',  meaning: 'Belajar, ilmu — semangat belajar tanpa henti dan pencarian pengetahuan', element: '水', radical: '子' },
  '汉': { strokes: 5,  pinyin: 'hàn',  meaning: 'Sungai Han, bangsa Han — kebanggaan identitas dan warisan peradaban', element: '水', radical: '氵' },
  '新': { strokes: 13, pinyin: 'xīn',  meaning: 'Baru, segar, inovatif — semangat pembaruan dan kemampuan menciptakan sesuatu baru', element: '金', radical: '斤' },
  '发': { strokes: 5,  pinyin: 'fā',   meaning: 'Berkembang, sukses, rambut — perkembangan yang pesat dan kemakmuran yang memancar', element: '水', radical: '又' },
  '业': { strokes: 13, pinyin: 'yè',   meaning: 'Usaha, pekerjaan, karma — dedikasi pada tujuan dan hasil dari kerja keras', element: '木', radical: '木' },
  '松': { strokes: 8,  pinyin: 'sōng', meaning: 'Pohon pinus — keteguhan abadi, kemurnian, dan umur panjang yang dihormati', element: '木', radical: '木' },
  '长': { strokes: 8,  pinyin: 'zhǎng',meaning: 'Tumbuh, senior, pemimpin — pertumbuhan yang berkelanjutan dan kebijaksanaan yang matang', element: '木', radical: '长' },
  '生': { strokes: 5,  pinyin: 'shēng',meaning: 'Kehidupan, lahir, tumbuh — vitalitas kehidupan dan kemampuan terus bertumbuh', element: '木', radical: '生' },
  // ── Karakter nama netral / umum yang belum ada ──────────────────
  '贵': { strokes: 9,  pinyin: 'guì',  meaning: 'Mulia, berharga, terhormat — kedudukan terhormat dan nilai diri yang tinggi', element: '金', radical: '贝' },
  '良': { strokes: 7,  pinyin: 'liáng',meaning: 'Baik, murni, unggul — kebaikan yang tulus dan kualitas yang genuine', element: '土', radical: '艮' },
  '奇': { strokes: 8,  pinyin: 'qí',   meaning: 'Luar biasa, unik, ajaib — keistimewaan yang membedakan dan bakat yang tak terduga', element: '土', radical: '大' },
  '可': { strokes: 5,  pinyin: 'kě',   meaning: 'Bisa, pantas, diizinkan — kemampuan dan kelayakan yang terbuka lebar', element: '木', radical: '口' },
  '丰': { strokes: 4,  pinyin: 'fēng', meaning: 'Berlimpah, subur — kelimpahan dari kerja keras dan rezeki yang mengalir', element: '土', radical: '丰' },
  '大': { strokes: 3,  pinyin: 'dà',   meaning: 'Besar, agung, unggul — kebesaran jiwa dan visi yang melampaui batasan', element: '火', radical: '大' },
  '立': { strokes: 5,  pinyin: 'lì',   meaning: 'Berdiri tegak, mendirikan — kemandirian dan kemampuan membangun sesuatu yang kokoh', element: '土', radical: '立' },
  '同': { strokes: 6,  pinyin: 'tóng', meaning: 'Sama, bersama, harmoni — kebersamaan dan kemampuan menyatukan perbedaan', element: '木', radical: '口' },
};;

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

  // Fallback: estimasi stroke dari posisi Unicode CJK
  // CJK Unified Ideographs: U+4E00–U+9FFF
  // Karakter awal (simpler) cenderung stroke lebih sedikit
  const code = char.charCodeAt(0);
  // Estimasi lebih baik: karakter di awal blok CJK (0x4E00) umumnya 1-8 stroke
  // yang di tengah 8-15, di akhir 15-24. Range: 0x4E00-0x9FFF (~20992 chars)
  const cjkStart = 0x4E00;
  const cjkEnd   = 0x9FFF;
  let approxStrokes;
  if (code >= cjkStart && code <= cjkEnd) {
    const ratio = (code - cjkStart) / (cjkEnd - cjkStart);
    approxStrokes = Math.round(2 + ratio * 22); // range 2-24
    approxStrokes = Math.max(2, Math.min(24, approxStrokes));
  } else {
    approxStrokes = (code % 20) + 4; // untuk karakter di luar blok CJK utama
  }
  const el = getElementByStrokes(approxStrokes);
  const EL_MEANING = {
    '木': 'Pertumbuhan, kreativitas, kelenturan, kepemimpinan alami',
    '火': 'Semangat, ekspresi, kecerdasan, daya tarik sosial',
    '土': 'Stabilitas, kepercayaan, ketahanan, fondasi kuat',
    '金': 'Ketegasan, kejelasan, kejujuran, orientasi finansial',
    '水': 'Kebijaksanaan, intuisi, adaptabilitas, kedalaman pemikiran',
  };
  return {
    char,
    strokes: approxStrokes,
    pinyin: null,  // null = tidak diketahui (bukan string "(tidak tersedia)")
    meaning: `Karakter dengan unsur ${el} — ${EL_MEANING[el] || ''}.`,
    element: el,
    radical: null,
    inDatabase: false,
    note: 'Karakter belum ada di database lokal. Stroke dan unsur adalah estimasi.'
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
    origin: null,
    meaning: null,
    found: false
  };
}

module.exports = { analyzeChineseName, analyzeLatinName, analyzeChineseChar, CHINESE_CHARS };
