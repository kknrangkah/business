'use client';

import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRME } from '@/context/rme-context';
import { Visit } from '@/types/rme';
import { formatIndonesianDate } from '@/lib/utils';
import {
  Printer,
  HeartPulse,
  Clock,
  User,
  Calendar,
  Building2,
  CheckCircle2,
  Share2,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface QueueTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit?: Visit | null;
}

export function QueueTicketModal({ open, onOpenChange, visit }: QueueTicketModalProps) {
  const { config, visits } = useRME();
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');

  if (!visit) return null;

  // Calculate waiting count ahead of this visit
  const todayStr = visit.date || new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter((v) => v.date === todayStr);
  const waitingVisits = todayVisits.filter(
    (v) => v.status === 'WAITING' || v.status === 'REGISTERED'
  );

  const visitIndexInWaiting = waitingVisits.findIndex((v) => v.id === visit.id);
  const peopleAhead = visitIndexInWaiting >= 0 ? visitIndexInWaiting : 0;
  const estimatedMinutes = Math.max(5, (peopleAhead + 1) * 10);

  const handlePrint = () => {
    window.print();
    toast.success(`Mencetak karcis antrian ${visit.queueNumber}...`, { duration: 2500 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="md">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>Pendaftaran Berhasil — Cetak Karcis Antrian</span>
        </DialogTitle>
        <DialogDescription>
          Pasien berhasil didaftarkan ke antrian. Cetak karcis antrian untuk diserahkan kepada pasien.
        </DialogDescription>
      </DialogHeader>

      <div className="py-2 flex flex-col items-center">
        {/* Paper Size Selector */}
        <div className="flex items-center gap-2 mb-3 self-center text-xs no-print">
          <span className="text-slate-500 font-medium">Format Kertas:</span>
          <button
            type="button"
            onClick={() => setPaperWidth('80mm')}
            className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
              paperWidth === '80mm'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Thermal 80mm
          </button>
          <button
            type="button"
            onClick={() => setPaperWidth('58mm')}
            className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
              paperWidth === '58mm'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Thermal 58mm
          </button>
        </div>

        {/* Printable Ticket Receipt */}
        <div
          id="printable-queue-ticket"
          className={`bg-white text-slate-900 border-2 border-dashed border-slate-300 rounded-xl p-5 shadow-xs transition-all ${
            paperWidth === '58mm' ? 'w-full max-w-[280px]' : 'w-full max-w-[340px]'
          }`}
          style={{ fontFamily: 'monospace, system-ui' }}
        >
          {/* Clinic Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-1.5 font-sans">
              <div className="h-6 w-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                <HeartPulse className="h-4 w-4" />
              </div>
              <span className="font-black text-sm text-slate-900 tracking-tight uppercase">
                {config.practiceName}
              </span>
            </div>
            <div className="text-[11px] font-sans text-emerald-800 font-bold">
              {config.doctorName}
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              {config.sip} • Telp: {config.phone}
            </div>
            <div className="text-[10px] text-slate-400 font-sans line-clamp-1">
              {config.address}
            </div>
          </div>

          {/* Registration Timestamp */}
          <div className="py-2.5 text-center text-[11px] text-slate-600 border-b border-dashed border-slate-300 font-mono">
            <div>{formatIndonesianDate(visit.date || todayStr, true)}</div>
            <div>Pukul: {visit.time} WIB</div>
          </div>

          {/* Main Queue Number Box */}
          <div className="py-4 text-center space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 font-sans">
              NOMOR ANTRIAN
            </div>
            <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-emerald-800 py-1">
              {visit.queueNumber}
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 font-sans font-bold text-xs border border-emerald-200">
              POLI UMUM / RAWAT JALAN
            </div>
          </div>

          {/* Patient Details */}
          <div className="py-2.5 border-t border-b border-dashed border-slate-300 text-xs space-y-1.5">
            <div className="flex justify-between items-start">
              <span className="text-slate-500">Pasien:</span>
              <span className="font-bold text-right text-slate-900 max-w-[180px] truncate">
                {visit.patient.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">No. RM:</span>
              <span className="font-bold font-mono text-emerald-800">{visit.patient.noRM}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Penjamin:</span>
              <span className="font-bold uppercase text-slate-800">{visit.paymentType || 'UMUM'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dokter:</span>
              <span className="font-medium text-slate-800 text-right truncate max-w-[180px]">
                {visit.doctorName || config.doctorName}
              </span>
            </div>
            {visit.serviceHours && (
              <div className="flex justify-between">
                <span className="text-slate-500">Jam Layanan:</span>
                <span className="font-semibold text-slate-800">{visit.serviceHours} WIB</span>
              </div>
            )}
            {visit.patientQuota !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Sisa Kuota Dokter:</span>
                <span className="font-semibold text-slate-800">{visit.patientQuota} Pasien</span>
              </div>
            )}
          </div>

          {/* Waiting Status Summary */}
          <div className="py-2.5 text-center space-y-1 bg-slate-50/80 rounded-lg my-2 border border-slate-200 font-sans">
            <div className="text-[11px] text-slate-600">
              Sisa antrian di depan Anda:{' '}
              <strong className="text-emerald-800 text-sm font-mono">{peopleAhead}</strong> orang
            </div>
            <div className="text-[10px] text-slate-500">
              Estimasi panggilan: ~<span className="font-bold">{estimatedMinutes} menit</span>
            </div>
          </div>

          {/* Barcode / QR Simulation */}
          <div className="pt-2 text-center flex flex-col items-center">
            {/* Simulated Barcode */}
            <div className="flex items-center justify-center gap-[2px] h-9 w-44 bg-white py-1">
              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 4, 1, 2, 1, 3, 2, 4, 1, 3].map((w, i) => (
                <div
                  key={i}
                  className="bg-slate-900 h-full"
                  style={{ width: `${w * 1.5}px` }}
                />
              ))}
            </div>
            <div className="text-[10px] font-mono text-slate-600 mt-1 tracking-widest">
              *{visit.queueNumber}-{visit.patient.noRM.replace(/[^a-zA-Z0-9]/g, '')}*
            </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 font-sans space-y-0.5">
            <p className="font-semibold text-slate-700">Simpan tiket ini untuk panggilan antrian.</p>
            <p>Perhatikan nomor antrian pada Layar TV Monitor.</p>
            <p className="text-[9px] text-slate-400 mt-1">Terima kasih atas kepercayaan Anda.</p>
          </div>
        </div>
      </div>

      <DialogFooter className="no-print gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="rounded-xl"
        >
          Tutup
        </Button>
        <Button
          type="button"
          onClick={handlePrint}
          className="gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs font-bold rounded-xl cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak Karcis Sekarang</span>
        </Button>
      </DialogFooter>

      {/* Embedded Print Styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-queue-ticket,
          #printable-queue-ticket * {
            visibility: visible;
          }
          #printable-queue-ticket {
            position: fixed;
            left: 50%;
            top: 0;
            transform: translateX(-50%);
            width: ${paperWidth === '58mm' ? '58mm' : '80mm'};
            max-width: ${paperWidth === '58mm' ? '58mm' : '80mm'};
            margin: 0;
            padding: 8px;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
