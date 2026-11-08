export type Role = 'DOCTOR' | 'ADMIN' | 'NURSE' | 'PHARMACIST' | 'SUPERADMIN' | 'SAAS_ADMIN';

export type UserRole = Role;

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type AppMode = 'DOCTOR_ONLY' | 'DOCTOR_AND_ADMIN';

export type Theme = 'light' | 'dark';

export type Gender = 'L' | 'P'; // Laki-laki / Perempuan

export type VisitStatus = 
  | 'DRAFT'
  | 'REGISTERED'
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'WAITING_PAYMENT'
  | 'PAID'
  | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS' | 'BPJS' | 'INSURANCE';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export type PaymentType = 'UMUM' | 'BPJS' | 'ASURANSI_SWASTA';

export interface Patient {
  id: string;
  noRM: string; // e.g. RM-2026-0001
  nik: string; // 16 digits
  name: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD
  age?: number;
  phone: string;
  address: string; // Full address string
  streetAddress?: string; // e.g. Jl. Kemang Timur No. 12
  rtRw?: string; // e.g. RT 04 / RW 02
  province?: string; // e.g. DKI Jakarta
  city?: string; // e.g. Kota Jakarta Selatan
  district?: string; // e.g. Mampang Prapatan (Kecamatan)
  subdistrict?: string; // e.g. Bangka (Kelurahan/Desa)
  postalCode?: string;
  bloodType?: 'A' | 'B' | 'AB' | 'O' | '-';
  allergies?: string[]; // e.g. ['Penisilin', 'Aspirin']
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VitalSigns {
  systolic: number; // mmHg
  diastolic: number; // mmHg
  heartRate: number; // bpm
  temperature: number; // Celcius
  respiratoryRate: number; // x/min
  weight: number; // kg
  height: number; // cm
  bmi?: number;
  bmiCategory?: 'Underweight' | 'Normal' | 'Overweight' | 'Obesitas';
  oxygenSaturation?: number; // %
}

export interface DiagnosisItem {
  code: string; // ICD-10 Code e.g. J00, I10, K29.7
  name: string; // Indonesian / Medical name
  type: 'PRIMARY' | 'SECONDARY';
  notes?: string;
}

export interface ProcedureItem {
  id: string;
  code: string;
  name: string;
  price: number;
  category?: string;
  notes?: string;
  discountType?: 'PERCENTAGE' | 'NOMINAL';
  discountPercent?: number;
  discountAmount?: number;
  finalPrice?: number;
  discountReason?: string;
}

export interface RacikanIngredient {
  id: string;
  medicationId: string;
  name: string;
  dosage?: string;
  quantity: number; // Decimal support (e.g. 2.5)
  unit: string;
  price: number;
}

export type RacikanType = 'PULVERES' | 'KAPSUL' | 'SALEP' | 'SIRUP' | 'LAINNYA';

export type PrescriptionDispenseStatus =
  | 'WAITING_REVIEW' // Menunggu Telaah Resep
  | 'PREPARING'      // Sedang Diracik / Disiapkan
  | 'READY_FOR_PICKUP' // Selesai & Siap Diambil Pasien
  | 'DISPENSED';     // Obat Telah Diserahkan

export type MedicationLabelType = 'WHITE' | 'BLUE'; // Etiket Putih (Obat Dalam) vs Etiket Biru (Obat Luar)

export type MedicationTiming =
  | 'BEFORE_MEAL'    // Sebelum Makan
  | 'AFTER_MEAL'     // Sesudah Makan
  | 'WITH_MEAL'      // Bersama Makan
  | 'EMPTY_STOMACH'  // Saat Perut Kosong
  | 'BEFORE_SLEEP'   // Sebelum Tidur (Malam)
  | 'AS_NEEDED';     // Bila Perlu / Sakit

export type MedicationLabelData = MedicationLabelItem;

export interface MedicationLabelItem {
  id: string;
  prescriptionId?: string;
  medicationName: string;
  dosage?: string;
  quantity: number;
  unit: string;
  signa: string;
  labelType: MedicationLabelType;
  timing: MedicationTiming;
  expirationDate?: string;
  specialInstructions?: string; // e.g. "Kocok dahulu", "Habiskan"
}

export interface PrescriptionItem {
  id: string;
  type?: 'NON_RACIKAN' | 'RACIKAN';
  medicationId?: string; // Optional if racikan
  name: string;
  dosage?: string; // e.g. "500 mg" or "Puyer"
  quantity: number; // Decimal support for both non-racikan and racikan
  unit: string; // Tablet, Kapsul, Bungkus, Botol, Tube, Sachet, dll.
  signa: string; // e.g. "3 x 1 tablet sesudah makan"
  price: number;
  notes?: string;
  // Racikan specific fields
  racikanType?: RacikanType;
  ingredients?: RacikanIngredient[];
  tuslahFee?: number;
  dispenseStatus?: PrescriptionDispenseStatus;
}

export interface SickLeaveCertificate {
  certificateNumber: string; // e.g. SKS/2026/09/0042
  issueDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number; // e.g. 3
  diagnosis?: string;
  showDiagnosis: boolean; // Tampilkan diagnosis pada lembar surat
  notes?: string; // Anjuran dokter: istirahat tirah baring / rawat jalan
  profession?: string; // Pekerjaan pasien
  institution?: string; // Instansi / Kantor / Sekolah
}

export interface HealthCertificate {
  certificateNumber: string; // e.g. SKD/2026/09/0042
  issueDate: string; // YYYY-MM-DD
  purpose: string; // Keperluan: Melamar Kerja, Kuliah, SIM, dll.
  height: number; // cm
  weight: number; // kg
  systolic: number; // mmHg
  diastolic: number; // mmHg
  heartRate: number; // bpm
  bloodType?: string; // A / B / AB / O
  colorBlindness: 'NORMAL' | 'PARTIAL' | 'TOTAL'; // Buta Warna
  vision: string; // Visus: e.g. Normal 6/6 ODS
  hearing: string; // Pendengaran: Normal / Baik
  physicalDefect?: string; // Cacat badan: Tidak Ditemukan
  conclusion: 'SEHAT' | 'SEHAT_DENGAN_CATATAN' | 'TIDAK_SEHAT'; // Kesimpulan
  notes?: string;
}

export interface LabOrderItem {
  id: string;
  testName: string; // e.g. "Darah Lengkap / Rutin", "Gula Darah Sewaktu (GDS)", "Kolesterol Total", "Asam Urat", "Urin Lengkap", "Widal"
  category: 'HEMATOLOGI' | 'KIMIA_DARAH' | 'URINALISIS' | 'IMUNOLOGI' | 'LAINNYA';
  resultValue?: string; // e.g. "125"
  unit?: string; // e.g. "mg/dL", "g/dL", "ribu/uL"
  normalRange?: string; // e.g. "70 - 140 mg/dL"
  status: 'NORMAL' | 'ABNORMAL' | 'PENDING';
  price?: number;
  notes?: string;
}

export interface ReferralCertificate {
  certificateNumber: string; // e.g. SR/2026/09/0042
  issueDate: string; // YYYY-MM-DD
  destinationHospital: string; // e.g. RSUD dr. Loekmono Hadi Kudus
  destinationDepartment: string; // e.g. Spesialis Penyakit Dalam / Poli Jantung
  reasonForReferral: string; // e.g. Penanganan spesialis lanjutan & diagnostik penunjang
  preliminaryDiagnosis: string; // Diagnosis rujukan
  anamnesisSummary?: string; // Ringkasan anamnesis keluhan
  physicalExamSummary?: string; // Ringkasan pemeriksaan fisik
  vitalSignsSummary?: string; // Tanda vital
  therapyGiven?: string; // Terapi / obat yang telah diberikan di faskes
  transportationType?: 'AMBULANCE' | 'KENDARAAN_PRIBADI' | 'KENDARAAN_UMUM';
  conditionAtReferral?: 'STABIL' | 'SEDANG' | 'KRITIS';
  notes?: string;
}

export type ReminderStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface ControlVisitLetter {
  certificateNumber: string; // e.g. SK/2026/09/0042
  issueDate: string; // YYYY-MM-DD
  controlDate: string; // YYYY-MM-DD - tanggal kontrol yang dijadwalkan
  controlTime?: string; // HH:mm - jam kontrol (opsional)
  doctorName: string; // Dokter yang akan dikunjungi
  poli?: string; // Poli / ruangan kontrol
  diagnosis?: string; // Diagnosa awal / alasan kontrol
  instructions?: string; // Instruksi khusus kepada pasien
  notes?: string; // Catatan tambahan
  // WhatsApp reminder fields
  reminderEnabled: boolean; // Aktifkan pengiriman reminder WA
  reminderStatus?: ReminderStatus; // Status pengiriman reminder
  reminderSentAt?: string; // ISO timestamp terkirim
  customMessage?: string; // Pesan WA kustom (auto-generated jika kosong)
}

export interface InformedConsent {
  id: string;
  type: 'CONSENT' | 'REFUSAL'; // Persetujuan atau Penolakan Tindakan Medis
  procedureName: string; // Nama Tindakan (e.g. Jahit Luka / Hecting, Insisi Abses, Sirkumsisi)
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  signerType: 'PATIENT' | 'FAMILY' | 'GUARDIAN';
  signerName: string;
  signerNik?: string;
  signerRelation?: string; // Diri Sendiri, Suami, Istri, Orang Tua, Anak, Saudara
  signerPhone?: string;
  signerAddress?: string;
  doctorName: string;
  witnessName?: string; // Perawat / Petugas Faskes
  diagnosisExplained: boolean;
  procedureExplained: boolean;
  risksAndComplicationsExplained: boolean;
  alternativesExplained: boolean;
  prognosisExplained: boolean;
  notes?: string;
}

export interface RadiologyOrderItem {
  id: string;
  examinationType: string; // e.g. "Foto Thorax PA", "USG Abdomen", "USG Kandungan (Obsgyn)", "Foto Rontgen Ekstremitas"
  modality: 'USG' | 'RONTGEN_XRAY' | 'EKG' | 'LAINNYA';
  clinicalIndication?: string;
  findings?: string; // Temuan imejing / hasil expertise
  conclusion?: string; // Kesimpulan dokter pemeriksa
  price?: number;
  radiologyImageUrl?: string; // Optional URL scan/foto hasil
}

export interface MedicalRecord {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  vitalSigns: VitalSigns;
  chiefComplaint: string;
  anamnesis: string; // Auto-generated or manual SOAP Anamnesis
  physicalExamination: string;
  diagnoses: DiagnosisItem[];
  procedures: ProcedureItem[];
  prescriptions: PrescriptionItem[];
  prescriptionType?: 'INTERNAL' | 'EXTERNAL'; // Resep Apotek Internal vs Resep Luar
  labOrders?: LabOrderItem[]; // Permintaan & Hasil Lab (jika faskes punya lab)
  radiologyOrders?: RadiologyOrderItem[]; // Permintaan & Hasil Radiologi (jika faskes punya radiologi)
  clinicalNotes?: string;
  followUpPlan?: string;
  // Surat Keterangan Medis & Legalitas Faskes
  sickLeaveCertificate?: SickLeaveCertificate;
  healthCertificate?: HealthCertificate;
  referralCertificate?: ReferralCertificate;
  controlVisitLetter?: ControlVisitLetter; // Surat Kontrol Kunjungan
  informedConsents?: InformedConsent[];
  // Farmasi & Dispensing Obat
  prescriptionStatus?: PrescriptionDispenseStatus;
  prescriptionDispenseStatus?: PrescriptionDispenseStatus;
  prescriptionDispensedAt?: string;
  prescriptionDispensedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingItem {
  id: string;
  category: 'CONSULTATION' | 'PROCEDURE' | 'MEDICATION' | 'DIAGNOSTIC' | 'ADMINISTRATION';
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  discountPercent?: number;
  discountType?: 'PERCENTAGE' | 'NOMINAL';
  totalPrice: number;
  notes?: string;
}

export interface PaymentDetails {
  method: PaymentMethod;
  amountPaid: number;
  change?: number; // Kembalian
  changeAmount?: number;
  referenceNumber?: string; // e.g. No Ref Transfer / QRIS
  paidAt: string;
  cashierName: string;
}

export interface Billing {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  noRM: string;
  invoiceNumber: string; // e.g. INV-20260830-0001
  date: string;
  items: BillingItem[];
  consultationFee: number;
  proceduresFee: number;
  medicationsFee: number;
  diagnosticFee: number;
  subtotal: number;
  discountType?: 'PERCENTAGE' | 'NOMINAL';
  discountValue?: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  status: PaymentStatus;
  paymentDetails?: PaymentDetails;
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  queueNumber: string; // e.g. A-001, B-002
  patientId: string;
  patient: Patient;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  serviceHours?: string; // e.g. "08:00 - 14:00"
  patientQuota?: number; // e.g. 20
  status: VisitStatus;
  paymentType: PaymentType;
  chiefComplaintSummary?: string;
  medicalRecord?: MedicalRecord;
  billing?: Billing;
  prescriptionStatus?: PrescriptionDispenseStatus;
  prescriptionDispenseStatus?: PrescriptionDispenseStatus;
  prescriptionDispensedAt?: string;
  prescriptionDispensedBy?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationMaster {
  id: string;
  code: string; // e.g. MED-001
  name: string; // Brand or patent name
  genericName?: string;
  category: string; // e.g. Analgesik, Antibiotik
  dosage: string; // e.g. "500 mg", "10 mg/5ml"
  unit: string; // Tablet, Sirup, Kaplet, Tube
  price: number; // Unit price in IDR
  stock: number;
  standardSigna: string; // e.g. "3 x 1 tablet sesudah makan"
  notes?: string;
}

export interface StockOpnameItem {
  medicationId: string;
  code: string;
  name: string;
  genericName?: string;
  category: string;
  unit: string;
  price: number;
  systemStock: number;
  physicalStock: number;
  difference: number; // physicalStock - systemStock
  differenceValue: number; // difference * price
  reason: string;
  notes?: string;
}

export interface StockOpnameSession {
  id: string; // e.g. "SO-20260905-001"
  date: string;
  time: string;
  officerName: string;
  officerRole: string;
  status: 'COMPLETED' | 'DRAFT';
  notes?: string;
  totalItemsCount: number;
  itemsWithDiscrepancyCount: number;
  totalSystemStock: number;
  totalPhysicalStock: number;
  totalDifferenceUnits: number;
  totalDifferenceValue: number;
  items: StockOpnameItem[];
  createdAt: string;
}

export interface DiagnosisMaster {
  code: string; // ICD-10 e.g. J00, I10
  name: string;
  englishName?: string;
  description?: string;
  category?: string;
  isChronic?: boolean;
  isActive?: boolean;
}

export interface ProcedureMaster {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  notes?: string;
}

export interface ICD9Master {
  id: string;
  code: string; // ICD-9-CM e.g. 89.07, 90.59
  name: string;
  englishName?: string;
  category: string;
  standardTariff: number;
  isActive: boolean;
}

export interface SNOMEDMaster {
  id: string;
  conceptId: string; // SNOMED CT Concept ID e.g. 386661006
  fsn: string; // Fully Specified Name e.g. Fever (finding)
  term: string; // Preferred Clinical Term e.g. Demam
  semanticTag: 'finding' | 'disorder' | 'procedure' | 'observable entity' | 'body structure' | 'substance';
  icd10Mapping?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Doctor {
  id: string;
  name: string;
  sip: string; // Surat Izin Praktik
  strNumber?: string;
  nik?: string;
  specialty: string;
  ihsPractitionerId?: string; // SATUSEHAT Practitioner ID e.g. N10000001
  phone: string;
  email?: string;
  avatarUrl?: string;
  poli?: string;
  scheduleDays?: string[];
  scheduleHours?: string;         // Legacy: "08:00 - 14:00" format (kept for backwards compat)
  scheduleStartTime?: string;     // e.g. "08:00"
  scheduleEndTime?: string;       // e.g. "14:00"
  dailyQuota?: number;            // Max patients per session/day
  defaultConsultationFee: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface NurseMaster {
  id: string;
  name: string;
  sikp: string; // Surat Izin Praktik Perawat / Bidan
  strNumber?: string;
  nik?: string;
  profession: 'PERAWAT' | 'BIDAN' | 'PERAWAT_GIGI' | 'ASISTEN_MEDIS';
  room: string;
  ihsPractitionerId?: string; // SATUSEHAT Practitioner ID
  phone: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PracticeConfig {
  practiceName: string;
  subtitle: string;
  doctorName: string;
  sip: string;
  address: string;
  phone: string;
  email: string;
  defaultConsultationFee: number;
  appMode: AppMode;
  currentRole: Role;
  activeDoctorId: string;
  // Pengaturan Fasilitas Unit Pelayanan Klinik
  hasPharmacy?: boolean; // Apotek / Depo Obat Internal (default: true)
  hasLaboratory?: boolean; // Laboratorium Klinis Internal (default: false)
  hasRadiology?: boolean; // Radiologi & Diagnostik Imejing (default: false)
  // Pengaturan Invoice & Kop Surat Kwitansi
  logoUrl?: string; // Data URL Base64 / URL foto logo klinik
  letterheadUrl?: string; // Data URL Base64 / URL gambar banner kop surat utuh
  invoiceHeaderMode?: 'STANDARD' | 'CUSTOM_LETTERHEAD'; // Mode kop surat: 'STANDARD' (Logo + Teks) atau 'CUSTOM_LETTERHEAD' (Desain Utuh)
  invoiceCity?: string; // Kota penerbitan kwitansi (e.g. "Jakarta")
  invoiceCashierTitle?: string; // Jabatan kasir (e.g. "Petugas Administrasi / Kasir")
  invoiceNotes?: string; // Catatan kaki / disclaimer kwitansi
  invoiceBankInfo?: string; // Informasi rekening pembayaran
  invoiceShowStamp?: boolean; // Tampilkan cap stempel LUNAS
  invoiceStampUrl?: string; // Data URL cap stempel digital kustom
  invoiceSignatureUrl?: string; // Data URL scan tanda tangan digital
}

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: Role | UserRole;
  roleId?: string;
  appMode: AppMode;
  title: string;
  sip?: string;
  ihsId?: string;
  doctorId?: string;
  phone?: string;
  status?: UserStatus;
  avatarUrl?: string;
  clinicName?: string;
  tenantId?: string;
  tenant_id?: string;
  customSidebarMenus?: Partial<Record<SidebarMenuKey, boolean>>;
  createdAt?: string;
  lastLogin?: string;
}

export type SidebarMenuKey =
  | 'dashboard'
  | 'registration'
  | 'queue'
  | 'patients'
  | 'medicalRecord'
  | 'medications'
  | 'laboratory'
  | 'radiology'
  | 'billing'
  | 'reports'
  | 'settings'
  | 'saas';

export interface SidebarMenuInfo {
  key: SidebarMenuKey;
  label: string;
  href: string;
  category: 'Pelayanan' | 'Klinis' | 'Administrasi' | 'Sistem';
  description: string;
}

export interface RolePermission {
  roleId: UserRole;
  roleName: string;
  description: string;
  badgeColor: string;
  userCount: number;
  sidebarMenus?: Record<SidebarMenuKey, boolean>;
  permissions: {
    medicalRecords: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    queue: { view: boolean; register: boolean; call: boolean };
    billing: { view: boolean; process: boolean; discount: boolean; receipt: boolean };
    pharmacy: { view: boolean; createEdit: boolean; restock: boolean; delete: boolean };
    procedures: { view: boolean; createEdit: boolean; delete: boolean };
    reports: { viewClinical: boolean; viewFinancial: boolean; export: boolean };
    settings: { view: boolean; editClinic: boolean; manageUsers: boolean };
  };
}

export type SubscriptionTier = 'TRIAL' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface TrialInfo {
  tier: SubscriptionTier;
  planName: string;
  startDate: string; // ISO String
  endDate: string; // ISO String
  totalDays: number;
  licenseKey?: string;
  activatedAt?: string;
  isLifetime?: boolean;
}

export type SatuSehatEnvironment = 'SANDBOX' | 'PRODUCTION';

export type SatuSehatResourceType =
  | 'Encounter'
  | 'Condition'
  | 'Observation'
  | 'Procedure'
  | 'MedicationRequest'
  | 'Medication'
  | 'Patient'
  | 'Practitioner'
  | 'Location'
  | 'Organization';

export interface SatuSehatLog {
  id: string;
  timestamp: string;
  resourceType: SatuSehatResourceType;
  resourceId?: string;
  patientName: string;
  noRM: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  httpCode: number;
  responseMessage: string;
  payloadSnippet?: string;
}

export interface SatuSehatConfig {
  organizationId: string; // e.g. "10000004"
  clientId: string; // e.g. "10000004-987a-4bc3-9123-abcdef123456"
  clientSecret: string; // e.g. "sec_kemenkes_live_89712a"
  environment: SatuSehatEnvironment; // 'SANDBOX' | 'PRODUCTION'
  locationId?: string; // e.g. "b017aa54-f1df-4ec2-9d84-882cb502094e"
  locationName?: string; // e.g. "Ruang Pemeriksaan Umum (Poli 1)"
  authUrl: string;
  fhirBaseUrl: string;

  // Sync options
  autoSyncOnComplete: boolean;
  syncDiagnoses: boolean;
  syncVitalSigns: boolean;
  syncPrescriptions: boolean;
  syncProcedures: boolean;

  // Connection & OAuth status
  isConnected: boolean;
  lastConnectedAt?: string;
  accessToken?: string;
  tokenExpiresAt?: string;
}

export type BPJSEnvironment = 'DEVELOPMENT' | 'PRODUCTION';

export type BPJSServiceType =
  | 'PCARE'
  | 'ANTREAN'
  | 'VCLAIM'
  | 'ELIGIBILITY'
  | 'RUJUKAN';

export interface BPJSParticipantInfo {
  noKartu: string;
  nik: string;
  nama: string;
  statusPeserta: {
    kode: string;
    keterangan: string;
  };
  jenisPeserta: {
    kode: string;
    keterangan: string;
  };
  hakKelas: {
    kode: string;
    keterangan: string;
  };
  faskesTk1: {
    kdProvider: string;
    nmProvider: string;
  };
  tglLahir: string;
  gender: Gender;
  tglMulaiAktif: string;
  tglAkhirBerlaku: string;
  noTelepon?: string;
}

export interface BPJSLog {
  id: string;
  timestamp: string;
  service: BPJSServiceType;
  endpoint: string;
  patientName?: string;
  noKartuOrNik?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  httpCode: number;
  responseCode: string;
  responseMessage: string;
  payloadSnippet?: string;
}

export interface BPJSConfig {
  consId: string; // Consumer ID e.g. "12345"
  secretKey: string; // Secret Key e.g. "8yU9102xY..."
  userKey: string; // User Key (PCare / Antrean WS User Key)
  kodePPK: string; // Kode Faskes / Provider e.g. "0114B001"
  ppkName?: string; // Nama Faskes e.g. "Klinik Pratama Sehat Mandiri"
  usernamePCare?: string; // Username akun PCare
  passwordPCare?: string; // Password akun PCare
  environment: BPJSEnvironment;
  pcareBaseUrl: string;
  antreanBaseUrl: string;
  vclaimBaseUrl: string;

  // Modul / Fitur Flags
  autoBridgingRegistration: boolean;
  autoBridgingKunjungan: boolean;
  enablePCare: boolean;
  enableAntreanOnline: boolean;
  enableRujukanOnline: boolean;

  // Connection status
  isConnected: boolean;
  lastConnectedAt?: string;
  lastSignature?: string;
}

// ==========================================
// SAAS MULTI-TENANT TYPES
// ==========================================

export type FaskesType = 
  | 'KLINIK_PRATAMA' 
  | 'KLINIK_UTAMA' 
  | 'PRAKTIK_MANDIRI_DOKTER' 
  | 'PRAKTIK_MANDIRI_BIDAN';

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'EXPIRED';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  faskesCode: string;
  faskesType: FaskesType;
  planId: 'starter' | 'pro' | 'enterprise';
  status: TenantStatus;
  doctorInCharge: string;
  sip: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  patientCount: number;
  userCount: number;
  maxDoctors: number;
  maxUsers: number;
  satusehatIntegrated: boolean;
  bpjsIntegrated: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  tagline: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxDoctors: number;
  maxUsers: number;
  maxPatientsPerMonth: number;
  features: string[];
  isPopular?: boolean;
}

export interface SaaSInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  planName: string;
  amount: number;
  billingPeriod: 'MONTHLY' | 'YEARLY';
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
}
