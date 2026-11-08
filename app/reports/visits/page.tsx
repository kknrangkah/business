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
import { formatIndonesianDate, calculateAge } from '@/lib/utils';
import {
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Activity,
  CreditCard,
  Building2,
  Stethoscope,
  ArrowUpDown,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LaporanKunjunganPage() {
  const { visits, doctors, patients, hasPermission } = useRME();

  // Filters state
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | '7DAYS' | 'MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPayment, setSelectedPayment] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Date calculation helpers
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered visits
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      // Date filter
      const visitDate = v.date ? v.date.split('T')[0] : '';
      if (datePreset === 'TODAY') {
        if (visitDate !== todayStr) return false;
      } else if (datePreset === '7DAYS') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const sevenDaysAgo = d.toISOString().split('T')[0];
        if (visitDate < sevenDaysAgo || visitDate > todayStr) return false;
      } else if (datePreset === 'MONTH') {
        const currentMonth = todayStr.substring(0, 7); // YYYY-MM
        if (!visitDate.startsWith(currentMonth)) return false;
      } else if (datePreset === 'CUSTOM') {
        if (startDate && visitDate < startDate) return false;
        if (endDate && visitDate > endDate) return false;
      }

      // Doctor filter
      if (selectedDoctor !== 'ALL' && v.doctorId !== selectedDoctor && v.doctorName !== selectedDoctor) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && v.status !== selectedStatus) {
        return false;
      }

      // Payment filter
      if (selectedPayment !== 'ALL' && v.paymentType !== selectedPayment) {
        return false;
      }

      // Search query filter (patient name, noRM, queue, doctor name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = v.patient?.name?.toLowerCase().includes(q);
        const matchRM = v.patient?.noRM?.toLowerCase().includes(q);
        const matchQueue = v.queueNumber?.toLowerCase().includes(q);
        const matchDoc = v.doctorName?.toLowerCase().includes(q);
        const matchComplaint = v.chiefComplaintSummary?.toLowerCase().includes(q);
        const matchDiagnosis = v.medicalRecord?.diagnoses?.some(
          (d) => d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)
        );
        if (!matchName && !matchRM && !matchQueue && !matchDoc && !matchComplaint && !matchDiagnosis) {
          return false;
        }
      }

      return true;
    });
  }, [visits, datePreset, todayStr, startDate, endDate, selectedDoctor, selectedStatus, selectedPayment, searchQuery]);

  // Statistics
  const totalCount = filteredVisits.length;
  const completedCount = filteredVisits.filter((v) => v.status === 'COMPLETED').length;
  const waitingCount = filteredVisits.filter((v) => v.status === 'WAITING' || v.status === 'IN_PROGRESS').length;
  const waitingPaymentCount = filteredVisits.filter((v) => v.status === 'WAITING_PAYMENT').length;

  // Breakdown by payment type
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { UMUM: 0, BPJS: 0, ASURANSI_SWASTA: 0 };
    filteredVisits.forEach((v) => {
      const type = v.paymentType || 'UMUM';
      map[type] = (map[type] || 0) + 1;
    });
    return map;
  }, [filteredVisits]);

  // Breakdown by doctor
  const doctorBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredVisits.forEach((v) => {
      const doc = v.doctorName || 'Dokter Tidak Ditentukan';
      map[doc] = (map[doc] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredVisits]);

  // Export CSV function
  const handleExportCSV = () => {
    if (filteredVisits.length === 0) {
      toast.error('Tidak ada data kunjungan untuk diekspor');
      return;
    }

    const headers = [
      'No',
      'Tanggal',
      'Jam',
      'No Antrian',
      'No RM',
      'Nama Pasien',
      'Gender',
      'Usia',
      'Dokter Pemeriksa',
      'Poli',
      'Cara Bayar',
      'Status',
      'Keluhan Utama',
      'Diagnosa Primer',
    ];

    const rows = filteredVisits.map((v, index) => {
      const primaryDiag = v.medicalRecord?.diagnoses?.[0];
      const diagStr = primaryDiag ? `"${primaryDiag.code} - ${primaryDiag.name}"` : '-';
      const patientAge = v.patient?.birthDate ? `${calculateAge(v.patient.birthDate)} th` : '-';

      return [
        index + 1,
        v.date || '-',
        v.time || '-',
        v.queueNumber || '-',
        v.patient?.noRM || '-',
        `"${v.patient?.name || '-'}"`,
        v.patient?.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        patientAge,
        `"${v.doctorName || '-'}"`,
        `"${v.doctorSpecialty || 'Poli Umum'}"`,
        v.paymentType || 'UMUM',
        v.status || '-',
        `"${(v.chiefComplaintSummary || '').replace(/"/g, '""')}"`,
        diagStr,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan-kunjungan-pasien-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Laporan kunjungan berhasil diunduh (CSV)');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">Selesai</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold animate-pulse">Sedang Diperiksa</Badge>;
      case 'WAITING':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold">Menunggu Antrian</Badge>;
      case 'WAITING_PAYMENT':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-semibold">Menunggu Kasir</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-semibold">Batal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (type: string) => {
    switch (type) {
      case 'BPJS':
        return <Badge className="bg-teal-50 text-teal-800 border-teal-300 font-bold">BPJS</Badge>;
      case 'ASURANSI':
      case 'ASURANSI_SWASTA':
        return <Badge className="bg-blue-50 text-blue-800 border-blue-300 font-bold">Asuransi</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-bold">Umum / Cash</Badge>;
    }
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
              <span className="font-semibold text-emerald-800">Laporan Kunjungan</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-emerald-700" />
              <span>Laporan Kunjungan Pasien</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Rekapitulasi riwayat kedatangan, status pelayanan, dan distribusi pasien klinik mandiri.
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Kunjungan</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{totalCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {datePreset === 'ALL' ? 'Semua periode data' : 'Sesuai filter rentang tanggal'}
            </div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-teal-600 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pelayanan Selesai</span>
              <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-teal-700 mt-2 font-mono">{completedCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}% dari total kunjungan` : '0%'}
            </div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-amber-500 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Antrian & Pemeriksaan</span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 mt-2 font-mono">{waitingCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pasien menunggu & sedang diperiksa</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-purple-600 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Menunggu Kasir</span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-700 mt-2 font-mono">{waitingPaymentCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pemeriksaan selesai, belum bayar</div>
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl print:hidden space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Filter Laporan</span>
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
                placeholder="Cari nama pasien, No RM, keluhan..."
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

            {/* Status Select */}
            <div>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs h-9 rounded-xl border-slate-200"
              >
                <option value="ALL">Semua Status</option>
                <option value="WAITING">Menunggu Antrian</option>
                <option value="IN_PROGRESS">Sedang Diperiksa</option>
                <option value="WAITING_PAYMENT">Menunggu Kasir</option>
                <option value="COMPLETED">Selesai</option>
                <option value="CANCELLED">Batal</option>
              </Select>
            </div>

            {/* Payment Select */}
            <div>
              <Select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="text-xs h-9 rounded-xl border-slate-200"
              >
                <option value="ALL">Semua Cara Bayar</option>
                <option value="UMUM">Umum / Cash</option>
                <option value="BPJS">BPJS Kesehatan</option>
                <option value="ASURANSI_SWASTA">Asuransi Swasta</option>
              </Select>
            </div>
          </div>

          {/* Custom Date Picker row if active */}
          {datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-3 pt-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 animate-in fade-in">
              <Calendar className="h-4 w-4 text-emerald-700 shrink-0" />
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <span className="text-xs text-slate-600 font-medium">Dari Tanggal:</span>
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
                    Reset Tanggal
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Visual Charts & Breakdown Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment Type Distribution */}
          <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-700" />
              <span>Distribusi Jaminan / Cara Bayar</span>
            </h3>
            <div className="space-y-2.5">
              {(['UMUM', 'BPJS', 'ASURANSI_SWASTA'] as const).map((type) => {
                const count = paymentBreakdown[type] || 0;
                const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                const label = type === 'UMUM' ? 'Pasien Umum / Tunai' : type === 'BPJS' ? 'BPJS Kesehatan' : 'Asuransi Swasta';
                const color = type === 'UMUM' ? 'bg-emerald-600' : type === 'BPJS' ? 'bg-teal-600' : 'bg-blue-600';

                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{label}</span>
                      <span className="font-mono text-slate-500">
                        {count} Pasien ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Doctors by Visits */}
          <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-emerald-700" />
              <span>Distribusi Kunjungan per Dokter</span>
            </h3>
            <div className="space-y-2.5">
              {doctorBreakdown.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">Belum ada kunjungan tercatat</div>
              ) : (
                doctorBreakdown.slice(0, 3).map(([docName, count]) => {
                  const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                  return (
                    <div key={docName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 truncate max-w-[200px]">{docName}</span>
                        <span className="font-mono text-slate-500">
                          {count} Pasien ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-emerald-700 transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="border border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Daftar Transaksi Kunjungan Pasien</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Menampilkan {filteredVisits.length} dari total {visits.length} rekam kunjungan
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs font-bold bg-white">
              {filteredVisits.length} Baris
            </Badge>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3">Waktu & Antrian</th>
                  <th className="py-3 px-3">Data Pasien</th>
                  <th className="py-3 px-3">Dokter & Poli</th>
                  <th className="py-3 px-3">Keluhan / Diagnosa</th>
                  <th className="py-3 px-3 text-center">Cara Bayar</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Rincian Medis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="font-medium">Tidak ada data kunjungan yang cocok dengan filter yang dipilih.</p>
                      <button
                        onClick={() => {
                          setDatePreset('ALL');
                          setSelectedDoctor('ALL');
                          setSelectedStatus('ALL');
                          setSelectedPayment('ALL');
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
                    const primaryDiag = v.medicalRecord?.diagnoses?.[0];
                    const procCount = v.medicalRecord?.procedures?.length || 0;
                    const rxCount = v.medicalRecord?.prescriptions?.length || 0;
                    const patientAge = v.patient?.birthDate ? calculateAge(v.patient.birthDate) : null;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{formatIndonesianDate(v.date)}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 font-mono">
                            <span>{v.time || '08:00'} WIB</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {v.queueNumber || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                            {v.patient?.name || 'Pasien Anonim'}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 font-mono">
                            <span className="font-medium text-slate-600">{v.patient?.noRM || '-'}</span>
                            <span className="text-slate-300">•</span>
                            <span>{v.patient?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                            {patientAge !== null && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>{patientAge} th</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{v.doctorName || 'dr. Pemeriksa'}</div>
                          <div className="text-[11px] text-slate-500">{v.doctorSpecialty || 'Poli Umum'}</div>
                        </td>
                        <td className="py-3 px-3 max-w-[240px]">
                          {primaryDiag ? (
                            <div>
                              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded text-[10px] mr-1 border border-emerald-200">
                                {primaryDiag.code}
                              </span>
                              <span className="font-medium text-slate-800 text-[11px] line-clamp-1">{primaryDiag.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              {v.chiefComplaintSummary || 'Pemeriksaan rutin'}
                            </span>
                          )}
                          {v.chiefComplaintSummary && primaryDiag && (
                            <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                              Keluhan: {v.chiefComplaintSummary}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">{getPaymentBadge(v.paymentType)}</td>
                        <td className="py-3 px-3 text-center">{getStatusBadge(v.status)}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="text-[11px] text-slate-600 font-medium">
                            {procCount > 0 ? (
                              <span className="text-teal-700 font-bold">{procCount} Tindakan</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {rxCount > 0 ? `${rxCount} Item Obat` : 'Tanpa Resep'}
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
      </div>
    </MainLayout>
  );
}
