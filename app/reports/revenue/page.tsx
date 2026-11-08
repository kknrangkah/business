'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatRupiah, formatIndonesianDate } from '@/lib/utils';
import {
  Receipt,
  Calendar,
  Search,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  Building2,
  Stethoscope,
  Pill,
  Activity,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LaporanPendapatanPage() {
  const { visits, doctors, hasPermission } = useRME();

  // Filters state
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | '7DAYS' | 'MONTH' | 'YEAR' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [selectedDoctor, setSelectedDoctor] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered visits with billing data
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      // Must have billing or medicalRecord
      const visitDate = v.date ? v.date.split('T')[0] : '';

      // Date filter
      if (datePreset === 'TODAY') {
        if (visitDate !== todayStr) return false;
      } else if (datePreset === '7DAYS') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const sevenDaysAgo = d.toISOString().split('T')[0];
        if (visitDate < sevenDaysAgo || visitDate > todayStr) return false;
      } else if (datePreset === 'MONTH') {
        const currentMonth = todayStr.substring(0, 7);
        if (!visitDate.startsWith(currentMonth)) return false;
      } else if (datePreset === 'YEAR') {
        const currentYear = todayStr.substring(0, 4);
        if (!visitDate.startsWith(currentYear)) return false;
      } else if (datePreset === 'CUSTOM') {
        if (startDate && visitDate < startDate) return false;
        if (endDate && visitDate > endDate) return false;
      }

      // Billing status filter
      const billStatus = v.billing?.status || (v.status === 'COMPLETED' ? 'PAID' : 'PENDING');
      if (selectedStatus !== 'ALL' && billStatus !== selectedStatus) {
        return false;
      }

      // Payment method filter
      const payMethod = v.billing?.paymentDetails?.method || (v.paymentType === 'BPJS' ? 'BPJS' : (v.paymentType === 'ASURANSI_SWASTA' ? 'INSURANCE' : 'CASH'));
      if (selectedMethod !== 'ALL') {
        if (selectedMethod === 'CASH' || selectedMethod === 'TUNAI') {
          if (payMethod !== 'CASH') return false;
        } else if (payMethod !== selectedMethod) {
          return false;
        }
      }

      // Doctor filter
      if (selectedDoctor !== 'ALL' && v.doctorId !== selectedDoctor && v.doctorName !== selectedDoctor) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInvoice = v.billing?.invoiceNumber?.toLowerCase().includes(q);
        const matchName = v.patient?.name?.toLowerCase().includes(q);
        const matchRM = v.patient?.noRM?.toLowerCase().includes(q);
        const matchDoc = v.doctorName?.toLowerCase().includes(q);
        if (!matchInvoice && !matchName && !matchRM && !matchDoc) {
          return false;
        }
      }

      return true;
    });
  }, [visits, datePreset, todayStr, startDate, endDate, selectedStatus, selectedMethod, selectedDoctor, searchQuery]);

  // Aggregations
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;
    let consultationTotal = 0;
    let proceduresTotal = 0;
    let medicationsTotal = 0;
    let paidCount = 0;
    let pendingCount = 0;

    const methodMap: Record<string, { count: number; total: number }> = {};

    filteredVisits.forEach((v) => {
      // Extract or compute fees
      const consultFee = v.billing?.consultationFee || 75000;
      const procFee = v.billing?.proceduresFee || (v.medicalRecord?.procedures?.reduce((acc, p) => acc + p.price, 0) || 0);
      const medFee = v.billing?.medicationsFee || (v.medicalRecord?.prescriptions?.reduce((acc, p) => acc + (p.price * p.quantity), 0) || 0);
      const grandTotal = v.billing?.grandTotal || (consultFee + procFee + medFee);
      const isPaid = v.billing?.status === 'PAID' || v.status === 'COMPLETED';

      totalRevenue += grandTotal;
      consultationTotal += consultFee;
      proceduresTotal += procFee;
      medicationsTotal += medFee;

      if (isPaid) {
        paidRevenue += grandTotal;
        paidCount += 1;
      } else {
        pendingRevenue += grandTotal;
        pendingCount += 1;
      }

      const method = v.billing?.paymentDetails?.method || (v.paymentType === 'BPJS' ? 'BPJS' : 'TUNAI');
      if (!methodMap[method]) {
        methodMap[method] = { count: 0, total: 0 };
      }
      methodMap[method].count += 1;
      methodMap[method].total += grandTotal;
    });

    const avgPerTransaction = paidCount > 0 ? Math.round(paidRevenue / paidCount) : 0;

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      consultationTotal,
      proceduresTotal,
      medicationsTotal,
      paidCount,
      pendingCount,
      avgPerTransaction,
      methodBreakdown: Object.entries(methodMap).sort((a, b) => b[1].total - a[1].total),
    };
  }, [filteredVisits]);

  // Percentages of revenue sources
  const consultPct = stats.totalRevenue > 0 ? Math.round((stats.consultationTotal / stats.totalRevenue) * 100) : 0;
  const procPct = stats.totalRevenue > 0 ? Math.round((stats.proceduresTotal / stats.totalRevenue) * 100) : 0;
  const medPct = stats.totalRevenue > 0 ? Math.round((stats.medicationsTotal / stats.totalRevenue) * 100) : 0;

  // Export CSV
  const handleExportCSV = () => {
    if (filteredVisits.length === 0) {
      toast.error('Tidak ada transaksi pendapatan untuk diekspor');
      return;
    }

    const headers = [
      'No',
      'No Invoice',
      'Tanggal',
      'No RM',
      'Nama Pasien',
      'Dokter',
      'Jasa Konsultasi (Rp)',
      'Jasa Tindakan (Rp)',
      'Obat/Farmasi (Rp)',
      'Grand Total (Rp)',
      'Metode Bayar',
      'Status Bayar',
    ];

    const rows = filteredVisits.map((v, index) => {
      const consultFee = v.billing?.consultationFee || 75000;
      const procFee = v.billing?.proceduresFee || (v.medicalRecord?.procedures?.reduce((acc, p) => acc + p.price, 0) || 0);
      const medFee = v.billing?.medicationsFee || (v.medicalRecord?.prescriptions?.reduce((acc, p) => acc + (p.price * p.quantity), 0) || 0);
      const grandTotal = v.billing?.grandTotal || (consultFee + procFee + medFee);
      const isPaid = v.billing?.status === 'PAID' || v.status === 'COMPLETED';
      const method = v.billing?.paymentDetails?.method || (v.paymentType === 'BPJS' ? 'BPJS' : 'TUNAI');

      return [
        index + 1,
        v.billing?.invoiceNumber || `INV-${v.id}`,
        v.date || '-',
        v.patient?.noRM || '-',
        `"${v.patient?.name || '-'}"`,
        `"${v.doctorName || '-'}"`,
        consultFee,
        procFee,
        medFee,
        grandTotal,
        method,
        isPaid ? 'LUNAS' : 'MENUNGGU_BAYAR',
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan-pendapatan-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Laporan pendapatan berhasil diunduh (CSV)');
  };

  return (
    <MainLayout>
      <div className="space-y-6 pb-12">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/reports" className="hover:text-emerald-700 flex items-center gap-1">
                <ChevronLeft className="h-3.5 w-3.5" />
                Laporan & Statistik
              </Link>
              <span>/</span>
              <span className="font-semibold text-emerald-800">Laporan Pendapatan</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Receipt className="h-6 w-6 text-emerald-700" />
              <span>Laporan Pendapatan & Kasir</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Analisis pemasukan kas klinik dari konsultasi dokter, tindakan medis, dan penjualan obat resep.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap print:hidden">
            {hasPermission('export_report') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 text-xs bg-white shadow-2xs rounded-xl font-medium hover:bg-slate-50 text-slate-700"
            >
              <Download className="h-4 w-4 text-emerald-700" />
              <span>Unduh CSV</span>
            </Button>
          )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs rounded-xl font-medium border-emerald-700"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Laporan</span>
            </Button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-emerald-600 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pendapatan Lunas (Kas Masuk)</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
              {formatRupiah(stats.paidRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {stats.paidCount} Transaksi lunas terverifikasi
            </div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-teal-600 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rata-rata / Pasien</span>
              <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-teal-700 mt-2 font-mono">
              {formatRupiah(stats.avgPerTransaction)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Konsultasi + Tindakan + Obat</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-amber-500 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Menunggu Pembayaran</span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 mt-2 font-mono">
              {formatRupiah(stats.pendingRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {stats.pendingCount} Transaksi pending di loket kasir
            </div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-slate-700 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Akumulasi Kotor</span>
              <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
              {formatRupiah(stats.totalRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {filteredVisits.length} Tagihan invoice tercatat
            </div>
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl print:hidden space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Filter Pendapatan</span>
            </div>

            {/* Quick date presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setDatePreset('ALL')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  datePreset === 'ALL'
                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('TODAY')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  datePreset === 'TODAY'
                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('7DAYS')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  datePreset === '7DAYS'
                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('MONTH')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  datePreset === 'MONTH'
                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('CUSTOM')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  datePreset === 'CUSTOM'
                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Kustom Tanggal
              </button>
            </div>
          </div>

          {/* Detailed Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari No Invoice, nama pasien, No RM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 rounded-xl border-slate-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Select */}
            <div>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs h-9 rounded-xl border-slate-200"
              >
                <option value="ALL">Semua Status Bayar</option>
                <option value="PAID">Lunas (Paid)</option>
                <option value="PENDING">Menunggu Bayar</option>
              </Select>
            </div>

            {/* Payment Method Select */}
            <div>
              <Select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="text-xs h-9 rounded-xl border-slate-200"
              >
                <option value="ALL">Semua Cara Bayar</option>
                <option value="CASH">Tunai / Cash</option>
                <option value="QRIS">QRIS</option>
                <option value="TRANSFER">Transfer Bank</option>
                <option value="INSURANCE">Asuransi Swasta</option>
                <option value="BPJS">BPJS Kesehatan</option>
              </Select>
            </div>

            {/* Doctor Select */}
            <div>
              <Select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="text-xs h-9 rounded-xl border-slate-200"
              >
                <option value="ALL">Semua Dokter</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Custom date range bar */}
          {datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-3 pt-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 animate-in fade-in">
              <Calendar className="h-4 w-4 text-emerald-700 shrink-0" />
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <span className="text-xs text-slate-600 font-medium">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                />
                <span className="text-xs text-slate-600 font-medium ml-2">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                />
                {(startDate || endDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 h-7 px-2"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Revenue Composition Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card: Rincian Jasa Konsultasi */}
          <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-emerald-700" />
                Jasa Konsultasi Dokter
              </span>
              <span className="font-bold text-emerald-800 font-mono">{consultPct}%</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {formatRupiah(stats.consultationTotal)}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-600 h-full transition-all" style={{ width: `${consultPct}%` }} />
            </div>
            <div className="text-[11px] text-slate-400">Tarif konsultasi dasar per dokter</div>
          </Card>

          {/* Card: Rincian Tindakan Medis */}
          <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-teal-700" />
                Jasa Tindakan & Pemeriksaan
              </span>
              <span className="font-bold text-teal-800 font-mono">{procPct}%</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {formatRupiah(stats.proceduresTotal)}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-teal-600 h-full transition-all" style={{ width: `${procPct}%` }} />
            </div>
            <div className="text-[11px] text-slate-400">Injeksi, nebulizer, rawat luka, EKG, dll.</div>
          </Card>

          {/* Card: Rincian Farmasi & Obat */}
          <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-indigo-700" />
                Obat & Farmasi
              </span>
              <span className="font-bold text-indigo-800 font-mono">{medPct}%</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {formatRupiah(stats.medicationsTotal)}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-600 h-full transition-all" style={{ width: `${medPct}%` }} />
            </div>
            <div className="text-[11px] text-slate-400">Penjualan obat non-racikan & racikan</div>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="border border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Rincian Transaksi Tagihan Pasien</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian komponen biaya per transaksi kasir klinik
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs font-bold bg-white">
              {filteredVisits.length} Transaksi
            </Badge>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">No Invoice & Tgl</th>
                  <th className="py-3 px-3">Pasien</th>
                  <th className="py-3 px-3">Dokter</th>
                  <th className="py-3 px-3 text-right">Konsultasi</th>
                  <th className="py-3 px-3 text-right">Tindakan</th>
                  <th className="py-3 px-3 text-right">Obat & Resep</th>
                  <th className="py-3 px-3 text-right">Grand Total</th>
                  <th className="py-3 px-3 text-center">Metode Bayar</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="font-medium">Tidak ada data pendapatan untuk filter yang dipilih.</p>
                      <button
                        onClick={() => {
                          setDatePreset('ALL');
                          setSelectedStatus('ALL');
                          setSelectedMethod('ALL');
                          setSelectedDoctor('ALL');
                          setSearchQuery('');
                        }}
                        className="mt-2 text-xs text-emerald-700 font-bold underline hover:text-emerald-800"
                      >
                        Reset Semua Filter
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredVisits.map((v, idx) => {
                    const consultFee = v.billing?.consultationFee || 75000;
                    const procFee = v.billing?.proceduresFee || (v.medicalRecord?.procedures?.reduce((acc, p) => acc + p.price, 0) || 0);
                    const medFee = v.billing?.medicationsFee || (v.medicalRecord?.prescriptions?.reduce((acc, p) => acc + (p.price * p.quantity), 0) || 0);
                    const grandTotal = v.billing?.grandTotal || (consultFee + procFee + medFee);
                    const isPaid = v.billing?.status === 'PAID' || v.status === 'COMPLETED';
                    const method = v.billing?.paymentDetails?.method || (v.paymentType === 'BPJS' ? 'BPJS' : 'TUNAI');

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-slate-900">
                            {v.billing?.invoiceNumber || `INV-${v.id.substring(0, 8)}`}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {formatIndonesianDate(v.date)}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{v.patient?.name || 'Pasien Anonim'}</div>
                          <div className="font-mono text-[11px] text-slate-500">{v.patient?.noRM || '-'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-900">{v.doctorName || 'dr. Pemeriksa'}</div>
                          <div className="text-[10px] text-slate-400">{v.doctorSpecialty || 'Poli Umum'}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatRupiah(consultFee)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {procFee > 0 ? formatRupiah(procFee) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {medFee > 0 ? formatRupiah(medFee) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-800 text-sm">
                          {formatRupiah(grandTotal)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="outline" className="font-bold text-[10px] uppercase bg-white">
                            {method}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isPaid ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                              LUNAS
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px]">
                              PENDING
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
