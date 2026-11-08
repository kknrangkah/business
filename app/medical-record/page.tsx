'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatIndonesianDate } from '@/lib/utils';
import {
  FileText,
  Search,
  Stethoscope,
  Printer,
  HeartPulse,
} from 'lucide-react';
import { ReceiptModal } from '@/components/billing/receipt-modal';
import { CertificatePrintModal } from '@/components/examination/certificate-print-modal';
import { MedicalResumeModal } from '@/components/examination/medical-resume-modal';
import { Visit } from '@/types/rme';

export default function MedicalRecordsPage() {
  const { visits } = useRME();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisitForReceipt, setSelectedVisitForReceipt] = useState<Visit | null>(null);
  const [selectedVisitForResume, setSelectedVisitForResume] = useState<Visit | null>(null);
  const [selectedCertModal, setSelectedCertModal] = useState<{
    open: boolean;
    type: 'SICK_LEAVE' | 'HEALTH';
    visit: Visit | null;
  }>({
    open: false,
    type: 'SICK_LEAVE',
    visit: null,
  });

  // Filter visits that have medical records
  const recordedVisits = visits.filter((v) => v.medicalRecord);

  const filteredVisits = recordedVisits.filter((v) => {
    const query = searchQuery.toLowerCase();
    const matchPatient =
      v.patient.name.toLowerCase().includes(query) ||
      v.patient.noRM.toLowerCase().includes(query) ||
      v.patient.nik.includes(query);

    const matchDiagnosis = v.medicalRecord?.diagnoses.some(
      (d) => d.name.toLowerCase().includes(query) || d.code.toLowerCase().includes(query)
    );

    const matchMedication = v.medicalRecord?.prescriptions.some((rx) =>
      rx.name.toLowerCase().includes(query)
    );

    return matchPatient || matchDiagnosis || matchMedication;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-emerald-700" />
              <span>Arsip Rekam Medis Elektronik (RME)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pencarian terpusat rekam klinis, diagnosis ICD-10, tindakan, dan riwayat peresepan obat.
            </p>
          </div>

          <div className="text-xs text-slate-600 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-bold">
            Total Arsip: <strong className="text-emerald-800">{recordedVisits.length} Dokumen RME</strong>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari berdasarkan Pasien, No RM, Diagnosis ICD-10, atau Nama Obat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-white rounded-xl"
          />
        </div>

        {/* Records List Table */}
        <Card className="overflow-hidden border border-slate-200 shadow-xs bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-700 text-white border-b border-emerald-800 shadow-2xs font-bold select-none">
                <tr>
                  <th className="py-3 px-4 font-bold text-white">Tanggal & No. RM</th>
                  <th className="py-3 px-4 font-bold text-white">Nama Pasien</th>
                  <th className="py-3 px-4 font-bold text-white">Diagnosis ICD-10</th>
                  <th className="py-3 px-4 font-bold text-white">Tanda Vital</th>
                  <th className="py-3 px-4 font-bold text-white">Terapi Obat (E-Resep)</th>
                  <th className="py-3 px-4 font-bold text-white">Dokter Pemeriksa</th>
                  <th className="py-3 px-4 font-bold text-right text-white">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">
                        {searchQuery ? 'Tidak ada rekam medis yang cocok' : 'Belum Ada Riwayat Rekam Medis'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {searchQuery ? 'Coba ubah kata kunci pencarian diagnosis atau pasien.' : 'Pemeriksaan medis yang diselesaikan dokter akan otomatis tercatat rapi di sini.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredVisits.map((visit) => {
                    const mr = visit.medicalRecord!;
                    const vs = mr.vitalSigns;

                    return (
                      <tr key={visit.id} className="hover:bg-emerald-50/50 transition-colors">
                        {/* Tanggal & No. RM */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">
                            {formatIndonesianDate(visit.date)}
                          </div>
                          <div className="text-[11px] font-mono text-emerald-800 font-bold">
                            {visit.patient.noRM}
                          </div>
                        </td>

                        {/* Nama Pasien */}
                        <td className="py-3 px-4">
                          <Link
                            href={`/patients/${visit.patient.id}`}
                            className="font-bold text-slate-900 hover:text-emerald-700"
                          >
                            {visit.patient.name}
                          </Link>
                          <div className="text-[11px] text-slate-400">
                            {visit.patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • {visit.patient.age || 30} th
                          </div>
                        </td>

                        {/* Diagnosis */}
                        <td className="py-3 px-4 max-w-[200px]">
                          {mr.diagnoses.map((d, dIdx) => (
                            <div key={dIdx} className="truncate">
                              <Badge
                                variant={d.type === 'PRIMARY' ? 'info' : 'secondary'}
                                className="text-[10px] py-0 mr-1"
                              >
                                {d.code}
                              </Badge>
                              <span className="font-semibold text-slate-800">{d.name}</span>
                            </div>
                          ))}

                          {/* Indikator Surat Keterangan Medis */}
                          {(mr.sickLeaveCertificate || mr.healthCertificate) && (
                            <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                              {mr.sickLeaveCertificate && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedCertModal({
                                      open: true,
                                      type: 'SICK_LEAVE',
                                      visit,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                                  title="Cetak Ulang Surat Keterangan Sakit"
                                >
                                  <FileText className="h-3 w-3 text-amber-700" />
                                  <span>Surat Sakit ({mr.sickLeaveCertificate.totalDays} Hari)</span>
                                </button>
                              )}
                              {mr.healthCertificate && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedCertModal({
                                      open: true,
                                      type: 'HEALTH',
                                      visit,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 text-[10px] font-bold bg-teal-50 text-teal-900 border border-teal-300 px-1.5 py-0.5 rounded hover:bg-teal-100 transition-colors cursor-pointer shadow-2xs"
                                  title="Cetak Ulang Surat Keterangan Sehat"
                                >
                                  <HeartPulse className="h-3 w-3 text-teal-700" />
                                  <span>Surat Sehat</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Tanda Vital */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                          {vs ? (
                            <div>
                              <div className="font-semibold">TD: {vs.systolic}/{vs.diastolic} mmHg</div>
                              <div className="text-[10px] text-slate-400">
                                HR: {vs.heartRate} • S: {vs.temperature}°C
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* Terapi Obat */}
                        <td className="py-3 px-4 max-w-[180px]">
                          {mr.prescriptions && mr.prescriptions.length > 0 ? (
                            <div className="space-y-0.5">
                              {mr.prescriptions.slice(0, 2).map((rx, rIdx) => (
                                <div key={rIdx} className="truncate text-slate-700 font-medium">
                                  • {rx.name} ({rx.quantity} {rx.unit})
                                </div>
                              ))}
                              {mr.prescriptions.length > 2 && (
                                <span className="text-[10px] text-slate-400">
                                  +{mr.prescriptions.length - 2} obat lainnya
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Tanpa obat</span>
                          )}
                        </td>

                        {/* Dokter Pemeriksa */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{visit.doctorName}</div>
                          <div className="text-[11px] text-slate-500">{visit.doctorSpecialty || 'Dokter Umum'}</div>
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedVisitForResume(visit)}
                              className="h-7 px-2.5 text-[11px] gap-1 text-teal-800 border-teal-200 hover:bg-teal-50 rounded-lg font-bold cursor-pointer"
                              title="Lihat & Cetak Resume Medis Pasien (Permenkes No. 24/2022)"
                            >
                              <FileText className="h-3 w-3 text-teal-700" />
                              <span>Resume</span>
                            </Button>

                            <Link href={`/examination/${visit.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-[11px] gap-1 text-emerald-800 border-emerald-200 hover:bg-emerald-50 rounded-lg font-bold"
                                title="Buka di Workspace Pemeriksaan"
                              >
                                <Stethoscope className="h-3 w-3" />
                                <span>Buka RME</span>
                              </Button>
                            </Link>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedVisitForReceipt(visit)}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 rounded-lg"
                              title="Cetak Kwitansi / Ringkasan RME"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
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

      {/* Modal Resume Medis Pasien */}
      {selectedVisitForResume && (
        <MedicalResumeModal
          open={!!selectedVisitForResume}
          onOpenChange={(open) => !open && setSelectedVisitForResume(null)}
          visit={selectedVisitForResume}
        />
      )}

      {/* Kwitansi / Ringkasan RME Modal */}
      {selectedVisitForReceipt && (
        <ReceiptModal
          open={!!selectedVisitForReceipt}
          onOpenChange={(open) => !open && setSelectedVisitForReceipt(null)}
          visit={selectedVisitForReceipt}
        />
      )}

      {/* Surat Keterangan Sakit & Sehat Print Modal */}
      {selectedCertModal.visit && selectedCertModal.visit.medicalRecord && (
        <CertificatePrintModal
          open={selectedCertModal.open}
          onOpenChange={(open) =>
            setSelectedCertModal((prev) => ({ ...prev, open }))
          }
          type={selectedCertModal.type}
          visit={selectedCertModal.visit}
          sickLeaveData={
            selectedCertModal.visit.medicalRecord.sickLeaveCertificate
          }
          healthData={selectedCertModal.visit.medicalRecord.healthCertificate}
        />
      )}
    </MainLayout>
  );
}
