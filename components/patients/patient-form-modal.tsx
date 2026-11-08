'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { useRME } from '@/context/rme-context';
import { calculateAge } from '@/lib/utils';
import { INDONESIA_REGIONS, normalizeRegionName, searchRegions, RegionSearchResult } from '@/lib/indonesia-regions';
import { Patient, Gender } from '@/types/rme';
import { Plus, X, User, AlertCircle, Phone, Calendar, MapPin, Sparkles, HeartPulse, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createBackendPatient, BackendPatientPayload, fetchBackendPatients, mapBackendPatientToPatient } from '@/lib/api-client';
import { generateNoRM } from '@/lib/utils';

interface PatientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientToEdit?: Patient | null;
  onSuccess?: (patient: Patient) => void;
}

export function PatientFormModal({
  open,
  onOpenChange,
  patientToEdit,
  onSuccess,
}: PatientFormModalProps) {
  const { patients, addPatient, updatePatient, activeTenant, hasPermission } = useRME();

  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    gender: 'L' as Gender,
    birthDate: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    subdistrict: '',
    streetAddress: '',
    rtRw: '',
    bloodType: '-' as 'A' | 'B' | 'AB' | 'O' | '-',
    emergencyName: '',
    emergencyRelationship: 'Keluarga',
    emergencyPhone: '',
  });

  const [allergiesList, setAllergiesList] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  // NIK Autocheck & Duplicate Prevention State
  const [nikCheckStatus, setNikCheckStatus] = useState<'idle' | 'checking' | 'duplicate' | 'available'>('idle');
  const [duplicatePatient, setDuplicatePatient] = useState<Patient | null>(null);

  // Real-time autocheck NIK saat penambahan pasien baru
  useEffect(() => {
    if (patientToEdit) {
      setNikCheckStatus('idle');
      setDuplicatePatient(null);
      return;
    }

    const cleanNik = formData.nik.trim();
    if (!cleanNik || cleanNik.length < 16) {
      setNikCheckStatus('idle');
      setDuplicatePatient(null);
      return;
    }

    const localMatch = patients.find((p) => p.nik && p.nik.trim() === cleanNik);
    if (localMatch) {
      setDuplicatePatient(localMatch);
      setNikCheckStatus('duplicate');
      toast.warning(
        `NIK ${cleanNik} sudah terdaftar atas nama ${localMatch.name} (${localMatch.noRM || '-'}). Hindari duplikasi data!`,
        { id: 'modal-nik-duplicate-warning', duration: 5000 }
      );
      return;
    }

    let isMounted = true;
    setNikCheckStatus('checking');

    const timer = setTimeout(async () => {
      try {
        const res = await fetchBackendPatients({ search: cleanNik, limit: 5 });
        if (!isMounted) return;

        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const exactMatch = res.data.find((item: any) => item.nik && item.nik.trim() === cleanNik);
          if (exactMatch) {
            const mapped = mapBackendPatientToPatient(exactMatch);
            setDuplicatePatient(mapped);
            setNikCheckStatus('duplicate');
            toast.warning(
              `NIK ${cleanNik} sudah terdaftar di server atas nama ${mapped.name} (${mapped.noRM || '-'}). Hindari duplikasi data!`,
              { id: 'modal-nik-duplicate-warning', duration: 5000 }
            );
            return;
          }
        }

        setDuplicatePatient(null);
        setNikCheckStatus('available');
      } catch {
        if (!isMounted) return;
        setDuplicatePatient(null);
        setNikCheckStatus('available');
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [formData.nik, patientToEdit, patients]);

  // Cascading regions logic (Using complete 38 provinces Indonesian master data)
  const currentProvinceData = useMemo(() => {
    if (!formData.province) return undefined;
    const target = normalizeRegionName(formData.province).toLowerCase();
    return INDONESIA_REGIONS.find(
      (p) =>
        p.province.toLowerCase() === target ||
        normalizeRegionName(p.province).toLowerCase() === target ||
        p.code === formData.province
    );
  }, [formData.province]);

  const availableCities = useMemo(() => {
    return currentProvinceData?.cities || [];
  }, [currentProvinceData]);

  const currentCityData = useMemo(() => {
    if (!formData.city) return undefined;
    const target = formData.city.toLowerCase().trim();
    return availableCities.find(
      (c) =>
        c.name.toLowerCase() === target ||
        c.name.toLowerCase().replace(/^(kota|kabupaten|kab|kota administrasi)\s+/i, '') ===
          target.replace(/^(kota|kabupaten|kab|kota administrasi)\s+/i, '') ||
        c.code === formData.city
    );
  }, [availableCities, formData.city]);

  const availableDistricts = useMemo(() => {
    return currentCityData?.districts || [];
  }, [currentCityData]);

  const currentDistrictData = useMemo(() => {
    if (!formData.district) return undefined;
    const target = formData.district.toLowerCase().trim();
    return availableDistricts.find(
      (d) => d.name.toLowerCase() === target || d.code === formData.district
    );
  }, [availableDistricts, formData.district]);

  const availableSubdistricts = useMemo(() => {
    return currentDistrictData?.subdistricts || [];
  }, [currentDistrictData]);

  const handleProvinceChange = (prov: string) => {
    setFormData((prev) => ({
      ...prev,
      province: prov,
      city: '',
      district: '',
      subdistrict: '',
    }));
  };

  const handleCityChange = (cityName: string) => {
    setFormData((prev) => ({
      ...prev,
      city: cityName,
      district: '',
      subdistrict: '',
    }));
  };

  const handleDistrictChange = (distName: string) => {
    setFormData((prev) => ({
      ...prev,
      district: distName,
      subdistrict: '',
    }));
  };

  // Quick Search Wilayah state (Ketik untuk cari otomatis)
  const [quickWilayahQuery, setQuickWilayahQuery] = useState('');
  const quickWilayahResults = useMemo(() => {
    return searchRegions(quickWilayahQuery, 6);
  }, [quickWilayahQuery]);

  const handleApplyQuickRegion = (item: RegionSearchResult) => {
    setFormData((prev) => ({
      ...prev,
      province: item.province,
      city: item.city,
      district: item.district,
      subdistrict: item.subdistrict,
    }));
    setQuickWilayahQuery('');
    toast.success(`Wilayah otomatis terisi: ${item.label}`);
  };

  const provinceOptions = useMemo(() => {
    return INDONESIA_REGIONS.map((r) => ({
      value: r.province,
      label: r.province,
      sublabel: `${r.cities.length} Kota/Kabupaten`,
    }));
  }, []);

  const cityOptions = useMemo(() => {
    return availableCities.map((c) => ({
      value: c.name,
      label: c.name,
      sublabel: `${c.districts.length} Kecamatan`,
    }));
  }, [availableCities]);

  const districtOptions = useMemo(() => {
    return availableDistricts.map((d) => ({
      value: d.name,
      label: d.name,
      sublabel: `${d.subdistricts.length} Kelurahan/Desa`,
    }));
  }, [availableDistricts]);

  const subdistrictOptions = useMemo(() => {
    return availableSubdistricts.map((s) => ({
      value: s,
      label: s,
    }));
  }, [availableSubdistricts]);

  // Sync edit mode data when opened
  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        nik: patientToEdit.nik || '',
        name: patientToEdit.name || '',
        gender: patientToEdit.gender || 'L',
        birthDate: patientToEdit.birthDate || '',
        phone: patientToEdit.phone || '',
        province: patientToEdit.province || '',
        city: patientToEdit.city || '',
        district: patientToEdit.district || '',
        subdistrict: patientToEdit.subdistrict || '',
        streetAddress: patientToEdit.streetAddress || patientToEdit.address || '',
        rtRw: patientToEdit.rtRw || '',
        bloodType: patientToEdit.bloodType || '-',
        emergencyName: patientToEdit.emergencyContact?.name || '',
        emergencyRelationship: patientToEdit.emergencyContact?.relationship || 'Keluarga',
        emergencyPhone: patientToEdit.emergencyContact?.phone || '',
      });
      setAllergiesList(patientToEdit.allergies || []);
    } else {
      setFormData({
        nik: '',
        name: '',
        gender: 'L',
        birthDate: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        subdistrict: '',
        streetAddress: '',
        rtRw: '',
        bloodType: '-',
        emergencyName: '',
        emergencyRelationship: 'Keluarga',
        emergencyPhone: '',
      });
      setAllergiesList([]);
    }
  }, [patientToEdit, open]);

  const calculatedAge = calculateAge(formData.birthDate);

  const handleAddAllergy = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!allergyInput.trim()) return;
    if (!allergiesList.includes(allergyInput.trim())) {
      setAllergiesList([...allergiesList, allergyInput.trim()]);
    }
    setAllergyInput('');
  };

  const handleRemoveAllergy = (item: string) => {
    setAllergiesList(allergiesList.filter((a) => a !== item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama pasien wajib diisi');
      return;
    }

    if (!formData.nik.trim()) {
      toast.error('NIK pasien wajib diisi (16 digit)');
      return;
    }

    if (formData.nik.trim().length !== 16) {
      toast.error('NIK harus terdiri dari 16 digit angka');
      return;
    }

    // Validasi anti duplikasi NIK jika pasien baru
    if (!patientToEdit) {
      const existingDuplicate =
        duplicatePatient || patients.find((p) => p.nik && p.nik.trim() === formData.nik.trim());
      if (existingDuplicate) {
        toast.error(
          `Pendaftaran dibatalkan: NIK sudah terdaftar atas nama ${existingDuplicate.name} (${existingDuplicate.noRM || '-'}). Data ganda tidak diizinkan!`,
          { duration: 6000 }
        );
        return;
      }
    }

    const fullAddressParts = [
      formData.streetAddress?.trim(),
      formData.rtRw?.trim() ? `RT/RW ${formData.rtRw.trim()}` : null,
      formData.subdistrict ? `Kel. ${formData.subdistrict}` : null,
      formData.district ? `Kec. ${formData.district}` : null,
      formData.city,
      formData.province,
    ].filter(Boolean);

    const assembledAddress = fullAddressParts.join(', ');

    const patientPayload = {
      nik: formData.nik || `3171${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      name: formData.name.trim(),
      gender: formData.gender,
      birthDate: formData.birthDate,
      age: calculatedAge,
      phone: formData.phone || '0812-0000-0000',
      address: assembledAddress,
      streetAddress: formData.streetAddress,
      rtRw: formData.rtRw,
      province: formData.province,
      city: formData.city,
      district: formData.district,
      subdistrict: formData.subdistrict,
      bloodType: formData.bloodType,
      allergies: allergiesList,
      emergencyContact: formData.emergencyName
        ? {
            name: formData.emergencyName,
            relationship: formData.emergencyRelationship,
            phone: formData.emergencyPhone || formData.phone,
          }
        : undefined,
    };

    if (patientToEdit) {
      updatePatient(patientToEdit.id, patientPayload);
      const updated = { ...patientToEdit, ...patientPayload, updatedAt: new Date().toISOString() };
      toast.success(`Data pasien ${updated.name} berhasil diperbarui!`);
      if (onSuccess) onSuccess(updated);
    } else {
      const nextNoRM = generateNoRM(patients.length + 1);
      const backendPayload: BackendPatientPayload = {
        no_rm: nextNoRM,
        nik: patientPayload.nik,
        name: patientPayload.name,
        gender: patientPayload.gender,
        birth_date: patientPayload.birthDate,
        phone: patientPayload.phone,
        street_address: patientPayload.streetAddress,
        rt_rw: patientPayload.rtRw,
        province: patientPayload.province,
        city: patientPayload.city,
        district: patientPayload.district,
        subdistrict: patientPayload.subdistrict,
        postal_code: '',
        blood_type: patientPayload.bloodType,
        allergies: patientPayload.allergies,
        emergency_contact: patientPayload.emergencyContact || {},
      };
      createBackendPatient(backendPayload).then((res) => {
        if (res.success) {
          toast.success(`Sinkronisasi server backend berhasil! (${res.data?.no_rm || nextNoRM})`);
        }
      });

      const created = addPatient(patientPayload);
      toast.success(`Pasien ${created.name} (${created.noRM}) berhasil didaftarkan!`);
      if (onSuccess) onSuccess(created);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="2xl">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>
          {patientToEdit ? 'Edit Data Pasien' : 'Pendaftaran Pasien Baru'}
        </DialogTitle>
        <DialogDescription>
          {patientToEdit
            ? `Memperbarui data rekam medis pasien ${patientToEdit.noRM}`
            : 'Lengkapi identitas pasien dan alamat wilayah untuk pembuatan Nomor Rekam Medis (No RM) otomatis.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Nama Lengkap */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-700">
              Nama Lengkap Pasien <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="Contoh: Budi Prasetyo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          {/* NIK */}
          <div className="space-y-1 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Nomor Induk Kependudukan (NIK)</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {nikCheckStatus === 'checking' && (
                  <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Memeriksa NIK...
                  </span>
                )}
                {nikCheckStatus === 'duplicate' && (
                  <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-rose-500" />
                    NIK Sudah Terdaftar
                  </span>
                )}
                {nikCheckStatus === 'available' && (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    NIK Tersedia
                  </span>
                )}
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                    formData.nik.length === 16
                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {formData.nik.length}/16 digit
                </span>
              </div>
            </div>
            <div className="relative">
              <Input
                required
                placeholder="16 Digit NIK KTP (Wajib angka)"
                maxLength={16}
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                className={`h-8 text-xs font-mono pr-8 bg-white transition-all ${
                  nikCheckStatus === 'duplicate'
                    ? 'border-rose-400 focus-visible:ring-rose-400/30 bg-rose-50/20 text-rose-950 font-semibold'
                    : nikCheckStatus === 'available'
                    ? 'border-emerald-400 focus-visible:ring-emerald-400/30 bg-emerald-50/20 text-emerald-950'
                    : nikCheckStatus === 'checking'
                    ? 'border-blue-400 focus-visible:ring-blue-400/30'
                    : ''
                }`}
              />
              <div className="absolute right-2.5 top-2 pointer-events-none">
                {nikCheckStatus === 'checking' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {nikCheckStatus === 'duplicate' && (
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                )}
                {nikCheckStatus === 'available' && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Helper text saat NIK belum 16 digit */}
            {formData.nik.length > 0 && formData.nik.length < 16 && (
              <p className="text-[10px] text-slate-400">
                Masukkan 16 digit NIK KTP (kurang {16 - formData.nik.length} digit lagi).
              </p>
            )}

            {/* Duplicate Patient Alert Card in Modal */}
            {nikCheckStatus === 'duplicate' && duplicatePatient && (
              <div className="rounded-xl border border-rose-300 bg-rose-50/70 p-3 shadow-xs space-y-2 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span className="text-xs font-bold text-rose-900">
                    Pasien dengan NIK ini sudah pernah terdaftar!
                  </span>
                </div>
                <div className="bg-white/90 rounded-md border border-rose-200 p-2 text-[11px] space-y-0.5">
                  <div>Nama: <strong>{duplicatePatient.name}</strong> ({duplicatePatient.noRM || '-'})</div>
                  <div>Gender: {duplicatePatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} &bull; Usia: {duplicatePatient.age || '-'} th &bull; Kontak: {duplicatePatient.phone || '-'}</div>
                  <div className="truncate text-slate-500">Alamat: {duplicatePatient.address || duplicatePatient.streetAddress || '-'}</div>
                </div>
              </div>
            )}

            {nikCheckStatus === 'available' && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50/80 border border-emerald-200 px-2 py-0.5 rounded-md animate-in fade-in">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                <span>NIK valid dan belum terdaftar. Siap disimpan.</span>
              </div>
            )}
          </div>

          {/* Nomor HP / WA */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              No. Telepon / WhatsApp <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="0812-xxxx-xxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          {/* Jenis Kelamin */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Jenis Kelamin <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
              className="h-8 text-xs"
            >
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </Select>
          </div>

          {/* Tanggal Lahir */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">
                Tanggal Lahir <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-blue-600 font-semibold">{calculatedAge} Tahun</span>
            </div>
            <Input
              type="date"
              required
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          {/* Golongan Darah */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-700">Golongan Darah</label>
            <Select
              value={formData.bloodType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bloodType: e.target.value as 'A' | 'B' | 'AB' | 'O' | '-',
                })
              }
              className="h-8 text-xs"
            >
              <option value="-">Tidak Tahu / Belum Cek (-)</option>
              <option value="A">Golongan A</option>
              <option value="B">Golongan B</option>
              <option value="AB">Golongan AB</option>
              <option value="O">Golongan O</option>
            </Select>
          </div>
        </div>

        {/* Structured Indonesian Address Box with Searchable Inputs & Quick Autofill */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              <span>Alamat Domisili Pasien (Wilayah Indonesia)</span>
            </div>
            <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-medium shadow-2xs">
              38 Provinsi &bull; 514 Kota &bull; 7.265 Kec &bull; 83.345 Kel
            </span>
          </div>

          {/* Smart Quick Search Wilayah */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/70 border border-blue-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0 animate-pulse" />
              <input
                type="text"
                value={quickWilayahQuery}
                onChange={(e) => setQuickWilayahQuery(e.target.value)}
                placeholder="Cari Cepat Wilayah (Ketik nama Desa, Kelurahan, Kecamatan, atau Kota untuk isi otomatis)..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder:text-blue-900/40 focus:outline-none"
              />
              {quickWilayahQuery && (
                <button
                  type="button"
                  onClick={() => setQuickWilayahQuery('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Hasil Quick Search */}
            {quickWilayahResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-2xl p-1.5 space-y-1 ring-1 ring-black/5 animate-in fade-in-50 duration-150">
                <div className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Pilih Rekomendasi Wilayah (Auto-fill 4 Kolom)</span>
                  <span>{quickWilayahResults.length} hasil</span>
                </div>
                {quickWilayahResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyQuickRegion(item)}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs hover:bg-blue-50/80 transition-colors border border-transparent hover:border-blue-100 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="truncate">
                        <div className="font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.subdistrict ? `Kel. ${item.subdistrict}, ` : ''}
                          {item.district ? `Kec. ${item.district}, ` : ''}
                          {item.city}, {item.province}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-semibold shrink-0 ml-2">
                      Pilih Otomatis
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Provinsi */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">
                Provinsi <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                value={formData.province}
                onChange={handleProvinceChange}
                options={provinceOptions}
                placeholder="-- Cari / Pilih Provinsi --"
                searchPlaceholder="Ketik nama provinsi (misal: Jawa, Jakarta, Bali)..."
              />
            </div>

            {/* Kota / Kabupaten */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                <span>Kota / Kabupaten <span className="text-rose-500">*</span></span>
                {availableCities.length > 0 && (
                  <span className="text-[10px] text-blue-600 font-normal">{availableCities.length} pilihan</span>
                )}
              </label>
              <SearchableSelect
                value={formData.city}
                onChange={handleCityChange}
                options={cityOptions}
                disabled={!formData.province}
                placeholder="-- Cari / Pilih Kota / Kab --"
                disabledPlaceholder="-- Pilih Provinsi Terlebih Dahulu --"
                searchPlaceholder="Ketik nama kota/kabupaten..."
              />
            </div>

            {/* Kecamatan */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                <span>Kecamatan <span className="text-rose-500">*</span></span>
                {availableDistricts.length > 0 && (
                  <span className="text-[10px] text-blue-600 font-normal">{availableDistricts.length} pilihan</span>
                )}
              </label>
              <SearchableSelect
                value={formData.district}
                onChange={handleDistrictChange}
                options={districtOptions}
                disabled={!formData.city}
                placeholder="-- Cari / Pilih Kecamatan --"
                disabledPlaceholder="-- Pilih Kota / Kab Terlebih Dahulu --"
                searchPlaceholder="Ketik nama kecamatan..."
              />
            </div>

            {/* Kelurahan / Desa */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                <span>Kelurahan / Desa <span className="text-rose-500">*</span></span>
                {availableSubdistricts.length > 0 && (
                  <span className="text-[10px] text-blue-600 font-normal">{availableSubdistricts.length} pilihan</span>
                )}
              </label>
              <SearchableSelect
                value={formData.subdistrict}
                onChange={(val) => setFormData((prev) => ({ ...prev, subdistrict: val }))}
                options={subdistrictOptions}
                disabled={!formData.district}
                placeholder="-- Cari / Pilih Kelurahan / Desa --"
                disabledPlaceholder="-- Pilih Kecamatan Terlebih Dahulu --"
                searchPlaceholder="Ketik nama kelurahan atau desa..."
              />
            </div>

            {/* Detail Jalan & RT/RW */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[11px] font-semibold text-slate-600">
                Nama Jalan, No. Rumah, RT/RW (Detail Alamat)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Input
                  placeholder="Jl. Nama Jalan No. XX..."
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  className="h-8 text-xs bg-white sm:col-span-3"
                />
                <Input
                  placeholder="RT 01 / RW 02"
                  value={formData.rtRw}
                  onChange={(e) => setFormData({ ...formData, rtRw: e.target.value })}
                  className="h-8 text-xs bg-white sm:col-span-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat Alergi */}
        <div className="space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/40 p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>Riwayat Alergi Pasien (Obat / Makanan / Lainnya)</span>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Contoh: Penisilin, Aspirin, Udang..."
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAllergy();
                }
              }}
              className="bg-white h-8 text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAllergy}
              className="h-8 text-xs bg-white text-amber-900 border-amber-300"
            >
              <Plus className="h-3 w-3" /> Tambah
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {allergiesList.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Tidak ada riwayat alergi yang tercatat.</span>
            ) : (
              allergiesList.map((allergy) => (
                <Badge
                  key={allergy}
                  variant="destructive"
                  className="gap-1 bg-rose-100 text-rose-800 border-rose-200 text-xs py-0.5"
                >
                  {allergy}
                  <button
                    type="button"
                    onClick={() => handleRemoveAllergy(allergy)}
                    className="hover:text-rose-950"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Kontak Darurat */}
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <div className="text-xs font-bold text-slate-800">Kontak Darurat (Opsional)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Nama Kontak"
              value={formData.emergencyName}
              onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
              className="bg-white h-8 text-xs"
            />
            <Select
              value={formData.emergencyRelationship}
              onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
              className="bg-white h-8 text-xs"
            >
              <option value="Suami / Istri">Suami / Istri</option>
              <option value="Orang Tua">Orang Tua</option>
              <option value="Anak">Anak</option>
              <option value="Saudara">Saudara Kandung</option>
              <option value="Teman / Lainnya">Teman / Lainnya</option>
            </Select>
            <Input
              placeholder="No. HP Darurat"
              value={formData.emergencyPhone}
              onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
              className="bg-white h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={patientToEdit ? !hasPermission('edit_patient') : !hasPermission('create_patient')}>
            {patientToEdit ? 'Simpan Perubahan' : 'Daftarkan Pasien'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
