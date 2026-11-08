'use client';

import React, { useState } from 'react';
import { LabOrderItem } from '@/types/rme';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Microscope, Plus, Trash2, CheckCircle2, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface LabOrderPanelProps {
  labOrders: LabOrderItem[];
  onChange: (items: LabOrderItem[]) => void;
  disabled?: boolean;
}

const COMMON_LAB_PRESETS: Array<{
  testName: string;
  category: LabOrderItem['category'];
  unit: string;
  normalRange: string;
  price: number;
}> = [
  { testName: 'Darah Lengkap / Rutin (CBC)', category: 'HEMATOLOGI', unit: '', normalRange: 'Hb: 12-16 g/dL, Leukosit: 4-10 ribu/uL', price: 65000 },
  { testName: 'Hemoglobin (Hb Sahli/Digital)', category: 'HEMATOLOGI', unit: 'g/dL', normalRange: '12 - 16 g/dL', price: 25000 },
  { testName: 'Gula Darah Sewaktu (GDS Rapid)', category: 'KIMIA_DARAH', unit: 'mg/dL', normalRange: '70 - 140 mg/dL', price: 25000 },
  { testName: 'Gula Darah Puasa (GDP)', category: 'KIMIA_DARAH', unit: 'mg/dL', normalRange: '70 - 100 mg/dL', price: 30000 },
  { testName: 'Kolesterol Total', category: 'KIMIA_DARAH', unit: 'mg/dL', normalRange: '< 200 mg/dL', price: 35000 },
  { testName: 'Asam Urat (Uric Acid)', category: 'KIMIA_DARAH', unit: 'mg/dL', normalRange: '3.4 - 7.0 mg/dL (L) / 2.4 - 5.7 (P)', price: 30000 },
  { testName: 'Trigliserida', category: 'KIMIA_DARAH', unit: 'mg/dL', normalRange: '< 150 mg/dL', price: 40000 },
  { testName: 'Urin Rutin / Lengkap (Strip)', category: 'URINALISIS', unit: '', normalRange: 'Protein (-), Glukosa (-), Epitel (-)', price: 30000 },
  { testName: 'Widal Serologi (Tifoid)', category: 'IMUNOLOGI', unit: 'Titer', normalRange: '< 1/80 Negatif', price: 50000 },
  { testName: 'Tes Kehamilan (HCG Urine)', category: 'URINALISIS', unit: '', normalRange: 'Negatif', price: 25000 },
  { testName: 'Golongan Darah & Rhesus', category: 'HEMATOLOGI', unit: '', normalRange: 'A / B / AB / O (Rh +)', price: 25000 },
];

export function LabOrderPanel({ labOrders, onChange, disabled = false }: LabOrderPanelProps) {
  const [testName, setTestName] = useState('');
  const [category, setCategory] = useState<LabOrderItem['category']>('HEMATOLOGI');
  const [unit, setUnit] = useState('');
  const [normalRange, setNormalRange] = useState('');
  const [price, setPrice] = useState('30000');

  const handleAddPreset = (preset: typeof COMMON_LAB_PRESETS[0]) => {
    if (disabled) return;
    if (labOrders.some((item) => item.testName.toLowerCase() === preset.testName.toLowerCase())) {
      toast.info(`Pemeriksaan "${preset.testName}" sudah ada dalam daftar.`);
      return;
    }
    const newItem: LabOrderItem = {
      id: `lab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      testName: preset.testName,
      category: preset.category,
      unit: preset.unit,
      normalRange: preset.normalRange,
      status: 'PENDING',
      price: preset.price,
    };
    onChange([...labOrders, newItem]);
    toast.success(`Tes Lab ditambahkan: ${preset.testName}`);
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled) return;
    if (!testName.trim()) {
      toast.error('Masukkan nama pemeriksaan laboratorium.');
      return;
    }
    const newItem: LabOrderItem = {
      id: `lab-${Date.now()}`,
      testName: testName.trim(),
      category,
      unit: unit.trim(),
      normalRange: normalRange.trim(),
      status: 'PENDING',
      price: parseFloat(price) || 0,
    };
    onChange([...labOrders, newItem]);
    setTestName('');
    setUnit('');
    setNormalRange('');
    toast.success(`Tes Lab kustom ditambahkan: ${newItem.testName}`);
  };

  const handleUpdateItem = (id: string, updates: Partial<LabOrderItem>) => {
    if (disabled) return;
    onChange(
      labOrders.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    if (disabled) return;
    onChange(labOrders.filter((item) => item.id !== id));
    toast.info('Pemeriksaan laboratorium dihapus.');
  };

  return (
    <Card className="p-4 border border-teal-200 bg-white shadow-2xs space-y-4 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-teal-100 pb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
            <Microscope className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Pemeriksaan Laboratorium Klinis</span>
              <Badge className="bg-teal-100 text-teal-800 text-[10px] font-bold border-teal-300">
                Unit Lab Aktif
              </Badge>
            </h3>
            <p className="text-[11px] text-slate-500">
              Permintaan tes laboratorium &amp; pencatatan hasil nilai uji klinis
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold border-teal-200 text-teal-700 bg-teal-50">
          {labOrders.length} Pemeriksaan
        </Badge>
      </div>

      {/* Quick Presets */}
      {!disabled && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>Pilihan Cepat Pemeriksaan Laboratorium Sering Digunakan:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_LAB_PRESETS.map((preset) => (
              <button
                key={preset.testName}
                type="button"
                onClick={() => handleAddPreset(preset)}
                className="text-[10px] font-medium px-2 py-1 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 transition-colors cursor-pointer"
              >
                + {preset.testName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table / List of Ordered Tests */}
      {labOrders.length === 0 ? (
        <div className="p-5 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
          Belum ada pemeriksaan laboratorium yang diminta. Klik pilihan cepat di atas atau tambahkan secara manual.
        </div>
      ) : (
        <div className="space-y-2.5">
          {labOrders.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition-colors shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{item.testName}</span>
                  <Badge className="text-[9px] font-bold bg-slate-100 text-slate-700">
                    {item.category}
                  </Badge>
                  {item.normalRange && (
                    <span className="text-[10px] text-slate-400">
                      (Rujukan: {item.normalRange})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Badge */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleUpdateItem(item.id, { status: 'NORMAL' })}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        item.status === 'NORMAL'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleUpdateItem(item.id, { status: 'ABNORMAL' })}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        item.status === 'ABNORMAL'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      Abnormal
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleUpdateItem(item.id, { status: 'PENDING' })}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        item.status === 'PENDING'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      Pending
                    </button>
                  </div>

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Hapus pemeriksaan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Result Input Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Hasil Pemeriksaan / Nilai</label>
                  <Input
                    placeholder="Contoh: 125 atau Positif"
                    value={item.resultValue || ''}
                    onChange={(e) => handleUpdateItem(item.id, { resultValue: e.target.value })}
                    disabled={disabled}
                    className="h-7 text-xs bg-slate-50 font-bold rounded-lg mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Satuan Nilai (Unit)</label>
                  <Input
                    placeholder="Contoh: mg/dL, g/dL"
                    value={item.unit || ''}
                    onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value })}
                    disabled={disabled}
                    className="h-7 text-xs bg-slate-50 rounded-lg mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Catatan / Interpretasi</label>
                  <Input
                    placeholder="Contoh: Mengarah ke hiperglikemia"
                    value={item.notes || ''}
                    onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                    disabled={disabled}
                    className="h-7 text-xs bg-slate-50 rounded-lg mt-0.5"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Input Form */}
      {!disabled && (
        <div className="border-t border-slate-100 pt-3">
          <div className="text-[11px] font-bold text-slate-700 mb-2">
            + Tambah Pemeriksaan Laboratorium Lainnya Secara Manual
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="sm:col-span-2">
              <Input
                placeholder="Nama Tes (cth: SGOT, SGPT, HbA1c)"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="h-8 text-xs rounded-xl"
              />
            </div>
            <div>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as LabOrderItem['category'])}
                className="h-8 text-xs rounded-xl"
              >
                <option value="HEMATOLOGI">Hematologi</option>
                <option value="KIMIA_DARAH">Kimia Darah</option>
                <option value="URINALISIS">Urinalisis</option>
                <option value="IMUNOLOGI">Imunologi</option>
                <option value="LAINNYA">Lainnya</option>
              </Select>
            </div>
            <div>
              <Button
                type="button"
                onClick={handleAddCustom}
                className="w-full h-8 text-xs font-bold gap-1 bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Tes</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
