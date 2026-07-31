'use strict';

/**
 * utils/timezone.js
 * Tabel referensi zona waktu historis Indonesia + konversi GMT offset
 *
 * Sumber historis:
 * - Sebelum 1932: tiap kota pakai Local Mean Time (bujur lokal × 4 menit/derajat)
 * - 1932-01-01: Nederlandsch-Indië standarisasi: Batavia Time (UTC+7:12) utk Jawa
 * - 1942-03-23: Pendudukan Jepang → JST (UTC+9) di seluruh wilayah
 * - 1945-09-23: Pasca kemerdekaan, kembali ke zona waktu kolonial sementara
 * - 1963-05-01: Pemerintah RI tetapkan 3 zona: WIB/WITA/WIT (UTC+7/+8/+9)
 * - 1987-01-01: Keppres No. 41/1987 → WIB=UTC+7, WITA=UTC+8, WIT=UTC+9 (berlaku sampai kini)
 *
 * Referensi: Keppres RI No. 41 Tahun 1987, timeanddate.com historical timezone data
 */

// Batas wilayah zona waktu Indonesia pasca 1963
const INDONESIA_ZONES = {
  WIB: {
    offset: 7 * 60,  // menit dari UTC
    provinces: [
      'Aceh','Sumatera Utara','Sumatera Barat','Riau','Kepulauan Riau',
      'Jambi','Bengkulu','Sumatera Selatan','Bangka Belitung','Lampung',
      'DKI Jakarta','Jawa Barat','Banten','Jawa Tengah','DI Yogyakarta',
      'Jawa Timur','Kalimantan Barat','Kalimantan Tengah'
    ]
  },
  WITA: {
    offset: 8 * 60,
    provinces: [
      'Bali','Nusa Tenggara Barat','Nusa Tenggara Timur',
      'Kalimantan Selatan','Kalimantan Timur','Kalimantan Utara',
      'Sulawesi Selatan','Sulawesi Tengah','Sulawesi Tenggara',
      'Sulawesi Barat','Gorontalo','Sulawesi Utara'
    ]
  },
  WIT: {
    offset: 9 * 60,
    provinces: [
      'Maluku','Maluku Utara','Papua','Papua Barat',
      'Papua Selatan','Papua Tengah','Papua Pegunungan','Papua Barat Daya'
    ]
  }
};

/**
 * Menentukan offset UTC (dalam menit) berdasarkan zona waktu dan tahun lahir
 * Menangani perubahan historis zona waktu Indonesia
 *
 * @param {string} zone  - 'WIB'|'WITA'|'WIT' atau 'GMT+X' format
 * @param {number} year  - tahun lahir (untuk lookup historis)
 * @param {number} longitude - bujur (untuk LMT jika sebelum standarisasi)
 * @returns {{ offsetMinutes: number, note: string }}
 */
function resolveTimezone(zone, year, longitude) {
  // Mode GMT offset langsung (format: 'GMT+7', 'GMT-5', 'UTC+5.5', dll.)
  const gmtMatch = String(zone).match(/^(?:GMT|UTC)([+-])(\d{1,2})(?:[:\.](\d{2}))?$/i);
  if (gmtMatch) {
    const sign = gmtMatch[1] === '+' ? 1 : -1;
    const hours = parseInt(gmtMatch[2], 10);
    const mins = gmtMatch[3] ? parseInt(gmtMatch[3], 10) : 0;
    const offsetMinutes = sign * (hours * 60 + mins);
    return {
      offsetMinutes,
      note: `Zona waktu manual: UTC${gmtMatch[1]}${gmtMatch[2]}${gmtMatch[3] ? ':' + gmtMatch[3] : ''}`
    };
  }

  // Mode offset numerik langsung (menit dari UTC)
  if (typeof zone === 'number') {
    return { offsetMinutes: zone, note: `Offset manual: ${zone} menit dari UTC` };
  }

  const upperZone = String(zone).toUpperCase();

  // Sebelum 1932: Local Mean Time (bujur × 4 menit/derajat)
  if (year < 1932) {
    if (longitude !== undefined && longitude !== null) {
      const lmtOffset = Math.round(longitude * 4); // menit
      return {
        offsetMinutes: lmtOffset,
        note: `Sebelum standarisasi 1932: Local Mean Time. Bujur ${longitude}° → UTC+${(lmtOffset/60).toFixed(2)}`
      };
    }
  }

  // Pendudukan Jepang 1942-03-23 s/d 1945-09-22: JST (UTC+9)
  if (year >= 1942 && year <= 1945) {
    return {
      offsetMinutes: 9 * 60,
      note: 'Masa pendudukan Jepang (1942-1945): JST = UTC+9 diberlakukan di seluruh wilayah'
    };
  }

  // 1932-1942 & 1945-1963: zona transisi, gunakan WIB/WITA/WIT sebagai aproksimasi
  // (standarisasi penuh baru berlaku 1963, tetapi offset dasarnya sama)
  if (INDONESIA_ZONES[upperZone]) {
    const { offset } = INDONESIA_ZONES[upperZone];
    let historicalNote = '';
    if (year < 1963) {
      historicalNote = ` (Catatan: standarisasi resmi 3 zona baru berlaku 1963; offset ini merupakan aproksimasi)`;
    } else if (year < 1987) {
      historicalNote = ` (Catatan: penetapan resmi via Keppres No. 41/1987 berlaku mulai 1987-01-01)`;
    }
    return {
      offsetMinutes: offset,
      note: `${upperZone} = UTC+${offset/60}${historicalNote}`
    };
  }

  // Fallback: WIB
  return {
    offsetMinutes: 7 * 60,
    note: 'Zona waktu tidak dikenali, menggunakan WIB (UTC+7) sebagai default'
  };
}

/**
 * Daftar semua offset GMT yang tersedia untuk dropdown UI
 * Format: { label, value, offsetMinutes }
 */
function getGmtOffsetList() {
  const offsets = [];
  // -12 s/d +14, dengan setengah jam untuk zona khusus
  const specialHalfHours = [-9.5, -3.5, 3.5, 4.5, 5.5, 5.75, 6.5, 9.5, 10.5, 12.75];
  for (let h = -12; h <= 14; h++) {
    const mins = h * 60;
    const sign = h >= 0 ? '+' : '';
    offsets.push({
      label: `UTC${sign}${h}:00`,
      value: `GMT${sign}${h}`,
      offsetMinutes: mins
    });
    if (specialHalfHours.includes(h + 0.5) || specialHalfHours.includes(h + 0.75)) {
      // tambahkan :30 dan :45 untuk zona khusus
      if (h >= -12 && h < 14) {
        offsets.push({
          label: `UTC${sign}${h}:30`,
          value: `GMT${sign}${h}:30`,
          offsetMinutes: mins + 30
        });
      }
    }
  }
  // Tambahkan zona khusus India +5:30, Nepal +5:45
  const extras = [
    { label: 'UTC+5:30 (India)', value: 'GMT+5:30', offsetMinutes: 330 },
    { label: 'UTC+5:45 (Nepal)', value: 'GMT+5:45', offsetMinutes: 345 },
    { label: 'UTC+6:30 (Myanmar)', value: 'GMT+6:30', offsetMinutes: 390 },
    { label: 'UTC+9:30 (Australia Central)', value: 'GMT+9:30', offsetMinutes: 570 },
    { label: 'UTC+12:45 (Chatham Islands)', value: 'GMT+12:45', offsetMinutes: 765 },
  ];
  return { standard: offsets, special: extras, indonesia: ['WIB (UTC+7)', 'WITA (UTC+8)', 'WIT (UTC+9)'] };
}

module.exports = { resolveTimezone, getGmtOffsetList, INDONESIA_ZONES };
