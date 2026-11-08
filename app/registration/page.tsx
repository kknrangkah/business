'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Patient, Gender, PaymentType } from '@/types/rme';
import { calculateAge, generateQueueNumber, generateNoRM } from '@/lib/utils';
import {
  createBackendPatient,
  fetchBackendPatients,
  mapBackendPatientToPatient,
  BackendPatientPayload,
  fetchBackendProvinces,
  fetchBackendKabupatenKota,
  fetchBackendKecamatan,
  fetchBackendKelurahan,
  BackendProvinceItem,
  BackendKabupatenKotaItem,
  BackendKecamatanItem,
  BackendKelurahanItem,
} from '@/lib/api-client';
import { normalizeRegionName, searchRegions, RegionSearchResult } from '@/lib/indonesia-regions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  CalendarPlus,
  Search,
  UserPlus,
  UserCheck,
  Clock,
  Stethoscope,
  CreditCard,
  MapPin,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  User,
  Users,
  Printer,
  Tv,
  Loader2,
  PhoneCall,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { QueueTicketModal } from '@/components/queue/queue-ticket-modal';
import { Visit } from '@/types/rme';

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

function isDoctorPracticingOnDay(
  doc: { status?: 'ACTIVE' | 'INACTIVE'; scheduleDays?: string[] },
  targetDay: string
): boolean {
  if (doc.status === 'INACTIVE') return false;

  const docDays =
    doc.scheduleDays !== undefined && Array.isArray(doc.scheduleDays)
      ? doc.scheduleDays
      : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  if (docDays.length === 0) return false;

  const t = targetDay.trim().toLowerCase();
  const aliases: Record<string, string[]> = {
    minggu: ['minggu', 'ahad', 'sunday', 'sun'],
    senin: ['senin', 'monday', 'mon'],
    selasa: ['selasa', 'tuesday', 'tue'],
    rabu: ['rabu', 'wednesday', 'wed'],
    kamis: ['kamis', 'thursday', 'thu'],
    jumat: ['jumat', "jum'at", 'friday', 'fri'],
    sabtu: ['sabtu', 'saturday', 'sat'],
  };

  return docDays.some((day) => {
    const d = day.trim().toLowerCase();
    if (d === t) return true;
    const matchedKey = Object.keys(aliases).find((k) => k === t);
    return matchedKey ? aliases[matchedKey]?.includes(d) : false;
  });
}

export default function RegistrationPage() {
  const router = useRouter();
  const { patients, doctors, config, addPatient, createVisit, visits, activeTenant } = useRME();

  const [activeTab, setActiveTab] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [registeredVisitForTicket, setRegisteredVisitForTicket] = useState<Visit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backend Integration State for GET/POST /v1/patients
  const [backendPatients, setBackendPatients] = useState<Patient[]>([]);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [backendTotal, setBackendTotal] = useState(0);
  const [backendConnected, setBackendConnected] = useState(true);

  // Load patients from backend GET /v1/patients
  const loadBackendPatients = async (query = '') => {
    setIsLoadingBackend(true);
    try {
      const res = await fetchBackendPatients({ search: query, limit: 50 });
      if (res.success) {
        const mapped = res.data.map(mapBackendPatientToPatient);
        setBackendPatients(mapped);
        setBackendTotal(res.total);
        setBackendConnected(true);
      } else {
        setBackendConnected(false);
      }
    } catch (err) {
      console.warn('[Registration] Gagal mengambil data pasien dari backend:', err);
      setBackendConnected(false);
    } finally {
      setIsLoadingBackend(false);
    }
  };

  // Initial fetch on mount
  React.useEffect(() => {
    loadBackendPatients();
  }, []);

  // Live debounced search when user types in search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadBackendPatients(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // New Patient Form State (with structured Indonesian address & POST /v1/patients integration)
  const [newPatientData, setNewPatientData] = useState({
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
    postalCode: '',
    bloodType: '-' as 'A' | 'B' | 'AB' | 'O' | '-',
    allergies: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });

  // NIK Autocheck & Duplicate Prevention State
  const [nikCheckStatus, setNikCheckStatus] = useState<'idle' | 'checking' | 'duplicate' | 'available'>('idle');
  const [duplicatePatient, setDuplicatePatient] = useState<Patient | null>(null);
  const [nikCheckMessage, setNikCheckMessage] = useState<string | null>(null);

  // Real-time autocheck NIK saat mencapai 16 digit
  React.useEffect(() => {
    const cleanNik = newPatientData.nik.trim();

    // Reset status jika kosong atau kurang dari 16 digit
    if (!cleanNik || cleanNik.length < 16) {
      setNikCheckStatus('idle');
      setDuplicatePatient(null);
      setNikCheckMessage(null);
      return;
    }

    // 1. Cek langsung ke data lokal (patients dari context & backendPatients yang sudah dimuat)
    const localMatch =
      patients.find((p) => p.nik && p.nik.trim() === cleanNik) ||
      backendPatients.find((p) => p.nik && p.nik.trim() === cleanNik);

    if (localMatch) {
      setDuplicatePatient(localMatch);
      setNikCheckStatus('duplicate');
      setNikCheckMessage(`NIK ${cleanNik} sudah terdaftar atas nama ${localMatch.name} (No. RM: ${localMatch.noRM || '-'})`);
      toast.warning(
        `NIK ${cleanNik} sudah terdaftar atas nama ${localMatch.name} (${localMatch.noRM || '-'}). Hindari duplikasi data!`,
        { id: 'nik-duplicate-warning', duration: 5000 }
      );
      return;
    }

    // 2. Jika belum ditemukan di lokal, lakukan pencarian asynchronous ke backend server
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
            setNikCheckMessage(`NIK ${cleanNik} sudah terdaftar di server atas nama ${mapped.name} (No. RM: ${mapped.noRM || '-'})`);
            toast.warning(
              `NIK ${cleanNik} sudah terdaftar atas nama ${mapped.name} (${mapped.noRM || '-'}). Hindari duplikasi data!`,
              { id: 'nik-duplicate-warning', duration: 5000 }
            );
            return;
          }
        }

        // Jika tidak ditemukan kecocokan NIK baik di server maupun lokal
        setDuplicatePatient(null);
        setNikCheckStatus('available');
        setNikCheckMessage(`NIK ${cleanNik} valid (16 digit) dan belum terdaftar. Aman untuk didaftarkan.`);
      } catch (err) {
        console.warn('[NIK AutoCheck] Gagal verifikasi NIK ke backend:', err);
        if (!isMounted) return;
        setDuplicatePatient(null);
        setNikCheckStatus('available');
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [newPatientData.nik, backendPatients, patients]);

  // Fungsi beralih ke pasien terdaftar jika NIK terdeteksi ganda
  const handleUseExistingPatient = (patient: Patient) => {
    // Pastikan data pasien terdaftar di context lokal jika berasal dari backend
    const existsInPatients = patients.some((p) => p.id === patient.id || (p.nik && p.nik === patient.nik));
    if (!existsInPatients) {
      addPatient(patient);
    }
    setActiveTab('EXISTING');
    setSelectedPatient(patient);
    setSearchQuery(patient.name);
    setDuplicatePatient(null);
    setNikCheckStatus('idle');
    toast.info(`Beralih ke Pasien Terdaftar: ${patient.name}`, {
      description: `Data pasien (${patient.noRM || patient.nik}) dipilih untuk pendaftaran.`,
      duration: 5000,
    });
  };


  // Backend Wilayah Data States & Cascading Options (Provinsi, Kab/Kota, Kecamatan, Kelurahan)
  const [provinces, setProvinces] = useState<BackendProvinceItem[]>([]);
  const [cities, setCities] = useState<BackendKabupatenKotaItem[]>([]);
  const [districts, setDistricts] = useState<BackendKecamatanItem[]>([]);
  const [subdistricts, setSubdistricts] = useState<BackendKelurahanItem[]>([]);

  // Loading States for each cascading level
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);

  // Selected region codes to ensure accurate API querying
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedCityCode, setSelectedCityCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedSubdistrictCode, setSelectedSubdistrictCode] = useState('');

  // 1. Initial fetch for provinces: GET /v1/wilayah/provinsi
  React.useEffect(() => {
    let isMounted = true;
    const loadProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const res = await fetchBackendProvinces({ limit: 100 });
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setProvinces(res.data);
        }
      } catch (err) {
        console.warn('[Registration] Gagal memuat data provinsi:', err);
      } finally {
        if (isMounted) setIsLoadingProvinces(false);
      }
    };
    loadProvinces();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Handle Province Change: Fetch Kabupaten/Kota via GET /v1/wilayah/kabupaten-kota?kode_provinsi=XX
  const handleProvinceChange = async (provValue: string) => {
    setNewPatientData((prev) => ({
      ...prev,
      province: provValue,
      city: '',
      district: '',
      subdistrict: '',
    }));
    setCities([]);
    setDistricts([]);
    setSubdistricts([]);
    setSelectedCityCode('');
    setSelectedDistrictCode('');
    setSelectedSubdistrictCode('');

    if (!provValue) {
      setSelectedProvinceCode('');
      return;
    }

    const foundProv = provinces.find(
      (p) => p.nama.toUpperCase() === provValue.toUpperCase() || p.kode === provValue
    );
    const provCode = foundProv ? foundProv.kode : '';
    setSelectedProvinceCode(provCode);

    if (provCode) {
      setIsLoadingCities(true);
      try {
        const res = await fetchBackendKabupatenKota({ kode_provinsi: provCode, limit: 100 });
        if (res.success && res.data) {
          setCities(res.data);
        }
      } catch (err) {
        console.warn('[Registration] Gagal memuat kabupaten/kota:', err);
      } finally {
        setIsLoadingCities(false);
      }
    }
  };

  // 3. Handle City Change: Fetch Kecamatan via GET /v1/wilayah/kecamatan?kode_kabupaten_kota=XXXX
  const handleCityChange = async (cityValue: string) => {
    setNewPatientData((prev) => ({
      ...prev,
      city: cityValue,
      district: '',
      subdistrict: '',
    }));
    setDistricts([]);
    setSubdistricts([]);
    setSelectedDistrictCode('');
    setSelectedSubdistrictCode('');

    if (!cityValue) {
      setSelectedCityCode('');
      return;
    }

    const foundCity = cities.find(
      (c) => c.nama.toUpperCase() === cityValue.toUpperCase() || c.kode === cityValue
    );
    const cityCode = foundCity ? foundCity.kode : '';
    setSelectedCityCode(cityCode);

    if (cityCode) {
      setIsLoadingDistricts(true);
      try {
        const res = await fetchBackendKecamatan({ kode_kabupaten_kota: cityCode, limit: 100 });
        if (res.success && res.data) {
          setDistricts(res.data);
        }
      } catch (err) {
        console.warn('[Registration] Gagal memuat kecamatan:', err);
      } finally {
        setIsLoadingDistricts(false);
      }
    }
  };

  // 4. Handle District Change: Fetch Kelurahan via GET /v1/wilayah/kelurahan?kode_kecamatan=XXXXXX
  const handleDistrictChange = async (distValue: string) => {
    setNewPatientData((prev) => ({
      ...prev,
      district: distValue,
      subdistrict: '',
    }));
    setSubdistricts([]);
    setSelectedSubdistrictCode('');

    if (!distValue) {
      setSelectedDistrictCode('');
      return;
    }

    const foundDist = districts.find(
      (d) => d.nama.toUpperCase() === distValue.toUpperCase() || d.kode === distValue
    );
    const distCode = foundDist ? foundDist.kode : '';
    setSelectedDistrictCode(distCode);

    if (distCode) {
      setIsLoadingSubdistricts(true);
      try {
        const res = await fetchBackendKelurahan({ kode_kecamatan: distCode, limit: 100 });
        if (res.success && res.data) {
          setSubdistricts(res.data);
        }
      } catch (err) {
        console.warn('[Registration] Gagal memuat kelurahan:', err);
      } finally {
        setIsLoadingSubdistricts(false);
      }
    }
  };

  // 5. Handle Subdistrict (Kelurahan) Change
  const handleSubdistrictChange = (subValue: string) => {
    const foundSub = subdistricts.find(
      (s) => s.nama.toUpperCase() === subValue.toUpperCase() || s.kode === subValue
    );
    const subCode = foundSub ? foundSub.kode : '';
    setSelectedSubdistrictCode(subCode);

    setNewPatientData((prev) => {
      const updated = {
        ...prev,
        subdistrict: subValue,
      };
      if (foundSub?.kode_pos && !prev.postalCode) {
        updated.postalCode = String(foundSub.kode_pos);
      }
      return updated;
    });
  };

  // Quick Search Wilayah state (Ketik untuk cari otomatis)
  const [quickWilayahQuery, setQuickWilayahQuery] = useState('');
  const quickWilayahResults = useMemo(() => {
    return searchRegions(quickWilayahQuery, 6);
  }, [quickWilayahQuery]);

  const handleApplyQuickRegion = async (item: RegionSearchResult) => {
    setNewPatientData((prev) => ({
      ...prev,
      province: item.province,
      city: item.city,
      district: item.district,
      subdistrict: item.subdistrict,
    }));
    setQuickWilayahQuery('');
    toast.success(`Wilayah otomatis terisi: ${item.label}`);

    // Synchronize backend options if possible
    try {
      const prov = provinces.find(
        (p) =>
          p.nama.toUpperCase() === item.province.toUpperCase() ||
          normalizeRegionName(p.nama).toLowerCase() === normalizeRegionName(item.province).toLowerCase()
      );
      if (prov) {
        setSelectedProvinceCode(prov.kode);
        setIsLoadingCities(true);
        const cityRes = await fetchBackendKabupatenKota({ kode_provinsi: prov.kode, limit: 100 });
        setIsLoadingCities(false);
        if (cityRes.success && cityRes.data) {
          setCities(cityRes.data);
          const cityItem = cityRes.data.find(
            (c) =>
              c.nama.toUpperCase() === item.city.toUpperCase() ||
              c.nama.toLowerCase().includes(item.city.toLowerCase()) ||
              item.city.toLowerCase().includes(c.nama.toLowerCase())
          );
          if (cityItem) {
            setSelectedCityCode(cityItem.kode);
            setIsLoadingDistricts(true);
            const distRes = await fetchBackendKecamatan({ kode_kabupaten_kota: cityItem.kode, limit: 100 });
            setIsLoadingDistricts(false);
            if (distRes.success && distRes.data) {
              setDistricts(distRes.data);
              const distItem = distRes.data.find(
                (d) =>
                  d.nama.toUpperCase() === item.district.toUpperCase() ||
                  d.nama.toLowerCase().includes(item.district.toLowerCase())
              );
              if (distItem) {
                setSelectedDistrictCode(distItem.kode);
                setIsLoadingSubdistricts(true);
                const subRes = await fetchBackendKelurahan({ kode_kecamatan: distItem.kode, limit: 100 });
                setIsLoadingSubdistricts(false);
                if (subRes.success && subRes.data) {
                  setSubdistricts(subRes.data);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Registration] Quick region backend sync notice:', e);
    }
  };

  const provinceOptions = useMemo(() => {
    return provinces.map((p) => ({
      value: p.nama,
      label: p.nama,
      sublabel: `Kode: ${p.kode}`,
    }));
  }, [provinces]);

  const cityOptions = useMemo(() => {
    return cities.map((c) => ({
      value: c.nama,
      label: c.nama,
      sublabel: `${c.tipe ? c.tipe.toUpperCase() : 'KOTA/KAB'} • Kode: ${c.kode}`,
    }));
  }, [cities]);

  const districtOptions = useMemo(() => {
    return districts.map((d) => ({
      value: d.nama,
      label: d.nama,
      sublabel: `Kecamatan • Kode: ${d.kode}`,
    }));
  }, [districts]);

  const subdistrictOptions = useMemo(() => {
    return subdistricts.map((s) => ({
      value: s.nama,
      label: s.nama,
      sublabel: `${s.tipe ? s.tipe.toUpperCase() : 'Kelurahan/Desa'} • Kode: ${s.kode}${s.kode_pos ? ` • Pos: ${s.kode_pos}` : ''}`,
    }));
  }, [subdistricts]);

  // Hari ini dalam Bahasa Indonesia (Senin, Selasa, Rabu, dll.)
  const todayDayName = useMemo(() => {
    return INDONESIAN_DAYS[new Date().getDay()];
  }, []);

  // Filter dokter yang aktif dan memiliki jadwal praktik pada hari ini
  const availableDoctorsToday = useMemo(() => {
    return doctors.filter((d) => isDoctorPracticingOnDay(d, todayDayName));
  }, [doctors, todayDayName]);

  // Visit Configuration State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // Sinkronisasi dokter yang dipilih: otomatis pilih dokter yang praktik hari ini
  useEffect(() => {
    if (availableDoctorsToday.length === 0) {
      setSelectedDoctorId('');
      return;
    }
    const isCurrentValid = availableDoctorsToday.some((d) => d.id === selectedDoctorId);
    if (!isCurrentValid) {
      const preferred = availableDoctorsToday.find((d) => d.id === config.activeDoctorId);
      setSelectedDoctorId(preferred ? preferred.id : availableDoctorsToday[0].id);
    }
  }, [availableDoctorsToday, config.activeDoctorId, selectedDoctorId]);

  const [paymentType, setPaymentType] = useState<PaymentType>('UMUM');
  const [chiefComplaint, setChiefComplaint] = useState('');

  // Dokter yang terpilih dari dokter yang praktik hari ini
  const currentDoctor = useMemo(() => {
    if (!selectedDoctorId) return null;
    return availableDoctorsToday.find((d) => d.id === selectedDoctorId) || null;
  }, [availableDoctorsToday, selectedDoctorId]);

  // Jam layanan otomatis menyesuaikan jadwal dokter yang dipilih
  const serviceHours = useMemo(() => {
    if (!currentDoctor) return { start: '--:--', end: '--:--' };
    let start = currentDoctor.scheduleStartTime || '08:00';
    let end = currentDoctor.scheduleEndTime || '14:00';
    if (!currentDoctor.scheduleStartTime && currentDoctor.scheduleHours) {
      const parts = currentDoctor.scheduleHours.split('-').map((s) => s.trim());
      if (parts.length === 2) {
        start = parts[0];
        end = parts[1];
      }
    }
    return { start, end };
  }, [currentDoctor]);

  // Total daily quota configured in Setup Dokter (defaults to 20 if unset)
  const totalDailyQuota = currentDoctor?.dailyQuota ?? 20;

  // Live quota tracking for selected doctor today
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayDoctorVisitsCount = useMemo(() => {
    if (!currentDoctor) return 0;
    return visits.filter((v) => v.doctorId === currentDoctor.id && v.date === todayStr).length;
  }, [visits, currentDoctor, todayStr]);

  // Sisa kuota dan status ketersediaan dokter
  const remainingQuota = currentDoctor ? Math.max(0, totalDailyQuota - todayDoctorVisitsCount) : 0;
  const isQuotaFull = currentDoctor ? remainingQuota <= 0 : false;
  const hasNoDoctor = !currentDoctor;

  // Sync when doctor selection changes
  const handleDoctorChange = (docId: string) => {
    setSelectedDoctorId(docId);
  };

  // Search existing patients (combining backend GET /v1/patients with local context)
  const filteredPatients = useMemo(() => {
    const map = new Map<string, Patient>();
    // Priority: backend patients
    backendPatients.forEach((p) => {
      const key = p.id || p.noRM || p.nik;
      if (key) map.set(key, p);
    });
    // Secondary: local context patients
    patients.forEach((p) => {
      const key = p.id || p.noRM || p.nik;
      if (key && !map.has(key)) map.set(key, p);
    });

    const all = Array.from(map.values());
    if (!searchQuery.trim()) {
      return all.slice(0, 15);
    }
    const q = searchQuery.toLowerCase().trim();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.noRM && p.noRM.toLowerCase().includes(q)) ||
        (p.nik && p.nik.includes(q)) ||
        (p.phone && p.phone.includes(q))
    );
  }, [backendPatients, patients, searchQuery]);

  const calculatedNewAge = calculateAge(newPatientData.birthDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetPatient = selectedPatient;

    if (activeTab === 'NEW') {
      const currentNik = newPatientData.nik.trim();

      if (!newPatientData.name.trim()) {
        toast.error('Nama lengkap pasien wajib diisi');
        return;
      }

      if (!currentNik) {
        toast.error('NIK pasien wajib diisi (16 digit)');
        return;
      }

      if (currentNik.length !== 16) {
        toast.error('NIK harus terdiri dari 16 digit angka');
        return;
      }

      // Validasi anti data ganda (double data prevention)
      const existingDuplicate =
        duplicatePatient ||
        patients.find((p) => p.nik && p.nik.trim() === currentNik) ||
        backendPatients.find((p) => p.nik && p.nik.trim() === currentNik);

      if (existingDuplicate) {
        toast.error(
          `Pendaftaran dibatalkan: NIK ${currentNik} sudah terdaftar atas nama ${existingDuplicate.name} (${existingDuplicate.noRM || '-'}). Silakan gunakan data pasien yang sudah ada untuk menghindari data ganda!`,
          { duration: 6000 }
        );
        return;
      }

      if (!newPatientData.birthDate) {
        toast.error('Tanggal lahir pasien wajib diisi');
        return;
      }

      setIsSubmitting(true);
      const loadingToastId = toast.loading('Mendaftarkan data pasien ke backend server...');

      // 1. Generate No RM
      const nextSeq = patients.length + 1;
      const generatedNoRM = generateNoRM(nextSeq);

      // 2. Parse allergies array
      const allergiesList = newPatientData.allergies
        ? newPatientData.allergies
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean)
        : [];

      // 3. Prepare emergency contact object
      const emergencyContactObj = newPatientData.emergencyName.trim()
        ? {
            name: newPatientData.emergencyName.trim(),
            phone: newPatientData.emergencyPhone.trim(),
            relationship: newPatientData.emergencyRelation.trim() || 'Keluarga',
          }
        : {};

      // 4. Assemble payload matching POST /v1/patients
      const backendPayload: BackendPatientPayload = {
        no_rm: generatedNoRM,
        nik: newPatientData.nik.trim(),
        name: newPatientData.name.trim(),
        gender: newPatientData.gender,
        birth_date: newPatientData.birthDate,
        phone: newPatientData.phone.trim(),
        street_address: newPatientData.streetAddress.trim(),
        rt_rw: newPatientData.rtRw.trim(),
        province: newPatientData.province,
        city: newPatientData.city,
        district: newPatientData.district,
        subdistrict: newPatientData.subdistrict,
        postal_code: newPatientData.postalCode.trim(),
        blood_type: newPatientData.bloodType,
        allergies: allergiesList,
        emergency_contact: emergencyContactObj,
      };

      // 5. Send POST request to backend API: https://privata.nafada.id/v1/patients
      const backendRes = await createBackendPatient(backendPayload);

      // Assemble full address string for local storage & display
      const fullAddressParts = [
        newPatientData.streetAddress?.trim(),
        newPatientData.rtRw?.trim() ? `RT/RW ${newPatientData.rtRw.trim()}` : null,
        newPatientData.subdistrict ? `Kel. ${newPatientData.subdistrict}` : null,
        newPatientData.district ? `Kec. ${newPatientData.district}` : null,
        newPatientData.city,
        newPatientData.province,
        newPatientData.postalCode ? `Kode Pos ${newPatientData.postalCode.trim()}` : null,
      ].filter(Boolean);
      const assembledAddress = fullAddressParts.join(', ');

      const resolvedNoRM = backendRes.data?.no_rm || backendRes.data?.noRM || generatedNoRM;
      const resolvedId = backendRes.data?.id;

      // Add to local state context
      targetPatient = addPatient({
        id: resolvedId,
        noRM: resolvedNoRM,
        nik: newPatientData.nik.trim(),
        name: newPatientData.name.trim(),
        gender: newPatientData.gender,
        birthDate: newPatientData.birthDate,
        age: calculatedNewAge,
        phone: newPatientData.phone.trim() || '',
        address: assembledAddress,
        streetAddress: newPatientData.streetAddress.trim(),
        rtRw: newPatientData.rtRw.trim(),
        province: newPatientData.province,
        city: newPatientData.city,
        district: newPatientData.district,
        subdistrict: newPatientData.subdistrict,
        postalCode: newPatientData.postalCode.trim(),
        bloodType: newPatientData.bloodType,
        allergies: allergiesList,
        emergencyContact: newPatientData.emergencyName.trim()
          ? {
              name: newPatientData.emergencyName.trim(),
              phone: newPatientData.emergencyPhone.trim(),
              relationship: newPatientData.emergencyRelation.trim() || 'Keluarga',
            }
          : undefined,
      });

      if (backendRes.success) {
        toast.success(
          `Pasien ${targetPatient.name} (${resolvedNoRM}) berhasil tersimpan di server backend!`,
          { id: loadingToastId, duration: 4000 }
        );
        loadBackendPatients();
      } else {
        console.warn('[Registration] Backend notice:', backendRes.error);
        toast.info(
          `Pasien tersimpan di antrian lokal. (Catatan Server: ${backendRes.error})`,
          { id: loadingToastId, duration: 5000 }
        );
      }

      setIsSubmitting(false);
    }

    if (!targetPatient) {
      toast.error('Pilih atau daftarkan pasien terlebih dahulu');
      return;
    }

    // Pastikan targetPatient terdaftar di context patients jika berasal dari backend
    const currentTargetPatient = targetPatient;
    if (!patients.some((p) => p.id === currentTargetPatient.id)) {
      targetPatient = addPatient(currentTargetPatient);
    }

    // Validasi ketersediaan dokter praktik hari ini
    if (hasNoDoctor || !currentDoctor) {
      toast.error(
        `Pendaftaran tidak dapat diproses: tidak ada dokter yang memiliki jadwal praktik hari ini (${todayDayName}).`
      );
      return;
    }

    if (isQuotaFull) {
      toast.error(
        `Kuota harian untuk ${currentDoctor.name} sudah habis (${totalDailyQuota} pasien). Silakan tambah kuota pada menu Setup Dokter atau pilih dokter lain.`
      );
      return;
    }

    try {
      const visit = createVisit(targetPatient.id, {
        doctorId: currentDoctor.id,
        paymentType,
        chiefComplaint: chiefComplaint.trim(),
        serviceHours: `${serviceHours.start} - ${serviceHours.end}`,
        patientQuota: Math.max(0, remainingQuota - 1),
        patient: targetPatient,
      });

      // Open ticket printing modal immediately
      setRegisteredVisitForTicket(visit);

      toast.success(
        `Kunjungan berhasil dibuat! Nomor Antrian: ${visit.queueNumber} (${targetPatient.name})`,
        { duration: 5000 }
      );

      // Reset form
      setChiefComplaint('');
      if (activeTab === 'NEW') {
        setActiveTab('EXISTING');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mendaftarkan kunjungan');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <CalendarPlus className="h-6 w-6 text-emerald-700" />
              <span>Pendaftaran Kunjungan & Antrian Pasien</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Daftarkan pasien lama atau buat data pasien baru dengan data wilayah terstruktur untuk mendapatkan nomor antrian hari ini.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Backend Terhubung (GET/POST /v1/patients)</span>
                <span className="text-[11px] font-normal text-emerald-600">
                  | {backendTotal} Pasien Terdaftar
                </span>
              </div>
              {isLoadingBackend && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                  Sinkronisasi...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/queue/display" target="_blank">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl shadow-2xs cursor-pointer h-9"
              >
                <Tv className="h-3.5 w-3.5 text-emerald-700" />
                <span>Display TV</span>
              </Button>
            </Link>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/queue')}
              className="text-xs gap-1.5 bg-white shadow-2xs rounded-xl font-bold h-9"
            >
              <Clock className="h-3.5 w-3.5 text-emerald-700" />
              <span>Lihat Antrian</span>
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 2-Column Balanced Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Step 1: Patient Selection & Registration (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border border-slate-200 bg-white shadow-xs p-5 space-y-4 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-white text-xs font-bold">1</span>
                    <span>Pilih Tipe Pasien</span>
                  </h3>

                  {/* Mode Toggle Pills */}
                  <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 text-xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('EXISTING');
                        setSelectedPatient(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        activeTab === 'EXISTING'
                          ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Pasien Lama</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('NEW');
                        setSelectedPatient(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        activeTab === 'NEW'
                          ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Pasien Baru</span>
                    </button>
                  </div>
                </div>

                {/* Existing Patient Search */}
                {activeTab === 'EXISTING' ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Cari pasien lama berdasarkan Nama, NIK, No. RM, No. HP..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs bg-white rounded-xl"
                      />
                    </div>

                    {/* Selected Patient Banner */}
                    {selectedPatient ? (
                      <div className="rounded-2xl border-2 border-emerald-600 bg-emerald-50/70 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white font-bold text-base">
                            {selectedPatient.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{selectedPatient.name}</span>
                              <Badge variant="outline" className="text-[10px] bg-white font-mono text-emerald-800 font-bold">
                                {selectedPatient.noRM}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              NIK: {selectedPatient.nik} • {selectedPatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • {selectedPatient.age || 30} th • {selectedPatient.phone}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span className="truncate">{selectedPatient.address}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPatient(null)}
                          className="text-xs h-8 text-slate-600 bg-white"
                        >
                          Ganti Pasien
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-80 overflow-y-auto rounded-lg border border-slate-200 p-2 bg-slate-50/50 divide-y divide-slate-100">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Hasil Pencarian Pasien
                        </div>
                        {filteredPatients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPatient(p)}
                            className="flex w-full items-center justify-between rounded-lg p-2.5 text-left hover:bg-white hover:shadow-2xs transition-all text-xs cursor-pointer border border-transparent hover:border-slate-200"
                          >
                            <div>
                              <span className="font-bold text-slate-900">{p.name}</span>{' '}
                              <span className="text-blue-600 font-mono font-semibold">({p.noRM})</span>
                              {(p as any).isFromBackend && (
                                <Badge variant="outline" className="ml-1.5 text-[9px] bg-emerald-50 text-emerald-700 border-emerald-300 font-medium">
                                  Server Backend
                                </Badge>
                              )}
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                NIK: {p.nik} • {p.phone} • {p.gender === 'L' ? 'Laki-laki' : 'Perempuan'} ({p.age || 30} th)
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {p.address}
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 shrink-0">
                              Pilih Pasien →
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* New Patient Registration Form */
                  <div className="space-y-4 pt-1">
                    {/* Basic Patient Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Nama Lengkap Pasien <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          required
                          placeholder="Nama Lengkap sesuai KTP"
                          value={newPatientData.name}
                          onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                          className="h-8 text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <span>NIK (Nomor Induk Kependudukan)</span>
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
                                NIK Sudah Pernah Terdaftar!
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
                                newPatientData.nik.length === 16
                                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {newPatientData.nik.length}/16 digit
                            </span>
                          </div>
                        </div>

                        <div className="relative">
                          <Input
                            required
                            placeholder="16 Digit Nomor KTP (Wajib angka)"
                            maxLength={16}
                            value={newPatientData.nik}
                            onChange={(e) =>
                              setNewPatientData({
                                ...newPatientData,
                                nik: e.target.value.replace(/\D/g, ''),
                              })
                            }
                            className={`h-9 text-xs font-mono pr-9 bg-white transition-all ${
                              nikCheckStatus === 'duplicate'
                                ? 'border-rose-400 focus-visible:ring-rose-400/30 bg-rose-50/20 text-rose-950 font-semibold'
                                : nikCheckStatus === 'available'
                                ? 'border-emerald-400 focus-visible:ring-emerald-400/30 bg-emerald-50/20 text-emerald-950'
                                : nikCheckStatus === 'checking'
                                ? 'border-blue-400 focus-visible:ring-blue-400/30'
                                : ''
                            }`}
                          />
                          <div className="absolute right-2.5 top-2.5 pointer-events-none">
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

                        {/* Helper saat belum 16 digit */}
                        {newPatientData.nik.length > 0 && newPatientData.nik.length < 16 && (
                          <p className="text-[10px] text-slate-400">
                            Masukkan 16 digit NIK KTP pasien (kurang {16 - newPatientData.nik.length} digit lagi untuk verifikasi).
                          </p>
                        )}

                        {/* Duplicate Patient Alert Card */}
                        {nikCheckStatus === 'duplicate' && duplicatePatient && (
                          <div className="rounded-xl border-2 border-rose-300 bg-linear-to-br from-rose-50 via-white to-amber-50/60 p-3.5 shadow-sm space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                                  <AlertCircle className="h-4 w-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-rose-900">
                                    Peringatan: Pasien Sudah Pernah Terdaftar!
                                  </h4>
                                  <p className="text-[11px] text-rose-700">
                                    NIK ini sudah tercatat dalam sistem. Sistem mencegah pembuatan rekam medis ganda (*double data*).
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[10px] bg-rose-100/80 border-rose-300 text-rose-800 shrink-0 font-bold">
                                Duplikasi Terdeteksi
                              </Badge>
                            </div>

                            {/* Detailed Existing Patient Info */}
                            <div className="bg-white/95 rounded-lg border border-rose-200 p-2.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[10px] font-medium">Nama Pasien</span>
                                <strong className="text-slate-900 font-semibold">{duplicatePatient.name}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-medium">No. Rekam Medis (RM)</span>
                                <strong className="text-blue-700 font-mono font-semibold">{duplicatePatient.noRM || '-'}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-medium">Jenis Kelamin / Usia</span>
                                <span className="text-slate-700 font-medium">
                                  {duplicatePatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} &bull; {duplicatePatient.age || '-'} th
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-medium">No. Telepon / WA</span>
                                <span className="text-slate-700 font-medium">{duplicatePatient.phone || '-'}</span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-slate-400 block text-[10px] font-medium">Alamat Terdaftar</span>
                                <span className="text-slate-700 truncate block">
                                  {duplicatePatient.address || duplicatePatient.streetAddress || '-'}
                                </span>
                              </div>
                            </div>

                            {/* Action Button to switch to existing patient */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-rose-100">
                              <span className="text-[11px] text-slate-500 italic">
                                Klik tombol di samping untuk langsung menggunakan data pasien ini:
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleUseExistingPatient(duplicatePatient)}
                                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Gunakan Pasien Ini (Beralih ke Pasien Lama)</span>
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Available Helper */}
                        {nikCheckStatus === 'available' && (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50/80 border border-emerald-200 px-2.5 py-1 rounded-lg animate-in fade-in">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>NIK valid (16 digit) dan belum terdaftar di sistem. Anda dapat melanjutkan pendaftaran.</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          No. WhatsApp / HP <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          required
                          placeholder="0812-xxxx-xxxx"
                          value={newPatientData.phone}
                          onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                          className="h-8 text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Jenis Kelamin <span className="text-rose-500">*</span>
                        </label>
                        <Select
                          value={newPatientData.gender}
                          onChange={(e) =>
                            setNewPatientData({ ...newPatientData, gender: e.target.value as Gender })
                          }
                          className="h-8 text-xs bg-white"
                        >
                          <option value="L">Laki-laki (L)</option>
                          <option value="P">Perempuan (P)</option>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Golongan Darah
                        </label>
                        <Select
                          value={newPatientData.bloodType}
                          onChange={(e) =>
                            setNewPatientData({ ...newPatientData, bloodType: e.target.value as any })
                          }
                          className="h-8 text-xs bg-white"
                        >
                          <option value="-">- (Belum Tahu)</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-slate-700">
                            Tanggal Lahir <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[11px] text-emerald-700 font-semibold">{calculatedNewAge} Tahun</span>
                        </div>
                        <Input
                          type="date"
                          required
                          value={newPatientData.birthDate}
                          onChange={(e) =>
                            setNewPatientData({ ...newPatientData, birthDate: e.target.value })
                          }
                          className="h-8 text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Riwayat Alergi (Opsional)
                        </label>
                        <Input
                          placeholder="contoh: Amoxicillin, Seafood"
                          value={newPatientData.allergies}
                          onChange={(e) =>
                            setNewPatientData({ ...newPatientData, allergies: e.target.value })
                          }
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Structured Indonesian Address Section with Searchable Inputs & Quick Autofill */}
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

                      {/* Smart Quick Search Wilayah (Ketik untuk isi otomatis) */}
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
                                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 shrink-0 ml-2">
                                  Pilih Otomatis
                                </Badge>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {/* Provinsi */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                            <span>Provinsi <span className="text-rose-500">*</span></span>
                            {provinces.length > 0 && (
                              <span className="text-[10px] text-blue-600 font-normal">{provinces.length} provinsi</span>
                            )}
                          </label>
                          <SearchableSelect
                            value={newPatientData.province}
                            onChange={handleProvinceChange}
                            options={provinceOptions}
                            placeholder="-- Cari / Pilih Provinsi --"
                            searchPlaceholder="Ketik nama provinsi (misal: Jawa Tengah, DKI Jakarta)..."
                            isLoading={isLoadingProvinces}
                            loadingPlaceholder="Memuat daftar provinsi..."
                          />
                        </div>

                        {/* Kota / Kabupaten */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                            <span>Kota / Kabupaten <span className="text-rose-500">*</span></span>
                            {cities.length > 0 && (
                              <span className="text-[10px] text-blue-600 font-normal">{cities.length} pilihan</span>
                            )}
                          </label>
                          <SearchableSelect
                            value={newPatientData.city}
                            onChange={handleCityChange}
                            options={cityOptions}
                            disabled={!newPatientData.province}
                            placeholder="-- Cari / Pilih Kota / Kab --"
                            disabledPlaceholder="-- Pilih Provinsi Terlebih Dahulu --"
                            searchPlaceholder="Ketik nama kota/kabupaten..."
                            isLoading={isLoadingCities}
                            loadingPlaceholder="Memuat kota/kabupaten..."
                          />
                        </div>

                        {/* Kecamatan */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                            <span>Kecamatan <span className="text-rose-500">*</span></span>
                            {districts.length > 0 && (
                              <span className="text-[10px] text-blue-600 font-normal">{districts.length} pilihan</span>
                            )}
                          </label>
                          <SearchableSelect
                            value={newPatientData.district}
                            onChange={handleDistrictChange}
                            options={districtOptions}
                            disabled={!newPatientData.city}
                            placeholder="-- Cari / Pilih Kecamatan --"
                            disabledPlaceholder="-- Pilih Kota / Kab Terlebih Dahulu --"
                            searchPlaceholder="Ketik nama kecamatan..."
                            isLoading={isLoadingDistricts}
                            loadingPlaceholder="Memuat kecamatan..."
                          />
                        </div>

                        {/* Kelurahan / Desa */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                            <span>Kelurahan / Desa <span className="text-rose-500">*</span></span>
                            {subdistricts.length > 0 && (
                              <span className="text-[10px] text-blue-600 font-normal">{subdistricts.length} pilihan</span>
                            )}
                          </label>
                          <SearchableSelect
                            value={newPatientData.subdistrict}
                            onChange={handleSubdistrictChange}
                            options={subdistrictOptions}
                            disabled={!newPatientData.district}
                            placeholder="-- Cari / Pilih Kelurahan / Desa --"
                            disabledPlaceholder="-- Pilih Kecamatan Terlebih Dahulu --"
                            searchPlaceholder="Ketik nama kelurahan atau desa..."
                            isLoading={isLoadingSubdistricts}
                            loadingPlaceholder="Memuat kelurahan/desa..."
                          />
                        </div>

                        {/* Detail Jalan & RT / RW */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[11px] font-semibold text-slate-600">
                            Nama Jalan, No. Rumah, RT/RW & Kode Pos
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                            <Input
                              placeholder="Jl. Nama Jalan No. XX..."
                              value={newPatientData.streetAddress}
                              onChange={(e) =>
                                setNewPatientData({ ...newPatientData, streetAddress: e.target.value })
                              }
                              className="h-8 text-xs bg-white sm:col-span-3"
                            />
                            <Input
                              placeholder="RT 01 / RW 02"
                              value={newPatientData.rtRw}
                              onChange={(e) =>
                                setNewPatientData({ ...newPatientData, rtRw: e.target.value })
                              }
                              className="h-8 text-xs bg-white sm:col-span-2"
                            />
                            <Input
                              placeholder="Kode Pos"
                              maxLength={5}
                              value={newPatientData.postalCode}
                              onChange={(e) =>
                                setNewPatientData({
                                  ...newPatientData,
                                  postalCode: e.target.value.replace(/\D/g, ''),
                                })
                              }
                              className="h-8 text-xs bg-white sm:col-span-1 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Kontak Darurat (Opsional) */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <PhoneCall className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Kontak Darurat (Opsional)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          placeholder="Nama Kontak (misal: Ibu)"
                          value={newPatientData.emergencyName}
                          onChange={(e) =>
                            setNewPatientData({ ...newPatientData, emergencyName: e.target.value })
                          }
                          className="h-8 text-xs bg-white"
                        />
                        <Input
                          placeholder="No. HP Kontak"
                          value={newPatientData.emergencyPhone}
                          onChange={(e) =>
                            setNewPatientData({ ...newPatientData, emergencyPhone: e.target.value })
                          }
                          className="h-8 text-xs bg-white"
                        />
                        <Input
                          placeholder="Hubungan (Ibu/Ayah/Pasangan)"
                          value={newPatientData.emergencyRelation}
                          onChange={(e) =>
                            setNewPatientData({ ...newPatientData, emergencyRelation: e.target.value })
                          }
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Step 2: Doctor & Visit Info (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border border-slate-200 bg-white shadow-xs p-5 space-y-4 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-white text-xs font-bold">2</span>
                  <span>Informasi Kunjungan Medis</span>
                </h3>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        Dokter Pemeriksa <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Praktik Hari Ini: {todayDayName}
                      </span>
                    </div>
                    {availableDoctorsToday.length > 0 ? (
                      <Select
                        value={selectedDoctorId}
                        onChange={(e) => handleDoctorChange(e.target.value)}
                        className="bg-white h-9 rounded-xl"
                      >
                        {availableDoctorsToday.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.specialty}){d.poli ? ` • ${d.poli}` : ''}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Select
                        value=""
                        disabled
                        className="bg-slate-50 text-slate-400 h-9 rounded-xl border-dashed border-rose-300 cursor-not-allowed"
                      >
                        <option value="">
                          -- Tidak ada dokter praktik hari ini ({todayDayName}) --
                        </option>
                      </Select>
                    )}

                    {availableDoctorsToday.length === 0 && (
                      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs mt-1.5">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="leading-snug">
                          <span className="font-semibold">Tidak ada dokter dengan jadwal praktik hari ini ({todayDayName}).</span>
                          <p className="text-[11px] text-amber-700 mt-0.5">
                            Dokter tanpa jadwal praktik pada hari ini tidak akan ditampilkan pada antrian. Anda dapat memeriksa atau menambah jadwal praktik di menu{' '}
                            <Link href="/settings/doctors" className="underline font-bold text-amber-900 hover:text-emerald-700">
                              Setup Dokter
                            </Link>.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Jam Layanan & Kuota Pasien (Disabled / Sesuai Setup Dokter) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                    {/* Jam Layanan (Mulai s/d Selesai - Disabled) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Jam Layanan</span>
                        <span className="text-[10px] text-slate-400 font-normal">(Otomatis)</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="text"
                          value={serviceHours.start}
                          disabled
                          readOnly
                          className="h-9 text-xs bg-slate-100/90 text-slate-700 text-center font-mono font-bold rounded-xl border-slate-200 cursor-not-allowed select-none shadow-2xs"
                          title="Jam Mulai Layanan (Sesuai Jadwal Dokter)"
                        />
                        <span className="text-xs text-slate-400 font-semibold select-none">s/d</span>
                        <Input
                          type="text"
                          value={serviceHours.end}
                          disabled
                          readOnly
                          className="h-9 text-xs bg-slate-100/90 text-slate-700 text-center font-mono font-bold rounded-xl border-slate-200 cursor-not-allowed select-none shadow-2xs"
                          title="Jam Selesai Layanan (Sesuai Jadwal Dokter)"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {currentDoctor
                          ? `WIB (Sesuai jadwal praktik ${todayDayName})`
                          : 'WIB (Menunggu dokter tersedia)'}
                      </p>
                    </div>

                    {/* Kuota Pasien (Berkurang otomatis saat antrian diterbitkan - Disabled) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-emerald-700" />
                          <span>Kuota Pasien</span>
                        </span>
                        {currentDoctor && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              isQuotaFull
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : remainingQuota <= 3
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {isQuotaFull
                              ? '⚠️ Kuota Penuh'
                              : `Sisa ${remainingQuota} dari ${totalDailyQuota}`}
                          </span>
                        )}
                      </label>
                      <Input
                        type="text"
                        value={
                          hasNoDoctor
                            ? 'Tidak Ada Dokter'
                            : remainingQuota > 0
                            ? `${remainingQuota} Pasien Tersisa`
                            : '0 Pasien (Kuota Habis)'
                        }
                        disabled
                        readOnly
                        className={`h-9 text-xs text-center font-mono font-bold rounded-xl border-slate-200 cursor-not-allowed select-none w-full shadow-2xs ${
                          hasNoDoctor
                            ? 'bg-slate-100 text-slate-400'
                            : isQuotaFull
                            ? 'bg-rose-50 text-rose-700 border-rose-300 font-extrabold'
                            : 'bg-slate-100/90 text-slate-800'
                        }`}
                        title="Sisa Kuota Pasien Hari Ini (Berkurang otomatis saat antrian didaftarkan)"
                      />
                      <p className={`text-[10px] truncate ${hasNoDoctor ? 'text-slate-400' : isQuotaFull ? 'text-rose-600 font-bold' : 'text-slate-500 font-medium'}`}>
                        {hasNoDoctor
                          ? 'Tidak ada dokter berpraktik hari ini'
                          : isQuotaFull
                          ? '⚠️ Kuota dokter hari ini sudah penuh!'
                          : `Total kuota harian: ${totalDailyQuota} pasien (${todayDoctorVisitsCount} terdaftar hari ini)`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Jenis Penjamin / Pembayaran <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                      className="bg-white h-9 rounded-xl"
                    >
                      <option value="UMUM">Pasien Umum / Tunai Mandiri</option>
                      <option value="BPJS">BPJS Kesehatan (Faskes Primer)</option>
                      <option value="ASURANSI_SWASTA">Asuransi Swasta / Korporat</option>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Keluhan Awal Pasien / Alasan Kunjungan
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="Contoh: Demam 3 hari, pusing, batuk berdahak..."
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      className="bg-white text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <Button
                    type="submit"
                    disabled={hasNoDoctor || isQuotaFull || isSubmitting}
                    className={`w-full gap-2 font-bold shadow-xs h-10 text-xs rounded-xl ${
                      hasNoDoctor || isQuotaFull
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200 border border-slate-300'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Mendaftarkan ke Server Backend...</span>
                      </>
                    ) : hasNoDoctor ? (
                      <>
                        <Clock className="h-4 w-4" />
                        <span>Tidak Ada Dokter Praktik Hari Ini</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        <span>{isQuotaFull ? 'Kuota Dokter Hari Ini Penuh' : 'Daftarkan & Terbitkan Antrian'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>

        {/* Modal Cetak Karcis / Tiket Antrian Langsung */}
        {registeredVisitForTicket && (
          <QueueTicketModal
            open={!!registeredVisitForTicket}
            onOpenChange={(open) => {
              if (!open) {
                setRegisteredVisitForTicket(null);
              }
            }}
            visit={registeredVisitForTicket}
          />
        )}
      </div>
    </MainLayout>
  );
}
