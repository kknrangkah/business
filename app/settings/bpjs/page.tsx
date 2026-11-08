'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Server,
  Building2,
  Stethoscope,
  Activity,
  FileCode,
  Send,
  Trash2,
  HelpCircle,
  Sparkles,
  Search,
  Check,
  Zap,
  CreditCard,
  UserCheck,
  Radio,
  Clock,
  ArrowUpRight,
  Shield,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { BPJSEnvironment, BPJSLog, BPJSParticipantInfo } from '@/types/rme';

export default function BPJSIntegrationPage() {
  const {
    bpjsConfig,
    bpjsLogs,
    updateBPJSConfig,
    testBPJSConnection,
    checkBPJSEligibility,
    syncVisitToBPJS,
    clearBPJSLogs,
    visits,
    config,
    hasPermission,
  } = useRME();

  // Local Form State
  const [form, setForm] = useState({
    consId: bpjsConfig.consId,
    secretKey: bpjsConfig.secretKey,
    userKey: bpjsConfig.userKey,
    kodePPK: bpjsConfig.kodePPK,
    ppkName: bpjsConfig.ppkName || config.practiceName,
    usernamePCare: bpjsConfig.usernamePCare || '',
    passwordPCare: bpjsConfig.passwordPCare || '',
    environment: bpjsConfig.environment,
    autoBridgingRegistration: bpjsConfig.autoBridgingRegistration,
    autoBridgingKunjungan: bpjsConfig.autoBridgingKunjungan,
    enablePCare: bpjsConfig.enablePCare,
    enableAntreanOnline: bpjsConfig.enableAntreanOnline,
    enableRujukanOnline: bpjsConfig.enableRujukanOnline,
  });

  const [showSecret, setShowSecret] = useState(false);
  const [showUserKey, setShowUserKey] = useState(false);
  const [showPcarePassword, setShowPcarePassword] = useState(false);

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSyncingLatest, setIsSyncingLatest] = useState(false);
  const [logFilter, setLogFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [selectedLogForJson, setSelectedLogForJson] = useState<BPJSLog | null>(null);

  // Participant Eligibility Check State
  const [eligibilityInput, setEligibilityInput] = useState('');
  const [eligibilityResult, setEligibilityResult] = useState<{
    success?: boolean;
    data?: BPJSParticipantInfo;
    message?: string;
  } | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  // Quick Sample BPJS Cards for 1-click testing
  const sampleBPJSCards = [
    { label: '0001234567890', desc: 'Peserta Aktif PPU', code: '0001234567890' },
    { label: '0002345678901', desc: 'Peserta Mandiri PBPU', code: '0002345678901' },
    { label: '0009998887776', desc: 'Kartu Nonaktif (Tunggakan)', code: '0009998887776' },
  ];

  // Save Credentials
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateBPJSConfig({
      consId: form.consId.trim(),
      secretKey: form.secretKey.trim(),
      userKey: form.userKey.trim(),
      kodePPK: form.kodePPK.trim(),
      ppkName: form.ppkName.trim(),
      usernamePCare: form.usernamePCare.trim(),
      passwordPCare: form.passwordPCare.trim(),
      environment: form.environment,
      autoBridgingRegistration: form.autoBridgingRegistration,
      autoBridgingKunjungan: form.autoBridgingKunjungan,
      enablePCare: form.enablePCare,
      enableAntreanOnline: form.enableAntreanOnline,
      enableRujukanOnline: form.enableRujukanOnline,
    });
    toast.success('Kredensial & Pengaturan Integrasi BPJS Kesehatan berhasil disimpan!');
  };

  // Test Connection
  const handleTestConnection = async () => {
    if (!form.consId || !form.secretKey || !form.userKey || !form.kodePPK) {
      toast.error('Harap lengkapi Cons ID, Secret Key, User Key, dan Kode PPK sebelum menguji koneksi.');
      return;
    }

    setIsTestingConnection(true);
    const toastId = toast.loading('Menguji otentikasi Web Service & validasi signature HMAC-SHA256 BPJS...');

    try {
      const res = await testBPJSConnection({
        consId: form.consId.trim(),
        secretKey: form.secretKey.trim(),
        userKey: form.userKey.trim(),
        kodePPK: form.kodePPK.trim(),
        ppkName: form.ppkName.trim(),
        environment: form.environment,
      });

      if (res.success) {
        toast.success(res.message, { id: toastId });
      } else {
        toast.error(res.message, { id: toastId });
      }
    } catch {
      toast.error('Gagal terhubung ke Web Service BPJS Kesehatan.', { id: toastId });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Fill Sandbox Demo Credentials
  const handleFillDemoSandbox = () => {
    const demoSandbox = {
      consId: '12345',
      secretKey: '8yU9102xY8912',
      userKey: '9a123f890123456789abcdef01234567',
      kodePPK: '0114B001',
      ppkName: config.practiceName || 'Klinik',
      usernamePCare: 'pcare_demo',
      passwordPCare: 'pcare12345',
      environment: 'DEVELOPMENT' as BPJSEnvironment,
    };

    setForm((prev) => ({
      ...prev,
      ...demoSandbox,
    }));

    updateBPJSConfig({
      ...demoSandbox,
      isConnected: true,
      lastConnectedAt: new Date().toISOString(),
      lastSignature: 'aF8912jKLmnOPqRstUVwxYZ==',
    });

    toast.success('Kredensial Demo Sandbox BPJS Kesehatan berhasil dimuat!');
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin ke clipboard!`);
  };

  // Check Eligibility
  const triggerEligibilityCheck = async (nomor: string) => {
    if (!nomor) return;
    setIsCheckingEligibility(true);
    const res = await checkBPJSEligibility(nomor);
    setEligibilityResult(res);
    setIsCheckingEligibility(false);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleCheckEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerEligibilityCheck(eligibilityInput);
  };

  // Sync Latest BPJS Visit Test
  const handleSyncLatestVisit = async () => {
    if (visits.length === 0) {
      toast.error('Tidak ada data kunjungan pasien untuk disinkronisasi.');
      return;
    }
    const latestVisit = visits[0];
    setIsSyncingLatest(true);
    const toastId = toast.loading(`Mengirim bridging PCare untuk pasien ${latestVisit.patient.name}...`);

    const res = await syncVisitToBPJS(latestVisit.id);
    setIsSyncingLatest(false);

    if (res.success) {
      toast.success(res.message, { id: toastId });
    } else {
      toast.error(res.message, { id: toastId });
    }
  };

  // Filtered Logs
  const filteredLogs = bpjsLogs.filter((log) => {
    if (logFilter === 'SUCCESS') return log.status === 'SUCCESS';
    if (logFilter === 'FAILED') return log.status === 'FAILED';
    return true;
  });

  const successLogsCount = bpjsLogs.filter((l) => l.status === 'SUCCESS').length;
  const failedLogsCount = bpjsLogs.filter((l) => l.status === 'FAILED').length;

  return (
    <MainLayout>
      <div className="space-y-5 w-full">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Integrasi BPJS Kesehatan
                </h1>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                  Trust Mark BPJS FKTP
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono font-bold border-slate-300 text-slate-600">
                  PCare &amp; Antrean WS
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Konfigurasi Consumer ID, Secret Key, User Key, Kode PPK Faskes, dan Bridging Pendaftaran &amp; Pelayanan PCare FKTP.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFillDemoSandbox}
              className="text-xs font-bold gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 rounded-xl cursor-pointer shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
              <span>Muat Demo Sandbox</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs rounded-xl cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
              <span>{isTestingConnection ? 'Menguji HMAC...' : 'Uji Koneksi (HMAC-SHA256)'}</span>
            </Button>
          </div>
        </div>

        {/* Top KPI Metrics Row (4 Columns - Full Width Balance) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Status Koneksi */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Koneksi WS</span>
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center border ${
                  bpjsConfig.isConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {bpjsConfig.isConnected ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    bpjsConfig.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="text-sm font-black text-slate-900">
                  {bpjsConfig.isConnected ? 'TERHUBUNG (ONLINE)' : 'BELUM TERHUBUNG'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {bpjsConfig.lastConnectedAt
                  ? `Aktif: ${new Date(bpjsConfig.lastConnectedAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })} WIB`
                  : 'Belum pernah diuji'}
              </p>
            </div>
          </Card>

          {/* KPI 2: Lingkungan API */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lingkungan API</span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                <Server className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 block">
                {bpjsConfig.environment === 'PRODUCTION' ? 'PRODUCTION (LIVE)' : 'DEVELOPMENT (SANDBOX)'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">
                {bpjsConfig.environment === 'PRODUCTION' ? 'apijkn.bpjs-kesehatan.go.id' : 'apijkn-dev.bpjs-kesehatan'}
              </p>
            </div>
          </Card>

          {/* KPI 3: Identitas Faskes */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kode PPK Faskes</span>
              <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 font-mono block truncate">
                {bpjsConfig.kodePPK || 'Belum diisi'}
              </span>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                Cons ID: <strong className="font-mono text-slate-700">{bpjsConfig.consId || '-'}</strong>
              </p>
            </div>
          </Card>

          {/* KPI 4: Telemetri Bridging */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aktivitas Bridging</span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 block">
                {bpjsLogs.length} Total Transaksi
              </span>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span className="text-emerald-700 font-bold">{successLogsCount} Sukses</span>
                <span>•</span>
                <span className="text-rose-600 font-bold">{failedLogsCount} Gagal</span>
              </p>
            </div>
          </Card>
        </div>

        {/* Main Content Grid: 12-Column Responsive Layout to Fill All Space */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: Credentials & Sync History (7 Cols on XL) */}
          <div className="xl:col-span-7 space-y-5">
            {/* Section 1: Main BPJS Credentials Form */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-emerald-700" />
                    Kredensial API &amp; Otentikasi Web Service BPJS
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Dapatkan Cons ID, Secret Key, User Key, dan Kode PPK via portal resmi{' '}
                    <a
                      href="https://dvlp.bpjs-kesehatan.go.id"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 underline font-bold inline-flex items-center gap-0.5"
                    >
                      Trust Mark BPJS <ExternalLink className="h-3 w-3 inline" />
                    </a>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-5">
                {/* Environment Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between text-xs">
                    <span>Lingkungan Web Service (Environment)</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Pilih Sandbox untuk pengujian atau Live untuk pelayanan resmi
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Development Option */}
                    <div
                      onClick={() => setForm({ ...form, environment: 'DEVELOPMENT' })}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-1.5 ${
                        form.environment === 'DEVELOPMENT'
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                          <Server className="h-3.5 w-3.5 text-emerald-700" />
                          Development (Sandbox Testing)
                        </span>
                        {form.environment === 'DEVELOPMENT' && (
                          <Check className="h-4 w-4 text-emerald-700 font-bold" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        https://apijkn-dev.bpjs-kesehatan.go.id/pcare-rest-dev
                      </p>
                    </div>

                    {/* Production Option */}
                    <div
                      onClick={() => setForm({ ...form, environment: 'PRODUCTION' })}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-1.5 ${
                        form.environment === 'PRODUCTION'
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                          Production (Live Faskes JKN)
                        </span>
                        {form.environment === 'PRODUCTION' && (
                          <Check className="h-4 w-4 text-emerald-700 font-bold" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        https://apijkn.bpjs-kesehatan.go.id/pcare-rest
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2-Column Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Consumer ID (Cons ID) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <KeyRound className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Consumer ID (Cons ID)</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      {form.consId && (
                        <button
                          type="button"
                          onClick={() => handleCopy(form.consId, 'Cons ID')}
                          className="text-[10px] text-slate-400 hover:text-emerald-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" /> Salin
                        </button>
                      )}
                    </div>
                    <Input
                      required
                      placeholder="e.g. 12345"
                      value={form.consId}
                      onChange={(e) => setForm({ ...form, consId: e.target.value })}
                      className="bg-white h-9 rounded-xl font-mono font-bold text-xs"
                    />
                    <p className="text-[10px] text-slate-400">
                      ID Konsumen resmi yang diberikan oleh BPJS Kesehatan.
                    </p>
                  </div>

                  {/* Kode PPK (Kode Faskes) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Kode PPK / Provider Faskes</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      {form.kodePPK && (
                        <button
                          type="button"
                          onClick={() => handleCopy(form.kodePPK, 'Kode PPK')}
                          className="text-[10px] text-slate-400 hover:text-emerald-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" /> Salin
                        </button>
                      )}
                    </div>
                    <Input
                      required
                      placeholder="e.g. 0114B001"
                      value={form.kodePPK}
                      onChange={(e) => setForm({ ...form, kodePPK: e.target.value })}
                      className="bg-white h-9 rounded-xl font-mono font-bold text-xs"
                    />
                    <p className="text-[10px] text-slate-400">
                      Kode 8 digit FKTP terdaftar di database BPJS.
                    </p>
                  </div>

                  {/* Secret Key */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Secret Key (Consumer Secret)</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-[10px] text-slate-400 hover:text-emerald-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        <span>{showSecret ? 'Sembunyikan' : 'Tampilkan'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        required
                        type={showSecret ? 'text' : 'password'}
                        placeholder="e.g. 8yU9102xY8912..."
                        value={form.secretKey}
                        onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
                        className="bg-white h-9 rounded-xl font-mono text-xs pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Digunakan untuk kalkulasi Signature HMAC-SHA256.
                    </p>
                  </div>

                  {/* User Key (PCare / Antrean WS User Key) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <KeyRound className="h-3.5 w-3.5 text-emerald-700" />
                        <span>User Key (PCare &amp; Antrean WS)</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowUserKey(!showUserKey)}
                        className="text-[10px] text-slate-400 hover:text-emerald-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        {showUserKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        <span>{showUserKey ? 'Sembunyikan' : 'Tampilkan'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        required
                        type={showUserKey ? 'text' : 'password'}
                        placeholder="e.g. 9a123f890123456789abcdef..."
                        value={form.userKey}
                        onChange={(e) => setForm({ ...form, userKey: e.target.value })}
                        className="bg-white h-9 rounded-xl font-mono text-xs pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUserKey(!showUserKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showUserKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      User Key terdaftar pada modul Web Service PCare FKTP.
                    </p>
                  </div>

                  {/* Username PCare */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>Username PCare Web Service</span>
                    </label>
                    <Input
                      placeholder="e.g. pcare_klinik01"
                      value={form.usernamePCare}
                      onChange={(e) => setForm({ ...form, usernamePCare: e.target.value })}
                      className="bg-white h-9 rounded-xl text-xs font-mono"
                    />
                  </div>

                  {/* Password PCare */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                        <span>Password PCare Web Service</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPcarePassword(!showPcarePassword)}
                        className="text-[10px] text-slate-400 hover:text-emerald-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        {showPcarePassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        <span>{showPcarePassword ? 'Sembunyikan' : 'Tampilkan'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showPcarePassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.passwordPCare}
                        onChange={(e) => setForm({ ...form, passwordPCare: e.target.value })}
                        className="bg-white h-9 rounded-xl text-xs font-mono pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPcarePassword(!showPcarePassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPcarePassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Base Service URLs Info Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                    <Server className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Base Service URLs BPJS Kesehatan:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-mono">
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[9px] font-sans font-bold">PCare REST API:</span>
                      <span className="text-slate-800 truncate block text-[10px]">
                        {form.environment === 'PRODUCTION'
                          ? 'https://apijkn.bpjs-kesehatan.go.id/pcare-rest/v1'
                          : 'https://apijkn-dev.bpjs-kesehatan.go.id/pcare-rest-dev/v1'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[9px] font-sans font-bold">Antrean Mobile JKN:</span>
                      <span className="text-slate-800 truncate block text-[10px]">
                        {form.environment === 'PRODUCTION'
                          ? 'https://apijkn.bpjs-kesehatan.go.id/antreanrs'
                          : 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanrs_dev'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[9px] font-sans font-bold">VClaim / Rujukan:</span>
                      <span className="text-slate-800 truncate block text-[10px]">
                        {form.environment === 'PRODUCTION'
                          ? 'https://apijkn.bpjs-kesehatan.go.id/vclaim-rest'
                          : 'https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit & Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Kredensial disimpan aman &amp; terenkripsi lokal pada sistem faskes.
                  </span>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {hasPermission('manage_bpjs') && (
                    <Button
                      type="submit"
                      className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 text-xs shadow-xs rounded-xl cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Simpan Kredensial BPJS</span>
                    </Button>
                  )}
                  </div>
                </div>
              </form>
            </Card>

            {/* Section 2: Live Sync Logs & Bridging Telemetry */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-700" />
                    Riwayat Log &amp; Telemetri Bridging BPJS ({bpjsLogs.length})
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Rekam jejak pengiriman data real-time PCare, pengecekan kepesertaan, dan antrean online.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSyncLatestVisit}
                    disabled={isSyncingLatest || visits.length === 0}
                    className="text-xs font-bold gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 rounded-xl cursor-pointer shadow-2xs"
                  >
                    <Send className={`h-3 w-3 ${isSyncingLatest ? 'animate-spin' : ''}`} />
                    <span>Uji Kirim Kunjungan Terakhir</span>
                  </Button>

                  {bpjsLogs.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearBPJSLogs}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Bersihkan</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2">
                {(['ALL', 'SUCCESS', 'FAILED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLogFilter(filter)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      logFilter === filter
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'ALL' && `Semua (${bpjsLogs.length})`}
                    {filter === 'SUCCESS' && `Berhasil (${successLogsCount})`}
                    {filter === 'FAILED' && `Gagal (${failedLogsCount})`}
                  </button>
                ))}
              </div>

              {/* Logs Table */}
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <ShieldCheck className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">Belum ada catatan log bridging BPJS.</p>
                  <p className="text-[11px] text-slate-400">
                    Log pengiriman akan muncul secara otomatis saat pendaftaran atau pemeriksaan BPJS diproses.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/90 max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Waktu</th>
                        <th className="py-2.5 px-3">Layanan</th>
                        <th className="py-2.5 px-3">Pasien / No. BPJS</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Respons BPJS</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] font-bold bg-white text-slate-800 border-slate-300"
                            >
                              {log.service}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{log.patientName || 'Pasien BPJS'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.noKartuOrNik}</div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge
                              className={
                                log.status === 'SUCCESS'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold font-mono'
                                  : 'bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-bold font-mono'
                              }
                            >
                              {log.httpCode} {log.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-xs truncate">
                            {log.responseMessage}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {log.payloadSnippet ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedLogForJson(log)}
                                className="text-[10px] font-bold h-7 px-2 rounded-lg gap-1 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                              >
                                <FileCode className="h-3 w-3 text-emerald-700" />
                                <span>Response</span>
                              </Button>
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT COLUMN: Eligibility Tool, Automation Modules, and Integration Guide (5 Cols on XL) */}
          <div className="xl:col-span-5 space-y-5">
            {/* Section 3: Alat Cek Kepesertaan BPJS (Eligibility Check Tool - 100% Width of 5-col) */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Search className="h-4 w-4 text-emerald-700" />
                    Cek Kepesertaan &amp; Kelayakan BPJS
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Validasi real-time keaktifan kartu, hak kelas rawat, dan faskes tingkat 1.
                  </p>
                </div>
              </div>

              {/* Full Width Search Form */}
              <form onSubmit={handleCheckEligibility} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="No. BPJS (13 digit) atau NIK (16 digit)..."
                    value={eligibilityInput}
                    onChange={(e) => setEligibilityInput(e.target.value)}
                    maxLength={16}
                    className="bg-white h-10 rounded-xl font-mono text-xs flex-1 border-slate-300 focus:border-emerald-500"
                  />
                  <Button
                    type="submit"
                    disabled={isCheckingEligibility || !eligibilityInput}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-10 text-xs rounded-xl shrink-0 cursor-pointer shadow-xs gap-1.5 px-4"
                  >
                    <Search className={`h-3.5 w-3.5 ${isCheckingEligibility ? 'animate-spin' : ''}`} />
                    <span>{isCheckingEligibility ? 'Cek...' : 'Periksa'}</span>
                  </Button>
                </div>

                {/* Clickable Quick Sample Badges */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                    Contoh No. Kartu Pengujian:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleBPJSCards.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setEligibilityInput(item.code);
                          triggerEligibilityCheck(item.code);
                        }}
                        className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CreditCard className="h-3 w-3 text-emerald-600" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              {/* Eligibility Result Card */}
              {eligibilityResult && eligibilityResult.data ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border border-emerald-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-emerald-200/80">
                    <div>
                      <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>{eligibilityResult.data.nama}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                        No. Kartu: <strong className="text-slate-900">{eligibilityResult.data.noKartu}</strong>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono">
                        NIK: <strong className="text-slate-900">{eligibilityResult.data.nik}</strong>
                      </div>
                    </div>

                    <div className="text-right space-y-1 shrink-0">
                      <Badge className="bg-emerald-700 text-white text-[10px] font-bold block">
                        {eligibilityResult.data.statusPeserta.keterangan}
                      </Badge>
                      <Badge variant="outline" className="bg-white border-emerald-300 text-emerald-900 text-[10px] font-bold block">
                        {eligibilityResult.data.hakKelas.keterangan}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Jenis Peserta</span>
                      <span className="font-bold text-slate-800 text-[11px]">{eligibilityResult.data.jenisPeserta.keterangan}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Masa Berlaku</span>
                      <span className="font-bold text-slate-800 text-[11px]">s/d {eligibilityResult.data.tglAkhirBerlaku}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 space-y-0.5 sm:col-span-2">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Faskes Tingkat 1 Terdaftar</span>
                      <span className="font-bold text-slate-800 text-[11px] truncate block">
                        {eligibilityResult.data.faskesTk1.nmProvider} ({eligibilityResult.data.faskesTk1.kdProvider})
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-2">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                    <Shield className="h-4 w-4 text-emerald-700" />
                    <span>Fitur Verifikasi Kepesertaan Real-Time</span>
                  </div>
                  <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
                    <li>Memeriksa keaktifan kartu BPJS pasien sebelum entri antrean.</li>
                    <li>Menghindari klaim gagal karena premi menunggak atau faskes berbeda.</li>
                    <li>Otomatis membaca hak kelas rawat dan riwayat rujukan.</li>
                  </ul>
                </div>
              )}
            </Card>

            {/* Section 4: Modul & Otomatisasi Bridging */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-700" />
                    Otomatisasi &amp; Modul Layanan BPJS
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Aktifkan sinkronisasi otomatis untuk mempercepat pelayanan pendaftaran dan rekam medis.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Auto Bridging Registration */}
                <div
                  onClick={() => {
                    const nextVal = !form.autoBridgingRegistration;
                    setForm({ ...form, autoBridgingRegistration: nextVal });
                    updateBPJSConfig({ autoBridgingRegistration: nextVal });
                    toast.success(
                      nextVal
                        ? 'Auto-bridging Pendaftaran Pasien BPJS diaktifkan'
                        : 'Auto-bridging Pendaftaran Pasien BPJS dinonaktifkan'
                    );
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    form.autoBridgingRegistration
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/50'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-700" />
                      <span>Bridging Pendaftaran Otomatis (PCare)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Otomatis kirim nomor antrean &amp; kunjungan saat pasien BPJS mendaftar di loket.
                    </p>
                  </div>

                  <div
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                      form.autoBridgingRegistration ? 'bg-emerald-700' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        form.autoBridgingRegistration ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                {/* Auto Bridging Pelayanan / Kunjungan */}
                <div
                  onClick={() => {
                    const nextVal = !form.autoBridgingKunjungan;
                    setForm({ ...form, autoBridgingKunjungan: nextVal });
                    updateBPJSConfig({ autoBridgingKunjungan: nextVal });
                    toast.success(
                      nextVal
                        ? 'Auto-bridging Entri Pelayanan & Diagnosa PCare diaktifkan'
                        : 'Auto-bridging Entri Pelayanan & Diagnosa PCare dinonaktifkan'
                    );
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    form.autoBridgingKunjungan
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/50'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-emerald-700" />
                      <span>Bridging Pelayanan &amp; Diagnosa (ICD-10)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Saat dokter menyelesaikan asesmen medis, diagnosa &amp; terapi terkirim ke PCare.
                    </p>
                  </div>

                  <div
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                      form.autoBridgingKunjungan ? 'bg-emerald-700' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        form.autoBridgingKunjungan ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                {/* Antrean Online Module Badge */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-600" />
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">Antrean Online Mobile JKN</span>
                      <span className="text-[10px] text-slate-500">Integrasi antrean faskes dengan aplikasi Mobile JKN</span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                    Siap Pakai
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Section 5: Step-by-Step Integration Guide Card */}
            <Card className="border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-teal-50/50 shadow-xs p-5 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Panduan Integrasi Bridging BPJS FKTP
                  </h3>
                </div>
                <a
                  href="https://dvlp.bpjs-kesehatan.go.id"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-0.5"
                >
                  Portal BPJS <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <span className="flex h-4 w-4 rounded-full bg-emerald-700 text-white text-[9px] items-center justify-center font-bold">1</span>
                    <span>Pengajuan Trust Mark &amp; PKS</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-5.5">
                    Faskes mengajukan bridging sistem ke Kantor Cabang BPJS setempat untuk memperoleh akses developer Trust Mark.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <span className="flex h-4 w-4 rounded-full bg-emerald-700 text-white text-[9px] items-center justify-center font-bold">2</span>
                    <span>Input Kredensial API BPJS</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-5.5">
                    Masukkan <strong>Cons ID</strong>, <strong>Secret Key</strong>, <strong>User Key</strong>, dan <strong>Kode PPK</strong> pada form kredensial.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <span className="flex h-4 w-4 rounded-full bg-emerald-700 text-white text-[9px] items-center justify-center font-bold">3</span>
                    <span>Validasi HMAC-SHA256 &amp; Go-Live</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-5.5">
                    Klik tombol <strong>Uji Koneksi</strong> untuk verifikasi signature, lakukan uji coba pelayanan, lalu aktifkan mode Production.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* JSON Payload Viewer Modal */}
        {selectedLogForJson && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-emerald-700" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Response Web Service BPJS: {selectedLogForJson.service} ({selectedLogForJson.endpoint})
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      Pasien: {selectedLogForJson.patientName} ({selectedLogForJson.noKartuOrNik})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(selectedLogForJson.payloadSnippet || '', 'JSON Response')}
                    className="text-xs font-bold gap-1 h-7 rounded-lg border-slate-300 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Salin JSON</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLogForJson(null)}
                    className="text-xs font-bold h-7 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    ✕ Tutup
                  </Button>
                </div>
              </div>

              <div className="p-4 overflow-y-auto flex-1 bg-slate-900 text-slate-100 text-xs font-mono">
                <pre className="whitespace-pre-wrap">{selectedLogForJson.payloadSnippet}</pre>
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
                <span>Standard Web Service Trust Mark BPJS Kesehatan</span>
                <Button
                  size="sm"
                  onClick={() => setSelectedLogForJson(null)}
                  className="bg-slate-900 text-white text-xs font-bold h-7 rounded-lg cursor-pointer"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
