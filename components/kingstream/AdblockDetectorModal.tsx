'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, RefreshCw, ShieldCheck } from 'lucide-react';
import { useKingStream } from './KingStreamContext';

/**
 * Detects active AdBlock extensions, Brave Shields, or DNS adblockers
 * and displays a blocking prompt asking visitors to disable AdBlock to continue.
 */
export function AdblockDetectorModal() {
  const { adConfig } = useKingStream();
  const [isAdblockDetected, setIsAdblockDetected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const isEnabled = adConfig.adblockPopupEnabled !== false;

  const runAdblockDetection = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !isEnabled) {
      return false;
    }

    let blocked = false;

    // 1. DOM Cosmetic Filter Bait Check (catches uBlock, AdBlock Plus, AdGuard CSS rules)
    try {
      const bait = document.createElement('div');
      bait.className =
        'adsbox ad-banner pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads ad-slot sponsor-banner';
      bait.setAttribute('aria-hidden', 'true');
      bait.style.cssText =
        'position:fixed;left:-9999px;top:-9999px;width:12px;height:12px;pointer-events:none;opacity:0.01;';
      bait.innerHTML = '&nbsp;';
      document.body.appendChild(bait);

      await new Promise((r) => setTimeout(r, 220));

      const style = window.getComputedStyle(bait);
      if (
        bait.offsetHeight === 0 ||
        bait.offsetWidth === 0 ||
        style.display === 'none' ||
        style.visibility === 'hidden'
      ) {
        blocked = true;
      }

      bait.remove();
    } catch {
      // Ignore DOM edge errors
    }

    if (blocked) return true;

    // 2. Local /ads.js Bait Check (same-origin, cannot fail due to external network)
    if (navigator.onLine !== false) {
      try {
        const res = await fetch(`/ads.js?cb=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) {
          blocked = true;
        }
      } catch {
        blocked = true;
      }
    }

    if (blocked) return true;

    // 3. External Ad Network Script Check (catches network-level blockers / Brave Shields)
    if (navigator.onLine !== false) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      try {
        await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal,
        });
      } catch (err) {
        // Ignore timeout aborts on slow mobile networks; only flag active block/rejection
        if ((err as Error)?.name !== 'AbortError') {
          blocked = true;
        }
      } finally {
        clearTimeout(timer);
      }
    }

    return blocked;
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) {
      setIsAdblockDetected(false);
      return;
    }

    let cancelled = false;
    const initTimer = setTimeout(async () => {
      const detected = await runAdblockDetection();
      if (!cancelled) {
        setIsAdblockDetected(detected);
      }
    }, 650);

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
    };
  }, [isEnabled, runAdblockDetection]);

  const handleRecheckAndReload = async () => {
    setIsChecking(true);
    const detected = await runAdblockDetection();
    setIsChecking(false);

    if (!detected) {
      setIsAdblockDetected(false);
    } else {
      window.location.reload();
    }
  };

  if (!isEnabled || !isAdblockDetected) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#070310]/90 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adblock-modal-title"
    >
      <div className="w-full max-w-md bg-[#130A24] border-2 border-rose-500/60 rounded-2xl p-6 sm:p-7 shadow-[0_0_45px_rgba(244,63,94,0.28)] text-center relative overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-rose-600/20 blur-2xl pointer-events-none rounded-full" />

        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/50">
          <ShieldAlert className="w-9 h-9 animate-pulse" />
        </div>

        <h2 id="adblock-modal-title" className="text-lg sm:text-xl font-black text-white tracking-tight">
          AdBlock Terdeteksi!
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          Mohon matikan <strong className="text-rose-300">AdBlock</strong> atau pemblokir iklan di browser Anda untuk terus menonton video di{' '}
          <span className="font-bold text-white">Stream</span>
          <span className="font-bold text-[#c084fc]">18+</span>.
        </p>

        {/* Quick 3-step instructions */}
        <div className="mt-4 p-3.5 bg-[#0D061A] border border-purple-900/50 rounded-xl text-left text-xs text-slate-300 space-y-2">
          <div className="font-bold text-purple-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cara Mematikan AdBlock:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] sm:text-xs text-slate-400 leading-relaxed">
            <li>Klik ikon ekstensi <strong className="text-slate-200">AdBlock / uBlock / Tameng Browser</strong> di atas layar.</li>
            <li>Pilih <strong className="text-emerald-300">&quot;Matikan / Jeda di situs ini&quot;</strong>.</li>
            <li>Klik tombol di bawah untuk memuat ulang halaman.</li>
          </ol>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleRecheckAndReload}
          disabled={isChecking}
          className="mt-5 w-full py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/70 flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98]"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Memeriksa Status AdBlock...' : 'Saya Sudah Matikan & Muat Ulang'}</span>
        </button>
      </div>
    </div>
  );
}

