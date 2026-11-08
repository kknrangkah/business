'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  CalendarPlus,
  Edit2,
  Phone,
  User,
  ChevronRight,
} from 'lucide-react';
import { Patient } from '@/types/rme';
import { useRME } from '@/context/rme-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PatientFormModal } from './patient-form-modal';
import { CreateVisitModal } from './create-visit-modal';
import { formatIndonesianDate } from '@/lib/utils';

export function PatientTable() {
  const router = useRouter();
  const { patients, visits, hasPermission } = useRME();

  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [allergyFilter, setAllergyFilter] = useState<'ALL' | 'WITH_ALLERGY' | 'NO_ALLERGY'>('ALL');

  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [patientForVisit, setPatientForVisit] = useState<Patient | null>(null);

  // Filter patients
  const filteredPatients = patients.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nik.includes(searchQuery) ||
      p.noRM.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);

    const matchGender = genderFilter === 'ALL' || p.gender === genderFilter;

    const matchAllergy =
      allergyFilter === 'ALL'
        ? true
        : allergyFilter === 'WITH_ALLERGY'
        ? (p.allergies && p.allergies.length > 0)
        : (!p.allergies || p.allergies.length === 0);

    return matchSearch && matchGender && matchAllergy;
  });

  // Get last visit info for a patient
  const getLastVisit = (patientId: string) => {
    const pVisits = visits
      .filter((v) => v.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return pVisits[0];
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari Nama, NIK, No. RM, No. HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-white rounded-xl"
            />
          </div>

          {/* Gender Filter */}
          <div className="w-full sm:w-40">
            <Select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="h-9 text-xs bg-white rounded-xl"
            >
              <option value="ALL">Semua Gender</option>
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </Select>
          </div>

          {/* Allergy Filter */}
          <div className="w-full sm:w-44">
            <Select
              value={allergyFilter}
              onChange={(e) => setAllergyFilter(e.target.value as any)}
              className="h-9 text-xs bg-white rounded-xl"
            >
              <option value="ALL">Semua Alergi</option>
              <option value="WITH_ALLERGY">Punya Riwayat Alergi</option>
              <option value="NO_ALLERGY">Bebas Alergi</option>
            </Select>
          </div>
        </div>

        {/* Quick Add Patient */}
        {hasPermission('create_patient') && (
        <Button
          onClick={() => {
            setPatientToEdit(null);
            setIsNewPatientModalOpen(true);
          }}
          className="gap-1.5 font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs rounded-xl"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pasien Baru</span>
        </Button>
        )}
      </div>

      {/* Patients Table Card */}
      <Card className="overflow-hidden border border-slate-200/90 shadow-xs bg-white rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-700 text-white border-b border-emerald-800 shadow-2xs font-bold select-none">
              <tr>
                <th className="py-3 px-4 font-bold text-white">No. RM & NIK</th>
                <th className="py-3 px-4 font-bold text-white">Nama Pasien</th>
                <th className="py-3 px-4 font-bold text-white">Gender / Usia</th>
                <th className="py-3 px-4 font-bold text-white">No. Telepon & Alamat</th>
                <th className="py-3 px-4 font-bold text-white">Riwayat Alergi</th>
                <th className="py-3 px-4 font-bold text-white">Kunjungan Terakhir</th>
                <th className="py-3 px-4 font-bold text-right text-white">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <User className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">
                      {searchQuery ? 'Tidak ada data pasien ditemukan' : 'Belum Ada Data Pasien'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {searchQuery ? 'Coba ubah kata kunci pencarian.' : 'Klik tombol "+ Pasien Baru" untuk mendaftarkan pasien ke faskes.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const lastVisit = getLastVisit(patient.id);
                  const hasAllergies = patient.allergies && patient.allergies.length > 0;

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-emerald-50/50 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/patients/${patient.id}`)}
                    >
                      {/* No. RM & NIK */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-emerald-800 font-mono text-sm">{patient.noRM}</div>
                        <div className="text-[11px] text-slate-400 font-mono">NIK: {patient.nik}</div>
                      </td>

                      {/* Nama Pasien */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{patient.name}</span>
                          {patient.bloodType && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              {patient.bloodType}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          Lahir: {formatIndonesianDate(patient.birthDate)}
                        </div>
                      </td>

                      {/* Gender / Usia */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={patient.gender === 'L' ? 'default' : 'purple'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </Badge>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">{patient.age || 30} Tahun</div>
                      </td>

                      {/* Telepon & Alamat */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="text-slate-800 flex items-center gap-1 font-medium">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{patient.phone}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{patient.address}</div>
                      </td>

                      {/* Riwayat Alergi */}
                      <td className="py-3 px-4">
                        {hasAllergies ? (
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {patient.allergies!.map((alg) => (
                              <Badge
                                key={alg}
                                variant="destructive"
                                className="text-[10px] px-1.5 py-0 bg-rose-50 text-rose-800 border-rose-200 font-bold"
                              >
                                {alg}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Tidak ada</span>
                        )}
                      </td>

                      {/* Kunjungan Terakhir */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {lastVisit ? (
                          <div>
                            <div className="font-semibold text-slate-800">
                              {formatIndonesianDate(lastVisit.date)}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                              {lastVisit.medicalRecord?.diagnoses[0]?.name || lastVisit.chiefComplaintSummary || 'Pemeriksaan'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum ada kunjungan</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Buat Kunjungan */}
                          {hasPermission('create_visit') && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2.5 text-[11px] font-bold gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-lg"
                            onClick={() => setPatientForVisit(patient)}
                            title="Buat Kunjungan Hari Ini"
                          >
                            <CalendarPlus className="h-3 w-3" />
                            <span>+ Kunjungan</span>
                          </Button>
                          )}

                          {/* Edit Patient */}
                          {hasPermission('edit_patient') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 rounded-lg"
                            onClick={() => {
                              setPatientToEdit(patient);
                              setIsNewPatientModalOpen(true);
                            }}
                            title="Edit Data Pasien"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          )}

                          {/* View Detail */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg"
                            onClick={() => router.push(`/patients/${patient.id}`)}
                            title="Buka Rekam Medis"
                          >
                            <ChevronRight className="h-4 w-4" />
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

        {/* Footer Summary */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-500">
          <span>Menampilkan <strong>{filteredPatients.length}</strong> dari {patients.length} total pasien</span>
          <span>Sistem Rekam Medis Klinik</span>
        </div>
      </Card>

      {/* Edit / New Patient Modal */}
      <PatientFormModal
        open={isNewPatientModalOpen}
        onOpenChange={setIsNewPatientModalOpen}
        patientToEdit={patientToEdit}
      />

      {/* Create Visit Modal */}
      <CreateVisitModal
        open={!!patientForVisit}
        onOpenChange={(open) => !open && setPatientForVisit(null)}
        patient={patientForVisit}
      />
    </div>
  );
}
