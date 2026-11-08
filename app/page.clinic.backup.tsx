'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRME } from '@/context/rme-context';

/* ─────────────────────────────────────────────
   Inline SVG Icons
───────────────────────────────────────────── */
function IconHeart() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>; }
function IconShield() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconActivity() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function IconUsers() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconFile() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function IconPill() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v2"/><circle cx="16" cy="19" r="3"/><path d="M13.5 16.5 19 22"/></svg>; }
function IconCard() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>; }
function IconBar() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>; }
function IconBell() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function IconCpu() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>; }
function IconCheck() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function IconArrow() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>; }
function IconZap() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>; }
function IconGlobe() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function IconStar() { return <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-full h-full"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IconMenu() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function IconX() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconScope() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>; }

/* ─────────────────────────────────────────────
   Counter animation hook
───────────────────────────────────────────── */
function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* Intersection observer hook */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
const FEATURES = [
  {
    Icon: IconFile,
    title: 'SOAP Rekam Medis',
    desc: 'Dokumentasi klinis terstandar — Subjektif, Objektif, Analisis, Plan — dengan diagnosis ICD-10 dan tindakan ICD-9-CM terintegrasi.',
    iconCls: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    Icon: IconBell,
    title: 'Antrean Suara Otomatis',
    desc: 'Panggilan berbasis Web Audio API dengan lonceng 4-nada khas RS dan Text-to-Speech bahasa Indonesia. Layar TV display ruang tunggu real-time.',
    iconCls: 'bg-teal-50 text-teal-700 border-teal-100',
  },
  {
    Icon: IconPill,
    title: 'E-Prescription & Farmasi',
    desc: 'Resep digital non-racikan dan racikan multi-komposisi (puyer, kapsul, salep). Manajemen inventaris, kartu stok, dan audit stok otomatis.',
    iconCls: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  },
  {
    Icon: IconCard,
    title: 'Kasir Multi-Metode',
    desc: 'Billing fleksibel: Tunai, QRIS, Transfer Bank, BPJS, dan Asuransi Swasta. Cetak struk thermal 58/80mm & kwitansi invoice rapi.',
    iconCls: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    Icon: IconCpu,
    title: 'Asisten AI Klinis',
    desc: 'Rekomendasi diagnosis banding cerdas, pengecekan kontraindikasi obat real-time, dan panduan dosis berbasis evidence-based medicine.',
    iconCls: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  {
    Icon: IconBar,
    title: 'Laporan & Analitik',
    desc: '10 besar penyakit (ICD-10), tren kunjungan harian/bulanan, laporan pendapatan faskes, honorarium dokter, dan rekap jasa medis.',
    iconCls: 'bg-sky-50 text-sky-700 border-sky-100',
  },
];

const INTEGRATIONS = [
  {
    Icon: IconGlobe,
    name: 'SATUSEHAT',
    sub: 'Kemenkes RI',
    badge: 'FHIR HL7',
    desc: 'Terintegrasi penuh dengan platform Kemenkes. Kirim Encounter, Condition, Observation, Procedure & MedicationRequest secara otomatis dalam format HL7 FHIR standar nasional.',
  },
  {
    Icon: IconShield,
    name: 'BPJS Kesehatan',
    sub: 'PCare & Bridging',
    badge: 'PCare API',
    desc: 'Pengecekan kepesertaan BPJS instan via NIK/nomor kartu. Bridging antrean online FKTP dan pencatatan riwayat rujukan terintegrasi.',
  },
  {
    Icon: IconFile,
    name: 'ICD-10 & ICD-9-CM',
    sub: 'WHO Standard',
    badge: 'WHO Standar',
    desc: 'Database diagnosis ICD-10 dan tindakan ICD-9-CM terintegrasi langsung dalam form pemeriksaan SOAP dengan pencarian cerdas auto-complete.',
  },
  {
    Icon: IconActivity,
    name: 'SNOMED CT',
    sub: 'Clinical Terms',
    badge: 'SNOMED',
    desc: 'Standarisasi terminologi klinis internasional untuk keseragaman gejala, temuan pemeriksaan fisik, dan protokol medis yang akurat.',
  },
];

const WORKFLOW = [
  { step: '01', title: 'Pasien Datang',     desc: 'Registrasi mandiri atau di loket. Sistem cetak tiket nomor antrean otomatis dan pasien masuk daftar tunggu.', Icon: IconUsers },
  { step: '02', title: 'Panggilan Antrean', desc: 'Lonceng 4-nada berbunyi merdu. Sistem memanggil nomor antrean dan nama pasien dalam bahasa Indonesia natural.', Icon: IconBell },
  { step: '03', title: 'Pemeriksaan SOAP',  desc: 'Dokter mengisi anamnesis, vital sign, diagnosa ICD-10, tindakan klinis, dan e-resep dalam satu antarmuka terpadu.', Icon: IconScope },
  { step: '04', title: 'Farmasi & Kasir',   desc: 'Apoteker menyiapkan obat racikan/non-racikan. Kasir memproses pembayaran multi-metode dan mencetak struk thermal.', Icon: IconCard },
  { step: '05', title: 'Sinkronisasi FHIR', desc: 'Data rekam medis terenkripsi otomatis tersinkronisasi ke server SATUSEHAT Kemenkes RI secara real-time.', Icon: IconGlobe },
];

const ROLES = [
  {
    name: 'Dokter',
    Icon: IconScope,
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    feats: ['Ruang SOAP & E-Resep', 'Diagnosa ICD-10 Cepat', 'Asisten AI Klinis', 'Riwayat Rekam Medis Pasien', 'Laporan Rekap Medis'],
  },
  {
    name: 'Admin / Resepsionis',
    Icon: IconUsers,
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    feats: ['Registrasi Pasien Baru/Lama', 'Meja Antrean & Cetak Tiket', 'Panggilan Suara Otomatis', 'Layar TV Antrean Poli', 'Manajemen Jadwal Dokter'],
  },
  {
    name: 'Perawat / Bidan',
    Icon: IconHeart,
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
    feats: ['Skrining Tanda Vital', 'Antrean Triase / Triage', 'Pendampingan Pemeriksaan', 'Input Keluhan Awal', 'Pencatatan Imunisasi / ANC'],
  },
  {
    name: 'Apoteker',
    Icon: IconPill,
    badgeBg: 'bg-violet-50 text-violet-800 border-violet-200',
    feats: ['Telaah & Verifikasi Resep', 'Peracikan Puyer & Salep', 'Kartu Stok Real-time', 'Stock Opname Digital', 'Laporan Pengeluaran Obat'],
  },
  {
    name: 'Kasir',
    Icon: IconCard,
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    feats: ['Billing Multi-Metode Bayar', 'Klaim BPJS & Asuransi', 'Cetak Struk Thermal 58/80mm', 'Diskon & Pajak Otomatis', 'Laporan Kas Harian'],
  },
];

const TESTIMONIALS = [
  {
    name: 'dr. Arif Hidayat, Sp.PD',
    clinic: 'Klinik Pratama Sehat Sejahtera, Surabaya',
    text: 'RME Klinik benar-benar menyederhanakan alur pelayanan klinik harian. Rekam medis digital SOAP sangat cepat, integrasi SATUSEHAT lancar tanpa kendala teknis, dan antrean suara membuat ruang tunggu klinik jauh lebih tertib.',
  },
  {
    name: 'dr. Siti Rahayu, M.Kes',
    clinic: 'Klinik Dokter Umum, Bandung',
    text: 'Tampilan antarmukanya sangat bersih, modern, dan tidak membingungkan. Sangat membantu dokter yang ingin fokus pada pasien tanpa terbebani kerumitan aplikasi.',
  },
  {
    name: 'apt. Budi Santoso, S.Farm.',
    clinic: 'Apotek Klinik Medika Prima, Jakarta',
    text: 'Modul e-resep dan racikan obatnya dirancang dengan sangat matang. Riwayat mutasi stok tercatat otomatis, memangkas waktu rekonsiliasi inventaris bulanan secara signifikan.',
  },
];

const STATS = [
  { label: 'Fasilitas Kesehatan Terdaftar', value: 1250, suf: '+' },
  { label: 'Pasien Terlayani',             value: 850,  suf: 'K+' },
  { label: 'Kunjungan / Bulan',            value: 120,  suf: 'K+' },
  { label: 'Kepatuhan Uptime Sistem',      value: 99,   suf: '.9%' },
];

/* ─────────────────────────────────────────────
   StatItem Sub-component
───────────────────────────────────────────── */
function StatItem({ value, suf, label, start }: { value: number; suf: string; label: string; start: boolean }) {
  const n = useCountUp(value, 2000, start);
  return (
    <div className="text-center p-4">
      <div className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-1.5">
        {n}{suf}
      </div>
      <div className="text-emerald-700 text-xs sm:text-sm font-bold tracking-wide uppercase">
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main HomePage (Modern Minimalist Clinical)
───────────────────────────────────────────── */
export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const statsEl = useInView(0.3);
  const { isAuthenticated, currentUser } = useRME();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden font-sans">

      {/* ── Background Subtle Ambient Lighting ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-[25%] -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[10%] left-[15%] w-[550px] h-[550px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
          borderBottom: scrolled ? '1px solid rgba(226, 232, 240, 0.9)' : '1px solid rgba(226, 232, 240, 0.4)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-md shadow-slate-200/50 p-1 overflow-hidden border border-slate-200">
                <img src="/logo.png" alt="Logo RME" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="font-black text-slate-900 text-lg leading-none tracking-tight">RME</div>
                <div className="text-emerald-700 text-[10px] font-bold tracking-widest uppercase leading-none mt-0.5">Klinik</div>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-8">
              {['Fitur', 'Integrasi', 'Alur Kerja', 'Peran', 'Testimoni'].map((n) => (
                <a
                  key={n}
                  href={`#${n.toLowerCase().replace(' ', '-')}`}
                  className="text-slate-600 hover:text-emerald-700 text-sm font-semibold transition-colors duration-200"
                >
                  {n}
                </a>
              ))}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  id="nav-cta"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                >
                  <span>Buka Dashboard</span>
                  {currentUser?.name && (
                    <span className="text-emerald-100 text-xs font-normal">({currentUser.name.split(' ')[0]})</span>
                  )}
                  <span>→</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    id="nav-cta"
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Coba Gratis →
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              id="hamburger-btn"
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Menu Navigasi"
            >
              {menuOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl shadow-lg">
            <div className="px-5 py-6 space-y-4">
              {['Fitur', 'Integrasi', 'Alur Kerja', 'Peran', 'Testimoni'].map((n) => (
                <a
                  key={n}
                  href={`#${n.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setMenuOpen(false)}
                  className="block text-slate-700 hover:text-emerald-700 font-semibold py-1 transition-colors"
                >
                  {n}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-3 border-t border-slate-100">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block text-center py-3 text-white font-bold rounded-xl bg-emerald-600 shadow-sm"
                  >
                    Buka Dashboard ({currentUser?.name?.split(' ')[0] || 'Staf'}) →
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block text-center py-3 text-slate-700 font-semibold border border-slate-200 rounded-xl hover:bg-slate-50"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className="block text-center py-3 text-white font-bold rounded-xl bg-emerald-600 shadow-sm"
                    >
                      Coba Gratis (Daftar Baru)
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════
          HERO SECTION (Clean Minimalist Clinical)
      ══════════════════════════════════════ */}
      <section id="hero" className="relative z-10 min-h-[90vh] flex items-center pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="space-y-6 lg:space-y-8">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span>Standar Kemenkes RI • Permenkes No. 24 Tahun 2022</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.12] tracking-tight text-slate-900">
                Sistem{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
                  Rekam Medis
                </span>
                <br />
                Elektronik Modern
                <br />
                untuk <span className="text-emerald-700">Indonesia</span>
              </h1>

              <p className="text-slate-600 text-base sm:text-lg lg:text-xl leading-relaxed max-w-xl">
                Solusi RME komprehensif, cepat, dan intuitif untuk klinik pratama, dokter, bidan, dan perawat.
                Terintegrasi langsung <strong className="text-emerald-700 font-bold">SATUSEHAT</strong> Kemenkes dan{' '}
                <strong className="text-teal-700 font-bold">BPJS PCare</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                <Link
                  href={isAuthenticated ? '/dashboard' : '/login'}
                  id="hero-primary-btn"
                  className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-bold text-white text-base bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-200 cursor-pointer"
                >
                  <span>{isAuthenticated ? 'Buka Dashboard RME' : 'Mulai Gratis Sekarang'}</span>
                  <div className="w-4 h-4 group-hover:translate-x-1 transition-transform"><IconArrow /></div>
                </Link>
                <Link
                  href={isAuthenticated ? '/dashboard' : '/login'}
                  id="hero-demo-btn"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-slate-700 text-base border border-slate-300 bg-white hover:bg-slate-50 shadow-xs transition-all duration-200"
                >
                  <div className="w-4 h-4 text-emerald-600"><IconZap /></div>
                  <span>{isAuthenticated ? 'Masuk ke Aplikasi' : 'Demo 1-Klik'}</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3 pt-2">
                {[
                  { text: 'SATUSEHAT FHIR', Icon: IconShield },
                  { text: 'BPJS PCare Bridging', Icon: IconCheck },
                  { text: 'Offline-First Ready', Icon: IconZap },
                ].map(({ text, Icon }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200/80 text-xs font-semibold text-slate-700"
                  >
                    <div className="w-3.5 h-3.5 text-emerald-600"><Icon /></div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Clean Clinical Dashboard Mockup */}
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-emerald-100/50 via-teal-100/30 to-sky-100/40 blur-2xl -z-10" />

              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
                {/* Browser Top Window Bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 mx-3 h-6 rounded-md px-3 flex items-center bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-mono">rme.klinik.id/dashboard</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* Dashboard Content Container */}
                <div className="p-4 sm:p-5 space-y-3.5 bg-[#fafcfb]">
                  {/* Metric KPI Cards */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { l: 'Pasien Hari Ini', v: '28', c: 'text-emerald-700', bg: 'bg-emerald-50/70 border-emerald-100' },
                      { l: 'Selesai', v: '19', c: 'text-teal-700', bg: 'bg-teal-50/70 border-teal-100' },
                      { l: 'Menunggu', v: '9', c: 'text-amber-700', bg: 'bg-amber-50/70 border-amber-100' },
                      { l: 'Pendapatan', v: '4.2jt', c: 'text-indigo-700', bg: 'bg-indigo-50/70 border-indigo-100' },
                    ].map((s) => (
                      <div key={s.l} className={`rounded-xl p-2.5 text-center border ${s.bg}`}>
                        <div className={`text-base sm:text-lg font-black ${s.c}`}>{s.v}</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 leading-tight mt-0.5 font-medium">{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Active Queue Table */}
                  <div className="rounded-xl overflow-hidden border border-slate-200/90 bg-white shadow-2xs">
                    <div className="px-3.5 py-2 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Antrean Poliklinik</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-700">Live Real-time</span>
                      </div>
                    </div>
                    {[
                      { no: 'A-004', name: 'Budi Santoso', s: 'Dipanggil', c: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                      { no: 'A-005', name: 'Siti Rahmah', s: 'Menunggu', c: 'text-amber-700 bg-amber-50 border-amber-200' },
                      { no: 'A-006', name: 'Ahmad Fauzi', s: 'Menunggu', c: 'text-amber-700 bg-amber-50 border-amber-200' },
                    ].map((q) => (
                      <div
                        key={q.no}
                        className="px-3.5 py-2 flex items-center gap-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="text-xs font-black text-slate-900 w-12">{q.no}</div>
                        <div className="flex-1 text-xs text-slate-700 font-medium">{q.name}</div>
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${q.c}`}>{q.s}</div>
                      </div>
                    ))}
                  </div>

                  {/* Vital Signs & E-Prescription Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl p-3 border border-emerald-100 bg-emerald-50/40">
                      <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-1.5">Tanda Vital Pasien</div>
                      {[
                        ['TD', '120/80 mmHg'],
                        ['Nadi', '72 bpm'],
                        ['Suhu', '36.5 °C'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between py-0.5 text-[10px]">
                          <span className="text-slate-500">{k}</span>
                          <span className="font-bold text-slate-800">{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl p-3 border border-teal-100 bg-teal-50/40">
                      <div className="text-[10px] text-teal-800 font-bold uppercase tracking-wider mb-1.5">E-Resep Digital</div>
                      {['Amoxicillin 500mg (3x1)', 'Paracetamol 500mg (prn)', 'Vitamin C 500mg (1x1)'].map((d) => (
                        <div key={d} className="text-[10px] text-slate-700 font-medium py-0.5 truncate flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Trust Pills */}
              <div className="absolute -bottom-3 -left-3 px-3.5 py-2 rounded-xl bg-white border border-emerald-200/90 shadow-lg text-slate-800 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-700">
                  <div className="w-4 h-4"><IconZap /></div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-none">SATUSEHAT FHIR</div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Tersinkronisasi Otomatis ✓</div>
                </div>
              </div>

              <div className="absolute -top-3 -right-3 px-3.5 py-2 rounded-xl bg-white border border-cyan-200/90 shadow-lg text-slate-800 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-100 text-cyan-700">
                  <div className="w-4 h-4"><IconShield /></div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-none">BPJS PCare</div>
                  <div className="text-cyan-700 font-medium mt-0.5">Bridging Terhubung ✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS SECTION
      ══════════════════════════════════════ */}
      <section
        id="stats"
        className="relative z-10 py-12 sm:py-16 bg-white border-y border-slate-200/80 shadow-2xs"
      >
        <div ref={statsEl.ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {STATS.map((s) => (
              <StatItem key={s.label} value={s.value} suf={s.suf} label={s.label} start={statsEl.inView} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES SECTION
      ══════════════════════════════════════ */}
      <section id="fitur" className="relative z-10 py-20 lg:py-28 bg-[#f8fafc]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3.5">
            <div className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-200">
              Fitur Unggulan Klinis
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
              Semua yang dibutuhkan{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                praktik modern
              </span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
              Dari pencatatan rekam medis SOAP hingga kasir dan pelaporan analitik, RME Klinik hadir sebagai solusi lengkap faskes primer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                id={`feature-${i}`}
                className="group rounded-2xl p-6 sm:p-7 border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-600/5 transition-all duration-300 hover:-translate-y-1 cursor-default shadow-xs"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border ${f.iconCls} shadow-xs`}>
                  <div className="w-6 h-6"><f.Icon /></div>
                </div>
                <h3 className="text-slate-900 font-bold text-lg mb-2.5">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                <div className="mt-5 flex items-center gap-1.5 text-emerald-700 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span>Pelajari lebih lanjut</span>
                  <div className="w-3.5 h-3.5"><IconArrow /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          INTEGRATIONS SECTION
      ══════════════════════════════════════ */}
      <section id="integrasi" className="relative z-10 py-20 lg:py-28 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3.5">
            <div className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-cyan-50 text-cyan-800 border border-cyan-200">
              Integrasi Resmi
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
              Terhubung dengan{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                ekosistem kesehatan
              </span>{' '}
              nasional
            </h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
              Memastikan kepatuhan regulasi Kementerian Kesehatan dan standarisasi data medis internasional secara aman.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {INTEGRATIONS.map((g, i) => (
              <div
                key={g.name}
                id={`integration-${i}`}
                className="rounded-2xl p-6 sm:p-7 border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-300 flex gap-5 shadow-2xs"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-2xs">
                  <div className="w-7 h-7"><g.Icon /></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-slate-900 font-bold text-base sm:text-lg">{g.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {g.badge}
                    </span>
                  </div>
                  <div className="text-emerald-700 text-xs font-semibold mb-2">{g.sub}</div>
                  <p className="text-slate-600 text-sm leading-relaxed">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          WORKFLOW SECTION
      ══════════════════════════════════════ */}
      <section id="alur-kerja" className="relative z-10 py-20 lg:py-28 bg-[#f8fafc]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3.5">
            <div className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-200">
              Alur Kerja Terpadu
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
              Dari pendaftaran hingga{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                SATUSEHAT
              </span>{' '}
              dalam satu sistem
            </h2>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {WORKFLOW.map((w, i) => (
                <div
                  key={w.step}
                  id={`step-${i}`}
                  className="relative rounded-2xl p-5 sm:p-6 border border-slate-200/80 bg-white text-center shadow-xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-black mb-4 mx-auto bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                    {w.step}
                  </div>
                  <div className="w-8 h-8 mx-auto mb-3 text-emerald-700">
                    <w.Icon />
                  </div>
                  <h3 className="text-slate-900 font-bold text-sm sm:text-base mb-2">{w.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ROLES (RBAC) SECTION
      ══════════════════════════════════════ */}
      <section id="peran" className="relative z-10 py-20 lg:py-28 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3.5">
            <div className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-indigo-50 text-indigo-800 border border-indigo-200">
              Manajemen Akses (RBAC)
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
              Satu sistem untuk{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">
                seluruh staf faskes
              </span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
              Hak akses berbasis peran memastikan kerahasiaan data medis dan alur kerja staf yang fokus sesuai tugas masing-masing.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {ROLES.map((r, i) => (
              <div
                key={r.name}
                id={`role-${i}`}
                className="rounded-2xl p-5 border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-300 shadow-2xs"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${r.badgeBg} shadow-2xs`}>
                  <div className="w-5 h-5"><r.Icon /></div>
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3">{r.name}</h3>
                <ul className="space-y-2">
                  {r.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                      <div className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5"><IconCheck /></div>
                      <span className="leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIALS SECTION
      ══════════════════════════════════════ */}
      <section id="testimoni" className="relative z-10 py-20 lg:py-28 bg-[#f8fafc]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3.5">
            <div className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-200">
              Testimoni Praktisi
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
              Dipercaya oleh{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                tenaga medis Indonesia
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                id={`testimonial-${i}`}
                className="rounded-2xl p-6 sm:p-7 border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4"
              >
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((j) => (
                    <div key={j} className="w-4 h-4 text-amber-400"><IconStar /></div>
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed italic flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-600 text-white shrink-0 shadow-2xs">
                    {t.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div className="text-slate-900 text-xs sm:text-sm font-bold">{t.name}</div>
                    <div className="text-slate-500 text-[11px]">{t.clinic}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CALL TO ACTION (CTA BANNER)
      ══════════════════════════════════════ */}
      <section id="cta" className="relative z-10 py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative rounded-3xl overflow-hidden p-10 lg:p-16 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-2xl shadow-emerald-700/20">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/30 bg-white/10 text-white text-xs font-bold uppercase tracking-widest backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                Mulai Digitalisasi Praktik Sekarang
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Siap membawa klinik Anda ke level berikutnya?
              </h2>

              <p className="text-emerald-100 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Bergabunglah dengan lebih dari <strong className="text-white font-bold">1.250+ fasilitas kesehatan</strong> yang telah mempercayakan operasional rekam medis kepada kami.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-2">
                <Link
                  href={isAuthenticated ? '/dashboard' : '/register'}
                  id="cta-primary"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-emerald-900 bg-white hover:bg-emerald-50 text-base shadow-lg transition-all duration-200 cursor-pointer hover:scale-102"
                >
                  <span>{isAuthenticated ? 'Buka Dashboard RME' : 'Daftar Akun Gratis'}</span>
                  <div className="w-4 h-4 group-hover:translate-x-1 transition-transform text-emerald-700"><IconArrow /></div>
                </Link>
                <Link
                  href="/login"
                  id="cta-secondary"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base border border-white/30 bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-xs"
                >
                  <span>Hubungi Tim Konsultan</span>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-3 text-xs text-emerald-100">
                {['Tanpa biaya setup awal', 'Demo 1-klik siap pakai', 'Semua fitur dokter & kasir gratis', 'Dukungan bantuan teknis'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 text-emerald-200"><IconCheck /></div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER (Clean Minimalist Clinical)
      ══════════════════════════════════════ */}
      <footer className="relative z-10 py-12 bg-white border-t border-slate-200 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-100">
            <div className="md:col-span-2 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-xs p-1 overflow-hidden border border-slate-200">
                  <img src="/logo.png" alt="Logo RME" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="font-black text-slate-900 text-lg leading-none">RME Klinik</div>
                  <div className="text-emerald-700 text-[10px] font-bold tracking-widest uppercase mt-0.5">Rekam Medis Elektronik Terpadu</div>
                </div>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-sm">
                Sistem Rekam Medis Elektronik (RME) modern sesuai Permenkes No. 24 Tahun 2022. Terintegrasi penuh dengan SATUSEHAT Kemenkes RI dan BPJS Kesehatan untuk faskes primer.
              </p>
              <div className="text-slate-400 text-xs">Didedikasikan untuk kemajuan digitalisasi layanan kesehatan Indonesia</div>
            </div>

            <div>
              <h4 className="text-slate-900 text-xs font-bold uppercase tracking-wider mb-3.5">Modul Utama</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                {['Dashboard Antrean', 'Pemeriksaan SOAP', 'E-Resep & Farmasi', 'Kasir Multi-Metode', 'Laporan ICD-10'].map((m) => (
                  <li key={m}>
                    <Link href="/login" className="text-slate-500 hover:text-emerald-700 transition-colors">
                      {m}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 text-xs font-bold uppercase tracking-wider mb-3.5">Standarisasi & Regulasi</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                {['SATUSEHAT Kemenkes (HL7 FHIR)', 'BPJS Kesehatan PCare API', 'Diagnosis WHO ICD-10', 'Tindakan ICD-9-CM', 'Terminologi SNOMED CT'].map((m) => (
                  <li key={m}>
                    <span className="text-slate-500">
                      {m}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-slate-500">
            <p>© 2026 RME Klinik Indonesia. Hak Cipta Dilindungi.</p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-emerald-700 transition-colors">Masuk Aplikasi</Link>
              <a href="#" className="hover:text-emerald-700 transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-emerald-700 transition-colors">Ketentuan Layanan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
