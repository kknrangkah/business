'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Sparkles,
  ShieldAlert,
  Receipt,
  ArrowRight,
  Zap,
  CalendarPlus,
  Stethoscope,
  CreditCard,
  Pill,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useRME } from '@/context/rme-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function TrialExpiredLockView() {
  const router = useRouter();
  const {
    trialInfo,
    simulateUnlockTrial,
    activeTenant,
    currentUser,
  } = useRME();

  const handleSimulatePayment = () => {
    simulateUnlockTrial();
    toast.success('🎉 Pembayaran Lisensi Berhasil Dikonfirmasi!', {
      description: 'Seluruh modul pelayanan (Pendaftaran, Rekam Medis, Kasir) kini telah dibuka penuh!',
      duration: 6000,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-200 bg-white p-6 sm:p-10 shadow-xl shadow-rose-100/50 text-center">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-rose-100/60 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

        {/* Lock Shield Icon */}
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-600 shadow-inner">
          <ShieldAlert className="h-10 w-10 text-rose-600" />
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white shadow-md">
            <Lock className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold uppercase tracking-wider mb-3">
          <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
          <span>Masa Uji Coba (Trial) Telah Berakhir</span>
        </div>

        {/* Main Title & Description */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug max-w-2xl mx-auto">
          Akses Pelayanan &amp; Rekam Medis Faskes Terkunci
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Masa evaluasi sistem gratis Anda telah habis. Sesuai kebijakan langganan faskes,{' '}
          <strong className="text-slate-900 font-bold">
            seluruh menu yang berkaitan dengan pelayanan (Pendaftaran Pasien, Pemberian Rekam Medis SOAP, Resep Farmasi, dan Kasir Pembayaran) otomatis dinonaktifkan
          </strong>
          . Akses yang dibuka saat ini hanya menu{' '}
          <span className="text-emerald-700 font-bold underline decoration-emerald-500 underline-offset-2">
            Paket Berlangganan
          </span>{' '}
          dan{' '}
          <span className="text-emerald-700 font-bold underline decoration-emerald-500 underline-offset-2">
            Penagihan Pembayaran
          </span>
          .
        </p>

        {/* Locked Modules Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
          <div className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-1 relative">
            <div className="flex items-center justify-between">
              <CalendarPlus className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Terkunci</span>
            </div>
            <div className="font-bold text-xs text-slate-700">Pendaftaran &amp; Antrian</div>
            <p className="text-[10px] text-slate-500">Registrasi pasien &amp; display antrian TV tidak dapat diakses.</p>
          </div>

          <div className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-1 relative">
            <div className="flex items-center justify-between">
              <Stethoscope className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Terkunci</span>
            </div>
            <div className="font-bold text-xs text-slate-700">Pemberian Rekam Medis</div>
            <p className="text-[10px] text-slate-500">Pemeriksaan SOAP, diagnosa ICD-10 &amp; e-resep ditangguhkan.</p>
          </div>

          <div className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-1 relative">
            <div className="flex items-center justify-between">
              <Pill className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Terkunci</span>
            </div>
            <div className="font-bold text-xs text-slate-700">Farmasi &amp; Apotek</div>
            <p className="text-[10px] text-slate-500">Dispensing obat &amp; kelola stok farmasi faskes terkunci.</p>
          </div>

          <div className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-1 relative">
            <div className="flex items-center justify-between">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Terkunci</span>
            </div>
            <div className="font-bold text-xs text-slate-700">Kasir &amp; Invoice Pasien</div>
            <p className="text-[10px] text-slate-500">Penerbitan kwitansi &amp; pembayaran invoice pasien dikunci.</p>
          </div>
        </div>

        {/* Action Buttons to Open Allowed Menus */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => router.push('/saas/plans')}
            className="w-full sm:w-auto h-11 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Pilih Paket Berlangganan</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => router.push('/saas/billing')}
            variant="outline"
            className="w-full sm:w-auto h-11 px-6 border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Receipt className="h-4 w-4 text-slate-500" />
            <span>Penagihan &amp; Pembayaran Langganan</span>
          </Button>
        </div>
      </div>

      {/* Quick Testing & Evaluation Sandbox Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-900 font-extrabold text-xs">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Panel Pengujian Akses &amp; Demo:</span>
          </div>
          <p className="text-[11px] text-emerald-800/80">
            Perpanjangan trial tidak diizinkan. Untuk membuka kembali akses pelayanan, silakan konfirmasi pembayaran paket langganan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleSimulatePayment}
            size="sm"
            className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl gap-1.5 shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Simulasi Pembayaran Lunas (Buka Akses)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
