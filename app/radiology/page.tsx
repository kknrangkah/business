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
  ScanLine,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Stethoscope,
  Building2,
  Calendar,
  Layers,
  Settings,
  Activity,
  Sparkles,
  Printer,
} from 'lucide-react';
import { RadiologyResultPrintModal, RadiologyResultPrintData } from '@/components/radiology/radiology-result-print-modal';

export default function RadiologyPage() {
  const { config, visits } = useRME();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState<string>('ALL');
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<RadiologyResultPrintData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Extract all radiology orders across visits
  const allRadiologyOrders = useMemo(() => {
    const list: Array<{
      orderId: string;
      examinationType: string;
      modality: 'USG' | 'RONTGEN_XRAY' | 'EKG' | 'LAINNYA';
      clinicalIndication?: string;
      findings?: string;
      conclusion?: string;
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
      if (v.medicalRecord?.radiologyOrders && v.medicalRecord.radiologyOrders.length > 0) {
        v.medicalRecord.radiologyOrders.forEach((ro) => {
          list.push({
            orderId: ro.id,
            examinationType: ro.examinationType,
            modality: ro.modality,
            clinicalIndication: ro.clinicalIndication,
            findings: ro.findings,
            conclusion: ro.conclusion,
            price: ro.price,
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
    return allRadiologyOrders.filter((item) => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.patientNoRM.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.examinationType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.findings && item.findings.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.conclusion && item.conclusion.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesModality = modalityFilter === 'ALL' || item.modality === modalityFilter;

      return matchesSearch && matchesModality;
    });
  }, [allRadiologyOrders, searchQuery, modalityFilter]);

  // Summary counts
  const totalCount = allRadiologyOrders.length;
  const xrayCount = allRadiologyOrders.filter((o) => o.modality === 'RONTGEN_XRAY').length;
  const usgCount = allRadiologyOrders.filter((o) => o.modality === 'USG').length;
  const ekgCount = allRadiologyOrders.filter((o) => o.modality === 'EKG').length;

  return (
    <MainLayout>
      <div className="space-y-6 w-full pb-10">
        {/* ── 1. Page Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 rounded-2xl shadow-sm border border-indigo-700/40">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
              <ScanLine className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Unit Radiologi &amp; Diagnostik Imejing
                </h1>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-[10px] font-bold">
                  Permenkes No. 24/2022
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px] font-bold">
                  {config.hasRadiology ? 'Unit Faskes Aktif' : 'Modul Dinonaktifkan'}
                </Badge>
              </div>
              <p className="text-xs text-indigo-100/80 max-w-3xl leading-relaxed">
                Pusat pengawasan permintaan pemeriksaan Rontgen Thorax/Ekstremitas, Ultrasonografi (USG Abdomen &amp; Obsgyn), serta rekaman Elektrokardiogram (EKG) dengan pencatatan hasil expertise dokter pemeriksa.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
            <Link href="/settings">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold gap-1.5 border-indigo-400/30 bg-white/10 text-white hover:bg-white/20 rounded-xl h-8"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Pengaturan Unit</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Warning if facility is disabled ── */}
        {!config.hasRadiology && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-bold text-amber-950">Unit Radiologi Dinonaktifkan pada Pengaturan Faskes</strong>
                <p className="text-xs text-amber-800 mt-0.5">
                  Faskes saat ini diset tidak memiliki sarana radiologi / USG internal. Anda dapat mengaktifkannya kapan saja melalui menu Pengaturan Profil &amp; Unit Faskes.
                </p>
              </div>
            </div>
            <Link href="/settings" className="shrink-0">
              <Button size="sm" className="h-8 text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white rounded-xl">
                Aktifkan Unit Radiologi
              </Button>
            </Link>
          </div>
        )}

        {/* ── 2. Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border border-slate-200 bg-white rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Imejing</span>
              <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <ScanLine className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{totalCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tercatat di seluruh kunjungan</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Rontgen X-Ray</span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <ScanLine className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-700 mt-2">{xrayCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Foto Thorax &amp; Tulang</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Ultrasonografi (USG)</span>
              <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-700 mt-2">{usgCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">USG Kandungan &amp; Abdomen</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">EKG 12-Lead</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2">{ekgCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Rekaman Jantung &amp; Lainnya</div>
          </Card>
        </div>

        {/* ── 3. Filters & Search ── */}
        <Card className="p-4 border border-slate-200 bg-white rounded-2xl shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari pasien, no. RM, atau jenis pemeriksaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-slate-500 font-medium">Modalitas:</span>
                <select
                  value={modalityFilter}
                  onChange={(e) => setModalityFilter(e.target.value)}
                  className="h-8 text-xs border border-slate-200 rounded-xl px-2.5 bg-white text-slate-800 font-medium cursor-pointer"
                >
                  <option value="ALL">Semua Modalitas</option>
                  <option value="RONTGEN_XRAY">Rontgen X-Ray</option>
                  <option value="USG">USG (Ultrasonografi)</option>
                  <option value="EKG">EKG (Elektrokardiogram)</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* ── 4. Table of Orders ── */}
        <Card className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Daftar Permintaan &amp; Hasil Expertise Radiologi</span>
              <Badge className="bg-indigo-100 text-indigo-800 text-[10px] font-bold">
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
                  <th className="py-3 px-4">Pemeriksaan &amp; Modalitas</th>
                  <th className="py-3 px-4">Indikasi Klinis</th>
                  <th className="py-3 px-4">Temuan Expertise</th>
                  <th className="py-3 px-4">Kesimpulan Dokter</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <ScanLine className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-xs">Tidak ada data pemeriksaan radiologi yang cocok.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Permintaan radiologi/USG dapat ditambahkan dokter saat melakukan pemeriksaan di Workspace Rekam Medis (SOAP).
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((item, idx) => (
                    <tr key={`${item.orderId}-${idx}`} className="hover:bg-indigo-50/20 transition-colors">
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
                        <div className="font-bold text-slate-900">{item.examinationType}</div>
                        <Badge className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mt-0.5">
                          {item.modality}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-700 text-xs truncate">
                          {item.clinicalIndication || <span className="text-slate-400 italic">Tidak ada indikasi</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-800 text-xs truncate">
                          {item.findings || <span className="text-slate-400 italic">Belum diisi</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-800 font-medium text-xs truncate">
                          {item.conclusion || <span className="text-slate-400 italic">Belum disimpulkan</span>}
                        </div>
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
                            <Printer className="h-3 w-3 text-indigo-700" />
                            <span>Cetak</span>
                          </Button>
                          <Link href={`/examination/${item.visitId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs font-bold gap-1 text-indigo-800 border-indigo-200 hover:bg-indigo-50 rounded-xl"
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

        {/* Modal Pratinjau Cetak Hasil Radiologi & USG */}
        <RadiologyResultPrintModal
          open={showPrintModal}
          onOpenChange={setShowPrintModal}
          order={selectedPrintOrder}
        />
      </div>
    </MainLayout>
  );
}
