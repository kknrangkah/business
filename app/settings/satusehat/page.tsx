'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Globe,
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
  Clock,
  ArrowRight,
  Shield,
  Layers,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { SatuSehatEnvironment, SatuSehatLog } from '@/types/rme';

export default function SatuSehatIntegrationPage() {
  const {
    satuSehatConfig,
    satuSehatLogs,
    updateSatuSehatConfig,
    testSatuSehatConnection,
    lookupPatientIHS,
    lookupPractitionerIHS,
    syncVisitToSatuSehat,
    clearSatuSehatLogs,
    visits,
    config,
    hasPermission,
  } = useRME();

  // Local Form State
  const [form, setForm] = useState({
    organizationId: satuSehatConfig.organizationId,
    clientId: satuSehatConfig.clientId,
    clientSecret: satuSehatConfig.clientSecret,
    environment: satuSehatConfig.environment,
    locationId: satuSehatConfig.locationId || '',
    locationName: satuSehatConfig.locationName || '',
    autoSyncOnComplete: satuSehatConfig.autoSyncOnComplete,
    syncDiagnoses: satuSehatConfig.syncDiagnoses,
    syncVitalSigns: satuSehatConfig.syncVitalSigns,
    syncPrescriptions: satuSehatConfig.syncPrescriptions,
    syncProcedures: satuSehatConfig.syncProcedures,
  });

  const [showSecret, setShowSecret] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSyncingLatest, setIsSyncingLatest] = useState(false);
  const [logFilter, setLogFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [selectedLogForJson, setSelectedLogForJson] = useState<SatuSehatLog | null>(null);

  // IHS Lookup Tool State
  const [patientNikInput, setPatientNikInput] = useState('');
  const [patientLookupResult, setPatientLookupResult] = useState<{
    ihsNumber?: string;
    patientName?: string;
    message?: string;
    success?: boolean;
  } | null>(null);
  const [isLookingUpPatient, setIsLookingUpPatient] = useState(false);

  const [practitionerQueryInput, setPractitionerQueryInput] = useState('');
  const [practitionerLookupResult, setPractitionerLookupResult] = useState<{
    ihsNumber?: string;
    practitionerName?: string;
    message?: string;
    success?: boolean;
  } | null>(null);
  const [isLookingUpPractitioner, setIsLookingUpPractitioner] = useState(false);

  // Sample quick buttons for testing
  const samplePatientNIKs = [
    { label: '3174012345670001', name: 'Contoh NIK Pasien 1' },
    { label: '3174023456780002', name: 'Contoh NIK Pasien 2' },
  ];

  const samplePractitioners = [
    { label: config.doctorName || 'Nama Dokter', query: config.doctorName || '' },
  ];

  // Save Credentials
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSatuSehatConfig({
      organizationId: form.organizationId.trim(),
      clientId: form.clientId.trim(),
      clientSecret: form.clientSecret.trim(),
      environment: form.environment,
      locationId: form.locationId.trim(),
      locationName: form.locationName.trim(),
      autoSyncOnComplete: form.autoSyncOnComplete,
      syncDiagnoses: form.syncDiagnoses,
      syncVitalSigns: form.syncVitalSigns,
      syncPrescriptions: form.syncPrescriptions,
      syncProcedures: form.syncProcedures,
    });
    toast.success('Konfigurasi kredensial SATUSEHAT berhasil disimpan!');
  };

  // Test Connection
  const handleTestConnection = async () => {
    if (!form.organizationId || !form.clientId || !form.clientSecret) {
      toast.error('Harap lengkapi Organization ID, Client ID, dan Client Secret sebelum menguji koneksi.');
      return;
    }

    setIsTestingConnection(true);
    const toastId = toast.loading('Menghubungkan ke server otentikasi SATUSEHAT Kemenkes...');

    try {
      const res = await testSatuSehatConnection({
        organizationId: form.organizationId.trim(),
        clientId: form.clientId.trim(),
        clientSecret: form.clientSecret.trim(),
        environment: form.environment,
      });

      if (res.success) {
        toast.success(res.message, { id: toastId });
      } else {
        toast.error(res.message, { id: toastId });
      }
    } catch {
      toast.error('Gagal terhubung ke SATUSEHAT: Terjadi kesalahan jaringan.', { id: toastId });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Fill Sandbox Demo Credentials
  const handleFillDemoSandbox = () => {
    const demoSandbox = {
      organizationId: '10000004',
      clientId: '10000004-987a-4bc3-9123-abcdef123456',
      clientSecret: 'sec_kemenkes_sandbox_89712a34bcde',
      environment: 'SANDBOX' as SatuSehatEnvironment,
      locationId: 'b017aa54-f1df-4ec2-9d84-882cb502094e',
      locationName: 'Ruang Pemeriksaan Umum (Poli Rawat Jalan 1)',
    };

    setForm((prev) => ({
      ...prev,
      ...demoSandbox,
    }));

    updateSatuSehatConfig({
      ...demoSandbox,
      isConnected: true,
      lastConnectedAt: new Date().toISOString(),
    });

    toast.success('Kredensial Demo Sandbox DTO Kemenkes berhasil dimuat!');
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin ke clipboard!`);
  };

  // IHS Patient Lookup
  const triggerPatientLookup = async (nik: string) => {
    if (!nik) return;
    setIsLookingUpPatient(true);
    const res = await lookupPatientIHS(nik);
    setPatientLookupResult(res);
    setIsLookingUpPatient(false);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleLookupPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerPatientLookup(patientNikInput);
  };

  // IHS Practitioner Lookup
  const triggerPractitionerLookup = async (query: string) => {
    if (!query) return;
    setIsLookingUpPractitioner(true);
    const res = await lookupPractitionerIHS(query);
    setPractitionerLookupResult(res);
    setIsLookingUpPractitioner(false);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleLookupPractitioner = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerPractitionerLookup(practitionerQueryInput);
  };

  // Sync Latest Visit Test
  const handleSyncLatestVisit = async () => {
    if (visits.length === 0) {
      toast.error('Tidak ada data kunjungan pasien untuk disinkronisasi.');
      return;
    }
    const latestVisit = visits[0];
    setIsSyncingLatest(true);
    const toastId = toast.loading(`Mengirim data kunjungan ${latestVisit.patient.name} ke SATUSEHAT...`);

    const res = await syncVisitToSatuSehat(latestVisit.id);
    setIsSyncingLatest(false);

    if (res.success) {
      toast.success(res.message, { id: toastId });
    } else {
      toast.error(res.message, { id: toastId });
    }
  };

  // Filtered Logs
  const filteredLogs = satuSehatLogs.filter((log) => {
    if (logFilter === 'SUCCESS') return log.status === 'SUCCESS';
    if (logFilter === 'FAILED') return log.status === 'FAILED';
    return true;
  });

  const successLogsCount = satuSehatLogs.filter((l) => l.status === 'SUCCESS').length;
  const failedLogsCount = satuSehatLogs.filter((l) => l.status === 'FAILED').length;

  return (
    <MainLayout>
      <div className="space-y-5 w-full">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Integrasi SATUSEHAT Kemenkes RI
                </h1>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                  Permenkes No. 24/2022
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono font-bold border-slate-300 text-slate-600">
                  HL7 FHIR R4 Ready
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pengaturan autentikasi OAuth2, Organization ID, Client ID, Client Secret, serta telemetri FHIR R4 faskes.
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
              <span>{isTestingConnection ? 'Menguji OAuth2...' : 'Uji Koneksi (OAuth2 Ping)'}</span>
            </Button>
          </div>
        </div>

        {/* Top KPI Metrics Row (4 Columns - Full Width Balance) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Status Koneksi */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Koneksi OAuth2</span>
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center border ${
                  satuSehatConfig.isConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {satuSehatConfig.isConnected ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    satuSehatConfig.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="text-sm font-black text-slate-900">
                  {satuSehatConfig.isConnected ? 'TERHUBUNG (ONLINE)' : 'BELUM TERHUBUNG'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {satuSehatConfig.lastConnectedAt
                  ? `Aktif: ${new Date(satuSehatConfig.lastConnectedAt).toLocaleTimeString('id-ID', {
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
                {satuSehatConfig.environment === 'PRODUCTION' ? 'PRODUCTION (LIVE)' : 'SANDBOX (DTO STAGING)'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">
                {satuSehatConfig.environment === 'PRODUCTION'
                  ? 'api-satusehat.kemkes.go.id'
                  : 'api-satusehat-stg.kemkes.go.id'}
              </p>
            </div>
          </Card>

          {/* KPI 3: Identitas Organisasi */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Organization ID</span>
              <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 font-mono block truncate">
                {satuSehatConfig.organizationId || 'Belum diisi'}
              </span>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                Faskes: <strong className="text-slate-700">{config.practiceName}</strong>
              </p>
            </div>
          </Card>

          {/* KPI 4: Telemetri Pengiriman */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aktivitas FHIR R4</span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 block">
                {satuSehatLogs.length} Total Bundle
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
            {/* Section 1: Main Credentials Configuration Form */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-emerald-700" />
                    Kredensial API &amp; Otentikasi SATUSEHAT
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Dapatkan Organization ID, Client ID, dan Client Secret via portal resmi{' '}
                    <a
                      href="https://satusehat.kemkes.go.id/platform"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 underline font-bold inline-flex items-center gap-0.5"
                    >
                      satusehat.kemkes.go.id/platform <ExternalLink className="h-3 w-3 inline" />
                    </a>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-5">
                {/* Environment Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between text-xs">
                    <span>Lingkungan API (Environment)</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Pilih Sandbox untuk simulasi DTO atau Live untuk faskes terdaftar
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Sandbox Option */}
                    <div
                      onClick={() => setForm({ ...form, environment: 'SANDBOX' })}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-1.5 ${
                        form.environment === 'SANDBOX'
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                          <Server className="h-3.5 w-3.5 text-emerald-700" />
                          Sandbox / Staging (Uji Coba DTO)
                        </span>
                        {form.environment === 'SANDBOX' && (
                          <Check className="h-4 w-4 text-emerald-700 font-bold" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        https://api-satusehat-stg.kemkes.go.id
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
                          <Globe className="h-3.5 w-3.5 text-emerald-700" />
                          Production (Live Faskes Kemenkes)
                        </span>
                        {form.environment === 'PRODUCTION' && (
                          <Check className="h-4 w-4 text-emerald-700 font-bold" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        https://api-satusehat.kemkes.go.id
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2-Column Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Organization ID */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Organization ID (Org ID Kemenkes)</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      {form.organizationId && (
                        <button
                          type="button"
                          onClick={() => handleCopy(form.organizationId, 'Organization ID')}
                          className="text-[10px] text-slate-400 hover:text-emerald-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" /> Salin
                        </button>
                      )}
                    </div>
                    <Input
                      required
                      placeholder="e.g. 10000004"
                      value={form.organizationId}
                      onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
                      className="bg-white h-9 rounded-xl font-mono font-bold text-xs"
                    />
                    <p className="text-[10px] text-slate-400">
                      ID Organisasi faskes yang diterbitkan oleh Kemenkes RI (DTO).
                    </p>
                  </div>

                  {/* Location ID / Ruang Poli */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <Server className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Location ID Faskes (FHIR Location UUID)</span>
                      </label>
                    </div>
                    <Input
                      placeholder="e.g. b017aa54-f1df-4ec2-9d84-882cb502094e"
                      value={form.locationId}
                      onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                      className="bg-white h-9 rounded-xl font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-400">
                      UUID Ruang Poli terdaftar di SATUSEHAT Location resource.
                    </p>
                  </div>

                  {/* Client ID */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <KeyRound className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Client ID (Consumer Key)</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      {form.clientId && (
                        <button
                          type="button"
                          onClick={() => handleCopy(form.clientId, 'Client ID')}
                          className="text-[10px] text-slate-400 hover:text-emerald-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" /> Salin
                        </button>
                      )}
                    </div>
                    <Input
                      required
                      placeholder="e.g. 10000004-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={form.clientId}
                      onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                      className="bg-white h-9 rounded-xl font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-400">
                      Client ID unik dari dashboard integrasi DTO Kemenkes.
                    </p>
                  </div>

                  {/* Client Secret */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Client Secret (Secret Key)</span>
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
                        placeholder="e.g. sec_kemenkes_live_xxxxxxxx"
                        value={form.clientSecret}
                        onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
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
                      Kunci rahasia untuk otentikasi token JWT OAuth2.
                    </p>
                  </div>
                </div>

                {/* Endpoints Info Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                    <Server className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Base Endpoint URLs SATUSEHAT:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-mono">
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[9px] font-sans font-bold">OAuth 2.0 Auth URL:</span>
                      <span className="text-slate-800 truncate block text-[10px]">
                        {form.environment === 'PRODUCTION'
                          ? 'https://api-satusehat.kemkes.go.id/oauth2/v1'
                          : 'https://api-satusehat-stg.kemkes.go.id/oauth2/v1'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[9px] font-sans font-bold">FHIR R4 API Base URL:</span>
                      <span className="text-slate-800 truncate block text-[10px]">
                        {form.environment === 'PRODUCTION'
                          ? 'https://api-satusehat.kemkes.go.id/fhir-r4/v1'
                          : 'https://api-satusehat-stg.kemkes.go.id/fhir-r4/v1'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit & Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Pastikan seluruh data kredensial sesuai dengan akun faskes di DTO Kemenkes.
                  </span>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {hasPermission('manage_satusehat') && (
                    <Button
                      type="submit"
                      className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 text-xs shadow-xs rounded-xl cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Simpan Kredensial SATUSEHAT</span>
                    </Button>
                  )}
                  </div>
                </div>
              </form>
            </Card>

            {/* Section 2: Live Sync Logs & FHIR Telemetry */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-700" />
                    Riwayat Log &amp; Telemetri FHIR ({satuSehatLogs.length})
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Rekam jejak pengiriman data real-time encounter, condition, observation, dan resep ke server Kemenkes.
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

                  {satuSehatLogs.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSatuSehatLogs}
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
                    {filter === 'ALL' && `Semua (${satuSehatLogs.length})`}
                    {filter === 'SUCCESS' && `Berhasil (${successLogsCount})`}
                    {filter === 'FAILED' && `Gagal (${failedLogsCount})`}
                  </button>
                ))}
              </div>

              {/* Logs Table */}
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <Globe className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">Belum ada catatan log pengiriman.</p>
                  <p className="text-[11px] text-slate-400">
                    Log pengiriman akan muncul secara otomatis saat data pemeriksaan pasien dikirim ke SatuSehat.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/90 max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Waktu</th>
                        <th className="py-2.5 px-3">Resource FHIR</th>
                        <th className="py-2.5 px-3">Pasien &amp; No. RM</th>
                        <th className="py-2.5 px-3">Status HTTP</th>
                        <th className="py-2.5 px-3">Respons Kemenkes</th>
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
                              {log.resourceType}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{log.patientName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.noRM}</div>
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
                                <span>Lihat JSON</span>
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

          {/* RIGHT COLUMN: IHS Lookup Tools, FHIR Resource Scope, and Guide (5 Cols on XL) */}
          <div className="xl:col-span-5 space-y-5">
            {/* Section 3: Interactive IHS Lookup Tools (Pasien & Nakes - 100% Width of 5-col) */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Search className="h-4 w-4 text-emerald-700" />
                    Alat Cek IHS ID Kemenkes (Lookup)
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Pengecekan nomor IHS resmi untuk pasien (NIK KTP) dan tenaga medis (Dokter / Nakes).
                  </p>
                </div>
              </div>

              {/* Tool 1: IHS Pasien */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-700" />
                    Cek IHS Pasien (by NIK 16 Digit)
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Masukkan 16 digit NIK Pasien untuk memverifikasi IHS Patient ID di SatuSehat.
                  </p>
                </div>

                <form onSubmit={handleLookupPatient} className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Masukkan 16 digit NIK KTP..."
                      value={patientNikInput}
                      onChange={(e) => setPatientNikInput(e.target.value)}
                      maxLength={16}
                      className="bg-white h-9 rounded-xl font-mono text-xs flex-1 border-slate-300 focus:border-emerald-500"
                    />
                    <Button
                      type="submit"
                      disabled={isLookingUpPatient || !patientNikInput}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 text-xs rounded-xl shrink-0 cursor-pointer shadow-xs gap-1.5 px-3"
                    >
                      <Search className={`h-3.5 w-3.5 ${isLookingUpPatient ? 'animate-spin' : ''}`} />
                      <span>{isLookingUpPatient ? 'Cari...' : 'Cari IHS'}</span>
                    </Button>
                  </div>

                  {/* Sample NIK Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {samplePatientNIKs.map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => {
                          setPatientNikInput(sample.label);
                          triggerPatientLookup(sample.label);
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </form>

                {patientLookupResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 animate-in fade-in duration-150 ${
                      patientLookupResult.success
                        ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{patientLookupResult.patientName}</span>
                      {patientLookupResult.ihsNumber && (
                        <Badge className="bg-emerald-700 text-white font-mono text-[10px] font-bold">
                          {patientLookupResult.ihsNumber}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {patientLookupResult.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Tool 2: IHS Nakes / Practitioner */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <Stethoscope className="h-3.5 w-3.5 text-emerald-700" />
                    Cek IHS Practitioner (Dokter / Nakes)
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Cari IHS Dokter berdasarkan Nomor SIP, NIK, atau Nama Dokter.
                  </p>
                </div>

                <form onSubmit={handleLookupPractitioner} className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. dr. Budi Santoso atau SIP..."
                      value={practitionerQueryInput}
                      onChange={(e) => setPractitionerQueryInput(e.target.value)}
                      className="bg-white h-9 rounded-xl text-xs flex-1 border-slate-300 focus:border-emerald-500"
                    />
                    <Button
                      type="submit"
                      disabled={isLookingUpPractitioner || !practitionerQueryInput}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 text-xs rounded-xl shrink-0 cursor-pointer shadow-xs gap-1.5 px-3"
                    >
                      <Search className={`h-3.5 w-3.5 ${isLookingUpPractitioner ? 'animate-spin' : ''}`} />
                      <span>{isLookingUpPractitioner ? 'Cari...' : 'Cari IHS'}</span>
                    </Button>
                  </div>

                  {/* Sample Practitioner Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {samplePractitioners.map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => {
                          setPractitionerQueryInput(sample.query);
                          triggerPractitionerLookup(sample.query);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </form>

                {practitionerLookupResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 animate-in fade-in duration-150 ${
                      practitionerLookupResult.success
                        ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{practitionerLookupResult.practitionerName}</span>
                      {practitionerLookupResult.ihsNumber && (
                        <Badge className="bg-emerald-700 text-white font-mono text-[10px] font-bold">
                          {practitionerLookupResult.ihsNumber}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {practitionerLookupResult.message}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Section 4: Automation & FHIR R4 Resource Scope */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-700" />
                    Otomatisasi &amp; Ruang Lingkup Data FHIR R4
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Profil resource HL7 FHIR yang dikirim otomatis ke Kemenkes saat pemeriksaan selesai.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Auto Sync Switch */}
                <div
                  onClick={() => {
                    const nextVal = !form.autoSyncOnComplete;
                    setForm({ ...form, autoSyncOnComplete: nextVal });
                    updateSatuSehatConfig({ autoSyncOnComplete: nextVal });
                    toast.success(
                      nextVal
                        ? 'Auto-sync SATUSEHAT diaktifkan (kirim otomatis saat pemeriksaan selesai)'
                        : 'Auto-sync SATUSEHAT dinonaktifkan'
                    );
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    form.autoSyncOnComplete
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/50'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-700" />
                      <span>Kirim Otomatis ke SATUSEHAT saat Pemeriksaan Selesai</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Saat dokter menekan tombol selesai pemeriksaan, sistem otomatis mengirim bundle FHIR R4.
                    </p>
                  </div>

                  <div
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                      form.autoSyncOnComplete ? 'bg-emerald-700' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        form.autoSyncOnComplete ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                {/* Individual Resource Switches Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Encounter */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">Wajib</Badge>
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">Encounter (Kunjungan)</div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Registrasi rawat jalan, waktu kunjungan, dan dokter penanggung jawab.
                    </p>
                  </div>

                  {/* Condition (ICD-10) */}
                  <div
                    onClick={() => {
                      const nextVal = !form.syncDiagnoses;
                      setForm({ ...form, syncDiagnoses: nextVal });
                      updateSatuSehatConfig({ syncDiagnoses: nextVal });
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      form.syncDiagnoses ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-bold">ICD-10</Badge>
                      <div
                        className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                          form.syncDiagnoses ? 'bg-emerald-700' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform ${
                            form.syncDiagnoses ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-900">Condition (Diagnosa)</div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Diagnosa primer &amp; sekunder terkodifikasi ICD-10 resmi.
                    </p>
                  </div>

                  {/* Observation (TTV) */}
                  <div
                    onClick={() => {
                      const nextVal = !form.syncVitalSigns;
                      setForm({ ...form, syncVitalSigns: nextVal });
                      updateSatuSehatConfig({ syncVitalSigns: nextVal });
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      form.syncVitalSigns ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-bold">LOINC</Badge>
                      <div
                        className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                          form.syncVitalSigns ? 'bg-emerald-700' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform ${
                            form.syncVitalSigns ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-900">Observation (TTV)</div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Tanda vital (TD, Nadi, Suhu, RR, BMI) terpetakan ke standar LOINC.
                    </p>
                  </div>

                  {/* MedicationRequest */}
                  <div
                    onClick={() => {
                      const nextVal = !form.syncPrescriptions;
                      setForm({ ...form, syncPrescriptions: nextVal });
                      updateSatuSehatConfig({ syncPrescriptions: nextVal });
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      form.syncPrescriptions ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-bold">KFA Kemenkes</Badge>
                      <div
                        className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                          form.syncPrescriptions ? 'bg-emerald-700' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform ${
                            form.syncPrescriptions ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-900">MedicationRequest</div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Resep obat dokter, dosis, aturan pakai, &amp; dispensing farmasi.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 5: Step-by-Step Integration Guide Card */}
            <Card className="border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-teal-50/50 shadow-xs p-5 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Panduan Integrasi SATUSEHAT Kemenkes RI
                  </h3>
                </div>
                <a
                  href="https://satusehat.kemkes.go.id/platform"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-0.5"
                >
                  Portal DTO <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <span className="flex h-4 w-4 rounded-full bg-emerald-700 text-white text-[9px] items-center justify-center font-bold">1</span>
                    <span>Registrasi Akun DTO Kemenkes</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-5.5">
                    Daftarkan faskes di portal resmi DTO Kemenkes RI menggunakan akun penanggung jawab faskes.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <span className="flex h-4 w-4 rounded-full bg-emerald-700 text-white text-[9px] items-center justify-center font-bold">2</span>
                    <span>Input Kredensial API</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-5.5">
                    Salin <strong>Organization ID</strong>, <strong>Client ID</strong>, dan <strong>Client Secret</strong> ke form kredensial.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <span className="flex h-4 w-4 rounded-full bg-emerald-700 text-white text-[9px] items-center justify-center font-bold">3</span>
                    <span>Uji &amp; Aktifkan Auto-Sync</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-5.5">
                    Klik <strong>Uji Koneksi OAuth2</strong>, lalu aktifkan Auto-Sync untuk rekam medis terhubung real-time sesuai Permenkes No. 24/2022.
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
                      Payload FHIR R4: {selectedLogForJson.resourceType}
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      Pasien: {selectedLogForJson.patientName} ({selectedLogForJson.noRM})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(selectedLogForJson.payloadSnippet || '', 'JSON Payload')}
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
                <span>Standar HL7 FHIR Release 4 Kemenkes RI</span>
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
