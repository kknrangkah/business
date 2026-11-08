'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { SaaSInvoice } from '@/types/rme';
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  Plus,
  Building2,
  ExternalLink,
  Printer,
  X,
  FileText,
  Calendar,
  DollarSign,
  ArrowUpRight,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SaasBillingPage() {
  const router = useRouter();
  const {
    saasInvoices,
    updateSaaSInvoiceStatus,
    deleteSaaSInvoice,
    tenants,
    plans,
    currentUser,
  } = useRME();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Selected Invoice for Detail / Print Receipt
  const [selectedInvoice, setSelectedInvoice] = useState<SaaSInvoice | null>(null);

  // New Invoice Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({
    tenantId: tenants[0]?.id || '',
    planName: 'Pro Pratama',
    amount: 499000,
    billingPeriod: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const isPlatformSuperAdmin =
    currentUser?.email?.toLowerCase() === 'provider@rme.id' ||
    currentUser?.role === 'SAAS_ADMIN';

  // For users who want to subscribe (practice/faskes admin): exclude platform dummy invoices
  // so they have a clean, personalized billing history with ZERO dummy data!
  const relevantInvoices = saasInvoices.filter((inv) => {
    if (isPlatformSuperAdmin) return true;
    // Exclude platform dummy mock invoices
    if (inv.id.startsWith('inv-saas-')) return false;
    return true;
  });

  const totalPaidRevenue = relevantInvoices
    .filter((i) => i.status === 'PAID')
    .reduce((acc, i) => acc + i.amount, 0);

  const totalPendingRevenue = relevantInvoices
    .filter((i) => i.status === 'PENDING')
    .reduce((acc, i) => acc + i.amount, 0);

  const totalOverdueRevenue = relevantInvoices
    .filter((i) => i.status === 'OVERDUE')
    .reduce((acc, i) => acc + i.amount, 0);

  // Filtered
  const filteredInvoices = relevantInvoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.planName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || inv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTenant = tenants.find((t) => t.id === newInvoiceData.tenantId) || tenants[0];
    if (!selectedTenant) return;

    const newInv: SaaSInvoice = {
      id: `inv-${Date.now().toString(36)}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.name,
      planName: newInvoiceData.planName,
      amount: Number(newInvoiceData.amount),
      billingPeriod: newInvoiceData.billingPeriod,
      status: 'PENDING',
      issuedAt: new Date().toISOString().split('T')[0],
      dueDate: newInvoiceData.dueDate,
    };

    // Update in context
    saasInvoices.unshift(newInv);
    try {
      localStorage.setItem('rme_saas_invoices_v3', JSON.stringify([...saasInvoices]));
    } catch {}

    setIsCreateModalOpen(false);
    alert(`Faktur ${newInv.invoiceNumber} berhasil diterbitkan.`);
  };

  const getStatusBadge = (status: SaaSInvoice['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 gap-1 font-bold">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Lunas (Paid)</span>
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 gap-1 font-bold">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Menunggu (Pending)</span>
          </Badge>
        );
      case 'OVERDUE':
        return (
          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-200 gap-1 font-bold">
            <AlertCircle className="h-3 w-3 text-rose-600" />
            <span>Jatuh Tempo (Overdue)</span>
          </Badge>
        );
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Receipt className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                {isPlatformSuperAdmin ? 'Penagihan & Faktur Platform SaaS' : 'Penagihan & Pembayaran Berlangganan'}
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              {isPlatformSuperAdmin
                ? 'Riwayat faktur langganan seluruh faskes, pelacakan pembayaran, dan administrasi billing multi-tenant.'
                : 'Kelola faktur tagihan paket faskes Anda, konfirmasi pembayaran, dan unduh kwitansi resmi.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isPlatformSuperAdmin ? (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Terbitkan Faktur Baru</span>
              </Button>
            ) : (
              <Link
                href="/saas/plans"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Pilih / Ganti Paket</span>
              </Link>
            )}
          </div>
        </div>



        {/* Revenue KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {isPlatformSuperAdmin ? 'Total Pendapatan Terbayar' : 'Tagihan Terbayar (Lunas)'}
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-900">{formatRupiah(totalPaidRevenue)}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                {relevantInvoices.filter((i) => i.status === 'PAID').length} tagihan lunas
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {isPlatformSuperAdmin ? 'Piutang Menunggu (Pending)' : 'Tagihan Menunggu Pembayaran'}
              </span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-900">{formatRupiah(totalPendingRevenue)}</h3>
              <p className="text-[11px] text-amber-600 mt-0.5 font-medium">
                {relevantInvoices.filter((i) => i.status === 'PENDING').length} tagihan belum dibayar
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {isPlatformSuperAdmin ? 'Tagihan Jatuh Tempo (Overdue)' : 'Tagihan Lewat Jatuh Tempo'}
              </span>
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertCircle className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-900">{formatRupiah(totalOverdueRevenue)}</h3>
              <p className="text-[11px] text-rose-600 mt-0.5 font-medium">
                {relevantInvoices.filter((i) => i.status === 'OVERDUE').length} tagihan lewat batas waktu
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Filter & Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari no. faktur atau paket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                <Filter className="h-3.5 w-3.5" /> Filter:
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">Semua Status</option>
                <option value="PAID">Lunas (Paid)</option>
                <option value="PENDING">Menunggu (Pending)</option>
                <option value="OVERDUE">Jatuh Tempo (Overdue)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">No. Faktur</th>
                  <th className="py-3 px-4">Faskes / Tenant</th>
                  <th className="py-3 px-4">Paket & Periode</th>
                  <th className="py-3 px-4">Nominal Tagihan</th>
                  <th className="py-3 px-4">Tanggal Terbit / Jatuh Tempo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                          <Receipt className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-slate-800">
                            {relevantInvoices.length === 0
                              ? 'Belum Ada Riwayat Faktur Tagihan'
                              : 'Tidak Ada Faktur yang Cocok'}
                          </h3>
                          <p className="text-xs text-slate-500 max-w-sm">
                            {relevantInvoices.length === 0
                              ? 'Faskes Anda belum memilih paket langganan. Silakan pilih paket yang sesuai di menu Paket Berlangganan untuk memulai.'
                              : 'Coba ubah kata kunci pencarian atau filter status untuk menemukan faktur.'}
                          </p>
                        </div>
                        {relevantInvoices.length === 0 && (
                          <Link
                            href="/saas/plans"
                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>Pilih Paket Berlangganan</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{inv.tenantName}</div>
                        <div className="text-[10px] text-slate-400">ID: {inv.tenantId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">{inv.planName}</div>
                        <span className="text-[10px] text-slate-500">
                          {inv.billingPeriod === 'MONTHLY' ? 'Bulanan' : 'Tahunan'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {formatRupiah(inv.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>Terbit: {inv.issuedAt}</div>
                        <div className="text-[10px] text-slate-400">Jatuh Tempo: {inv.dueDate}</div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(inv.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {inv.status !== 'PAID' ? (
                            <Button
                              onClick={() => updateSaaSInvoiceStatus(inv.id, 'PAID')}
                              size="sm"
                              className="text-[11px] h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-xs cursor-pointer"
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>Bayar Sekarang (Lunas)</span>
                            </Button>
                          ) : (
                            <Button
                              onClick={() => updateSaaSInvoiceStatus(inv.id, 'PENDING')}
                              size="sm"
                              variant="ghost"
                              className="text-[11px] h-7 text-slate-400 hover:text-amber-600 cursor-pointer"
                            >
                              Reset
                            </Button>
                          )}

                          {/* Delete / Batalkan Button for when user does not proceed with payment */}
                          <Button
                            onClick={() => {
                              if (window.confirm(`Apakah Anda yakin ingin membatalkan dan menghapus faktur ${inv.invoiceNumber}?`)) {
                                deleteSaaSInvoice(inv.id);
                              }
                            }}
                            size="sm"
                            variant="outline"
                            className="text-[11px] h-7 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 gap-1 cursor-pointer"
                            title="Batalkan faktur ini jika tidak jadi bayar"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Batalkan</span>
                          </Button>

                          <Button
                            onClick={() => setSelectedInvoice(inv)}
                            size="sm"
                            variant="outline"
                            className="text-[11px] h-7 border-slate-200 text-slate-700 hover:bg-slate-100 gap-1 cursor-pointer"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Kwitansi</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Detail / Receipt Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
              {/* Receipt Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-400" />
                    <span className="font-extrabold text-sm tracking-wide">
                      RME CLOUD MULTI-TENANT
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Faktur Resmi Langganan Layanan SaaS
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Receipt Body */}
              <div className="p-6 space-y-5 text-xs">
                <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Ditagihkan Kepada</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedInvoice.tenantName}
                    </h4>
                    <p className="text-slate-500 text-[11px]">Tenant ID: {selectedInvoice.tenantId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">No. Faktur</span>
                    <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                      {selectedInvoice.invoiceNumber}
                    </p>
                    <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Tanggal Penerbitan:</span>
                    <span className="font-semibold text-slate-800">{selectedInvoice.issuedAt}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Batas Waktu Pembayaran:</span>
                    <span className="font-semibold text-slate-800">{selectedInvoice.dueDate}</span>
                  </div>
                  {selectedInvoice.paidAt && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Waktu Pelunasan:</span>
                      <span>{selectedInvoice.paidAt.split('T')[0]}</span>
                    </div>
                  )}
                </div>

                {/* Line Item */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>Langganan Modul {selectedInvoice.planName}</span>
                    <span>{formatRupiah(selectedInvoice.amount)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>
                      Periode: {selectedInvoice.billingPeriod === 'MONTHLY' ? '1 Bulan Akses Cloud' : '1 Tahun Akses Cloud'}
                    </span>
                    <span>Termasuk SATUSEHAT & Support</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-900">Total Tagihan</span>
                  <span className="text-xl font-extrabold text-emerald-600 font-mono">
                    {formatRupiah(selectedInvoice.amount)}
                  </span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  onClick={() => {
                    window.print();
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-slate-200 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Kwitansi</span>
                </Button>

                <div className="flex items-center gap-2">
                  {selectedInvoice.status !== 'PAID' && (
                    <>
                      <Button
                        onClick={() => {
                          if (window.confirm(`Apakah Anda yakin ingin membatalkan dan menghapus faktur ${selectedInvoice.invoiceNumber}?`)) {
                            deleteSaaSInvoice(selectedInvoice.id);
                            setSelectedInvoice(null);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Batalkan Faktur</span>
                      </Button>

                      <Button
                        onClick={() => {
                          updateSaaSInvoiceStatus(selectedInvoice.id, 'PAID');
                          setSelectedInvoice((prev) =>
                            prev ? { ...prev, status: 'PAID', paidAt: new Date().toISOString() } : null
                          );
                        }}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Bayar & Unlock Sekarang</span>
                      </Button>
                    </>
                  )}

                  <Button
                    onClick={() => setSelectedInvoice(null)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs cursor-pointer"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Buat Tagihan Baru */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Terbitkan Faktur Baru</h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Faskes / Tenant</label>
                  <select
                    value={newInvoiceData.tenantId}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, tenantId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.faskesCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paket Langganan</label>
                  <select
                    value={newInvoiceData.planName}
                    onChange={(e) => {
                      const selectedPlan = plans.find((p) => p.name === e.target.value);
                      setNewInvoiceData({
                        ...newInvoiceData,
                        planName: e.target.value,
                        amount: selectedPlan ? (newInvoiceData.billingPeriod === 'YEARLY' ? selectedPlan.priceYearly : selectedPlan.priceMonthly) : newInvoiceData.amount,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Siklus Tagihan</label>
                    <select
                      value={newInvoiceData.billingPeriod}
                      onChange={(e) => {
                        const period = e.target.value as 'MONTHLY' | 'YEARLY';
                        const selectedPlan = plans.find((p) => p.name === newInvoiceData.planName);
                        setNewInvoiceData({
                          ...newInvoiceData,
                          billingPeriod: period,
                          amount: selectedPlan ? (period === 'YEARLY' ? selectedPlan.priceYearly : selectedPlan.priceMonthly) : newInvoiceData.amount,
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="MONTHLY">Bulanan (Monthly)</option>
                      <option value="YEARLY">Tahunan (Yearly)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nominal (IDR)</label>
                    <input
                      type="number"
                      value={newInvoiceData.amount}
                      onChange={(e) => setNewInvoiceData({ ...newInvoiceData, amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batas Waktu Pembayaran</label>
                  <input
                    type="date"
                    value={newInvoiceData.dueDate}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Terbitkan Faktur
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
