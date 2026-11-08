'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Doctor, NurseMaster, Visit } from '@/types/rme';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatRupiah, formatIndonesianDate } from '@/lib/utils';
import {
  UserCheck,
  Stethoscope,
  Calendar,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  DollarSign,
  Wallet,
  Activity,
  FileText,
  Search,
  Eye,
  Sliders,
  Sparkles,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LaporanHonorerPage() {
  const { visits, doctors, nurses, config } = useRME();

  // Active Tab: DOCTORS vs NURSES
  const [activeTab, setActiveTab] = useState<'DOCTORS' | 'NURSES'>('DOCTORS');

  // Period Filter
  const [periodPreset, setPeriodPreset] = useState<'MONTH' | 'LAST_MONTH' | 'ALL' | 'CUSTOM'>('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Configurable sharing rates for doctors
  const [doctorConsultationRate, setDoctorConsultationRate] = useState<number>(85); // 85% default to doctor
  const [doctorProcedureRate, setDoctorProcedureRate] = useState<number>(70); // 70% of procedure fee to doctor

  // Configurable incentive rates for nurses
  const [nursePerPatientRate, setNursePerPatientRate] = useState<number>(15000); // Rp 15.000 per patient triaged
  const [nurseShiftRate, setNurseShiftRate] = useState<number>(100000); // Rp 100.000 per shift

  // Show slip modal
  const [selectedDoctorSlip, setSelectedDoctorSlip] = useState<{ doctor: Doctor; doctorVisits: Visit[] } | null>(null);
  const [selectedNurseSlip, setSelectedNurseSlip] = useState<{ nurse: NurseMaster; visitCount: number } | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter visits by period
  const periodVisits = useMemo(() => {
    return visits.filter((v) => {
      const visitDate = v.date ? v.date.split('T')[0] : '';
      if (periodPreset === 'MONTH') {
        const currentMonth = todayStr.substring(0, 7); // YYYY-MM
        if (!visitDate.startsWith(currentMonth)) return false;
      } else if (periodPreset === 'LAST_MONTH') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        const lastMonth = d.toISOString().substring(0, 7);
        if (!visitDate.startsWith(lastMonth)) return false;
      } else if (periodPreset === 'CUSTOM') {
        if (startDate && visitDate < startDate) return false;
        if (endDate && visitDate > endDate) return false;
      }
      return true;
    });
  }, [visits, periodPreset, todayStr, startDate, endDate]);

  // Doctor honorarium calculation
  const doctorHonorList = useMemo(() => {
    return doctors.map((doc) => {
      // Find all visits handled by this doctor in the period
      const docVisits = periodVisits.filter(
        (v) => (v.doctorId === doc.id || v.doctorName === doc.name) && v.status === 'COMPLETED'
      );

      let totalGrossConsultation = 0;
      let totalGrossProcedure = 0;

      docVisits.forEach((v) => {
        const consultFee = v.billing?.consultationFee || doc.defaultConsultationFee || 75000;
        const procFee = v.billing?.proceduresFee || (v.medicalRecord?.procedures?.reduce((acc, p) => acc + p.price, 0) || 0);
        totalGrossConsultation += consultFee;
        totalGrossProcedure += procFee;
      });

      const doctorConsultShare = Math.round((totalGrossConsultation * doctorConsultationRate) / 100);
      const doctorProcedureShare = Math.round((totalGrossProcedure * doctorProcedureRate) / 100);
      const totalHonor = doctorConsultShare + doctorProcedureShare;

      return {
        doctor: doc,
        patientCount: docVisits.length,
        grossConsultation: totalGrossConsultation,
        grossProcedure: totalGrossProcedure,
        consultShare: doctorConsultShare,
        procedureShare: doctorProcedureShare,
        totalHonor,
        visits: docVisits,
      };
    });
  }, [doctors, periodVisits, doctorConsultationRate, doctorProcedureRate]);

  // Nurse honorarium calculation
  // In clinics, nurses assist in patient triage / vital signs or per shift
  const nurseHonorList = useMemo(() => {
    const totalCompletedVisits = periodVisits.filter((v) => v.status === 'COMPLETED').length;
    // Distribute visits evenly or proportionally among active nurses
    const activeNurses = nurses.filter((n) => n.status !== 'INACTIVE');
    const nurseShareVisits = activeNurses.length > 0 ? Math.ceil(totalCompletedVisits / activeNurses.length) : 0;

    return nurses.map((nurse) => {
      const isNurseActive = nurse.status !== 'INACTIVE';
      const patientCount = isNurseActive ? nurseShareVisits : 0;
      const patientIncentive = patientCount * nursePerPatientRate;

      // Estimate shifts in month (e.g. 20 working shifts per month)
      const estimatedShifts = isNurseActive ? (periodPreset === 'ALL' ? 40 : 20) : 0;
      const shiftIncentive = estimatedShifts * (nurseShiftRate / 4); // Auxiliary attendance allowance

      const totalHonor = patientIncentive + shiftIncentive;

      return {
        nurse,
        patientCount,
        estimatedShifts,
        patientIncentive,
        shiftIncentive,
        totalHonor,
      };
    });
  }, [nurses, periodVisits, nursePerPatientRate, nurseShiftRate, periodPreset]);

  // Totals for Doctors
  const doctorTotalHonor = doctorHonorList.reduce((acc, d) => acc + d.totalHonor, 0);
  const doctorTotalPatients = doctorHonorList.reduce((acc, d) => acc + d.patientCount, 0);

  // Totals for Nurses
  const nurseTotalHonor = nurseHonorList.reduce((acc, n) => acc + n.totalHonor, 0);

  // Export CSV function
  const handleExportCSV = () => {
    if (activeTab === 'DOCTORS') {
      const headers = [
        'No',
        'Nama Dokter',
        'SIP',
        'Spesialisasi',
        'Jumlah Pasien',
        'Bruto Konsultasi (Rp)',
        'Hak Jasa Konsultasi (Rp)',
        'Bruto Tindakan (Rp)',
        'Hak Jasa Tindakan (Rp)',
        'Total Honorarium (Rp)',
      ];

      const rows = doctorHonorList.map((d, idx) => [
        idx + 1,
        `"${d.doctor.name}"`,
        `"${d.doctor.sip}"`,
        `"${d.doctor.specialty}"`,
        d.patientCount,
        d.grossConsultation,
        d.consultShare,
        d.grossProcedure,
        d.procedureShare,
        d.totalHonor,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-honorer-dokter-${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Laporan honorer dokter berhasil diunduh (CSV)');
    } else {
      const headers = [
        'No',
        'Nama Perawat/Bidan',
        'SIKP',
        'Profesi',
        'Ruangan',
        'Jumlah Pasien',
        'Insentif Pasien (Rp)',
        'Insentif Shift (Rp)',
        'Total Honorarium (Rp)',
      ];

      const rows = nurseHonorList.map((n, idx) => [
        idx + 1,
        `"${n.nurse.name}"`,
        `"${n.nurse.sikp}"`,
        `"${n.nurse.profession}"`,
        `"${n.nurse.room}"`,
        n.patientCount,
        n.patientIncentive,
        n.shiftIncentive,
        n.totalHonor,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-honorer-perawat-${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Laporan honorer perawat berhasil diunduh (CSV)');
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
              <span className="font-semibold text-emerald-800">Laporan Honorer</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Wallet className="h-6 w-6 text-emerald-700" />
              <span>Laporan Honorer & Jasa Medis</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Rekapitulasi jasa medis dokter (fee sharing konsultasi & tindakan) serta insentif pelayanan perawat/bidan.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 text-xs bg-white shadow-2xs rounded-xl font-medium hover:bg-slate-50 text-slate-700"
            >
              <Download className="h-4 w-4 text-emerald-700" />
              <span>Unduh CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs rounded-xl font-medium border-emerald-700"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Rekapitulasi</span>
            </Button>
          </div>
        </div>

        {/* Tab Selector & Period Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs print:hidden">
          {/* Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('DOCTORS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'DOCTORS'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="h-4 w-4 text-emerald-700" />
              <span>Honorer Dokter ({doctors.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('NURSES')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'NURSES'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="h-4 w-4 text-teal-700" />
              <span>Honorer Perawat & Bidan ({nurses.length})</span>
            </button>
          </div>

          {/* Period presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Periode:
            </span>
            <button
              type="button"
              onClick={() => setPeriodPreset('MONTH')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                periodPreset === 'MONTH'
                  ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriodPreset('LAST_MONTH')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                periodPreset === 'LAST_MONTH'
                  ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bulan Lalu
            </button>
            <button
              type="button"
              onClick={() => setPeriodPreset('ALL')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                periodPreset === 'ALL'
                  ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Periode
            </button>
          </div>
        </div>

        {/* Dynamic KPI Cards */}
        {activeTab === 'DOCTORS' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-emerald-600 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Hak Jasa Dokter</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
                {formatRupiah(doctorTotalHonor)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Akumulasi hak fee {doctors.length} dokter</div>
            </Card>

            <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-teal-600 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pasien Selesai Dilayani</span>
                <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-teal-700 mt-2 font-mono">{doctorTotalPatients} Pasien</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Kunjungan medis selesai di periode ini</div>
            </Card>

            <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-indigo-600 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sharing Jasa Konsultasi</span>
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Sliders className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-700 mt-2 font-mono">{doctorConsultationRate}%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Persentase tarif konsultasi untuk dokter</div>
            </Card>

            <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-purple-600 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sharing Jasa Tindakan</span>
                <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-purple-700 mt-2 font-mono">{doctorProcedureRate}%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Persentase jasa tindakan untuk dokter</div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-teal-600 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Insentif Perawat</span>
                <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-teal-700 mt-2 font-mono">{formatRupiah(nurseTotalHonor)}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Akumulasi insentif {nurses.length} tenaga keperawatan</div>
            </Card>

            <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-emerald-600 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tarif Insentif / Pasien</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
                {formatRupiah(nursePerPatientRate)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Tunjangan triase & asisten per pasien</div>
            </Card>

            <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-blue-600 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tunjangan Hadir / Shift</span>
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-blue-700 mt-2 font-mono">
                {formatRupiah(nurseShiftRate)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Tunjangan kehadiran shift jaga klinik</div>
            </Card>

            <Card className="p-4 border border-slate-200 bg-white shadow-xs border-l-4 border-l-purple-600 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Jumlah Perawat & Bidan</span>
                <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <UserCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-purple-700 mt-2 font-mono">{nurses.length} Tenaga</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Perawat umum, bidan, & asisten medis</div>
            </Card>
          </div>
        )}

        {/* Quick Rate Config Bar (Interactive Settings) */}
        <Card className="p-4 border border-slate-200 bg-slate-50/50 rounded-2xl print:hidden">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-700" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Pengaturan Rumus Sharing & Tarif Insentif</span>
                <span className="text-[11px] text-slate-500">
                  Ubah persentase atau nominal di bawah untuk mensimulasikan perhitungan honor secara otomatis
                </span>
              </div>
            </div>

            {activeTab === 'DOCTORS' ? (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-600 font-medium">Jasa Konsultasi:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={doctorConsultationRate}
                    onChange={(e) => setDoctorConsultationRate(Number(e.target.value))}
                    className="w-12 text-center font-bold text-emerald-800 border-b border-emerald-500 focus:outline-none"
                  />
                  <span className="font-bold text-slate-400">%</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-600 font-medium">Jasa Tindakan:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={doctorProcedureRate}
                    onChange={(e) => setDoctorProcedureRate(Number(e.target.value))}
                    className="w-12 text-center font-bold text-teal-800 border-b border-teal-500 focus:outline-none"
                  />
                  <span className="font-bold text-slate-400">%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-600 font-medium">Insentif per Pasien:</span>
                  <span className="font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step="1000"
                    value={nursePerPatientRate}
                    onChange={(e) => setNursePerPatientRate(Number(e.target.value))}
                    className="w-20 text-center font-bold text-emerald-800 border-b border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-600 font-medium">Tunjangan per Shift:</span>
                  <span className="font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step="5000"
                    value={nurseShiftRate}
                    onChange={(e) => setNurseShiftRate(Number(e.target.value))}
                    className="w-24 text-center font-bold text-teal-800 border-b border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Main Table */}
        {activeTab === 'DOCTORS' ? (
          <Card className="border border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-emerald-700" />
                  <span>Rekapitulasi Hak Honorarium Dokter</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perhitungan berdasarkan {periodPreset === 'MONTH' ? 'Bulan Ini' : 'Periode Terpilih'}
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs font-bold bg-white">
                {doctorHonorList.length} Dokter Terdata
              </Badge>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">Dokter & SIP</th>
                    <th className="py-3 px-3">Spesialisasi & Poli</th>
                    <th className="py-3 px-3 text-center">Pasien Selesai</th>
                    <th className="py-3 px-3 text-right">Bruto Konsultasi</th>
                    <th className="py-3 px-3 text-right">Hak Jasa Konsul ({doctorConsultationRate}%)</th>
                    <th className="py-3 px-3 text-right">Hak Jasa Tindakan ({doctorProcedureRate}%)</th>
                    <th className="py-3 px-3 text-right">Total Honorarium</th>
                    <th className="py-3 px-3 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {doctorHonorList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Belum ada dokter terdaftar di faskes.
                      </td>
                    </tr>
                  ) : (
                    doctorHonorList.map((item, idx) => (
                      <tr key={item.doctor.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{item.doctor.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            SIP: {item.doctor.sip || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{item.doctor.specialty}</div>
                          <div className="text-[11px] text-slate-400">{item.doctor.poli || 'Poli Umum'}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {item.patientCount} Pasien
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatRupiah(item.grossConsultation)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatRupiah(item.consultShare)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                          {item.procedureShare > 0 ? formatRupiah(item.procedureShare) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-800 text-sm">
                          {formatRupiah(item.totalHonor)}
                        </td>
                        <td className="py-3 px-3 text-center print:hidden">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDoctorSlip({ doctor: item.doctor, doctorVisits: item.visits })}
                            className="text-xs h-7 gap-1 px-2.5 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Slip Honor</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="border border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-teal-700" />
                  <span>Rekapitulasi Hak Insentif Perawat & Bidan</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tunjangan asistensi pemeriksaan & pelayanan keperawatan
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs font-bold bg-white">
                {nurseHonorList.length} Perawat Terdata
              </Badge>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">Nama & SIKP</th>
                    <th className="py-3 px-3">Profesi & Ruangan</th>
                    <th className="py-3 px-3 text-center">Estimasi Pasien</th>
                    <th className="py-3 px-3 text-right">Insentif Pasien</th>
                    <th className="py-3 px-3 text-right">Tunjangan Shift</th>
                    <th className="py-3 px-3 text-right">Total Insentif</th>
                    <th className="py-3 px-3 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {nurseHonorList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Belum ada perawat terdaftar di faskes.
                      </td>
                    </tr>
                  ) : (
                    nurseHonorList.map((item, idx) => (
                      <tr key={item.nurse.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{item.nurse.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            SIKP: {item.nurse.sikp || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{item.nurse.profession}</div>
                          <div className="text-[11px] text-slate-400">{item.nurse.room}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            {item.patientCount} Pasien
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatRupiah(item.patientIncentive)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatRupiah(item.shiftIncentive)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-teal-800 text-sm">
                          {formatRupiah(item.totalHonor)}
                        </td>
                        <td className="py-3 px-3 text-center print:hidden">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedNurseSlip({ nurse: item.nurse, visitCount: item.patientCount })}
                            className="text-xs h-7 gap-1 px-2.5 rounded-lg border-teal-200 text-teal-700 hover:bg-teal-50 font-semibold"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Slip Insentif</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Modal: Slip Honorarium Dokter */}
        {selectedDoctorSlip && (
          <Dialog open={true} onOpenChange={() => setSelectedDoctorSlip(null)} maxWidth="2xl">
            <DialogHeader onClose={() => setSelectedDoctorSlip(null)}>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-emerald-700" />
                <span>Slip Honorarium Dokter (Jasa Medis)</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Klinik / Faskes Primer: {config.practiceName || 'Klinik Sehat Sejahtera'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Doctor Details Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-slate-900">{selectedDoctorSlip.doctor.name}</div>
                  <div className="text-slate-600 font-mono text-[11px]">SIP: {selectedDoctorSlip.doctor.sip}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{selectedDoctorSlip.doctor.specialty}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Periode Perhitungan</div>
                  <div className="font-bold text-slate-800 text-xs">
                    {periodPreset === 'MONTH' ? 'Bulan Ini' : 'Periode Berjalan'}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold mt-1">
                    {selectedDoctorSlip.doctorVisits.length} Pasien Ditangani
                  </div>
                </div>
              </div>

              {/* Patient Visits Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-2.5">Tgl</th>
                      <th className="py-2 px-2.5">Pasien</th>
                      <th className="py-2 px-2.5">Diagnosa</th>
                      <th className="py-2 px-2.5 text-right">Konsultasi</th>
                      <th className="py-2 px-2.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedDoctorSlip.doctorVisits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Tidak ada kunjungan pasien yang tercatat selesai pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      selectedDoctorSlip.doctorVisits.map((v) => {
                        const consult = v.billing?.consultationFee || selectedDoctorSlip.doctor.defaultConsultationFee || 75000;
                        const proc = v.billing?.proceduresFee || 0;
                        return (
                          <tr key={v.id} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 text-slate-500 font-mono text-[10px]">
                              {formatIndonesianDate(v.date)}
                            </td>
                            <td className="py-2 px-2.5 font-medium text-slate-900">{v.patient?.name}</td>
                            <td className="py-2 px-2.5 text-slate-600 line-clamp-1">
                              {v.medicalRecord?.diagnoses?.[0]?.name || v.chiefComplaintSummary || '-'}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono">{formatRupiah(consult)}</td>
                            <td className="py-2 px-2.5 text-right font-mono">
                              {proc > 0 ? formatRupiah(proc) : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Honor Summary */}
              {(() => {
                const totalGrossConsult = selectedDoctorSlip.doctorVisits.reduce(
                  (acc, v) => acc + (v.billing?.consultationFee || selectedDoctorSlip.doctor.defaultConsultationFee || 75000),
                  0
                );
                const totalGrossProc = selectedDoctorSlip.doctorVisits.reduce(
                  (acc, v) => acc + (v.billing?.proceduresFee || 0),
                  0
                );
                const shareConsult = Math.round((totalGrossConsult * doctorConsultationRate) / 100);
                const shareProc = Math.round((totalGrossProc * doctorProcedureRate) / 100);
                const totalTakeHome = shareConsult + shareProc;

                return (
                  <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Hak Jasa Konsultasi Medis ({doctorConsultationRate}%):</span>
                      <span className="font-mono font-bold text-slate-800">{formatRupiah(shareConsult)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Hak Jasa Tindakan Medis ({doctorProcedureRate}%):</span>
                      <span className="font-mono font-bold text-slate-800">{formatRupiah(shareProc)}</span>
                    </div>
                    <div className="border-t border-emerald-200 pt-2 flex justify-between text-sm">
                      <span className="font-extrabold text-emerald-950">Total Honorarium yang Diterima:</span>
                      <span className="font-mono font-black text-emerald-800 text-base">
                        {formatRupiah(totalTakeHome)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedDoctorSlip(null)} className="text-xs">
                Tutup
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  window.print();
                }}
                className="text-xs gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Slip Honor</span>
              </Button>
            </DialogFooter>
          </Dialog>
        )}

        {/* Modal: Slip Honorarium Perawat */}
        {selectedNurseSlip && (
          <Dialog open={true} onOpenChange={() => setSelectedNurseSlip(null)} maxWidth="lg">
            <DialogHeader onClose={() => setSelectedNurseSlip(null)}>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-teal-700" />
                <span>Slip Insentif Pelayanan Keperawatan</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Klinik / Faskes Primer: {config.practiceName || 'Klinik Sehat Sejahtera'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900">{selectedNurseSlip.nurse.name}</div>
                  <div className="text-slate-600 font-mono text-[11px]">SIKP: {selectedNurseSlip.nurse.sikp}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {selectedNurseSlip.nurse.profession} - {selectedNurseSlip.nurse.room}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Periode</div>
                  <div className="font-bold text-slate-800 text-xs">
                    {periodPreset === 'MONTH' ? 'Bulan Ini' : 'Periode Berjalan'}
                  </div>
                </div>
              </div>

              {(() => {
                const patientInc = selectedNurseSlip.visitCount * nursePerPatientRate;
                const shiftInc = 20 * (nurseShiftRate / 4);
                const totalTakeHome = patientInc + shiftInc;

                return (
                  <div className="bg-teal-50/70 p-4 rounded-xl border border-teal-200 space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Insentif Triase Pasien ({selectedNurseSlip.visitCount} Pasien × {formatRupiah(nursePerPatientRate)}):</span>
                      <span className="font-mono font-bold text-slate-800">{formatRupiah(patientInc)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Tunjangan Kehadiran Shift Jaga:</span>
                      <span className="font-mono font-bold text-slate-800">{formatRupiah(shiftInc)}</span>
                    </div>
                    <div className="border-t border-teal-200 pt-2 flex justify-between text-sm">
                      <span className="font-extrabold text-teal-950">Total Insentif yang Diterima:</span>
                      <span className="font-mono font-black text-teal-800 text-base">
                        {formatRupiah(totalTakeHome)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedNurseSlip(null)} className="text-xs">
                Tutup
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  window.print();
                }}
                className="text-xs gap-1.5 bg-teal-700 text-white hover:bg-teal-800"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Slip Insentif</span>
              </Button>
            </DialogFooter>
          </Dialog>
        )}
      </div>
    </MainLayout>
  );
}
