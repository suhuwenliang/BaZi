# BaZi & Zi Wei Dou Shu Calculator

Aplikasi web kalkulasi astrologi Tiongkok **四柱八字** dan **紫微斗數** yang berjalan secara lokal. Semua perhitungan dilakukan secara **deterministik** menggunakan library JavaScript terverifikasi — bukan dari LLM atau tebakan.

---

## Fitur

- **Empat Pilar BaZi**: Pillar Tahun/Bulan/Hari/Jam dengan Gan-Zhi, Nayin, Shio
- **Waktu Matahari Sejati (真太陽時)**: Koreksi otomatis berdasarkan bujur menggunakan Spencer (1971) Equation of Time
- **Timezone Historis Indonesia**: WIB/WITA/WIT dengan validasi era JST 1942-1945 dan LMT pra-1932
- **GMT Offset Global**: UTC-12 sampai UTC+14 termasuk zona 30/45 menit (India, Nepal, dll)
- **藏干 Hidden Stems**: Bobot 本気/中気/余気 per Earthly Branch
- **五行 Wu Xing**: Distribusi persentase + identifikasi Yong Shen (用神)
- **十神 Ten Gods**: 10 dewa dari seluruh batang + hidden stems
- **大运 Da Yun**: Siklus 10 tahun dengan evaluasi kualitas vs Yong Shen
- **神煞 Shen Sha**: 7 bintang khusus (天乙贵人, 文昌, 文曲, 驿马, 桃花, 羊刃, 劫煞)
- **袁天罡称骨法**: Metode Berat Tulang klasik Yuan Tiangang
- **紫微斗數**: 12 istana, 14 bintang utama, 四化, Da Xian, Xiao Xian, Liu Nian
- **Analisis Nama**: Etimologi nama Latin + 五格剖象法 nama Mandarin
- **Analisis Menyeluruh**: Profesi, pasangan, tahun beruntung, Yong Shen remedies, warna, Feng Shui
- **Export**: JSON lengkap + prompt siap-pakai untuk Claude AI

---

## Prasyarat

- **Node.js** >= 16.0.0 ([download](https://nodejs.org))
- **npm** >= 7.0

---

## Instalasi & Menjalankan

```bash
# 1. Masuk ke folder aplikasi
cd "BaZi + Zi Wei Dou Shu/bazi-zwds-app"

# 2. Install dependencies
npm install

# 3. Jalankan server
npm start
```

Buka browser ke: **http://localhost:3000**

---

## Menjalankan Regression Test

```bash
cd "BaZi + Zi Wei Dou Shu/bazi-zwds-app"
npm test
```

Test mencakup 4 kasus:
1. **Bruce Lee** (27 Nov 1940, GMT-8) — verifikasi pilar tahun/bulan/hari/jam
2. **Edge case 子时 23:30** dekat 立春 (1 Feb 1984, WIB) — verifikasi aliran 2 dan boundary bulan
3. **Era pendudukan Jepang** (15 Agt 1945, Surabaya) — verifikasi JST historis otomatis
4. **Zi Wei dari dokumentasi iztro** (16 Agt 2000, 丑时) — verifikasi output 12 istana

---

## Struktur Direktori

```
bazi-zwds-app/
├── server.js               # Express server, endpoint API, analisis menyeluruh
├── package.json
├── public/
│   └── index.html          # Single-page application (frontend)
├── utils/
│   ├── timezone.js         # Resolusi timezone historis Indonesia + GMT global
│   ├── solar-time.js       # Koreksi Waktu Matahari Sejati (Spencer 1971)
│   └── validators.js       # Validasi input
├── engines/
│   ├── bazi.js             # Kalkulasi BaZi lengkap (lunar-javascript)
│   ├── zwds.js             # Kalkulasi Zi Wei Dou Shu (iztro)
│   ├── interpretations.js  # Tabel lookup rule-based (Day Master, Ten Gods, dll)
│   ├── bone-weight.js      # 袁天罡称骨法
│   └── name-analysis.js    # Analisis nama Latin & Mandarin (五格)
└── tests/
    └── regression.js       # Regression test 4 kasus
```

---

## API Endpoints

### `POST /api/calculate`
Kalkulasi lengkap. Request body (JSON):

```json
{
  "name": "Jeffry Halim",
  "chineseName": "林俊杰",
  "chineseSurname": "林",
  "gender": "M",
  "birthYear": 1990,
  "birthMonth": 5,
  "birthDay": 15,
  "birthHour": 8,
  "birthMinute": 30,
  "timezone": "WIB",
  "longitude": 106.8456,
  "latitude": -6.2088,
  "midnightSect": 2,
  "dayunSect": 2
}
```

Response: JSON lengkap dengan `bazi`, `zwds`, `nameAnalysis`, `comprehensive`.

### `GET /api/timezones`
Daftar semua UTC offset untuk dropdown.

### `GET /api/health`
Status server dan versi library.

---

## Opsi Aliran (Sekolah)

### Aliran 子时 (Midnight Sect)
| Aliran | Perilaku |
|--------|----------|
| **2** (Default) | 子时 (23:00-01:00) tetap di hari yang sama. **Rekomendasi.** |
| 1 | 子时 awal (23:00-00:00) dihitung sebagai hari sebelumnya |

### Aliran 大运 (Da Yun Sect)
| Aliran | Perilaku |
|--------|----------|
| **2** (Default) | Presisi tinggi: 4320 menit = 1 tahun. **Rekomendasi.** |
| 1 | Setiap periode tepat 10 tahun |

---

## Sumber & Referensi

| Komponen | Sumber |
|----------|--------|
| BaZi (四柱八字) | [lunar-javascript](https://github.com/6tail/lunar-javascript) oleh 6tail |
| Zi Wei Dou Shu | [iztro](https://github.com/SylarLong/iztro) oleh SylarLong |
| Equation of Time | Spencer, J.W. (1971). Fourier series representation of the position of the sun. *Search*, 2(5), 172 |
| Timezone Indonesia | Keppres No. 41/1987 (WIB/WITA/WIT), Peraturan Pemerintah 1963 |
| Hidden Stems (藏干) | Sumber klasik BaZi, diverifikasi dari beberapa referensi |
| Yuan Tiangang (袁天罡) | 袁天罡称骨法, ~600 CE era Tang Dynasty |
| Ten Gods (十神) | Tabel klasik Day Master vs Target Stem |
| Kua Number (卦命数) | Feng Shui Ba Zhai (八宅) |
| 五格剖象法 | Analisis numerologi nama Mandarin klasik |
| Liu Nian 四化 | Tabel klasik 甲-癸 年四化 |

---

## Catatan Penting

1. **Kalkulasi Deterministik**: Semua output berasal dari library & tabel lookup, bukan dari LLM.
2. **Interpretasi AI**: Gunakan tombol "Salin Prompt Claude" untuk mendapat narasi mendalam dari Claude AI secara terpisah.
3. **袁天罡称骨法** adalah referensi klasik — gunakan sebagai panduan, bukan determinan tunggal.
4. **Timezone historis**: Untuk kelahiran di Indonesia sebelum 1932, otomatis menggunakan Local Mean Time. Era 1942-1945 menggunakan JST (UTC+9).
5. **Waktu Matahari Sejati**: Sangat dianjurkan mengisi longitude untuk akurasi jam 时辰 yang lebih tepat.

---

## Lisensi

Untuk penggunaan pribadi dan edukasi.
