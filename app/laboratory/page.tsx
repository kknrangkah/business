'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatIndonesianDate, formatRupiah } from '@/lib/utils';
import {
  Microscope,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Stethoscope,
  Building2,
  Calendar,
  Layers,
  Settings,
  Printer,
} from 'lucide-react';
import { LabResultPrintModal, LabResultPrintData } from '@/components/laboratory/lab-result-print-modal';

export default function LaboratoryPage() {
  const { config, visits } = useRME();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<LabResultPrintData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Extract all lab orders from visits' medical records
  const allLabOrders = useMemo(() => {
    const list: Array<{
      orderId: string;
      testName: string;
      category: string;
      resultValue?: string;
      unit?: string;
      normalRange?: string;
      status: 'NORMAL' | 'ABNORMAL' | 'PENDING';
      notes?: string;
      price?: number;
      visitId: string;
      patientName: string;
      patientNoRM: string;
      patientAge?: number;
      patientGender: string;
      doctorName: string;
      date: string;
    }> = [];

    visits.forEach((v) => {
      if (v.medicalRecord?.labOrders && v.medicalRecord.labOrders.length > 0) {
        v.medicalRecord.labOrders.forEach((lo) => {
          list.push({
            orderId: lo.id,
            testName: lo.testName,
            category: lo.category,
            resultValue: lo.resultValue,
            unit: lo.unit,
            normalRange: lo.normalRange,
            status: lo.status,
            notes: lo.notes,
            price: lo.price,
            visitId: v.id,
            patientName: v.patient.name,
            patientNoRM: v.patient.noRM,
            patientAge: v.patient.age,
            patientGender: v.patient.gender,
            doctorName: v.doctorName,
            date: v.date,
          });
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visits]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return allLabOrders.filter((item) => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.patientNoRM.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.resultValue && item.resultValue.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [allLabOrders, searchQuery, categoryFilter, statusFilter]);

  // Summary Metrics
  const totalCount = allLabOrders.length;
  const pendingCount = allLabOrders.filter((o) => o.status === 'PENDING').length;
  const normalCount = allLabOrders.filter((o) => o.status === 'NORMAL').length;
  const abnormalCount = allLabOrders.filter((o) => o.status === 'ABNORMAL').length;

  return (
    <MainLayout>
      <div className="space-y-6 w-full pb-10">
        {/* ── 1. Page Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-teal-700/40">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-teal-300 flex items-center justify-center shrink-0 shadow-inner">
              <Microscope className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Unit Laboratorium Klinis
                </h1>
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-[10px] font-bold">
                  Permenkes No. 24/2022
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px] font-bold">
                  {config.hasLaboratory ? 'Unit Faskes Aktif' : 'Modul Dinonaktifkan'}
                </Badge>
              </div>
              <p className="text-xs text-teal-100/80 max-w-3xl leading-relaxed">
                Pusat pengawasan order uji spesimen darah, urin, dan kimia klinik pasien faskes dengan pemantauan status hasil, verifikasi rentang normal, serta integrasi otomatis ke rekam medis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
            <Link href="/settings">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold gap-1.5 border-teal-400/30 bg-white/10 text-white hover:bg-white/20 rounded-xl h-8"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Pengaturan Unit</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Warning if facility is disabled ── */}
        {!config.hasLaboratory && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-bold text-amber-950">Unit Laboratorium Dinonaktifkan pada Pengaturan Faskes</strong>
                <p className="text-xs text-amber-800 mt-0.5">
                  Faskes saat ini diset tidak memiliki sarana laboratorium klinik internal. Anda dapat mengaktifkannya kapan saja melalui menu Pengaturan Profil &amp; Unit Faskes.
                </p>
              </div>
            </div>
            <Link href="/settings" className="shrink-0">
              <Button size="sm" className="h-8 text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white rounded-xl">
                Aktifkan Unit Lab
              </Button>
            </Link>
          </div>
        )}

        {/* ── 2. Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border border-slate-200 bg-white rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Uji Lab</span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Microscope className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{totalCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tercatat di seluruh kunjungan</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Menunggu Hasil</span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 mt-2">{pendingCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Status pending pemeriksaan</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Hasil Normal</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2">{normalCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Sesuai rentang rujukan</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Hasil Abnormal</span>
              <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 mt-2">{abnormalCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Di luar batas nilai normal</div>
          </Card>
        </div>

        {/* ── 3. Filters & Search ── */}
        <Card className="p-4 border border-slate-200 bg-white rounded-2xl shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari pasien, no. RM, atau nama tes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-slate-500 font-medium">Kategori:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-8 text-xs border border-slate-200 rounded-xl px-2.5 bg-white text-slate-800 font-medium cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="HEMATOLOGI">Hematologi</option>
                  <option value="KIMIA_DARAH">Kimia Darah</option>
                  <option value="URINALISIS">Urinalisis</option>
                  <option value="IMUNOLOGI">Imunologi</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 text-xs border border-slate-200 rounded-xl px-2.5 bg-white text-slate-800 font-medium cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="NORMAL">Normal</option>
                  <option value="ABNORMAL">Abnormal</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* ── 4. Table of Orders ── */}
        <Card className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Daftar Permintaan &amp; Hasil Laboratorium</span>
              <Badge className="bg-teal-100 text-teal-800 text-[10px] font-bold">
                {filteredOrders.length} Ditemukan
              </Badge>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tanggal &amp; Kunjungan</th>
                  <th className="py-3 px-4">Pasien</th>
                  <th className="py-3 px-4">Pemeriksaan</th>
                  <th className="py-3 px-4">Hasil &amp; Nilai</th>
                  <th className="py-3 px-4">Rentang Rujukan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Microscope className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-xs">Tidak ada data pemeriksaan laboratorium yang cocok.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Permintaan lab dapat ditambahkan dokter saat melakukan pemeriksaan di Workspace Rekam Medis (SOAP).
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((item, idx) => (
                    <tr key={`${item.orderId}-${idx}`} className="hover:bg-teal-50/20 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{formatIndonesianDate(item.date)}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Stethoscope className="h-3 w-3" />
                          <span>{item.doctorName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.patientName}</div>
                        <div className="text-[10px] font-mono text-emerald-800 font-bold">{item.patientNoRM}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.patientGender === 'L' ? 'Laki-laki' : 'Perempuan'} &bull; {item.patientAge || '-'} Th
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.testName}</div>
                        <Badge className="text-[9px] font-bold bg-slate-100 text-slate-700 mt-0.5">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {item.resultValue ? (
                          <div className="font-bold text-slate-900 text-xs">
                            {item.resultValue} <span className="font-normal text-slate-500">{item.unit || ''}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum diisi</span>
                        )}
                        {item.notes && (
                          <div className="text-[10px] text-slate-500 italic truncate max-w-xs">{item.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-600 font-mono">
                          {item.normalRange || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          className={`text-[10px] font-bold ${
                            item.status === 'NORMAL'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : item.status === 'ABNORMAL'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPrintOrder(item);
                              setShowPrintModal(true);
                            }}
                            className="h-7 text-xs font-bold gap-1 text-slate-700 border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer"
                          >
                            <Printer className="h-3 w-3 text-teal-700" />
                            <span>Cetak</span>
                          </Button>
                          <Link href={`/examination/${item.visitId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs font-bold gap-1 text-teal-800 border-teal-200 hover:bg-teal-50 rounded-xl"
                            >
                              <span>SOAP</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal Pratinjau Cetak Hasil Laboratorium */}
        <LabResultPrintModal
          open={showPrintModal}
          onOpenChange={setShowPrintModal}
          order={selectedPrintOrder}
        />
      </div>
    </MainLayout>
  );
}
