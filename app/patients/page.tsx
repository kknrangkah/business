'use client';

import React, { useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { PatientTable } from '@/components/patients/patient-table';
import { Users, HeartPulse, RefreshCw } from 'lucide-react';
import { useRME } from '@/context/rme-context';

export default function PatientsPage() {
  const { patients, refreshPatients, isSyncingBackend } = useRME();

  // Selalu muat data pasien terbaru dari backend saat halaman /patients dibuka
  useEffect(() => {
    refreshPatients();
  }, [refreshPatients]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-emerald-700" />
              <span>Data Pasien & Rekam Medis</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelola data identitas pasien, riwayat alergi, dan akses rekam medis terdahulu.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshPatients()}
              disabled={isSyncingBackend}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-800 bg-white hover:bg-emerald-50 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Segarkan data dari server"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-700 ${isSyncingBackend ? 'animate-spin' : ''}`} />
              <span>{isSyncingBackend ? 'Memuat...' : 'Segarkan'}</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-bold bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <HeartPulse className="h-4 w-4 text-emerald-700" />
              <span>Total: <strong className="text-emerald-800">{patients.length} Pasien Terdaftar</strong></span>
            </div>
          </div>
        </div>

        {/* Patient Table Component */}
        <PatientTable />
      </div>
    </MainLayout>
  );
}
