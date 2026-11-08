'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Stethoscope,
  Receipt,
  CheckCircle2,
  Play,
  Eye,
  User,
  Volume2,
  Sparkles,
  Ban,
  AlertTriangle,
  XCircle,
  HeartPulse,
  ClipboardList,
  Activity,
  BookOpen,
  Pill,
  FileText,
  ArrowRight,
  ShieldAlert,
  Info,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRME } from '@/context/rme-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { MedicalResumeModal } from '@/components/examination/medical-resume-modal';
import { Visit, VisitStatus } from '@/types/rme';
import { formatIndonesianDate, formatRupiah } from '@/lib/utils';
import { callQueuePatient } from '@/lib/audio-announcer';

export interface ExaminationInputDetail {
  category: string;
  badge: string;
  summary: string;
  details: string[];
}

// Inspect visit to detect and detail any existing examination inputs
export const inspectExaminationInputs = (visit: Visit): ExaminationInputDetail[] => {
  const inputs: ExaminationInputDetail[] = [];
  const mr = visit.medicalRecord;
  if (!mr) return inputs;

  // 1. Tanda-Tanda Vital (TTV)
  const vs = mr.vitalSigns;
  if (
    vs &&
    ((vs.systolic && vs.systolic > 0) ||
      (vs.diastolic && vs.diastolic > 0) ||
      (vs.heartRate && vs.heartRate > 0) ||
      (vs.temperature && vs.temperature > 0) ||
      (vs.weight && vs.weight > 0) ||
      (vs.height && vs.height > 0) ||
      (vs.respiratoryRate && vs.respiratoryRate > 0) ||
      (vs.oxygenSaturation && vs.oxygenSaturation > 0))
  ) {
    const details: string[] = [];
    if (vs.systolic > 0 && vs.diastolic > 0) details.push(`Tekanan Darah: ${vs.systolic}/${vs.diastolic} mmHg`);
    if (vs.heartRate > 0) details.push(`Denyut Nadi: ${vs.heartRate} x/menit`);
    if (vs.temperature > 0) details.push(`Suhu Tubuh: ${vs.temperature} °C`);
    if (vs.respiratoryRate > 0) details.push(`Laju Pernapasan: ${vs.respiratoryRate} x/menit`);
    if (vs.weight > 0) details.push(`Berat Badan: ${vs.weight} kg`);
    if (vs.height > 0) details.push(`Tinggi Badan: ${vs.height} cm`);
    if (vs.oxygenSaturation && vs.oxygenSaturation > 0) details.push(`Saturasi Oksigen (SpO2): ${vs.oxygenSaturation}%`);

    inputs.push({
      category: 'Tanda-Tanda Vital (TTV)',
      badge: 'Vital Signs',
      summary: `${details.length} parameter tanda vital telah diukur dan tercatat`,
      details,
    });
  }

  // 2. Keluhan Utama & Anamnesis (Subjective)
  const subjectiveDetails: string[] = [];
  if (mr.chiefComplaint && mr.chiefComplaint.trim().length > 0) {
    subjectiveDetails.push(`Keluhan Utama: "${mr.chiefComplaint.trim()}"`);
  }
  if (mr.anamnesis && mr.anamnesis.trim().length > 0) {
    const snippet = mr.anamnesis.trim().slice(0, 70);
    subjectiveDetails.push(`Riwayat Anamnesis: "${snippet}${mr.anamnesis.trim().length > 70 ? '...' : ''}"`);
  }
  if (subjectiveDetails.length > 0) {
    inputs.push({
      category: 'Keluhan Utama & Anamnesis (Subjective)',
      badge: 'Anamnesis',
      summary: 'Data keluhan dan riwayat penyakit pasien telah diisi',
      details: subjectiveDetails,
    });
  }

  // 3. Pemeriksaan Fisik (Objective)
  if (mr.physicalExamination && mr.physicalExamination.trim().length > 0) {
    const snippet = mr.physicalExamination.trim().slice(0, 90);
    inputs.push({
      category: 'Pemeriksaan Fisik (Objective)',
      badge: 'Status Fisik',
      summary: 'Catatan evaluasi fisik umum / lokalis pasien telah dimasukkan',
      details: [`Temuan Fisik: "${snippet}${mr.physicalExamination.trim().length > 90 ? '...' : ''}"`],
    });
  }

  // 4. Diagnosis Medis (ICD-10)
  if (mr.diagnoses && mr.diagnoses.length > 0) {
    inputs.push({
      category: 'Diagnosis Medis (ICD-10)',
      badge: `${mr.diagnoses.length} Diagnosa`,
      summary: `${mr.diagnoses.length} diagnosis medis telah ditetapkan oleh dokter`,
      details: mr.diagnoses.map(
        (d) => `[${d.code}] ${d.name} (${d.type === 'PRIMARY' ? 'Diagnosis Utama' : 'Diagnosis Sekunder'})`
      ),
    });
  }

  // 5. Tindakan Medis (ICD-9-CM)
  if (mr.procedures && mr.procedures.length > 0) {
    inputs.push({
      category: 'Tindakan Medis (ICD-9-CM)',
      badge: `${mr.procedures.length} Tindakan`,
      summary: `${mr.procedures.length} tindakan / prosedur medis telah dicatat`,
      details: mr.procedures.map((p) => `[${p.code}] ${p.name} - Tarif: ${formatRupiah(p.finalPrice ?? p.price)}`),
    });
  }

  // 6. E-Resep & Terapi Farmasi (Plan)
  if (mr.prescriptions && mr.prescriptions.length > 0) {
    inputs.push({
      category: 'E-Resep Obat & Terapi Farmasi (Plan)',
      badge: `${mr.prescriptions.length} Resep`,
      summary: `${mr.prescriptions.length} item obat telah diresepkan`,
      details: mr.prescriptions.map((rx) => `${rx.name} (${rx.quantity} ${rx.unit}) • Aturan Pakai: ${rx.signa}`),
    });
  }

  // 7. Catatan Klinis, Rencana Lanjut & Surat Medis
  const additionalDetails: string[] = [];
  if (mr.clinicalNotes && mr.clinicalNotes.trim().length > 0) {
    additionalDetails.push(`Catatan Dokter: "${mr.clinicalNotes.trim()}"`);
  }
  if (mr.followUpPlan && mr.followUpPlan.trim().length > 0) {
    additionalDetails.push(`Instruksi Kontrol: "${mr.followUpPlan.trim()}"`);
  }
  if (mr.sickLeaveCertificate) {
    additionalDetails.push(`Surat Keterangan Sakit (${mr.sickLeaveCertificate.totalDays} hari)`);
  }
  if (mr.healthCertificate) {
    additionalDetails.push(`Surat Keterangan Sehat (${mr.healthCertificate.purpose})`);
  }
  if (additionalDetails.length > 0) {
    inputs.push({
      category: 'Catatan Tambahan & Surat Keterangan Medis',
      badge: 'Dokumen Medis',
      summary: 'Catatan instruksi dokter atau surat keterangan medis tercatat',
      details: additionalDetails,
    });
  }

  return inputs;
};

const CANCEL_REASONS_PRESET = [
  'Pasien pulang sendiri / tidak bersedia menunggu',
  'Salah mendaftar nomor antrian',
  'Pasien berhalangan hadir',
  'Jadwal konsultasi diatur ulang',
  'Pasien dialihkan ke faskes rujukan lain',
];

export function QueueTable({ limit }: { limit?: number }) {
  const router = useRouter();
  const { visits, updateVisitStatus, cancelVisit } = useRME();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [callingId, setCallingId] = useState<string | null>(null);

  // States for cancellation validation
  const [blockedCancellation, setBlockedCancellation] = useState<{
    visit: Visit;
    inputs: ExaminationInputDetail[];
  } | null>(null);

  const [confirmCancellationVisit, setConfirmCancellationVisit] = useState<Visit | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [resumeVisit, setResumeVisit] = useState<Visit | null>(null);

  const handleCallPatientFromTable = async (visit: Visit) => {
    setCallingId(visit.id);
    toast.info(`📢 Memanggil Nomor Antrian ${visit.queueNumber} - ${visit.patient.name}...`, { duration: 5000 });
    try {
      await callQueuePatient(visit.queueNumber, visit.patient.name);
    } catch (e) {
      console.warn('Call error:', e);
    } finally {
      setCallingId(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter((v) => v.date === todayStr);

  const filteredVisits = useMemo(() => {
    return todayVisits.filter((v) => {
      // 1. Status Filter
      if (statusFilter === 'WAITING' && v.status !== 'WAITING' && v.status !== 'REGISTERED') return false;
      if (statusFilter === 'IN_PROGRESS' && v.status !== 'IN_PROGRESS') return false;
      if (statusFilter === 'WAITING_PAYMENT' && v.status !== 'WAITING_PAYMENT') return false;
      if (statusFilter === 'PAID' && v.status !== 'PAID') return false;
      if (statusFilter === 'CANCELLED' && v.status !== 'CANCELLED') return false;

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const patName = (v.patient?.name || '').toLowerCase();
        const noRM = (v.patient?.noRM || '').toLowerCase();
        const qNum = (v.queueNumber || '').toLowerCase();
        const nik = (v.patient?.nik || '').toLowerCase();
        const docName = (v.doctorName || '').toLowerCase();
        const payment = (v.paymentType || '').toLowerCase();
        const complaint = (v.chiefComplaintSummary || v.medicalRecord?.chiefComplaint || '').toLowerCase();

        const isMatch =
          patName.includes(q) ||
          noRM.includes(q) ||
          qNum.includes(q) ||
          nik.includes(q) ||
          docName.includes(q) ||
          payment.includes(q) ||
          complaint.includes(q);

        if (!isMatch) return false;
      }

      return true;
    });
  }, [todayVisits, statusFilter, searchQuery]);

  const displayedVisits = limit ? filteredVisits.slice(0, limit) : filteredVisits;

  const getStatusBadge = (status: VisitStatus) => {
    switch (status) {
      case 'WAITING':
      case 'REGISTERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Menunggu
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
            Sedang Diperiksa
          </span>
        );
      case 'COMPLETED':
      case 'WAITING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-purple-700" />
            Menunggu Pembayaran
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
            Selesai &amp; Lunas
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs">
            <XCircle className="h-3.5 w-3.5 text-rose-700" />
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const handleStartExamination = (visit: Visit) => {
    updateVisitStatus(visit.id, 'IN_PROGRESS');
    router.push(`/examination/${visit.id}`);
  };

  // Attempt to cancel visit
  const handleAttemptCancel = (visit: Visit) => {
    // 1. Check if visit is already paid / locked
    if (visit.status === 'PAID') {
      toast.error('Tidak dapat dibatalkan!', {
        description: 'Pemeriksaan telah selesai dan pembayaran telah lunas. Rekam medis terkunci permanen.',
      });
      return;
    }

    // 2. Check existing examination inputs
    const existingInputs = inspectExaminationInputs(visit);

    if (existingInputs.length > 0) {
      // Cancellation blocked! Open detailed alert dialog and trigger toast
      setBlockedCancellation({ visit, inputs: existingInputs });

      const categoryList = existingInputs.map((i) => i.category).join(', ');
      toast.error('Pemeriksaan tidak dapat dibatalkan!', {
        description: `Sudah terdapat inputan pemeriksaan pada: ${categoryList}.`,
        duration: 7000,
      });
      return;
    }

    // 3. No examination inputs found -> Allow confirmation dialog
    setConfirmCancellationVisit(visit);
    setCancellationReason('');
  };

  // Execute cancellation after confirmation
  const handleConfirmCancel = () => {
    if (!confirmCancellationVisit) return;

    cancelVisit(confirmCancellationVisit.id, cancellationReason || 'Dibatalkan oleh staf faskes');

    toast.success(
      `Pemeriksaan pasien ${confirmCancellationVisit.patient.name} (Antrian ${confirmCancellationVisit.queueNumber}) berhasil dibatalkan.`
    );

    setConfirmCancellationVisit(null);
    setCancellationReason('');
  };

  return (
    <Card className="overflow-hidden border border-slate-200/90 shadow-2xs bg-white rounded-2xl">
      {/* Header & Filter Tabs */}
      <CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-emerald-700" />
            <span>Daftar Antrian Hari Ini</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
              {todayVisits.length} Pasien
            </span>
          </CardTitle>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            {formatIndonesianDate(todayStr, true)}
          </p>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 text-xs">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'WAITING', label: 'Menunggu' },
              { id: 'IN_PROGRESS', label: 'Diperiksa' },
              { id: 'WAITING_PAYMENT', label: 'Kasir' },
              { id: 'PAID', label: 'Selesai' },
              { id: 'CANCELLED', label: 'Dibatalkan' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-emerald-900 shadow-xs font-extrabold border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      {/* Search Toolbar */}
      <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari nama pasien, No. RM, NIK, atau No. Antrian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs rounded-xl bg-white border-slate-200 shadow-2xs focus-visible:ring-emerald-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Results Indicator when searching */}
        {searchQuery.trim() && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-medium">
              Ditemukan <strong className="text-emerald-800 font-bold">{filteredVisits.length}</strong> pasien
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-emerald-700 text-white border-b border-emerald-800 font-bold select-none shadow-2xs">
            <tr>
              <th className="py-3.5 px-4 font-bold w-24 text-white">No. Antrian</th>
              <th className="py-3.5 px-4 font-bold text-white">Nama Pasien &amp; No. RM</th>
              <th className="py-3.5 px-4 font-bold text-white">Jam &amp; Penjamin</th>
              <th className="py-3.5 px-4 font-bold text-white">Keluhan Utama</th>
              <th className="py-3.5 px-4 font-bold text-center text-white">Status</th>
              <th className="py-3.5 px-4 font-bold text-right text-white">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {displayedVisits.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  {searchQuery.trim() ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="mx-auto h-9 w-9 text-slate-300" />
                      <p className="text-sm font-bold text-slate-800">
                        Pasien &ldquo;{searchQuery}&rdquo; Tidak Ditemukan
                      </p>
                      <p className="text-xs text-slate-500 max-w-md">
                        Tidak ada antrian pasien yang sesuai dengan kata kunci pencarian pada hari ini.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="mt-1 text-xs rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Reset Pencarian
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <User className="mx-auto h-9 w-9 text-slate-300 mb-1" />
                      <p className="text-sm font-bold text-slate-700">
                        {statusFilter === 'ALL'
                          ? 'Belum ada antrian pasien untuk hari ini'
                          : `Tidak ada pasien dengan status "${statusFilter}"`}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Antrian pasien akan muncul otomatis setelah pendaftaran.</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              displayedVisits.map((visit) => {
                const pat = visit.patient;
                const isWaiting = visit.status === 'WAITING' || visit.status === 'REGISTERED';
                const isInProgress = visit.status === 'IN_PROGRESS';
                const isWaitingPayment = visit.status === 'WAITING_PAYMENT';
                const isPaid = visit.status === 'PAID';
                const isCancelled = visit.status === 'CANCELLED';

                return (
                  <tr key={visit.id} className={`hover:bg-slate-50/80 transition-colors ${isCancelled ? 'bg-slate-50/50 opacity-70' : ''}`}>
                    {/* No. Antrian */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-black text-sm text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/80 w-fit shadow-2xs">
                        {visit.queueNumber}
                      </div>
                    </td>

                    {/* Pasien & No. RM */}
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/patients/${pat.id}`}
                        className="font-bold text-slate-900 hover:text-emerald-700 transition-colors text-xs flex items-center gap-1.5"
                      >
                        <span>{pat.name}</span>
                        {pat.allergies && pat.allergies.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-sm bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200">
                            Alergi
                          </span>
                        )}
                      </Link>
                      <div className="text-xs font-semibold text-slate-600 mt-0.5">
                        <span className="font-mono">{pat.noRM}</span> • {pat.gender === 'L' ? 'Pria' : 'Wanita'} ({pat.age || 30} th)
                      </div>
                    </td>

                    {/* Jam & Penjamin */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>{visit.time} WIB</span>
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
                        {visit.paymentType || 'UMUM'}
                      </span>
                    </td>

                    {/* Keluhan Utama */}
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="truncate text-slate-800 font-semibold text-xs">
                        {visit.chiefComplaintSummary ||
                          visit.medicalRecord?.chiefComplaint ||
                          (isCancelled ? visit.cancellationReason || 'Antrian dibatalkan' : 'Pemeriksaan rutin')}
                      </div>
                      {visit.medicalRecord?.diagnoses && visit.medicalRecord.diagnoses.length > 0 && (
                        <div className="text-xs text-emerald-800 truncate font-bold mt-0.5">
                          Dx: {visit.medicalRecord.diagnoses[0].code} - {visit.medicalRecord.diagnoses[0].name}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      {getStatusBadge(visit.status)}
                    </td>

                    {/* Actions based on Role & Mode */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If Waiting / Registered -> Panggil & Mulai Pemeriksaan */}
                        {isWaiting && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={callingId === visit.id}
                              onClick={() => handleCallPatientFromTable(visit)}
                              className={`h-8 px-2.5 text-xs font-bold gap-1 rounded-xl cursor-pointer shadow-2xs transition-all ${
                                callingId === visit.id
                                  ? 'bg-amber-600 text-white animate-pulse border-amber-600'
                                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                              }`}
                              title="Panggil Antrian dengan Suara Bel & Ucapan"
                            >
                              <Volume2 className={`h-3.5 w-3.5 ${callingId === visit.id ? 'animate-bounce text-white' : 'text-amber-700'}`} />
                              <span className="hidden sm:inline">{callingId === visit.id ? 'Memanggil...' : 'Panggil'}</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleStartExamination(visit)}
                              className="h-8 px-3.5 text-xs font-bold gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs rounded-xl cursor-pointer"
                            >
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>Mulai Periksa</span>
                            </Button>
                          </>
                        )}

                        {/* If In Progress -> Lanjutkan Pemeriksaan */}
                        {isInProgress && (
                          <Link href={`/examination/${visit.id}`}>
                            <Button
                              size="sm"
                              className="h-8 px-3.5 text-xs font-bold gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs rounded-xl cursor-pointer"
                            >
                              <Stethoscope className="h-3.5 w-3.5" />
                              <span>Lanjutkan</span>
                            </Button>
                          </Link>
                        )}

                        {/* If Waiting Payment -> Arahkan ke Kasir (Menu Bayar Hanya di Kasir) */}
                        {isWaitingPayment && (
                          <Link href={`/billing/${visit.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs font-bold gap-1.5 text-purple-700 hover:text-purple-900 border-purple-200 bg-purple-50 hover:bg-purple-100 rounded-xl cursor-pointer"
                              title="Menunggu pembayaran di loket kasir. Buka kasir"
                            >
                              <Receipt className="h-3.5 w-3.5 text-purple-700" />
                              <span>Ke Kasir</span>
                            </Button>
                          </Link>
                        )}

                        {/* If Paid -> Detail / Kwitansi */}
                        {isPaid && (
                          <Link href={`/billing/${visit.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs text-slate-800 font-bold gap-1.5 border-slate-300 rounded-xl hover:bg-slate-100 cursor-pointer"
                            >
                              <Receipt className="h-3.5 w-3.5 text-emerald-700" />
                              <span>Kwitansi</span>
                            </Button>
                          </Link>
                        )}

                        {/* Resume Medis Pasien yang sudah diperiksa */}
                        {(isWaitingPayment || isPaid || visit.status === 'COMPLETED' || !!visit.medicalRecord) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setResumeVisit(visit)}
                            className="h-8 px-2.5 text-xs font-bold gap-1 text-emerald-800 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 rounded-xl cursor-pointer"
                            title="Lihat & Cetak Resume Medis Pasien (Permenkes No. 24/2022)"
                          >
                            <FileText className="h-3.5 w-3.5 text-emerald-700" />
                            <span>Resume</span>
                          </Button>
                        )}

                        {/* Quick View Details */}
                        <Link href={`/patients/${pat.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 rounded-xl cursor-pointer"
                            title="Buka Data Pasien & Riwayat Rekam Medis"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Menu Aksi: Batalkan Pemeriksaan */}
                        {!isPaid && !isCancelled && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAttemptCancel(visit)}
                            className="h-8 px-2 text-xs font-bold gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer"
                            title="Batalkan Pemeriksaan Pasien"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">Batalkan</span>
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

      {/* ========================================================================= */}
      {/* MODAL 1: CANCELLATION BLOCKED (KARENA SUDAH ADA INPUTAN PEMERIKSAAN)     */}
      {/* ========================================================================= */}
      {blockedCancellation && (
        <Dialog
          open={!!blockedCancellation}
          onOpenChange={(open) => !open && setBlockedCancellation(null)}
          maxWidth="md"
        >
          <div className="space-y-4 text-slate-900">
            {/* Header with Warning Icon */}
            <div className="flex items-start gap-3.5 pb-3 border-b border-slate-100">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0 mt-0.5">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Pemeriksaan Tidak Dapat Dibatalkan!
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    Rekam Klinis Terisi
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-snug">
                  Pasien <strong>{blockedCancellation.visit.patient.name}</strong> (No. RM: {blockedCancellation.visit.patient.noRM}, Antrian: {blockedCancellation.visit.queueNumber}) tidak dapat dibatalkan karena sudah terdapat inputan data pemeriksaan medis aktif.
                </p>
              </div>
            </div>

            {/* List of Detected Inputs */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Rincian Inputan Pemeriksaan yang Telah Tercatat ({blockedCancellation.inputs.length} Bagian):</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {blockedCancellation.inputs.map((inp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs animate-in fade-in"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        {inp.category}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold bg-white text-emerald-800 border-emerald-300">
                        {inp.badge}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium">
                      {inp.summary}
                    </p>

                    <div className="p-2 rounded-lg bg-white border border-slate-200/80 space-y-1">
                      {inp.details.map((det, detIdx) => (
                        <div key={detIdx} className="text-[11px] text-slate-700 font-mono flex items-start gap-1.5">
                          <span className="text-emerald-700 font-bold">&bull;</span>
                          <span className="break-words">{det}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regulatory Guidance Note */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-snug text-[11px]">
                <span className="font-bold block">Regulasi Rekam Medis (Permenkes No. 24/2022):</span>
                <span>
                  Data klinis yang telah dicatat dokter atau perawat terlindungi secara hukum dan tidak dapat dibatalkan sembarangan dari daftar antrian. Untuk membatalkan, kosongkan data terlebih dahulu di Workspace Dokter atau selesaikan pemeriksaan.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBlockedCancellation(null)}
                className="h-9 text-xs rounded-xl font-bold cursor-pointer"
              >
                Tutup Notifikasi
              </Button>
              <Link href={`/examination/${blockedCancellation.visit.id}`}>
                <Button
                  type="button"
                  onClick={() => setBlockedCancellation(null)}
                  className="h-9 text-xs font-bold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  <Stethoscope className="h-4 w-4" />
                  <span>Buka Workspace Pemeriksaan</span>
                </Button>
              </Link>
            </div>
          </div>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRM CANCELLATION (KARENA BELUM ADA INPUTAN PEMERIKSAAN)      */}
      {/* ========================================================================= */}
      {confirmCancellationVisit && (
        <Dialog
          open={!!confirmCancellationVisit}
          onOpenChange={(open) => !open && setConfirmCancellationVisit(null)}
          maxWidth="md"
        >
          <div className="space-y-4 text-slate-900">
            {/* Header */}
            <div className="flex items-start gap-3.5 pb-3 border-b border-slate-100">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0 mt-0.5">
                <Ban className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Batalkan Antrian / Pemeriksaan Pasien?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konfirmasi pembatalan antrian pasien yang belum memiliki inputan rekam medis.
                </p>
              </div>
            </div>

            {/* Patient Info Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {confirmCancellationVisit.patient.name}
                </div>
                <div className="text-slate-500 mt-0.5 font-semibold">
                  No. RM: <span className="font-mono font-bold text-slate-700">{confirmCancellationVisit.patient.noRM}</span> • Jam {confirmCancellationVisit.time} WIB
                </div>
                <div className="text-slate-500 mt-0.5">
                  Dokter: {confirmCancellationVisit.doctorName}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">No. Antrian</span>
                <span className="text-xl font-black font-mono text-rose-700 bg-white px-2.5 py-1 rounded-xl border border-rose-200 inline-block shadow-2xs">
                  {confirmCancellationVisit.queueNumber}
                </span>
              </div>
            </div>

            {/* Verification confirmation note */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-snug text-[11px]">
                <strong>Pemeriksaan Bersih (Tanpa Rekam Medis):</strong> Sistem telah memverifikasi bahwa kunjungan ini belum memiliki inputan tanda vital, anamnesis, diagnosis, tindakan, maupun resep obat. Kunjungan aman untuk dibatalkan.
              </div>
            </div>

            {/* Cancellation Reason Presets & Input */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                Pilih Alasan Pembatalan:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CANCEL_REASONS_PRESET.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setCancellationReason(reason)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                      cancellationReason === reason
                        ? 'bg-rose-100 border-rose-300 text-rose-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Atau ketikkan alasan pembatalan lainnya..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full h-8 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-500 focus:outline-hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmCancellationVisit(null)}
                className="h-9 text-xs rounded-xl font-bold cursor-pointer"
              >
                Kembali
              </Button>
              <Button
                type="button"
                onClick={handleConfirmCancel}
                className="h-9 text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                <Ban className="h-4 w-4" />
                <span>Ya, Batalkan Antrian</span>
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Modal Dokumen Resume Medis Pasien */}
      {resumeVisit && (
        <MedicalResumeModal
          open={!!resumeVisit}
          onOpenChange={(open) => !open && setResumeVisit(null)}
          visit={resumeVisit}
        />
      )}
    </Card>
  );
}
