'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Tenant, FaskesType, TenantStatus } from '@/types/rme';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  ArrowRightLeft,
  Edit2,
  Trash2,
  Sparkles,
  ShieldCheck,
  Globe,
  Users,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function SaasTenantsPage() {
  const {
    tenants,
    activeTenant,
    switchTenant,
    addTenant,
    updateTenant,
    deleteTenant,
    plans,
  } = useRME();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    faskesCode: '',
    faskesType: 'KLINIK_PRATAMA' as FaskesType,
    planId: 'pro' as 'starter' | 'pro' | 'enterprise',
    status: 'ACTIVE' as TenantStatus,
    doctorInCharge: '',
    sip: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    maxDoctors: 5,
    maxUsers: 15,
    satusehatIntegrated: true,
    bpjsIntegrated: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const openAddModal = () => {
    setEditingTenant(null);
    setFormData({
      name: '',
      slug: '',
      faskesCode: `FSK-${Math.floor(100 + Math.random() * 900)}`,
      faskesType: 'KLINIK_PRATAMA',
      planId: 'pro',
      status: 'ACTIVE',
      doctorInCharge: '',
      sip: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      maxDoctors: 5,
      maxUsers: 15,
      satusehatIntegrated: true,
      bpjsIntegrated: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setFormData({
      name: t.name,
      slug: t.slug,
      faskesCode: t.faskesCode,
      faskesType: t.faskesType,
      planId: t.planId,
      status: t.status,
      doctorInCharge: t.doctorInCharge,
      sip: t.sip,
      phone: t.phone,
      email: t.email,
      address: t.address,
      city: t.city,
      maxDoctors: t.maxDoctors,
      maxUsers: t.maxUsers,
      satusehatIntegrated: t.satusehatIntegrated,
      bpjsIntegrated: t.bpjsIntegrated,
      expiresAt: t.expiresAt.split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const slug =
      formData.slug.trim() ||
      formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    if (editingTenant) {
      updateTenant(editingTenant.id, {
        ...formData,
        slug,
      });
    } else {
      addTenant({
        ...formData,
        slug,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data tenant faskes "${name}"?`)) {
      deleteTenant(id);
    }
  };

  // Filtering
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.faskesCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.doctorInCharge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'ALL' || t.faskesType === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getFaskesTypeBadge = (type: FaskesType) => {
    switch (type) {
      case 'PRAKTIK_MANDIRI_DOKTER':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Dokter Solo</Badge>;
      case 'PRAKTIK_MANDIRI_BIDAN':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">Bidan Solo</Badge>;
      case 'KLINIK_PRATAMA':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Klinik Pratama</Badge>;
      case 'KLINIK_UTAMA':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Klinik Utama</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: TenantStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Aktif</span>
          </Badge>
        );
      case 'TRIAL':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 gap-1">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Uji Coba</span>
          </Badge>
        );
      case 'SUSPENDED':
        return (
          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-200 gap-1">
            <Ban className="h-3 w-3 text-rose-600" />
            <span>Ditangguhkan</span>
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200 gap-1">
            <AlertCircle className="h-3 w-3 text-slate-500" />
            <span>Kedaluwarsa</span>
          </Badge>
        );
    }
  };

  const getPlanBadge = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Starter Solo</span>;
      case 'pro':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">Pro Pratama</span>;
      case 'enterprise':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">Enterprise</span>;
      default:
        return <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">{planId}</span>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900">Manajemen Tenant Faskes</h1>
            </div>
            <p className="text-sm text-slate-500">
              Kelola seluruh entitas klinik dan faskes yang terdaftar dalam ekosistem SaaS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/saas/plans">
              <Button variant="outline" className="border-slate-200 text-slate-700 gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Lihat Paket</span>
              </Button>
            </Link>
            <Button
              onClick={openAddModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Faskes</span>
            </Button>
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Faskes</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{tenants.length}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Terdaftar di sistem
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Faskes Aktif</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {tenants.filter((t) => t.status === 'ACTIVE').length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Langganan berjalan</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Masa Trial</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {tenants.filter((t) => t.status === 'TRIAL').length}
            </p>
            <p className="text-[11px] text-amber-600 mt-0.5">Uji coba 30 hari</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Pasien Terkelola</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {tenants.reduce((acc, t) => acc + t.patientCount, 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Data pasien tersinkron</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari faskes berdasarkan nama, kode, dokter PJ, atau kota..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="ALL">Semua Jenis Faskes</option>
                <option value="PRAKTIK_MANDIRI_DOKTER">Klinik Dokter</option>
                <option value="PRAKTIK_MANDIRI_BIDAN">Klinik Bidan</option>
                <option value="KLINIK_PRATAMA">Klinik Pratama</option>
                <option value="KLINIK_UTAMA">Klinik Utama</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="TRIAL">Uji Coba (Trial)</option>
                <option value="SUSPENDED">Ditangguhkan</option>
                <option value="EXPIRED">Kedaluwarsa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tenant Cards List */}
        <div className="space-y-4">
          {filteredTenants.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">Tidak ada faskes ditemukan</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian atau filter status untuk menemukan faskes yang dicari.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('ALL');
                  setSelectedStatus('ALL');
                }}
                variant="outline"
                className="mt-4 text-xs"
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            filteredTenants.map((tenant) => {
              const isActiveCurrent = tenant.id === activeTenant?.id;

              return (
                <div
                  key={tenant.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                    isActiveCurrent
                      ? 'border-emerald-400 ring-2 ring-emerald-500/10'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info Faskes */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 shadow-inner ${
                            isActiveCurrent
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tenant.name.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900">{tenant.name}</h2>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {tenant.faskesCode}
                            </span>
                            {getFaskesTypeBadge(tenant.faskesType)}
                            {getStatusBadge(tenant.status)}
                            {isActiveCurrent && (
                              <Badge className="bg-emerald-500 text-white border-0 text-[10px] uppercase font-extrabold tracking-wider">
                                Faskes Aktif
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                              <strong className="text-slate-700">PJ:</strong> {tenant.doctorInCharge} (SIP: {tenant.sip || '-'})
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {tenant.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {tenant.phone}
                            </span>
                          </div>

                          {/* Integrasi tags */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] text-slate-400">Integrasi:</span>
                            {tenant.satusehatIntegrated ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <ShieldCheck className="h-3 w-3 text-emerald-600" /> SATUSEHAT Kemenkes
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                Non-SATUSEHAT
                              </span>
                            )}
                            {tenant.bpjsIntegrated && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                <Globe className="h-3 w-3 text-teal-600" /> BPJS PCare
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Plan, Quota & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 border-t lg:border-t-0 pt-4 lg:pt-0">
                        {/* Quota indicators */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <p className="text-slate-400">Paket</p>
                            <div className="mt-0.5">{getPlanBadge(tenant.planId)}</div>
                          </div>
                          <div className="h-8 w-px bg-slate-200" />
                          <div>
                            <p className="text-slate-400">Pasien</p>
                            <p className="font-semibold text-slate-800 mt-0.5">
                              {tenant.patientCount.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="h-8 w-px bg-slate-200" />
                          <div>
                            <p className="text-slate-400">Pengguna</p>
                            <p className="font-semibold text-slate-800 mt-0.5">
                              {tenant.userCount} / {tenant.maxUsers}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => switchTenant(tenant.id)}
                            disabled={isActiveCurrent}
                            size="sm"
                            variant={isActiveCurrent ? 'outline' : 'default'}
                            className={`gap-1.5 text-xs font-semibold ${
                              isActiveCurrent
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            <span>{isActiveCurrent ? 'Sedang Aktif' : 'Beralih Faskes'}</span>
                          </Button>

                          <Button
                            onClick={() => openEditModal(tenant)}
                            size="sm"
                            variant="outline"
                            className="border-slate-200 text-slate-700 hover:bg-slate-50"
                            title="Edit Faskes"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            onClick={() => handleDelete(tenant.id, tenant.name)}
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Faskes"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Tambah / Edit Tenant */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {editingTenant ? 'Edit Data Faskes' : 'Tambah Faskes / Tenant Baru'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Konfigurasi identitas faskes, kuota, dan izin akses langganan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Faskes */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nama Faskes *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Klinik Pratama Sehat Bersama"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Kode Faskes */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Kode Faskes *</label>
                    <input
                      type="text"
                      required
                      value={formData.faskesCode}
                      onChange={(e) => setFormData({ ...formData, faskesCode: e.target.value })}
                      placeholder="Contoh: FSK-001"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Jenis Faskes */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Jenis Faskes *</label>
                    <select
                      value={formData.faskesType}
                      onChange={(e) => setFormData({ ...formData, faskesType: e.target.value as FaskesType })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="PRAKTIK_MANDIRI_DOKTER">Klinik Dokter</option>
                      <option value="PRAKTIK_MANDIRI_BIDAN">Klinik Bidan</option>
                      <option value="KLINIK_PRATAMA">Klinik Pratama</option>
                      <option value="KLINIK_UTAMA">Klinik Utama</option>
                    </select>
                  </div>

                  {/* Paket Langganan */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Paket Langganan *</label>
                    <select
                      value={formData.planId}
                      onChange={(e) => setFormData({ ...formData, planId: e.target.value as any })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - Rp {(p.priceMonthly / 1000).toFixed(0)}k/bln
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Status Langganan *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TenantStatus })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="ACTIVE">Aktif (Active)</option>
                      <option value="TRIAL">Uji Coba (Trial)</option>
                      <option value="SUSPENDED">Ditangguhkan (Suspended)</option>
                      <option value="EXPIRED">Kedaluwarsa (Expired)</option>
                    </select>
                  </div>

                  {/* Dokter PJ */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Dokter Penanggung Jawab *</label>
                    <input
                      type="text"
                      required
                      value={formData.doctorInCharge}
                      onChange={(e) => setFormData({ ...formData, doctorInCharge: e.target.value })}
                      placeholder="dr. John Doe, Sp.A"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* SIP */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nomor SIP</label>
                    <input
                      type="text"
                      value={formData.sip}
                      onChange={(e) => setFormData({ ...formData, sip: e.target.value })}
                      placeholder="SIP/091/DINKES/2024"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Telepon */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nomor Telepon</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0812-3456-7890"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Email Faskes</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="klinik@example.com"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Kota */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Surabaya"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Tanggal Kedaluwarsa */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Berlaku Hingga</label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Alamat Lengkap */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Alamat Lengkap</label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Jl. Raya Kesehatan No. 123..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Toggle Integrasi */}
                  <div className="md:col-span-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.satusehatIntegrated}
                        onChange={(e) => setFormData({ ...formData, satusehatIntegrated: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Integrasi SATUSEHAT Kemenkes
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.bpjsIntegrated}
                        onChange={(e) => setFormData({ ...formData, bpjsIntegrated: e.target.checked })}
                        className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Integrasi BPJS PCare Bridging
                      </span>
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="border-slate-200"
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {editingTenant ? 'Simpan Perubahan' : 'Daftarkan Faskes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
