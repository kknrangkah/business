'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { NurseMaster } from '@/types/rme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import {
  UserCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Users,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SetupNursesPage() {
  const { nurses, addNurse, updateNurse, deleteNurse, toggleNurseStatus, hasPermission } = useRME();

  const [searchQuery, setSearchQuery] = useState('');
  const [professionFilter, setProfessionFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState<NurseMaster | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sikp: '',
    strNumber: '',
    nik: '',
    profession: 'PERAWAT' as 'PERAWAT' | 'BIDAN' | 'PERAWAT_GIGI' | 'ASISTEN_MEDIS',
    room: 'Poli Umum & Triase',
    ihsPractitionerId: '',
    phone: '',
    email: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // Filtered nurses
  const filteredNurses = useMemo(() => {
    return nurses.filter((nurse) => {
      const matchQuery =
        nurse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nurse.sikp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nurse.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (nurse.ihsPractitionerId && nurse.ihsPractitionerId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchProfession = professionFilter === 'ALL' || nurse.profession === professionFilter;

      return matchQuery && matchProfession;
    });
  }, [nurses, searchQuery, professionFilter]);

  const handleOpenAddModal = () => {
    setEditingNurse(null);
    setFormData({
      name: '',
      sikp: '',
      strNumber: '',
      nik: '',
      profession: 'PERAWAT',
      room: 'Poli Umum & Triase',
      ihsPractitionerId: `N2000000${nurses.length + 1}`,
      phone: '',
      email: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (nurse: NurseMaster) => {
    setEditingNurse(nurse);
    setFormData({
      name: nurse.name,
      sikp: nurse.sikp,
      strNumber: nurse.strNumber || '',
      nik: nurse.nik || '',
      profession: nurse.profession,
      room: nurse.room,
      ihsPractitionerId: nurse.ihsPractitionerId || '',
      phone: nurse.phone,
      email: nurse.email || '',
      status: nurse.status || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.sikp.trim()) {
      toast.error('Nama tenaga perawat/bidan dan Nomor SIKP wajib diisi!');
      return;
    }

    if (editingNurse) {
      updateNurse(editingNurse.id, {
        name: formData.name.trim(),
        sikp: formData.sikp.trim(),
        strNumber: formData.strNumber.trim() || undefined,
        nik: formData.nik.trim() || undefined,
        profession: formData.profession,
        room: formData.room.trim(),
        ihsPractitionerId: formData.ihsPractitionerId.trim() || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        status: formData.status,
      });
      toast.success(`Data ${formData.name} berhasil diperbarui!`);
    } else {
      addNurse({
        name: formData.name.trim(),
        sikp: formData.sikp.trim(),
        strNumber: formData.strNumber.trim() || undefined,
        nik: formData.nik.trim() || undefined,
        profession: formData.profession,
        room: formData.room.trim(),
        ihsPractitionerId: formData.ihsPractitionerId.trim() || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        status: formData.status,
      });
      toast.success(`Tenaga medis baru ${formData.name} berhasil didaftarkan!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus ${name} dari daftar master perawat & bidan?`)) {
      deleteNurse(id);
      toast.success(`Data ${name} berhasil dihapus.`);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard!`);
  };

  const activeCount = nurses.filter((n) => n.status !== 'INACTIVE').length;

  const getProfessionBadge = (prof: NurseMaster['profession']) => {
    switch (prof) {
      case 'PERAWAT':
        return <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold">Perawat Medis</Badge>;
      case 'BIDAN':
        return <Badge className="bg-pink-50 text-pink-800 border-pink-200 text-[10px] font-bold">Bidan Kebidanan</Badge>;
      case 'PERAWAT_GIGI':
        return <Badge className="bg-purple-50 text-purple-800 border-purple-200 text-[10px] font-bold">Perawat Gigi</Badge>;
      case 'ASISTEN_MEDIS':
        return <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-bold">Asisten Medis</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white flex items-center justify-center shadow-xs">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Setup Perawat, Bidan &amp; Asisten Medis
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                  {nurses.length} Tenaga Terdaftar
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Kelola master profil perawat, bidan KIA, legalitas SIKP/SIKB, STR, IHS Practitioner SATUSEHAT, dan penugasan ruangan pelayanan.
              </p>
            </div>
          </div>

          {hasPermission('manage_nurse') && (
            <Button
              onClick={handleOpenAddModal}
              className="h-9 gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Perawat / Bidan</span>
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 border border-slate-200/90 bg-white shadow-xs rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Tenaga</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{nurses.length}</div>
            <span className="text-[10px] text-slate-500">Perawat &amp; Bidan</span>
          </Card>

          <Card className="p-4 border border-slate-200/90 bg-white shadow-xs rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-600 block uppercase">Tenaga Aktif</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</div>
            <span className="text-[10px] text-slate-500">Bertugas di faskes</span>
          </Card>

          <Card className="p-4 border border-slate-200/90 bg-white shadow-xs rounded-2xl">
            <span className="text-[10px] font-bold text-blue-600 block uppercase">Perawat Medis</span>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {nurses.filter((n) => n.profession === 'PERAWAT').length}
            </div>
            <span className="text-[10px] text-slate-500">Triase &amp; Tindakan</span>
          </Card>

          <Card className="p-4 border border-slate-200/90 bg-white shadow-xs rounded-2xl">
            <span className="text-[10px] font-bold text-pink-600 block uppercase">Bidan KIA</span>
            <div className="text-2xl font-black text-pink-700 mt-1">
              {nurses.filter((n) => n.profession === 'BIDAN').length}
            </div>
            <span className="text-[10px] text-slate-500">Kebidanan &amp; KB</span>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4 border border-slate-200/90 bg-white shadow-xs rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama perawat/bidan, SIKP, STR, IHS ID, atau ruangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 h-9 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setProfessionFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  professionFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Profesi ({nurses.length})
              </button>

              <button
                type="button"
                onClick={() => setProfessionFilter('PERAWAT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  professionFilter === 'PERAWAT'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Perawat ({nurses.filter((n) => n.profession === 'PERAWAT').length})
              </button>

              <button
                type="button"
                onClick={() => setProfessionFilter('BIDAN')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  professionFilter === 'BIDAN'
                    ? 'bg-pink-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Bidan ({nurses.filter((n) => n.profession === 'BIDAN').length})
              </button>

              <button
                type="button"
                onClick={() => setProfessionFilter('PERAWAT_GIGI')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  professionFilter === 'PERAWAT_GIGI'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Perawat Gigi ({nurses.filter((n) => n.profession === 'PERAWAT_GIGI').length})
              </button>
            </div>
          </div>
        </Card>

        {/* Nurses Grid */}
        {filteredNurses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2 bg-white">
            <UserCheck className="h-8 w-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">Tidak ada tenaga perawat/bidan yang cocok.</p>
            <p className="text-[11px] text-slate-400">Coba ubah kata kunci atau tambahkan tenaga baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNurses.map((nurse) => {
              const isInactive = nurse.status === 'INACTIVE';

              return (
                <Card
                  key={nurse.id}
                  className={`border transition-all p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs ${
                    isInactive
                      ? 'bg-slate-50/80 border-slate-200 opacity-75'
                      : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Profession Badge & Status */}
                    <div className="flex items-start justify-between gap-2">
                      {getProfessionBadge(nurse.profession)}

                      <button
                        type="button"
                        onClick={() => toggleNurseStatus(nurse.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer ${
                          !isInactive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Klik untuk mengubah status aktif"
                      >
                        {!isInactive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Nurse Name & Room */}
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-snug">{nurse.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{nurse.room}</p>
                    </div>

                    {/* Legalitas: SIKP/SIKB, STR, IHS */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1.5 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans text-[10px]">No. Izin (SIKP):</span>
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <span className="truncate max-w-[170px]">{nurse.sikp}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(nurse.sikp, 'No. SIKP')}
                            className="text-slate-400 hover:text-emerald-700 cursor-pointer shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {nurse.strNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-sans text-[10px]">No. STR:</span>
                          <span className="text-slate-700 truncate max-w-[170px]">{nurse.strNumber}</span>
                        </div>
                      )}

                      {nurse.ihsPractitionerId && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-sans text-[10px]">IHS Practitioner:</span>
                          <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">
                            {nurse.ihsPractitionerId}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contact info */}
                    <div className="space-y-1 text-xs text-slate-600">
                      {nurse.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{nurse.phone}</span>
                        </div>
                      )}
                      {nurse.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{nurse.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                    {hasPermission('manage_nurse') && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(nurse)}
                          className="h-7 px-2.5 text-xs font-bold gap-1 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(nurse.id, nurse.name)}
                          className="h-7 px-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add / Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {editingNurse ? 'Edit Data Perawat / Bidan' : 'Tambah Tenaga Perawat / Bidan Baru'}
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      Lengkapi identitas, SIKP, STR, dan penugasan ruangan
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-7 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Lengkap &amp; Gelar Profesi *</label>
                  <Input
                    required
                    placeholder="e.g. Ns. Nurul Hidayah, S.Kep / Bd. Siti Aminah, S.Tr.Keb"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Profession */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Jenis Profesi Tenaga</label>
                    <select
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value as any })}
                      className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold"
                    >
                      <option value="PERAWAT">Perawat Medis (Keperawatan)</option>
                      <option value="BIDAN">Bidan (Kebidanan / KIA / KB)</option>
                      <option value="PERAWAT_GIGI">Perawat Gigi (Terapis Gigi)</option>
                      <option value="ASISTEN_MEDIS">Asisten Medis / Paramedis</option>
                    </select>
                  </div>

                  {/* Room / Unit */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Ruangan / Unit Penugasan</label>
                    <Input
                      placeholder="e.g. Poli Umum & Triase / Poli KIA"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      className="h-9 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* SIKP / SIKB */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nomor SIKP / SIKB (Surat Izin Praktik) *</label>
                    <Input
                      required
                      placeholder="e.g. SIKP.503/449.1/012/Dinkes/2024"
                      value={formData.sikp}
                      onChange={(e) => setFormData({ ...formData, sikp: e.target.value })}
                      className="h-9 rounded-xl font-mono text-xs"
                    />
                  </div>

                  {/* STR */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nomor STR</label>
                    <Input
                      placeholder="e.g. STR.31.02.5.2.20.112233"
                      value={formData.strNumber}
                      onChange={(e) => setFormData({ ...formData, strNumber: e.target.value })}
                      className="h-9 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* IHS Practitioner ID */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">IHS Practitioner ID (SATUSEHAT)</label>
                    <Input
                      placeholder="e.g. N20000001"
                      value={formData.ihsPractitionerId}
                      onChange={(e) => setFormData({ ...formData, ihsPractitionerId: e.target.value })}
                      className="h-9 rounded-xl font-mono text-xs"
                    />
                  </div>

                  {/* NIK */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">NIK KTP</label>
                    <Input
                      placeholder="e.g. 3174067890120006"
                      maxLength={16}
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      className="h-9 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* No HP */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">No. Telepon / WhatsApp</label>
                    <Input
                      placeholder="e.g. 0857-1122-3344"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Status Tugas</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold"
                    >
                      <option value="ACTIVE">Aktif (Bertugas Melayani)</option>
                      <option value="INACTIVE">Nonaktif (Cuti / Non-aktif)</option>
                    </select>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="h-9 text-xs font-bold rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="h-9 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
                  >
                    {editingNurse ? 'Simpan Perubahan' : 'Tambah Tenaga'}
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
