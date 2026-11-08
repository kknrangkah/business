'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Visit } from '@/types/rme';
import { formatRupiah, formatIndonesianDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PaymentModal } from '@/components/billing/payment-modal';
import { ReceiptModal } from '@/components/billing/receipt-modal';
import {
  CreditCard,
  Search,
  Clock,
  CheckCircle2,
  Receipt,
  User,
  ArrowRight,
  Printer,
  Sparkles,
} from 'lucide-react';

export default function PaymentTerminalPage() {
  const { visits } = useRME();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisitForPayment, setSelectedVisitForPayment] = useState<Visit | null>(null);
  const [selectedVisitForReceipt, setSelectedVisitForReceipt] = useState<Visit | null>(null);

  // Filter pending payment visits
  const pendingVisits = visits.filter(
    (v) => v.billing && (v.status === 'WAITING_PAYMENT' || v.billing.status === 'PENDING')
  );

  const filteredVisits = pendingVisits.filter((v) => {
    const query = searchQuery.toLowerCase();
    return (
      v.patient.name.toLowerCase().includes(query) ||
      v.patient.noRM.toLowerCase().includes(query) ||
      v.queueNumber.toLowerCase().includes(query) ||
      (v.billing && v.billing.invoiceNumber.toLowerCase().includes(query))
    );
  });

  const totalPendingAmount = pendingVisits.reduce(
    (acc, v) => acc + (v.billing?.grandTotal || 0),
    0
  );

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-emerald-700" />
              <span>Terminal Pembayaran &amp; Kasir Cepat</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Proses transaksi tagihan pasien yang telah selesai diperiksa oleh dokter.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-right shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Total Antrian Kasir: {pendingVisits.length} Pasien
            </div>
            <div className="text-base font-bold text-amber-900 font-mono">
              {formatRupiah(totalPendingAmount)}
            </div>
          </div>
        </div>

        {/* Search Patient Box */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari antrian kasir berdasarkan Nama Pasien, No. RM, atau No. Antrian (e.g. A-003)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs bg-white rounded-xl shadow-2xs"
          />
        </div>

        {/* Pending Invoices Cards */}
        {filteredVisits.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-slate-300 bg-white rounded-2xl">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-2" />
            <h3 className="text-base font-bold text-slate-800">Semua Tagihan Kasir Sudah Lunas!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Tidak ada antrian pembayaran tertunda saat ini. Tagihan baru akan muncul saat dokter menyelesaikan pemeriksaan.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVisits.map((visit) => {
              const b = visit.billing!;
              return (
                <Card
                  key={visit.id}
                  className="border border-slate-200 bg-white shadow-xs p-5 hover:border-emerald-400 hover:shadow-md transition-all rounded-2xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-bold font-mono text-xs border border-emerald-300">
                        Antrian: {visit.queueNumber}
                      </span>
                      <Badge variant="warning" className="gap-1 text-[10px] font-bold">
                        <Clock className="h-3 w-3" />
                        Menunggu Kasir
                      </Badge>
                    </div>

                    {/* Patient Info */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{visit.patient.name}</h4>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {visit.patient.noRM} • Invoice: {b.invoiceNumber}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Pemeriksa: {visit.doctorName}
                      </div>
                    </div>

                    {/* Bill Breakdown Mini */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Konsultasi Dokter:</span>
                        <span className="font-mono">{formatRupiah(b.consultationFee)}</span>
                      </div>
                      {b.proceduresFee > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Tindakan Medis:</span>
                          <span className="font-mono">{formatRupiah(b.proceduresFee)}</span>
                        </div>
                      )}
                      {b.medicationsFee > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Resep Obat ({visit.medicalRecord?.prescriptions?.length || 0} item):</span>
                          <span className="font-mono">{formatRupiah(b.medicationsFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                        <span>Total Tagihan:</span>
                        <span className="text-emerald-800 font-black font-mono">{formatRupiah(b.grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Trigger Button */}
                  <div className="pt-4 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedVisitForReceipt(visit)}
                      className="text-xs text-slate-600 hover:text-slate-900 h-8 rounded-xl cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1" />
                      Pratinjau Kwitansi
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setSelectedVisitForPayment(visit)}
                      className="gap-1.5 font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs h-8 text-xs rounded-xl cursor-pointer"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Proses Bayar ({formatRupiah(b.grandTotal)})</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Processing Modal */}
      {selectedVisitForPayment && (
        <PaymentModal
          open={!!selectedVisitForPayment}
          onOpenChange={(open) => !open && setSelectedVisitForPayment(null)}
          visit={selectedVisitForPayment}
          onSuccess={() => setSelectedVisitForPayment(null)}
        />
      )}

      {/* Receipt Modal */}
      {selectedVisitForReceipt && (
        <ReceiptModal
          open={!!selectedVisitForReceipt}
          onOpenChange={(open) => !open && setSelectedVisitForReceipt(null)}
          visit={selectedVisitForReceipt}
        />
      )}
    </MainLayout>
  );
}
