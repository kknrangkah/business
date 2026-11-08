'use client';

import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useRME } from '@/context/rme-context';
import { Visit, PaymentMethod, PaymentDetails } from '@/types/rme';
import { formatRupiah } from '@/lib/utils';
import {
  Banknote,
  QrCode,
  Building,
  CheckCircle2,
  Receipt,
  Calculator,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit;
  onSuccess?: () => void;
}

export function PaymentModal({ open, onOpenChange, visit, onSuccess }: PaymentModalProps) {
  const { config, processPayment, currentUser } = useRME();
  const billing = visit.billing;

  const grandTotal = billing?.grandTotal || 0;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(grandTotal);
  const [transferRef, setTransferRef] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!billing) return null;

  const changeAmount = Math.max(0, cashReceived - grandTotal);
  const isCashSufficient = cashReceived >= grandTotal;

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount);
  };

  const handleConfirmPayment = () => {
    if (paymentMethod === 'CASH' && !isCashSufficient) {
      toast.error('Jumlah uang tunai yang diterima kurang dari total tagihan!');
      return;
    }

    setIsProcessing(true);

    const cashier =
      currentUser?.name ||
      (config.currentRole === 'DOCTOR' ? config.doctorName : 'Petugas Kasir');

    const paymentDetails: PaymentDetails = {
      method: paymentMethod,
      amountPaid: paymentMethod === 'CASH' ? cashReceived : grandTotal,
      changeAmount: paymentMethod === 'CASH' ? changeAmount : 0,
      paidAt: new Date().toISOString(),
      cashierName: cashier,
      referenceNumber:
        paymentMethod === 'QRIS'
          ? `QRIS-${Date.now().toString().slice(-8)}`
          : paymentMethod === 'TRANSFER'
          ? transferRef || `TRF-${Date.now().toString().slice(-6)}`
          : undefined,
    };

    setTimeout(() => {
      processPayment(visit.id, paymentDetails);
      setIsProcessing(false);
      toast.success(`Pembayaran ${formatRupiah(grandTotal)} berhasil diproses!`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="lg">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle className="flex items-center gap-2 text-base font-bold">
          <Banknote className="h-5 w-5 text-emerald-700" />
          <span>Kasir &amp; Pembayaran Pasien</span>
        </DialogTitle>
        <DialogDescription>
          Pilih metode pembayaran dan konfirmasi penerimaan tagihan pasien.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-1">
        {/* Patient & Bill Summary Header */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs text-slate-500 font-medium">Pasien &amp; No. RM:</div>
            <div className="text-sm font-bold text-slate-900">
              {visit.patient.name}{' '}
              <span className="text-xs font-mono text-emerald-800 font-bold">({visit.patient.noRM})</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Invoice: {billing.invoiceNumber}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 font-bold uppercase">TOTAL TAGIHAN:</div>
            <div className="text-xl font-black text-emerald-800 font-mono">
              {formatRupiah(grandTotal)}
            </div>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <Tabs
          value={paymentMethod}
          onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full h-11 p-1 bg-slate-100">
            <TabsTrigger value="CASH" className="gap-1.5 text-xs">
              <Banknote className="h-4 w-4" />
              <span>Tunai / Cash</span>
            </TabsTrigger>
            <TabsTrigger value="QRIS" className="gap-1.5 text-xs">
              <QrCode className="h-4 w-4" />
              <span>QRIS Dinamis</span>
            </TabsTrigger>
            <TabsTrigger value="TRANSFER" className="gap-1.5 text-xs">
              <Building className="h-4 w-4" />
              <span>Transfer Bank</span>
            </TabsTrigger>
          </TabsList>

          {/* CASH TAB */}
          <TabsContent value="CASH" className="space-y-3 pt-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Uang Tunai Diterima dari Pasien (Rp)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="text-base font-bold font-mono h-11 bg-white text-slate-900 pr-12"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">IDR</span>
                </div>
              </div>

              {/* Quick Nominal Chips */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] text-slate-500 self-center mr-1">Uang Pas:</span>
                {[
                  grandTotal,
                  Math.ceil(grandTotal / 50000) * 50000,
                  Math.ceil(grandTotal / 100000) * 100000,
                  200000,
                  300000,
                  500000,
                ]
                  .filter((v, idx, arr) => v >= grandTotal && arr.indexOf(v) === idx)
                  .slice(0, 5)
                  .map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleQuickCash(amount)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                        cashReceived === amount
                          ? 'bg-emerald-700 text-white font-bold'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {formatRupiah(amount)}
                    </button>
                  ))}
              </div>

              {/* Change / Kembalian Box */}
              <div className="rounded-lg bg-white border border-slate-200 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">Uang Kembalian:</span>
                </div>
                <span
                  className={`text-lg font-bold font-mono ${
                    isCashSufficient ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isCashSufficient ? formatRupiah(changeAmount) : 'Uang Kurang!'}
                </span>
              </div>
            </div>
          </TabsContent>

          {/* QRIS TAB */}
          <TabsContent value="QRIS" className="space-y-3 pt-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center space-y-3">
              <div className="inline-block p-3 rounded-xl bg-slate-900 text-white shadow-inner">
                {/* Visual Representation of QRIS Code */}
                <div className="h-40 w-40 bg-white p-2 rounded-lg flex flex-col items-center justify-center text-slate-900 mx-auto">
                  <QrCode className="h-32 w-32 text-slate-900" />
                  <span className="text-[9px] font-bold tracking-widest text-slate-700 -mt-1 font-mono">
                    NMID: ID1020039481
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-800">
                  Scan QRIS Menggunakan GoPay, OVO, Dana, ShopeePay, BCA, Mandiri
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Nominal otomatis terkunci: <strong className="text-blue-600 font-mono">{formatRupiah(grandTotal)}</strong>
                </div>
              </div>

              <Badge variant="success" className="gap-1 text-[11px] font-medium py-0.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>QRIS Dinamis Terverifikasi Otomatis</span>
              </Badge>
            </div>
          </TabsContent>

          {/* TRANSFER BANK TAB */}
          <TabsContent value="TRANSFER" className="space-y-3 pt-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Bank Central Asia (BCA)</div>
                    <div className="text-xs text-blue-600 font-mono font-bold">8801-2345-6789</div>
                    <div className="text-[10px] text-slate-500">a.n {config.practiceName || 'Klinik'}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">VA</Badge>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Bank Mandiri</div>
                    <div className="text-xs text-blue-600 font-mono font-bold">137-00-1234567-8</div>
                    <div className="text-[10px] text-slate-500">a.n {config.practiceName || 'Klinik'}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Direct</Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Nomor Referensi / Bukti Transfer (Opsional)
                </label>
                <Input
                  placeholder="Contoh: TRF-882310 atau No. Rek Pengirim"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  className="bg-white h-8 text-xs font-mono"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isProcessing || (paymentMethod === 'CASH' && !isCashSufficient)}
            className="gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isProcessing ? 'Memproses...' : `Konfirmasi Pembayaran (${formatRupiah(grandTotal)})`}</span>
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
