'use client';

import React, { useState } from 'react';
import { PrescriptionItem, Patient, MedicationMaster, RacikanIngredient, RacikanType } from '@/types/rme';
import { useRME } from '@/context/rme-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/utils';
import {
  Search,
  Plus,
  X,
  Pill,
  FlaskConical,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface PrescriptionFormProps {
  patient: Patient;
  prescriptions: PrescriptionItem[];
  onChange: (prescriptions: PrescriptionItem[]) => void;
  disabled?: boolean;
}

const COMMON_SIGNAS_NON_RACIKAN = [
  '3 x 1 tablet sesudah makan',
  '3 x 1 kapsul sesudah makan (Habiskan)',
  '2 x 1 tablet sesudah makan',
  '1 x 1 tablet pagi hari sesudah makan',
  '1 x 1 tablet malam hari sesudah makan',
  '3 x 1 tablet kunyah 1 jam sebelum makan',
  'Jika perlu / saat nyeri muncul',
];

const COMMON_SIGNAS_RACIKAN = [
  '3 x 1 bungkus puyer sesudah makan',
  '3 x 1 bungkus (bila demam/nyeri)',
  '2 x 1 bungkus puyer sesudah makan',
  '3 x 1 kapsul racik sesudah makan',
  '2 x 1 oles tipis pada area gatal/sakit',
  '3 x 1 sendok teh (5 ml) sesudah makan',
];

const RACIKAN_PRESET_NAMES = [
  { name: 'Puyer Batuk Pilek Anak', type: 'PULVERES' as RacikanType, signa: '3 x 1 bungkus puyer sesudah makan' },
  { name: 'Puyer Demam & Pereda Nyeri', type: 'PULVERES' as RacikanType, signa: '3 x 1 bungkus (bila demam)' },
  { name: 'Kapsul Radang & Batuk Dewasa', type: 'KAPSUL' as RacikanType, signa: '3 x 1 kapsul sesudah makan' },
  { name: 'Salep Racik Alergi & Gatal Kulit', type: 'SALEP' as RacikanType, signa: '2 x 1 oles tipis pada area gatal' },
];

export function PrescriptionForm({ patient, prescriptions, onChange, disabled = false }: PrescriptionFormProps) {
  const { medications } = useRME();

  // Active Tab Mode: 'NON_RACIKAN' | 'RACIKAN'
  const [activeTab, setActiveTab] = useState<'NON_RACIKAN' | 'RACIKAN'>('NON_RACIKAN');

  // --- NON-RACIKAN FORM STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMed, setSelectedMed] = useState<MedicationMaster | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('Tablet');
  const [dosage, setDosage] = useState<string>('');
  const [signa, setSigna] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // --- RACIKAN FORM STATE ---
  const [racikanName, setRacikanName] = useState<string>('');
  const [racikanType, setRacikanType] = useState<RacikanType>('PULVERES');
  const [racikanQuantity, setRacikanQuantity] = useState<string>('');
  const [racikanUnit, setRacikanUnit] = useState<string>('Bungkus / Puyer');
  const [racikanSigna, setRacikanSigna] = useState<string>('');
  const [racikanNotes, setRacikanNotes] = useState<string>('');
  const [racikanIngredients, setRacikanIngredients] = useState<RacikanIngredient[]>([]);

  // Racikan Ingredient Sub-form State
  const [ingSearchQuery, setIngSearchQuery] = useState('');
  const [showIngDropdown, setShowIngDropdown] = useState(false);
  const [selectedIngMed, setSelectedIngMed] = useState<MedicationMaster | null>(null);
  const [ingQuantity, setIngQuantity] = useState<string>('');
  const [ingUnit, setIngUnit] = useState<string>('Tablet');
  const [ingDosage, setIngDosage] = useState<string>('');

  // Search filter for Non-Racikan
  const filteredMeds = searchQuery.trim()
    ? medications.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : medications.slice(0, 8);

  // Search filter for Racikan Ingredients
  const filteredIngMeds = ingSearchQuery.trim()
    ? medications.filter(
        (m) =>
          m.name.toLowerCase().includes(ingSearchQuery.toLowerCase()) ||
          m.genericName?.toLowerCase().includes(ingSearchQuery.toLowerCase()) ||
          m.category.toLowerCase().includes(ingSearchQuery.toLowerCase())
      )
    : medications.slice(0, 8);

  // Check allergy helper
  const checkMedicationAllergy = (medName: string, genericName?: string) => {
    if (patient.allergies && patient.allergies.length > 0) {
      const isAllergic = patient.allergies.some(
        (alg) =>
          medName.toLowerCase().includes(alg.toLowerCase()) ||
          (genericName && genericName.toLowerCase().includes(alg.toLowerCase())) ||
          (alg.toLowerCase().includes('penisilin') && medName.toLowerCase().includes('amoxicillin'))
      );
      if (isAllergic) {
        toast.error(`PERINGATAN ALERGI: Pasien memiliki riwayat alergi terkait obat "${medName}"!`, {
          duration: 5000,
        });
      }
    }
  };

  // Select medication for Non-Racikan
  const handleSelectMed = (med: MedicationMaster) => {
    setSelectedMed(med);
    setDosage(med.dosage || '500 mg');
    setUnit(med.unit || 'Tablet');
    setSigna(med.standardSigna || '3 x 1 tablet sesudah makan');
    setSearchQuery(med.name);
    setShowDropdown(false);
    checkMedicationAllergy(med.name, med.genericName);
  };

  // Select medication for Racikan Ingredient
  const handleSelectIngMed = (med: MedicationMaster) => {
    setSelectedIngMed(med);
    setIngDosage(med.dosage || '500 mg');
    setIngUnit(med.unit || 'Tablet');
    setIngSearchQuery(med.name);
    setShowIngDropdown(false);
    checkMedicationAllergy(med.name, med.genericName);
  };

  // Add Non-Racikan item to prescription
  const handleAddNonRacikan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedMed && !searchQuery.trim()) {
      toast.error('Pilih atau masukkan nama obat terlebih dahulu');
      return;
    }

    const numQty = parseFloat(quantity) || 1;
    if (numQty <= 0) {
      toast.error('Jumlah obat harus lebih dari 0');
      return;
    }

    const medName = selectedMed ? selectedMed.name : searchQuery.trim();
    const medPrice = selectedMed ? selectedMed.price : 5000;
    const medId = selectedMed ? selectedMed.id : `med-custom-${Date.now()}`;

    const newRx: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      type: 'NON_RACIKAN',
      medicationId: medId,
      name: medName,
      dosage,
      quantity: numQty,
      unit,
      signa: signa.trim() || '3 x 1 tablet sesudah makan',
      price: medPrice,
      notes: notes.trim() || undefined,
    };

    onChange([...prescriptions, newRx]);

    // Reset input fields
    setSelectedMed(null);
    setSearchQuery('');
    setNotes('');
    setQuantity('10');
    toast.success(`"${medName}" (${numQty} ${unit}) berhasil ditambahkan ke resep.`);
  };

  // Add Ingredient to Current Racikan
  const handleAddIngredient = () => {
    if (!selectedIngMed && !ingSearchQuery.trim()) {
      toast.error('Pilih nama obat bahan racikan terlebih dahulu');
      return;
    }

    const numQty = parseFloat(ingQuantity) || 1;
    if (numQty <= 0) {
      toast.error('Jumlah bahan harus lebih dari 0');
      return;
    }

    const medName = selectedIngMed ? selectedIngMed.name : ingSearchQuery.trim();
    const medPrice = selectedIngMed ? selectedIngMed.price : 3000;
    const medId = selectedIngMed ? selectedIngMed.id : `med-ing-${Date.now()}`;

    const newIngredient: RacikanIngredient = {
      id: `ing-${Date.now()}-${Math.random()}`,
      medicationId: medId,
      name: medName,
      dosage: ingDosage,
      quantity: numQty,
      unit: ingUnit,
      price: medPrice,
    };

    setRacikanIngredients([...racikanIngredients, newIngredient]);
    setSelectedIngMed(null);
    setIngSearchQuery('');
    setIngQuantity('2.5');
    toast.success(`Bahan "${medName}" (${numQty} ${ingUnit}) ditambahkan ke racikan.`);
  };

  const handleRemoveIngredient = (index: number) => {
    setRacikanIngredients(racikanIngredients.filter((_, idx) => idx !== index));
  };

  // Add Completed Racikan to Prescriptions
  const handleAddRacikanToPrescription = () => {
    if (!racikanName.trim()) {
      toast.error('Nama racikan wajib diisi (e.g. Puyer Batuk Pilek Anak)');
      return;
    }

    if (racikanIngredients.length === 0) {
      toast.error('Tambahkan minimal 1 bahan obat ke dalam racikan');
      return;
    }

    const numQty = parseFloat(racikanQuantity) || 10;
    if (numQty <= 0) {
      toast.error('Jumlah sediaan racikan harus lebih dari 0');
      return;
    }

    // Calculate total price of ingredients
    const totalIngredientsPrice = racikanIngredients.reduce(
      (acc, ing) => acc + (ing.price * (Number(ing.quantity) || 1)),
      0
    );

    const newRx: PrescriptionItem = {
      id: `rx-racik-${Date.now()}`,
      type: 'RACIKAN',
      name: racikanName.trim(),
      dosage: racikanType,
      quantity: numQty,
      unit: racikanUnit,
      signa: racikanSigna.trim() || '3 x 1 bungkus sesudah makan',
      price: Math.round(totalIngredientsPrice),
      notes: racikanNotes.trim() || undefined,
      racikanType,
      ingredients: racikanIngredients,
      tuslahFee: 0,
    };

    onChange([...prescriptions, newRx]);

    // Reset racikan form
    setRacikanIngredients([]);
    setRacikanName('Puyer Batuk Pilek Anak');
    setRacikanQuantity('10');
    setRacikanNotes('');
    toast.success(`Resep Racikan "${racikanName}" (${numQty} ${racikanUnit}) berhasil ditambahkan.`);
  };

  const handleRemovePrescription = (index: number) => {
    const updated = [...prescriptions];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleSelectPresetRacikan = (preset: typeof RACIKAN_PRESET_NAMES[0]) => {
    setRacikanName(preset.name);
    setRacikanType(preset.type);
    setRacikanSigna(preset.signa);
    if (preset.type === 'PULVERES') setRacikanUnit('Bungkus / Puyer');
    else if (preset.type === 'KAPSUL') setRacikanUnit('Kapsul');
    else if (preset.type === 'SALEP') setRacikanUnit('Pot Salep');
    else if (preset.type === 'SIRUP') setRacikanUnit('Botol');
  };

  // Total Prescriptions Cost
  const totalPrescriptionCost = prescriptions.reduce((acc, rx) => {
    if (rx.type === 'RACIKAN') {
      return acc + (rx.price || 0);
    }
    return acc + ((rx.price || 0) * (Number(rx.quantity) || 0));
  }, 0);

  return (
    <div className="space-y-4">
      {/* Header with Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Pill className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
              E-Resep &amp; Terapi Farmasi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Peresepan obat terapi, obat racikan, signa/aturan pakai, dan sinkronisasi stok farmasi
            </p>
          </div>
        </div>

        {prescriptions.length > 0 && (
          <div className="flex items-center gap-2 text-xs sm:text-[13px] self-end sm:self-center">
            <Badge variant="outline" className="text-xs font-semibold bg-white text-slate-700 border-slate-200">
              {prescriptions.length} Item Diresepkan
            </Badge>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              Total: {formatRupiah(totalPrescriptionCost)}
            </span>
          </div>
        )}
      </div>

      {/* Mode Switcher: Non-Racikan vs Racikan Tabs */}
      {!disabled && (
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('NON_RACIKAN')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'NON_RACIKAN'
                ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="h-4 w-4 text-emerald-700" />
            <span>1. Obat Standar (Non-Racikan)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RACIKAN')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'RACIKAN'
                ? 'bg-white text-purple-800 shadow-2xs border border-purple-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="h-4 w-4 text-purple-600" />
            <span>2. Obat Racikan (Puyer / Kapsul / Salep)</span>
            {racikanIngredients.length > 0 && (
              <span className="h-4.5 w-4.5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                {racikanIngredients.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 1: FORM OBAT NON-RACIKAN (STANDAR)                           */}
      {/* ================================================================ */}
      {!disabled && activeTab === 'NON_RACIKAN' && (
        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/20 to-white p-3.5 space-y-3.5 shadow-2xs">
          {/* Drug Search Autocomplete */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-slate-700 flex items-center gap-1">
                <span>Nama Obat / Sediaan Farmasi</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              {selectedMed && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                  (selectedMed.stock || 0) > 10
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : (selectedMed.stock || 0) > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  Tersedia di Stok: {selectedMed.stock || 0} {selectedMed.unit}
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Ketik nama obat (e.g. Paracetamol, Amoxicillin, Cetirizine, CTM)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="h-9 sm:h-10 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 bg-white rounded-xl font-normal"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMed(null);
                  }}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showDropdown && (
              <div className="absolute left-0 right-0 top-16 z-30 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in max-h-60 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Katalog Stok Obat Farmasi Klinik
                </div>
                {filteredMeds.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    Obat tidak ditemukan di master data. Tekan enter untuk resep manual.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredMeds.map((med) => (
                      <button
                        key={med.id}
                        type="button"
                        onClick={() => handleSelectMed(med)}
                        className="flex w-full items-center justify-between rounded-xl p-2 text-left text-xs hover:bg-emerald-50 text-slate-800 transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{med.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({med.category})</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {med.standardSigna}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-700">{formatRupiah(med.price)}/{med.unit}</div>
                          <div className={`text-[10px] font-mono font-bold ${
                            (med.stock || 0) > 0 ? 'text-slate-500' : 'text-rose-600'
                          }`}>
                            Stok: {med.stock || 0}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity (Decimal), Unit, Dosage Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Jumlah / Qty (Desimal didukung) */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>Jumlah (Qty)</span>
                  <span className="text-rose-500 font-bold">*</span>
                </span>
                <span className="text-xs text-emerald-700 font-normal">Bisa desimal e.g. 0.5, 1.5</span>
              </label>
              <Input
                type="number"
                step="any"
                min="0.1"
                placeholder="10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-9 text-sm text-slate-800 bg-white text-center font-bold font-mono rounded-xl"
              />
            </div>

            {/* Bentuk Satuan */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Bentuk Satuan</label>
              <Select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-9 text-sm text-slate-800 bg-white rounded-xl font-medium"
              >
                <option value="Tablet">Tablet</option>
                <option value="Kapsul">Kapsul</option>
                <option value="Kaplet">Kaplet</option>
                <option value="Botol / Sirup">Botol / Sirup</option>
                <option value="Tube Salep">Tube Salep</option>
                <option value="Sachet">Sachet</option>
                <option value="Ampul / Vial">Ampul / Vial</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Tetes / Drop">Tetes / Drop</option>
              </Select>
            </div>

            {/* Dosis / Kekuatan */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-slate-700">Dosis / Kekuatan</label>
              <Input
                placeholder="e.g. 500 mg, 20 mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="h-9 text-sm text-slate-800 bg-white rounded-xl font-normal"
              />
            </div>
          </div>

          {/* Aturan Pakai / Signa */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
              Aturan Pakai (Signa)
            </label>
            <Input
              placeholder="Contoh: 3 x 1 tablet sesudah makan"
              value={signa}
              onChange={(e) => setSigna(e.target.value)}
              className="h-9 text-sm text-slate-800 bg-white rounded-xl font-normal"
            />

            {/* Quick Signa Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {COMMON_SIGNAS_NON_RACIKAN.slice(0, 5).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSigna(chip)}
                  className="text-xs px-2.5 py-1 rounded-full bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors font-medium cursor-pointer shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Add Non-Racikan Button */}
          <div className="pt-1.5 flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-slate-500">
              {selectedMed && (
                <span>
                  Estimasi: <strong className="font-mono text-slate-800 text-sm">{formatRupiah(selectedMed.price * (parseFloat(quantity) || 1))}</strong>
                </span>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAddNonRacikan}
              className="h-9 px-4 text-xs sm:text-sm font-semibold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs rounded-xl cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambahkan ke Resep</span>
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: FORM OBAT RACIKAN (PUYER / KAPSUL / SALEP)                */}
      {/* ================================================================ */}
      {!disabled && activeTab === 'RACIKAN' && (
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-b from-purple-50/30 to-white p-3.5 space-y-3.5 shadow-2xs">
          {/* Preset Racikan Buttons */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                <span>Pilihan Preset Racikan Cepat:</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-1">
              {RACIKAN_PRESET_NAMES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPresetRacikan(preset)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors font-bold cursor-pointer ${
                    racikanName === preset.name
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main Racikan Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-xl border border-purple-100">
            {/* Nama Racikan */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <span>Nama Racikan</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <Input
                placeholder="Contoh: Puyer Batuk Pilek Anak, Kapsul Asma..."
                value={racikanName}
                onChange={(e) => setRacikanName(e.target.value)}
                className="h-8 text-xs bg-white rounded-xl font-semibold"
              />
            </div>

            {/* Bentuk Sediaan Racikan */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Bentuk Sediaan</label>
              <Select
                value={racikanType}
                onChange={(e) => {
                  const val = e.target.value as RacikanType;
                  setRacikanType(val);
                  if (val === 'PULVERES') setRacikanUnit('Bungkus / Puyer');
                  else if (val === 'KAPSUL') setRacikanUnit('Kapsul');
                  else if (val === 'SALEP') setRacikanUnit('Pot Salep');
                  else if (val === 'SIRUP') setRacikanUnit('Botol');
                }}
                className="h-8 text-xs bg-white rounded-xl font-medium"
              >
                <option value="PULVERES">Pulveres (Puyer)</option>
                <option value="KAPSUL">Kapsul Racik</option>
                <option value="SALEP">Salep / Krim Racik</option>
                <option value="SIRUP">Sirup / Suspensi</option>
                <option value="LAINNYA">Lainnya</option>
              </Select>
            </div>

            {/* Jumlah Sediaan yang Dibuat */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <span>Jumlah Sediaan</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="1"
                  placeholder="10"
                  value={racikanQuantity}
                  onChange={(e) => setRacikanQuantity(e.target.value)}
                  className="h-8 text-xs bg-white text-center font-bold font-mono rounded-xl w-20"
                />
                <span className="text-xs font-bold text-slate-600 truncate">{racikanUnit}</span>
              </div>
            </div>

            {/* Aturan Pakai Racikan */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-700">Aturan Pakai (Signa Racikan)</label>
              <Input
                placeholder="Contoh: 3 x 1 bungkus sesudah makan"
                value={racikanSigna}
                onChange={(e) => setRacikanSigna(e.target.value)}
                className="h-8 text-xs bg-white rounded-xl"
              />
            </div>
          </div>

          {/* Quick Signa Chips for Racikan */}
          <div className="flex flex-wrap gap-1">
            {COMMON_SIGNAS_RACIKAN.slice(0, 4).map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setRacikanSigna(chip)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-900 hover:bg-purple-100 transition-colors font-medium cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* ============================================================== */}
          {/* BUILDER: KOMPOSISI BAHAN OBAT RACIKAN                          */}
          {/* ============================================================== */}
          <div className="rounded-xl border border-purple-200 bg-white p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-purple-100 pb-1.5">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-purple-600" />
                <span>Komposisi Bahan Obat Racikan ({racikanIngredients.length} Bahan)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Stok inventaris akan terpotong per bahan obat
              </span>
            </div>

            {/* Input Tambah Bahan */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
              {/* Cari Bahan Obat */}
              <div className="sm:col-span-6 space-y-1 relative">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5">
                    <span>Nama Bahan Obat</span>
                    <span className="text-red-500 font-bold">*</span>:
                  </label>
                  {selectedIngMed && (
                    <span className="text-[9px] font-mono font-bold text-emerald-800">
                      Stok: {selectedIngMed.stock || 0} {selectedIngMed.unit}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Cari obat bahan (e.g. Paracetamol, CTM, Salbutamol)..."
                    value={ingSearchQuery}
                    onChange={(e) => {
                      setIngSearchQuery(e.target.value);
                      setShowIngDropdown(true);
                    }}
                    onFocus={() => setShowIngDropdown(true)}
                    className="h-7.5 pl-8 text-xs bg-white rounded-lg"
                  />
                  {ingSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setIngSearchQuery('');
                        setSelectedIngMed(null);
                      }}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown Bahan */}
                {showIngDropdown && (
                  <div className="absolute left-0 right-0 top-14 z-40 rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in max-h-52 overflow-y-auto">
                    <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Pilih Bahan dari Stok Farmasi
                    </div>
                    {filteredIngMeds.length === 0 ? (
                      <div className="p-2 text-center text-xs text-slate-500">
                        Tidak ditemukan di master obat
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredIngMeds.map((med) => (
                          <button
                            key={med.id}
                            type="button"
                            onClick={() => handleSelectIngMed(med)}
                            className="flex w-full items-center justify-between rounded-lg p-1.5 text-left text-xs hover:bg-purple-50 text-slate-800 transition-colors cursor-pointer"
                          >
                            <div>
                              <span className="font-semibold text-slate-900">{med.name}</span>
                              <span className="text-[10px] text-slate-400 ml-1">({med.category})</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-purple-700">{formatRupiah(med.price)}</span>
                              <span className="text-[9px] text-slate-400 ml-1">Stok: {med.stock || 0}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Jumlah Qty Bahan (Desimal e.g. 2.5) */}
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-0.5">
                    <span>Jml Bahan (Qty)</span>
                    <span className="text-red-500 font-bold">*</span>:
                  </span>
                  <span className="text-[9px] text-purple-700">Desimal</span>
                </label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="any"
                    min="0.1"
                    placeholder="2.5"
                    value={ingQuantity}
                    onChange={(e) => setIngQuantity(e.target.value)}
                    className="h-7.5 text-xs bg-white text-center font-bold font-mono rounded-lg"
                  />
                  <span className="text-[10px] font-semibold text-slate-600">{ingUnit}</span>
                </div>
              </div>

              {/* Tombol Tambah Bahan */}
              <div className="sm:col-span-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddIngredient}
                  className="h-7.5 w-full text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>+ Bahan</span>
                </Button>
              </div>
            </div>

            {/* List Bahan yang Ditambahkan ke Racikan */}
            <div className="space-y-1.5 pt-1">
              {racikanIngredients.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-purple-200 rounded-xl bg-purple-50/30">
                  Belum ada bahan obat yang ditambahkan. Silakan pilih bahan obat di atas.
                </div>
              ) : (
                <div className="divide-y divide-purple-100 border border-purple-100 rounded-xl overflow-hidden bg-white">
                  {racikanIngredients.map((ing, idx) => {
                    const subtotal = ing.price * (Number(ing.quantity) || 1);
                    return (
                      <div
                        key={ing.id || idx}
                        className="p-2 flex items-center justify-between text-xs hover:bg-purple-50/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900">{ing.name}</span>
                          <Badge variant="secondary" className="text-[10px] font-mono bg-purple-50 text-purple-800 border-purple-200">
                            {ing.quantity} {ing.unit}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-700 font-medium">
                            {formatRupiah(subtotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            title="Hapus Bahan"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Total Kalkulasi Racikan & Tombol Tambah ke Resep */}
            <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-500 mr-1">Total Biaya Bahan:</span>
                <strong className="font-mono text-purple-900 font-bold text-sm">
                  {formatRupiah(
                    racikanIngredients.reduce(
                      (acc, ing) => acc + (ing.price * (Number(ing.quantity) || 1)),
                      0
                    )
                  )}
                </strong>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleAddRacikanToPrescription}
                className="h-8 text-xs font-bold gap-1.5 bg-purple-700 hover:bg-purple-800 text-white shadow-2xs rounded-xl cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambahkan Racikan ke Lembar Resep</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TABEL DAFTAR RESEP YANG DIBERIKAN                                 */}
      {/* ================================================================ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-[13px] font-bold text-slate-800">
          <span>Lembar Peresepan Obat Pasien ({prescriptions.length}):</span>
        </div>

        {prescriptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 bg-slate-50/50">
            {disabled
              ? 'Tidak ada resep obat yang diberikan pada pemeriksaan ini.'
              : 'Belum ada obat yang diresepkan. Masukkan obat non-racikan atau racikan pada form di atas.'}
          </div>
        ) : (
          <div className="space-y-2">
            {prescriptions.map((rx, index) => {
              const isRacikan = rx.type === 'RACIKAN';
              const rxTotalPrice = isRacikan
                ? (rx.price || 0)
                : ((rx.price || 0) * (Number(rx.quantity) || 0));

              return (
                <div
                  key={rx.id || index}
                  className={`rounded-2xl border p-3 sm:p-3.5 transition-all shadow-2xs ${
                    isRacikan
                      ? 'border-purple-200 bg-gradient-to-r from-purple-50/40 to-white'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      {/* Name & Badge Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {isRacikan ? (
                          <Badge className="text-xs font-semibold bg-purple-700 text-white hover:bg-purple-800 py-0.5 px-2">
                            🧪 Racikan ({rx.racikanType || 'Puyer'})
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 py-0.5 px-2">
                            💊 Non-Racikan
                          </Badge>
                        )}
                        <span className="font-bold text-slate-900 text-sm">{rx.name}</span>
                        {!isRacikan && rx.dosage && (
                          <span className="text-xs text-slate-500 font-mono">({rx.dosage})</span>
                        )}
                      </div>

                      {/* Signa & Quantity */}
                      <div className="text-xs sm:text-[13px] text-slate-600 flex items-center gap-2 flex-wrap pt-0.5">
                        <span className="font-medium text-slate-800">Signa: {rx.signa}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 text-xs">
                          Jumlah: {rx.quantity} {rx.unit}
                        </span>
                      </div>

                      {/* Racikan Ingredients List (If Racikan) */}
                      {isRacikan && rx.ingredients && rx.ingredients.length > 0 && (
                        <div className="mt-2 p-2.5 rounded-xl bg-white border border-purple-100 text-xs space-y-1.5">
                          <span className="font-bold text-purple-900 block text-xs uppercase">
                            Komposisi Bahan Racikan:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700">
                            {rx.ingredients.map((ing, iIdx) => (
                              <div key={iIdx} className="flex items-center justify-between bg-purple-50/50 px-2.5 py-1 rounded-lg">
                                <span className="font-medium">• {ing.name}</span>
                                <span className="font-mono font-bold text-purple-900">{ing.quantity} {ing.unit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price & Remove Button */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {formatRupiah(rxTotalPrice)}
                        </div>
                        {!isRacikan && (
                          <div className="text-xs text-slate-400 font-mono">
                            @{formatRupiah(rx.price)}/{rx.unit}
                          </div>
                        )}
                      </div>

                      {!disabled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePrescription(index)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Hapus Resep"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
