'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  fetchBackendKelurahan,
  BackendKelurahanItem,
} from '@/lib/api-client';
import {
  Home,
  Layers,
  Building,
  Building2,
  MapPin,
  Search,
  RefreshCw,
  Copy,
  Check,
  Globe,
  ChevronRight,
  Download,
  Info,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

function MasterWilayahKelurahanContent() {
  const searchParams = useSearchParams();
  const urlKecCode = searchParams.get('kode_kecamatan') || '';

  const [dataList, setDataList] = useState<BackendKelurahanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKecCode, setSelectedKecCode] = useState<string>(urlKecCode || 'ALL');
  const [selectedTipe, setSelectedTipe] = useState<string>('ALL');
  const [dataSource, setDataSource] = useState<'backend' | 'local_fallback'>('backend');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Sync if URL query param changes
  useEffect(() => {
    if (urlKecCode) {
      setSelectedKecCode(urlKecCode);
      setPage(1);
    }
  }, [urlKecCode]);

  // Pagination & Display
  const [limit, setLimit] = useState<number>(25);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(83762);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load kelurahan from backend
  const loadData = useCallback(
    async (query = '', kecCode = 'ALL', typeFilter = 'ALL', pageNum = 1, limitNum = 25) => {
      setIsLoading(true);
      try {
        const res = await fetchBackendKelurahan({
          search: query,
          kode_kecamatan: kecCode !== 'ALL' ? kecCode : undefined,
          tipe: typeFilter !== 'ALL' ? typeFilter : undefined,
          page: pageNum,
          limit: limitNum,
        });

        if (res.success && res.data) {
          setDataList(res.data);
          setTotalCount(res.total);
          setDataSource(res.source === 'local' ? 'local_fallback' : 'backend');
          setLastSynced(new Date());
        } else {
          toast.error(res.error || 'Gagal memuat data kelurahan/desa dari backend.');
        }
      } catch (err: any) {
        console.error('[loadKelurahan] Error:', err);
        toast.error('Terjadi kesalahan saat memuat data kelurahan/desa.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(searchQuery, selectedKecCode, selectedTipe, page, limit);
  }, [searchQuery, selectedKecCode, selectedTipe, page, limit, loadData]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    toast.loading('Menghubungi server backend http://43.129.38.25:30005/v1/wilayah/kelurahan...', {
      id: 'sync-kelurahan',
    });
    try {
      const res = await fetchBackendKelurahan({
        search: searchQuery,
        kode_kecamatan: selectedKecCode !== 'ALL' ? selectedKecCode : undefined,
        tipe: selectedTipe !== 'ALL' ? selectedTipe : undefined,
        page,
        limit,
      });

      if (res.success) {
        setDataList(res.data);
        setTotalCount(res.total);
        setDataSource(res.source === 'local' ? 'local_fallback' : 'backend');
        setLastSynced(new Date());
        toast.success(`Sinkronisasi berhasil! ${res.data.length} kelurahan/desa dimuat dari backend.`, {
          id: 'sync-kelurahan',
        });
      } else {
        toast.error(res.error || 'Gagal sinkronisasi data kelurahan/desa.', { id: 'sync-kelurahan' });
      }
    } catch (err: any) {
      toast.error('Gagal menghubungkan ke backend.', { id: 'sync-kelurahan' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success(`${label} (${text}) berhasil disalin!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!dataList || dataList.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const headers = ['Kode Kemendagri', 'Nama Kelurahan/Desa', 'Tipe', 'Kecamatan', 'Kode Kecamatan', 'Terakhir Diperbarui'];
    const rows = dataList.map((d) => [
      `"${d.kode}"`,
      `"${d.nama}"`,
      `"${d.tipe || 'desa'}"`,
      `"${d.kecamatan?.nama || '-'}"`,
      `"${d.kode_kecamatan || d.kecamatan?.kode || '-'}"`,
      `"${d.updated_at || d.created_at || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `master_wilayah_kelurahan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data master kelurahan/desa berhasil diekspor ke CSV!');
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!dataList || dataList.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataList, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `master_wilayah_kelurahan_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data master kelurahan/desa berhasil diekspor ke JSON!');
  };

  return (
    <MainLayout>
      <div className="space-y-6 w-full pb-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/settings" className="hover:text-emerald-700 transition-colors flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            <span>Pengaturan &amp; Master Data</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <Link href="/settings/wilayah" className="hover:text-emerald-700 transition-colors">
            Master Wilayah
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">Kelurahan &amp; Desa</span>
        </div>

        {/* Top 4-Segmented Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-2xl w-fit border border-slate-200/80">
          <Link
            href="/settings/wilayah"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
          >
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
            <span>Provinsi (38)</span>
          </Link>
          <Link
            href="/settings/wilayah/kabupaten-kota"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
          >
            <Building className="h-3.5 w-3.5 text-slate-500" />
            <span>Kabupaten &amp; Kota (514)</span>
          </Link>
          <Link
            href="/settings/wilayah/kecamatan"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
          >
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>Kecamatan (7.285)</span>
          </Link>
          <Link
            href="/settings/wilayah/kelurahan"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-emerald-800 shadow-xs border border-slate-200/60 transition-all"
          >
            <Home className="h-3.5 w-3.5 text-emerald-700" />
            <span>Kelurahan &amp; Desa (83.762)</span>
          </Link>
        </div>

        {/* Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
            <Home className="w-64 h-64 text-emerald-950" />
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Master Wilayah Kelurahan &amp; Desa
                </h1>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold px-2.5 py-0.5">
                  83.762 Desa/Kelurahan RI
                </Badge>
                {dataSource === 'backend' ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-semibold gap-1 px-2.5 py-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Backend API (/v1/wilayah/kelurahan)
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-semibold gap-1 px-2.5 py-0.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Lokal Fallback
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl">
                Master data 83.762 Kelurahan dan Desa seluruh Indonesia terintegrasi langsung ke backend server, standar Kemendagri &amp; BPS untuk alamat domisili terstruktur pasien dan interoperabilitas SATUSEHAT Kemenkes.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isLoading || dataList.length === 0}
              className="h-9.5 text-xs font-semibold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor CSV</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleExportJSON}
              disabled={isLoading || dataList.length === 0}
              className="h-9.5 text-xs font-semibold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>JSON</span>
            </Button>
            <Button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="h-9.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Backend'}</span>
            </Button>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Kelurahan &amp; Desa</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">83.762</h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Wilayah Tingkat IV RI</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Home className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-cyan-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Kecamatan Induk</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">7.285</h3>
                <p className="text-[11px] text-cyan-600 font-semibold mt-0.5">Wilayah Tingkat III</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Kabupaten &amp; Kota</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">514</h3>
                <p className="text-[11px] text-teal-600 font-semibold mt-0.5">416 Kab &bull; 98 Kota</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Building className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Status Server Backend</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-base font-bold text-slate-900">Aktif &bull; Terhubung</h3>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                  {lastSynced ? `Sinkron: ${lastSynced.toLocaleTimeString('id-ID')}` : 'Endpoint: /v1/wilayah/kelurahan'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Active Kecamatan Filter Banner */}
        {selectedKecCode !== 'ALL' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs text-emerald-900 shadow-2xs animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold">Filter Aktif Kecamatan: </span>
                <span className="font-extrabold text-emerald-950 font-mono">Kode {selectedKecCode}</span>
                <span className="text-emerald-700 ml-1.5">(Menampilkan desa/kelurahan dari kecamatan induk ini)</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedKecCode('ALL');
                setPage(1);
              }}
              className="h-7.5 text-xs bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300 rounded-xl px-3 font-semibold shrink-0"
            >
              Tampilkan Semua Kelurahan &amp; Desa (83.762)
            </Button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <Card className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari kelurahan/desa (misal: Gondangdia, Cikini, 3171061004)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-xs rounded-xl border-slate-300 focus-visible:ring-emerald-600 h-9.5"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Filter Tipe */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <select
                  value={selectedTipe}
                  onChange={(e) => {
                    setSelectedTipe(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="ALL">Semua Tipe (Kelurahan &amp; Desa)</option>
                  <option value="kelurahan">Kelurahan</option>
                  <option value="desa">Desa</option>
                </select>
              </div>

              {/* Limit per page */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-9 text-xs rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value={10}>10 / Hal</option>
                  <option value={25}>25 / Hal</option>
                  <option value={50}>50 / Hal</option>
                  <option value={100}>100 / Hal</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 font-medium whitespace-nowrap ml-auto md:ml-0">
                Total: <span className="font-bold text-slate-900">{totalCount}</span> Desa/Kel
              </div>
            </div>
          </div>
        </Card>

        {/* Master Data Table */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 w-14 text-center">No</th>
                  <th className="py-3.5 px-4 w-36">Kode Kemendagri</th>
                  <th className="py-3.5 px-4">Nama Kelurahan / Desa</th>
                  <th className="py-3.5 px-4 text-center">Tipe</th>
                  <th className="py-3.5 px-4">Kecamatan Induk</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4 text-center"><div className="h-4 w-6 bg-slate-200 rounded mx-auto" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-20 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-44 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-5 w-16 bg-slate-200 rounded mx-auto" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-32 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-5 w-14 bg-slate-200 rounded mx-auto" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-7 w-20 bg-slate-200 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : dataList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Home className="h-10 w-10 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">Tidak ada kelurahan/desa ditemukan</p>
                        <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau lakukan sinkronisasi backend.</p>
                        <Button
                          onClick={handleManualSync}
                          variant="outline"
                          className="mt-2 text-xs rounded-xl h-8"
                        >
                          Sinkronkan Ulang
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dataList.map((item, index) => {
                    const rowNumber = (page - 1) * limit + index + 1;
                    const isKel = item.tipe === 'kelurahan' || item.nama.toUpperCase().startsWith('KELURAHAN');

                    return (
                      <tr
                        key={item.kode || index}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* No */}
                        <td className="py-3 px-4 text-center font-medium text-slate-400 text-[11px]">
                          {rowNumber}
                        </td>

                        {/* Kode Kemendagri */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleCopy(item.kode, 'Kode Kelurahan/Desa')}
                            title="Klik untuk salin kode"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-mono font-bold text-xs transition-colors border border-slate-200/80 cursor-pointer"
                          >
                            <span>{item.kode}</span>
                            {copiedCode === item.kode ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100" />
                            )}
                          </button>
                        </td>

                        {/* Nama Kelurahan / Desa */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {item.nama}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Wilayah Administrasi Tingkat IV
                          </span>
                        </td>

                        {/* Tipe */}
                        <td className="py-3 px-4 text-center">
                          {isKel ? (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold py-0.5">
                              Kelurahan
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold py-0.5">
                              Desa
                            </Badge>
                          )}
                        </td>

                        {/* Kecamatan Induk */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 text-xs">
                            {item.kecamatan?.nama || 'KECAMATAN'}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            Kode: {item.kode_kecamatan || item.kecamatan?.kode || '-'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                            Aktif
                          </Badge>
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(item.kode, 'Kode Kelurahan/Desa')}
                              className="h-7.5 px-2.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl font-semibold gap-1"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Salin Kode</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Info & Pagination */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>
                Menampilkan {dataList.length} dari {totalCount} kelurahan/desa terdaftar nasional.
              </span>
            </div>

            {totalCount > limit && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 text-xs rounded-lg px-2.5"
                >
                  Sebelumnya
                </Button>
                <span className="px-2 font-semibold text-slate-700">
                  Halaman {page} dari {Math.ceil(totalCount / limit)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(totalCount / limit) || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 text-xs rounded-lg px-2.5"
                >
                  Berikutnya
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

export default function MasterWilayahKelurahanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-600">
              Memuat Master Data Kelurahan &amp; Desa...
            </p>
          </div>
        </div>
      }
    >
      <MasterWilayahKelurahanContent />
    </Suspense>
  );
}
