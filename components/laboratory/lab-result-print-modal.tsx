'use client';

import React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRME } from '@/context/rme-context';
import { formatIndonesianDate } from '@/lib/utils';
import { Microscope, Printer, HeartPulse } from 'lucide-react';

export interface LabResultPrintData {
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
}

interface LabResultPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: LabResultPrintData | null;
}

export function LabResultPrintModal({
  open,
  onOpenChange,
  order,
}: LabResultPrintModalProps) {
  const { config, currentUser } = useRME();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="3xl">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle className="flex items-center gap-2 text-base">
          <Microscope className="h-5 w-5 text-teal-700" />
          <span>Lembar Hasil Pemeriksaan Laboratorium</span>
        </DialogTitle>
        <DialogDescription>
          Pratinjau lembar hasil uji laboratorium resmi faskes sebelum dicetak atau diunduh ke format PDF.
        </DialogDescription>
      </DialogHeader>

      <div className="py-2">
        <div
          id="printable-lab-result"
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white font-bold shrink-0">
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
              <div className="text-[10px] uppercase font-bold text-slate-400">Instalasi Laboratorium</div>
              <div className="text-xs font-mono font-bold text-teal-800">HASIL PEMERIKSAAN</div>
              <div className="text-[10px] text-slate-500 font-mono">STANDAR RME No. 24/2022</div>
            </div>
          </div>

          {/* Judul Dokumen */}
          <div className="text-center space-y-1">
            <h2 className="text-sm sm:text-base font-black tracking-wide uppercase text-slate-900 underline underline-offset-4">
              HASIL PEMERIKSAAN LABORATORIUM KLINIS
            </h2>
            <div className="text-xs font-mono text-slate-600">
              No. Registrasi Uji: LAB-{order.orderId.replace(/[^0-9]/g, '').slice(-8) || '20260901'} &bull; Tanggal: {formatIndonesianDate(order.date)}
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
                <span className="col-span-8 font-mono font-bold text-teal-800">{order.patientNoRM}</span>
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
                <span className="col-span-5 text-slate-500">Dokter Pengirim:</span>
                <span className="col-span-7 font-bold text-slate-900">{order.doctorName}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 text-slate-500">Kategori Uji:</span>
                <span className="col-span-7 font-medium text-slate-700">{order.category}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-5 text-slate-500">Status Validasi:</span>
                <span className="col-span-7 font-bold text-emerald-700">Tervalidasi Faskes</span>
              </div>
            </div>
          </div>

          {/* Tabel Hasil Laboratorium */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Pemeriksaan</th>
                  <th className="py-2.5 px-4 text-center">Hasil</th>
                  <th className="py-2.5 px-4 text-center">Satuan</th>
                  <th className="py-2.5 px-4 text-center">Nilai Rujukan / Normal</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-white">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div>{order.testName}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{order.category}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-black text-sm text-slate-900">
                    {order.resultValue || '-'}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-600">
                    {order.unit || '-'}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-700">
                    {order.normalRange || '-'}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.status === 'NORMAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'ABNORMAL'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status === 'NORMAL'
                        ? 'NORMAL'
                        : order.status === 'ABNORMAL'
                        ? 'DI LUAR BATAS NORMAL'
                        : 'PENDING'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Catatan Analis / Dokter */}
          {order.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-700">Catatan Analis / Dokter:</span>
              <p className="text-slate-800 italic">{order.notes}</p>
            </div>
          )}

          <p className="text-[11px] text-slate-500 italic">
            * Hasil pemeriksaan laboratorium ini merupakan data penunjang diagnosis medis dan diinterpretasikan oleh dokter yang merawat.
          </p>

          {/* Tanda Tangan: Petugas Lab & Dokter */}
          <div className="grid grid-cols-2 pt-6 items-end text-xs">
            <div className="space-y-2">
              <div className="text-slate-700">
                <div className="text-[11px] text-slate-500">Petugas / Analis Laboratorium,</div>
              </div>
              <div className="h-14 flex items-center text-slate-300 italic text-[11px]">
                ( Tanda Tangan )
              </div>
              <div>
                <div className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[140px]">
                  {currentUser?.name || 'Petugas Laboratorium'}
                </div>
              </div>
            </div>

            <div className="text-right space-y-2">
              <div className="text-slate-700">
                {config.invoiceCity || 'Kudus'}, {formatIndonesianDate(order.date)}
                <div className="text-[11px] text-slate-500 font-medium">Dokter Penanggung Jawab,</div>
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
          className="gap-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak Lembar Hasil Lab</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
