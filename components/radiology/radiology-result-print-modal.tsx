'use client';

import React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRME } from '@/context/rme-context';
import { formatIndonesianDate } from '@/lib/utils';
import { ScanLine, Printer, HeartPulse } from 'lucide-react';

export interface RadiologyResultPrintData {
  orderId: string;
  examinationType: string;
  modality: 'USG' | 'RONTGEN_XRAY' | 'EKG' | 'LAINNYA';
  clinicalIndication?: string;
  findings?: string;
  conclusion?: string;
  price?: number;
  radiologyImageUrl?: string;
  visitId: string;
  patientName: string;
  patientNoRM: string;
  patientAge?: number;
  patientGender: string;
  doctorName: string;
  date: string;
}

interface RadiologyResultPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: RadiologyResultPrintData | null;
}

export function RadiologyResultPrintModal({
  open,
  onOpenChange,
  order,
}: RadiologyResultPrintModalProps) {
  const { config, currentUser } = useRME();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const getModalityLabel = (mod: string) => {
    switch (mod) {
      case 'RONTGEN_XRAY':
        return 'Foto Rontgen X-Ray';
      case 'USG':
        return 'Ultrasonografi (USG)';
      case 'EKG':
        return 'Elektrokardiografi (EKG)';
      default:
        return 'Diagnostik Imejing';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="3xl">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle className="flex items-center gap-2 text-base">
          <ScanLine className="h-5 w-5 text-indigo-700" />
          <span>Lembar Expertise Hasil Pemeriksaan Radiologi &amp; USG</span>
        </DialogTitle>
        <DialogDescription>
          Pratinjau lembar bacaan expertise radiologi faskes sebelum dicetak atau diunduh ke format PDF.
        </DialogDescription>
      </DialogHeader>

      <div className="py-2">
        <div
          id="printable-radiology-result"
          className="border border-slate-300 bg-white p-7 rounded-xl text-slate-900 shadow-sm space-y-5 print:border-0 print:p-0 print:shadow-none"
        >
          {/* Header Kop Surat Faskes */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt={config.practiceName}
                  className="h-14 w-14 object-contain rounded-xl p-0.5 border border-slate-200 bg-white shrink-0"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-700 text-white font-bold shrink-0">
                  <HeartPulse className="h-7 w-7" />
                </div>
              )}
              <div>
                <h1 className="text-sm font-black uppercase tracking-tight text-slate-900 leading-tight">
                  {config.practiceName}
                </h1>
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  {config.address || 'Alamat Fasilitas Pelayanan Kesehatan'}
                </p>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  SIP: {config.sip || '-'} &bull; Telp: {config.phone || '-'}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 border-l border-slate-200 pl-4 hidden sm:block">
              <div className="text-[10px] uppercase font-bold text-slate-400">Instalasi Radiologi</div>
              <div className="text-xs font-mono font-bold text-indigo-800">EXPERTISE RADIOLOGI</div>
              <div className="text-[10px] text-slate-500 font-mono">STANDAR RME No. 24/2022</div>
            </div>
          </div>

          {/* Judul Dokumen */}
          <div className="text-center space-y-1">
            <h2 className="text-sm sm:text-base font-black tracking-wide uppercase text-slate-900 underline underline-offset-4">
              HASIL PEMBACAAN EXPERTISE RADIOLOGI &amp; IMEJING
            </h2>
            <div className="text-xs font-mono text-slate-600">
              No. Reg: RAD-{order.orderId.replace(/[^0-9]/g, '').slice(-8) || '20260901'} &bull; Tanggal: {formatIndonesianDate(order.date)}
            </div>
          </div>

          {/* Identitas Pasien & Dokter */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 text-slate-500">Nama Pasien:</span>
                <span className="col-span-8 font-bold text-slate-900 uppercase">{order.patientName}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 text-slate-500">No. Rekam Medis:</span>
                <span className="col-span-8 font-mono font-bold text-indigo-800">{order.patientNoRM}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 text-slate-500">Umur / Kelamin:</span>
                <span className="col-span-8">
                  {order.patientAge || '-'} Th &bull; {order.patientGender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 text-slate-500">Dokter Pemeriksa:</span>
                <span className="col-span-7 font-bold text-slate-900">{order.doctorName}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 text-slate-500">Modalitas / Jenis:</span>
                <span className="col-span-7 font-bold text-slate-900">{getModalityLabel(order.modality)}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 text-slate-500">Tindakan / Posisi:</span>
                <span className="col-span-7 font-medium text-slate-800">{order.examinationType}</span>
              </div>
            </div>
          </div>

          {/* Indikasi Klinis */}
          {order.clinicalIndication && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-0.5">
              <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">Indikasi Klinis:</span>
              <p className="text-slate-800 font-medium">{order.clinicalIndication}</p>
            </div>
          )}

          {/* Temuan Deskriptif (Findings) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100/90 px-3 py-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wide border-b border-slate-200">
              Temuan Deskriptif Pemeriksaan (Radiological Findings)
            </div>
            <div className="p-4 leading-relaxed font-mono text-xs whitespace-pre-line text-slate-900 bg-white min-h-[90px]">
              {order.findings || 'Tidak ada catatan deskripsi temuan spesifik.'}
            </div>
          </div>

          {/* Kesimpulan Expertise (Conclusion / Impression) */}
          <div className="p-3.5 rounded-xl border-2 border-indigo-600 bg-indigo-50/40 space-y-1 text-xs">
            <div className="text-[11px] font-bold text-indigo-950 uppercase tracking-wide">
              Kesimpulan / Impression:
            </div>
            <div className="text-sm font-black text-indigo-950 leading-snug">
              {order.conclusion || 'Pemeriksaan radiologi dalam batas normal (DBN).'}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Hasil bacaan ini dievaluasi secara klinis dan dikorelasikan dengan gejala klinis pasien serta temuan laboratorium penunjang lainnya.
          </p>

          {/* Tanda Tangan: Dokter Radiolog / Pemeriksa */}
          <div className="grid grid-cols-2 pt-6 items-end text-xs">
            <div>
              <div className="text-slate-500 text-[11px]">Catatan Unit Radiologi:</div>
              <div className="text-slate-700 font-medium mt-1">
                Pemeriksaan selesai divalidasi &amp; diarsipkan pada Rekam Medis Elektronik.
              </div>
            </div>

            <div className="text-right space-y-2">
              <div className="text-slate-700">
                {config.invoiceCity || 'Kudus'}, {formatIndonesianDate(order.date)}
                <div className="text-[11px] text-slate-500 font-medium">Dokter Pemeriksa / Radiolog,</div>
              </div>

              {config.invoiceSignatureUrl ? (
                <div className="flex justify-end py-1">
                  <img
                    src={config.invoiceSignatureUrl}
                    alt="Tanda Tangan Dokter"
                    className="h-14 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="h-14" />
              )}

              <div>
                <div className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[160px] text-center">
                  ( {order.doctorName || config.doctorName} )
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  {config.sip}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="no-print">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Tutup
        </Button>
        <Button
          type="button"
          onClick={handlePrint}
          className="gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak Lembar Expertise</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
