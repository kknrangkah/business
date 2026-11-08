'use client';

import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useRME } from '@/context/rme-context';
import { Visit, InformedConsent, ProcedureItem } from '@/types/rme';
import { formatIndonesianDate } from '@/lib/utils';
import {
  FileCheck2,
  Printer,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  Plus,
  Trash2,
  HeartPulse,
} from 'lucide-react';
import { toast } from 'sonner';

interface InformedConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit;
  procedures: ProcedureItem[];
  consents: InformedConsent[];
  onChange: (consents: InformedConsent[]) => void;
  disabled?: boolean;
}

export function InformedConsentModal({
  open,
  onOpenChange,
  visit,
  procedures,
  consents,
  onChange,
  disabled = false,
}: InformedConsentModalProps) {
  const { config, currentUser } = useRME();
  const [selectedConsentIndex, setSelectedConsentIndex] = useState<number>(0);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State for creating a new or editing consent
  const [formData, setFormData] = useState<InformedConsent>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().slice(0, 5);
    const defaultProc = procedures.length > 0 ? procedures[0].name : 'Tindakan Medis Faskes';

    return {
      id: `ic-${Date.now()}`,
      type: 'CONSENT',
      procedureName: defaultProc,
      date: todayStr,
      time: timeStr,
      signerType: 'PATIENT',
      signerName: visit.patient.name,
      signerNik: visit.patient.nik || '',
      signerRelation: 'Diri Sendiri',
      signerPhone: visit.patient.phone || '',
      signerAddress: visit.patient.streetAddress || visit.patient.address || '',
      doctorName: visit.doctorName || config.doctorName,
      witnessName: currentUser?.name || 'Perawat Klinik',
      diagnosisExplained: true,
      procedureExplained: true,
      risksAndComplicationsExplained: true,
      alternativesExplained: true,
      prognosisExplained: true,
      notes: 'Pasien/keluarga telah memahami penjelasan dokter dan menyatakan persetujuan secara sadar tanpa paksaan.',
    };
  });

  const handleStartNew = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().slice(0, 5);
    const defaultProc = procedures.length > 0 ? procedures[0].name : '';

    setFormData({
      id: `ic-${Date.now()}`,
      type: 'CONSENT',
      procedureName: defaultProc,
      date: todayStr,
      time: timeStr,
      signerType: 'PATIENT',
      signerName: visit.patient.name,
      signerNik: visit.patient.nik || '',
      signerRelation: 'Diri Sendiri',
      signerPhone: visit.patient.phone || '',
      signerAddress: visit.patient.streetAddress || visit.patient.address || '',
      doctorName: visit.doctorName || config.doctorName,
      witnessName: currentUser?.name || 'Perawat Klinik',
      diagnosisExplained: true,
      procedureExplained: true,
      risksAndComplicationsExplained: true,
      alternativesExplained: true,
      prognosisExplained: true,
      notes: '',
    });
    setIsCreatingNew(true);
  };

  const handleSaveConsent = () => {
    if (!formData.procedureName.trim()) {
      toast.error('Nama tindakan medis wajib diisi.');
      return;
    }
    if (!formData.signerName.trim()) {
      toast.error('Nama penandatangan / pihak yang menyatakan wajib diisi.');
      return;
    }

    const existingIndex = consents.findIndex((c) => c.id === formData.id);
    let updated: InformedConsent[];
    if (existingIndex >= 0) {
      updated = [...consents];
      updated[existingIndex] = formData;
    } else {
      updated = [formData, ...consents];
    }
    onChange(updated);
    setIsCreatingNew(false);
    setSelectedConsentIndex(0);
    toast.success(
      formData.type === 'CONSENT'
        ? 'Lembar Persetujuan Tindakan Medis berhasil disimpan.'
        : 'Lembar Penolakan Tindakan Medis berhasil disimpan.'
    );
  };

  const handleDeleteConsent = (id: string) => {
    const updated = consents.filter((c) => c.id !== id);
    onChange(updated);
    if (selectedConsentIndex >= updated.length) {
      setSelectedConsentIndex(Math.max(0, updated.length - 1));
    }
    toast.info('Lembar informed consent telah dihapus.');
  };

  const activeConsent = isCreatingNew ? formData : consents[selectedConsentIndex] || formData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="4xl">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          <span>Informed Consent (Persetujuan / Penolakan Tindakan Medis)</span>
        </DialogTitle>
        <DialogDescription>
          Dokumentasi yuridis persetujuan atau penolakan tindakan kedokteran sesuai Permenkes No. 290/2008 &amp; Permenkes No. 24/2022.
        </DialogDescription>
      </DialogHeader>

      <div className="py-2 space-y-4">
        {/* Top Control Bar: List of Consents or New Form */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Daftar Formulir Kunjungan Ini:</span>
            {consents.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Belum ada informed consent diterbitkan</span>
            ) : (
              consents.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setSelectedConsentIndex(idx);
                    setFormData(item);
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                    !isCreatingNew && selectedConsentIndex === idx
                      ? item.type === 'CONSENT'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.procedureName}</span>
                  <Badge
                    className={`text-[9px] py-0 px-1 ${
                      item.type === 'CONSENT'
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {item.type === 'CONSENT' ? 'Setuju' : 'Tolak'}
                  </Badge>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {!disabled && (
              <Button
                type="button"
                size="sm"
                onClick={handleStartNew}
                className="h-7 text-xs font-bold gap-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Buat Formulir Baru</span>
              </Button>
            )}
          </div>
        </div>

        {/* MODE 1: EDIT / CREATE FORM */}
        {(isCreatingNew || consents.length === 0) ? (
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-emerald-700" />
                <span>Formulir Informed Consent Baru</span>
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Jenis Pernyataan:</label>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'CONSENT' }))}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      formData.type === 'CONSENT'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Persetujuan Tindakan
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'REFUSAL' }))}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      formData.type === 'REFUSAL'
                        ? 'bg-rose-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Penolakan Tindakan
                  </button>
                </div>
              </div>
            </div>

            {/* Row 1: Tindakan Medis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-700">Nama Tindakan Kedokteran / Medis</label>
                <div className="flex items-center gap-2">
                  <Input
                    required
                    placeholder="Contoh: Jahit Luka Robek (Hecting), Sirkumsisi, Insisi Abses..."
                    value={formData.procedureName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, procedureName: e.target.value }))}
                    className="h-8 text-xs bg-white rounded-lg font-bold"
                  />
                  {procedures.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) setFormData((prev) => ({ ...prev, procedureName: e.target.value }));
                      }}
                      className="h-8 text-xs border border-slate-200 rounded-lg px-2 bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      <option value="">+ Pilih Tindakan SOAP</option>
                      {procedures.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tanggal &amp; Waktu</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="h-8 text-xs rounded-lg"
                  />
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                    className="h-8 text-xs rounded-lg w-24"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Identitas Yang Menyatakan */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span>Identitas Pihak Yang Menyatakan (Pemberi Persetujuan / Penolakan)</span>
                <div className="flex items-center gap-2 font-normal">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="signerType"
                      checked={formData.signerType === 'PATIENT'}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          signerType: 'PATIENT',
                          signerName: visit.patient.name,
                          signerNik: visit.patient.nik || '',
                          signerRelation: 'Diri Sendiri',
                          signerPhone: visit.patient.phone || '',
                          signerAddress: visit.patient.streetAddress || visit.patient.address || '',
                        }))
                      }
                      className="text-emerald-600 cursor-pointer"
                    />
                    <span>Pasien Sendiri</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="signerType"
                      checked={formData.signerType === 'FAMILY'}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          signerType: 'FAMILY',
                          signerName: '',
                          signerRelation: 'Suami / Istri',
                        }))
                      }
                      className="text-emerald-600 cursor-pointer"
                    />
                    <span>Keluarga / Suami / Istri</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="signerType"
                      checked={formData.signerType === 'GUARDIAN'}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          signerType: 'GUARDIAN',
                          signerName: '',
                          signerRelation: 'Wali / Pendamping',
                        }))
                      }
                      className="text-emerald-600 cursor-pointer"
                    />
                    <span>Wali / Lainnya</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Nama Lengkap</label>
                  <Input
                    required
                    value={formData.signerName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, signerName: e.target.value }))}
                    className="h-8 text-xs bg-white rounded-lg font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Hubungan dengan Pasien</label>
                  <Input
                    value={formData.signerRelation || 'Diri Sendiri'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, signerRelation: e.target.value }))}
                    className="h-8 text-xs bg-white rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">NIK / No. KTP</label>
                  <Input
                    value={formData.signerNik || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, signerNik: e.target.value }))}
                    className="h-8 text-xs bg-white font-mono rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">No. Telepon / WhatsApp</label>
                  <Input
                    value={formData.signerPhone || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, signerPhone: e.target.value }))}
                    className="h-8 text-xs bg-white rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Alamat Domisili</label>
                  <Input
                    value={formData.signerAddress || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, signerAddress: e.target.value }))}
                    className="h-8 text-xs bg-white rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Checklist Edukasi Dokter (Permenkes 290/2008) */}
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
              <div className="font-bold text-emerald-950 text-xs">
                Checklist Edukasi Informasi Kedokteran (Wajib Dijelaskan oleh Dokter Pemeriksa):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.diagnosisExplained}
                    onChange={(e) => setFormData((prev) => ({ ...prev, diagnosisExplained: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-800">1. Diagnosis dan indikasi tindakan telah dijelaskan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.procedureExplained}
                    onChange={(e) => setFormData((prev) => ({ ...prev, procedureExplained: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-800">2. Tata cara &amp; prosedur pelaksanaan tindakan telah dijelaskan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.risksAndComplicationsExplained}
                    onChange={(e) => setFormData((prev) => ({ ...prev, risksAndComplicationsExplained: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-800">3. Risiko, komplikasi, dan efek samping telah dipahami</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.alternativesExplained}
                    onChange={(e) => setFormData((prev) => ({ ...prev, alternativesExplained: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-800">4. Alternatif terapi dan konsekuensi penolakan telah dijelaskan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={formData.prognosisExplained}
                    onChange={(e) => setFormData((prev) => ({ ...prev, prognosisExplained: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-800">5. Perkiraan hasil dan prognosis kesembuhan telah dipahami</span>
                </label>
              </div>
            </div>

            {/* Row 4: Saksi & Dokter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Dokter Penanggung Jawab Pelaksana</label>
                <Input
                  value={formData.doctorName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, doctorName: e.target.value }))}
                  className="h-8 text-xs bg-white rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Saksi Tenaga Medis / Faskes</label>
                <Input
                  value={formData.witnessName || ''}
                  placeholder="Nama perawat / bidan yang mendampingi"
                  onChange={(e) => setFormData((prev) => ({ ...prev, witnessName: e.target.value }))}
                  className="h-8 text-xs bg-white rounded-lg"
                />
              </div>
            </div>

            {/* Row 5: Catatan Tambahan */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Catatan Khusus / Pernyataan Tambahan</label>
              <Textarea
                rows={2}
                value={formData.notes || ''}
                placeholder="Pernyataan khusus dari pasien atau dokter pemeriksa..."
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                className="text-xs bg-white rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {consents.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingNew(false)}
                  className="h-8 text-xs rounded-lg"
                >
                  Batal
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleSaveConsent}
                className="h-8 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-2xs"
              >
                Simpan Lembar Informed Consent
              </Button>
            </div>
          </div>
        ) : (
          /* MODE 2: PREVIEW & PRINT SHEET */
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-xs font-bold py-0.5 px-2 ${
                    activeConsent.type === 'CONSENT'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}
                >
                  {activeConsent.type === 'CONSENT'
                    ? 'PERSETUJUAN TINDAKAN KEDOKTERAN'
                    : 'PENOLAKAN TINDAKAN KEDOKTERAN'}
                </Badge>
                <span className="font-bold text-slate-900">{activeConsent.procedureName}</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-slate-500">{formatIndonesianDate(activeConsent.date)} {activeConsent.time}</span>
              </div>

              <div className="flex items-center gap-2">
                {!disabled && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(activeConsent);
                      setIsCreatingNew(true);
                    }}
                    className="h-7 text-xs border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Edit Data
                  </Button>
                )}
                {!disabled && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteConsent(activeConsent.id)}
                    className="h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Printable Document Box */}
            <div
              id="printable-informed-consent"
              className="border border-slate-300 bg-white p-7 rounded-xl text-slate-900 shadow-sm space-y-5 print:border-0 print:p-0 print:shadow-none"
            >
              {/* Kop Surat Faskes */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {config.logoUrl ? (
                    <img
                      src={config.logoUrl}
                      alt={config.practiceName}
                      className="h-14 w-14 object-contain rounded-xl p-0.5 border border-slate-200 bg-white shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white font-bold shrink-0">
                      <HeartPulse className="h-7 w-7" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-sm font-black uppercase tracking-tight text-slate-900 leading-tight">
                      {config.practiceName}
                    </h1>
                    <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                      {config.address || 'Alamat Fasilitas Pelayanan Kesehatan'}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      SIP: {config.sip || '-'} &bull; Telp: {config.phone || '-'}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 border-l border-slate-200 pl-4 hidden sm:block">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Dokumen Hukum Medis</div>
                  <div className="text-xs font-mono font-bold text-emerald-800">PERMENKES NO. 290/2008</div>
                  <div className="text-[10px] text-slate-500 font-mono">STANDAR RME No. 24/2022</div>
                </div>
              </div>

              {/* Judul Dokumen */}
              <div className="text-center space-y-1">
                <h2 className="text-sm sm:text-base font-black tracking-wide uppercase text-slate-900 underline underline-offset-4">
                  {activeConsent.type === 'CONSENT'
                    ? 'SURAT PERSETUJUAN TINDAKAN KEDOKTERAN (INFORMED CONSENT)'
                    : 'SURAT PENOLAKAN TINDAKAN KEDOKTERAN (INFORMED REFUSAL)'}
                </h2>
                <div className="text-xs font-mono text-slate-600">
                  Tanggal: {formatIndonesianDate(activeConsent.date)} &bull; Pukul: {activeConsent.time} WIB
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed text-justify indent-6">
                Yang bertanda tangan di bawah ini menerangkan dengan sadar dan sesungguhnya bahwa:
              </p>

              {/* Identitas Yang Menyatakan */}
              <div className="pl-6 space-y-1 text-xs text-slate-800">
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 text-slate-500">Nama Yang Menyatakan</span>
                  <span className="col-span-1 text-slate-400">:</span>
                  <span className="col-span-8 font-bold uppercase">{activeConsent.signerName}</span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 text-slate-500">NIK / KTP</span>
                  <span className="col-span-1 text-slate-400">:</span>
                  <span className="col-span-8 font-mono">{activeConsent.signerNik || '-'}</span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 text-slate-500">Hubungan dengan Pasien</span>
                  <span className="col-span-1 text-slate-400">:</span>
                  <span className="col-span-8 font-bold">{activeConsent.signerRelation || 'Diri Sendiri'}</span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 text-slate-500">Alamat</span>
                  <span className="col-span-1 text-slate-400">:</span>
                  <span className="col-span-8 text-slate-700">{activeConsent.signerAddress || '-'}</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed text-justify indent-6">
                Dengan ini menyatakan{' '}
                <strong className="underline uppercase">
                  {activeConsent.type === 'CONSENT' ? 'SETUJU (MENYETUJUI)' : 'MENOLAK (TIDAK MENYETUJUI)'}
                </strong>{' '}
                dilakukannya tindakan kedokteran berupa:{' '}
                <strong className="text-slate-900 uppercase font-black">
                  {activeConsent.procedureName}
                </strong>{' '}
                terhadap pasien:
              </p>

              {/* Identitas Pasien */}
              <div className="pl-6 space-y-1 text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 text-slate-500">Nama Pasien</span>
                  <span className="col-span-1 text-slate-400">:</span>
                  <span className="col-span-8 font-bold uppercase">{visit.patient.name}</span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 text-slate-500">No. Rekam Medis</span>
                  <span className="col-span-1 text-slate-400">:</span>
                  <span className="col-span-8 font-mono font-bold text-emerald-800">{visit.patient.noRM}</span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 text-slate-500">Umur &amp; Kelamin</span>
                  <span className="col-span-1 text-slate-400">:</span>
                  <span className="col-span-8">
                    {visit.patient.age || '-'} Tahun &bull; {visit.patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                </div>
              </div>

              {/* Pernyataan Edukasi */}
              <div className="space-y-1.5 text-xs text-slate-700">
                <p className="leading-relaxed text-justify">
                  Saya menyatakan bahwa dokter pelaksana telah memberikan penjelasan secara lengkap, jelas,
                  dan saya telah memahaminya mengenai:
                </p>
                <ul className="list-disc pl-8 space-y-0.5 text-[11px] text-slate-700">
                  <li>Diagnosis penyakit dan indikasi medis dilakukannya tindakan</li>
                  <li>Tata cara, prosedur, dan tujuan tindakan medis yang dilakukan</li>
                  <li>Risiko, komplikasi yang mungkin timbul, serta ketidaknyamanan selama tindakan</li>
                  <li>Alternatif tindakan lain beserta risiko apabila tindakan tersebut tidak dilakukan</li>
                  <li>Prognosis terhadap tindakan kedokteran yang diberikan</li>
                </ul>
              </div>

              {activeConsent.notes && (
                <div className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-200">
                  <strong>Catatan Khusus:</strong> {activeConsent.notes}
                </div>
              )}

              <p className="text-xs text-slate-700 pt-1 leading-relaxed text-justify">
                Demikian pernyataan ini saya buat dengan penuh kesadaran tanpa adanya paksaan dari pihak mana pun.
              </p>

              {/* 3 Kolom Tanda Tangan: Yang Menyatakan, Saksi Nakes, Dokter */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
                {/* 1. Yang Menyatakan */}
                <div className="space-y-1">
                  <div className="text-slate-500 font-medium">Yang Membuat Pernyataan,</div>
                  <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                    ( Tanda Tangan )
                  </div>
                  <div className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    {activeConsent.signerName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {activeConsent.signerRelation || 'Pasien'}
                  </div>
                </div>

                {/* 2. Saksi Klinik */}
                <div className="space-y-1">
                  <div className="text-slate-500 font-medium">Saksi Tenaga Medis,</div>
                  <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                    ( Tanda Tangan )
                  </div>
                  <div className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    {activeConsent.witnessName || 'Perawat Klinik'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Nakes Pendamping</div>
                </div>

                {/* 3. Dokter Pelaksana */}
                <div className="space-y-1">
                  <div className="text-slate-500 font-medium">Dokter Pelaksana Tindakan,</div>
                  <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                    {config.invoiceSignatureUrl ? (
                      <img
                        src={config.invoiceSignatureUrl}
                        alt="TTD Dokter"
                        className="h-14 w-auto object-contain mx-auto"
                      />
                    ) : (
                      '( Tanda Tangan )'
                    )}
                  </div>
                  <div className="font-bold text-slate-900 border-t border-slate-300 pt-1">
                    {activeConsent.doctorName || visit.doctorName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{config.sip || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="no-print">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Tutup
        </Button>
        {consents.length > 0 && !isCreatingNew && (
          <Button
            type="button"
            onClick={handlePrint}
            className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Lembar Informed Consent</span>
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
