'use client';

import React from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Receipt,
  Layers,
  Zap,
  Crown,
  Activity,
  BarChart3,
  DollarSign,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SaasOverviewPage() {
  const { tenants, activeTenant, switchTenant, saasInvoices, plans, currentUser } = useRME();

  const isSaasAdmin = currentUser?.role === 'SAAS_ADMIN';

  // Metrics
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;
  const trialTenants = tenants.filter((t) => t.status === 'TRIAL').length;
  const totalPatientsCrossTenants = tenants.reduce((acc, t) => acc + t.patientCount, 0);
  const totalUsersCrossTenants = tenants.reduce((acc, t) => acc + t.userCount, 0);
  
  // Total Revenue from paid invoices
  const totalSaaSRevenue = saasInvoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((acc, inv) => acc + inv.amount, 0);

  const pendingRevenue = saasInvoices
    .filter((inv) => inv.status === 'PENDING')
    .reduce((acc, inv) => acc + inv.amount, 0);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Top Banner Header — Role-Aware */}
        {isSaasAdmin ? (
          /* SAAS_ADMIN: Indigo/Violet Premium Platform Command Center */
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 45%, #7c3aed 100%)' }}>
            {/* Decorative orbs */}
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 left-1/3 w-64 h-64 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-3">
                {/* Platform Identity Badge */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-extrabold text-indigo-200 backdrop-blur-md">
                    <Crown className="h-3.5 w-3.5 text-amber-300" />
                    <span>SaaS Platform Administrator — Level Tertinggi</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  Selamat datang,{' '}
                  <span className="text-indigo-200">{currentUser?.name || 'Admin SaaS'}</span>
                </h1>
                <p className="text-xs sm:text-sm text-indigo-100/80 max-w-2xl leading-relaxed">
                  Anda memiliki akses penuh ke seluruh ekosistem SaaS Multi-Tenant RME —
                  manajemen faskes, paket langganan, penagihan, dan monitoring platform secara global.
                </p>

                {/* Quick Stats Pills */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-indigo-300" />
                    <span>{activeTenants} Faskes Aktif</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-emerald-300" />
                    <span>{trialTenants} Dalam Trial</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-300/30 text-xs font-bold text-amber-200 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-amber-300" />
                    <span>MRR: {formatRupiah(totalSaaSRevenue)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-start gap-2.5 shrink-0">
                <Link href="/saas/tenants">
                  <Button className="h-10 bg-white hover:bg-indigo-50 text-indigo-800 font-bold text-xs rounded-xl gap-2 shadow-lg cursor-pointer border-0 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    <span>Daftarkan Faskes Baru</span>
                  </Button>
                </Link>
                <Link href="/saas/billing">
                  <Button variant="outline" className="h-10 border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl gap-2 cursor-pointer w-full sm:w-auto">
                    <Receipt className="h-4 w-4" />
                    <span>Kelola Tagihan</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Other roles: Standard emerald banner */
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
            <div className="absolute right-0 top-0 h-full w-96 bg-white/5 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-200 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>SaaS Multi-Tenant Control Hub</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Pusat Manajemen Multi-Tenant RME
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
                  Platform terpusat untuk memonitor seluruh Fasilitas Pelayanan Kesehatan (Faskes),
                  klinik jaringan, lisensi aktif, kuota pasien, dan integrasi SatuSehat/BPJS secara real-time.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link href="/saas/tenants">
                  <Button className="h-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl gap-2 shadow-lg cursor-pointer">
                    <Plus className="h-4 w-4" />
                    <span>Daftarkan Faskes Baru</span>
                  </Button>
                </Link>
                <Link href="/saas/plans">
                  <Button variant="outline" className="h-10 border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl gap-2 cursor-pointer">
                    <Layers className="h-4 w-4" />
                    <span>Kelola Paket</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* SAAS_ADMIN exclusive: Platform Health + Revenue Summary row */}
        {isSaasAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200/60 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-indigo-600">Total Faskes</p>
              <p className="text-3xl font-extrabold text-indigo-900 mt-1">{totalTenants}</p>
              <p className="text-[11px] text-indigo-500 mt-0.5">Terdaftar di platform</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-emerald-700">Faskes Aktif</p>
              <p className="text-3xl font-extrabold text-emerald-800 mt-1">{activeTenants}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Langganan berbayar</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-amber-700">Pendapatan Terkonfirmasi</p>
              <p className="text-xl font-extrabold text-amber-900 mt-1">{formatRupiah(totalSaaSRevenue)}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Dari faktur lunas</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/60 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-rose-700">Tagihan Menunggu</p>
              <p className="text-xl font-extrabold text-rose-900 mt-1">{formatRupiah(pendingRevenue)}</p>
              <p className="text-[11px] text-rose-600 mt-0.5">{saasInvoices.filter(i => i.status === 'PENDING').length} faktur belum dibayar</p>
            </div>
          </div>
        )}

        {/* Standard 4 Metric Cards (for non-SAAS_ADMIN or as secondary row for SAAS_ADMIN) */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Faskes Terdaftar</span>
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                <Building2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalTenants}</span>
              <span className="text-xs text-slate-500">Tenant</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-emerald-700">{activeTenants} Aktif</span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">{trialTenants} Trial</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Pasien Terdaftar</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {totalPatientsCrossTenants.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-slate-500">Pasien</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">+18.4%</span>
              <span>pertumbuhan bulan ini</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Tenaga Medis & Staf</span>
              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalUsersCrossTenants}</span>
              <span className="text-xs text-slate-500">Pengguna</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span>Dokter, perawat, apoteker & kasir</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Pendapatan Langganan SaaS</span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                <CreditCard className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {formatRupiah(totalSaaSRevenue)}
              </span>
            </div>
            <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{saasInvoices.filter((i) => i.status === 'PAID').length} Tagihan Lunas</span>
            </div>
          </div>
        </div>

        {/* Current Active Tenant Highlight Card */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-12 w-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Tenant Aktif Saat Ini
                </span>
                <Badge className="bg-emerald-600 text-white border-0 text-[10px] font-bold">
                  {activeTenant?.planId.toUpperCase()} PLAN
                </Badge>
              </div>
              <div className="text-base font-black text-slate-900 truncate">
                {activeTenant?.name}
              </div>
              <p className="text-xs text-slate-500 truncate">
                Kode: <span className="font-mono font-bold text-slate-700">{activeTenant?.faskesCode}</span> • PJ Medis: {activeTenant?.doctorInCharge} • {activeTenant?.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/saas/tenants">
              <Button size="sm" variant="outline" className="h-9 border-emerald-300 text-emerald-900 hover:bg-emerald-100 rounded-xl font-bold text-xs">
                Ganti Faskes Aktif
              </Button>
            </Link>
            <Link href="/settings">
              <Button size="sm" className="h-9 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs gap-1">
                <span>Konfigurasi Faskes</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* List of Tenants Table & Plan Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Recent Tenants (2 Cols) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Daftar Faskes & Tenant Terdaftar</h3>
                <p className="text-xs text-slate-400">Seluruh klinik dan faskes yang berjalan dalam platform</p>
              </div>
              <Link href="/saas/tenants">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 gap-1">
                  <span>Lihat Semua ({tenants.length})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3">Faskes / Klinik</th>
                    <th className="pb-3">Tipe & Paket</th>
                    <th className="pb-3 text-center">Pasien</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((t) => {
                    const isCurrent = t.id === activeTenant?.id;
                    return (
                      <tr key={t.id} className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-emerald-50/40' : ''}`}>
                        <td className="py-3 pr-2">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="truncate max-w-[200px]">{t.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Aktif
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {t.faskesCode} • {t.city}
                          </div>
                        </td>
                        <td className="py-3 pr-2">
                          <div className="font-medium text-slate-700">
                            {t.faskesType.replace(/_/g, ' ')}
                          </div>
                          <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold">
                            {t.planId}
                          </Badge>
                        </td>
                        <td className="py-3 text-center font-bold text-slate-800">
                          {t.patientCount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'TRIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {isCurrent ? (
                            <span className="text-[11px] font-bold text-emerald-700">Sedang Digunakan</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => switchTenant(t.id)}
                              className="h-7 text-[10px] font-bold rounded-lg border-slate-200 hover:border-emerald-600 hover:text-emerald-700"
                            >
                              Ganti
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Plans & Invoices Snippet (1 Col) */}
          <div className="space-y-6">
            {/* Quick Pricing Tier Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Paket Langganan SaaS</h4>
                <Link href="/saas/plans" className="text-xs font-bold text-emerald-700 hover:underline">
                  Detail Paket →
                </Link>
              </div>

              <div className="space-y-2">
                {plans.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.isPopular && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-200 text-amber-900">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Hingga {p.maxDoctors} Dokter • {p.maxUsers} Staf
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">
                        {formatRupiah(p.priceMonthly)}
                      </div>
                      <div className="text-[9px] text-slate-400">/ bulan</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent SaaS Invoices Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Tagihan Langganan Terbaru</h4>
                <Link href="/saas/billing" className="text-xs font-bold text-emerald-700 hover:underline">
                  Lihat Semua →
                </Link>
              </div>

              <div className="space-y-2">
                {saasInvoices.slice(0, 3).map((inv) => (
                  <div key={inv.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-bold text-slate-900 truncate">{inv.tenantName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.invoiceNumber}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-900">{formatRupiah(inv.amount)}</div>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
