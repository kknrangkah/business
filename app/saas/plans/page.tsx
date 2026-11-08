'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import {
  Sparkles,
  Check,
  Zap,
  Building2,
  Stethoscope,
  Users,
  ShieldCheck,
  Globe,
  ArrowRight,
  HelpCircle,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SaasPlansPage() {
  const router = useRouter();
  const { plans, activeTenant, updateTenant, tenants, subscribeToPlan } = useRME();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSelectPlan = (planId: 'starter' | 'pro' | 'enterprise', planName: string) => {
    const inv = subscribeToPlan(planId, billingCycle);
    if (activeTenant) {
      updateTenant(activeTenant.id, { planId });
    }
    toast.success(`Paket ${planName} Berhasil Dipilih!`, {
      description: `Faktur tagihan ${inv.invoiceNumber} telah diterbitkan. Mengarahkan Anda ke menu Penagihan Pembayaran...`,
      duration: 5000,
    });
    router.push('/saas/billing');
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Paket Langganan Multi-Tenant RME</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Solusi Rekam Medis Cloud untuk Setiap Skala Faskes
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            Mulai dari dokter solo hingga klinik utama multi-cabang. Terintegrasi penuh dengan SATUSEHAT Kemenkes RI dan BPJS Kesehatan PCare.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center border border-slate-200">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Tagihan Bulanan
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                  billingCycle === 'YEARLY'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>Tagihan Tahunan</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-[10px] text-emerald-800 font-extrabold">
                  Hemat 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isPopular = plan.isPopular;
            const isCurrentTenantPlan = activeTenant?.planId === plan.id;
            const price = billingCycle === 'YEARLY' ? plan.priceYearly / 12 : plan.priceMonthly;
            const tenantCountOnPlan = tenants.filter((t) => t.planId === plan.id).length;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between bg-white rounded-3xl border transition-all duration-300 p-6 sm:p-7 ${
                  isPopular
                    ? 'border-emerald-500 shadow-xl ring-2 ring-emerald-500/20 shadow-emerald-500/5'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Popular Pill */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                      <Zap className="h-3 w-3 fill-white" /> Paling Populer
                    </span>
                  </div>
                )}

                <div>
                  {/* Title & Tagline */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{plan.tagline}</p>
                    </div>
                    {isCurrentTenantPlan && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                        Aktif Saat Ini
                      </Badge>
                    )}
                  </div>

                  {/* Price */}
                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                        {formatRupiah(price)}
                      </span>
                      <span className="text-xs font-medium text-slate-500">/ bulan</span>
                    </div>
                    {billingCycle === 'YEARLY' ? (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        Ditagih tahunan {formatRupiah(plan.priceYearly)} / tahun
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">Ditagih setiap bulan, batalkan kapan saja</p>
                    )}
                  </div>

                  {/* Quota Highlights */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 mb-6">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5 text-slate-400" /> Kuota Dokter
                      </span>
                      <span className="font-semibold text-slate-800">
                        {plan.maxDoctors === 999 ? 'Tak Terbatas' : `Maks ${plan.maxDoctors} Dokter`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" /> Staf / Pengguna
                      </span>
                      <span className="font-semibold text-slate-800">
                        {plan.maxUsers === 999 ? 'Tak Terbatas' : `Maks ${plan.maxUsers} Akun`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> Pasien / Bulan
                      </span>
                      <span className="font-semibold text-slate-800">
                        {plan.maxPatientsPerMonth === 99999
                          ? 'Tak Terbatas'
                          : `${plan.maxPatientsPerMonth.toLocaleString('id-ID')} Pasien`}
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 mb-6">
                    <p className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                      Fitur Termasuk:
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                          <div className="mt-0.5 rounded-full bg-emerald-100 text-emerald-700 p-0.5 shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Plan Action CTA */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <Button
                    onClick={() => handleSelectPlan(plan.id, plan.name)}
                    disabled={isCurrentTenantPlan}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm ${
                      isCurrentTenantPlan
                        ? 'bg-slate-100 text-slate-400 cursor-default border border-slate-200'
                        : isPopular
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isCurrentTenantPlan ? 'Paket Faskes Aktif' : `Pilih Paket ${plan.name}`}
                  </Button>
                  <p className="text-center text-[11px] text-slate-400">
                    Digunakan oleh {tenantCountOnPlan} faskes
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Matrix Table */}
        <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Perbandingan Fitur Lengkap Antar Paket</h3>
            <p className="text-xs text-slate-500 mt-1">
              Bandingkan kapabilitas dan batasan teknis antar tingkatan paket langganan SaaS.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700">
                  <th className="py-3 px-4 font-bold text-slate-900">Kapabilitas Modul</th>
                  <th className="py-3 px-4 font-bold text-center">Starter Solo</th>
                  <th className="py-3 px-4 font-bold text-center text-emerald-700">Pro Pratama</th>
                  <th className="py-3 px-4 font-bold text-center">Enterprise Utama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">RME Standar Permenkes RI</td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Bridging SATUSEHAT Kemenkes</td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Bridging BPJS PCare (Antrean & Riwayat)</td>
                  <td className="py-3 px-4 text-center text-slate-300">—</td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Farmasi, Racikan, & Stock Opname</td>
                  <td className="py-3 px-4 text-center text-slate-400">Dasar</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-700">Lengkap</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-700">Multi Gudang</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Kasir & Multi Metode Pembayaran</td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Surat Keterangan Sakit & Sehat Digital</td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Multi-Cabang & Konsolidasi Data</td>
                  <td className="py-3 px-4 text-center text-slate-300">—</td>
                  <td className="py-3 px-4 text-center text-slate-300">—</td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Dukungan Teknis & SLA</td>
                  <td className="py-3 px-4 text-center text-slate-500">Email (Jam Kerja)</td>
                  <td className="py-3 px-4 text-center text-emerald-700 font-semibold">WhatsApp Prioritas</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900">Dedicated 24/7 (SLA 99.9%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SaaS FAQ Section */}
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-900">Pertanyaan yang Sering Diajukan (FAQ)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Seputar model multi-tenant, tagihan, dan kepatuhan regulasi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                Apakah data antar faskes saling terisolasi?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ya. Setiap tenant faskes memiliki identifier unik dan ruang data terisolasi. Rekam medis pasien sebuah faskes tidak dapat diakses faskes lain.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                Bagaimana integrasi dengan SATUSEHAT?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sistem RME kami siap mengirimkan Encounter, Condition, Medication, dan Prosedur ke Kemenkes secara otomatis menggunakan kredensial API masing-masing faskes.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                Bisakah ganti paket sewaktu-waktu?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bisa. Peningkatan paket (upgrade) berlaku instan, dan selisih biaya akan disesuaikan secara prorata pada periode tagihan berjalan.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                Metode pembayaran apa saja yang didukung?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mendukung Virtual Account (BCA, Mandiri, BNI, BRI), QRIS, kartu kredit, dan transfer bank resmi instansi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
