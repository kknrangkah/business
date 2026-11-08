'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRME } from '@/context/rme-context';
import { DashboardStatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatIndonesianDate, calculateAge } from '@/lib/utils';
import {
  HeartPulse,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ArrowRight,
  Thermometer,
  Volume2,
  Stethoscope,
  Weight,
  Ruler,
} from 'lucide-react';
import { toast } from 'sonner';

export function NurseDashboard() {
  const { config, patients, visits, saveMedicalRecord, currentUser } = useRME();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter((v) => v.date === todayStr);

  // Visits waiting for vitals
  const waitingVitalsVisits = todayVisits.filter(
    (v) => (v.status === 'WAITING' || v.status === 'REGISTERED') && !v.medicalRecord?.vitalSigns?.systolic
  );

  // Visits with vitals ready for doctor
  const readyForDoctorVisits = todayVisits.filter(
    (v) => (v.status === 'WAITING' || v.status === 'REGISTERED') && !!v.medicalRecord?.vitalSigns?.systolic
  );

  // Abnormal vitals alerts (e.g. BP >= 140/90 or Temp >= 38)
  const abnormalVisits = todayVisits.filter((v) => {
    const vitals = v.medicalRecord?.vitalSigns;
    if (!vitals) return false;
    const temp = vitals.temperature || 36.5;
    const systolic = vitals.systolic || 0;
    return temp >= 38 || systolic >= 140;
  });

  // Modal State for recording vitals
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);

  const selectedVisit = todayVisits.find((v) => v.id === selectedVisitId);
  const selectedPatient = selectedVisit ? patients.find((p) => p.id === selectedVisit.patientId) : null;

  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [temp, setTemp] = useState('');
  const [rr, setRr] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [spo2, setSpo2] = useState('');
  const [triageNote, setTriageNote] = useState('');

  const handleOpenVitalsModal = (visitId: string) => {
    const v = todayVisits.find((visit) => visit.id === visitId);
    if (!v) return;
    setSelectedVisitId(visitId);

    const existingVitals = v.medicalRecord?.vitalSigns;
    if (existingVitals && existingVitals.systolic) {
      setBp(
        existingVitals.systolic && existingVitals.diastolic
          ? `${existingVitals.systolic}/${existingVitals.diastolic}`
          : ''
      );
      setHr(existingVitals.heartRate ? String(existingVitals.heartRate) : '');
      setTemp(existingVitals.temperature ? String(existingVitals.temperature) : '');
      setRr(existingVitals.respiratoryRate ? String(existingVitals.respiratoryRate) : '');
      setWeight(existingVitals.weight ? String(existingVitals.weight) : '');
      setHeight(existingVitals.height ? String(existingVitals.height) : '');
      setSpo2(existingVitals.oxygenSaturation ? String(existingVitals.oxygenSaturation) : '');
    } else {
      setBp('');
      setHr('');
      setTemp('');
      setRr('');
      setWeight('');
      setHeight('');
      setSpo2('');
    }
    setTriageNote(v.chiefComplaintSummary || v.medicalRecord?.chiefComplaint || '');
    setIsVitalsModalOpen(true);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitId || !selectedVisit) return;

    const existingRecord = selectedVisit.medicalRecord || {
      vitalSigns: {},
      chiefComplaint: '',
      anamnesis: '',
      physicalExamination: '',
      diagnoses: [],
      procedures: [],
      prescriptions: [],
    };

    const [sys, dia] = bp.split('/');

    saveMedicalRecord(
      selectedVisitId,
      {
        vitalSigns: {
          systolic: Number(sys) || 120,
          diastolic: Number(dia) || 80,
          heartRate: Number(hr) || 75,
          respiratoryRate: Number(rr) || 18,
          temperature: Number(temp) || 36.5,
          weight: Number(weight) || 60,
          height: Number(height) || 165,
          oxygenSaturation: Number(spo2) || 98,
        },
        chiefComplaint: triageNote || selectedVisit.chiefComplaintSummary || selectedVisit.medicalRecord?.chiefComplaint || '',
        anamnesis: existingRecord.anamnesis,
        physicalExamination: existingRecord.physicalExamination,
        diagnoses: existingRecord.diagnoses,
        procedures: existingRecord.procedures,
        prescriptions: existingRecord.prescriptions,
      },
      false
    );

    toast.success(`Tanda vital ${selectedPatient?.name || 'Pasien'} berhasil disimpan!`, {
      description: 'Data telah diteruskan ke layar pemeriksaan dokter.',
    });
    setIsVitalsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Stasiun Perawat & Triase */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 p-6 text-white shadow-md border border-teal-600/30">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs">
              Role: Perawat Penanggung Jawab Triase
            </span>
            <span className="text-teal-100 text-xs font-medium">
              {formatIndonesianDate(todayStr, true)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Stasiun Perawat & Triase Tanda-Tanda Vital
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/90 max-w-2xl leading-relaxed">
            Selamat bertugas, <span className="font-bold text-white">{currentUser?.name || 'Ns. Nurul Hidayah, S.Kep'}</span>. Lakukan skrining awal pasien, pengukuran tanda vital (tensi, nadi, suhu, TB/BB, SpO2), dan koordinasi kesiapan pasien sebelum masuk ke ruang dokter.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-center">
          <Link href="/queue">
            <Button className="bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs shadow-xs h-9.5 gap-1.5 rounded-xl cursor-pointer">
              <Clock className="h-4 w-4 text-teal-700" />
              <span>Lihat Antrian Faskes</span>
            </Button>
          </Link>
          <Link href="/settings/procedures">
            <Button
              variant="outline"
              className="bg-teal-900/40 border-teal-400/40 text-white hover:bg-teal-900/60 font-bold text-xs h-9.5 gap-1.5 rounded-xl cursor-pointer"
            >
              <Activity className="h-4 w-4" />
              <span>Daftar Tindakan Medis</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Menunggu Triase / Input TTV"
          value={waitingVitalsVisits.length}
          subtitle="Pasien baru masuk dari loket"
          icon={Clock}
          colorTheme="amber"
        />
        <DashboardStatCard
          title="Siap Masuk ke Dokter"
          value={readyForDoctorVisits.length}
          subtitle="Tanda vital lengkap tercatat"
          icon={CheckCircle2}
          colorTheme="emerald"
        />
        <DashboardStatCard
          title="TTV Perhatian Khusus"
          value={abnormalVisits.length}
          subtitle="Suhu tinggi atau tensi hipertensi"
          icon={AlertTriangle}
          colorTheme="teal"
        />
        <DashboardStatCard
          title="Total Rawat Jalan Hari Ini"
          value={todayVisits.length}
          subtitle="Pasien aktif terdaftar"
          icon={Users}
          colorTheme="blue"
        />
      </div>

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Antrian Menunggu Triase */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="h-4.5 w-4.5 text-teal-700" />
                  <span>Antrian Pasien Menunggu Triase & Tanda Vital</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Lakukan pengukuran tanda-tanda vital sebelum pasien diarahkan ke poli dokter.
                </p>
              </div>

              <Badge variant="outline" className="text-xs font-bold border-teal-200 text-teal-800 bg-teal-50">
                {waitingVitalsVisits.length} Menunggu
              </Badge>
            </div>

            {waitingVitalsVisits.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Semua Pasien Telah Selesai Triase</p>
                <p className="text-[11px] text-slate-500">
                  Tidak ada pasien baru yang menunggu pengukuran tanda vital saat ini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {waitingVitalsVisits.map((v) => {
                  const pat = patients.find((p) => p.id === v.patientId);
                  return (
                    <div
                      key={v.id}
                      className="py-3 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex flex-col items-center justify-center shrink-0 font-mono font-black text-sm">
                          <span className="text-[9px] uppercase font-bold text-teal-600 leading-none">Antrian</span>
                          <span>{v.queueNumber}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {pat?.name || 'Pasien'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                              {pat?.noRM || '-'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {pat?.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • {pat?.birthDate ? `${calculateAge(pat.birthDate)} thn` : '-'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            Keluhan: <span className="font-semibold text-slate-800">"{v.chiefComplaintSummary || v.medicalRecord?.chiefComplaint || 'Tidak ada catatan'}"</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleOpenVitalsModal(v.id)}
                          className="h-8.5 px-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
                        >
                          <Activity className="h-3.5 w-3.5 mr-1" />
                          <span>Input TTV</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Pasien Siap Masuk ke Dokter (TTV Lengkap) */}
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Pasien Siap Masuk ke Poli Dokter ({readyForDoctorVisits.length})
            </h3>

            {readyForDoctorVisits.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Belum ada pasien yang siap.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {readyForDoctorVisits.slice(0, 4).map((v) => {
                  const pat = patients.find((p) => p.id === v.patientId);
                  const vit = v.medicalRecord?.vitalSigns;
                  return (
                    <div key={v.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-800">Antrian {v.queueNumber}</span>
                          <span className="font-bold text-slate-900 truncate">{pat?.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>TD: {vit?.systolic && vit?.diastolic ? `${vit.systolic}/${vit.diastolic}` : '-'}</span>
                          <span>•</span>
                          <span>Nadi: {vit?.heartRate || '-'} x/m</span>
                          <span>•</span>
                          <span>Suhu: {vit?.temperature || '-'}°C</span>
                          <span>•</span>
                          <span>SpO2: {vit?.oxygenSaturation || '-'}%</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenVitalsModal(v.id)}
                        className="h-7 text-[11px] font-bold text-teal-700 border-teal-200 hover:bg-teal-50"
                      >
                        Edit TTV
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Abnormal Vitals Alert & Clinical Guidance */}
        <div className="space-y-4">
          {/* Abnormal Vitals Warning Box */}
          <Card className="p-5 border border-amber-200 bg-amber-50/50 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Perhatian TTV Abnormal</h3>
                <p className="text-[10px] text-slate-500">Pasien dengan tanda klinis berisiko</p>
              </div>
            </div>

            {abnormalVisits.length === 0 ? (
              <div className="p-3 rounded-xl bg-white border border-amber-100 text-center text-xs text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                <span>Semua parameter TTV pasien dalam batas normal.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {abnormalVisits.map((v) => {
                  const pat = patients.find((p) => p.id === v.patientId);
                  const vit = v.medicalRecord?.vitalSigns;
                  return (
                    <div key={v.id} className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate">{pat?.name}</span>
                        <span className="font-mono text-[10px] text-amber-800 font-bold">Antrian {v.queueNumber}</span>
                      </div>
                      <div className="text-[11px] text-amber-900 font-semibold mt-1">
                        Alert: TD {vit?.systolic}/{vit?.diastolic} • Suhu {vit?.temperature}°C
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* SOP Pengukuran TTV */}
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Standar Normal TTV Dewasa
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                <span className="text-slate-600">Tekanan Darah:</span>
                <span className="font-mono font-bold text-slate-900">120/80 mmHg</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                <span className="text-slate-600">Frekuensi Nadi:</span>
                <span className="font-mono font-bold text-slate-900">60 - 100 x/menit</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                <span className="text-slate-600">Suhu Tubuh:</span>
                <span className="font-mono font-bold text-slate-900">36.5 - 37.5 °C</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                <span className="text-slate-600">Saturasi O2 (SpO2):</span>
                <span className="font-mono font-bold text-slate-900">95 - 100 %</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Input TTV */}
      <Dialog open={isVitalsModalOpen} onOpenChange={setIsVitalsModalOpen}>
        <div className="p-6 max-w-lg w-full bg-white rounded-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-teal-700" />
              <span>Input Tanda-Tanda Vital Pasien</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pasien: <span className="font-bold text-slate-800">{selectedPatient?.name}</span> (No. RM: {selectedPatient?.noRM}) • Antrian {selectedVisit?.queueNumber}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveVitals} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Tekanan Darah (mmHg)</label>
                <Input
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  placeholder="120/80"
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Nadi (x/menit)</label>
                <Input
                  type="number"
                  value={hr}
                  onChange={(e) => setHr(e.target.value)}
                  placeholder="80"
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Suhu Tubuh (°C)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  placeholder="36.5"
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Laju Nafas (RR x/m)</label>
                <Input
                  type="number"
                  value={rr}
                  onChange={(e) => setRr(e.target.value)}
                  placeholder="18"
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Berat Badan (kg)</label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="65"
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Tinggi Badan (cm)</label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="168"
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Saturasi Oksigen SpO2 (%)</label>
              <Input
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                placeholder="98"
                className="h-9 text-xs mt-1"
                required
              />
            </div>

            <DialogFooter className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVitalsModalOpen(false)}
                className="text-xs h-9"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="text-xs h-9 bg-teal-700 hover:bg-teal-800 text-white font-bold"
              >
                Simpan & Teruskan ke Dokter
              </Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>
    </div>
  );
}
