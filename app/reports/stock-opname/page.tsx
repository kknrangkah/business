'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { MedicationMaster, StockOpnameItem, StockOpnameSession } from '@/types/rme';
import { STOCK_OPNAME_REASONS, StockOpnameReason } from '@/lib/stock-opname-mock-data';
import { formatRupiah, formatIndonesianDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Boxes,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Filter,
  Save,
  Clock,
  History,
  ClipboardList,
  ArrowUpDown,
  Building2,
  UserCheck,
  Check,
  X,
  FileCheck2,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface ActiveOpnameRow extends StockOpnameItem {
  isEdited: boolean;
}

export default function StockOpnamePage() {
  const { config, currentUser, medications, stockOpnameHistory, applyStockOpname } = useRME();

  // Active View Tab: 'ACTIVE' (Form Input & Adjustment) | 'HISTORY' (Riwayat Berita Acara)
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  // Session metadata
  const [officerName, setOfficerName] = useState(
    currentUser?.name ? `${currentUser.name} (${currentUser.role})` : ''
  );
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

  // Working Rows State for current Opname Session
  // Initialized with live medications from context
  const [workingRows, setWorkingRows] = useState<Record<string, ActiveOpnameRow>>(() => {
    const initial: Record<string, ActiveOpnameRow> = {};
    medications.forEach((med) => {
      initial[med.id] = {
        medicationId: med.id,
        code: med.code,
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        unit: med.unit,
        price: med.price,
        systemStock: med.stock,
        physicalStock: med.stock, // Default to system stock
        difference: 0,
        differenceValue: 0,
        reason: 'Sesuai (Tanpa Selisih)',
        notes: '',
        isEdited: false,
      };
    });
    return initial;
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [discrepancyFilter, setDiscrepancyFilter] = useState<'ALL' | 'DIFF_ONLY' | 'MATCH_ONLY' | 'DEFICIT_ONLY' | 'SURPLUS_ONLY' | 'CRITICAL_ONLY'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'difference' | 'systemStock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Confirmation & Print Modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPrintMinutesModalOpen, setIsPrintMinutesModalOpen] = useState(false);
  const [selectedHistoricalSession, setSelectedHistoricalSession] = useState<StockOpnameSession | null>(null);

  // Categories list for filter dropdown
  const categoriesList = useMemo(() => {
    const set = new Set(medications.map((m) => m.category));
    return Array.from(set).sort();
  }, [medications]);

  // Function to pull / reload all medication data from system
  const handlePullAllMedications = () => {
    const next: Record<string, ActiveOpnameRow> = {};
    medications.forEach((med) => {
      const existing = workingRows[med.id];
      next[med.id] = {
        medicationId: med.id,
        code: med.code,
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        unit: med.unit,
        price: med.price,
        systemStock: med.stock,
        physicalStock: existing?.isEdited ? existing.physicalStock : med.stock,
        difference: existing?.isEdited ? existing.physicalStock - med.stock : 0,
        differenceValue: existing?.isEdited ? (existing.physicalStock - med.stock) * med.price : 0,
        reason: existing?.reason || 'Sesuai (Tanpa Selisih)',
        notes: existing?.notes || '',
        isEdited: existing?.isEdited || false,
      };
    });
    setWorkingRows(next);
    toast.success(`Berhasil menarik seluruh ${medications.length} master obat dari sistem!`);
  };

  // Update physical stock for a single medication
  const handlePhysicalStockChange = (medId: string, val: number) => {
    const validVal = Math.max(0, Math.round(val * 100) / 100);
    setWorkingRows((prev) => {
      const current = prev[medId];
      if (!current) return prev;
      const diff = validVal - current.systemStock;
      const diffVal = diff * current.price;
      let autoReason = current.reason;
      if (diff === 0 && current.reason !== 'Sesuai (Tanpa Selisih)') {
        autoReason = 'Sesuai (Tanpa Selisih)';
      } else if (diff !== 0 && current.reason === 'Sesuai (Tanpa Selisih)') {
        autoReason = 'Selisih Hitung / Salah Catat';
      }

      return {
        ...prev,
        [medId]: {
          ...current,
          physicalStock: validVal,
          difference: diff,
          differenceValue: diffVal,
          reason: autoReason,
          isEdited: true,
        },
      };
    });
  };

  // Update adjustment reason
  const handleReasonChange = (medId: string, reason: string) => {
    setWorkingRows((prev) => {
      const current = prev[medId];
      if (!current) return prev;
      return {
        ...prev,
        [medId]: {
          ...current,
          reason,
          isEdited: true,
        },
      };
    });
  };

  // Update item note
  const handleNoteChange = (medId: string, notes: string) => {
    setWorkingRows((prev) => {
      const current = prev[medId];
      if (!current) return prev;
      return {
        ...prev,
        [medId]: {
          ...current,
          notes,
          isEdited: true,
        },
      };
    });
  };

  // Quick helper: Set all physical stocks = system stocks
  const handleMatchAllToSystem = () => {
    setWorkingRows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = {
          ...next[id],
          physicalStock: next[id].systemStock,
          difference: 0,
          differenceValue: 0,
          reason: 'Sesuai (Tanpa Selisih)',
          isEdited: false,
        };
      });
      return next;
    });
    toast.info('Semua stok fisik diselaraskan sama dengan stok sistem.');
  };

  // Filtered and sorted working list
  const filteredRows = useMemo(() => {
    const list = Object.values(workingRows);
    const q = searchQuery.toLowerCase().trim();

    return list
      .filter((item) => {
        // Text search
        if (q) {
          const matchCode = item.code.toLowerCase().includes(q);
          const matchName = item.name.toLowerCase().includes(q);
          const matchGen = item.genericName?.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          const matchUnit = item.unit.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchGen && !matchCat && !matchUnit) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
          return false;
        }

        // Discrepancy filter
        if (discrepancyFilter === 'DIFF_ONLY' && item.difference === 0) {
          return false;
        }
        if (discrepancyFilter === 'MATCH_ONLY' && item.difference !== 0) {
          return false;
        }
        if (discrepancyFilter === 'DEFICIT_ONLY' && item.difference >= 0) {
          return false;
        }
        if (discrepancyFilter === 'SURPLUS_ONLY' && item.difference <= 0) {
          return false;
        }
        if (discrepancyFilter === 'CRITICAL_ONLY' && item.systemStock > 20) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'name') comp = a.name.localeCompare(b.name);
        else if (sortBy === 'code') comp = a.code.localeCompare(b.code);
        else if (sortBy === 'difference') comp = a.difference - b.difference;
        else if (sortBy === 'systemStock') comp = a.systemStock - b.systemStock;

        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [workingRows, searchQuery, selectedCategory, discrepancyFilter, sortBy, sortOrder]);

  // Key KPI & Summary Calculations across ALL working items
  const summaryMetrics = useMemo(() => {
    const all = Object.values(workingRows);
    const totalItems = all.length;
    const totalSystemStock = all.reduce((sum, it) => sum + it.systemStock, 0);
    const totalPhysicalStock = all.reduce((sum, it) => sum + it.physicalStock, 0);
    const totalSystemValue = all.reduce((sum, it) => sum + it.systemStock * it.price, 0);
    const totalPhysicalValue = all.reduce((sum, it) => sum + it.physicalStock * it.price, 0);

    const discrepancyItems = all.filter((it) => it.difference !== 0);
    const deficitItems = all.filter((it) => it.difference < 0);
    const surplusItems = all.filter((it) => it.difference > 0);
    const matchedItems = all.filter((it) => it.difference === 0);

    const totalDifferenceUnits = all.reduce((sum, it) => sum + it.difference, 0);
    const totalDifferenceValue = all.reduce((sum, it) => sum + it.differenceValue, 0);
    const totalDeficitValue = deficitItems.reduce((sum, it) => sum + Math.abs(it.differenceValue), 0);
    const totalSurplusValue = surplusItems.reduce((sum, it) => sum + it.differenceValue, 0);

    return {
      totalItems,
      totalSystemStock,
      totalPhysicalStock,
      totalSystemValue,
      totalPhysicalValue,
      discrepancyCount: discrepancyItems.length,
      deficitCount: deficitItems.length,
      surplusCount: surplusItems.length,
      matchedCount: matchedItems.length,
      totalDifferenceUnits,
      totalDifferenceValue,
      totalDeficitValue,
      totalSurplusValue,
    };
  }, [workingRows]);

  // Items with discrepancy ready for adjustment
  const itemsToAdjust = useMemo(() => {
    return Object.values(workingRows).filter((it) => it.difference !== 0);
  }, [workingRows]);

  // Execute Stock Adjustment (Apply to RME Context & Master Stock)
  const handleExecuteAdjustment = () => {
    const allItems = Object.values(workingRows);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newSession = applyStockOpname({
      date: sessionDate,
      time: timeStr,
      officerName: officerName.trim() || 'Apoteker Penanggung Jawab',
      officerRole: 'Tenaga Kefarmasian',
      status: 'COMPLETED',
      notes: sessionNotes.trim(),
      totalItemsCount: allItems.length,
      itemsWithDiscrepancyCount: itemsToAdjust.length,
      totalSystemStock: summaryMetrics.totalSystemStock,
      totalPhysicalStock: summaryMetrics.totalPhysicalStock,
      totalDifferenceUnits: summaryMetrics.totalDifferenceUnits,
      totalDifferenceValue: summaryMetrics.totalDifferenceValue,
      items: allItems.map((it) => ({
        medicationId: it.medicationId,
        code: it.code,
        name: it.name,
        genericName: it.genericName,
        category: it.category,
        unit: it.unit,
        price: it.price,
        systemStock: it.systemStock,
        physicalStock: it.physicalStock,
        difference: it.difference,
        differenceValue: it.differenceValue,
        reason: it.reason,
        notes: it.notes,
      })),
    });

    setIsConfirmModalOpen(false);

    toast.success(
      `Penyesuaian stok berhasil disimpan! Dokumen: ${newSession.id}. Total ${itemsToAdjust.length} obat telah diperbarui di sistem.`,
      { duration: 6000 }
    );

    // Refresh working rows with newly applied stocks
    setWorkingRows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = {
          ...next[id],
          systemStock: next[id].physicalStock,
          difference: 0,
          differenceValue: 0,
          reason: 'Sesuai (Tanpa Selisih)',
          isEdited: false,
        };
      });
      return next;
    });

    // Auto prompt to view or print the generated session
    setSelectedHistoricalSession(newSession);
    setIsPrintMinutesModalOpen(true);
  };

  // Export Opname Table to CSV
  const handleExportCSV = () => {
    const headers = [
      'Kode Obat',
      'Nama Obat',
      'Nama Generik',
      'Kategori',
      'Satuan',
      'Harga Satuan (Rp)',
      'Stok Sistem',
      'Stok Fisik',
      'Selisih (Unit)',
      'Nilai Selisih (Rp)',
      'Alasan Penyesuaian',
      'Catatan',
    ];

    const rows = Object.values(workingRows).map((it) => [
      `"${it.code}"`,
      `"${it.name.replace(/"/g, '""')}"`,
      `"${(it.genericName || '').replace(/"/g, '""')}"`,
      `"${it.category}"`,
      `"${it.unit}"`,
      it.price,
      it.systemStock,
      it.physicalStock,
      it.difference,
      it.differenceValue,
      `"${it.reason}"`,
      `"${(it.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Stock_Opname_${sessionDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data Stock Opname berhasil diekspor ke file CSV!');
  };

  // Print Blank Physical Count Sheet for Depot Round
  const handlePrintCountSheet = () => {
    window.print();
  };

  return (
    <MainLayout>
      <div className="space-y-6 w-full pb-16">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/reports" className="hover:text-emerald-700 flex items-center gap-1">
            <span>Laporan</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Stock Opname & Penyesuaian Obat</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <Boxes className="h-5 w-5" />
              </span>
              <span>Stock Opname & Penyesuaian Obat (Adjustment)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pencarian dan penarikan seluruh data obat farmasi klinik, verifikasi stok fisik vs sistem komputer, perhitungan selisih nilai rupiah, serta eksekusi penyesuaian stok inventaris.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePullAllMedications}
              className="gap-1.5 text-xs bg-white shadow-2xs rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
              title="Tarik / Segarkan seluruh master data obat dari sistem"
            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-700" />
              <span>Tarik Data Obat ({medications.length})</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 text-xs bg-white shadow-2xs rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
              <span>Ekspor CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintCountSheet}
              className="gap-1.5 text-xs bg-white shadow-2xs rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              <span>Cetak Form Opname</span>
            </Button>
          </div>
        </div>

        {/* View Mode Navigation Tabs (Lembar Kerja Opname vs Riwayat Audit) */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('ACTIVE')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'ACTIVE'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Lembar Kerja Opname & Penyesuaian</span>
              <Badge
                className={`ml-1 text-[10px] font-mono font-bold ${
                  itemsToAdjust.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {itemsToAdjust.length > 0 ? `${itemsToAdjust.length} Selisih` : 'Semua Sesuai'}
              </Badge>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('HISTORY')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'HISTORY'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Riwayat Berita Acara Opname</span>
              <Badge className="ml-1 text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                {stockOpnameHistory.length} Dokumen
              </Badge>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 pb-2">
            <span>Faskes:</span>
            <span className="font-bold text-slate-800">{config.practiceName}</span>
          </div>
        </div>

        {activeTab === 'ACTIVE' ? (
          <>
            {/* Top KPI Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <Card className="p-4 border border-slate-200 bg-white shadow-2xs rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Total Master Obat</span>
                  <Boxes className="h-4 w-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                  {summaryMetrics.totalItems}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Total stok fisik: <strong className="font-mono text-slate-700">{summaryMetrics.totalPhysicalStock}</strong> unit
                </div>
              </Card>

              <Card className="p-4 border border-slate-200 bg-white shadow-2xs rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Nilai Aset Sistem</span>
                  <span className="text-xs font-mono font-bold text-slate-400">HNA</span>
                </div>
                <div className="text-xl font-black text-slate-900 mt-1 font-mono truncate">
                  {formatRupiah(summaryMetrics.totalSystemValue)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Fisik: <span className="font-mono text-slate-700">{formatRupiah(summaryMetrics.totalPhysicalValue)}</span>
                </div>
              </Card>

              <Card className="p-4 border border-slate-200 bg-white shadow-2xs rounded-2xl border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Item Ada Selisih</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
                  {summaryMetrics.discrepancyCount} <span className="text-xs font-normal text-slate-400">Obat</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {summaryMetrics.deficitCount} Kurang • {summaryMetrics.surplusCount} Lebih
                </div>
              </Card>

              <Card className="p-4 border border-slate-200 bg-white shadow-2xs rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Net Selisih Unit</span>
                  {summaryMetrics.totalDifferenceUnits < 0 ? (
                    <TrendingDown className="h-4 w-4 text-rose-500" />
                  ) : summaryMetrics.totalDifferenceUnits > 0 ? (
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
                <div
                  className={`text-2xl font-black mt-1 font-mono ${
                    summaryMetrics.totalDifferenceUnits < 0
                      ? 'text-rose-600'
                      : summaryMetrics.totalDifferenceUnits > 0
                      ? 'text-blue-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {summaryMetrics.totalDifferenceUnits > 0 ? `+${summaryMetrics.totalDifferenceUnits}` : summaryMetrics.totalDifferenceUnits}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {summaryMetrics.matchedCount} obat persis sesuai
                </div>
              </Card>

              <Card
                className={`p-4 border shadow-2xs rounded-2xl ${
                  summaryMetrics.totalDifferenceValue < 0
                    ? 'border-rose-200 bg-rose-50/40'
                    : summaryMetrics.totalDifferenceValue > 0
                    ? 'border-blue-200 bg-blue-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Selisih Nilai (Rp)</span>
                  <span className="text-xs font-bold">Variance</span>
                </div>
                <div
                  className={`text-xl font-black mt-1 font-mono truncate ${
                    summaryMetrics.totalDifferenceValue < 0
                      ? 'text-rose-700'
                      : summaryMetrics.totalDifferenceValue > 0
                      ? 'text-blue-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {summaryMetrics.totalDifferenceValue > 0 ? '+' : ''}
                  {formatRupiah(summaryMetrics.totalDifferenceValue)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Defisit: <span className="font-mono text-rose-600">{formatRupiah(summaryMetrics.totalDeficitValue)}</span>
                </div>
              </Card>
            </div>

            {/* Session Metadata Controls Bar */}
            <Card className="p-4 border border-slate-200 bg-slate-50/70 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-center">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Tanggal Opname
                  </label>
                  <Input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="h-9 bg-white text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Petugas Pemeriksa / Apoteker
                  </label>
                  <Input
                    type="text"
                    placeholder="Nama Apoteker / Petugas"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="h-9 bg-white text-xs rounded-xl"
                  />
                </div>

                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Catatan / Alasan Sesi Opname
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: Stock opname rutin akhir bulan, audit investigasi selisih..."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="h-9 bg-white text-xs rounded-xl"
                  />
                </div>
              </div>
            </Card>

            {/* Search, Filter & Batch Action Toolbar */}
            <Card className="p-4 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative w-full lg:w-96">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Cari kode obat, nama paten, generik, kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filters & Dropdowns */}
                <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                  {/* Category Filter */}
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-9 text-xs bg-slate-50 rounded-xl w-44"
                  >
                    <option value="ALL">Semua Kategori</option>
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>

                  {/* Discrepancy Status Filter */}
                  <Select
                    value={discrepancyFilter}
                    onChange={(e) => setDiscrepancyFilter(e.target.value as any)}
                    className="h-9 text-xs bg-slate-50 rounded-xl w-48"
                  >
                    <option value="ALL">Semua Status Selisih</option>
                    <option value="DIFF_ONLY">⚠️ Hanya yang Ada Selisih</option>
                    <option value="MATCH_ONLY">✓ Hanya yang Sesuai (Match)</option>
                    <option value="DEFICIT_ONLY">🔴 Selisih Kurang (Minus)</option>
                    <option value="SURPLUS_ONLY">🔵 Selisih Lebih (Plus)</option>
                    <option value="CRITICAL_ONLY">⚠️ Stok Menipis (≤ 20)</option>
                  </Select>

                  {/* Quick Batch Buttons */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMatchAllToSystem}
                    className="h-9 text-xs rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                    title="Setel semua nilai stok fisik sama dengan stok sistem komputer"
                  >
                    <span>Samakan Sistem</span>
                  </Button>
                </div>
              </div>

              {/* Active Filter Chips & Summary count */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 flex-wrap gap-2">
                <div className="text-slate-500">
                  Menampilkan <strong className="text-slate-800 font-mono">{filteredRows.length}</strong> dari{' '}
                  <strong className="text-slate-800 font-mono">{summaryMetrics.totalItems}</strong> jenis obat
                  {discrepancyFilter === 'DIFF_ONLY' && (
                    <span className="ml-2 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Filter: Ada Selisih Saja ({summaryMetrics.discrepancyCount})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Urutkan:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (sortBy === 'name') setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('name');
                        setSortOrder('asc');
                      }
                    }}
                    className={`px-2 py-1 text-[11px] rounded-lg border font-semibold ${
                      sortBy === 'name' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Nama {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sortBy === 'difference') setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('difference');
                        setSortOrder('asc');
                      }
                    }}
                    className={`px-2 py-1 text-[11px] rounded-lg border font-semibold ${
                      sortBy === 'difference' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Selisih {sortBy === 'difference' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sortBy === 'systemStock') setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('systemStock');
                        setSortOrder('asc');
                      }
                    }}
                    className={`px-2 py-1 text-[11px] rounded-lg border font-semibold ${
                      sortBy === 'systemStock' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Stok {sortBy === 'systemStock' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </div>
              </div>
            </Card>

            {/* Interactive Opname & Adjustment Table */}
            <Card className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">No</th>
                      <th className="py-3 px-3 w-28">Kode Obat</th>
                      <th className="py-3 px-3 min-w-[200px]">Nama Obat & Sediaan</th>
                      <th className="py-3 px-2 text-center w-20">Satuan</th>
                      <th className="py-3 px-3 text-right w-24">Harga (Rp)</th>
                      <th className="py-3 px-3 text-center w-24 bg-slate-100/60 font-black">Stok Sistem</th>
                      <th className="py-3 px-3 text-center min-w-[190px] bg-emerald-50/40 text-emerald-900 font-black">
                        Stok Fisik (Opname)
                      </th>
                      <th className="py-3 px-3 text-center w-28">Selisih Unit</th>
                      <th className="py-3 px-3 text-right w-32">Nilai Selisih</th>
                      <th className="py-3 px-3 min-w-[220px]">Alasan Penyesuaian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          <Boxes className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-slate-600">Tidak ada obat yang cocok dengan filter</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Coba ubah kata kunci pencarian atau reset filter kategori.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((item, idx) => {
                        const hasDiff = item.difference !== 0;
                        const isDeficit = item.difference < 0;
                        const isSurplus = item.difference > 0;

                        return (
                          <tr
                            key={item.medicationId}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              hasDiff ? (isDeficit ? 'bg-rose-50/30' : 'bg-blue-50/30') : ''
                            }`}
                          >
                            {/* No */}
                            <td className="py-3 px-3 text-center font-mono text-slate-400">
                              {idx + 1}
                            </td>

                            {/* Kode Obat */}
                            <td className="py-3 px-3 font-mono font-bold text-slate-700">
                              {item.code}
                            </td>

                            {/* Nama Obat & Generik */}
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 leading-tight">
                                {item.name}
                              </div>
                              {item.genericName && (
                                <div className="text-[11px] text-slate-400 italic">
                                  {item.genericName}
                                </div>
                              )}
                              <div className="mt-1 flex items-center gap-1.5">
                                <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[9px] px-1.5 py-0">
                                  {item.category}
                                </Badge>
                                {item.systemStock <= 20 && (
                                  <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[9px] px-1.5 py-0">
                                    Stok Menipis
                                  </Badge>
                                )}
                              </div>
                            </td>

                            {/* Satuan */}
                            <td className="py-3 px-2 text-center text-slate-600 font-medium">
                              {item.unit}
                            </td>

                            {/* Harga Satuan */}
                            <td className="py-3 px-3 text-right font-mono text-slate-700 font-medium">
                              {formatRupiah(item.price)}
                            </td>

                            {/* Stok Sistem (Komputer) */}
                            <td className="py-3 px-3 text-center bg-slate-100/50">
                              <span className="font-mono text-sm font-bold text-slate-800">
                                {item.systemStock}
                              </span>
                            </td>

                            {/* Stok Fisik (Opname Input) */}
                            <td className="py-3 px-3 bg-emerald-50/30">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handlePhysicalStockChange(item.medicationId, item.physicalStock - 1)}
                                  className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                                  title="Kurang 1"
                                >
                                  -
                                </button>
                                <Input
                                  type="number"
                                  min={0}
                                  value={item.physicalStock}
                                  onChange={(e) =>
                                    handlePhysicalStockChange(item.medicationId, parseFloat(e.target.value) || 0)
                                  }
                                  className={`h-8 w-20 text-center font-mono font-bold text-sm bg-white rounded-lg border ${
                                    hasDiff
                                      ? isDeficit
                                        ? 'border-rose-400 text-rose-700 ring-1 ring-rose-200'
                                        : 'border-blue-400 text-blue-700 ring-1 ring-blue-200'
                                      : 'border-slate-300 text-slate-900'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handlePhysicalStockChange(item.medicationId, item.physicalStock + 1)}
                                  className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                                  title="Tambah 1"
                                >
                                  +
                                </button>
                                {hasDiff && (
                                  <button
                                    type="button"
                                    onClick={() => handlePhysicalStockChange(item.medicationId, item.systemStock)}
                                    className="h-7 px-1.5 text-[10px] rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 font-semibold cursor-pointer"
                                    title="Kembalikan ke stok sistem"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Selisih Unit */}
                            <td className="py-3 px-3 text-center">
                              {hasDiff ? (
                                <Badge
                                  className={`font-mono text-xs font-bold px-2 py-0.5 ${
                                    isDeficit
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : 'bg-blue-100 text-blue-800 border-blue-300'
                                  }`}
                                >
                                  {isSurplus ? `+${item.difference}` : item.difference} {item.unit}
                                </Badge>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                  <Check className="h-3 w-3" />
                                  <span>0 (Sesuai)</span>
                                </span>
                              )}
                            </td>

                            {/* Nilai Selisih Rupiah */}
                            <td className="py-3 px-3 text-right">
                              {hasDiff ? (
                                <span
                                  className={`font-mono font-bold text-xs ${
                                    isDeficit ? 'text-rose-600' : 'text-blue-600'
                                  }`}
                                >
                                  {isSurplus ? '+' : ''}
                                  {formatRupiah(item.differenceValue)}
                                </span>
                              ) : (
                                <span className="font-mono text-slate-400 text-xs">Rp 0</span>
                              )}
                            </td>

                            {/* Alasan Penyesuaian & Notes */}
                            <td className="py-3 px-3 space-y-1">
                              <Select
                                value={item.reason}
                                onChange={(e) => handleReasonChange(item.medicationId, e.target.value)}
                                className={`h-7 text-[11px] rounded-lg bg-white ${
                                  hasDiff && item.reason === 'Sesuai (Tanpa Selisih)'
                                    ? 'border-amber-300 bg-amber-50/50'
                                    : 'border-slate-200'
                                }`}
                              >
                                {STOCK_OPNAME_REASONS.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </Select>
                              {hasDiff && (
                                <Input
                                  type="text"
                                  placeholder="Keterangan fisik / nomor batch / kadaluarsa..."
                                  value={item.notes || ''}
                                  onChange={(e) => handleNoteChange(item.medicationId, e.target.value)}
                                  className="h-6 text-[10px] bg-white border-slate-200 rounded-md"
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Bottom Sticky Action Bar: Terapkan Penyesuaian (Light Mode) */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md text-slate-900 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200 ring-1 ring-slate-900/5">
              <div className="flex items-center gap-3.5 flex-wrap">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>Ringkasan Hasil Opname</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-semibold lowercase">siap disesuaikan</span>
                  </div>
                  <div className="text-sm font-bold flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-slate-800">{summaryMetrics.totalItems} Obat Dihitung</span>
                    <span className="text-slate-300">•</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                        summaryMetrics.discrepancyCount > 0
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {summaryMetrics.discrepancyCount} Item Ada Selisih
                    </span>
                    <span className="text-slate-300">•</span>
                    <span
                      className={`font-mono font-bold text-xs ${
                        summaryMetrics.totalDifferenceValue < 0
                          ? 'text-rose-600'
                          : summaryMetrics.totalDifferenceValue > 0
                          ? 'text-blue-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      Total Variance: {summaryMetrics.totalDifferenceValue > 0 ? '+' : ''}
                      {formatRupiah(summaryMetrics.totalDifferenceValue)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMatchAllToSystem}
                  className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs rounded-xl h-9.5 px-3.5 font-bold shadow-2xs"
                >
                  Batal / Reset
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={itemsToAdjust.length === 0}
                  className={`gap-2 text-xs font-bold rounded-xl h-9.5 px-4 shadow-sm transition-all ${
                    itemsToAdjust.length > 0
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {itemsToAdjust.length > 0
                      ? `Terapkan Penyesuaian (${itemsToAdjust.length} Obat)`
                      : 'Semua Stok Sudah Sesuai'}
                  </span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: RIWAYAT & BERITA ACARA STOCK OPNAME */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Riwayat Berita Acara Stock Opname</h3>
                <p className="text-xs text-slate-500">
                  Daftar seluruh sesi opname dan audit penyesuaian stok obat yang telah disetujui & dieksekusi ke sistem.
                </p>
              </div>
            </div>

            {stockOpnameHistory.length === 0 ? (
              <Card className="p-12 text-center border border-slate-200 bg-white rounded-2xl">
                <History className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-700">Belum Ada Riwayat Stock Opname</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Lakukan stock opname pada tab lembar kerja aktif dan klik &quot;Terapkan Penyesuaian&quot; untuk mencatat sesi audit.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {stockOpnameHistory.map((session) => (
                  <Card
                    key={session.id}
                    className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs hover:border-emerald-300 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-emerald-800 text-sm">
                            {session.id}
                          </span>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                            SELESAI / ADJUSTED
                          </Badge>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-slate-600">
                            {formatIndonesianDate(session.date)} ({session.time} WIB)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-1">
                          Petugas: <strong className="text-slate-800">{session.officerName}</strong>
                          {session.notes && ` — "${session.notes}"`}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="text-left lg:text-right">
                          <div className="text-[11px] text-slate-400 font-semibold">Total Selisih</div>
                          <div
                            className={`font-mono text-sm font-bold ${
                              session.totalDifferenceValue < 0
                                ? 'text-rose-600'
                                : session.totalDifferenceValue > 0
                                ? 'text-blue-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {session.itemsWithDiscrepancyCount} item (
                            {session.totalDifferenceUnits > 0 ? `+${session.totalDifferenceUnits}` : session.totalDifferenceUnits} unit)
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {session.totalDifferenceValue > 0 ? '+' : ''}
                            {formatRupiah(session.totalDifferenceValue)}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedHistoricalSession(session);
                            setIsPrintMinutesModalOpen(true);
                          }}
                          className="gap-1.5 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                        >
                          <Printer className="h-3.5 w-3.5 text-emerald-700" />
                          <span>Berita Acara</span>
                        </Button>
                      </div>
                    </div>

                    {/* Table of items adjusted in this session */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Rincian Item Disesuaikan:
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                              <th className="py-1.5 px-2">Kode</th>
                              <th className="py-1.5 px-2">Nama Obat</th>
                              <th className="py-1.5 px-2 text-center">Stok Sistem</th>
                              <th className="py-1.5 px-2 text-center">Stok Fisik</th>
                              <th className="py-1.5 px-2 text-center">Selisih</th>
                              <th className="py-1.5 px-2 text-right">Nilai Selisih</th>
                              <th className="py-1.5 px-2">Alasan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {session.items
                              .filter((it) => it.difference !== 0)
                              .map((it) => (
                                <tr key={it.medicationId} className="hover:bg-slate-50/60">
                                  <td className="py-1.5 px-2 font-mono text-slate-600">{it.code}</td>
                                  <td className="py-1.5 px-2 font-bold text-slate-800">{it.name}</td>
                                  <td className="py-1.5 px-2 text-center font-mono text-slate-500">{it.systemStock}</td>
                                  <td className="py-1.5 px-2 text-center font-mono font-bold text-emerald-700">{it.physicalStock}</td>
                                  <td className="py-1.5 px-2 text-center font-mono font-bold">
                                    <span className={it.difference < 0 ? 'text-rose-600' : 'text-blue-600'}>
                                      {it.difference > 0 ? `+${it.difference}` : it.difference} {it.unit}
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                                    {it.differenceValue > 0 ? '+' : ''}
                                    {formatRupiah(it.differenceValue)}
                                  </td>
                                  <td className="py-1.5 px-2 text-slate-600">
                                    {it.reason}
                                    {it.notes && ` (${it.notes})`}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: REVIEW & KONFIRMASI PENYESUAIAN STOK */}
        <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen} maxWidth="2xl">
          <DialogHeader onClose={() => setIsConfirmModalOpen(false)}>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-emerald-700" />
              <span>Konfirmasi Penyesuaian Stok (Adjustment)</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs text-slate-600 mt-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Peringatan Verifikasi:</strong> Anda akan memperbarui stok komputer untuk{' '}
                <strong>{itemsToAdjust.length} obat</strong> agar sesuai dengan hasil hitung fisik riil.
                Penyesuaian ini akan langsung tersinkronisasi ke katalog stok resep dokter dan tercatat ke Berita Acara Opname.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Tanggal & Waktu</span>
                <span className="font-bold text-slate-800">{formatIndonesianDate(sessionDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Petugas Pelaksana</span>
                <span className="font-bold text-slate-800">{officerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Total Item Disesuaikan</span>
                <span className="font-bold text-slate-800">{itemsToAdjust.length} jenis obat</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Net Nilai Selisih</span>
                <span
                  className={`font-bold font-mono ${
                    summaryMetrics.totalDifferenceValue < 0 ? 'text-rose-600' : 'text-blue-600'
                  }`}
                >
                  {summaryMetrics.totalDifferenceValue > 0 ? '+' : ''}
                  {formatRupiah(summaryMetrics.totalDifferenceValue)}
                </span>
              </div>
            </div>

            {/* Rincian Obat yang Berubah */}
            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 sticky top-0 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-2">Kode & Nama Obat</th>
                    <th className="p-2 text-center">Stok Lama</th>
                    <th className="p-2 text-center">Stok Baru (Fisik)</th>
                    <th className="p-2 text-center">Selisih</th>
                    <th className="p-2">Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemsToAdjust.map((it) => (
                    <tr key={it.medicationId} className="hover:bg-slate-50">
                      <td className="p-2">
                        <div className="font-bold text-slate-800">{it.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{it.code}</div>
                      </td>
                      <td className="p-2 text-center font-mono text-slate-500">{it.systemStock}</td>
                      <td className="p-2 text-center font-mono font-bold text-emerald-700">{it.physicalStock}</td>
                      <td className="p-2 text-center font-mono font-bold">
                        <span className={it.difference < 0 ? 'text-rose-600' : 'text-blue-600'}>
                          {it.difference > 0 ? `+${it.difference}` : it.difference}
                        </span>
                      </td>
                      <td className="p-2 text-[11px] text-slate-600">
                        {it.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteAdjustment}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Ya, Eksekusi Penyesuaian Sekarang</span>
            </Button>
          </DialogFooter>
        </Dialog>

        {/* MODAL 2: CETAK BERITA ACARA STOCK OPNAME RESMI */}
        <Dialog open={isPrintMinutesModalOpen} onOpenChange={setIsPrintMinutesModalOpen} maxWidth="3xl">
          <DialogHeader className="print:hidden" onClose={() => setIsPrintMinutesModalOpen(false)}>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Dokumen Berita Acara Stock Opname Farmasi</span>
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 text-xs font-bold rounded-xl"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Dokumen</span>
                </Button>
              </DialogTitle>
            </DialogHeader>

            {selectedHistoricalSession && (
              <div className="space-y-6 text-slate-800 font-sans p-2">
                {/* Official Letterhead (Kop Surat Klinik) */}
                <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
                  <div className="text-base font-black uppercase tracking-wider text-slate-900">
                    {config.practiceName}
                  </div>
                  <div className="text-xs text-slate-600">
                    {config.address} • Telp: {config.phone}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    SIP/Izin Operasional: {config.sip}
                  </div>
                </div>

                {/* Title */}
                <div className="text-center space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-wider underline">
                    BERITA ACARA STOCK OPNAME & PENYESUAIAN PERSEDIAAN OBAT
                  </h2>
                  <div className="text-xs font-mono text-slate-500">
                    Nomor Dokumen: <strong>{selectedHistoricalSession.id}</strong>
                  </div>
                </div>

                {/* Meta Description */}
                <p className="text-xs leading-relaxed text-justify">
                  Pada hari ini, <strong>{formatIndonesianDate(selectedHistoricalSession.date)}</strong> pukul{' '}
                  <strong>{selectedHistoricalSession.time} WIB</strong>, telah dilaksanakan kegiatan pemeriksaan fisik
                  dan pencocokan stok persediaan farmasi (Stock Opname) di unit depo farmasi/apotek{' '}
                  <strong>{config.practiceName}</strong> oleh petugas pemeriksa berwenang:
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Petugas Pelaksana:</span>
                    <strong className="text-slate-800">{selectedHistoricalSession.officerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status Sesi:</span>
                    <strong className="text-emerald-800">{selectedHistoricalSession.status} (Penyesuaian Diterapkan)</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Catatan Pemeriksaan:</span>
                    <span className="text-slate-700 italic">
                      {selectedHistoricalSession.notes || 'Tidak ada catatan tambahan'}
                    </span>
                  </div>
                </div>

                {/* Table of Discrepancies */}
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-2">
                    Daftar Rincian Selisih & Penyesuaian Obat:
                  </div>
                  <table className="w-full text-[11px] border border-slate-300 border-collapse">
                    <thead className="bg-slate-100 font-bold border-b border-slate-300">
                      <tr>
                        <th className="border border-slate-300 p-1.5 text-center w-8">No</th>
                        <th className="border border-slate-300 p-1.5">Kode</th>
                        <th className="border border-slate-300 p-1.5">Nama Obat</th>
                        <th className="border border-slate-300 p-1.5 text-center">Satuan</th>
                        <th className="border border-slate-300 p-1.5 text-center">Stok Sistem</th>
                        <th className="border border-slate-300 p-1.5 text-center">Stok Fisik</th>
                        <th className="border border-slate-300 p-1.5 text-center">Selisih</th>
                        <th className="border border-slate-300 p-1.5 text-right">Nilai Selisih (Rp)</th>
                        <th className="border border-slate-300 p-1.5">Alasan Penyesuaian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedHistoricalSession.items
                        .filter((it) => it.difference !== 0)
                        .map((it, idx) => (
                          <tr key={it.medicationId}>
                            <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                            <td className="border border-slate-300 p-1.5 font-mono">{it.code}</td>
                            <td className="border border-slate-300 p-1.5 font-bold">{it.name}</td>
                            <td className="border border-slate-300 p-1.5 text-center">{it.unit}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-mono">{it.systemStock}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">
                              {it.physicalStock}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">
                              {it.difference > 0 ? `+${it.difference}` : it.difference}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono">
                              {it.differenceValue > 0 ? '+' : ''}
                              {formatRupiah(it.differenceValue)}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-[10px]">
                              {it.reason}
                              {it.notes && ` (${it.notes})`}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={6} className="border border-slate-300 p-2 text-right">
                          Total Selisih Net:
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono">
                          {selectedHistoricalSession.totalDifferenceUnits > 0
                            ? `+${selectedHistoricalSession.totalDifferenceUnits}`
                            : selectedHistoricalSession.totalDifferenceUnits}
                        </td>
                        <td className="border border-slate-300 p-2 text-right font-mono">
                          {selectedHistoricalSession.totalDifferenceValue > 0 ? '+' : ''}
                          {formatRupiah(selectedHistoricalSession.totalDifferenceValue)}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-500 text-[10px]">
                          {selectedHistoricalSession.itemsWithDiscrepancyCount} obat disesuaikan
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <p className="text-xs leading-relaxed text-justify">
                  Demikian Berita Acara Stock Opname ini dibuat dengan sebenarnya sesuai dengan kondisi fisik riil di lapangan,
                  untuk dipergunakan sebagai dasar penyesuaian kartu stok dan laporan pertanggungjawaban persediaan farmasi klinik.
                </p>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs">
                  <div className="space-y-16">
                    <div>Petugas Farmasi / Pelaksana,</div>
                    <div>
                      <div className="font-bold underline">{selectedHistoricalSession.officerName}</div>
                      <div className="text-[10px] text-slate-500">Tenaga Kefarmasian</div>
                    </div>
                  </div>

                  <div className="space-y-16">
                    <div>Apoteker Penanggung Jawab,</div>
                    <div>
                      <div className="font-bold underline">Petugas Farmasi / Apoteker</div>
                      <div className="text-[10px] text-slate-500">Penanggung Jawab Obat</div>
                    </div>
                  </div>

                  <div className="space-y-16">
                    <div>Pimpinan Klinik / Direktur,</div>
                    <div>
                      <div className="font-bold underline">{config.doctorName || 'Penanggung Jawab Medis'}</div>
                      <div className="text-[10px] text-slate-500">SIP. {config.sip || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-4 print:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPrintMinutesModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Tutup
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => window.print()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Berita Acara</span>
              </Button>
            </DialogFooter>
        </Dialog>
      </div>
    </MainLayout>
  );
}
