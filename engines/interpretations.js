'use strict';

/**
 * engines/interpretations.js
 * Tabel lookup rule-based untuk interpretasi BaZi & Zi Wei Dou Shu
 * Semua teks bersumber dari kaidah klasik yang terverifikasi.
 */

// ============================================================
// DAY MASTER (日主) — 10 batang langit
// ============================================================
const DAY_MASTER = {
  '甲': {
    element: 'Kayu', polarity: 'Yang', symbol: 'Pohon Besar',
    character: 'Pemimpin alami, berpendirian teguh, ambisius, penuh inisiatif. Seperti pohon besar yang tumbuh lurus ke atas — tegas, tidak mudah dibengkokkan, dan selalu mencari pertumbuhan.',
    strength: 'Kepemimpinan, kreativitas, idealisme, keteguhan prinsip',
    weakness: 'Keras kepala, sulit berkompromi, terlalu idealis, kurang fleksibel',
    career: 'Pemimpin, pengusaha, arsitek, dokter, pendidik, pejabat pemerintah, aktivis',
    element_cn: '木'
  },
  '乙': {
    element: 'Kayu', polarity: 'Yin', symbol: 'Tanaman Merambat / Bunga',
    character: 'Luwes, adaptif, penuh pesona, dan taktis. Seperti tanaman merambat — tidak menyerang secara langsung tetapi mencapai tujuan dengan jalan memutar yang cerdik. Sangat menjaga hubungan baik.',
    strength: 'Diplomasi, adaptabilitas, kreativitas estetis, kemampuan networking',
    weakness: 'Mudah terpengaruh, kurang tegas dalam keputusan besar, bergantung pada orang lain',
    career: 'Seniman, desainer, konsultan, diplomat, penulis, HRD, bidang kecantikan',
    element_cn: '木'
  },
  '丙': {
    element: 'Api', polarity: 'Yang', symbol: 'Matahari',
    character: 'Karismatik, hangat, optimis, dan murah hati. Seperti matahari — menerangi semua orang tanpa pilih kasih, penuh energi, dan selalu menjadi pusat perhatian secara alami.',
    strength: 'Karisma, kepercayaan diri, kemurahan hati, kemampuan memotivasi orang lain',
    weakness: 'Boros, terlalu percaya diri, sulit fokus jangka panjang, mudah terdistraksi',
    career: 'Artis, pembicara publik, politisi, manajer, bidang hiburan & media, guru',
    element_cn: '火'
  },
  '丁': {
    element: 'Api', polarity: 'Yin', symbol: 'Lilin / Api Kecil',
    character: 'Tekun, intuitif, penuh rasa ingin tahu, dan lembut namun bersemangat. Seperti lilin — memberi cahaya dalam gelap, menginspirasi orang-orang terdekat, dan memiliki ketajaman intuisi yang luar biasa.',
    strength: 'Intuisi tajam, dedikasi, ketelitian, kemampuan menginspirasi orang terdekat',
    weakness: 'Terlalu sensitif, mudah cemas, kurang percaya diri secara publik, terlalu perfeksionis',
    career: 'Peneliti, analis, penulis, psikolog, konsultan spiritual, ahli teknologi, chef',
    element_cn: '火'
  },
  '戊': {
    element: 'Tanah', polarity: 'Yang', symbol: 'Gunung / Bumi Besar',
    character: 'Stabil, dapat diandalkan, sabar, dan bertanggung jawab. Seperti gunung — kokoh, tidak mudah goyah, menjadi tempat berlindung bagi orang-orang di sekitarnya.',
    strength: 'Keteguhan, loyalitas, kemampuan manajemen, kepercayaan orang lain',
    weakness: 'Konservatif, lambat beradaptasi, keras kepala, sulit menerima perubahan',
    career: 'Manajer senior, direktur, petani, pengembang properti, bidang konstruksi & perbankan',
    element_cn: '土'
  },
  '己': {
    element: 'Tanah', polarity: 'Yin', symbol: 'Tanah Ladang / Sawah',
    character: 'Merawat, teliti, praktis, dan penuh perhatian. Seperti tanah subur yang memelihara segala sesuatu yang tumbuh di atasnya — lebih memperhatikan detail dan memiliki kemampuan merawat yang sangat kuat.',
    strength: 'Kepedulian, ketelitian, kemampuan nurturing, loyalitas dalam hubungan',
    weakness: 'Terlalu berhati-hati, cenderung khawatir berlebihan, sulit melepaskan sesuatu',
    career: 'Perawat, dokter, guru anak, bidang kuliner & pertanian, akuntan, HR',
    element_cn: '土'
  },
  '庚': {
    element: 'Logam', polarity: 'Yang', symbol: 'Pedang / Logam Besar',
    character: 'Tegas, berani, berprinsip kuat, dan tidak kenal kompromi dalam hal kebenaran. Seperti pedang — tajam, langsung, dan efisien. Memiliki rasa keadilan yang kuat.',
    strength: 'Ketegasan, keberanian, integritas, kemampuan eksekusi',
    weakness: 'Keras, tidak mau mengalah, sering konflik dengan otoritas, kurang peka perasaan orang lain',
    career: 'Militer, hukum, penegak keadilan, atlet, pengusaha, engineer, ahli bedah',
    element_cn: '金'
  },
  '辛': {
    element: 'Logam', polarity: 'Yin', symbol: 'Perhiasan / Logam Halus',
    character: 'Elegan, perfeksionis, peka estetika, dan memiliki standar tinggi. Seperti perhiasan — berharga, indah, dan menuntut pengerjaan yang sangat teliti. Sangat sensitif terhadap lingkungan.',
    strength: 'Keeleganan, standar tinggi, kepekaan estetis, kecerdasan analitis',
    weakness: 'Terlalu kritis, sulit puas, perfeksionis berlebihan, mudah kecewa',
    career: 'Desainer, dokter gigi, pengacara, musisi, auditor, quality control, perhiasan & fashion',
    element_cn: '金'
  },
  '壬': {
    element: 'Air', polarity: 'Yang', symbol: 'Lautan / Sungai Besar',
    character: 'Cerdas, visioner, fleksibel, dan penuh potensi. Seperti lautan — luas, dalam, mampu menampung segala sesuatu, dan selalu bergerak mencari jalan baru. Kecerdasan yang luar biasa dan kemampuan berpikir besar.',
    strength: 'Kecerdasan, visi jangka panjang, adaptabilitas, kemampuan berpikir strategis',
    weakness: 'Tidak fokus, terlalu banyak ide tanpa eksekusi, susah berkomitmen, terlalu idealis',
    career: 'Ilmuwan, filsuf, pengusaha besar, konsultan strategis, bidang keuangan & investasi, penulis',
    element_cn: '水'
  },
  '癸': {
    element: 'Air', polarity: 'Yin', symbol: 'Embun / Hujan / Air Kecil',
    character: 'Intuitif, empatik, sensitif, dan misterius. Seperti embun — lembut, tidak terlihat jelas tetapi sangat menghidupi. Memiliki kepekaan emosional dan spiritual yang sangat tinggi.',
    strength: 'Empati, intuisi spiritual, kemampuan adaptasi, kecerdasan emosional',
    weakness: 'Terlalu sensitif, mudah dipengaruhi lingkungan, sulit ekspresi diri, cenderung memendam perasaan',
    career: 'Konselor, rohaniwan, seniman, musisi, terapis, peneliti misteri, bidang kesehatan mental',
    element_cn: '水'
  }
};

// ============================================================
// TEN GODS (十神)
// ============================================================
const TEN_GODS = {
  '比肩': {
    name_id: 'Bi Jian (Saudara)',
    meaning: 'Energi yang setara dengan Day Master — diri Anda sendiri, rekan sejawat, saudara. Melambangkan kemandirian, kompetisi, dan solidaritas antar teman seperjuangan.',
    positive: 'Percaya diri, mandiri, kompetitif, setia pada kawan',
    negative: 'Egois, tidak mau mengalah, boros karena pengaruh teman, persaingan tidak sehat',
    life_area: 'Saudara kandung, teman, kolega, kompetitor'
  },
  '劫财': {
    name_id: 'Jie Cai (Saudara Bertarung)',
    meaning: 'Seperti Bi Jian tetapi lebih agresif — mengambil hak orang lain, penuh keinginan kuat untuk menang. Melambangkan kompetisi keras, keberanian, dan terkadang spekulasi.',
    positive: 'Berani, determinasi tinggi, pantang menyerah, jiwa petarung',
    negative: 'Impulsif, mengambil risiko berlebihan, konflik finansial, hubungan persahabatan bermasalah',
    life_area: 'Persaingan, jiwa petarung, spekulasi, saudara/teman yang menguras energi'
  },
  '食神': {
    name_id: 'Shi Shen (Dewa Makanan)',
    meaning: 'Melambangkan kreativitas, ekspresi diri, kenikmatan hidup, dan kemampuan menghasilkan. Seperti "dewa makanan" — membawa rezeki, talenta artistik, dan kepuasan hidup.',
    positive: 'Kreatif, artistik, menikmati hidup, produktif, berbakat',
    negative: 'Terlalu santai, menghindari konflik, bisa menjadi malas jika terlalu banyak',
    life_area: 'Kreativitas, seni, kuliner, rezeki, anak (untuk wanita), ekspresi diri'
  },
  '伤官': {
    name_id: 'Shang Guan (Pelukai Atasan)',
    meaning: 'Energi yang sangat kuat, brillian, tidak mau dikekang aturan. Memiliki bakat luar biasa tetapi juga cenderung memberontak terhadap otoritas. Diperlukan wadah yang tepat.',
    positive: 'Brilian, inovatif, berbakat multi-dimensi, charismatik, artistik tinggi',
    negative: 'Memberontak, anti-aturan, hubungan dengan atasan/pasangan bermasalah, kata-kata tajam',
    life_area: 'Inovasi, pembangkangan, bakat luar biasa, konflik dengan otoritas, pasangan (untuk wanita)'
  },
  '偏财': {
    name_id: 'Pian Cai (Harta Tidak Terduga)',
    meaning: 'Harta yang datang dari luar jalur biasa — spekulasi, investasi, bisnis sampingan, atau warisan tidak terduga. Melambangkan rezeki yang fluktuatif tetapi bisa sangat besar.',
    positive: 'Jiwa bisnis, mudah mendapat rezeki tidak terduga, pandai berinvestasi, dermawan',
    negative: 'Boros, keuangan tidak stabil, kecanduan judi/spekulasi, hubungan wanita bermasalah (untuk pria)',
    life_area: 'Rezeki tidak terduga, ayah (untuk pria), wanita (untuk pria), investasi, bisnis'
  },
  '正财': {
    name_id: 'Zheng Cai (Harta Sejati)',
    meaning: 'Harta yang diperoleh dari kerja keras dan jalur yang benar — gaji tetap, usaha yang stabil. Melambangkan keuangan yang terencana, stabil, dan dapat diandalkan.',
    positive: 'Tertib keuangan, stabil, pekerja keras, dapat diandalkan, menikah (untuk pria)',
    negative: 'Terlalu konservatif dalam investasi, sulit mengambil peluang besar, kadang pelit',
    life_area: 'Penghasilan tetap, istri (untuk pria), stabilitas finansial, properti'
  },
  '七杀': {
    name_id: 'Qi Sha (Tujuh Pembunuh)',
    meaning: 'Kekuatan yang sangat kuat dan agresif — tantangan besar yang jika berhasil ditaklukkan akan menghasilkan kekuasaan dan kehormatan luar biasa. Seperti musuh yang jika dikalahkan menjadi prajurit terkuat.',
    positive: 'Kekuatan luar biasa, kepemimpinan militer/bisnis, ketangguhan, kemampuan mengatasi krisis',
    negative: 'Hidup penuh konflik dan tekanan, impulsif, membahayakan diri sendiri, kesehatan bermasalah',
    life_area: 'Kekuasaan, tantangan hidup, suami (untuk wanita), kesehatan, konflik eksternal'
  },
  '正官': {
    name_id: 'Zheng Guan (Pejabat Resmi)',
    meaning: 'Otoritas yang legitimate, aturan, dan struktur. Melambangkan karir resmi, jabatan, reputasi baik, dan kemampuan memimpin dalam sistem yang mapan.',
    positive: 'Karir cemerlang, reputasi baik, disiplin, bertanggung jawab, dihormati',
    negative: 'Terlalu kaku pada aturan, kurang fleksibel, takut mengambil risiko',
    life_area: 'Jabatan resmi, karir, reputasi, suami ideal (untuk wanita), pemerintahan'
  },
  '偏印': {
    name_id: 'Pian Yin (Dokumen Miring)',
    meaning: 'Kebijaksanaan dari jalur tidak konvensional — spiritual, esoterik, ilmu alternatif. Melambangkan kemampuan berpikir out-of-the-box, intuisi kuat, dan jalur tidak biasa.',
    positive: 'Intuisi tajam, kemampuan spiritual, kreativitas non-konvensional, belajar mandiri',
    negative: 'Tidak praktis, overthinking, hubungan dengan ibu bermasalah, terlalu menghindar dari dunia nyata',
    life_area: 'Ilmu spiritual, intuisi, ibu/mentor tidak konvensional, perlindungan tidak terduga'
  },
  '正印': {
    name_id: 'Zheng Yin (Dokumen Resmi)',
    meaning: 'Kebijaksanaan, pendidikan formal, dan dukungan institusional. Melambangkan pembelajaran yang terstruktur, dukungan dari atasan/orang tua, dan kecerdasan akademis.',
    positive: 'Cerdas akademis, didukung mentor/atasan, etis, bijaksana, dicintai ibu',
    negative: 'Bergantung pada orang lain, kurang inisiatif, terlalu idealis, sulit mandiri',
    life_area: 'Pendidikan, ibu, mentor, reputasi moral, perlindungan otoritas'
  }
};

// ============================================================
// WU XING — DISTRIBUSI & INTERPRETASI
// ============================================================
const WU_XING = {
  '木': {
    name_id: 'Kayu (Mù)',
    traits: 'Pertumbuhan, kreativitas, fleksibilitas, kemurahan hati',
    body: 'Hati, kandung empedu, mata, tendon, kuku',
    season: 'Musim Semi',
    direction: 'Timur',
    color: 'Hijau, Biru-Hijau',
    terlalu_banyak: 'Terlalu idealis, keras kepala, mudah marah, liver rentan',
    terlalu_sedikit: 'Kurang kreativitas, kurang fleksibel, masalah penglihatan, sulit berkembang'
  },
  '火': {
    name_id: 'Api (Huǒ)',
    traits: 'Semangat, keceriaan, ekspresi, sosialisasi',
    body: 'Jantung, usus halus, lidah, pembuluh darah, wajah',
    season: 'Musim Panas',
    direction: 'Selatan',
    color: 'Merah, Oranye, Ungu',
    terlalu_banyak: 'Impulsif, mudah emosi, terlalu cerewet, jantung rentan',
    terlalu_sedikit: 'Kurang semangat, dingin dalam relasi, kurang percaya diri, kekurangan kehangatan'
  },
  '土': {
    name_id: 'Tanah (Tǔ)',
    traits: 'Stabilitas, kepercayaan, mediasi, ketahanan',
    body: 'Limpa, lambung, otot, kulit, mulut',
    season: 'Pergantian musim (4 kali/tahun)',
    direction: 'Pusat/Tengah',
    color: 'Kuning, Cokelat, Oker',
    terlalu_banyak: 'Terlalu konservatif, lambat, overthinking, masalah pencernaan',
    terlalu_sedikit: 'Tidak stabil, sulit dipercaya, kurang fokus, masalah perut'
  },
  '金': {
    name_id: 'Logam (Jīn)',
    traits: 'Ketegasan, presisi, keadilan, disiplin',
    body: 'Paru-paru, usus besar, kulit, hidung, rambut',
    season: 'Musim Gugur',
    direction: 'Barat',
    color: 'Putih, Perak, Emas',
    terlalu_banyak: 'Terlalu kaku, tidak peka, konflik dengan orang lain, paru-paru rentan',
    terlalu_sedikit: 'Kurang tegas, sulit membuat keputusan, masalah pernapasan, kurang disiplin'
  },
  '水': {
    name_id: 'Air (Shuǐ)',
    traits: 'Kebijaksanaan, fleksibilitas, intuisi, kemampuan beradaptasi',
    body: 'Ginjal, kandung kemih, tulang, telinga, rambut kepala',
    season: 'Musim Dingin',
    direction: 'Utara',
    color: 'Hitam, Navy, Abu-abu gelap',
    terlalu_banyak: 'Terlalu banyak ketakutan, tidak stabil, kelelahan, ginjal rentan',
    terlalu_sedikit: 'Kurang kebijaksanaan, kering emosi, masalah ginjal/tulang, kurang adaptif'
  }
};

// ============================================================
// SHEN SHA (神煞) — 7 UTAMA
// ============================================================
const SHEN_SHA = {
  '天乙贵人': {
    name_id: 'Tian Yi Gui Ren (Bangsawan Langit)',
    description: 'Bintang pelindung terkuat dalam BaZi. Kehadiran bintang ini berarti Anda memiliki pelindung atau mentor yang kuat — seseorang yang datang di saat paling dibutuhkan untuk membantu Anda keluar dari kesulitan.',
    effect: 'Selalu ada orang berpengaruh yang membantu di saat kritis, mudah mendapat sponsor atau mentor, dilindungi dari bencana besar',
    advice: 'Jaga hubungan baik dengan semua orang — pelindung Anda bisa datang dari mana saja yang tidak terduga'
  },
  '文昌': {
    name_id: 'Wen Chang (Bintang Sastra)',
    description: 'Bintang kecerdasan dan akademis. Melambangkan kemampuan belajar yang luar biasa, talenta menulis, dan sukses dalam jalur pendidikan atau intelektual.',
    effect: 'Mudah belajar, prestasi akademis baik, talenta menulis/komunikasi, sukses di bidang ilmu pengetahuan',
    advice: 'Investasikan waktu dalam pendidikan dan pengembangan intelektual — ini adalah kekuatan terbesar Anda'
  },
  '文曲': {
    name_id: 'Wen Qu (Bintang Seni)',
    description: 'Bintang seni dan kreativitas. Melambangkan bakat seni yang tinggi, kemampuan musik, dan daya tarik personal yang memikat.',
    effect: 'Bakat seni dan musik, karisma personal, kemampuan persuasi melalui seni dan kreativitas',
    advice: 'Kembangkan bakat seni Anda — bisa menjadi sumber rezeki dan ketenaran yang besar'
  },
  '驿马': {
    name_id: 'Yi Ma (Kuda Pos)',
    description: 'Bintang pergerakan dan perubahan. Melambangkan kehidupan yang dinamis, banyak perjalanan, dan perubahan tempat tinggal atau karir yang sering.',
    effect: 'Sering bepergian, peluang di luar kota atau luar negeri, karir di bidang perjalanan/transportasi, kehidupan yang tidak stagnan',
    advice: 'Jangan coba melawan energi ini dengan memaksakan stabilitas — nikmati mobilitas sebagai kekuatan Anda. Peluang terbaik sering datang dari luar kota/negeri'
  },
  '桃花': {
    name_id: 'Tao Hua (Bunga Persik / Daya Tarik)',
    description: 'Bintang daya tarik dan karisma personal. Melambangkan kemampuan menarik orang lain, popularitas, dan kehidupan cinta yang aktif.',
    effect: 'Daya tarik personal tinggi, disukai banyak orang, kehidupan asmara yang aktif, mudah membangun networking',
    advice: 'Gunakan daya tarik ini secara positif untuk karir dan networking. Waspadai godaan hubungan yang tidak sehat'
  },
  '羊刃': {
    name_id: 'Yang Ren (Pisau Kambing)',
    description: 'Bintang ketegasan ekstrem yang bermata dua. Di satu sisi melambangkan keberanian dan kemampuan bertahan; di sisi lain bisa membawa konflik dan ketidakstabilan jika tidak dikelola.',
    effect: 'Tekad dan keberanian luar biasa, kemampuan bertahan dalam kondisi ekstrem, tetapi juga cenderung konflik dan kecelakaan',
    advice: 'Salurkan energi ini ke bidang yang membutuhkan keberanian dan ketegasan (militer, hukum, bisnis kompetitif). Hindari konfrontasi yang tidak perlu'
  },
  '劫煞': {
    name_id: 'Jie Sha (Bintang Perampok)',
    description: 'Bintang yang melambangkan tantangan dari orang lain — penipuan, pengkhianatan, atau kerugian yang datang dari orang-orang sekitar. Namun juga bisa menjadi energi untuk waspada dan strategis.',
    effect: 'Rentan terhadap penipuan atau pengkhianatan orang terdekat, kerugian finansial dari mitra, perlu selalu waspada dalam partnership',
    advice: 'Selalu lakukan due diligence sebelum bermitra atau meminjamkan uang. Percayai insting Anda — jika merasa ada yang tidak beres, biasanya memang ada'
  }
};

// ============================================================
// KUA NUMBER & FENG SHUI PERSONAL
// ============================================================
const KUA_DATA = {
  1: {
    group: 'Timur', element: 'Air',
    sheng_qi: 'Tenggara', tian_yi: 'Timur', yan_nian: 'Selatan', fu_wei: 'Utara',
    jue_ming: 'Barat', wu_gui: 'Timur Laut', liu_sha: 'Barat Laut', huo_hai: 'Barat Daya',
    lucky_colors: ['Biru', 'Hitam', 'Hijau', 'Biru-Hijau'],
    avoid_colors: ['Kuning', 'Cokelat', 'Oranye', 'Krem']
  },
  2: {
    group: 'Barat', element: 'Tanah',
    sheng_qi: 'Timur Laut', tian_yi: 'Barat', yan_nian: 'Barat Laut', fu_wei: 'Barat Daya',
    jue_ming: 'Timur', wu_gui: 'Tenggara', liu_sha: 'Selatan', huo_hai: 'Utara',
    lucky_colors: ['Kuning', 'Merah Muda', 'Merah', 'Oranye'],
    avoid_colors: ['Biru', 'Hitam', 'Hijau']
  },
  3: {
    group: 'Timur', element: 'Kayu',
    sheng_qi: 'Selatan', tian_yi: 'Utara', yan_nian: 'Tenggara', fu_wei: 'Timur',
    jue_ming: 'Barat Daya', wu_gui: 'Barat Laut', liu_sha: 'Timur Laut', huo_hai: 'Barat',
    lucky_colors: ['Hijau', 'Biru', 'Hitam'],
    avoid_colors: ['Putih', 'Perak', 'Logam']
  },
  4: {
    group: 'Timur', element: 'Kayu',
    sheng_qi: 'Utara', tian_yi: 'Selatan', yan_nian: 'Timur', fu_wei: 'Tenggara',
    jue_ming: 'Barat Laut', wu_gui: 'Barat Daya', liu_sha: 'Barat', huo_hai: 'Timur Laut',
    lucky_colors: ['Hijau', 'Biru-Hijau', 'Hitam', 'Biru'],
    avoid_colors: ['Putih', 'Perak', 'Emas']
  },
  6: {
    group: 'Barat', element: 'Logam',
    sheng_qi: 'Barat', tian_yi: 'Timur Laut', yan_nian: 'Barat Daya', fu_wei: 'Barat Laut',
    jue_ming: 'Tenggara', wu_gui: 'Timur', liu_sha: 'Utara', huo_hai: 'Selatan',
    lucky_colors: ['Putih', 'Perak', 'Emas', 'Kuning'],
    avoid_colors: ['Merah', 'Oranye', 'Api']
  },
  7: {
    group: 'Barat', element: 'Logam',
    sheng_qi: 'Barat Laut', tian_yi: 'Barat Daya', yan_nian: 'Timur Laut', fu_wei: 'Barat',
    jue_ming: 'Timur', wu_gui: 'Utara', liu_sha: 'Selatan', huo_hai: 'Tenggara',
    lucky_colors: ['Putih', 'Perak', 'Emas', 'Kuning Keemasan'],
    avoid_colors: ['Merah', 'Ungu', 'Api']
  },
  8: {
    group: 'Barat', element: 'Tanah',
    sheng_qi: 'Barat Daya', tian_yi: 'Barat Laut', yan_nian: 'Barat', fu_wei: 'Timur Laut',
    jue_ming: 'Timur', wu_gui: 'Selatan', liu_sha: 'Tenggara', huo_hai: 'Utara',
    lucky_colors: ['Kuning', 'Cokelat', 'Merah Muda', 'Merah'],
    avoid_colors: ['Biru', 'Hitam', 'Hijau Tua']
  },
  9: {
    group: 'Timur', element: 'Api',
    sheng_qi: 'Timur', tian_yi: 'Tenggara', yan_nian: 'Utara', fu_wei: 'Selatan',
    jue_ming: 'Barat', wu_gui: 'Barat Daya', liu_sha: 'Barat Laut', huo_hai: 'Timur Laut',
    lucky_colors: ['Merah', 'Ungu', 'Oranye', 'Hijau', 'Biru-Hijau'],
    avoid_colors: ['Biru Tua', 'Hitam', 'Abu-abu']
  }
};

/**
 * Hitung Kua Number dari tahun lahir dan gender
 * Referensi: Eight Mansions Feng Shui (八宅風水)
 */
function calculateKuaNumber(year, gender) {
  // Tahun Tionghoa (jika lahir sebelum Imlek, pakai tahun sebelumnya)
  // Aproksimasi: Imlek ~4 Feb, untuk presisi penuh perlu cek tanggal Imlek
  let y = year;
  const digitSum = (n) => {
    let s = n; while (s > 9) { s = String(s).split('').reduce((a,b) => a + parseInt(b), 0); }
    return s;
  };

  if (y >= 2000) {
    const sum = digitSum(y % 100 === 0 ? 100 : y % 100);
    if (gender === 'M') {
      const kua = (10 - sum) % 9;
      return kua === 0 ? 9 : kua;
    } else {
      const kua = (sum + 5) % 9;
      return kua === 0 ? 9 : kua;
    }
  } else {
    const sum = digitSum(y % 100);
    if (gender === 'M') {
      const kua = (10 - sum) % 9;
      return kua === 0 ? 9 : kua;
    } else {
      const kua = (sum + 5) % 9;
      return kua === 0 ? 9 : kua;
    }
  }
}

// ============================================================
// ZI WEI — PENJELASAN 12 ISTANA
// ============================================================
const PALACE_INFO = {
  '命宫': {
    index: 0,
    name_id: 'Ming Gong — Istana Kehidupan',
    purpose: 'Istana paling penting dalam Zi Wei Dou Shu. Mencerminkan kepribadian inti, bakat alami, cara pandang hidup, dan nasib keseluruhan Anda. Semua istana lain merupakan cabang dari istana ini.',
    what_to_look: 'Bintang apa yang bertakhta di sini menentukan karakter fundamental Anda dan jalur hidup yang paling alami bagi Anda.',
    advice_template: 'Kenali karakter inti Anda dan biarkan potensi alami ini berkembang. Jangan melawan sifat dasar Anda — jadikan sebagai kekuatan.'
  },
  '兄弟宫': {
    index: 1,
    name_id: 'Xiong Di Gong — Istana Saudara',
    purpose: 'Mencerminkan hubungan dengan saudara kandung, teman dekat, dan kolega. Juga berkaitan dengan kekayaan yang diperoleh dari jejaring pertemanan dan kerjasama.',
    what_to_look: 'Bintang di sini menunjukkan apakah saudara dan teman menjadi pendukung atau sumber konflik dalam hidup Anda.',
    advice_template: 'Perhatikan kualitas hubungan persahabatan Anda. Investasikan energi pada persahabatan yang saling mendukung.'
  },
  '夫妻宫': {
    index: 2,
    name_id: 'Fu Qi Gong — Istana Pernikahan',
    purpose: 'Mencerminkan kehidupan percintaan, pernikahan, dan kualitas pasangan hidup. Juga menunjukkan waktu yang tepat untuk menikah dan karakteristik pasangan ideal.',
    what_to_look: 'Bintang di sini menggambarkan siapa pasangan ideal Anda, bagaimana dinamika hubungan cinta, dan apakah pernikahan akan berjalan harmonis.',
    advice_template: 'Pahami apa yang chart Anda tunjukkan tentang kebutuhan emosional dalam hubungan. Jangan memaksakan ekspektasi yang tidak sesuai dengan energi alami Anda.'
  },
  '子女宫': {
    index: 3,
    name_id: 'Zi Nü Gong — Istana Anak',
    purpose: 'Mencerminkan hubungan dengan anak-anak, keturunan, dan warisan yang ditinggalkan. Juga berkaitan dengan kreativitas dan proyek yang "dilahirkan" dari diri Anda.',
    what_to_look: 'Bintang di sini menunjukkan jumlah dan kualitas hubungan dengan anak, serta apakah Anda akan dibantu atau diuji oleh keturunan.',
    advice_template: 'Perhatikan cara Anda mengekspresikan kreativitas dan warisan hidup — baik melalui anak biologis maupun karya yang Anda ciptakan.'
  },
  '财帛宫': {
    index: 4,
    name_id: 'Cai Bo Gong — Istana Kekayaan',
    purpose: 'Mencerminkan kemampuan menghasilkan dan mengelola uang, sumber kekayaan, dan hubungan dengan materi. Salah satu istana terpenting bagi kehidupan praktis sehari-hari.',
    what_to_look: 'Bintang di sini menentukan bagaimana Anda menghasilkan uang (dari bisnis/kerja keras/investasi), apakah kekayaan mudah atau sulit diraih, dan kemampuan mengelola finansial.',
    advice_template: 'Kenali cara terbaik Anda menghasilkan uang sesuai energi chart. Bekerja melawan arus chart finansial selalu lebih melelahkan.'
  },
  '疾厄宫': {
    index: 5,
    name_id: 'Ji E Gong — Istana Kesehatan',
    purpose: 'Mencerminkan kondisi kesehatan fisik, organ yang rentan, dan cara tubuh merespons tekanan. Juga berkaitan dengan bencana kecil dan risiko dalam hidup sehari-hari.',
    what_to_look: 'Bintang di sini menunjukkan area tubuh yang perlu lebih diperhatikan dan jenis penyakit atau kecelakaan yang perlu diwaspadai.',
    advice_template: 'Lakukan pemeriksaan kesehatan berkala pada organ yang ditunjukkan chart. Pencegahan jauh lebih mudah dari pengobatan.'
  },
  '迁移宫': {
    index: 6,
    name_id: 'Qian Yi Gong — Istana Perjalanan',
    purpose: 'Mencerminkan pengalaman di luar rumah — perjalanan, perantauan, dan hidup di tempat baru. Menunjukkan apakah Anda lebih beruntung di tanah sendiri atau di perantauan.',
    what_to_look: 'Bintang di sini menentukan apakah nasib Anda lebih baik di kota asal atau di tempat baru, serta kualitas pengalaman saat bepergian jauh.',
    advice_template: 'Jika bintang di sini kuat dan positif, pertimbangkan untuk mencari peluang di luar kota atau luar negeri. Chart ini mendukung mobilitas Anda.'
  },
  '交友宫': {
    index: 7,
    name_id: 'Jiao You Gong — Istana Persahabatan',
    purpose: 'Mencerminkan kualitas hubungan dengan bawahan, karyawan, dan orang-orang yang bekerja untuk Anda. Juga berkaitan dengan networking sosial yang lebih luas.',
    what_to_look: 'Bintang di sini menunjukkan apakah bawahan/mitra bisnis akan loyal dan mendukung, atau justru menjadi beban dan pengkhianat.',
    advice_template: 'Perhatikan kualitas orang yang Anda pilih sebagai mitra atau bawahan. Chart ini memberi gambaran tentang apa yang bisa Anda harapkan dari mereka.'
  },
  '官禄宫': {
    index: 8,
    name_id: 'Guan Lu Gong — Istana Karir',
    purpose: 'Mencerminkan jalur karir, pencapaian profesional, dan hubungan dengan atasan atau sistem institusional. Istana ini adalah kompas karir Anda.',
    what_to_look: 'Bintang di sini menentukan bidang karir yang paling cocok, kemungkinan naik jabatan, dan kualitas hubungan dengan atasan atau pemerintahan.',
    advice_template: 'Selaraskan pilihan karir dengan energi yang ditunjukkan istana ini. Bekerja di bidang yang "sesuai chart" akan terasa jauh lebih mudah dan rewarding.'
  },
  '田宅宫': {
    index: 9,
    name_id: 'Tian Zhai Gong — Istana Properti',
    purpose: 'Mencerminkan hubungan dengan properti, rumah, dan aset fisik. Juga berkaitan dengan kenyamanan lingkungan tempat tinggal dan warisan dari keluarga.',
    what_to_look: 'Bintang di sini menunjukkan apakah Anda mudah memiliki properti, lingkungan rumah yang positif atau bermasalah, dan kemampuan mengakumulasi aset fisik.',
    advice_template: 'Perhatikan waktu yang tepat untuk membeli properti sesuai Da Xian yang aktif. Jangan terburu-buru jika chart sedang tidak mendukung.'
  },
  '福德宫': {
    index: 10,
    name_id: 'Fu De Gong — Istana Spiritual',
    purpose: 'Mencerminkan kebahagiaan batin, kehidupan spiritual, dan kualitas pikiran. Ini adalah istana yang menentukan seberapa bahagia Anda secara intrinsik, terlepas dari kondisi materi.',
    what_to_look: 'Bintang di sini menentukan kecenderungan spiritual, kemampuan menikmati hidup, dan apakah kebahagiaan Anda lebih bergantung pada materi atau pada kedamaian batin.',
    advice_template: 'Investasikan waktu dalam pengembangan spiritual sesuai yang ditunjukkan istana ini. Kebahagiaan sejati tidak selalu datang dari materi.'
  },
  '父母宫': {
    index: 11,
    name_id: 'Fu Mu Gong — Istana Orang Tua',
    purpose: 'Mencerminkan hubungan dengan orang tua, atasan, dan figur otoritas. Juga berkaitan dengan reputasi sosial, dukungan dari generasi sebelumnya, dan hubungan dengan negara/institusi.',
    what_to_look: 'Bintang di sini menunjukkan apakah orang tua/atasan menjadi pendukung atau justru sumber tekanan, serta bagaimana pandangan masyarakat terhadap Anda.',
    advice_template: 'Perbaiki dan jaga hubungan dengan orang tua dan figur otoritas. Energi di istana ini sering mempengaruhi seluruh jaringan dukungan dalam hidup Anda.'
  }
};

// ============================================================
// SHIO KECOCOKAN
// ============================================================
const SHIO_COMPATIBILITY = {
  '子 (Tikus)':   { best: ['龙 (Naga)','猴 (Monyet)'], good: ['牛 (Kerbau)'], avoid: ['马 (Kuda)','羊 (Kambing)'] },
  '丑 (Kerbau)':  { best: ['蛇 (Ular)','鸡 (Ayam)'],  good: ['鼠 (Tikus)'], avoid: ['羊 (Kambing)','马 (Kuda)'] },
  '寅 (Macan)':   { best: ['马 (Kuda)','狗 (Anjing)'], good: ['猪 (Babi)'], avoid: ['猴 (Monyet)','蛇 (Ular)'] },
  '卯 (Kelinci)': { best: ['羊 (Kambing)','猪 (Babi)'], good: ['狗 (Anjing)'], avoid: ['鸡 (Ayam)','龙 (Naga)'] },
  '辰 (Naga)':    { best: ['鼠 (Tikus)','猴 (Monyet)'], good: ['鸡 (Ayam)'], avoid: ['狗 (Anjing)','兔 (Kelinci)'] },
  '巳 (Ular)':    { best: ['牛 (Kerbau)','鸡 (Ayam)'], good: ['猴 (Monyet)'], avoid: ['猪 (Babi)','虎 (Macan)'] },
  '午 (Kuda)':    { best: ['虎 (Macan)','狗 (Anjing)'], good: ['羊 (Kambing)'], avoid: ['鼠 (Tikus)','牛 (Kerbau)'] },
  '未 (Kambing)': { best: ['兔 (Kelinci)','猪 (Babi)'], good: ['马 (Kuda)'], avoid: ['牛 (Kerbau)','狗 (Anjing)'] },
  '申 (Monyet)':  { best: ['鼠 (Tikus)','龙 (Naga)'], good: ['蛇 (Ular)'], avoid: ['虎 (Macan)','猪 (Babi)'] },
  '酉 (Ayam)':    { best: ['牛 (Kerbau)','蛇 (Ular)'], good: ['龙 (Naga)'], avoid: ['兔 (Kelinci)','狗 (Anjing)'] },
  '戌 (Anjing)':  { best: ['虎 (Macan)','马 (Kuda)'], good: ['兔 (Kelinci)'], avoid: ['龙 (Naga)','羊 (Kambing)'] },
  '亥 (Babi)':    { best: ['兔 (Kelinci)','羊 (Kambing)'], good: ['虎 (Macan)'], avoid: ['蛇 (Ular)','猴 (Monyet)'] }
};

// ============================================================
// PROFESI BERDASARKAN DAY MASTER + TEN GODS
// ============================================================
const CAREER_BY_DAYMASTER = {
  '甲': ['Pengusaha/CEO', 'Dokter', 'Arsitek', 'Pengacara', 'Politisi', 'Peneliti', 'Pendidik senior'],
  '乙': ['Desainer', 'Konsultan', 'Diplomat', 'Penulis', 'HR/Psikolog', 'Bidang kecantikan & mode'],
  '丙': ['Artis/Entertainer', 'Pembicara publik', 'Marketing', 'Manajer tim', 'Guru karismatik', 'Politisi'],
  '丁': ['Peneliti', 'Analis data', 'Chef', 'Terapis', 'Penulis', 'Konsultan IT', 'Spiritualis'],
  '戊': ['Direktur perusahaan', 'Bankir', 'Pengembang properti', 'Manajer senior', 'Petani/agribisnis'],
  '己': ['Perawat/dokter', 'Guru', 'Akuntan', 'Bidang kuliner', 'HR', 'Konselor'],
  '庚': ['Militer/kepolisian', 'Pengacara', 'Atlet', 'Engineer', 'Ahli bedah', 'Pengusaha kompetitif'],
  '辛': ['Desainer perhiasan', 'Dokter gigi', 'Auditor', 'Musisi', 'Quality control', 'Fashion'],
  '壬': ['Ilmuwan', 'Filsuf', 'Pengusaha besar', 'Analis strategis', 'Investor', 'Penulis visioner'],
  '癸': ['Konselor', 'Rohaniwan', 'Musisi', 'Terapis', 'Peneliti', 'Seniman spiritual']
};

// BISNIS / JENIS USAHA BERDASARKAN DAY MASTER
// ============================================================
const BUSINESS_BY_DAYMASTER = {
  '甲': ['Developer properti & konstruksi', 'Klinik/rumah sakit swasta', 'Firma hukum & konsultan', 'Lembaga pendidikan & kursus', 'Startup teknologi', 'Agribisnis & perkebunan', 'Perusahaan skala besar & holding'],
  '乙': ['Butik fashion & aksesori', 'Salon kecantikan & spa', 'Florist & dekorasi interior', 'Agensi branding & desain kreatif', 'Bisnis online & e-commerce', 'Konsultan SDM & rekrutmen', 'Perhiasan & produk kecantikan'],
  '丙': ['Event organizer & hiburan', 'Restoran, kafe & F&B', 'Agensi marketing & media sosial', 'Konten kreator & media digital', 'Bisnis pelatihan & motivasi', 'Pariwisata & travel agent', 'Studio foto & videografi'],
  '丁': ['Restoran spesialis & fine dining', 'Jasa IT & pengembangan software', 'Klinik spesialis & laboratorium', 'Penerbitan & jasa penulisan konten', 'Bisnis health & wellness', 'Studio desain & kreatif', 'Konsultasi teknis & riset'],
  '戊': ['Developer properti & real estate', 'Usaha konstruksi & material bangunan', 'Agribisnis & pertanian skala besar', 'Waralaba & franchise', 'Hotel, vila & penginapan', 'Logistik, gudang & distribusi', 'Pertambangan & sumber daya alam'],
  '己': ['Kafe, katering & restoran keluarga', 'Toko produk organik & kesehatan', 'Daycare, PAUD & kursus anak', 'Apotek & toko suplemen', 'Fashion modest & busana muslim', 'Jasa pembukuan & administrasi', 'Bisnis produk rumahan & UMKM'],
  '庚': ['Manufaktur & industri', 'Dealer kendaraan & otomotif', 'Gym, fitnes & pusat olahraga', 'Trading komoditas & bahan baku', 'Perusahaan konstruksi baja & besi', 'Bisnis peralatan, mesin & alat berat', 'Distributor produk industrial'],
  '辛': ['Toko perhiasan & aksesori premium', 'Klinik estetika & kecantikan medis', 'Fashion & butik brand premium', 'Studio musik, rekaman & produksi', 'Jasa audit, akuntansi & pajak', 'Optik & alat kesehatan', 'Bisnis produk presisi & berkualitas tinggi'],
  '壬': ['Investasi & perusahaan sekuritas', 'Bisnis impor-ekspor & perdagangan', 'Konsultan strategi & manajemen', 'Platform teknologi & SaaS', 'Logistik & jasa pengiriman', 'Holding company & ventura modal', 'Bisnis keuangan, leasing & pembiayaan'],
  '癸': ['Spa, wellness & healing center', 'Studio seni, musik & kreatif', 'Bisnis herbal, suplemen & holistik', 'Konsultasi spiritual & metafisika', 'Bisnis ramah lingkungan & eco', 'Jasa terapi & konseling', 'Penerbitan & konten inspiratif']
};

// JENIS USAHA YANG PERLU DIHINDARI BERDASARKAN UNSUR DOMINAN
const BUSINESS_AVOID_BY_ELEMENT = {
  '木': ['Industri logam & smelting berat', 'Bisnis penebangan/eksploitasi kayu masif', 'Usaha yang menuntut konfrontasi keras tanpa kreativitas'],
  '火': ['Bisnis administratif tertutup tanpa ekspresi', 'Industri berat monoton tanpa unsur sosial', 'Usaha isolasi tanpa interaksi dan networking'],
  '土': ['Spekulasi forex & kripto agresif tanpa dasar', 'Startup teknologi tanpa model bisnis jelas', 'Bisnis yang berubah-ubah sangat cepat & tidak stabil'],
  '金': ['Bisnis seni bebas tanpa standar & struktur', 'Bidang abu-abu tanpa regulasi jelas', 'Spekulasi liar tanpa analisis risiko matang'],
  '水': ['Usaha manufaktur repetitif tanpa inovasi', 'Bisnis tanpa riset & analisis mendalam', 'Industri yang menghambat kreativitas & mobilitas']
};

module.exports = {
  DAY_MASTER,
  TEN_GODS,
  WU_XING,
  SHEN_SHA,
  KUA_DATA,
  PALACE_INFO,
  SHIO_COMPATIBILITY,
  CAREER_BY_DAYMASTER,
  BUSINESS_BY_DAYMASTER,
  BUSINESS_AVOID_BY_ELEMENT,
  calculateKuaNumber
};
