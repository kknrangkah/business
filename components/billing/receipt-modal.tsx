'use client';

import React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRME } from '@/context/rme-context';
import { Visit } from '@/types/rme';
import { formatRupiah, formatIndonesianDate } from '@/lib/utils';
import { Printer, Download, CheckCircle2, HeartPulse, Stethoscope, Building2 } from 'lucide-react';

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit;
}

export function ReceiptModal({ open, onOpenChange, visit }: ReceiptModalProps) {
  const { config } = useRME();
  const billing = visit.billing;
  const mr = visit.medicalRecord;

  if (!billing) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="3xl">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle className="flex items-center gap-2 text-base font-bold">
          <Printer className="h-4 w-4 text-emerald-700" />
          <span>Kwitansi Resmi &amp; Ringkasan Medis</span>
        </DialogTitle>
        <DialogDescription>
          Salinan bukti pembayaran dan rekam pelayanan pasien.
        </DialogDescription>
      </DialogHeader>

      <div className="py-2">
        {/* Printable Paper Container */}
        <div
          id="printable-receipt"
          className="border border-slate-300 bg-white p-6 rounded-lg text-slate-900 shadow-xs space-y-4 print:border-0 print:p-0 print:shadow-none"
        >
          {/* Header Kop Surat Praktik Dokter */}
          {config.invoiceHeaderMode === 'CUSTOM_LETTERHEAD' && config.letterheadUrl ? (
            <div className="border-b-2 border-slate-800 pb-3 mb-2">
              <div className="w-full flex items-center justify-center overflow-hidden rounded-md bg-white">
                <img
                  src={config.letterheadUrl}
                  alt={config.practiceName}
                  className="w-full max-h-32 object-contain"
                />
              </div>
              <div className="flex justify-between items-center pt-2 px-1 text-xs">
                <span className="inline-block px-2.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-bold font-mono text-[11px]">
                  KWITANSI RESMI
                </span>
                <div className="text-right text-[11px] text-slate-600 font-mono">
                  No: <strong>{billing.invoiceNumber}</strong> • Tgl: {formatIndonesianDate(billing.date)}
                </div>
              </div>
            </div>
          ) : (
            <div className="border-b-2 border-slate-800 pb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt={config.practiceName}
                    className="h-16 w-16 object-contain rounded-xl p-1 border border-slate-200 bg-white shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white font-bold shrink-0 shadow-xs">
                    <HeartPulse className="h-8 w-8" />
                  </div>
                )}
                <div>
                  <h1 className="text-base font-bold uppercase tracking-tight text-slate-900 leading-tight">
                    {config.practiceName}
                  </h1>
                  {config.subtitle && (
                    <div className="text-[11px] font-semibold text-emerald-800">{config.subtitle}</div>
                  )}
                  <div className="text-xs font-bold text-slate-800">{config.doctorName}</div>
                  <div className="text-[11px] text-slate-600 font-mono">{config.sip}</div>
                  <div className="text-[10px] text-slate-500 max-w-md">
                    {config.address} • Telp: {config.phone}
                    {config.email ? ` • ${config.email}` : ''}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1 bg-slate-100 rounded border border-slate-300 text-xs font-bold font-mono">
                  KWITANSI RESMI
                </div>
                <div className="text-xs text-slate-600 mt-1 font-mono">
                  No: <strong>{billing.invoiceNumber}</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Tgl: {formatIndonesianDate(billing.date)}
                </div>
              </div>
            </div>
          )}

          {/* Pasien & Dokter Identitas */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Identitas Pasien</div>
              <div className="font-bold text-slate-900 text-sm">{visit.patient.name}</div>
              <div className="text-slate-600">
                No. Rekam Medis: <strong className="font-mono text-emerald-800">{visit.patient.noRM}</strong>
              </div>
              <div className="text-slate-600">
                NIK: {visit.patient.nik} • {visit.patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} ({visit.patient.age || 30} th)
              </div>
            </div>

            <div className="space-y-1 text-right sm:text-left">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Pelayanan Medis</div>
              <div className="font-semibold text-slate-800">Dokter Pemeriksa: {visit.doctorName}</div>
              <div className="text-slate-600">
                Diagnosis Utama: {mr?.diagnoses[0] ? `${mr.diagnoses[0].code} - ${mr.diagnoses[0].name}` : '-'}
              </div>
              <div className="text-slate-600">
                Jenis Penjamin: <strong className="uppercase">{visit.paymentType}</strong>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-1">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-emerald-700 text-white border-b border-emerald-800 font-bold select-none">
                <tr>
                  <th className="py-2 px-3 text-white">No</th>
                  <th className="py-2 px-3 text-white">Rincian Pelayanan / Obat</th>
                  <th className="py-2 px-3 text-center text-white">Qty</th>
                  <th className="py-2 px-3 text-right text-white">Tarif (Rp)</th>
                  <th className="py-2 px-3 text-right text-white">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billing.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-1.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-1.5 px-3">
                      <div className="font-medium text-slate-800">{item.name}</div>
                    </td>
                    <td className="py-1.5 px-3 text-center font-mono">{item.quantity}</td>
                    <td className="py-1.5 px-3 text-right font-mono">{formatRupiah(item.unitPrice)}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-semibold">
                      {formatRupiah(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Grand Total */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-xs text-slate-600 space-y-1.5 max-w-sm">
              <p className="italic">
                * {config.invoiceNotes || 'Kwitansi ini sah dan diterbitkan secara elektronik melalui sistem RME Klinik.'}
              </p>
              {config.invoiceBankInfo && (
                <div className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="font-bold text-slate-700">Info Rekening:</span> {config.invoiceBankInfo}
                </div>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">{formatRupiah(billing.subtotal)}</span>
              </div>
              {billing.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon:</span>
                  <span className="font-mono">- {formatRupiah(billing.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-1">
                <span>TOTAL DIBAYAR:</span>
                <span className="font-mono font-black text-emerald-800">{formatRupiah(billing.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Stempel & Signature Section */}
          <div className="grid grid-cols-2 pt-6 items-end text-xs">
            {/* Lunas Stamp */}
            <div>
              {billing.status === 'PAID' && config.invoiceShowStamp !== false && (
                config.invoiceStampUrl ? (
                  <img
                    src={config.invoiceStampUrl}
                    alt="Stempel Lunas"
                    className="h-20 w-auto object-contain rotate-[-5deg] opacity-90"
                  />
                ) : (
                  <div className="inline-block border-2 border-emerald-600 rounded-lg p-2 text-emerald-700 font-bold uppercase tracking-widest rotate-[-5deg] bg-emerald-50/50">
                    <div className="text-xs">LUNAS / PAID</div>
                    <div className="text-[9px] font-normal">{billing.paymentDetails?.method || 'CASH'} • {formatIndonesianDate(billing.date)}</div>
                  </div>
                )
              )}
            </div>

            {/* Signature */}
            <div className="text-right space-y-2">
              <div className="text-slate-600">
                {config.invoiceCity || 'Jakarta'}, {formatIndonesianDate(billing.date)}
                <div className="text-[11px] text-slate-400">
                  {config.invoiceCashierTitle || 'Petugas Administrasi / Kasir'}
                </div>
              </div>

              {config.invoiceSignatureUrl ? (
                <div className="flex justify-end py-1">
                  <img
                    src={config.invoiceSignatureUrl}
                    alt="Tanda Tangan"
                    className="h-12 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="h-12" />
              )}

              <div className="border-t border-slate-400 pt-1 inline-block min-w-[140px] text-center font-bold text-slate-800">
                ( {billing.paymentDetails?.cashierName || config.doctorName} )
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
          className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700 shadow-2xs font-semibold"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak Dokumen Kwitansi</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
