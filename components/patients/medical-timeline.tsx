'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  FileText,
  Pill,
  Activity,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  Printer,
} from 'lucide-react';
import { useRME } from '@/context/rme-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatIndonesianDate, formatRupiah } from '@/lib/utils';
import { Visit } from '@/types/rme';
import { ReceiptModal } from '@/components/billing/receipt-modal';
import { CertificatePrintModal } from '@/components/examination/certificate-print-modal';
import { MedicalResumeModal } from '@/components/examination/medical-resume-modal';

export function MedicalTimeline({ patientId }: { patientId: string }) {
  const { getVisitsByPatientId } = useRME();
  const visits = getVisitsByPatientId(patientId).sort(
    (a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
  );

  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(visits[0]?.id || null);
  const [receiptVisit, setReceiptVisit] = useState<Visit | null>(null);
  const [resumeVisit, setResumeVisit] = useState<Visit | null>(null);
  const [certModalState, setCertModalState] = useState<{
    open: boolean;
    type: 'SICK_LEAVE' | 'HEALTH';
    visit: Visit | null;
  }>({
    open: false,
    type: 'SICK_LEAVE',
    visit: null,
  });

  const toggleExpand = (id: string) => {
    setExpandedVisitId((prev) => (prev === id ? null : id));
  };

  if (visits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white">
        <FileText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
        <h4 className="text-sm font-bold text-slate-700">Belum Ada Riwayat Kunjungan</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Pasien ini belum pernah melakukan pemeriksaan klinis di klinik ini. Klik tombol "+ Buat Kunjungan" untuk memulai.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
      {visits.map((visit, index) => {
        const isExpanded = expandedVisitId === visit.id;
        const mr = visit.medicalRecord;
        const vs = mr?.vitalSigns;
        const isFirst = index === 0;

        return (
          <div key={visit.id} className="relative group">
            {/* Timeline Node Icon */}
            <div
              className={`absolute -left-6 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white transition-all ${
                isFirst
                  ? 'border-emerald-600 text-emerald-700 shadow-xs'
                  : 'border-slate-300 text-slate-400 group-hover:border-emerald-400 group-hover:text-emerald-600'
              }`}
            >
              <HeartPulse className="h-3 w-3" />
            </div>

            {/* Visit Card */}
            <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden transition-all hover:border-slate-300 rounded-2xl">
              {/* Header Summary (Clickable) */}
              <div
                onClick={() => toggleExpand(visit.id)}
                className="p-4 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {formatIndonesianDate(visit.date, true)}
                    </span>
                    <span className="text-xs text-slate-400">• {visit.time} WIB</span>
                    <Badge variant="outline" className="text-[10px] bg-white font-mono font-bold">
                      Antrian: {visit.queueNumber}
                    </Badge>
                    <Badge
                      variant={
                        visit.status === 'PAID'
                          ? 'success'
                          : visit.status === 'WAITING_PAYMENT'
                          ? 'warning'
                          : visit.status === 'IN_PROGRESS'
                          ? 'info'
                          : 'secondary'
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {visit.status === 'PAID'
                        ? 'Selesai & Lunas'
                        : visit.status === 'WAITING_PAYMENT'
                        ? 'Menunggu Pembayaran'
                        : visit.status === 'IN_PROGRESS'
                        ? 'Sedang Diperiksa'
                        : 'Menunggu'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Stethoscope className="h-3.5 w-3.5 text-emerald-700" />
                    <span className="font-bold text-slate-800">{visit.doctorName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{visit.doctorSpecialty || 'Dokter Pemeriksa'}</span>
                  </div>
                </div>

                {/* Right Header Status & Toggle */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {visit.billing && (
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        {formatRupiah(visit.billing.grandTotal)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {visit.billing.status === 'PAID' ? 'Lunas' : 'Belum Bayar'}
                      </div>
                    </div>
                  )}
                  <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 cursor-pointer">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Diagnosis Summary Pill in Collapsed View */}
              {!isExpanded && mr && mr.diagnoses && mr.diagnoses.length > 0 && (
                <div className="px-4 py-2 bg-white border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-bold text-slate-700">Diagnosis:</span>
                  {mr.diagnoses.map((d) => (
                    <Badge
                      key={d.code}
                      variant="info"
                      className="text-[10px] py-0 bg-emerald-50 text-emerald-900 border-emerald-200 font-mono font-bold"
                    >
                      {d.code} - {d.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Expanded Detailed Medical Record */}
              {isExpanded && (
                <div className="p-4 space-y-4 border-t border-slate-200 text-xs bg-white">
                  {!mr ? (
                    <div className="p-3 text-center text-slate-400 italic">
                      Rekam medis belum diisi untuk kunjungan ini.
                      <div className="mt-2">
                        <Link href={`/examination/${visit.id}`}>
                          <Button size="sm" className="h-7 text-xs rounded-xl">
                            Buka Form Pemeriksaan
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Tanda Vital Summary */}
                      {vs && (
                        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5 text-emerald-700" />
                            <span>Tanda Vital & Pengukuran Fisik</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                              <div className="text-[10px] text-slate-400 font-medium">Tekanan Darah</div>
                              <div className="text-xs font-bold text-slate-800">
                                {vs.systolic}/{vs.diastolic} <span className="text-[10px] font-normal">mmHg</span>
                              </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                              <div className="text-[10px] text-slate-400 font-medium">Nadi</div>
                              <div className="text-xs font-bold text-slate-800">
                                {vs.heartRate} <span className="text-[10px] font-normal">x/mnt</span>
                              </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                              <div className="text-[10px] text-slate-400 font-medium">Suhu Tubuh</div>
                              <div className="text-xs font-bold text-slate-800">
                                {vs.temperature} <span className="text-[10px] font-normal">°C</span>
                              </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                              <div className="text-[10px] text-slate-400 font-medium">Respirasi</div>
                              <div className="text-xs font-bold text-slate-800">
                                {vs.respiratoryRate} <span className="text-[10px] font-normal">x/mnt</span>
                              </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                              <div className="text-[10px] text-slate-400 font-medium">BB / TB</div>
                              <div className="text-xs font-bold text-slate-800">
                                {vs.weight}kg / {vs.height}cm
                              </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                              <div className="text-[10px] text-slate-400 font-medium">BMI Status</div>
                              <div className="text-xs font-bold text-slate-800">
                                {vs.bmi || '-'} ({vs.bmiCategory || 'Normal'})
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Anamnesis & Keluhan */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40">
                          <div className="font-bold text-slate-800 mb-1">Keluhan Utama & Anamnesis:</div>
                          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                            {mr.anamnesis || mr.chiefComplaint || '-'}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40">
                          <div className="font-bold text-slate-800 mb-1">Pemeriksaan Fisik:</div>
                          <p className="text-slate-700 whitespace-pre-line leading-relaxed font-mono">
                            {mr.physicalExamination || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Diagnosis & Tindakan */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/30">
                          <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-emerald-700" />
                            <span>Diagnosis ICD-10:</span>
                          </div>
                          <div className="space-y-1">
                            {mr.diagnoses.map((d, dIdx) => (
                              <div key={dIdx} className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800">
                                  {d.code} — {d.name}
                                </span>
                                <Badge
                                  variant={d.type === 'PRIMARY' ? 'default' : 'secondary'}
                                  className="text-[9px] py-0 font-bold"
                                >
                                  {d.type === 'PRIMARY' ? 'Utama' : 'Sekunder'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/30">
                          <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                            <Stethoscope className="h-3.5 w-3.5 text-slate-600" />
                            <span>Tindakan Medis:</span>
                          </div>
                          {mr.procedures.length === 0 ? (
                            <span className="text-slate-400 italic">Tidak ada tindakan tambahan</span>
                          ) : (
                            <div className="space-y-1">
                              {mr.procedures.map((p, pIdx) => {
                                const hasDiscount = (p.discountAmount || 0) > 0;
                                const finalPrice = p.finalPrice !== undefined ? p.finalPrice : Math.max(0, p.price - (p.discountAmount || 0));
                                return (
                                  <div key={pIdx} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-slate-800 font-medium">{p.name}</span>
                                      {hasDiscount && (
                                        <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                          {p.discountType === 'PERCENTAGE' && p.discountPercent
                                            ? `Diskon ${p.discountPercent}%`
                                            : `Potongan ${formatRupiah(p.discountAmount || 0)}`}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {hasDiscount && (
                                        <span className="line-through text-slate-400 font-mono text-[11px]">
                                          {formatRupiah(p.price)}
                                        </span>
                                      )}
                                      <span className="font-bold text-slate-800 font-mono">
                                        {finalPrice === 0 ? 'GRATIS' : formatRupiah(finalPrice)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Resep Obat */}
                      {mr.prescriptions && mr.prescriptions.length > 0 && (
                        <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/30">
                          <div className="font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                            <Pill className="h-3.5 w-3.5 text-emerald-700" />
                            <span>Terapi Obat / E-Resep:</span>
                          </div>
                          <div className="divide-y divide-emerald-100">
                            {mr.prescriptions.map((rx, rIdx) => (
                              <div key={rIdx} className="py-1.5 flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-slate-800">
                                    {rx.name} ({rx.dosage})
                                  </div>
                                  <div className="text-[11px] text-emerald-800 font-medium">
                                    Signa: {rx.signa}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                                    {rx.quantity} {rx.unit}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Catatan Dokter & Rencana Kontrol */}
                      {mr.clinicalNotes && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                          <span className="font-bold">Catatan / Edukasi Pasien: </span>
                          <span>{mr.clinicalNotes}</span>
                        </div>
                      )}

                      {/* Surat Keterangan Medis */}
                      {(mr.sickLeaveCertificate || mr.healthCertificate) && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-emerald-700" />
                            <span>Surat Keterangan Medis Terbit:</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {mr.sickLeaveCertificate && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setCertModalState({
                                    open: true,
                                    type: 'SICK_LEAVE',
                                    visit,
                                  })
                                }
                                className="h-7 text-xs font-bold gap-1.5 border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100 rounded-lg cursor-pointer"
                              >
                                <Printer className="h-3 w-3 text-amber-700" />
                                <span>Cetak Surat Sakit ({mr.sickLeaveCertificate.totalDays} Hari)</span>
                              </Button>
                            )}
                            {mr.healthCertificate && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setCertModalState({
                                    open: true,
                                    type: 'HEALTH',
                                    visit,
                                  })
                                }
                                className="h-7 text-xs font-bold gap-1.5 border-teal-300 bg-teal-50/50 text-teal-900 hover:bg-teal-100 rounded-lg cursor-pointer"
                              >
                                <Printer className="h-3 w-3 text-teal-700" />
                                <span>Cetak Surat Keterangan Sehat</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bottom Actions for this Visit */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                        <Link href={`/examination/${visit.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-xl font-bold">
                            <Stethoscope className="h-3.5 w-3.5" />
                            Edit / Buka di Workspace Pemeriksaan
                          </Button>
                        </Link>

                        <div className="flex items-center gap-2 flex-wrap">
                          {mr && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setResumeVisit(visit)}
                              className="h-7 text-xs gap-1 bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100 rounded-xl font-bold cursor-pointer"
                              title="Lihat & Cetak Resume Medis Pasien (Permenkes No. 24/2022)"
                            >
                              <FileText className="h-3.5 w-3.5 text-teal-700" />
                              Resume Medis
                            </Button>
                          )}

                          {visit.billing && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setReceiptVisit(visit)}
                              className="h-7 text-xs gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold cursor-pointer"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              Cetak Kwitansi / RME
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          </div>
        );
      })}

      {/* Modal Resume Medis Pasien */}
      {resumeVisit && (
        <MedicalResumeModal
          open={!!resumeVisit}
          onOpenChange={(open) => !open && setResumeVisit(null)}
          visit={resumeVisit}
        />
      )}

      {/* Kwitansi Printable Modal */}
      {receiptVisit && (
        <ReceiptModal
          open={!!receiptVisit}
          onOpenChange={(open) => !open && setReceiptVisit(null)}
          visit={receiptVisit}
        />
      )}

      {/* Surat Keterangan Sakit / Sehat Printable Modal */}
      {certModalState.visit && certModalState.visit.medicalRecord && (
        <CertificatePrintModal
          open={certModalState.open}
          onOpenChange={(open) => setCertModalState((prev) => ({ ...prev, open }))}
          type={certModalState.type}
          visit={certModalState.visit}
          sickLeaveData={certModalState.visit.medicalRecord.sickLeaveCertificate}
          healthData={certModalState.visit.medicalRecord.healthCertificate}
        />
      )}
    </div>
  );
}
