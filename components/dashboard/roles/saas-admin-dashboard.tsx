'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRME } from '@/context/rme-context';
import { Tenant, SaaSInvoice, SubscriptionPlan } from '@/types/rme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
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
  Search,
  Filter,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Eye,
  Check,
  CalendarCheck,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export function SaasAdminDashboard() {
  const router = useRouter();
  const {
    tenants,
    activeTenant,
    switchTenant,
    saasInvoices,
    plans,
    currentUser,
    updateTenant,
    updateSaaSInvoiceStatus,
  } = useRME();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'NEW' | 'ACTIVE' | 'TRIAL' | 'EXPIRING'>('ALL');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('ALL');

  // Selected Tenant for Quick Modal Detail / Extension
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendMonths, setExtendMonths] = useState<number>(12);

  // Helper: check if a tenant subscribed recently (e.g. within 30 days)
  const isNewSubscriber = (tenant: Tenant) => {
    if (!tenant.createdAt) return false;
    const createdDate = new Date(tenant.createdAt).getTime();
    const now = Date.now();
    const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  };

  // Helper: check if expiring soon (less than 60 days)
  const isExpiringSoon = (tenant: Tenant) => {
    if (!tenant.expiresAt) return false;
    const expiresDate = new Date(tenant.expiresAt).getTime();
    const now = Date.now();
    const diffDays = (expiresDate - now) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 60;
  };

  // Helper: days remaining
  const getDaysRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Aggregated Metrics
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;
  const newSubscribersList = tenants.filter(isNewSubscriber);
  const newSubscribersCount = newSubscribersList.length;
  const trialTenants = tenants.filter((t) => t.status === 'TRIAL').length;
  const expiringSoonCount = tenants.filter(isExpiringSoon).length;

  const totalPatientsAll = tenants.reduce((acc, t) => acc + (t.patientCount || 0), 0);
  const totalUsersAll = tenants.reduce((acc, t) => acc + (t.userCount || 0), 0);

  // Financial Metrics
  const totalPaidRevenue = saasInvoices
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

  // Filtered Tenants List
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      // Tab filter
      if (activeTab === 'NEW' && !isNewSubscriber(t)) return false;
      if (activeTab === 'ACTIVE' && t.status !== 'ACTIVE') return false;
      if (activeTab === 'TRIAL' && t.status !== 'TRIAL') return false;
      if (activeTab === 'EXPIRING' && !isExpiringSoon(t)) return false;

      // Plan filter
      if (selectedPlanFilter !== 'ALL' && t.planId !== selectedPlanFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchCode = t.faskesCode.toLowerCase().includes(q);
        const matchDoctor = t.doctorInCharge?.toLowerCase().includes(q) || false;
        const matchCity = t.city?.toLowerCase().includes(q) || false;
        return matchName || matchCode || matchDoctor || matchCity;
      }

      return true;
    });
  }, [tenants, activeTab, selectedPlanFilter, searchQuery]);

  // Handle Quick Extend
  const handleConfirmExtension = () => {
    if (!selectedTenant) return;
    const currentExpiry = new Date(selectedTenant.expiresAt).getTime();
    const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const newExpiry = new Date(baseTime + extendMonths * 30 * 24 * 60 * 60 * 1000).toISOString();

    updateTenant(selectedTenant.id, {
      expiresAt: newExpiry,
      status: 'ACTIVE',
    });

    toast.success(`Masa langganan ${selectedTenant.name} diperpanjang +${extendMonths} bulan!`);
    setIsExtendModalOpen(false);
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* 1. HERO BANNER: Provider Command Center */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 75%, #6366f1 100%)' }}
      >
        {/* Glow / Orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-black text-indigo-100 backdrop-blur-md">
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                <span>Pusat Kendali &amp; Monitoring Penyedia Sistem RME</span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Operasional Normal
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Monitoring Pelanggan &amp; Faskes Terdaftar
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/80 max-w-2xl leading-relaxed">
              Pantau seluruh faskes yang sedang berlangganan, tenant yang baru bergabung, utilisasi kuota dokter &amp; rekam medis, serta kesehatan infrastruktur platform SaaS secara real-time.
            </p>

            {/* Quick Stats Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-xs">
                <Building2 className="h-3.5 w-3.5 text-indigo-300" />
                <span>{activeTenants} Faskes Berlangganan Aktif</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-200 flex items-center gap-1.5 backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                <span>+{newSubscribersCount} Faskes Baru (30 Hari)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-300/30 text-xs font-bold text-amber-200 flex items-center gap-1.5 backdrop-blur-xs">
                <DollarSign className="h-3.5 w-3.5 text-amber-300" />
                <span>Total Omzet: {formatRupiah(totalPaidRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <Link href="/saas/tenants">
              <Button className="h-10 bg-white hover:bg-indigo-50 text-indigo-900 font-bold text-xs rounded-xl gap-2 shadow-lg cursor-pointer border-0 w-full">
                <Plus className="h-4 w-4" />
                <span>Daftarkan Faskes Baru</span>
              </Button>
            </Link>
            <Link href="/saas/billing">
              <Button
                variant="outline"
                className="h-10 border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl gap-2 cursor-pointer w-full"
              >
                <Receipt className="h-4 w-4" />
                <span>Kelola Tagihan &amp; Faktur</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Subscribers */}
        <Card className="p-5 border border-slate-200/90 bg-white shadow-xs rounded-2xl space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Faskes Berlangganan
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalTenants}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{activeTenants} aktif ({Math.round((activeTenants / totalTenants) * 100 || 0)}% retensi)</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Baru Berlangganan */}
        <Card className="p-5 border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40 shadow-xs rounded-2xl space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Baru Berlangganan (30 Hari)
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-950">
              {newSubscribersCount} Faskes
            </div>
            <div className="text-[11px] font-medium text-emerald-700 mt-0.5">
              Klinik &amp; Praktik yang baru bergabung bulan ini
            </div>
          </div>
        </Card>

        {/* Card 3: Revenue / MRR */}
        <Card className="p-5 border border-slate-200/90 bg-white shadow-xs rounded-2xl space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pendapatan Langganan (Lunas)
            </span>
            <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {formatRupiah(totalPaidRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Pending tagihan: <strong className="text-amber-600 font-mono">{formatRupiah(pendingRevenue)}</strong>
            </div>
          </div>
        </Card>

        {/* Card 4: Total Patients / Quota */}
        <Card className="p-5 border border-slate-200/90 bg-white shadow-xs rounded-2xl space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pasien Terlayani
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalPatientsAll.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {totalUsersAll} Pengguna klinis terdaftar di sistem
            </div>
          </div>
        </Card>
      </div>

      {/* 3. CORE MONITORING SECTION: SUBSCRIBER MANAGEMENT */}
      <Card className="border border-slate-200/90 bg-white shadow-xs rounded-2xl overflow-hidden">
        {/* Section Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-700" />
                <span>Monitoring Faskes yang Berlangganan &amp; Baru Berlangganan</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian status paket berlangganan, tanggal aktif, sisa masa berlaku, dan kuota faskes mitra.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/saas/tenants">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold gap-1.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Kelola Database Faskes</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Filter Tabs & Search Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'ALL'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Faskes ({totalTenants})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('NEW')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'NEW'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Baru Berlangganan ({newSubscribersCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'ACTIVE'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Langganan Aktif ({activeTenants})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('EXPIRING')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'EXPIRING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Segera Berakhir ({expiringSoonCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('TRIAL')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'TRIAL'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Masa Evaluasi ({trialTenants})
              </button>
            </div>

            {/* Search & Plan Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari faskes, kode, kota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>

              <select
                value={selectedPlanFilter}
                onChange={(e) => setSelectedPlanFilter(e.target.value)}
                className="h-9 px-2.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">Semua Paket</option>
                <option value="starter">Paket Starter</option>
                <option value="pro">Paket Pro</option>
                <option value="enterprise">Paket Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table of Subscribers */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Nama Faskes &amp; Identitas</th>
                <th className="py-3.5 px-4">Status &amp; Badge</th>
                <th className="py-3.5 px-4">Paket Berlangganan</th>
                <th className="py-3.5 px-4">Penanggung Jawab / Dokter</th>
                <th className="py-3.5 px-4">Masa Aktif &amp; Sisa Hari</th>
                <th className="py-3.5 px-4">Utilisasi Kuota</th>
                <th className="py-3.5 px-4">Integrasi</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <p className="font-bold text-slate-700">Tidak ada data faskes yang sesuai kriteria filter.</p>
                      <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau tab filter di atas.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const isNew = isNewSubscriber(t);
                  const isExpiring = isExpiringSoon(t);
                  const daysLeft = getDaysRemaining(t.expiresAt);
                  const isActive = t.status === 'ACTIVE';
                  const isCurrentActive = activeTenant?.id === t.id;

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isNew ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Faskes Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                              isNew
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{t.name}</span>
                              {isCurrentActive && (
                                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[9px] font-bold">
                                  Tenant Terpilih
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-bold text-indigo-700">{t.faskesCode}</span>
                              <span>•</span>
                              <span>{t.city || 'Indonesia'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status & Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {isNew && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs animate-pulse">
                              <Sparkles className="h-3 w-3" />
                              <span>Baru Berlangganan</span>
                            </span>
                          )}

                          {isActive ? (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                              ✓ Langganan Aktif
                            </Badge>
                          ) : t.status === 'TRIAL' ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold">
                              ⏳ Masa Evaluasi
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] font-bold">
                              Nonaktif / Suspended
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 capitalize">
                          {t.planId === 'pro'
                            ? 'Pro Pratama'
                            : t.planId === 'enterprise'
                            ? 'Enterprise Utama'
                            : 'Starter Dokter'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {t.planId === 'pro'
                            ? 'Rp 499.000 /bln'
                            : t.planId === 'enterprise'
                            ? 'Rp 1.299.000 /bln'
                            : 'Rp 149.000 /bln'}
                        </div>
                      </td>

                      {/* Doctor in charge */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 truncate max-w-[180px]">
                          {t.doctorInCharge || '-'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate max-w-[180px]">
                          {t.phone || t.email}
                        </div>
                      </td>

                      {/* Validity & Countdown */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-bold text-slate-900">
                          <CalendarCheck className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {new Date(t.expiresAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {isExpiring ? (
                            <span className="font-bold text-rose-600">
                              ⚠️ Sisa {daysLeft} hari (Perpanjang!)
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold font-mono">
                              {daysLeft} hari tersisa
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quota utilization */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-700">
                          Dokter: <strong>{t.maxDoctors} Kuota</strong>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Pasien: <strong>{(t.patientCount || 0).toLocaleString()}</strong>
                        </div>
                      </td>

                      {/* Integrations */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold ${
                              t.satusehatIntegrated
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                          >
                            SATUSEHAT
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold ${
                              t.bpjsIntegrated
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                          >
                            BPJS
                          </Badge>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => {
                              setSelectedTenant(t);
                              setIsExtendModalOpen(true);
                            }}
                            size="sm"
                            className="h-7 px-2 text-[11px] font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg shadow-2xs cursor-pointer"
                            title="Perpanjang masa aktif langganan faskes ini"
                          >
                            <Calendar className="h-3 w-3" />
                            <span>Perpanjang</span>
                          </Button>

                          <Button
                            onClick={() => {
                              setSelectedTenant(t);
                              setIsDetailModalOpen(true);
                            }}
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Lihat rincian lengkap faskes"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>

                          {!isCurrentActive && (
                            <Button
                              onClick={() => {
                                switchTenant(t.id);
                                toast.success(`Beralih ke konteks faskes: ${t.name}`);
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-7 px-1.5 text-[11px] text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer"
                              title="Inspeksi faskes ini (Set sebagai tenant aktif)"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. RECENT ACTIVITY & PLAN DISTRIBUTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Event Stream */}
        <Card className="lg:col-span-2 p-6 border border-slate-200/90 bg-white shadow-xs rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Aktivitas Berlangganan &amp; Transaksi Pelanggan Terkini
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">Live Audit Stream</span>
          </div>

          <div className="space-y-3">
            {saasInvoices.slice(0, 5).map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{inv.tenantName}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {inv.planName} • No: {inv.invoiceNumber}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-900 font-mono">{formatRupiah(inv.amount)}</div>
                  <Badge
                    className={`text-[9px] font-bold mt-0.5 ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {inv.status === 'PAID' ? '✓ Lunas' : 'Menunggu Bayar'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/saas/billing"
              className="text-xs font-bold text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Seluruh Riwayat Faktur &amp; Penagihan Platform</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        {/* Right 1 Col: Platform Health & Tier Breakdown */}
        <div className="space-y-6">
          <Card className="p-6 border border-slate-200/90 bg-white shadow-xs rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="h-4 w-4 text-indigo-700" />
              <h3 className="text-sm font-bold text-slate-900">Distribusi Paket Pelanggan</h3>
            </div>

            <div className="space-y-3">
              {plans.map((p) => {
                const count = tenants.filter((t) => t.planId === p.id).length;
                const pct = Math.round((count / totalTenants) * 100) || 0;

                return (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{p.name}</span>
                      <span className="text-slate-500 font-mono">
                        {count} Faskes ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/saas/plans"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Kelola Konfigurasi Paket &amp; Harga</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>

          {/* Infrastructure Health */}
          <Card className="p-6 border border-slate-200/90 bg-white shadow-xs rounded-2xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Server className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Status Gateway &amp; Keamanan</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">SatuSehat Kemenkes DTO Bridge</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Terhubung
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">BPJS TrustMark &amp; PCare</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Enkripsi Basis Data Faskes</span>
                <span className="text-indigo-700 font-bold">AES-256 GCM</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* MODAL: EXTEND SUBSCRIPTION */}
      <Dialog open={isExtendModalOpen} onOpenChange={setIsExtendModalOpen}>
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Perpanjang Masa Langganan</h3>
                  <p className="text-[11px] text-slate-500">{selectedTenant?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExtendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status Saat Ini</span>
                <div className="font-bold text-slate-800">
                  Berlaku hingga:{' '}
                  {selectedTenant &&
                    new Date(selectedTenant.expiresAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Pilih Periode Perpanjangan</label>
                <select
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(Number(e.target.value))}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={1}>+1 Bulan (Perpanjangan Bulanan)</option>
                  <option value={3}>+3 Bulan (Per Triwulan)</option>
                  <option value={6}>+6 Bulan (Per Semester)</option>
                  <option value={12}>+12 Bulan (1 Tahun Penuh - Rekomendasi)</option>
                  <option value={24}>+24 Bulan (2 Tahun Penuh)</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-700" />
                  <span>Aktivasi Instan Faskes</span>
                </div>
                <p className="text-[11px] text-emerald-800/80">
                  Status faskes akan langsung dipastikan aktif, membuka seluruh modul pelayanan klinis bagi dokter dan staf faskes.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExtendModalOpen(false)}
                className="text-xs rounded-xl cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmExtension}
                className="text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Konfirmasi Perpanjangan
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* MODAL: DETAIL TENANT */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Rincian Lengkap Faskes Pelanggan</h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedTenant?.faskesCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {selectedTenant && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Nama Faskes</span>
                    <div className="font-bold text-slate-900">{selectedTenant.name}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Paket Berlangganan</span>
                    <div className="font-bold text-indigo-700 uppercase">{selectedTenant.planId}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Dokter Penanggung Jawab</span>
                    <div className="font-bold text-slate-900">{selectedTenant.doctorInCharge || '-'}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{selectedTenant.sip || '-'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Kontak Telepon / Email</span>
                    <div className="font-bold text-slate-900">{selectedTenant.phone || '-'}</div>
                    <div className="text-[10px] text-slate-500 truncate">{selectedTenant.email}</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Alamat Lengkap</span>
                  <div className="text-slate-700 font-medium">
                    {selectedTenant.address}, {selectedTenant.city}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-indigo-700 font-bold">Kuota Dokter</span>
                    <div className="text-base font-black text-indigo-900">{selectedTenant.maxDoctors}</div>
                  </div>
                  <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 font-bold">Pasien Terlayani</span>
                    <div className="text-base font-black text-emerald-900">
                      {(selectedTenant.patientCount || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-100">
                    <span className="text-[10px] text-teal-700 font-bold">Pengguna Aktif</span>
                    <div className="text-base font-black text-teal-900">{selectedTenant.userCount || 1}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setIsExtendModalOpen(true);
                }}
                className="text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl cursor-pointer shadow-xs"
              >
                Perpanjang Langganan
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
