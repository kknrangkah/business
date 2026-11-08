'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRME } from '@/context/rme-context';
import { DashboardStatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatIndonesianDate, calculateAge } from '@/lib/utils';
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
  Activity,
  Pill,
  HeartPulse,
  AlertTriangle,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function DoctorDashboard() {
  const router = useRouter();
  const { config, patients, visits, diagnoses } = useRME();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter((v) => v.date === todayStr);

  const waitingForDoctor = todayVisits.filter(
    (v) => v.status === 'WAITING' || v.status === 'REGISTERED'
  );

  const inProgressVisit = todayVisits.find((v) => v.status === 'IN_PROGRESS');

  const completedVisits = todayVisits.filter(
    (v) => v.status === 'COMPLETED' || v.status === 'WAITING_PAYMENT' || v.status === 'PAID'
  );

  const totalPrescriptions = completedVisits.filter(
    (v) => v.medicalRecord?.prescriptions && v.medicalRecord.prescriptions.length > 0
  ).length;

  // Next patient to examine
  const nextPatientVisit = inProgressVisit || waitingForDoctor[0];
  const nextPatient = nextPatientVisit ? patients.find((p) => p.id === nextPatientVisit.patientId) : null;

  // Top ICD-10 Diagnoses calculated dynamically from real visits
  const diagnosisCounts: Record<string, { code: string; name: string; count: number }> = {};
  visits.forEach((v) => {
    v.medicalRecord?.diagnoses?.forEach((d) => {
      if (!diagnosisCounts[d.code]) {
        diagnosisCounts[d.code] = { code: d.code, name: d.name, count: 0 };
      }
      diagnosisCounts[d.code].count += 1;
    });
  });
  const topDiagnoses = Object.values(diagnosisCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome & Active Doctor Practice Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-6 text-white shadow-md border border-emerald-600/30">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs">
              Role: Dokter Pemeriksa Klinis
            </span>
            <span className="text-emerald-200 text-xs font-medium">
              {formatIndonesianDate(todayStr, true)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Ruang Praktik Dokter & Rekam Medis Elektronik
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            Selamat bertugas, <span className="font-bold text-white">{config.doctorName || 'Dokter'}</span>. Kelola asesmen klinis SOAP, penegakan diagnosis ICD-10/ICD-9, tindakan medis, dan penerbitan e-resep pasien.
          </p>
          {config.sip && (
            <div className="text-[11px] text-emerald-300 font-mono flex items-center gap-1.5 pt-0.5">
              <span>{config.sip}</span>
              <span>•</span>
              <span>SatuSehat Ready</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-center">
          {nextPatientVisit ? (
            <Link href={`/examination/${nextPatientVisit.id}`}>
              <Button className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs shadow-md h-10 px-4 gap-2 rounded-xl cursor-pointer">
                <Stethoscope className="h-4 w-4 text-emerald-700" />
                <span>
                  {inProgressVisit ? 'Lanjutkan Periksa:' : 'Mulai Periksa:'} Antrian {nextPatientVisit.queueNumber}
                </span>
              </Button>
            </Link>
          ) : (
            <Link href="/queue">
              <Button className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs shadow-md h-10 px-4 gap-2 rounded-xl cursor-pointer">
                <Clock className="h-4 w-4 text-emerald-700" />
                <span>Lihat Antrian Poli</span>
              </Button>
            </Link>
          )}

          <Link href="/medical-record">
            <Button
              variant="outline"
              className="bg-emerald-900/40 border-emerald-400/40 text-white hover:bg-emerald-900/60 font-bold text-xs h-10 px-3.5 gap-1.5 rounded-xl cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Arsip Rekam Medis</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards Tailored for Doctor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Menunggu di Ruang Poli"
          value={waitingForDoctor.length}
          subtitle="Pasien siap masuk periksa"
          icon={Clock}
          colorTheme="amber"
        />
        <DashboardStatCard
          title="Sedang Konsultasi"
          value={inProgressVisit ? 1 : 0}
          subtitle={inProgressVisit ? `Pasien: ${nextPatient?.name || 'Aktif'}` : 'Tidak ada konsultasi aktif'}
          icon={Stethoscope}
          colorTheme="teal"
        />
        <DashboardStatCard
          title="Pemeriksaan Selesai"
          value={completedVisits.length}
          subtitle="Resume medis & SOAP lengkap"
          icon={CheckCircle2}
          colorTheme="emerald"
        />
        <DashboardStatCard
          title="E-Resep Diterbitkan"
          value={totalPrescriptions}
          subtitle="Terkirim ke depo farmasi"
          icon={Pill}
          colorTheme="purple"
        />
      </div>

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Antrian Pasien Poli Siap Periksa */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-4.5 w-4.5 text-emerald-700" />
                  <span>Daftar Antrian Pemeriksaan Poli Hari Ini</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Pasien yang telah melalui pendaftaran loket & triase awal perawat.
                </p>
              </div>

              <Badge variant="outline" className="text-xs font-bold border-emerald-200 text-emerald-800 bg-emerald-50">
                {waitingForDoctor.length} Menunggu
              </Badge>
            </div>

            {waitingForDoctor.length === 0 && !inProgressVisit ? (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                <CheckCircle2 className="h-9 w-9 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-slate-800">Semua Pasien Poli Telah Selesai Diperiksa</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tidak ada antrian pasien menunggu di ruang praktik saat ini. Pasien baru yang terdaftar di loket akan otomatis muncul di sini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Active in progress item first */}
                {inProgressVisit && (
                  <div className="py-3.5 px-3 mb-2 rounded-xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-teal-700 text-white flex flex-col items-center justify-center shrink-0 font-mono font-black text-sm shadow-xs">
                        <span className="text-[9px] uppercase font-bold text-teal-200 leading-none">Aktif</span>
                        <span>{inProgressVisit.queueNumber}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900 truncate">
                            {nextPatient?.name || 'Pasien'}
                          </span>
                          <Badge className="bg-teal-700 text-white text-[10px] font-bold">
                            Sedang Berlangsung
                          </Badge>
                        </div>
                        <div className="text-xs text-teal-800 font-medium mt-0.5">
                          Keluhan: "{inProgressVisit.chiefComplaintSummary || inProgressVisit.medicalRecord?.chiefComplaint || 'Konsultasi rutin'}"
                        </div>
                      </div>
                    </div>

                    <Link href={`/examination/${inProgressVisit.id}`}>
                      <Button size="sm" className="h-8.5 px-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs">
                        <span>Lanjutkan SOAP</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Waiting Patients List */}
                {waitingForDoctor.map((v) => {
                  const pat = patients.find((p) => p.id === v.patientId);
                  const vitals = v.medicalRecord?.vitalSigns;

                  return (
                    <div
                      key={v.id}
                      className="py-3 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex flex-col items-center justify-center shrink-0 font-mono font-black text-sm">
                          <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">Antrian</span>
                          <span>{v.queueNumber}</span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {pat?.name || 'Pasien'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                              {pat?.noRM || '-'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {pat?.gender === 'L' ? 'L' : 'P'} • {pat?.birthDate ? `${calculateAge(pat.birthDate)} thn` : '-'}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 mt-0.5">
                            <span className="font-semibold text-emerald-800">
                              Keluhan: {v.chiefComplaintSummary || v.medicalRecord?.chiefComplaint || 'Pemeriksaan umum'}
                            </span>
                            {vitals?.systolic && vitals?.diastolic && (
                              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 rounded">
                                TD: {vitals.systolic}/{vitals.diastolic} mmHg
                              </span>
                            )}
                            {vitals?.temperature && (
                              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 rounded">
                                S: {vitals.temperature}°C
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Link href={`/examination/${v.id}`}>
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-2xs"
                          >
                            <Stethoscope className="h-3.5 w-3.5 mr-1" />
                            <span>Mulai Periksa</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Riwayat Pasien Selesai Diperiksa Hari Ini */}
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Pemeriksaan Selesai Hari Ini ({completedVisits.length})
              </h3>
              <Link href="/medical-record" className="text-xs font-bold text-emerald-700 hover:underline">
                Buka Arsip Rekam Medis
              </Link>
            </div>

            {completedVisits.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Belum ada pasien yang selesai diperiksa hari ini.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {completedVisits.slice(0, 4).map((v) => {
                  const pat = patients.find((p) => p.id === v.patientId);
                  const diag = v.medicalRecord?.diagnoses?.[0];
                  return (
                    <div key={v.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">{pat?.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{pat?.noRM}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          Diagnosa: <span className="font-semibold text-slate-700">{diag ? `${diag.code} - ${diag.name}` : 'Pemeriksaan Klinis'}</span>
                        </div>
                      </div>

                      <Link href={`/examination/${v.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 text-[11px] text-emerald-700 hover:bg-emerald-50">
                          Review SOAP
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Top ICD-10 & Clinical References */}
        <div className="space-y-4">
          {/* Top 5 ICD-10 Diagnosa */}
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Top Diagnosa ICD-10</h3>
                  <p className="text-[10px] text-slate-500">Tren kasus terbanyak di faskes</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Link href="/settings/icd10">
                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer">
                    Master ICD-10
                  </Button>
                </Link>
                <span className="text-slate-300">•</span>
                <Link href="/settings/icd9">
                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] font-bold text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg cursor-pointer">
                    Master ICD-9
                  </Button>
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              {topDiagnoses.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Belum ada riwayat diagnosa tercatat
                </div>
              ) : (
                topDiagnoses.map((diag, idx) => (
                  <div key={diag.code} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-700 text-[11px]">{diag.code}</span>
                        <span className="text-[11px] font-semibold text-slate-800 truncate">{diag.name}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold shrink-0 bg-white">
                      {diag.count} Kasus
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Clinical Shortcuts */}
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pintasan Klinis Cepat
            </h3>

            <div className="grid grid-cols-1 gap-2">
              <Link href="/medications">
                <Button
                  variant="outline"
                  className="w-full h-10 justify-start text-xs font-bold text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl"
                >
                  <Pill className="h-4 w-4 mr-2 text-purple-700" />
                  <span>Formularium Obat & Signa Standar</span>
                </Button>
              </Link>

              <Link href="/settings/procedures">
                <Button
                  variant="outline"
                  className="w-full h-10 justify-start text-xs font-bold text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl"
                >
                  <HeartPulse className="h-4 w-4 mr-2 text-rose-600" />
                  <span>Master Tindakan Medis & Tarif</span>
                </Button>
              </Link>

              <Link href="/reports/honorarium">
                <Button
                  variant="outline"
                  className="w-full h-10 justify-start text-xs font-bold text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-700" />
                  <span>Laporan Jasa Medis & Honorarium</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
