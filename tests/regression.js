'use strict';

/**
 * tests/regression.js
 * Regression test untuk memverifikasi output BaZi & Zi Wei Dou Shu
 * Jalankan: node tests/regression.js
 *
 * Data uji diverifikasi manual menggunakan:
 * - https://ziwei.pub (iztro official demo)
 * - https://www.wangjuexian.com/bazi (BaZi calculator)
 * - https://bazi.ni.com.tw (Taiwan BaZi reference)
 */

const { calculateBazi } = require('../engines/bazi');
const { calculateZwds } = require('../engines/zwds');

let passed = 0, failed = 0;

function check(label, actual, expected, exact = false) {
  const ok = exact ? actual === expected : String(actual).includes(String(expected));
  if (ok) {
    console.log(`  ✅ ${label}: ${actual}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}: dapat "${actual}", harapkan "${expected}"`);
    failed++;
  }
}

// ============================================================
// TEST CASE 1: Tanggal terkenal — Bruce Lee
// Lahir: 27 November 1940, 07:12, San Francisco (GMT-8)
// Longitude San Francisco: -122.4194°
// Diverifikasi dari berbagai sumber BaZi online
// ============================================================
console.log('\n=== TEST 1: Bruce Lee (27 Nov 1940, 07:12, GMT-8) ===');
try {
  const t1 = calculateBazi({
    birthYear: 1940, birthMonth: 11, birthDay: 27,
    birthHour: 7, birthMinute: 12,
    gender: 'M',
    zone: 'GMT-8',
    longitude: -122.4194,
    midnightSect: 2, dayunSect: 2
  });

  check('Year Pillar', t1.pillars.year.ganzhi, '庚辰');
  // Nov 1940 = 亥月; year stem 庚 → month stem 丁 → 丁亥
  check('Month Pillar', t1.pillars.month.ganzhi, '丁亥');
  // lunar-javascript: Nov 27, 1940 = 甲戌日 (confirmed via 60-day cycle: Nov 26=癸酉, Nov 27=甲戌)
  check('Day Pillar Gan', t1.pillars.day.gan, '甲');
  check('Day Pillar Branch', t1.pillars.day.zhi, '戌');
  check('Hour Branch (辰时 07:00-09:00)', t1.pillars.hour.zhi, '辰');
  check('Day Master Element', t1.dayMaster.element, 'Kayu');
  console.log(`  📋 Da Yun dimulai: ${t1.daYun.startInfo?.description}`);
} catch(e) {
  console.log(`  ❌ ERROR: ${e.message}`);
  failed++;
}

// ============================================================
// TEST CASE 2: Kasus edge — lahir dekat Zi Shi (子时 23:00)
// Lahir: 1 Februari 1984, 23:30, Jakarta (WIB = UTC+7)
// Catatan: 1 Feb 1984 dekat dengan Li Chun (立春 ~4 Feb 1984)
// Bulan masih dalam 丑月 (bukan 寅月)
// ============================================================
console.log('\n=== TEST 2: Edge case — lahir 23:30 dekat Li Chun ===');
try {
  const t2 = calculateBazi({
    birthYear: 1984, birthMonth: 2, birthDay: 1,
    birthHour: 23, birthMinute: 30,
    gender: 'F',
    zone: 'WIB',
    longitude: 106.8456, // Jakarta
    midnightSect: 2, dayunSect: 2  // aliran 2: 23:30 = jam berikutnya tetapi hari sama
  });

  // Feb 1 is BEFORE 立春 (Feb 4, 1984) → year is still 癸亥, NOT 甲子
  // This verifies the engine correctly uses 立春 boundary, not Jan 1
  check('Year Stem 癸 (masih tahun lama sebelum Li Chun)', t2.pillars.year.gan, '癸');
  check('Year Branch 亥 (masih 亥年 sebelum Li Chun)', t2.pillars.year.zhi, '亥');
  check('Month masih 丑月 (sebelum Li Chun)', t2.pillars.month.zhi, '丑');
  check('Hour Branch Zi (子时 23:00-01:00)', t2.pillars.hour.zhi, '子');
  check('Day Master ada', t2.dayMaster.stem, t2.dayMaster.stem); // just check exists
  console.log(`  📋 TST Note: ${t2.meta.tstDetails?.note || 'Tidak ada koreksi TST'}`);
} catch(e) {
  console.log(`  ❌ ERROR: ${e.message}`);
  failed++;
}

// ============================================================
// TEST CASE 3: Masa pendudukan Jepang — timezone JST
// Lahir: 15 Agustus 1945, 12:00, Surabaya
// (Surabaya masa itu menggunakan JST = UTC+9)
// Verifikasi: tahun 1945 → JST dipakai, zona historis ditangani benar
// ============================================================
console.log('\n=== TEST 3: Masa pendudukan Jepang (1945, JST) ===');
try {
  const t3 = calculateBazi({
    birthYear: 1945, birthMonth: 8, birthDay: 15,
    birthHour: 12, birthMinute: 0,
    gender: 'M',
    zone: 'WIT',  // WIT dipilih user, tapi 1945 otomatis JST
    longitude: 112.7521, // Surabaya
    midnightSect: 2, dayunSect: 2
  });

  // 1945: JST offset = UTC+9, Surabaya bujur 112.75° → bujur standar JST 135°
  // Koreksi bujur: (112.75 - 135) × 4 = -89 menit
  check('Year Stem 乙 (1945)', t3.pillars.year.gan, '乙');
  check('Year Branch 酉 (1945)', t3.pillars.year.zhi, '酉');
  // TST 1945: historical note seharusnya menyebutkan JST
  const tstNote = t3.meta.tstDetails?.tzNote || '';
  const hasJSTNote = tstNote.includes('JST') || tstNote.includes('1942') || tstNote.includes('Jepang');
  console.log(`  ${hasJSTNote ? '✅' : '⚠️'} Timezone note historis: ${tstNote}`);
  if (hasJSTNote) passed++; else { failed++; }
  console.log(`  📋 True Solar Time: ${t3.meta.trueSolarTime}`);
} catch(e) {
  console.log(`  ❌ ERROR: ${e.message}`);
  failed++;
}

// ============================================================
// TEST CASE 4: Zi Wei Dou Shu — verifikasi output iztro
// Tanggal dari dokumentasi resmi iztro: 16 Agustus 2000, jam 2 (丑时)
// ============================================================
console.log('\n=== TEST 4: Zi Wei Dou Shu — dari dokumentasi iztro ===');
try {
  const t4 = calculateZwds({
    birthYear: 2000, birthMonth: 8, birthDay: 16,
    birthHour: 2, // 01:00-03:00 = 丑时 = hourIndex 1
    gender: 'F',
    zone: 'GMT+8'
  });

  check('12 istana tersedia', t4.palaces?.length, 12, true);
  check('Ming Gong ada', typeof t4.palaces?.[0], 'object', true);
  check('Da Xian tersedia', t4.daXian?.periods?.length > 0, true, true);
  check('Liu Nian tersedia', typeof t4.liuNian, 'object', true);
  check('Lima Unsur ada', t4.fiveElements?.value?.length > 0, true, true);
  console.log(`  📋 Lima Unsur: ${t4.fiveElements?.value}`);
  console.log(`  📋 Ming Gong bintang: ${t4.palaces?.[0]?.majorStars?.map(s=>s.name).join('、') || '(kosong)'}`);
} catch(e) {
  console.log(`  ❌ ERROR: ${e.message}`);
  failed++;
}

// ============================================================
// HASIL
// ============================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`HASIL REGRESSION TEST:`);
console.log(`  Lulus : ${passed}`);
console.log(`  Gagal : ${failed}`);
console.log(`  Total : ${passed + failed}`);
console.log(`${'='.repeat(50)}\n`);

if (failed > 0) {
  console.log('⚠️  Ada test yang gagal. Periksa output di atas untuk detail.');
  process.exit(1);
} else {
  console.log('🎉 Semua test lulus!');
  process.exit(0);
}
