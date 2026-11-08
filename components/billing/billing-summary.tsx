'use client';

import React from 'react';
import { Visit } from '@/types/rme';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRupiah, formatIndonesianDate } from '@/lib/utils';
import { Receipt, CheckCircle2, Clock, CreditCard, Printer } from 'lucide-react';

interface BillingSummaryProps {
  visit: Visit;
  onOpenPayment?: () => void;
  onOpenReceipt?: () => void;
}

export function BillingSummary({ visit, onOpenPayment, onOpenReceipt }: BillingSummaryProps) {
  const billing = visit.billing;

  if (!billing) {
    return (
      <Card className="p-6 text-center border border-slate-200 bg-white rounded-2xl">
        <Receipt className="mx-auto h-8 w-8 text-slate-300 mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">Belum Ada Rincian Tagihan</h4>
        <p className="text-xs text-slate-400 mt-1">Tagihan akan dibuat otomatis setelah dokter menyelesaikan pemeriksaan klinis.</p>
      </Card>
    );
  }

  const isPaid = billing.status === 'PAID';

  return (
    <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden rounded-2xl">
      {/* Card Header */}
      <CardHeader className="bg-slate-50/80 p-4 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-700" />
            <span>Rincian Tagihan & Biaya Medis</span>
          </CardTitle>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            Invoice: {billing.invoiceNumber} • {formatIndonesianDate(billing.date)}
          </p>
        </div>

        <Badge
          variant={isPaid ? 'success' : 'warning'}
          className="text-xs font-bold uppercase tracking-wider"
        >
          {isPaid ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              LUNAS
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              MENUNGGU PEMBAYARAN
            </span>
          )}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 space-y-4 text-xs">
        {/* Itemized Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-emerald-700 text-white border-b border-emerald-800 shadow-2xs font-bold select-none">
              <tr>
                <th className="py-2.5 px-3 font-bold text-white">Kategori & Deskripsi</th>
                <th className="py-2.5 px-3 font-bold text-center w-16 text-white">Qty</th>
                <th className="py-2.5 px-3 font-bold text-right text-white">Tarif Satuan</th>
                <th className="py-2.5 px-3 font-bold text-right text-white">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {billing.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-800">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.category === 'CONSULTATION'
                        ? 'Jasa Medis Dokter'
                        : item.category === 'PROCEDURE'
                        ? 'Tindakan Klinis'
                        : item.category === 'MEDICATION'
                        ? 'Farmasi / Obat'
                        : 'Penunjang'}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-700 font-bold font-mono">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                    {formatRupiah(item.unitPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                    {formatRupiah(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Breakdown */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal Biaya</span>
            <span className="font-semibold font-mono text-slate-800">{formatRupiah(billing.subtotal)}</span>
          </div>

          {billing.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Diskon / Keringanan</span>
              <span className="font-mono">- {formatRupiah(billing.discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
            <span>TOTAL TAGIHAN</span>
            <span className="text-lg font-black text-emerald-700 font-mono">
              {formatRupiah(billing.grandTotal)}
            </span>
          </div>
        </div>

        {/* Payment Details (If Paid) */}
        {isPaid && billing.paymentDetails && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 space-y-1 text-xs text-emerald-950">
            <div className="font-bold flex items-center justify-between text-emerald-900">
              <span>Metode: {billing.paymentDetails.method}</span>
              <span>{formatIndonesianDate(billing.paymentDetails.paidAt)}</span>
            </div>
            <div className="text-[11px] text-emerald-800 flex justify-between">
              <span>Kasir / Penerima: {billing.paymentDetails.cashierName}</span>
              {billing.paymentDetails.referenceNumber && (
                <span className="font-mono">Ref: {billing.paymentDetails.referenceNumber}</span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {onOpenReceipt && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenReceipt}
              className="gap-1.5 text-xs text-slate-700 rounded-xl"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak Kwitansi</span>
            </Button>
          )}

          {!isPaid && onOpenPayment && (
            <Button
              type="button"
              size="sm"
              onClick={onOpenPayment}
              className="gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs rounded-xl"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Bayar Sekarang</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
