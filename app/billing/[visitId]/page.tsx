'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { BillingSummary } from '@/components/billing/billing-summary';
import { PaymentModal } from '@/components/billing/payment-modal';
import { ReceiptModal } from '@/components/billing/receipt-modal';
import { MedicalResumeModal } from '@/components/examination/medical-resume-modal';
import { useRME } from '@/context/rme-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Stethoscope, Clock, Receipt, FileText } from 'lucide-react';

export default function BillingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getVisitById, visits } = useRME();

  const visitId = (params?.visitId as string) || '';
  const visit = getVisitById(visitId);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  if (!visit || !visit.billing) {
    return (
      <MainLayout>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <Receipt className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="text-lg font-bold text-slate-800">Tagihan Belum Dibuat</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Pasien ini belum memiliki invoice tagihan aktif. Silakan selesaikan pemeriksaan medis terlebih dahulu.
          </p>
          <div className="pt-2">
            <Link href="/queue">
              <Button size="sm" variant="outline" className="text-xs">
                Kembali ke Antrian
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Daftar Tagihan</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            {visit.medicalRecord && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsResumeModalOpen(true)}
                className="h-8 text-xs font-bold gap-1.5 text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded-xl cursor-pointer"
                title="Lihat & Cetak Dokumen Resume Medis Pasien"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-700" />
                <span>Resume Medis</span>
              </Button>
            )}

            <Link href={`/examination/${visit.id}`}>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-xl font-semibold">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Buka Pemeriksaan Klinis</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Detailed Billing Summary Card */}
        <BillingSummary
          visit={visit}
          onOpenPayment={() => setIsPaymentModalOpen(true)}
          onOpenReceipt={() => setIsReceiptModalOpen(true)}
        />
      </div>

      {/* Payment Processing Modal */}
      <PaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        visit={visit}
      />

      {/* Receipt Printable Modal */}
      <ReceiptModal
        open={isReceiptModalOpen}
        onOpenChange={setIsReceiptModalOpen}
        visit={visit}
      />

      {/* Medical Resume Modal */}
      {visit.medicalRecord && (
        <MedicalResumeModal
          open={isResumeModalOpen}
          onOpenChange={setIsResumeModalOpen}
          visit={visit}
        />
      )}
    </MainLayout>
  );
}
