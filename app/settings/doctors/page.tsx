'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Doctor } from '@/types/rme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import {
  Stethoscope,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  Copy,
  Users,
  UserCheck,
  ArrowLeft,
  ShieldCheck,
  Globe,
  Building2,
  Sparkles,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
// ─── Constants ───────────────────────────────────────────────────────────────
const ALL_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// ─── Master Spesialisasi Medis ───────────────────────────────────────────────
const SPECIALTY_GROUPS = [
  {
    label: 'Pelayanan Primer & Umum',
    options: [
      'Dokter Umum',
      'Dokter Gigi',
      'Dokter Keluarga',
    ],
  },
  {
    label: 'Spesialis Medis',
    options: [
      'Spesialis Penyakit Dalam (Sp.PD)',
      'Spesialis Anak (Sp.A)',
      'Spesialis Obstetri & Ginekologi (Sp.OG)',
      'Spesialis Jantung & Pembuluh Darah (Sp.JP)',
      'Spesialis Paru & Kedokteran Respirasi (Sp.P)',
      'Spesialis Saraf / Neurologi (Sp.N / Sp.S)',
      'Spesialis Mata (Sp.M)',
      'Spesialis Telinga Hidung Tenggorok (Sp.THT-BKL)',
      'Spesialis Kulit & Kelamin (Sp.DVE / Sp.KK)',
      'Spesialis Kedokteran Jiwa / Psikiatri (Sp.KJ)',
      'Spesialis Kedokteran Fisik & Rehabilitasi (Sp.KFR)',
      'Spesialis Gizi Klinik (Sp.GK)',
    ],
  },
  {
    label: 'Spesialis Bedah',
    options: [
      'Spesialis Bedah Umum (Sp.B)',
      'Spesialis Bedah Ortopedi & Traumatologi (Sp.OT)',
      'Spesialis Bedah Urologi (Sp.U)',
      'Spesialis Bedah Saraf (Sp.BS)',
      'Spesialis Bedah Anak (Sp.BA)',
      'Spesialis Bedah Plastik & Rekonstruksi (Sp.BP-RE)',
      'Spesialis Anestesiologi & Terapi Intensif (Sp.An-TI)',
    ],
  },
  {
    label: 'Kedokteran Gigi Spesialis',
    options: [
      'Spesialis Konservasi Gigi (Sp.KG)',
      'Spesialis Kedokteran Gigi Anak (Sp.KGA)',
      'Spesialis Bedah Mulut & Maksilofasial (Sp.BMM)',
      'Spesialis Ortodonsia (Sp.Ort)',
      'Spesialis Periodonsia (Sp.Perio)',
      'Spesialis Prostodonsia (Sp.Pros)',
    ],
  },
  {
    label: 'Diagnostik & Penunjang',
    options: [
      'Spesialis Radiologi (Sp.Rad)',
      'Spesialis Patologi Klinik (Sp.PK)',
      'Spesialis Patologi Anatomi (Sp.PA)',
      'Spesialis Akupunktur Medik (Sp.Ak)',
      'Spesialis Kedokteran Okupasi (Sp.Ok)',
    ],
  },
];

const ALL_SPECIALTIES_FLAT = SPECIALTY_GROUPS.flatMap((g) => g.options);

// ─── Master Ruang Poli Pelayanan ─────────────────────────────────────────────
const POLI_GROUPS = [
  {
    label: 'Pelayanan Primer & Rawat Jalan',
    options: [
      'Poli Umum',
      'Poli Gigi & Mulut',
      'Poli KIA & KB',
      'Poli Anak',
      'Poli Lansia / Geriatri',
      'Poli Remaja (PKPR)',
    ],
  },
  {
    label: 'Poli Spesialis',
    options: [
      'Poli Penyakit Dalam',
      'Poli Kandungan & Kebidanan (Obgyn)',
      'Poli Bedah',
      'Poli Mata',
      'Poli THT-KL',
      'Poli Kulit & Kelamin',
      'Poli Saraf / Neurologi',
      'Poli Jantung & Kardiovaskular',
      'Poli Paru & Saluran Napas',
      'Poli Fisioterapi & Rehab Medik',
      'Poli Jiwa & Konseling Psikologis',
      'Poli Gizi & Dietetika',
      'Poli Akupunktur Medis',
    ],
  },
  {
    label: 'Gawat Darurat & Tindakan',
    options: [
      'Instalasi Gawat Darurat (IGD) & Triase',
      'Ruang Tindakan Medis & Bedah Minor',
      'Poli TB / DOTS',
      'Poli Medical Check Up (MCU)',
      'Poli Imunisasi & Vaksinasi',
    ],
  },
  {
    label: 'Nomor Ruangan',
    options: [
      'Poli Umum 1',
      'Poli Umum 2',
      'Poli Gigi 1',
      'Poli Gigi 2',
    ],
  },
];

const ALL_POLIS_FLAT = POLI_GROUPS.flatMap((g) => g.options);

const getAutoPoli = (specialty: string): string => {
  const s = specialty.toLowerCase();
  if (s.includes('gigi')) return 'Poli Gigi & Mulut';
  if (s.includes('anak') && !s.includes('bedah anak')) return 'Poli Anak';
  if (s.includes('kebidanan') || s.includes('kandungan') || s.includes('sp.og')) return 'Poli Kandungan & Kebidanan (Obgyn)';
  if (s.includes('penyakit dalam') || s.includes('sp.pd')) return 'Poli Penyakit Dalam';
  if (s.includes('bedah')) return 'Poli Bedah';
  if (s.includes('mata') || s.includes('sp.m')) return 'Poli Mata';
  if (s.includes('tht')) return 'Poli THT-KL';
  if (s.includes('kulit') || s.includes('dve') || s.includes('sp.kk')) return 'Poli Kulit & Kelamin';
  if (s.includes('saraf') || s.includes('neurologi')) return 'Poli Saraf / Neurologi';
  if (s.includes('jantung') || s.includes('sp.jp')) return 'Poli Jantung & Kardiovaskular';
  if (s.includes('paru') || s.includes('sp.p')) return 'Poli Paru & Saluran Napas';
  if (s.includes('jiwa') || s.includes('psikiatri') || s.includes('sp.kj')) return 'Poli Jiwa & Konseling Psikologis';
  if (s.includes('rehabilitasi') || s.includes('sp.kfr')) return 'Poli Fisioterapi & Rehab Medik';
  if (s.includes('gizi')) return 'Poli Gizi & Dietetika';
  if (s.includes('akupunktur')) return 'Poli Akupunktur Medis';
  if (s.includes('anestesi')) return 'Ruang Tindakan Medis & Bedah Minor';
  return 'Poli Umum';
};

// ─── Default form values ──────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '',
  sip: '',
  strNumber: '',
  nik: '',
  specialty: 'Dokter Umum',
  ihsPractitionerId: '',
  phone: '',
  email: '',
  poli: 'Poli Umum',
  selectedDays: [] as string[],
  scheduleStartTime: '08:00',
  scheduleEndTime: '14:00',
  dailyQuota: 20,
  defaultConsultationFee: 75000,
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const docToForm = (doc: Doctor) => {
  // Parse legacy scheduleHours "08:00 - 14:00"
  let start = doc.scheduleStartTime ?? '08:00';
  let end = doc.scheduleEndTime ?? '14:00';
  if (!doc.scheduleStartTime && doc.scheduleHours) {
    const parts = doc.scheduleHours.split('-').map((s) => s.trim());
    if (parts.length === 2) { start = parts[0]; end = parts[1]; }
  }
  return {
    name: doc.name,
    sip: doc.sip,
    strNumber: doc.strNumber ?? '',
    nik: doc.nik ?? '',
    specialty: doc.specialty,
    ihsPractitionerId: doc.ihsPractitionerId ?? '',
    phone: doc.phone,
    email: doc.email ?? '',
    poli: doc.poli ?? 'Poli Umum',
    selectedDays: doc.scheduleDays ?? [],
    scheduleStartTime: start,
    scheduleEndTime: end,
    dailyQuota: doc.dailyQuota ?? 20,
    defaultConsultationFee: doc.defaultConsultationFee,
    status: (doc.status ?? 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
  };
};

// ─── Day Multi-Select Component ────────────────────────────────────────────────
function DayMultiSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (days: string[]) => void;
}) {
  const toggle = (day: string) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      // Keep canonical order
      const ordered = ALL_DAYS.filter((d) => selected.includes(d) || d === day);
      onChange(ordered);
    }
  };

  return (
    <div className="space-y-2">
      {/* Day toggle buttons */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_DAYS.map((day) => {
          const isSelected = selected.includes(day);
          const isWeekend = day === 'Sabtu' || day === 'Minggu';
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              className={`
                px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer select-none
                ${isSelected
                  ? isWeekend
                    ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                    : 'bg-emerald-700 border-emerald-700 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="text-[10px] text-rose-500 font-medium">Pilih minimal 1 hari praktik.</p>
      )}
      {selected.length > 0 && (
        <p className="text-[10px] text-slate-400">
          Terpilih: <span className="font-semibold text-slate-600">{selected.join(', ')}</span>
        </p>
      )}
    </div>
  );
}

// ─── Duration Helper ───────────────────────────────────────────

function calcDuration(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const total = (eh * 60 + em) - (sh * 60 + sm);
  if (total <= 0) return '';
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h} jam${m > 0 ? ` ${m} mnt` : ''}` : `${m} mnt`;
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function SetupDoctorsPage() {
  const { config, doctors, addDoctor, updateDoctor, deleteDoctor, toggleDoctorStatus, hasPermission } = useRME();

  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // Form State
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [isCustomSpecialty, setIsCustomSpecialty] = useState(false);
  const [isCustomPoli, setIsCustomPoli] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const setField = <K extends keyof typeof EMPTY_FORM>(key: K, val: (typeof EMPTY_FORM)[K]) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchQuery =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.sip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.ihsPractitionerId && doc.ihsPractitionerId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.poli && doc.poli.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchSpecialty =
        specialtyFilter === 'ALL' || doc.specialty.toLowerCase().includes(specialtyFilter.toLowerCase());
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && doc.status !== 'INACTIVE') ||
        (statusFilter === 'INACTIVE' && doc.status === 'INACTIVE');
      return matchQuery && matchSpecialty && matchStatus;
    });
  }, [doctors, searchQuery, specialtyFilter, statusFilter]);

  const specialties = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialty).filter(Boolean));
    return Array.from(set);
  }, [doctors]);

  // Existing distinct polis from clinic doctors
  const existingPolis = useMemo(() => {
    return Array.from(new Set(doctors.map((d) => d.poli).filter(Boolean))) as string[];
  }, [doctors]);

  // Handler when specialty changes: auto-sync with recommended poli
  const handleSpecialtyChange = (newSpecialty: string) => {
    setField('specialty', newSpecialty);
    const autoPoli = getAutoPoli(newSpecialty);
    const prevAutoPoli = getAutoPoli(formData.specialty);
    if (!formData.poli || formData.poli === 'Poli Umum' || formData.poli === prevAutoPoli) {
      setField('poli', autoPoli);
      setIsCustomPoli(false);
    }
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setEditingDoctor(null);
    setFormData({
      ...EMPTY_FORM,
      ihsPractitionerId: `N1000000${doctors.length + 1}`,
    });
    setIsCustomSpecialty(false);
    setIsCustomPoli(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormData(docToForm(doc));
    setIsCustomSpecialty(!ALL_SPECIALTIES_FLAT.includes(doc.specialty));
    setIsCustomPoli(!ALL_POLIS_FLAT.includes(doc.poli ?? 'Poli Umum') && !existingPolis.includes(doc.poli ?? ''));
    setIsModalOpen(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.sip.trim()) {
      toast.error('Nama dokter dan Nomor SIP wajib diisi!');
      return;
    }
    if (formData.selectedDays.length === 0) {
      toast.error('Pilih minimal 1 hari praktik!');
      return;
    }
    if (formData.scheduleEndTime <= formData.scheduleStartTime) {
      toast.error('Jam selesai harus lebih akhir dari jam mulai!');
      return;
    }
    if (formData.dailyQuota < 1 || formData.dailyQuota > 500) {
      toast.error('Kuota harian harus antara 1 – 500 pasien!');
      return;
    }

    const payload: Partial<Doctor> = {
      name: formData.name.trim(),
      sip: formData.sip.trim(),
      strNumber: formData.strNumber.trim() || undefined,
      nik: formData.nik.trim() || undefined,
      specialty: formData.specialty.trim(),
      ihsPractitionerId: formData.ihsPractitionerId.trim() || undefined,
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      poli: formData.poli.trim() || undefined,
      scheduleDays: formData.selectedDays,
      scheduleStartTime: formData.scheduleStartTime,
      scheduleEndTime: formData.scheduleEndTime,
      scheduleHours: `${formData.scheduleStartTime} - ${formData.scheduleEndTime}`,
      dailyQuota: Number(formData.dailyQuota),
      defaultConsultationFee: Number(formData.defaultConsultationFee) || 0,
      status: formData.status,
    };

    if (editingDoctor) {
      updateDoctor(editingDoctor.id, payload);
      toast.success(`Data dokter ${formData.name} berhasil diperbarui!`);
    } else {
      addDoctor(payload as Omit<Doctor, 'id'>);
      toast.success(`Dokter baru ${formData.name} berhasil didaftarkan!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data ${name} dari daftar master dokter?`)) {
      deleteDoctor(id);
      toast.success(`Dokter ${name} berhasil dihapus.`);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard!`);
  };

  const activeCount = doctors.filter((d) => d.status !== 'INACTIVE').length;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="space-y-6 w-full pb-12">
        {/* ── Breadcrumb & Header ── */}
        <div className="flex flex-col gap-3">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Profil Faskes &amp; Pengaturan</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-emerald-700/40">
            <div className="flex items-start sm:items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Setup Dokter &amp; Tenaga Medis
                  </h1>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px] font-bold">
                    {doctors.length} Dokter Terdaftar
                  </Badge>
                  <Badge className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-[10px] font-bold">
                    {activeCount} Siap Layanan
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-[10px] font-bold">
                    SATUSEHAT IHS Ready
                  </Badge>
                </div>
                <p className="text-xs text-emerald-100/80 max-w-3xl leading-relaxed">
                  Kelola master data dokter penanggung jawab &amp; mitra praktik, legalitas nomor SIP/STR, pemetaan IHS Practitioner Kemenkes RI, jadwal operasional praktik, kuota harian, serta tarif jasa medis dasar.
                </p>
              </div>
            </div>

            {hasPermission('manage_doctor') && (
            <Button
              onClick={handleOpenAddModal}
              className="h-10 px-4 gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs shrink-0 cursor-pointer border border-emerald-500 self-start sm:self-center"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Dokter Baru</span>
            </Button>
          )}
          </div>
        </div>

        {/* ── KPI Cards (Full Width 4 Columns) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border border-slate-200/90 bg-white shadow-xs rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Total Tenaga Medis
              </span>
              <div className="text-2xl font-black text-slate-900">{doctors.length}</div>
              <span className="text-[11px] text-slate-500">Klinik &amp; mitra faskes</span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <Stethoscope className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 border border-slate-200/90 bg-white shadow-xs rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 block uppercase tracking-wider">
                Dokter Praktik Aktif
              </span>
              <div className="text-2xl font-black text-emerald-700">{activeCount}</div>
              <span className="text-[11px] text-slate-500">
                {doctors.length > 0 ? Math.round((activeCount / doctors.length) * 100) : 0}% siap melayani pasien
              </span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 border border-slate-200/90 bg-white shadow-xs rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-teal-700 block uppercase tracking-wider">
                Kapasitas Kuota Pasien
              </span>
              <div className="text-2xl font-black text-teal-700">
                {doctors.reduce((sum, d) => sum + (d.status !== 'INACTIVE' ? (d.dailyQuota ?? 0) : 0), 0)}
              </div>
              <span className="text-[11px] text-slate-500">Maks. pasien per hari kerja</span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
              <Users className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 border border-slate-200/90 bg-white shadow-xs rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-700 block uppercase tracking-wider">
                IHS Terpetakan Kemenkes
              </span>
              <div className="text-2xl font-black text-blue-700">
                {doctors.filter((d) => d.ihsPractitionerId).length}
                <span className="text-xs text-slate-400 font-normal ml-1">/ {doctors.length}</span>
              </div>
              <span className="text-[11px] text-slate-500">Valid untuk integrasi FHIR</span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
              <Globe className="h-5 w-5" />
            </div>
          </Card>
        </div>

        {/* ── Search & Filter Controls (Full Width) ── */}
        <Card className="p-4 border border-slate-200/90 bg-white shadow-xs rounded-2xl space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama dokter, nomor SIP, STR, IHS ID, spesialisasi, atau poli..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 h-10 rounded-xl text-xs border-slate-200 focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Status ({doctors.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ACTIVE' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aktif ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'INACTIVE' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nonaktif ({doctors.length - activeCount})
              </button>
            </div>
          </div>

          {/* Specialty Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Spesialisasi:</span>
            <button
              type="button"
              onClick={() => setSpecialtyFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                specialtyFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Spesialisasi
            </button>
            {specialties.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setSpecialtyFilter(spec)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  specialtyFilter === spec
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </Card>

        {/* ── Doctor Cards Grid (Full-Width Responsive 1 to 4 Columns) ── */}
        {filteredDoctors.length === 0 ? (
          <div className="p-16 text-center border border-dashed border-slate-300 rounded-2xl bg-white space-y-3 shadow-xs">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-700 text-sm">Tidak ada dokter yang cocok dengan kriteria pencarian</p>
              <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau reset filter spesialisasi.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSpecialtyFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs rounded-xl"
            >
              Reset Filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredDoctors.map((doc) => {
              const isInactive = doc.status === 'INACTIVE';
              const isPrimaryDoctor = doc.name === config.doctorName || doc.id === config.activeDoctorId;
              const startTime = doc.scheduleStartTime ?? (doc.scheduleHours?.split('-')[0]?.trim() ?? '—');
              const endTime = doc.scheduleEndTime ?? (doc.scheduleHours?.split('-')[1]?.trim() ?? '—');
              const durationText = startTime !== '—' && endTime !== '—' ? calcDuration(startTime, endTime) : '';

              return (
                <Card
                  key={doc.id}
                  className={`border transition-all p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden ${
                    isInactive
                      ? 'bg-slate-50/80 border-slate-200 opacity-70'
                      : 'bg-white border-slate-200/90 hover:border-emerald-400 hover:shadow-md'
                  }`}
                >
                  {isPrimaryDoctor && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-[9px] font-bold px-3 py-0.5 rounded-bl-xl shadow-xs flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>Dokter Penanggung Jawab</span>
                    </div>
                  )}

                  <div className="space-y-3.5">
                    {/* Top Row: Specialty & Status */}
                    <div className="flex items-start justify-between gap-2 pt-1">
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                        {doc.specialty}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => toggleDoctorStatus(doc.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                          !isInactive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Klik untuk ubah status aktif/nonaktif"
                      >
                        {!isInactive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-slate-500" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Doctor Identity Header */}
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                        {doc.name.replace(/^dr\.\s*/i, '').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 leading-snug truncate" title={doc.name}>
                          {doc.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium truncate">
                          {doc.poli ?? 'Poli Rawat Jalan'}
                        </p>
                      </div>
                    </div>

                    {/* Legal Identifiers Box */}
                    <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1.5 text-[11px] font-mono">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-sans text-[10px]">SIP:</span>
                        <div className="flex items-center gap-1 font-bold text-slate-800 truncate">
                          <span className="truncate">{doc.sip}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(doc.sip, 'No. SIP')}
                            className="text-slate-400 hover:text-emerald-700 cursor-pointer shrink-0"
                            title="Salin No. SIP"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {doc.strNumber && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 font-sans text-[10px]">STR:</span>
                          <span className="text-slate-700 truncate">{doc.strNumber}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-slate-200/60">
                        <span className="text-slate-400 font-sans text-[10px]">IHS Practitioner:</span>
                        {doc.ihsPractitionerId ? (
                          <div className="flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                            <span>{doc.ihsPractitionerId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(doc.ihsPractitionerId!, 'IHS ID')}
                              className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
                            >
                              <Copy className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-sans font-semibold">
                            Belum Terhubung
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Schedule & Operational Quota Box */}
                    <div className="space-y-2 text-xs">
                      {/* Days */}
                      {doc.scheduleDays && doc.scheduleDays.length > 0 && (
                        <div className="flex items-start gap-1.5 text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {doc.scheduleDays.map((d) => (
                              <span
                                key={d}
                                className="px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold text-[10px]"
                              >
                                {d.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hours */}
                      <div className="flex items-center justify-between text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono font-bold text-slate-800">{startTime}</span>
                          <span className="text-slate-300">—</span>
                          <span className="font-mono font-bold text-slate-800">{endTime}</span>
                          <span className="text-slate-400 text-[10px]">WIB</span>
                        </div>
                        {durationText && (
                          <span className="text-[10px] text-slate-400 font-medium">({durationText})</span>
                        )}
                      </div>

                      {/* Quota */}
                      <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>Kuota harian:</span>
                        </div>
                        <div>
                          <span className="font-black text-slate-900">{doc.dailyQuota ?? '—'}</span>
                          <span className="text-slate-400 text-[10px] ml-1">pasien</span>
                        </div>
                      </div>

                      {/* Fee */}
                      <div className="flex items-center justify-between text-slate-700 font-semibold pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          <span className="text-[11px] text-slate-500">Tarif Konsultasi:</span>
                        </div>
                        <span className="text-emerald-800 font-bold font-mono text-xs">
                          {formatRupiah(doc.defaultConsultationFee)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                    {hasPermission('manage_doctor') && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(doc)}
                          className="h-8 px-3 text-xs font-bold gap-1 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id, doc.name)}
                          className="h-8 px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                          title="Hapus dokter"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Guidance & Legal Compliance Row (3 Balanced Columns) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <Card className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <span>Legalitas SIP &amp; STR Dokter</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sesuai Permenkes No. 24/2022 &amp; UU Kesehatan No. 17/2023, setiap catatan rekam medis, resume medis, dan resep digital wajib menyertakan nomor SIP dokter penanggung jawab pelayanan (DPJP).
            </p>
          </Card>

          <Card className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
              <Globe className="h-4 w-4 text-teal-700" />
              <span>Interoperabilitas SATUSEHAT (FHIR R4)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nomor IHS Practitioner (format <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">N1000000X</code>) otomatis terhubung ke resource Encounter &amp; Condition Kemenkes RI saat dokter menyelesaikan pemeriksaan pasien.
            </p>
          </Card>

          <Card className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
              <Users className="h-4 w-4 text-blue-700" />
              <span>Manajemen Kuota &amp; Antrean BPJS</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Batas kuota harian dokter menentukan kapasitas penerimaan antrean pasien umum serta bridging kuota antrean pendaftaran Mobile JKN BPJS Kesehatan faskes.
            </p>
          </Card>
        </div>

        {/* ── Add / Edit Modal ── */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {editingDoctor ? 'Edit Data Dokter' : 'Tambah Dokter Baru'}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Lengkapi identitas, legalitas SIP, jadwal &amp; kuota praktik
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-7 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ✕
                </Button>
              </div>

              {/* Modal Body */}
              <form id="doctor-form" onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
                {/* ─ Name ─ */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Lengkap &amp; Gelar Medis *</label>
                  <Input
                    required
                    placeholder="e.g. dr. Budi Santoso, Sp.PD"
                    value={formData.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className="h-9 rounded-xl"
                  />
                </div>

                {/* ─ SIP & STR ─ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nomor SIP *</label>
                    <Input
                      required
                      placeholder="e.g. SIP.503/442.1/045/2024"
                      value={formData.sip}
                      onChange={(e) => setField('sip', e.target.value)}
                      className="h-9 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nomor STR</label>
                    <Input
                      placeholder="e.g. STR.31.1.1.100.2.20.123456"
                      value={formData.strNumber}
                      onChange={(e) => setField('strNumber', e.target.value)}
                      className="h-9 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                {/* ─ Specialty & Poli ─ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Spesialisasi / Keahlian *</label>
                    <select
                      value={isCustomSpecialty ? '__CUSTOM__' : formData.specialty}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__CUSTOM__') {
                          setIsCustomSpecialty(true);
                        } else {
                          setIsCustomSpecialty(false);
                          handleSpecialtyChange(val);
                        }
                      }}
                      className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
                    >
                      <option value="">-- Pilih Spesialisasi Dokter --</option>
                      {SPECIALTY_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <optgroup label="Lainnya">
                        <option value="__CUSTOM__">Lainnya (Ketik Manual)...</option>
                      </optgroup>
                    </select>
                    {isCustomSpecialty && (
                      <Input
                        autoFocus
                        placeholder="Ketik spesialisasi dokter..."
                        value={formData.specialty}
                        onChange={(e) => setField('specialty', e.target.value)}
                        className="h-9 rounded-xl text-xs mt-1.5"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Ruang Poli Pelayanan *</label>
                    <select
                      value={isCustomPoli ? '__CUSTOM__' : formData.poli}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__CUSTOM__') {
                          setIsCustomPoli(true);
                        } else {
                          setIsCustomPoli(false);
                          setField('poli', val);
                        }
                      }}
                      className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
                    >
                      <option value="">-- Pilih Ruang Poli Pelayanan --</option>
                      {existingPolis.length > 0 && (
                        <optgroup label="Poli Terdaftar di Faskes">
                          {existingPolis.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {POLI_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <optgroup label="Lainnya">
                        <option value="__CUSTOM__">Lainnya (Ketik Manual)...</option>
                      </optgroup>
                    </select>
                    {isCustomPoli && (
                      <Input
                        autoFocus
                        placeholder="Ketik nama ruang poli..."
                        value={formData.poli}
                        onChange={(e) => setField('poli', e.target.value)}
                        className="h-9 rounded-xl text-xs mt-1.5"
                      />
                    )}
                  </div>
                </div>

                {/* ─ IHS & NIK ─ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">IHS Practitioner ID (SATUSEHAT)</label>
                    <Input
                      placeholder="e.g. N10000001"
                      value={formData.ihsPractitionerId}
                      onChange={(e) => setField('ihsPractitionerId', e.target.value)}
                      className="h-9 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">NIK KTP Dokter</label>
                    <Input
                      placeholder="e.g. 3174012345670001"
                      maxLength={16}
                      value={formData.nik}
                      onChange={(e) => setField('nik', e.target.value)}
                      className="h-9 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                {/* ─ Phone & Email ─ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">No. Telepon / WhatsApp</label>
                    <Input
                      placeholder="e.g. 0812-3456-7890"
                      value={formData.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                      className="h-9 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Alamat Email</label>
                    <Input
                      type="email"
                      placeholder="e.g. dr.budi@klinik.id"
                      value={formData.email}
                      onChange={(e) => setField('email', e.target.value)}
                      className="h-9 rounded-xl"
                    />
                  </div>
                </div>

                {/* ─ Schedule Days Multi-Select ─ */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                    <label className="font-bold text-slate-800">Hari Praktik *</label>
                    <span className="text-[10px] text-slate-400 font-medium">(pilih satu atau lebih)</span>
                  </div>
                  <DayMultiSelect
                    selected={formData.selectedDays}
                    onChange={(days) => setField('selectedDays', days)}
                  />
                </div>

                {/* ─ Schedule Hours ─ */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-600" />
                    <label className="font-bold text-slate-800 text-xs">Jam Layanan *</label>
                  </div>

                  {/* Two clean time inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Jam Mulai</label>
                      <input
                        type="time"
                        value={formData.scheduleStartTime}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!v) return;
                          setField('scheduleStartTime', v);
                          if (v >= formData.scheduleEndTime) {
                            const [h] = v.split(':').map(Number);
                            setField('scheduleEndTime', `${String(Math.min(23, h + 1)).padStart(2, '0')}:${v.split(':')[1]}`);
                          }
                        }}
                        className="w-full h-10 rounded-xl border-2 border-slate-200 bg-white px-3 font-mono font-bold text-slate-800 text-sm focus:outline-none focus:border-emerald-400 focus:ring-0 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Jam Selesai</label>
                      <input
                        type="time"
                        value={formData.scheduleEndTime}
                        min={formData.scheduleStartTime}
                        onChange={(e) => { if (e.target.value) setField('scheduleEndTime', e.target.value); }}
                        className="w-full h-10 rounded-xl border-2 border-slate-200 bg-white px-3 font-mono font-bold text-slate-800 text-sm focus:outline-none focus:border-emerald-400 focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Duration summary pill */}
                  {(() => {
                    const dur = calcDuration(formData.scheduleStartTime, formData.scheduleEndTime);
                    return dur ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          <Clock className="h-3 w-3" />
                          {formData.scheduleStartTime} – {formData.scheduleEndTime} WIB
                          <span className="w-px h-3 bg-emerald-300" />
                          {dur}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-rose-500 font-semibold">⚠️ Jam selesai harus lebih akhir dari jam mulai</p>
                    );
                  })()}
                </div>

                {/* ─ Daily Quota & Fee & Status ─ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  {/* Kuota Harian — with stepper */}
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1 h-9 leading-none">
                      <Users className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>Kuota Harian</span>
                      <span className="text-slate-400 font-medium text-[10px]">(pasien/sesi)</span>
                    </label>
                    <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white h-9">
                      <button
                        type="button"
                        onClick={() => setField('dailyQuota', Math.max(1, formData.dailyQuota - 5))}
                        className="w-9 h-9 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-bold text-base flex items-center justify-center cursor-pointer select-none transition-colors shrink-0 border-r border-slate-200"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={formData.dailyQuota}
                        onChange={(e) => setField('dailyQuota', Math.min(500, Math.max(1, Number(e.target.value))))}
                        className="flex-1 h-full text-center font-black text-sm text-slate-900 border-none outline-none bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setField('dailyQuota', Math.min(500, formData.dailyQuota + 5))}
                        className="w-9 h-9 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-bold text-base flex items-center justify-center cursor-pointer select-none transition-colors shrink-0 border-l border-slate-200"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 h-4">Maks kapasitas per sesi praktik</p>
                  </div>

                  {/* Tarif Konsultasi */}
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1 h-9 leading-none">
                      <DollarSign className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>Tarif Dasar Konsultasi</span>
                      <span className="text-slate-400 font-medium text-[10px]">(Rp)</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 75000"
                      value={formData.defaultConsultationFee}
                      onChange={(e) => setField('defaultConsultationFee', Number(e.target.value))}
                      className="h-9 rounded-xl"
                    />
                    <p className="text-[10px] text-slate-400 h-4">
                      {formatRupiah(formData.defaultConsultationFee)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1 h-9 leading-none">
                      <span>Status Praktik</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setField('status', e.target.value as 'ACTIVE' | 'INACTIVE')}
                      className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold"
                    >
                      <option value="ACTIVE">✅ Aktif — Melayani Pasien</option>
                      <option value="INACTIVE">⛔ Nonaktif — Tutup Praktik</option>
                    </select>
                    <p className="text-[10px] text-slate-400 h-4">Status ketersediaan dokter</p>
                  </div>
                </div>
              </form>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  form="doctor-form"
                  className="h-9 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {editingDoctor ? 'Simpan Perubahan' : 'Tambah Dokter'}
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </MainLayout>
  );
}
