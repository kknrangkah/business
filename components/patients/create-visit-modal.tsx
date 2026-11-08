'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useRME } from '@/context/rme-context';
import { Patient, PaymentType } from '@/types/rme';
import { Calendar, User, Stethoscope, Clock, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface CreateVisitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  onSuccess?: (visitId: string) => void;
}

export function CreateVisitModal({
  open,
  onOpenChange,
  patient,
  onSuccess,
}: CreateVisitModalProps) {
  const router = useRouter();
  const { doctors, config, createVisit } = useRME();

  const [selectedDoctorId, setSelectedDoctorId] = useState(config.activeDoctorId || doctors[0]?.id || 'doc-1');
  const [paymentType, setPaymentType] = useState<PaymentType>('UMUM');
  const [chiefComplaint, setChiefComplaint] = useState('');

  if (!patient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newVisit = createVisit(patient.id, {
        doctorId: selectedDoctorId,
        paymentType,
        chiefComplaint: chiefComplaint.trim(),
        patient,
      });

      toast.success(
        `Kunjungan dibuat! No. Antrian: ${newVisit.queueNumber} untuk pasien ${patient.name}`
      );

      onOpenChange(false);
      if (onSuccess) {
        onSuccess(newVisit.id);
      } else {
        // If in doctor only mode or doctor role, direct to examination or queue
        if (config.currentRole === 'DOCTOR') {
          router.push(`/examination/${newVisit.id}`);
        } else {
          router.push('/queue');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat kunjungan');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="md">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>Buat Kunjungan / Antrian Pasien</DialogTitle>
        <DialogDescription>
          Mendaftarkan antrian pemeriksaan untuk pasien hari ini.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Patient Summary Card */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white font-bold text-sm">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{patient.name}</div>
              <div className="text-xs text-slate-500">
                {patient.noRM} • {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • {patient.age || 30} th
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-white font-bold">
            {patient.bloodType ? `Gol: ${patient.bloodType}` : 'Umum'}
          </Badge>
        </div>

        {/* Doctor Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Pilih Dokter Pemeriksa <span className="text-rose-500">*</span>
          </label>
          <Select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
          >
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} ({doc.specialty})
              </option>
            ))}
          </Select>
        </div>

        {/* Jenis Penjamin / Pembayaran */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Jenis Penjamin / Pembayaran <span className="text-rose-500">*</span>
          </label>
          <Select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value as PaymentType)}
          >
            <option value="UMUM">Pasien Umum / Tunai Mandiri</option>
            <option value="BPJS">BPJS Kesehatan (Faskes Primer)</option>
            <option value="ASURANSI_SWASTA">Asuransi Swasta / Korporat</option>
          </Select>
        </div>

        {/* Keluhan Awal */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Keluhan Awal / Alasan Kunjungan
          </label>
          <Textarea
            rows={2}
            placeholder="Contoh: Demam 2 hari, batuk, pusing..."
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" className="gap-1.5">
            <Clock className="h-4 w-4" />
            Terbitkan Nomor Antrian
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
