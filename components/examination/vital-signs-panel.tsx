'use client';

import React from 'react';
import { VitalSigns, Patient } from '@/types/rme';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calculateBMI } from '@/lib/utils';
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Scale,
  Ruler,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface VitalSignsPanelProps {
  patient: Patient;
  vitalSigns: VitalSigns;
  onChange: (vitalSigns: VitalSigns) => void;
  showPatientDemographic?: boolean;
  disabled?: boolean;
}

export function VitalSignsPanel({
  patient,
  vitalSigns,
  onChange,
  showPatientDemographic = false,
  disabled = false,
}: VitalSignsPanelProps) {
  const bmiData = calculateBMI(vitalSigns.weight, vitalSigns.height);

  const handleFieldChange = (field: keyof VitalSigns, value: number) => {
    if (disabled) return;
    const updated = { ...vitalSigns, [field]: value };
    const updatedBMI = calculateBMI(
      field === 'weight' ? value : vitalSigns.weight,
      field === 'height' ? value : vitalSigns.height
    );
    updated.bmi = updatedBMI.bmi;
    updated.bmiCategory = updatedBMI.category;
    onChange(updated);
  };

  const handleSetNormalValues = () => {
    if (disabled) return;
    const normal: VitalSigns = {
      systolic: 120,
      diastolic: 80,
      heartRate: 80,
      temperature: 36.6,
      respiratoryRate: 18,
      weight: vitalSigns.weight || 65,
      height: vitalSigns.height || 168,
      oxygenSaturation: 99,
    };
    const b = calculateBMI(normal.weight, normal.height);
    normal.bmi = b.bmi;
    normal.bmiCategory = b.category;
    onChange(normal);
  };

  const hasAllergies = patient.allergies && patient.allergies.length > 0;

  return (
    <Card className="p-4 border border-slate-200 bg-white shadow-2xs space-y-3.5 rounded-2xl">
      {/* Optional Standalone Demographic Card */}
      {showPatientDemographic && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-black text-sm">
              {patient.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold text-slate-900">{patient.name}</h2>
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-mono font-bold">
                <span>{patient.noRM}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-sans">{patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-sans">{patient.birthDate} ({patient.age || '-'} thn)</span>
              </div>
            </div>
          </div>

          {/* Quick Allergy Warning */}
          {hasAllergies && (
            <div className="mt-2.5 flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              <span>Alergi: {patient.allergies!.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 tracking-tight">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700" />
          <span>Tanda Vital &amp; Kondisi Fisik Dasar</span>
        </h3>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSetNormalValues}
            disabled={disabled}
            className="h-7 px-2.5 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-900 border-emerald-200 gap-1 rounded-lg font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            title="Isi otomatis nilai normal standar"
          >
            <Zap className="h-3.5 w-3.5 text-emerald-600" />
            <span>Set Normal</span>
          </Button>
        )}
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Tekanan Darah (TD) */}
        <div className="space-y-1.5 sm:col-span-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <label className="text-xs sm:text-[13px] font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-700" />
              Tekanan Darah (TD)
            </span>
            <span className="text-xs text-slate-500 font-medium">mmHg</span>
          </label>
          <div className="flex items-center gap-2 pt-0.5">
            <Input
              type="number"
              disabled={disabled}
              value={vitalSigns.systolic || ''}
              onChange={(e) => handleFieldChange('systolic', Number(e.target.value))}
              placeholder="120"
              className="h-8 sm:h-9 text-center text-sm font-semibold tabular-nums text-slate-800 bg-white rounded-lg shadow-2xs disabled:bg-slate-100 disabled:text-slate-600"
            />
            <span className="text-slate-400 font-bold text-base">/</span>
            <Input
              type="number"
              disabled={disabled}
              value={vitalSigns.diastolic || ''}
              onChange={(e) => handleFieldChange('diastolic', Number(e.target.value))}
              placeholder="80"
              className="h-8 sm:h-9 text-center text-sm font-semibold tabular-nums text-slate-800 bg-white rounded-lg shadow-2xs disabled:bg-slate-100 disabled:text-slate-600"
            />
          </div>
        </div>

        {/* Nadi (HR) */}
        <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <label className="text-xs sm:text-[13px] font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
              Nadi (HR)
            </span>
          </label>
          <div className="relative pt-0.5">
            <Input
              type="number"
              disabled={disabled}
              value={vitalSigns.heartRate || ''}
              onChange={(e) => handleFieldChange('heartRate', Number(e.target.value))}
              placeholder="80"
              className="h-8 sm:h-9 text-sm font-semibold tabular-nums text-slate-800 bg-white pr-9 rounded-lg shadow-2xs disabled:bg-slate-100 disabled:text-slate-600"
            />
            <span className="absolute right-2.5 top-2.5 text-xs text-slate-500 font-medium">x/m</span>
          </div>
        </div>

        {/* Laju Napas (RR) */}
        <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <label className="text-xs sm:text-[13px] font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Wind className="h-3.5 w-3.5 text-sky-500" />
              Napas (RR)
            </span>
          </label>
          <div className="relative pt-0.5">
            <Input
              type="number"
              disabled={disabled}
              value={vitalSigns.respiratoryRate || ''}
              onChange={(e) => handleFieldChange('respiratoryRate', Number(e.target.value))}
              placeholder="18"
              className="h-8 sm:h-9 text-sm font-semibold tabular-nums text-slate-800 bg-white pr-9 rounded-lg shadow-2xs disabled:bg-slate-100 disabled:text-slate-600"
            />
            <span className="absolute right-2.5 top-2.5 text-xs text-slate-500 font-medium">x/m</span>
          </div>
        </div>

        {/* Suhu Tubuh */}
        <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <label className="text-xs sm:text-[13px] font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Thermometer className="h-3.5 w-3.5 text-amber-500" />
              Suhu Tubuh
            </span>
          </label>
          <div className="relative pt-0.5">
            <Input
              type="number"
              step="0.1"
              disabled={disabled}
              value={vitalSigns.temperature || ''}
              onChange={(e) => handleFieldChange('temperature', Number(e.target.value))}
              placeholder="36.5"
              className="h-8 sm:h-9 text-sm font-semibold tabular-nums text-slate-800 bg-white pr-8 rounded-lg shadow-2xs disabled:bg-slate-100 disabled:text-slate-600"
            />
            <span className="absolute right-2.5 top-2.5 text-xs text-slate-500 font-medium">°C</span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <label className="text-xs sm:text-[13px] font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-teal-600" />
              SpO2
            </span>
          </label>
          <div className="relative pt-0.5">
            <Input
              type="number"
              disabled={disabled}
              value={vitalSigns.oxygenSaturation || ''}
              onChange={(e) => handleFieldChange('oxygenSaturation', Number(e.target.value))}
              placeholder="98"
              className="h-8 sm:h-9 text-sm font-semibold tabular-nums text-slate-800 bg-white pr-7 rounded-lg shadow-2xs disabled:bg-slate-100 disabled:text-slate-600"
            />
            <span className="absolute right-2.5 top-2.5 text-xs text-slate-500 font-medium">%</span>
          </div>
        </div>

        {/* Berat Badan */}
        <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <label className="text-xs sm:text-[13px] font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-indigo-500" />
              Berat Badan
            </span>
          </label>
          <div className="relative pt-0.5">
            <Input
              type="number"
              disabled={disabled}
              value={vitalSigns.weight || ''}
              onChange={(e) => handleFieldChange('weight', Number(e.target.value))}
              placeholder="65"
              className="h-8 sm:h-9 text-sm font-semibold tabular-nums text-slate-800 bg-white pr-8 rounded-lg shadow-2xs disabled:bg-slate-100 disabled:text-slate-600"
            />
            <span className="absolute right-2.5 top-2.5 text-xs text-slate-500 font-medium">kg</span>
          </div>
        </div>

        {/* Tinggi Badan */}
        <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <label className="text-xs sm:text-[13px] font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5 text-indigo-500" />
              Tinggi Badan
            </span>
          </label>
          <div className="relative pt-0.5">
            <Input
              type="number"
              disabled={disabled}
              value={vitalSigns.height || ''}
              onChange={(e) => handleFieldChange('height', Number(e.target.value))}
              placeholder="168"
              className="h-8 sm:h-9 text-sm font-semibold tabular-nums text-slate-800 bg-white pr-8 rounded-lg shadow-2xs disabled:bg-slate-100 disabled:text-slate-600"
            />
            <span className="absolute right-2.5 top-2.5 text-xs text-slate-500 font-medium">cm</span>
          </div>
        </div>
      </div>

      {/* BMI Calculation Bar */}
      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium text-xs sm:text-[13px]">Indeks Massa Tubuh (IMT / BMI):</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{bmiData.bmi}</span>
        </div>
        <Badge
          variant={
            bmiData.category === 'Normal'
              ? 'success'
              : bmiData.category.includes('Overweight')
              ? 'warning'
              : 'destructive'
          }
          className="text-xs py-0.5 px-2.5 font-semibold"
        >
          {bmiData.category}
        </Badge>
      </div>
    </Card>
  );
}
