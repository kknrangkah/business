'use client';

import React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRME } from '@/context/rme-context';
import { Visit, PrescriptionItem } from '@/types/rme';
import { formatIndonesianDate } from '@/lib/utils';
import { Printer, Pill, Building2, Stethoscope, FileText, CheckCircle2 } from 'lucide-react';

interface PrescriptionPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit;
  prescriptions: PrescriptionItem[];
}

export function PrescriptionPrintModal({
  open,
  onOpenChange,
  visit,
  prescriptions,
}: PrescriptionPrintModalProps) {
  const { config } = useRME();

  const handlePrint = () => {
    window.print();
  };

  const todayStr = formatIndonesianDate(visit.date || new Date().toISOString().split('T')[0]);
  const doctorName = visit.doctorName || config.doctorName || 'Dokter Pemeriksa';
  const doctorSip = config.sip || '-';
  const clinicCity = config.invoiceCity || 'Tempat';

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="2xl">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle className="flex items-center gap-2 text-base">
          <Printer className="h-4 w-4 text-emerald-700" />
          <span>Cetak Salinan Resep Dokter (Resep Luar - R/)</span>
        </DialogTitle>
        <DialogDescription>
          Pratinjau lembar resep resmi berstandar kedokteran untuk ditebus pasien di apotek luar.
        </DialogDescription>
      </DialogHeader>

      <div className="py-2">
        {/* Printable Prescription Blanko */}
        <div
          id="printable-prescription"
          className="border border-slate-300 bg-white p-7 rounded-xl text-slate-900 shadow-sm space-y-4 print:border-0 print:p-0 print:shadow-none font-serif"
        >
          {/* Header Kop Surat Resmi Klinik */}
          {config.invoiceHeaderMode === 'CUSTOM_LETTERHEAD' && config.letterheadUrl ? (
            <div className="border-b-2 border-slate-900 pb-3 mb-2">
              <div className="w-full flex items-center justify-center overflow-hidden rounded">
                <img
                  src={config.letterheadUrl}
                  alt="Kop Surat Faskes"
                  className="w-full max-h-24 object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="border-b-2 border-slate-900 pb-3 mb-2 flex items-center justify-between gap-4 font-sans">
              <div className="flex items-center gap-3">
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt="Logo Klinik"
                    className="h-14 w-14 object-contain rounded-lg border border-slate-100 shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-black text-base text-slate-900 tracking-tight uppercase">
                    {config.practiceName || 'Klinik Pratama'}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">{config.subtitle || 'Pelayanan Medis & Kesehatan Terpadu'}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {config.address || 'Alamat faskes belum diatur'}
                    {config.phone && ` • Telp/WA: ${config.phone}`}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 border-l border-slate-200 pl-3 hidden sm:block">
                <div className="text-xs font-bold text-slate-900">{doctorName}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">SIP: {doctorSip}</div>
              </div>
            </div>
          )}

          {/* Dokter & Tanggal Bar */}
          <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2 font-sans">
            <div>
              <span className="text-slate-500">Dokter: </span>
              <strong className="text-slate-900">{doctorName}</strong>
              <span className="text-slate-400 ml-2 font-mono text-[11px]">(SIP: {doctorSip})</span>
            </div>
            <div>
              <span className="text-slate-500">{clinicCity}, </span>
              <strong className="text-slate-900">{todayStr}</strong>
            </div>
          </div>

          {/* R/ Content Section */}
          <div className="py-2 space-y-5 min-h-[220px]">
            {prescriptions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 italic text-xs font-sans">
                Belum ada resep obat yang ditambahkan.
              </div>
            ) : (
              prescriptions.map((rx, idx) => (
                <div key={rx.id || idx} className="relative pl-6 pb-2 border-b border-slate-100 last:border-b-0">
                  {/* Symbol R/ */}
                  <div className="absolute left-0 top-0 font-serif italic font-bold text-lg text-slate-900 select-none">
                    R/
                  </div>

                  {rx.type === 'NON_RACIKAN' ? (
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {rx.name} {rx.dosage && `(${rx.dosage})`}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          No. {rx.quantity} {rx.unit}
                        </span>
                      </div>
                      <div className="text-xs font-serif italic text-slate-800">
                        S. {rx.signa}
                      </div>
                      {rx.notes && (
                        <div className="text-[11px] text-slate-500 font-sans italic">
                          Catatan: {rx.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* RACIKAN */
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {rx.name || 'Obat Racikan'} ({rx.racikanType || 'Puyer'})
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          No. {rx.quantity} {rx.unit || 'Bungkus'}
                        </span>
                      </div>
                      {/* Ingredients */}
                      {rx.ingredients && rx.ingredients.length > 0 && (
                        <div className="pl-3 border-l-2 border-slate-200 text-xs text-slate-700 space-y-0.5 my-1">
                          {rx.ingredients.map((ing, iIdx) => (
                            <div key={iIdx} className="flex justify-between">
                              <span>• {ing.name}</span>
                              <span className="font-mono text-slate-500">{ing.dosage || `${ing.quantity} ${ing.unit}`}</span>
                            </div>
                          ))}
                          <div className="text-[11px] text-slate-500 italic pt-0.5 font-serif">
                            m.f. {rx.racikanType?.toLowerCase() || 'pulv'}. d.t.d. No. {rx.quantity}
                          </div>
                        </div>
                      )}
                      <div className="text-xs font-serif italic text-slate-800">
                        S. {rx.signa}
                      </div>
                      {rx.notes && (
                        <div className="text-[11px] text-slate-500 font-sans italic">
                          Catatan: {rx.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Paraf Divider Line */}
                  <div className="flex items-center justify-end mt-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-sans italic pr-2">Paraf Dokter:</span>
                    <span className="inline-block w-16 border-b border-dashed border-slate-400"></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Pasien (Pro:) */}
          <div className="border-t-2 border-slate-900 pt-3 font-sans text-xs flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 w-16">Pro :</span>
                <strong className="text-slate-900 text-sm">{visit.patient.name}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-16">Umur :</span>
                <span className="text-slate-700">{visit.patient.age || '-'} Tahun</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-16">No. RM :</span>
                <span className="font-mono font-bold text-emerald-800">{visit.patient.noRM}</span>
              </div>
              {visit.patient.streetAddress && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-16">Alamat :</span>
                  <span className="text-slate-600 truncate max-w-xs">{visit.patient.streetAddress}</span>
                </div>
              )}
            </div>

            {/* Stamp / Tanda Tangan */}
            <div className="text-right shrink-0 flex flex-col items-end justify-between min-h-[80px]">
              <div className="text-[11px] text-slate-500">Tanda Tangan / Cap Dokter:</div>
              <div className="h-12 w-28 flex items-center justify-center">
                {config.invoiceSignatureUrl ? (
                  <img src={config.invoiceSignatureUrl} alt="TTD" className="max-h-12 max-w-full object-contain" />
                ) : (
                  <div className="border-b border-slate-400 w-28 h-8"></div>
                )}
              </div>
              <div className="text-xs font-bold text-slate-900 underline mt-1">({doctorName})</div>
            </div>
          </div>

          {/* Legalitas Catatan */}
          <div className="text-[10px] text-slate-400 text-center font-sans pt-2 border-t border-slate-100">
            Resep ini sah dan dikeluarkan oleh faskes {config.practiceName}. Dapat ditebus di apotek mana saja.
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="text-xs rounded-xl"
        >
          Tutup
        </Button>
        <Button
          type="button"
          onClick={handlePrint}
          className="text-xs font-bold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak Resep Luar (Printer / PDF)</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
