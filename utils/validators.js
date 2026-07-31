'use strict';

function validateInput(data) {
  const errors = [];

  if (!data.birthYear || !data.birthMonth || !data.birthDay) {
    errors.push('Tanggal lahir tidak lengkap.');
  } else {
    const y = parseInt(data.birthYear), m = parseInt(data.birthMonth), d = parseInt(data.birthDay);
    if (isNaN(y) || y < 1900 || y > 2100) errors.push('Tahun lahir harus antara 1900-2100.');
    if (isNaN(m) || m < 1 || m > 12) errors.push('Bulan lahir tidak valid.');
    if (isNaN(d) || d < 1 || d > 31) errors.push('Hari lahir tidak valid.');
  }

  const h = parseInt(data.birthHour), min = parseInt(data.birthMinute ?? 0);
  if (isNaN(h) || h < 0 || h > 23) errors.push('Jam lahir harus 0-23.');
  if (isNaN(min) || min < 0 || min > 59) errors.push('Menit lahir harus 0-59.');

  if (!data.gender || !['M','F'].includes(String(data.gender).toUpperCase())) {
    errors.push('Gender harus M (Pria) atau F (Wanita).');
  }

  if (data.longitude !== undefined && data.longitude !== null && data.longitude !== '') {
    const lng = parseFloat(data.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) errors.push('Bujur harus antara -180 dan 180.');
  }

  if (data.latitude !== undefined && data.latitude !== null && data.latitude !== '') {
    const lat = parseFloat(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) errors.push('Lintang harus antara -90 dan 90.');
  }

  return errors;
}

module.exports = { validateInput };
