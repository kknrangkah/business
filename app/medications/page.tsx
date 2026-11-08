'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Pill,
  Search,
  Plus,
  Edit2,
  Trash2,
  PackagePlus,
  AlertTriangle,
  CheckCircle2,
  LayoutGrid,
  List,
  DollarSign,
  Tag,
} from 'lucide-react';
import { useRME } from '@/context/rme-context';
import { MainLayout } from '@/components/layout/main-layout';
import { MedicationMaster } from '@/types/rme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const formatRupiah = (val: number) => {
  return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
};

// Standard pharmacy categories in primary care
const PRESET_CATEGORIES = [
  'Semua Kategori',
  'Analgesik & Antipiretik',
  'Antibiotik',
  'Antihistamin & Alergi',
  'Gastrointestinal / Lambung',
  'Kardiovaskular & Hipertensi',
  'Kortikosteroid',
  'Vitamin & Suplemen',
  'Obat Batuk & Flu',
  'Obat Topikal / Kulit',
];

const PRESET_UNITS = [
  'Tablet',
  'Kapsul',
  'Kaplet',
  'Sirup (Botol)',
  'Drop / Tetes (Botol)',
  'Salep / Krim (Tube)',
  'Ampul / Injeksi',
  'Sachet',
  'Suspensi',
];

const PRESET_SIGNAS = [
  '3 x 1 tablet sesudah makan',
  '2 x 1 tablet sesudah makan',
  '1 x 1 tablet malam hari',
  '3 x 1 sendok teh (5ml) sesudah makan',
  '3 x 1 tablet sebelum makan',
  '1 x 1 tablet pagi hari',
  'Bila demam / nyeri (maks 3x sehari)',
  'Oleskan tipis 2-3 kali sehari',
];

export default function MedicationsPage() {
  const { medications, addMedication, updateMedication, deleteMedication, refreshMedications, hasPermission } = useRME();

  useEffect(() => {
    refreshMedications();
  }, [refreshMedications]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'SAFE'>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationMaster | null>(null);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<MedicationMaster | null>(null);
  const [restockQty, setRestockQty] = useState<number>(50);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MedicationMaster | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    genericName: '',
    category: 'Analgesik & Antipiretik',
    dosage: '500 mg',
    unit: 'Tablet',
    price: 5000,
    stock: 100,
    standardSigna: '3 x 1 tablet sesudah makan',
  });

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalItems = medications.length;
    const lowStockItems = medications.filter((m) => m.stock <= 20 && m.stock > 0).length;
    const outOfStockItems = medications.filter((m) => m.stock <= 0).length;
    const safeStockItems = medications.filter((m) => m.stock > 20).length;
    const totalInventoryValue = medications.reduce((sum, m) => sum + m.price * m.stock, 0);
    const categoriesCount = new Set(medications.map((m) => m.category)).size;

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      safeStockItems,
      totalInventoryValue,
      categoriesCount,
    };
  }, [medications]);

  // Filtered & Sorted Medications List
  const filteredMedications = useMemo(() => {
    return medications
      .filter((med) => {
        // Text Search
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          med.name.toLowerCase().includes(q) ||
          med.code.toLowerCase().includes(q) ||
          (med.genericName && med.genericName.toLowerCase().includes(q)) ||
          med.category.toLowerCase().includes(q) ||
          med.standardSigna.toLowerCase().includes(q);

        // Category Filter
        const matchesCategory =
          selectedCategory === 'Semua Kategori' || med.category === selectedCategory;

        // Stock Filter
        let matchesStock = true;
        if (stockFilter === 'LOW') {
          matchesStock = med.stock <= 20 && med.stock > 0;
        } else if (stockFilter === 'OUT') {
          matchesStock = med.stock <= 0;
        } else if (stockFilter === 'SAFE') {
          matchesStock = med.stock > 20;
        }

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        let compare = 0;
        if (sortBy === 'name') {
          compare = a.name.localeCompare(b.name);
        } else if (sortBy === 'stock') {
          compare = a.stock - b.stock;
        } else if (sortBy === 'price') {
          compare = a.price - b.price;
        }
        return sortOrder === 'asc' ? compare : -compare;
      });
  }, [medications, searchQuery, selectedCategory, stockFilter, sortBy, sortOrder]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingMedication(null);
    setFormData({
      code: `MED-${String(medications.length + 1).padStart(3, '0')}`,
      name: '',
      genericName: '',
      category: 'Analgesik & Antipiretik',
      dosage: '500 mg',
      unit: 'Tablet',
      price: 5000,
      stock: 50,
      standardSigna: '3 x 1 tablet sesudah makan',
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (med: MedicationMaster) => {
    setEditingMedication(med);
    setFormData({
      code: med.code,
      name: med.name,
      genericName: med.genericName || '',
      category: med.category,
      dosage: med.dosage,
      unit: med.unit,
      price: med.price,
      stock: med.stock,
      standardSigna: med.standardSigna,
    });
    setIsFormModalOpen(true);
  };

  // Open Quick Restock Modal
  const handleOpenRestockModal = (med: MedicationMaster) => {
    setRestockTarget(med);
    setRestockQty(50);
    setIsRestockModalOpen(true);
  };

  // Submit Form (Add or Edit)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nama obat wajib diisi!');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('Kode obat wajib diisi!');
      return;
    }
    if (formData.price < 0) {
      toast.error('Tarif harga tidak boleh negatif!');
      return;
    }
    if (formData.stock < 0) {
      toast.error('Jumlah stok tidak boleh negatif!');
      return;
    }

    if (editingMedication) {
      updateMedication(editingMedication.id, {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        genericName: formData.genericName.trim() || undefined,
        category: formData.category,
        dosage: formData.dosage.trim(),
        unit: formData.unit.trim(),
        price: Number(formData.price),
        stock: Number(formData.stock),
        standardSigna: formData.standardSigna.trim(),
      });
      toast.success(`Data obat ${formData.name} berhasil diperbarui!`);
    } else {
      addMedication({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        genericName: formData.genericName.trim() || undefined,
        category: formData.category,
        dosage: formData.dosage.trim(),
        unit: formData.unit.trim(),
        price: Number(formData.price),
        stock: Number(formData.stock),
        standardSigna: formData.standardSigna.trim(),
      });
      toast.success(`Obat baru ${formData.name} berhasil ditambahkan ke katalog!`);
    }

    setIsFormModalOpen(false);
  };

  // Submit Restock
  const handleSaveRestock = () => {
    if (!restockTarget) return;
    if (restockQty <= 0) {
      toast.error('Jumlah restock harus lebih besar dari 0.');
      return;
    }

    const updatedStock = restockTarget.stock + Number(restockQty);
    updateMedication(restockTarget.id, { stock: updatedStock });
    toast.success(`Stok ${restockTarget.name} bertambah +${restockQty} ${restockTarget.unit}. Total stok: ${updatedStock}`);
    setIsRestockModalOpen(false);
  };

  // Submit Delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMedication(deleteTarget.id);
    toast.success(`Obat ${deleteTarget.name} telah dihapus dari master katalog.`);
    setIsDeleteModalOpen(false);
  };

  // Category Color Map
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Antibiotik':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Analgesik & Antipiretik':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Gastrointestinal / Lambung':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Antihistamin & Alergi':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Vitamin & Suplemen':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Kardiovaskular & Hipertensi':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <Pill className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Master Data Obat & Farmasi Klinik
              </h1>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              Kelola master formularium obat, signa aturan pakai standar, tarif satuan, dan pemantauan stok farmasi klinik.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasPermission('create_medication') && (
            <Button
              onClick={handleOpenCreateModal}
              size="sm"
              className="h-9 gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Obat Baru</span>
            </Button>
          )}
          </div>
        </div>

        {/* TOP KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Medications */}
          <Card className="p-4 border border-slate-200 bg-white shadow-xs relative overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500">
                  Total Katalog Obat
                </p>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {metrics.totalItems}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {metrics.categoriesCount} Kategori Terdaftar
                </p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80">
                <Pill className="h-5 w-5" />
              </div>
            </div>
          </Card>

          {/* Safe Stock */}
          <Card
            onClick={() => setStockFilter(stockFilter === 'SAFE' ? 'ALL' : 'SAFE')}
            className={`p-4 border shadow-xs cursor-pointer transition-all rounded-2xl ${
              stockFilter === 'SAFE'
                ? 'border-emerald-500 bg-emerald-50/50'
                : 'border-slate-200 bg-white hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-emerald-700">
                  Stok Aman (&gt; 20)
                </p>
                <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                  {metrics.safeStockItems}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Siap diresepkan dokter</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </Card>

          {/* Low Stock Warning */}
          <Card
            onClick={() => setStockFilter(stockFilter === 'LOW' ? 'ALL' : 'LOW')}
            className={`p-4 border shadow-xs cursor-pointer transition-all rounded-2xl ${
              stockFilter === 'LOW'
                ? 'border-amber-500 bg-amber-50/50'
                : 'border-slate-200 bg-white hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-amber-700">
                  Stok Menipis (≤ 20)
                </p>
                <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
                  {metrics.lowStockItems}
                </div>
                <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1 font-bold">
                  <AlertTriangle className="h-3 w-3" /> Perlu Restock Cepat
                </p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80">
                <PackagePlus className="h-5 w-5" />
              </div>
            </div>
          </Card>

          {/* Total Value of Farmasi Inventory */}
          <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500">
                  Estimasi Nilai Stok
                </p>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {formatRupiah(metrics.totalInventoryValue)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Aset Farmasi Klinik</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/80">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* TOOLBAR & SEARCH / FILTER ACTIONS */}
        <Card className="p-4 border border-slate-200 bg-white shadow-xs space-y-3 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari obat (nama, generik, kode MED, signa)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Actions: Add Drug & View Switcher */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Table / Grid Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('TABLE')}
                  title="Tampilan Tabel"
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'TABLE'
                      ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('GRID')}
                  title="Tampilan Grid Kartu"
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'GRID'
                      ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>

              {/* Add New Drug Button */}
              <Button
                onClick={handleOpenCreateModal}
                size="sm"
                className="h-9 gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Obat Baru</span>
              </Button>
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <Tag className="h-3.5 w-3.5" />
              <span className="font-bold text-[11px]">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock State Filter Pills */}
            <div className="flex items-center gap-1 ml-auto flex-wrap">
              <span className="text-[11px] text-slate-400 font-bold mr-1">Status Stok:</span>
              <button
                onClick={() => setStockFilter('ALL')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  stockFilter === 'ALL'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Semua ({medications.length})
              </button>
              <button
                onClick={() => setStockFilter('LOW')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  stockFilter === 'LOW'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-amber-700 border-slate-200 hover:bg-amber-50'
                }`}
              >
                Menipis ({metrics.lowStockItems})
              </button>
              <button
                onClick={() => setStockFilter('SAFE')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  stockFilter === 'SAFE'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50'
                }`}
              >
                Aman ({metrics.safeStockItems})
              </button>
            </div>
          </div>
        </Card>

        {/* DRUG CATALOG CONTENT (TABLE OR GRID) */}
        {filteredMedications.length === 0 ? (
          <Card className="p-12 text-center border border-dashed border-slate-300 bg-white rounded-2xl space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Pill className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                Tidak ada obat yang cocok
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau reset filter kategori/stok untuk menampilkan obat.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua Kategori');
                setStockFilter('ALL');
              }}
              className="text-xs rounded-xl"
            >
              Reset Semua Filter
            </Button>
          </Card>
        ) : viewMode === 'TABLE' ? (
          /* TABLE VIEW */
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-xs rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-700 text-white border-b border-emerald-800 shadow-2xs font-bold select-none">
                  <tr>
                    <th className="py-3 px-4 font-bold text-white">Kode & Nama Obat</th>
                    <th className="py-3 px-4 font-bold text-white">Kategori</th>
                    <th className="py-3 px-4 font-bold text-white">Bentuk & Dosis</th>
                    <th className="py-3 px-4 font-bold text-white">Signa Standar Aturan Pakai</th>
                    <th className="py-3 px-4 font-bold text-right text-white">Tarif Satuan</th>
                    <th className="py-3 px-4 font-bold text-center text-white">Stok Farmasi</th>
                    <th className="py-3 px-4 font-bold text-right text-white">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredMedications.map((med) => {
                    const isLowStock = med.stock <= 20;
                    const isOutStock = med.stock <= 0;

                    return (
                      <tr
                        key={med.id}
                        className="hover:bg-emerald-50/40 transition-colors group"
                      >
                        {/* Name & Code */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {med.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span className="font-bold text-emerald-800">
                              {med.code}
                            </span>
                            {med.genericName && <span>• {med.genericName}</span>}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadgeClass(
                              med.category
                            )}`}
                          >
                            {med.category}
                          </span>
                        </td>

                        {/* Dosage & Unit */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">
                            {med.dosage}
                          </div>
                          <div className="text-[10px] text-slate-400">{med.unit}</div>
                        </td>

                        {/* Standard Signa */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-mono text-[11px] text-slate-700 italic bg-slate-50 px-2 py-1 rounded-md border border-slate-200 inline-block">
                            {med.standardSigna}
                          </div>
                        </td>

                        {/* Unit Price */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                          {formatRupiah(med.price)}
                          <div className="text-[10px] font-normal text-slate-400">
                            /{med.unit}
                          </div>
                        </td>

                        {/* Stock Quantity */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <Badge
                              variant={isOutStock ? 'destructive' : isLowStock ? 'warning' : 'secondary'}
                              className="text-[11px] font-mono px-2 py-0.5"
                            >
                              {med.stock} {med.unit}
                            </Badge>
                            {isLowStock && !isOutStock && (
                              <span className="text-[9px] text-amber-700 font-bold mt-0.5">
                                Menipis
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Restock Button */}
                            {hasPermission('stock_opname') && (
                              <button
                                onClick={() => handleOpenRestockModal(med)}
                                title="Restock Tambah Stok"
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                              >
                                <PackagePlus className="h-4 w-4" />
                              </button>
                            )}

                            {/* Edit Button */}
                            {hasPermission('edit_medication') && (
                              <button
                                onClick={() => handleOpenEditModal(med)}
                                title="Edit Data Obat"
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent transition-colors cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}

                            {/* Delete Button */}
                            {hasPermission('delete_medication') && (
                              <button
                                onClick={() => {
                                  setDeleteTarget(med);
                                  setIsDeleteModalOpen(true);
                                }}
                                title="Hapus Obat"
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          /* GRID CARD VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedications.map((med) => {
              const isLowStock = med.stock <= 20;
              const isOutStock = med.stock <= 0;

              return (
                <Card
                  key={med.id}
                  className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl flex flex-col justify-between space-y-3 hover:shadow-md transition-all"
                >
                  <div className="space-y-2.5">
                    {/* Card Header: Code & Category */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {med.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                          med.category
                        )}`}
                      >
                        {med.category}
                      </span>
                    </div>

                    {/* Drug Name */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight">
                        {med.name}
                      </h4>
                      {med.genericName && (
                        <p className="text-xs text-slate-500 mt-0.5">{med.genericName}</p>
                      )}
                    </div>

                    {/* Dosage & Sediaan */}
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="font-bold text-slate-900">
                        {med.dosage}
                      </span>
                      <span>•</span>
                      <span>{med.unit}</span>
                    </div>

                    {/* Signa Box */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                        Aturan Pakai Standar:
                      </span>
                      <span className="font-mono text-slate-800 font-medium">
                        {med.standardSigna}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Price, Stock & Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Harga Satuan</div>
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {formatRupiah(med.price)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={isOutStock ? 'destructive' : isLowStock ? 'warning' : 'secondary'}
                        className="text-[10px] font-mono"
                      >
                        Stok: {med.stock}
                      </Badge>
                      <button
                        onClick={() => handleOpenRestockModal(med)}
                        title="Restock Cepat"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        <PackagePlus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(med)}
                        title="Edit Obat"
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: TAMBAH / EDIT OBAT */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingMedication ? 'Edit Master Obat' : 'Tambah Obat Baru ke Katalog'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Formularium obat klinik terintegrasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              {/* Row 1: Kode & Nama Obat */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Kode Obat *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. MED-016"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="h-9 text-xs font-mono uppercase rounded-xl"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">
                    Nama Obat (Paten / Dagang) *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Sanmol 500mg, Amoxicillin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Nama Generik & Kategori */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Nama Generik / Zat Aktif
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Paracetamol"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Kategori Farmakologi *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-9 px-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                  >
                    {PRESET_CATEGORIES.filter((c) => c !== 'Semua Kategori').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Bentuk Sediaan, Dosis & Satuan */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Kekuatan Dosis *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 500 mg, 10 mg/5ml, 200 mcg"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Bentuk Sediaan / Satuan *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full h-9 px-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                  >
                    {PRESET_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Signa Standar Aturan Pakai */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Signa / Aturan Pakai Standar *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Pilih cepat atau ketik</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 3 x 1 tablet sesudah makan"
                  value={formData.standardSigna}
                  onChange={(e) => setFormData({ ...formData, standardSigna: e.target.value })}
                  className="h-9 text-xs font-mono rounded-xl"
                  required
                />
                {/* Signa quick buttons */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {PRESET_SIGNAS.slice(0, 4).map((sig) => (
                    <button
                      type="button"
                      key={sig}
                      onClick={() => setFormData({ ...formData, standardSigna: sig })}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-[10px] text-slate-600 border border-slate-200 transition-colors cursor-pointer font-medium"
                    >
                      {sig}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 5: Harga Satuan & Stok */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Tarif Harga per Satuan (Rp) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="e.g. 5000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="h-9 text-xs font-mono rounded-xl font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Jumlah Stok Tersedia *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 100"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="h-9 text-xs font-mono rounded-xl font-bold"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {editingMedication ? 'Simpan Perubahan Obat' : 'Tambahkan ke Katalog'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>

      {/* MODAL: QUICK RESTOCK */}
      <Dialog open={isRestockModalOpen} onOpenChange={setIsRestockModalOpen}>
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <PackagePlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Restock Cepat Obat</h3>
                <p className="text-xs text-slate-400">Penambahan jumlah stok farmasi</p>
              </div>
            </div>

            {restockTarget && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                <div className="font-bold text-slate-900 text-sm">
                  {restockTarget.name}
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  {restockTarget.code} • Dosis: {restockTarget.dosage} ({restockTarget.unit})
                </div>
                <div className="pt-1 flex items-center justify-between text-slate-700 font-bold">
                  <span>Stok Saat Ini:</span>
                  <span className="font-mono text-emerald-700">
                    {restockTarget.stock} {restockTarget.unit}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Jumlah Penambahan Stok ({restockTarget?.unit || 'Unit'})
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="h-10 text-sm font-mono font-bold text-center rounded-xl"
              />
              <div className="flex gap-1.5 pt-1">
                {[20, 50, 100, 200].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setRestockQty(qty)}
                    className="flex-1 py-1 rounded-xl bg-slate-100 text-[11px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    +{qty}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRestockModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSaveRestock}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Simpan Penambahan Stok
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* MODAL: KONFIRMASI HAPUS OBAT */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Obat dari Katalog?
                </h3>
                <p className="text-xs text-slate-400">Konfirmasi tindakan penghapusan</p>
              </div>
            </div>

            {deleteTarget && (
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda yakin ingin menghapus <strong>{deleteTarget.name}</strong> ({deleteTarget.code}) dari master data formularium obat? Tindakan ini tidak dapat dibatalkan.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleConfirmDelete}
                className="font-bold text-xs rounded-xl shadow-xs"
              >
                Ya, Hapus Obat
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </MainLayout>
  );
}
