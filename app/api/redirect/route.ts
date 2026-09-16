import { NextRequest, NextResponse } from 'next/server';
import { registerNewHash, getAuthorizedTokens } from '@/lib/hash-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url') || searchParams.get('target');
  const token = searchParams.get('token') || getAuthorizedTokens()[0];
  const direct = searchParams.get('direct') === 'true';

  if (!targetUrl) {
    return new NextResponse('Bad Request: Parameter "url" or "target" is required.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Generate 64-character hash with 10 seconds validity
  const record = registerNewHash(targetUrl, token);
  const separator = targetUrl.includes('?') ? '&' : '?';
  const finalRedirectUrl = `${targetUrl}${separator}hash=${record.hash}`;

  if (direct) {
    return NextResponse.redirect(finalRedirectUrl, 307);
  }

  // Interstitial Ad Display & Safe Window Transition HTML
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Menyiapkan Pengalihan Aman...</title>
  <style>
    :root {
      --bg: #090d16;
      --card: #111827;
      --border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --accent: #3b82f6;
      --accent-glow: rgba(59, 130, 246, 0.25);
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body {
      background: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      max-width: 480px;
      width: 100%;
      padding: 2rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
      margin-bottom: 1.25rem;
    }
    h1 { font-size: 1.35rem; font-weight: 700; margin-bottom: 0.5rem; }
    p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem; }
    .ad-placeholder {
      background: rgba(255, 255, 255, 0.03);
      border: 1px dashed #374151;
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      font-size: 0.825rem;
      color: #94a3b8;
    }
    .progress-track {
      background: #1f2937;
      height: 8px;
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 1rem;
      position: relative;
    }
    .progress-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      transition: width 2.5s linear;
      border-radius: 9999px;
    }
    .countdown-text {
      font-size: 0.85rem;
      font-weight: 600;
      color: #93c5fd;
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 0.85rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      background: var(--accent);
      color: #fff;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .hash-info {
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid #1f2937;
      font-size: 0.75rem;
      color: #6b7280;
      word-break: break-all;
    }
    .hash-value {
      color: #34d399;
      font-family: monospace;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span>●</span> GoSmart Anti-Bypass Gateway
    </div>
    <h1>Memverifikasi & Menyiapkan Tautan</h1>
    <p>Mohon tunggu sebentar selagi sistem memverifikasi sesi penayangan iklan dan menghasilkan token verifikasi yang aman.</p>
    
    <div class="ad-placeholder">
      <div style="font-weight:600; color:#e2e8f0; margin-bottom:0.25rem;">[ Slot Iklan Sponsor Terverifikasi ]</div>
      <div style="font-size:0.75rem;">Simulasi Ad Step (3 Detik) Sesuai Standar IAB & Kebijakan Browser</div>
    </div>

    <div class="progress-track">
      <div class="progress-bar" id="progressBar"></div>
    </div>
    <div class="countdown-text" id="countdownLabel">Mengalihkan dalam 3 detik...</div>

    <a id="redirectBtn" href="${finalRedirectUrl}" class="btn" style="opacity:0.6; pointer-events:none;">
      Lanjutkan ke Tujuan
    </a>

    <div class="hash-info">
      Single-Use Hash (10 detik):<br/>
      <span class="hash-value">${record.hash}</span>
    </div>
  </div>

  <script>
    (function() {
      var progressBar = document.getElementById('progressBar');
      var countdownLabel = document.getElementById('countdownLabel');
      var redirectBtn = document.getElementById('redirectBtn');
      var target = "${finalRedirectUrl}";

      // Trigger animation
      setTimeout(function() {
        progressBar.style.width = '100%';
      }, 50);

      var timeLeft = 3;
      var timer = setInterval(function() {
        timeLeft--;
        if (timeLeft > 0) {
          countdownLabel.textContent = "Mengalihkan dalam " + timeLeft + " detik...";
        } else {
          clearInterval(timer);
          countdownLabel.textContent = "Verifikasi selesai! Mengalihkan...";
          redirectBtn.style.opacity = '1';
          redirectBtn.style.pointerEvents = 'auto';
          // Safe redirection
          window.location.href = target;
        }
      }, 1000);
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
