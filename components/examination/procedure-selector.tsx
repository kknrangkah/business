'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ProcedureItem, ICD9Master } from '@/types/rme';
import { useRME } from '@/context/rme-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/utils';
import {
  Search,
  Plus,
  X,
  Activity,
  Check,
  Tag,
  Percent,
  Coins,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProcedureSelectorProps {
  procedures: ProcedureItem[];
  onChange: (procedures: ProcedureItem[]) => void;
  disabled?: boolean;
}

const DISCOUNT_REASONS_PRESET = [
  'Keringanan Pasien Tidak Mampu',
  'Diskon Karyawan & Keluarga',
  'Promo Layanan Klinik',
  'Kebijakan Dokter / Courtesy',
  'Paket Tindakan Khusus',
];

const DISCOUNT_PERCENT_PRESETS = [0, 10, 20, 25, 50, 100];

export function ProcedureSelector({ procedures, onChange, disabled = false }: ProcedureSelectorProps) {
  const { icd9List, addICD9, procedures: masterLegacyProcedures } = useRME();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Menutup dropdown otomatis saat klik di luar area pencarian
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [manualName, setManualName] = useState('');
  const [manualEnglish, setManualEnglish] = useState('');
  const [manualCategory, setManualCategory] = useState('Tindakan Medis');
  const [manualTariff, setManualTariff] = useState('50000');

  // Unified master catalog (ICD-9-CM primary, with legacy procedure compatibility)
  const masterCatalog = useMemo(() => {
    const list: ICD9Master[] = [...icd9List];
    if (masterLegacyProcedures && masterLegacyProcedures.length > 0) {
      masterLegacyProcedures.forEach((lp) => {
        if (!list.some((i) => i.name.toLowerCase() === lp.name.toLowerCase() || i.code === lp.code)) {
          list.push({
            id: lp.id,
            code: lp.code,
            name: lp.name,
            category: lp.category,
            standardTariff: lp.price,
            isActive: true,
          });
        }
      });
    }
    return list;
  }, [icd9List, masterLegacyProcedures]);

  // Filter master procedures
  const filteredMaster = searchQuery.trim()
    ? masterCatalog.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.englishName && p.englishName.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
        );
      })
    : masterCatalog.slice(0, 8);

  const calculatePricing = (
    basePrice: number,
    discountType: 'PERCENTAGE' | 'NOMINAL',
    discountPercent: number = 0,
    discountAmount: number = 0
  ) => {
    let finalDiscountAmount = 0;
    let finalDiscountPercent = 0;

    if (discountType === 'PERCENTAGE') {
      const pct = Math.max(0, Math.min(100, Number(discountPercent) || 0));
      finalDiscountPercent = pct;
      finalDiscountAmount = Math.round((basePrice * pct) / 100);
    } else {
      const amt = Math.max(0, Math.min(basePrice, Number(discountAmount) || 0));
      finalDiscountAmount = amt;
      finalDiscountPercent = basePrice > 0 ? Math.round((amt / basePrice) * 100) : 0;
    }

    const finalPrice = Math.max(0, basePrice - finalDiscountAmount);

    return {
      discountType,
      discountPercent: finalDiscountPercent,
      discountAmount: finalDiscountAmount,
      finalPrice,
    };
  };

  const handleAddProcedure = (proc: { id?: string; code: string; name: string; price?: number; standardTariff?: number; category?: string }) => {
    if (disabled) return;
    const basePrice = proc.price !== undefined ? proc.price : (proc.standardTariff !== undefined ? proc.standardTariff : 50000);

    // Prevent duplicate
    if (procedures.some((p) => p.code === proc.code || p.name === proc.name)) {
      toast.info(`Tindakan ${proc.name} (${proc.code}) sudah dipilih.`);
      return;
    }

    const newProc: ProcedureItem = {
      id: proc.id || `proc-${Date.now()}`,
      code: proc.code,
      name: proc.name,
      price: basePrice,
      category: proc.category || 'Tindakan Medis',
      discountType: 'PERCENTAGE',
      discountPercent: 0,
      discountAmount: 0,
      finalPrice: basePrice,
      discountReason: '',
    };

    const nextList = [...procedures, newProc];
    onChange(nextList);
    setSearchQuery('');
    setShowDropdown(false);
    // Auto-open discount panel for newly added procedure
    setExpandedIndex(nextList.length - 1);
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    onChange(procedures.filter((_, idx) => idx !== index));
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleUpdateProcedure = (index: number, updates: Partial<ProcedureItem>) => {
    if (disabled) return;
    const current = procedures[index];
    if (!current) return;

    const basePrice = updates.price !== undefined ? updates.price : current.price;
    const discountType = updates.discountType !== undefined ? updates.discountType : current.discountType || 'PERCENTAGE';
    const discountPercent = updates.discountPercent !== undefined ? updates.discountPercent : current.discountPercent || 0;
    const discountAmount = updates.discountAmount !== undefined ? updates.discountAmount : current.discountAmount || 0;

    const pricing = calculatePricing(basePrice, discountType, discountPercent, discountAmount);

    const updatedItem: ProcedureItem = {
      ...current,
      ...updates,
      price: basePrice,
      discountType: pricing.discountType,
      discountPercent: pricing.discountPercent,
      discountAmount: pricing.discountAmount,
      finalPrice: pricing.finalPrice,
      discountReason: updates.discountReason !== undefined ? updates.discountReason : current.discountReason,
    };

    const nextList = [...procedures];
    nextList[index] = updatedItem;
    onChange(nextList);
  };

  const handleApplyPresetPercent = (index: number, percent: number) => {
    const current = procedures[index];
    if (!current) return;

    const pricing = calculatePricing(current.price, 'PERCENTAGE', percent, 0);
    handleUpdateProcedure(index, {
      discountType: 'PERCENTAGE',
      discountPercent: pricing.discountPercent,
      discountAmount: pricing.discountAmount,
      finalPrice: pricing.finalPrice,
    });
  };

  const handleResetDiscount = (index: number) => {
    const current = procedures[index];
    if (!current) return;

    handleUpdateProcedure(index, {
      discountType: 'PERCENTAGE',
      discountPercent: 0,
      discountAmount: 0,
      finalPrice: current.price,
      discountReason: '',
    });
  };

  const handleSaveManualProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || !manualName.trim()) {
      toast.error('Kode ICD-9 dan Nama Tindakan wajib diisi.');
      return;
    }
    const cleanCode = manualCode.trim();
    const cleanName = manualName.trim();
    const price = Number(manualTariff) || 50000;

    const created = addICD9({
      code: cleanCode,
      name: cleanName,
      englishName: manualEnglish.trim() || undefined,
      category: manualCategory,
      standardTariff: price,
      isActive: true,
    });
    toast.success(`Tindakan ICD-9 ${cleanCode} berhasil disimpan ke Master Data!`);

    handleAddProcedure(created);
    setManualCode('');
    setManualName('');
    setManualEnglish('');
    setShowManualAdd(false);
  };

  // Calculations for summary
  const totalOriginalTariff = procedures.reduce((acc, p) => acc + (p.price || 0), 0);
  const totalDiscountAmount = procedures.reduce((acc, p) => {
    const dAmt = p.discountAmount || ((p.price || 0) - (p.finalPrice ?? p.price ?? 0)) || 0;
    return acc + dAmt;
  }, 0);
  const totalNetTariff = procedures.reduce((acc, p) => {
    const net = p.finalPrice !== undefined ? p.finalPrice : Math.max(0, (p.price || 0) - (p.discountAmount || 0));
    return acc + net;
  }, 0);

  return (
    <div className="space-y-3.5">
      {/* Header with Title & Live Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                Tindakan Medis (ICD-9-CM)
              </h3>
              <Badge variant="outline" className="text-xs font-semibold bg-teal-50 text-teal-800 border-teal-200">
                ICD-9-CM Vol. 3
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kodifikasi prosedur medis, tindakan bedah minor, terapi, dan tarif billing kasir
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
          {procedures.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              {totalDiscountAmount > 0 && (
                <span className="text-xs text-slate-500 font-mono">
                  <span className="line-through">{formatRupiah(totalOriginalTariff)}</span>
                  <span className="ml-1 text-emerald-600 font-semibold">
                    (-{formatRupiah(totalDiscountAmount)})
                  </span>
                </span>
              )}
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 text-xs sm:text-[13px]">
                Total: {formatRupiah(totalNetTariff)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search & Add Procedures */}
      {!disabled && (
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Cari kode ICD-9 atau nama tindakan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowDropdown(false);
                }
              }}
              className="pl-9 pr-20 h-9 sm:h-10 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-white rounded-xl border-slate-200 focus:border-teal-600 shadow-2xs font-normal w-full"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                  title="Hapus teks pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {showDropdown && (
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-[11px] font-bold text-slate-600 hover:text-rose-600 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                  title="Tutup pilihan pencarian (Esc)"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>

          {/* Dropdown Suggestions */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-xl animate-in fade-in max-h-72 overflow-y-auto w-full">
              <div className="flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 mb-1 bg-slate-50/70 rounded-t-xl">
                <span>Katalog Tindakan ICD-9-CM ({filteredMaster.length})</span>
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Tutup pilihan tindakan (Esc)"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Tutup</span>
                </button>
              </div>

              {filteredMaster.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 space-y-2">
                  <p>Kode atau nama tindakan tidak ditemukan di master ICD-9.</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setManualCode(searchQuery);
                      setManualName(searchQuery);
                      setShowManualAdd(true);
                      setShowDropdown(false);
                    }}
                    className="h-7 text-xs font-bold gap-1 bg-teal-700 hover:bg-teal-800 text-white rounded-xl cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Tambah &ldquo;{searchQuery}&rdquo; ke Master ICD-9</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredMaster.map((item) => {
                    const isSelected = procedures.some((p) => p.code === item.code || p.name === item.name);
                    return (
                      <div
                        key={item.id || item.code}
                        className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left text-xs transition-colors gap-2 ${
                          isSelected
                            ? 'bg-slate-100/80 text-slate-400 cursor-not-allowed'
                            : 'hover:bg-teal-50/70 text-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleAddProcedure(item)}
                          disabled={isSelected}
                          className="flex-1 min-w-0 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-teal-900 bg-teal-100/70 px-2 py-0.5 rounded-md border border-teal-300 text-xs shrink-0">
                              {item.code}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{item.name}</span>
                            <Badge variant="outline" className="text-[9px] font-medium bg-slate-50 border-slate-200 text-slate-600 shrink-0">
                              {item.category}
                            </Badge>
                          </div>
                          {item.englishName && (
                            <div className="text-[11px] text-slate-500 italic mt-0.5 pl-0.5 truncate">
                              {item.englishName}
                            </div>
                          )}
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold font-mono text-slate-900 text-xs">
                            {formatRupiah(item.standardTariff)}
                          </span>

                          {isSelected ? (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold px-2 py-1">
                              <Check className="h-3.5 w-3.5 text-teal-600" /> Dipilih
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAddProcedure(item)}
                              className="h-7 px-2.5 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-lg cursor-pointer"
                            >
                              + Pilih
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Dropdown Footer */}
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] px-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowManualAdd(true);
                    setShowDropdown(false);
                  }}
                  className="text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Tambah Kode Baru ke Master ICD-9</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Tutup Katalog
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Add Inline Form */}
      {showManualAdd && !disabled && (
        <form onSubmit={handleSaveManualProcedure} className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-teal-700" />
              <span>Tambah Tindakan Baru ke Master ICD-9-CM</span>
            </span>
            <button
              type="button"
              onClick={() => setShowManualAdd(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Kode ICD-9 *</label>
              <Input
                required
                placeholder="Contoh: 89.07"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="h-8 text-xs bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nama Tindakan (ID) *</label>
              <Input
                required
                placeholder="Contoh: Konsultasi & Pemeriksaan"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nama Klinis (EN icd9data)</label>
              <Input
                placeholder="Contoh: Comprehensive examination"
                value={manualEnglish}
                onChange={(e) => setManualEnglish(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Tarif Standar (Rp) *</label>
              <Input
                required
                type="number"
                placeholder="50000"
                value={manualTariff}
                onChange={(e) => setManualTariff(e.target.value)}
                className="h-8 text-xs bg-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowManualAdd(false)}
              className="h-7 text-xs rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl"
            >
              Simpan &amp; Pilih Tindakan
            </Button>
          </div>
        </form>
      )}

      {/* Selected Procedures List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs sm:text-[13px] text-slate-600 font-semibold px-0.5">
          <span>Tindakan Medis Pasien Terpilih ({procedures.length}):</span>
          <span className="text-xs text-slate-400 font-normal">Tarif otomatis masuk ke tagihan kasir</span>
        </div>

        {procedures.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 bg-slate-50/50">
            <Activity className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
            <p className="font-semibold text-slate-600 text-sm">Tidak ada tindakan medis tambahan yang dipilih.</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Hanya biaya konsultasi dokter standar yang akan dikenakan di kasir.
            </p>
          </div>
        ) : (
          procedures.map((proc, index) => {
            const hasDiscount = (proc.discountAmount || 0) > 0;
            const finalTariff = proc.finalPrice !== undefined ? proc.finalPrice : Math.max(0, proc.price - (proc.discountAmount || 0));
            const isExpanded = expandedIndex === index;
            const currentDiscountType = proc.discountType || 'PERCENTAGE';

            return (
              <div
                key={proc.id + index}
                className={`rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                  hasDiscount
                    ? 'border-teal-300 bg-gradient-to-r from-teal-50/40 to-white'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Main Procedure Row */}
                <div className="p-3 sm:p-3.5 flex items-start sm:items-center justify-between gap-2.5">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-teal-950 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200 text-xs shadow-2xs">
                        {proc.code}
                      </span>
                      <span className="text-sm font-bold text-slate-900 truncate">{proc.name}</span>
                      <Badge variant="outline" className="text-xs font-medium bg-slate-50 border-slate-200 text-slate-600">
                        {proc.category || 'Tindakan Medis'}
                      </Badge>
                    </div>

                    {/* Badge / Indicator of Discount */}
                    <div className="flex items-center gap-2 flex-wrap text-xs sm:text-[13px]">
                      {hasDiscount ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs line-through text-slate-400 font-mono">
                            {formatRupiah(proc.price)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                            <Tag className="h-3 w-3" />
                            <span>
                              {proc.discountType === 'PERCENTAGE' && proc.discountPercent
                                ? `Diskon ${proc.discountPercent}% (-${formatRupiah(proc.discountAmount || 0)})`
                                : `Potongan -${formatRupiah(proc.discountAmount || 0)}`}
                            </span>
                          </span>
                          <span className="text-sm font-bold font-mono text-teal-900">
                            {finalTariff === 0 ? 'GRATIS / Rp 0' : formatRupiah(finalTariff)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold font-mono text-slate-800">
                          Tarif: {formatRupiah(proc.price)}
                        </span>
                      )}

                      {proc.discountReason && (
                        <span className="text-xs text-slate-500 italic">
                          &bull; Ket: {proc.discountReason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-colors flex items-center gap-1 cursor-pointer ${
                          hasDiscount
                            ? 'bg-teal-50 border-teal-300 text-teal-800 hover:bg-teal-100'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        title="Atur potongan harga atau diskon courtesy dokter"
                      >
                        <Tag className="h-3.5 w-3.5 text-teal-600" />
                        <span className="hidden sm:inline">
                          {hasDiscount ? 'Ubah Diskon' : 'Beri Diskon'}
                        </span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    )}

                    {!disabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(index)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                        title="Hapus tindakan"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Collapsible Discount Setting Drawer */}
                {!disabled && isExpanded && (
                  <div className="p-3 bg-slate-50/80 border-t border-slate-200/80 space-y-2.5 animate-in slide-in-from-top-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                        <Tag className="h-3.5 w-3.5 text-teal-700" />
                        <span>Keringanan Biaya / Diskon Pasien:</span>
                      </span>
                      {hasDiscount && (
                        <button
                          type="button"
                          onClick={() => handleResetDiscount(index)}
                          className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          <span>Hapus Potongan (Kembalikan Tarif Penuh)</span>
                        </button>
                      )}
                    </div>

                    {/* Quick Preset Buttons (0%, 10%, 25%, 50%, 100% Gratis) */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-medium">Pilihan Cepat:</span>
                      <div className="flex flex-wrap gap-1">
                        {DISCOUNT_PERCENT_PRESETS.map((pct) => {
                          const isActive = currentDiscountType === 'PERCENTAGE' && proc.discountPercent === pct;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => handleApplyPresetPercent(index, pct)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-teal-700 text-white shadow-2xs'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {pct === 0 ? 'Tarif Penuh (0%)' : pct === 100 ? 'Gratis (100%)' : `Diskon ${pct}%`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Input: Percentage vs Nominal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          <span>Diskon Persentase (%)</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={proc.discountPercent || 0}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                            const pricing = calculatePricing(proc.price, 'PERCENTAGE', val, 0);
                            handleUpdateProcedure(index, {
                              discountType: 'PERCENTAGE',
                              discountPercent: pricing.discountPercent,
                              discountAmount: pricing.discountAmount,
                              finalPrice: pricing.finalPrice,
                            });
                          }}
                          className="h-7 text-xs bg-white rounded-lg font-mono"
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          <span>Atau Potongan Nominal (Rp)</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max={proc.price}
                          value={proc.discountAmount || 0}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(proc.price, Number(e.target.value) || 0));
                            const pricing = calculatePricing(proc.price, 'NOMINAL', 0, val);
                            handleUpdateProcedure(index, {
                              discountType: 'NOMINAL',
                              discountPercent: pricing.discountPercent,
                              discountAmount: pricing.discountAmount,
                              finalPrice: pricing.finalPrice,
                            });
                          }}
                          className="h-7 text-xs bg-white rounded-lg font-mono"
                          placeholder="Rp 0"
                        />
                      </div>
                    </div>

                    {/* Reason for Discount */}
                    <div className="space-y-1 pt-1">
                      <label className="text-[10px] font-bold text-slate-600">Alasan Keringanan / Diskon (Opsional)</label>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {DISCOUNT_REASONS_PRESET.map((reason) => (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => handleUpdateProcedure(index, { discountReason: reason })}
                            className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                              proc.discountReason === reason
                                ? 'bg-teal-100 border-teal-300 text-teal-800 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            + {reason}
                          </button>
                        ))}
                      </div>
                      <Input
                        value={proc.discountReason || ''}
                        onChange={(e) => handleUpdateProcedure(index, { discountReason: e.target.value })}
                        placeholder="Ketik keterangan alasan diskon jika diperlukan..."
                        className="h-7 text-[11px] bg-white rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
