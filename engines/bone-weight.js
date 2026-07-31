'use strict';

/**
 * engines/bone-weight.js
 * 袁天罡称骨法 (Yuán Tiāngāng Chēng Gǔ Fǎ) — Metode Berat Tulang
 *
 * Metode klasik dari ahli astrologi Tang Dynasty, Yuan Tiangang (袁天罡, ~600 M).
 * Setiap tahun, bulan, hari, dan jam lahir memiliki "berat" dalam satuan 两 (liǎng) dan 钱 (qián).
 * Total berat tulang menentukan kualitas nasib seseorang secara umum.
 *
 * Satuan: 1 两 = 10 钱 (seperti ons & gram dalam sistem kuno)
 * Total biasanya antara 2两2钱 hingga 6两0钱
 *
 * Sumber: 袁天罡称骨歌 (Lagu Penimbang Tulang Yuan Tiangang)
 * Catatan: Ini adalah ramalan berbasis lookup table klasik, bukan perhitungan astronomi.
 * Gunakan sebagai perspektif budaya, bukan ramalan absolut.
 */

// Bobot per Heavenly Stem (天干) tahun lahir
// Urutan: 甲乙丙丁戊己庚辛壬癸
const YEAR_STEM_WEIGHT = {
  '甲': { liang: 0, qian: 6, desc: '甲年0两6钱' },
  '乙': { liang: 0, qian: 6, desc: '乙年0两6钱' },
  '丙': { liang: 0, qian: 6, desc: '丙年0两6钱' },
  '丁': { liang: 0, qian: 6, desc: '丁年0两6钱' },
  '戊': { liang: 0, qian: 6, desc: '戊年0两6钱' },
  '己': { liang: 0, qian: 6, desc: '己年0两6钱' },
  '庚': { liang: 0, qian: 6, desc: '庚年0两6钱' },
  '辛': { liang: 0, qian: 6, desc: '辛年0两6钱' },
  '壬': { liang: 0, qian: 6, desc: '壬年0两6钱' },
  '癸': { liang: 0, qian: 6, desc: '癸年0两6钱' }
};

// Bobot per Earthly Branch (地支) tahun lahir
const YEAR_BRANCH_WEIGHT = {
  '子': { liang: 0, qian: 5 },
  '丑': { liang: 0, qian: 5 },
  '寅': { liang: 0, qian: 6 },
  '卯': { liang: 0, qian: 6 },
  '辰': { liang: 0, qian: 7 },
  '巳': { liang: 0, qian: 7 },
  '午': { liang: 0, qian: 7 },
  '未': { liang: 0, qian: 7 },
  '申': { liang: 0, qian: 8 },
  '酉': { liang: 0, qian: 8 },
  '戌': { liang: 0, qian: 5 },
  '亥': { liang: 0, qian: 6 }
};

// Bobot per bulan lahir (农历月, 1-12)
const MONTH_WEIGHT = {
  1:  { liang: 0, qian: 8, desc: '正月生' },
  2:  { liang: 0, qian: 8, desc: '二月生' },
  3:  { liang: 1, qian: 0, desc: '三月生' },
  4:  { liang: 0, qian: 8, desc: '四月生' },
  5:  { liang: 0, qian: 8, desc: '五月生' },
  6:  { liang: 0, qian: 6, desc: '六月生' },
  7:  { liang: 1, qian: 0, desc: '七月生' },
  8:  { liang: 0, qian: 8, desc: '八月生' },
  9:  { liang: 0, qian: 8, desc: '九月生' },
  10: { liang: 0, qian: 7, desc: '十月生' },
  11: { liang: 0, qian: 8, desc: '十一月生' },
  12: { liang: 0, qian: 6, desc: '十二月生' }
};

// Bobot per hari lahir dalam bulan (农历日, 1-30)
const DAY_WEIGHT = {
  1:  { liang: 1, qian: 4 }, 2:  { liang: 1, qian: 5 },
  3:  { liang: 1, qian: 2 }, 4:  { liang: 1, qian: 4 },
  5:  { liang: 1, qian: 6 }, 6:  { liang: 1, qian: 6 },
  7:  { liang: 1, qian: 0 }, 8:  { liang: 1, qian: 5 },
  9:  { liang: 1, qian: 6 }, 10: { liang: 1, qian: 6 },
  11: { liang: 1, qian: 4 }, 12: { liang: 1, qian: 2 },
  13: { liang: 1, qian: 4 }, 14: { liang: 1, qian: 6 },
  15: { liang: 2, qian: 0 }, 16: { liang: 1, qian: 6 },
  17: { liang: 1, qian: 4 }, 18: { liang: 1, qian: 6 },
  19: { liang: 1, qian: 4 }, 20: { liang: 1, qian: 6 },
  21: { liang: 1, qian: 6 }, 22: { liang: 1, qian: 4 },
  23: { liang: 1, qian: 2 }, 24: { liang: 1, qian: 6 },
  25: { liang: 1, qian: 6 }, 26: { liang: 1, qian: 4 },
  27: { liang: 1, qian: 2 }, 28: { liang: 1, qian: 6 },
  29: { liang: 1, qian: 4 }, 30: { liang: 1, qian: 2 }
};

// Bobot per jam/shichen (时辰, berdasarkan 地支 waktu)
const HOUR_WEIGHT = {
  '子': { liang: 0, qian: 8, time: '23:00-00:59', name: '子时' },
  '丑': { liang: 0, qian: 8, time: '01:00-02:59', name: '丑时' },
  '寅': { liang: 1, qian: 0, time: '03:00-04:59', name: '寅时' },
  '卯': { liang: 0, qian: 9, time: '05:00-06:59', name: '卯时' },
  '辰': { liang: 0, qian: 8, time: '07:00-08:59', name: '辰时' },
  '巳': { liang: 1, qian: 0, time: '09:00-10:59', name: '巳时' },
  '午': { liang: 0, qian: 8, time: '11:00-12:59', name: '午时' },
  '未': { liang: 0, qian: 8, time: '13:00-14:59', name: '未时' },
  '申': { liang: 1, qian: 0, time: '15:00-16:59', name: '申时' },
  '酉': { liang: 0, qian: 9, time: '17:00-18:59', name: '酉时' },
  '戌': { liang: 0, qian: 8, time: '19:00-20:59', name: '戌时' },
  '亥': { liang: 0, qian: 6, time: '21:00-22:59', name: '亥时' }
};

// Tabel ramalan berdasarkan total berat (dalam total qian)
// Dari klasik 袁天罡称骨歌
const BONE_WEIGHT_FORTUNE = [
  { min: 0,  max: 19, liang: '1两9钱以下', fortune: 'Hidup penuh perjuangan keras. Banyak hambatan dan rintangan yang harus dihadapi sendiri. Namun dengan ketekunan dan kerja keras yang luar biasa, masih bisa mencapai kehidupan yang layak. Pelajaran hidup Anda adalah ketahanan dan kemandirian.', rating: '⭐' },
  { min: 20, max: 22, liang: '2两0钱—2两2钱', fortune: 'Hidup yang penuh usaha keras. Awal kehidupan cenderung berat, namun dengan kegigihan bisa membangun kehidupan yang stabil. Keberhasilan datang dari kerja keras tanpa pamrih, bukan dari keberuntungan.', rating: '⭐⭐' },
  { min: 23, max: 26, liang: '2两3钱—2两6钱', fortune: 'Nasib cukup, kehidupan sederhana namun bermakna. Tidak akan kaya raya tetapi selalu tercukupi. Kebahagiaan ditemukan dalam hal-hal sederhana dan hubungan keluarga yang hangat.', rating: '⭐⭐⭐' },
  { min: 27, max: 30, liang: '2两7钱—3两0钱', fortune: 'Kehidupan yang baik dan menyenangkan. Rezeki cukup, keluarga harmonis, dan dikelilingi orang-orang baik. Kemungkinan besar memiliki karir atau bisnis yang stabil dan reputasi yang baik di komunitas.', rating: '⭐⭐⭐' },
  { min: 31, max: 35, liang: '3两1钱—3两5钱', fortune: 'Nasib di atas rata-rata. Memiliki bakat dan kemampuan yang diakui orang lain. Karir dan finansial cenderung positif, dengan beberapa periode kemajuan pesat. Keberuntungan sering datang dari jalur tidak terduga.', rating: '⭐⭐⭐⭐' },
  { min: 36, max: 40, liang: '3两6钱—4两0钱', fortune: 'Nasib yang baik dan memberkati. Kemampuan alami untuk menarik peluang dan orang-orang berpengaruh. Kehidupan yang bermakna dengan pencapaian yang diakui. Mungkin memiliki pengaruh positif yang besar bagi orang-orang di sekitarnya.', rating: '⭐⭐⭐⭐' },
  { min: 41, max: 45, liang: '4两1钱—4两5钱', fortune: 'Nasib sangat baik. Dikaruniai bakat, kecerdasan, dan daya tarik yang membawa sukses dalam berbagai bidang. Kemungkinan besar akan mencapai posisi yang dihormati dalam masyarakat. Keluarga harmonis dan rezeki berlimpah.', rating: '⭐⭐⭐⭐⭐' },
  { min: 46, max: 50, liang: '4两6钱—5两0钱', fortune: 'Nasib luar biasa. Terlahir membawa berkah bagi keluarga dan komunitas. Kemampuan kepemimpinan alami, rezeki melimpah, dan kehidupan yang penuh pencapaian besar. Kemungkinan meninggalkan warisan yang abadi.', rating: '⭐⭐⭐⭐⭐' },
  { min: 51, max: 60, liang: '5两1钱—6两0钱', fortune: 'Nasib terluar biasa dan sangat langka. Ini adalah tulang yang paling berharga — seperti "emas murni". Orang dengan berat tulang ini membawa nasib yang sangat luar biasa, kemungkinan besar menjadi tokoh penting, pemimpin besar, atau orang yang memberikan dampak luar biasa pada dunia.', rating: '⭐⭐⭐⭐⭐+' }
];

/**
 * Hitung berat tulang berdasarkan pilar BaZi
 * @param {object} bazi - hasil kalkulasi BaZi yang mengandung info lunar
 * @param {string} yearStem - Heavenly Stem tahun (甲乙丙...)
 * @param {string} yearBranch - Earthly Branch tahun (子丑寅...)
 * @param {number} lunarMonth - bulan lunar (1-12)
 * @param {number} lunarDay   - hari lunar (1-30)
 * @param {string} hourBranch - Earthly Branch jam (子丑寅...)
 * @returns {object} hasil lengkap
 */
function calculateBoneWeight(yearStem, yearBranch, lunarMonth, lunarDay, hourBranch) {
  const yearStemW  = YEAR_STEM_WEIGHT[yearStem]   || { liang: 0, qian: 6 };
  const yearBranchW= YEAR_BRANCH_WEIGHT[yearBranch]|| { liang: 0, qian: 6 };
  const monthW     = MONTH_WEIGHT[lunarMonth]      || { liang: 0, qian: 8 };
  const dayW       = DAY_WEIGHT[lunarDay]          || { liang: 1, qian: 0 };
  const hourW      = HOUR_WEIGHT[hourBranch]       || { liang: 0, qian: 8 };

  // Total dalam qian (1 liang = 10 qian)
  const totalQian =
    (yearStemW.liang * 10 + yearStemW.qian) +
    (yearBranchW.liang * 10 + yearBranchW.qian) +
    (monthW.liang * 10 + monthW.qian) +
    (dayW.liang * 10 + dayW.qian) +
    (hourW.liang * 10 + hourW.qian);

  const totalLiang = Math.floor(totalQian / 10);
  const remainQian = totalQian % 10;

  // Cari ramalan
  const fortune = BONE_WEIGHT_FORTUNE.find(f => totalQian >= f.min && totalQian <= f.max)
    || BONE_WEIGHT_FORTUNE[BONE_WEIGHT_FORTUNE.length - 1];

  return {
    breakdown: {
      year_stem:   { char: yearStem,   ...yearStemW },
      year_branch: { char: yearBranch, ...yearBranchW },
      month:       { number: lunarMonth, ...monthW },
      day:         { number: lunarDay,   ...dayW },
      hour:        { branch: hourBranch, ...hourW, time: HOUR_WEIGHT[hourBranch]?.time }
    },
    total: {
      liang: totalLiang,
      qian: remainQian,
      display: `${totalLiang}两${remainQian}钱`,
      total_qian: totalQian
    },
    fortune: fortune.fortune,
    rating: fortune.rating,
    range_label: fortune.liang,
    source: '袁天罡称骨法 (Yuan Tiangang Bone Weight Method, ~Tang Dynasty ~600 CE)',
    disclaimer: 'Metode ini merupakan tradisi ramalan klasik Tiongkok untuk perspektif budaya. Nasib sesungguhnya dibentuk oleh pilihan, usaha, dan karakter pribadi.'
  };
}

module.exports = { calculateBoneWeight, HOUR_WEIGHT, MONTH_WEIGHT, DAY_WEIGHT };
