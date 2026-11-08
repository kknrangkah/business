'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRME } from '@/context/rme-context';
import { DashboardStatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatIndonesianDate } from '@/lib/utils';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  ArrowRight,
  PackagePlus,
  FileCheck,
  Search,
  Volume2,
  Printer,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { callQueuePatient } from '@/lib/audio-announcer';
import { MedicationLabelModal } from '@/components/pharmacy/medication-label-modal';
import { PrescriptionDispenseStatus, Visit } from '@/types/rme';

export function PharmacistDashboard() {
  const {
    medications,
    visits,
    patients,
    updateMedication,
    updatePrescriptionStatus,
    currentUser,
    config,
  } = useRME();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter((v) => v.date === todayStr);

  // Visits that have prescriptions
  const visitsWithPrescription = todayVisits.filter(
    (v) => v.medicalRecord?.prescriptions && v.medicalRecord.prescriptions.length > 0
  );

  // Filter & Search states
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Audio calling & label modal states
  const [isCalling, setIsCalling] = useState(false);
  const [callingQueueNumber, setCallingQueueNumber] = useState<string | null>(null);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [selectedVisitForLabel, setSelectedVisitForLabel] = useState<Visit | null>(null);

  // Critical stock items (stock <= 20)
  const criticalStockMeds = medications.filter((m) => m.stock <= 20);

  // Calculate workflow counts
  const countWaiting = visitsWithPrescription.filter((v) => {
    const st = v.prescriptionStatus || v.medicalRecord?.prescriptionDispenseStatus || 'WAITING_REVIEW';
    return st === 'WAITING_REVIEW';
  }).length;

  const countPreparing = visitsWithPrescription.filter((v) => {
    const st = v.prescriptionStatus || v.medicalRecord?.prescriptionDispenseStatus;
    return st === 'PREPARING';
  }).length;

  const countReady = visitsWithPrescription.filter((v) => {
    const st = v.prescriptionStatus || v.medicalRecord?.prescriptionDispenseStatus;
    return st === 'READY_FOR_PICKUP';
  }).length;

  const countDispensed = visitsWithPrescription.filter((v) => {
    const st = v.prescriptionStatus || v.medicalRecord?.prescriptionDispenseStatus;
    return st === 'DISPENSED';
  }).length;

  // Filtered prescription visits
  const filteredVisits = useMemo(() => {
    return visitsWithPrescription.filter((v) => {
      const pStatus: PrescriptionDispenseStatus =
        v.prescriptionStatus ||
        v.medicalRecord?.prescriptionDispenseStatus ||
        'WAITING_REVIEW';

      if (filterStatus !== 'ALL' && pStatus !== filterStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const pat = patients.find((p) => p.id === v.patientId) || (v as any).patient;
        const patName = (pat?.name || '').toLowerCase();
        const noRM = (pat?.noRM || '').toLowerCase();
        const queue = (v.queueNumber || '').toLowerCase();
        return patName.includes(query) || noRM.includes(query) || queue.includes(query);
      }

      return true;
    });
  }, [visitsWithPrescription, filterStatus, searchQuery, patients]);

  const handleUpdateStatus = (visitId: string, nextStatus: PrescriptionDispenseStatus) => {
    updatePrescriptionStatus(visitId, nextStatus, currentUser?.name);
    const labels: Record<PrescriptionDispenseStatus, string> = {
      WAITING_REVIEW: 'Resep Dikembalikan ke Antrean Telaah',
      PREPARING: 'Sedang Diracik di Depo Farmasi',
      READY_FOR_PICKUP: 'Resep Selesai Diracik & Siap Diserahkan',
      DISPENSED: 'Obat Berhasil Diserahkan kepada Pasien',
    };
    toast.success(labels[nextStatus]);
  };

  const handleCallPharmacyPatient = async (visit: Visit) => {
    try {
      setIsCalling(true);
      setCallingQueueNumber(visit.queueNumber);
      const pat = patients.find((p) => p.id === visit.patientId) || (visit as any).patient;
      const patientName = pat?.name || 'Pasien';
      await callQueuePatient(
        visit.queueNumber,
        patientName,
        'Depo Farmasi / Pengambilan Obat'
      );
      toast.success(
        `Memanggil antrian ${visit.queueNumber} (${patientName}) ke Depo Farmasi`
      );
    } catch (err) {
      console.error('Failed to call pharmacy patient:', err);
      toast.error('Gagal memutar audio panggilan');
    } finally {
      setIsCalling(false);
      setCallingQueueNumber(null);
    }
  };

  const handleOpenLabelModal = (visit: Visit) => {
    setSelectedVisitForLabel(visit);
    setLabelModalOpen(true);
  };

  const handleQuickRestock = (medId: string, medName: string) => {
    const med = medications.find((m) => m.id === medId);
    if (!med) return;
    updateMedication(medId, { stock: med.stock + 50 });
    toast.success(`Stok ${medName} berhasil ditambah +50 unit!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Depo Farmasi */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 p-6 text-white shadow-md border border-purple-600/30">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs">
              Role: Farmasis & Pengelola Apotek
            </span>
            <span className="text-purple-200 text-xs font-medium">
              {formatIndonesianDate(todayStr, true)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Dashboard Depo Farmasi & Antrean Resep
          </h1>
          <p className="text-xs sm:text-sm text-purple-100/90 max-w-2xl leading-relaxed">
            Selamat bertugas, <span className="font-bold text-white">{currentUser?.name || 'Apt. Hendra Pratama, S.Farm'}</span>. Pantau alur resep masuk dokter, peracikan obat, pencetakan etiket klinis, dan panggil pasien via display TV antrean.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-center">
          <Link href="/queue">
            <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs h-9.5 gap-1.5 rounded-xl cursor-pointer">
              <Clock className="h-4 w-4" />
              <span>Layar Antrean Farmasi</span>
            </Button>
          </Link>
          <Link href="/medications">
            <Button className="bg-white text-purple-950 hover:bg-purple-50 font-bold text-xs shadow-xs h-9.5 gap-1.5 rounded-xl cursor-pointer">
              <Pill className="h-4 w-4 text-purple-700" />
              <span>Formularium Obat</span>
            </Button>
          </Link>
          <Link href="/reports/stock-opname">
            <Button
              variant="outline"
              className="bg-purple-900/40 border-purple-400/40 text-white hover:bg-purple-900/60 font-bold text-xs h-9.5 gap-1.5 rounded-xl cursor-pointer"
            >
              <Boxes className="h-4 w-4" />
              <span>Stock Opname</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Total Resep Masuk"
          value={visitsWithPrescription.length}
          subtitle={`${countWaiting} menunggu telaah`}
          icon={Clock}
          colorTheme="purple"
        />
        <DashboardStatCard
          title="Sedang Diracik"
          value={countPreparing}
          subtitle="Dalam proses depo farmasi"
          icon={Pill}
          colorTheme="blue"
        />
        <DashboardStatCard
          title="Siap Diserahkan"
          value={countReady}
          subtitle="Siap dipanggil ke apotek"
          icon={CheckCircle2}
          colorTheme="teal"
        />
        <DashboardStatCard
          title="Peringatan Stok Kritis"
          value={criticalStockMeds.length}
          subtitle="Obat di bawah batas minimum"
          icon={AlertTriangle}
          colorTheme="amber"
        />
      </div>

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Antrian E-Resep Dokter Masuk */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="h-4.5 w-4.5 text-purple-700" />
                  <span>Antrean E-Resep Dokter Hari Ini</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Daftar resep SOAP dokter secara langsung dengan kontrol status dan etiket obat.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold border-purple-200 text-purple-800 bg-purple-50">
                  {visitsWithPrescription.length} Total E-Resep
                </Badge>
              </div>
            </div>

            {/* Quick Status Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === 'ALL'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({visitsWithPrescription.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('WAITING_REVIEW')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === 'WAITING_REVIEW'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Telaah ({countWaiting})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('PREPARING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === 'PREPARING'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                  }`}
                >
                  Diracik ({countPreparing})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('READY_FOR_PICKUP')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === 'READY_FOR_PICKUP'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                  }`}
                >
                  Siap ({countReady})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('DISPENSED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === 'DISPENSED'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Selesai ({countDispensed})
                </button>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pasien / no RM..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
            </div>

            {/* Prescription List */}
            {filteredVisits.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2 mt-4">
                <Pill className="h-8 w-8 text-purple-300 mx-auto" />
                <p className="text-xs font-bold text-slate-800">
                  {visitsWithPrescription.length === 0
                    ? 'Belum Ada E-Resep Hari Ini'
                    : 'Tidak Ada Resep yang Sesuai Kriteria Filter'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Resep baru yang diinput dokter di halaman SOAP akan otomatis masuk ke antrean depo farmasi ini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {filteredVisits.map((v) => {
                  const pat = patients.find((p) => p.id === v.patientId) || (v as any).patient;
                  const prescriptions = v.medicalRecord?.prescriptions || [];
                  const status: PrescriptionDispenseStatus =
                    v.prescriptionStatus ||
                    v.medicalRecord?.prescriptionDispenseStatus ||
                    'WAITING_REVIEW';

                  return (
                    <div key={v.id} className="py-4 px-2 space-y-3 hover:bg-slate-50/60 rounded-xl transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex flex-col items-center justify-center shrink-0 font-mono font-black text-xs shadow-2xs">
                            <span>{v.queueNumber}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900">{pat?.name || 'Pasien'}</span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                                {pat?.noRM || '-'}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  status === 'DISPENSED'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : status === 'READY_FOR_PICKUP'
                                    ? 'bg-teal-50 text-teal-800 border-teal-200 animate-pulse'
                                    : status === 'PREPARING'
                                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {status === 'DISPENSED'
                                  ? '✅ Obat Diserahkan'
                                  : status === 'READY_FOR_PICKUP'
                                  ? '🔔 Siap Diambil'
                                  : status === 'PREPARING'
                                  ? '🧪 Sedang Diracik'
                                  : '⏳ Menunggu Telaah'}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Dokter: <span className="font-semibold text-slate-700">{v.doctorName || config.doctorName || 'Dokter Pemeriksa'}</span>
                              <span className="mx-1.5">•</span>
                              <span>{prescriptions.length} Item Obat</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Call, Print Label, Workflow Transition */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                          {/* Tombol Panggil Suara */}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isCalling}
                            onClick={() => handleCallPharmacyPatient(v)}
                            className={`h-8 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                              isCalling && callingQueueNumber === v.queueNumber
                                ? 'bg-purple-600 text-white animate-pulse'
                                : 'border-purple-200 text-purple-800 bg-purple-50/70 hover:bg-purple-100'
                            }`}
                            title="Panggil pasien ke Depo Farmasi dengan suara audio & display TV"
                          >
                            <Volume2 className="h-3.5 w-3.5 mr-1" />
                            <span>
                              {isCalling && callingQueueNumber === v.queueNumber
                                ? 'Memanggil...'
                                : 'Panggil'}
                            </span>
                          </Button>

                          {/* Tombol Cetak Etiket */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenLabelModal(v)}
                            className="h-8 text-xs font-bold rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
                            title="Cetak etiket obat klinis putih / biru"
                          >
                            <Printer className="h-3.5 w-3.5 mr-1 text-slate-600" />
                            <span>Etiket</span>
                          </Button>

                          {/* Workflow status buttons */}
                          {status === 'WAITING_REVIEW' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(v.id, 'PREPARING')}
                              className="h-8 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg shadow-2xs cursor-pointer"
                            >
                              Mulai Racik
                            </Button>
                          )}
                          {status === 'PREPARING' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(v.id, 'READY_FOR_PICKUP')}
                              className="h-8 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-lg shadow-2xs cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Tandai Siap
                            </Button>
                          )}
                          {status === 'READY_FOR_PICKUP' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(v.id, 'DISPENSED')}
                              className="h-8 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-2xs cursor-pointer"
                            >
                              <FileCheck className="h-3.5 w-3.5 mr-1" />
                              Serahkan Obat
                            </Button>
                          )}
                          {status === 'DISPENSED' && (
                            <Badge variant="outline" className="text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-200 py-1 px-2 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Selesai
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Prescriptions item list */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                        {prescriptions.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{p.name}</span>
                              <span className="font-mono text-purple-700 font-bold">x {p.quantity}</span>
                            </div>
                            <span className="text-slate-500 font-medium italic">{p.signa || '3x1 sesudah makan'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Peringatan Stok Obat Kritis */}
        <div className="space-y-4">
          <Card className="p-5 border border-amber-200 bg-amber-50/40 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Peringatan Stok Kritis</h3>
                  <p className="text-[10px] text-slate-500">Stok di bawah batas minimum</p>
                </div>
              </div>
              <Badge className="bg-amber-600 text-white text-[10px] font-bold">
                {criticalStockMeds.length} Item
              </Badge>
            </div>

            {criticalStockMeds.length === 0 ? (
              <div className="p-4 rounded-xl bg-white border border-amber-100 text-center text-xs text-slate-500">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <span>Semua stok obat aman di atas batas minimum.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {criticalStockMeds.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="font-bold text-slate-900 truncate">{m.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Tersisa: <span className="font-bold text-rose-700">{m.stock} {m.unit}</span> (Batas Min: 20)
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleQuickRestock(m.id, m.name)}
                      className="h-7 px-2.5 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shrink-0 cursor-pointer"
                    >
                      <PackagePlus className="h-3 w-3 mr-1" />
                      +50 Stok
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Shortcuts */}
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Operasional Farmasi
            </h3>

            <div className="space-y-2">
              <Link href="/queue">
                <Button
                  variant="outline"
                  className="w-full h-10 justify-start text-xs font-bold text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl"
                >
                  <Clock className="h-4 w-4 mr-2 text-purple-700" />
                  <span>Antrean Farmasi & Panggilan Pasien</span>
                </Button>
              </Link>

              <Link href="/medications">
                <Button
                  variant="outline"
                  className="w-full h-10 justify-start text-xs font-bold text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl"
                >
                  <Pill className="h-4 w-4 mr-2 text-purple-700" />
                  <span>Katalog Master Obat & Harga</span>
                </Button>
              </Link>

              <Link href="/reports/stock-opname">
                <Button
                  variant="outline"
                  className="w-full h-10 justify-start text-xs font-bold text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl"
                >
                  <Boxes className="h-4 w-4 mr-2 text-indigo-700" />
                  <span>Riwayat Stock Opname Bulanan</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Medication Label Modal */}
      <MedicationLabelModal
        isOpen={labelModalOpen}
        onClose={() => {
          setLabelModalOpen(false);
          setSelectedVisitForLabel(null);
        }}
        visit={selectedVisitForLabel}
      />
    </div>
  );
}

