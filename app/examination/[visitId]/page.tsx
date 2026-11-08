'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { VitalSignsPanel } from '@/components/examination/vital-signs-panel';
import { DiagnosisSelector } from '@/components/examination/diagnosis-selector';
import { ProcedureSelector } from '@/components/examination/procedure-selector';
import { PrescriptionForm } from '@/components/examination/prescription-form';
import { PatientHistorySide } from '@/components/examination/patient-history-side';
import { MedicalCertificateForm } from '@/components/examination/medical-certificate-form';
import { LabOrderPanel } from '@/components/examination/lab-order-panel';
import { RadiologyOrderPanel } from '@/components/examination/radiology-order-panel';
import { PrescriptionPrintModal } from '@/components/examination/prescription-print-modal';
import { InformedConsentModal } from '@/components/examination/informed-consent-modal';
import { MedicalResumeModal } from '@/components/examination/medical-resume-modal';
import { useRME } from '@/context/rme-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Stethoscope,
  Save,
  CheckCircle2,
  FileText,
  ArrowLeft,
  AlertTriangle,
  ClipboardList,
  HeartPulse,
  Activity,
  Sparkles,
  Copy,
  Lock,
  Receipt,
  Printer,
  Pill,
  Microscope,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  VitalSigns,
  DiagnosisItem,
  ProcedureItem,
  PrescriptionItem,
  LabOrderItem,
  RadiologyOrderItem,
  SickLeaveCertificate,
  HealthCertificate,
  ReferralCertificate,
  InformedConsent,
  ControlVisitLetter,
  Patient,
} from '@/types/rme';
import { fetchBackendPatients, mapBackendPatientToPatient } from '@/lib/api-client';

export default function ExaminationWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const {
    visits,
    patients,
    getVisitById,
    saveMedicalRecord,
    updatePatient,
    loadMedicalRecordForVisit,
    config,
    currentUser,
    trialInfo,
    isTrialExpired,
    hasPermission,
  } = useRME();

  const visitId = (params?.visitId as string) || '';
  const visit = getVisitById(visitId);

  useEffect(() => {
    if (visitId) {
      loadMedicalRecordForVisit?.(visitId);
    }
  }, [visitId]);

  // Sinkronkan data pasien dengan master data pasien (agar no. telp/WhatsApp dari pendaftaran selalu tersedia)
  const registeredPatient = patients.find(
    (p) =>
      (visit?.patientId && p.id === visit.patientId) ||
      (visit?.patient?.id && p.id === visit.patient.id) ||
      (visit?.patient?.noRM && p.noRM === visit.patient.noRM) ||
      (visit?.patient?.nik && p.nik === visit.patient.nik) ||
      (visit?.patient?.name && p.name.trim().toLowerCase() === visit.patient.name.trim().toLowerCase())
  );

  const activePatient: Patient = visit
    ? {
        ...visit.patient,
        ...(registeredPatient || {}),
        phone:
          registeredPatient?.phone ||
          visit.patient?.phone ||
          (visit.patient as any)?.phone_number ||
          (visit.patient as any)?.no_hp ||
          '',
      }
    : ({} as Patient);

  // Jika nomor HP pasien belum ada di visit.patient, cari dari backend jika belum ketemu di master pasien lokal
  useEffect(() => {
    if (!visit) return;
    const phone = activePatient.phone?.trim();
    if (!phone && (visit.patient?.noRM || visit.patient?.name)) {
      const searchTerm = visit.patient?.noRM || visit.patient?.name;
      fetchBackendPatients({ search: searchTerm, limit: 5 })
        .then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const found = res.data.find(
              (p: any) =>
                p.id === visit.patientId ||
                p.no_rm === visit.patient?.noRM ||
                p.name?.trim().toLowerCase() === visit.patient?.name?.trim().toLowerCase()
            );
            if (found && found.phone) {
              const mapped = mapBackendPatientToPatient(found);
              updatePatient(mapped.id, { phone: found.phone });
            }
          }
        })
        .catch(console.warn);
    }
  }, [visit?.id, activePatient.phone]);

  const isDoctor = config.currentRole === 'DOCTOR' || config.appMode === 'DOCTOR_ONLY';
  const isSuperAdminOrTrial =
    currentUser?.role === 'SUPERADMIN' ||
    config.currentRole === 'SUPERADMIN' ||
    (trialInfo?.tier === 'TRIAL' && !isTrialExpired);

  // Status check: Jika sudah diperiksa dan pembayaran lunas, rekam medis dikunci permanen (Permenkes No. 24/2022)
  const isPaid = visit?.status === 'PAID' || visit?.billing?.status === 'PAID';
  const isExamined = Boolean(visit?.medicalRecord) || visit?.status === 'COMPLETED' || visit?.status === 'WAITING_PAYMENT' || visit?.status === 'PAID';
  const isCompletedAndPaid = Boolean(isPaid && isExamined);

  // Doctors, Super Admins, and active Trial users have full authority to provide medical records,
  // UNLESS the visit has already completed examination and payment (Permanent Lock).
  const canEditMedicalRecord = !isCompletedAndPaid && (hasPermission('edit_medical_record') || hasPermission('create_medical_record') || isDoctor || isSuperAdminOrTrial);
  const mr = visit?.medicalRecord;

  // Form States - Clean empty defaults
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    systolic: mr?.vitalSigns?.systolic || 0,
    diastolic: mr?.vitalSigns?.diastolic || 0,
    heartRate: mr?.vitalSigns?.heartRate || 0,
    temperature: mr?.vitalSigns?.temperature || 0,
    respiratoryRate: mr?.vitalSigns?.respiratoryRate || 0,
    weight: mr?.vitalSigns?.weight || 0,
    height: mr?.vitalSigns?.height || 0,
    bmi: mr?.vitalSigns?.bmi || 0,
    bmiCategory: mr?.vitalSigns?.bmiCategory || undefined,
    oxygenSaturation: mr?.vitalSigns?.oxygenSaturation || 0,
  });

  const [chiefComplaint, setChiefComplaint] = useState(
    mr?.chiefComplaint || visit?.chiefComplaintSummary || ''
  );

  const [anamnesis, setAnamnesis] = useState(
    mr?.anamnesis || ''
  );

  const [physicalExamination, setPhysicalExamination] = useState(
    mr?.physicalExamination || ''
  );

  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>(
    mr?.diagnoses || []
  );

  const [procedures, setProcedures] = useState<ProcedureItem[]>(
    mr?.procedures || []
  );

  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>(
    mr?.prescriptions || []
  );

  const [labOrders, setLabOrders] = useState<LabOrderItem[]>(
    mr?.labOrders || []
  );

  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrderItem[]>(
    mr?.radiologyOrders || []
  );

  const [showRxPrintModal, setShowRxPrintModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  const [clinicalNotes, setClinicalNotes] = useState(mr?.clinicalNotes || '');
  const [followUpPlan, setFollowUpPlan] = useState(mr?.followUpPlan || '');
  const [sickLeaveData, setSickLeaveData] = useState<SickLeaveCertificate | undefined>(
    mr?.sickLeaveCertificate
  );
  const [healthData, setHealthData] = useState<HealthCertificate | undefined>(
    mr?.healthCertificate
  );
  const [referralData, setReferralData] = useState<ReferralCertificate | undefined>(
    mr?.referralCertificate
  );
  const [consents, setConsents] = useState<InformedConsent[]>(
    mr?.informedConsents || []
  );
  const [controlVisitData, setControlVisitData] = useState<ControlVisitLetter | undefined>(
    mr?.controlVisitLetter
  );
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if visit changes
  useEffect(() => {
    if (visit && visit.medicalRecord) {
      const r = visit.medicalRecord;
      setVitalSigns(r.vitalSigns);
      setChiefComplaint(r.chiefComplaint);
      setAnamnesis(r.anamnesis);
      setPhysicalExamination(r.physicalExamination);
      setDiagnoses(r.diagnoses);
      setProcedures(r.procedures);
      setPrescriptions(r.prescriptions);
      setLabOrders(r.labOrders || []);
      setRadiologyOrders(r.radiologyOrders || []);
      setClinicalNotes(r.clinicalNotes || '');
      setFollowUpPlan(r.followUpPlan || '');
      setSickLeaveData(r.sickLeaveCertificate);
      setHealthData(r.healthCertificate);
      setReferralData(r.referralCertificate);
      setConsents(r.informedConsents || []);
      setControlVisitData(r.controlVisitLetter);
    }
  }, [visitId, visit]);

  if (!visit) {
    return (
      <MainLayout>
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-2" />
          <h2 className="text-lg font-bold text-slate-800">Kunjungan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">Silakan pilih antrian pasien dari daftar antrian.</p>
          <div className="mt-4">
            <Link href="/queue">
              <Button size="sm" className="text-xs rounded-xl">Kembali ke Antrian</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleSave = (completeExamination: boolean) => {
    if (isCompletedAndPaid) {
      toast.error('Pemeriksaan dan pembayaran telah lunas. Berkas Rekam Medis terkunci permanen dan tidak dapat diubah lagi.');
      return;
    }

    if (!chiefComplaint.trim() && completeExamination) {
      toast.error('Keluhan utama pasien wajib diisi');
      return;
    }

    if (diagnoses.length === 0 && completeExamination) {
      toast.error('Pilih minimal satu diagnosis ICD-10 untuk menyelesaikan rekam medis');
      return;
    }

    setIsSaving(true);

    try {
      saveMedicalRecord(
        visit.id,
        {
          vitalSigns,
          chiefComplaint: chiefComplaint.trim(),
          anamnesis: anamnesis.trim(),
          physicalExamination: physicalExamination.trim(),
          diagnoses,
          procedures,
          prescriptions,
          prescriptionType: config.hasPharmacy !== false ? 'INTERNAL' : 'EXTERNAL',
          labOrders: config.hasLaboratory ? labOrders : undefined,
          radiologyOrders: config.hasRadiology ? radiologyOrders : undefined,
          clinicalNotes: clinicalNotes.trim(),
          followUpPlan: followUpPlan.trim(),
          sickLeaveCertificate: sickLeaveData,
          healthCertificate: healthData,
          referralCertificate: referralData,
          controlVisitLetter: controlVisitData,
          informedConsents: consents,
        },
        completeExamination
      );

      setIsSaving(false);

      if (completeExamination) {
        toast.success(`Pemeriksaan pasien ${visit.patient.name} selesai! Tagihan otomatis diterbitkan.`);
        if (config.appMode === 'DOCTOR_ONLY') {
          router.push(`/billing/${visit.id}`);
        } else {
          router.push('/queue');
        }
      } else {
        toast.success('Draft rekam medis berhasil disimpan.');
      }
    } catch (err: any) {
      setIsSaving(false);
      toast.error('Gagal menyimpan rekam medis: ' + err.message);
    }
  };

  // Quick Anamnesis Template Chips
  const handleInsertTemplate = (text: string) => {
    setAnamnesis((prev) => (prev ? `${prev}\n${text}` : text));
  };

  // Import Vital Signs into Physical Examination (Objective)
  const handleImportVitalSigns = () => {
    const parts: string[] = [];
    if (vitalSigns.systolic && vitalSigns.diastolic) {
      parts.push(`TD: ${vitalSigns.systolic}/${vitalSigns.diastolic} mmHg`);
    }
    if (vitalSigns.heartRate) {
      parts.push(`HR: ${vitalSigns.heartRate} x/m`);
    }
    if (vitalSigns.respiratoryRate) {
      parts.push(`RR: ${vitalSigns.respiratoryRate} x/m`);
    }
    if (vitalSigns.temperature) {
      parts.push(`Suhu: ${vitalSigns.temperature}°C`);
    }
    if (vitalSigns.oxygenSaturation) {
      parts.push(`SpO2: ${vitalSigns.oxygenSaturation}%`);
    }
    if (vitalSigns.weight && vitalSigns.height) {
      parts.push(`BB: ${vitalSigns.weight} kg, TB: ${vitalSigns.height} cm (IMT: ${vitalSigns.bmi || '-'})`);
    } else if (vitalSigns.weight) {
      parts.push(`BB: ${vitalSigns.weight} kg`);
    } else if (vitalSigns.height) {
      parts.push(`TB: ${vitalSigns.height} cm`);
    }

    const vsSummary = `Tanda Vital: ${parts.join(', ')}.`;

    if (!physicalExamination.trim()) {
      setPhysicalExamination(
        `${vsSummary}\nKeadaan Umum: Baik, Compos Mentis.\nKepala/Leher: Anemis (-), Ikterik (-), Faring tenang.\nToraks: Cor S1-S2 reguler, Pulmo Vesikuler +/+, Ronkhi -/-, Wheezing -/-.\nAbdomen: Supel, bising usus normal, nyeri tekan (-).\nEkstremitas: Akral hangat, CRT < 2 detik, Edema (-/-).`
      );
    } else if (physicalExamination.toLowerCase().includes('tanda vital:')) {
      const updated = physicalExamination.replace(/Tanda Vital:[^\n]+(\n)?/i, `${vsSummary}\n`);
      setPhysicalExamination(updated);
    } else {
      setPhysicalExamination(`${vsSummary}\n${physicalExamination}`);
    }

    toast.success('Data tanda vital berhasil dimasukkan ke pemeriksaan fisik!');
  };

  // Quick Physical Exam Template
  const handleInsertPETemplate = (text: string) => {
    setPhysicalExamination((prev) => (prev ? `${prev}\n${text}` : text));
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Top Sticky Action Bar */}
        <div className="sticky top-14 z-20 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 mb-4 border-b border-slate-200/90 bg-white/95 px-4 py-3 sm:px-6 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/queue">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer" title="Kembali ke Antrian">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Antrian: {visit.queueNumber}
                </span>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700" />
                  <span>Workspace Pemeriksaan Dokter</span>
                </h1>
                <Badge
                  variant={visit.status === 'PAID' ? 'success' : visit.status === 'IN_PROGRESS' ? 'info' : 'warning'}
                  className="text-xs font-semibold py-0.5 px-2"
                >
                  {visit.status === 'IN_PROGRESS' ? 'Sedang Berlangsung' : visit.status}
                </Badge>
              </div>
              <div className="text-xs sm:text-[13px] text-slate-600 font-medium mt-1">
                Pasien: <strong className="text-slate-900 font-bold">{visit.patient.name}</strong> ({visit.patient.noRM}) • Dokter: <span className="text-slate-800 font-semibold">{visit.doctorName}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
            {/* Tombol Resume Medis jika sudah diperiksa atau sudah ada data rekam medis */}
            {(isCompletedAndPaid || visit.status === 'WAITING_PAYMENT' || Boolean(visit.medicalRecord) || diagnoses.length > 0) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowResumeModal(true)}
                className="h-9 px-3.5 text-xs sm:text-sm font-bold gap-1.5 bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs rounded-xl cursor-pointer"
                title="Lihat dan cetak Resume Medis Pasien (Standar Permenkes No. 24/2022)"
              >
                <FileText className="h-4 w-4 text-emerald-700" />
                <span>Resume Medis</span>
              </Button>
            )}

            {isCompletedAndPaid ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs sm:text-[13px] py-1 px-3 bg-slate-100 text-slate-700 border-slate-300 font-bold flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  <span>Rekam Medis Terkunci (Lunas)</span>
                </Badge>
                <Link href={`/billing/${visit.id}`}>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-3.5 text-xs sm:text-sm font-semibold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs rounded-xl cursor-pointer"
                  >
                    <Receipt className="h-4 w-4" />
                    <span>Lihat Kwitansi Kasir</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(false)}
                  disabled={isSaving || !canEditMedicalRecord}
                  title={!canEditMedicalRecord ? 'Mode Baca: Hanya dokter atau Super Admin yang dapat mengubah rekam medis' : 'Simpan perubahan rekam medis sebagai draft'}
                  className="h-9 px-3.5 text-xs sm:text-sm gap-1.5 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs rounded-xl font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Draft</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSave(true)}
                  disabled={isSaving || !canEditMedicalRecord}
                  title={!canEditMedicalRecord ? 'Mode Baca: Hanya dokter atau Super Admin yang berwenang menyelesaikan pemeriksaan' : 'Selesaikan pemeriksaan & terbitkan tagihan ke kasir'}
                  className="h-9 px-4 text-xs sm:text-sm font-semibold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs rounded-xl cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Selesaikan Pemeriksaan</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* REKAM MEDIS TERKUNCI PERMANEN (PEMERIKSAAN SELESAI & LUNAS) */}
        {isCompletedAndPaid && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border border-slate-700 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 text-emerald-400 shrink-0 mt-0.5">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">
                    Rekam Medis Elektronik Terkunci Permanen
                  </span>
                  <Badge className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    Pemeriksaan Selesai & Lunas
                  </Badge>
                </div>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed max-w-3xl">
                  Sesuai ketentuan regulasi Permenkes No. 24 Tahun 2022 tentang Rekam Medis Elektronik, rekam medis yang telah selesai diperiksa dokter dan telah diselesaikan pembayarannya di kasir bersifat final dan <strong>tidak dapat diedit, diubah, atau dihapus kembali</strong> guna menjamin integritas klinis, otentisitas, dan kepatuhan hukum.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setShowResumeModal(true)}
                className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Cetak Resume Medis</span>
              </Button>
              <Link href={`/billing/${visit.id}`}>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs font-bold gap-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl shadow-xs cursor-pointer"
                >
                  <Receipt className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Lihat Kwitansi Kasir</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ROLE WARNING / TRIAL ACCESS BANNER (WHEN NOT LOCKED) */}
        {!isCompletedAndPaid && !canEditMedicalRecord && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode Tinjauan:</strong> Anda sedang dalam mode tinjauan non-klinis. Sesuai regulasi, pengisian rekam medis hanya dapat dilakukan oleh Dokter atau Super Admin faskes.
            </span>
          </div>
        )}

        {!isCompletedAndPaid && canEditMedicalRecord && isSuperAdminOrTrial && !isDoctor && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Hak Akses Penuh Super Admin (Masa Percobaan Trial):</strong> Anda memiliki wewenang untuk mengisi tanda vital, anamnesis, diagnosis ICD-10, tindakan medis, dan e-resep serta menerbitkan tagihan kasir secara penuh.
            </span>
          </div>
        )}

        {/* Top Patient Profile & Safety Banner */}
        <Card className="p-4 border border-slate-200 bg-white shadow-2xs rounded-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Patient Info */}
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white font-black text-xl shadow-sm">
                {activePatient.name?.charAt(0) || 'P'}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">{activePatient.name}</h2>
                  <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {activePatient.noRM}
                  </span>
                  <Badge variant="outline" className="text-xs font-semibold border-slate-200 bg-slate-50 text-slate-700">
                    {visit.paymentType || 'UMUM'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-600 font-medium flex-wrap">
                  <span>{activePatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                  <span className="text-slate-300">•</span>
                  <span>{activePatient.age || 30} Tahun</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-slate-500">NIK: {activePatient.nik || '-'}</span>
                  {activePatient.bloodType && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-rose-600 font-bold">Gol. Darah: {activePatient.bloodType}</span>
                    </>
                  )}
                  {activePatient.phone && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        📱 WA: {activePatient.phone}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Allergy & Safety Alert */}
            <div className="w-full lg:w-auto shrink-0 flex items-center justify-end">
              {visit.patient.allergies && visit.patient.allergies.length > 0 ? (
                <div className="w-full lg:w-auto flex items-center gap-2 p-2.5 px-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-[13px]">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold">RIWAYAT ALERGI:</span>
                    {visit.patient.allergies.map((alg) => (
                      <Badge key={alg} variant="destructive" className="text-xs py-0.5 px-2 font-bold bg-rose-600 text-white">
                        {alg}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                  Tidak ada riwayat alergi obat yang dilaporkan
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 2-COLUMN BALANCED CLINICAL WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ============================================================ */}
          {/* KOLOM KIRI (6 Cols): PEMERIKSAAN KLINIS (S, O) & RIWAYAT     */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 space-y-4">
            {/* Section 1: Tanda Vital */}
            <VitalSignsPanel
              patient={visit.patient}
              vitalSigns={vitalSigns}
              onChange={setVitalSigns}
              disabled={!canEditMedicalRecord}
            />

            {/* Section 2: Anamnesis & Keluhan Utama (Subjective) */}
            <Card className="p-4 border border-slate-200 bg-white shadow-2xs space-y-3.5 rounded-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700" />
                  <span>Anamnesis &amp; Keluhan Utama (Subjective)</span>
                  <span className="text-rose-500 font-bold">*</span>
                </h3>
                {canEditMedicalRecord && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate('Keluhan batuk berdahak disertai demam sejak 3 hari.')}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium cursor-pointer"
                    >
                      + Batuk/Demam
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate('Nyeri ulu hati terasa melilit, kembung, mual.')}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium cursor-pointer"
                    >
                      + Dispepsia
                    </button>
                  </div>
                )}
              </div>

              {/* Keluhan Utama */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-[13px] font-semibold text-slate-700 flex items-center gap-1">
                  <span>Keluhan Utama (Chief Complaint)</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <Input
                  required
                  placeholder="Contoh: Demam tinggi 3 hari, batuk pilek, nyeri menelan..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  disabled={!canEditMedicalRecord}
                  className="h-9 sm:h-10 text-sm text-slate-800 placeholder:text-slate-400 bg-white rounded-xl font-normal"
                />
              </div>

              {/* Riwayat Penyakit Sekarang (RPS) */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
                  Anamnesis Lengkap (RPS, RPD, RPK, Riwayat Alergi)
                </label>
                <Textarea
                  rows={3}
                  placeholder="Deskripsikan perjalanan keluhan pasien secara terperinci..."
                  value={anamnesis}
                  onChange={(e) => setAnamnesis(e.target.value)}
                  disabled={!canEditMedicalRecord}
                  className="text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 bg-white rounded-xl font-normal"
                />
              </div>
            </Card>

            {/* Section 3: Pemeriksaan Fisik (Objective) */}
            <Card className="p-4 border border-slate-200 bg-white shadow-2xs space-y-3.5 rounded-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                  <HeartPulse className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700" />
                  <span>Pemeriksaan Fisik (Objective - Status Generalis &amp; Lokalis)</span>
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleImportVitalSigns}
                    disabled={!canEditMedicalRecord}
                    className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors font-semibold cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Salin dan masukkan data tanda vital ke deskripsi pemeriksaan fisik"
                  >
                    <Activity className="h-3.5 w-3.5 text-emerald-700" />
                    <span>+ Ambil Data Vital Sign</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertPETemplate('Keadaan Umum: Baik, Compos Mentis.\nKepala/Leher: Anemis (-), Ikterik (-), Faring tenang.\nToraks: Cor S1-S2 reguler, Pulmo Vesikuler +/+, Ronkhi -/-, Wheezing -/-.\nAbdomen: Supel, bising usus normal, nyeri tekan (-).\nEkstremitas: Akral hangat, CRT < 2 detik, Edema (-/-).')}
                    disabled={!canEditMedicalRecord}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium cursor-pointer"
                  >
                    + Normal DBN
                  </button>
                </div>
              </div>

              <Textarea
                rows={3}
                placeholder="Pemeriksaan fisik umum, kepala, leher, thoraks, abdomen, ekstremitas..."
                value={physicalExamination}
                onChange={(e) => setPhysicalExamination(e.target.value)}
                disabled={!canEditMedicalRecord}
                className="text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 bg-white font-sans rounded-xl font-normal"
              />
            </Card>

            {/* Section 4: Diagnosis ICD-10 (Assessment) */}
            <Card className="p-4 border border-slate-200 bg-white shadow-2xs rounded-2xl">
              <DiagnosisSelector
                diagnoses={diagnoses}
                onChange={setDiagnoses}
                disabled={!canEditMedicalRecord}
              />
            </Card>

            {/* Section 5: Riwayat Rekam Medis Kunjungan Lalu */}
            <PatientHistorySide
              patientId={visit.patientId}
              currentVisitId={visit.id}
            />
          </div>

          {/* ============================================================ */}
          {/* KOLOM KANAN (6 Cols): PENATALAKSANAAN (PLAN), TINDAKAN, RESEP*/}
          {/* ============================================================ */}
          <div className="lg:col-span-6 space-y-4">
            {/* Section 6: Tindakan Medis & Terapi Tambahan */}
            <Card className="p-4 border border-slate-200 bg-white shadow-2xs rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-emerald-700" />
                  <span>Tindakan Medis &amp; Terapi (ICD-9-CM)</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConsentModal(true)}
                  className="h-7 text-xs font-bold gap-1.5 border-emerald-300 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 rounded-lg cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Informed Consent</span>
                  {consents.length > 0 && (
                    <Badge className="bg-emerald-700 text-white text-[9px] py-0 px-1 font-bold">
                      {consents.length}
                    </Badge>
                  )}
                </Button>
              </div>

              <ProcedureSelector
                procedures={procedures}
                onChange={setProcedures}
                disabled={!canEditMedicalRecord}
              />
            </Card>

            {/* Modal Informed Consent */}
            <InformedConsentModal
              open={showConsentModal}
              onOpenChange={setShowConsentModal}
              visit={visit}
              procedures={procedures}
              consents={consents}
              onChange={setConsents}
              disabled={!canEditMedicalRecord}
            />

            {/* Section 6B: Pemeriksaan Laboratorium Klinis (JIKA FASKES MEMILIKI LAB) */}
            {config.hasLaboratory && (
              <LabOrderPanel
                labOrders={labOrders}
                onChange={setLabOrders}
                disabled={!canEditMedicalRecord}
              />
            )}

            {/* Section 6C: Pemeriksaan Radiologi & USG (JIKA FASKES MEMILIKI RADIOLOGI) */}
            {config.hasRadiology && (
              <RadiologyOrderPanel
                radiologyOrders={radiologyOrders}
                onChange={setRadiologyOrders}
                disabled={!canEditMedicalRecord}
              />
            )}

            {/* Section 7: E-Resep & Terapi Farmasi (Plan) */}
            <Card className="p-4 border border-slate-200 bg-white shadow-2xs rounded-2xl space-y-3">
              {config.hasPharmacy === false ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 text-amber-950">
                    <Pill className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <span>Mode Resep Luar (Apotek Eksternal)</span>
                        <Badge className="bg-amber-200 text-amber-900 text-[9px] font-bold py-0">Tanpa Apotek Faskes</Badge>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                        Faskes tidak mengelola stok obat internal. Rincian obat tidak ditagihkan di kasir. Silakan cetak lembar R/ berkop resmi untuk dibawa pasien ke apotek luar.
                      </p>
                    </div>
                  </div>
                  {prescriptions.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowRxPrintModal(true)}
                      className="h-7 text-xs font-bold gap-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg shrink-0 cursor-pointer shadow-2xs self-end sm:self-center"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Cetak Blanko R/</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5 text-purple-700" />
                    <span>Depo Farmasi Internal Faskes</span>
                  </div>
                  {prescriptions.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRxPrintModal(true)}
                      className="h-6 text-[10px] font-bold gap-1 text-slate-700 hover:text-slate-900 border-slate-200 rounded-lg cursor-pointer"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Cetak Salinan R/</span>
                    </Button>
                  )}
                </div>
              )}

              <PrescriptionForm
                patient={visit.patient}
                prescriptions={prescriptions}
                onChange={setPrescriptions}
                disabled={!canEditMedicalRecord}
              />
            </Card>

            {/* Modal Cetak Blanko Resep R/ */}
            <PrescriptionPrintModal
              open={showRxPrintModal}
              onOpenChange={setShowRxPrintModal}
              visit={visit}
              prescriptions={prescriptions}
            />

            {/* Section 8: Surat Keterangan Medis Dokter (Surat Sakit, Surat Sehat, Surat Rujukan) */}
            <MedicalCertificateForm
              patient={activePatient}
              doctorName={visit.doctorName}
              primaryDiagnosis={diagnoses.find((d) => d.type === 'PRIMARY') || diagnoses[0]}
              vitalSigns={vitalSigns}
              sickLeaveData={sickLeaveData}
              healthData={healthData}
              referralData={referralData}
              controlVisitData={controlVisitData}
              onSickLeaveChange={setSickLeaveData}
              onHealthChange={setHealthData}
              onReferralChange={setReferralData}
              onControlVisitChange={setControlVisitData}
              disabled={!canEditMedicalRecord}
              visit={{ ...visit, patient: activePatient }}
            />

            {/* Section 9: Instruksi Edukasi & Rencana Tindak Lanjut */}
            <Card className="p-4 border border-slate-200 bg-white shadow-2xs space-y-3.5 rounded-2xl">
              <div className="border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700" />
                <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                  Instruksi Edukasi &amp; Rencana Tindak Lanjut Pasien
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
                    Catatan Khusus / Edukasi Pasien
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Istirahat cukup, hindari makanan berminyak, banyak minum air hangat..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    disabled={!canEditMedicalRecord}
                    className="text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 bg-white rounded-xl font-normal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
                    Rencana Kontrol / Rujukan
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Kontrol ulang 3 hari jika keluhan demam menetap atau timbul sesak..."
                    value={followUpPlan}
                    onChange={(e) => setFollowUpPlan(e.target.value)}
                    disabled={!canEditMedicalRecord}
                    className="text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 bg-white rounded-xl font-normal"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Pratinjau & Cetak Resume Medis Pasien */}
      <MedicalResumeModal
        open={showResumeModal}
        onOpenChange={setShowResumeModal}
        visit={{
          ...visit,
          medicalRecord: {
            id: visit.medicalRecord?.id || `mr-${visit.id}`,
            visitId: visit.id,
            patientId: visit.patientId,
            doctorId: visit.doctorId || visit.medicalRecord?.doctorId || 'doc-1',
            doctorName: visit.doctorName || visit.medicalRecord?.doctorName || config.doctorName,
            date: visit.date,
            createdAt: visit.medicalRecord?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            vitalSigns,
            chiefComplaint,
            anamnesis,
            physicalExamination,
            diagnoses,
            procedures,
            prescriptions,
            labOrders,
            radiologyOrders,
            clinicalNotes,
            followUpPlan,
            sickLeaveCertificate: sickLeaveData,
            healthCertificate: healthData,
            referralCertificate: referralData,
            controlVisitLetter: controlVisitData,
            informedConsents: consents,
          },
        }}
      />
    </MainLayout>
  );
}
