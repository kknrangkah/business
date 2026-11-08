'use client';

import React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRME } from '@/context/rme-context';
import { Visit, SickLeaveCertificate, HealthCertificate, ReferralCertificate } from '@/types/rme';
import { formatIndonesianDate } from '@/lib/utils';
import { Printer, HeartPulse, Building2, Stethoscope, FileCheck, Award, ArrowUpRight } from 'lucide-react';

interface CertificatePrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'SICK_LEAVE' | 'HEALTH' | 'REFERRAL';
  visit: Visit;
  sickLeaveData?: SickLeaveCertificate;
  healthData?: HealthCertificate;
  referralData?: ReferralCertificate;
}

// Helper to convert small numbers to Indonesian text words
function numberToIndonesianWord(num: number): string {
  const words = ['Nol', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas'];
  return words[num] || String(num);
}

export function CertificatePrintModal({
  open,
  onOpenChange,
  type,
  visit,
  sickLeaveData,
  healthData,
  referralData,
}: CertificatePrintModalProps) {
  const { config } = useRME();

  const handlePrint = () => {
    window.print();
  };

  const isSickLeave = type === 'SICK_LEAVE';
  const isReferral = type === 'REFERRAL';
  const issueDate = isSickLeave
    ? sickLeaveData?.issueDate || new Date().toISOString()
    : isReferral
    ? referralData?.issueDate || new Date().toISOString()
    : healthData?.issueDate || new Date().toISOString();

  const certNumber = isSickLeave
    ? sickLeaveData?.certificateNumber || `SKS/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${visit.queueNumber}`
    : isReferral
    ? referralData?.certificateNumber || `SR/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${visit.queueNumber}`
    : healthData?.certificateNumber || `SKD/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${visit.queueNumber}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="3xl">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle className="flex items-center gap-2 text-base">
          <Printer className="h-4 w-4 text-emerald-700" />
          <span>
            {isSickLeave
              ? 'Surat Keterangan Sakit (Surat Istirahat)'
              : isReferral
              ? 'Surat Rujukan Pasien (Faskes Tingkat Lanjut)'
              : 'Surat Keterangan Kesehatan Jasmani'}
          </span>
        </DialogTitle>
        <DialogDescription>
          Pratinjau resmi surat keterangan kedokteran sebelum dicetak atau diunduh ke format PDF.
        </DialogDescription>
      </DialogHeader>

      <div className="py-2">
        {/* Printable Paper Container */}
        <div
          id="printable-certificate"
          className="border border-slate-300 bg-white p-7 rounded-xl text-slate-900 shadow-sm space-y-5 print:border-0 print:p-0 print:shadow-none"
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
                  <h1 className="text-base font-black uppercase tracking-tight text-slate-900 leading-tight">
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
                <div className="text-[10px] uppercase font-bold text-slate-400">Dokumen Medis</div>
                <div className="text-xs font-mono font-bold text-emerald-800">REKAM MEDIS PM</div>
                <div className="text-[10px] text-slate-500 font-mono">Kode: RM-24/2022</div>
              </div>
            </div>
          )}

          {/* Judul & Nomor Surat */}
          <div className="text-center space-y-1 pt-1">
            <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-900 underline underline-offset-4">
              {isSickLeave
                ? 'SURAT KETERANGAN SAKIT'
                : isReferral
                ? 'SURAT RUJUKAN PASIEN'
                : 'SURAT KETERANGAN KESEHATAN'}
            </h2>
            <div className="text-xs font-mono text-slate-600 font-semibold">
              Nomor: {certNumber}
            </div>
          </div>

          {/* Pernyataan Pembuka Dokter */}
          <p className="text-xs text-slate-700 leading-relaxed text-justify indent-6">
            Yang bertanda tangan di bawah ini, Dokter Pemeriksa pada{' '}
            <strong>{config.practiceName}</strong>, menerangkan dengan sebenarnya berdasarkan hasil
            pemeriksaan klinis yang telah dilakukan bahwa:
          </p>

          {/* Data Identitas Pasien */}
          <div className="pl-6 space-y-1.5 text-xs text-slate-800">
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-3 text-slate-500">Nama Lengkap</span>
              <span className="col-span-1 text-slate-400">:</span>
              <span className="col-span-8 font-bold text-slate-900 uppercase">
                {visit.patient.name}
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-3 text-slate-500">Nomor Rekam Medis</span>
              <span className="col-span-1 text-slate-400">:</span>
              <span className="col-span-8 font-mono font-bold text-blue-700">
                {visit.patient.noRM}
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-3 text-slate-500">NIK / Identitas</span>
              <span className="col-span-1 text-slate-400">:</span>
              <span className="col-span-8 font-mono">{visit.patient.nik || '-'}</span>
            </div>
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-3 text-slate-500">Tanggal Lahir / Umur</span>
              <span className="col-span-1 text-slate-400">:</span>
              <span className="col-span-8">
                {visit.patient.birthDate
                  ? `${formatIndonesianDate(visit.patient.birthDate)} (${visit.patient.age || '-'} Tahun)`
                  : `${visit.patient.age || '-'} Tahun`}
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-3 text-slate-500">Jenis Kelamin</span>
              <span className="col-span-1 text-slate-400">:</span>
              <span className="col-span-8">
                {visit.patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
              </span>
            </div>
            {isSickLeave && (
              <>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 text-slate-500">Pekerjaan</span>
                  <span className="col-span-1 text-slate-400">:</span>
                  <span className="col-span-8">
                    {sickLeaveData?.profession || 'Karyawan / Pelajar'}
                  </span>
                </div>
                {sickLeaveData?.institution && (
                  <div className="grid grid-cols-12 gap-2">
                    <span className="col-span-3 text-slate-500">Instansi / Perusahaan</span>
                    <span className="col-span-1 text-slate-400">:</span>
                    <span className="col-span-8">{sickLeaveData.institution}</span>
                  </div>
                )}
              </>
            )}
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-3 text-slate-500">Alamat Pasien</span>
              <span className="col-span-1 text-slate-400">:</span>
              <span className="col-span-8 text-slate-700">
                {visit.patient.streetAddress ||
                  visit.patient.address ||
                  `${visit.patient.subdistrict || ''}, ${visit.patient.city || ''}`}
              </span>
            </div>
          </div>

          <hr className="border-slate-200 my-2" />

          {/* ============================================================ */}
          {/* KONTEN A: SURAT KETERANGAN SAKIT (SURAT ISTIRAHAT)           */}
          {/* ============================================================ */}
          {isSickLeave && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed text-justify">
                Berhubung dengan kondisi kesehatannya saat ini yang memerlukan perawatan dan
                pemulihan kesehatan, pasien tersebut di atas diberikan izin untuk beristirahat
                selama{' '}
                <strong className="underline">
                  {sickLeaveData?.totalDays || 1} (
                  {numberToIndonesianWord(sickLeaveData?.totalDays || 1)}) hari
                </strong>
                , terhitung mulai tanggal{' '}
                <strong>
                  {formatIndonesianDate(
                    sickLeaveData?.startDate || new Date().toISOString()
                  )}
                </strong>{' '}
                sampai dengan tanggal{' '}
                <strong>
                  {formatIndonesianDate(
                    sickLeaveData?.endDate || new Date().toISOString()
                  )}
                </strong>
                .
              </p>

              {sickLeaveData?.showDiagnosis && sickLeaveData?.diagnosis && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                    Keterangan Klinis / Diagnosis:
                  </div>
                  <div className="text-slate-900 font-semibold mt-0.5">
                    {sickLeaveData.diagnosis}
                  </div>
                </div>
              )}

              {sickLeaveData?.notes && (
                <div className="text-slate-600 italic">
                  <strong>Anjuran Medis:</strong> {sickLeaveData.notes}
                </div>
              )}

              <p className="text-slate-700 pt-1">
                Demikian surat keterangan ini dibuat dengan sebenarnya atas sumpah jabatan untuk
                dapat dipergunakan sebagaimana mestinya.
              </p>
            </div>
          )}

          {/* ============================================================ */}
          {/* KONTEN B: SURAT KETERANGAN KESEHATAN JASMANI                 */}
          {/* ============================================================ */}
          {!isSickLeave && !isReferral && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed text-justify">
                Telah dilakukan pemeriksaan fisik dan kesehatan lengkap dengan rincian hasil sebagai
                berikut:
              </p>

              {/* Tabel Pemeriksaan Fisik & Vital Sign */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100/80 px-3 py-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wide border-b border-slate-200">
                  Parameter Pemeriksaan Fisik &amp; Tanda Vital
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 text-xs">
                  <div>
                    <span className="text-slate-500">Tekanan Darah:</span>{' '}
                    <strong>
                      {healthData?.systolic || 120} / {healthData?.diastolic || 80} mmHg
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Denyut Nadi:</span>{' '}
                    <strong>{healthData?.heartRate || 80} x/menit</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Tinggi Badan:</span>{' '}
                    <strong>{healthData?.height || 165} cm</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Berat Badan:</span>{' '}
                    <strong>{healthData?.weight || 60} kg</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Golongan Darah:</span>{' '}
                    <strong className="font-mono">{healthData?.bloodType || visit.patient.bloodType || 'O'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Tes Buta Warna:</span>{' '}
                    <strong>
                      {healthData?.colorBlindness === 'PARTIAL'
                        ? 'Buta Warna Parsial'
                        : healthData?.colorBlindness === 'TOTAL'
                        ? 'Buta Warna Total'
                        : 'Normal (Tidak Buta Warna)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Tajam Penglihatan:</span>{' '}
                    <strong>{healthData?.vision || 'Normal 6/6 ODS'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Pendengaran:</span>{' '}
                    <strong>{healthData?.hearing || 'Normal / Baik'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Kelainan Fisik:</span>{' '}
                    <strong>{healthData?.physicalDefect || 'Tidak Ditemukan'}</strong>
                  </div>
                </div>
              </div>

              {/* Kesimpulan Sehat */}
              <div className="p-3 rounded-lg border-2 border-emerald-600 bg-emerald-50/50 space-y-1">
                <div className="text-[11px] font-bold text-emerald-900 uppercase">
                  Kesimpulan Hasil Pemeriksaan:
                </div>
                <div className="text-sm font-black text-emerald-900">
                  {healthData?.conclusion === 'SEHAT_DENGAN_CATATAN'
                    ? 'DIPERIKSA: SEHAT DENGAN CATATAN'
                    : healthData?.conclusion === 'TIDAK_SEHAT'
                    ? 'DIPERIKSA: TIDAK MEMENUHI SYARAT KESEHATAN'
                    : 'DIPERIKSA: DINYATAKAN SEHAT JASMANI & ROHANI'}
                </div>
                {healthData?.purpose && (
                  <div className="text-xs text-emerald-800 pt-0.5">
                    Surat keterangan ini diberikan untuk keperluan:{' '}
                    <strong>{healthData.purpose}</strong>
                  </div>
                )}
              </div>

              {healthData?.notes && (
                <div className="text-slate-600 italic">
                  <strong>Catatan Dokter:</strong> {healthData.notes}
                </div>
              )}

              <p className="text-slate-700 pt-1">
                Demikian surat keterangan kesehatan ini dibuat dengan sebenar-benarnya atas sumpah
                jabatan untuk dapat dipergunakan sesuai kepentingannya.
              </p>
            </div>
          )}

          {/* ============================================================ */}
          {/* KONTEN C: SURAT RUJUKAN PASIEN KE RUMAH SAKIT / FASKES LANJUT */}
          {/* ============================================================ */}
          {isReferral && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="text-slate-500 font-medium">Kepada Yth. Teman Sejawat:</div>
                <div className="font-bold text-slate-900 text-sm">
                  Dokter Spesialis {referralData?.destinationDepartment || 'Terkait'}
                </div>
                <div className="text-slate-700 font-medium">
                  di {referralData?.destinationHospital || 'Rumah Sakit Rujukan'}
                </div>
              </div>

              <p className="text-slate-700 leading-relaxed text-justify">
                Mohon konsultasi dan penanganan lebih lanjut terhadap pasien tersebut di atas, yang pada
                pemeriksaan di fasilitas pelayanan kami didapatkan data klinis sebagai berikut:
              </p>

              {/* Ringkasan Temuan Klinis */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/80 px-3 py-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wide border-b border-slate-200">
                  Data Klinis &amp; Pemeriksaan Pasien
                </div>
                <div className="p-3 space-y-2 text-xs divide-y divide-slate-100">
                  <div className="grid grid-cols-12 gap-2 pb-1.5">
                    <span className="col-span-3 font-semibold text-slate-600">Tanda Vital:</span>
                    <span className="col-span-9 font-mono text-slate-900">
                      {referralData?.vitalSignsSummary ||
                        `TD: ${visit.medicalRecord?.vitalSigns.systolic || 120}/${visit.medicalRecord?.vitalSigns.diastolic || 80} mmHg, Nadi: ${visit.medicalRecord?.vitalSigns.heartRate || 80}x/mnt, Suhu: ${visit.medicalRecord?.vitalSigns.temperature || 36.5}°C, SpO2: ${visit.medicalRecord?.vitalSigns.oxygenSaturation || 98}%`}
                    </span>
                  </div>

                  {referralData?.anamnesisSummary && (
                    <div className="grid grid-cols-12 gap-2 py-1.5">
                      <span className="col-span-3 font-semibold text-slate-600">Anamnesis / Keluhan:</span>
                      <span className="col-span-9 text-slate-800 leading-relaxed">
                        {referralData.anamnesisSummary}
                      </span>
                    </div>
                  )}

                  {referralData?.physicalExamSummary && (
                    <div className="grid grid-cols-12 gap-2 py-1.5">
                      <span className="col-span-3 font-semibold text-slate-600">Pemeriksaan Fisik:</span>
                      <span className="col-span-9 text-slate-800 whitespace-pre-line leading-relaxed font-mono text-[11px]">
                        {referralData.physicalExamSummary}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-12 gap-2 py-1.5">
                    <span className="col-span-3 font-bold text-slate-700">Diagnosis Rujukan:</span>
                    <span className="col-span-9 font-bold text-slate-950">
                      {referralData?.preliminaryDiagnosis || 'Memerlukan Evaluasi Lanjutan'}
                    </span>
                  </div>

                  {referralData?.therapyGiven && (
                    <div className="grid grid-cols-12 gap-2 py-1.5">
                      <span className="col-span-3 font-semibold text-slate-600">Terapi yang Diberikan:</span>
                      <span className="col-span-9 text-slate-800">
                        {referralData.therapyGiven}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-12 gap-2 pt-1.5">
                    <span className="col-span-3 font-semibold text-slate-600">Alasan Rujukan:</span>
                    <span className="col-span-9 text-slate-800 font-medium">
                      {referralData?.reasonForReferral || 'Penanganan spesialis dan diagnostik penunjang lanjutan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Rujukan */}
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px]">
                <div>
                  <span className="text-slate-500">Keadaan Saat Dirujuk:</span>{' '}
                  <strong className="font-bold text-slate-800 uppercase">
                    {referralData?.conditionAtReferral || 'STABIL'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Transportasi:</span>{' '}
                  <strong className="font-bold text-slate-800 uppercase">
                    {referralData?.transportationType === 'AMBULANCE'
                      ? 'Ambulans Faskes'
                      : referralData?.transportationType === 'KENDARAAN_UMUM'
                      ? 'Kendaraan Umum'
                      : 'Kendaraan Pribadi / Mandiri'}
                  </strong>
                </div>
              </div>

              {referralData?.notes && (
                <div className="text-slate-600 italic">
                  <strong>Catatan Khusus:</strong> {referralData.notes}
                </div>
              )}

              <p className="text-slate-700 pt-1 leading-relaxed">
                Demikian surat rujukan ini kami buat, atas bantuan, perhatian, dan kerja sama Teman Sejawat,
                kami ucapkan terima kasih.
              </p>
            </div>
          )}

          {/* Tanda Tangan & Cap Faskes */}
          <div className="grid grid-cols-2 pt-6 items-end text-xs">
            {/* Stempel Faskes */}
            <div>
              {config.invoiceShowStamp !== false && (
                config.invoiceStampUrl ? (
                  <img
                    src={config.invoiceStampUrl}
                    alt="Cap Stempel Faskes"
                    className="h-20 w-auto object-contain rotate-[-4deg] opacity-90"
                  />
                ) : (
                  <div className="inline-block border-2 border-emerald-700 rounded-lg p-2 text-emerald-800 font-bold uppercase tracking-widest rotate-[-4deg] bg-emerald-50/50">
                    <div className="text-[10px]">{config.practiceName}</div>
                    <div className="text-[8px] font-normal font-mono">
                      TERVERIFIKASI • {formatIndonesianDate(issueDate)}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Kolom TTD Dokter */}
            <div className="text-right space-y-2">
              <div className="text-slate-700">
                {config.invoiceCity || 'Jakarta'}, {formatIndonesianDate(issueDate)}
                <div className="text-[11px] text-slate-500 font-medium">Dokter Pemeriksa,</div>
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
                <div className="h-14" />
              )}

              <div>
                <div className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[160px] text-center">
                  ( {visit.doctorName || config.doctorName} )
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  {config.sip}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="no-print">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Tutup
        </Button>
        <Button
          type="button"
          onClick={handlePrint}
          className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs font-semibold"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak Lembar Surat</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
