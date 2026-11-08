'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { MedicalTimeline } from '@/components/patients/medical-timeline';
import { PatientFormModal } from '@/components/patients/patient-form-modal';
import { CreateVisitModal } from '@/components/patients/create-visit-modal';
import { useRME } from '@/context/rme-context';
import { formatIndonesianDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  HeartPulse,
  AlertTriangle,
  CalendarPlus,
  Edit2,
  ArrowLeft,
  Shield,
  FileText,
} from 'lucide-react';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getPatientById, getVisitsByPatientId } = useRME();

  const patientId = params?.id as string;
  const patient = getPatientById(patientId);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  if (!patient) {
    return (
      <MainLayout>
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-4">
          <User className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="text-lg font-bold text-slate-800">Pasien Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Data pasien dengan ID tersebut tidak ditemukan dalam sistem rekam medis.
          </p>
          <Link href="/patients">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-xl">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar Pasien
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const visits = getVisitsByPatientId(patient.id).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const hasAllergies = patient.allergies && patient.allergies.length > 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back Navigation & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link
            href="/patients"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Data Pasien</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="h-8 gap-1.5 text-xs text-slate-700 bg-white shadow-2xs rounded-xl"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Identitas</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsVisitModalOpen(true)}
              className="h-8 gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs rounded-xl"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              <span>+ Buat Kunjungan Baru</span>
            </Button>
          </div>
        </div>

        {/* Patient Profile Master Card */}
        <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden rounded-2xl">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              {/* Avatar & Core Identity */}
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-600 text-white text-2xl font-black shadow-sm">
                  {patient.name.charAt(0)}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
                    <Badge variant="outline" className="font-mono text-emerald-800 bg-emerald-50 border-emerald-200 text-xs">
                      {patient.noRM}
                    </Badge>
                    <Badge
                      variant={patient.gender === 'L' ? 'default' : 'purple'}
                      className="text-xs"
                    >
                      {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </Badge>
                    {patient.bloodType && (
                      <Badge variant="secondary" className="text-xs font-bold font-mono">
                        Gol: {patient.bloodType}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-slate-400" />
                      NIK: <strong className="font-mono text-slate-700">{patient.nik}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatIndonesianDate(patient.birthDate)} ({patient.age || 30} Tahun)
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <strong className="text-slate-700">{patient.phone}</strong>
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-start gap-1 pt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{patient.address}</span>
                  </div>
                </div>
              </div>

              {/* Quick Summary Numbers */}
              <div className="flex items-center gap-3 w-full lg:w-auto self-stretch lg:self-center bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="text-center px-3 py-1">
                  <div className="text-lg font-black text-slate-900">{visits.length}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Total Kunjungan</div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center px-3 py-1">
                  <div className="text-lg font-black text-emerald-700">
                    {visits[0] ? formatIndonesianDate(visits[0].date).split(' ')[0] + ' ' + formatIndonesianDate(visits[0].date).split(' ')[1] : '-'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Kunjungan Terakhir</div>
                </div>
              </div>
            </div>

            {/* Allergy & Emergency Contact Alert Banner */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Allergy */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                hasAllergies
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${hasAllergies ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span className="font-semibold">Riwayat Alergi:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {hasAllergies ? (
                    patient.allergies!.map((a) => (
                      <Badge key={a} variant="destructive" className="text-[10px] py-0 font-bold">
                        {a}
                      </Badge>
                    ))
                  ) : (
                    <span className="italic text-slate-400">Tidak ada riwayat alergi obat/makanan</span>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-emerald-700" />
                  <span className="font-semibold">Kontak Darurat:</span>
                </div>
                <div>
                  {patient.emergencyContact?.name ? (
                    <span>
                      {patient.emergencyContact.name} ({patient.emergencyContact.relationship}) •{' '}
                      <strong>{patient.emergencyContact.phone}</strong>
                    </span>
                  ) : (
                    <span className="italic text-slate-400">Belum ada kontak darurat</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Medical History Timeline Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-700" />
                <span>Riwayat Rekam Medis Pasien</span>
              </h2>
              <p className="text-xs text-slate-500">
                Kronologi seluruh kunjungan medis, diagnosis ICD-10, tindakan, dan terapi obat yang pernah diberikan.
              </p>
            </div>
          </div>

          <MedicalTimeline patientId={patient.id} />
        </div>
      </div>

      {/* Edit Patient Modal */}
      <PatientFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        patientToEdit={patient}
      />

      {/* Create Visit Modal */}
      <CreateVisitModal
        open={isVisitModalOpen}
        onOpenChange={setIsVisitModalOpen}
        patient={patient}
      />
    </MainLayout>
  );
}
