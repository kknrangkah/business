import {
  Patient,
  Doctor,
  DiagnosisMaster,
  MedicationMaster,
  ProcedureMaster,
  Visit,
  PracticeConfig,
  User,
  RolePermission,
  TrialInfo,
  SatuSehatConfig,
  SatuSehatLog,
  BPJSConfig,
  BPJSLog,
  BPJSParticipantInfo,
  ICD9Master,
  SNOMEDMaster,
  NurseMaster,
  Tenant,
  SubscriptionPlan,
  SaaSInvoice,
  SidebarMenuInfo,
  SidebarMenuKey,
} from '@/types/rme';

// Dynamic date helpers so mock visits always appear on today's dashboard and recent history
export const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const getDateOffsetString = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const getInitialTrialInfo = (): TrialInfo => {
  const now = new Date();
  // Trial started 16 days ago
  const start = new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000);
  // Trial ends 14 days from now at 23:59:59
  const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  end.setHours(23, 59, 59, 999);

  return {
    tier: 'TRIAL',
    planName: 'Masa Uji Coba Akses Penuh (Trial 30 Hari)',
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    totalDays: 30,
  };
};

export const MOCK_USERS: (User & { password?: string })[] = [
  {
    id: 'f1e2d3c4-b5a6-7988-970d-1e2f3a4b5c6d',
    name: 'Admin',
    email: 'admin@gmail.com',
    password: 'password',
    role: 'ADMIN',
    appMode: 'DOCTOR_AND_ADMIN',
    title: 'Administrator Faskes & Pemilik Klinik',
    phone: '0812-0000-0000',
    status: 'ACTIVE',
    clinicName: 'Klinik Pratama',
    createdAt: '2026-09-11T16:21:47Z',
    lastLogin: '2026-09-17T21:00:00Z',
  },
];

export const SIDEBAR_MENU_DEFINITIONS: SidebarMenuInfo[] = [
  {
    key: 'dashboard',
    label: 'Dashboard Utama',
    href: '/dashboard',
    category: 'Pelayanan',
    description: 'Ringkasan operasional harian faskes, metrik kunjungan & antrian real-time',
  },
  {
    key: 'registration',
    label: 'Pendaftaran Pasien',
    href: '/registration',
    category: 'Pelayanan',
    description: 'Registrasi pasien baru/lama dan pencetakan tiket nomor antrian loket',
  },
  {
    key: 'queue',
    label: 'Antrian Pasien',
    href: '/queue',
    category: 'Pelayanan',
    description: 'Meja pemanggilan antrian suara 4-nada & layar display TV antrian',
  },
  {
    key: 'patients',
    label: 'Data Pasien',
    href: '/patients',
    category: 'Pelayanan',
    description: 'Direktori data master demografi pasien faskes',
  },
  {
    key: 'medicalRecord',
    label: 'Rekam Medis (SOAP)',
    href: '/medical-record',
    category: 'Klinis',
    description: 'Pemeriksaan SOAP, diagnosis ICD-10, tindakan medis ICD-9 & e-resep digital',
  },
  {
    key: 'medications',
    label: 'Depo Farmasi & Obat',
    href: '/medications',
    category: 'Klinis',
    description: 'Peracikan obat, kartu stok, stock opname & manajemen inventaris farmasi',
  },
  {
    key: 'laboratory',
    label: 'Laboratorium Klinis',
    href: '/laboratory',
    category: 'Klinis',
    description: 'Permintaan uji lab, pencatatan hasil hematologi, kimia darah & urinalisis',
  },
  {
    key: 'radiology',
    label: 'Radiologi & USG',
    href: '/radiology',
    category: 'Klinis',
    description: 'Pemeriksaan diagnostik imejing rontgen X-ray, USG & hasil expertise',
  },
  {
    key: 'billing',
    label: 'Kasir & Pembayaran',
    href: '/billing',
    category: 'Administrasi',
    description: 'Billing kasir multi-metode, klaim BPJS & cetak kwitansi / struk thermal',
  },
  {
    key: 'reports',
    label: 'Laporan & Statistik',
    href: '/reports',
    category: 'Administrasi',
    description: 'Laporan 10 besar penyakit, tren kunjungan, pendapatan & honorarium dokter',
  },
  {
    key: 'settings',
    label: 'Pengaturan & Master',
    href: '/settings',
    category: 'Sistem',
    description: 'Pengaturan faskes, integrasi SATUSEHAT/BPJS, master tarif & user RBAC',
  },
  {
    key: 'saas',
    label: 'Platform SaaS Multi-Tenant',
    href: '/saas',
    category: 'Sistem',
    description: 'Kelola faskes / tenant, paket langganan & penagihan platform pusat',
  },
];

export const DEFAULT_ROLE_PERMISSIONS: RolePermission[] = [
  {
    roleId: 'DOCTOR',
    roleName: 'Dokter Pemeriksa',
    description: 'Akses penuh ke pemeriksaan klinis, input SOAP, diagnosis ICD-10, e-resep obat & tindakan medis.',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    userCount: 2,
    sidebarMenus: {
      dashboard: true,
      registration: false,
      queue: true,
      patients: true,
      medicalRecord: true,
      medications: false,
      laboratory: true,
      radiology: true,
      billing: false,
      reports: true,
      settings: true,
      saas: false,
    },
    permissions: {
      medicalRecords: { view: true, create: true, edit: true, delete: false },
      queue: { view: true, register: true, call: true },
      billing: { view: true, process: false, discount: false, receipt: true },
      pharmacy: { view: true, createEdit: false, restock: false, delete: false },
      procedures: { view: true, createEdit: false, delete: false },
      reports: { viewClinical: true, viewFinancial: false, export: true },
      settings: { view: true, editClinic: false, manageUsers: false },
    },
  },
  {
    roleId: 'ADMIN',
    roleName: 'Admin & Kasir Front Office',
    description: 'Akses pendaftaran pasien, antrian loket, administrasi pembayaran kasir, kwitansi & laporan keuangan.',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    userCount: 1,
    sidebarMenus: {
      dashboard: true,
      registration: true,
      queue: true,
      patients: true,
      medicalRecord: true,
      medications: false,
      laboratory: true,
      radiology: true,
      billing: true,
      reports: true,
      settings: true,
      saas: false,
    },
    permissions: {
      medicalRecords: { view: true, create: false, edit: false, delete: false },
      queue: { view: true, register: true, call: true },
      billing: { view: true, process: true, discount: true, receipt: true },
      pharmacy: { view: true, createEdit: false, restock: false, delete: false },
      procedures: { view: true, createEdit: false, delete: false },
      reports: { viewClinical: false, viewFinancial: true, export: true },
      settings: { view: true, editClinic: true, manageUsers: false },
    },
  },
  {
    roleId: 'NURSE',
    roleName: 'Perawat / Asisten Medis',
    description: 'Akses triase awal, pengukuran tanda vital (tensi, nadi, suhu, TB/BB, SpO2) & pemanggilan antrian.',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    userCount: 1,
    sidebarMenus: {
      dashboard: true,
      registration: false,
      queue: true,
      patients: true,
      medicalRecord: false,
      medications: false,
      laboratory: false,
      radiology: false,
      billing: false,
      reports: false,
      settings: true,
      saas: false,
    },
    permissions: {
      medicalRecords: { view: true, create: true, edit: false, delete: false },
      queue: { view: true, register: true, call: true },
      billing: { view: false, process: false, discount: false, receipt: false },
      pharmacy: { view: true, createEdit: false, restock: false, delete: false },
      procedures: { view: true, createEdit: false, delete: false },
      reports: { viewClinical: true, viewFinancial: false, export: false },
      settings: { view: false, editClinic: false, manageUsers: false },
    },
  },
  {
    roleId: 'PHARMACIST',
    roleName: 'Farmasis / Apoteker',
    description: 'Akses peracikan e-resep dokter, manajemen formularium obat, harga satuan & restock stok farmasi.',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    userCount: 1,
    sidebarMenus: {
      dashboard: true,
      registration: false,
      queue: true,
      patients: false,
      medicalRecord: false,
      medications: true,
      laboratory: false,
      radiology: false,
      billing: false,
      reports: true,
      settings: true,
      saas: false,
    },
    permissions: {
      medicalRecords: { view: false, create: false, edit: false, delete: false },
      queue: { view: true, register: false, call: true },
      billing: { view: true, process: false, discount: false, receipt: false },
      pharmacy: { view: true, createEdit: true, restock: true, delete: true },
      procedures: { view: false, createEdit: false, delete: false },
      reports: { viewClinical: false, viewFinancial: false, export: true },
      settings: { view: false, editClinic: false, manageUsers: false },
    },
  },
  {
    roleId: 'SUPERADMIN',
    roleName: 'Super Admin / Pemilik Faskes',
    description: 'Hak akses tingkat tertinggi (Root) untuk konfigurasi sistem, audit trail & manajemen pengguna penuh.',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    userCount: 1,
    sidebarMenus: {
      dashboard: true,
      registration: true,
      queue: true,
      patients: true,
      medicalRecord: true,
      medications: true,
      laboratory: true,
      radiology: true,
      billing: true,
      reports: true,
      settings: true,
      saas: false,
    },
    permissions: {
      medicalRecords: { view: true, create: true, edit: true, delete: true },
      queue: { view: true, register: true, call: true },
      billing: { view: true, process: true, discount: true, receipt: true },
      pharmacy: { view: true, createEdit: true, restock: true, delete: true },
      procedures: { view: true, createEdit: true, delete: true },
      reports: { viewClinical: true, viewFinancial: true, export: true },
      settings: { view: true, editClinic: true, manageUsers: true },
    },
  },
];

export const INITIAL_PRACTICE_CONFIG: PracticeConfig = {
  practiceName: 'Klinik',
  subtitle: 'Sistem Informasi Rekam Medis Elektronik Terpadu (RME Klinik)',
  logoUrl: '/logo.png',
  doctorName: '',
  sip: '',
  address: '',
  phone: '',
  email: '',
  defaultConsultationFee: 50000,
  appMode: 'DOCTOR_AND_ADMIN',
  currentRole: 'ADMIN',
  activeDoctorId: '',
  hasPharmacy: true,
  hasLaboratory: false,
  hasRadiology: false,
  invoiceHeaderMode: 'STANDARD',
  invoiceCity: '',
  invoiceCashierTitle: 'Petugas Administrasi / Kasir',
  invoiceNotes: 'Kwitansi ini sah dan diterbitkan secara elektronik melalui sistem RME Klinik.',
  invoiceBankInfo: '',
  invoiceShowStamp: true,
};

export const MOCK_DOCTORS: Doctor[] = [];

export const MOCK_NURSES: NurseMaster[] = [];

export const MOCK_DIAGNOSES: DiagnosisMaster[] = [
  // Respirasi (J00 - J99)
  { code: 'J00', name: 'Nasopharyngitis Akut (Common Cold / Flu)', englishName: 'Acute nasopharyngitis [common cold]', category: 'Respirasi', isChronic: false, isActive: true },
  { code: 'J06.9', name: 'Infeksi Saluran Pernapasan Akut (ISPA)', englishName: 'Acute upper respiratory infection, unspecified', category: 'Respirasi', isChronic: false, isActive: true },
  { code: 'J02.9', name: 'Faringitis Akut (Radang Tenggorokan)', englishName: 'Acute pharyngitis, unspecified', category: 'Respirasi', isChronic: false, isActive: true },
  { code: 'J03.9', name: 'Tonsilitis Akut (Radang Amandel)', englishName: 'Acute tonsillitis, unspecified', category: 'Respirasi', isChronic: false, isActive: true },
  { code: 'J45.9', name: 'Asma Bronkial, Unspecified', englishName: 'Asthma, unspecified', category: 'Respirasi', isChronic: true, isActive: true },
  { code: 'J20.9', name: 'Bronkitis Akut, Unspecified', englishName: 'Acute bronchitis, unspecified', category: 'Respirasi', isChronic: false, isActive: true },
  { code: 'J30.9', name: 'Rinitis Alergi, Unspecified', englishName: 'Allergic rhinitis, unspecified', category: 'Respirasi', isChronic: true, isActive: true },
  { code: 'J18.9', name: 'Pneumonia, Organism Unspecified', englishName: 'Pneumonia, unspecified organism', category: 'Respirasi', isChronic: false, isActive: true },

  // Gastrointestinal & Infeksi Usus (K00 - K95, A00 - B99)
  { code: 'K29.7', name: 'Gastritis, Unspecified (Dispepsia / Maag)', englishName: 'Gastritis, unspecified', category: 'Gastrointestinal', isChronic: false, isActive: true },
  { code: 'K21.9', name: 'Gastro-Esophageal Reflux Disease (GERD)', englishName: 'Gastro-esophageal reflux disease without esophagitis', category: 'Gastrointestinal', isChronic: true, isActive: true },
  { code: 'A09', name: 'Gastroenteritis Akut (Diare Akut Dehidrasi Ringan)', englishName: 'Infectious gastroenteritis and colitis, unspecified', category: 'Gastrointestinal', isChronic: false, isActive: true },
  { code: 'K30', name: 'Dispepsia Fungsional', englishName: 'Functional dyspepsia', category: 'Gastrointestinal', isChronic: false, isActive: true },
  { code: 'K59.00', name: 'Konstipasi, Unspecified (Sembelit)', englishName: 'Constipation, unspecified', category: 'Gastrointestinal', isChronic: false, isActive: true },
  { code: 'A01.0', name: 'Demam Tifoid (Tifus Abdominalis)', englishName: 'Typhoid fever', category: 'Infeksi Bakteri', isChronic: false, isActive: true },

  // Kardiovaskular (I00 - I99)
  { code: 'I10', name: 'Hipertensi Esensial (Primer Grade 1 & 2)', englishName: 'Essential (primary) hypertension', category: 'Kardiovaskular', isChronic: true, isActive: true },
  { code: 'I11.9', name: 'Penyakit Jantung Hipertensi Tanpa Gagal Jantung', englishName: 'Hypertensive heart disease without heart failure', category: 'Kardiovaskular', isChronic: true, isActive: true },
  { code: 'I20.9', name: 'Angina Pectoris, Unspecified (Nyeri Dada Koroner)', englishName: 'Angina pectoris, unspecified', category: 'Kardiovaskular', isChronic: true, isActive: true },

  // Endokrin, Nutrisi & Metabolik (E00 - E89)
  { code: 'E11.9', name: 'Diabetes Mellitus Tipe 2 Tanpa Komplikasi', englishName: 'Type 2 diabetes mellitus without complications', category: 'Endokrin', isChronic: true, isActive: true },
  { code: 'E10.9', name: 'Diabetes Mellitus Tipe 1 Tanpa Komplikasi', englishName: 'Type 1 diabetes mellitus without complications', category: 'Endokrin', isChronic: true, isActive: true },
  { code: 'E78.5', name: 'Hiperlipidemia / Kolesterol Tinggi', englishName: 'Hyperlipidemia, unspecified', category: 'Endokrin', isChronic: true, isActive: true },
  { code: 'E79.0', name: 'Hiperurisemia / Asam Urat Tinggi Tanpa Artritis', englishName: 'Hyperuricemia without signs of inflammatory arthritis and tophaceous disease', category: 'Endokrin', isChronic: true, isActive: true },
  { code: 'E03.9', name: 'Hipotiroidisme, Unspecified', englishName: 'Hypothyroidism, unspecified', category: 'Endokrin', isChronic: true, isActive: true },

  // Muskuloskeletal (M00 - M99)
  { code: 'M79.1', name: 'Myalgia (Nyeri Otot / Pegal Linu)', englishName: 'Myalgia', category: 'Muskuloskeletal', isChronic: false, isActive: true },
  { code: 'M10.9', name: 'Gout Arthritis (Asam Urat Akut)', englishName: 'Gout, unspecified', category: 'Muskuloskeletal', isChronic: true, isActive: true },
  { code: 'M54.5', name: 'Low Back Pain (Nyeri Punggung Bawah)', englishName: 'Low back pain', category: 'Muskuloskeletal', isChronic: false, isActive: true },
  { code: 'M54.2', name: 'Cervicalgia (Nyeri Leher / Leher Kaku)', englishName: 'Cervicalgia', category: 'Muskuloskeletal', isChronic: false, isActive: true },
  { code: 'M25.50', name: 'Nyeri Sendi, Unspecified (Arthralgia)', englishName: 'Pain in unspecified joint', category: 'Muskuloskeletal', isChronic: false, isActive: true },

  // Dermatologi / Kulit (L00 - L99)
  { code: 'L20.9', name: 'Dermatitis Atopik (Eksim)', englishName: 'Atopic dermatitis, unspecified', category: 'Dermatologi', isChronic: true, isActive: true },
  { code: 'L50.9', name: 'Urtikaria Akut (Biduran / Alergi)', englishName: 'Urticaria, unspecified', category: 'Dermatologi', isChronic: false, isActive: true },
  { code: 'B35.9', name: 'Tinea Corporis / Infeksi Jamur Kulit', englishName: 'Dermatophytosis, unspecified', category: 'Dermatologi', isChronic: false, isActive: true },
  { code: 'L70.0', name: 'Acne Vulgaris (Jerawat)', englishName: 'Acne vulgaris', category: 'Dermatologi', isChronic: false, isActive: true },
  { code: 'L02.91', name: 'Furunkel / Abses Kulit, Unspecified', englishName: 'Cutaneous abscess, unspecified', category: 'Dermatologi', isChronic: false, isActive: true },

  // Gejala Umum & Kondisi Klinis (R00 - R99)
  { code: 'R50.9', name: 'Demam, Unspecified (Febris Akut)', englishName: 'Fever, unspecified', category: 'Gejala Umum', isChronic: false, isActive: true },
  { code: 'R51', name: 'Cephalgia / Sakit Kepala Tegang', englishName: 'Headache', category: 'Neurologi', isChronic: false, isActive: true },
  { code: 'G43.9', name: 'Migrain, Unspecified', englishName: 'Migraine, unspecified', category: 'Neurologi', isChronic: false, isActive: true },
  { code: 'R05', name: 'Batuk, Unspecified', englishName: 'Cough', category: 'Respirasi', isChronic: false, isActive: true },
  { code: 'R11.10', name: 'Mual dan Muntah (Nausea & Vomiting)', englishName: 'Vomiting, unspecified', category: 'Gastrointestinal', isChronic: false, isActive: true },
  { code: 'R42', name: 'Vertigo / Pusing Berputar', englishName: 'Dizziness and giddiness', category: 'Neurologi', isChronic: false, isActive: true },

  // Mata, Telinga, dan Urologi (H00 - H95, N00 - N99)
  { code: 'H10.9', name: 'Konjungtivitis Akut (Mata Merah Belekan)', englishName: 'Acute conjunctivitis, unspecified', category: 'Oftalmologi', isChronic: false, isActive: true },
  { code: 'H66.9', name: 'Otitis Media Akut (Infeksi Telinga)', englishName: 'Otitis media, unspecified', category: 'THT', isChronic: false, isActive: true },
  { code: 'H60.9', name: 'Otitis Externa (Infeksi Liang Telinga Luar)', englishName: 'Otitis externa, unspecified', category: 'THT', isChronic: false, isActive: true },
  { code: 'N39.0', name: 'Infeksi Saluran Kemih (ISK)', englishName: 'Urinary tract infection, site not specified', category: 'Urologi', isChronic: false, isActive: true },

  // Pemeriksaan Sehat & Surat Medis (Z00 - Z99)
  { code: 'Z00.00', name: 'Pemeriksaan Kesehatan Umum Dewasa (Medical Check Up)', englishName: 'Encounter for general adult medical examination without abnormal findings', category: 'Pemeriksaan Umum', isChronic: false, isActive: true },
  { code: 'Z01.00', name: 'Pemeriksaan Mata dan Penglihatan', englishName: 'Encounter for examination of eyes and vision without abnormal findings', category: 'Pemeriksaan Umum', isChronic: false, isActive: true },
  { code: 'Z71.3', name: 'Konseling Diet dan Pengaturan Nutrisi', englishName: 'Dietary counseling and surveillance', category: 'Konseling Medis', isChronic: false, isActive: true },
];

export const MOCK_ICD9: ICD9Master[] = [
  // Pemeriksaan Klinis & Konsultasi (89.0 - 89.9)
  { id: 'icd9-1', code: '89.07', name: 'Konsultasi Medis dan Pemeriksaan Fisik Komprehensif', englishName: 'Comprehensive medical examination and consultation', category: 'Pemeriksaan Klinis', standardTariff: 75000, isActive: true },
  { id: 'icd9-2', code: '89.38', name: 'Pemeriksaan Tanda Vital & Pengukuran Antropometri', englishName: 'Vital signs measurement and physical evaluation', category: 'Pemeriksaan Klinis', standardTariff: 25000, isActive: true },
  { id: 'icd9-3', code: '89.52', name: 'Pemeriksaan Elektrokardiografi (EKG 12 Lead)', englishName: 'Electrocardiogram', category: 'Diagnostik Kardio', standardTariff: 80000, isActive: true },
  { id: 'icd9-4', code: '89.01', name: 'Wawancara & Evaluasi Medis Singkat (Follow-Up)', englishName: 'Interview and evaluation, brief', category: 'Pemeriksaan Klinis', standardTariff: 45000, isActive: true },

  // Terapi Respirasi & Oksigen (96.0 - 96.9)
  { id: 'icd9-5', code: '96.04', name: 'Terapi Inhalasi / Nebulisasi Bronkodilator', englishName: 'Insertion of endotracheal tube / nebulizer therapy', category: 'Respirasi & Terapi', standardTariff: 60000, isActive: true },
  { id: 'icd9-6', code: '93.96', name: 'Pemberian Terapi Oksigen Tambahan (O2 Nasal)', englishName: 'Other oxygen enrichment', category: 'Respirasi & Terapi', standardTariff: 35000, isActive: true },

  // Tindakan Bedah Minor & Perawatan Luka (86.0 - 86.9, 93.5 - 93.9)
  { id: 'icd9-7', code: '93.57', name: 'Perawatan Luka, Debridement & Penggantian Perban', englishName: 'Application of other wound dressing and debridement', category: 'Tindakan Bedah Minor', standardTariff: 50000, isActive: true },
  { id: 'icd9-8', code: '86.59', name: 'Penjahitan Luka Robek / Hecting Sederhana', englishName: 'Closure of skin and subcutaneous tissue of other sites', category: 'Tindakan Bedah Minor', standardTariff: 100000, isActive: true },
  { id: 'icd9-9', code: '86.04', name: 'Insisi dan Drainase Abses Kulit / Furunkel', englishName: 'Other incision with drainage of skin and subcutaneous tissue', category: 'Tindakan Bedah Minor', standardTariff: 85000, isActive: true },
  { id: 'icd9-10', code: '97.89', name: 'Pengangkatan Benang Jahitan Luka (Aff Hecting)', englishName: 'Removal of other surgical wound closure', category: 'Tindakan Bedah Minor', standardTariff: 35000, isActive: true },
  { id: 'icd9-11', code: '86.22', name: 'Eksisional Debridement Luka Nekrotik / Infeksi', englishName: 'Excisional debridement of wound, infection, or burn', category: 'Tindakan Bedah Minor', standardTariff: 95000, isActive: true },
  { id: 'icd9-12', code: '86.28', name: 'Pencucian dan Pembersihan Luka Kotor (Non-Eksisional)', englishName: 'Nonexcisional debridement of wound, infection or burn', category: 'Tindakan Bedah Minor', standardTariff: 45000, isActive: true },
  { id: 'icd9-13', code: '93.56', name: 'Pemasangan Balut Tekan / Spalk Fiksasi Sederhana', englishName: 'Application of pressure dressing', category: 'Tindakan Bedah Minor', standardTariff: 40000, isActive: true },

  // Injeksi, Infus & Medikasi (99.0 - 99.9)
  { id: 'icd9-14', code: '99.29', name: 'Injeksi Intramuskular / Intravena Terapeutik', englishName: 'Injection or infusion of other therapeutic substance', category: 'Injeksi & Medikasi', standardTariff: 35000, isActive: true },
  { id: 'icd9-15', code: '99.18', name: 'Pemasangan Infus Cairan Intravena (IV Line)', englishName: 'Injection or infusion of electrolytes', category: 'Injeksi & Medikasi', standardTariff: 75000, isActive: true },
  { id: 'icd9-16', code: '99.21', name: 'Injeksi Antibiotik Intramuskular / Intravena', englishName: 'Injection of antibiotic', category: 'Injeksi & Medikasi', standardTariff: 45000, isActive: true },
  { id: 'icd9-17', code: '99.23', name: 'Injeksi Kortikosteroid / Anti-Inflamasi', englishName: 'Injection of steroid', category: 'Injeksi & Medikasi', standardTariff: 40000, isActive: true },
  { id: 'icd9-18', code: '99.52', name: 'Vaksinasi / Imunisasi Influenza Dewasa', englishName: 'Prophylactic vaccination against influenza', category: 'Vaksinasi & Imunisasi', standardTariff: 150000, isActive: true },
  { id: 'icd9-19', code: '99.55', name: 'Vaksinasi / Imunisasi Lainnya (Hepatitis / Tetanus)', englishName: 'Prophylactic vaccination against other diseases', category: 'Vaksinasi & Imunisasi', standardTariff: 125000, isActive: true },

  // THT & Mata (96.5, 98.1)
  { id: 'icd9-20', code: '96.52', name: 'Irigasi dan Pembersihan Telinga (Spooling Cerumen)', englishName: 'Irrigation of ear / removal of cerumen', category: 'THT', standardTariff: 55000, isActive: true },
  { id: 'icd9-21', code: '96.53', name: 'Pembersihan & Irigasi Mata (Eye Irrigation)', englishName: 'Irrigation of eye', category: 'Oftalmologi', standardTariff: 40000, isActive: true },
  { id: 'icd9-22', code: '98.11', name: 'Ekstraksi Benda Asing Telinga Luar Tanpa Insisi', englishName: 'Removal of foreign body from external auditory canal without incision', category: 'THT', standardTariff: 65000, isActive: true },
  { id: 'icd9-23', code: '98.12', name: 'Ekstraksi Benda Asing Hidung Tanpa Insisi', englishName: 'Removal of intraluminal foreign body from nose without incision', category: 'THT', standardTariff: 65000, isActive: true },

  // Laboratorium POCT Sederhana (90.5 - 91.3)
  { id: 'icd9-24', code: '90.59', name: 'Pemeriksaan Glukosa / Kolesterol / Asam Urat POCT', englishName: 'Microscopic examination of blood, POCT screening', category: 'Laboratorium POCT', standardTariff: 45000, isActive: true },
  { id: 'icd9-25', code: '91.39', name: 'Pemeriksaan Urin Rutin Dipstick (Tes Kimiawi)', englishName: 'Microscopic examination of urine', category: 'Laboratorium POCT', standardTariff: 30000, isActive: true },
  { id: 'icd9-26', code: '87.44', name: 'Pemeriksaan Rontgen Thoraks Rutin (Chest X-Ray)', englishName: 'Routine chest x-ray', category: 'Radiologi', standardTariff: 120000, isActive: true },

  // Rehabilitasi Medis & Gigi (93.3, 23.0)
  { id: 'icd9-27', code: '93.39', name: 'Fisioterapi / Terapi Panas Inframerah (IR Therapy)', englishName: 'Other physical therapy modalities', category: 'Rehabilitasi Medis', standardTariff: 65000, isActive: true },
  { id: 'icd9-28', code: '23.09', name: 'Ekstraksi Gigi Sulung / Gigi Tetap Sederhana', englishName: 'Extraction of other tooth', category: 'Gigi & Mulut', standardTariff: 100000, isActive: true },
  { id: 'icd9-29', code: '23.2', name: 'Penambalan Gigi Sederhana (Tumpatan Glass Ionomer)', englishName: 'Restoration of tooth by filling', category: 'Gigi & Mulut', standardTariff: 120000, isActive: true },
  { id: 'icd9-30', code: '96.54', name: 'Pembersihan Karang Gigi Sederhana (Dental Scaling)', englishName: 'Dental prophylaxis and scaling', category: 'Gigi & Mulut', standardTariff: 150000, isActive: true },
];

export const MOCK_SNOMED: SNOMEDMaster[] = [
  { id: 'snomed-1', conceptId: '386661006', fsn: 'Fever (finding)', term: 'Demam / Febris', semanticTag: 'finding', icd10Mapping: 'R50.9', status: 'ACTIVE' },
  { id: 'snomed-2', conceptId: '22298006', fsn: 'Myocardial infarction (disorder)', term: 'Infark Miokard Akut', semanticTag: 'disorder', icd10Mapping: 'I21.9', status: 'ACTIVE' },
  { id: 'snomed-3', conceptId: '38341003', fsn: 'Hypertensive disorder, systemic arterial (disorder)', term: 'Penyakit Hipertensi Esensial', semanticTag: 'disorder', icd10Mapping: 'I10', status: 'ACTIVE' },
  { id: 'snomed-4', conceptId: '73211009', fsn: 'Diabetes mellitus (disorder)', term: 'Diabetes Melitus', semanticTag: 'disorder', icd10Mapping: 'E11.9', status: 'ACTIVE' },
  { id: 'snomed-5', conceptId: '122865005', fsn: 'Shortness of breath (finding)', term: 'Sesak Napas / Dispnea', semanticTag: 'finding', icd10Mapping: 'R06.0', status: 'ACTIVE' },
  { id: 'snomed-6', conceptId: '49727002', fsn: 'Cough (finding)', term: 'Batuk Akut / Kronis', semanticTag: 'finding', icd10Mapping: 'R05', status: 'ACTIVE' },
  { id: 'snomed-7', conceptId: '25064002', fsn: 'Headache (finding)', term: 'Sakit Kepala / Sefalgia', semanticTag: 'finding', icd10Mapping: 'R51', status: 'ACTIVE' },
  { id: 'snomed-8', conceptId: '62315008', fsn: 'Diarrhea (finding)', term: 'Diare Akut', semanticTag: 'finding', icd10Mapping: 'A09', status: 'ACTIVE' },
  { id: 'snomed-9', conceptId: '79890006', fsn: 'Administration of drug via nebulizer (procedure)', term: 'Terapi Nebulisasi Inhalasi', semanticTag: 'procedure', icd10Mapping: 'Z99.8', status: 'ACTIVE' },
  { id: 'snomed-10', conceptId: '225358003', fsn: 'Wound care (procedure)', term: 'Perawatan dan Pembersihan Luka', semanticTag: 'procedure', icd10Mapping: 'Z48.0', status: 'ACTIVE' },
  { id: 'snomed-11', conceptId: '397540003', fsn: 'Suture of laceration of skin (procedure)', term: 'Penjahitan Luka Kulit (Hecting)', semanticTag: 'procedure', icd10Mapping: 'Z48.0', status: 'ACTIVE' },
  { id: 'snomed-12', conceptId: '840539006', fsn: 'Disease caused by Severe acute respiratory syndrome coronavirus 2 (disorder)', term: 'Infeksi COVID-19', semanticTag: 'disorder', icd10Mapping: 'U07.1', status: 'ACTIVE' },
];

export const MOCK_MEDICATIONS: MedicationMaster[] = [];

export const MOCK_PROCEDURES: ProcedureMaster[] = [];

export const MOCK_PATIENTS: Patient[] = [];

export const getTodayMockQueueVisits = (targetDate?: string): Visit[] => [];

export const MOCK_VISITS: Visit[] = [];

export const INITIAL_SATUSEHAT_CONFIG: SatuSehatConfig = {
  organizationId: '',
  clientId: '',
  clientSecret: '',
  environment: 'SANDBOX',
  locationId: '',
  locationName: '',
  authUrl: 'https://api-satusehat-stg.kemkes.go.id/oauth2/v1',
  fhirBaseUrl: 'https://api-satusehat-stg.kemkes.go.id/fhir-r4/v1',
  autoSyncOnComplete: false,
  syncDiagnoses: true,
  syncVitalSigns: true,
  syncPrescriptions: true,
  syncProcedures: true,
  isConnected: false,
};

export const MOCK_SATUSEHAT_LOGS: SatuSehatLog[] = [];

export const INITIAL_BPJS_CONFIG: BPJSConfig = {
  consId: '',
  secretKey: '',
  userKey: '',
  kodePPK: '',
  ppkName: '',
  usernamePCare: '',
  passwordPCare: '',
  environment: 'DEVELOPMENT',
  pcareBaseUrl: 'https://apijkn-dev.bpjs-kesehatan.go.id/pcare-rest-dev/v1',
  antreanBaseUrl: 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanrs_dev',
  vclaimBaseUrl: 'https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev',
  autoBridgingRegistration: false,
  autoBridgingKunjungan: false,
  enablePCare: false,
  enableAntreanOnline: false,
  enableRujukanOnline: false,
  isConnected: false,
};

export const MOCK_BPJS_PARTICIPANTS: Record<string, BPJSParticipantInfo> = {};

export const MOCK_BPJS_LOGS: BPJSLog[] = [];

// ==========================================
// SAAS MULTI-TENANT MOCK DATA
// ==========================================

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Dokter Solo (Starter)',
    tagline: 'Ideal untuk Klinik 1 Dokter',
    description: 'Solusi lengkap pencatatan rekam medis elektronik terstandar Kemenkes RI untuk klinik.',
    priceMonthly: 149000,
    priceYearly: 1490000,
    maxDoctors: 1,
    maxUsers: 2,
    maxPatientsPerMonth: 500,
    features: [
      'Rekam Medis SOAP & Kamus ICD-10',
      'E-Resep & Manajemen Obat Dasar',
      'Integrasi SATUSEHAT Kemenkes RI',
      'Pencetakan Surat Sakit & Rujukan',
      'Backup Data Cloud Harian Otomatis',
      'Dukungan Helpdesk via WhatsApp',
    ],
  },
  {
    id: 'pro',
    name: 'Klinik Pratama (Pro)',
    tagline: 'Paling Populer untuk Klinik Pratama & RB',
    description: 'Mendukung kolaborasi tim medis multi-role (Dokter, Perawat, Kasir, Apotek) dengan bridging BPJS.',
    priceMonthly: 499000,
    priceYearly: 4990000,
    maxDoctors: 5,
    maxUsers: 15,
    maxPatientsPerMonth: 2500,
    isPopular: true,
    features: [
      'Semua fitur Paket Dokter Solo',
      'Hingga 5 Dokter & 15 Staf Pengguna',
      'Bridging BPJS Kesehatan (PCare & Antrean WS)',
      'Display Layar TV Antrian Pasien Otomatis',
      'Billing & Kasir Pembayaran Multi-Metode (QRIS)',
      'Manajemen Stok Opname & Depo Farmasi',
      'Laporan Keuangan & Bagi Hasil Dokter',
      'Multi-Role Access Control (RBAC)',
    ],
  },
  {
    id: 'enterprise',
    name: 'Klinik Utama & Jaringan (Enterprise)',
    tagline: 'Skala Besar & Kustomisasi Tanpa Batas',
    description: 'Platform terintegrasi penuh dengan kuota tak terbatas, multi-cabang, dan SLA dukungan prioritas 24/7.',
    priceMonthly: 1299000,
    priceYearly: 12990000,
    maxDoctors: 20,
    maxUsers: 50,
    maxPatientsPerMonth: 10000,
    features: [
      'Semua fitur Paket Klinik Pratama',
      'Tanpa Batas Kuota Pasien & Transaksi',
      'Dukungan Multi-Cabang / Jaringan Faskes',
      'Custom Domain Faskes (klinikanda.rme.id)',
      'API Integrasi Eksternal & Laboratorium',
      'SLA Uptime 99.9% & Server Dedicated',
      'Pelatihan On-Site & Account Manager Pribadi',
    ],
  },
];

export const CLEAN_TENANTS: Tenant[] = [
  {
    id: 'tenant-01',
    name: 'Klinik Pratama',
    slug: 'praktik-mandiri',
    faskesCode: 'FSK-001',
    faskesType: 'KLINIK_PRATAMA',
    planId: 'pro',
    status: 'ACTIVE',
    doctorInCharge: '',
    sip: '',
    phone: '',
    email: 'admin@gmail.com',
    address: '',
    city: 'Indonesia',
    patientCount: 0,
    userCount: 1,
    maxDoctors: 5,
    maxUsers: 15,
    satusehatIntegrated: false,
    bpjsIntegrated: false,
    expiresAt: '2028-12-31T23:59:59Z',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const MOCK_TENANTS: Tenant[] = CLEAN_TENANTS;

export const MOCK_SAAS_INVOICES: SaaSInvoice[] = [];


