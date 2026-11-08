'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Stethoscope,
  Users,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsModePage() {
  const { config, setAppMode, setCurrentRole, resetToDefault } = useRME();

  const handleResetData = () => {
    if (confirm('Yakin ingin membersihkan seluruh data transaksi (kunjungan, antrian, rekam medis, dan pasien)? Master obat dan tindakan tetap tersimpan.')) {
      resetToDefault();
      toast.success('Seluruh data transaksi berhasil dibersihkan (Clear Data)!');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Mode Operasional & Role Based Access (RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Pilihan skenario operasional klinik: Klinik Mandiri Tunggal (Dokter Saja) atau Klinik Kolaborasi (Dokter + Admin / Kasir).
          </p>
        </div>

        {/* Mode Scenario Cards */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MODE 1: DOKTER SAJA */}
            <Card
              onClick={() => {
                setAppMode('DOCTOR_ONLY');
                toast.success('Mode Operasional diubah ke: Mode 1 (Dokter Saja - Solo Practice)');
              }}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative ${
                config.appMode === 'DOCTOR_ONLY'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      MODE 1: DOKTER SAJA
                    </h3>
                    <p className="text-[11px] text-slate-400">Klinik Mandiri Solo</p>
                  </div>
                </div>

                {config.appMode === 'DOCTOR_ONLY' ? (
                  <Badge className="bg-emerald-700 text-white gap-1 text-[10px] font-bold">
                    <Check className="h-3 w-3" /> Aktif
                  </Badge>
                ) : (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    Pilih Mode <ArrowRight className="h-3 w-3" />
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Dokter mengelola seluruh alur pelayanan secara mandiri (Pendaftaran $\rightarrow$ Pemeriksaan $\rightarrow$ E-Resep & Tindakan $\rightarrow$ Billing & Kasir).
              </p>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="font-bold text-slate-700">Fitur Aktif:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                  <li>Alur satu jendela untuk efisiensi dokter mandiri tanpa staf.</li>
                  <li>Akses menu komplit: Antrian, Rekam Medis, Kasir, dan Laporan.</li>
                </ul>
              </div>
            </Card>

            {/* MODE 2: DOKTER + ADMIN */}
            <Card
              onClick={() => {
                setAppMode('DOCTOR_AND_ADMIN');
                toast.success('Mode Operasional diubah ke: Mode 2 (Dokter + Admin / Kolaborasi)');
              }}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative ${
                config.appMode === 'DOCTOR_AND_ADMIN'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      MODE 2: DOKTER + ADMIN
                    </h3>
                    <p className="text-[11px] text-slate-400">Praktik Kolaborasi Faskes</p>
                  </div>
                </div>

                {config.appMode === 'DOCTOR_AND_ADMIN' ? (
                  <Badge className="bg-emerald-700 text-white gap-1 text-[10px] font-bold">
                    <Check className="h-3 w-3" /> Aktif
                  </Badge>
                ) : (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    Pilih Mode <ArrowRight className="h-3 w-3" />
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Pemisahan hak akses: Petugas Front Office/Admin mengelola pendaftaran, antrian, dan kasir billing. Dokter berfokus pada rekam medis klinis.
              </p>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="font-bold text-slate-700">Fitur Aktif:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                  <li>Pemisahan tugas (*separation of duties*) antara dokter dan kasir.</li>
                  <li>Role switcher cepat di bilah navigasi header atas.</li>
                </ul>
              </div>
            </Card>
          </div>

          {/* Active Role Selector in Mode 2 */}
          {config.appMode === 'DOCTOR_AND_ADMIN' && (
            <Card className="p-5 border border-slate-200 bg-white rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Pilih Role Aktif Simulasi Saat Ini:
                  </h4>
                  <p className="text-xs text-slate-400">
                    Beralih peran tampilan antarmuka antara Dokter Pemeriksa dan Admin Kasir
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">
                  Sedang Aktif: {config.currentRole === 'DOCTOR' ? 'Dokter' : 'Admin'}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Button
                  type="button"
                  variant={config.currentRole === 'DOCTOR' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCurrentRole('DOCTOR');
                    toast.success(`Role aktif diubah: Dokter ${config.doctorName ? `(${config.doctorName})` : ''}`);
                  }}
                  className="text-xs gap-2 rounded-xl font-bold"
                >
                  <Stethoscope className="h-4 w-4" />
                  <span>Role: Dokter {config.doctorName ? `(${config.doctorName})` : ''}</span>
                </Button>

                <Button
                  type="button"
                  variant={config.currentRole === 'ADMIN' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCurrentRole('ADMIN');
                    toast.success('Role aktif diubah: Admin / Kasir');
                  }}
                  className="text-xs gap-2 rounded-xl font-bold"
                >
                  <Shield className="h-4 w-4" />
                  <span>Role: Admin / Kasir</span>
                </Button>
              </div>
            </Card>
          )}

          {/* Reset Database Card */}
          <Card className="border border-rose-200 bg-rose-50/50 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-rose-600" />
                Bersihkan Seluruh Data Transaksi (Clear All Data)
              </h4>
              <p className="text-xs text-rose-700">
                Menghapus seluruh data pasien, antrian kunjungan, rekam medis SOAP, dan log transaksi. Master obat dan tarif tetap aman.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetData}
              className="text-xs gap-1.5 rounded-xl font-bold shrink-0 shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Bersihkan Seluruh Data</span>
            </Button>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
