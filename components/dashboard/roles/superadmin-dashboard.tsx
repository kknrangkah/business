'use client';

import React from 'react';
import Link from 'next/link';
import { useRME } from '@/context/rme-context';
import { DashboardStatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatIndonesianDate, formatRupiah } from '@/lib/utils';
import {
  ShieldCheck,
  Users,
  Banknote,
  Globe,
  TrendingUp,
  Stethoscope,
  BarChart3,
  Receipt,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Building2,
  KeyRound,
  FileText,
} from 'lucide-react';

export function SuperadminDashboard() {
  const { config, patients, visits, doctors, users, currentUser } = useRME();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter((v) => v.date === todayStr);

  const completedVisits = todayVisits.filter(
    (v) => v.status === 'COMPLETED' || v.status === 'PAID'
  );

  const paidVisits = todayVisits.filter((v) => v.billing?.status === 'PAID');

  const totalRevenueToday = paidVisits.reduce(
    (acc, v) => acc + (v.billing?.grandTotal || 0),
    0
  );

  const cashRevenue = paidVisits
    .filter((v) => v.billing?.paymentDetails?.method === 'CASH')
    .reduce((acc, v) => acc + (v.billing?.grandTotal || 0), 0);

  const digitalRevenue = totalRevenueToday - cashRevenue;

  return (
    <div className="space-y-6">
      {/* Top Banner: Eksekutif & Manajemen Faskes */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md border border-slate-700/60">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Hak Akses: Super Admin / Direktur Faskes
            </span>
            <span className="text-slate-300 text-xs font-medium">
              {formatIndonesianDate(todayStr, true)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Pusat Kendali Eksekutif & Manajemen Faskes
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Selamat datang, <span className="font-bold text-amber-300">{currentUser?.name || 'Direktur Pengelola'}</span>. Pantau indikator kinerja utama faskes, ringkasan penerimaan kasir, kepatuhan SATUSEHAT Kemenkes RI, dan tata kelola akun sistem.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-center">
          <Link href="/reports">
            <Button className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-xs h-9.5 gap-1.5 rounded-xl cursor-pointer">
              <BarChart3 className="h-4 w-4" />
              <span>Laporan Lengkap Faskes</span>
            </Button>
          </Link>
          <Link href="/settings/users">
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold text-xs h-9.5 gap-1.5 rounded-xl cursor-pointer"
            >
              <KeyRound className="h-4 w-4" />
              <span>Kelola Hak Akses (RBAC)</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Total Pasien Hari Ini"
          value={todayVisits.length}
          subtitle={`${patients.length} Pasien dalam master database`}
          icon={Users}
          colorTheme="blue"
        />
        <DashboardStatCard
          title="Omset Kasir Hari Ini"
          value={formatRupiah(totalRevenueToday)}
          subtitle={`${paidVisits.length} Transaksi pembayaran lunas`}
          icon={Banknote}
          colorTheme="emerald"
        />
        <DashboardStatCard
          title="SATUSEHAT Terintegrasi"
          value="100%"
          subtitle="Encounter & Kondisi Terkirim"
          icon={Globe}
          colorTheme="teal"
          trend={{ value: 'Permenkes 24/2022', isPositive: true }}
        />
        <DashboardStatCard
          title="Tenaga Medis & Staf Aktif"
          value={users.length}
          subtitle={`${doctors.length} Dokter Pemeriksa Poli`}
          icon={Stethoscope}
          colorTheme="purple"
        />
      </div>

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Financial & Clinical Performance Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          {/* Penerimaan Kasir Breakdown */}
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="h-4.5 w-4.5 text-emerald-700" />
                  <span>Ringkasan Penerimaan Kasir Hari Ini</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Breakdown arus kas masuk berdasarkan metode pembayaran.
                </p>
              </div>

              <Badge variant="outline" className="text-xs font-bold border-emerald-200 text-emerald-800 bg-emerald-50">
                Total: {formatRupiah(totalRevenueToday)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-bold text-slate-600">Penerimaan Tunai (Cash)</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{formatRupiah(cashRevenue)}</div>
                <div className="text-[11px] text-slate-400 mt-1">Uang fisik di laci kasir front office</div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/80">
                <div className="text-xs font-bold text-teal-800">Non-Tunai (QRIS & Transfer)</div>
                <div className="text-xl font-black text-teal-950 mt-0.5">{formatRupiah(digitalRevenue)}</div>
                <div className="text-[11px] text-teal-700 mt-1">Langsung masuk ke rekening faskes</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold">
              <span className="text-slate-600">Efisiensi Penyelesaian Tagihan:</span>
              <span className="text-emerald-700 font-bold">
                {todayVisits.length > 0 ? `${Math.round((paidVisits.length / todayVisits.length) * 100)}% Lunas` : '100%'}
              </span>
            </div>
          </Card>

          {/* Kinerja Beban Kerja Dokter Hari Ini */}
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Kinerja Dokter Pemeriksa Poli
              </h3>
              <Link href="/reports/honorarium" className="text-xs font-bold text-indigo-700 hover:underline">
                Lihat Rekapitulasi Honorarium
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {doctors.map((doc) => {
                const docVisits = todayVisits.filter((v) => v.doctorId === doc.id);
                const docFinished = docVisits.filter((v) => v.status === 'COMPLETED' || v.status === 'PAID');

                return (
                  <div key={doc.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center justify-center font-bold">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{doc.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{doc.sip}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900">{docFinished.length} Pasien Selesai</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        Jasa: {formatRupiah(docFinished.length * (config.defaultConsultationFee || 50000))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Compliance & System Governance */}
        <div className="space-y-4">
          {/* Status SATUSEHAT Kemenkes RI */}
          <Card className="p-5 border border-teal-200 bg-teal-50/50 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-700 text-white">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">SATUSEHAT Kemenkes RI</h3>
                <p className="text-[10px] text-slate-500">Integrasi Data Rekam Medis Nasional</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-teal-200 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Status API Faskes:</span>
                <Badge className="bg-emerald-700 text-white text-[10px] font-bold">Terhubung</Badge>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-teal-200 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Sinkronisasi Encounter:</span>
                <span className="font-bold text-teal-900">100% Otomatis</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-teal-200 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Kamus ICD-10 & SNOMED:</span>
                <span className="font-bold text-teal-900">Standar Kemenkes</span>
              </div>
            </div>

            <Link href="/settings/satusehat" className="block pt-1">
              <Button
                variant="outline"
                className="w-full text-xs font-bold text-teal-800 border-teal-300 hover:bg-teal-100/50 rounded-xl h-8.5"
              >
                Konfigurasi Kunci SATUSEHAT
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </Card>

          {/* Quick Management Shortcuts */}
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tata Kelola Faskes
            </h3>

            <div className="space-y-2">
              <Link href="/settings">
                <Button
                  variant="outline"
                  className="w-full h-10 justify-start text-xs font-bold text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl"
                >
                  <Building2 className="h-4 w-4 mr-2 text-indigo-700" />
                  <span>Profil & Legalitas Faskes</span>
                </Button>
              </Link>

              <Link href="/settings/users">
                <Button
                  variant="outline"
                  className="w-full h-10 justify-start text-xs font-bold text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl"
                >
                  <KeyRound className="h-4 w-4 mr-2 text-amber-600" />
                  <span>Hak Akses Petugas & RBAC</span>
                </Button>
              </Link>

              <Link href="/reports/revenue">
                <Button
                  variant="outline"
                  className="w-full h-10 justify-start text-xs font-bold text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl"
                >
                  <TrendingUp className="h-4 w-4 mr-2 text-emerald-700" />
                  <span>Laporan Laba & Pendapatan</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
