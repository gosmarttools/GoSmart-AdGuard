# GoSmart AdGuard - Sistem Modular Mandiri (Self-Hosted) Full Script & Anti-Bypass Verification

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B%20%2F%2020%2B-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)]()
[![Security](https://img.shields.io/badge/Anti--Bypass-Single--Use%20Hash%20(10s)-orange.svg)]()

> **Hak Cipta © 2026 TUANBAGUES & GoSmart Teknologi Creative. Semua Hak Dilindungi.**  
> Pengembang: **Tuanbagues** ([tuanbagues@gmail.com](mailto:tuanbagues@gmail.com)) | Portofolio: [tuanbagues.netlify.app](https://tuanbagues.netlify.app/)

Sistem modular mandiri (*self-hosted*) penampil iklan, injeksi tautan keluar (*full script automatic link wrapper* seperti Linkvertise), dan verifikasi **Anti-Bypass** tingkat tinggi dengan token publisher 64 karakter serta *single-use cryptographical hash* berdurasi 10 detik.

---

## 📑 Daftar Isi
1. [Arsitektur & Prinsip Kerja](#1-arsitektur--prinsip-kerja)
2. [Fitur Utama](#2-fitur-utama)
3. [Alur Verifikasi Anti-Bypass (User Flow)](#3-alur-verifikasi-anti-bypass-user-flow)
4. [Langkah Instalasi & Menjalankan](#4-langkah-instalasi--menjalankan)
5. [Panduan Integrasi Publisher (Frontend Script)](#5-panduan-integrasi-publisher-frontend-script)
6. [Spesifikasi API Backend](#6-spesifikasi-api-backend)
7. [Contoh Validasi di Server Publisher (PHP & Node.js)](#7-contoh-validasi-di-server-publisher-php--nodejs)
8. [Modul Kontrol Iklan & Safe Pop-Under](#8-modul-kontrol-iklan--safe-pop-under)
9. [Keamanan & Pencegahan Bypass](#9-keamanan--pencegahan-bypass)
10. [Lisensi](#10-lisensi)

---

## 1. Arsitektur & Prinsip Kerja

Sistem dirancang dalam 3 komponen modular yang independen:

```
[ Pengunjung ]
      │ (1) Klik link eksternal di situs publisher
      ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend Injected Script (fullscript.js)                 │
│    - Memindai DOM (DOMContentLoaded + MutationObserver)     │
│    - Evaluasi Whitelist & Blacklist                         │
│    - Membungkus link: https://adserver/redirect?url=TARGET  │
└──────────────────────────────┬──────────────────────────────┘
                               │ (2) Pengalihan ke Gateway Iklan
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Ad Server & Gateway Pengalihan (server.js / API)         │
│    - Menampilkan interstitial ad (Simulasi 3 detik)         │
│    - Generate 64-karakter kriptografis acak (?hash=xyz...)   │
│    - Simpan hash ke memori/Redis dengan TTL = 10 detik      │
│    - Mengalihkan ke: TARGET_URL?hash=64_CHAR_HEX            │
└──────────────────────────────┬──────────────────────────────┘
                               │ (3) Redirect kembali ke tujuan
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Target / Publisher Backend (Anti-Bypass Engine)          │
│    - Menangkap parameter ?hash dari URL                     │
│    - Request POST ke: /api/v1/anti_bypassing                │
│      Body/Query: ?token=64_CHAR_TOKEN&hash=64_CHAR_HASH    │
│    - Respon: {"response": true} atau {"response": false}    │
│    - Server Verifikasi menghapus hash seketika (Single-Use) │
│    - Konten hanya dibuka jika verifikasi = TRUE             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Fitur Utama

- **Monetisasi Tautan Otomatis**: Semua tautan keluar dibungkus otomatis tanpa modifikasi manual pada setiap postingan atau artikel.
- **Whitelist & Blacklist Granular**: Filter domain spesifik yang dikecualikan (misal domain internal, jejaring sosial) atau domain khusus yang dimonetisasi.
- **Dukungan Dynamic DOM (MutationObserver)**: Mendeteksi tautan yang dimuat belakangan via AJAX, React SPA, Vue, maupun infinite scroll.
- **Single-Use Verification Policy**: Hash langsung dibakar/dihapus (*burned*) setelah validasi pertama berhasil. Tautan tidak dapat dibagikan atau digunakan ulang.
- **10-Second Strict Expiration Window**: Masa aktif hash hanya 10 detik. Jika melewati batas waktu, verifikasi otomatis mengembalikan `{"response": false}`.
- **Pengamanan User Gesture**: Modul kontrol iklan (`ad-controller.js`) mematuhi kebijakan popup blocker peramban modern (Chrome, Firefox, Safari) dan menyertakan *frequency capping*.

---

## 3. Alur Verifikasi Anti-Bypass (User Flow)

1. **Pengunjung Menemukan Tautan**: Pengunjung membuka artikel di situs publisher yang berisi tautan unduhan `https://drive.google.com/file/d/123`.
2. **Injeksi Transparan**: Skrip otomatis membungkus tautan menjadi:  
   `https://ad-server.com/redirect?url=https%3A%2F%2Fdrive.google.com%2Ffile%2Fd%2F123&token=12cfd687...`
3. **Penayangan Iklan**: Pengunjung melewati halaman jeda iklan.
4. **Penyisipan Hash Unik**: Gateway menghasilkan hash acak 64 karakter (contoh: `d3b07384d113edec49eaa6238ad5ff00b9876f2...`) dan mengarahkan ke:  
   `https://drive.google.com/file/d/123?hash=d3b07384d113...`
5. **Validasi Server-ke-Server**: Backend publisher memeriksa nilai `hash` dengan mengirimkan panggilan POST ke `/api/v1/anti_bypassing`.
6. **Eksekusi Akses**:
   - Jika `{"response": true}`: Pengunjung diberikan akses mengunduh file.
   - Jika `{"response": false}`: Akses ditolak, diarahkan ulang ke langkah awal.

---

## 4. Langkah Instalasi & Menjalankan

### Opsi A: Menggunakan Next.js Applet (Terintegrasi)
Proyek ini sudah dilengkapi antarmuka visual interaktif berbasis Next.js 15:
```bash
# Menjalankan development server
npm run dev

# Membangun aplikasi produksi
npm run build
npm run start
```
Akses UI di: `http://localhost:3000`

### Opsi B: Menggunakan Standalone Express Server (`server.js`)
Jika ingin menjalankan backend mandiri pada server Linux/VPS terpisah:
```bash
# Inisialisasi dependensi
npm install express

# Jalankan server
node server.js
```

Variabel Lingkungan (Opsional):
```env
PORT=3000
NODE_ENV=production
```

---

## 5. Panduan Integrasi Publisher (Frontend Script)

Tempelkan skrip berikut di antara tag `<head> ... </head>` pada situs web publisher:

```html
<!-- GoSmart AdGuard FullScript Injection -->
<script>
  window.FullScriptConfig = {
    adServerUrl: "https://your-ad-server.com/api/redirect",
    publisherToken: "12cfd687bc39171533f0eb5b0d9bbf708412cb62502693cb8b15ca39d81777c9",
    // Biarkan whitelist kosong [] untuk memonetisasi semua tautan keluar
    whitelist: [],
    // Domain yang tidak akan dibungkus
    blacklist: [
      window.location.hostname,
      "google.com",
      "facebook.com",
      "twitter.com",
      "internal-cdn.com"
    ],
    openNewTab: true,
    debug: false
  };
</script>
<script src="https://your-ad-server.com/fullscript.js" async defer></script>
```

---

## 6. Spesifikasi API Backend

### 1. Endpoint Redirect Iklan
- **Metode**: `GET`
- **URL**: `/api/redirect` atau `/redirect`
- **Parameter Query**:
  - `url` *(wajib)*: URL tujuan akhir yang di-encode URI.
  - `token` *(opsional)*: Token publisher (64 karakter hex).
  - `direct` *(opsional)*: `true` untuk langsung redirect 307 tanpa halaman interstitial jeda.
- **Respon**: Mengalihkan pengunjung ke `TARGET_URL?hash=64_CHAR_HEX`

---

### 2. Endpoint Verifikasi Anti-Bypass
- **Metode**: `POST` (Mendukung juga `GET` untuk pengujian)
- **URL**: `/api/v1/anti_bypassing`
- **Parameter**:
  - `token` *(64 karakter hex string)*
  - `hash` *(64 karakter hex string)*

#### Contoh Request cURL:
```bash
curl -X POST "https://your-ad-server.com/api/v1/anti_bypassing?token=12cfd687bc39171533f0eb5b0d9bbf708412cb62502693cb8b15ca39d81777c9&hash=d3b07384d113edec49eaa6238ad5ff00b9876f2...e3b0c44298fc1c149afbf4c8996fb924"
```

#### Kemungkinan Respon:
1. **Verifikasi Sukses (Single-Use Hash Valid & Dibakar)**:
   ```json
   {
     "response": true
   }
   ```
2. **Hash Kedaluwarsa (>10 detik), Sudah Pernah Dipakai, atau Palsu**:
   ```json
   {
     "response": false
   }
   ```
3. **Token Salah atau Tidak Sah**:
   ```json
   {
     "response": "Invalid token."
   }
   ```

---

## 7. Contoh Validasi di Server Publisher (PHP & Node.js)

### Implementasi di PHP:
```php
<?php
// protect.php - Dijalankan pada halaman konten terlindungi publisher

$publisherToken = "12cfd687bc39171533f0eb5b0d9bbf708412cb62502693cb8b15ca39d81777c9";
$adServerApi    = "https://your-ad-server.com/api/v1/anti_bypassing";

$userHash = isset($_GET['hash']) ? trim($_GET['hash']) : '';

if (empty($userHash) || strlen($userHash) !== 64) {
    http_response_code(403);
    die("Akses ditolak: Parameter verifikasi tidak valid.");
}

// Request validasi ke API Anti-Bypass
$verifyUrl = $adServerApi . "?token=" . urlencode($publisherToken) . "&hash=" . urlencode($userHash);

$ch = curl_init($verifyUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$result = curl_exec($ch);
curl_close($ch);

$json = json_decode($result, true);

if (isset($json['response']) && $json['response'] === true) {
    // SUKSES: Pengguna sah telah melewati iklan
    echo "<h1>Selamat datang! Akses unduhan Anda telah diverifikasi.</h1>";
    // Tampilkan tautan atau kirim file
} else {
    // GAGAL: Terdeteksi bypass, hash kedaluwarsa, atau sudah dipakai
    http_response_code(403);
    die("Akses ditolak: Verifikasi gagal atau masa berlaku 10 detik telah habis.");
}
?>
```

### Implementasi di Node.js (Express):
```javascript
// middleware/antiBypass.js
const axios = require('axios');

const PUBLISHER_TOKEN = "12cfd687bc39171533f0eb5b0d9bbf708412cb62502693cb8b15ca39d81777c9";
const API_URL = "https://your-ad-server.com/api/v1/anti_bypassing";

async function verifyBypass(req, res, next) {
  const hash = req.query.hash;

  if (!hash || hash.length !== 64) {
    return res.status(403).send("Akses Ditolak: Hash verifikasi diperlukan.");
  }

  try {
    const response = await axios.post(`${API_URL}?token=${PUBLISHER_TOKEN}&hash=${hash}`);
    if (response.data && response.data.response === true) {
      return next(); // Lanjutkan ke handler konten
    }
    return res.status(403).send("Akses Ditolak: Hash tidak valid atau telah kedaluwarsa.");
  } catch (err) {
    return res.status(500).send("Gagal menghubungi server verifikasi.");
  }
}

module.exports = verifyBypass;
```

---

## 8. Modul Kontrol Iklan & Safe Pop-Under

File `public/ad-controller.js` menangani pembukaan jendela baru sesuai regulasi peramban modern:

```javascript
// Memanggil AdController di sisi publisher
var adManager = new GoSmartAdController({
  adUrl: 'https://your-ad-server.com/api/redirect?direct=true&url=TARGET',
  frequencyMinutes: 15, // Capping 1 kali per 15 menit
  triggerSelector: 'a, button, .download-btn',
  excludeSelector: 'nav a, .no-ad'
});

// Pasang event listener berbasis user gesture yang aman
adManager.init();
```

---

## 9. Keamanan & Pencegahan Bypass

1. **Single-Use Enforcement**: Segera setelah pengecekan pertama berhasil, entri hash langsung dihapus dari memori penyimpanan (`hashStorage.delete(hash)`). Percobaan kedua dengan hash yang sama pasti menghasilkan `{"response": false}`.
2. **Jendela Waktu Ketat (Strict 10s Window)**: Waktu 10 detik cukup bagi peramban pengguna untuk melakukan redirect balik dan bagi server tujuan untuk memanggil API verifikasi, namun terlalu sempit bagi peretas atau bot untuk mencuri dan mendistribusikan hash.
3. **Cryptographically Secure Randomness**: Menggunakan modul `crypto.randomBytes(32)` yang setara dengan entropy 256-bit, membuat prediksi hash mustahil dilakukan (*brute-force proof*).
4. **Dukungan Redis untuk High-Availability**: Untuk arsitektur multi-container atau multi-region, gantikan `Map()` memori dengan Redis menggunakan perintah `SET hash value EX 10` dan validasi menggunakan `DEL hash` secara atomik via Lua script.

---

## 10. Lisensi

Perangkat lunak ini didistribusikan di bawah ketentuan lisensi kepemilikan eksklusif:

**PERJANJIAN LISENSI PERANGKAT LUNAK PROPRIETARI**  
**HAK CIPTA © 2026 TUANBAGUES & GOSMART TEKNOLOGI CREATIVE. SEMUA HAK DILINDUNGI UNDANG-UNDANG.**  
Lihat berkas [LICENSE](LICENSE) untuk klausul dan ketentuan hukum lengkap.


NB 
Telah berhasil dibangun dan diuji sistem modular mandiri (Dihosting Sendiri) penampil iklan, injeksi tautan otomatis (Naskah Lengkapseperti Linkvertise), serta sistem verifikasiAnti-Bypassberkeamanan tinggi dengan hash sekali pakai (10 detik) dan token 64 karakter.
1. Arsitektur dan Komponen Sistem
Sistem ini dirancang secara modular ke dalam 3 komponen independen:
code
Kode
[ Pengunjung ]
      │ (1) Klik link eksternal di situs publisher
      ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend Injected Script (public/fullscript.js)          │
│    - Memindai DOM (DOMContentLoaded + MutationObserver)     │
│    - Evaluasi Whitelist & Blacklist domain                   │
│    - Membungkus link: https://adserver/redirect?url=TARGET  │
└──────────────────────────────┬──────────────────────────────┘
                               │ (2) Pengalihan ke Gateway Iklan
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Ad Server & Gateway Pengalihan (server.js / API)         │
│    - Menampilkan interstitial ad (Simulasi 3 detik)         │
│    - Generate 64-karakter hash kriptografis (?hash=xyz...)  │
│    - Simpan hash ke memori/Redis dengan TTL = 10 detik      │
│    - Mengalihkan ke: TARGET_URL?hash=64_CHAR_HEX            │
└──────────────────────────────┬──────────────────────────────┘
                               │ (3) Redirect kembali ke tujuan
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Target / Publisher Backend (Anti-Bypass Engine)          │
│    - Menangkap parameter ?hash dari URL                     │
│    - Request POST ke: /api/v1/anti_bypassing                │
│      Query/Body: ?token=64_CHAR_TOKEN&hash=64_CHAR_HASH    │
│    - Respon: {"response": true} atau {"response": false}    │
│    - Server Verifikasi menghapus hash seketika (Single-Use) │
│    - Konten hanya dibuka jika verifikasi = TRUE             │
└─────────────────────────────────────────────────────────────┘
2. Draf Kode Modular
A. Komponen 1: Injeksi Skrip Frontend (public/fullscript.js)
Diletakkan di dalam tag<head>situs penerbit untuk membungkus tautan keluar secara otomatis dengan dukungan Dynamic DOM (Pengamat Mutasi), filter Daftar Putih, dan Daftar Hitam:
code
HTML
<!-- Masukkan di dalam tag <head> website publisher -->
<script>
  window.FullScriptConfig = {
    adServerUrl: "https://your-ad-server.com/api/redirect",
    publisherToken: "12cfd687bc39171533f0eb5b0d9bbf708412cb62502693cb8b15ca39d81777c9",
    whitelist: ["trusted-download.com"], // Kosongkan [] jika semua link eksternal ingin dimonetisasi
    blacklist: ["facebook.com", "twitter.com", "internal.com"],
    openNewTab: true,
    debug: false
  };
</script>
<script src="https://your-ad-server.com/fullscript.js" async defer></script>
B. Komponen 2: Server Backend & Validasi Anti-Bypass (server.js)
Tetapkan endpoint untuk mengaktifkan iklan dan verifikasiPOST /api/v1/anti_bypassing:
code
JavaScript
// server.js - Node.js & Express
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Penyimpanan hash dalam memori (Dalam skala besar gunakan Redis)
const hashStorage = new Map();

// Token publisher sah (64 Karakter Hex)
const AUTHORIZED_TOKENS = new Set([
  "12cfd687bc39171533f0eb5b0d9bbf708412cb62502693cb8b15ca39d81777c9"
]);

const HASH_TTL_MS = 10000; // 10 Detik

/**
 * 1. Endpoint Redirect Iklan
 */
app.get('/redirect', (req, res) => {
  const targetUrl = req.query.url || req.query.target;
  const token = req.query.token || Array.from(AUTHORIZED_TOKENS)[0];

  if (!targetUrl) return res.status(400).send("Target URL wajib diisi.");

  // Generate 64-karakter hash kriptografis unik
  const generatedHash = crypto.randomBytes(32).toString('hex');
  const now = Date.now();

  hashStorage.set(generatedHash, {
    target: targetUrl,
    token: token,
    expiresAt: now + HASH_TTL_MS
  });

  // Hapus dari memori setelah batas waktu
  setTimeout(() => hashStorage.delete(generatedHash), HASH_TTL_MS + 2000);

  const separator = targetUrl.includes('?') ? '&' : '?';
  const finalUrl = `${targetUrl}${separator}hash=${generatedHash}`;

  // Tampilkan jeda iklan (3 detik) sebelum redirect
  res.send(`
    <html>
      <head><title>Memverifikasi Iklan...</title></head>
      <body style="text-align:center; padding-top:60px; font-family:sans-serif; background:#0f172a; color:#f8fafc;">
        <h2>Menyiapkan Pengalihan Aman...</h2>
        <p>Harap tunggu 3 detik selagi sistem memverifikasi sesi penayangan.</p>
        <script>
          setTimeout(function() {
            window.location.href = "${finalUrl}";
          }, 3000);
        </script>
      </body>
    </html>
  `);
});

/**
 * 2. Endpoint Verifikasi Anti-Bypass (POST /api/v1/anti_bypassing)
 */
app.post('/api/v1/anti_bypassing', (req, res) => {
  const token = req.query.token || req.body.token;
  const hash = req.query.hash || req.body.hash;

  // 1. Validasi panjang token dan hash (64 karakter)
  if (!token || token.length !== 64 || !hash || hash.length !== 64) {
    return res.json({ response: "Invalid token." });
  }

  // 2. Validasi token publisher
  if (!AUTHORIZED_TOKENS.has(token)) {
    return res.json({ response: "Invalid token." });
  }

  // 3. Periksa keberadaan hash
  const record = hashStorage.get(hash);
  if (!record || Date.now() > record.expiresAt) {
    if (record) hashStorage.delete(hash);
    return res.json({ response: false }); // Kedaluwarsa atau palsu
  }

  // 4. Kebijakan Single-Use: Langsung bakar/hapus hash setelah verifikasi pertama
  hashStorage.delete(hash);

  return res.json({ response: true });
});

app.listen(3000, () => console.log("Ad Server berjalan di port 3000"));
C. Komponen 3: Modul Kontrol Iklan & Safe Pop-Under (public/ad-controller.js)
Mematuhi regulasi browser modern (Kebijakan Gerakan Pengguna) agar pembukaan pop-under/tab baru tidak diblokir oleh browser:
code
JavaScript
// ad-controller.js
const adController = new GoSmartAdController({
  adUrl: "https://your-ad-server.com/api/redirect?direct=true&url=" + encodeURIComponent("https://example.com/ad-slot"),
  frequencyMinutes: 15, // Capping frekuensi 1x per 15 menit per user
  triggerSelector: "a, button",
  excludeSelector: ".no-ad-trigger, nav a"
});
adController.init(); // Pasang event listener klik aman
3. Contoh Verifikasi di Sisi Server Publisher (PHP)
Pada halaman konten tujuan milik penerbit (misalunduh.php), proteksi tautan dengan kode berikut:
code
PHP
<?php
$publisherToken = "12cfd687bc39171533f0eb5b0d9bbf708412cb62502693cb8b15ca39d81777c9";
$adServerApi    = "https://your-ad-server.com/api/v1/anti_bypassing";
$userHash       = isset($_GET['hash']) ? trim($_GET['hash']) : '';

if (empty($userHash) || strlen($userHash) !== 64) {
    http_response_code(403);
    die("Akses Ditolak: Parameter hash tidak valid.");
}

$verifyUrl = $adServerApi . "?token=" . urlencode($publisherToken) . "&hash=" . urlencode($userHash);

$ch = curl_init($verifyUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if (isset($data['response']) && $data['response'] === true) {
    // SUKSES: Pengguna telah melewati iklan secara sah
    echo "<h1>Akses Terverifikasi! File unduhan siap.</h1>";
} else {
    // GAGAL: Terdeteksi bypass, hash kedaluwarsa, atau sudah dipakai
    http_response_code(403);
    die("Akses Ditolak: Hash tidak sah atau masa berlaku 10 detik telah habis.");
}
?>
4. Ringkasan Pengujian Anti-Bypass melalui cURL
code
Pesta
# Permintaan POST verifikasi:
curl -X POST "http://localhost:3000/api/v1/anti_bypassing?token=12cfd687bc39171533f0eb5b0d9bbf708412cb62502693cb8b15ca39d81777c9&hash=YOUR_64_CHAR_HASH"
Panggilan ke-1 (Valid & < 10 detik):{"respons": benar}(Hash langsung ditolak).
Panggilan ke-2 (Hash yang sama diuji ulang):{"respons": salah}(Kebijakan Sekali Pakai Bukti bekerja sempurna).
Panggilan setelah > 10 detik:{"respons": salah}(Otomatis berg).
Token salah / tidak 64 karakter:{"response": "Token tidak valid."}.
5. Berkas yang Dibuat dalam Proyek
README.md: Dokumentasi lengkap arsitektur, instalasi, dan panduan penerbit.
LISENSI: Perjanjian Lisensi Perangkat Lunak Proprietari resmiTUANBAGUES & GoSmart Teknologi Kreatif (2026).
server.js: Standalone Express Backend siap jalan dengannode server.js.
public/fullscript.js: Skrip injeksi klien produksi denganPengamat Mutasi.
public/ad-controller.js: Modul kontrol popup/pop-under ramah kebijakan browser.
app/api/v1/anti_bypassing/route.ts: Verifikasi API Anti-Bypass asli.
app/api/redirect/route.ts: Iklan Gateway & Generator Hash 10 detik.
aplikasi/halaman.tsx: Dasbor visual interaktif dengan Publisher Sandbox, Ad-Step Gateway Simulator, Live Memory Inspector, dan Snippet Generator.
flag
Pos pemeriksaan

