'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRME } from '@/context/rme-context';
import { DashboardStatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PatientFormModal } from '@/components/patients/patient-form-modal';
import { formatIndonesianDate, formatRupiah, calculateAge } from '@/lib/utils';
import {
  Users,
  UserPlus,
  Clock,
  CreditCard,
  Search,
  Tv,
  Volume2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Stethoscope,
  Phone,
  Printer,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminDashboard() {
  const router = useRouter();
  const { config, patients, visits, updateVisitStatus } = useRME();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'POLI' | 'PAYMENT' | 'COMPLETED'>('ALL');
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [callingVisitId, setCallingVisitId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter((v) => v.date === todayStr);

  // Stats calculations
  const waitingAtCounter = todayVisits.filter(
    (v) => v.status === 'REGISTERED' || v.status === 'WAITING'
  ).length;

  const atPoli = todayVisits.filter((v) => v.status === 'IN_PROGRESS').length;

  const waitingPayment = todayVisits.filter((v) => v.status === 'WAITING_PAYMENT').length;

  const completedToday = todayVisits.filter(
    (v) => v.status === 'COMPLETED' || v.status === 'PAID'
  ).length;

  const totalRevenueToday = todayVisits
    .filter((v) => v.billing?.status === 'PAID')
    .reduce((acc, v) => acc + (v.billing?.grandTotal || 0), 0);

  // Filtered visits
  const filteredVisits = todayVisits.filter((v) => {
    const p = patients.find((pat) => pat.id === v.patientId);
    const matchesSearch =
      !searchQuery ||
      (p &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.noRM.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.nik.includes(searchQuery) ||
          p.phone.includes(searchQuery))) ||
      v.queueNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'WAITING') {
      return v.status === 'REGISTERED' || v.status === 'WAITING';
    }
    if (statusFilter === 'POLI') {
      return v.status === 'IN_PROGRESS';
    }
    if (statusFilter === 'PAYMENT') {
      return v.status === 'WAITING_PAYMENT';
    }
    if (statusFilter === 'COMPLETED') {
      return v.status === 'COMPLETED' || v.status === 'PAID';
    }
    return true;
  });

  // Handle calling patient via audio notification / toast
  const handleCallPatient = (v: typeof todayVisits[0]) => {
    const pat = patients.find((p) => p.id === v.patientId);
    setCallingVisitId(v.id);
    toast.success(`Memanggil Antrian ${v.queueNumber}`, {
      description: `Pasien: ${pat?.name || 'Pasien'} silakan menuju Loket Pendaftaran / Front Office.`,
    });

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const text = `Nomor antrian, ${v.queueNumber}. ${pat?.name || 'Pasien'}, silakan menuju loket pendaftaran.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }

    setTimeout(() => {
      setCallingVisitId(null);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Pelayanan Pasien & Pendaftaran */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 text-white shadow-md border border-blue-600/30">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs">
              Role: Admin & Pendaftaran (Front Office)
            </span>
            <span className="text-blue-100 text-xs font-medium">
              {formatIndonesianDate(todayStr, true)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Dashboard Pelayanan Pasien & Pendaftaran Loket
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
            Pusat operasional loket pendaftaran pasien, pemanggilan antrian faskes, verifikasi data identitas, dan administrasi pembayaran kasir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-center">
          <Button
            onClick={() => setIsPatientModalOpen(true)}
            className="bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shadow-xs h-9.5 gap-1.5 rounded-xl cursor-pointer"
          >
            <UserPlus className="h-4 w-4 text-blue-700" />
            <span>Daftar Pasien Baru</span>
          </Button>

          <Link href="/registration">
            <Button
              variant="outline"
              className="bg-blue-900/40 border-blue-400/40 text-white hover:bg-blue-900/60 font-bold text-xs h-9.5 gap-1.5 rounded-xl cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
              <span>Pendaftaran Lengkap</span>
            </Button>
          </Link>

          <Link href="/queue/display" target="_blank">
            <Button
              variant="outline"
              className="bg-blue-900/40 border-blue-400/40 text-white hover:bg-blue-900/60 font-bold text-xs h-9.5 gap-1.5 rounded-xl cursor-pointer"
            >
              <Tv className="h-4 w-4" />
              <span>Layar Antrian TV</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards Tailored for Patient Service */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Total Pasien Terdaftar Hari Ini"
          value={todayVisits.length}
          subtitle={`${patients.length} Pasien dalam master database`}
          icon={Users}
          colorTheme="blue"
        />
        <DashboardStatCard
          title="Menunggu Antrian Loket"
          value={waitingAtCounter}
          subtitle="Pasien menunggu verifikasi / poli"
          icon={Clock}
          colorTheme="amber"
        />
        <DashboardStatCard
          title="Pasien di Ruang Poli"
          value={atPoli}
          subtitle="Sedang konsultasi & pemeriksaan dokter"
          icon={Stethoscope}
          colorTheme="teal"
        />
        <DashboardStatCard
          title="Antrian Kasir & Tagihan"
          value={waitingPayment}
          subtitle={`Total lunas: ${formatRupiah(totalRevenueToday)}`}
          icon={CreditCard}
          colorTheme="emerald"
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Antrian Pelayanan Pasien Hari Ini */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-blue-700" />
                  <span>Daftar Pelayanan Pasien Hari Ini</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Pantau alur pelayanan pasien dari registrasi, poli dokter, hingga penyelesaian kasir.
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === 'ALL' ? 'bg-white text-blue-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Semua ({todayVisits.length})
                </button>
                <button
                  onClick={() => setStatusFilter('WAITING')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === 'WAITING' ? 'bg-white text-amber-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Menunggu ({waitingAtCounter})
                </button>
                <button
                  onClick={() => setStatusFilter('POLI')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === 'POLI' ? 'bg-white text-teal-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Poli ({atPoli})
                </button>
                <button
                  onClick={() => setStatusFilter('PAYMENT')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === 'PAYMENT' ? 'bg-white text-rose-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Kasir ({waitingPayment})
                </button>
              </div>
            </div>

            {/* Quick Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari pasien berdasarkan NIK, No. RM, Nama, atau No. Antrian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9.5 text-xs bg-slate-50/70 border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            {/* Patients Queue List */}
            {filteredVisits.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                <Users className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Tidak ada data pelayanan yang sesuai filter</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Gunakan tombol "Daftar Pasien Baru" di atas untuk mendaftarkan pasien ke antrian loket hari ini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto pr-1">
                {filteredVisits.map((v) => {
                  const pat = patients.find((p) => p.id === v.patientId);
                  const isCalling = callingVisitId === v.id;

                  let badgeColor = 'bg-slate-100 text-slate-700';
                  let statusText = 'Terdaftar';

                  if (v.status === 'WAITING' || v.status === 'REGISTERED') {
                    badgeColor = 'bg-amber-100 text-amber-900 border-amber-200';
                    statusText = 'Antrian Menunggu';
                  } else if (v.status === 'IN_PROGRESS') {
                    badgeColor = 'bg-teal-100 text-teal-900 border-teal-200';
                    statusText = 'Diperiksa Dokter';
                  } else if (v.status === 'WAITING_PAYMENT') {
                    badgeColor = 'bg-rose-100 text-rose-900 border-rose-200 animate-pulse';
                    statusText = 'Menunggu Kasir';
                  } else if (v.status === 'COMPLETED' || v.status === 'PAID') {
                    badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-200';
                    statusText = 'Selesai & Lunas';
                  }

                  return (
                    <div
                      key={v.id}
                      className="py-3 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col items-center justify-center shrink-0 font-mono font-black text-sm shadow-2xs">
                          <span className="text-[9px] uppercase font-bold text-blue-500 leading-none">Antrian</span>
                          <span>{v.queueNumber}</span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {pat?.name || 'Pasien Tanpa Nama'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                              {pat?.noRM || '-'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                              {statusText}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 mt-0.5">
                            <span>{pat?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                            <span>•</span>
                            <span>{pat?.birthDate ? `${calculateAge(pat.birthDate)} thn` : '-'}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">
                              Pembayaran: {v.paymentType || 'UMUM'}
                            </span>
                            {(v.chiefComplaintSummary || v.medicalRecord?.chiefComplaint) && (
                              <>
                                <span>•</span>
                                <span className="italic text-slate-600 truncate max-w-[200px]">
                                  "{v.chiefComplaintSummary || v.medicalRecord?.chiefComplaint}"
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCallPatient(v)}
                          disabled={isCalling}
                          className="h-8 px-2.5 text-xs font-bold text-blue-700 hover:text-blue-800 hover:bg-blue-50 border-blue-200 rounded-lg cursor-pointer"
                          title="Panggil pasien lewat suara"
                        >
                          <Volume2 className={`h-3.5 w-3.5 mr-1 ${isCalling ? 'animate-bounce text-blue-600' : ''}`} />
                          <span>{isCalling ? 'Memanggil...' : 'Panggil'}</span>
                        </Button>

                        {v.status === 'WAITING_PAYMENT' ? (
                          <Link href="/billing">
                            <Button
                              size="sm"
                              className="h-8 px-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-xs"
                            >
                              <CreditCard className="h-3.5 w-3.5 mr-1" />
                              <span>Kasir</span>
                            </Button>
                          </Link>
                        ) : (
                          <Link href="/queue">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 rounded-lg"
                              title="Lihat alur antrian"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Antrian Kasir Menunggu & Quick Widgets */}
        <div className="space-y-4">
          {/* Kasir & Pembayaran Menunggu Alert */}
          <Card className="p-5 border border-rose-200 bg-rose-50/40 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Antrian Kasir Menunggu</h3>
                  <p className="text-[11px] text-slate-500">Pasien selesai konsultasi dokter</p>
                </div>
              </div>
              <Badge className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5">
                {waitingPayment} Pasien
              </Badge>
            </div>

            {waitingPayment === 0 ? (
              <div className="p-4 rounded-xl bg-white border border-rose-100 text-center text-xs text-slate-500">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <span>Semua tagihan kasir telah selesai diselesaikan.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {todayVisits
                  .filter((v) => v.status === 'WAITING_PAYMENT')
                  .slice(0, 3)
                  .map((v) => {
                    const pat = patients.find((p) => p.id === v.patientId);
                    return (
                      <div
                        key={v.id}
                        className="p-2.5 rounded-xl bg-white border border-rose-200/80 flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {pat?.name || 'Pasien'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Antrian {v.queueNumber} • {formatRupiah(v.billing?.grandTotal || 0)}
                          </div>
                        </div>
                        <Link href="/billing">
                          <Button size="sm" className="h-7 px-2 text-[11px] font-bold bg-rose-600 text-white rounded-lg">
                            Bayar
                          </Button>
                        </Link>
                      </div>
                    );
                  })}

                <Link href="/billing" className="block pt-1">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-100/50 rounded-xl h-8.5"
                  >
                    Buka Halaman Kasir Lengkap
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* SOP Alur Pelayanan Pasien Guide */}
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Alur Pelayanan Pasien Faskes
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-blue-50/70 border border-blue-200/70">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-700 text-[10px] font-bold text-white">
                  1
                </span>
                <div>
                  <div className="font-bold text-blue-950">Loket Pendaftaran</div>
                  <div className="text-[11px] text-blue-800">Verifikasi NIK, cetak karcis antrian & no RM.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-600 text-[10px] font-bold text-white">
                  2
                </span>
                <div>
                  <div className="font-bold text-slate-900">Stasiun Triase Perawat</div>
                  <div className="text-[11px] text-slate-500">Pemeriksaan vital sign (tensi, suhu, BB, TB).</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-600 text-[10px] font-bold text-white">
                  3
                </span>
                <div>
                  <div className="font-bold text-slate-900">Ruang Praktik Dokter</div>
                  <div className="text-[11px] text-slate-500">Konsultasi SOAP, diagnosa ICD-10, tindakan klinis.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-600 text-[10px] font-bold text-white">
                  4
                </span>
                <div>
                  <div className="font-bold text-slate-900">Kasir & Pengambilan Obat</div>
                  <div className="text-[11px] text-slate-500">Penerimaan pembayaran, kwitansi, penyerahan e-resep.</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Nav Shortcuts */}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/patients">
              <Button
                variant="outline"
                className="w-full h-12 flex flex-col items-center justify-center text-[11px] font-bold text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl"
              >
                <Users className="h-4 w-4 mb-0.5 text-blue-700" />
                <span>Buku Pasien</span>
              </Button>
            </Link>

            <Link href="/reports/visits">
              <Button
                variant="outline"
                className="w-full h-12 flex flex-col items-center justify-center text-[11px] font-bold text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl"
              >
                <Calendar className="h-4 w-4 mb-0.5 text-blue-700" />
                <span>Laporan Harian</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Patient Registration Modal */}
      <PatientFormModal
        open={isPatientModalOpen}
        onOpenChange={setIsPatientModalOpen}
      />
    </div>
  );
}
