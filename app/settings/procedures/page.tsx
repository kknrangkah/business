'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { ProcedureMaster } from '@/types/rme';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
} from '@/components/ui/dialog';
import {
  Activity,
  Search,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

const PRESET_PROC_CATEGORIES = [
  'Semua Kategori',
  'Tindakan Umum',
  'Bedah Minor & Luka',
  'Diagnostik & Penunjang',
  'Injeksi & Vaksinasi',
  'Kebidanan & KB',
  'Konsultasi Khusus',
];

const formatRupiah = (val: number) => {
  return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
};

export default function SettingsProceduresPage() {
  const { procedures, addProcedure, updateProcedure, deleteProcedure, hasPermission } = useRME();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProc, setEditingProc] = useState<ProcedureMaster | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProcedureMaster | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Tindakan Umum',
    price: 50000,
    notes: '',
  });

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalItems = procedures.length;
    const totalCategories = new Set(procedures.map((p) => p.category || 'Tindakan Umum')).size;
    const avgPrice = totalItems > 0 ? procedures.reduce((sum, p) => sum + p.price, 0) / totalItems : 0;
    const maxPrice = totalItems > 0 ? Math.max(...procedures.map((p) => p.price)) : 0;

    return {
      totalItems,
      totalCategories,
      avgPrice,
      maxPrice,
    };
  }, [procedures]);

  // Filtered Procedures
  const filteredProcedures = useMemo(() => {
    return procedures.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q));

      const matchesCat =
        selectedCategory === 'Semua Kategori' ||
        p.category === selectedCategory ||
        (!p.category && selectedCategory === 'Tindakan Umum');

      return matchesSearch && matchesCat;
    });
  }, [procedures, searchQuery, selectedCategory]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingProc(null);
    setFormData({
      code: `PRO-${String(procedures.length + 1).padStart(3, '0')}`,
      name: '',
      category: 'Tindakan Umum',
      price: 50000,
      notes: '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (proc: ProcedureMaster) => {
    setEditingProc(proc);
    setFormData({
      code: proc.code,
      name: proc.name,
      category: proc.category || 'Tindakan Umum',
      price: proc.price,
      notes: '',
    });
    setIsFormModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nama tindakan wajib diisi!');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('Kode tindakan wajib diisi!');
      return;
    }
    if (formData.price < 0) {
      toast.error('Tarif biaya tidak boleh negatif!');
      return;
    }

    if (editingProc) {
      updateProcedure(editingProc.id, {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
      });
      toast.success(`Tindakan ${formData.name} berhasil diperbarui!`);
    } else {
      addProcedure({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
      });
      toast.success(`Tindakan ${formData.name} berhasil ditambahkan!`);
    }

    setIsFormModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteProcedure(deleteTarget.id);
    toast.success(`Tindakan ${deleteTarget.name} telah dihapus.`);
    setIsDeleteModalOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <Activity className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Master Tindakan Medis & Tarif Pelayanan
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kelola katalog prosedur, tindakan rawat luka, bedah minor, dan tarif layanan klinis klinik.
            </p>
          </div>

          {hasPermission('create_procedure') && (
            <Button
              onClick={handleOpenCreateModal}
              size="sm"
              className="h-9 gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Tindakan Baru</span>
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">
                  Total Tindakan
                </p>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {metrics.totalItems}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {metrics.totalCategories} Kategori Layanan
                </p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">
                  Rata-rata Tarif
                </p>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {formatRupiah(metrics.avgPrice)}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Per Tindakan Medis</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">
                  Tarif Tertinggi
                </p>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {formatRupiah(metrics.maxPrice)}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Layanan Spesialistik</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/80">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Toolbar Filter & Search */}
        <Card className="p-4 border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari tindakan medis (nama, kode PRO)..."
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

          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
            >
              {PRESET_PROC_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Procedure Table */}
        <Card className="overflow-hidden border border-slate-200 bg-white shadow-xs rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-700 text-white border-b border-emerald-800 shadow-2xs font-bold select-none">
              <tr>
                <th className="py-3 px-4 font-bold text-white">Kode & Nama Tindakan</th>
                <th className="py-3 px-4 font-bold text-white">Kategori Pelayanan</th>
                <th className="py-3 px-4 font-bold text-right text-white">Tarif Biaya</th>
                <th className="py-3 px-4 font-bold text-right text-white">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProcedures.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Tidak ada tindakan medis yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredProcedures.map((p) => (
                  <tr key={p.id} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] font-bold bg-white">
                        {p.category || 'Tindakan Umum'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasPermission('edit_procedure') && (
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Tindakan"
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {hasPermission('delete_procedure') && (
                          <button
                            onClick={() => {
                              setDeleteTarget(p);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Hapus Tindakan"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* MODAL: TAMBAH / EDIT TINDAKAN */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingProc ? 'Edit Tindakan Medis' : 'Tambah Tindakan Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">Master tarif layanan faskes</p>
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
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Kode Tindakan *
                </label>
                <Input
                  required
                  placeholder="e.g. PRO-011"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="h-9 font-mono uppercase rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Nama Tindakan Medis *
                </label>
                <Input
                  required
                  placeholder="e.g. Nebulisasi Dewasa, Hecting Luka"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Kategori Pelayanan *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-9 px-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                >
                  {PRESET_PROC_CATEGORIES.filter((c) => c !== 'Semua Kategori').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Tarif Biaya Layanan (Rp) *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  placeholder="e.g. 50000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="h-9 font-mono rounded-xl font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl"
                >
                  Simpan Tindakan
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>

      {/* MODAL: KONFIRMASI HAPUS */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Tindakan?</h3>
                <p className="text-xs text-slate-400">Tindakan tidak dapat dikembalikan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus tindakan{' '}
              <strong className="text-slate-900">{deleteTarget?.name}</strong> ({deleteTarget?.code})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </MainLayout>
  );
}
