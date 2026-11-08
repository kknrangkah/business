'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRME } from '@/context/rme-context';
import {
  Clock,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  HeartPulse,
  Users,
  ArrowLeft,
  Sparkles,
  Stethoscope,
  Bell,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Pill,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatIndonesianDate } from '@/lib/utils';
import { callQueuePatient, playHospitalChime } from '@/lib/audio-announcer';
import { toast } from 'sonner';
import { Visit } from '@/types/rme';

export default function QueueDisplayPage() {
  const { config, visits, updateVisitStatus } = useRME();

  // Current time & date ticker
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Calling state
  const [isCallingNow, setIsCallingNow] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    queueNumber: string;
    patientName: string;
    roomName: string;
    doctorName?: string;
  } | null>(null);

  // Track patient IDs that have been called or are in progress/completed so they disappear from waiting queue
  const [calledVisitIds, setCalledVisitIds] = useState<Set<string>>(new Set());

  // Call history tracking for "Sebelumnya" and "Selanjutnya" navigation
  const [callHistory, setCallHistory] = useState<Visit[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Filter today's visits
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayVisits = useMemo(() => {
    return visits.filter((v) => v.date === todayStr);
  }, [visits, todayStr]);

  // Patients who are still waiting (excludes called/in-progress/completed)
  const waitingVisits = useMemo(() => {
    return todayVisits.filter(
      (v) =>
        (v.status === 'WAITING' || v.status === 'REGISTERED') &&
        !calledVisitIds.has(v.id) &&
        v.queueNumber !== activeCall?.queueNumber
    );
  }, [todayVisits, calledVisitIds, activeCall?.queueNumber]);

  const inProgressVisit = useMemo(() => {
    return todayVisits.find((v) => v.status === 'IN_PROGRESS');
  }, [todayVisits]);

  const completedCount = useMemo(() => {
    return todayVisits.filter(
      (v) => v.status === 'COMPLETED' || v.status === 'PAID' || v.status === 'WAITING_PAYMENT'
    ).length;
  }, [todayVisits]);

  // Pharmacy specific queue tracking for display monitor
  const pharmacyVisits = useMemo(() => {
    return todayVisits.filter(
      (v) => v.medicalRecord?.prescriptions && v.medicalRecord.prescriptions.length > 0
    );
  }, [todayVisits]);

  const pharmacyReadyVisits = useMemo(() => {
    return pharmacyVisits.filter(
      (v) => (v.prescriptionStatus || v.medicalRecord?.prescriptionDispenseStatus) === 'READY_FOR_PICKUP'
    );
  }, [pharmacyVisits]);

  const pharmacyPreparingVisits = useMemo(() => {
    return pharmacyVisits.filter(
      (v) => (v.prescriptionStatus || v.medicalRecord?.prescriptionDispenseStatus) === 'PREPARING'
    );
  }, [pharmacyVisits]);

  const isPharmacyCall = Boolean(
    activeCall?.roomName?.toLowerCase().includes('farmasi') ||
    activeCall?.roomName?.toLowerCase().includes('obat')
  );

  // Initial active call & called state population
  useEffect(() => {
    const initialCalled = new Set<string>();
    const initialHistory: Visit[] = [];

    todayVisits.forEach((v) => {
      if (
        v.status === 'IN_PROGRESS' ||
        v.status === 'COMPLETED' ||
        v.status === 'PAID' ||
        v.status === 'WAITING_PAYMENT'
      ) {
        initialCalled.add(v.id);
        initialHistory.push(v);
      }
    });

    setCalledVisitIds(initialCalled);

    if (inProgressVisit) {
      setActiveCall({
        queueNumber: inProgressVisit.queueNumber,
        patientName: inProgressVisit.patient.name,
        roomName: 'Ruang Pemeriksaan Dokter 1',
        doctorName: inProgressVisit.doctorName,
      });
      setCallHistory(initialHistory);
      setHistoryIndex(initialHistory.findIndex((v) => v.id === inProgressVisit.id));
    } else if (todayVisits.length > 0 && !activeCall) {
      // Preview the first patient
      const first = todayVisits[0];
      setActiveCall({
        queueNumber: first.queueNumber,
        patientName: first.patient.name,
        roomName: 'Ruang Pemeriksaan Dokter 1',
        doctorName: first.doctorName,
      });
    }
  }, [todayVisits.length]);

  // Real-time clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
      setCurrentDateStr(formatIndonesianDate(now.toISOString().split('T')[0], true));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to broadcast call events from other tabs (reception/doctor room)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'rme_broadcast_queue_call' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload && payload.queueNumber) {
            // Find visit in today's visits
            const matchedVisit = todayVisits.find(
              (v) => v.queueNumber === payload.queueNumber
            );

            if (matchedVisit) {
              setCalledVisitIds((prev) => new Set([...prev, matchedVisit.id]));
              setCallHistory((prev) => {
                const filtered = prev.filter((i) => i.id !== matchedVisit.id);
                const nextList = [...filtered, matchedVisit];
                setHistoryIndex(nextList.length - 1);
                return nextList;
              });
            }

            setActiveCall({
              queueNumber: payload.queueNumber,
              patientName: payload.patientName,
              roomName: payload.roomName || 'Ruang Pemeriksaan Dokter 1',
              doctorName: config.doctorName,
            });

            setIsCallingNow(true);
            setTimeout(() => setIsCallingNow(false), 6000);

            if (soundEnabled) {
              callQueuePatient(payload.queueNumber, payload.patientName, payload.roomName);
            }
          }
        } catch (err) {
          console.warn('Storage sync error:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [soundEnabled, config.doctorName, todayVisits]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Main call execution function
  const executeCall = async (
    visit: Visit,
    roomName: string = 'Ruang Pemeriksaan Dokter 1'
  ) => {
    setHasInteracted(true);
    setIsCallingNow(true);

    // 1. Update RME system visit status to IN_PROGRESS so all screens are synced
    updateVisitStatus(visit.id, 'IN_PROGRESS');

    // 2. Add to calledVisitIds so it IMMEDIATELY disappears from waiting list
    setCalledVisitIds((prev) => new Set([...prev, visit.id]));

    // 3. Add to callHistory and update historyIndex
    setCallHistory((prev) => {
      const filtered = prev.filter((i) => i.id !== visit.id);
      const nextList = [...filtered, visit];
      setHistoryIndex(nextList.length - 1);
      return nextList;
    });

    // 4. Update display Hero
    setActiveCall({
      queueNumber: visit.queueNumber,
      patientName: visit.patient.name,
      roomName,
      doctorName: visit.doctorName || config.doctorName,
    });

    // 5. Sound announcement
    try {
      if (soundEnabled) {
        await callQueuePatient(visit.queueNumber, visit.patient.name, roomName);
      }
    } finally {
      setTimeout(() => setIsCallingNow(false), 2500);
    }
  };

  // 1. Next Queue Button Handler
  const handleNextQueue = useCallback(() => {
    if (waitingVisits.length === 0) {
      toast.info('Semua antrian hari ini telah selesai dipanggil.', { duration: 3000 });
      return;
    }

    const nextPatient = waitingVisits[0];
    executeCall(nextPatient);
  }, [waitingVisits, soundEnabled]);

  // 2. Previous Queue Button Handler
  const handlePreviousQueue = useCallback(async () => {
    if (historyIndex <= 0 || callHistory.length === 0) {
      toast.info('Sudah berada di antrian paling awal dari riwayat panggilan.', { duration: 2500 });
      return;
    }

    const prevIndex = historyIndex - 1;
    const prevVisit = callHistory[prevIndex];
    setHistoryIndex(prevIndex);

    setHasInteracted(true);
    setIsCallingNow(true);

    setActiveCall({
      queueNumber: prevVisit.queueNumber,
      patientName: prevVisit.patient.name,
      roomName: 'Ruang Pemeriksaan Dokter 1',
      doctorName: prevVisit.doctorName || config.doctorName,
    });

    try {
      if (soundEnabled) {
        await callQueuePatient(
          prevVisit.queueNumber,
          prevVisit.patient.name,
          'Ruang Pemeriksaan Dokter 1'
        );
      }
    } finally {
      setTimeout(() => setIsCallingNow(false), 2500);
    }
  }, [historyIndex, callHistory, soundEnabled, config.doctorName]);

  // 3. Recall Current Active Patient
  const handleRecallCurrent = useCallback(async () => {
    if (!activeCall) return;
    setHasInteracted(true);
    setIsCallingNow(true);

    try {
      if (soundEnabled) {
        await callQueuePatient(activeCall.queueNumber, activeCall.patientName, activeCall.roomName);
      }
    } finally {
      setTimeout(() => setIsCallingNow(false), 2500);
    }
  }, [activeCall, soundEnabled]);

  const handleTestChime = async () => {
    setHasInteracted(true);
    toast.info('Memutar bel panggilan antrian...', { duration: 2000 });
    await playHospitalChime();
  };

  // Keyboard navigation shortcuts for TV remote presenter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'Enter') {
        e.preventDefault();
        handleNextQueue();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePreviousQueue();
      } else if (e.key.toLowerCase() === 'r' || e.key === ' ') {
        e.preventDefault();
        handleRecallCurrent();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextQueue, handlePreviousQueue, handleRecallCurrent]);

  // Next waiting queues list for the right panel (displays up to 5 items)
  const nextQueues = useMemo(() => {
    return waitingVisits.slice(0, 5);
  }, [waitingVisits]);

  return (
    <div
      onClick={() => setHasInteracted(true)}
      className="min-h-screen w-full bg-[#f4f7f6] text-slate-800 flex flex-col justify-between select-none overflow-hidden font-sans"
    >
      {/* Audio Autoplay Unblock Notification (if not yet interacted) */}
      {!hasInteracted && (
        <div
          onClick={() => setHasInteracted(true)}
          className="bg-emerald-700 text-white text-xs font-bold py-1.5 px-4 text-center cursor-pointer hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <Volume2 className="h-4 w-4 animate-bounce" />
          <span>Klik di mana saja pada layar ini untuk mengaktifkan suara bel & ucapan otomatis</span>
        </div>
      )}

      {/* Top Header Bar - Clean Light Theme */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-2xs">
        {/* Clinic Identity */}
        <div className="flex items-center gap-3.5">
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt="Logo"
              className="h-12 w-12 object-contain rounded-2xl p-0.5 border border-slate-200 bg-white shrink-0 shadow-2xs"
            />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-2xs shrink-0">
              <HeartPulse className="h-7 w-7" />
            </div>
          )}
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
              <span>{config.practiceName}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                DISPLAY ANTRIAN TV
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {config.doctorName} • {config.sip} • Telp: {config.phone}
            </p>
          </div>
        </div>

        {/* Live Clock & Top Controls */}
        <div className="flex items-center gap-5">
          {/* Digital Clock */}
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-800">
              {currentTime || '00:00:00'} <span className="text-xs font-sans font-bold text-emerald-600">WIB</span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {currentDateStr}
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`h-9 px-3 rounded-xl font-bold text-xs border cursor-pointer transition-all shadow-2xs ${
                soundEnabled
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title={soundEnabled ? 'Suara Aktif' : 'Suara Dimatikan'}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-emerald-700" />
              ) : (
                <VolumeX className="h-4 w-4 text-rose-500" />
              )}
              <span className="hidden md:inline ml-1.5">
                {soundEnabled ? 'Suara: ON' : 'Suara: OFF'}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestChime}
              className="h-9 px-3 rounded-xl font-bold text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer hidden sm:flex items-center gap-1.5 shadow-2xs"
              title="Uji coba bunyi bel antrian"
            >
              <Bell className="h-3.5 w-3.5 text-emerald-700" />
              <span>Uji Bel</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="h-9 px-3 rounded-xl font-bold text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Toggle Fullscreen TV (Shortcut: F)"
            >
              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">{isFullscreen ? 'Keluar' : 'Layar Penuh'}</span>
            </Button>

            <Link href="/queue">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3.5 rounded-xl font-bold text-xs bg-emerald-700 text-white hover:bg-emerald-800 border-emerald-700 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Loket</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Display Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* HERO LEFT PANEL: Currently Called / In-Progress Patient (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col">
          <div
            className={`flex-1 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-500 relative overflow-hidden border-2 shadow-sm bg-white ${
              isCallingNow && isPharmacyCall
                ? 'bg-gradient-to-br from-purple-50 via-white to-indigo-50/70 border-purple-500 ring-4 ring-purple-400/30'
                : isCallingNow
                ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/70 border-emerald-500 ring-4 ring-emerald-400/30'
                : isPharmacyCall
                ? 'bg-gradient-to-br from-white via-white to-purple-50/40 border-purple-200'
                : 'bg-gradient-to-br from-white via-white to-emerald-50/30 border-slate-200'
            }`}
          >
            {/* Top Status Badge */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black tracking-wider uppercase shadow-2xs ${
                    isCallingNow && isPharmacyCall
                      ? 'bg-purple-600 text-white animate-bounce'
                      : isCallingNow
                      ? 'bg-amber-500 text-slate-950 animate-bounce'
                      : isPharmacyCall
                      ? 'bg-purple-100 text-purple-950 border border-purple-300'
                      : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isCallingNow
                        ? 'bg-white animate-ping'
                        : isPharmacyCall
                        ? 'bg-purple-600 animate-pulse'
                        : 'bg-emerald-600 animate-ping'
                    }`}
                  />
                  {isCallingNow && isPharmacyCall
                    ? '📢 PANGGILAN DEPO FARMASI'
                    : isCallingNow
                    ? '📢 SEDANG MEMANGGIL'
                    : isPharmacyCall
                    ? 'PENYERAHAN OBAT • FARMASI'
                    : 'SEDANG DILAYANI DOKTER'}
                </span>

                <span className="text-xs sm:text-sm font-bold text-slate-600 hidden sm:inline">
                  {activeCall?.roomName || 'Ruang Pemeriksaan Dokter 1'}
                </span>
              </div>

              {/* Progress Count */}
              <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {callHistory.length > 0
                  ? `Antrian #${Math.max(1, historyIndex + 1)} dari ${todayVisits.length}`
                  : `${waitingVisits.length} Pasien Menunggu`}
              </div>
            </div>

            {/* Huge Queue Number Box */}
            <div className="py-4 sm:py-6 text-center relative z-10">
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-1">
                NOMOR ANTRIAN
              </div>

              <div
                className={`text-8xl sm:text-9xl font-black font-mono tracking-tight transition-all duration-300 ${
                  isCallingNow && isPharmacyCall
                    ? 'text-purple-600 scale-105 animate-pulse'
                    : isCallingNow
                    ? 'text-amber-600 scale-105 animate-pulse'
                    : isPharmacyCall
                    ? 'text-purple-900'
                    : 'text-emerald-800'
                }`}
              >
                {activeCall ? activeCall.queueNumber : '---'}
              </div>

              {/* Patient Name */}
              <div className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl mx-auto truncate">
                {activeCall ? activeCall.patientName : 'Menunggu Panggilan Antrian'}
              </div>

              {/* Direction Indicator */}
              <div
                className={`mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-2xl text-xs sm:text-sm font-bold shadow-2xs ${
                  isPharmacyCall
                    ? 'bg-purple-50 border border-purple-300 text-purple-950'
                    : 'bg-emerald-50 border border-emerald-300 text-emerald-950'
                }`}
              >
                {isPharmacyCall ? (
                  <Pill className="h-4 w-4 text-purple-700 shrink-0" />
                ) : (
                  <Stethoscope className="h-4 w-4 text-emerald-700 shrink-0" />
                )}
                <span>
                  SILAKAN MENUJU KE:{' '}
                  {(activeCall?.roomName || 'RUANG PERIKSA DOKTER 1').toUpperCase()}
                </span>
              </div>
            </div>

            {/* ── QUEUE NAVIGATION ACTION BAR (SEBELUMNYA, PANGGIL ULANG, SELANJUTNYA) ── */}
            <div className="py-3.5 px-4 sm:px-6 rounded-2xl bg-slate-50/90 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 shadow-2xs">
              {/* Tombol Antrian Sebelumnya */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handlePreviousQueue}
                disabled={historyIndex <= 0}
                className={`w-full sm:w-auto h-12 sm:h-13 px-4 sm:px-6 rounded-2xl font-black text-xs sm:text-sm border-2 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                  historyIndex <= 0
                    ? 'opacity-40 border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:border-slate-400 active:scale-95'
                }`}
                title="Kembali memanggil pasien sebelumnya (Shortcut: Panah Kiri)"
              >
                <ChevronLeft className="h-5 w-5 text-slate-700" />
                <span>Sebelumnya</span>
              </Button>

              {/* Tombol Panggil Ulang */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleRecallCurrent}
                disabled={!activeCall}
                className="w-full sm:w-auto h-12 sm:h-13 px-4 sm:px-6 rounded-2xl font-black text-xs sm:text-sm border-2 border-amber-300 bg-amber-50/90 hover:bg-amber-100 text-amber-950 flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Panggil ulang pasien yang sedang aktif di layar (Shortcut: Tombol R)"
              >
                <Volume2 className="h-5 w-5 text-amber-800" />
                <span>Panggil Ulang</span>
              </Button>

              {/* Tombol Antrian Selanjutnya */}
              <Button
                type="button"
                size="lg"
                onClick={handleNextQueue}
                disabled={waitingVisits.length === 0}
                className={`w-full sm:w-auto h-12 sm:h-13 px-5 sm:px-8 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer ${
                  waitingVisits.length === 0
                    ? 'opacity-40 bg-slate-300 text-slate-600 cursor-not-allowed'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95 ring-2 ring-emerald-500/30'
                }`}
                title="Panggil pasien antrian berikutnya (Shortcut: Panah Kanan / Enter)"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="h-5 w-5 text-white" />
              </Button>
            </div>

            {/* Doctor Info & Room Info Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 relative z-10 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600">Dokter Pemeriksa:</span>
                <span className="font-bold text-emerald-800">
                  {activeCall?.doctorName || config.doctorName}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Shortcut: [◀ Panah Kiri] Sebelumnya • [R] Panggil Ulang • [Panah Kanan ▶] Selanjutnya
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE PANEL: Next Waiting Queues & Room Status (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Next in Line Queue List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex-1 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span>ANTRIAN BERIKUTNYA</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {waitingVisits.length} Menunggu
                </span>
              </div>

              {/* Queue Items (Patients disappear once called) */}
              <div className="mt-4 space-y-2.5">
                {nextQueues.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                    <p className="font-bold text-sm text-slate-800">Semua Antrian Telah Dipanggil</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Tidak ada pasien yang sedang menunggu di ruang tunggu saat ini.
                    </p>
                  </div>
                ) : (
                  nextQueues.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => executeCall(item)}
                      className="bg-slate-50/80 hover:bg-emerald-50/70 border border-slate-200/90 hover:border-emerald-400 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-2xs"
                      title="Klik untuk langsung memanggil pasien ini"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-700 text-emerald-950 group-hover:text-white flex items-center justify-center font-mono font-black text-base border border-emerald-300 transition-colors shrink-0">
                          {item.queueNumber}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors truncate">
                            {item.patient.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.patient.noRM} • Jam {item.time} WIB
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                          Urutan #{idx + 1}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-400 group-hover:text-emerald-800 rounded-lg"
                          title="Panggil Sekarang"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Multi-Room / Doctor Counters Overview */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 mt-4">
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-900 uppercase">RUANG 1 (DOKTER)</div>
                <div className="text-xl font-black font-mono text-emerald-800 mt-0.5">
                  {inProgressVisit ? inProgressVisit.queueNumber : activeCall?.queueNumber || '-'}
                </div>
                <div className="text-[10px] text-slate-600 truncate">{config.doctorName}</div>
              </div>

              <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-200">
                <div className="text-[11px] font-bold text-purple-900 uppercase flex items-center justify-between">
                  <span>DEPO FARMASI</span>
                  <Pill className="h-3.5 w-3.5 text-purple-700" />
                </div>
                <div className="text-xl font-black font-mono text-purple-800 mt-0.5">
                  {pharmacyReadyVisits.length > 0 ? (
                    <span className="text-teal-700">{pharmacyReadyVisits.length} Siap Ambil</span>
                  ) : pharmacyPreparingVisits.length > 0 ? (
                    <span className="text-indigo-700">{pharmacyPreparingVisits.length} Diracik</span>
                  ) : (
                    <span>{pharmacyVisits.length} Resep</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-600 truncate">
                  {pharmacyReadyVisits.length > 0
                    ? `No: ${pharmacyReadyVisits.map((p) => p.queueNumber).slice(0, 3).join(', ')}`
                    : 'Apotek & Pengambilan Obat'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-2xs">
              <div className="text-xs text-slate-500 font-semibold">Total Antrian</div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                {todayVisits.length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-2xs">
              <div className="text-xs text-amber-700 font-semibold">Sisa Menunggu</div>
              <div className="text-2xl font-black font-mono text-amber-700 mt-0.5">
                {waitingVisits.length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-2xs">
              <div className="text-xs text-emerald-700 font-semibold">Selesai/Aktif</div>
              <div className="text-2xl font-black font-mono text-emerald-700 mt-0.5">
                {todayVisits.length - waitingVisits.length}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Running Marquee - Clean Light Theme */}
      <footer className="bg-white border-t border-slate-200 py-3 px-6 overflow-hidden flex items-center gap-4 shadow-2xs">
        <div className="flex items-center gap-1.5 text-white font-black text-xs uppercase tracking-wider whitespace-nowrap bg-emerald-700 px-3 py-1 rounded-xl shadow-2xs">
          <Sparkles className="h-3.5 w-3.5" />
          <span>INFORMASI:</span>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className="inline-block whitespace-nowrap animate-marquee text-xs sm:text-sm font-semibold text-slate-700">
            Selamat datang di {config.practiceName} • Mohon perhatikan nomor antrian yang tertera pada layar monitor • Harap menyiapkan identitas pasien (KTP / Kartu BPJS / Kartu Berobat) saat dipanggil ke ruang dokter • Jaga ketertiban, kebersihan, dan kenyamanan bersama di ruang tunggu • Apabila membutuhkan bantuan darurat, segera hubungi petugas loket.
          </div>
        </div>
      </footer>

      {/* Marquee Animation CSS */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
