'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  Plus,
  RefreshCw,
  Phone,
  Check,
  AlertTriangle,
  Zap,
  Building2,
  Calendar,
  Layers,
  X,
} from 'lucide-react';
import { useRME } from '@/context/rme-context';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function TrialModal() {
  const router = useRouter();
  const {
    trialInfo,
    daysRemaining,
    hoursRemaining,
    percentageUsed,
    isTrialActive,
    isTrialExpired,
    activateLicense,
    resetTrial,
    isTrialModalOpen,
    setIsTrialModalOpen,
    config,
  } = useRME();

  const [inputKey, setInputKey] = useState('');
  const [selectedTier, setSelectedTier] = useState<'PROFESSIONAL' | 'ENTERPRISE'>('PROFESSIONAL');
  const [timeLeft, setTimeLeft] = useState({
    days: daysRemaining,
    hours: hoursRemaining,
    minutes: 0,
    seconds: 0,
  });

  // Real-time ticking countdown
  useEffect(() => {
    const updateCountdown = () => {
      const end = new Date(trialInfo.endDate).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [trialInfo.endDate]);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      toast.error('Masukkan kode serial lisensi Anda.');
      return;
    }

    const result = activateLicense(inputKey, selectedTier);
    if (result.success) {
      toast.success(result.message);
      setInputKey('');
    } else {
      toast.error(result.message);
    }
  };

  const handlePresetKey = (key: string, tier: 'PROFESSIONAL' | 'ENTERPRISE') => {
    setInputKey(key);
    setSelectedTier(tier);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const isPro = trialInfo.tier !== 'TRIAL';

  return (
    <Dialog open={isTrialModalOpen} onOpenChange={setIsTrialModalOpen} maxWidth="2xl">
      <div className="-m-6 flex flex-col">
        {/* Header Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 text-white rounded-t-xl">
          <button
            onClick={() => setIsTrialModalOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer z-20"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2.5">
            <div className="flex items-center justify-between pr-8">
              <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold gap-1.5 px-3 py-1 rounded-full">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isPro ? 'LISENSI RESMI TERVERIFIKASI' : 'PROGRAM UJI COBA RESMI'}</span>
              </Badge>

              <span className="text-[11px] text-slate-300 font-medium truncate max-w-[200px]">
                {config.practiceName}
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {isPro ? 'Lisensi Praktik Aktif Penuh' : 'Masa Uji Coba (Trial) Rekam Medis'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {isPro
                  ? `Sistem beroperasi dengan ${trialInfo.planName}. Seluruh fitur rekam medis terbuka tanpa batas waktu.`
                  : 'Anda sedang menggunakan masa evaluasi trial 30 hari dengan akses ke seluruh fitur klinis standar Kemenkes RI.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Countdown Clock (When Trial) */}
          {!isPro ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-700" />
                  <span>Hitung Mundur Masa Berakhir Trial:</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {timeLeft.days > 0 ? `${timeLeft.days} Hari Tersisa` : 'Masa Trial Habis'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {String(timeLeft.days).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                    Hari
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                    Jam
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                    Menit
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                    Detik
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>Mulai: {formatDate(trialInfo.startDate)}</span>
                  <span>Berakhir: {formatDate(trialInfo.endDate)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentageUsed}%` }}
                  />
                </div>
                <div className="text-right text-[10px] text-slate-400 font-semibold">
                  {percentageUsed}% Masa Trial Terpakai
                </div>
              </div>
            </div>
          ) : (
            /* Active License Status Card */
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                <span className="text-sm font-bold text-emerald-900">{trialInfo.planName}</span>
              </div>
              <div className="text-xs text-emerald-800 space-y-0.5 pl-7">
                <div>Kode Serial: <span className="font-mono font-bold">{trialInfo.licenseKey}</span></div>
                <div>Status Masa Berlaku: <span className="font-bold">{trialInfo.isLifetime ? 'Seumur Hidup (Lifetime Unlimited)' : `Aktif hingga ${formatDate(trialInfo.endDate)}`}</span></div>
              </div>
            </div>
          )}

          {/* Included Features Grid */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <span>Fitur Premium yang Terbuka dalam Sistem:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                'Pemeriksaan SOAP & Riwayat Medis',
                'Master Diagnosa ICD-10 Kemenkes',
                'E-Resep & Manajemen Stok Farmasi',
                'Kasir, Kwitansi & Rincian Pembayaran',
                'Multi-User RBAC (Dokter, Admin, Nakes)',
                'Backup & Cetak Rekam Medis (PDF)',
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-semibold"
                >
                  <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* License Activation Form */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-emerald-700" />
                <span>Aktivasi Serial Lisensi Resmi:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Masukkan kode aktivasi Anda
              </span>
            </div>

            <form onSubmit={handleActivate} className="space-y-2.5">
              <div className="flex gap-2">
                <Input
                  placeholder="Contoh: RME-PRO-2026-KLINIK"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                  className="h-10 text-xs font-mono font-bold uppercase rounded-xl bg-slate-50 border-slate-200 tracking-wider"
                />
                <Button
                  type="submit"
                  className="h-10 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Aktivasi</span>
                </Button>
              </div>

              {/* Sample Preset Keys for Testing */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] pt-0.5">
                <span className="text-slate-400 font-medium">Contoh Kode Demo:</span>
                <button
                  type="button"
                  onClick={() => handlePresetKey('RME-PRO-2026-KLINIK', 'PROFESSIONAL')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 font-mono font-bold cursor-pointer transition-colors"
                >
                  RME-PRO-2026-KLINIK
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetKey('RME-ENTERPRISE-UNLIMITED', 'ENTERPRISE')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 font-mono font-bold cursor-pointer transition-colors"
                >
                  RME-ENTERPRISE-UNLIMITED
                </button>
              </div>
            </form>
          </div>

          {/* Subscription and Support Buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  setIsTrialModalOpen(false);
                  router.push('/saas/plans');
                }}
                className="text-xs font-bold gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer w-full sm:w-auto shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Pilih Paket Berlangganan</span>
              </Button>

              {isPro && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    resetTrial();
                    toast.info('Status dikembalikan ke mode Trial 30 Hari.');
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 rounded-xl"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reset ke Trial
                </Button>
              )}
            </div>

            <a
              href="https://wa.me/6285601617589?text=Halo%20Admin%20RME%2C%20saya%20ingin%20konsultasi%20paket%20lisensi%20penuh%20klinik"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Hubungi CS & Sales WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
