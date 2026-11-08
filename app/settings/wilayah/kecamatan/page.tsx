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
  fetchBackendKecamatan,
  fetchBackendKabupatenKota,
  BackendKecamatanItem,
  BackendKabupatenKotaItem,
} from '@/lib/api-client';
import { INDONESIA_REGIONS } from '@/lib/indonesia-regions';
import {
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
  Filter,
  Info,
  Map,
  Home,
  X,
  Compass,
} from 'lucide-react';
import { toast } from 'sonner';

function MasterWilayahKecamatanContent() {
  const searchParams = useSearchParams();
  const urlKabCode = searchParams.get('kode_kabupaten_kota') || '';

  const [dataList, setDataList] = useState<BackendKecamatanItem[]>([]);
  const [kabupatenList, setKabupatenList] = useState<BackendKabupatenKotaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKabCode, setSelectedKabCode] = useState<string>(urlKabCode || 'ALL');
  const [dataSource, setDataSource] = useState<'backend' | 'local_fallback'>('backend');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Instant human-readable name for selected kabupaten/kota
  const selectedKabName = useMemo(() => {
    if (selectedKabCode === 'ALL') return '';
    const fromList = kabupatenList.find((k) => k.kode === selectedKabCode)?.nama;
    if (fromList) return fromList;

    // Fallback lookup in INDONESIA_REGIONS
    for (const p of INDONESIA_REGIONS) {
      for (const c of p.cities) {
        const clean = c.code?.replace(/\./g, '');
        if (clean === selectedKabCode || c.code === selectedKabCode) {
          return c.name.toUpperCase();
        }
      }
    }
    if (selectedKabCode === '3374') return 'KOTA SEMARANG';
    return selectedKabCode;
  }, [selectedKabCode, kabupatenList]);

  // Sync if URL query param changes
  useEffect(() => {
    if (urlKabCode) {
      setSelectedKabCode(urlKabCode);
      setPage(1);
    }
  }, [urlKabCode]);

  // Pagination & Display
  const [limit, setLimit] = useState<number>(25);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(7285);

  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState<BackendKecamatanItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailSearch, setDetailSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load list of Kabupaten/Kota for dropdown filter
  useEffect(() => {
    fetchBackendKabupatenKota({ limit: 514 })
      .then((res) => {
        if (res.success && res.data) {
          setKabupatenList(res.data);
        }
      })
      .catch((err) => console.warn('[LoadKabupatenList] Error:', err));
  }, []);

  // Load kecamatan from backend
  const loadData = useCallback(
    async (query = '', kabCode = 'ALL', pageNum = 1, limitNum = 25) => {
      setIsLoading(true);
      try {
        const res = await fetchBackendKecamatan({
          search: query,
          kode_kabupaten_kota: kabCode !== 'ALL' ? kabCode : undefined,
          page: pageNum,
          limit: limitNum,
        });

        if (res.success && res.data) {
          setDataList(res.data);
          setTotalCount(res.total);
          setDataSource(res.source === 'local' ? 'local_fallback' : 'backend');
          setLastSynced(new Date());
        } else {
          toast.error(res.error || 'Gagal memuat data kecamatan dari backend.');
        }
      } catch (err: any) {
        console.error('[loadKecamatan] Error:', err);
        toast.error('Terjadi kesalahan saat memuat data kecamatan.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(searchQuery, selectedKabCode, page, limit);
  }, [searchQuery, selectedKabCode, page, limit, loadData]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    toast.loading('Menghubungi server backend http://43.129.38.25:30005/v1/wilayah/kecamatan...', {
      id: 'sync-kecamatan',
    });
    try {
      const res = await fetchBackendKecamatan({
        search: searchQuery,
        kode_kabupaten_kota: selectedKabCode !== 'ALL' ? selectedKabCode : undefined,
        page,
        limit,
      });

      if (res.success) {
        setDataList(res.data);
        setTotalCount(res.total);
        setDataSource(res.source === 'local' ? 'local_fallback' : 'backend');
        setLastSynced(new Date());
        toast.success(`Sinkronisasi berhasil! ${res.data.length} kecamatan dimuat dari backend.`, {
          id: 'sync-kecamatan',
        });
      } else {
        toast.error(res.error || 'Gagal sinkronisasi data kecamatan.', { id: 'sync-kecamatan' });
      }
    } catch (err: any) {
      toast.error('Gagal menghubungkan ke backend.', { id: 'sync-kecamatan' });
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

  // Hierarchy lookup: find subdistricts (kelurahan/desa) for selected kecamatan
  const getSubdistrictsList = useCallback((item: BackendKecamatanItem) => {
    const kNorm = item.nama.toLowerCase().trim();

    for (const prov of INDONESIA_REGIONS) {
      for (const city of prov.cities) {
        for (const dist of city.districts) {
          const dNorm = dist.name.toLowerCase().trim();
          const cleanCode = dist.code?.replace(/\./g, '');

          if (
            cleanCode === item.kode ||
            dist.code === item.kode ||
            dNorm === kNorm
          ) {
            return {
              subdistricts: dist.subdistricts || [],
              totalSubdistricts: dist.subdistricts?.length || 0,
              districtMatched: dist,
            };
          }
        }
      }
    }

    return {
      subdistricts: [],
      totalSubdistricts: 0,
      districtMatched: null,
    };
  }, []);

  const openDetailModal = (item: BackendKecamatanItem) => {
    setSelectedItem(item);
    setDetailSearch('');
    setIsDetailOpen(true);
  };

  const selectedDetails = useMemo(() => {
    if (!selectedItem) return null;
    return getSubdistrictsList(selectedItem);
  }, [selectedItem, getSubdistrictsList]);

  const filteredSubdistricts = useMemo(() => {
    if (!selectedDetails?.subdistricts) return [];
    if (!detailSearch.trim()) return selectedDetails.subdistricts;
    const q = detailSearch.toLowerCase().trim();
    return selectedDetails.subdistricts.filter((s) => s.toLowerCase().includes(q));
  }, [selectedDetails, detailSearch]);

  // Export CSV
  const handleExportCSV = () => {
    if (!dataList || dataList.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const headers = ['Kode Kemendagri', 'Nama Kecamatan', 'Kabupaten/Kota', 'Kode Kab/Kota', 'Terakhir Diperbarui'];
    const rows = dataList.map((d) => [
      `"${d.kode}"`,
      `"${d.nama}"`,
      `"${d.kabupaten_kota?.nama || '-'}"`,
      `"${d.kode_kabupaten_kota || d.kabupaten_kota?.kode || '-'}"`,
      `"${d.updated_at || d.created_at || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `master_wilayah_kecamatan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data master kecamatan berhasil diekspor ke CSV!');
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
    link.setAttribute('download', `master_wilayah_kecamatan_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data master kecamatan berhasil diekspor ke JSON!');
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
          <span className="text-slate-900 font-semibold">Kecamatan</span>
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-emerald-800 shadow-xs border border-slate-200/60 transition-all"
          >
            <Layers className="h-3.5 w-3.5 text-emerald-700" />
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
            <Layers className="w-64 h-64 text-emerald-950" />
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Master Wilayah Kecamatan
                </h1>
                <Badge className="bg-cyan-100 text-cyan-800 border-cyan-300 text-xs font-bold px-2.5 py-0.5">
                  7.285 Kecamatan RI
                </Badge>
                {dataSource === 'backend' ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-semibold gap-1 px-2.5 py-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Backend API (/v1/wilayah/kecamatan)
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-semibold gap-1 px-2.5 py-0.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Lokal Fallback
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl">
                Master data 7.285 Kecamatan seluruh Indonesia terintegrasi langsung ke backend server, standar Kemendagri &amp; BPS untuk alamat domisili terstruktur pasien dan interoperabilitas rekam medis (SATUSEHAT).
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
          <Card className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-cyan-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Kecamatan RI</p>
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
                <p className="text-xs font-medium text-slate-500">Desa &amp; Kelurahan</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">83.345</h3>
                <p className="text-[11px] text-teal-600 font-semibold mt-0.5">Tingkat IV Nasional</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Kabupaten &amp; Kota</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">514</h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">416 Kab &bull; 98 Kota</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
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
                  {lastSynced ? `Sinkron: ${lastSynced.toLocaleTimeString('id-ID')}` : 'Endpoint: /v1/wilayah/kecamatan'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Active Kabupaten/Kota Filter Banner */}
        {selectedKabCode !== 'ALL' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs text-emerald-900 shadow-2xs animate-in fade-in-50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Building className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">Filter Aktif Kabupaten/Kota:</span>
                  <span className="font-black text-emerald-950 text-sm">
                    {selectedKabName}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px] border-emerald-300 bg-white text-emerald-800">
                    Kode: {selectedKabCode}
                  </Badge>
                  <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">
                    {totalCount} Kecamatan
                  </Badge>
                </div>
                <p className="text-[11px] text-emerald-700/90 mt-0.5 font-mono">
                  Endpoint: /v1/wilayah/kecamatan?kode_kabupaten_kota={selectedKabCode}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="h-7.5 text-xs bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300 rounded-xl px-2.5 font-semibold gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sinkron</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedKabCode('ALL');
                  setPage(1);
                }}
                className="h-7.5 text-xs bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300 rounded-xl px-3 font-semibold"
              >
                Tampilkan Semua Kab/Kota (514)
              </Button>
            </div>
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
                placeholder="Cari kecamatan (misal: Menteng, Gambir, 317106)..."
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
              {/* Filter Kabupaten / Kota */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building className="h-3.5 w-3.5 text-slate-400 hidden sm:inline" />
                <select
                  value={selectedKabCode}
                  onChange={(e) => {
                    setSelectedKabCode(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[210px]"
                >
                  <option value="ALL">Semua Kab/Kota (514)</option>
                  {kabupatenList.map((k) => (
                    <option key={k.kode} value={k.kode}>
                      {k.kode} - {k.nama}
                    </option>
                  ))}
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
                Total: <span className="font-bold text-slate-900">{totalCount}</span> Kecamatan
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
                  <th className="py-3.5 px-4 w-32">Kode Kemendagri</th>
                  <th className="py-3.5 px-4">Nama Kecamatan Resmi</th>
                  <th className="py-3.5 px-4">Kabupaten / Kota Induk</th>
                  <th className="py-3.5 px-4">Desa / Kelurahan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4 text-center"><div className="h-4 w-6 bg-slate-200 rounded mx-auto" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-16 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-44 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-36 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-16 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-5 w-14 bg-slate-200 rounded mx-auto" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-7 w-20 bg-slate-200 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : dataList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Layers className="h-10 w-10 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">Tidak ada kecamatan ditemukan</p>
                        <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian, filter daerah, atau lakukan sinkronisasi backend.</p>
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
                    const details = getSubdistrictsList(item);

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
                            onClick={() => handleCopy(item.kode, 'Kode Kecamatan')}
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

                        {/* Nama Kecamatan */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {item.nama}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Kecamatan Tingkat III
                          </span>
                        </td>

                        {/* Kabupaten/Kota Induk */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 text-xs">
                            {item.kabupaten_kota?.nama || (item.kode_kabupaten_kota === selectedKabCode ? selectedKabName : undefined) || (item.kode_kabupaten_kota === '3374' ? 'KOTA SEMARANG' : 'KABUPATEN/KOTA')}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            Kode: {item.kode_kabupaten_kota || item.kabupaten_kota?.kode || (selectedKabCode !== 'ALL' ? selectedKabCode : '-')}
                          </span>
                        </td>

                        {/* Jumlah Kelurahan */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-700">
                            {details.totalSubdistricts > 0 ? `${details.totalSubdistricts} Desa/Kel` : 'Terdaftar'}
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
                              href={`/settings/wilayah/kelurahan?kode_kecamatan=${item.kode}`}
                              className="inline-flex items-center gap-1 h-7.5 px-2.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold transition-all border border-emerald-200/80 shadow-2xs"
                            >
                              <span>Lihat Kelurahan &amp; Desa</span>
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
                Menampilkan {dataList.length} dari {totalCount} kecamatan terdaftar nasional.
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
                      <Layers className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">Kecamatan {selectedItem.nama}</h3>
                        <Badge className="bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                          {selectedItem.kode}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {selectedItem.kabupaten_kota?.nama || 'KABUPATEN/KOTA'} &bull; Daftar Kelurahan / Desa
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
                      placeholder="Cari Desa / Kelurahan di kecamatan ini..."
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
                      Total Kelurahan / Desa:{' '}
                      <strong className="text-slate-900">{selectedDetails?.totalSubdistricts || 0} Daerah</strong>
                    </span>
                  </div>

                  {filteredSubdistricts.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada data kelurahan/desa yang cocok dengan pencarian.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {filteredSubdistricts.map((sub, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-300 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{sub}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Kelurahan / Desa &bull; Wilayah Tingkat IV
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600">
                            Aktif
                          </Badge>
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

export default function MasterWilayahKecamatanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-600">
              Memuat Master Data Kecamatan...
            </p>
          </div>
        </div>
      }
    >
      <MasterWilayahKecamatanContent />
    </Suspense>
  );
}
