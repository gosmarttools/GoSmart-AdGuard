/**
 * GoSmart AdGuard - Standalone Node.js / Express Ad Server & Anti-Bypass Gateway
 * Hak Cipta (c) 2026 TUANBAGUES & GoSmart Teknologi Creative. Semua Hak Dilindungi.
 *
 * Cara Menjalankan:
 * 1. npm init -y
 * 2. npm install express
 * 3. node server.js
 */

const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Penyimpanan sementara dalam memori (Dalam skala produksi multi-server, gunakan Redis)
// Format key: hash (64 char hex string) -> { target, token, expiresAt, used }
const hashStorage = new Map();

// Daftar token publisher sah (64 karakter hex)
const AUTHORIZED_TOKENS = new Set([
  '12cfd687bc39171533f0eb5b0d9bbf708412cb62502693cb8b15ca39d81777c9',
  'a9f8e4c7b2d13560e9a8f7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6',
]);

const HASH_TTL_MS = 10000; // 10 Detik sesuai standar keamanan Anti-Bypass

/**
 * Endpoint 1: Redirect & Gateway Iklan
 * Menerima request redirect dari tautan yang telah dibungkus oleh Full Script,
 * menyimulasikan jeda penayangan iklan, men-generate hash 64-karakter (10 detik),
 * lalu mengalihkan ke target dengan parameter ?hash=...
 */
app.get('/redirect', (req, res) => {
  const targetUrl = req.query.url || req.query.target;
  const token = req.query.token || Array.from(AUTHORIZED_TOKENS)[0];
  const direct = req.query.direct === 'true';

  if (!targetUrl) {
    return res.status(400).send('Bad Request: Parameter target URL wajib disertakan.');
  }

  // Generate 64-karakter kriptografis acak
  const generatedHash = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + HASH_TTL_MS;

  // Simpan ke storage dengan masa kedaluwarsa 10 detik
  hashStorage.set(generatedHash, {
    target: targetUrl,
    token: token,
    createdAt: now,
    expiresAt: expiresAt,
    used: false,
  });

  // Hapus otomatis dari memori setelah 12 detik untuk mencegah memory leak
  setTimeout(() => {
    hashStorage.delete(generatedHash);
  }, HASH_TTL_MS + 2000);

  const separator = targetUrl.includes('?') ? '&' : '?';
  const finalRedirectUrl = `${targetUrl}${separator}hash=${generatedHash}`;

  if (direct) {
    return res.redirect(finalRedirectUrl);
  }

  // Tampilkan halaman interstitial iklan (Simulasi 3 detik)
  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mempersiapkan Tautan...</title>
  <style>
    body {
      background: #0b0f19;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 1.5rem;
      box-sizing: border-box;
    }
    .box {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 1rem;
      padding: 2rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }
    h2 { margin-bottom: 0.5rem; font-size: 1.25rem; }
    p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.5rem; }
    .ad-slot {
      background: #1e293b;
      border: 1px dashed #334155;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 0.75rem;
      background: #2563eb;
      color: #ffffff;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      box-sizing: border-box;
    }
    .hash-text {
      margin-top: 1rem;
      font-family: monospace;
      font-size: 0.7rem;
      color: #10b981;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="box">
    <div class="badge">GoSmart Anti-Bypass Ad Gateway</div>
    <h2>Menyiapkan Pengalihan Aman</h2>
    <p>Harap tunggu <span id="timer" style="color:#60a5fa; font-weight:bold;">3</span> detik selagi sistem memverifikasi sesi penayangan iklan.</p>
    <div class="ad-slot">
      [ Slot Iklan Mandiri / Banner Partner ]
    </div>
    <a id="btnNext" href="${finalRedirectUrl}" class="btn" style="opacity:0.5; pointer-events:none;">
      Mengalihkan Otomatis...
    </a>
    <div class="hash-text">Hash Token (10s): ${generatedHash}</div>
  </div>
  <script>
    var c = 3;
    var t = setInterval(function() {
      c--;
      if (c > 0) {
        document.getElementById('timer').innerText = c;
      } else {
        clearInterval(t);
        document.getElementById('btnNext').innerText = "Menuju ke Tujuan";
        document.getElementById('btnNext').style.opacity = "1";
        document.getElementById('btnNext').style.pointerEvents = "auto";
        window.location.href = "${finalRedirectUrl}";
      }
    }, 1000);
  </script>
</body>
</html>`);
});

/**
 * Endpoint 2: Verifikasi Anti-Bypass (POST /api/v1/anti_bypassing)
 * Digunakan oleh backend website publisher untuk memeriksa validitas ?hash=...
 * Parameter dapat dikirim via query string (?token=...&hash=...) atau JSON body.
 */
app.post('/api/v1/anti_bypassing', (req, res) => {
  const token = req.query.token || req.body.token;
  const hash = req.query.hash || req.body.hash;

  // 1. Validasi keberadaan & panjang string (64 karakter)
  if (!token || token.length !== 64 || !hash || hash.length !== 64) {
    return res.json({ response: 'Invalid token.' });
  }

  // 2. Validasi keabsahan token publisher
  if (!AUTHORIZED_TOKENS.has(token)) {
    return res.json({ response: 'Invalid token.' });
  }

  // 3. Periksa keberadaan hash di penyimpanan
  const record = hashStorage.get(hash);

  if (!record) {
    return res.json({ response: false }); // Hash tidak ditemukan atau sudah dibersihkan
  }

  // 4. Periksa kedaluwarsa (10 detik)
  const now = Date.now();
  if (now > record.expiresAt) {
    hashStorage.delete(hash);
    return res.json({ response: false }); // Hash telah kedaluwarsa
  }

  // 5. Periksa jika sudah dipakai
  if (record.used) {
    hashStorage.delete(hash);
    return res.json({ response: false }); // Pelanggaran Single-Use
  }

  // 6. Token matching verification
  if (record.token && record.token !== token) {
    return res.json({ response: 'Invalid token.' });
  }

  // 7. Berhasil: Hapus hash seketika (Single-Use Policy)
  hashStorage.delete(hash);

  return res.json({ response: true });
});

// Endpoint GET untuk pengujian langsung via browser
app.get('/api/v1/anti_bypassing', (req, res) => {
  const token = req.query.token;
  const hash = req.query.hash;

  if (!token || token.length !== 64 || !hash || hash.length !== 64) {
    return res.json({ response: 'Invalid token.' });
  }

  if (!AUTHORIZED_TOKENS.has(token)) {
    return res.json({ response: 'Invalid token.' });
  }

  const record = hashStorage.get(hash);
  if (!record || Date.now() > record.expiresAt || record.used) {
    if (record) hashStorage.delete(hash);
    return res.json({ response: false });
  }

  hashStorage.delete(hash);
  return res.json({ response: true });
});

// Status monitor
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    activeHashesCount: hashStorage.size,
    authorizedTokensCount: AUTHORIZED_TOKENS.size,
    ttlSeconds: 10,
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` GoSmart AdGuard - Ad Server & Anti-Bypass Gateway`);
  console.log(` Berjalan pada port: ${PORT}`);
  console.log(` Endpoint Redirect: http://localhost:${PORT}/redirect?url=TARGET`);
  console.log(` Endpoint Anti-Bypass: http://localhost:${PORT}/api/v1/anti_bypassing`);
  console.log(`=======================================================`);
});
