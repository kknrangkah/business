'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { DiagnosisMaster } from '@/types/rme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Sparkles,
  Activity,
  HeartPulse,
  Filter,
  Layers,
  HelpCircle,
  ArrowUpRight,
  Check,
  X,
  Tag,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SetupICD10Page() {
  const { diagnoses, addDiagnosis, updateDiagnosis, deleteDiagnosis } = useRME();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState<DiagnosisMaster | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    englishName: '',
    category: 'Respirasi',
    description: '',
    isChronic: false,
    isActive: true,
  });

  // Top 10 primary care diagnoses for 1-click filter
  const topDiagnoses = [
    { code: 'J00', name: 'Common Cold (Flu)' },
    { code: 'I10', name: 'Hipertensi Primer' },
    { code: 'E11.9', name: 'Diabetes Melitus Tipe 2' },
    { code: 'A09', name: 'Gastroenteritis (Diare)' },
    { code: 'J02.9', name: 'Faringitis Akut' },
    { code: 'K29.7', name: 'Gastritis (Maag)' },
    { code: 'R50.9', name: 'Demam (Febris)' },
    { code: 'M79.1', name: 'Myalgia (Nyeri Otot)' },
    { code: 'J06.9', name: 'ISPA Akut' },
  ];

  // Filtered diagnoses
  const filteredDiagnoses = useMemo(() => {
    return diagnoses.filter((diag) => {
      const matchQuery =
        diag.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        diag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (diag.englishName && diag.englishName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (diag.category && diag.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        categoryFilter === 'ALL' || (diag.category && diag.category.toLowerCase() === categoryFilter.toLowerCase());

      return matchQuery && matchCategory;
    });
  }, [diagnoses, searchQuery, categoryFilter]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set(diagnoses.map((d) => d.category).filter(Boolean));
    return Array.from(set) as string[];
  }, [diagnoses]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    diagnoses.forEach((item) => {
      const cat = item.category || 'Umum';
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [diagnoses]);

  const activeCount = diagnoses.filter((d) => d.isActive !== false).length;
  const inactiveCount = diagnoses.filter((d) => d.isActive === false).length;
  const chronicCount = diagnoses.filter((d) => d.isChronic).length;

  const handleOpenAddModal = () => {
    setEditingDiagnosis(null);
    setFormData({
      code: '',
      name: '',
      englishName: '',
      category: 'Respirasi',
      description: '',
      isChronic: false,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (diag: DiagnosisMaster) => {
    setEditingDiagnosis(diag);
    setFormData({
      code: diag.code,
      name: diag.name,
      englishName: diag.englishName || '',
      category: diag.category || 'Umum',
      description: diag.description || '',
      isChronic: !!diag.isChronic,
      isActive: diag.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Kode ICD-10 dan Nama Diagnosa wajib diisi!');
      return;
    }

    const cleanCode = formData.code.trim().toUpperCase();

    if (editingDiagnosis) {
      updateDiagnosis(editingDiagnosis.code, {
        code: cleanCode,
        name: formData.name.trim(),
        englishName: formData.englishName.trim() || undefined,
        category: formData.category.trim(),
        description: formData.description.trim() || undefined,
        isChronic: formData.isChronic,
        isActive: formData.isActive,
      });
      toast.success(`Diagnosa ${cleanCode} berhasil diperbarui!`);
    } else {
      if (diagnoses.some((d) => d.code.toUpperCase() === cleanCode)) {
        toast.error(`Kode ICD-10 ${cleanCode} sudah ada dalam master data!`);
        return;
      }

      addDiagnosis({
        code: cleanCode,
        name: formData.name.trim(),
        englishName: formData.englishName.trim() || undefined,
        category: formData.category.trim(),
        description: formData.description.trim() || undefined,
        isChronic: formData.isChronic,
        isActive: formData.isActive,
      });
      toast.success(`Diagnosa ICD-10 ${cleanCode} berhasil ditambahkan!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (code: string, name: string) => {
    if (confirm(`Yakin ingin menghapus diagnosa ${code} (${name})?`)) {
      deleteDiagnosis(code);
      toast.success(`Diagnosa ${code} berhasil dihapus.`);
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
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Setup ICD-10
                </h1>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                  {diagnoses.length} Kode Diagnosa
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono font-bold border-slate-300 text-slate-600">
                  WHO ICD-10 Ed. 2019
                </Badge>
                <Badge variant="outline" className="text-[10px] font-bold border-teal-300 text-teal-700 bg-teal-50">
                  BPJS PCare &amp; SATUSEHAT
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Standar klasifikasi penyakit internasional WHO ICD-10 untuk pengisian SOAP dokter, bridging BPJS PCare, rujukan, dan rekam medis elektronik.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <a
              href="https://www.icd10data.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Buka situs referensi resmi ICD-10 Data di tab baru"
            >
              <Globe className="h-4 w-4 text-emerald-700" />
              <span>Buka ICD10Data.com</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </a>

            <Button
              onClick={handleOpenAddModal}
              className="h-9 gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Kode ICD-10</span>
            </Button>
          </div>
        </div>

        {/* Top KPI Metrics Row (4 Columns - Full Width Balance) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Kode */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Kode ICD-10</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">{diagnoses.length}</span>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span className="text-emerald-700 font-bold">{activeCount} Aktif di SOAP</span>
                <span>•</span>
                <span className="text-slate-400">{inactiveCount} Nonaktif</span>
              </p>
            </div>
          </Card>

          {/* KPI 2: Kategori & Bab Organ */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategori / Bab Organ</span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-teal-700 block">{categories.length || 1}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Respirasi, sirkulasi, pencernaan, endokrin
              </p>
            </div>
          </Card>

          {/* KPI 3: Penyakit Kronis / Prolanis */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Penyakit Kronis</span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                <HeartPulse className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-amber-700 block">{chronicCount}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Prolanis / Program Rujuk Balik (PRB)
              </p>
            </div>
          </Card>

          {/* KPI 4: Standar Integrasi */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Standar Interoperabilitas</span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-sm font-black text-blue-800 block">WHO ICD-10 / FHIR R4</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Kompatibel PCare &amp; SATUSEHAT
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
                    <BookOpen className="h-4 w-4 text-emerald-700" />
                    Katalog Diagnosa Penyakit ICD-10 ({filteredDiagnoses.length})
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Daftar diagnosa penyakit baku untuk entri asesmen medis dokter dan bridging sistem.
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
                    placeholder="Cari kode ICD-10 (e.g. J00, I10, A09), nama penyakit Indonesia, atau istilah medis..."
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
                    Semua Kategori ({diagnoses.length})
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
              {filteredDiagnoses.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2 bg-slate-50/50">
                  <BookOpen className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">Tidak ada kode ICD-10 yang cocok.</p>
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
                        <th className="py-2.5 px-3">Kode ICD-10</th>
                        <th className="py-2.5 px-3">Nama Diagnosa (Indonesia)</th>
                        <th className="py-2.5 px-3">Istilah Klinis (English)</th>
                        <th className="py-2.5 px-3">Kategori Organ</th>
                        <th className="py-2.5 px-3">Sifat Penyakit</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDiagnoses.map((diag) => (
                        <tr key={diag.code} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg w-fit text-[11px]">
                              <span>{diag.code}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(diag.code, 'Kode ICD-10')}
                                className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
                                title="Salin Kode ICD-10"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {diag.name}
                          </td>

                          <td className="py-2.5 px-3 text-slate-500 italic text-[11px] max-w-xs truncate">
                            {diag.englishName || '-'}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge variant="outline" className="text-[10px] font-bold bg-white text-slate-700 border-slate-300">
                              {diag.category || 'Umum'}
                            </Badge>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {diag.isChronic ? (
                              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold">
                                Kronis / Prolanis
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                                Akut
                              </Badge>
                            )}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge
                              className={
                                diag.isActive !== false
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 text-[10px]'
                              }
                            >
                              {diag.isActive !== false ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </td>

                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <a
                                href={`https://www.icd10data.com/ICD10CM/Codes/${encodeURIComponent(diag.code)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-7 px-2 text-[10px] font-bold gap-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 inline-flex items-center transition-colors cursor-pointer"
                                title="Buka kode ini di ICD10Data.com"
                              >
                                <span>icd10data</span>
                                <ArrowUpRight className="h-2.5 w-2.5" />
                              </a>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal(diag)}
                                className="h-7 px-2 text-[10px] font-bold gap-1 rounded-lg border-slate-300 hover:bg-slate-100 cursor-pointer"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Edit</span>
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(diag.code, diag.name)}
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
                  Menampilkan <strong>{filteredDiagnoses.length}</strong> dari <strong>{diagnoses.length}</strong> diagnosa terdaftar
                </span>
                <span className="text-slate-400 font-mono">Standar Kodefikasi WHO ICD-10 &amp; BPJS</span>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Quick Navigator, Breakdown & Guides (4 Cols on XL) */}
          <div className="xl:col-span-4 space-y-5">
            {/* Card 1: 10 Diagnosa Terbanyak di FKTP (Top Morbidity) */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Diagnosa Paling Sering di FKTP
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
                Klik diagnosa primer di bawah ini untuk mencari dan memfilter data secara instan:
              </p>

              <div className="flex flex-wrap gap-1.5">
                {topDiagnoses.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setSearchQuery(item.code)}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      searchQuery.toUpperCase() === item.code.toUpperCase()
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

            {/* Card 2: Distribusi Kategori / Sistem Organ */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Distribusi Sistem Organ
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Bab ICD</span>
              </div>

              <div className="space-y-3 text-xs">
                {categories.map((cat, idx) => {
                  const count = categoryCounts[cat] || 0;
                  const pct = Math.round((count / (diagnoses.length || 1)) * 100);
                  const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
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

            {/* Card 3: Panduan Kodifikasi ICD-10 */}
            <Card className="border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-teal-50/50 shadow-xs p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Ketentuan Kodifikasi Diagnosa
                  </h3>
                </div>
                <Badge className="bg-emerald-700 text-white text-[10px] font-bold">
                  Standar PCare
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-900 text-xs">Diagnosa Primer &amp; Sekunder</div>
                  <p className="text-[11px] text-slate-600">
                    Setiap kunjungan wajib mencantumkan 1 diagnosa primer utama dan dapat ditambahkan diagnosa sekunder/komorbiditas.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-900 text-xs">Bridging SATUSEHAT FHIR</div>
                  <p className="text-[11px] text-slate-600">
                    Sistem otomatis menyusun resource <code className="text-emerald-700 font-mono">Condition</code> dengan kode ICD-10 Kemenkes saat dokter menyelesaikan pemeriksaan.
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
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {editingDiagnosis ? 'Edit Kode ICD-10' : 'Tambah Diagnosa ICD-10 Baru'}
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      Standar kodefikasi diagnosa WHO &amp; Kemenkes
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
                  <label className="font-bold text-slate-700">Kode ICD-10 *</label>
                  <Input
                    required
                    placeholder="e.g. J00 / I10 / A09 / E11.9"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="h-9 rounded-xl font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400">Kode alfanumerik sesuai buku pedoman ICD-10 WHO.</p>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Diagnosa (Indonesia) *</label>
                  <Input
                    required
                    placeholder="e.g. Nasopharyngitis Akut (Common Cold / Flu)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 rounded-xl"
                  />
                </div>

                {/* English Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Diagnosa Resmi (English)</label>
                  <Input
                    placeholder="e.g. Acute nasopharyngitis [common cold]"
                    value={formData.englishName}
                    onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                    className="h-9 rounded-xl italic"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Kategori / Bab Organ</label>
                    <Input
                      placeholder="e.g. Respirasi / Kardiovaskular"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  {/* Chronic Checkbox */}
                  <div className="space-y-1 flex flex-col justify-end">
                    <label className="font-bold text-slate-700 block">Sifat Penyakit</label>
                    <label className="flex items-center gap-2 h-9 p-2 rounded-xl border border-slate-200 cursor-pointer bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.isChronic}
                        onChange={(e) => setFormData({ ...formData, isChronic: e.target.checked })}
                        className="rounded text-emerald-700"
                      />
                      <span className="text-xs font-semibold text-slate-700">Penyakit Kronis / Prolanis</span>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Keterangan / Catatan Tambahan</label>
                  <Input
                    placeholder="e.g. Pedoman kriteria klinis atau rujukan"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-9 rounded-xl"
                  />
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
                    {editingDiagnosis ? 'Simpan Perubahan' : 'Tambah ICD-10'}
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
