'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { formatRupiah, formatIndonesianDate } from '@/lib/utils';
import {
  Receipt,
  Upload,
  Image as ImageIcon,
  Trash2,
  Printer,
  Save,
  CheckCircle2,
  ArrowLeft,
  Stamp,
  FileText,
  Building2,
  Sparkles,
  Info,
  HelpCircle,
  PenTool,
  RotateCcw,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

// Sample presets for quick demo testing
const PRESET_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#047857;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f766e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#grad1)" />
  <circle cx="100" cy="100" r="75" fill="none" stroke="#ffffff" stroke-width="6" stroke-dasharray="8 6" opacity="0.4" />
  <path d="M100 45 L100 155 M45 100 L155 100" stroke="#ffffff" stroke-width="26" stroke-linecap="round" />
  <circle cx="100" cy="100" r="18" fill="#10b981" />
  <circle cx="100" cy="100" r="8" fill="#ffffff" />
</svg>
`)}`;

const PRESET_LETTERHEAD_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 140" width="900" height="140">
  <defs>
    <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#064e3b;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#047857;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f766e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="900" height="140" rx="8" fill="#ffffff" />
  <rect x="0" y="132" width="900" height="5" fill="#047857" />
  <rect x="0" y="138" width="900" height="2" fill="#0f766e" />
  <!-- Logo Icon -->
  <g transform="translate(25, 20)">
    <rect width="90" height="90" rx="20" fill="url(#bgG)" />
    <path d="M45 22 L45 68 M22 45 L68 45" stroke="#ffffff" stroke-width="14" stroke-linecap="round" />
    <circle cx="45" cy="45" r="9" fill="#10b981" />
  </g>
  <!-- Text -->
  <text x="135" y="48" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#0f172a" letter-spacing="1">KLINIK PRATAMA</text>
  <text x="135" y="74" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#047857">PELAYANAN MEDIS &amp; KESEHATAN TERPADU</text>
  <text x="135" y="96" font-family="system-ui, sans-serif" font-size="11" fill="#475569">Alamat Faskes • Telp: -</text>
  <text x="135" y="114" font-family="system-ui, sans-serif" font-size="10" fill="#64748b">Sistem Informasi Rekam Medis Elektronik Terintegrasi</text>
</svg>
`)}`;

const PRESET_STAMP_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120" width="240" height="120">
  <rect x="6" y="6" width="228" height="108" rx="16" fill="none" stroke="#059669" stroke-width="5" stroke-dasharray="6 2" opacity="0.9" />
  <rect x="12" y="12" width="216" height="96" rx="12" fill="#ecfdf5" fill-opacity="0.8" stroke="#047857" stroke-width="3" />
  <text x="120" y="44" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#047857" text-anchor="middle" letter-spacing="2">KLINIK</text>
  <line x1="30" y1="52" x2="210" y2="52" stroke="#059669" stroke-width="2" />
  <text x="120" y="80" font-family="system-ui, sans-serif" font-size="26" font-weight="900" fill="#065f46" text-anchor="middle" letter-spacing="4">L U N A S</text>
  <text x="120" y="98" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#047857" text-anchor="middle">VERIFIED ELECTRONIC RECEIPT</text>
</svg>
`)}`;

const PRESET_SIGNATURE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80">
  <path d="M 20 60 Q 45 10 70 50 T 110 35 T 145 65 Q 165 40 185 20 M 60 45 Q 120 75 175 40" fill="none" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`)}`;

export default function InvoiceSetupPage() {
  const { config, updateConfig } = useRME();

  const [headerMode, setHeaderMode] = useState<'STANDARD' | 'CUSTOM_LETTERHEAD'>(
    config.invoiceHeaderMode || 'STANDARD'
  );
  const [logoUrl, setLogoUrl] = useState<string>(config.logoUrl || '');
  const [letterheadUrl, setLetterheadUrl] = useState<string>(config.letterheadUrl || '');
  const [city, setCity] = useState<string>(config.invoiceCity || 'Jakarta');
  const [cashierTitle, setCashierTitle] = useState<string>(
    config.invoiceCashierTitle || 'Petugas Administrasi / Kasir'
  );
  const [notes, setNotes] = useState<string>(
    config.invoiceNotes ||
      'Kwitansi ini sah dan diterbitkan secara elektronik melalui sistem RME Klinik.'
  );
  const [bankInfo, setBankInfo] = useState<string>(
    config.invoiceBankInfo || 'Bank BCA: 820-123-4567 a/n Klinik'
  );
  const [showStamp, setShowStamp] = useState<boolean>(config.invoiceShowStamp !== false);
  const [stampUrl, setStampUrl] = useState<string>(config.invoiceStampUrl || '');
  const [signatureUrl, setSignatureUrl] = useState<string>(config.invoiceSignatureUrl || '');

  const [isSaved, setIsSaved] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const letterheadInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // File reader helper for image upload
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    maxSizeKb: number = 2048,
    label: string = 'Gambar'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(`Format ${label} tidak valid! Harap pilih file gambar (PNG, JPG, SVG, WebP).`);
      return;
    }

    if (file.size > maxSizeKb * 1024) {
      toast.error(`Ukuran file ${label} terlalu besar (maksimal ${maxSizeKb / 1024}MB).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setter(result);
      toast.success(`${label} berhasil diunggah!`);
    };
    reader.onerror = () => {
      toast.error(`Gagal membaca file ${label}.`);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    updateConfig({
      invoiceHeaderMode: headerMode,
      logoUrl: logoUrl,
      letterheadUrl: letterheadUrl,
      invoiceCity: city.trim(),
      invoiceCashierTitle: cashierTitle.trim(),
      invoiceNotes: notes.trim(),
      invoiceBankInfo: bankInfo.trim(),
      invoiceShowStamp: showStamp,
      invoiceStampUrl: stampUrl,
      invoiceSignatureUrl: signatureUrl,
    });

    setIsSaved(true);
    toast.success('Pengaturan Invoice & Kop Surat Kwitansi berhasil disimpan!');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePrintTest = () => {
    window.print();
  };

  return (
    <MainLayout>
      <div className="space-y-6 w-full pb-16">
        {/* ── 1. Page Header Banner ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-emerald-700/40">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
              <Receipt className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/settings"
                  className="text-xs font-semibold text-emerald-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Pengaturan</span>
                </Link>
                <span className="text-emerald-400/60">•</span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Setup Invoice &amp; Kop Surat Kwitansi
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px] font-bold">
                  Standar Kwitansi Faskes
                </Badge>
              </div>
              <p className="text-xs text-emerald-100/80 max-w-3xl leading-relaxed">
                Sesuaikan foto logo fasilitas kesehatan, gambar kop surat resmi, stempel lunas, tanda tangan digital kasir, serta teks identitas yang dipasang pada bukti pembayaran kwitansi pasien.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintTest}
              className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20 rounded-xl h-9 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Uji Cetak Kwitansi</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSaveAll()}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold h-9 text-xs shadow-md rounded-xl cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Simpan Pengaturan</span>
            </Button>
          </div>
        </div>

        {/* ── 2. Main Two-Column Working Grid (Form Left + Paper Preview Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Configuration & Upload Sections (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Bagian 1: Pilihan Mode Kop Surat */}
            <Card className="border border-slate-200/90 bg-white shadow-xs rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Format Kop Surat Kwitansi</h2>
                    <p className="text-[11px] text-slate-500">
                      Pilih format kop surat yang akan dicetak di bagian atas kwitansi
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Opsi 1: Kop Standar (Logo + Teks) */}
                <div
                  onClick={() => setHeaderMode('STANDARD')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    headerMode === 'STANDARD'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="h-8 w-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                      <Building2 className="h-4 w-4" />
                    </div>
                    {headerMode === 'STANDARD' && (
                      <Badge className="bg-emerald-700 text-white text-[10px] font-bold">Aktif</Badge>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-slate-900">Mode Kop Standar</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Menggabungkan foto logo klinik dengan teks nama fasilitas, dokter penanggung jawab, SIP, dan alamat resmi.
                    </div>
                  </div>
                </div>

                {/* Opsi 2: Kop Gambar Utuh (Custom Banner) */}
                <div
                  onClick={() => setHeaderMode('CUSTOM_LETTERHEAD')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    headerMode === 'CUSTOM_LETTERHEAD'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="h-8 w-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    {headerMode === 'CUSTOM_LETTERHEAD' && (
                      <Badge className="bg-teal-700 text-white text-[10px] font-bold">Aktif</Badge>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-slate-900">Kop Gambar Utuh (Banner)</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Menggunakan satu file gambar kop surat siap pakai beresolusi lanskap yang menggantikan seluruh header kwitansi.
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Bagian 2: Upload Foto / Logo Klinik */}
            <Card className="border border-slate-200/90 bg-white shadow-xs rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Foto / Logo Fasilitas Pelayanan</h2>
                    <p className="text-[11px] text-slate-500">
                      Tampil di samping nama faskes pada kop standar kwitansi &amp; resep
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLogoUrl(PRESET_LOGO_SVG);
                      toast.success('Logo preset demo berhasil dimuat!');
                    }}
                    className="text-[11px] h-7 border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-emerald-600" />
                    <span>Gunakan Logo Preset</span>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                {/* Logo Preview Box */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 p-2 overflow-hidden relative group">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo Klinik"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center text-slate-400 space-y-1">
                      <ImageIcon className="h-7 w-7 mx-auto opacity-50" />
                      <div className="text-[10px]">Belum Ada Logo</div>
                    </div>
                  )}
                </div>

                {/* Upload Action Area */}
                <div className="space-y-2 flex-1 w-full">
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setLogoUrl, 2048, 'Logo Klinik')}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs rounded-xl h-8 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{logoUrl ? 'Ganti File Logo' : 'Upload Foto/Logo'}</span>
                    </Button>
                    {logoUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLogoUrl('');
                          toast.info('Logo dihapus.');
                        }}
                        className="gap-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl h-8 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus</span>
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Format disarankan: <strong>PNG transparan, SVG, atau JPG</strong>. Rasio 1:1 (persegi) atau bulat. Maksimal ukuran file 2 MB.
                  </p>
                </div>
              </div>
            </Card>

            {/* Bagian 3: Upload Banner Kop Surat Utuh (Custom Banner) */}
            <Card className="border border-slate-200/90 bg-white shadow-xs rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Banner Kop Surat Resmi Utuh (Opsional)
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Dipakai jika memilih mode "Kop Gambar Utuh" di atas
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLetterheadUrl(PRESET_LETTERHEAD_SVG);
                    setHeaderMode('CUSTOM_LETTERHEAD');
                    toast.success('Kop surat preset demo berhasil dimuat!');
                  }}
                  className="text-[11px] h-7 border-teal-300 text-teal-800 hover:bg-teal-50 rounded-lg cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 mr-1 text-teal-600" />
                  <span>Gunakan Kop Preset</span>
                </Button>
              </div>

              <div className="space-y-3 pt-1">
                {/* Banner Preview Area */}
                <div className="w-full h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-2 relative">
                  {letterheadUrl ? (
                    <img
                      src={letterheadUrl}
                      alt="Kop Surat Utuh"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 space-y-1">
                      <FileText className="h-8 w-8 mx-auto opacity-50" />
                      <div className="text-xs font-semibold">Belum Ada Banner Kop Surat</div>
                      <div className="text-[10px]">
                        Unggah gambar desain kop surat lengkap klinik Anda
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <input
                    type="file"
                    ref={letterheadInputRef}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, setLetterheadUrl, 3072, 'Banner Kop Surat')
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => letterheadInputRef.current?.click()}
                      className="gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs rounded-xl h-8 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{letterheadUrl ? 'Ganti Banner Kop' : 'Upload Banner Kop Surat'}</span>
                    </Button>
                    {letterheadUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLetterheadUrl('');
                          toast.info('Banner kop surat dihapus.');
                        }}
                        className="gap-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl h-8 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus</span>
                      </Button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Rasio ideal: <strong>6:1 atau 800x130 px</strong> (Lanskap)
                  </span>
                </div>
              </div>
            </Card>

            {/* Bagian 4: Stempel & Tanda Tangan Digital */}
            <Card className="border border-slate-200/90 bg-white shadow-xs rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Stamp className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Stempel &amp; Tanda Tangan Digital
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Cap stempel lunas dan tanda tangan kasir/dokter penanggung jawab
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showStamp}
                    onChange={(e) => setShowStamp(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Tampilkan Cap Lunas</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Upload Stempel Kustom */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Stamp className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Cap Stempel Klinik</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setStampUrl(PRESET_STAMP_SVG);
                        toast.success('Preset stempel lunas dimuat!');
                      }}
                      className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Preset Demo
                    </button>
                  </div>

                  <div className="h-20 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center p-2">
                    {stampUrl ? (
                      <img src={stampUrl} alt="Stempel" className="h-full w-auto object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center">
                        Menggunakan Cap LUNAS bawaan sistem
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={stampInputRef}
                    accept="image/png,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setStampUrl, 1024, 'Cap Stempel')}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => stampInputRef.current?.click()}
                      className="text-[11px] h-7 w-full border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      <span>{stampUrl ? 'Ganti Cap' : 'Upload Cap PNG'}</span>
                    </Button>
                    {stampUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setStampUrl('')}
                        className="text-[11px] h-7 text-rose-600 hover:bg-rose-50 px-2 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Upload Tanda Tangan Digital */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <PenTool className="h-3.5 w-3.5 text-blue-700" />
                      <span>Tanda Tangan Digital</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureUrl(PRESET_SIGNATURE_SVG);
                        toast.success('Preset tanda tangan dimuat!');
                      }}
                      className="text-[10px] text-blue-700 font-bold hover:underline cursor-pointer"
                    >
                      Preset Demo
                    </button>
                  </div>

                  <div className="h-20 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center p-2">
                    {signatureUrl ? (
                      <img
                        src={signatureUrl}
                        alt="Tanda Tangan"
                        className="h-full w-auto object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center">
                        Kosong (tanda tangan basah manual)
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={signatureInputRef}
                    accept="image/png,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setSignatureUrl, 1024, 'Tanda Tangan')}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => signatureInputRef.current?.click()}
                      className="text-[11px] h-7 w-full border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      <span>{signatureUrl ? 'Ganti TTD' : 'Upload TTD PNG'}</span>
                    </Button>
                    {signatureUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setSignatureUrl('')}
                        className="text-[11px] h-7 text-rose-600 hover:bg-rose-50 px-2 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Bagian 5: Teks & Informasi Pelengkap Invoice */}
            <Card className="border border-slate-200/90 bg-white shadow-xs rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Teks &amp; Informasi Tambahan Kwitansi
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Lokasi kota, jabatan penandatangan, catatan kaki, dan info rekening
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Kota Penerbitan */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Kota Penerbitan Kwitansi</label>
                  <Input
                    placeholder="e.g. Jakarta, Bandung, Surabaya"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-white h-9 rounded-xl border-slate-200 text-xs"
                  />
                  <p className="text-[10px] text-slate-400">
                    Contoh tampilan: <em>"{city || 'Jakarta'}, {formatIndonesianDate(new Date().toISOString())}"</em>
                  </p>
                </div>

                {/* Jabatan Penandatangan */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Jabatan Penandatangan</label>
                  <Input
                    placeholder="e.g. Petugas Administrasi / Kasir"
                    value={cashierTitle}
                    onChange={(e) => setCashierTitle(e.target.value)}
                    className="bg-white h-9 rounded-xl border-slate-200 text-xs"
                  />
                  <p className="text-[10px] text-slate-400">
                    Tertulis di bawah tanggal penandatanganan kwitansi
                  </p>
                </div>

                {/* Info Rekening Pembayaran */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-slate-700">
                    Informasi Rekening Bank / Pembayaran Transfer (Opsional)
                  </label>
                  <Input
                    placeholder="e.g. Bank BCA: 820-123-4567 a/n Klinik"
                    value={bankInfo}
                    onChange={(e) => setBankInfo(e.target.value)}
                    className="bg-white h-9 rounded-xl border-slate-200 text-xs"
                  />
                  <p className="text-[10px] text-slate-400">
                    Dicantumkan di bagian bawah kwitansi untuk mempermudah transfer pasien
                  </p>
                </div>

                {/* Catatan Kaki / Disclaimer */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-slate-700">
                    Catatan Kaki Resmi Kwitansi (Disclaimer)
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="Catatan resmi pada lembar kwitansi"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white rounded-xl border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {isSaved ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Tersimpan secara lokal di sistem!
                    </span>
                  ) : (
                    'Perubahan akan otomatis aktif pada seluruh kwitansi pembayaran.'
                  )}
                </span>

                <Button
                  type="button"
                  onClick={() => handleSaveAll()}
                  className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 text-xs rounded-xl cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* RIGHT: Live Interactive Paper Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 sticky top-6">
            <Card className="border border-slate-200/90 bg-white shadow-sm rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-900">
                    Pratinjau Lembar Kwitansi Cetak
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-emerald-300 text-emerald-800">
                  Live Preview
                </Badge>
              </div>

              <div className="p-4 bg-slate-100/70">
                {/* Paper Mockup Container */}
                <div
                  id="printable-receipt"
                  className="bg-white rounded-xl shadow-md border border-slate-300 p-5 font-sans text-slate-900 space-y-3.5 print:border-0 print:p-0 print:shadow-none"
                >
                  {/* Dynamic Letterhead Header */}
                  {headerMode === 'CUSTOM_LETTERHEAD' && letterheadUrl ? (
                    <div className="border-b-2 border-slate-800 pb-2 mb-1">
                      <div className="w-full flex items-center justify-center overflow-hidden rounded">
                        <img
                          src={letterheadUrl}
                          alt="Banner Kop Surat"
                          className="w-full max-h-28 object-contain"
                        />
                      </div>
                      <div className="flex justify-between items-center pt-2 px-1 text-[10px]">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 rounded border border-slate-300 font-bold font-mono">
                          KWITANSI RESMI
                        </span>
                        <div className="text-right text-[10px] text-slate-600 font-mono">
                          No: <strong>INV/2026/09/0142</strong> • Tgl:{' '}
                          {formatIndonesianDate(new Date().toISOString())}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Logo Klinik"
                            className="h-12 w-12 object-contain rounded-xl p-0.5 border border-slate-200 bg-white shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold shrink-0">
                            <Building2 className="h-6 w-6" />
                          </div>
                        )}
                        <div>
                          <h1 className="text-xs font-bold uppercase tracking-tight text-slate-900 leading-snug">
                            {config.practiceName}
                          </h1>
                          {config.subtitle && (
                            <div className="text-[9px] font-semibold text-emerald-800 leading-none mb-0.5">
                              {config.subtitle}
                            </div>
                          )}
                          <div className="text-[10px] font-semibold text-slate-700">
                            {config.doctorName}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">{config.sip}</div>
                          <div className="text-[8.5px] text-slate-500 leading-tight">
                            {config.address} • Telp: {config.phone}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="inline-block px-2 py-0.5 bg-slate-100 rounded border border-slate-300 text-[10px] font-bold font-mono">
                          KWITANSI RESMI
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5 font-mono">
                          No: <strong>INV/2026/09/0142</strong>
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {formatIndonesianDate(new Date().toISOString())}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Patient Info Block */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <div className="text-slate-400 text-[9px] uppercase font-bold">
                        Identitas Pasien
                      </div>
                      <div className="font-bold text-slate-900">Ny. Ratna Sari Dewi</div>
                      <div className="text-slate-600">
                        No. RM: <strong className="font-mono text-blue-700">RM-2026-0042</strong>
                      </div>
                      <div className="text-slate-500">NIK: 3273255102890001 • P (35 th)</div>
                    </div>

                    <div className="space-y-0.5 text-right sm:text-left">
                      <div className="text-slate-400 text-[9px] uppercase font-bold">
                        Pelayanan Medis
                      </div>
                      <div className="font-semibold text-slate-800">
                        Dokter: {config.doctorName}
                      </div>
                      <div className="text-slate-600">Diagnosis: J00 - Nasofaringitis Akut</div>
                      <div className="text-slate-600">
                        Penjamin: <strong className="uppercase">UMUM</strong>
                      </div>
                    </div>
                  </div>

                  {/* Itemized Table Sample */}
                  <div className="space-y-1 text-[10px]">
                    <table className="w-full text-left border border-slate-200">
                      <thead className="bg-emerald-700 text-white font-bold select-none text-[9.5px]">
                        <tr>
                          <th className="py-1 px-2 text-white">No</th>
                          <th className="py-1 px-2 text-white">Layanan / Tindakan / Obat</th>
                          <th className="py-1 px-2 text-center text-white">Qty</th>
                          <th className="py-1 px-2 text-right text-white">Tarif</th>
                          <th className="py-1 px-2 text-right text-white">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[9px]">
                        <tr>
                          <td className="py-1 px-2 font-mono text-slate-500">1</td>
                          <td className="py-1 px-2 font-medium">Konsultasi Dokter Umum &amp; Pemeriksaan</td>
                          <td className="py-1 px-2 text-center font-mono">1</td>
                          <td className="py-1 px-2 text-right font-mono">Rp 75.000</td>
                          <td className="py-1 px-2 text-right font-mono font-semibold">Rp 75.000</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 font-mono text-slate-500">2</td>
                          <td className="py-1 px-2 font-medium">Nebulisasi Bronkodilator Dewasa</td>
                          <td className="py-1 px-2 text-center font-mono">1</td>
                          <td className="py-1 px-2 text-right font-mono">Rp 65.000</td>
                          <td className="py-1 px-2 text-right font-mono font-semibold">Rp 65.000</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 font-mono text-slate-500">3</td>
                          <td className="py-1 px-2 font-medium">Amoxicillin 500mg (10 Tab)</td>
                          <td className="py-1 px-2 text-center font-mono">1</td>
                          <td className="py-1 px-2 text-right font-mono">Rp 25.000</td>
                          <td className="py-1 px-2 text-right font-mono font-semibold">Rp 25.000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Block */}
                  <div className="flex justify-between items-start pt-1 text-[10px]">
                    <div className="text-[9px] text-slate-500 italic max-w-[200px] leading-tight space-y-1">
                      <p>* {notes}</p>
                      {bankInfo && (
                        <div className="p-1 rounded bg-slate-50 border border-slate-200 text-[8.5px] font-mono not-italic text-slate-600">
                          <strong>Rekening:</strong> {bankInfo}
                        </div>
                      )}
                    </div>

                    <div className="w-40 space-y-0.5 text-right font-mono text-[9.5px]">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span>Rp 165.000</span>
                      </div>
                      <div className="flex justify-between font-bold text-[11px] text-slate-900 border-t border-slate-300 pt-0.5">
                        <span>TOTAL:</span>
                        <span className="text-blue-700">Rp 165.000</span>
                      </div>
                    </div>
                  </div>

                  {/* Stempel & Signature Section */}
                  <div className="grid grid-cols-2 pt-3 items-end text-[10px]">
                    {/* Stamp */}
                    <div>
                      {showStamp && (
                        stampUrl ? (
                          <img
                            src={stampUrl}
                            alt="Stempel"
                            className="h-14 w-auto object-contain rotate-[-5deg]"
                          />
                        ) : (
                          <div className="inline-block border-2 border-emerald-600 rounded p-1.5 text-emerald-700 font-bold uppercase tracking-widest rotate-[-5deg] bg-emerald-50/50">
                            <div className="text-[9px]">LUNAS / PAID</div>
                            <div className="text-[7.5px] font-normal">CASH • {formatIndonesianDate(new Date().toISOString())}</div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Signature */}
                    <div className="text-right space-y-1">
                      <div className="text-slate-600 text-[9px]">
                        {city || 'Jakarta'}, {formatIndonesianDate(new Date().toISOString())}
                        <div className="text-[8.5px] text-slate-400">{cashierTitle}</div>
                      </div>

                      {signatureUrl ? (
                        <div className="flex justify-end py-0.5">
                          <img
                            src={signatureUrl}
                            alt="Tanda Tangan"
                            className="h-9 w-auto object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-8" />
                      )}

                      <div className="border-t border-slate-400 pt-0.5 inline-block min-w-[110px] text-center font-bold text-slate-800 text-[9.5px]">
                        ( {config.doctorName} )
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrintTest}
                    className="w-full gap-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-300 rounded-xl h-8.5 shadow-2xs cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Cetak Lembar Contoh Ini (Print / PDF)</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick tips card */}
            <Card className="border border-emerald-200/80 bg-emerald-50/40 p-4 rounded-2xl space-y-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <Info className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Tips Cetak Kwitansi Resmi:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800/90 pl-1 leading-relaxed">
                <li>Gunakan logo dengan background transparan (PNG) agar terlihat bersih.</li>
                <li>Jika klinik sudah memiliki kertas kop cetak, Anda bisa mengosongkan kop surat dan hanya mencetak rincian tagihan serta tanda tangan.</li>
                <li>Pengaturan ini otomatis terhubung pada seluruh invoice di menu <strong>Kasir &amp; Tagihan</strong>.</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
