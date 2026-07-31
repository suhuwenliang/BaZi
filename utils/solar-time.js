'use strict';

/**
 * utils/solar-time.js
 * Koreksi True Solar Time (真太陽時 / Apparent Solar Time)
 *
 * Rumus:
 *   TST = Waktu Lokal + Koreksi Bujur + Equation of Time
 *
 * Koreksi Bujur:
 *   = (bujur_tempat - bujur_standar_TZ) × 4 menit/derajat
 *   Contoh: Jakarta (106.8°E), WIB standar di 105°E
 *   Koreksi = (106.8 - 105) × 4 = +7.2 menit
 *
 * Equation of Time (EoT):
 *   Perbedaan antara solar mean time dan apparent solar time
 *   Berkisar antara -16 hingga +14 menit sepanjang tahun
 *   Dihitung menggunakan aproksimasi Spencer (1971), akurat ±0.5 menit
 *
 * Referensi:
 *   - Spencer, J.W. (1971). Fourier series representation of the position of the sun.
 *   - Astronomical Algorithms, Jean Meeus (1991)
 *   - BaZi klasik: jam pilar dihitung berdasarkan 真太陽時, bukan waktu zona
 */

const { resolveTimezone } = require('./timezone');

/**
 * Hitung Equation of Time (menit) untuk tanggal tertentu
 * Menggunakan aproksimasi Spencer 1971
 * @param {number} year
 * @param {number} month  1-12
 * @param {number} day    1-31
 * @returns {number} EoT dalam menit (bisa negatif)
 */
function equationOfTime(year, month, day) {
  // Day of year
  const N = dayOfYear(year, month, day);
  // Fractional year (radian)
  const daysInYear = isLeapYear(year) ? 366 : 365;
  const gamma = (2 * Math.PI / daysInYear) * (N - 1);

  // Spencer formula
  const eot = 229.18 * (
    0.000075
    + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma)
    - 0.04089  * Math.sin(2 * gamma)
  );
  return eot; // dalam menit
}

/**
 * Konversi waktu lokal ke True Solar Time
 * @param {object} params
 * @param {number} params.year
 * @param {number} params.month
 * @param {number} params.day
 * @param {number} params.hour       jam lokal (0-23)
 * @param {number} params.minute     menit lokal (0-59)
 * @param {string|number} params.zone  zona waktu ('WIB','WITA','WIT','GMT+7', atau offset menit)
 * @param {number} params.longitude  bujur tempat lahir (derajat, positif=Timur)
 * @returns {{ hour, minute, correctionMinutes, eot, longitudeCorr, note }}
 */
function toTrueSolarTime({ year, month, day, hour, minute, zone, longitude }) {
  // Offset TZ dalam menit
  const { offsetMinutes: tzOffset, note: tzNote } = resolveTimezone(zone, year, longitude);

  // Bujur standar zona waktu (setiap 15° = 1 jam = 60 menit offset)
  const standardLongitude = tzOffset / 4; // derajat

  // Koreksi bujur (menit)
  const longitudeCorr = (longitude - standardLongitude) * 4;

  // Equation of Time (menit)
  const eot = equationOfTime(year, month, day);

  // Total koreksi
  const totalCorrectionMinutes = longitudeCorr + eot;

  // Waktu lokal dalam menit dari tengah malam
  let localMinutes = hour * 60 + minute;

  // Tambahkan koreksi
  let tstMinutes = localMinutes + totalCorrectionMinutes;

  // Normalisasi (bisa lintas tengah malam)
  let dayOffset = 0;
  if (tstMinutes < 0) { tstMinutes += 1440; dayOffset = -1; }
  if (tstMinutes >= 1440) { tstMinutes -= 1440; dayOffset = 1; }

  const tstHour = Math.floor(tstMinutes / 60);
  const tstMinute = Math.round(tstMinutes % 60);

  return {
    hour: tstHour,
    minute: tstMinute,
    dayOffset,
    correctionMinutes: Math.round(totalCorrectionMinutes * 10) / 10,
    longitudeCorr: Math.round(longitudeCorr * 10) / 10,
    eot: Math.round(eot * 10) / 10,
    note: `True Solar Time. Koreksi bujur: ${longitudeCorr >= 0 ? '+' : ''}${longitudeCorr.toFixed(1)} menit, EoT: ${eot >= 0 ? '+' : ''}${eot.toFixed(1)} menit. Total: ${totalCorrectionMinutes >= 0 ? '+' : ''}${totalCorrectionMinutes.toFixed(1)} menit dari waktu lokal.`,
    tzNote
  };
}

function dayOfYear(year, month, day) {
  const months = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (isLeapYear(year)) months[2] = 29;
  let n = day;
  for (let m = 1; m < month; m++) n += months[m];
  return n;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

module.exports = { toTrueSolarTime, equationOfTime };
