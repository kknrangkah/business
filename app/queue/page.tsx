'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { QueueTable } from '@/components/dashboard/queue-table';
import { useRME } from '@/context/rme-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Volume2,
  CalendarPlus,
  Play,
  VolumeX,
  Bell,
  Sparkles,
  Tv,
  Pill,
  Printer,
  CheckCircle2,
  Stethoscope,
  Hourglass,
  Check,
  PackageCheck,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { callQueuePatient, playHospitalChime } from '@/lib/audio-announcer';
import { MedicationLabelModal } from '@/components/pharmacy/medication-label-modal';
import { Visit, PrescriptionDispenseStatus } from '@/types/rme';

function QueuePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const { visits, refreshVisits, refreshPatients, updatePrescriptionStatus, config, currentUser } = useRME();

  const [activeTab, setActiveTab] = useState<'DOCTOR' | 'PHARMACY'>('DOCTOR');
  const [isCalling, setIsCalling] = useState(false);
  const [callingQueueNumber, setCallingQueueNumber] = useState<string | null>(null);

  // Sync tab with query param and user role
  useEffect(() => {
    if (tabParam === 'pharmacy' || tabParam === 'farmasi') {
      setActiveTab('PHARMACY');
    } else if (tabParam === 'doctor' || tabParam === 'dokter') {
      setActiveTab('DOCTOR');
    } else if (currentUser?.role === 'PHARMACIST' || (currentUser as any)?.role === 'apoteker') {
      setActiveTab('PHARMACY');
    }
  }, [tabParam, currentUser]);

  // Pharmacy Tab States
  const [selectedVisitForLabels, setSelectedVisitForLabels] = useState<Visit | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [pharmacyFilter, setPharmacyFilter] = useState<string>('ALL');
  const [pharmacySearch, setPharmacySearch] = useState<string>('');

  useEffect(() => {
    refreshVisits();
    refreshPatients();
  }, [refreshVisits, refreshPatients]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = useMemo(() => visits.filter((v) => v.date === todayStr), [visits, todayStr]);

  // Doctor Queue
  const waitingVisits = todayVisits.filter(
    (v) => v.status === 'WAITING' || v.status === 'REGISTERED'
  );
  const currentExamining = todayVisits.find((v) => v.status === 'IN_PROGRESS');

  // Pharmacy Queue (Visits that have prescription orders)
  const pharmacyVisits = useMemo(() => {
    return todayVisits.filter(
      (v) =>
        v.medicalRecord?.prescriptions &&
        v.medicalRecord.prescriptions.length > 0 &&
        v.status !== 'CANCELLED'
    );
  }, [todayVisits]);

  const filteredPharmacyVisits = useMemo(() => {
    return pharmacyVisits.filter((v) => {
      const pStatus = v.prescriptionStatus || v.medicalRecord?.prescriptionDispenseStatus || 'WAITING_REVIEW';
      if (pharmacyFilter !== 'ALL' && pStatus !== pharmacyFilter) return false;
      if (pharmacySearch.trim()) {
        const query = pharmacySearch.toLowerCase().trim();
        const patName = (v.patient?.name || '').toLowerCase();
        const noRM = (v.patient?.noRM || '').toLowerCase();
        const qNum = (v.queueNumber || '').toLowerCase();
        const nik = (v.patient?.nik || '').toLowerCase();
        return patName.includes(query) || noRM.includes(query) || qNum.includes(query) || nik.includes(query);
      }
      return true;
    });
  }, [pharmacyVisits, pharmacyFilter, pharmacySearch]);

  const pharmacyStats = useMemo(() => {
    let waiting = 0;
    let preparing = 0;
    let ready = 0;
    let dispensed = 0;

    pharmacyVisits.forEach((v) => {
      const s = v.prescriptionStatus || v.medicalRecord?.prescriptionDispenseStatus || 'WAITING_REVIEW';
      if (s === 'WAITING_REVIEW') waiting++;
      else if (s === 'PREPARING') preparing++;
      else if (s === 'READY_FOR_PICKUP') ready++;
      else if (s === 'DISPENSED') dispensed++;
    });

    return { total: pharmacyVisits.length, waiting, preparing, ready, dispensed };
  }, [pharmacyVisits]);

  const handleCallDoctorPatient = async (visit: Visit) => {
    setIsCalling(true);
    setCallingQueueNumber(visit.queueNumber);

    toast.info(
      `📢 MEMANGGIL: Nomor Antrian ${visit.queueNumber} - ${visit.patient.name} ke Ruang Pemeriksaan Dokter`,
      { duration: 6000 }
    );

    try {
      await callQueuePatient(visit.queueNumber, visit.patient.name, 'Ruang Pemeriksaan Dokter');
    } catch (err) {
      console.warn('Call patient sound error:', err);
    } finally {
      setIsCalling(false);
      setCallingQueueNumber(null);
    }
  };

  const handleCallPharmacyPatient = async (visit: Visit) => {
    setIsCalling(true);
    setCallingQueueNumber(visit.queueNumber);

    toast.info(
      `📢 MEMANGGIL FARMASI: Nomor Antrian ${visit.queueNumber} - ${visit.patient.name} ke Depo Farmasi`,
      { duration: 6000 }
    );

    try {
      await callQueuePatient(
        visit.queueNumber,
        visit.patient.name,
        'Depo Farmasi / Pengambilan Obat'
      );
    } catch (err) {
      console.warn('Call pharmacy sound error:', err);
    } finally {
      setIsCalling(false);
      setCallingQueueNumber(null);
    }
  };

  const handleUpdateDispenseStatus = (visitId: string, nextStatus: PrescriptionDispenseStatus) => {
    updatePrescriptionStatus(visitId, nextStatus, currentUser?.name);
    const labels: Record<PrescriptionDispenseStatus, string> = {
      WAITING_REVIEW: 'Resep Kembali ke Status Menunggu Telaah',
      PREPARING: 'Resep Mulai Diracik di Depo Farmasi',
      READY_FOR_PICKUP: 'Resep Selesai Diracik & Siap Diambil Pasien',
      DISPENSED: 'Obat Berhasil Diserahkan kepada Pasien',
    };
    toast.success(labels[nextStatus]);
  };

  const handleOpenLabelModal = (visit: Visit) => {
    setSelectedVisitForLabels(visit);
    setIsLabelModalOpen(true);
  };

  const handleTestChime = async () => {
    toast.success('🔔 Memutar bunyi bel antrian klinik...', { duration: 2500 });
    await playHospitalChime();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Clock className="h-6 w-6 text-emerald-700" />
              <span>Manajemen Antrian Pasien Hari Ini</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau antrian poli dokter &amp; depo farmasi, panggil pasien dengan audio bel otomatis, dan kelola alur resep obat.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/queue/display" target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl shadow-2xs cursor-pointer h-9"
                title="Buka Layar Display Antrian untuk Monitor TV Ruang Tunggu"
              >
                <Tv className="h-4 w-4 text-emerald-700" />
                <span>Display Antrian (TV)</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestChime}
              className="gap-1.5 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl shadow-2xs cursor-pointer h-9"
              title="Uji coba suara bel panggilan antrian"
            >
              <Bell className="h-3.5 w-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Uji Bel</span>
            </Button>

            <Link href="/registration">
              <Button className="gap-1.5 font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs rounded-xl cursor-pointer text-xs h-9">
                <CalendarPlus className="h-4 w-4" />
                <span>+ Pasien Baru</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Switcher: Antrean Dokter vs Antrean Farmasi */}
        <div className="flex items-center justify-between border-b border-slate-200 gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('DOCTOR');
                router.replace('/queue?tab=doctor', { scroll: false });
              }}
              className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'DOCTOR'
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Stethoscope className="h-4 w-4 text-emerald-700" />
              <span>Antrean Pemeriksaan Dokter</span>
              <Badge variant="outline" className="text-[11px] font-mono bg-white font-bold text-slate-700">
                {waitingVisits.length} Menunggu
              </Badge>
            </button>

            {config.hasPharmacy !== false && (
              <button
                onClick={() => {
                  setActiveTab('PHARMACY');
                  router.replace('/queue?tab=pharmacy', { scroll: false });
                }}
                className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'PHARMACY'
                    ? 'border-purple-600 text-purple-900 bg-purple-50/60 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Pill className="h-4 w-4 text-purple-700" />
                <span>Antrean Farmasi &amp; Resep Obat</span>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-mono font-bold ${
                    pharmacyStats.ready > 0
                      ? 'bg-purple-100 text-purple-900 border-purple-300 animate-pulse'
                      : 'bg-white text-slate-700'
                  }`}
                >
                  {pharmacyStats.total} Resep
                </Badge>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 font-medium hidden md:block">
            {todayVisits.length} Kunjungan Hari Ini
          </div>
        </div>

        {/* TAB 1: ANTREAN PEMERIKSAAN DOKTER */}
        {activeTab === 'DOCTOR' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Live Calling Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sedang Diperiksa Board */}
              <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 shadow-xs p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-ping" />
                    SEDANG DIPERIKSA DOKTER
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Ruang 1
                  </span>
                </div>

                {currentExamining ? (
                  <div className="mt-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-black font-mono text-emerald-800">
                        {currentExamining.queueNumber}
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {currentExamining.patient.name}
                      </div>
                      <div className="text-xs font-semibold text-slate-600 mt-0.5">
                        <span className="font-mono">{currentExamining.patient.noRM}</span> • {currentExamining.doctorName}
                      </div>
                    </div>

                    <Link href={`/examination/${currentExamining.id}`}>
                      <Button size="sm" className="gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl font-bold h-9 px-4 cursor-pointer shadow-xs">
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Ke Workspace</span>
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 text-center text-xs text-slate-500 font-medium py-3">
                    Tidak ada pasien yang sedang di dalam ruang periksa saat ini.
                  </div>
                )}
              </Card>

              {/* Pasien Berikutnya / Panggilan Cepat */}
              <Card className="border border-slate-200 bg-white shadow-xs p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-600" />
                    ANTRIAN BERIKUTNYA
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    {waitingVisits.length} Menunggu
                  </span>
                </div>

                {waitingVisits.length > 0 ? (
                  <div className="mt-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-black font-mono text-amber-700">
                        {waitingVisits[0].queueNumber}
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {waitingVisits[0].patient.name}
                      </div>
                      <div className="text-xs font-semibold text-slate-600 mt-0.5">
                        <span className="font-mono">{waitingVisits[0].patient.noRM}</span> • Jam {waitingVisits[0].time} WIB
                      </div>
                    </div>

                    <Button
                      size="sm"
                      disabled={isCalling}
                      onClick={() => handleCallDoctorPatient(waitingVisits[0])}
                      className={`gap-1.5 font-extrabold rounded-xl h-9 px-4 cursor-pointer shadow-2xs transition-all ${
                        isCalling && callingQueueNumber === waitingVisits[0].queueNumber
                          ? 'bg-amber-600 text-white animate-pulse'
                          : 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200'
                      }`}
                      title="Panggil antrian dengan bunyi bel dan suara ucapan otomatis"
                    >
                      <Volume2 className={`h-4 w-4 ${isCalling ? 'animate-bounce text-white' : 'text-amber-800'}`} />
                      <span>{isCalling && callingQueueNumber === waitingVisits[0].queueNumber ? 'Sedang Memanggil...' : 'Panggil Antrian'}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 text-center text-xs text-slate-500 font-medium py-3">
                    Semua antrian telah selesai diperiksa.
                  </div>
                )}
              </Card>
            </div>

            {/* Antrian Table */}
            <div className="space-y-2">
              <QueueTable />
            </div>
          </div>
        )}

        {/* TAB 2: ANTREAN FARMASI & RESEP OBAT */}
        {activeTab === 'PHARMACY' && (
          <div className="space-y-5 animate-in fade-in">
            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div
                onClick={() => setPharmacyFilter('WAITING_REVIEW')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  pharmacyFilter === 'WAITING_REVIEW'
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Menunggu Telaah</span>
                  <Hourglass className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                  {pharmacyStats.waiting}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Resep baru dari dokter</p>
              </div>

              <div
                onClick={() => setPharmacyFilter('PREPARING')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  pharmacyFilter === 'PREPARING'
                    ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-400/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Sedang Diracik</span>
                  <Pill className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                  {pharmacyStats.preparing}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Proses sediaan / etiket</p>
              </div>

              <div
                onClick={() => setPharmacyFilter('READY_FOR_PICKUP')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  pharmacyFilter === 'READY_FOR_PICKUP'
                    ? 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-400/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 font-extrabold">Siap Diambil</span>
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                </div>
                <div className="text-2xl font-black font-mono text-teal-800 mt-2">
                  {pharmacyStats.ready}
                </div>
                <p className="text-[11px] text-teal-700 mt-0.5">Siap dipanggil ke loket</p>
              </div>

              <div
                onClick={() => setPharmacyFilter('DISPENSED')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  pharmacyFilter === 'DISPENSED'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Selesai Diserahkan</span>
                  <PackageCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                  {pharmacyStats.dispensed}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Sudah diserahkan ke pasien</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setPharmacyFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pharmacyFilter === 'ALL'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({pharmacyStats.total})
                </button>
                <button
                  onClick={() => setPharmacyFilter('WAITING_REVIEW')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pharmacyFilter === 'WAITING_REVIEW'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Menunggu Telaah ({pharmacyStats.waiting})
                </button>
                <button
                  onClick={() => setPharmacyFilter('PREPARING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pharmacyFilter === 'PREPARING'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Sedang Diracik ({pharmacyStats.preparing})
                </button>
                <button
                  onClick={() => setPharmacyFilter('READY_FOR_PICKUP')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pharmacyFilter === 'READY_FOR_PICKUP'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Siap Diambil ({pharmacyStats.ready})
                </button>
                <button
                  onClick={() => setPharmacyFilter('DISPENSED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pharmacyFilter === 'DISPENSED'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Diserahkan ({pharmacyStats.dispensed})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={pharmacySearch}
                  onChange={(e) => setPharmacySearch(e.target.value)}
                  placeholder="Cari pasien / no. antrian..."
                  className="w-full pl-8.5 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
                {pharmacySearch && (
                  <button
                    type="button"
                    onClick={() => setPharmacySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Pharmacy Queue Table */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              {filteredPharmacyVisits.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <Pill className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">
                    Tidak Ada Resep dalam Kategori Ini
                  </p>
                  <p className="text-xs text-slate-500">
                    Resep yang diresepkan dokter di halaman pemeriksaan SOAP akan otomatis muncul di antrean ini.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredPharmacyVisits.map((v) => {
                    const pStatus: PrescriptionDispenseStatus =
                      v.prescriptionStatus ||
                      v.medicalRecord?.prescriptionDispenseStatus ||
                      'WAITING_REVIEW';
                    const prescriptions = v.medicalRecord?.prescriptions || [];

                    return (
                      <div
                        key={v.id}
                        className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors space-y-3"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          {/* Left: Queue Number & Patient */}
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-mono font-black text-sm flex flex-col items-center justify-center shrink-0 shadow-2xs">
                              <span>{v.queueNumber}</span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm sm:text-base text-slate-900">
                                  {v.patient.name}
                                </span>
                                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                  {v.patient.noRM}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs font-bold ${
                                    pStatus === 'WAITING_REVIEW'
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : pStatus === 'PREPARING'
                                      ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                                      : pStatus === 'READY_FOR_PICKUP'
                                      ? 'bg-teal-50 text-teal-900 border-teal-300 animate-pulse'
                                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  }`}
                                >
                                  {pStatus === 'WAITING_REVIEW'
                                    ? '⏳ Menunggu Telaah'
                                    : pStatus === 'PREPARING'
                                    ? '🧪 Sedang Diracik'
                                    : pStatus === 'READY_FOR_PICKUP'
                                    ? '🔔 Siap Diambil Pasien'
                                    : '✅ Obat Diserahkan'}
                                </Badge>
                              </div>

                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                <span>Dokter: <strong>{v.doctorName || config.doctorName}</strong></span>
                                <span>•</span>
                                <span>{v.patient.age || 30} Thn ({v.patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'})</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-700">
                                  Total {prescriptions.length} Item Obat
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
                            {/* Tombol Panggil Suara */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCalling}
                              onClick={() => handleCallPharmacyPatient(v)}
                              className={`gap-1.5 text-xs rounded-xl font-bold h-9 cursor-pointer transition-all ${
                                isCalling && callingQueueNumber === v.queueNumber
                                  ? 'bg-purple-600 text-white animate-pulse'
                                  : 'border-purple-200 text-purple-800 bg-purple-50/50 hover:bg-purple-100'
                              }`}
                              title="Panggil pasien ke Depo Farmasi dengan bel klinik dan suara TV display"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                              <span>
                                {isCalling && callingQueueNumber === v.queueNumber
                                  ? 'Memanggil...'
                                  : 'Panggil ke Farmasi'}
                              </span>
                            </Button>

                            {/* Tombol Cetak Etiket */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenLabelModal(v)}
                              className="gap-1.5 text-xs font-bold rounded-xl h-9 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
                              title="Cetak etiket obat putih/biru untuk ditempel pada klip obat"
                            >
                              <Printer className="h-3.5 w-3.5 text-slate-600" />
                              <span>Cetak Etiket</span>
                            </Button>

                            {/* Workflow Status Transition Button */}
                            {pStatus === 'WAITING_REVIEW' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateDispenseStatus(v.id, 'PREPARING')}
                                className="gap-1.5 text-xs font-bold rounded-xl h-9 bg-indigo-700 hover:bg-indigo-800 text-white shadow-xs cursor-pointer"
                              >
                                <span>Mulai Racik</span>
                              </Button>
                            )}

                            {pStatus === 'PREPARING' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateDispenseStatus(v.id, 'READY_FOR_PICKUP')}
                                className="gap-1.5 text-xs font-bold rounded-xl h-9 bg-teal-700 hover:bg-teal-800 text-white shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Siap Diambil</span>
                              </Button>
                            )}

                            {pStatus === 'READY_FOR_PICKUP' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateDispenseStatus(v.id, 'DISPENSED')}
                                className="gap-1.5 text-xs font-bold rounded-xl h-9 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
                              >
                                <PackageCheck className="h-3.5 w-3.5" />
                                <span>Serahkan Obat</span>
                              </Button>
                            )}

                            {pStatus === 'DISPENSED' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateDispenseStatus(v.id, 'READY_FOR_PICKUP')}
                                className="text-xs text-slate-400 hover:text-slate-700 h-9 px-2.5 rounded-xl cursor-pointer"
                                title="Batal serahkan / kembalikan status"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Prescriptions List Preview */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-wrap gap-2 text-xs">
                          {prescriptions.map((rx, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium"
                            >
                              <Pill className="h-3 w-3 text-purple-600" />
                              <strong className="text-slate-900">{rx.name}</strong>
                              <span className="text-slate-500 font-mono">
                                ({rx.quantity} {rx.unit})
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600 font-semibold">{rx.signa}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Cetak Etiket Obat */}
      <MedicationLabelModal
        open={isLabelModalOpen}
        onOpenChange={setIsLabelModalOpen}
        visit={selectedVisitForLabels}
      />
    </MainLayout>
  );
}

export default function QueuePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-2">
            <Clock className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Memuat Antrean Klinik &amp; Farmasi...</p>
          </div>
        </div>
      }
    >
      <QueuePageContent />
    </Suspense>
  );
}


