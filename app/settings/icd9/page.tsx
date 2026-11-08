'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { ICD9Master } from '@/types/rme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import {
  Activity,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  DollarSign,
  CheckCircle2,
  XCircle,
  FileCode,
  Sparkles,
  Stethoscope,
  Tag,
  Layers,
  HelpCircle,
  ArrowUpRight,
  Filter,
  Check,
  X,
  TrendingUp,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';

export default function SetupICD9Page() {
  const { icd9List, addICD9, updateICD9, deleteICD9 } = useRME();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ICD9Master | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    englishName: '',
    category: 'Tindakan Bedah Minor',
    standardTariff: 50000,
    isActive: true,
  });

  // Common quick procedures in primary care
  const quickProcedures = [
    { code: '89.07', name: 'Konsultasi Medis' },
    { code: '89.52', name: 'Elektrokardiogram (EKG)' },
    { code: '93.57', name: 'Perawatan Luka / Ganti Balut' },
    { code: '86.59', name: 'Penjahitan Luka (Hecting)' },
    { code: '96.59', name: 'Spooling Telinga' },
    { code: '86.04', name: 'Insisi Abses' },
    { code: '99.29', name: 'Injeksi Terapi' },
  ];

  // Filtered ICD-9 items
  const filteredItems = useMemo(() => {
    return icd9List.filter((item) => {
      const matchQuery =
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.englishName && item.englishName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        categoryFilter === 'ALL' || item.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchQuery && matchCategory;
    });
  }, [icd9List, searchQuery, categoryFilter]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set(icd9List.map((i) => i.category).filter(Boolean));
    return Array.from(set);
  }, [icd9List]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    icd9List.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + 1;
    });
    return map;
  }, [icd9List]);

  const activeCount = icd9List.filter((i) => i.isActive).length;
  const inactiveCount = icd9List.filter((i) => !i.isActive).length;

  const tariffs = icd9List.map((i) => i.standardTariff || 0).filter((t) => t > 0);
  const avgTariff = tariffs.length ? Math.round(tariffs.reduce((a, b) => a + b, 0) / tariffs.length) : 50000;
  const minTariff = tariffs.length ? Math.min(...tariffs) : 0;
  const maxTariff = tariffs.length ? Math.max(...tariffs) : 0;

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      englishName: '',
      category: 'Pemeriksaan Klinis',
      standardTariff: 50000,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ICD9Master) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      englishName: item.englishName || '',
      category: item.category,
      standardTariff: item.standardTariff || 0,
      isActive: item.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Kode ICD-9-CM dan Nama Prosedur wajib diisi!');
      return;
    }

    const cleanCode = formData.code.trim();

    if (editingItem) {
      updateICD9(editingItem.id, {
        code: cleanCode,
        name: formData.name.trim(),
        englishName: formData.englishName.trim() || undefined,
        category: formData.category.trim(),
        standardTariff: Number(formData.standardTariff) || 0,
        isActive: formData.isActive,
      });
      toast.success(`Prosedur ICD-9 ${cleanCode} berhasil diperbarui!`);
    } else {
      addICD9({
        code: cleanCode,
        name: formData.name.trim(),
        englishName: formData.englishName.trim() || undefined,
        category: formData.category.trim(),
        standardTariff: Number(formData.standardTariff) || 0,
        isActive: formData.isActive,
      });
      toast.success(`Prosedur ICD-9 ${cleanCode} berhasil ditambahkan!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, code: string, name: string) => {
    if (confirm(`Yakin ingin menghapus tindakan ICD-9 ${code} (${name})?`)) {
      deleteICD9(id);
      toast.success(`Prosedur ${code} berhasil dihapus.`);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard!`);
  };

  return (
    <MainLayout>
      <div className="space-y-5 w-full">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Setup ICD-9-CM
                </h1>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                  {icd9List.length} Kode Prosedur
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono font-bold border-slate-300 text-slate-600">
                  BPJS FKTP Bridging
                </Badge>
                <Badge variant="outline" className="text-[10px] font-bold border-teal-300 text-teal-700 bg-teal-50">
                  SATUSEHAT FHIR Procedure
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Master kodefikasi prosedur klinis &amp; tindakan medis internasional ICD-9-CM untuk e-Klaim BPJS FKTP, rujukan, dan rekam medis elektronik.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <a
              href="https://www.icd9data.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Buka situs referensi resmi ICD-9 Data di tab baru"
            >
              <Globe className="h-4 w-4 text-emerald-700" />
              <span>Buka ICD9Data.com</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </a>

            <Button
              onClick={handleOpenAddModal}
              className="h-9 gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Kode ICD-9-CM</span>
            </Button>
          </div>
        </div>

        {/* Top KPI Metrics Row (4 Columns - Full Width Balance) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Prosedur */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Prosedur ICD-9</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">{icd9List.length}</span>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span className="text-emerald-700 font-bold">{activeCount} Aktif di SOAP</span>
                <span>•</span>
                <span className="text-slate-400">{inactiveCount} Nonaktif</span>
              </p>
            </div>
          </Card>

          {/* KPI 2: Kategori Tindakan */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategori Tindakan</span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                <Stethoscope className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-teal-700 block">{categories.length || 1}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Bedah minor, diagnostik, terapi, observasi
              </p>
            </div>
          </Card>

          {/* KPI 3: Rata-Rata Tarif Rekomendasi */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tarif Rekomendasi</span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-sm font-black text-blue-800 block">{formatRupiah(avgTariff)}</span>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                Rentang: {formatRupiah(minTariff)} - {formatRupiah(maxTariff)}
              </p>
            </div>
          </Card>

          {/* KPI 4: Standar E-Klaim */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Standar E-Klaim</span>
              <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                <FileCode className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 block">ICD-9-CM FKTP</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Bridging PCare &amp; Kemenkes FHIR
              </p>
            </div>
          </Card>
        </div>

        {/* Main Content Grid: 12-Column Responsive Layout to Fill All Space */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: Primary Table & Search (8 Cols on XL) */}
          <div className="xl:col-span-8 space-y-5">
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-700" />
                    Katalog Tindakan Medis ICD-9-CM ({filteredItems.length})
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Daftar tindakan medis baku yang dapat dipilih dokter pada modul pemeriksaan dan kasir pembayaran.
                  </p>
                </div>

                {(searchQuery || categoryFilter !== 'ALL') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('ALL');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer gap-1 self-start sm:self-auto h-8 px-2.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reset Filter</span>
                  </Button>
                )}
              </div>

              {/* Search & Filter Bar */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari kode ICD-9 (e.g. 89.07, 96.04, 93.57), nama tindakan, atau kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8 bg-slate-50 h-10 rounded-xl text-xs font-mono border-slate-200 focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      categoryFilter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua Kategori ({icd9List.length})
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat} ({categoryCounts[cat] || 0})
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Content */}
              {filteredItems.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2 bg-slate-50/50">
                  <Activity className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">Tidak ada prosedur ICD-9-CM yang cocok.</p>
                  <p className="text-[11px] text-slate-400">
                    Coba gunakan kata kunci pencarian lain atau klik tombol Reset Filter.
                  </p>
                  {(searchQuery || categoryFilter !== 'ALL') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('ALL');
                      }}
                      className="mt-2 text-xs font-bold rounded-xl"
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/90 max-h-[480px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Kode ICD-9</th>
                        <th className="py-2.5 px-3">Nama Tindakan (Indonesia)</th>
                        <th className="py-2.5 px-3">Istilah Medis (English)</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3">Tarif Rekomendasi</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono font-black text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg w-fit text-[11px]">
                              <span>{item.code}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.code, 'Kode ICD-9')}
                                className="text-teal-600 hover:text-teal-950 cursor-pointer"
                                title="Salin Kode ICD-9"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {item.name}
                          </td>

                          <td className="py-2.5 px-3 text-slate-500 italic text-[11px] max-w-xs truncate">
                            {item.englishName || '-'}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge variant="outline" className="text-[10px] font-bold bg-white text-slate-700 border-slate-300">
                              {item.category}
                            </Badge>
                          </td>

                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                            {formatRupiah(item.standardTariff || 0)}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge
                              className={
                                item.isActive
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 text-[10px]'
                              }
                            >
                              {item.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </td>

                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <a
                                href={`https://www.icd9data.com/2015/Volume3/${encodeURIComponent(item.code)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-7 px-2 text-[10px] font-bold gap-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 inline-flex items-center transition-colors cursor-pointer"
                                title="Buka kode tindakan ini di ICD9Data.com"
                              >
                                <span>icd9data</span>
                                <ArrowUpRight className="h-2.5 w-2.5" />
                              </a>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal(item)}
                                className="h-7 px-2 text-[10px] font-bold gap-1 rounded-lg border-slate-300 hover:bg-slate-100 cursor-pointer"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Edit</span>
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id, item.code, item.name)}
                                className="h-7 px-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span>
                  Menampilkan <strong>{filteredItems.length}</strong> dari <strong>{icd9List.length}</strong> prosedur terdaftar
                </span>
                <span className="text-slate-400 font-mono">Standar Kode ICD-9-CM WHO / BPJS FKTP</span>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Quick Navigator, Breakdown & Guides (4 Cols on XL) */}
          <div className="xl:col-span-4 space-y-5">
            {/* Card 1: Jelajah Tindakan Cepat (Quick Navigator) */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Tindakan Primer Paling Sering
                  </h3>
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] text-slate-400 hover:text-emerald-700 font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-500">
                Klik tindakan rawat jalan di bawah ini untuk mencari dan memfilter tabel secara instan:
              </p>

              <div className="flex flex-wrap gap-1.5">
                {quickProcedures.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setSearchQuery(item.code)}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      searchQuery.toLowerCase() === item.code.toLowerCase()
                        ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-xs'
                        : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <span className="font-mono font-bold text-[11px]">{item.code}</span>
                    <span className="text-[11px]">{item.name}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Card 2: Distribusi Kategori Tindakan */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Distribusi Kategori Tindakan
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Modalitas</span>
              </div>

              <div className="space-y-3 text-xs">
                {categories.map((cat, idx) => {
                  const count = categoryCounts[cat] || 0;
                  const pct = Math.round((count / (icd9List.length || 1)) * 100);
                  const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'];
                  const color = colors[idx % colors.length];

                  return (
                    <div
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className="space-y-1 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 group-hover:text-emerald-700 flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${color}`} />
                          {cat}
                        </span>
                        <strong className="font-mono text-slate-900">
                          {count} ({pct}%)
                        </strong>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Card 3: Panduan Interoperabilitas & e-Klaim */}
            <Card className="border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-teal-50/50 shadow-xs p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Standar Bridging Prosedur
                  </h3>
                </div>
                <Badge className="bg-emerald-700 text-white text-[10px] font-bold">
                  e-Klaim FKTP
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-900 text-xs">Integrasi PCare BPJS</div>
                  <p className="text-[11px] text-slate-600">
                    Kode tindakan ICD-9-CM langsung ditransmisikan ke endpoint pelayanan PCare saat dokter menyelesaikan pemeriksaan.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-900 text-xs">FHIR R4 Procedure Resource</div>
                  <p className="text-[11px] text-slate-600">
                    Sistem memformat tindakan medis ke resource <code className="text-emerald-700 font-mono">Procedure</code> SATUSEHAT Kemenkes RI.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Add / Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {editingItem ? 'Edit Prosedur ICD-9-CM' : 'Tambah Prosedur ICD-9-CM Baru'}
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      Standar kodefikasi tindakan medis internasional
                    </span>
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

              <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Code */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kode ICD-9-CM *</label>
                  <Input
                    required
                    placeholder="e.g. 89.07 / 96.04 / 93.57"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="h-9 rounded-xl font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400">Format kode numerik dengan titik (e.g. 89.07).</p>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Tindakan / Prosedur (Indonesia) *</label>
                  <Input
                    required
                    placeholder="e.g. Konsultasi dan Pemeriksaan Medis Komprehensif"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 rounded-xl"
                  />
                </div>

                {/* English Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Istilah Medis Resmi (English)</label>
                  <Input
                    placeholder="e.g. Comprehensive medical examination and consultation"
                    value={formData.englishName}
                    onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                    className="h-9 rounded-xl italic"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Kategori Tindakan</label>
                    <Input
                      placeholder="e.g. Pemeriksaan Klinis / Bedah Minor"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  {/* Standard Tariff */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Tarif Dasar Rekomendasi (Rp)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 75000"
                      value={formData.standardTariff}
                      onChange={(e) => setFormData({ ...formData, standardTariff: Number(e.target.value) })}
                      className="h-9 rounded-xl"
                    />
                  </div>
                </div>

                {/* Status Active */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status Tindakan</label>
                  <select
                    value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })}
                    className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold"
                  >
                    <option value="ACTIVE">Aktif (Dapat digunakan di SOAP &amp; Kasir)</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                    className="h-9 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs cursor-pointer"
                  >
                    {editingItem ? 'Simpan Perubahan' : 'Tambah ICD-9-CM'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Dialog>
      </div>
    </MainLayout>
  );
}
