'use client';

import React, { useState } from 'react';
import { RadiologyOrderItem } from '@/types/rme';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScanLine, Plus, Trash2, Sparkles, Image, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface RadiologyOrderPanelProps {
  radiologyOrders: RadiologyOrderItem[];
  onChange: (items: RadiologyOrderItem[]) => void;
  disabled?: boolean;
}

const COMMON_RADIOLOGY_PRESETS: Array<{
  examinationType: string;
  modality: RadiologyOrderItem['modality'];
  clinicalIndication: string;
  price: number;
}> = [
  { examinationType: 'Foto Thorax PA (Rontgen Dada)', modality: 'RONTGEN_XRAY', clinicalIndication: 'Evaluasi batuk kronik, curiga pneumonia/TB paru', price: 120000 },
  { examinationType: 'USG Abdomen Atas & Bawah', modality: 'USG', clinicalIndication: 'Nyeri perut kanan atas, curiga kolelitiasis/hepatomegali', price: 150000 },
  { examinationType: 'USG Kandungan / Kebidanan (Obsgyn)', modality: 'USG', clinicalIndication: 'Evaluasi kehamilan, DJJ, biometri janin & plasenta', price: 125000 },
  { examinationType: 'Elektrokardiogram (EKG 12-Lead)', modality: 'EKG', clinicalIndication: 'Nyeri dada menjalar, palpitasi, curiga iskemia miokard', price: 60000 },
  { examinationType: 'Foto Rontgen Ekstremitas (AP/Lat)', modality: 'RONTGEN_XRAY', clinicalIndication: 'Riwayat trauma, nyeri gerak, curiga fraktur/dislokasi', price: 100000 },
  { examinationType: 'USG Thyroid / Leher', modality: 'USG', clinicalIndication: 'Pembesaran kelenjar tiroid / nodul leher', price: 135000 },
];

export function RadiologyOrderPanel({ radiologyOrders, onChange, disabled = false }: RadiologyOrderPanelProps) {
  const [examinationType, setExaminationType] = useState('');
  const [modality, setModality] = useState<RadiologyOrderItem['modality']>('RONTGEN_XRAY');
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [price, setPrice] = useState('100000');

  const handleAddPreset = (preset: typeof COMMON_RADIOLOGY_PRESETS[0]) => {
    if (disabled) return;
    if (radiologyOrders.some((item) => item.examinationType.toLowerCase() === preset.examinationType.toLowerCase())) {
      toast.info(`Pemeriksaan "${preset.examinationType}" sudah ada dalam daftar.`);
      return;
    }
    const newItem: RadiologyOrderItem = {
      id: `rad-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      examinationType: preset.examinationType,
      modality: preset.modality,
      clinicalIndication: preset.clinicalIndication,
      findings: '',
      conclusion: '',
      price: preset.price,
    };
    onChange([...radiologyOrders, newItem]);
    toast.success(`Pemeriksaan Radiologi ditambahkan: ${preset.examinationType}`);
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled) return;
    if (!examinationType.trim()) {
      toast.error('Masukkan jenis pemeriksaan radiologi / imejing.');
      return;
    }
    const newItem: RadiologyOrderItem = {
      id: `rad-${Date.now()}`,
      examinationType: examinationType.trim(),
      modality,
      clinicalIndication: clinicalIndication.trim(),
      findings: '',
      conclusion: '',
      price: parseFloat(price) || 0,
    };
    onChange([...radiologyOrders, newItem]);
    setExaminationType('');
    setClinicalIndication('');
    toast.success(`Pemeriksaan Radiologi ditambahkan: ${newItem.examinationType}`);
  };

  const handleUpdateItem = (id: string, updates: Partial<RadiologyOrderItem>) => {
    if (disabled) return;
    onChange(
      radiologyOrders.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    if (disabled) return;
    onChange(radiologyOrders.filter((item) => item.id !== id));
    toast.info('Pemeriksaan radiologi dihapus.');
  };

  return (
    <Card className="p-4 border border-indigo-200 bg-white shadow-2xs space-y-4 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
            <ScanLine className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Pemeriksaan Radiologi &amp; Diagnostik Imejing</span>
              <Badge className="bg-indigo-100 text-indigo-800 text-[10px] font-bold border-indigo-300">
                Unit Radiologi Aktif
              </Badge>
            </h3>
            <p className="text-[11px] text-slate-500">
              Permintaan Rontgen X-Ray, USG, EKG &amp; pencatatan hasil expertise dokter pemeriksa
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold border-indigo-200 text-indigo-700 bg-indigo-50">
          {radiologyOrders.length} Pemeriksaan
        </Badge>
      </div>

      {/* Quick Presets */}
      {!disabled && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-600" />
            <span>Pilihan Cepat Pemeriksaan Imejing / Radiologi:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_RADIOLOGY_PRESETS.map((preset) => (
              <button
                key={preset.examinationType}
                type="button"
                onClick={() => handleAddPreset(preset)}
                className="text-[10px] font-medium px-2 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
              >
                + {preset.examinationType}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List of Ordered Radiology Items */}
      {radiologyOrders.length === 0 ? (
        <div className="p-5 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
          Belum ada pemeriksaan radiologi / imejing yang diminta. Klik pilihan cepat di atas atau tambahkan pemeriksaan baru.
        </div>
      ) : (
        <div className="space-y-3">
          {radiologyOrders.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors shadow-2xs space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{item.examinationType}</span>
                  <Badge className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {item.modality}
                  </Badge>
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

              {/* Indication */}
              <div>
                <label className="text-[10px] font-bold text-slate-600">Indikasi Klinis</label>
                <Input
                  placeholder="Contoh: Nyeri dada kiri tembus ke belakang, sesak nafas"
                  value={item.clinicalIndication || ''}
                  onChange={(e) => handleUpdateItem(item.id, { clinicalIndication: e.target.value })}
                  disabled={disabled}
                  className="h-7 text-xs bg-slate-50 rounded-lg mt-0.5"
                />
              </div>

              {/* Findings & Conclusion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Temuan Imejing (Deskripsi Expertise)</label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Cor membesar, CTR > 50%. Pulmo: Corakan bronkovaskuler meningkat..."
                    value={item.findings || ''}
                    onChange={(e) => handleUpdateItem(item.id, { findings: e.target.value })}
                    disabled={disabled}
                    className="text-xs bg-slate-50 rounded-lg mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Kesimpulan Dokter Pemeriksa</label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Kardiomegali ringan disertai edema paru minimal."
                    value={item.conclusion || ''}
                    onChange={(e) => handleUpdateItem(item.id, { conclusion: e.target.value })}
                    disabled={disabled}
                    className="text-xs bg-slate-50 rounded-lg mt-0.5"
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
            + Tambah Pemeriksaan Radiologi / USG Secara Manual
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="sm:col-span-2">
              <Input
                placeholder="Jenis Pemeriksaan (cth: Foto Pelvis AP, USG Doppler)"
                value={examinationType}
                onChange={(e) => setExaminationType(e.target.value)}
                className="h-8 text-xs rounded-xl"
              />
            </div>
            <div>
              <Select
                value={modality}
                onChange={(e) => setModality(e.target.value as RadiologyOrderItem['modality'])}
                className="h-8 text-xs rounded-xl"
              >
                <option value="RONTGEN_XRAY">Rontgen X-Ray</option>
                <option value="USG">USG (Ultrasonografi)</option>
                <option value="EKG">EKG (Elektrokardiografi)</option>
                <option value="LAINNYA">Lainnya</option>
              </Select>
            </div>
            <div>
              <Button
                type="button"
                onClick={handleAddCustom}
                className="w-full h-8 text-xs font-bold gap-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Imejing</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
