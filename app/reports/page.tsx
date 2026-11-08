'use client';

import React from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';
import {
  BarChart3,
  Activity,
  Users,
  Pill,
  Download,
  Receipt,
  Wallet,
  ArrowRight,
  UserCheck,
  Stethoscope,
  TrendingUp,
  CreditCard,
  FileSpreadsheet,
  Sparkles,
  Boxes,
} from 'lucide-react';

export default function ReportsPage() {
  const { visits, patients, doctors, nurses, medications } = useRME();

  // Revenue metrics
  const paidVisits = visits.filter((v) => v.billing?.status === 'PAID' || v.status === 'COMPLETED');
  const totalRevenue = paidVisits.reduce((acc, v) => {
    const consultFee = v.billing?.consultationFee || 75000;
    const procFee = v.billing?.proceduresFee || (v.medicalRecord?.procedures?.reduce((a, p) => a + p.price, 0) || 0);
    const medFee = v.billing?.medicationsFee || (v.medicalRecord?.prescriptions?.reduce((a, p) => a + (p.price * p.quantity), 0) || 0);
    return acc + (v.billing?.grandTotal || (consultFee + procFee + medFee));
  }, 0);
  const avgRevenuePerVisit = paidVisits.length > 0 ? Math.round(totalRevenue / paidVisits.length) : 0;

  // 10 Besar Penyakit (Top ICD-10 Diagnoses)
  const diagnosisCounts: Record<string, { code: string; name: string; count: number }> = {};
  visits.forEach((v) => {
    v.medicalRecord?.diagnoses?.forEach((d) => {
      if (!diagnosisCounts[d.code]) {
        diagnosisCounts[d.code] = { code: d.code, name: d.name, count: 0 };
      }
      diagnosisCounts[d.code].count += 1;
    });
  });

  const topDiagnoses = Object.values(diagnosisCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalDiagnosisCount = topDiagnoses.reduce((acc, d) => acc + d.count, 0);

  // Top Medications Dispensed
  const medicationCounts: Record<string, { name: string; count: number; unit: string }> = {};
  visits.forEach((v) => {
    v.medicalRecord?.prescriptions?.forEach((rx) => {
      if (!medicationCounts[rx.name]) {
        medicationCounts[rx.name] = { name: rx.name, count: 0, unit: rx.unit };
      }
      medicationCounts[rx.name].count += rx.quantity;
    });
  });

  const topMedications = Object.values(medicationCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Demographics
  const maleCount = patients.filter((p) => p.gender === 'L').length;
  const femaleCount = patients.filter((p) => p.gender === 'P').length;

  return (
    <MainLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-emerald-700" />
              <span>Menu Laporan & Statistik Klinik</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pusat pelaporan klinik: laporan kunjungan, laporan pendapatan kasir, dan laporan honorer dokter serta perawat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs bg-white shadow-2xs rounded-xl font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-emerald-700" />
              <span>Ekspor / Cetak Ringkasan</span>
            </Button>
          </div>
        </div>

        {/* 4 Sub-Menu Portal Cards (Laporan Kunjungan, Laporan Pendapatan, Laporan Honorer, Stock Opname) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Laporan Kunjungan */}
          <Link
            href="/reports/visits"
            className="group block p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500/80 hover:shadow-lg transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-mono font-bold text-xs">
                {visits.length} Kunjungan
              </Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
              <span>Laporan Kunjungan</span>
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-700" />
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
              Riwayat kedatangan pasien, status antrian & pemeriksaan, cara bayar (BPJS/Umum), serta filter tanggal.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Buka Laporan Kunjungan</span>
              <span className="font-mono text-[11px] text-slate-400 font-normal">/reports/visits</span>
            </div>
          </Link>

          {/* Card 2: Laporan Pendapatan */}
          <Link
            href="/reports/revenue"
            className="group block p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-500/80 hover:shadow-lg transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shadow-xs">
                <Receipt className="h-5 w-5" />
              </div>
              <Badge className="bg-teal-50 text-teal-800 border-teal-200 font-mono font-bold text-xs">
                {paidVisits.length} Lunas
              </Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center gap-1.5">
              <span>Laporan Pendapatan</span>
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-teal-700" />
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
              Arus kas pemasukan klinik: rincian jasa konsultasi dokter, tindakan medis, resep obat, dan metode bayar.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
              <span>Buka Laporan Pendapatan</span>
              <span className="font-mono text-[11px] text-slate-400 font-normal">/reports/revenue</span>
            </div>
          </Link>

          {/* Card 3: Laporan Honorer Dokter & Perawat */}
          <Link
            href="/reports/honorarium"
            className="group block p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-500/80 hover:shadow-lg transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shadow-xs">
                <Wallet className="h-5 w-5" />
              </div>
              <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 font-bold text-xs">
                {doctors.length} Dr • {nurses.length} Prw
              </Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center gap-1.5">
              <span>Laporan Honorer Dokter & Perawat</span>
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-700" />
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
              Perhitungan jasa medis fee sharing dokter, insentif pelayanan perawat/bidan, dan cetak slip honor.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-700">
              <span>Buka Laporan Honorer</span>
              <span className="font-mono text-[11px] text-slate-400 font-normal">/reports/honorarium</span>
            </div>
          </Link>

          {/* Card 4: Laporan Stock Opname Obat */}
          <Link
            href="/reports/stock-opname"
            className="group block p-5 rounded-2xl border border-slate-200 bg-white hover:border-amber-500/80 hover:shadow-lg transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                <Boxes className="h-5 w-5" />
              </div>
              <Badge className="bg-amber-50 text-amber-800 border-amber-200 font-mono font-bold text-xs">
                {medications.length} Obat Farmasi
              </Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
              <span>Stock Opname Obat</span>
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-amber-700" />
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
              Tarik seluruh master obat, verifikasi stok fisik vs sistem, kalkulasi selisih & nilai rupiah, serta penyesuaian (adjustment).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-700">
              <span>Buka Stock Opname</span>
              <span className="font-mono text-[11px] text-slate-400 font-normal">/reports/stock-opname</span>
            </div>
          </Link>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border border-slate-200 bg-white shadow-2xs border-l-4 border-l-emerald-700 rounded-2xl">
            <div className="text-xs font-bold uppercase text-slate-500">Total Pasien Dilayani</div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{visits.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{patients.length} Pasien unik di database</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-2xs border-l-4 border-l-teal-700 rounded-2xl">
            <div className="text-xs font-bold uppercase text-slate-500">Total Pendapatan Terkumpul</div>
            <div className="text-2xl font-black text-teal-700 mt-1 font-mono">{formatRupiah(totalRevenue)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{paidVisits.length} Transaksi Selesai</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-2xs border-l-4 border-l-emerald-600 rounded-2xl">
            <div className="text-xs font-bold uppercase text-slate-500">Rata-rata Pendapatan / Pasien</div>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">{formatRupiah(avgRevenuePerVisit)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Konsultasi + Tindakan + Obat</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-2xs border-l-4 border-l-purple-600 rounded-2xl">
            <div className="text-xs font-bold uppercase text-slate-500">Pola Demografi Gender</div>
            <div className="text-2xl font-black text-purple-700 mt-1">
              {maleCount}L <span className="text-slate-400 font-normal">/</span> {femaleCount}P
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Laki-laki vs Perempuan</div>
          </Card>
        </div>

        {/* 10 Besar Penyakit (ICD-10) Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top 10 Diseases (8 Cols) */}
          <div className="lg:col-span-8">
            <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden rounded-2xl">
              <CardHeader className="bg-slate-50/80 p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-700" />
                    <span>Laporan 10 Besar Penyakit Terbanyak (Top ICD-10)</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standar pelaporan morbiditas Faskes Primer & Klinik
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-bold bg-white">
                  {topDiagnoses.length} Diagnosa Terdata
                </Badge>
              </CardHeader>

              <div className="p-4 space-y-3">
                {topDiagnoses.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Belum ada diagnosis yang tercatat dalam rekam medis.
                  </div>
                ) : (
                  topDiagnoses.map((d, index) => {
                    const percentage =
                      totalDiagnosisCount > 0 ? Math.round((d.count / totalDiagnosisCount) * 100) : 0;
                    return (
                      <div key={d.code} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-center font-bold text-slate-400 font-mono text-[11px]">
                              #{index + 1}
                            </span>
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                              {d.code}
                            </span>
                            <span className="font-medium text-slate-800">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-slate-900">{d.count} kasus</span>
                            <span className="text-slate-400 text-[10px]">({percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden ml-7 max-w-[calc(100%-1.75rem)]">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Top 5 Medications Dispensed (4 Cols) */}
          <div className="lg:col-span-4">
            <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden rounded-2xl">
              <CardHeader className="bg-slate-50/80 p-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-emerald-700" />
                  <span>Obat Paling Banyak Diresepkan</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Top 5 utilisasi farmasi klinik</p>
              </CardHeader>

              <div className="p-4 space-y-3">
                {topMedications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Belum ada obat yang diresepkan.
                  </div>
                ) : (
                  topMedications.map((m, index) => (
                    <div
                      key={m.name}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 text-center font-bold text-slate-400 font-mono text-xs">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{m.name}</div>
                          <div className="text-[10px] text-slate-400">Satuan: {m.unit}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs font-bold bg-white text-emerald-700 border-emerald-200 shrink-0">
                        {m.count} {m.unit}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
