'use client';

import React from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRME } from '@/context/rme-context';
import { Visit } from '@/types/rme';
import { formatIndonesianDate, formatRupiah } from '@/lib/utils';
import {
  Printer,
  FileText,
  HeartPulse,
  Stethoscope,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  QrCode,
  Activity,
  Pill,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface MedicalResumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit;
}

export function MedicalResumeModal({
  open,
  onOpenChange,
  visit,
}: MedicalResumeModalProps) {
  const { config } = useRME();
  const mr = visit.medicalRecord;
  const vs = mr?.vitalSigns;
  const patient = visit.patient;

  const handlePrint = () => {
    window.print();
  };

  const resumeNumber = `RESUME/${new Date(visit.date).getFullYear()}/${String(
    new Date(visit.date).getMonth() + 1
  ).padStart(2, '0')}/${visit.queueNumber}`;

  // Hitung IMT / BMI jika TB dan BB tersedia
  const calculateBMI = () => {
    if (!vs?.weight || !vs?.height) return null;
    const heightInM = vs.height / 100;
    const bmi = (vs.weight / (heightInM * heightInM)).toFixed(1);
    let category = 'Normal';
    const num = parseFloat(bmi);
    if (num < 18.5) category = 'Kurang (Underweight)';
    else if (num >= 23 && num < 25) category = 'Kelebihan (Overweight)';
    else if (num >= 25) category = 'Obesitas';
    return { bmi, category };
  };

  const bmiData = calculateBMI();

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="4xl">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
          <FileText className="h-5 w-5 text-emerald-700" />
          <span>Resume Medis Pasien (Ringkasan Pelayanan Rawat Jalan)</span>
        </DialogTitle>
        <DialogDescription>
          Dokumen resmi ringkasan rekam medis klinis pasien sesuai standar Permenkes No. 24 Tahun 2022.
        </DialogDescription>
      </DialogHeader>

      <div className="py-2">
        {/* Printable Paper Container */}
        <div
          id="printable-resume"
          className="border border-slate-300 bg-white p-6 sm:p-8 rounded-xl text-slate-900 shadow-xs space-y-5 print:border-0 print:p-0 print:shadow-none"
        >
          {/* Header Kop Surat Resmi Klinik */}
          {config.invoiceHeaderMode === 'CUSTOM_LETTERHEAD' && config.letterheadUrl ? (
            <div className="border-b-2 border-slate-900 pb-3 mb-2">
              <div className="w-full flex items-center justify-center overflow-hidden rounded">
                <img
                  src={config.letterheadUrl}
                  alt={config.practiceName}
                  className="w-full max-h-32 object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt={config.practiceName}
                    className="h-16 w-16 object-contain rounded-xl p-0.5 border border-slate-200 bg-white shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white font-bold shrink-0 shadow-xs">
                    <HeartPulse className="h-8 w-8" />
                  </div>
                )}
                <div>
                  <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 leading-tight">
                    {config.practiceName}
                  </h1>
                  {config.subtitle && (
                    <div className="text-xs font-bold text-emerald-800 leading-tight mt-0.5">
                      {config.subtitle}
                    </div>
                  )}
                  <div className="text-xs text-slate-700 font-medium mt-0.5">
                    Penanggung Jawab: <strong>{config.doctorName}</strong> ({config.sip})
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {config.address} • Telp: {config.phone}
                    {config.email ? ` • ${config.email}` : ''}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 border-l border-slate-200 pl-4 hidden sm:block">
                <div className="text-[10px] uppercase font-bold text-slate-400">Standar Dokumen</div>
                <div className="text-xs font-mono font-bold text-emerald-800">PERMENKES NO. 24/2022</div>
                <div className="text-[10px] text-slate-500 font-mono">Rekam Medis Elektronik (RME)</div>
              </div>
            </div>
          )}

          {/* Judul & Nomor Resume */}
          <div className="text-center space-y-1 pt-1">
            <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-900 underline underline-offset-4">
              RESUME MEDIS PASIEN RAWAT JALAN
            </h2>
            <div className="text-xs text-slate-600 font-mono">
              No. Dokumen: <strong>{resumeNumber}</strong>
            </div>
          </div>

          {/* Section 1 & 2: Identitas Pasien & Informasi Kunjungan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs">
            {/* Kolom Kiri: Data Pasien */}
            <div className="space-y-1.5">
              <div className="font-bold text-emerald-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-emerald-700" />
                <span>IDENTITAS PASIEN</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-500">No. Rekam Medis</span>
                <span className="col-span-2 font-mono font-bold text-emerald-800">: {patient.noRM}</span>

                <span className="text-slate-500">Nama Lengkap</span>
                <span className="col-span-2 font-bold text-slate-900">: {patient.name}</span>

                <span className="text-slate-500">NIK (KTP)</span>
                <span className="col-span-2 font-mono">: {patient.nik || '-'}</span>

                <span className="text-slate-500">Tgl Lahir / Usia</span>
                <span className="col-span-2">
                  : {patient.birthDate ? formatIndonesianDate(patient.birthDate) : '-'} ({patient.age || 0} Tahun)
                </span>

                <span className="text-slate-500">Jenis Kelamin</span>
                <span className="col-span-2">: {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>

                <span className="text-slate-500">Alamat Pasien</span>
                <span className="col-span-2 leading-relaxed">: {patient.address || '-'}</span>

                <span className="text-slate-500">No. Telepon/HP</span>
                <span className="col-span-2">: {patient.phone || '-'}</span>
              </div>
            </div>

            {/* Kolom Kanan: Data Kunjungan */}
            <div className="space-y-1.5">
              <div className="font-bold text-emerald-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                <span>DATA PELAYANAN &amp; KUNJUNGAN</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-500">Tanggal Pelayanan</span>
                <span className="col-span-2 font-bold">: {formatIndonesianDate(visit.date)}</span>

                <span className="text-slate-500">Waktu Kunjungan</span>
                <span className="col-span-2">: {visit.time} WIB</span>

                <span className="text-slate-500">Nomor Antrian</span>
                <span className="col-span-2 font-mono font-bold text-emerald-800">: {visit.queueNumber}</span>

                <span className="text-slate-500">Dokter DPJP</span>
                <span className="col-span-2 font-bold text-slate-900">: {visit.doctorName || config.doctorName}</span>

                <span className="text-slate-500">Spesialisasi / Poli</span>
                <span className="col-span-2">: {visit.doctorSpecialty || 'Poli Umum'}</span>

                <span className="text-slate-500">Cara Bayar / Penjamin</span>
                <span className="col-span-2 font-bold uppercase">: {visit.paymentType || 'UMUM'}</span>

                <span className="text-slate-500">Status Rekam Medis</span>
                <span className="col-span-2 font-bold text-emerald-700">
                  : {visit.status === 'PAID' ? 'Lengkap & Selesai Lunas' : 'Pemeriksaan Telah Diselesaikan'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Anamnesis & Keluhan (Subjective) */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="uppercase font-extrabold text-[11px] tracking-wide text-slate-800">
                I. ANAMNESIS &amp; KELUHAN KLINIS (SUBJEKTIF)
              </span>
            </div>
            <div className="px-2 space-y-1.5 leading-relaxed">
              <div>
                <span className="font-bold text-slate-700">Keluhan Utama:</span>{' '}
                <span className="text-slate-900 font-medium">
                  {mr?.chiefComplaint || visit.chiefComplaintSummary || 'Pemeriksaan kesehatan rutin'}
                </span>
              </div>
              {mr?.anamnesis && (
                <div>
                  <span className="font-bold text-slate-700">Riwayat Penyakit Sekarang (Anamnesis):</span>{' '}
                  <span className="text-slate-800 whitespace-pre-line">{mr.anamnesis}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="font-bold text-slate-700">Riwayat Alergi:</span>{' '}
                {patient.allergies && patient.allergies.length > 0 ? (
                  <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    ⚠️ {patient.allergies.join(', ')}
                  </span>
                ) : (
                  <span className="text-slate-500 italic">Tidak ada riwayat alergi yang dilaporkan</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Pemeriksaan Fisik & Tanda Vital (Objective) */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="uppercase font-extrabold text-[11px] tracking-wide text-slate-800">
                II. PEMERIKSAAN FISIK &amp; TANDA-TANDA VITAL (OBJEKTIF)
              </span>
            </div>

            {/* Tabel Ringkas Tanda Vital */}
            {vs ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Tekanan Darah</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {vs.systolic && vs.diastolic ? `${vs.systolic}/${vs.diastolic} mmHg` : '-'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Denyut Nadi</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {vs.heartRate ? `${vs.heartRate} x/menit` : '-'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Laju Pernapasan</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {vs.respiratoryRate ? `${vs.respiratoryRate} x/menit` : '-'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Suhu Tubuh</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {vs.temperature ? `${vs.temperature} °C` : '-'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Berat Badan</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {vs.weight ? `${vs.weight} kg` : '-'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Tinggi Badan</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {vs.height ? `${vs.height} cm` : '-'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Indeks Massa Tubuh</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {bmiData ? `${bmiData.bmi} (${bmiData.category})` : '-'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Saturasi Oksigen (SpO2)</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {vs.oxygenSaturation ? `${vs.oxygenSaturation}%` : '-'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-2 text-slate-500 italic">Data tanda-tanda vital tidak direkam.</div>
            )}

            {mr?.physicalExamination && (
              <div className="px-2 pt-1 leading-relaxed">
                <span className="font-bold text-slate-700">Hasil Pemeriksaan Fisik:</span>{' '}
                <span className="text-slate-800 whitespace-pre-line">{mr.physicalExamination}</span>
              </div>
            )}
          </div>

          {/* Section 5: Diagnosis Medis (Assessment) */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="uppercase font-extrabold text-[11px] tracking-wide text-slate-800">
                III. DIAGNOSIS MEDIS (ICD-10)
              </span>
            </div>
            {mr?.diagnoses && mr.diagnoses.length > 0 ? (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {mr.diagnoses.map((diag, dIdx) => (
                  <div key={dIdx} className="p-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-950 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300 text-xs">
                        {diag.code}
                      </span>
                      <span className="font-bold text-slate-900">{diag.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        diag.type === 'PRIMARY'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {diag.type === 'PRIMARY' ? 'DIAGNOSIS UTAMA' : 'DIAGNOSIS SEKUNDER'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-2 text-slate-500 italic">Belum ada diagnosis yang ditetapkan.</div>
            )}
          </div>

          {/* Section 6: Penatalaksanaan, Tindakan, Terapi & Edukasi (Plan) */}
          <div className="space-y-2.5 text-xs">
            <div className="font-bold text-slate-900 bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="uppercase font-extrabold text-[11px] tracking-wide text-slate-800">
                IV. PENATALAKSANAAN, TINDAKAN &amp; TERAPI OBAT (PLAN)
              </span>
            </div>

            {/* Tindakan Medis ICD-9-CM */}
            {mr?.procedures && mr.procedures.length > 0 && (
              <div className="space-y-1 px-2">
                <span className="font-bold text-slate-700 block">Tindakan Medis &amp; Terapi (ICD-9-CM):</span>
                <div className="space-y-1">
                  {mr.procedures.map((proc, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-1.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-900 bg-teal-100/70 px-2 py-0.5 rounded border border-teal-300 text-[11px]">
                          {proc.code}
                        </span>
                        <span className="font-semibold text-slate-800">{proc.name}</span>
                      </div>
                      <span className="font-mono text-slate-600 text-[11px]">
                        {formatRupiah(proc.finalPrice ?? proc.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terapi Resep Obat Pulang */}
            {mr?.prescriptions && mr.prescriptions.length > 0 && (
              <div className="space-y-1 px-2">
                <span className="font-bold text-slate-700 block">Terapi Farmasi / Resep Obat Pasien:</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-3">No.</th>
                        <th className="py-1.5 px-3">Nama Obat / Sediaan</th>
                        <th className="py-1.5 px-3">Dosis</th>
                        <th className="py-1.5 px-3">Jumlah</th>
                        <th className="py-1.5 px-3">Signa / Aturan Pakai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {mr.prescriptions.map((rx, rIdx) => (
                        <tr key={rIdx}>
                          <td className="py-1.5 px-3 font-mono text-slate-500">{rIdx + 1}</td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{rx.name}</td>
                          <td className="py-1.5 px-3 text-slate-600">{rx.dosage}</td>
                          <td className="py-1.5 px-3 font-mono font-semibold">
                            {rx.quantity} {rx.unit}
                          </td>
                          <td className="py-1.5 px-3 font-medium text-emerald-800">{rx.signa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Edukasi, Catatan Dokter & Rencana Kontrol */}
            <div className="px-2 space-y-1.5 pt-1 leading-relaxed">
              {mr?.clinicalNotes && (
                <div>
                  <span className="font-bold text-slate-700">Anjuran Medis &amp; Edukasi Pasien:</span>{' '}
                  <span className="text-slate-800 whitespace-pre-line">{mr.clinicalNotes}</span>
                </div>
              )}
              {mr?.followUpPlan && (
                <div>
                  <span className="font-bold text-slate-700">Rencana Tindak Lanjut / Kontrol:</span>{' '}
                  <span className="text-slate-800">{mr.followUpPlan}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 7: Tanda Tangan & Legalisasi Medis */}
          <div className="grid grid-cols-2 pt-6 items-end text-xs border-t border-slate-200">
            {/* Stempel Faskes & QR Verifikasi */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 border border-slate-300 rounded-lg p-1 bg-white flex flex-col items-center justify-center text-center">
                  <QrCode className="h-10 w-10 text-slate-700" />
                  <span className="text-[7px] text-slate-500 font-mono">VERIFIKASI RME</span>
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5 leading-snug">
                  <div className="font-bold text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Dokumen Rekam Medis Sah</span>
                  </div>
                  <div>Terverifikasi secara digital pada sistem RME Klinik.</div>
                  <div className="font-mono text-[9px] text-slate-400">ID: {visit.id}</div>
                </div>
              </div>
            </div>

            {/* Kolom TTD Dokter */}
            <div className="text-right space-y-1">
              <div className="text-slate-700">
                {config.invoiceCity || 'Surabaya'}, {formatIndonesianDate(visit.date)}
                <div className="text-[11px] text-slate-500 font-medium">Dokter Penanggung Jawab Pelayanan (DPJP),</div>
              </div>

              {config.invoiceSignatureUrl ? (
                <div className="flex justify-end py-1">
                  <img
                    src={config.invoiceSignatureUrl}
                    alt="Tanda Tangan Dokter"
                    className="h-14 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="h-14 flex items-center justify-end pr-6">
                  <span className="text-slate-300 italic text-[11px]">[Tanda Tangan Elektronik]</span>
                </div>
              )}

              <div className="font-black text-slate-900 underline text-xs">
                {visit.doctorName || config.doctorName}
              </div>
              <div className="text-[10px] text-slate-600 font-mono">
                SIP: {config.sip || '445/SIP/123/2024'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 print:hidden border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-500 hidden sm:inline">
          Dokumen dapat dicetak pada kertas A4 atau disimpan dalam format PDF melalui dialog print peramban.
        </span>
        <div className="flex items-center gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs rounded-xl"
          >
            Tutup
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-bold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak / Simpan PDF</span>
          </Button>
        </div>
      </DialogFooter>

      {/* Embedded Print Styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-resume,
          #printable-resume * {
            visibility: visible;
          }
          #printable-resume {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
        }
      `}</style>
    </Dialog>
  );
}
