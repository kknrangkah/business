'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DiagnosisItem } from '@/types/rme';
import { useRME } from '@/context/rme-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  X,
  Stethoscope,
  Check,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosisSelectorProps {
  diagnoses: DiagnosisItem[];
  onChange: (diagnoses: DiagnosisItem[]) => void;
  disabled?: boolean;
}

export function DiagnosisSelector({ diagnoses, onChange, disabled = false }: DiagnosisSelectorProps) {
  const { diagnoses: masterDiagnoses, addDiagnosis } = useRME();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualEnglish, setManualEnglish] = useState('');

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

  // Filter ICD-10 master list by code, Indonesian name, English name, or category
  const filteredMaster = searchQuery.trim()
    ? masterDiagnoses.filter((d) => {
        const q = searchQuery.toLowerCase();
        return (
          d.code.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q) ||
          (d.englishName && d.englishName.toLowerCase().includes(q)) ||
          (d.category && d.category.toLowerCase().includes(q))
        );
      })
    : masterDiagnoses.slice(0, 8);

  const handleAddDiagnosis = (code: string, name: string) => {
    if (disabled) return;
    // Check if already selected
    if (diagnoses.some((d) => d.code.toLowerCase() === code.toLowerCase())) {
      toast.info(`Kode diagnosis ${code} sudah terpilih.`);
      return;
    }

    const type = diagnoses.length === 0 ? 'PRIMARY' : 'SECONDARY';
    const newDiagnosis: DiagnosisItem = {
      code,
      name,
      type,
    };

    onChange([...diagnoses, newDiagnosis]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleToggleType = (index: number) => {
    if (disabled) return;
    const updated = diagnoses.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          type: item.type === 'PRIMARY' ? ('SECONDARY' as const) : ('PRIMARY' as const),
        };
      }
      return item;
    });
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    const updated = diagnoses.filter((_, idx) => idx !== index);
    // If the removed one was PRIMARY and there are other items, set the first one to PRIMARY
    if (updated.length > 0 && !updated.some((d) => d.type === 'PRIMARY')) {
      updated[0].type = 'PRIMARY';
    }
    onChange(updated);
  };

  const handleSaveManualDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || !manualName.trim()) {
      toast.error('Kode ICD-10 dan Nama Diagnosa wajib diisi.');
      return;
    }
    const cleanCode = manualCode.trim().toUpperCase();
    const cleanName = manualName.trim();

    // Check if already in master
    if (!masterDiagnoses.some((d) => d.code.toUpperCase() === cleanCode)) {
      addDiagnosis({
        code: cleanCode,
        name: cleanName,
        englishName: manualEnglish.trim() || undefined,
        category: 'Umum',
        isActive: true,
      });
      toast.success(`Diagnosis ${cleanCode} berhasil disimpan ke Master ICD-10!`);
    }

    handleAddDiagnosis(cleanCode, cleanName);
    setManualCode('');
    setManualName('');
    setManualEnglish('');
    setShowManualAdd(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                Diagnosis Medis (ICD-10)
              </h3>
              {!disabled && <span className="text-rose-500 font-bold">*</span>}
              <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200">
                WHO ICD-10
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih diagnosis utama &amp; sekunder untuk resume medis, BPJS PCare &amp; SATUSEHAT
            </p>
          </div>
        </div>
      </div>

      {/* Search & Add Bar (Hidden when disabled) */}
      {!disabled && (
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Cari kode ICD-10 atau nama penyakit..."
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
              className="pl-9 pr-20 h-9 sm:h-10 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-white rounded-xl border-slate-200 focus:border-emerald-600 shadow-2xs font-normal w-full"
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
                <span>Pilihan Diagnosis Master ICD-10 ({filteredMaster.length})</span>
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Tutup pilihan diagnosis (Esc)"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Tutup</span>
                </button>
              </div>

              {filteredMaster.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 space-y-2">
                  <p>Kode atau nama diagnosis tidak ditemukan di master data.</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setManualCode(searchQuery.toUpperCase());
                      setManualName(searchQuery);
                      setShowManualAdd(true);
                      setShowDropdown(false);
                    }}
                    className="h-7 text-xs font-bold gap-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Tambah &ldquo;{searchQuery}&rdquo; ke Master ICD-10</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredMaster.map((item) => {
                    const isSelected = diagnoses.some((d) => d.code === item.code);
                    return (
                      <div
                        key={item.code}
                        className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left text-xs transition-colors gap-2 ${
                          isSelected
                            ? 'bg-slate-100/80 text-slate-400 cursor-not-allowed'
                            : 'hover:bg-emerald-50/70 text-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleAddDiagnosis(item.code, item.name)}
                          disabled={isSelected}
                          className="flex-1 min-w-0 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300 text-xs shrink-0">
                              {item.code}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{item.name}</span>
                            {item.isChronic && (
                              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px] py-0 shrink-0">
                                Kronis
                              </Badge>
                            )}
                          </div>
                          {item.englishName && (
                            <div className="text-[11px] text-slate-500 italic mt-0.5 pl-0.5 truncate">
                              {item.englishName}
                            </div>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected ? (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold px-2 py-1">
                              <Check className="h-3.5 w-3.5 text-emerald-600" /> Terpilih
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAddDiagnosis(item.code, item.name)}
                              className="h-7 px-2.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer"
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
                    setManualCode(searchQuery.toUpperCase());
                    setManualName(searchQuery);
                    setShowManualAdd(true);
                    setShowDropdown(false);
                  }}
                  className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Tambah Kode Baru ke Master</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Tutup Pencarian
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Add Inline Form */}
      {showManualAdd && !disabled && (
        <form onSubmit={handleSaveManualDiagnosis} className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-emerald-700" />
              <span>Tambah Diagnosis Baru ke Master ICD-10</span>
            </span>
            <button
              type="button"
              onClick={() => setShowManualAdd(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Kode ICD-10 *</label>
              <Input
                required
                placeholder="Contoh: J06.9"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="h-8 text-xs bg-white uppercase font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nama Penyakit (Indonesia) *</label>
              <Input
                required
                placeholder="Contoh: ISPA Akut"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nama Klinis (English / Sinonim)</label>
              <Input
                placeholder="Contoh: Acute upper respiratory infection"
                value={manualEnglish}
                onChange={(e) => setManualEnglish(e.target.value)}
                className="h-8 text-xs bg-white"
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
              className="h-7 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl"
            >
              Simpan &amp; Pilih Diagnosis
            </Button>
          </div>
        </form>
      )}

      {/* Selected Diagnoses List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-[13px] text-slate-600 font-semibold px-0.5">
          <span>Diagnosis Terpilih Pasien ({diagnoses.length}):</span>
          <span className="text-xs text-slate-400 font-normal">Diagnosis #1 otomatis menjadi Diagnosis Utama</span>
        </div>

        {diagnoses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 bg-slate-50/50">
            <Stethoscope className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
            <p className="font-semibold text-slate-600 text-sm">Belum ada diagnosis ICD-10 yang dipilih.</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Gunakan kotak pencarian di atas untuk menentukan diagnosis ICD-10.
            </p>
          </div>
        ) : (
          diagnoses.map((diag, index) => {
            const isPrimary = diag.type === 'PRIMARY';
            const masterInfo = masterDiagnoses.find((d) => d.code.toLowerCase() === diag.code.toLowerCase());

            return (
              <div
                key={diag.code + index}
                className={`flex items-start sm:items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  isPrimary
                    ? 'border-emerald-300 bg-emerald-50/70 shadow-2xs'
                    : 'border-slate-200 bg-white shadow-2xs'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span className="font-mono font-bold text-emerald-950 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 text-xs shadow-2xs shrink-0 mt-0.5 sm:mt-0">
                    {diag.code}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>{diag.name}</span>
                      {masterInfo?.englishName && (
                        <span className="text-xs font-normal text-slate-500 italic hidden md:inline">
                          ({masterInfo.englishName})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
                      <span>Status:</span>
                      {disabled ? (
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                            isPrimary
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isPrimary ? 'DIAGNOSIS UTAMA' : 'DIAGNOSIS SEKUNDER'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleType(index)}
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                            isPrimary
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                          title="Klik untuk mengubah antara Diagnosis Utama atau Tambahan"
                        >
                          {isPrimary ? 'DIAGNOSIS UTAMA' : 'DIAGNOSIS SEKUNDER'} (Klik ubah)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl shrink-0 cursor-pointer"
                    title="Hapus Diagnosis"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
