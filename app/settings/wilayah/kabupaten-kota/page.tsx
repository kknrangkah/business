'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import {
  fetchBackendKabupatenKota,
  fetchBackendProvinces,
  BackendKabupatenKotaItem,
  BackendProvinceItem,
} from '@/lib/api-client';
import { INDONESIA_REGIONS, DistrictHierarchy } from '@/lib/indonesia-regions';
import {
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
  Filter,
  Layers,
  Info,
  Map,
  Home,
  X,
  Compass,
} from 'lucide-react';
import { toast } from 'sonner';

function MasterWilayahKabupatenKotaContent() {
  const searchParams = useSearchParams();
  const urlProvCode = searchParams.get('kode_provinsi') || '';

  const [dataList, setDataList] = useState<BackendKabupatenKotaItem[]>([]);
  const [provinces, setProvinces] = useState<BackendProvinceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>(urlProvCode || 'ALL');
  const [selectedTipe, setSelectedTipe] = useState<string>('ALL');
  const [dataSource, setDataSource] = useState<'backend' | 'local_fallback'>('backend');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Sync if URL searchParams changes
  useEffect(() => {
    if (urlProvCode) {
      setSelectedProvinceCode(urlProvCode);
      setPage(1);
    }
  }, [urlProvCode]);

  // Pagination & Display
  const [limit, setLimit] = useState<number>(25);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(514);

  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState<BackendKabupatenKotaItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailSearch, setDetailSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load provinces list for dropdown filter
  useEffect(() => {
    fetchBackendProvinces({ limit: 100 })
      .then((res) => {
        if (res.success && res.data) {
          setProvinces(res.data);
        }
      })
      .catch((err) => console.warn('[LoadProvinces] Error:', err));
  }, []);

  // Load kabupaten / kota from backend
  const loadData = useCallback(
    async (
      query = '',
      provCode = 'ALL',
      typeFilter = 'ALL',
      pageNum = 1,
      limitNum = 25
    ) => {
      setIsLoading(true);
      try {
        const res = await fetchBackendKabupatenKota({
          search: query,
          kode_provinsi: provCode !== 'ALL' ? provCode : undefined,
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
          toast.error(res.error || 'Gagal memuat data kabupaten/kota dari backend.');
        }
      } catch (err: any) {
        console.error('[loadKabupatenKota] Error:', err);
        toast.error('Terjadi kesalahan saat memuat data kabupaten/kota.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(searchQuery, selectedProvinceCode, selectedTipe, page, limit);
  }, [searchQuery, selectedProvinceCode, selectedTipe, page, limit, loadData]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    toast.loading('Menghubungi server backend http://43.129.38.25:30005/v1/wilayah/kabupaten-kota...', {
      id: 'sync-kabkota',
    });
    try {
      const res = await fetchBackendKabupatenKota({
        search: searchQuery,
        kode_provinsi: selectedProvinceCode !== 'ALL' ? selectedProvinceCode : undefined,
        tipe: selectedTipe !== 'ALL' ? selectedTipe : undefined,
        page,
        limit,
      });

      if (res.success) {
        setDataList(res.data);
        setTotalCount(res.total);
        setDataSource(res.source === 'local' ? 'local_fallback' : 'backend');
        setLastSynced(new Date());
        toast.success(`Sinkronisasi berhasil! ${res.data.length} daerah dimuat dari backend.`, {
          id: 'sync-kabkota',
        });
      } else {
        toast.error(res.error || 'Gagal sinkronisasi data kabupaten/kota.', { id: 'sync-kabkota' });
      }
    } catch (err: any) {
      toast.error('Gagal menghubungkan ke backend.', { id: 'sync-kabkota' });
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

  // Hierarchy lookup: find districts for selected kabupaten/kota
  const getCityDistricts = useCallback((item: BackendKabupatenKotaItem) => {
    const norm = item.nama.toLowerCase().trim();
    const cleanNorm = norm.replace(/^(kota|kabupaten|kab|kota administrasi|kabupaten administrasi)\s+/i, '');

    for (const prov of INDONESIA_REGIONS) {
      for (const city of prov.cities) {
        const cNorm = city.name.toLowerCase().trim();
        const cleanCNorm = cNorm.replace(/^(kota|kabupaten|kab|kota administrasi|kabupaten administrasi)\s+/i, '');

        if (
          city.code === item.kode ||
          city.code?.replace('.', '') === item.kode ||
          cNorm === norm ||
          cleanCNorm === cleanNorm
        ) {
          return {
            districts: city.districts || [],
            totalDistricts: city.districts?.length || 0,
            cityMatched: city,
          };
        }
      }
    }

    return {
      districts: [],
      totalDistricts: 0,
      cityMatched: null,
    };
  }, []);

  const openDetailModal = (item: BackendKabupatenKotaItem) => {
    setSelectedItem(item);
    setDetailSearch('');
    setIsDetailOpen(true);
  };

  const selectedDetails = useMemo(() => {
    if (!selectedItem) return null;
    return getCityDistricts(selectedItem);
  }, [selectedItem, getCityDistricts]);

  const filteredDistricts = useMemo(() => {
    if (!selectedDetails?.districts) return [];
    if (!detailSearch.trim()) return selectedDetails.districts;
    const q = detailSearch.toLowerCase().trim();
    return selectedDetails.districts.filter((d) => d.name.toLowerCase().includes(q));
  }, [selectedDetails, detailSearch]);

  // Export CSV
  const handleExportCSV = () => {
    if (!dataList || dataList.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const headers = ['Kode Kemendagri', 'Nama Daerah', 'Tipe', 'Provinsi', 'Kode Provinsi', 'Terakhir Diperbarui'];
    const rows = dataList.map((d) => [
      `"${d.kode}"`,
      `"${d.nama}"`,
      `"${d.tipe || (d.nama.startsWith('KOTA') ? 'kota' : 'kabupaten')}"`,
      `"${d.provinsi?.nama || '-'}"`,
      `"${d.kode_provinsi || d.provinsi?.kode || '-'}"`,
      `"${d.updated_at || d.created_at || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `master_wilayah_kabupaten_kota_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data master kabupaten/kota berhasil diekspor ke CSV!');
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
    link.setAttribute('download', `master_wilayah_kabupaten_kota_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data master kabupaten/kota berhasil diekspor ke JSON!');
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
          <span className="text-slate-900 font-semibold">Kabupaten &amp; Kota</span>
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-emerald-800 shadow-xs border border-slate-200/60 transition-all"
          >
            <Building className="h-3.5 w-3.5 text-emerald-700" />
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
          >
            <Home className="h-3.5 w-3.5 text-slate-500" />
            <span>Kelurahan &amp; Desa (83.762)</span>
          </Link>
        </div>

        {/* Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
            <Building className="w-64 h-64 text-emerald-950" />
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-600 to-cyan-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Master Wilayah Kabupaten &amp; Kota
                </h1>
                <Badge className="bg-teal-100 text-teal-800 border-teal-300 text-xs font-bold px-2.5 py-0.5">
                  514 Daerah RI
                </Badge>
                {dataSource === 'backend' ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-semibold gap-1 px-2.5 py-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Backend API (/v1/wilayah/kabupaten-kota)
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-semibold gap-1 px-2.5 py-0.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Lokal Fallback
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl">
                Master data 416 Kabupaten dan 98 Kota seluruh Indonesia terhubung langsung ke backend server, standar Kemendagri &amp; BPS untuk alamat pasien, faskes, dan integrasi SATUSEHAT.
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
          <Card className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Kabupaten &amp; Kota</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">514</h3>
                <p className="text-[11px] text-teal-600 font-semibold mt-0.5">Seluruh 38 Provinsi RI</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Building className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Kabupaten</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">416</h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Daerah Tingkat II</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Compass className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Kota</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">98</h3>
                <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Termasuk 5 Kota Adm DKI</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
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
                  {lastSynced ? `Sinkron: ${lastSynced.toLocaleTimeString('id-ID')}` : 'Endpoint: /v1/wilayah/kabupaten-kota'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Active Province Filter Banner */}
        {selectedProvinceCode !== 'ALL' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs text-emerald-900 shadow-2xs animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold">Filter Aktif Provinsi: </span>
                <span className="font-extrabold text-emerald-950">
                  {provinces.find((p) => p.kode === selectedProvinceCode)?.nama || selectedProvinceCode}
                </span>{' '}
                <span className="font-mono text-emerald-700">(Kode: {selectedProvinceCode})</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedProvinceCode('ALL');
                setPage(1);
              }}
              className="h-7.5 text-xs bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300 rounded-xl px-3 font-semibold shrink-0"
            >
              Tampilkan Semua Provinsi (38)
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
                placeholder="Cari daerah (misal: Bandung, Surabaya, 3171)..."
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
              {/* Filter Provinsi */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-slate-400 hidden sm:inline" />
                <select
                  value={selectedProvinceCode}
                  onChange={(e) => {
                    setSelectedProvinceCode(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[190px]"
                >
                  <option value="ALL">Semua Provinsi (38)</option>
                  {provinces.map((p) => (
                    <option key={p.kode} value={p.kode}>
                      {p.kode} - {p.nama}
                    </option>
                  ))}
                </select>
              </div>

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
                  <option value="ALL">Semua Tipe</option>
                  <option value="kabupaten">Kabupaten (416)</option>
                  <option value="kota">Kota (98)</option>
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
                  <option value={514}>Semua (514)</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 font-medium whitespace-nowrap ml-auto md:ml-0">
                Total: <span className="font-bold text-slate-900">{totalCount}</span> Daerah
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
                  <th className="py-3.5 px-4 w-28">Kode BPS/Kemendagri</th>
                  <th className="py-3.5 px-4">Nama Kabupaten / Kota</th>
                  <th className="py-3.5 px-4 text-center">Tipe</th>
                  <th className="py-3.5 px-4">Provinsi Induk</th>
                  <th className="py-3.5 px-4">Kecamatan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4 text-center"><div className="h-4 w-6 bg-slate-200 rounded mx-auto" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-14 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-44 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-5 w-16 bg-slate-200 rounded mx-auto" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-32 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-16 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-5 w-14 bg-slate-200 rounded mx-auto" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-7 w-20 bg-slate-200 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : dataList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building className="h-10 w-10 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">Tidak ada kabupaten/kota ditemukan</p>
                        <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian, filter provinsi, atau lakukan sinkronisasi backend.</p>
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
                    const details = getCityDistricts(item);
                    const isKota = item.tipe === 'kota' || item.nama.toUpperCase().startsWith('KOTA');

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
                            onClick={() => handleCopy(item.kode, 'Kode Daerah')}
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

                        {/* Nama Daerah */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {item.nama}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Wilayah Administrasi Tingkat II
                          </span>
                        </td>

                        {/* Tipe */}
                        <td className="py-3 px-4 text-center">
                          {isKota ? (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold py-0.5">
                              Kota
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold py-0.5">
                              Kabupaten
                            </Badge>
                          )}
                        </td>

                        {/* Provinsi Induk */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 text-xs">
                            {item.provinsi?.nama || 'PROVINSI'}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            Kode Prov: {item.kode_provinsi || item.provinsi?.kode || '-'}
                          </span>
                        </td>

                        {/* Jumlah Kecamatan */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-700">
                            {details.totalDistricts > 0 ? `${details.totalDistricts} Kec` : 'Terdaftar'}
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
                            <Link
                              href={`/settings/wilayah/kecamatan?kode_kabupaten_kota=${item.kode}`}
                              className="inline-flex items-center gap-1 h-7.5 px-2.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold transition-all border border-emerald-200/80 shadow-2xs"
                            >
                              <span>Lihat Kecamatan</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailModal(item)}
                              className="h-7.5 px-2 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-medium"
                            >
                              Info
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
                Menampilkan {dataList.length} dari {totalCount} kabupaten/kota terdaftar nasional.
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

        {/* Detail Modal */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-emerald-50/30">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                      <Building className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">{selectedItem.nama}</h3>
                        <Badge className="bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                          {selectedItem.kode}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Provinsi {selectedItem.provinsi?.nama || '-'} &bull; Daftar Kecamatan Tingkat III
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="h-8 w-8 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-100 bg-white">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Cari kecamatan di daerah ini..."
                      value={detailSearch}
                      onChange={(e) => setDetailSearch(e.target.value)}
                      className="pl-9 text-xs rounded-xl h-9"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-3 flex-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>
                      Total Kecamatan:{' '}
                      <strong className="text-slate-900">{selectedDetails?.totalDistricts || 0} Kecamatan</strong>
                    </span>
                  </div>

                  {filteredDistricts.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada data kecamatan yang cocok dengan pencarian.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {filteredDistricts.map((dist, dIdx) => (
                        <div
                          key={dist.code || dIdx}
                          className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-300 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">Kecamatan {dist.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {dist.subdistricts?.length || 0} Kelurahan / Desa
                            </p>
                          </div>
                          {dist.code && (
                            <Badge variant="outline" className="text-[10px] font-mono border-slate-200 text-slate-600">
                              {dist.code}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Sumber: Backend API &bull; Kemendagri RI
                  </div>
                  <Button
                    onClick={() => setIsDetailOpen(false)}
                    className="h-8.5 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-4"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </MainLayout>
  );
}

export default function MasterWilayahKabupatenKotaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-600">
              Memuat Master Data Kabupaten &amp; Kota...
            </p>
          </div>
        </div>
      }
    >
      <MasterWilayahKabupatenKotaContent />
    </Suspense>
  );
}
