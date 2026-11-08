'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Pill,
  Printer,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  Calendar,
  AlertTriangle,
  Building2,
  FileText,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useRME } from '@/context/rme-context';
import { Visit, PrescriptionItem, MedicationLabelType, MedicationTiming } from '@/types/rme';
import { formatIndonesianDate } from '@/lib/utils';
import { toast } from 'sonner';

export interface MedicationLabelModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onClose?: () => void;
  visit: Visit | null;
}

interface EditableLabel {
  id: string;
  prescriptionId: string;
  name: string;
  quantity: number;
  unit: string;
  signa: string;
  labelType: MedicationLabelType; // WHITE (Obat Dalam) | BLUE (Obat Luar)
  timing: MedicationTiming;
  specialInstructions: string;
  expiryDate: string;
  selected: boolean;
}

export function MedicationLabelModal({
  open,
  onOpenChange,
  isOpen,
  onClose,
  visit,
}: MedicationLabelModalProps) {
  const { config, currentUser, patients } = useRME();
  const printRef = useRef<HTMLDivElement>(null);

  const isModalOpen = Boolean(open ?? isOpen);
  const handleModalChange = (newVal: boolean) => {
    if (onOpenChange) onOpenChange(newVal);
    if (!newVal && onClose) onClose();
  };

  const [labels, setLabels] = useState<EditableLabel[]>([]);
  const [activeLabelIndex, setActiveLabelIndex] = useState<number>(0);

  // Initialize labels from visit prescriptions
  useEffect(() => {
    if (!visit?.medicalRecord?.prescriptions) {
      setLabels([]);
      return;
    }

    const prescriptions = visit.medicalRecord.prescriptions;
    const initialLabels: EditableLabel[] = prescriptions.map((rx, idx) => {
      const lowerName = rx.name.toLowerCase();
      const isExternal =
        lowerName.includes('salep') ||
        lowerName.includes('krim') ||
        lowerName.includes('tetes') ||
        lowerName.includes('gel') ||
        lowerName.includes('lotion') ||
        lowerName.includes('kumur') ||
        lowerName.includes('supp');

      // Auto-detect timing from signa or instructions
      let timing: MedicationTiming = 'AFTER_MEAL';
      const lowerSigna = (rx.signa || '').toLowerCase();
      if (lowerSigna.includes('sebelum') || lowerSigna.includes('ac')) {
        timing = 'BEFORE_MEAL';
      } else if (lowerSigna.includes('bersama') || lowerSigna.includes('dc')) {
        timing = 'WITH_MEAL';
      } else if (lowerSigna.includes('tidur') || lowerSigna.includes('malam')) {
        timing = 'BEFORE_SLEEP';
      } else if (lowerSigna.includes('perlu') || lowerSigna.includes('prn')) {
        timing = 'AS_NEEDED';
      }

      // Default special instructions
      let specialInstructions = '';
      if (lowerName.includes('sirup') || lowerName.includes('suspensi')) {
        specialInstructions = 'Kocok dahulu sebelum diminum';
      } else if (
        lowerName.includes('amoxicillin') ||
        lowerName.includes('cef') ||
        lowerName.includes('antibiotik') ||
        lowerName.includes('cipro')
      ) {
        specialInstructions = 'Habiskan (Antibiotik)';
      }

      // Default exp date (approx 1 year ahead)
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 1);
      const expStr = exp.toISOString().split('T')[0];

      return {
        id: `lbl-${idx}-${Date.now()}`,
        prescriptionId: rx.id || `rx-${idx}`,
        name: rx.name,
        quantity: rx.quantity || 10,
        unit: rx.unit || 'Tablet',
        signa: rx.signa || '3 x 1 Tablet Sehari',
        labelType: isExternal ? 'BLUE' : 'WHITE',
        timing,
        specialInstructions,
        expiryDate: expStr,
        selected: true,
      };
    });

    setLabels(initialLabels);
    setActiveLabelIndex(0);
  }, [visit]);

  if (!isModalOpen || !visit) return null;

  const currentLabel = labels[activeLabelIndex];

  const updateCurrentLabel = (patch: Partial<EditableLabel>) => {
    setLabels((prev) =>
      prev.map((l, idx) => (idx === activeLabelIndex ? { ...l, ...patch } : l))
    );
  };

  const handlePrint = () => {
    const selectedLabels = labels.filter((l) => l.selected);
    if (selectedLabels.length === 0) {
      toast.error('Pilih minimal satu etiket obat untuk dicetak');
      return;
    }
    window.print();
  };

  const todayFormatted = formatIndonesianDate(
    new Date().toISOString().split('T')[0],
    false
  );

  const patient = patients?.find((p) => p.id === visit.patientId) || visit.patient;
  const patientName = patient?.name || visit.patient?.name || 'Pasien';
  const patientNoRM = patient?.noRM || visit.patient?.noRM || '-';
  const sipNumber = config?.sip || 'SIP: 446/123/DISKES/2024';

  return (
    <Dialog open={isModalOpen} onOpenChange={handleModalChange} maxWidth="4xl">
      <div className="flex flex-col -m-6 max-h-[85vh]">
        <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/70 mb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill className="h-5 w-5 text-purple-700" />
                <span>Cetak Etiket Obat &amp; Label Resep Pasien</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Standar Pelayanan Kefarmasian: Etiket Putih (Obat Dalam/Oral) &amp; Etiket Biru (Obat Luar).
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-bold bg-white text-purple-800 border-purple-200">
              Antrean: {visit.queueNumber} • {patientNoRM}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto">
          {/* Kolom Kiri: Pengaturan & Edit Etiket (6 cols) */}
          <div className="md:col-span-6 p-5 border-r border-slate-100 space-y-4 max-h-[75vh] overflow-y-auto">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Pilih Obat untuk Dicetak:
              </label>
              <div className="space-y-1.5">
                {labels.map((lbl, idx) => (
                  <div
                    key={lbl.id}
                    onClick={() => setActiveLabelIndex(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      activeLabelIndex === idx
                        ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-600 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={lbl.selected}
                        onChange={(e) => {
                          e.stopPropagation();
                          setLabels((prev) =>
                            prev.map((l, i) =>
                              i === idx ? { ...l, selected: e.target.checked } : l
                            )
                          );
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
                      />
                      <span className="truncate max-w-[180px] text-slate-900">
                        {lbl.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          lbl.labelType === 'WHITE'
                            ? 'bg-slate-100 text-slate-800 border border-slate-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {lbl.labelType === 'WHITE' ? 'Oral (Putih)' : 'Luar (Biru)'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        x{lbl.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {currentLabel && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800">
                    Edit Detail: <span className="text-purple-700">{currentLabel.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Obat ke-{activeLabelIndex + 1} dari {labels.length}
                  </span>
                </div>

                {/* Jenis Etiket Putih vs Biru */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                    Jenis Etiket:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateCurrentLabel({ labelType: 'WHITE' })}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all text-center ${
                        currentLabel.labelType === 'WHITE'
                          ? 'bg-white border-purple-600 text-purple-900 shadow-xs ring-1 ring-purple-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/60'
                      }`}
                    >
                      ⚪ Etiket Putih (Oral/Dalam)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentLabel({ labelType: 'BLUE' })}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all text-center ${
                        currentLabel.labelType === 'BLUE'
                          ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs ring-1 ring-blue-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/60'
                      }`}
                    >
                      🔵 Etiket Biru (Obat Luar)
                    </button>
                  </div>
                </div>

                {/* Aturan Pakai / Signa */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                    Aturan Pakai (Signa):
                  </label>
                  <Input
                    value={currentLabel.signa}
                    onChange={(e) => updateCurrentLabel({ signa: e.target.value })}
                    className="bg-white text-xs h-8"
                    placeholder="Contoh: 3 x 1 Tablet Sehari"
                  />
                </div>

                {/* Waktu Konsumsi (Timing) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                    Waktu Minum:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: 'BEFORE_MEAL', label: 'Sebelum Makan' },
                      { key: 'AFTER_MEAL', label: 'Sesudah Makan' },
                      { key: 'WITH_MEAL', label: 'Bersama Makan' },
                      { key: 'EMPTY_STOMACH', label: 'Perut Kosong' },
                      { key: 'BEFORE_SLEEP', label: 'Sebelum Tidur' },
                      { key: 'AS_NEEDED', label: 'Bila Perlu' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => updateCurrentLabel({ timing: t.key as MedicationTiming })}
                        className={`p-1.5 rounded-lg text-[11px] font-semibold border transition-all truncate ${
                          currentLabel.timing === t.key
                            ? 'bg-purple-700 text-white border-purple-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Peringatan & Petunjuk Khusus */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                    Peringatan / Catatan Khusus:
                  </label>
                  <Input
                    value={currentLabel.specialInstructions}
                    onChange={(e) =>
                      updateCurrentLabel({ specialInstructions: e.target.value })
                    }
                    className="bg-white text-xs h-8"
                    placeholder="Misal: Kocok dahulu, Habiskan antibiotik"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      'Kocok dahulu',
                      'Habiskan (Antibiotik)',
                      'Bila demam / nyeri',
                      'Simpan di tempat sejuk',
                    ].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => updateCurrentLabel({ specialInstructions: quick })}
                        className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 hover:border-purple-300 hover:text-purple-700"
                      >
                        + {quick}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Pratinjau Etiket Fisik (6 cols) */}
          <div className="md:col-span-6 p-5 bg-slate-100/70 flex flex-col justify-between max-h-[75vh] overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  Pratinjau Stiker Etiket Apotek
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Ukuran: 60mm x 40mm
                </span>
              </div>

              {currentLabel ? (
                <div
                  className={`p-4 rounded-xl border-2 shadow-md bg-white transition-all max-w-[340px] mx-auto ${
                    currentLabel.labelType === 'WHITE'
                      ? 'border-slate-800'
                      : 'border-blue-600'
                  }`}
                >
                  {/* Header Biru jika Obat Luar */}
                  {currentLabel.labelType === 'BLUE' && (
                    <div className="bg-blue-600 text-white font-black text-center text-[10px] py-1 rounded-sm tracking-wider uppercase mb-2">
                      OBAT LUAR • TIDAK BOLEH DITELAN
                    </div>
                  )}

                  {/* Kop Apotek Faskes */}
                  <div className="text-center border-b border-dashed border-slate-200 pb-2">
                    <div className="font-extrabold text-xs text-slate-900 uppercase tracking-tight">
                      {config?.practiceName || 'KLINIK PRATAMA MANDIRI'}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {config?.address || 'Jl. Raya Kesehatan No. 12, Jawa Tengah'} • Telp:{' '}
                      {config?.phone || '021-555-1234'}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {sipNumber}
                    </div>
                  </div>

                  {/* Meta Pasien & Resep */}
                  <div className="py-2 border-b border-dashed border-slate-200 space-y-0.5 text-[11px]">
                    <div className="flex justify-between font-mono text-[10px] text-slate-500">
                      <span>No. Resep: <strong className="text-slate-800">{visit.queueNumber}</strong></span>
                      <span>Tgl: {todayFormatted}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs">
                      Pasien: {patientName} ({patientNoRM})
                    </div>
                  </div>

                  {/* Instruksi Minum / Signa Utama */}
                  <div className="my-3 py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-1">
                    <div className="text-xs font-black text-slate-900 tracking-wide">
                      {currentLabel.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Jumlah: {currentLabel.quantity} {currentLabel.unit}
                    </div>
                    <div className="text-sm font-black text-purple-900 font-mono">
                      👉 {currentLabel.signa}
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 py-0.5 rounded">
                      {currentLabel.timing === 'AFTER_MEAL'
                        ? 'Sesudah Makan'
                        : currentLabel.timing === 'BEFORE_MEAL'
                        ? 'Sebelum Makan'
                        : currentLabel.timing === 'WITH_MEAL'
                        ? 'Bersama Makan'
                        : currentLabel.timing === 'BEFORE_SLEEP'
                        ? 'Sebelum Tidur (Malam)'
                        : currentLabel.timing === 'EMPTY_STOMACH'
                        ? 'Saat Perut Kosong'
                        : 'Bila Perlu / Nyeri'}
                    </div>
                    {currentLabel.specialInstructions && (
                      <div className="text-[10px] text-amber-900 font-bold bg-amber-50 rounded px-1.5 py-0.5 border border-amber-200">
                        ⚠️ {currentLabel.specialInstructions}
                      </div>
                    )}
                  </div>

                  {/* Footer Etiket */}
                  <div className="border-t border-dashed border-slate-200 pt-2 flex items-center justify-between text-[9px] text-slate-400">
                    <span>Semoga Lekas Sembuh</span>
                    <span>Simpan di Tempat Sejuk</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Tidak ada etiket yang dipilih
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleModalChange(false)}
                className="text-xs rounded-xl"
              >
                Tutup
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold gap-1.5 rounded-xl shadow-xs cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak {labels.filter((l) => l.selected).length} Etiket</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Print Container (Optimized for Printer Labels & Thermal Stickers) */}
        <div className="hidden">
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #medication-print-container,
              #medication-print-container * {
                visibility: visible !important;
              }
              #medication-print-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: #fff !important;
                padding: 10px !important;
              }
              .etiket-label-card {
                page-break-inside: avoid;
                page-break-after: always;
                border: 1px dashed #444 !important;
                padding: 10px !important;
                margin-bottom: 20px !important;
                width: 60mm;
                min-height: 40mm;
                font-family: Arial, Helvetica, sans-serif !important;
              }
            }
          `}</style>

          <div id="medication-print-container">
            {labels
              .filter((l) => l.selected)
              .map((lbl) => (
                <div key={lbl.id} className="etiket-label-card">
                  {lbl.labelType === 'BLUE' && (
                    <div
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        fontSize: '11px',
                        padding: '4px',
                        marginBottom: '6px',
                      }}
                    >
                      OBAT LUAR • TIDAK BOLEH DITELAN
                    </div>
                  )}

                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '6px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}>
                      {config?.practiceName || 'KLINIK PRATAMA MANDIRI'}
                    </div>
                    <div style={{ fontSize: '10px' }}>
                      {config?.address || 'Jl. Raya Kesehatan No. 12'} • Telp: {config?.phone || '021-555-1234'}
                    </div>
                    <div style={{ fontSize: '9px', color: '#555' }}>{sipNumber}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '6px' }}>
                    <span>No. Resep: <strong>{visit.queueNumber}</strong></span>
                    <span>Tgl: {todayFormatted}</span>
                  </div>

                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    Pasien: <strong>{patientName}</strong> ({patientNoRM})
                  </div>

                  <div
                    style={{
                      border: '1px solid #000',
                      padding: '8px',
                      marginTop: '6px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{lbl.name}</div>
                    <div style={{ fontSize: '10px', color: '#333' }}>
                      Jumlah: {lbl.quantity} {lbl.unit}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                      👉 {lbl.signa}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>
                      {lbl.timing === 'AFTER_MEAL'
                        ? 'Sesudah Makan'
                        : lbl.timing === 'BEFORE_MEAL'
                        ? 'Sebelum Makan'
                        : lbl.timing === 'WITH_MEAL'
                        ? 'Bersama Makan'
                        : lbl.timing === 'BEFORE_SLEEP'
                        ? 'Sebelum Tidur'
                        : lbl.timing === 'EMPTY_STOMACH'
                        ? 'Saat Perut Kosong'
                        : 'Bila Perlu'}
                    </div>
                    {lbl.specialInstructions && (
                      <div style={{ fontSize: '10px', marginTop: '4px', fontStyle: 'italic' }}>
                        ⚠️ {lbl.specialInstructions}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      borderTop: '1px dashed #000',
                      marginTop: '8px',
                      paddingTop: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '9px',
                      color: '#555',
                    }}
                  >
                    <span>Semoga Lekas Sembuh</span>
                    <span>Simpan di Tempat Sejuk</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
