'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { SNOMEDMaster } from '@/types/rme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import {
  Database,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Globe,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Tag,
  Layers,
  BookOpen,
  ArrowUpRight,
  Filter,
  Check,
  Stethoscope,
  Activity,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SetupSNOMEDPage() {
  const { snomedList, addSNOMED, updateSNOMED, deleteSNOMED } = useRME();

  const [searchQuery, setSearchQuery] = useState('');
  const [semanticFilter, setSemanticFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SNOMEDMaster | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    conceptId: '',
    fsn: '',
    term: '',
    semanticTag: 'finding' as 'finding' | 'disorder' | 'procedure' | 'observable entity' | 'body structure' | 'substance',
    icd10Mapping: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // Common quick concepts for 1-click filter
  const quickConcepts = [
    { label: 'Demam (Febris)', query: 'Demam' },
    { label: 'Hipertensi', query: 'Hipertensi' },
    { label: 'Diabetes Melitus', query: 'Diabetes' },
    { label: 'Infark Miokard', query: 'Miokard' },
    { label: 'Faringitis Akut', query: 'Faringitis' },
    { label: 'Tekanan Darah', query: 'Tekanan Darah' },
    { label: 'EKG', query: 'Elektrokardiogram' },
  ];

  // Filtered SNOMED list
  const filteredList = useMemo(() => {
    return snomedList.filter((item) => {
      const matchQuery =
        item.conceptId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.fsn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.icd10Mapping && item.icd10Mapping.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.semanticTag.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSemantic = semanticFilter === 'ALL' || item.semanticTag === semanticFilter;

      return matchQuery && matchSemantic;
    });
  }, [snomedList, searchQuery, semanticFilter]);

  const activeCount = snomedList.filter((s) => s.status === 'ACTIVE').length;
  const inactiveCount = snomedList.filter((s) => s.status === 'INACTIVE').length;
  const mappedCount = snomedList.filter((s) => s.icd10Mapping).length;

  const countFinding = snomedList.filter((s) => s.semanticTag === 'finding').length;
  const countDisorder = snomedList.filter((s) => s.semanticTag === 'disorder').length;
  const countProcedure = snomedList.filter((s) => s.semanticTag === 'procedure').length;
  const countObservable = snomedList.filter((s) => s.semanticTag === 'observable entity').length;
  const countOther = snomedList.filter(
    (s) => s.semanticTag === 'body structure' || s.semanticTag === 'substance'
  ).length;

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      conceptId: '',
      fsn: '',
      term: '',
      semanticTag: 'finding',
      icd10Mapping: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SNOMEDMaster) => {
    setEditingItem(item);
    setFormData({
      conceptId: item.conceptId,
      fsn: item.fsn,
      term: item.term,
      semanticTag: item.semanticTag,
      icd10Mapping: item.icd10Mapping || '',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.conceptId.trim() || !formData.fsn.trim() || !formData.term.trim()) {
      toast.error('Concept ID, Fully Specified Name (FSN), dan Istilah Klinis wajib diisi!');
      return;
    }

    const cleanConceptId = formData.conceptId.trim();

    if (editingItem) {
      updateSNOMED(editingItem.id, {
        conceptId: cleanConceptId,
        fsn: formData.fsn.trim(),
        term: formData.term.trim(),
        semanticTag: formData.semanticTag,
        icd10Mapping: formData.icd10Mapping.trim() || undefined,
        status: formData.status,
      });
      toast.success(`SNOMED CT Concept ${cleanConceptId} berhasil diperbarui!`);
    } else {
      if (snomedList.some((s) => s.conceptId === cleanConceptId)) {
        toast.error(`Concept ID ${cleanConceptId} sudah terdaftar dalam master SNOMED CT!`);
        return;
      }

      addSNOMED({
        conceptId: cleanConceptId,
        fsn: formData.fsn.trim(),
        term: formData.term.trim(),
        semanticTag: formData.semanticTag,
        icd10Mapping: formData.icd10Mapping.trim() || undefined,
        status: formData.status,
      });
      toast.success(`SNOMED CT Concept ${cleanConceptId} berhasil ditambahkan!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, conceptId: string, term: string) => {
    if (confirm(`Yakin ingin menghapus SNOMED concept ${conceptId} (${term})?`)) {
      deleteSNOMED(id);
      toast.success(`SNOMED concept ${conceptId} berhasil dihapus.`);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard!`);
  };

  const getSemanticBadge = (tag: SNOMEDMaster['semanticTag']) => {
    switch (tag) {
      case 'finding':
        return <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-bold">Clinical Finding</Badge>;
      case 'disorder':
        return <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-[10px] font-bold">Disorder / Disease</Badge>;
      case 'procedure':
        return <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold">Procedure</Badge>;
      case 'observable entity':
        return <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[10px] font-bold">Observable Entity</Badge>;
      case 'body structure':
        return <Badge className="bg-purple-50 text-purple-800 border-purple-200 text-[10px] font-bold">Body Structure</Badge>;
      case 'substance':
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">Substance</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-5 w-full">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Setup SNOMED CT
                </h1>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                  {snomedList.length} Konsep Terminologi
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono font-bold border-slate-300 text-slate-600">
                  HL7 FHIR R4 Ready
                </Badge>
                <Badge variant="outline" className="text-[10px] font-bold border-teal-300 text-teal-700 bg-teal-50">
                  Permenkes No. 24/2022
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Sistem terminologi klinis komprehensif global (SNOMED International &amp; Kemenkes RI) untuk interoperabilitas semantik rekam medis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <a
              href="https://browser.ihtsdotools.org"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-slate-500" />
              <span>Browser SNOMED Internasional</span>
              <ArrowUpRight className="h-3 w-3 text-slate-400" />
            </a>

            <Button
              onClick={handleOpenAddModal}
              className="h-9 gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Konsep SNOMED</span>
            </Button>
          </div>
        </div>

        {/* Top KPI Metrics Row (4 Columns - Full Width Balance) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total SCTID */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Concept ID (SCTID)</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">{snomedList.length}</span>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span className="text-emerald-700 font-bold">{activeCount} Aktif</span>
                <span>•</span>
                <span className="text-slate-400">{inactiveCount} Nonaktif</span>
              </p>
            </div>
          </Card>

          {/* KPI 2: Pemetaan ICD-10 */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pemetaan ICD-10</span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-teal-700 block">{mappedCount}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                {Math.round((mappedCount / (snomedList.length || 1)) * 100)}% konsep terpetakan ke ICD-10
              </p>
            </div>
          </Card>

          {/* KPI 3: Interoperabilitas SATUSEHAT */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Interoperabilitas</span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                <Globe className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-sm font-black text-blue-700 block">HL7 FHIR R4 Ready</span>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                Condition, Observation, Procedure
              </p>
            </div>
          </Card>

          {/* KPI 4: Edisi Terminologi */}
          <Card className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Edisi Standar</span>
              <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 block">ID &amp; INT Edition</span>
              <p className="text-[11px] text-slate-500 mt-1">
                SNOMED International &amp; Kemenkes DTO
              </p>
            </div>
          </Card>
        </div>

        {/* Main Content Grid: 12-Column Responsive Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: Primary Table & Search (8 Cols on XL) */}
          <div className="xl:col-span-8 space-y-5">
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-700" />
                    Daftar Konsep Terminologi SNOMED CT ({filteredList.length})
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Terminologi klinis terstandar yang digunakan pada rekam medis elektronik dan bridging SATUSEHAT.
                  </p>
                </div>

                {(searchQuery || semanticFilter !== 'ALL') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSemanticFilter('ALL');
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
                    placeholder="Cari Concept ID (e.g. 386661006), FSN, istilah klinis, atau mapping ICD-10..."
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
                    onClick={() => setSemanticFilter('ALL')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      semanticFilter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua ({snomedList.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSemanticFilter('finding')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      semanticFilter === 'finding'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Finding ({countFinding})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSemanticFilter('disorder')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      semanticFilter === 'disorder'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Disorder ({countDisorder})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSemanticFilter('procedure')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      semanticFilter === 'procedure'
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Procedure ({countProcedure})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSemanticFilter('observable entity')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      semanticFilter === 'observable entity'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Observable ({countObservable})
                  </button>

                  {countOther > 0 && (
                    <button
                      type="button"
                      onClick={() => setSemanticFilter('body structure')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        semanticFilter === 'body structure'
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Lainnya ({countOther})
                    </button>
                  )}
                </div>
              </div>

              {/* Table Content */}
              {filteredList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2 bg-slate-50/50">
                  <Database className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">Tidak ada konsep SNOMED CT yang cocok.</p>
                  <p className="text-[11px] text-slate-400">
                    Coba gunakan kata kunci pencarian lain atau klik tombol Reset Filter.
                  </p>
                  {(searchQuery || semanticFilter !== 'ALL') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSemanticFilter('ALL');
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
                        <th className="py-2.5 px-3">Concept ID</th>
                        <th className="py-2.5 px-3">Istilah Klinis (Preferred Term)</th>
                        <th className="py-2.5 px-3">Fully Specified Name (FSN)</th>
                        <th className="py-2.5 px-3">Semantic Tag</th>
                        <th className="py-2.5 px-3">Mapping ICD-10</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono font-black text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg w-fit text-[11px]">
                              <span>{item.conceptId}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.conceptId, 'Concept ID')}
                                className="text-slate-400 hover:text-emerald-700 cursor-pointer"
                                title="Salin Concept ID"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {item.term}
                          </td>

                          <td className="py-2.5 px-3 text-slate-600 italic text-[11px] max-w-xs truncate">
                            {item.fsn}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {getSemanticBadge(item.semanticTag)}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {item.icd10Mapping ? (
                              <Badge variant="outline" className="font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-300">
                                ICD-10: {item.icd10Mapping}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge
                              className={
                                item.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 text-[10px]'
                              }
                            >
                              {item.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </td>

                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
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
                                onClick={() => handleDelete(item.id, item.conceptId, item.term)}
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
                  Menampilkan <strong>{filteredList.length}</strong> dari <strong>{snomedList.length}</strong> konsep terdaftar
                </span>
                <span className="text-slate-400 font-mono">Standar Kode IHTSDO &amp; DTO Kemenkes</span>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Quick Navigator, Breakdown & Guides (4 Cols on XL) */}
          <div className="xl:col-span-4 space-y-5">
            {/* Card 1: Jelajah Cepat Konsep Populer (Quick Navigator) */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Jelajah Cepat Konsep Populer
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
                Klik konsep klinis primer di bawah ini untuk memfilter tabel secara instan:
              </p>

              <div className="flex flex-wrap gap-1.5">
                {quickConcepts.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setSearchQuery(item.query)}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      searchQuery.toLowerCase() === item.query.toLowerCase()
                        ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-xs'
                        : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Card 2: Distribusi Kategori Semantik */}
            <Card className="border border-slate-200/90 bg-white shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Distribusi Kategori Semantik
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Hierarchy</span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Finding */}
                <div
                  onClick={() => setSemanticFilter('finding')}
                  className="space-y-1 cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 group-hover:text-emerald-700 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Clinical Finding (Gejala &amp; Temuan)
                    </span>
                    <strong className="font-mono text-slate-900">{countFinding}</strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(countFinding / (snomedList.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Disorder */}
                <div
                  onClick={() => setSemanticFilter('disorder')}
                  className="space-y-1 cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 group-hover:text-emerald-700 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Disorder / Disease (Penyakit / Diagnosis)
                    </span>
                    <strong className="font-mono text-slate-900">{countDisorder}</strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${(countDisorder / (snomedList.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Procedure */}
                <div
                  onClick={() => setSemanticFilter('procedure')}
                  className="space-y-1 cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 group-hover:text-emerald-700 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Procedure / Intervention (Tindakan)
                    </span>
                    <strong className="font-mono text-slate-900">{countProcedure}</strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(countProcedure / (snomedList.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Observable */}
                <div
                  onClick={() => setSemanticFilter('observable entity')}
                  className="space-y-1 cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 group-hover:text-emerald-700 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-teal-500" />
                      Observable Entity (Pengukuran TTV)
                    </span>
                    <strong className="font-mono text-slate-900">{countObservable}</strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${(countObservable / (snomedList.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 3: Panduan FHIR & Interoperabilitas SATUSEHAT */}
            <Card className="border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-teal-50/50 shadow-xs p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Integrasi FHIR SATUSEHAT
                  </h3>
                </div>
                <a
                  href="https://satusehat.kemkes.go.id/platform"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-0.5"
                >
                  Kemenkes <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-900 text-xs">Pemetaan Ganda (Dual Coding)</div>
                  <p className="text-[11px] text-slate-600">
                    Sistem otomatis mengirimkan kode <strong>ICD-10</strong> bersama dengan <strong>SNOMED CT</strong> dalam atribut <code className="text-emerald-700 font-mono">Condition.code.coding</code>.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-900 text-xs">Standar Permenkes No. 24/2022</div>
                  <p className="text-[11px] text-slate-600">
                    Mewajibkan seluruh faskes di Indonesia mengadopsi terminologi standar guna interoperabilitas lintas fasilitas pelayanan kesehatan.
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
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {editingItem ? 'Edit Konsep SNOMED CT' : 'Tambah Konsep SNOMED CT Baru'}
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      Standar SNOMED International &amp; Kemenkes SATUSEHAT
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
                {/* Concept ID */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">SNOMED CT Concept ID (SCTID) *</label>
                  <Input
                    required
                    placeholder="e.g. 386661006 / 22298006 / 73211009"
                    value={formData.conceptId}
                    onChange={(e) => setFormData({ ...formData, conceptId: e.target.value.replace(/\D/g, '') })}
                    className="h-9 rounded-xl font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400">Kode numerik SCTID global SNOMED International.</p>
                </div>

                {/* Preferred Term */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Istilah Klinis / Preferred Term (Indonesia) *</label>
                  <Input
                    required
                    placeholder="e.g. Demam / Febris / Infark Miokard Akut"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="h-9 rounded-xl"
                  />
                </div>

                {/* Fully Specified Name (FSN) */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Fully Specified Name (FSN) *</label>
                  <Input
                    required
                    placeholder="e.g. Fever (finding) / Myocardial infarction (disorder)"
                    value={formData.fsn}
                    onChange={(e) => setFormData({ ...formData, fsn: e.target.value })}
                    className="h-9 rounded-xl italic"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Semantic Tag */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Semantic Tag (Kategori)</label>
                    <select
                      value={formData.semanticTag}
                      onChange={(e) => setFormData({ ...formData, semanticTag: e.target.value as any })}
                      className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold"
                    >
                      <option value="finding">finding (Temuan Klinis / Gejala)</option>
                      <option value="disorder">disorder (Penyakit / Diagnosis)</option>
                      <option value="procedure">procedure (Tindakan / Prosedur)</option>
                      <option value="observable entity">observable entity (Pengukuran TTV)</option>
                      <option value="body structure">body structure (Anatomi Tubuh)</option>
                      <option value="substance">substance (Zat / Obat)</option>
                    </select>
                  </div>

                  {/* Mapping ICD-10 */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Pemetaan Kode ICD-10</label>
                    <Input
                      placeholder="e.g. R50.9 / I21.9 / I10"
                      value={formData.icd10Mapping}
                      onChange={(e) => setFormData({ ...formData, icd10Mapping: e.target.value.toUpperCase() })}
                      className="h-9 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status Konsep</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold"
                  >
                    <option value="ACTIVE">Aktif (Dapat digunakan dalam FHIR R4)</option>
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
                    {editingItem ? 'Simpan Perubahan' : 'Tambah SNOMED CT'}
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
