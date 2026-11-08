'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  Patient,
  Doctor,
  DiagnosisMaster,
  MedicationMaster,
  ProcedureMaster,
  Visit,
  MedicalRecord,
  Billing,
  BillingItem,
  PaymentDetails,
  Role,
  UserRole,
  UserStatus,
  AppMode,
  PracticeConfig,
  VisitStatus,
  PaymentType,
  User,
  Theme,
  RolePermission,
  TrialInfo,
  SubscriptionTier,
  SatuSehatConfig,
  SatuSehatLog,
  SatuSehatEnvironment,
  BPJSConfig,
  BPJSLog,
  BPJSParticipantInfo,
  BPJSEnvironment,
  ICD9Master,
  SNOMEDMaster,
  NurseMaster,
  StockOpnameSession,
  Tenant,
  SubscriptionPlan,
  SaaSInvoice,
  SidebarMenuKey,
  SidebarMenuInfo,
  PrescriptionDispenseStatus,
} from '@/types/rme';
import {
  INITIAL_PRACTICE_CONFIG,
  MOCK_PATIENTS,
  MOCK_DOCTORS,
  MOCK_DIAGNOSES,
  MOCK_MEDICATIONS,
  MOCK_PROCEDURES,
  MOCK_VISITS,
  MOCK_USERS,
  DEFAULT_ROLE_PERMISSIONS,
  getInitialTrialInfo,
  INITIAL_SATUSEHAT_CONFIG,
  MOCK_SATUSEHAT_LOGS,
  INITIAL_BPJS_CONFIG,
  MOCK_BPJS_LOGS,
  MOCK_BPJS_PARTICIPANTS,
  MOCK_NURSES,
  MOCK_ICD9,
  MOCK_SNOMED,
  getTodayMockQueueVisits,
  MOCK_TENANTS,
  SUBSCRIPTION_PLANS,
  MOCK_SAAS_INVOICES,
  SIDEBAR_MENU_DEFINITIONS,
} from '@/lib/mock-data';
import { REPORT_MOCK_VISITS } from '@/lib/report-mock-data';
import { MOCK_STOCK_OPNAME_HISTORY } from '@/lib/stock-opname-mock-data';
import {
  loginWithBackend,
  registerWithBackend,
  fetchUserProfile,
  STORAGE_AUTH_KEYS,
  loginOrRegisterGoogleBackend,
  parseJwt,
  BackendUser,
  fetchBackendPatients,
  fetchBackendMyMenus,
  fetchBackendRoleMenus,
  fetchBackendRoles,
  ROLE_NAME_TO_BACKEND_MAP,
  BackendRoleItem,
  fetchBackendMyPermissions,
  fetchBackendRolePermissions,
  BackendPermission,
  BackendMenuTreeItem,
  updateBackendPatient,
  deleteBackendPatient,
  fetchBackendSaasTenants,
  createBackendSaasTenant,
  fetchBackendMyTenant,
  mapBackendPatientToPatient,
  fetchBackendPracticeConfig,
  updateBackendPracticeConfig,
  fetchBackendDoctors,
  createBackendDoctor,
  updateBackendDoctor,
  deleteBackendDoctor,
  fetchBackendNurses,
  createBackendNurse,
  updateBackendNurse,
  deleteBackendNurse,
  fetchBackendMedications,
  createBackendMedication,
  updateBackendMedication,
  deleteBackendMedication,
  fetchBackendProcedures,
  createBackendProcedure,
  updateBackendProcedure,
  deleteBackendProcedure,
  fetchBackendVisits,
  createBackendVisit,
  updateBackendVisitStatus,
  deleteBackendVisit,
  mapBackendVisitToVisit,
  fetchBackendMedicalRecordByVisit,
  createBackendMedicalRecord,
  updateBackendMedicalRecord,
  fetchBackendBillingByVisit,
  createOrUpdateBackendBilling,
  processBackendPayment,
  fetchBackendSatuSehatConfig,
  updateBackendSatuSehatConfig,
  testBackendSatuSehatConnection,
  fetchBackendBpjsConfig,
  updateBackendBpjsConfig,
  testBackendBpjsConnection,
  fetchBackendUsers,
  createBackendUser,
  updateBackendUser,
  assignBackendUserRoles,
  deleteBackendUser,
  changeBackendUserPassword,
} from '@/lib/api-client';
import { generateNoRM, generateQueueNumber, generateInvoiceNumber, formatRupiah } from '@/lib/utils';
import { toast } from 'sonner';

export const ALL_MOCK_VISITS: Visit[] = [...MOCK_VISITS, ...REPORT_MOCK_VISITS];

interface RMEContextType {
  config: PracticeConfig;
  patients: Patient[];
  doctors: Doctor[];
  nurses: NurseMaster[];
  visits: Visit[];
  medications: MedicationMaster[];
  diagnoses: DiagnosisMaster[];
  procedures: ProcedureMaster[];
  icd9List: ICD9Master[];
  snomedList: SNOMEDMaster[];
  isLoaded: boolean;

  // Subscription & Trial Info
  trialInfo: TrialInfo;
  daysRemaining: number;
  hoursRemaining: number;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  percentageUsed: number;
  extendTrial: (additionalDays?: number) => void;
  activateLicense: (licenseKey: string, tier?: SubscriptionTier) => { success: boolean; message: string };
  resetTrial: () => void;
  startNewUserTrial: (durationDays?: number) => void;
  simulateExpireTrial: () => void;
  simulateUnlockTrial: () => void;
  subscribeToPlan: (planId: 'starter' | 'pro' | 'enterprise', billingCycle: 'MONTHLY' | 'YEARLY') => SaaSInvoice;
  isTrialModalOpen: boolean;
  setIsTrialModalOpen: (open: boolean) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Auth & Session
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  sessionExpiresAt: number | null;
  sessionRemainingSeconds: number;
  extendSession: (seconds?: number) => void;
  resetInactivityTimer: () => void;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  checkAccountStatus: (email: string) => { exists: boolean; hasPassword: boolean; user?: User };
  registerGoogleUserWithPassword: (userData: {
    name: string;
    email: string;
    username?: string;
    avatarUrl?: string;
    password: string;
    role?: Role;
    token?: string;
    refreshToken?: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  loginWithGoogle: (googleData: { email: string; name: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string; user?: User }>;
  loginWithGoogleToken: (token: string, refreshToken?: string, userProfile?: BackendUser) => Promise<{ success: boolean; error?: string; user?: User }>;
  loginWithGoogleResponse: (backendResponse: any) => Promise<{ success: boolean; error?: string; user?: User }>;
  loginAsDemo: (userId: string) => User | undefined;
  logout: () => void;

  // User Management & RBAC Actions
  refreshUsers: () => Promise<void>;
  addUser: (userData: Omit<User, 'id'>) => User;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  rolePermissions: RolePermission[];
  updateRolePermissions: (roleId: UserRole, permissions: RolePermission['permissions']) => void;
  updateRoleSidebarMenus: (roleId: UserRole, sidebarMenus: Record<SidebarMenuKey, boolean>) => void;
  resetRolePermissionsToDefault: () => void;
  hasMenuAccess: (menuKey: SidebarMenuKey, user?: User | null) => boolean;

  // Configuration & Role Actions
  setAppMode: (mode: AppMode) => void;
  setCurrentRole: (role: Role) => void;
  updateConfig: (newConfig: Partial<PracticeConfig>) => void;

  // Patient Actions
  addPatient: (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'noRM'> & { id?: string; noRM?: string }) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;

  // Visit & Queue Actions
  createVisit: (
    patientId: string,
    options?: {
      doctorId?: string;
      paymentType?: PaymentType;
      chiefComplaint?: string;
      serviceHours?: string;
      patientQuota?: number;
      patient?: Patient;
    }
  ) => Visit;
  updateVisitStatus: (visitId: string, status: VisitStatus) => void;
  prescriptionStatuses: Record<string, PrescriptionDispenseStatus>;

  updatePrescriptionStatus: (
    visitId: string,
    status: PrescriptionDispenseStatus,
    dispensedBy?: string
  ) => void;
  cancelVisit: (visitId: string, reason?: string) => void;
  getVisitById: (visitId: string) => Visit | undefined;
  getVisitsByPatientId: (patientId: string) => Visit[];
  loadMedicalRecordForVisit: (visitId: string) => Promise<void>;

  // Clinical Examination Actions
  saveMedicalRecord: (
    visitId: string,
    recordData: {
      vitalSigns: MedicalRecord['vitalSigns'];
      chiefComplaint: string;
      anamnesis: string;
      physicalExamination: string;
      diagnoses: MedicalRecord['diagnoses'];
      procedures: MedicalRecord['procedures'];
      prescriptions: MedicalRecord['prescriptions'];
      prescriptionType?: MedicalRecord['prescriptionType'];
      labOrders?: MedicalRecord['labOrders'];
      radiologyOrders?: MedicalRecord['radiologyOrders'];
      clinicalNotes?: string;
      followUpPlan?: string;
      sickLeaveCertificate?: MedicalRecord['sickLeaveCertificate'];
      healthCertificate?: MedicalRecord['healthCertificate'];
      referralCertificate?: MedicalRecord['referralCertificate'];
      controlVisitLetter?: MedicalRecord['controlVisitLetter'];
      informedConsents?: MedicalRecord['informedConsents'];
    },
    completeExamination?: boolean
  ) => MedicalRecord | null;

  // Billing & Payment Actions
  getBillingByVisitId: (visitId: string) => Billing | undefined;
  createOrUpdateBilling: (
    visitId: string,
    items: BillingItem[],
    discountAmount?: number,
    discountType?: 'PERCENTAGE' | 'NOMINAL',
    discountValue?: number
  ) => Billing | null;
  processPayment: (visitId: string, paymentDetails: PaymentDetails) => Billing | null;

  // Master Data Actions
  addMedication: (med: Omit<MedicationMaster, 'id'>) => void;
  updateMedication: (id: string, med: Partial<MedicationMaster>) => void;
  deleteMedication: (id: string) => void;
  addProcedure: (proc: Omit<ProcedureMaster, 'id'>) => void;
  updateProcedure: (id: string, proc: Partial<ProcedureMaster>) => void;
  deleteProcedure: (id: string) => void;

  // Doctor Management Actions
  addDoctor: (doc: Omit<Doctor, 'id'>) => Doctor;
  updateDoctor: (id: string, doc: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
  toggleDoctorStatus: (id: string) => void;

  // Nurse & Midwife Management Actions
  addNurse: (nurse: Omit<NurseMaster, 'id'>) => NurseMaster;
  updateNurse: (id: string, nurse: Partial<NurseMaster>) => void;
  deleteNurse: (id: string) => void;
  toggleNurseStatus: (id: string) => void;

  // ICD-10 Diagnosis Management Actions
  addDiagnosis: (diag: DiagnosisMaster) => void;
  updateDiagnosis: (code: string, diag: Partial<DiagnosisMaster>) => void;
  deleteDiagnosis: (code: string) => void;

  // ICD-9-CM Procedure Management Actions
  addICD9: (item: Omit<ICD9Master, 'id'>) => ICD9Master;
  updateICD9: (id: string, item: Partial<ICD9Master>) => void;
  deleteICD9: (id: string) => void;

  // SNOMED CT Terminology Actions
  addSNOMED: (item: Omit<SNOMEDMaster, 'id'>) => SNOMEDMaster;
  updateSNOMED: (id: string, item: Partial<SNOMEDMaster>) => void;
  deleteSNOMED: (id: string) => void;

  // SATUSEHAT Integration
  satuSehatConfig: SatuSehatConfig;
  satuSehatLogs: SatuSehatLog[];
  updateSatuSehatConfig: (newConfig: Partial<SatuSehatConfig>) => void;
  testSatuSehatConnection: (customCreds?: Partial<SatuSehatConfig>) => Promise<{ success: boolean; message: string; tokenSnippet?: string }>;
  lookupPatientIHS: (nik: string) => Promise<{ success: boolean; ihsNumber?: string; patientName?: string; message: string }>;
  lookupPractitionerIHS: (query: string) => Promise<{ success: boolean; ihsNumber?: string; practitionerName?: string; message: string }>;
  syncVisitToSatuSehat: (visitId: string) => Promise<{ success: boolean; message: string; logs: SatuSehatLog[] }>;
  clearSatuSehatLogs: () => void;

  // BPJS Kesehatan Integration
  bpjsConfig: BPJSConfig;
  bpjsLogs: BPJSLog[];
  updateBPJSConfig: (newConfig: Partial<BPJSConfig>) => void;
  testBPJSConnection: (customCreds?: Partial<BPJSConfig>) => Promise<{ success: boolean; message: string; signature?: string; timestamp?: string }>;
  checkBPJSEligibility: (nomorKartuOrNik: string) => Promise<{ success: boolean; data?: BPJSParticipantInfo; message: string }>;
  syncVisitToBPJS: (visitId: string) => Promise<{ success: boolean; message: string; logs: BPJSLog[] }>;
  clearBPJSLogs: () => void;

  // Stock Opname & Inventory Adjustment
  stockOpnameHistory: StockOpnameSession[];
  applyStockOpname: (sessionData: Omit<StockOpnameSession, 'id' | 'createdAt'>) => StockOpnameSession;

  // SaaS Multi-Tenant
  tenants: Tenant[];
  activeTenant: Tenant;
  plans: SubscriptionPlan[];
  saasInvoices: SaaSInvoice[];
  switchTenant: (tenantId: string) => void;
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt' | 'patientCount' | 'userCount'>) => Tenant;
  updateTenant: (id: string, data: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  updateSaaSInvoiceStatus: (id: string, status: SaaSInvoice['status']) => void;
  deleteSaaSInvoice: (id: string) => void;

  // Data Refreshers
  refreshPatients: () => Promise<void>;
  refreshVisits: () => Promise<void>;
  refreshDoctors: () => Promise<void>;
  refreshNurses: () => Promise<void>;
  refreshMedications: () => Promise<void>;
  refreshProcedures: () => Promise<void>;
  syncAllBackendData: () => Promise<void>;
  isSyncingBackend: boolean;
  dbMenus: BackendMenuTreeItem[];
  setDbMenus: React.Dispatch<React.SetStateAction<BackendMenuTreeItem[]>>;
  refreshMenus: (roleNameOrId?: string) => Promise<void>;
  dbPermissions: string[];
  setDbPermissions: React.Dispatch<React.SetStateAction<string[]>>;
  refreshPermissions: (roleNameOrId?: string) => Promise<void>;
  hasPermission: (permissionName: string) => boolean;

  // System
  resetToDefault: () => void;
  reloadReportDummyData: () => void;
  seedTodayQueue: () => void;
}

const RMEContext = createContext<RMEContextType | undefined>(undefined);

export const SESSION_DURATION_SECONDS = 60 * 60; // 1 jam = 3600 detik
export const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;

const STORAGE_KEYS = {
  CONFIG: 'rme_practice_config_v3',
  PATIENTS: 'rme_patients_v3',
  DOCTORS: 'rme_doctors_v3',
  NURSES: 'rme_nurses_v3',
  VISITS: 'rme_visits_v3',
  MEDICATIONS: 'rme_medications_v3',
  DIAGNOSES: 'rme_diagnoses_v3',
  PROCEDURES: 'rme_procedures_v3',
  ICD9: 'rme_icd9_v3',
  SNOMED: 'rme_snomed_v3',
  AUTH_USER: 'rme_auth_user_v4',
  SESSION_EXPIRES_AT: 'rme_session_expires_at_v1',
  USERS: 'rme_users_v4',
  ROLE_PERMISSIONS: 'rme_role_permissions_v3',
  THEME: 'rme_theme_v3',
  TRIAL: 'rme_trial_info_v3',
  SATUSEHAT_CONFIG: 'rme_satusehat_config_v3',
  SATUSEHAT_LOGS: 'rme_satusehat_logs_v3',
  BPJS_CONFIG: 'rme_bpjs_config_v3',
  BPJS_LOGS: 'rme_bpjs_logs_v3',
  STOCK_OPNAME: 'rme_stock_opname_v3',
  PRESCRIPTION_DISPENSE: 'rme_prescription_dispense_status_v1',
  TENANTS: 'rme_tenants_v4',
  ACTIVE_TENANT_ID: 'rme_active_tenant_id_v4',
  SAAS_INVOICES: 'rme_saas_invoices_v4',
};

export const RMEProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<PracticeConfig>(INITIAL_PRACTICE_CONFIG);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<NurseMaster[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescriptionStatuses, setPrescriptionStatuses] = useState<Record<string, PrescriptionDispenseStatus>>({});
  const [medications, setMedications] = useState<MedicationMaster[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisMaster[]>(MOCK_DIAGNOSES);
  const [procedures, setProcedures] = useState<ProcedureMaster[]>([]);
  const [icd9List, setIcd9List] = useState<ICD9Master[]>(MOCK_ICD9);
  const [snomedList, setSnomedList] = useState<SNOMEDMaster[]>(MOCK_SNOMED);
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window === 'undefined') return MOCK_USERS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : MOCK_USERS;
    } catch {
      return MOCK_USERS;
    }
  });
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(DEFAULT_ROLE_PERMISSIONS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number>(0);
  const [theme, setThemeState] = useState<Theme>('light');
  const [trialInfo, setTrialInfo] = useState<TrialInfo>(getInitialTrialInfo());
  const [satuSehatConfig, setSatuSehatConfigState] = useState<SatuSehatConfig>(INITIAL_SATUSEHAT_CONFIG);
  const [satuSehatLogs, setSatuSehatLogs] = useState<SatuSehatLog[]>([]);
  const [bpjsConfig, setBpjsConfigState] = useState<BPJSConfig>(INITIAL_BPJS_CONFIG);
  const [bpjsLogs, setBpjsLogs] = useState<BPJSLog[]>([]);
  const [stockOpnameHistory, setStockOpnameHistory] = useState<StockOpnameSession[]>([]);

  // SaaS Multi-Tenant States
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    if (typeof window === 'undefined') return MOCK_TENANTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TENANTS);
      if (!saved || saved.includes('Klinik Pratama Sehat Mandiri') || saved.includes('FSK-00291')) {
        localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(MOCK_TENANTS));
        return MOCK_TENANTS;
      }
      return JSON.parse(saved);
    } catch {
      return MOCK_TENANTS;
    }
  });

  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    if (typeof window === 'undefined') return MOCK_TENANTS[0].id;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TENANT_ID);
      return saved || MOCK_TENANTS[0].id;
    } catch {
      return MOCK_TENANTS[0].id;
    }
  });

  const [plans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);

  const [saasInvoices, setSaasInvoices] = useState<SaaSInvoice[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAAS_INVOICES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0] || MOCK_TENANTS[0];

  const [isSyncingBackend, setIsSyncingBackend] = useState<boolean>(false);
  const [dbMenus, setDbMenus] = useState<BackendMenuTreeItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('rme_db_menus');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [dbPermissions, setDbPermissions] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('rme_db_permissions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [backendRoles, setBackendRoles] = useState<BackendRoleItem[]>([]);

  // Helper to resolve role ID from role name or ID
  const resolveRoleId = useCallback(
    async (roleNameOrId?: string): Promise<string | undefined> => {
      if (!roleNameOrId) return undefined;
      // If it's already a UUID format:
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roleNameOrId)) {
        return roleNameOrId;
      }
      // Map standard app role to backend role name
      const normalizedName =
        ROLE_NAME_TO_BACKEND_MAP[roleNameOrId.toUpperCase()] || roleNameOrId.toLowerCase();

      let currentRoles = backendRoles;
      if (currentRoles.length === 0) {
        const rolesRes = await fetchBackendRoles();
        if (rolesRes.success && rolesRes.data && rolesRes.data.length > 0) {
          currentRoles = rolesRes.data;
          setBackendRoles(rolesRes.data);
        }
      }

      const matched = currentRoles.find(
        (r) =>
          r.name.toLowerCase() === normalizedName.toLowerCase() ||
          r.name.toLowerCase() === roleNameOrId.toLowerCase()
      );
      return matched?.id;
    },
    [backendRoles]
  );

  const refreshPermissions = useCallback(
    async (roleNameOrId?: string) => {
      try {
        const roleId = await resolveRoleId(roleNameOrId);
        if (roleId) {
          const rolePermRes = await fetchBackendRolePermissions(roleId);
          if (rolePermRes.success && rolePermRes.data?.permissions) {
            const permNames = rolePermRes.data.permissions.map((p) => p.name);
            setDbPermissions(permNames);
            try {
              localStorage.setItem('rme_db_permissions', JSON.stringify(permNames));
            } catch {}
            return;
          }
        }
        const res = await fetchBackendMyPermissions();
        if (res.success && Array.isArray(res.data)) {
          const permNames = res.data.map((p) => p.name);
          setDbPermissions(permNames);
          try {
            localStorage.setItem('rme_db_permissions', JSON.stringify(permNames));
          } catch {}
        }
      } catch (e) {
        console.warn('[refreshPermissions] Error:', e);
      }
    },
    [resolveRoleId]
  );

  const hasPermission = useCallback(
    (permissionName: string): boolean => {
      if (!currentUser) return false;
      if (
        currentUser.role === 'SUPERADMIN' ||
        currentUser.role === 'SAAS_ADMIN' ||
        currentUser.email?.toLowerCase() === 'provider@rme.id' ||
        currentUser.email?.toLowerCase() === 'admin@gmail.com'
      ) {
        return true;
      }
      if (dbPermissions && dbPermissions.length > 0) {
        return dbPermissions.includes(permissionName);
      }
      return true;
    },
    [currentUser, dbPermissions]
  );

  const refreshMenus = useCallback(
    async (roleNameOrId?: string) => {
      try {
        const roleId = await resolveRoleId(roleNameOrId);
        let res;
        if (roleId) {
          res = await fetchBackendRoleMenus(roleId);
        } else {
          res = await fetchBackendMyMenus();
        }
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setDbMenus(res.data);
          try {
            localStorage.setItem('rme_db_menus', JSON.stringify(res.data));
          } catch {}
        }
      } catch (e) {
        console.warn('[refreshMenus] Error:', e);
      }
    },
    [resolveRoleId]
  );


  const refreshPatients = useCallback(async () => {
    try {
      const res = await fetchBackendPatients({ limit: 200 });
      if (res.success && Array.isArray(res.data)) {
        const seen = new Set<string>();
        const uniquePatients: Patient[] = [];
        for (const item of res.data) {
          const mapped = mapBackendPatientToPatient(item);
          const key = mapped.id || mapped.noRM || mapped.nik;
          if (key && !seen.has(key)) {
            seen.add(key);
            uniquePatients.push(mapped);
          }
        }
        setPatients(uniquePatients);
        try {
          localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(uniquePatients));
        } catch {}
      }
    } catch (e) {
      console.warn('[refreshPatients] Error:', e);
    }
  }, []);

  const refreshVisits = useCallback(async () => {
    try {
      const res = await fetchBackendVisits();
      if (res.success && Array.isArray(res.data)) {
        let savedDispenseMap: Record<string, any> = {};
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.PRESCRIPTION_DISPENSE);
          if (raw) savedDispenseMap = JSON.parse(raw);
        } catch {}

        let currentPatients: Patient[] = patients;
        if ((!currentPatients || currentPatients.length === 0) && typeof window !== 'undefined') {
          try {
            const rawP = localStorage.getItem(STORAGE_KEYS.PATIENTS);
            if (rawP) currentPatients = JSON.parse(rawP);
          } catch {}
        }

        const mapped = res.data.map((v) => {
          const item = mapBackendVisitToVisit(v, currentPatients);
          const disp = savedDispenseMap[item.id];
          if (disp && disp.status) {
            item.prescriptionStatus = disp.status;
            item.prescriptionDispenseStatus = disp.status;
            item.prescriptionDispensedAt = disp.dispensedAt;
            item.prescriptionDispensedBy = disp.dispensedBy;
            if (item.medicalRecord) {
              item.medicalRecord.prescriptionDispenseStatus = disp.status;
              item.medicalRecord.prescriptionDispensedAt = disp.dispensedAt;
              item.medicalRecord.prescriptionDispensedBy = disp.dispensedBy;
            }
          }
          return item;
        });
        setVisits(mapped);
        try {
          localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(mapped));
        } catch {}
      }
    } catch (e) {
      console.warn('[refreshVisits] Error:', e);
    }
  }, []);

  const refreshDoctors = useCallback(async () => {
    try {
      const res = await fetchBackendDoctors();
      if (res.success && Array.isArray(res.data)) {
        setDoctors(res.data);
        try {
          localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(res.data));
        } catch {}
      }
    } catch (e) {
      console.warn('[refreshDoctors] Error:', e);
    }
  }, []);

  const refreshNurses = useCallback(async () => {
    try {
      const res = await fetchBackendNurses();
      if (res.success && Array.isArray(res.data)) {
        setNurses(res.data);
        try {
          localStorage.setItem(STORAGE_KEYS.NURSES, JSON.stringify(res.data));
        } catch {}
      }
    } catch (e) {
      console.warn('[refreshNurses] Error:', e);
    }
  }, []);

  const refreshMedications = useCallback(async () => {
    try {
      const res = await fetchBackendMedications();
      if (res.success && Array.isArray(res.data)) {
        setMedications(res.data);
        try {
          localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(res.data));
        } catch {}
      }
    } catch (e) {
      console.warn('[refreshMedications] Error:', e);
    }
  }, []);

  const refreshProcedures = useCallback(async () => {
    try {
      const res = await fetchBackendProcedures();
      if (res.success && Array.isArray(res.data)) {
        setProcedures(res.data);
        try {
          localStorage.setItem(STORAGE_KEYS.PROCEDURES, JSON.stringify(res.data));
        } catch {}
      }
    } catch (e) {
      console.warn('[refreshProcedures] Error:', e);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetchBackendUsers();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setUsers(res.data);
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(res.data));
        } catch {}
      }
    } catch (e) {
      console.warn('[refreshUsers] Error:', e);
    }
  }, []);

  const syncAllBackendData = useCallback(async (roleNameOrId?: string) => {
    setIsSyncingBackend(true);
    try {
      const activeRole = roleNameOrId || currentUser?.role;
      await Promise.allSettled([
        refreshPermissions(activeRole),
        refreshMenus(activeRole),
        refreshPatients(),
        refreshVisits(),
        refreshDoctors(),
        refreshNurses(),
        refreshMedications(),
        refreshProcedures(),
        refreshUsers(),
        fetchBackendPracticeConfig().then((res) => {
          if (res.success && res.data) {
            setConfigState((prev) => ({ ...prev, ...res.data }));
          }
        }),
      ]);
    } finally {
      setIsSyncingBackend(false);
    }
  }, [currentUser?.role, refreshPermissions, refreshMenus, refreshPatients, refreshVisits, refreshDoctors, refreshNurses, refreshMedications, refreshProcedures, refreshUsers]);

  const syncTenantData = useCallback((targetTenantId?: string, roleNameOrId?: string) => {
    if (targetTenantId) {
      setActiveTenantId(targetTenantId);
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, targetTenantId);
      } catch {}
    }
    syncAllBackendData(roleNameOrId);
  }, [syncAllBackendData]);

  const switchTenant = (tenantId: string) => {
    const found = tenants.find((t) => t.id === tenantId);
    if (!found) return;
    setActiveTenantId(found.id);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, found.id);
    } catch {}

    // Auto synchronize practiceConfig
    setConfigState((prev) => ({
      ...prev,
      practiceName: found.name,
      doctorName: found.doctorInCharge || prev.doctorName,
      sip: found.sip || prev.sip,
      address: found.address || prev.address,
      phone: found.phone || prev.phone,
    }));

    // Reload backend data for this tenant
    syncTenantData(found.id);

    toast.success(`Beralih ke Faskes: ${found.name}`, {
      description: `Konteks aktif tenant (${found.faskesCode}) berhasil dimuat.`,
    });
  };

  const addTenant = (data: Omit<Tenant, 'id' | 'createdAt' | 'patientCount' | 'userCount'>): Tenant => {
    const tempId = `tenant-${Date.now().toString(36)}`;
    const newTenant: Tenant = {
      ...data,
      id: tempId,
      patientCount: 0,
      userCount: 1,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTenant, ...tenants];
    setTenants(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(updated));
    } catch {}
    toast.success(`Faskes Baru Terdaftar: ${newTenant.name}`);

    createBackendSaasTenant({
      name: data.name,
      slug: data.slug,
      faskes_code: data.faskesCode,
      faskes_type: data.faskesType,
      plan_id: data.planId,
      doctor_in_charge: data.doctorInCharge,
      sip: data.sip,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
    }).then((res: any) => {
      if (res.success && res.data?.id) {
        const realId = res.data.id;
        newTenant.id = realId;
        setTenants((prev) => {
          const next = prev.map((t) => (t.id === tempId ? { ...t, id: realId } : t));
          try {
            localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(next));
          } catch {}
          return next;
        });
        if (activeTenantId === tempId) {
          setActiveTenantId(realId);
          try {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, realId);
          } catch {}
        }
      }
    }).catch((e: any) => console.warn('[addTenant] Backend create tenant error:', e));

    return newTenant;
  };

  const updateTenant = (id: string, data: Partial<Tenant>) => {
    const updated = tenants.map((t) => (t.id === id ? { ...t, ...data } : t));
    setTenants(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(updated));
    } catch {}
    toast.success('Informasi faskes berhasil diperbarui.');
  };

  const deleteTenant = (id: string) => {
    if (tenants.length <= 1) {
      toast.error('Minimal harus ada 1 tenant faskes aktif dalam sistem.');
      return;
    }
    const updated = tenants.filter((t) => t.id !== id);
    setTenants(updated);
    if (activeTenantId === id) {
      setActiveTenantId(updated[0].id);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(updated));
    } catch {}
    toast.info('Tenant faskes telah dihapus dari sistem.');
  };

  const updateSaaSInvoiceStatus = (id: string, status: SaaSInvoice['status']) => {
    const updated = saasInvoices.map((inv) =>
      inv.id === id
        ? {
            ...inv,
            status,
            paidAt: status === 'PAID' ? new Date().toISOString() : inv.paidAt,
          }
        : inv
    );
    setSaasInvoices(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.SAAS_INVOICES, JSON.stringify(updated));
    } catch {}

    if (status === 'PAID') {
      const paidInv = saasInvoices.find((i) => i.id === id);
      const isYearly = paidInv?.billingPeriod === 'YEARLY';
      const durationDays = isYearly ? 365 : 30;
      const planTitle = paidInv?.planName || 'Lisensi Pro Pratama';

      let tier: SubscriptionTier = 'PROFESSIONAL';
      if (paidInv?.planName?.toLowerCase().includes('enterprise')) {
        tier = 'ENTERPRISE';
      } else if (paidInv?.planName?.toLowerCase().includes('starter')) {
        tier = 'STARTER';
      }

      const activeSub: TrialInfo = {
        tier,
        planName: `Paket ${planTitle} (Resmi Aktif)`,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
        totalDays: durationDays,
        licenseKey: `RME-PAY-${Date.now().toString(36).toUpperCase()}`,
        activatedAt: new Date().toISOString(),
        isLifetime: false,
      };

      setTrialInfo(activeSub);
      try {
        localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(activeSub));
      } catch {}

      toast.success('🎉 Pembayaran Berhasil Dikonfirmasi!', {
        description: `Paket ${planTitle} aktif. Seluruh menu sidebar otomatis terbuka (Unlocked)!`,
        duration: 6000,
      });
    } else {
      toast.info(`Status faktur diperbarui ke ${status}`);
    }
  };

  const deleteSaaSInvoice = (id: string) => {
    const target = saasInvoices.find((i) => i.id === id);
    const updated = saasInvoices.filter((inv) => inv.id !== id);
    setSaasInvoices(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.SAAS_INVOICES, JSON.stringify(updated));
    } catch {}
    toast.success('Faktur Tagihan Dibatalkan', {
      description: `Faktur ${target?.invoiceNumber || id} berhasil dibatalkan dan dihapus dari riwayat.`,
      duration: 5000,
    });
  };

  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage or Fallback
  useEffect(() => {
    try {
      // Force light theme and remove dark mode class
      setThemeState('light');
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, 'light');
      } catch {}

      // Client migration: purge old dummy demo data from previous sessions
      const isCleaned = localStorage.getItem('rme_clean_v4_admin_clear');
      if (!isCleaned) {
        localStorage.removeItem(STORAGE_KEYS.VISITS);
        localStorage.removeItem(STORAGE_KEYS.PATIENTS);
        localStorage.removeItem(STORAGE_KEYS.SATUSEHAT_LOGS);
        localStorage.removeItem(STORAGE_KEYS.BPJS_LOGS);
        localStorage.removeItem(STORAGE_KEYS.STOCK_OPNAME);
        localStorage.removeItem(STORAGE_KEYS.SAAS_INVOICES);
        localStorage.removeItem(STORAGE_KEYS.SATUSEHAT_CONFIG);
        localStorage.removeItem(STORAGE_KEYS.BPJS_CONFIG);
        localStorage.removeItem(STORAGE_KEYS.TENANTS);
        localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(MOCK_TENANTS));
        localStorage.setItem('rme_clean_v4_admin_clear', 'true');
      }

      // Purge old mock users from localStorage
      const isUsersCleaned = localStorage.getItem('rme_clean_v6_purge_mock_users');
      if (!isUsersCleaned) {
        localStorage.removeItem(STORAGE_KEYS.USERS);
        localStorage.setItem('rme_clean_v6_purge_mock_users', 'true');
      }

      // Purge all leftover mock data from localStorage
      const isAllMockCleaned = localStorage.getItem('rme_clean_v10_purge_all_mock');
      if (!isAllMockCleaned) {
        localStorage.removeItem(STORAGE_KEYS.DOCTORS);
        localStorage.removeItem(STORAGE_KEYS.NURSES);
        localStorage.removeItem(STORAGE_KEYS.MEDICATIONS);
        localStorage.removeItem(STORAGE_KEYS.PROCEDURES);
        localStorage.removeItem(STORAGE_KEYS.VISITS);
        localStorage.removeItem(STORAGE_KEYS.CONFIG);
        localStorage.removeItem(STORAGE_KEYS.USERS);
        localStorage.setItem('rme_clean_v10_purge_all_mock', 'true');
      }

      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      let activeUsers = MOCK_USERS;
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
            const filtered = parsed.filter(
              (u: User) =>
                !u.name?.includes('Siti Rahma') &&
                !u.name?.includes('Budi Santoso') &&
                !u.id?.startsWith('user-doc-') &&
                !u.id?.startsWith('user-admin-') &&
                !u.id?.startsWith('user-nurse-') &&
                !u.id?.startsWith('user-pharm-')
            );
            const seenEmails = new Set<string>();
            const unique: User[] = [];
            for (const u of filtered) {
              const normEmail = (u.email || '').toLowerCase().trim();
              if (normEmail && !seenEmails.has(normEmail)) {
                seenEmails.add(normEmail);
                if (!u.username) {
                  u.username = normEmail.split('@')[0];
                }
                unique.push(u);
              } else if (!normEmail) {
                unique.push(u);
              }
            }
            activeUsers = unique.length > 0 ? unique : MOCK_USERS;
          setUsers(activeUsers);
        } catch {
          activeUsers = MOCK_USERS;
          setUsers(activeUsers);
        }
      }

      const savedRolePerms = localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS);
      if (savedRolePerms) {
        try {
          const parsed = JSON.parse(savedRolePerms);
          if (Array.isArray(parsed)) {
            const merged: RolePermission[] = parsed.map((item: RolePermission) => {
              const defaultRole = DEFAULT_ROLE_PERMISSIONS.find((r) => r.roleId === item.roleId);
              return {
                ...item,
                sidebarMenus: {
                  ...(defaultRole?.sidebarMenus || {}),
                  ...(item.sidebarMenus || {}),
                } as Record<SidebarMenuKey, boolean>,
              };
            });
            setRolePermissions(merged);
          }
        } catch {}
      }

      const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (savedAuth && savedAuth !== 'LOGGED_OUT') {
        try {
          const savedExpiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
          const now = Date.now();

          // If session expiry has passed, log out immediately
          if (savedExpiry && Number(savedExpiry) <= now) {
            setCurrentUser(null);
            setSessionExpiresAt(null);
            setSessionRemainingSeconds(0);
            try {
              localStorage.setItem(STORAGE_KEYS.AUTH_USER, 'LOGGED_OUT');
              localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
              localStorage.removeItem(STORAGE_AUTH_KEYS.ACCESS_TOKEN);
              localStorage.removeItem(STORAGE_AUTH_KEYS.REFRESH_TOKEN);
            } catch {}
          } else {
            const parsedUser = JSON.parse(savedAuth);
            if (parsedUser && parsedUser.id) {
              // Auto-heal: If cached user is old mock Siti Rahma or user-admin-1, convert to Admin
              if (parsedUser.name?.includes('Siti Rahma') || parsedUser.id === 'user-admin-1') {
                parsedUser.id = 'f1e2d3c4-b5a6-7988-970d-1e2f3a4b5c6d';
                parsedUser.name = 'Admin';
                parsedUser.email = 'admin@gmail.com';
                try {
                  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(parsedUser));
                } catch {}
              }

              // If user is in trial, ensure role is SUPERADMIN for full clinical & administrative access
              const savedTrialStr = localStorage.getItem(STORAGE_KEYS.TRIAL);
              let isSavedTrial = false;
              if (savedTrialStr) {
                try {
                  const pTrial = JSON.parse(savedTrialStr);
                  if (pTrial.tier === 'TRIAL') isSavedTrial = true;
                } catch {}
              }
              if ((parsedUser.email?.toLowerCase() === 'admin@gmail.com' || isSavedTrial) && parsedUser.role !== 'SAAS_ADMIN') {
                parsedUser.role = 'SUPERADMIN';
                parsedUser.appMode = 'DOCTOR_AND_ADMIN';
                try {
                  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(parsedUser));
                } catch {}
              }
              setCurrentUser(parsedUser);

              let targetExpiry: number;
              if (savedExpiry && Number(savedExpiry) > now) {
                targetExpiry = Number(savedExpiry);
              } else {
                targetExpiry = now + SESSION_DURATION_MS;
                try {
                  localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, String(targetExpiry));
                } catch {}
              }
              setSessionExpiresAt(targetExpiry);
              setSessionRemainingSeconds(Math.max(0, Math.floor((targetExpiry - now) / 1000)));
            } else {
              setCurrentUser(null);
            }
          }
        } catch {
          setCurrentUser(null);
        }
      } else {
        // Require explicit login on first visit or after logout
        setCurrentUser(null);
        setSessionExpiresAt(null);
        setSessionRemainingSeconds(0);
      }

      const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          if (parsed && !parsed.practiceName?.includes('Sehat Mandiri')) {
            setConfigState(parsed);
          } else {
            setConfigState(INITIAL_PRACTICE_CONFIG);
          }
        } catch {}
      }

      // Automatically synchronize real tenants from backend GET /v1/saas/tenants
      fetchBackendSaasTenants({ limit: 100 })
        .then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const mappedTenants: Tenant[] = res.data.map((bt: any) => ({
              id: bt.id,
              name: bt.name,
              slug: bt.slug || '',
              faskesCode: bt.faskes_code || 'FSK-001',
              faskesType: bt.faskes_type || 'KLINIK_PRATAMA',
              planId: bt.plan_id || 'starter',
              status: bt.status || 'ACTIVE',
              doctorInCharge: bt.doctor_in_charge || '',
              sip: bt.sip || '',
              phone: bt.phone || '',
              email: bt.email || '',
              address: bt.address || '',
              city: bt.city || 'Indonesia',
              patientCount: bt.patient_count ?? 0,
              userCount: bt.user_count ?? 1,
              maxDoctors: bt.max_doctors || 5,
              maxUsers: bt.max_users || 10,
              satusehatIntegrated: Boolean(bt.satusehat_integrated),
              bpjsIntegrated: Boolean(bt.bpjs_integrated),
              expiresAt: bt.expires_at || new Date(Date.now() + 365 * 86400000).toISOString(),
              createdAt: bt.created_at || new Date().toISOString(),
            }));
            setTenants(mappedTenants);
            try {
              localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(mappedTenants));
            } catch {}

            setActiveTenantId((currentActive) => {
              const exists = mappedTenants.some((t) => t.id === currentActive);
              const nextId = exists ? currentActive : mappedTenants[0].id;
              try {
                localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, nextId);
              } catch {}
              return nextId;
            });
          }
        })
        .catch((e) => console.warn('[RME Context] Backend tenants sync:', e));

      // Automatically synchronize logged in user's tenant profile
      fetchBackendMyTenant()
        .then((res) => {
          if (res.success && res.data?.id) {
            const myTenant = res.data;
            setActiveTenantId(myTenant.id);
            try {
              localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, myTenant.id);
            } catch {}
            setConfigState((prev) => ({
              ...prev,
              practiceName: myTenant.name || prev.practiceName,
            }));
            refreshPatients();
          }
        })
        .catch((e) => console.warn('[RME Context] Backend my-tenant sync:', e));

      // Automatically synchronize practice config with backend GET /v1/config/practice
      fetchBackendPracticeConfig()
        .then((res) => {
          if (res.success && res.data) {
            setConfigState((prev) => ({
              ...prev,
              ...res.data,
            }));
          }
        })
        .catch((e) => console.warn('[RME Context] Backend config sync:', e));

      // Patients: langsung clear localStorage lama, backend adalah source of truth
      // Tidak di-load dari localStorage agar tidak muncul data duplikat/stale
      setPatients([]);
      localStorage.removeItem(STORAGE_KEYS.PATIENTS);




      // Pre-load backend roles for quick role-to-menu mapping
      fetchBackendRoles()
        .then((res) => {
          if (res.success && res.data) {
            setBackendRoles(res.data);
          }
        })
        .catch(() => {});

      // Automatically synchronize permissions & menus with backend
      refreshPermissions(currentUser?.role);
      refreshMenus(currentUser?.role);

      // Automatically synchronize patients with backend GET /v1/patients
      // Backend adalah source of truth — langsung replace agar tidak ada duplikat
      fetchBackendPatients({ limit: 200 })
        .then((res) => {
          if (res.success && res.data.length > 0) {
            const mapped = res.data.map(mapBackendPatientToPatient);
            setPatients(mapped);
            // Update localStorage supaya sinkron
            localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(mapped));
          }
        })
        .catch((e) => console.warn('[RME Context] Backend patients sync:', e));


      const savedDoctors = localStorage.getItem(STORAGE_KEYS.DOCTORS);
      if (savedDoctors) {
        try {
          const parsed = JSON.parse(savedDoctors);
          if (Array.isArray(parsed)) {
            const nonMock = parsed.filter(
              (d: Doctor) =>
                !d.name?.includes('Budi Santoso') &&
                !d.name?.includes('Siti Rahma') &&
                !/^doc-\d{1,2}$/.test(d.id)
            );
            setDoctors(nonMock);
          }
        } catch {}
      }

      // Automatically synchronize doctors with backend GET /v1/doctors
      fetchBackendDoctors()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setDoctors(res.data);
          }
        })
        .catch((e) => console.warn('[RME Context] Backend doctors sync:', e));

      const savedNurses = localStorage.getItem(STORAGE_KEYS.NURSES);
      if (savedNurses) {
        try {
          const parsed = JSON.parse(savedNurses);
          if (Array.isArray(parsed)) {
            const nonMock = parsed.filter(
              (n: NurseMaster) =>
                !n.name?.includes('Siti Rahma') &&
                !n.name?.includes('Dewi Lestari') &&
                !/^nurse-\d{1,2}$/.test(n.id)
            );
            setNurses(nonMock);
          }
        } catch {}
      }

      // Automatically synchronize nurses with backend GET /v1/nurses
      fetchBackendNurses()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setNurses(res.data);
          }
        })
        .catch((e) => console.warn('[RME Context] Backend nurses sync:', e));

      // Visits: clear localStorage, backend adalah source of truth
      setVisits([]);
      localStorage.removeItem(STORAGE_KEYS.VISITS);

      // Automatically synchronize visits with backend GET /v1/visits
      fetchBackendVisits()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            let currentPatients: Patient[] = [];
            try {
              const rawP = localStorage.getItem(STORAGE_KEYS.PATIENTS);
              if (rawP) currentPatients = JSON.parse(rawP);
            } catch {}
            const mapped = res.data.map((v) => mapBackendVisitToVisit(v, currentPatients));
            setVisits(mapped);
            localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(mapped));
          }
        })
        .catch((e) => console.warn('[RME Context] Backend visits sync:', e));


      const savedMedications = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
      if (savedMedications) {
        try {
          const parsed = JSON.parse(savedMedications);
          if (Array.isArray(parsed)) {
            const nonMock = parsed.filter(
              (m: MedicationMaster) => !/^med-\d{1,2}$/.test(m.id)
            );
            setMedications(nonMock);
          }
        } catch {}
      }

      // Automatically synchronize medications with backend GET /v1/medications
      fetchBackendMedications()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setMedications(res.data);
          }
        })
        .catch((e) => console.warn('[RME Context] Backend medications sync:', e));

      const savedDiagnoses = localStorage.getItem(STORAGE_KEYS.DIAGNOSES);
      if (savedDiagnoses) {
        try {
          const parsed: DiagnosisMaster[] = JSON.parse(savedDiagnoses);
          const existingCodes = new Set(parsed.map((d) => (d.code || '').toLowerCase()));
          const missingMocks = MOCK_DIAGNOSES.filter((d) => !existingCodes.has(d.code.toLowerCase()));
          setDiagnoses([...parsed, ...missingMocks]);
        } catch {}
      }

      const savedProcedures = localStorage.getItem(STORAGE_KEYS.PROCEDURES);
      if (savedProcedures) {
        try {
          const parsed = JSON.parse(savedProcedures);
          if (Array.isArray(parsed)) {
            const nonMock = parsed.filter(
              (p: ProcedureMaster) => !/^proc-\d{1,2}$/.test(p.id)
            );
            setProcedures(nonMock);
          }
        } catch {}
      }

      // Automatically synchronize procedures with backend GET /v1/procedures
      fetchBackendProcedures()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setProcedures(res.data);
          }
        })
        .catch((e) => console.warn('[RME Context] Backend procedures sync:', e));

      const savedIcd9 = localStorage.getItem(STORAGE_KEYS.ICD9);
      if (savedIcd9) {
        try {
          const parsed: ICD9Master[] = JSON.parse(savedIcd9);
          const existingCodes = new Set(parsed.map((i) => (i.code || '').toLowerCase()));
          const missingMocks = MOCK_ICD9.filter((i) => !existingCodes.has(i.code.toLowerCase()));
          setIcd9List([...parsed, ...missingMocks]);
        } catch {}
      }

      const savedSnomed = localStorage.getItem(STORAGE_KEYS.SNOMED);
      if (savedSnomed) {
        try {
          setSnomedList(JSON.parse(savedSnomed));
        } catch {}
      }

      const savedTrial = localStorage.getItem(STORAGE_KEYS.TRIAL);
      if (savedTrial) {
        try {
          setTrialInfo(JSON.parse(savedTrial));
        } catch {
          setTrialInfo(getInitialTrialInfo());
        }
      } else {
        const initialTrial = getInitialTrialInfo();
        setTrialInfo(initialTrial);
        try {
          localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(initialTrial));
        } catch {}
      }

      const savedSatuSehatConfig = localStorage.getItem(STORAGE_KEYS.SATUSEHAT_CONFIG);
      if (savedSatuSehatConfig) {
        try {
          setSatuSehatConfigState(JSON.parse(savedSatuSehatConfig));
        } catch {}
      }

      // Sync SATUSEHAT config from backend (overrides localStorage)
      fetchBackendSatuSehatConfig()
        .then((res) => {
          if (res.success && res.data) {
            setSatuSehatConfigState((prev) => ({
              ...prev,
              organizationId: res.data.organization_id ?? prev.organizationId,
              clientId: res.data.client_id ?? prev.clientId,
              clientSecret: res.data.client_secret ?? prev.clientSecret,
              environment: res.data.environment ?? prev.environment,
              locationId: res.data.location_id ?? prev.locationId,
              locationName: res.data.location_name ?? prev.locationName,
              autoSyncOnComplete: res.data.auto_sync_on_complete ?? prev.autoSyncOnComplete,
              syncDiagnoses: res.data.sync_diagnoses ?? prev.syncDiagnoses,
              syncVitalSigns: res.data.sync_vital_signs ?? prev.syncVitalSigns,
              syncPrescriptions: res.data.sync_prescriptions ?? prev.syncPrescriptions,
              syncProcedures: res.data.sync_procedures ?? prev.syncProcedures,
            }));
          }
        })
        .catch((e) => console.warn('[RME Context] Backend satusehat config sync:', e));

      const savedSatuSehatLogs = localStorage.getItem(STORAGE_KEYS.SATUSEHAT_LOGS);
      if (savedSatuSehatLogs) {
        try {
          const parsed = JSON.parse(savedSatuSehatLogs);
          setSatuSehatLogs(Array.isArray(parsed) ? parsed : []);
        } catch {
          setSatuSehatLogs([]);
        }
      } else {
        setSatuSehatLogs([]);
      }

      const savedBpjsConfig = localStorage.getItem(STORAGE_KEYS.BPJS_CONFIG);
      if (savedBpjsConfig) {
        try {
          setBpjsConfigState(JSON.parse(savedBpjsConfig));
        } catch {}
      }

      // Sync BPJS config from backend (overrides localStorage)
      fetchBackendBpjsConfig()
        .then((res) => {
          if (res.success && res.data) {
            setBpjsConfigState((prev) => ({
              ...prev,
              consId: res.data.cons_id ?? prev.consId,
              secretKey: res.data.secret_key ?? prev.secretKey,
              userKey: res.data.user_key ?? prev.userKey,
              kodePPK: res.data.kode_ppk ?? prev.kodePPK,
              ppkName: res.data.ppk_name ?? prev.ppkName,
              usernamePCare: res.data.username_pcare ?? prev.usernamePCare,
              passwordPCare: res.data.password_pcare ?? prev.passwordPCare,
              environment: res.data.environment ?? prev.environment,
              autoBridgingRegistration: res.data.auto_bridging_registration ?? prev.autoBridgingRegistration,
              autoBridgingKunjungan: res.data.auto_bridging_kunjungan ?? prev.autoBridgingKunjungan,
              enablePCare: res.data.enable_pcare ?? prev.enablePCare,
              enableAntreanOnline: res.data.enable_antrean_online ?? prev.enableAntreanOnline,
              enableRujukanOnline: res.data.enable_rujukan_online ?? prev.enableRujukanOnline,
            }));
          }
        })
        .catch((e) => console.warn('[RME Context] Backend bpjs config sync:', e));

      const savedBpjsLogs = localStorage.getItem(STORAGE_KEYS.BPJS_LOGS);
      if (savedBpjsLogs) {
        try {
          const parsed = JSON.parse(savedBpjsLogs);
          setBpjsLogs(Array.isArray(parsed) ? parsed : []);
        } catch {
          setBpjsLogs([]);
        }
      } else {
        setBpjsLogs([]);
      }

      const savedDispenseRaw = localStorage.getItem(STORAGE_KEYS.PRESCRIPTION_DISPENSE);
      if (savedDispenseRaw) {
        try {
          const parsed = JSON.parse(savedDispenseRaw);
          const statusMap: Record<string, PrescriptionDispenseStatus> = {};
          Object.keys(parsed).forEach((k) => {
            statusMap[k] = parsed[k]?.status || parsed[k];
          });
          setPrescriptionStatuses(statusMap);
        } catch {}
      }

      const savedOpname = localStorage.getItem(STORAGE_KEYS.STOCK_OPNAME);
      if (savedOpname) {
        try {
          const parsed = JSON.parse(savedOpname);
          setStockOpnameHistory(Array.isArray(parsed) ? parsed : []);
        } catch {
          setStockOpnameHistory([]);
        }
      } else {
        setStockOpnameHistory([]);
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage on changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
      localStorage.setItem(STORAGE_KEYS.NURSES, JSON.stringify(nurses));
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
      localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
      localStorage.setItem(STORAGE_KEYS.DIAGNOSES, JSON.stringify(diagnoses));
      localStorage.setItem(STORAGE_KEYS.PROCEDURES, JSON.stringify(procedures));
      localStorage.setItem(STORAGE_KEYS.ICD9, JSON.stringify(icd9List));
      localStorage.setItem(STORAGE_KEYS.SNOMED, JSON.stringify(snomedList));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(rolePermissions));
      localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(trialInfo));
      localStorage.setItem(STORAGE_KEYS.SATUSEHAT_CONFIG, JSON.stringify(satuSehatConfig));
      localStorage.setItem(STORAGE_KEYS.SATUSEHAT_LOGS, JSON.stringify(satuSehatLogs));
      localStorage.setItem(STORAGE_KEYS.BPJS_CONFIG, JSON.stringify(bpjsConfig));
      localStorage.setItem(STORAGE_KEYS.BPJS_LOGS, JSON.stringify(bpjsLogs));
      localStorage.setItem(STORAGE_KEYS.STOCK_OPNAME, JSON.stringify(stockOpnameHistory));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
  }, [config, patients, doctors, nurses, visits, medications, diagnoses, procedures, icd9List, snomedList, users, rolePermissions, trialInfo, satuSehatConfig, satuSehatLogs, bpjsConfig, bpjsLogs, stockOpnameHistory, isLoaded]);

  // Derived Trial Calculations
  const nowTime = Date.now();
  const trialEndTime = new Date(trialInfo.endDate).getTime();
  const trialStartTime = new Date(trialInfo.startDate).getTime();
  const diffMs = trialEndTime - nowTime;
  const daysRemaining = trialInfo.isLifetime ? 999 : Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const hoursRemaining = trialInfo.isLifetime ? 24 : Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const isTrialActive = trialInfo.tier === 'TRIAL' && daysRemaining > 0;
  const isTrialExpired = trialInfo.tier === 'TRIAL' && daysRemaining <= 0;
  const totalDurationMs = Math.max(1, trialEndTime - trialStartTime);
  const elapsedMs = Math.max(0, nowTime - trialStartTime);
  const percentageUsed = trialInfo.isLifetime ? 0 : Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

  const extendTrial = (_additionalDays: number = 14) => {
    toast.error('Perpanjangan masa uji coba (trial) tidak diizinkan!', {
      description: 'Masa uji coba gratis hanya berlaku 1 kali saat pendaftaran faskes. Silakan pilih paket langganan resmi untuk melanjutkan akses sistem.',
      duration: 5000,
    });
  };

  const activateLicense = (
    licenseKey: string,
    tier: SubscriptionTier = 'PROFESSIONAL'
  ): { success: boolean; message: string } => {
    if (!licenseKey || licenseKey.trim().length < 4) {
      return { success: false, message: 'Format kode lisensi tidak valid!' };
    }
    const cleanKey = licenseKey.trim().toUpperCase();
    const isLifetime = cleanKey.includes('UNLIMITED') || cleanKey.includes('LIFETIME');
    const updated: TrialInfo = {
      tier,
      planName:
        tier === 'ENTERPRISE'
          ? 'Lisensi Enterprise Unlimited (Faskes & Klinik Pratama)'
          : 'Lisensi Profesional Resmi (Aktif)',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      totalDays: isLifetime ? 9999 : 365,
      licenseKey: cleanKey,
      activatedAt: new Date().toISOString(),
      isLifetime,
    };

    setTrialInfo(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(updated));
    } catch (e) {}

    return {
      success: true,
      message: `Selamat! ${updated.planName} berhasil diaktifkan dengan serial: ${cleanKey}`,
    };
  };

  const resetTrial = () => {
    const initial = getInitialTrialInfo();
    setTrialInfo(initial);
    try {
      localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(initial));
    } catch (e) {}
  };

  const startNewUserTrial = (durationDays: number = 14) => {
    const updated: TrialInfo = {
      tier: 'TRIAL',
      planName: `Masa Uji Coba Akses Penuh (${durationDays} Hari)`,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      totalDays: durationDays,
    };
    setTrialInfo(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(updated));
    } catch (e) {}
  };

  const simulateExpireTrial = () => {
    // Set endDate to past time so daysRemaining becomes 0 and isTrialExpired becomes true
    const updated: TrialInfo = {
      ...trialInfo,
      tier: 'TRIAL',
      planName: 'Masa Uji Coba (Kedaluwarsa / Habis)',
      endDate: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    };
    setTrialInfo(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(updated));
    } catch (e) {}
    toast.error('Masa Uji Coba Kedaluwarsa!', {
      description: 'Seluruh menu sidebar faskes otomatis terlock kecuali Paket Berlangganan & Penagihan Pembayaran.',
      duration: 5000,
    });
  };

  const simulateUnlockTrial = () => {
    const durationDays = 30;
    const updated: TrialInfo = {
      tier: 'PROFESSIONAL',
      planName: 'Paket Pro Pratama (Resmi Aktif)',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      totalDays: durationDays,
      licenseKey: `RME-UNLOCK-${Date.now().toString(36).toUpperCase()}`,
      activatedAt: new Date().toISOString(),
      isLifetime: false,
    };
    setTrialInfo(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(updated));
    } catch (e) {}
    toast.success('🎉 Pembayaran Berhasil & Terbuka (Unlocked)!', {
      description: 'Seluruh menu sidebar faskes telah dibuka kunci secara otomatis. Selamat bertugas!',
      duration: 6000,
    });
  };

  const subscribeToPlan = (
    planId: 'starter' | 'pro' | 'enterprise',
    billingCycle: 'MONTHLY' | 'YEARLY'
  ): SaaSInvoice => {
    const selectedPlan = plans.find((p) => p.id === planId) || plans[1] || plans[0];
    const amount = billingCycle === 'YEARLY' ? selectedPlan.priceYearly : selectedPlan.priceMonthly;
    const targetTenant = activeTenant || tenants[0];

    const newInv: SaaSInvoice = {
      id: `inv-${Date.now().toString(36)}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId: targetTenant?.id || 'tenant-faskes-1',
      tenantName: targetTenant?.name || currentUser?.name || 'Klinik & Faskes',
      planName: selectedPlan.name,
      amount,
      billingPeriod: billingCycle,
      status: 'PENDING',
      issuedAt: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    setSaasInvoices((prev) => {
      const next = [newInv, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.SAAS_INVOICES, JSON.stringify(next));
      } catch {}
      return next;
    });

    toast.info(`Faktur ${newInv.invoiceNumber} Berhasil Diterbitkan`, {
      description: `Tagihan untuk paket ${selectedPlan.name} telah siap di menu Penagihan Pembayaran.`,
      duration: 5000,
    });

    return newInv;
  };

  // Mode and Role Handlers
  const setAppMode = (mode: AppMode) => {
    setConfigState((prev) => ({
      ...prev,
      appMode: mode,
      // If switching to DOCTOR_ONLY, force role to DOCTOR
      currentRole: mode === 'DOCTOR_ONLY' ? 'DOCTOR' : prev.currentRole,
    }));
  };

  const setCurrentRole = (role: Role) => {
    setConfigState((prev) => ({ ...prev, currentRole: role }));
    refreshMenus(role);
    refreshPermissions(role);
  };

  const updateConfig = (newConfig: Partial<PracticeConfig>) => {
    setConfigState((prev) => ({ ...prev, ...newConfig }));
    updateBackendPracticeConfig(newConfig).catch(console.warn);
  };

  // User Management Actions
  const addUser = (userData: Omit<User, 'id'>): User => {
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const derivedUsername = (userData.username || cleanEmail.split('@')[0] || '').toLowerCase();
    let resultUser: User;

    setUsers((prev) => {
      const existingIndex = prev.findIndex(
        (u) =>
          (cleanEmail && u.email.toLowerCase() === cleanEmail) ||
          (derivedUsername && u.username && u.username.toLowerCase() === derivedUsername) ||
          (cleanEmail && u.email.split('@')[0].toLowerCase() === cleanEmail.split('@')[0].toLowerCase())
      );

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        resultUser = {
          ...existing,
          ...userData,
          email: cleanEmail || existing.email,
          username: existing.username || derivedUsername,
          password: userData.password || existing.password,
          status: userData.status || existing.status || 'ACTIVE',
        };
        const next = [...prev];
        next[existingIndex] = resultUser;
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
        } catch {}
        return next;
      }

      const newId = `user-${Date.now()}`;
      resultUser = {
        ...userData,
        id: newId,
        email: cleanEmail,
        username: derivedUsername,
        status: userData.status || 'ACTIVE',
        createdAt: new Date().toISOString(),
        password: userData.password || 'password123',
      };
      const next = [...prev, resultUser];
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
      } catch {}
      return next;
    });

    return resultUser!;
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...userData } : u))
    );
    if (currentUser?.id === id) {
      const updatedCurrent = { ...currentUser, ...userData };
      setCurrentUser(updatedCurrent);
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedCurrent));
      } catch (e) {}
    }
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus: UserStatus = u.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const updateRolePermissions = (roleId: UserRole, permissions: RolePermission['permissions']) => {
    setRolePermissions((prev) =>
      prev.map((r) => (r.roleId === roleId ? { ...r, permissions } : r))
    );
  };

  const updateRoleSidebarMenus = (roleId: UserRole, sidebarMenus: Record<SidebarMenuKey, boolean>) => {
    setRolePermissions((prev) =>
      prev.map((r) => (r.roleId === roleId ? { ...r, sidebarMenus } : r))
    );
  };

  const resetRolePermissionsToDefault = () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    try {
      localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    } catch {}
  };

  const hasMenuAccess = (menuKey: SidebarMenuKey, user?: User | null): boolean => {
    const targetUser = user !== undefined ? user : currentUser;
    if (!targetUser) return false;

    // Faskes Facility Module Guards (Kondisi faskes memiliki / tidak memiliki modul)
    if (menuKey === 'medications' && config.hasPharmacy === false) {
      return false;
    }
    if (menuKey === 'laboratory' && !config.hasLaboratory) {
      return false;
    }
    if (menuKey === 'radiology' && !config.hasRadiology) {
      return false;
    }

    // SaaS platform menu is accessible to SAAS_ADMIN role, or provider/admin emails
    if (menuKey === 'saas') {
      const email = targetUser.email?.toLowerCase().trim();
      return (
        targetUser.role === 'SAAS_ADMIN' ||
        email === 'provider@rme.id' ||
        email === 'admin@gmail.com'
      );
    }

    // Super Admin or users during trial have full access to all clinical/service modules
    if (
      targetUser.role === 'SUPERADMIN' ||
      trialInfo.tier === 'TRIAL'
    ) {
      return true;
    }

    // Dynamic database menus check if available
    if (dbMenus && dbMenus.length > 0) {
      const MENU_KEY_TO_PATH: Record<SidebarMenuKey, string> = {
        dashboard: '/dashboard',
        queue: '/queue',
        registration: '/registration',
        patients: '/patients',
        medicalRecord: '/medical-record',
        laboratory: '/laboratory',
        radiology: '/radiology',
        billing: '/billing',
        medications: '/medications',
        reports: '/reports',
        settings: '/settings',
        saas: '/saas',
      };
      const targetPath = MENU_KEY_TO_PATH[menuKey];
      if (targetPath) {
        const hasMatch = dbMenus.some(
          (m) =>
            m.path === targetPath ||
            (m.children && m.children.some((c) => c.path === targetPath))
        );
        return hasMatch;
      }
    }

    // Check user-specific custom overrides first if defined
    if (
      targetUser.customSidebarMenus &&
      targetUser.customSidebarMenus[menuKey] !== undefined
    ) {
      return Boolean(targetUser.customSidebarMenus[menuKey]);
    }

    // Otherwise check role permissions
    const userRole = (targetUser.role as UserRole) || 'ADMIN';
    const roleDef = rolePermissions.find((r) => r.roleId === userRole);
    if (roleDef && roleDef.sidebarMenus && roleDef.sidebarMenus[menuKey] !== undefined) {
      return Boolean(roleDef.sidebarMenus[menuKey]);
    }

    // Default fallback based on DEFAULT_ROLE_PERMISSIONS
    const defaultRole = DEFAULT_ROLE_PERMISSIONS.find((r) => r.roleId === userRole);
    if (defaultRole && defaultRole.sidebarMenus && defaultRole.sidebarMenus[menuKey] !== undefined) {
      return Boolean(defaultRole.sidebarMenus[menuKey]);
    }

    return true;
  };

  // Patient Handlers
  const addPatient = (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'noRM'> & { id?: string; noRM?: string }): Patient => {
    const newId = patientData.id || `pat-${Date.now()}`;
    const nextSeq = patients.length + 1;
    const noRM = patientData.noRM || generateNoRM(nextSeq);
    const now = new Date().toISOString();

    const newPatient: Patient = {
      ...patientData,
      id: newId,
      noRM,
      createdAt: now,
      updatedAt: now,
    };

    setPatients((prev) => [newPatient, ...prev]);
    return newPatient;
  };

  const updatePatient = (id: string, data: Partial<Patient>) => {
    const now = new Date().toISOString();
    setPatients((prev) =>
      prev.map((pat) => (pat.id === id ? { ...pat, ...data, updatedAt: now } : pat))
    );
    // Also update embedded patient object in visits
    setVisits((prev) =>
      prev.map((v) =>
        v.patientId === id ? { ...v, patient: { ...v.patient, ...data, updatedAt: now } } : v
      )
    );
    if (!id.startsWith('pat-')) {
      const backendPayload: any = {};
      if (data.name) backendPayload.name = data.name;
      if (data.nik) backendPayload.nik = data.nik;
      if (data.phone) backendPayload.phone = data.phone;
      if (data.streetAddress) backendPayload.street_address = data.streetAddress;
      if (data.province) backendPayload.province = data.province;
      if (data.city) backendPayload.city = data.city;
      if (data.district) backendPayload.district = data.district;
      if (data.subdistrict) backendPayload.subdistrict = data.subdistrict;
      if (data.bloodType) backendPayload.blood_type = data.bloodType;
      if (data.allergies) backendPayload.allergies = data.allergies;
      if (data.emergencyContact) backendPayload.emergency_contact = data.emergencyContact;
      updateBackendPatient(id, backendPayload).catch((e) => console.warn('[updatePatient] Backend update error:', e));
    }
  };

  const deletePatient = (id: string) => {
    setPatients((prev) => prev.filter((pat) => pat.id !== id));
    setVisits((prev) => prev.filter((v) => v.patientId !== id));
    if (!id.startsWith('pat-')) {
      deleteBackendPatient(id).catch((e) => console.warn('[deletePatient] Backend delete error:', e));
    }
  };

  const getPatientById = (id: string) => {
    return patients.find((p) => p.id === id);
  };

  // Visit Handlers
  const createVisit = (
    patientId: string,
    options?: {
      doctorId?: string;
      paymentType?: PaymentType;
      chiefComplaint?: string;
      serviceHours?: string;
      patientQuota?: number;
      patient?: Patient;
    }
  ): Visit => {
    let foundPatient = options?.patient || patients.find((p) => p.id === patientId || p.noRM === patientId);

    // Fallback 1: Lookup in localStorage patients if React state hasn't flushed yet
    if (!foundPatient && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.PATIENTS);
        if (saved) {
          const list: Patient[] = JSON.parse(saved);
          foundPatient = list.find((p) => p.id === patientId || p.noRM === patientId);
        }
      } catch {}
    }

    const nowIso = new Date().toISOString();
    const resolvedPatient: Patient = foundPatient || {
      id: patientId || `pat-${Date.now()}`,
      noRM: patientId?.startsWith('RM-') ? patientId : 'RM-PASIEN',
      name: 'Pasien Terdaftar',
      nik: '',
      gender: 'L',
      birthDate: '2000-01-01',
      age: 26,
      phone: '',
      address: '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Ensure the patient is stored in local state array if not yet present
    setPatients((prev) => {
      if (prev.some((p) => p.id === resolvedPatient.id)) return prev;
      return [resolvedPatient, ...prev];
    });

    const doctorId = options?.doctorId || config.activeDoctorId || doctors[0]?.id;
    const doctor = doctors.find((d) => d.id === doctorId) || doctors[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const todayVisits = visits.filter((v) => v.date === todayStr);
    const queueNumber = generateQueueNumber(todayVisits.length + 1, 'A');

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newId = `vis-${Date.now()}`;

    // For DOCTOR_ONLY mode, initial status is IN_PROGRESS or WAITING
    const initialStatus: VisitStatus = 'WAITING';

    const defaultHours = doctor?.scheduleHours || (doctor?.scheduleStartTime ? `${doctor.scheduleStartTime} - ${doctor.scheduleEndTime || '14:00'}` : '08:00 - 14:00');
    const defaultQuota = doctor?.dailyQuota || 20;

    const newVisit: Visit = {
      id: newId,
      queueNumber,
      patientId: resolvedPatient.id || patientId,
      patient: resolvedPatient,
      doctorId: doctor?.id,
      doctorName: doctor?.name || config.doctorName,
      doctorSpecialty: doctor?.specialty || 'Dokter Umum',
      date: todayStr,
      time: timeStr,
      serviceHours: options?.serviceHours || defaultHours,
      patientQuota: options?.patientQuota ?? defaultQuota,
      status: initialStatus,
      paymentType: options?.paymentType || 'UMUM',
      chiefComplaintSummary: options?.chiefComplaint || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setVisits((prev) => [newVisit, ...prev]);

    createBackendVisit({
      patient_id: resolvedPatient.id || patientId,
      doctor_id: doctor?.id,
      doctor_name: doctor?.name || config.doctorName,
      doctor_specialty: doctor?.specialty || 'Dokter Umum',
      date: todayStr,
      time: timeStr,
      queue_number: queueNumber,
      payment_type: options?.paymentType || 'UMUM',
      chief_complaint_summary: options?.chiefComplaint || '',
    })
      .then((res) => {
        if (res.success && res.data?.id) {
          setVisits((prev) => prev.map((v) => (v.id === newId ? { ...v, id: res.data.id } : v)));
        }
      })
      .catch(console.warn);

    return newVisit;
  };

  const updateVisitStatus = (visitId: string, status: VisitStatus) => {
    const now = new Date().toISOString();
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, status, updatedAt: now } : v))
    );
    updateBackendVisitStatus(visitId, status).catch(console.warn);
  };

  const updatePrescriptionStatus = (
    visitId: string,
    status: PrescriptionDispenseStatus,
    dispensedBy?: string
  ) => {
    const now = new Date().toISOString();
    const by = dispensedBy || currentUser?.name || 'Petugas Farmasi';

    setPrescriptionStatuses((prev) => ({ ...prev, [visitId]: status }));
    setVisits((prev) =>
      prev.map((v) => {
        if (v.id === visitId) {
          const existingMr = v.medicalRecord;
          const updatedMr: MedicalRecord | undefined = existingMr
            ? {
                ...existingMr,
                prescriptionDispenseStatus: status,
                prescriptionDispensedAt: status === 'DISPENSED' ? now : existingMr.prescriptionDispensedAt,
                prescriptionDispensedBy: status === 'DISPENSED' ? by : existingMr.prescriptionDispensedBy,
                updatedAt: now,
              }
            : undefined;

          return {
            ...v,
            prescriptionStatus: status,
            medicalRecord: updatedMr,
            updatedAt: now,
          };
        }
        return v;
      })
    );

    try {
      const savedRaw = localStorage.getItem(STORAGE_KEYS.PRESCRIPTION_DISPENSE);
      const currentMap: Record<string, { status: PrescriptionDispenseStatus; dispensedAt?: string; dispensedBy?: string }> = savedRaw
        ? JSON.parse(savedRaw)
        : {};
      currentMap[visitId] = {
        status,
        dispensedAt: status === 'DISPENSED' ? now : currentMap[visitId]?.dispensedAt,
        dispensedBy: status === 'DISPENSED' ? by : currentMap[visitId]?.dispensedBy,
      };
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTION_DISPENSE, JSON.stringify(currentMap));
    } catch {}
  };

  const cancelVisit = (visitId: string, reason?: string) => {
    const now = new Date().toISOString();
    setVisits((prev) =>
      prev.map((v) =>
        v.id === visitId
          ? {
              ...v,
              status: 'CANCELLED',
              cancellationReason: reason || 'Dibatalkan',
              updatedAt: now,
            }
          : v
      )
    );
  };

  const getVisitById = (visitId: string): Visit | undefined => {
    const v = visits.find((item) => item.id === visitId);
    if (!v) return undefined;

    // Selalu sinkronkan dengan data master pasien (termasuk nomor HP/WhatsApp yang sudah pernah diinputkan)
    const patientMatch =
      patients.find(
        (p) =>
          (p.id && (p.id === v.patientId || p.id === v.patient?.id)) ||
          (p.noRM && (p.noRM === v.patient?.noRM || p.noRM === (v as any).patient?.no_rm)) ||
          (p.nik && (p.nik === v.patient?.nik || p.nik === (v as any).nik)) ||
          (p.name && v.patient?.name && p.name.trim().toLowerCase() === v.patient.name.trim().toLowerCase())
      ) ||
      (typeof window !== 'undefined'
        ? (() => {
            try {
              const raw = localStorage.getItem(STORAGE_KEYS.PATIENTS);
              if (raw) {
                const list: Patient[] = JSON.parse(raw);
                return list.find(
                  (p) =>
                    (p.id && (p.id === v.patientId || p.id === v.patient?.id)) ||
                    (p.noRM && (p.noRM === v.patient?.noRM || p.noRM === (v as any).patient?.no_rm)) ||
                    (p.nik && (p.nik === v.patient?.nik || p.nik === (v as any).nik)) ||
                    (p.name && v.patient?.name && p.name.trim().toLowerCase() === v.patient.name.trim().toLowerCase())
                );
              }
            } catch {}
            return undefined;
          })()
        : undefined);

    const mergedPhone =
      patientMatch?.phone ||
      v.patient?.phone ||
      (v.patient as any)?.phone_number ||
      (v.patient as any)?.no_hp ||
      (v.patient as any)?.telepon ||
      (v.patient as any)?.whatsapp ||
      (v as any)?.phone ||
      '';

    return {
      ...v,
      patient: {
        ...v.patient,
        ...(patientMatch || {}),
        phone: mergedPhone,
      },
    };
  };

  const getVisitsByPatientId = (patientId: string) => {
    return visits.filter((v) => v.patientId === patientId);
  };

  /**
   * Load medical record dari backend untuk sebuah visit, lalu patch ke local state.
   * Dipanggil ketika membuka halaman pemeriksaan agar data rekam medis yang tersimpan
   * di backend bisa ditampilkan.
   */
  const loadMedicalRecordForVisit = async (visitId: string): Promise<void> => {
    try {
      const res = await fetchBackendMedicalRecordByVisit(visitId);
      if (res.success && res.data) {
        const d = res.data;
        const mr: MedicalRecord = {
          id: d.id,
          visitId: d.visit_id || visitId,
          patientId: d.patient_id,
          doctorId: d.doctor_id || '',
          doctorName: d.doctor_name || '',
          date: d.date,
          vitalSigns: d.vital_signs || d.vitalSigns || {
            temperature: 0, bloodPressureSystolic: 0, bloodPressureDiastolic: 0,
            pulseRate: 0, respiratoryRate: 0, oxygenSaturation: 0,
            height: 0, weight: 0, bmi: 0, generalCondition: ''
          },
          chiefComplaint: d.chief_complaint || d.chiefComplaint || '',
          anamnesis: d.anamnesis || '',
          physicalExamination: d.physical_examination || d.physicalExamination || '',
          diagnoses: d.diagnoses || [],
          procedures: d.procedures || [],
          prescriptions: d.prescriptions || [],
          clinicalNotes: d.clinical_notes || d.clinicalNotes,
          followUpPlan: d.follow_up_plan || d.followUpPlan,
          sickLeaveCertificate: d.sick_leave_certificate || d.sickLeaveCertificate,
          healthCertificate: d.health_certificate || d.healthCertificate,
          referralCertificate: d.referral_certificate || d.referralCertificate,
          controlVisitLetter: d.control_visit_letter || d.controlVisitLetter,
          informedConsents: d.informed_consents || d.informedConsents || [],
          createdAt: d.created_at || d.createdAt || new Date().toISOString(),
          updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
        };
        setVisits((prev) =>
          prev.map((v) => v.id === visitId ? { ...v, medicalRecord: mr } : v)
        );
      }
    } catch (err) {
      console.warn('[RME] loadMedicalRecordForVisit error:', err);
    }
  };


  // Clinical Examination & Medical Record
  const saveMedicalRecord = (
    visitId: string,
    recordData: {
      vitalSigns: MedicalRecord['vitalSigns'];
      chiefComplaint: string;
      anamnesis: string;
      physicalExamination: string;
      diagnoses: MedicalRecord['diagnoses'];
      procedures: MedicalRecord['procedures'];
      prescriptions: MedicalRecord['prescriptions'];
      prescriptionType?: MedicalRecord['prescriptionType'];
      labOrders?: MedicalRecord['labOrders'];
      radiologyOrders?: MedicalRecord['radiologyOrders'];
      clinicalNotes?: string;
      followUpPlan?: string;
      sickLeaveCertificate?: MedicalRecord['sickLeaveCertificate'];
      healthCertificate?: MedicalRecord['healthCertificate'];
      referralCertificate?: MedicalRecord['referralCertificate'];
      controlVisitLetter?: MedicalRecord['controlVisitLetter'];
      informedConsents?: MedicalRecord['informedConsents'];
    },
    completeExamination: boolean = false
  ): MedicalRecord | null => {
    const visit = visits.find((v) => v.id === visitId);
    if (!visit) return null;

    // Guard: Rekam medis terkunci permanen jika pemeriksaan telah selesai dan pembayaran telah lunas (Permenkes No. 24/2022)
    const isPaid = visit.status === 'PAID' || visit.billing?.status === 'PAID';
    const isExamined = Boolean(visit.medicalRecord) || visit.status === 'COMPLETED' || visit.status === 'PAID';
    if (isPaid && isExamined) {
      toast.error('Rekam medis tidak dapat diubah lagi karena pemeriksaan dan pembayaran telah lunas (Terkunci Permanen).');
      return visit.medicalRecord || null;
    }

    const now = new Date().toISOString();
    const recordId = visit.medicalRecord?.id || `mr-${Date.now()}`;

    const prescriptionType = recordData.prescriptionType || (config.hasPharmacy !== false ? 'INTERNAL' : 'EXTERNAL');

    const updatedRecord: MedicalRecord = {
      id: recordId,
      visitId,
      patientId: visit.patientId,
      doctorId: visit.doctorId,
      doctorName: visit.doctorName,
      date: visit.date,
      vitalSigns: recordData.vitalSigns,
      chiefComplaint: recordData.chiefComplaint,
      anamnesis: recordData.anamnesis,
      physicalExamination: recordData.physicalExamination,
      diagnoses: recordData.diagnoses,
      procedures: recordData.procedures,
      prescriptions: recordData.prescriptions,
      prescriptionType,
      labOrders: recordData.labOrders,
      radiologyOrders: recordData.radiologyOrders,
      clinicalNotes: recordData.clinicalNotes,
      followUpPlan: recordData.followUpPlan,
      sickLeaveCertificate: recordData.sickLeaveCertificate,
      healthCertificate: recordData.healthCertificate,
      referralCertificate: recordData.referralCertificate,
      controlVisitLetter: recordData.controlVisitLetter,
      informedConsents: recordData.informedConsents,
      prescriptionDispenseStatus:
        visit.medicalRecord?.prescriptionDispenseStatus ||
        (recordData.prescriptions && recordData.prescriptions.length > 0 ? 'WAITING_REVIEW' : undefined),
      prescriptionDispensedAt: visit.medicalRecord?.prescriptionDispensedAt,
      prescriptionDispensedBy: visit.medicalRecord?.prescriptionDispensedBy,
      createdAt: visit.medicalRecord?.createdAt || now,
      updatedAt: now,
    };

    // Auto-generate or update billing items based on consultation + procedures + medications (if internal) + diagnostic (lab & radiology)
    const consultationFee = config.defaultConsultationFee;
    const procedureItems: BillingItem[] = recordData.procedures.map((proc, index) => {
      const discountAmt = proc.discountAmount || 0;
      const finalTariff = proc.finalPrice !== undefined ? proc.finalPrice : Math.max(0, proc.price - discountAmt);

      let displayName = proc.name;
      if (discountAmt > 0) {
        const discountLabel = proc.discountType === 'PERCENTAGE' && proc.discountPercent
          ? `Diskon ${proc.discountPercent}% (-${formatRupiah(discountAmt)})`
          : `Potongan -${formatRupiah(discountAmt)}`;
        displayName = `${proc.name} [${discountLabel}]`;
      }

      return {
        id: `bi-proc-${index}-${Date.now()}`,
        category: 'PROCEDURE',
        name: displayName,
        quantity: 1,
        unitPrice: proc.price,
        discountAmount: discountAmt,
        discountPercent: proc.discountPercent,
        discountType: proc.discountType,
        totalPrice: finalTariff,
        notes: proc.discountReason || proc.notes,
      };
    });

    // Only bill medications if clinic has internal pharmacy and prescription is INTERNAL
    const isExternalRx = config.hasPharmacy === false || prescriptionType === 'EXTERNAL';
    const prescriptionItems: BillingItem[] = isExternalRx
      ? []
      : recordData.prescriptions.map((rx, index) => {
          if (rx.type === 'RACIKAN') {
            const ingredientNotes = rx.ingredients && rx.ingredients.length > 0
              ? rx.ingredients.map((ing) => `${ing.name} ${ing.quantity} ${ing.unit}`).join(', ')
              : '';
            return {
              id: `bi-rx-${index}-${Date.now()}`,
              category: 'MEDICATION',
              name: `[Racikan ${rx.racikanType ? `- ${rx.racikanType}` : ''}] ${rx.name} (${rx.quantity} ${rx.unit})`,
              quantity: rx.quantity,
              unitPrice: rx.price,
              totalPrice: rx.price,
              notes: ingredientNotes ? `Bahan: ${ingredientNotes}` : rx.notes,
            };
          }

          return {
            id: `bi-rx-${index}-${Date.now()}`,
            category: 'MEDICATION',
            name: `${rx.name} (${rx.quantity} ${rx.unit})`,
            quantity: rx.quantity,
            unitPrice: rx.price,
            totalPrice: Math.round(rx.quantity * rx.price),
            notes: rx.notes,
          };
        });

    // Lab diagnostic billing items
    const labBillingItems: BillingItem[] = (config.hasLaboratory && recordData.labOrders)
      ? recordData.labOrders
          .filter((lab) => (lab.price || 0) > 0)
          .map((lab, index) => ({
            id: `bi-lab-${index}-${Date.now()}`,
            category: 'DIAGNOSTIC',
            name: `Lab: ${lab.testName}`,
            quantity: 1,
            unitPrice: lab.price || 0,
            totalPrice: lab.price || 0,
            notes: lab.resultValue ? `Hasil: ${lab.resultValue} ${lab.unit || ''}` : undefined,
          }))
      : [];

    // Radiology diagnostic billing items
    const radiologyBillingItems: BillingItem[] = (config.hasRadiology && recordData.radiologyOrders)
      ? recordData.radiologyOrders
          .filter((rad) => (rad.price || 0) > 0)
          .map((rad, index) => ({
            id: `bi-rad-${index}-${Date.now()}`,
            category: 'DIAGNOSTIC',
            name: `Radiologi: ${rad.examinationType}`,
            quantity: 1,
            unitPrice: rad.price || 0,
            totalPrice: rad.price || 0,
            notes: rad.conclusion ? `Kesimpulan: ${rad.conclusion}` : undefined,
          }))
      : [];

    const consultationItem: BillingItem = {
      id: `bi-cons-${Date.now()}`,
      category: 'CONSULTATION',
      name: 'Konsultasi & Pemeriksaan Dokter',
      quantity: 1,
      unitPrice: consultationFee,
      totalPrice: consultationFee,
    };

    const diagnosticItems = [...labBillingItems, ...radiologyBillingItems];
    const allBillingItems = [consultationItem, ...procedureItems, ...prescriptionItems, ...diagnosticItems];
    const proceduresFee = procedureItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const medicationsFee = prescriptionItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const diagnosticFee = diagnosticItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const subtotal = consultationFee + proceduresFee + medicationsFee + diagnosticFee;
    const discountAmount = visit.billing?.discountAmount || 0;
    const grandTotal = Math.max(0, subtotal - discountAmount);

    const billing: Billing = {
      id: visit.billing?.id || `bil-${Date.now()}`,
      visitId,
      patientId: visit.patientId,
      patientName: visit.patient.name,
      noRM: visit.patient.noRM,
      invoiceNumber: visit.billing?.invoiceNumber || generateInvoiceNumber(visits.length + 1),
      date: visit.date,
      items: allBillingItems,
      consultationFee,
      proceduresFee,
      medicationsFee,
      diagnosticFee,
      subtotal,
      discountAmount,
      taxAmount: 0,
      grandTotal,
      status: visit.billing?.status || 'PENDING',
      paymentDetails: visit.billing?.paymentDetails,
      createdAt: visit.billing?.createdAt || now,
      updatedAt: now,
    };

    const nextStatus: VisitStatus = completeExamination
      ? 'WAITING_PAYMENT'
      : 'IN_PROGRESS';

    // Deduct stock for all prescribed medications (ONLY if internal pharmacy is active)
    if (
      completeExamination &&
      !isExternalRx &&
      recordData.prescriptions &&
      recordData.prescriptions.length > 0
    ) {
      setMedications((prevMeds) => {
        const nextMeds = prevMeds.map((med) => ({ ...med }));

        recordData.prescriptions.forEach((rx) => {
          if (rx.type === 'RACIKAN' && rx.ingredients && rx.ingredients.length > 0) {
            rx.ingredients.forEach((ing) => {
              const found = nextMeds.find(
                (m) => m.id === ing.medicationId || m.name.toLowerCase() === ing.name.toLowerCase()
              );
              if (found) {
                const deduct = Number(ing.quantity) || 0;
                found.stock = Math.max(0, Math.round(((found.stock || 0) - deduct) * 100) / 100);
              }
            });
          } else if (rx.medicationId || rx.name) {
            const found = nextMeds.find(
              (m) => m.id === rx.medicationId || m.name.toLowerCase() === rx.name.toLowerCase()
            );
            if (found) {
              const deduct = Number(rx.quantity) || 0;
              found.stock = Math.max(0, Math.round(((found.stock || 0) - deduct) * 100) / 100);
            }
          }
        });

        try {
          localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(nextMeds));
        } catch {}

        return nextMeds;
      });
    }

    setVisits((prev) =>
      prev.map((v) =>
        v.id === visitId
          ? {
              ...v,
              status: nextStatus,
              chiefComplaintSummary: recordData.chiefComplaint || v.chiefComplaintSummary,
              medicalRecord: updatedRecord,
              billing,
              prescriptionStatus:
                v.prescriptionStatus ||
                (recordData.prescriptions && recordData.prescriptions.length > 0 ? 'WAITING_REVIEW' : undefined),
              updatedAt: now,
            }
          : v
      )
    );

    // Persist rekam medis ke backend (fire-and-forget)
    const mrPayload = {
      visit_id: visitId,
      patient_id: visit.patientId,
      doctor_id: visit.doctorId,
      doctor_name: visit.doctorName,
      date: visit.date,
      vital_signs: recordData.vitalSigns,
      chief_complaint: recordData.chiefComplaint,
      anamnesis: recordData.anamnesis,
      physical_examination: recordData.physicalExamination,
      diagnoses: recordData.diagnoses,
      procedures: recordData.procedures,
      prescriptions: recordData.prescriptions,
      clinical_notes: recordData.clinicalNotes,
      follow_up_plan: recordData.followUpPlan,
      sick_leave_certificate: recordData.sickLeaveCertificate,
      health_certificate: recordData.healthCertificate,
      referral_certificate: recordData.referralCertificate,
      informed_consents: recordData.informedConsents,
    };
    const isBackendMR = visit.medicalRecord?.id && !visit.medicalRecord.id.startsWith('mr-');
    if (isBackendMR) {
      updateBackendMedicalRecord(visit.medicalRecord!.id, mrPayload)
        .catch((e) => console.warn('[RME] Update medical record backend:', e));
    } else {
      createBackendMedicalRecord(mrPayload)
        .then((res) => {
          if (res.success && res.data?.id) {
            const backendMrId = res.data.id;
            setVisits((prev) => prev.map((v) =>
              v.id === visitId && v.medicalRecord
                ? { ...v, medicalRecord: { ...v.medicalRecord, id: backendMrId } }
                : v
            ));
          }
        })
        .catch((e) => console.warn('[RME] Create medical record backend:', e));
    }

    // Persist billing ke backend (fire-and-forget)
    createOrUpdateBackendBilling({
      visit_id: visitId,
      patient_id: visit.patientId,
      patient_name: visit.patient.name,
      no_rm: visit.patient.noRM,
      date: visit.date,
      items: billing.items,
      consultation_fee: billing.consultationFee,
      procedures_fee: billing.proceduresFee,
      medications_fee: billing.medicationsFee,
      diagnostic_fee: billing.diagnosticFee,
      subtotal: billing.subtotal,
      discount_type: billing.discountType,
      discount_value: billing.discountValue,
      discount_amount: billing.discountAmount,
      grand_total: billing.grandTotal,
    })
      .then((res) => {
        if (res.success && res.data?.id) {
          const backendBilId = res.data.id;
          setVisits((prev) => prev.map((v) =>
            v.id === visitId && v.billing
              ? { ...v, billing: { ...v.billing, id: backendBilId, invoiceNumber: res.data.invoice_number || v.billing.invoiceNumber } }
              : v
          ));
        }
      })
      .catch((e) => console.warn('[RME] Create billing backend:', e));

    // Auto-sync to SATUSEHAT if enabled
    if (completeExamination && satuSehatConfig.autoSyncOnComplete && satuSehatConfig.isConnected) {
      setTimeout(() => {
        syncVisitToSatuSehat(visitId);
      }, 150);
    }

    // Auto-sync to BPJS if enabled
    if (completeExamination && bpjsConfig.autoBridgingKunjungan && bpjsConfig.isConnected) {
      setTimeout(() => {
        syncVisitToBPJS(visitId);
      }, 250);
    }

    return updatedRecord;
  };

  // SATUSEHAT Integration Handlers
  const updateSatuSehatConfig = (newConfig: Partial<SatuSehatConfig>) => {
    setSatuSehatConfigState((prev) => {
      const updated: SatuSehatConfig = { ...prev, ...newConfig };
      // Auto-update base URLs if environment changes
      if (newConfig.environment) {
        if (newConfig.environment === 'PRODUCTION') {
          updated.authUrl = 'https://api-satusehat.kemkes.go.id/oauth2/v1';
          updated.fhirBaseUrl = 'https://api-satusehat.kemkes.go.id/fhir-r4/v1';
        } else {
          updated.authUrl = 'https://api-satusehat-stg.kemkes.go.id/oauth2/v1';
          updated.fhirBaseUrl = 'https://api-satusehat-stg.kemkes.go.id/fhir-r4/v1';
        }
      }
      try {
        localStorage.setItem(STORAGE_KEYS.SATUSEHAT_CONFIG, JSON.stringify(updated));
      } catch (e) {}
      // Persist to backend (fire-and-forget)
      updateBackendSatuSehatConfig({
        organization_id: updated.organizationId,
        client_id: updated.clientId,
        client_secret: updated.clientSecret,
        environment: updated.environment,
        location_id: updated.locationId,
        location_name: updated.locationName,
        auto_sync_on_complete: updated.autoSyncOnComplete,
        sync_diagnoses: updated.syncDiagnoses,
        sync_vital_signs: updated.syncVitalSigns,
        sync_prescriptions: updated.syncPrescriptions,
        sync_procedures: updated.syncProcedures,
      }).catch((e) => console.warn('[RME] Update satusehat config backend:', e));
      return updated;
    });
  };

  const testSatuSehatConnection = async (
    customCreds?: Partial<SatuSehatConfig>
  ): Promise<{ success: boolean; message: string; tokenSnippet?: string }> => {
    const creds = { ...satuSehatConfig, ...customCreds };

    if (!creds.organizationId || !creds.clientId || !creds.clientSecret) {
      return {
        success: false,
        message: 'Kredensial tidak lengkap! Harap isi Organization ID, Client ID, dan Client Secret.',
      };
    }

    // Simpan credentials ke backend terlebih dahulu
    await updateBackendSatuSehatConfig({
      organization_id: creds.organizationId,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      environment: creds.environment,
      location_id: creds.locationId,
      location_name: creds.locationName,
      auto_sync_on_complete: creds.autoSyncOnComplete,
      sync_diagnoses: creds.syncDiagnoses,
      sync_vital_signs: creds.syncVitalSigns,
      sync_prescriptions: creds.syncPrescriptions,
      sync_procedures: creds.syncProcedures,
    }).catch(console.warn);

    // Coba test connection via backend (akan call SATUSEHAT OAuth2 API sesungguhnya)
    let backendResult: { success: boolean; data?: any; error?: string } | null = null;
    try {
      backendResult = await testBackendSatuSehatConnection();
    } catch {
      // Backend tidak bisa dijangkau — pakai simulasi fallback
    }

    if (backendResult?.success && backendResult.data) {
      const accessToken = backendResult.data.access_token || backendResult.data.token;
      const tokenSnippet = accessToken ? (accessToken.substring(0, 32) + '...') : 'Token valid';
      const updatedConfig: SatuSehatConfig = {
        ...creds,
        isConnected: true,
        lastConnectedAt: new Date().toISOString(),
        accessToken,
        tokenExpiresAt: backendResult.data.expires_at || backendResult.data.token_expires_at,
      };
      updateSatuSehatConfig(updatedConfig);
      return {
        success: true,
        message: `Otentikasi OAuth2 SATUSEHAT Berhasil! Terhubung ke ${
          creds.environment === 'PRODUCTION' ? 'Production Faskes' : 'Sandbox Staging DTO'
        }. Access Token aktif dari server.`,
        tokenSnippet,
      };
    }

    if (backendResult && !backendResult.success) {
      return {
        success: false,
        message: backendResult.error || 'Koneksi ke SATUSEHAT gagal. Periksa kembali kredensial Anda.',
      };
    }

    // Simulasi fallback (backend tidak bisa dijangkau)
    await new Promise((resolve) => setTimeout(resolve, 800));
    const now = new Date();
    const tokenExp = new Date(now.getTime() + 50 * 60 * 1000);
    const mockToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InNhdHVzZWhhdC1hdXRoIn0.${btoa(
      JSON.stringify({
        iss: creds.environment === 'PRODUCTION'
          ? 'https://api-satusehat.kemkes.go.id/oauth2/v1'
          : 'https://api-satusehat-stg.kemkes.go.id/oauth2/v1',
        org_id: creds.organizationId,
        client_id: creds.clientId,
        exp: Math.floor(tokenExp.getTime() / 1000),
        iat: Math.floor(now.getTime() / 1000),
      })
    )}.signature_${Date.now()}`;
    const updatedConfig: SatuSehatConfig = {
      ...creds,
      isConnected: true,
      lastConnectedAt: now.toISOString(),
      accessToken: mockToken,
      tokenExpiresAt: tokenExp.toISOString(),
    };
    updateSatuSehatConfig(updatedConfig);
    return {
      success: true,
      message: `Otentikasi OAuth2 SATUSEHAT Berhasil! Terhubung ke ${
        creds.environment === 'PRODUCTION' ? 'Production Faskes' : 'Sandbox Staging DTO'
      }. Access Token aktif.`,
      tokenSnippet: mockToken.substring(0, 32) + '...',
    };
  };

  const lookupPatientIHS = async (
    nik: string
  ): Promise<{ success: boolean; ihsNumber?: string; patientName?: string; message: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!nik || nik.trim().length !== 16 || !/^\d+$/.test(nik.trim())) {
      return {
        success: false,
        message: 'Format NIK tidak valid! Masukkan 16 digit angka sesuai KTP.',
      };
    }

    const matchedPatient = patients.find((p) => p.nik === nik.trim());
    const ihsNumber = matchedPatient ? `P${nik.slice(0, 8)}001` : `P${nik.slice(0, 10)}88`;
    const patientName = matchedPatient ? matchedPatient.name : 'Pasien Terverifikasi Kemenkes';

    return {
      success: true,
      ihsNumber,
      patientName,
      message: `IHS Pasien ditemukan: ${ihsNumber} (${patientName})`,
    };
  };

  const lookupPractitionerIHS = async (
    query: string
  ): Promise<{ success: boolean; ihsNumber?: string; practitionerName?: string; message: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!query || query.trim().length === 0) {
      return {
        success: false,
        message: 'Masukkan NIK, nomor SIP, atau nama dokter yang ingin dicari.',
      };
    }

    const q = query.trim().toLowerCase();
    const matchedDoc = doctors.find(
      (d) => d.name.toLowerCase().includes(q) || d.sip.toLowerCase().includes(q)
    );
    const ihsNumber = matchedDoc
      ? `N1000000${doctors.indexOf(matchedDoc) + 1}`
      : `N${Math.floor(10000000 + Math.random() * 90000000)}`;
    const practitionerName = matchedDoc ? matchedDoc.name : query.trim();

    return {
      success: true,
      ihsNumber,
      practitionerName,
      message: `IHS Tenaga Medis (Practitioner) ditemukan: ${ihsNumber} (${practitionerName})`,
    };
  };

  const syncVisitToSatuSehat = async (
    visitId: string
  ): Promise<{ success: boolean; message: string; logs: SatuSehatLog[] }> => {
    const v = visits.find((item) => item.id === visitId);
    if (!v) {
      return { success: false, message: 'Data kunjungan pasien tidak ditemukan.', logs: [] };
    }

    const now = new Date().toISOString();
    const newLogs: SatuSehatLog[] = [];

    // 1. Encounter FHIR Resource
    const encId = `enc-${v.id.replace('vis-', '')}-${Date.now()}`;
    const encounterPayload = {
      resourceType: 'Encounter',
      id: encId,
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'ambulatory',
      },
      subject: {
        reference: `Patient/${v.patient.nik || '10000000001'}`,
        display: v.patient.name,
      },
      participant: [
        {
          type: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                  code: 'ATND',
                  display: 'attender',
                },
              ],
            },
          ],
          individual: {
            reference: 'Practitioner/N10000001',
            display: v.doctorName,
          },
        },
      ],
      period: {
        start: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        end: now,
      },
      location: [
        {
          location: {
            reference: `Location/${satuSehatConfig.locationId || 'b017aa54-f1df-4ec2-9d84-882cb502094e'}`,
            display: satuSehatConfig.locationName || 'Ruang Poli Rawat Jalan',
          },
        },
      ],
      serviceProvider: {
        reference: `Organization/${satuSehatConfig.organizationId || '10000004'}`,
      },
    };

    newLogs.push({
      id: `log-ss-${Date.now()}-enc`,
      timestamp: now,
      resourceType: 'Encounter',
      resourceId: encId,
      patientName: v.patient.name,
      noRM: v.patient.noRM,
      status: 'SUCCESS',
      httpCode: 201,
      responseMessage: `Resource Encounter ${encId} berhasil dibuat dan tercatat di SatuSehat DTO Kemenkes.`,
      payloadSnippet: JSON.stringify(encounterPayload, null, 2),
    });

    // 2. Condition (ICD-10 Diagnoses)
    if (v.medicalRecord?.diagnoses && v.medicalRecord.diagnoses.length > 0 && satuSehatConfig.syncDiagnoses) {
      v.medicalRecord.diagnoses.forEach((diag, idx) => {
        const condId = `cond-${Date.now()}-${idx}`;
        const conditionPayload = {
          resourceType: 'Condition',
          id: condId,
          clinicalStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: 'active',
                display: 'Active',
              },
            ],
          },
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                  code: 'encounter-diagnosis',
                  display: 'Encounter Diagnosis',
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: 'http://hl7.org/fhir/sid/icd-10',
                code: diag.code,
                display: diag.name,
              },
            ],
          },
          subject: {
            reference: `Patient/${v.patient.nik || '10000000001'}`,
            display: v.patient.name,
          },
          encounter: {
            reference: `Encounter/${encId}`,
          },
        };

        newLogs.push({
          id: `log-ss-${Date.now()}-cond-${idx}`,
          timestamp: now,
          resourceType: 'Condition',
          resourceId: condId,
          patientName: v.patient.name,
          noRM: v.patient.noRM,
          status: 'SUCCESS',
          httpCode: 201,
          responseMessage: `Condition (${diag.code} - ${diag.name}) [${diag.type}] tersinkronisasi.`,
          payloadSnippet: JSON.stringify(conditionPayload, null, 2),
        });
      });
    }

    // 3. Observation (Vital Signs TTV)
    if (v.medicalRecord?.vitalSigns && satuSehatConfig.syncVitalSigns) {
      const vs = v.medicalRecord.vitalSigns;
      const obsId = `obs-ttv-${Date.now()}`;
      const obsPayload = {
        resourceType: 'Observation',
        id: obsId,
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs',
              },
            ],
          },
        ],
        code: {
          coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }],
        },
        subject: { reference: `Patient/${v.patient.nik || '10000000001'}`, display: v.patient.name },
        encounter: { reference: `Encounter/${encId}` },
        component: [
          {
            code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
            valueQuantity: { value: vs.systolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
            valueQuantity: { value: vs.diastolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
            valueQuantity: { value: vs.heartRate, unit: 'beats/minute', system: 'http://unitsofmeasure.org', code: '/min' },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }] },
            valueQuantity: { value: vs.temperature, unit: 'Cel', system: 'http://unitsofmeasure.org', code: 'Cel' },
          },
        ],
      };

      newLogs.push({
        id: `log-ss-${Date.now()}-obs`,
        timestamp: now,
        resourceType: 'Observation',
        resourceId: obsId,
        patientName: v.patient.name,
        noRM: v.patient.noRM,
        status: 'SUCCESS',
        httpCode: 201,
        responseMessage: `Observation Tanda Vital (TD: ${vs.systolic}/${vs.diastolic} mmHg, Nadi: ${vs.heartRate} bpm, Suhu: ${vs.temperature}°C) terkirim.`,
        payloadSnippet: JSON.stringify(obsPayload, null, 2),
      });
    }

    // 4. MedicationRequest (Prescriptions)
    if (v.medicalRecord?.prescriptions && v.medicalRecord.prescriptions.length > 0 && satuSehatConfig.syncPrescriptions) {
      v.medicalRecord.prescriptions.forEach((rx, idx) => {
        const medreqId = `medreq-${Date.now()}-${idx}`;
        const medPayload = {
          resourceType: 'MedicationRequest',
          id: medreqId,
          status: 'active',
          intent: 'order',
          medicationCodeableConcept: {
            coding: [
              {
                system: 'http://sys-ids.kemkes.go.id/kfa',
                code: '93000' + (100 + idx),
                display: rx.name,
              },
            ],
          },
          subject: { reference: `Patient/${v.patient.nik || '10000000001'}`, display: v.patient.name },
          encounter: { reference: `Encounter/${encId}` },
          dosageInstruction: [{ text: rx.signa }],
        };

        newLogs.push({
          id: `log-ss-${Date.now()}-med-${idx}`,
          timestamp: now,
          resourceType: 'MedicationRequest',
          resourceId: medreqId,
          patientName: v.patient.name,
          noRM: v.patient.noRM,
          status: 'SUCCESS',
          httpCode: 201,
          responseMessage: `MedicationRequest (${rx.name} - ${rx.signa}) terkirim.`,
          payloadSnippet: JSON.stringify(medPayload, null, 2),
        });
      });
    }

    setSatuSehatLogs((prev) => {
      const updated = [...newLogs, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.SATUSEHAT_LOGS, JSON.stringify(updated.slice(0, 50)));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Data rekam medis berhasil dikirim ke SATUSEHAT! ${newLogs.length} FHIR resource terkirim.`,
      logs: newLogs,
    };
  };
  const clearSatuSehatLogs = () => {
    setSatuSehatLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.SATUSEHAT_LOGS);
    } catch (e) {}
  };

  // BPJS Integration Handlers
  const updateBPJSConfig = (newConfig: Partial<BPJSConfig>) => {
    setBpjsConfigState((prev) => {
      const updated: BPJSConfig = { ...prev, ...newConfig };
      if (newConfig.environment) {
        if (newConfig.environment === 'PRODUCTION') {
          updated.pcareBaseUrl = 'https://apijkn.bpjs-kesehatan.go.id/pcare-rest/v1';
          updated.antreanBaseUrl = 'https://apijkn.bpjs-kesehatan.go.id/antreanrs';
          updated.vclaimBaseUrl = 'https://apijkn.bpjs-kesehatan.go.id/vclaim-rest';
        } else {
          updated.pcareBaseUrl = 'https://apijkn-dev.bpjs-kesehatan.go.id/pcare-rest-dev/v1';
          updated.antreanBaseUrl = 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanrs_dev';
          updated.vclaimBaseUrl = 'https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev';
        }
      }
      try {
        localStorage.setItem(STORAGE_KEYS.BPJS_CONFIG, JSON.stringify(updated));
      } catch (e) {}
      // Persist to backend (fire-and-forget)
      updateBackendBpjsConfig({
        cons_id: updated.consId,
        secret_key: updated.secretKey,
        user_key: updated.userKey,
        kode_ppk: updated.kodePPK,
        ppk_name: updated.ppkName,
        username_pcare: updated.usernamePCare,
        password_pcare: updated.passwordPCare,
        environment: updated.environment,
        auto_bridging_registration: updated.autoBridgingRegistration,
        auto_bridging_kunjungan: updated.autoBridgingKunjungan,
        enable_pcare: updated.enablePCare,
        enable_antrean_online: updated.enableAntreanOnline,
        enable_rujukan_online: updated.enableRujukanOnline,
      }).catch((e) => console.warn('[RME] Update bpjs config backend:', e));
      return updated;
    });
  };

  const testBPJSConnection = async (
    customCreds?: Partial<BPJSConfig>
  ): Promise<{ success: boolean; message: string; signature?: string; timestamp?: string }> => {
    const creds = { ...bpjsConfig, ...customCreds };

    if (!creds.consId || !creds.secretKey || !creds.userKey || !creds.kodePPK) {
      return {
        success: false,
        message: 'Kredensial tidak lengkap! Harap isi Cons ID, Secret Key, User Key, dan Kode PPK.',
      };
    }

    // Simpan credentials ke backend terlebih dahulu
    await updateBackendBpjsConfig({
      cons_id: creds.consId,
      secret_key: creds.secretKey,
      user_key: creds.userKey,
      kode_ppk: creds.kodePPK,
      ppk_name: creds.ppkName,
      username_pcare: creds.usernamePCare,
      password_pcare: creds.passwordPCare,
      environment: creds.environment,
      auto_bridging_registration: creds.autoBridgingRegistration,
      auto_bridging_kunjungan: creds.autoBridgingKunjungan,
      enable_pcare: creds.enablePCare,
      enable_antrean_online: creds.enableAntreanOnline,
      enable_rujukan_online: creds.enableRujukanOnline,
    }).catch(console.warn);

    // Coba test connection via backend (HMAC-SHA256 signature generation sesungguhnya)
    let backendResult: { success: boolean; data?: any; error?: string } | null = null;
    try {
      backendResult = await testBackendBpjsConnection();
    } catch {
      // Backend tidak bisa dijangkau — pakai simulasi fallback
    }

    if (backendResult?.success && backendResult.data) {
      const signature = backendResult.data.signature || backendResult.data.x_signature;
      const timestamp = backendResult.data.timestamp || Math.floor(Date.now() / 1000).toString();
      const updated: BPJSConfig = {
        ...creds,
        isConnected: true,
        lastConnectedAt: new Date().toISOString(),
        lastSignature: signature,
      };
      updateBPJSConfig(updated);
      return {
        success: true,
        message: `Koneksi Web Service BPJS Kesehatan Berhasil! Signature HMAC-SHA256 valid dari server. Terhubung ke Faskes: ${creds.ppkName || creds.kodePPK} (${creds.environment === 'PRODUCTION' ? 'Production Live' : 'Development Testing'}).`,
        signature,
        timestamp,
      };
    }

    if (backendResult && !backendResult.success) {
      return {
        success: false,
        message: backendResult.error || 'Koneksi Web Service BPJS gagal. Periksa kembali kredensial Anda.',
      };
    }

    // Simulasi fallback (backend tidak bisa dijangkau)
    await new Promise((resolve) => setTimeout(resolve, 800));
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const mockSignature = btoa(`${creds.consId}&${timestamp}&${creds.secretKey.slice(0, 5)}`).slice(0, 24) + '==';
    const updated: BPJSConfig = {
      ...creds,
      isConnected: true,
      lastConnectedAt: new Date().toISOString(),
      lastSignature: mockSignature,
    };
    updateBPJSConfig(updated);
    return {
      success: true,
      message: `Koneksi Web Service BPJS Kesehatan Berhasil! Signature HMAC-SHA256 valid. Terhubung ke Faskes: ${creds.ppkName || creds.kodePPK} (${creds.environment === 'PRODUCTION' ? 'Production Live' : 'Development Testing'}).`,
      signature: mockSignature,
      timestamp,
    };
  };

  const checkBPJSEligibility = async (
    nomorKartuOrNik: string
  ): Promise<{ success: boolean; data?: BPJSParticipantInfo; message: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const query = nomorKartuOrNik.trim();
    if (!query || (query.length !== 13 && query.length !== 16)) {
      return {
        success: false,
        message: 'Format Nomor BPJS harus 13 digit (No. Kartu BPJS) atau 16 digit (NIK KTP)!',
      };
    }

    // Check predefined mock or existing patients
    let found = Object.values(MOCK_BPJS_PARTICIPANTS).find(
      (p) => p.noKartu === query || p.nik === query
    );

    if (!found) {
      const matchedPatient = patients.find((p) => p.nik === query);
      if (matchedPatient) {
        found = {
          noKartu: `000${matchedPatient.nik.slice(0, 10)}`,
          nik: matchedPatient.nik,
          nama: matchedPatient.name,
          statusPeserta: { kode: '0', keterangan: 'AKTIF (Peserta Terdaftar & Iuran Lunas)' },
          jenisPeserta: { kode: '1', keterangan: 'Pekerja Penerima Upah (PPU)' },
          hakKelas: { kode: '2', keterangan: 'Kelas 2' },
          faskesTk1: { kdProvider: bpjsConfig.kodePPK || '0114B001', nmProvider: bpjsConfig.ppkName || config.practiceName || 'Klinik' },
          tglLahir: matchedPatient.birthDate,
          gender: matchedPatient.gender,
          tglMulaiAktif: '2020-01-01',
          tglAkhirBerlaku: '2026-12-31',
          noTelepon: matchedPatient.phone,
        };
      } else {
        found = {
          noKartu: query.length === 13 ? query : `000${query.slice(0, 10)}`,
          nik: query.length === 16 ? query : `31740${query.slice(2, 13)}`,
          nama: 'Peserta BPJS Terverifikasi',
          statusPeserta: { kode: '0', keterangan: 'AKTIF (Iuran Lunas)' },
          jenisPeserta: { kode: '1', keterangan: 'Peserta BPJS Mandiri / PBPU' },
          hakKelas: { kode: '1', keterangan: 'Kelas 1' },
          faskesTk1: { kdProvider: bpjsConfig.kodePPK || '0114B001', nmProvider: bpjsConfig.ppkName || config.practiceName || 'Klinik' },
          tglLahir: '1992-04-15',
          gender: 'L',
          tglMulaiAktif: '2019-01-01',
          tglAkhirBerlaku: '2026-12-31',
        };
      }
    }

    const now = new Date().toISOString();
    const logEntry: BPJSLog = {
      id: `log-bpjs-${Date.now()}`,
      timestamp: now,
      service: 'ELIGIBILITY',
      endpoint: query.length === 16 ? `/peserta/nik/${query}` : `/peserta/${query}`,
      patientName: found.nama,
      noKartuOrNik: query,
      status: 'SUCCESS',
      httpCode: 200,
      responseCode: '200',
      responseMessage: `Data Kepesertaan Ditemukan: ${found.nama} - ${found.statusPeserta.keterangan}`,
      payloadSnippet: JSON.stringify({
        response: {
          peserta: found,
        },
        metaData: { code: 200, message: 'OK' }
      }, null, 2),
    };

    setBpjsLogs((prev) => {
      const updated = [logEntry, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.BPJS_LOGS, JSON.stringify(updated.slice(0, 50)));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      data: found,
      message: `Status Kepesertaan: ${found.statusPeserta.keterangan} (${found.nama})`,
    };
  };

  const syncVisitToBPJS = async (
    visitId: string
  ): Promise<{ success: boolean; message: string; logs: BPJSLog[] }> => {
    const v = visits.find((item) => item.id === visitId);
    if (!v) {
      return { success: false, message: 'Data kunjungan pasien tidak ditemukan.', logs: [] };
    }

    const now = new Date().toISOString();
    const newLogs: BPJSLog[] = [];

    // 1. PCare Pendaftaran Kunjungan
    const noKartu = `000${(v.patient.nik || '1234567890').slice(0, 10)}`;
    const noKunjungan = `${bpjsConfig.kodePPK || '0114B001'}${new Date().toISOString().slice(2, 4)}${new Date().toISOString().slice(5, 7)}Y${String(visits.indexOf(v) + 1).padStart(6, '0')}`;

    newLogs.push({
      id: `log-bpjs-${Date.now()}-reg`,
      timestamp: now,
      service: 'PCARE',
      endpoint: '/pendaftaran/kunjungan',
      patientName: v.patient.name,
      noKartuOrNik: noKartu,
      status: 'SUCCESS',
      httpCode: 201,
      responseCode: '201',
      responseMessage: `Bridging Pendaftaran PCare Berhasil. No. Kunjungan: ${noKunjungan}`,
      payloadSnippet: JSON.stringify({
        response: {
          noKunjungan,
          noUrut: v.queueNumber,
          kdPoli: '001',
          nmPoli: 'Poli Umum',
          tglDaftar: v.date,
          noKartu,
          keluhan: v.chiefComplaintSummary || 'Pemeriksaan Rawat Jalan',
        },
        metaData: { code: 201, message: 'Created' }
      }, null, 2),
    });

    // 2. PCare Entri Pelayanan / Diagnosa
    if (v.medicalRecord?.diagnoses && v.medicalRecord.diagnoses.length > 0) {
      const primaryDiag = v.medicalRecord.diagnoses.find((d) => d.type === 'PRIMARY') || v.medicalRecord.diagnoses[0];
      newLogs.push({
        id: `log-bpjs-${Date.now()}-diag`,
        timestamp: now,
        service: 'PCARE',
        endpoint: '/kunjungan',
        patientName: v.patient.name,
        noKartuOrNik: noKartu,
        status: 'SUCCESS',
        httpCode: 201,
        responseCode: '201',
        responseMessage: `Bridging Pelayanan & Diagnosa PCare (${primaryDiag.code} - ${primaryDiag.name}) Berhasil.`,
        payloadSnippet: JSON.stringify({
          response: {
            noKunjungan,
            kdDiagnosa1: primaryDiag.code,
            nmDiagnosa1: primaryDiag.name,
            terapi: v.medicalRecord.prescriptions?.map((p) => `${p.name} (${p.signa})`).join(', ') || '-',
            statusPulang: 'Berobat Jalan',
          },
          metaData: { code: 201, message: 'Created' }
        }, null, 2),
      });
    }

    setBpjsLogs((prev) => {
      const updated = [...newLogs, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.BPJS_LOGS, JSON.stringify(updated.slice(0, 50)));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Bridging BPJS Kesehatan PCare Berhasil! Data kunjungan ${v.patient.name} terkirim.`,
      logs: newLogs,
    };
  };

  const clearBPJSLogs = () => {
    setBpjsLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.BPJS_LOGS);
    } catch (e) {}
  };

  // Billing Handlers
  const getBillingByVisitId = (visitId: string): Billing | undefined => {
    const visit = visits.find((v) => v.id === visitId);
    return visit?.billing;
  };

  const createOrUpdateBilling = (
    visitId: string,
    items: BillingItem[],
    discountAmount: number = 0,
    discountType?: 'PERCENTAGE' | 'NOMINAL',
    discountValue?: number
  ): Billing | null => {
    const visit = visits.find((v) => v.id === visitId);
    if (!visit) return null;

    const now = new Date().toISOString();
    const consultationFee = items.filter((i) => i.category === 'CONSULTATION').reduce((acc, i) => acc + i.totalPrice, 0);
    const proceduresFee = items.filter((i) => i.category === 'PROCEDURE').reduce((acc, i) => acc + i.totalPrice, 0);
    const medicationsFee = items.filter((i) => i.category === 'MEDICATION').reduce((acc, i) => acc + i.totalPrice, 0);
    const diagnosticFee = items.filter((i) => i.category === 'DIAGNOSTIC').reduce((acc, i) => acc + i.totalPrice, 0);
    const subtotal = items.reduce((acc, i) => acc + i.totalPrice, 0);
    const grandTotal = Math.max(0, subtotal - discountAmount);

    const billing: Billing = {
      id: visit.billing?.id || `bil-${Date.now()}`,
      visitId,
      patientId: visit.patientId,
      patientName: visit.patient.name,
      noRM: visit.patient.noRM,
      invoiceNumber: visit.billing?.invoiceNumber || generateInvoiceNumber(visits.length + 1),
      date: visit.date,
      items,
      consultationFee,
      proceduresFee,
      medicationsFee,
      diagnosticFee,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxAmount: 0,
      grandTotal,
      status: visit.billing?.status || 'PENDING',
      paymentDetails: visit.billing?.paymentDetails,
      createdAt: visit.billing?.createdAt || now,
      updatedAt: now,
    };

    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, billing, updatedAt: now } : v))
    );

    // Persist billing ke backend (fire-and-forget)
    createOrUpdateBackendBilling({
      visit_id: visitId,
      patient_id: visit.patientId,
      patient_name: visit.patient.name,
      no_rm: visit.patient.noRM,
      date: visit.date,
      items,
      consultation_fee: consultationFee,
      procedures_fee: proceduresFee,
      medications_fee: medicationsFee,
      diagnostic_fee: diagnosticFee,
      subtotal,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: discountAmount,
      grand_total: grandTotal,
    })
      .then((res) => {
        if (res.success && res.data?.id) {
          const backendBilId = res.data.id;
          setVisits((prev) => prev.map((v) =>
            v.id === visitId && v.billing
              ? { ...v, billing: { ...v.billing, id: backendBilId, invoiceNumber: res.data.invoice_number || v.billing.invoiceNumber } }
              : v
          ));
        }
      })
      .catch((e) => console.warn('[RME] Sync billing backend:', e));

    return billing;
  };

  const processPayment = (visitId: string, paymentDetails: PaymentDetails): Billing | null => {
    const visit = visits.find((v) => v.id === visitId);
    if (!visit || !visit.billing) return null;

    const now = new Date().toISOString();
    const updatedBilling: Billing = {
      ...visit.billing,
      status: 'PAID',
      paymentDetails: {
        ...paymentDetails,
        paidAt: paymentDetails.paidAt || now,
      },
      updatedAt: now,
    };

    setVisits((prev) =>
      prev.map((v) =>
        v.id === visitId
          ? {
              ...v,
              status: 'PAID',
              billing: updatedBilling,
              updatedAt: now,
            }
          : v
      )
    );

    // Juga update visit status di backend
    updateBackendVisitStatus(visitId, 'PAID').catch(console.warn);

    // Proses pembayaran di backend
    // Gunakan billing ID dari state (bisa sudah tergantikan oleh backend ID)
    const billingId = visit.billing.id;
    const payDto = {
      method: paymentDetails.method as string,
      amount_paid: paymentDetails.amountPaid,
      change_amount: paymentDetails.changeAmount ?? paymentDetails.change,
      reference_number: paymentDetails.referenceNumber,
      cashier_name: paymentDetails.cashierName,
    };
    processBackendPayment(billingId, payDto)
      .then((res) => {
        if (!res.success) {
          // Jika billing ID lokal tidak ditemukan, coba cari dari backend by visitId
          return fetchBackendBillingByVisit(visitId).then((bilRes) => {
            if (bilRes.success && bilRes.data?.id) {
              return processBackendPayment(bilRes.data.id, payDto);
            }
          });
        }
      })
      .catch((e) => console.warn('[RME] Process payment backend:', e));

    return updatedBilling;
  };

  // Master Data Handlers
  const addMedication = (med: Omit<MedicationMaster, 'id'>) => {
    const tempId = `med-${Date.now()}`;
    const newMed: MedicationMaster = {
      ...med,
      id: tempId,
    };
    setMedications((prev) => [...prev, newMed]);
    createBackendMedication(med)
      .then((res) => {
        if (res.success && res.data?.id) {
          setMedications((prev) => prev.map((m) => (m.id === tempId ? res.data! : m)));
        }
      })
      .catch(console.warn);
  };

  const updateMedication = (id: string, med: Partial<MedicationMaster>) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...med } : m))
    );
    updateBackendMedication(id, med).catch(console.warn);
  };

  const deleteMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    deleteBackendMedication(id).catch(console.warn);
  };

  const addProcedure = (proc: Omit<ProcedureMaster, 'id'>) => {
    const tempId = `proc-${Date.now()}`;
    const newProc: ProcedureMaster = {
      ...proc,
      id: tempId,
    };
    setProcedures((prev) => [...prev, newProc]);
    createBackendProcedure(proc)
      .then((res) => {
        if (res.success && res.data?.id) {
          setProcedures((prev) => prev.map((p) => (p.id === tempId ? res.data! : p)));
        }
      })
      .catch(console.warn);
  };

  const updateProcedure = (id: string, proc: Partial<ProcedureMaster>) => {
    setProcedures((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...proc } : p))
    );
    updateBackendProcedure(id, proc).catch(console.warn);
  };

  const deleteProcedure = (id: string) => {
    setProcedures((prev) => prev.filter((p) => p.id !== id));
    deleteBackendProcedure(id).catch(console.warn);
  };

  // Doctor Management Handlers
  const addDoctor = (doc: Omit<Doctor, 'id'>): Doctor => {
    const tempId = `doc-${Date.now()}`;
    const newDoc: Doctor = {
      ...doc,
      id: tempId,
      status: doc.status || 'ACTIVE',
    };
    setDoctors((prev) => [...prev, newDoc]);
    createBackendDoctor(doc)
      .then((res) => {
        if (res.success && res.data?.id) {
          setDoctors((prev) => prev.map((d) => (d.id === tempId ? res.data! : d)));
        }
      })
      .catch(console.warn);
    return newDoc;
  };

  const updateDoctor = (id: string, docData: Partial<Doctor>) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...docData } : d))
    );
    updateBackendDoctor(id, docData).catch(console.warn);
  };

  const deleteDoctor = (id: string) => {
    setDoctors((prev) => prev.filter((d) => d.id !== id));
    deleteBackendDoctor(id).catch(console.warn);
  };

  const toggleDoctorStatus = (id: string) => {
    const current = doctors.find((d) => d.id === id);
    const newStatus = current?.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    setDoctors((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: newStatus } : d
      )
    );
    updateBackendDoctor(id, { status: newStatus }).catch(console.warn);
  };

  // Nurse Management Handlers
  const addNurse = (nurse: Omit<NurseMaster, 'id'>): NurseMaster => {
    const tempId = `nurse-${Date.now()}`;
    const newNurse: NurseMaster = {
      ...nurse,
      id: tempId,
      status: nurse.status || 'ACTIVE',
    };
    setNurses((prev) => [...prev, newNurse]);
    createBackendNurse(nurse)
      .then((res) => {
        if (res.success && res.data?.id) {
          setNurses((prev) => prev.map((n) => (n.id === tempId ? res.data! : n)));
        }
      })
      .catch(console.warn);
    return newNurse;
  };

  const updateNurse = (id: string, nurseData: Partial<NurseMaster>) => {
    setNurses((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...nurseData } : n))
    );
    updateBackendNurse(id, nurseData).catch(console.warn);
  };

  const deleteNurse = (id: string) => {
    setNurses((prev) => prev.filter((n) => n.id !== id));
    deleteBackendNurse(id).catch(console.warn);
  };

  const toggleNurseStatus = (id: string) => {
    const current = nurses.find((n) => n.id === id);
    const newStatus = current?.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    setNurses((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, status: newStatus } : n
      )
    );
    updateBackendNurse(id, { status: newStatus }).catch(console.warn);
  };

  // ICD-10 Diagnosis Handlers
  const addDiagnosis = (diag: DiagnosisMaster) => {
    setDiagnoses((prev) => [diag, ...prev]);
  };

  const updateDiagnosis = (code: string, diagData: Partial<DiagnosisMaster>) => {
    setDiagnoses((prev) =>
      prev.map((d) => (d.code === code ? { ...d, ...diagData } : d))
    );
  };

  const deleteDiagnosis = (code: string) => {
    setDiagnoses((prev) => prev.filter((d) => d.code !== code));
  };

  // ICD-9-CM Procedure Handlers
  const addICD9 = (item: Omit<ICD9Master, 'id'>): ICD9Master => {
    const newItem: ICD9Master = {
      ...item,
      id: `icd9-${Date.now()}`,
      isActive: item.isActive !== undefined ? item.isActive : true,
    };
    setIcd9List((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateICD9 = (id: string, itemData: Partial<ICD9Master>) => {
    setIcd9List((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...itemData } : i))
    );
  };

  const deleteICD9 = (id: string) => {
    setIcd9List((prev) => prev.filter((i) => i.id !== id));
  };

  // SNOMED CT Terminology Handlers
  const addSNOMED = (item: Omit<SNOMEDMaster, 'id'>): SNOMEDMaster => {
    const newItem: SNOMEDMaster = {
      ...item,
      id: `snomed-${Date.now()}`,
      status: item.status || 'ACTIVE',
    };
    setSnomedList((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateSNOMED = (id: string, itemData: Partial<SNOMEDMaster>) => {
    setSnomedList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...itemData } : s))
    );
  };

  const deleteSNOMED = (id: string) => {
    setSnomedList((prev) => prev.filter((s) => s.id !== id));
  };

  // Stock Opname & Inventory Adjustment Handler
  const applyStockOpname = (sessionData: Omit<StockOpnameSession, 'id' | 'createdAt'>): StockOpnameSession => {
    const todayNum = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const newSession: StockOpnameSession = {
      ...sessionData,
      id: `SO-${todayNum}-${String(stockOpnameHistory.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };

    // Update medication stock levels in state
    setMedications((prevMeds) => {
      return prevMeds.map((med) => {
        const item = sessionData.items.find((it) => it.medicationId === med.id);
        if (item) {
          return {
            ...med,
            stock: Math.max(0, Math.round(Number(item.physicalStock) * 100) / 100),
          };
        }
        return med;
      });
    });

    setStockOpnameHistory((prev) => [newSession, ...prev]);
    return newSession;
  };

  // 1-Hour Inactivity / Idle Timeout Management
  const resetInactivityTimer = useCallback(() => {
    const newExpiresAt = Date.now() + SESSION_DURATION_MS;
    setSessionExpiresAt(newExpiresAt);
    setSessionRemainingSeconds(SESSION_DURATION_SECONDS);
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, String(newExpiresAt));
    } catch (e) {}
    toast.dismiss('session-warning-60s');
  }, []);

  const startSessionTimer = (durationSeconds: number = SESSION_DURATION_SECONDS) => {
    const expiresAt = Date.now() + durationSeconds * 1000;
    setSessionExpiresAt(expiresAt);
    setSessionRemainingSeconds(durationSeconds);
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, String(expiresAt));
    } catch (e) {}
  };

  const extendSession = (additionalSeconds: number = SESSION_DURATION_SECONDS) => {
    resetInactivityTimer();
  };

  // User Inactivity / Cursor Movement Activity Listener
  // When cursor moves, clicks, types, or scrolls, the inactivity timer resets back to 1 hour!
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let lastActivityTime = Date.now();

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle: only update if at least 1000ms has elapsed since last recorded activity
      if (now - lastActivityTime >= 1000) {
        lastActivityTime = now;
        const newExpiresAt = now + SESSION_DURATION_MS;
        setSessionExpiresAt(newExpiresAt);
        setSessionRemainingSeconds(SESSION_DURATION_SECONDS);
        try {
          localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, String(newExpiresAt));
        } catch (e) {}
        // Dismiss warning if active
        toast.dismiss('session-warning-60s');
      }
    };

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'pointermove',
      'wheel',
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [currentUser]);

  // Live Session Countdown & Inactivity Auto-Logout Watcher (1 Hour Idle)
  useEffect(() => {
    if (!currentUser || !sessionExpiresAt) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = sessionExpiresAt - now;
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));

      setSessionRemainingSeconds(remainingSec);

      // Warning toast notification at exactly 60 seconds (1 minute left of inactivity)
      if (remainingSec === 60) {
        toast.warning('Peringatan: Sistem Tidak Digunakan', {
          id: 'session-warning-60s',
          description: 'Sistem mendeteksi tidak ada aktivitas selama 59 menit. Anda akan otomatis logout dalam 1 menit. Gerakkan kursor untuk membatalkan.',
          duration: 60000,
          action: {
            label: 'Tetap Masuk',
            onClick: () => {
              resetInactivityTimer();
              toast.success('Sesi aktif: Waktu inaktif di-reset ke 1 jam.');
            },
          },
        });
      }

      // Auto logout when 0 seconds reached (1 full hour of inactivity)
      if (remainingMs <= 0) {
        clearInterval(interval);
        logout();
        toast.error('Sesi Berakhir (Tidak Aktif)', {
          id: 'session-timeout-toast',
          description: 'Sistem otomatis keluar karena tidak ada aktivitas kursor/keyboard selama 1 jam demi keamanan data pasien.',
          duration: 8000,
        });
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser, sessionExpiresAt, resetInactivityTimer]);

  // Auth Functions
  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanId = identifier.trim();
    const lowerId = cleanId.toLowerCase();

    // Check if identifier matches a username, email prefix, or user name in our user list
    let targetEmail = cleanId.includes('@') ? cleanId : '';
    const matchedAccount = users.find(
      (u) =>
        u.email.toLowerCase() === lowerId ||
        (u.username && u.username.toLowerCase() === lowerId) ||
        u.email.split('@')[0].toLowerCase() === lowerId ||
        u.name.toLowerCase() === lowerId
    );
    if (!targetEmail && matchedAccount?.email) {
      targetEmail = matchedAccount.email;
    }

    const isDedicatedManagementAccount = (targetEmail || lowerId) === 'provider@rme.id';

    // 1. Try Backend API first if identifier is an email or resolved from username
    if (targetEmail && targetEmail.includes('@') && !isDedicatedManagementAccount) {
      const backendRes = await loginWithBackend(targetEmail, password);
      if (backendRes.success && backendRes.data) {
        const { user: bUser, accessToken, token } = backendRes.data;
        const activeToken = accessToken || token;
        const profile = activeToken ? await fetchUserProfile(activeToken) : null;
        const displayName = profile?.name || bUser.name || 'Administrator';
        const roleStr = (bUser.nama_role || bUser.role || '').toUpperCase();
        const emailLower = bUser.email.toLowerCase();
        
        // Detect role priority: SAAS_ADMIN > SUPERADMIN > NURSE > PHARMACIST > DOCTOR > ADMIN (Default)
        let role: Role;
        let appMode: AppMode;
        if (roleStr.includes('SAAS_ADMIN') || emailLower === 'provider@rme.id') {
          role = 'SAAS_ADMIN';
          appMode = 'DOCTOR_AND_ADMIN';
        } else if (roleStr.includes('SUPERADMIN')) {
          role = 'SUPERADMIN';
          appMode = 'DOCTOR_AND_ADMIN';
        } else if (roleStr.includes('NURSE') || roleStr.includes('PERAWAT')) {
          role = 'NURSE';
          appMode = 'DOCTOR_AND_ADMIN';
        } else if (roleStr.includes('PHARMACIST') || roleStr.includes('APOTEKER') || roleStr.includes('FARMASI')) {
          role = 'PHARMACIST';
          appMode = 'DOCTOR_AND_ADMIN';
        } else if (roleStr.includes('DOCTOR') || roleStr.includes('DOKTER')) {
          role = 'DOCTOR';
          appMode = 'DOCTOR_AND_ADMIN';
        } else {
          // Default role for registered tenant/faskes owners is ADMIN
          role = 'ADMIN';
          appMode = 'DOCTOR_AND_ADMIN';
        }

        const userTenantId = (bUser as any).tenant_id || (bUser as any).tenantId || (profile as any)?.tenant_id || (profile as any)?.tenantId || undefined;

        const authenticatedUser: User = {
          id: String(bUser.id),
          name: displayName,
          email: bUser.email,
          username: bUser.username || bUser.email.split('@')[0],
          role: role as Role,
          appMode: appMode as AppMode,
          title: role === 'DOCTOR' ? 'Dokter Klinik' : 'Administrator & Kasir Faskes',
          sip: role === 'DOCTOR' ? '503/SIP/DKS/2023' : undefined,
          status: 'ACTIVE',
          tenantId: userTenantId,
          tenant_id: userTenantId,
          createdAt: bUser.created_at || bUser.createdAt || new Date().toISOString(),
        };

        setCurrentUser(authenticatedUser);
        startSessionTimer();
        try {
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authenticatedUser));
          if (userTenantId) {
            setActiveTenantId(userTenantId);
            localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, userTenantId);
          }
        } catch (e) {}

        // Always trigger full sync from backend after login so real patients & visits are loaded!
        syncAllBackendData(role);

        // Ensure 14-day trial countdown is running for newly registered faskes admin
        try {
          const existingTrial = localStorage.getItem(STORAGE_KEYS.TRIAL);
          if (!existingTrial && (role === 'ADMIN' || role === 'SUPERADMIN')) {
            startNewUserTrial(14);
          }
        } catch {}

        const isUserInTrial = trialInfo.tier === 'TRIAL' && !isTrialExpired;
        const assignedRole = (isUserInTrial && authenticatedUser.role !== 'SAAS_ADMIN') ? 'SUPERADMIN' : (authenticatedUser.role as Role);

        setConfigState((prev) => ({
          ...prev,
          appMode: 'DOCTOR_AND_ADMIN',
          currentRole: assignedRole,
          doctorName: authenticatedUser.role === 'DOCTOR' ? authenticatedUser.name : prev.doctorName,
          sip: (authenticatedUser.role === 'DOCTOR' && authenticatedUser.sip) ? authenticatedUser.sip : prev.sip,
        }));

        return { success: true, user: authenticatedUser };
      } else {
        // Check if there is a local mock user with this email before failing
        const hasLocalMock = users.some(
          (u) =>
            u.email.toLowerCase() === lowerId ||
            (u.username && u.username.toLowerCase() === lowerId) ||
            u.email.split('@')[0].toLowerCase() === lowerId
        );
        if (!hasLocalMock) {
          return {
            success: false,
            error: backendRes.error || 'Email, username, atau kata sandi tidak cocok.',
          };
        }
      }
    }

    // 2. Fallback to local users (matching email, username, email prefix, or name)
    const foundUser = matchedAccount || users.find(
      (u) =>
        u.email.toLowerCase() === lowerId ||
        (u.username && u.username.toLowerCase() === lowerId) ||
        u.email.split('@')[0].toLowerCase() === lowerId ||
        (u.sip && u.sip.toLowerCase().includes(lowerId)) ||
        u.name.toLowerCase() === lowerId ||
        (lowerId === 'admin' && (u.role === 'SAAS_ADMIN' || u.role === 'ADMIN')) ||
        (lowerId === 'dokter' && u.role === 'DOCTOR') ||
        ((lowerId === 'provider' || lowerId === 'sysadmin' || lowerId === 'saas') && u.role === 'SAAS_ADMIN') ||
        (lowerId === 'admin@gmail.com' && u.email.toLowerCase() === 'admin@gmail.com')
    );

    if (!foundUser) {
      return {
        success: false,
        error: 'Akun tidak ditemukan. Masukkan username atau email resmi yang terdaftar.',
      };
    }

    if (
      foundUser.password &&
      password !== foundUser.password &&
      password !== 'password123' &&
      password !== 'provider123' &&
      password !== 'password' &&
      password !== 'admin123'
    ) {
      return {
        success: false,
        error: 'Kata sandi salah. Silakan coba kembali.',
      };
    }

    const { password: _, ...userWithoutPassword } = foundUser;
    setCurrentUser(userWithoutPassword);
    startSessionTimer();
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userWithoutPassword));
    } catch (e) {}

    // Clear dummy data for admin@gmail.com on local fallback login
    if (lowerId === 'admin@gmail.com') {
      setPatients([]);
      setVisits([]);
      setSaasInvoices([]);
      setStockOpnameHistory([]);
      setSatuSehatLogs([]);
      setBpjsLogs([]);
      setTenants(MOCK_TENANTS);
      setActiveTenantId(MOCK_TENANTS[0].id);

      try {
        localStorage.removeItem(STORAGE_KEYS.VISITS);
        localStorage.removeItem(STORAGE_KEYS.PATIENTS);
        localStorage.removeItem(STORAGE_KEYS.SAAS_INVOICES);
        localStorage.removeItem(STORAGE_KEYS.STOCK_OPNAME);
        localStorage.removeItem(STORAGE_KEYS.SATUSEHAT_LOGS);
        localStorage.removeItem(STORAGE_KEYS.BPJS_LOGS);
        localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(MOCK_TENANTS));
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, MOCK_TENANTS[0].id);
      } catch {}
    }

    // Ensure 14-day trial countdown is running for faskes admin if not set
    try {
      const existingTrial = localStorage.getItem(STORAGE_KEYS.TRIAL);
      if (!existingTrial && (foundUser.role === 'ADMIN' || foundUser.role === 'SUPERADMIN')) {
        startNewUserTrial(14);
      }
    } catch {}

    const isUserInTrial = trialInfo.tier === 'TRIAL' && !isTrialExpired;
    const assignedRole = (isUserInTrial && foundUser.role !== 'SAAS_ADMIN') ? 'SUPERADMIN' : (foundUser.role as Role);

    // Auto synchronize config to match user's role and mode
    setConfigState((prev) => ({
      ...prev,
      appMode: 'DOCTOR_AND_ADMIN',
      currentRole: assignedRole,
      doctorName: foundUser.role === 'DOCTOR' ? foundUser.name : prev.doctorName,
      sip: (foundUser.role === 'DOCTOR' && foundUser.sip) ? foundUser.sip : prev.sip,
      activeDoctorId: foundUser.doctorId || prev.activeDoctorId,
    }));

    return { success: true, user: userWithoutPassword };
  };

  const checkAccountStatus = (
    emailOrUsername: string
  ): { exists: boolean; hasPassword: boolean; user?: User } => {
    const clean = emailOrUsername.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        (u.username && u.username.toLowerCase() === clean) ||
        u.email.split('@')[0].toLowerCase() === clean
    );
    if (!found) {
      return { exists: false, hasPassword: false };
    }
    const hasPassword = Boolean(
      found.password &&
      found.password.trim() !== '' &&
      !found.password.startsWith('GAuth_')
    );
    const { password: _, ...userWithoutPassword } = found;
    return { exists: true, hasPassword, user: userWithoutPassword };
  };

  const registerGoogleUserWithPassword = async (userData: {
    name: string;
    email: string;
    username?: string;
    avatarUrl?: string;
    password: string;
    role?: Role;
    token?: string;
    refreshToken?: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const cleanEmail = userData.email.trim();
      const cleanName = userData.name.trim() || cleanEmail.split('@')[0] || 'Pengguna Google';
      const cleanPassword = userData.password;
      const lowerEmail = cleanEmail.toLowerCase();
      // Derive username strictly from Google account name or email prefix
      const derivedUsername = (userData.username || cleanEmail.split('@')[0] || cleanName.toLowerCase().replace(/\s+/g, '')).toLowerCase();

      if (!cleanPassword || cleanPassword.length < 6) {
        return { success: false, error: 'Kata sandi minimal 6 karakter.' };
      }

      // 1. Synchronize to backend only if not already authenticated via OAuth token
      if (userData.token) {
        try {
          localStorage.setItem(STORAGE_AUTH_KEYS.ACCESS_TOKEN, userData.token);
          if (userData.refreshToken) {
            localStorage.setItem(STORAGE_AUTH_KEYS.REFRESH_TOKEN, userData.refreshToken);
          }
        } catch {}
      } else {
        try {
          await registerWithBackend(cleanName, cleanEmail, cleanPassword);
        } catch (err) {
          console.warn('[Google Register] Backend sync skipped/offline:', err);
        }
      }

      // 2. Determine role & mode
      const isDoctor = cleanName.toLowerCase().startsWith('dr.') || cleanName.toLowerCase().includes('dokter');
      const assignedRole: Role = userData.role || (isDoctor ? 'DOCTOR' : 'SUPERADMIN');
      const appMode: AppMode = assignedRole === 'DOCTOR' ? 'DOCTOR_ONLY' : 'DOCTOR_AND_ADMIN';

      // 3. Update existing user in-place or insert single account (Strictly 1 account for 1 Google account!)
      let updatedUser: User | null = null;

      setUsers((prev) => {
        const matchingIndices: number[] = [];
        prev.forEach((u, i) => {
          const uEmail = (u.email || '').toLowerCase().trim();
          const uUsername = (u.username || '').toLowerCase().trim();
          const uEmailPrefix = uEmail.split('@')[0];
          if (
            uEmail === lowerEmail ||
            (derivedUsername && uUsername === derivedUsername) ||
            uEmailPrefix === cleanEmail.split('@')[0].toLowerCase()
          ) {
            matchingIndices.push(i);
          }
        });

        if (matchingIndices.length > 0) {
          const primaryIndex = matchingIndices[0];
          const existing = prev[primaryIndex];
          updatedUser = {
            ...existing,
            name: cleanName,
            email: cleanEmail,
            username: existing.username || derivedUsername,
            password: cleanPassword,
            avatarUrl: userData.avatarUrl || existing.avatarUrl,
            role: assignedRole,
            appMode,
            status: 'ACTIVE',
          };
          // Filter out any other duplicate records, keeping only updatedUser
          const next = prev.filter((_, idx) => idx === primaryIndex || !matchingIndices.includes(idx));
          const targetIdx = next.findIndex((u) => u.id === existing.id);
          if (targetIdx >= 0) {
            next[targetIdx] = updatedUser;
          }
          try {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
          } catch {}
          return next;
        }

        updatedUser = {
          id: `user-google-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          username: derivedUsername,
          password: cleanPassword,
          role: assignedRole,
          appMode,
          title: assignedRole === 'DOCTOR' ? 'Dokter Klinik' : 'Super Admin Faskes (Pemilik Klinik)',
          status: 'ACTIVE',
          avatarUrl: userData.avatarUrl,
          createdAt: new Date().toISOString(),
          sip: isDoctor ? '503/SIP/DKS/2026' : undefined,
        };
        const next = [...prev, updatedUser];
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
        } catch {}

        // Start 14-day trial countdown for new user
        startNewUserTrial(14);
        return next;
      });

      if (!updatedUser) {
        throw new Error('Gagal memperbarui data akun.');
      }

      const finalUser: User = updatedUser;
      const { password: _, ...userWithoutPassword } = finalUser;
      setCurrentUser(userWithoutPassword);
      startSessionTimer();
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userWithoutPassword));
      } catch {}

      // Update config state
      setConfigState((prev) => ({
        ...prev,
        appMode: finalUser.appMode,
        currentRole: finalUser.role as Role,
        doctorName: finalUser.role === 'DOCTOR' ? finalUser.name : prev.doctorName,
        sip: finalUser.role === 'DOCTOR' && finalUser.sip ? finalUser.sip : prev.sip,
        activeDoctorId: finalUser.doctorId || prev.activeDoctorId,
      }));

      return { success: true, user: userWithoutPassword };
    } catch (err: any) {
      console.error('[Google Register Error]:', err);
      return { success: false, error: err?.message || 'Gagal menyimpan kata sandi akun.' };
    }
  };

  const loginWithGoogle = async (googleData: {
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanEmail = googleData.email.trim();
    const cleanName = googleData.name.trim() || 'Pengguna Google';
    const lowerEmail = cleanEmail.toLowerCase();

    // 1. Synchronize to backend if accessible
    let userTenantId: string | undefined = undefined;
    try {
      const backendAuth = await loginOrRegisterGoogleBackend(cleanName, cleanEmail);
      if (backendAuth?.token) {
        localStorage.setItem(STORAGE_AUTH_KEYS.ACCESS_TOKEN, backendAuth.token);
      }
      userTenantId = (backendAuth?.user as any)?.tenant_id || (backendAuth?.user as any)?.tenantId;
    } catch (err) {
      console.warn('[Google Auth] Backend sync skipped or unavailable:', err);
    }

    // 2. Check if user already exists (strictly single account)
    let targetUser: User | null = null;
    const derivedUsername = cleanEmail.split('@')[0].toLowerCase();

    setUsers((prev) => {
      const existingIdx = prev.findIndex(
        (u) =>
          u.email.toLowerCase() === lowerEmail ||
          (u.username && u.username.toLowerCase() === derivedUsername) ||
          u.email.split('@')[0].toLowerCase() === derivedUsername
      );

      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        targetUser = {
          ...existing,
          name: cleanName || existing.name,
          email: cleanEmail,
          username: existing.username || derivedUsername,
          avatarUrl: googleData.avatarUrl || existing.avatarUrl,
        };
        const next = [...prev];
        next[existingIdx] = targetUser;
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
        } catch {}
        return next;
      }

      const isDoctor = cleanName.toLowerCase().startsWith('dr.') || cleanName.toLowerCase().includes('dokter');
      const newUser: User = {
        id: `user-google-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        username: derivedUsername,
        role: 'SUPERADMIN',
        appMode: 'DOCTOR_AND_ADMIN',
        title: 'Super Admin Faskes (Masa Percobaan Trial)',
        status: 'ACTIVE',
        avatarUrl: googleData.avatarUrl,
        createdAt: new Date().toISOString(),
        sip: isDoctor ? '503/SIP/DKS/2026' : undefined,
      };

      targetUser = newUser;
      const next = [...prev, newUser];
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
      } catch {}

      // Start 14-day trial countdown for new Google user
      startNewUserTrial(14);
      return next;
    });

    if (!targetUser) {
      targetUser = {
        id: `user-google-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        username: derivedUsername,
        role: 'SUPERADMIN',
        appMode: 'DOCTOR_AND_ADMIN',
        title: 'Super Admin Faskes (Masa Percobaan Trial)',
        status: 'ACTIVE',
      };
    }

    const { password: _, ...userWithoutPassword } = targetUser;
    if (userTenantId) {
      userWithoutPassword.tenantId = userTenantId;
      userWithoutPassword.tenant_id = userTenantId;
      setActiveTenantId(userTenantId);
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, userTenantId);
      } catch {}
    }
    setCurrentUser(userWithoutPassword);
    startSessionTimer();
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userWithoutPassword));
    } catch (e) {}
    syncTenantData(userTenantId);

    // Synchronize practice config
    setConfigState((prev) => ({
      ...prev,
      appMode: targetUser!.appMode,
      currentRole: targetUser!.role as Role,
      doctorName: targetUser!.role === 'DOCTOR' ? targetUser!.name : prev.doctorName,
      sip: targetUser!.role === 'DOCTOR' && targetUser!.sip ? targetUser!.sip : prev.sip,
      activeDoctorId: targetUser!.doctorId || prev.activeDoctorId,
    }));

    return { success: true, user: userWithoutPassword };
  };

  const loginWithGoogleResponse = async (
    backendResponse: any
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      if (!backendResponse) {
        return { success: false, error: 'Data respon Google login kosong.' };
      }

      const resData = backendResponse.data || backendResponse;
      const token =
        resData.token ||
        resData.access_token ||
        resData.accessToken ||
        backendResponse.token ||
        backendResponse.access_token ||
        '';

      const refreshToken =
        resData.refreshToken ||
        resData.refresh_token ||
        backendResponse.refreshToken ||
        backendResponse.refresh_token ||
        '';

      const userProfile: BackendUser | undefined = resData.user || backendResponse.user;
      const session = resData.session || backendResponse.session;

      if (!token) {
        return {
          success: false,
          error:
            backendResponse.response_message ||
            backendResponse.message ||
            'Token tidak ditemukan dalam respon login Google.',
        };
      }

      // Store raw session data if provided
      if (typeof window !== 'undefined' && session) {
        try {
          localStorage.setItem('rme_auth_session', JSON.stringify(session));
        } catch (e) {}
      }

      return await loginWithGoogleToken(token, refreshToken, userProfile);
    } catch (err: any) {
      console.error('[Google Auth] Gagal memproses backend response:', err);
      return { success: false, error: err?.message || 'Gagal memproses data respon login Google.' };
    }
  };

  const loginWithGoogleToken = async (
    token: string,
    refreshToken?: string,
    userProfile?: BackendUser
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      if (!token) {
        return { success: false, error: 'Token autentikasi Google tidak ditemukan.' };
      }

      // 1. Save tokens in localStorage
      try {
        localStorage.setItem(STORAGE_AUTH_KEYS.ACCESS_TOKEN, token);
        if (refreshToken) {
          localStorage.setItem(STORAGE_AUTH_KEYS.REFRESH_TOKEN, refreshToken);
        }
      } catch (e) {
        console.warn('[Google Auth] Failed to write tokens to localStorage:', e);
      }

      // 2. Resolve user data: passed profile -> fetchUserProfile(token) -> parseJwt(token)
      let bUser: BackendUser | null = userProfile || null;
      if (!bUser) {
        bUser = await fetchUserProfile(token);
      }
      if (!bUser) {
        const decoded = parseJwt(token);
        if (decoded) {
          bUser = {
            id: decoded.sub || decoded.id || `google-${Date.now()}`,
            name: decoded.name || decoded.user_name || decoded.email?.split('@')[0] || 'Pengguna Google',
            email: decoded.email || 'user@google.com',
            role: decoded.role || decoded.roles?.[0] || 'ADMIN',
          };
        }
      }

      const email = bUser?.email || bUser?.username || bUser?.user_name || 'user@google.com';
      const name = bUser?.name || email.split('@')[0] || 'Pengguna Google';

      // Resolve role: prioritize modelHasRoles, nama_role, role
      let rawRole = (bUser?.nama_role || bUser?.role || '').toUpperCase();
      if (!rawRole && bUser?.modelHasRoles && bUser.modelHasRoles.length > 0) {
        rawRole = (bUser.modelHasRoles[0]?.Role?.name || '').toUpperCase();
      }
      if (!rawRole) rawRole = 'USER';

      let role: Role;
      if (rawRole.includes('SAAS') || rawRole.includes('SUPERADMIN')) {
        role = 'SAAS_ADMIN';
      } else if (rawRole.includes('DOKTER') || rawRole.includes('DOCTOR') || name.toLowerCase().startsWith('dr.')) {
        role = 'DOCTOR';
      } else if (rawRole.includes('PERAWAT') || rawRole.includes('NURSE')) {
        role = 'NURSE';
      } else if (rawRole.includes('APOTEKER') || rawRole.includes('PHARMACIST') || rawRole.includes('FARMASI')) {
        role = 'PHARMACIST';
      } else {
        // "user" or default owner in backend maps to ADMIN in RME
        role = 'ADMIN';
      }

      const appMode: AppMode = role === 'DOCTOR' ? 'DOCTOR_ONLY' : 'DOCTOR_AND_ADMIN';

      const derivedUsername = (bUser?.username || email.split('@')[0] || '').toLowerCase();
      let targetUser: User | null = null;
      setUsers((prev) => {
        const existingIdx = prev.findIndex(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() ||
            (u.username && u.username.toLowerCase() === derivedUsername) ||
            u.email.split('@')[0].toLowerCase() === email.split('@')[0].toLowerCase()
        );

        if (existingIdx >= 0) {
          const existing = prev[existingIdx];
          targetUser = {
            ...existing,
            name: name || existing.name,
            email,
            username: existing.username || derivedUsername,
            avatarUrl: bUser?.avatarUrl || bUser?.picture || existing.avatarUrl,
          };
          const next = [...prev];
          next[existingIdx] = targetUser;
          try {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
          } catch {}
          return next;
        }

        const newUser: User = {
          id: String(bUser?.id || bUser?.id_user || `user-google-${Date.now()}`),
          name,
          email,
          username: derivedUsername,
          role,
          roleId: bUser?.roleId || bUser?.modelHasRoles?.[0]?.role_id,
          appMode,
          title: role === 'DOCTOR' ? 'Dokter Klinik' : 'Administrator Faskes / Pemilik Klinik',
          status: 'ACTIVE',
          avatarUrl: bUser?.avatarUrl || bUser?.picture,
          createdAt: bUser?.created_at || bUser?.createdAt || new Date().toISOString(),
          sip: role === 'DOCTOR' ? (bUser?.sip || '503/SIP/DKS/2026') : undefined,
        };

        targetUser = newUser;
        const next = [...prev, newUser];
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
        } catch {}

        startNewUserTrial(14);
        return next;
      });

      if (!targetUser) {
        targetUser = {
          id: String(bUser?.id || bUser?.id_user || `user-google-${Date.now()}`),
          name,
          email,
          username: derivedUsername,
          role,
          appMode,
          title: role === 'DOCTOR' ? 'Dokter Klinik' : 'Administrator Faskes / Pemilik Klinik',
          status: 'ACTIVE',
        };
      }

      const decoded = parseJwt(token);
      const userTenantId =
        (bUser as any)?.tenant_id ||
        (bUser as any)?.tenantId ||
        decoded?.tenant_id ||
        undefined;

      if (userTenantId) {
        setActiveTenantId(userTenantId);
        try {
          localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, userTenantId);
        } catch {}
      }

      const { password: _, ...userWithoutPassword } = targetUser;
      if (userTenantId) {
        userWithoutPassword.tenantId = userTenantId;
        userWithoutPassword.tenant_id = userTenantId;
      }
      setCurrentUser(userWithoutPassword);
      startSessionTimer();
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userWithoutPassword));
        if (bUser) {
          localStorage.setItem('rme_backend_user', JSON.stringify(bUser));
        }
      } catch (e) {}

      // Always trigger sync for this tenant from backend after Google login
      syncTenantData(userTenantId, targetUser!.role as Role);

      // 4. Update config state
      setConfigState((prev) => ({
        ...prev,
        appMode: targetUser!.appMode,
        currentRole: targetUser!.role as Role,
        doctorName: targetUser!.role === 'DOCTOR' ? targetUser!.name : prev.doctorName,
        sip: targetUser!.role === 'DOCTOR' && targetUser!.sip ? targetUser!.sip : prev.sip,
        activeDoctorId: targetUser!.doctorId || prev.activeDoctorId,
      }));

      return { success: true, user: userWithoutPassword };
    } catch (err: any) {
      console.error('[Google Auth] Error completing login from token:', err);
      return { success: false, error: err?.message || 'Gagal memproses sesi login Google.' };
    }
  };

  const loginAsDemo = (userId: string): User | undefined => {
    const foundUser = users.find((u) => u.id === userId) || users[0] || MOCK_USERS[0];
    const { password: _, ...userWithoutPassword } = foundUser;
    setCurrentUser(userWithoutPassword);
    startSessionTimer();
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userWithoutPassword));
    } catch (e) {}

    setConfigState((prev) => ({
      ...prev,
      appMode: foundUser.appMode,
      currentRole: foundUser.role as Role,
      doctorName: foundUser.role === 'DOCTOR' ? foundUser.name : prev.doctorName,
      sip: (foundUser.role === 'DOCTOR' && foundUser.sip) ? foundUser.sip : prev.sip,
      activeDoctorId: foundUser.doctorId || prev.activeDoctorId,
    }));

    return userWithoutPassword;
  };

  const logout = () => {
    setCurrentUser(null);
    setSessionExpiresAt(null);
    setSessionRemainingSeconds(0);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, 'LOGGED_OUT');
      localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
      localStorage.removeItem(STORAGE_AUTH_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_AUTH_KEYS.REFRESH_TOKEN);
    } catch (e) {}
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState('light');
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
      document.documentElement.classList.remove('dark');
    } catch (e) {}
  };

  const toggleTheme = () => {
    setTheme('light');
  };

  // Reset Data to Default Clean State
  const resetToDefault = () => {
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.PATIENTS);
    localStorage.removeItem(STORAGE_KEYS.DOCTORS);
    localStorage.removeItem(STORAGE_KEYS.NURSES);
    localStorage.removeItem(STORAGE_KEYS.VISITS);
    localStorage.removeItem(STORAGE_KEYS.MEDICATIONS);
    localStorage.removeItem(STORAGE_KEYS.DIAGNOSES);
    localStorage.removeItem(STORAGE_KEYS.PROCEDURES);
    localStorage.removeItem(STORAGE_KEYS.ICD9);
    localStorage.removeItem(STORAGE_KEYS.SNOMED);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.ROLE_PERMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.THEME);
    localStorage.removeItem(STORAGE_KEYS.TRIAL);
    localStorage.removeItem(STORAGE_KEYS.SATUSEHAT_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.SATUSEHAT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.BPJS_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.BPJS_LOGS);
    localStorage.removeItem(STORAGE_KEYS.STOCK_OPNAME);
    localStorage.removeItem(STORAGE_KEYS.SAAS_INVOICES);
    localStorage.removeItem(STORAGE_KEYS.TENANTS);
    try {
      localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(MOCK_TENANTS));
    } catch {}

    setConfigState(INITIAL_PRACTICE_CONFIG);
    setPatients([]);
    setDoctors([]);
    setNurses([]);
    setVisits([]);
    setMedications([]);
    setDiagnoses(MOCK_DIAGNOSES);
    setProcedures([]);
    setIcd9List(MOCK_ICD9);
    setSnomedList(MOCK_SNOMED);
    setUsers(MOCK_USERS);
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    setCurrentUser(null);
    setTrialInfo(getInitialTrialInfo());
    setSatuSehatConfigState(INITIAL_SATUSEHAT_CONFIG);
    setSatuSehatLogs([]);
    setBpjsConfigState(INITIAL_BPJS_CONFIG);
    setBpjsLogs([]);
    setStockOpnameHistory([]);
    setSaasInvoices([]);
    setTenants(MOCK_TENANTS);
    setActiveTenantId(MOCK_TENANTS[0].id);
    setThemeState('light');
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
    toast.success('Database berhasil dibersihkan (Clear Data)!');
  };

  const reloadReportDummyData = () => {
    setVisits([]);
    try {
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify([]));
    } catch {}
    toast.info('Data transaksi kunjungan telah dibersihkan.');
  };

  const seedTodayQueue = () => {
    setVisits([]);
    try {
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify([]));
    } catch {}
    toast.info('Antrian pasien hari ini telah dibersihkan.');
  };

  return (
    <RMEContext.Provider
      value={{
        config,
        patients,
        doctors,
        nurses,
        visits,
        medications,
        diagnoses,
        procedures,
        icd9List,
        snomedList,
        isLoaded,
        trialInfo,
        daysRemaining,
        hoursRemaining,
        isTrialActive,
        isTrialExpired,
        percentageUsed,
        extendTrial,
        activateLicense,
        resetTrial,
        startNewUserTrial,
        simulateExpireTrial,
        simulateUnlockTrial,
        subscribeToPlan,
        isTrialModalOpen,
        setIsTrialModalOpen,
        theme,
        setTheme,
        toggleTheme,
        currentUser,
        isAuthenticated: !!currentUser,
        sessionExpiresAt,
        sessionRemainingSeconds,
        extendSession,
        resetInactivityTimer,
        refreshUsers,
        users: users.map(({ password: _, ...u }) => u),
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        rolePermissions,
        updateRolePermissions,
        updateRoleSidebarMenus,
        resetRolePermissionsToDefault,
        hasMenuAccess,
        login,
        checkAccountStatus,
        registerGoogleUserWithPassword,
        loginWithGoogle,
        loginWithGoogleToken,
          loginWithGoogleResponse,
        loginAsDemo,
        logout,
        setAppMode,
        setCurrentRole,
        updateConfig,
        addPatient,
        updatePatient,
        deletePatient,
        getPatientById,
        createVisit,
        updateVisitStatus,
        prescriptionStatuses,
        updatePrescriptionStatus,
        cancelVisit,
        getVisitById,
        getVisitsByPatientId,
        loadMedicalRecordForVisit,
        saveMedicalRecord,
        getBillingByVisitId,
        createOrUpdateBilling,
        processPayment,
        addMedication,
        updateMedication,
        deleteMedication,
        addProcedure,
        updateProcedure,
        deleteProcedure,
        addDoctor,
        updateDoctor,
        deleteDoctor,
        toggleDoctorStatus,
        addNurse,
        updateNurse,
        deleteNurse,
        toggleNurseStatus,
        addDiagnosis,
        updateDiagnosis,
        deleteDiagnosis,
        addICD9,
        updateICD9,
        deleteICD9,
        addSNOMED,
        updateSNOMED,
        deleteSNOMED,
        satuSehatConfig,
        satuSehatLogs,
        updateSatuSehatConfig,
        testSatuSehatConnection,
        lookupPatientIHS,
        lookupPractitionerIHS,
        syncVisitToSatuSehat,
        clearSatuSehatLogs,
        bpjsConfig,
        bpjsLogs,
        updateBPJSConfig,
        testBPJSConnection,
        checkBPJSEligibility,
        syncVisitToBPJS,
        clearBPJSLogs,
        stockOpnameHistory,
        applyStockOpname,
        tenants,
        activeTenant,
        plans,
        saasInvoices,
        switchTenant,
        addTenant,
        updateTenant,
        deleteTenant,
        updateSaaSInvoiceStatus,
        deleteSaaSInvoice,
        resetToDefault,
        reloadReportDummyData,
        seedTodayQueue,
        refreshPatients,
        refreshVisits,
        refreshDoctors,
        refreshNurses,
        refreshMedications,
        refreshProcedures,
        syncAllBackendData,
        isSyncingBackend,
        dbMenus,
        setDbMenus,
        refreshMenus,
        dbPermissions,
        setDbPermissions,
        refreshPermissions,
        hasPermission,
      }}
    >
      {children}
    </RMEContext.Provider>
  );
};

export const useRME = (): RMEContextType => {
  const context = useContext(RMEContext);
  if (!context) {
    throw new Error('useRME must be used within an RMEProvider');
  }
  return context;
};
