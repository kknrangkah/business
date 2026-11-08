'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  Phone,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Building,
  Stethoscope,
  RefreshCw,
  Edit2,
  Check,
} from 'lucide-react';
import { Patient, ControlVisitLetter, PracticeConfig } from '@/types/rme';
import { useRME } from '@/context/rme-context';
import { toast } from 'sonner';

interface WhatsAppReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  controlVisitLetter: ControlVisitLetter;
  config: PracticeConfig;
  onReminderSent?: (updatedLetter: ControlVisitLetter) => void;
}

function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('08')) {
    cleaned = '628' + cleaned.slice(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

function formatDateIndonesian(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function generateDefaultMessage(
  patient: Patient,
  letter: ControlVisitLetter,
  config: PracticeConfig
): string {
  const formattedDate = formatDateIndonesian(letter.controlDate);
  const timeText = letter.controlTime ? ` pukul ${letter.controlTime} WIB` : '';
  const poliText = letter.poli ? `\n🏥 Poli/Ruangan: ${letter.poli}` : '';
  const doctorText = letter.doctorName ? `\n👨‍⚕️ Dokter: ${letter.doctorName}` : '';
  const diagnosisText = letter.diagnosis ? `\n📋 Keterangan: ${letter.diagnosis}` : '';
  const instructionsText = letter.instructions
    ? `\n\n📌 *Instruksi Dokter:*\n${letter.instructions}`
    : '';

  return `Assalamu'alaikum / Halo, *${patient.name}*! 👋

Kami dari *${config.practiceName}* ingin mengingatkan bahwa Anda memiliki jadwal *KONTROL / KUNJUNGAN ULANG* yang telah dibuatkan oleh dokter.

📅 *Detail Jadwal Kontrol:*
━━━━━━━━━━━━━━━━━━━
📆 Tanggal: *${formattedDate}${timeText}*${doctorText}${poliText}${diagnosisText}
━━━━━━━━━━━━━━━━━━━${instructionsText}

⚠️ *Mohon hadir tepat waktu sesuai jadwal.* Jika ada halangan, silakan hubungi kami sebelumnya agar dapat dilakukan penjadwalan ulang.

📞 Hubungi kami: *${config.phone || '-'}*
📍 Alamat: ${config.address || '-'}

Terima kasih atas kepercayaan Anda kepada kami. Semoga lekas pulih dan sehat selalu! 🙏

_Pesan ini dikirim oleh sistem ${config.practiceName}_`;
}

export function WhatsAppReminderModal({
  open,
  onOpenChange,
  patient,
  controlVisitLetter,
  config,
  onReminderSent,
}: WhatsAppReminderModalProps) {
  const { updatePatient } = useRME();
  const [phoneNumber, setPhoneNumber] = useState(patient.phone || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (open) {
      setIsSent(false);
      setIsEditingPhone(false);
      setPhoneNumber(patient.phone || '');
      const defaultMsg =
        controlVisitLetter.customMessage ||
        generateDefaultMessage(patient, controlVisitLetter, config);
      setMessage(defaultMsg);
    }
  }, [open, patient, controlVisitLetter, config]);

  const cleanPhone = phoneNumber.trim();
  const phoneForWA = formatPhoneForWhatsApp(cleanPhone);
  const hasPhone = Boolean(phoneForWA && phoneForWA.length >= 10);

  const handleRegenerateMessage = () => {
    const freshMsg = generateDefaultMessage(patient, controlVisitLetter, config);
    setMessage(freshMsg);
    toast.success('Pesan berhasil di-generate ulang!');
  };

  const handleCopyMessage = () => {
    navigator.clipboard
      .writeText(message)
      .then(() => toast.success('Pesan berhasil disalin ke clipboard!'))
      .catch(() => toast.error('Gagal menyalin pesan. Silakan copy manual.'));
  };

  const handleSendWhatsApp = () => {
    if (!hasPhone) {
      toast.error('Masukkan nomor telepon/WhatsApp pasien yang valid.');
      return;
    }

    // Jika nomor diubah atau baru ditambahkan, otomatis simpan ke data pasien
    if (patient.id && cleanPhone !== patient.phone) {
      updatePatient(patient.id, { phone: cleanPhone });
      toast.success(`Nomor WhatsApp ${cleanPhone} tersimpan ke data pasien ${patient.name}!`);
    }

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${phoneForWA}?text=${encodedMessage}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setIsSent(true);

    const updatedLetter: ControlVisitLetter = {
      ...controlVisitLetter,
      reminderEnabled: true,
      reminderStatus: 'SENT',
      reminderSentAt: new Date().toISOString(),
      customMessage: message,
    };
    onReminderSent?.(updatedLetter);
    toast.success(`Reminder WhatsApp berhasil dibuka untuk ${patient.name}!`);
  };

  const formattedControlDate = formatDateIndonesian(controlVisitLetter.controlDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="xl">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-md shrink-0">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              Kirim Reminder Kontrol via WhatsApp
              <Badge className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5">
                WhatsApp
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              Kirim pengingat jadwal kontrol kunjungan pasien ke nomor WhatsApp yang terdaftar
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4">
        {/* Patient & Schedule Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Patient Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Data Pasien</span>
              </div>
              {hasPhone && !isEditingPhone && (
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(true)}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Ubah No. WA</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 text-sm">{patient.name}</div>
              <div className="text-xs text-slate-600 font-mono">No. RM: {patient.noRM || '-'}</div>

              {/* Phone display & Inline Edit */}
              {!isEditingPhone && hasPhone ? (
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-xl">
                    <Phone className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span className="text-xs font-bold font-mono">{cleanPhone}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    Data Pendaftaran
                  </span>
                </div>
              ) : (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="h-8 text-xs font-mono bg-white rounded-lg border-emerald-300 focus:border-emerald-500 pr-8"
                      />
                    </div>
                    {patient.phone && isEditingPhone && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneNumber(patient.phone || '');
                          setIsEditingPhone(false);
                        }}
                        className="text-[11px] text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 cursor-pointer font-medium shrink-0"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Nomor WhatsApp dari pendaftaran pasien. Dapat diedit jika ada perubahan.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 space-y-2">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Jadwal Kontrol</span>
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 text-sm leading-tight">
                {formattedControlDate}
              </div>
              {controlVisitLetter.controlTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-700">
                    {controlVisitLetter.controlTime} WIB
                  </span>
                </div>
              )}
              {controlVisitLetter.doctorName && (
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs text-slate-700 font-medium">
                    {controlVisitLetter.doctorName}
                  </span>
                </div>
              )}
              {controlVisitLetter.poli && (
                <div className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs text-slate-600">{controlVisitLetter.poli}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Composer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-green-600" />
              <span>Pesan WhatsApp</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRegenerateMessage}
                className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-semibold cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Generate Ulang</span>
              </button>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors font-semibold cursor-pointer flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                <span>Salin</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={9}
              placeholder="Tulis pesan WhatsApp..."
              className="text-xs leading-relaxed text-slate-700 bg-white rounded-xl border-slate-200 font-normal resize-none"
            />
            <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-mono">
              {message.length} karakter
            </div>
          </div>
          <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
            <Sparkles className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
            <span>
              Pesan di atas digenerate otomatis berdasarkan data surat kontrol. Anda dapat
              mengeditnya sebelum dikirim.
            </span>
          </p>
        </div>

        {/* WA Preview Card */}
        {hasPhone ? (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-green-900 flex items-center gap-1.5">
                <span>Siap Kirim ke WhatsApp Pasien</span>
                <span className="text-[10px] bg-green-200/80 text-green-800 px-1.5 py-0.2 rounded font-semibold">
                  +{phoneForWA}
                </span>
              </div>
              <div className="text-[11px] text-green-700">
                Pesan akan langsung diarahkan ke nomor WhatsApp terdaftar pasien di wa.me
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-green-600 shrink-0" />
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-900">Nomor Telepon Belum Terisi</div>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Masukkan nomor telepon/WhatsApp pasien pada kolom data pasien di atas agar tombol kirim aktif.
              </p>
            </div>
          </div>
        )}

        {isSent && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-900">Reminder Berhasil Dibuka!</div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Tab WhatsApp Web/App telah dibuka. Silakan klik tombol kirim di WhatsApp untuk
                menyelesaikan pengiriman.
              </p>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="text-xs font-semibold rounded-xl cursor-pointer"
        >
          Tutup
        </Button>
        <Button
          type="button"
          onClick={handleCopyMessage}
          variant="outline"
          className="text-xs font-semibold rounded-xl gap-1.5 cursor-pointer border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
        >
          <Copy className="h-3.5 w-3.5" />
          Salin Pesan
        </Button>
        <Button
          type="button"
          onClick={handleSendWhatsApp}
          disabled={!hasPhone}
          className="text-xs font-bold rounded-xl gap-1.5 bg-green-600 hover:bg-green-700 text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
        >
          <Send className="h-3.5 w-3.5" />
          Buka WhatsApp &amp; Kirim
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
