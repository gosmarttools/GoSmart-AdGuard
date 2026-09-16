'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  ShieldCheck,
  Link2,
  Lock,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Code2,
  Server,
  ExternalLink,
  Layers,
  Terminal,
  Zap,
  Sliders,
  FileCode,
} from 'lucide-react';

interface HashItem {
  hash: string;
  targetUrl: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

interface VerifyResultData {
  response?: boolean | string;
  reason?: string;
  latencyMs?: number;
  error?: string;
}

const DEFAULT_TOKEN = '12cfd687bc39171533f0eb5b0d9bbf708412cb62502693cb8b15ca39d81777c9';

export default function HomePage() {
  const customUrlInputId = useId();
  const publisherTokenInputId = useId();
  const hashVerifyInputId = useId();
  const cfgAdServerId = useId();
  const cfgTokenId = useId();
  const cfgWhitelistId = useId();
  const cfgBlacklistId = useId();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'sandbox' | 'gateway' | 'verifier' | 'inspector' | 'code' | 'docs'>('sandbox');

  // Server state
  const [hashes, setHashes] = useState<HashItem[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [loadingHashes, setLoadingHashes] = useState<boolean>(false);
  const [now, setNow] = useState<number>(0);

  // Sandbox state
  const [scriptActive, setScriptActive] = useState<boolean>(true);
  const [customLinks, setCustomLinks] = useState<{ id: string; title: string; url: string; category: string }[]>([
    { id: '1', title: 'File Unduhan ISO (Google Drive)', url: 'https://drive.google.com/file/d/12345/view', category: 'external' },
    { id: '2', title: 'Source Code GitHub v2.1.0', url: 'https://github.com/releases/project-v2.zip', category: 'external' },
    { id: '3', title: 'Paket Theme Mega.nz', url: 'https://mega.nz/file/ABCDEF#xyz123', category: 'external' },
    { id: '4', title: 'Dokumentasi Internal Blog', url: '/blog/panduan-instalasi', category: 'internal' },
    { id: '5', title: 'Halaman Facebook Resmi', url: 'https://facebook.com/gosmarttools', category: 'blacklisted' },
    { id: '6', title: 'Server Unduhan Terpercaya', url: 'https://trusted-download.com/setup.exe', category: 'whitelisted' },
  ]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Verifier tester state
  const [verifyToken, setVerifyToken] = useState(DEFAULT_TOKEN);
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyResultData | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyLatency, setVerifyLatency] = useState<number | null>(null);

  // Gateway Simulator state
  const [gatewayTarget, setGatewayTarget] = useState('https://mega.nz/file/sample-archive.zip');
  const [gatewayProgress, setGatewayProgress] = useState(0);
  const [gatewaySeconds, setGatewaySeconds] = useState(3);
  const [isSimulatingAd, setIsSimulatingAd] = useState(false);
  const [lastGeneratedHash, setLastGeneratedHash] = useState<string | null>(null);

  // Configurator state
  const [configAdServer, setConfigAdServer] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin + '/api/redirect';
    }
    return '/api/redirect';
  });
  const [configToken, setConfigToken] = useState(DEFAULT_TOKEN);
  const [configWhitelist, setConfigWhitelist] = useState('trusted-download.com');
  const [configBlacklist, setConfigBlacklist] = useState('facebook.com, twitter.com, internal.com');
  const [selectedSnippet, setSelectedSnippet] = useState<'html' | 'express' | 'php' | 'adcontroller'>('html');

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Polling for hashes
  const loadHashes = useCallback(async () => {
    try {
      setLoadingHashes(true);
      const res = await fetch('/api/hashes');
      if (res.ok) {
        const data = await res.json();
        setHashes(data.records || []);
        setActiveCount(data.activeCount || 0);
      }
    } catch (e) {
      console.error('Gagal mengambil data hash:', e);
    } finally {
      setLoadingHashes(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    const runFetch = async () => {
      try {
        const res = await fetch('/api/hashes');
        if (res.ok && isSubscribed) {
          const data = await res.json();
          setHashes(data.records || []);
          setActiveCount(data.activeCount || 0);
          setNow(Date.now());
        }
      } catch {
        // silent fail in polling
      }
    };

    runFetch();
    const interval = setInterval(() => {
      runFetch();
    }, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  // Handle ad step simulation
  const startAdSimulation = useCallback(
    (target?: string) => {
      const finalTarget = target || gatewayTarget;
      setGatewayTarget(finalTarget);
      setIsSimulatingAd(true);
      setGatewayProgress(0);
      setGatewaySeconds(3);
      setActiveTab('gateway');

      fetch('/api/hashes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', targetUrl: finalTarget, token: verifyToken }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.record) {
            setLastGeneratedHash(data.record.hash);
            setVerifyHash(data.record.hash);
          }
        })
        .catch(console.error);

      const simStartTime = Date.now();
      const simInterval = setInterval(() => {
        const elapsed = Date.now() - simStartTime;
        const progress = Math.min(100, (elapsed / 3000) * 100);
        const secondsLeft = Math.max(0, Math.ceil((3000 - elapsed) / 1000));
        setGatewayProgress(progress);
        setGatewaySeconds(secondsLeft);

        if (elapsed >= 3000) {
          clearInterval(simInterval);
          setIsSimulatingAd(false);
          loadHashes();
        }
      }, 100);
    },
    [gatewayTarget, verifyToken, loadHashes]
  );

  // Run anti-bypass verification
  const executeVerification = useCallback(async () => {
    setVerifyLoading(true);
    setVerifyResult(null);
    const start = performance.now();

    try {
      const res = await fetch(
        `/api/v1/anti_bypassing?token=${encodeURIComponent(verifyToken)}&hash=${encodeURIComponent(verifyHash)}`,
        { method: 'POST' }
      );
      const data = await res.json();
      setVerifyLatency(Math.round(performance.now() - start));
      setVerifyResult(data);
      loadHashes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi server';
      setVerifyResult({ error: msg });
    } finally {
      setVerifyLoading(false);
    }
  }, [verifyToken, verifyHash, loadHashes]);

  // Check link status in sandbox
  const evaluateSandboxLink = useCallback(
    (url: string) => {
      if (!url || url.startsWith('/') || url.startsWith('#')) {
        return { status: 'internal', label: 'Internal (Dilewati)', wrappedUrl: null };
      }
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        const blacklistList = configBlacklist.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
        const whitelistList = configWhitelist.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

        for (const b of blacklistList) {
          if (host === b || host.endsWith('.' + b)) {
            return { status: 'blacklisted', label: 'Blacklist (Dilewati)', wrappedUrl: null };
          }
        }

        if (whitelistList.length > 0) {
          const isWhitelisted = whitelistList.some((w) => host === w || host.endsWith('.' + w));
          if (!isWhitelisted) {
            return { status: 'not-whitelisted', label: 'Bukan Whitelist (Dilewati)', wrappedUrl: null };
          }
        }

        const serverUrl = configAdServer || '/api/redirect';
        const separator = serverUrl.includes('?') ? '&' : '?';
        const wrapped = `${serverUrl}${separator}url=${encodeURIComponent(url)}&token=${configToken}`;
        return { status: 'wrapped', label: 'Tautan Dibungkus Iklan', wrappedUrl: wrapped };
      } catch {
        return { status: 'internal', label: 'Internal (Dilewati)', wrappedUrl: null };
      }
    },
    [configAdServer, configBlacklist, configWhitelist, configToken]
  );

  const handleAddLink = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newLinkTitle || !newLinkUrl) return;
      setCustomLinks((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          title: newLinkTitle,
          url: newLinkUrl,
          category: newLinkUrl.startsWith('http') ? 'external' : 'internal',
        },
      ]);
      setNewLinkTitle('');
      setNewLinkUrl('');
    },
    [newLinkTitle, newLinkUrl]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white pb-16">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-100 text-base sm:text-lg tracking-tight">GoSmart AdGuard</h1>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Self-Hosted Anti-Bypass
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Full Script Injeksi Tautan Otomatis &amp; Verifikasi Single-Use Hash (10 Detik)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="font-mono">{activeCount} Hash Aktif</span>
            </div>
            <button
              id="refresh-server-btn"
              onClick={loadHashes}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Data Hash"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHashes ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Architecture & Workflow Banner */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/60 pb-4 mb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Arsitektur Modular Mandiri</span>
              <h2 className="text-lg font-bold text-slate-100">Alur Kerja Sistem Injeksi &amp; Verifikasi Anti-Bypass</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>TTL Hash: 10 Detik (Strict Single-Use)</span>
            </div>
          </div>

          {/* Stepper Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 relative overflow-hidden">
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Tahap 1 • Injeksi DOM</div>
              <div className="font-semibold text-slate-200 text-sm mb-1 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-blue-400" /> FullScript Scan
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Skrip di <code className="text-slate-300 bg-slate-800 px-1 rounded">&lt;head&gt;</code> memindai tautan keluar, memfilter Whitelist/Blacklist, lalu membungkus ke gateway iklan.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 relative overflow-hidden">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Tahap 2 • Gateway Iklan</div>
              <div className="font-semibold text-slate-200 text-sm mb-1 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-indigo-400" /> Ad-Step Interstitial
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pengunjung melewati sesi iklan (3 detik). Server men-generate 64-char hash unik berdurasi 10 detik lalu me-redirect.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 relative overflow-hidden">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Tahap 3 • Redirect Parameter</div>
              <div className="font-semibold text-slate-200 text-sm mb-1 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" /> ?hash=xyz... (10s)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pengunjung kembali ke URL tujuan dengan membawa parameter hash. Hash aktif selama 10 detik di memori server.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 relative overflow-hidden">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Tahap 4 • Verifikasi Backend</div>
              <div className="font-semibold text-slate-200 text-sm mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Anti-Bypass API
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Backend publisher memanggil <code className="text-slate-300 bg-slate-800 px-1 rounded">POST /api/v1/anti_bypassing</code>. Jika TRUE, hash dihapus (single-use).
              </p>
            </div>
          </div>
        </section>

        {/* Tab Navigation Menu */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            id="tab-sandbox-btn"
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'sandbox'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Publisher Sandbox</span>
          </button>

          <button
            id="tab-gateway-btn"
            onClick={() => setActiveTab('gateway')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'gateway'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>2. Gateway Iklan (Ad-Step)</span>
          </button>

          <button
            id="tab-verifier-btn"
            onClick={() => setActiveTab('verifier')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'verifier'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. Anti-Bypass Tester</span>
          </button>

          <button
            id="tab-inspector-btn"
            onClick={() => setActiveTab('inspector')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'inspector'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>4. Hash Memory ({activeCount})</span>
          </button>

          <button
            id="tab-code-btn"
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>5. Kode &amp; Integrasi</span>
          </button>

          <button
            id="tab-docs-btn"
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'docs'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>6. Dokumentasi &amp; Lisensi</span>
          </button>
        </div>

        {/* TAB 1: PUBLISHER SANDBOX */}
        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sandbox Simulation Content */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Simulasi Halaman Publisher</span>
                    <h3 className="text-base font-bold text-slate-100">Contoh Blog / Situs Unduhan dengan Injeksi Link Otomatis</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Status FullScript:</span>
                    <button
                      id="toggle-fullscript-btn"
                      onClick={() => setScriptActive(!scriptActive)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        scriptActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {scriptActive ? 'AKTIF (Injeksi Berjalan)' : 'NONAKTIF'}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  Di bawah ini adalah daftar tautan yang berada pada situs publisher. Bila <strong>FullScript Aktif</strong>, skrip otomatis memindai DOM, mengecek aturan whitelist/blacklist, dan mengubah link eksternal menjadi tautan gateway iklan secara transparan!
                </p>

                {/* List of Simulated Links */}
                <div className="space-y-2.5">
                  {customLinks.map((link) => {
                    const evalResult = scriptActive
                      ? evaluateSandboxLink(link.url)
                      : { status: 'original', label: 'Tautan Asli (Skrip Nonaktif)', wrappedUrl: null };

                    return (
                      <div
                        key={link.id}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-200">{link.title}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                evalResult.status === 'wrapped'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : evalResult.status === 'blacklisted'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : evalResult.status === 'internal'
                                  ? 'bg-slate-700/50 text-slate-300'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {evalResult.label}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-400 truncate">
                            Asli: <span className="text-slate-300">{link.url}</span>
                          </div>
                          {evalResult.wrappedUrl && (
                            <div className="text-[11px] font-mono text-blue-400/90 truncate bg-blue-950/30 px-2 py-1 rounded border border-blue-900/30">
                              Wrapped: {evalResult.wrappedUrl}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {evalResult.wrappedUrl ? (
                            <button
                              id={`test-click-${link.id}`}
                              onClick={() => startAdSimulation(link.url)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
                            >
                              <span>Uji Klik Iklan</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                            >
                              <span>Buka Langsung</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Link Form (Demonstrating MutationObserver) */}
                <form onSubmit={handleAddLink} className="mt-5 pt-4 border-t border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Uji Dynamic DOM Link Injection (MutationObserver)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Judul Tautan Baru"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <div className="sm:col-span-2 flex gap-2">
                      <label htmlFor={customUrlInputId} className="sr-only">URL Baru</label>
                      <input
                        id={customUrlInputId}
                        type="text"
                        placeholder="https://contoh-link-download.com/file.zip"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 flex-1"
                      />
                      <button
                        type="submit"
                        id="add-custom-link-btn"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 whitespace-nowrap"
                      >
                        + Tambah Link
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Quick Sandbox Controls & Settings */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>Filter Aturan Domain</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Whitelist Domain (Opsional):
                  </label>
                  <input
                    type="text"
                    value={configWhitelist}
                    onChange={(e) => setConfigWhitelist(e.target.value)}
                    placeholder="Kosongkan jika semua link ingin dimonetisasi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Hanya domain ini yang dibungkus jika diisi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Blacklist Domain (Dikecualikan):
                  </label>
                  <input
                    type="text"
                    value={configBlacklist}
                    onChange={(e) => setConfigBlacklist(e.target.value)}
                    placeholder="domain1.com, domain2.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Domain internal dan media sosial tidak akan dibungkus iklan.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-300 mb-2">Simulasi Pop-Under Safe Trigger</div>
                  <button
                    id="trigger-popunder-demo-btn"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const popup = window.open(
                          '/api/redirect?direct=true&url=' + encodeURIComponent('https://example.com/ad-slot'),
                          '_blank',
                          'width=800,height=600,left=100,top=100'
                        );
                        if (popup) {
                          popup.blur();
                          window.focus();
                        }
                      }
                    }}
                    className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Uji Safe Pop-Under Window</span>
                  </button>
                  <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                    Sesuai standar W3C &amp; User Gesture Policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GATEWAY IKLAN SIMULATOR */}
        {activeTab === 'gateway' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                <span>GoSmart Anti-Bypass Gateway (Simulasi Pengguna)</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-100">Memverifikasi Sesi Penayangan Iklan</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Pengunjung ditahan selama 3 detik untuk menyelesaikan penayangan iklan sponsor sebelum dialihkan ke target.
                </p>
              </div>

              {/* Ad Banner Simulator */}
              <div className="bg-slate-950 border border-dashed border-slate-700 rounded-xl p-6 text-slate-400 space-y-2">
                <div className="text-xs uppercase tracking-wider font-bold text-slate-300">
                  [ Slot Iklan Sponsor Mandiri Terverifikasi ]
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Format iklan banner, video interstitial, atau partner CPM mandiri. Terlindungi dari bypass bot.
                </p>
                <div className="text-[11px] font-mono text-emerald-400 pt-2">
                  Target Tujuan: <span className="text-slate-300">{gatewayTarget}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-150"
                    style={{ width: `${gatewayProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs font-mono font-bold text-blue-400">
                  {isSimulatingAd ? `Mengalihkan dalam ${gatewaySeconds} detik...` : 'Verifikasi Penayangan Selesai!'}
                </div>
              </div>

              {/* Generated Hash Box */}
              {lastGeneratedHash && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Single-Use Hash Tergenerate (Masa Aktif 10 Detik):
                    </span>
                    <button
                      onClick={() => copyToClipboard(lastGeneratedHash, 'gateway-hash')}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {copiedId === 'gateway-hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Salin</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-emerald-300 break-all bg-slate-900 p-2.5 rounded border border-slate-800">
                    {lastGeneratedHash}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    URL Redirect: <span className="text-slate-300">{gatewayTarget}?hash={lastGeneratedHash}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  id="start-ad-sim-btn"
                  onClick={() => startAdSimulation()}
                  disabled={isSimulatingAd}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>{isSimulatingAd ? 'Sedang Memproses...' : 'Ulangi Simulasi Iklan & Buat Hash'}</span>
                </button>

                <button
                  id="go-to-verifier-btn"
                  onClick={() => {
                    if (lastGeneratedHash) {
                      setVerifyHash(lastGeneratedHash);
                    }
                    setActiveTab('verifier');
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Bawa Hash ke Verifier Tester</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ANTI-BYPASS TESTER */}
        {activeTab === 'verifier' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">API Testing Console</span>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>POST /api/v1/anti_bypassing</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Validasi token publisher (64 karakter) dan hash sekali pakai (10 detik).
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor={publisherTokenInputId} className="text-xs font-semibold text-slate-300">Publisher Token (64 Karakter):</label>
                    <button
                      onClick={() => setVerifyToken(DEFAULT_TOKEN)}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Gunakan Token Sah
                    </button>
                  </div>
                  <input
                    id={publisherTokenInputId}
                    type="text"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor={hashVerifyInputId} className="text-xs font-semibold text-slate-300">Hash Pengguna (?hash=...):</label>
                    {hashes.length > 0 && (
                      <button
                        onClick={() => {
                          const active = hashes.find((h) => !h.used && now <= h.expiresAt);
                          if (active) setVerifyHash(active.hash);
                        }}
                        className="text-[11px] text-emerald-400 hover:underline"
                      >
                        Pilih Hash Aktif Terbaru
                      </button>
                    )}
                  </div>
                  <input
                    id={hashVerifyInputId}
                    type="text"
                    value={verifyHash}
                    onChange={(e) => setVerifyHash(e.target.value)}
                    placeholder="Tempelkan 64-karakter hash di sini..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  id="run-verify-btn"
                  onClick={executeVerification}
                  disabled={verifyLoading || !verifyHash}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{verifyLoading ? 'Memverifikasi...' : 'Jalankan Verifikasi Anti-Bypass'}</span>
                </button>

                <button
                  id="generate-quick-hash-btn"
                  onClick={async () => {
                    const res = await fetch('/api/hashes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'generate', targetUrl: 'https://example.com/test-verify', token: verifyToken }),
                    });
                    const data = await res.json();
                    if (data.record) {
                      setVerifyHash(data.record.hash);
                      loadHashes();
                    }
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Generate Hash Baru</span>
                </button>
              </div>

              {/* cURL Snippet */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">cURL Request:</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `curl -X POST "${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/anti_bypassing?token=${verifyToken}&hash=${verifyHash}"`,
                        'curl-verify'
                      )
                    }
                    className="hover:text-slate-200 flex items-center gap-1 text-[11px]"
                  >
                    {copiedId === 'curl-verify' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Salin cURL</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-400 break-all bg-slate-900/90 p-2 rounded border border-slate-800/80">
                  curl -X POST &quot;{typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/anti_bypassing?token={verifyToken.substring(0, 12)}...&amp;hash={verifyHash.substring(0, 12)}...&quot;
                </div>
              </div>
            </div>

            {/* Response Console */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Respon API Server</span>
                {verifyLatency !== null && (
                  <span className="text-xs font-mono text-slate-400">Latency: {verifyLatency} ms</span>
                )}
              </div>

              {verifyResult ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      verifyResult.response === true
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : verifyResult.response === false
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {verifyResult.response === true ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-sm">
                        {verifyResult.response === true
                          ? 'VERIFIKASI BERHASIL (TRUE)'
                          : verifyResult.response === false
                          ? 'VERIFIKASI GAGAL (FALSE)'
                          : 'TOKEN TIDAK VALID (Invalid token.)'}
                      </div>
                      <p className="text-xs opacity-90 mt-0.5">
                        {verifyResult.reason ||
                          (verifyResult.response === true
                            ? 'Pengguna terbukti sah melewati iklan. Hash langsung dibakar (Single-Use).'
                            : 'Hash tidak ditemukan, telah kedaluwarsa (>10s), atau sudah dipakai sebelumnya.')}
                      </p>
                    </div>
                  </div>

                  {/* Single-Use Test Hint */}
                  {verifyResult.response === true && (
                    <div className="bg-blue-950/40 border border-blue-800/40 p-3 rounded-xl text-xs text-blue-300">
                      <strong>Uji Single-Use Policy:</strong> Coba klik tombol &quot;Jalankan Verifikasi Anti-Bypass&quot; sekali lagi dengan hash yang sama. Respon akan seketika berubah menjadi <code className="bg-blue-900/60 px-1 rounded text-white">false</code> karena hash telah otomatis dimusnahkan!
                    </div>
                  )}

                  {/* Raw JSON */}
                  <div>
                    <div className="text-xs text-slate-400 font-mono mb-1">Payload Respon JSON:</div>
                    <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
                      {JSON.stringify(verifyResult, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                  <ShieldCheck className="w-10 h-10 stroke-[1.5] text-slate-700" />
                  <p className="text-xs max-w-xs">
                    Klik tombol &quot;Jalankan Verifikasi Anti-Bypass&quot; untuk menguji keabsahan token dan status single-use hash secara langsung.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: HASH MEMORY INSPECTOR */}
        {activeTab === 'inspector' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">Real-Time Hash Storage</span>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Inspeksi Memori Hash (Masa Aktif 10 Detik)</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await fetch('/api/hashes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'generate', targetUrl: 'https://example.com/inspected-item.zip' }),
                    });
                    loadHashes();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Generate Hash 10s</span>
                </button>
              </div>
            </div>

            {hashes.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-700" />
                <p className="text-xs">Tidak ada hash aktif di memori saat ini.</p>
                <p className="text-[11px] text-slate-600">
                  Klik &quot;Generate Hash 10s&quot; atau lakukan simulasi iklan untuk melihat token masuk ke memori.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                      <th className="pb-3 font-semibold">64-CHAR HASH</th>
                      <th className="pb-3 font-semibold">STATUS</th>
                      <th className="pb-3 font-semibold">SISA TTL (10s)</th>
                      <th className="pb-3 font-semibold">URL TUJUAN</th>
                      <th className="pb-3 font-semibold text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {hashes.map((item) => {
                      const remainingMs = Math.max(0, item.expiresAt - now);
                      const remainingSec = (remainingMs / 1000).toFixed(1);
                      const isExpired = remainingMs <= 0;
                      const pct = Math.min(100, Math.max(0, (remainingMs / 10000) * 100));

                      return (
                        <tr key={item.hash} className="hover:bg-slate-950/40">
                          <td className="py-3 pr-2 text-slate-300 font-mono text-[11px]">
                            {item.hash.substring(0, 16)}...{item.hash.substring(48)}
                          </td>
                          <td className="py-3 pr-2">
                            {item.used ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                                CONSUMED (BURNED)
                              </span>
                            ) : isExpired ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                                EXPIRED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-2">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    isExpired ? 'bg-rose-500' : remainingMs < 3000 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                              <span className="text-[11px] text-slate-400">{remainingSec}s</span>
                            </div>
                          </td>
                          <td className="py-3 pr-2 text-slate-400 truncate max-w-xs">{item.targetUrl}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setVerifyHash(item.hash);
                                setVerifyToken(item.token);
                                setActiveTab('verifier');
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                            >
                              Uji Verifikasi
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: KODE & INTEGRASI */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            {/* Publisher Configurator */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs uppercase tracking-wider text-blue-400 font-bold">Generator Snippet Publisher</span>
                <h3 className="text-base font-bold text-slate-100">Konfigurasi Skrip Injeksi Tautan Otomatis</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={cfgAdServerId} className="block text-xs font-semibold text-slate-300 mb-1">URL Ad Server Anda:</label>
                  <input
                    id={cfgAdServerId}
                    type="text"
                    value={configAdServer}
                    onChange={(e) => setConfigAdServer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor={cfgTokenId} className="block text-xs font-semibold text-slate-300 mb-1">Publisher Token (64 Karakter):</label>
                  <input
                    id={cfgTokenId}
                    type="text"
                    value={configToken}
                    onChange={(e) => setConfigToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor={cfgWhitelistId} className="block text-xs font-semibold text-slate-300 mb-1">Whitelist Domain (Pisahkan Koma):</label>
                  <input
                    id={cfgWhitelistId}
                    type="text"
                    value={configWhitelist}
                    onChange={(e) => setConfigWhitelist(e.target.value)}
                    placeholder="Kosongkan jika semua link ingin dimonetisasi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor={cfgBlacklistId} className="block text-xs font-semibold text-slate-300 mb-1">Blacklist Domain (Pisahkan Koma):</label>
                  <input
                    id={cfgBlacklistId}
                    type="text"
                    value={configBlacklist}
                    onChange={(e) => setConfigBlacklist(e.target.value)}
                    placeholder="facebook.com, internal.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Code Viewers */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSnippet('html')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedSnippet === 'html' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    1. Frontend Tag &lt;head&gt;
                  </button>
                  <button
                    onClick={() => setSelectedSnippet('express')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedSnippet === 'express' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    2. Backend Server (Node.js/Express)
                  </button>
                  <button
                    onClick={() => setSelectedSnippet('php')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedSnippet === 'php' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    3. Publisher Verifier (PHP)
                  </button>
                  <button
                    onClick={() => setSelectedSnippet('adcontroller')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedSnippet === 'adcontroller' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    4. Safe Pop-Under Module
                  </button>
                </div>

                <button
                  onClick={() => {
                    let code = '';
                    if (selectedSnippet === 'html') {
                      code = `<!-- Masukkan di dalam tag <head> website publisher -->
<script>
  window.FullScriptConfig = {
    adServerUrl: "${configAdServer}",
    publisherToken: "${configToken}",
    whitelist: [${configWhitelist ? configWhitelist.split(',').map((s) => `"${s.trim()}"`).join(', ') : ''}],
    blacklist: [location.hostname, ${configBlacklist ? configBlacklist.split(',').map((s) => `"${s.trim()}"`).join(', ') : ''}],
    openNewTab: true
  };
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/fullscript.js" async defer></script>`;
                    } else if (selectedSnippet === 'express') {
                      code = `// server.js - Node.js Express Backend Anti-Bypass
const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

const hashStorage = new Map();
const AUTHORIZED_TOKENS = new Set(["${configToken}"]);

app.get('/redirect', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Target URL diperlukan");
  const generatedHash = crypto.randomBytes(32).toString('hex');
  hashStorage.set(generatedHash, { expiresAt: Date.now() + 10000 });
  setTimeout(() => hashStorage.delete(generatedHash), 12000);
  const separator = targetUrl.includes('?') ? '&' : '?';
  res.redirect(\`\${targetUrl}\${separator}hash=\${generatedHash}\`);
});

app.post('/api/v1/anti_bypassing', (req, res) => {
  const token = req.query.token || req.body.token;
  const hash = req.query.hash || req.body.hash;
  if (!token || token.length !== 64 || !hash || hash.length !== 64) {
    return res.json({ response: "Invalid token." });
  }
  if (!AUTHORIZED_TOKENS.has(token)) {
    return res.json({ response: "Invalid token." });
  }
  const record = hashStorage.get(hash);
  if (!record || Date.now() > record.expiresAt) {
    return res.json({ response: false });
  }
  hashStorage.delete(hash); // Single-use policy
  return res.json({ response: true });
});

app.listen(3000, () => console.log("Ad Server running on port 3000"));`;
                    } else if (selectedSnippet === 'php') {
                      code = `<?php
// protect.php - Verifikasi Anti-Bypass di Server Publisher
$token = "${configToken}";
$hash  = isset($_GET['hash']) ? trim($_GET['hash']) : '';

if (empty($hash) || strlen($hash) !== 64) {
    http_response_code(403);
    die("Akses Ditolak: Hash verifikasi diperlukan.");
}

$apiUrl = "${typeof window !== 'undefined' ? window.location.origin : 'https://your-ad-server.com'}/api/v1/anti_bypassing?token=" . urlencode($token) . "&hash=" . urlencode($hash);

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if (isset($data['response']) && $data['response'] === true) {
    // Verifikasi SUKSES: Buka file atau tampilkan konten
    echo "<h1>Selamat datang! Akses konten terverifikasi.</h1>";
} else {
    http_response_code(403);
    die("Akses Ditolak: Hash tidak valid atau masa berlaku 10 detik habis.");
}
?>`;
                    } else {
                      code = `// ad-controller.js - Inisialisasi Pop-Under Berbasis User Gesture
const adController = new GoSmartAdController({
  adUrl: "${configAdServer}?direct=true&url=" + encodeURIComponent("https://example.com/ad-step"),
  frequencyMinutes: 15,
  triggerSelector: "a, button",
  excludeSelector: ".no-ad"
});
adController.init();`;
                    }
                    copyToClipboard(code, 'snippet-copy');
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5"
                >
                  {copiedId === 'snippet-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Salin Kode</span>
                </button>
              </div>

              {/* Code Snippet Box */}
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                {selectedSnippet === 'html' && `<!-- Masukkan di dalam tag <head> website publisher -->
<script>
  window.FullScriptConfig = {
    adServerUrl: "${configAdServer}",
    publisherToken: "${configToken}",
    whitelist: [${configWhitelist ? configWhitelist.split(',').map((s) => `"${s.trim()}"`).join(', ') : ''}],
    blacklist: [location.hostname, ${configBlacklist ? configBlacklist.split(',').map((s) => `"${s.trim()}"`).join(', ') : ''}],
    openNewTab: true
  };
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/fullscript.js" async defer></script>`}

                {selectedSnippet === 'express' && `// server.js - Node.js Express Backend Anti-Bypass
const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

const hashStorage = new Map();
const AUTHORIZED_TOKENS = new Set(["${configToken}"]);

app.get('/redirect', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Target URL diperlukan");
  const generatedHash = crypto.randomBytes(32).toString('hex');
  hashStorage.set(generatedHash, { expiresAt: Date.now() + 10000 });
  setTimeout(() => hashStorage.delete(generatedHash), 12000);
  const separator = targetUrl.includes('?') ? '&' : '?';
  res.redirect(\`\${targetUrl}\${separator}hash=\${generatedHash}\`);
});

app.post('/api/v1/anti_bypassing', (req, res) => {
  const token = req.query.token || req.body.token;
  const hash = req.query.hash || req.body.hash;
  if (!token || token.length !== 64 || !hash || hash.length !== 64) {
    return res.json({ response: "Invalid token." });
  }
  if (!AUTHORIZED_TOKENS.has(token)) {
    return res.json({ response: "Invalid token." });
  }
  const record = hashStorage.get(hash);
  if (!record || Date.now() > record.expiresAt) {
    return res.json({ response: false });
  }
  hashStorage.delete(hash); // Single-use policy
  return res.json({ response: true });
});

app.listen(3000, () => console.log("Ad Server running on port 3000"));`}

                {selectedSnippet === 'php' && `<?php
// protect.php - Verifikasi Anti-Bypass di Server Publisher
$token = "${configToken}";
$hash  = isset($_GET['hash']) ? trim($_GET['hash']) : '';

if (empty($hash) || strlen($hash) !== 64) {
    http_response_code(403);
    die("Akses Ditolak: Hash verifikasi diperlukan.");
}

$apiUrl = "${typeof window !== 'undefined' ? window.location.origin : 'https://your-ad-server.com'}/api/v1/anti_bypassing?token=" . urlencode($token) . "&hash=" . urlencode($hash);

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if (isset($data['response']) && $data['response'] === true) {
    // Verifikasi SUKSES: Buka file atau tampilkan konten
    echo "<h1>Selamat datang! Akses konten terverifikasi.</h1>";
} else {
    http_response_code(403);
    die("Akses Ditolak: Hash tidak valid atau masa berlaku 10 detik habis.");
}
?>`}

                {selectedSnippet === 'adcontroller' && `// ad-controller.js - Inisialisasi Pop-Under Berbasis User Gesture
const adController = new GoSmartAdController({
  adUrl: "${configAdServer}?direct=true&url=" + encodeURIComponent("https://example.com/ad-step"),
  frequencyMinutes: 15,
  triggerSelector: "a, button",
  excludeSelector: ".no-ad"
});
adController.init();`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 6: DOKUMENTASI & LISENSI */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs uppercase tracking-wider text-blue-400 font-bold">Panduan Implementasi</span>
                <h3 className="text-base font-bold text-slate-100">Langkah-Langkah Penerapan Sistem Mandiri (Self-Hosted)</h3>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                    Persiapan Server Ad-Network &amp; Anti-Bypass
                  </h4>
                  <p>
                    Deploy file <code className="text-blue-400 bg-slate-900 px-1 rounded">server.js</code> pada VPS atau Cloud Server Anda (Ubuntu, Debian, atau Docker). Pastikan port terhubung dan pasang sertifikat SSL (HTTPS) agar tidak terjadi masalah Mixed Content.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                    Pemasangan FullScript di Website Publisher
                  </h4>
                  <p>
                    Pasang snippet JavaScript di antara tag <code className="text-blue-400 bg-slate-900 px-1 rounded">&lt;head&gt;</code> pada setiap situs web yang ingin dimonetisasi. Tentukan token publisher dan sesuaikan domain internal ke dalam Blacklist.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
                    Proteksi Endpoint Tujuan dengan Anti-Bypass
                  </h4>
                  <p>
                    Pada skrip backend target (PHP, Express, Django, Laravel), lakukan pembacaan parameter <code className="text-amber-400 bg-slate-900 px-1 rounded">?hash=...</code> dan tembakkan POST request ke endpoint verifikasi. Jika respon bernilai <code className="text-emerald-400 bg-slate-900 px-1 rounded">true</code>, berikan akses konten. Jika <code className="text-rose-400 bg-slate-900 px-1 rounded">false</code>, tolak akses!
                  </p>
                </div>
              </div>
            </div>

            {/* License Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">Legal &amp; Lisensi</span>
                  <h3 className="text-base font-bold text-slate-100">Perjanjian Lisensi Perangkat Lunak Proprietari</h3>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-[11px] font-bold">
                  HAK CIPTA © 2026 TUANBAGUES
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-3 max-h-72 overflow-y-auto leading-relaxed">
                <p className="font-bold text-slate-100">
                  PERJANJIAN LISENSI PERANGKAT LUNAK PROPRIETARI<br />
                  HAK CIPTA © 2026 TUANBAGUES &amp; GOSMART TEKNOLOGI CREATIVE. SEMUA HAK DILINDUNGI UNDANG-UNDANG.
                </p>
                <p>
                  <strong>PEMBUKAAN:</strong> Perjanjian Lisensi Perangkat Lunak Milik Perusahaan ini (&quot;Perjanjian&quot;) dibuat dan disahkan secara hukum untuk mengatur kepemilikan, penggunaan, dan pendistribusian platform &quot;GoSmart Theme - Platform Marketplace Tema Toko Online&quot; beserta seluruh modul terkait, dikembangkan oleh Tuanbagues (tuanbagues@gmail.com) bersama GoSmart Teknologi Creative sebagai Pemegang Hak Cipta yang sah.
                </p>
                <p>
                  <strong>PASAL 1: DEFINISI DAN RUANG LINGKUP:</strong> Mencakup seluruh bagian kode sumber, modul React 19, TypeScript, skrip injeksi DOM, endpoint anti-bypass, UI/UX, dan pustaka terkait.
                </p>
                <p>
                  <strong>PASAL 2: HAK PENGGUNAAN KOMERSIAL:</strong> Pembeli resmi berhak menggunakan paket tema untuk domain tak terbatas (Unlimited Domains) seumur hidup (Lifetime License) tanpa mengalihkan hak cipta master platform.
                </p>
                <p>
                  <strong>PASAL 3: PEMBATASAN KETAT DAN LARANGAN MUTLAK:</strong> Dilarang keras mendistribusikan ulang (resell/nulled), mengkloning algoritma lisensi terpusat, atau menghapus tanda hak cipta resmi.
                </p>
                <p>
                  <strong>PASAL 4: SISTEM VALIDASI LISENSI:</strong> Kunci lisensi diverifikasi secara terpusat dan dapat dibatalkan jika terjadi pelanggaran atau kecurangan.
                </p>
                <p>
                  <strong>PASAL 5 &amp; 6: HUKUM BERLAKU &amp; PENAFIAN GARANSI:</strong> Diatur oleh hukum Republik Indonesia (UU Hak Cipta &amp; ITE). Disediakan dengan prinsip &quot;AS-IS&quot;.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div>Kontak Resmi: <a href="mailto:tuanbagues@gmail.com" className="text-blue-400 underline">tuanbagues@gmail.com</a></div>
                <div>Portofolio: <a href="https://tuanbagues.netlify.app/" target="_blank" rel="noreferrer" className="text-blue-400 underline">https://tuanbagues.netlify.app/</a></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
