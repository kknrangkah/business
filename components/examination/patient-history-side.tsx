'use client';

import React, { useState } from 'react';
import { useRME } from '@/context/rme-context';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatShortDate, formatRupiah } from '@/lib/utils';
import { History, FileText, ChevronDown, ChevronUp, Stethoscope, Pill, Activity } from 'lucide-react';

interface PatientHistorySideProps {
  patientId: string;
  currentVisitId: string;
}

export function PatientHistorySide({ patientId, currentVisitId }: PatientHistorySideProps) {
  const { getVisitsByPatientId } = useRME();
  const [isExpanded, setIsExpanded] = useState(true);

  const previousVisits = getVisitsByPatientId(patientId)
    .filter((v) => v.id !== currentVisitId && v.medicalRecord)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card className="p-4 border border-slate-200 bg-white shadow-2xs space-y-3.5 rounded-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 tracking-tight">
          <History className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700" />
          <span>Riwayat Rekam Medis Kunjungan Lalu</span>
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-semibold bg-slate-100 text-slate-700">
            {previousVisits.length} Kunjungan
          </Badge>
          {previousVisits.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              title={isExpanded ? 'Sembunyikan Riwayat' : 'Tampilkan Riwayat'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {!isExpanded ? (
        <div className="text-center py-1.5">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Tampilkan {previousVisits.length} riwayat kunjungan lampau
          </button>
        </div>
      ) : previousVisits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 flex items-center justify-center gap-2 text-xs sm:text-[13px] text-slate-500">
          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
          <span><strong>Pasien Baru:</strong> Kunjungan pertama (belum ada rekam medis sebelumnya).</span>
        </div>
      ) : (
        <div className="space-y-3">
          {previousVisits.map((visit) => {
            const mr = visit.medicalRecord!;
            return (
              <div
                key={visit.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 shadow-2xs hover:border-emerald-200 transition-all text-xs space-y-2.5"
              >
                {/* Date & Doctor */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 text-xs">
                      {formatShortDate(visit.date)}
                    </span>
                    <span className="text-xs sm:text-[13px] text-slate-700 font-medium">
                      Keluhan: <strong className="text-slate-900">{mr.chiefComplaint || visit.chiefComplaintSummary || '-'}</strong>
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{visit.doctorName}</span>
                </div>

                {/* Vital Sign Quick Recap */}
                {mr.vitalSigns && (
                  <div className="text-xs text-slate-700 font-mono flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80 flex-wrap">
                    <span className="font-bold text-slate-800 font-sans">TD:</span>
                    <span>{mr.vitalSigns.systolic}/{mr.vitalSigns.diastolic} mmHg</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-slate-800 font-sans">HR:</span>
                    <span>{mr.vitalSigns.heartRate} x/m</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-slate-800 font-sans">Suhu:</span>
                    <span>{mr.vitalSigns.temperature}°C</span>
                  </div>
                )}

                {/* Diagnosis Recap */}
                {mr.diagnoses && mr.diagnoses.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase">Diagnosis:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {mr.diagnoses.map((d) => (
                        <Badge
                          key={d.code}
                          variant="info"
                          className="text-xs py-0.5 px-2 bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold"
                        >
                          <span className="font-mono font-bold mr-1">{d.code}</span> - {d.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prescriptions Recap */}
                {mr.prescriptions && mr.prescriptions.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase">Terapi Obat Lalu:</div>
                    <div className="text-xs sm:text-[13px] text-slate-700 space-y-1 bg-white p-2.5 rounded-xl border border-slate-200/80">
                      {mr.prescriptions.map((rx, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {rx.type === 'RACIKAN' ? `🧪 [Racikan] ${rx.name}` : `• ${rx.name}`}
                              {rx.signa ? ` (${rx.signa})` : ''}
                            </span>
                            <span className="text-xs text-emerald-800 font-bold">{rx.quantity} {rx.unit}</span>
                          </div>
                          {rx.type === 'RACIKAN' && rx.ingredients && rx.ingredients.length > 0 && (
                            <div className="pl-3 text-xs text-slate-500 italic">
                              Bahan: {rx.ingredients.map(ing => `${ing.name} ${ing.quantity} ${ing.unit}`).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
