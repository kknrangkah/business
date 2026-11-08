'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Sparkles,
  Zap,
  X,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Receipt,
  Lock,
} from 'lucide-react';
import { useRME } from '@/context/rme-context';
import { Button } from '@/components/ui/button';

export function TrialReminderBanner() {
  const router = useRouter();
  const {
    trialInfo,
    daysRemaining,
    hoursRemaining,
    isTrialActive,
    isTrialExpired,
    setIsTrialModalOpen,
  } = useRME();

  const [isDismissed, setIsDismissed] = useState(false);

  // If user has full license or banner was dismissed in this view (unless trial is expired), don't render
  if (trialInfo.tier !== 'TRIAL' || (isDismissed && !isTrialExpired)) {
    return null;
  }

  const isUrgent = isTrialExpired || daysRemaining <= 3;
  const isWarning = !isTrialExpired && daysRemaining <= 7;

  return (
    <div
      className={`relative w-full border-b transition-colors px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3 text-xs ${
        isUrgent
          ? 'bg-rose-50 border-rose-200 text-rose-950'
          : isWarning
          ? 'bg-amber-50/90 border-amber-200 text-amber-950'
          : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div
          className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${
            isUrgent
              ? 'bg-rose-100 text-rose-700'
              : isWarning
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {isTrialExpired ? (
            <Lock className="h-4 w-4 text-rose-600 animate-pulse" />
          ) : isUrgent ? (
            <AlertTriangle className="h-4 w-4 animate-bounce" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold">
              {isTrialExpired
                ? 'Masa Uji Coba Telah Berakhir — Menu RME Terkunci'
                : `Masa Uji Coba: ${daysRemaining} Hari Tersisa`}
            </span>
            <span className="text-[11px] opacity-80 hidden md:inline">
              {isTrialExpired
                ? '(Hanya menu Paket Berlangganan & Penagihan Pembayaran yang dapat diakses)'
                : '(Akses Penuh Fitur SOAP, ICD-10, E-Resep & Kasir)'}
            </span>
          </div>

          {!isTrialExpired && (
            <span className="text-[11px] opacity-75 hidden lg:inline">
              • Dapatkan lisensi resmi untuk jaminan kontinuitas data pasien faskes Anda.
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isTrialExpired ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => router.push('/saas/plans')}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pilih Paket</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => router.push('/saas/billing')}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Bayar Faktur</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsTrialModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer ${
              isUrgent
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Aktivasi Lisensi</span>
            <span className="sm:hidden">Aktivasi</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}

        {!isTrialExpired && (
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg hover:bg-black/5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            title="Sembunyikan peringatan sementara"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
