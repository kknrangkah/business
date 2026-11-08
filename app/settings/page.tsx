'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { formatRupiah, cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import {
  Building2,
  Stethoscope,
  Save,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  ShieldCheck,
  Globe,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  BookOpen,
  Activity,
  Database,
  Tag,
  FileText,
  Receipt,
  Sparkles,
  Layers,
  Shield,
  Clock,
  RotateCcw,
  Check,
  Users,
  ExternalLink,
  Pill,
  Microscope,
  ScanLine,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsProfilePage() {
  const {
    config,
    updateConfig,
    satuSehatConfig,
    bpjsConfig,
    doctors,
    nurses,
    procedures,
    diagnoses,
    icd9List,
    snomedList,
  } = useRME();

  const [profileForm, setProfileForm] = useState({
    practiceName: config.practiceName,
    subtitle: config.subtitle,
    doctorName: config.doctorName,
    sip: config.sip,
    address: config.address,
    phone: config.phone,
    email: config.email,
    defaultConsultationFee: config.defaultConsultationFee,
  });

  const [previewTab, setPreviewTab] = useState<'RESEP' | 'KWITANSI'>('RESEP');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      ...profileForm,
      defaultConsultationFee: Number(profileForm.defaultConsultationFee),
    });
    setIsSaved(true);
    toast.success('Pengaturan profil fasilitas pelayanan & SIP dokter berhasil diperbarui!');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetForm = () => {
    setProfileForm({
      practiceName: config.practiceName,
      subtitle: config.subtitle,
      doctorName: config.doctorName,
      sip: config.sip,
      address: config.address,
      phone: config.phone,
      email: config.email,
      defaultConsultationFee: config.defaultConsultationFee,
    });
    toast.info('Formulir dikembalikan ke data tersimpan.');
  };

  // Profile completeness calculation
  const completenessItems = useMemo(() => [
    { label: 'Nama Faskes', complete: Boolean(profileForm.practiceName?.trim()) },
    { label: 'Spesialisasi / Sub-judul', complete: Boolean(profileForm.subtitle?.trim()) },
    { label: 'Dokter Penanggung Jawab', complete: Boolean(profileForm.doctorName?.trim()) },
    { label: 'Nomor SIP Resmi', complete: Boolean(profileForm.sip?.trim()) },
    { label: 'Kontak & WhatsApp', complete: Boolean(profileForm.phone?.trim()) },
    { label: 'Alamat Fasilitas Pelayanan', complete: Boolean(profileForm.address?.trim()) },
    { label: 'Tarif Konsultasi Standar', complete: Number(profileForm.defaultConsultationFee) > 0 },
    { label: 'Bridging SATUSEHAT', complete: satuSehatConfig.isConnected },
    { label: 'Bridging BPJS PCare', complete: bpjsConfig.isConnected },
  ], [profileForm, satuSehatConfig.isConnected, bpjsConfig.isConnected]);

  const completedCount = completenessItems.filter((i) => i.complete).length;
  const completionPercentage = Math.round((completedCount / completenessItems.length) * 100);

  return (
    <MainLayout>
      <div className="space-y-6 w-full pb-10">
        {/* ── 1. Page Header Banner ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-emerald-700/40">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Profil Fasilitas Pelayanan &amp; SIP Dokter
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px] font-bold">
                  Permenkes No. 24/2022
                </Badge>
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-[10px] font-bold">
                  {config.appMode === 'DOCTOR_ONLY' ? 'Klinik Dokter Mandiri' : 'Klinik Kolaborasi Tim'}
                </Badge>
              </div>
              <p className="text-xs text-emerald-100/80 max-w-3xl leading-relaxed">
                Pusat data legalitas fasilitas kesehatan, dokter penanggung jawab, legalitas izin praktik (SIP), kontak resmi, standarisasi tarif, dan sinkronisasi ekosistem satu data kesehatan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
                Kelengkapan Profil
              </div>
              <div className="text-sm font-black text-white">{completionPercentage}% Lengkap</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs text-emerald-300">
              {completedCount}/{completenessItems.length}
            </div>
          </div>
        </div>

        {/* ── 2. Quick Integrations Row (SATUSEHAT & BPJS) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SATUSEHAT Card */}
          <Card className="border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 p-4 sm:p-5 rounded-2xl shadow-xs space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      SATUSEHAT Kemenkes RI
                    </span>
                    <Badge variant="outline" className="text-[9px] font-mono border-emerald-300 text-emerald-800">
                      FHIR R4
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Org ID: <span className="font-bold text-slate-800">{satuSehatConfig.organizationId || 'Belum diisi'}</span>
                  </div>
                </div>
              </div>

              <Badge
                className={
                  satuSehatConfig.isConnected
                    ? 'bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-0.5'
                    : 'bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5'
                }
              >
                {satuSehatConfig.isConnected ? 'TERHUBUNG' : 'NONAKTIF'}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed relative z-10">
              Integrasi rekam medis elektronik HL7 FHIR R4, telemetri encounter kunjungan, diagnosa ICD-10, dan verifikasi IHS Kemenkes RI.
            </p>

            <div className="pt-1 flex items-center justify-between border-t border-emerald-100/80 text-[11px] text-slate-500">
              <span>Environment: <strong className="text-slate-800">{satuSehatConfig.environment}</strong></span>
              <Link href="/settings/satusehat">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold gap-1.5 border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl h-7 shadow-2xs cursor-pointer"
                >
                  <span>Kelola SATUSEHAT</span>
                  <ArrowRight className="h-3 w-3 text-emerald-700" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* BPJS Kesehatan Card */}
          <Card className="border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 p-4 sm:p-5 rounded-2xl shadow-xs space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      BPJS Kesehatan (PCare &amp; Mobile JKN)
                    </span>
                    <Badge variant="outline" className="text-[9px] font-mono border-emerald-300 text-emerald-800">
                      Trust Mark
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Kode PPK: <span className="font-bold text-slate-800">{bpjsConfig.kodePPK || 'Belum diisi'}</span>
                  </div>
                </div>
              </div>

              <Badge
                className={
                  bpjsConfig.isConnected
                    ? 'bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-0.5'
                    : 'bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5'
                }
              >
                {bpjsConfig.isConnected ? 'TERHUBUNG' : 'NONAKTIF'}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed relative z-10">
              Bridging Consumer ID, Secret Key, User Key, PCare FKTP, cek eligibilitas kepesertaan, serta integrasi Antrean Mobile JKN.
            </p>

            <div className="pt-1 flex items-center justify-between border-t border-emerald-100/80 text-[11px] text-slate-500">
              <span>Environment: <strong className="text-slate-800">{bpjsConfig.environment}</strong></span>
              <Link href="/settings/bpjs">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold gap-1.5 border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl h-7 shadow-2xs cursor-pointer"
                >
                  <span>Kelola BPJS PCare</span>
                  <ArrowRight className="h-3 w-3 text-emerald-700" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* ── 3. Master Setup Quick Links (6 Balanced Columns Across Full Width) ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-700" />
              <span>Master Data &amp; Kodifikasi Standarisasi Medis:</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              8 Modul Master Data &amp; Dokumen Resmi
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* Setup Invoice & Kop Surat */}
            <Link
              href="/settings/invoice"
              className="p-3.5 rounded-2xl bg-white border border-emerald-300/80 hover:border-emerald-500 hover:shadow-sm transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between text-emerald-700">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Receipt className="h-4 w-4" />
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Kwitansi
                </Badge>
              </div>
              <div className="mt-2.5">
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Setup Invoice
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">Logo &amp; Kop Surat</div>
              </div>
            </Link>

            {/* Dokter */}
            <Link
              href="/settings/doctors"
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-emerald-700">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {doctors.length}
                </Badge>
              </div>
              <div className="mt-2.5">
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Setup Dokter
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">SIP, STR &amp; Jadwal</div>
              </div>
            </Link>

            {/* Perawat */}
            <Link
              href="/settings/nurses"
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-blue-700">
                <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <UserCheck className="h-4 w-4" />
                </div>
                <Badge className="bg-blue-100 text-blue-800 text-[10px] font-bold">
                  {nurses.length}
                </Badge>
              </div>
              <div className="mt-2.5">
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Setup Perawat
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">Bidan, SIKP, Triase</div>
              </div>
            </Link>

            {/* Tindakan */}
            <Link
              href="/settings/procedures"
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-amber-700">
                <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <Tag className="h-4 w-4" />
                </div>
                <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {procedures?.length || 0}
                </Badge>
              </div>
              <div className="mt-2.5">
                <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Setup Tindakan
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">Tarif &amp; Jasa Medis</div>
              </div>
            </Link>

            {/* ICD-10 */}
            <Link
              href="/settings/icd10"
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-400 hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-teal-700">
                <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <BookOpen className="h-4 w-4" />
                </div>
                <Badge className="bg-teal-100 text-teal-800 text-[10px] font-bold">
                  {diagnoses.length}
                </Badge>
              </div>
              <div className="mt-2.5">
                <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  Master ICD-10
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">Diagnosis Medis &amp; icd10data</div>
              </div>
            </Link>

            {/* ICD-9-CM */}
            <Link
              href="/settings/icd9"
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-indigo-700">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <Activity className="h-4 w-4" />
                </div>
                <Badge className="bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  {icd9List.length}
                </Badge>
              </div>
              <div className="mt-2.5">
                <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  Master ICD-9
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">Tindakan Medis &amp; icd9data</div>
              </div>
            </Link>

            {/* SNOMED CT */}
            <Link
              href="/settings/snomed"
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-purple-700">
                <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <Database className="h-4 w-4" />
                </div>
                <Badge className="bg-purple-100 text-purple-800 text-[10px] font-bold">
                  {snomedList.length}
                </Badge>
              </div>
              <div className="mt-2.5">
                <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Setup SNOMED
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">Terminologi FHIR R4</div>
              </div>
            </Link>

            {/* Master Wilayah RI (4 Tingkat) */}
            <Link
              href="/settings/wilayah"
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-emerald-700">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <MapPin className="h-4 w-4" />
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5">
                  38 Prov &bull; 514 Kota &bull; 7k Kec &bull; 83k Kel
                </Badge>
              </div>
              <div className="mt-2.5">
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Master Wilayah RI
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">Provinsi, Kab/Kota, Kec &amp; Kelurahan</div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── 4. Main Two-Column Working Grid (Form Left + Live Letterhead Preview Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Complete Profile Configuration Form (7 or 8 columns) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* ── Card Konfigurasi Fasilitas & Unit Pelayanan Faskes ── */}
            <Card className="border border-slate-200/90 bg-white shadow-xs rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Fasilitas &amp; Unit Pelayanan Faskes</span>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-emerald-300">
                        Apotek &bull; Lab &bull; Radiologi
                      </Badge>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Aktifkan atau nonaktifkan modul unit sesuai sarana prasarana yang dimiliki faskes Anda
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 divide-y divide-slate-100 space-y-4">
                {/* 1. Unit Farmasi / Apotek */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 first:pt-0">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      config.hasPharmacy !== false
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    )}>
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          Unit Farmasi &amp; Apotek Internal
                        </span>
                        <Badge className={cn(
                          "text-[10px] font-bold",
                          config.hasPharmacy !== false
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        )}>
                          {config.hasPharmacy !== false ? 'Apotek Internal Aktif' : 'Resep Luar (Tanpa Apotek)'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-xl">
                        {config.hasPharmacy !== false
                          ? 'Faskes memiliki stok obat & depo farmasi internal. Resep dokter langsung diproses di kasir & depo obat faskes, serta menu formularium farmasi diaktifkan.'
                          : 'Faskes TIDAK memiliki apotek/stok obat internal. Resep dokter dialihkan menjadi Resep Luar (Apotek Eksternal) siap cetak blanko R/ berkop resmi & SIP dokter; biaya obat tidak ditagihkan di kasir faskes.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <span className="text-[11px] font-bold text-slate-600">
                      {config.hasPharmacy !== false ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <Switch
                      checked={config.hasPharmacy !== false}
                      onCheckedChange={(checked) => {
                        updateConfig({ hasPharmacy: checked });
                        toast.success(
                          checked
                            ? 'Unit Farmasi internal diaktifkan: Depo obat & formularium aktif.'
                            : 'Unit Farmasi dinonaktifkan: Resep dialihkan ke Resep Luar (Apotek Eksternal).'
                        );
                      }}
                    />
                  </div>
                </div>

                {/* 2. Unit Laboratorium Klinis */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      config.hasLaboratory
                        ? "bg-teal-100 text-teal-700 border border-teal-200"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    )}>
                      <Microscope className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          Unit Laboratorium Klinis
                        </span>
                        <Badge className={cn(
                          "text-[10px] font-bold",
                          config.hasLaboratory
                            ? "bg-teal-100 text-teal-800 border-teal-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                          {config.hasLaboratory ? 'Laboratorium Aktif' : 'Tidak Memiliki Lab'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-xl">
                        {config.hasLaboratory
                          ? 'Faskes memiliki fasilitas laboratorium klinik. Formulir permintaan dan input hasil tes lab (Hematologi, Darah Rutin, GDS, Kolesterol, Urinalisis) diaktifkan pada pemeriksaan dokter & menu sidebar.'
                          : 'Faskes tidak memiliki sarana laboratorium. Modul laboratorium dinonaktifkan dari menu navigasi dan pemeriksaan rekam medis.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <span className="text-[11px] font-bold text-slate-600">
                      {config.hasLaboratory ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <Switch
                      checked={Boolean(config.hasLaboratory)}
                      onCheckedChange={(checked) => {
                        updateConfig({ hasLaboratory: checked });
                        toast.success(
                          checked
                            ? 'Unit Laboratorium Klinis diaktifkan: Form order & hasil lab aktif di rekam medis.'
                            : 'Unit Laboratorium Klinis dinonaktifkan.'
                        );
                      }}
                    />
                  </div>
                </div>

                {/* 3. Unit Radiologi & USG */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      config.hasRadiology
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    )}>
                      <ScanLine className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          Unit Radiologi &amp; Diagnostik Imejing (USG / X-Ray)
                        </span>
                        <Badge className={cn(
                          "text-[10px] font-bold",
                          config.hasRadiology
                            ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                          {config.hasRadiology ? 'Radiologi Aktif' : 'Tidak Memiliki Radiologi'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-xl">
                        {config.hasRadiology
                          ? 'Faskes memiliki sarana Rontgen X-Ray, USG, atau EKG. Form permintaan & input hasil expertise/bacaan dokter diaktifkan pada pemeriksaan klinis & menu sidebar.'
                          : 'Faskes tidak memiliki fasilitas radiologi atau USG. Modul radiologi dinonaktifkan.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <span className="text-[11px] font-bold text-slate-600">
                      {config.hasRadiology ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <Switch
                      checked={Boolean(config.hasRadiology)}
                      onCheckedChange={(checked) => {
                        updateConfig({ hasRadiology: checked });
                        toast.success(
                          checked
                            ? 'Unit Radiologi & USG diaktifkan: Form order & expertise imejing aktif di rekam medis.'
                            : 'Unit Radiologi & USG dinonaktifkan.'
                        );
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200/90 bg-white shadow-xs rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-emerald-50/30 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8.5 w-8.5 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Identitas Fasilitas Pelayanan &amp; Legalitas Praktik
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Data ini dicantumkan pada seluruh dokumen medis resmi faskes
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] font-medium border-slate-200 bg-white text-slate-600">
                  Sinkron Otomatis ke RME
                </Badge>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
                {/* Bagian 1: Identitas Faskes */}
                <div className="space-y-4">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-100/60 pb-1.5">
                    <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                    <span>1. Profil &amp; Klasifikasi Fasilitas Pelayanan</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Nama Faskes */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-bold text-slate-700 flex items-center justify-between">
                        <span>Nama Fasilitas Pelayanan / Klinik <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-400 font-normal">Judul Utama Kop Surat</span>
                      </label>
                      <Input
                        required
                        placeholder="e.g. Klinik Pratama Sehat Mandiri"
                        value={profileForm.practiceName}
                        onChange={(e) => setProfileForm({ ...profileForm, practiceName: e.target.value })}
                        className="bg-white h-10 rounded-xl font-bold text-slate-800 border-slate-200 focus:border-emerald-500"
                      />
                    </div>

                    {/* Subtitle / Spesialisasi */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-bold text-slate-700 flex items-center justify-between">
                        <span>Sub-judul / Spesialisasi Faskes</span>
                        <span className="text-[10px] text-slate-400 font-normal">Baris Kedua Kop Surat</span>
                      </label>
                      <Input
                        placeholder="e.g. Klinik Dokter Umum, Gigi &amp; Anak"
                        value={profileForm.subtitle}
                        onChange={(e) => setProfileForm({ ...profileForm, subtitle: e.target.value })}
                        className="bg-white h-9 rounded-xl border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Dokter Penanggung Jawab & SIP */}
                <div className="space-y-4 pt-2">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-100/60 pb-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-emerald-700" />
                    <span>2. Dokter Penanggung Jawab Medis &amp; Legalitas SIP</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Nama Dokter Utama */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <Stethoscope className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Nama Dokter Penanggung Jawab</span> <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        required
                        placeholder="e.g. dr. Siti Sarah, Sp.A"
                        value={profileForm.doctorName}
                        onChange={(e) => setProfileForm({ ...profileForm, doctorName: e.target.value })}
                        className="bg-white h-9 rounded-xl font-bold text-slate-800"
                      />
                    </div>

                    {/* SIP Dokter */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Nomor SIP (Surat Izin Praktik)</span> <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        required
                        placeholder="e.g. SIP: 446.1/1234/DINKES/2024"
                        value={profileForm.sip}
                        onChange={(e) => setProfileForm({ ...profileForm, sip: e.target.value })}
                        className="bg-white h-9 rounded-xl font-mono text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 3: Kontak & Lokasi Faskes */}
                <div className="space-y-4 pt-2">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-100/60 pb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                    <span>3. Saluran Kontak Resmi &amp; Alamat Praktik</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Nomor Telepon / WA */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>No. Telepon / WhatsApp Klinik</span>
                      </label>
                      <Input
                        placeholder="e.g. 0812-3456-7890"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="bg-white h-9 rounded-xl"
                      />
                    </div>

                    {/* Email Resmi */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>Email Resmi Faskes</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="e.g. info@klinikpratama.id"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="bg-white h-9 rounded-xl"
                      />
                    </div>

                    {/* Alamat Praktik */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-bold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>Alamat Lengkap Praktik / Faskes</span> <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Dicantumkan pada Kop Surat &amp; Resep</span>
                      </label>
                      <Textarea
                        rows={2}
                        required
                        placeholder="e.g. Jl. Kesehatan No. 123, Kel. Melati, Kec. Sukajadi, Kota Bandung, Jawa Barat"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="bg-white text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 4: Tarif Konsultasi Standar */}
                <div className="space-y-4 pt-2">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-100/60 pb-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-700" />
                    <span>4. Tarif Konsultasi &amp; Finansial Dasar</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 max-w-md">
                        <label className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-700" />
                          <span>Tarif Konsultasi &amp; Jasa Medis Dasar (Rp)</span> <span className="text-rose-500">*</span>
                        </label>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Nominal ini otomatis menjadi item tagihan konsultasi awal pada kasir/billing saat pemeriksaan dokter dibuat.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          required
                          min={0}
                          step={5000}
                          placeholder="50000"
                          value={profileForm.defaultConsultationFee}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              defaultConsultationFee: Number(e.target.value),
                            })
                          }
                          className="bg-white h-9 rounded-xl font-mono text-sm font-bold w-36 text-right border-slate-300"
                        />
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                          {formatRupiah(Number(profileForm.defaultConsultationFee) || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit / Reset Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 order-2 sm:order-1">
                    {isSaved ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold animate-pulse">
                        <CheckCircle2 className="h-4 w-4" />
                        Profil berhasil disimpan ke sistem!
                      </span>
                    ) : (
                      <span>Perubahan tersimpan otomatis di browser secara lokal.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetForm}
                      className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200 rounded-xl h-9 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </Button>

                    <Button
                      type="submit"
                      size="sm"
                      className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 text-xs shadow-xs rounded-xl cursor-pointer flex-1 sm:flex-initial"
                    >
                      <Save className="h-4 w-4" />
                      <span>Simpan Perubahan Profil</span>
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>

          {/* RIGHT: Live Interactive Preview & Status Panel (4 or 5 columns) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            {/* Live Interactive Letterhead Preview Card */}
            <Card className="border border-slate-200/90 bg-white shadow-xs rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-900">
                    Pratinjau Kop Surat Resmi
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('RESEP')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      previewTab === 'RESEP'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Resep / RME
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('KWITANSI')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      previewTab === 'KWITANSI'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kwitansi
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-100/70">
                {/* Paper Mockup Container */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 font-sans text-slate-800 space-y-3">
                  {/* Dynamic Letterhead */}
                  {config.invoiceHeaderMode === 'CUSTOM_LETTERHEAD' && config.letterheadUrl ? (
                    <div className="pb-2 border-b-2 border-slate-800">
                      <img
                        src={config.letterheadUrl}
                        alt="Kop Surat"
                        className="w-full max-h-16 object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="pb-3 border-b-2 border-slate-800 flex items-center gap-2.5 text-left">
                      {config.logoUrl ? (
                        <img
                          src={config.logoUrl}
                          alt="Logo"
                          className="h-10 w-10 object-contain rounded-lg p-0.5 border border-slate-200 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                      )}
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="text-xs font-black uppercase tracking-wide text-slate-900 leading-tight truncate">
                          {profileForm.practiceName || 'NAMA FASILITAS PELAYANAN'}
                        </div>
                        {profileForm.subtitle && (
                          <div className="text-[10px] font-semibold text-emerald-800 leading-none truncate">
                            {profileForm.subtitle}
                          </div>
                        )}
                        <div className="text-[8.5px] text-slate-500 leading-tight truncate">
                          {profileForm.address || 'Alamat lengkap klinik belum diisi'}
                        </div>
                        <div className="text-[8.5px] text-slate-500 flex items-center gap-2 font-mono">
                          {profileForm.phone && <span>Telp: {profileForm.phone}</span>}
                          {profileForm.email && <span>Email: {profileForm.email}</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Body Content based on Tab */}
                  {previewTab === 'RESEP' ? (
                    <div className="space-y-2.5 pt-1 text-[10px]">
                      <div className="flex justify-between text-slate-500 border-b border-dashed border-slate-200 pb-1">
                        <span>No. RM: <strong>RM-2026-0042</strong></span>
                        <span>Tgl: {new Date().toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-slate-700">R / Prescription:</div>
                        <div className="pl-2 border-l-2 border-emerald-500 text-slate-600 space-y-0.5 font-mono text-[9px]">
                          <div>Amoxicillin 500mg No. X</div>
                          <div className="text-slate-400 italic">S 3 dd tab I pc (habiskan)</div>
                        </div>
                        <div className="pl-2 border-l-2 border-emerald-500 text-slate-600 space-y-0.5 font-mono text-[9px]">
                          <div>Paracetamol 500mg No. X</div>
                          <div className="text-slate-400 italic">S prn tab I febrimaks</div>
                        </div>
                      </div>

                      {/* Doctor Signature Block */}
                      <div className="pt-3 flex justify-end">
                        <div className="text-center space-y-0.5 min-w-[120px]">
                          <div className="text-[8px] text-slate-400">Dokter Penanggung Jawab,</div>
                          <div className="h-6 flex items-center justify-center">
                            <span className="font-serif italic text-emerald-800 text-xs opacity-70">
                              (Paraf Digital)
                            </span>
                          </div>
                          <div className="font-bold text-[10px] text-slate-900 border-t border-slate-300 pt-0.5">
                            {profileForm.doctorName || 'dr. Penanggung Jawab'}
                          </div>
                          <div className="text-[8px] font-mono text-slate-500">
                            {profileForm.sip || 'SIP: Belum Diatur'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 pt-1 text-[10px]">
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div>
                          <div className="text-[9px] text-slate-400">Kwitansi No:</div>
                          <div className="font-mono font-bold text-slate-800">INV/2026/09/0142</div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                          LUNAS
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-600 text-[9px]">
                          <span>Konsultasi &amp; Jasa Medis:</span>
                          <span className="font-bold font-mono">
                            {formatRupiah(Number(profileForm.defaultConsultationFee) || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[9px]">
                          <span>Farmasi &amp; Obat:</span>
                          <span className="font-bold font-mono">Rp 35.000</span>
                        </div>
                        <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-[10px]">
                          <span>Total Tagihan:</span>
                          <span className="text-emerald-700 font-mono">
                            {formatRupiah((Number(profileForm.defaultConsultationFee) || 0) + 35000)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[8px] text-center text-slate-400 pt-2 italic">
                        Kwitansi ini sah dan dicetak otomatis melalui Rekam Medis Elektronik.
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Link to Invoice Setup */}
                <div className="pt-3">
                  <Link href="/settings/invoice">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-bold gap-1.5 border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl h-8 shadow-2xs cursor-pointer"
                    >
                      <Receipt className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Kelola Foto / Logo &amp; Kop Surat Kwitansi</span>
                      <ArrowRight className="h-3 w-3 ml-auto text-emerald-600" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Checklist Kelengkapan & Kepatuhan */}
            <Card className="border border-slate-200/90 bg-white shadow-xs rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-900">
                    Kepatuhan &amp; Kelengkapan Profil
                  </span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {completedCount}/{completenessItems.length} Selesai
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Standard Permenkes No. 24/2022</span>
                  <span className="font-bold text-slate-700">{completionPercentage}%</span>
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-2 pt-1">
                {completenessItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
                  >
                    <span className="text-slate-600 text-[11px]">{item.label}</span>
                    {item.complete ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-bold text-[10px]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Lengkap
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 font-bold text-[10px]">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Belum
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Hub Settings */}
            <Card className="border border-slate-200/90 bg-white shadow-xs rounded-2xl p-5 space-y-3">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                <span>Navigasi Cepat Pengaturan Sistem</span>
              </div>

              <div className="space-y-2">
                <Link
                  href="/settings/mode"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="h-4 w-4 text-emerald-700" />
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-emerald-800">
                        Mode Operasional &amp; RBAC
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {config.appMode === 'DOCTOR_ONLY' ? 'Mode Dokter Mandiri' : 'Mode Kolaborasi Tim'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/settings/account"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="h-4 w-4 text-blue-700" />
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-blue-800">
                        Akun &amp; Sesi Login
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Profil pengguna aktif &amp; sesi login
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-700 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/settings/users"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-purple-700" />
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-purple-800">
                        Manajemen Pengguna &amp; Role
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Hak akses perawat, kasir &amp; farmasi
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-700 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
