'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import {
  fetchBackendProvinces,
  BackendProvinceItem,
  getApiBaseUrl,
} from '@/lib/api-client';
import { INDONESIA_REGIONS, CityHierarchy } from '@/lib/indonesia-regions';
import {
  MapPin,
  Search,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  Building,
  Building2,
  Globe,
  Database,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Download,
  Filter,
  Layers,
  Sparkles,
  Info,
  Map,
  Home,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MasterWilayahProvinsiPage() {
  const [provinces, setProvinces] = useState<BackendProvinceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataSource, setDataSource] = useState<'backend' | 'local_fallback' | 'cache'>('backend');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Pagination & Display settings
  const [limit, setLimit] = useState<number>(38); // default to 38 so all Indonesian provinces are visible
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(38);

  // Detail Modal State
  const [selectedProvince, setSelectedProvince] = useState<BackendProvinceItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailSearch, setDetailSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load provinces from backend endpoint
  const loadProvinces = useCallback(async (query = '', pageNum = 1, limitNum = 38) => {
    setIsLoading(true);
    try {
      const res = await fetchBackendProvinces({
        search: query,
        page: pageNum,
        limit: limitNum,
      });

      if (res.success && res.data && res.data.length > 0) {
        setProvinces(res.data);
        setTotalCount(res.total);
        setDataSource(res.source === 'local' ? 'local_fallback' : 'backend');
        setLastSynced(new Date());
      } else {
        toast.error(res.error || 'Gagal memuat data provinsi dari backend.');
      }
    } catch (err: any) {
      console.error('[loadProvinces] Error:', err);
      toast.error('Terjadi kesalahan saat memuat data provinsi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProvinces(searchQuery, page, limit);
  }, [searchQuery, page, limit, loadProvinces]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    toast.loading('Menghubungi server backend http://43.129.38.25:30005/v1/wilayah/provinsi...', {
      id: 'sync-wilayah',
    });
    try {
      const res = await fetchBackendProvinces({
        search: searchQuery,
        page,
        limit,
      });
      if (res.success) {
        setProvinces(res.data);
        setTotalCount(res.total);
        setDataSource(res.source === 'local' ? 'local_fallback' : 'backend');
        setLastSynced(new Date());
        toast.success(`Sinkronisasi berhasil! ${res.data.length} provinsi dimuat dari backend.`, {
          id: 'sync-wilayah',
        });
      } else {
        toast.error(res.error || 'Gagal sinkronisasi data provinsi.', { id: 'sync-wilayah' });
      }
    } catch (err: any) {
      toast.error('Gagal menghubungkan ke backend.', { id: 'sync-wilayah' });
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

  // Associate each backend province with local hierarchy count (cities / regencies)
  const getProvinceDetails = useCallback((prov: BackendProvinceItem) => {
    const norm = prov.nama.toLowerCase().trim();
    const hierarchyMatch = INDONESIA_REGIONS.find(
      (r) =>
        r.code === prov.kode ||
        r.province.toLowerCase() === norm ||
        (norm.includes('jakarta') && r.province.toLowerCase().includes('jakarta')) ||
        (norm.includes('yogyakarta') && r.province.toLowerCase().includes('yogyakarta'))
    );

    const cities: CityHierarchy[] = hierarchyMatch?.cities || [];
    const totalDistricts = cities.reduce((acc, c) => acc + (c.districts?.length || 0), 0);

    return {
      cities,
      totalCities: cities.length,
      totalDistricts,
      hierarchyMatch,
    };
  }, []);

  const openDetailModal = (prov: BackendProvinceItem) => {
    setSelectedProvince(prov);
    setDetailSearch('');
    setIsDetailOpen(true);
  };

  const selectedDetails = useMemo(() => {
    if (!selectedProvince) return null;
    return getProvinceDetails(selectedProvince);
  }, [selectedProvince, getProvinceDetails]);

  const filteredCities = useMemo(() => {
    if (!selectedDetails?.cities) return [];
    if (!detailSearch.trim()) return selectedDetails.cities;
    const q = detailSearch.toLowerCase().trim();
    return selectedDetails.cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [selectedDetails, detailSearch]);

  // Export Data to CSV
  const handleExportCSV = () => {
    if (!provinces || provinces.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const headers = ['Kode Kemendagri', 'Nama Provinsi', 'Jumlah Kota/Kab', 'Terakhir Diperbarui'];
    const rows = provinces.map((p) => {
      const details = getProvinceDetails(p);
      return [
        `"${p.kode}"`,
        `"${p.nama}"`,
        details.totalCities || 0,
        `"${p.updated_at || p.created_at || '-'}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `master_wilayah_provinsi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data master provinsi berhasil diekspor ke CSV!');
  };

  // Export Data to JSON
  const handleExportJSON = () => {
    if (!provinces || provinces.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(provinces, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `master_wilayah_provinsi_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data master provinsi berhasil diekspor ke JSON!');
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
          <span className="text-slate-900 font-semibold">Master Wilayah Provinsi</span>
        </div>

        {/* Top 4-Segmented Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-2xl w-fit border border-slate-200/80">
          <Link
            href="/settings/wilayah"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-emerald-800 shadow-xs border border-slate-200/60 transition-all"
          >
            <MapPin className="h-3.5 w-3.5 text-emerald-700" />
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
          >
            <Home className="h-3.5 w-3.5 text-slate-500" />
            <span>Kelurahan &amp; Desa (83.762)</span>
          </Link>
        </div>

        {/* Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
            <Map className="w-64 h-64 text-emerald-950" />
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-md shrink-0">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Master Wilayah Provinsi
                </h1>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold px-2.5 py-0.5">
                  38 Provinsi RI
                </Badge>
                {dataSource === 'backend' ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-semibold gap-1 px-2.5 py-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Backend API (/v1/wilayah/provinsi)
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-semibold gap-1 px-2.5 py-0.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Lokal Fallback
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl">
                Master data referensi provinsi seluruh Indonesia terintegrasi backend Klinik, standar BPS / Kemendagri RI, dan siap dipakai untuk pendaftaran pasien, rekam medis (RME), dan bridging SATUSEHAT.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isLoading || provinces.length === 0}
              className="h-9.5 text-xs font-semibold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor CSV</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleExportJSON}
              disabled={isLoading || provinces.length === 0}
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
                <p className="text-xs font-medium text-slate-500">Total Provinsi Nasional</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">38</h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Standar Kemendagri 2026</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Kota &amp; Kabupaten</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">514</h3>
                <p className="text-[11px] text-teal-600 font-semibold mt-0.5">416 Kab &bull; 98 Kota</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Building className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-cyan-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Kecamatan &bull; Kelurahan</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">83.345</h3>
                <p className="text-[11px] text-cyan-600 font-semibold mt-0.5">7.265 Kec &bull; 83.345 Desa/Kel</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                <Layers className="h-5 w-5" />
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
                  {lastSynced ? `Sinkron: ${lastSynced.toLocaleTimeString('id-ID')}` : 'Endpoint: /v1/wilayah/provinsi'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <Card className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari provinsi (misal: Jawa, Bali, Papua, atau kode 31)..."
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

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>Tampilkan:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-9 text-xs rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value={10}>10 Provinsi</option>
                  <option value={25}>25 Provinsi</option>
                  <option value={38}>Semua (38 Provinsi)</option>
                  <option value={50}>50 Provinsi</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
                Total: <span className="font-bold text-slate-900">{totalCount}</span> Provinsi
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
                  <th className="py-3.5 px-4 w-16 text-center">No</th>
                  <th className="py-3.5 px-4 w-28">Kode BPS/Kemendagri</th>
                  <th className="py-3.5 px-4">Nama Provinsi Resmi</th>
                  <th className="py-3.5 px-4">Hierarki Kota / Kab</th>
                  <th className="py-3.5 px-4">Diperbarui</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4 text-center"><div className="h-4 w-6 bg-slate-200 rounded mx-auto" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-12 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-48 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-24 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-5 w-16 bg-slate-200 rounded mx-auto" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-7 w-20 bg-slate-200 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : provinces.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <MapPin className="h-10 w-10 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">Tidak ada data provinsi ditemukan</p>
                        <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau lakukan sinkronisasi ulang ke backend.</p>
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
                  provinces.map((prov, index) => {
                    const rowNumber = (page - 1) * limit + index + 1;
                    const details = getProvinceDetails(prov);

                    return (
                      <tr
                        key={prov.kode || index}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Row Index */}
                        <td className="py-3.5 px-4 text-center font-medium text-slate-400 text-[11px]">
                          {rowNumber}
                        </td>

                        {/* Kode Kemendagri */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleCopy(prov.kode, 'Kode Kemendagri')}
                            title="Klik untuk salin kode"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-mono font-bold text-xs transition-colors border border-slate-200/80 cursor-pointer"
                          >
                            <span>{prov.kode}</span>
                            {copiedCode === prov.kode ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100" />
                            )}
                          </button>
                        </td>

                        {/* Nama Provinsi */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span>{prov.nama}</span>
                            {prov.kode === '31' && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] py-0">
                                Ibukota Negara
                              </Badge>
                            )}
                            {prov.kode === '34' && (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] py-0">
                                Daerah Istimewa
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Republik Indonesia &bull; Wilayah Administrasi Tingkat I
                          </span>
                        </td>

                        {/* Hierarki Kota & Kabupaten */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">
                              {details.totalCities > 0 ? `${details.totalCities} Daerah` : 'Terhubung BPS'}
                            </span>
                            {details.totalCities > 0 && (
                              <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500">
                                {details.totalDistricts} Kec
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Diperbarui */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                          {prov.updated_at ? (
                            new Date(prov.updated_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Status Aktif */}
                        <td className="py-3.5 px-4 text-center">
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                            Aktif
                          </Badge>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/settings/wilayah/kabupaten-kota?kode_provinsi=${prov.kode}`}
                              className="inline-flex items-center gap-1 h-8 px-2.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold transition-all border border-emerald-200/80 shadow-2xs"
                            >
                              <span>Lihat Kab/Kota</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailModal(prov)}
                              className="h-8 px-2 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-medium"
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
                Menampilkan {provinces.length} dari {totalCount} provinsi nasional (Data terverifikasi Kemendagri RI).
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

        {/* Integration Guidance Box */}
        <Card className="p-5 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-cyan-50/40 border border-emerald-200/80 rounded-2xl">
          <div className="flex items-start gap-3.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                Pemanfaatan Master Wilayah Provinsi di Seluruh Sistem
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Data master wilayah provinsi ini otomatis tersinkronkan dan digunakan di seluruh alur operasional:
              </p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside mt-2 font-medium">
                <li>
                  <strong>Pendaftaran Pasien Baru:</strong> Pengisian alamat domisili terstruktur 4 kolom (Provinsi &rarr; Kota/Kab &rarr; Kecamatan &rarr; Kelurahan) untuk pembuatan Nomor Rekam Medis (No RM).
                </li>
                <li>
                  <strong>Bridging SATUSEHAT Kemenkes:</strong> Standardisasi kode wilayah administratif sesuai kode Kemendagri untuk interoperabilitas data rekam medis elektronik nasional.
                </li>
                <li>
                  <strong>Laporan Demografi Pasien:</strong> Statistik sebaran kunjungan pasien berdasarkan asal wilayah faskes pada modul Laporan &amp; Analisis.
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Detail Province & Cities Modal */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          {selectedProvince && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-emerald-50/30">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">{selectedProvince.nama}</h3>
                        <Badge className="bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                          Kode {selectedProvince.kode}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Daftar Kota &amp; Kabupaten Tingkat II di bawah provinsi ini
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

                {/* Modal Search within province */}
                <div className="p-4 border-b border-slate-100 bg-white">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Cari Kota / Kabupaten di provinsi ini..."
                      value={detailSearch}
                      onChange={(e) => setDetailSearch(e.target.value)}
                      className="pl-9 text-xs rounded-xl h-9"
                    />
                  </div>
                </div>

                {/* Cities List Content */}
                <div className="p-6 overflow-y-auto space-y-3 flex-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>
                      Total:{' '}
                      <strong className="text-slate-900">{selectedDetails?.totalCities || 0} Kota/Kabupaten</strong>
                    </span>
                    <span>
                      Total Kecamatan:{' '}
                      <strong className="text-slate-900">{selectedDetails?.totalDistricts || 0} Kecamatan</strong>
                    </span>
                  </div>

                  {filteredCities.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada Kota atau Kabupaten yang cocok dengan pencarian.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {filteredCities.map((city, cIdx) => (
                        <div
                          key={city.code || cIdx}
                          className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-300 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{city.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {city.districts?.length || 0} Kecamatan &bull; Terdaftar BPS
                            </p>
                          </div>
                          {city.code && (
                            <Badge variant="outline" className="text-[10px] font-mono border-slate-200 text-slate-600">
                              {city.code}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
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
