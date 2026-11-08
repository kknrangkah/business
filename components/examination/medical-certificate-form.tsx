'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  HeartPulse,
  Printer,
  Calendar,
  Sparkles,
  CheckCircle2,
  Stethoscope,
  ShieldAlert,
  Clock,
  Eye,
  Activity,
  Award,
  ArrowUpRight,
  Share2,
  Building,
  MessageCircle,
  Send,
} from 'lucide-react';
import {
  Patient,
  VitalSigns,
  DiagnosisItem,
  SickLeaveCertificate,
  HealthCertificate,
  ReferralCertificate,
  ControlVisitLetter,
  Visit,
} from '@/types/rme';
import { CertificatePrintModal } from './certificate-print-modal';
import { WhatsAppReminderModal } from './whatsapp-reminder-modal';
import { toast } from 'sonner';
import { useRME } from '@/context/rme-context';

interface MedicalCertificateFormProps {
  patient: Patient;
  doctorName: string;
  primaryDiagnosis?: DiagnosisItem;
  vitalSigns: VitalSigns;
  sickLeaveData?: SickLeaveCertificate;
  healthData?: HealthCertificate;
  referralData?: ReferralCertificate;
  controlVisitData?: ControlVisitLetter;
  onSickLeaveChange: (data: SickLeaveCertificate | undefined) => void;
  onHealthChange: (data: HealthCertificate | undefined) => void;
  onReferralChange: (data: ReferralCertificate | undefined) => void;
  onControlVisitChange?: (data: ControlVisitLetter | undefined) => void;
  disabled?: boolean;
  visit: Visit;
}

export function MedicalCertificateForm({
  patient,
  doctorName,
  primaryDiagnosis,
  vitalSigns,
  sickLeaveData,
  healthData,
  referralData,
  controlVisitData,
  onSickLeaveChange,
  onHealthChange,
  onReferralChange,
  onControlVisitChange,
  disabled = false,
  visit,
}: MedicalCertificateFormProps) {
  const { config, patients } = useRME();
  const [activeTab, setActiveTab] = useState<'SICK_LEAVE' | 'HEALTH' | 'REFERRAL' | 'CONTROL_VISIT'>('SICK_LEAVE');
  const [showWAReminderModal, setShowWAReminderModal] = useState(false);

  // Ambil data pasien lengkap dari master data pendaftaran pasien
  const registeredPatient = patients?.find(
    (p) =>
      p.id === patient?.id ||
      p.id === visit?.patientId ||
      (p.noRM && p.noRM === patient?.noRM) ||
      (p.nik && patient?.nik && p.nik === patient.nik) ||
      (p.name && patient?.name && p.name.trim().toLowerCase() === patient.name.trim().toLowerCase())
  );

  const effectivePatient: Patient = {
    ...visit.patient,
    ...patient,
    ...(registeredPatient || {}),
    phone:
      patient?.phone ||
      registeredPatient?.phone ||
      visit?.patient?.phone ||
      '',
  };

  const patientPhone = effectivePatient.phone;

  // Print modal state
  const [printModalState, setPrintModalState] = useState<{
    open: boolean;
    type: 'SICK_LEAVE' | 'HEALTH' | 'REFERRAL';
  }>({
    open: false,
    type: 'SICK_LEAVE',
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to add days to a YYYY-MM-DD string
  const calculateEndDate = (startDate: string, days: number): string => {
    try {
      const d = new Date(startDate);
      // days - 1 because starting day counts as day 1
      d.setDate(d.getDate() + Math.max(0, days - 1));
      return d.toISOString().split('T')[0];
    } catch {
      return startDate;
    }
  };

  // Toggle handlers
  const handleToggleSickLeave = (enabled: boolean) => {
    if (enabled) {
      const initialDays = 2;
      const certNum = `SKS/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${visit.queueNumber}`;
      onSickLeaveChange({
        certificateNumber: certNum,
        issueDate: todayStr,
        startDate: todayStr,
        endDate: calculateEndDate(todayStr, initialDays),
        totalDays: initialDays,
        diagnosis: primaryDiagnosis ? `${primaryDiagnosis.code} - ${primaryDiagnosis.name}` : '',
        showDiagnosis: true,
        notes: 'Perlu istirahat tirah baring untuk pemulihan kesehatan di rumah.',
        profession: 'Karyawan Swasta',
        institution: '',
      });
      toast.success('Formulir Surat Keterangan Sakit diaktifkan.');
    } else {
      onSickLeaveChange(undefined);
      toast.info('Surat Keterangan Sakit dinonaktifkan.');
    }
  };

  const handleToggleHealth = (enabled: boolean) => {
    if (enabled) {
      const certNum = `SKD/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${visit.queueNumber}`;
      onHealthChange({
        certificateNumber: certNum,
        issueDate: todayStr,
        purpose: 'Persyaratan Melamar Pekerjaan',
        height: vitalSigns.height || 165,
        weight: vitalSigns.weight || 60,
        systolic: vitalSigns.systolic || 120,
        diastolic: vitalSigns.diastolic || 80,
        heartRate: vitalSigns.heartRate || 80,
        bloodType: patient.bloodType || 'O',
        colorBlindness: 'NORMAL',
        vision: 'Normal 6/6 ODS',
        hearing: 'Normal / Baik',
        physicalDefect: 'Tidak Ditemukan',
        conclusion: 'SEHAT',
        notes: 'Pemeriksaan fisik dalam batas normal.',
      });
      toast.success('Formulir Surat Keterangan Sehat diaktifkan.');
    } else {
      onHealthChange(undefined);
      toast.info('Surat Keterangan Sehat dinonaktifkan.');
    }
  };

  // Sync vital signs into health certificate
  const handleSyncVitalSigns = () => {
    if (!healthData) return;
    onHealthChange({
      ...healthData,
      height: vitalSigns.height || healthData.height,
      weight: vitalSigns.weight || healthData.weight,
      systolic: vitalSigns.systolic || healthData.systolic,
      diastolic: vitalSigns.diastolic || healthData.diastolic,
      heartRate: vitalSigns.heartRate || healthData.heartRate,
      bloodType: patient.bloodType || healthData.bloodType,
    });
    toast.success('Data tanda vital pasien berhasil disinkronkan ke Surat Sehat!');
  };

  // Quick days click for sick leave
  const handleSetSickDays = (days: number) => {
    if (!sickLeaveData) return;
    const start = sickLeaveData.startDate || todayStr;
    const end = calculateEndDate(start, days);
    onSickLeaveChange({
      ...sickLeaveData,
      totalDays: days,
      endDate: end,
    });
  };

  // Toggle referral handler
  const handleToggleReferral = (enabled: boolean) => {
    if (enabled) {
      const certNum = `SR/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${visit.queueNumber}`;
      onReferralChange({
        certificateNumber: certNum,
        issueDate: todayStr,
        destinationHospital: 'RSUD dr. Loekmono Hadi',
        destinationDepartment: 'Spesialis Penyakit Dalam',
        reasonForReferral: 'Penanganan spesialis lanjutan dan evaluasi penunjang diagnostik',
        preliminaryDiagnosis: primaryDiagnosis ? `${primaryDiagnosis.code} - ${primaryDiagnosis.name}` : '',
        anamnesisSummary: visit.medicalRecord?.chiefComplaint || visit.chiefComplaintSummary || '',
        physicalExamSummary: visit.medicalRecord?.physicalExamination || '',
        vitalSignsSummary: `TD: ${vitalSigns.systolic || 120}/${vitalSigns.diastolic || 80} mmHg, Nadi: ${vitalSigns.heartRate || 80} x/mnt, Suhu: ${vitalSigns.temperature || 36.5} Â°C, SpO2: ${vitalSigns.oxygenSaturation || 98}%`,
        therapyGiven: '',
        transportationType: 'KENDARAAN_PRIBADI',
        conditionAtReferral: 'STABIL',
        notes: 'Mohon evaluasi dan penatalaksanaan lebih lanjut.',
      });
      toast.success('Formulir Surat Rujukan Pasien diaktifkan.');
    } else {
      onReferralChange(undefined);
      toast.info('Surat Rujukan Pasien dinonaktifkan.');
    }
  };

  const isSickLeaveActive = Boolean(sickLeaveData);
  const isHealthActive = Boolean(healthData);
  const isReferralActive = Boolean(referralData);
  const isControlVisitActive = Boolean(controlVisitData);

  const handleToggleControlVisit = (enabled: boolean) => {
    if (enabled) {
      const certNum = `SK/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${visit.queueNumber}`;
      // Set control date 7 days from now by default
      const controlDate = new Date();
      controlDate.setDate(controlDate.getDate() + 7);
      const controlDateStr = controlDate.toISOString().split('T')[0];
      onControlVisitChange?.({
        certificateNumber: certNum,
        issueDate: todayStr,
        controlDate: controlDateStr,
        controlTime: '',
        doctorName: visit.doctorName || doctorName,
        poli: '',
        diagnosis: primaryDiagnosis ? `${primaryDiagnosis.code} - ${primaryDiagnosis.name}` : '',
        instructions: 'Hadir tepat waktu sesuai jadwal yang ditentukan.',
        notes: '',
        reminderEnabled: true,
      });
      toast.success('Formulir Surat Kontrol Kunjungan diaktifkan.');
    } else {
      onControlVisitChange?.(undefined);
      toast.info('Surat Kontrol Kunjungan dinonaktifkan.');
    }
  };
    return (
    <Card className="border border-slate-200 bg-white shadow-2xs rounded-2xl overflow-hidden">
      {/* Header Card with Mode Badges */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-emerald-50/30 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-2xs">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                Surat Keterangan Medis Dokter
              </h3>
              {(isSickLeaveActive || isHealthActive || isReferralActive || isControlVisitActive) && (
                <Badge className="bg-emerald-100 text-emerald-800 text-xs font-semibold py-0.5 px-2">
                  {[isSickLeaveActive, isHealthActive, isReferralActive, isControlVisitActive].filter(Boolean).length} Surat Aktif
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Penerbitan surat keterangan istirahat/sakit, surat sehat, surat rujukan, dan surat kontrol kunjungan
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('SICK_LEAVE')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SICK_LEAVE'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Surat Sakit</span>
            {isSickLeaveActive && (
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HEALTH')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'HEALTH'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="h-3.5 w-3.5" />
            <span>Surat Sehat</span>
            {isHealthActive && (
              <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REFERRAL')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'REFERRAL'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>Surat Rujukan</span>
            {isReferralActive && (
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CONTROL_VISIT')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CONTROL_VISIT'
                ? 'bg-white text-green-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Surat Kontrol</span>
            {isControlVisitActive && (
              <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* ============================================================ */}
        {/* TAB 1: SURAT KETERANGAN SAKIT (SURAT ISTIRAHAT)               */}
        {/* ============================================================ */}
        {activeTab === 'SICK_LEAVE' && (
          <div className="space-y-4">
            {/* Activation Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="toggle-sick-leave"
                  checked={isSickLeaveActive}
                  onChange={(e) => handleToggleSickLeave(e.target.checked)}
                  disabled={disabled}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                />
                <label
                  htmlFor="toggle-sick-leave"
                  className="text-xs sm:text-[13px] font-semibold text-slate-800 cursor-pointer select-none"
                >
                  Terbitkan Surat Keterangan Sakit (Surat Istirahat Kerja/Sekolah)
                </label>
              </div>

              {isSickLeaveActive && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPrintModalState({ open: true, type: 'SICK_LEAVE' })
                  }
                  className="h-8 px-3 text-xs font-semibold gap-1.5 border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl cursor-pointer shadow-2xs"
                >
                  <Printer className="h-4 w-4 text-emerald-700" />
                  <span>Pratinjau &amp; Cetak Surat Sakit</span>
                </Button>
              )}
            </div>

            {/* Form Fields for Sick Leave */}
            {isSickLeaveActive && sickLeaveData && (
              <div className="space-y-3.5 p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30">
                {/* Row 1: Nomor Surat & Tanggal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Nomor Surat Keterangan</label>
                    <Input
                      value={sickLeaveData.certificateNumber}
                      onChange={(e) =>
                        onSickLeaveChange({
                          ...sickLeaveData,
                          certificateNumber: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-9 text-sm font-mono font-bold rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Tanggal Terbit Surat</label>
                    <Input
                      type="date"
                      value={sickLeaveData.issueDate}
                      onChange={(e) =>
                        onSickLeaveChange({
                          ...sickLeaveData,
                          issueDate: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-9 text-sm rounded-xl font-normal"
                    />
                  </div>
                </div>

                {/* Row 2: Durasi Istirahat & Quick Buttons */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-800 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-emerald-700" />
                      <span>Lama Istirahat Pasien</span>
                    </label>

                    {/* Quick day buttons */}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 5, 7].map((d) => (
                        <button
                          key={d}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleSetSickDays(d)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            sickLeaveData.totalDays === d
                              ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs font-bold'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {d} Hari
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Jumlah Hari Istirahat:
                      </span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={sickLeaveData.totalDays}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 1;
                            const end = calculateEndDate(
                              sickLeaveData.startDate || todayStr,
                              val
                            );
                            onSickLeaveChange({
                              ...sickLeaveData,
                              totalDays: val,
                              endDate: end,
                            });
                          }}
                          disabled={disabled}
                          className="bg-white h-8 text-xs font-bold font-mono text-center rounded-lg w-20"
                        />
                        <span className="text-xs font-semibold text-slate-600">Hari</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium">Mulai Tanggal:</span>
                      <Input
                        type="date"
                        value={sickLeaveData.startDate}
                        onChange={(e) => {
                          const start = e.target.value;
                          const end = calculateEndDate(
                            start,
                            sickLeaveData.totalDays || 1
                          );
                          onSickLeaveChange({
                            ...sickLeaveData,
                            startDate: start,
                            endDate: end,
                          });
                        }}
                        disabled={disabled}
                        className="bg-white h-8 text-xs rounded-lg font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium">Sampai Tanggal:</span>
                      <Input
                        type="date"
                        value={sickLeaveData.endDate}
                        onChange={(e) =>
                          onSickLeaveChange({
                            ...sickLeaveData,
                            endDate: e.target.value,
                          })
                        }
                        disabled={disabled}
                        className="bg-white h-8 text-xs rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Diagnosis & Confidentiality Option */}
                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Diagnosis Klinis pada Surat Sakit</span>
                    </label>

                    {primaryDiagnosis && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          onSickLeaveChange({
                            ...sickLeaveData,
                            diagnosis: `${primaryDiagnosis.code} - ${primaryDiagnosis.name}`,
                          })
                        }
                        className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Ambil Diagnosis Utama ({primaryDiagnosis.code})</span>
                      </button>
                    )}
                  </div>

                  <Input
                    placeholder="Contoh: J06.9 - Infeksi Saluran Pernapasan Akut (ISPA)"
                    value={sickLeaveData.diagnosis || ''}
                    onChange={(e) =>
                      onSickLeaveChange({
                        ...sickLeaveData,
                        diagnosis: e.target.value,
                      })
                    }
                    disabled={disabled}
                    className="bg-white h-8 text-xs rounded-lg"
                  />

                  <div className="pt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show-diagnosis-print"
                      checked={sickLeaveData.showDiagnosis}
                      onChange={(e) =>
                        onSickLeaveChange({
                          ...sickLeaveData,
                          showDiagnosis: e.target.checked,
                        })
                      }
                      disabled={disabled}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <label
                      htmlFor="show-diagnosis-print"
                      className="text-[11px] text-slate-600 cursor-pointer select-none"
                    >
                      Cantumkan nama diagnosis pada lembar cetak surat (Hapus centang jika pasien meminta diagnosis dirahasiakan)
                    </label>
                  </div>
                </div>

                {/* Row 4: Pekerjaan & Instansi Pasien */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Pekerjaan / Profesi Pasien</label>
                    <Input
                      placeholder="e.g. Karyawan Swasta, ASN, Pelajar, Mahasiswa"
                      value={sickLeaveData.profession || ''}
                      onChange={(e) =>
                        onSickLeaveChange({
                          ...sickLeaveData,
                          profession: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-8 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Instansi / Perusahaan / Sekolah</label>
                    <Input
                      placeholder="e.g. PT. Sumber Makmur, SMAN 1 Jakarta"
                      value={sickLeaveData.institution || ''}
                      onChange={(e) =>
                        onSickLeaveChange({
                          ...sickLeaveData,
                          institution: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-8 text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Row 5: Anjuran Medis */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Anjuran Medis / Catatan Dokter (Ditampilkan di Surat)
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Perlu istirahat tirah baring di rumah, hindari aktivitas fisik berat."
                    value={sickLeaveData.notes || ''}
                    onChange={(e) =>
                      onSickLeaveChange({
                        ...sickLeaveData,
                        notes: e.target.value,
                      })
                    }
                    disabled={disabled}
                    className="bg-white text-xs rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: SURAT KETERANGAN KESEHATAN JASMANI                     */}
        {/* ============================================================ */}
        {activeTab === 'HEALTH' && (
          <div className="space-y-4">
            {/* Activation Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="toggle-health-cert"
                  checked={isHealthActive}
                  onChange={(e) => handleToggleHealth(e.target.checked)}
                  disabled={disabled}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                />
                <label
                  htmlFor="toggle-health-cert"
                  className="font-bold text-slate-800 cursor-pointer select-none text-xs sm:text-[13px]"
                >
                  Terbitkan Surat Keterangan Kesehatan Jasmani &amp; Rohani
                </label>
              </div>

              {isHealthActive && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleSyncVitalSigns}
                    disabled={disabled}
                    className="h-8 text-xs font-semibold gap-1.5 border-teal-300 bg-white text-teal-800 hover:bg-teal-50 rounded-lg cursor-pointer px-2.5"
                  >
                    <Activity className="h-3.5 w-3.5 text-teal-600" />
                    <span>Sinkron Tanda Vital</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPrintModalState({ open: true, type: 'HEALTH' })
                    }
                    className="h-8 text-xs font-semibold gap-1.5 border-teal-300 bg-white text-teal-900 hover:bg-teal-50 rounded-lg cursor-pointer px-3"
                  >
                    <Printer className="h-3.5 w-3.5 text-teal-700" />
                    <span>Pratinjau &amp; Cetak Surat Sehat</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Form Fields for Health Certificate */}
            {isHealthActive && healthData && (
              <div className="space-y-3.5 p-4 rounded-xl border border-teal-100 bg-teal-50/30">
                {/* Row 1: Nomor Surat & Keperluan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Nomor Surat Kesehatan</label>
                    <Input
                      value={healthData.certificateNumber}
                      onChange={(e) =>
                        onHealthChange({
                          ...healthData,
                          certificateNumber: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-9 text-sm font-mono font-bold rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Keperluan Pembuatan Surat</label>
                    <Input
                      placeholder="e.g. Persyaratan Melamar Pekerjaan, Kuliah, SIM"
                      value={healthData.purpose}
                      onChange={(e) =>
                        onHealthChange({
                          ...healthData,
                          purpose: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-9 text-sm rounded-lg"
                    />
                  </div>
                </div>

                {/* Quick Purpose Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium">Contoh Keperluan:</span>
                  {[
                    'Persyaratan Melamar Pekerjaan',
                    'Melanjutkan Pendidikan / Kuliah',
                    'Pendaftaran SIM',
                    'Syarat Asuransi / Finansial',
                    'Perjalanan Dinas',
                  ].map((purp) => (
                    <button
                      key={purp}
                      type="button"
                      disabled={disabled}
                      onClick={() => onHealthChange({ ...healthData, purpose: purp })}
                      className="text-xs px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition-colors font-medium cursor-pointer"
                    >
                      + {purp}
                    </button>
                  ))}
                </div>

                {/* Row 2: Hasil Pengukuran Fisik (Grid 5 Kolom) */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                      <HeartPulse className="h-4 w-4 text-teal-700" />
                      <span>Data Pengukuran Fisik &amp; Vital Sign</span>
                    </span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={handleSyncVitalSigns}
                      className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      Ambil dari Vital Signs di atas
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-600 font-medium">Tinggi Badan (cm)</span>
                      <Input
                        type="number"
                        value={healthData.height}
                        onChange={(e) =>
                          onHealthChange({
                            ...healthData,
                            height: Number(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                        className="bg-white h-9 text-sm font-mono font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-slate-600 font-medium">Berat Badan (kg)</span>
                      <Input
                        type="number"
                        value={healthData.weight}
                        onChange={(e) =>
                          onHealthChange({
                            ...healthData,
                            weight: Number(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                        className="bg-white h-9 text-sm font-mono font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-slate-600 font-medium">TD Sistol / Diastol</span>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          value={healthData.systolic}
                          onChange={(e) =>
                            onHealthChange({
                              ...healthData,
                              systolic: Number(e.target.value) || 0,
                            })
                          }
                          disabled={disabled}
                          className="bg-white h-9 text-sm font-mono font-semibold text-center"
                        />
                        <span className="text-slate-400 font-bold">/</span>
                        <Input
                          type="number"
                          value={healthData.diastolic}
                          onChange={(e) =>
                            onHealthChange({
                              ...healthData,
                              diastolic: Number(e.target.value) || 0,
                            })
                          }
                          disabled={disabled}
                          className="bg-white h-9 text-sm font-mono font-semibold text-center"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-slate-600 font-medium">Nadi (bpm)</span>
                      <Input
                        type="number"
                        value={healthData.heartRate}
                        onChange={(e) =>
                          onHealthChange({
                            ...healthData,
                            heartRate: Number(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                        className="bg-white h-9 text-sm font-mono font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-slate-600 font-medium">Golongan Darah</span>
                      <select
                        value={healthData.bloodType || '-'}
                        onChange={(e) =>
                          onHealthChange({
                            ...healthData,
                            bloodType: e.target.value,
                          })
                        }
                        disabled={disabled}
                        className="w-full bg-white h-9 text-sm rounded-lg border border-slate-200 px-2.5 font-mono font-bold"
                      >
                        <option value="-">-</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="AB">AB</option>
                        <option value="O">O</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Row 3: Tes Khusus (Buta Warna, Visus, Pendengaran) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Tes Buta Warna</label>
                    <select
                      value={healthData.colorBlindness}
                      onChange={(e) =>
                        onHealthChange({
                          ...healthData,
                          colorBlindness: e.target.value as any,
                        })
                      }
                      disabled={disabled}
                      className="w-full bg-white h-9 text-sm rounded-lg border border-slate-200 px-2.5 font-medium"
                    >
                      <option value="NORMAL">Tidak Buta Warna (Normal)</option>
                      <option value="PARTIAL">Buta Warna Parsial</option>
                      <option value="TOTAL">Buta Warna Total</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Visus / Penglihatan</label>
                    <Input
                      placeholder="e.g. Normal 6/6 ODS, Dengan Kacamata"
                      value={healthData.vision}
                      onChange={(e) =>
                        onHealthChange({
                          ...healthData,
                          vision: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-9 text-sm rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Pendengaran</label>
                    <Input
                      placeholder="e.g. Normal / Baik"
                      value={healthData.hearing}
                      onChange={(e) =>
                        onHealthChange({
                          ...healthData,
                          hearing: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-9 text-sm rounded-lg"
                    />
                  </div>
                </div>

                {/* Row 4: Kesimpulan Kelayakan Sehat */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs sm:text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-teal-700" />
                    <span>Kesimpulan Kelayakan Kesehatan Jasmani &amp; Rohani</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        value: 'SEHAT',
                        label: 'Sehat Jasmani & Rohani',
                        desc: 'Memenuhi syarat kesehatan penuh',
                      },
                      {
                        value: 'SEHAT_DENGAN_CATATAN',
                        label: 'Sehat dengan Catatan',
                        desc: 'Ada catatan klinis ringan (misal kacamata)',
                      },
                      {
                        value: 'TIDAK_SEHAT',
                        label: 'Tidak Memenuhi Syarat',
                        desc: 'Ditemukan kondisi medis penghalang',
                      },
                    ].map((item) => (
                      <div
                        key={item.value}
                        onClick={() =>
                          !disabled &&
                          onHealthChange({
                            ...healthData,
                            conclusion: item.value as any,
                          })
                        }
                        className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                          healthData.conclusion === item.value
                            ? 'border-teal-600 bg-teal-50/50 shadow-2xs font-bold text-teal-900'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="text-xs sm:text-[13px] font-semibold">{item.label}</div>
                        <div className="text-[11px] sm:text-xs text-slate-500 font-normal mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 5: Catatan Dokter */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Catatan Khusus Dokter</label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Tekanan darah terkontrol baik, tidak ditemukan kelainan fisik bermakna."
                    value={healthData.notes || ''}
                    onChange={(e) =>
                      onHealthChange({
                        ...healthData,
                        notes: e.target.value,
                      })
                    }
                    disabled={disabled}
                    className="bg-white text-sm leading-relaxed rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {/* ============================================================ */}
        {/* TAB 3: SURAT RUJUKAN PASIEN KE RUMAH SAKIT / FASKES LANJUT    */}
        {/* ============================================================ */}
        {activeTab === 'REFERRAL' && (
          <div className="space-y-4">
            {/* Activation Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="toggle-referral"
                  checked={isReferralActive}
                  onChange={(e) => handleToggleReferral(e.target.checked)}
                  disabled={disabled}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <label
                  htmlFor="toggle-referral"
                  className="font-bold text-slate-800 cursor-pointer select-none"
                >
                  Terbitkan Surat Rujukan Pasien (Faskes Tingkat Lanjut / Rumah Sakit)
                </label>
              </div>

              {isReferralActive && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPrintModalState({ open: true, type: 'REFERRAL' })
                  }
                  className="h-7 text-xs font-bold gap-1 border-blue-300 bg-white text-blue-900 hover:bg-blue-50 rounded-lg cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-blue-700" />
                  <span>Pratinjau &amp; Cetak Surat Rujukan</span>
                </Button>
              )}
            </div>

            {/* Form Fields for Referral */}
            {isReferralActive && referralData && (
              <div className="space-y-3.5 p-4 rounded-xl border border-blue-100 bg-blue-50/20">
                {/* Row 1: Nomor Surat & Tanggal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nomor Surat Rujukan</label>
                    <Input
                      value={referralData.certificateNumber}
                      onChange={(e) =>
                        onReferralChange({
                          ...referralData,
                          certificateNumber: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-8 text-xs font-mono font-bold rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Tanggal Terbit</label>
                    <Input
                      type="date"
                      value={referralData.issueDate}
                      onChange={(e) =>
                        onReferralChange({
                          ...referralData,
                          issueDate: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-8 text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Row 2: Rumah Sakit Tujuan & Poli Spesialis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Faskes / Rumah Sakit Tujuan Rujukan</span>
                    </label>
                    <Input
                      placeholder="Contoh: RSUD dr. Loekmono Hadi Kudus"
                      value={referralData.destinationHospital}
                      onChange={(e) =>
                        onReferralChange({
                          ...referralData,
                          destinationHospital: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-8 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Spesialis / Poli Tujuan</label>
                    <Input
                      placeholder="Contoh: Spesialis Penyakit Dalam / Poli Jantung"
                      value={referralData.destinationDepartment}
                      onChange={(e) =>
                        onReferralChange({
                          ...referralData,
                          destinationDepartment: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-8 text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Row 3: Diagnosis Rujukan & Alasan Rujukan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Diagnosis Kerja Rujukan</label>
                    <Input
                      placeholder="Contoh: I10 - Hipertensi Esensial Primer"
                      value={referralData.preliminaryDiagnosis}
                      onChange={(e) =>
                        onReferralChange({
                          ...referralData,
                          preliminaryDiagnosis: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-8 text-xs font-medium rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Alasan Rujukan</label>
                    <Input
                      placeholder="Contoh: Penanganan spesialis lanjutan & diagnostik penunjang"
                      value={referralData.reasonForReferral}
                      onChange={(e) =>
                        onReferralChange({
                          ...referralData,
                          reasonForReferral: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white h-8 text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Row 4: Ringkasan Klinis & Terapi yang Diberikan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Ringkasan Anamnesis / Keluhan</label>
                    <Textarea
                      rows={2}
                      placeholder="Deskripsikan keluhan utama dan riwayat perjalanan penyakit..."
                      value={referralData.anamnesisSummary || ''}
                      onChange={(e) =>
                        onReferralChange({
                          ...referralData,
                          anamnesisSummary: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Terapi / Tindakan yang Telah Diberikan</label>
                    <Textarea
                      rows={2}
                      placeholder="Contoh: Amlodipine 10mg 1x1, Paracetamol 500mg bila demam..."
                      value={referralData.therapyGiven || ''}
                      onChange={(e) =>
                        onReferralChange({
                          ...referralData,
                          therapyGiven: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="bg-white text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Row 5: Keadaan Saat Dirujuk & Transportasi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Keadaan Pasien Saat Dirujuk</label>
                    <select
                      value={referralData.conditionAtReferral || 'STABIL'}
                      onChange={(e) =>
                        onReferralChange({
                          ...referralData,
                          conditionAtReferral: e.target.value as any,
                        })
                      }
                      disabled={disabled}
                      className="w-full bg-white border border-slate-200 rounded-lg h-8 px-2.5 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="STABIL">STABIL (Compos Mentis, TTV Terkendali)</option>
                      <option value="SEDANG">SEDANG (Perlu Pemantauan)</option>
                      <option value="KRITIS">KRITIS / GAWAT (Didampingi Nakes)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Moda Transportasi</label>
                    <select
                      value={referralData.transportationType || 'KENDARAAN_PRIBADI'}
                      onChange={(e) =>
                        onReferralChange({
                          ...referralData,
                          transportationType: e.target.value as any,
                        })
                      }
                      disabled={disabled}
                      className="w-full bg-white border border-slate-200 rounded-lg h-8 px-2.5 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="KENDARAAN_PRIBADI">Kendaraan Pribadi / Mandiri</option>
                      <option value="AMBULANCE">Ambulans Faskes / Rumah Sakit</option>
                      <option value="KENDARAAN_UMUM">Kendaraan Umum</option>
                    </select>
                  </div>
                </div>

                {/* Row 6: Catatan Tambahan Dokter */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Catatan Khusus / Permohonan</label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Mohon evaluasi lanjutan USG Abdomen atau konsultasi bersama dokter subspesialis."
                    value={referralData.notes || ''}
                    onChange={(e) =>
                      onReferralChange({
                        ...referralData,
                        notes: e.target.value,
                      })
                    }
                    disabled={disabled}
                    className="bg-white text-xs rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: SURAT KONTROL KUNJUNGAN + REMINDER WHATSAPP            */}
        {/* ============================================================ */}
        {activeTab === 'CONTROL_VISIT' && (
          <div className="space-y-4">
            {/* Activation Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="toggle-control-visit"
                  checked={isControlVisitActive}
                  onChange={(e) => handleToggleControlVisit(e.target.checked)}
                  disabled={disabled}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                />
                <label
                  htmlFor="toggle-control-visit"
                  className="text-xs sm:text-[13px] font-semibold text-slate-800 cursor-pointer select-none"
                >
                  Terbitkan Surat Kontrol Kunjungan (Jadwal Kontrol Ulang)
                </label>
              </div>
              {isControlVisitActive && controlVisitData && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowWAReminderModal(true)}
                  className="h-8 px-3 text-xs font-semibold gap-1.5 border-green-300 bg-white text-green-900 hover:bg-green-50 rounded-xl cursor-pointer shadow-2xs"
                >
                  <Send className="h-3.5 w-3.5 text-green-700" />
                  <span>Kirim Reminder WhatsApp</span>
                  {controlVisitData.reminderStatus === 'SENT' && (
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </Button>
              )}
            </div>
            {isControlVisitActive && controlVisitData && (
              <div className="space-y-3.5 p-4 rounded-2xl border border-green-100 bg-green-50/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Nomor Surat Kontrol</label>
                    <Input value={controlVisitData.certificateNumber} onChange={(e) => onControlVisitChange?.({ ...controlVisitData, certificateNumber: e.target.value })} disabled={disabled} className="bg-white h-9 text-sm font-mono font-bold rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Tanggal Terbit Surat</label>
                    <Input type="date" value={controlVisitData.issueDate} onChange={(e) => onControlVisitChange?.({ ...controlVisitData, issueDate: e.target.value })} disabled={disabled} className="bg-white h-9 text-sm rounded-xl font-normal" />
                  </div>
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-green-200 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-green-900">
                    <Calendar className="h-4 w-4 text-green-700" />
                    <span>Jadwal Kontrol Kunjungan</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium">Tanggal Kontrol:</span>
                      <Input type="date" value={controlVisitData.controlDate} onChange={(e) => onControlVisitChange?.({ ...controlVisitData, controlDate: e.target.value })} disabled={disabled} className="bg-white h-8 text-xs rounded-lg font-mono" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium">Jam Kontrol (opsional):</span>
                      <Input type="time" value={controlVisitData.controlTime || ''} onChange={(e) => onControlVisitChange?.({ ...controlVisitData, controlTime: e.target.value })} disabled={disabled} className="bg-white h-8 text-xs rounded-lg font-mono" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700 flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5 text-emerald-700" /><span>Dokter Pemeriksa</span></label>
                    <Input value={controlVisitData.doctorName} onChange={(e) => onControlVisitChange?.({ ...controlVisitData, doctorName: e.target.value })} disabled={disabled} placeholder="Nama dokter yang akan dikunjungi" className="bg-white h-9 text-sm rounded-xl font-normal" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700 flex items-center gap-1"><Building className="h-3.5 w-3.5 text-slate-500" /><span>Poli / Ruangan</span></label>
                    <Input value={controlVisitData.poli || ''} onChange={(e) => onControlVisitChange?.({ ...controlVisitData, poli: e.target.value })} disabled={disabled} placeholder="Contoh: Poli Umum, Poli Dalam..." className="bg-white h-9 text-sm rounded-xl font-normal" />
                  </div>
                </div>
                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5 text-emerald-700" /><span>Diagnosis / Alasan Kontrol</span></label>
                    {primaryDiagnosis && (<button type="button" disabled={disabled} onClick={() => onControlVisitChange?.({ ...controlVisitData, diagnosis: `${primaryDiagnosis.code} - ${primaryDiagnosis.name}` })} className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"><Sparkles className="h-3 w-3" /><span>Ambil Diagnosis Utama ({primaryDiagnosis.code})</span></button>)}
                  </div>
                  <Input placeholder="Contoh: I10 - Hipertensi Primer, Kontrol tekanan darah" value={controlVisitData.diagnosis || ''} onChange={(e) => onControlVisitChange?.({ ...controlVisitData, diagnosis: e.target.value })} disabled={disabled} className="bg-white h-8 text-xs rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Instruksi untuk Pasien</label>
                  <Textarea rows={2} placeholder="Contoh: Bawa kartu berobat dan hasil lab terakhir. Hadir 15 menit sebelum jadwal." value={controlVisitData.instructions || ''} onChange={(e) => onControlVisitChange?.({ ...controlVisitData, instructions: e.target.value })} disabled={disabled} className="bg-white text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Catatan Tambahan (opsional)</label>
                  <Textarea rows={2} placeholder="Catatan tambahan dari dokter..." value={controlVisitData.notes || ''} onChange={(e) => onControlVisitChange?.({ ...controlVisitData, notes: e.target.value })} disabled={disabled} className="bg-white text-xs rounded-xl" />
                </div>
                <div className="p-3.5 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-xl bg-green-500 flex items-center justify-center shrink-0"><MessageCircle className="h-3.5 w-3.5 text-white" /></div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-green-900">Reminder Otomatis via WhatsApp</div>
                      <p className="text-[11px] text-green-700 mt-0.5">Kirim pengingat jadwal kontrol ke WhatsApp pasien secara langsung setelah surat diterbitkan</p>
                    </div>
                    {controlVisitData.reminderStatus === 'SENT' && (<span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Terkirim</span>)}
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex-1 text-[11px] text-green-900">
                      <span className="font-semibold text-slate-700">No. HP / WhatsApp Pasien:</span>{' '}
                      {patientPhone ? (
                        <span className="font-mono font-bold text-emerald-950 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                          📱 {patientPhone}
                        </span>
                      ) : (
                        <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Belum ada nomor — klik Kirim Reminder untuk input
                        </span>
                      )}
                    </div>
                    <Button type="button" size="sm" onClick={() => setShowWAReminderModal(true)} className="h-8 px-3.5 text-xs font-bold gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl cursor-pointer shadow-sm shrink-0"><Send className="h-3.5 w-3.5" /><span>Kirim Reminder WA</span></Button>
                  </div>
                </div>
              </div>
            )}
            {!isControlVisitActive && (
              <div className="p-5 rounded-2xl border-2 border-dashed border-green-200 bg-green-50/30 text-center space-y-2">
                <MessageCircle className="h-8 w-8 text-green-400 mx-auto" />
                <div>
                  <div className="text-sm font-bold text-slate-700">Surat Kontrol Kunjungan</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Aktifkan untuk membuat jadwal kontrol ulang dan mengirim reminder otomatis ke WhatsApp pasien.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Embedded Print Preview Modal */}
      <CertificatePrintModal
        open={printModalState.open}
        onOpenChange={(open) => setPrintModalState((prev) => ({ ...prev, open }))}
        type={printModalState.type}
        visit={visit}
        sickLeaveData={sickLeaveData}
        healthData={healthData}
        referralData={referralData}
      />

      {/* WhatsApp Reminder Modal */}
      {isControlVisitActive && controlVisitData && (
        <WhatsAppReminderModal
          open={showWAReminderModal}
          onOpenChange={setShowWAReminderModal}
          patient={effectivePatient}
          controlVisitLetter={controlVisitData}
          config={config}
          onReminderSent={(updatedLetter) => {
            onControlVisitChange?.(updatedLetter);
          }}
        />
      )}
    </Card>
  );
}
