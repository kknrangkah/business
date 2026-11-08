'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Visit } from '@/types/rme';
import { formatRupiah, formatIndonesianDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PaymentModal } from '@/components/billing/payment-modal';
import { ReceiptModal } from '@/components/billing/receipt-modal';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  CreditCard,
  Printer,
  ArrowRight,
} from 'lucide-react';

export default function BillingPage() {
  const { visits, hasPermission } = useRME();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');

  const [paymentVisit, setPaymentVisit] = useState<Visit | null>(null);
  const [receiptVisit, setReceiptVisit] = useState<Visit | null>(null);

  // Visits with billing
  const billingVisits = visits.filter((v) => v.billing);

  const filteredVisits = billingVisits.filter((v) => {
    const b = v.billing!;
    const matchSearch =
      b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.noRM.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const totalBilled = billingVisits.reduce((acc, v) => acc + (v.billing?.grandTotal || 0), 0);
  const totalPaid = billingVisits
    .filter((v) => v.billing?.status === 'PAID')
    .reduce((acc, v) => acc + (v.billing?.grandTotal || 0), 0);
  const totalPending = billingVisits
    .filter((v) => v.billing?.status === 'PENDING')
    .reduce((acc, v) => acc + (v.billing?.grandTotal || 0), 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Receipt className="h-6 w-6 text-emerald-700" />
              <span>Billing & Kasir Pembayaran</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Rekap tagihan jasa medis dokter, tindakan klinis, dan farmasi resep obat.
            </p>
          </div>
        </div>

        {/* 3 Summary Mini Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border border-slate-200 bg-white shadow-2xs border-l-4 border-l-emerald-700 rounded-2xl">
            <div className="text-xs font-bold uppercase text-slate-500">Total Tagihan Diterbitkan</div>
            <div className="text-xl font-black text-slate-900 mt-1 font-mono">{formatRupiah(totalBilled)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{billingVisits.length} Invoice Transaksi</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-2xs border-l-4 border-l-teal-700 rounded-2xl">
            <div className="text-xs font-bold uppercase text-slate-500">Total Pembayaran Lunas</div>
            <div className="text-xl font-black text-teal-700 mt-1 font-mono">{formatRupiah(totalPaid)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Sudah diterima kasir</div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-2xs border-l-4 border-l-amber-600 rounded-2xl">
            <div className="text-xs font-bold uppercase text-slate-500">Menunggu Pembayaran</div>
            <div className="text-xl font-black text-amber-700 mt-1 font-mono">{formatRupiah(totalPending)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Perlu diproses di kasir</div>
          </Card>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari Pasien, No RM, atau No Invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-white rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs self-start sm:self-auto">
            {[
              { id: 'ALL', label: 'Semua Status' },
              { id: 'PENDING', label: 'Menunggu Bayar' },
              { id: 'PAID', label: 'Lunas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Billing Table */}
        <Card className="overflow-hidden border border-slate-200 shadow-xs bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-700 text-white border-b border-emerald-800 shadow-2xs font-bold select-none">
                <tr>
                  <th className="py-3.5 px-4 font-bold text-white">No. Invoice & Tanggal</th>
                  <th className="py-3.5 px-4 font-bold text-white">Nama Pasien & No. RM</th>
                  <th className="py-3.5 px-4 font-bold text-white">Rincian Komponen</th>
                  <th className="py-3.5 px-4 font-bold text-right text-white">Total Tagihan</th>
                  <th className="py-3.5 px-4 font-bold text-center text-white">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right text-white">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Receipt className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">Tidak ada data tagihan ditemukan</p>
                      <p className="text-xs text-slate-400">Tagihan akan muncul otomatis setelah dokter mengisi rekam medis.</p>
                    </td>
                  </tr>
                ) : (
                  filteredVisits.map((visit) => {
                    const b = visit.billing!;
                    const isPaid = b.status === 'PAID';

                    return (
                      <tr key={visit.id} className="hover:bg-emerald-50/50 transition-colors">
                        {/* No. Invoice & Tanggal */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-emerald-800">{b.invoiceNumber}</div>
                          <div className="text-[11px] text-slate-400">{formatIndonesianDate(b.date)}</div>
                        </td>

                        {/* Nama Pasien & No. RM */}
                        <td className="py-3.5 px-4">
                          <Link href={`/patients/${visit.patient.id}`} className="font-bold text-slate-900 hover:text-emerald-700">
                            {b.patientName}
                          </Link>
                          <div className="text-[11px] text-slate-500 font-mono">{b.noRM}</div>
                        </td>

                        {/* Rincian Komponen */}
                        <td className="py-3.5 px-4 text-[11px] text-slate-600">
                          <div>Konsultasi: {formatRupiah(b.consultationFee)}</div>
                          {b.proceduresFee > 0 && <div>Tindakan: {formatRupiah(b.proceduresFee)}</div>}
                          {b.medicationsFee > 0 && <div>Obat: {formatRupiah(b.medicationsFee)}</div>}
                        </td>

                        {/* Total Tagihan */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="text-sm font-black text-slate-900 font-mono">
                            {formatRupiah(b.grandTotal)}
                          </div>
                          {b.discountAmount > 0 && (
                            <div className="text-[10px] text-emerald-700 font-bold">
                              Diskon: {formatRupiah(b.discountAmount)}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <Badge
                            variant={isPaid ? 'success' : 'warning'}
                            className="text-[10px] uppercase font-bold"
                          >
                            {isPaid ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Lunas
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Belum Bayar
                              </span>
                            )}
                          </Badge>
                          {isPaid && b.paymentDetails && (
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {b.paymentDetails.method}
                            </div>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isPaid ? (
                              hasPermission('process_payment') ? (
                              <Button
                                size="sm"
                                onClick={() => setPaymentVisit(visit)}
                                className="h-7 px-3 text-xs font-bold gap-1 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs rounded-xl"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                <span>Bayar Kasir</span>
                              </Button>
                              ) : null
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReceiptVisit(visit)}
                                className="h-7 px-2.5 text-xs text-slate-700 gap-1 rounded-xl font-bold"
                              >
                                <Printer className="h-3 w-3" />
                                <span>Cetak Kwitansi</span>
                              </Button>
                            )}

                            <Link href={`/billing/${visit.id}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 rounded-lg"
                                title="Lihat Rincian Tagihan"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Payment Processing Modal */}
      {paymentVisit && (
        <PaymentModal
          open={!!paymentVisit}
          onOpenChange={(open) => !open && setPaymentVisit(null)}
          visit={paymentVisit}
          onSuccess={() => setPaymentVisit(null)}
        />
      )}

      {/* Receipt Modal */}
      {receiptVisit && (
        <ReceiptModal
          open={!!receiptVisit}
          onOpenChange={(open) => !open && setReceiptVisit(null)}
          visit={receiptVisit}
        />
      )}
    </MainLayout>
  );
}
