'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  Stethoscope,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  Clock,
  CreditCard,
  Pill,
  HeartPulse,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  LogOut,
  Building2,
  Activity,
  Shield,
  User,
  Dot,
  Sparkles,
  Zap,
  Globe,
  UserCheck,
  BookOpen,
  Database,
  Tv,
  Printer,
  Boxes,
  Lock,
  MapPin,
  Microscope,
  ScanLine,
  Laptop,
  Key,
  Folder,
  Server,
} from 'lucide-react';
import { useRME } from '@/context/rme-context';
import { SidebarMenuKey, PracticeConfig } from '@/types/rme';
import type { BackendMenuTreeItem } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SubNavItem {
  label: string;
  href: string;
  icon?: React.ElementType;
  badge?: string | number;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  exact?: boolean;
  subItems?: SubNavItem[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface AppSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  CalendarPlus,
  Stethoscope,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  Clock,
  CreditCard,
  Pill,
  HeartPulse,
  Building2,
  Activity,
  Shield,
  User,
  Sparkles,
  Zap,
  Globe,
  UserCheck,
  BookOpen,
  Database,
  Tv,
  Printer,
  Boxes,
  Lock,
  MapPin,
  Microscope,
  ScanLine,
  Laptop,
  Key,
  Folder,
  Server,
};

function resolveMenuIcon(iconName?: string | null, fallback: React.ElementType = LayoutDashboard): React.ElementType {
  if (!iconName) return fallback;
  if (ICON_MAP[iconName]) return ICON_MAP[iconName];
  const cleaned = iconName.toLowerCase().replace(/[-_\s]/g, '').replace(/icon$/, '');
  for (const [k, v] of Object.entries(ICON_MAP)) {
    if (k.toLowerCase().replace(/[-_\s]/g, '') === cleaned) return v;
  }
  return fallback;
}

const ROUTE_PERMISSION_MAP: Record<string, string[]> = {
  '/patients': ['view_patient'],
  '/queue': ['view_visit'],
  '/registration': ['create_patient', 'create_visit', 'view_patient'],
  '/medical-record': ['view_medical_record'],
  '/laboratory': ['view_medical_record', 'view_patient'],
  '/radiology': ['view_medical_record', 'view_patient'],
  '/billing': ['view_billing', 'create_billing'],
  '/medications': ['view_medication'],
  '/reports': ['view_clinical_report', 'view_financial_report'],
  '/reports/visits': ['view_clinical_report', 'view_visit'],
  '/reports/revenue': ['view_financial_report'],
  '/reports/honorarium': ['view_financial_report', 'view_doctor'],
  '/reports/stock-opname': ['stock_opname', 'view_medication'],
  '/settings': ['view_settings'],
  '/settings/invoice': ['view_settings', 'edit_settings'],
  '/settings/doctors': ['view_doctor', 'manage_doctor'],
  '/settings/nurses': ['view_nurse', 'manage_nurse'],
  '/settings/icd10': ['view_settings'],
  '/settings/icd9': ['view_settings'],
  '/settings/snomed': ['view_settings'],
  '/settings/wilayah': ['view_wilayah'],
  '/settings/satusehat': ['manage_satusehat'],
  '/settings/bpjs': ['manage_bpjs'],
  '/settings/procedures': ['view_procedure'],
  '/settings/users': ['manage_users'],
  '/settings/mode': ['view_settings', 'edit_settings'],
  '/settings/account': [],
  '/saas': ['manage_saas_tenants', 'manage_saas_plans'],
  '/saas/tenants': ['manage_saas_tenants'],
  '/saas/plans': ['manage_saas_plans'],
  '/saas/billing': ['manage_saas_invoices'],
};

function isRouteAllowedByFacility(href?: string | null, config?: PracticeConfig): boolean {
  if (!href || !config) return true;
  const path = href.toLowerCase();
  if (config.hasPharmacy === false) {
    if (path === '/medications' || path.includes('/stock-opname') || path.includes('medication') || path.includes('tab=pharmacy')) {
      return false;
    }
  }
  if (!config.hasLaboratory) {
    if (path === '/laboratory' || path.includes('lab')) {
      return false;
    }
  }
  if (!config.hasRadiology) {
    if (path === '/radiology' || path.includes('radio')) {
      return false;
    }
  }
  return true;
}

function isRouteAllowedByPermission(
  href: string | undefined | null,
  role: string,
  userPermissions: string[]
): boolean {
  if (!href || href === '#') return true;
  if (
    role === 'SUPERADMIN' ||
    role === 'SAAS_ADMIN' ||
    role === 'ADMIN'
  ) {
    return true;
  }
  const requiredPerms = ROUTE_PERMISSION_MAP[href];
  if (!requiredPerms || requiredPerms.length === 0) {
    return true;
  }
  if (userPermissions && userPermissions.length > 0) {
    return requiredPerms.some((perm) => userPermissions.includes(perm));
  }
  return true;
}

export function AppSidebar({
  isMobileOpen,
  onMobileClose,
  isCollapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    config,
    currentUser,
    logout,
    visits,
    hasMenuAccess,
    saasInvoices,
    tenants,
    trialInfo,
    isTrialExpired,
    dbMenus,
    dbPermissions,
    hasPermission,
  } = useRME();
  const [isHovered, setIsHovered] = useState(false);

  const isSuperAdmin =
    currentUser?.email?.toLowerCase() === 'provider@rme.id' ||
    currentUser?.role === 'SAAS_ADMIN';

  const isTrialActive = trialInfo?.tier === 'TRIAL' && !isTrialExpired;

  // During active trial, the user operates with full Super Admin privileges across all modules
  const effectiveRole =
    isTrialActive && !isSuperAdmin
      ? 'SUPERADMIN'
      : (currentUser?.role || config.currentRole);

  // Lock checker: When trial has expired and user is not system provider SAAS_ADMIN,
  // all service menus are locked. Only subscription & billing are open!
  const isItemLocked = (href: string) => {
    if (!isTrialExpired || isSuperAdmin) return false;
    const isSubscriptionRoute = href === '/saas/plans' || href === '/saas/billing';
    return !isSubscriptionRoute;
  };

  const handleLockedClick = (e: React.MouseEvent, menuLabel: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast.error('Masa Uji Coba (Trial) Berakhir!', {
      description: `Akses menu "${menuLabel}" dinonaktifkan. Silakan pilih paket langganan dan selesaikan pembayaran untuk mengaktifkan kembali seluruh layanan.`,
      duration: 5000,
    });
    router.push('/saas/plans');
  };

  // Submenu Open / Closed state: only open the current section by default
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (pathname.startsWith('/settings') || pathname.startsWith('/medications')) {
      initial['/settings'] = true;
    }
    if (pathname.startsWith('/reports')) {
      initial['/reports'] = true;
    }
    if (pathname.startsWith('/queue')) {
      initial['/queue'] = true;
    }
    if (pathname.startsWith('/saas')) {
      initial['/saas'] = true;
    }
    return initial;
  });

  // Automatically keep submenu open when navigating into child routes
  React.useEffect(() => {
    if (pathname.startsWith('/settings') || pathname.startsWith('/medications')) {
      setOpenSubmenus((prev) => ({ ...prev, '/settings': true }));
    }
    if (pathname.startsWith('/reports')) {
      setOpenSubmenus((prev) => ({ ...prev, '/reports': true }));
    }
    if (pathname.startsWith('/queue')) {
      setOpenSubmenus((prev) => ({ ...prev, '/queue': true }));
    }
    if (pathname.startsWith('/saas')) {
      setOpenSubmenus((prev) => ({ ...prev, '/saas': true }));
    }
  }, [pathname]);

  // When collapsed, hovering over the sidebar expands it temporarily on desktop
  const isExpanded = !isCollapsed || isHovered;

  // Active queue and billing counts for live badges
  const waitingVisitsCount = visits.filter(
    (v) => v.status === 'WAITING' || v.status === 'IN_PROGRESS'
  ).length;
  const waitingPaymentCount = visits.filter((v) => v.status === 'WAITING_PAYMENT').length;

  const todayDateStr = new Date().toISOString().split('T')[0];
  const pharmacyQueueCount = visits.filter((v) => {
    if (v.date !== todayDateStr) return false;
    if (!v.medicalRecord?.prescriptions || v.medicalRecord.prescriptions.length === 0) return false;
    const st = v.prescriptionStatus || v.medicalRecord.prescriptionDispenseStatus || 'WAITING_REVIEW';
    return st === 'WAITING_REVIEW' || st === 'PREPARING' || st === 'READY_FOR_PICKUP';
  }).length;

  const toggleSubmenu = (href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOpenSubmenus((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  // Structured, clean, user-friendly navigation sections
  let navSections: NavSection[] = [];

  const queueSubItems: SubNavItem[] = [
    { label: 'Daftar & Panggil Antrian Poli', href: '/queue', icon: Clock },
    ...(config.hasPharmacy !== false
      ? [
          {
            label: 'Antrean Farmasi & Resep',
            href: '/queue?tab=pharmacy',
            icon: Pill,
            badge: pharmacyQueueCount > 0 ? pharmacyQueueCount : undefined,
          },
        ]
      : []),
    { label: 'Display Antrian (Layar TV)', href: '/queue/display', icon: Tv },
  ];

  const medicalRecordSubItems: SubNavItem[] = [
    { label: 'Arsip Rekam Medis', href: '/medical-record', icon: FileText },
    { label: 'Master ICD-10 (Diagnosis)', href: '/settings/icd10', icon: BookOpen },
    { label: 'Master ICD-9 (Tindakan)', href: '/settings/icd9', icon: Activity },
  ];

  const reportsSubItems: SubNavItem[] = [
    { label: 'Ringkasan & Statistik', href: '/reports', icon: BarChart3 },
    { label: 'Laporan Kunjungan', href: '/reports/visits', icon: Users },
    { label: 'Laporan Pendapatan', href: '/reports/revenue', icon: Receipt },
    { label: 'Laporan Honorer Dokter & Perawat', href: '/reports/honorarium', icon: UserCheck },
    ...(config.hasPharmacy !== false
      ? [{ label: 'Stock Opname Obat', href: '/reports/stock-opname', icon: Boxes }]
      : []),
  ];

  const settingsSubItems: SubNavItem[] = [
    { label: 'Profil Faskes & SIP', href: '/settings', icon: Building2 },
    { label: 'Setup Invoice & Kop Surat', href: '/settings/invoice', icon: Receipt },
    { label: 'Setup Dokter', href: '/settings/doctors', icon: Stethoscope },
    { label: 'Setup Perawat & Bidan', href: '/settings/nurses', icon: UserCheck },
    { label: 'Master ICD-10 (Diagnosis)', href: '/settings/icd10', icon: BookOpen },
    { label: 'Master ICD-9 (Tindakan Medis)', href: '/settings/icd9', icon: Activity },
    { label: 'Setup SNOMED CT', href: '/settings/snomed', icon: Database },
    { label: 'Master Wilayah (Prov, Kota, Kec, Kel)', href: '/settings/wilayah', icon: MapPin },
    { label: 'Integrasi SATUSEHAT', href: '/settings/satusehat', icon: Globe },
    { label: 'Integrasi BPJS Kesehatan', href: '/settings/bpjs', icon: Shield },
    ...(config.hasPharmacy !== false
      ? [{ label: 'Master Obat & Farmasi', href: '/medications', icon: Pill }]
      : []),
    { label: 'Master Tindakan Medis', href: '/settings/procedures', icon: Activity },
    { label: 'Manajemen User & RBAC', href: '/settings/users', icon: Users },
    { label: 'Mode Operasional & Alur', href: '/settings/mode', icon: Shield },
    { label: 'Akun & Sesi Login', href: '/settings/account', icon: User },
  ];

  const saasSubItems: SubNavItem[] = [
    { label: 'Statistik & Ringkasan', href: '/saas', icon: BarChart3 },
    { label: 'Kelola Tenant / Faskes', href: '/saas/tenants', icon: Building2 },
    { label: 'Paket & Berlangganan', href: '/saas/plans', icon: Sparkles },
    { label: 'Faktur & Tagihan SaaS', href: '/saas/billing', icon: Receipt },
  ];

  const activeTenantsCount = tenants.filter((t) => t.status === 'ACTIVE').length;
  const unpaidSaaSInvoices = saasInvoices.filter((i) => i.status === 'PENDING').length;

  if (dbMenus && dbMenus.length > 0) {
    // Dynamic navigation built directly from database (GET /v1/menus/auth or GET /v1/menus/role/:id)
    type CategoryGroup = {
      id: string;
      name: string;
      order: number;
      items: NavItem[];
    };

    const categoryMap = new Map<string, CategoryGroup>();
    const sortedDbMenus = [...dbMenus].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Filter root menus: menus where parent_id is null or not found among dbMenus
    const allDbMenuIds = new Set(sortedDbMenus.map((m) => m.id));
    let rootMenus = sortedDbMenus.filter((m) => !m.parent_id || !allDbMenuIds.has(m.parent_id));
    if (rootMenus.length === 0) {
      rootMenus = sortedDbMenus;
    }

    for (const menu of rootMenus) {
      // 1. Facility toggle guard (Farmasi, Laboratorium, Radiologi)
      if (!isRouteAllowedByFacility(menu.path, config)) {
        continue;
      }

      // 2. Role & Granular permission guard
      if (!isRouteAllowedByPermission(menu.path, effectiveRole, dbPermissions)) {
        continue;
      }

      const catId = menu.category?.id || menu.category_id || 'default';
      const catName = menu.category?.name || 'Menu Utama';
      const catOrder = menu.category?.order ?? 99;

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          id: catId,
          name: catName,
          order: catOrder,
          items: [],
        });
      }

      // Dynamic badges for live indicators
      let badge: string | number | undefined = undefined;
      if (menu.path === '/queue') {
        if (effectiveRole === 'PHARMACIST') {
          badge = pharmacyQueueCount > 0 ? pharmacyQueueCount : undefined;
        } else if (waitingVisitsCount > 0) {
          badge = waitingVisitsCount;
        }
      } else if (menu.path === '/billing' && waitingPaymentCount > 0) {
        badge = waitingPaymentCount;
      } else if (menu.path === '/saas/billing' && unpaidSaaSInvoices > 0) {
        badge = unpaidSaaSInvoices;
      } else if (menu.path === '/saas/tenants' && activeTenantsCount > 0) {
        badge = `${activeTenantsCount} Aktif`;
      }

      // Find children from either nested children or child rows by parent_id
      let candidateChildren: BackendMenuTreeItem[] = [];
      if (menu.children && menu.children.length > 0) {
        candidateChildren = menu.children;
      } else {
        candidateChildren = sortedDbMenus.filter((c) => c.parent_id === menu.id);
      }

      // Subitems mapping with facility & permission checks
      let subItems: SubNavItem[] | undefined = undefined;
      if (candidateChildren.length > 0) {
        const sortedChildren = [...candidateChildren].sort((a, b) => (a.order || 0) - (b.order || 0));
        const filteredChildren = sortedChildren.filter((child) => {
          return (
            isRouteAllowedByFacility(child.path, config) &&
            isRouteAllowedByPermission(child.path, effectiveRole, dbPermissions)
          );
        });

        if (filteredChildren.length > 0) {
          subItems = filteredChildren.map((child) => {
            let badge: string | number | undefined = undefined;
            if (child.path === '/queue?tab=pharmacy' && pharmacyQueueCount > 0) {
              badge = pharmacyQueueCount;
            }
            return {
              label: child.name,
              href: child.path || '#',
              icon: resolveMenuIcon(child.icon, FileText),
              badge,
            };
          });
        }
      } else {
        // Augment known submenus if child rows were not loaded in DB response
        if (menu.path === '/queue') {
          subItems = queueSubItems;
        } else if (menu.path === '/reports') {
          subItems = reportsSubItems.filter((s) => isRouteAllowedByFacility(s.href, config));
        } else if (menu.path === '/settings') {
          subItems = settingsSubItems.filter(
            (s) =>
              isRouteAllowedByFacility(s.href, config) &&
              isRouteAllowedByPermission(s.href, effectiveRole, dbPermissions)
          );
        } else if (menu.path === '/saas') {
          subItems = saasSubItems;
        }
      }

      const navItem: NavItem = {
        label: menu.name,
        href: menu.path || '#',
        icon: resolveMenuIcon(menu.icon, LayoutDashboard),
        badge,
        exact: menu.path === '/dashboard',
        subItems,
      };

      categoryMap.get(catId)!.items.push(navItem);
    }

    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => a.order - b.order);

    navSections = sortedCategories
      .filter((cat) => cat.items.length > 0)
      .map((cat) => ({
        title: cat.name,
        items: cat.items,
      }));
  } else if (effectiveRole === 'SAAS_ADMIN') {
    // Dedicated System Provider / SaaS Management Navigation
    navSections.push({
      title: 'Pusat Manajemen Sistem',
      items: [
        {
          label: 'Dashboard Monitoring',
          href: '/dashboard',
          icon: LayoutDashboard,
          exact: true,
        },
        {
          label: 'Monitoring Pelanggan',
          href: '/saas/tenants',
          icon: Building2,
          badge: `${activeTenantsCount} Aktif`,
        },
        {
          label: 'Paket & Berlangganan',
          href: '/saas/plans',
          icon: Sparkles,
        },
        {
          label: 'Faktur & Tagihan SaaS',
          href: '/saas/billing',
          icon: Receipt,
          badge: unpaidSaaSInvoices > 0 ? unpaidSaaSInvoices : undefined,
        },
        {
          label: 'SaaS Control Hub',
          href: '/saas',
          icon: BarChart3,
        },
      ],
    });

    navSections.push({
      title: 'Infrastruktur & Integrasi',
      items: [
        {
          label: 'Gateway SATUSEHAT',
          href: '/settings/satusehat',
          icon: Globe,
        },
        {
          label: 'Integrasi BPJS Kesehatan',
          href: '/settings/bpjs',
          icon: Shield,
        },
        {
          label: 'Manajemen Pengguna & RBAC',
          href: '/settings/users',
          icon: Users,
        },
        {
          label: 'Profil Akun Provider',
          href: '/settings/account',
          icon: User,
        },
      ],
    });

    navSections.push({
      title: 'Pratinjau Modul Faskes',
      items: [
        {
          label: 'Pendaftaran Pasien',
          href: '/registration',
          icon: CalendarPlus,
        },
        {
          label: 'Antrian Pasien',
          href: '/queue',
          icon: Clock,
          subItems: queueSubItems,
        },
        {
          label: 'Data Pasien',
          href: '/patients',
          icon: Users,
        },
        {
          label: 'Master Pengaturan Faskes',
          href: '/settings',
          icon: Settings,
          subItems: settingsSubItems,
        },
      ],
    });
  } else if (config.appMode === 'DOCTOR_ONLY') {
    // Mode 1: DOKTER SAJA (Full practice workflow with permission filtering)
    const p1: NavItem[] = [];
    if (hasMenuAccess('dashboard', currentUser)) {
      p1.push({ label: 'Dashboard Dokter', href: '/dashboard', icon: LayoutDashboard, exact: true });
    }
    if (hasMenuAccess('queue', currentUser)) {
      p1.push({
        label: 'Antrian Pasien',
        href: '/queue',
        icon: Clock,
        badge: waitingVisitsCount > 0 ? waitingVisitsCount : undefined,
        subItems: queueSubItems,
      });
    }
    if (hasMenuAccess('registration', currentUser)) {
      p1.push({ label: 'Pendaftaran Pasien', href: '/registration', icon: CalendarPlus });
    }

    const p2: NavItem[] = [];
    if (hasMenuAccess('patients', currentUser)) {
      p2.push({ label: 'Data Pasien', href: '/patients', icon: Users });
    }
    if (hasMenuAccess('medicalRecord', currentUser)) {
      p2.push({
        label: 'Rekam Medis & ICD',
        href: '/medical-record',
        icon: FileText,
        subItems: medicalRecordSubItems,
      });
    }
    if (hasMenuAccess('laboratory', currentUser)) {
      p2.push({ label: 'Laboratorium Klinis', href: '/laboratory', icon: Microscope });
    }
    if (hasMenuAccess('radiology', currentUser)) {
      p2.push({ label: 'Radiologi & USG', href: '/radiology', icon: ScanLine });
    }

    const p3: NavItem[] = [];
    if (hasMenuAccess('billing', currentUser)) {
      p3.push({
        label: 'Tagihan & Kasir',
        href: '/billing',
        icon: Receipt,
        badge: waitingPaymentCount > 0 ? waitingPaymentCount : undefined,
      });
    }
    if (hasMenuAccess('medications', currentUser)) {
      p3.push({ label: 'Depo Farmasi & Obat', href: '/medications', icon: Pill });
    }
    if (hasMenuAccess('reports', currentUser)) {
      p3.push({
        label: 'Laporan Praktik',
        href: '/reports',
        icon: BarChart3,
        subItems: reportsSubItems,
      });
    }
    if (hasMenuAccess('settings', currentUser)) {
      p3.push({
        label: 'Pengaturan & Master',
        href: '/settings',
        icon: Settings,
        subItems: settingsSubItems,
      });
    }

    navSections = [];
    if (p1.length > 0) navSections.push({ title: 'Pelayanan Pasien', items: p1 });
    if (p2.length > 0) navSections.push({ title: 'Rekam Medis', items: p2 });
    if (p3.length > 0) navSections.push({ title: 'Laporan & Pengaturan', items: p3 });

    // Dedicated Subscription & Invoicing menus for Tenant Admin / Practice users
    const tenantUnpaidInvoices1 = saasInvoices.filter((i) => {
      if (i.status !== 'PENDING') return false;
      if (!isSuperAdmin && i.id.startsWith('inv-saas-')) return false;
      return true;
    });
    const unpaidInvoiceCountMode1 = tenantUnpaidInvoices1.length;
    navSections.push({
      title: 'Langganan & Pembayaran',
      items: [
        {
          label: 'Paket Berlangganan',
          href: '/saas/plans',
          icon: Sparkles,
        },
        {
          label: 'Penagihan Pembayaran',
          href: '/saas/billing',
          icon: Receipt,
          badge: unpaidInvoiceCountMode1 > 0 ? unpaidInvoiceCountMode1 : undefined,
        },
      ],
    });

    if (hasMenuAccess('saas', currentUser)) {
      navSections.push({
        title: 'Platform SaaS Multi-Tenant',
        items: [
          {
            label: 'SaaS Control Hub',
            href: '/saas',
            icon: Sparkles,
            subItems: saasSubItems,
          },
        ],
      });
    }
  } else {
    // Mode 2: KOLABORASI (Dynamic role-based navigation powered by RBAC sidebar permissions)
    const sectionTitle =
        effectiveRole === 'DOCTOR'
          ? 'Ruang Praktik Dokter'
          : effectiveRole === 'NURSE'
          ? 'Stasiun Perawat & Triase'
          : effectiveRole === 'PHARMACIST'
          ? 'Depo Farmasi & Apotek'
          : effectiveRole === 'SUPERADMIN'
          ? 'Pusat Kendali Eksekutif'
          : 'Pelayanan Pasien & Kasir';

      const candidateMenuItems: { key: SidebarMenuKey; item: NavItem }[] = [
        {
          key: 'dashboard',
          item: {
            label:
              effectiveRole === 'DOCTOR'
                ? 'Dashboard Dokter'
                : effectiveRole === 'NURSE'
                ? 'Dashboard Perawat'
                : effectiveRole === 'PHARMACIST'
                ? 'Dashboard Farmasi'
                : effectiveRole === 'SUPERADMIN'
                ? 'Dashboard Eksekutif'
                : 'Dashboard Pelayanan Pasien',
            href: '/dashboard',
            icon: LayoutDashboard,
            exact: true,
          },
        },
        {
          key: 'registration',
          item: {
            label: 'Pendaftaran Pasien',
            href: '/registration',
            icon: CalendarPlus,
          },
        },
        {
          key: 'queue',
          item: {
            label:
              effectiveRole === 'DOCTOR'
                ? 'Antrian Pasien Poli'
                : effectiveRole === 'NURSE'
                ? 'Antrian & Triase TTV'
                : effectiveRole === 'PHARMACIST'
                ? 'Antrean Farmasi & Resep'
                : effectiveRole === 'SUPERADMIN'
                ? 'Antrian Faskes'
                : 'Antrian & Display TV',
            href: effectiveRole === 'PHARMACIST' ? '/queue?tab=pharmacy' : '/queue',
            icon: effectiveRole === 'PHARMACIST' ? Pill : Clock,
            badge:
              effectiveRole === 'PHARMACIST'
                ? pharmacyQueueCount > 0
                  ? pharmacyQueueCount
                  : undefined
                : waitingVisitsCount > 0
                ? waitingVisitsCount
                : undefined,
            subItems: queueSubItems,
          },
        },
        {
          key: 'patients',
          item: {
            label: 'Data Pasien',
            href: '/patients',
            icon: Users,
          },
        },
        {
          key: 'medicalRecord',
          item: {
            label: 'Rekam Medis & ICD',
            href: '/medical-record',
            icon: FileText,
            subItems: medicalRecordSubItems,
          },
        },
        {
          key: 'laboratory',
          item: {
            label: 'Laboratorium Klinis',
            href: '/laboratory',
            icon: Microscope,
          },
        },
        {
          key: 'radiology',
          item: {
            label: 'Radiologi & USG',
            href: '/radiology',
            icon: ScanLine,
          },
        },
        {
          key: 'billing',
          item: {
            label: effectiveRole === 'DOCTOR' ? 'Tagihan & Kasir' : 'Kasir & Pembayaran',
            href: '/billing',
            icon: CreditCard,
            badge: waitingPaymentCount > 0 ? waitingPaymentCount : undefined,
          },
        },
        {
          key: 'medications',
          item: {
            label: effectiveRole === 'PHARMACIST' ? 'Master Obat & Stok' : 'Depo Farmasi & Obat',
            href: '/medications',
            icon: Pill,
          },
        },
        {
          key: 'reports',
          item: {
            label:
              effectiveRole === 'DOCTOR'
                ? 'Laporan Praktik'
                : effectiveRole === 'PHARMACIST'
                ? 'Laporan Farmasi'
                : effectiveRole === 'ADMIN'
                ? 'Laporan Keuangan'
                : 'Laporan Faskes Lengkap',
            href: '/reports',
            icon: BarChart3,
            subItems: reportsSubItems,
          },
        },
        {
          key: 'settings',
          item: {
            label:
              effectiveRole === 'SUPERADMIN'
                ? 'Pengaturan Faskes & RBAC'
                : 'Pengaturan & Master',
            href: '/settings',
            icon: Settings,
            subItems: settingsSubItems,
          },
        },
      ];

      const visibleItems = candidateMenuItems
        .filter((entry) => hasMenuAccess(entry.key, currentUser))
        .map((entry) => entry.item);

      navSections = [
        {
          title: sectionTitle,
          items: visibleItems,
        },
      ];

      // Dedicated Subscription & Invoicing menus for Tenant Admin / Practice users
      const tenantUnpaidInvoices2 = saasInvoices.filter((i) => {
        if (i.status !== 'PENDING') return false;
        if (!isSuperAdmin && i.id.startsWith('inv-saas-')) return false;
        return true;
      });
      const unpaidInvoiceCountMode2 = tenantUnpaidInvoices2.length;
      navSections.push({
        title: 'Langganan & Pembayaran',
        items: [
          {
            label: 'Paket Berlangganan',
            href: '/saas/plans',
            icon: Sparkles,
          },
          {
            label: 'Penagihan Pembayaran',
            href: '/saas/billing',
            icon: Receipt,
            badge: unpaidInvoiceCountMode2 > 0 ? unpaidInvoiceCountMode2 : undefined,
          },
        ],
      });

      // Add SaaS platform section if user is authorized
      if (hasMenuAccess('saas', currentUser)) {
        navSections.push({
          title: 'Platform SaaS Multi-Tenant',
          items: [
            {
              label: 'SaaS Control Hub',
              href: '/saas',
              icon: Sparkles,
              subItems: saasSubItems,
            },
          ],
        });
      }
    }

  // Active check helper
  const isLinkActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    const itemBasePath = item.href.split('?')[0];
    if (item.subItems && item.subItems.length > 0) {
      return (
        pathname === itemBasePath ||
        pathname.startsWith(`${itemBasePath}/`) ||
        item.subItems.some((sub) => pathname === sub.href.split('?')[0])
      );
    }
    return pathname === itemBasePath || pathname.startsWith(`${itemBasePath}/`);
  };

  const isSubItemActive = (subItem: SubNavItem) => {
    if (typeof window !== 'undefined') {
      const fullCurrent = `${pathname}${window.location.search || ''}`;
      if (subItem.href.includes('?')) {
        return fullCurrent === subItem.href;
      }
      if (pathname === subItem.href) {
        if (window.location.search && window.location.search.includes('tab=')) {
          return false;
        }
        return true;
      }
    }
    return pathname === subItem.href;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => isCollapsed && setIsHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-[100dvh] max-h-[100dvh] flex-col border-r border-slate-200/90 bg-white transition-all duration-200 ease-in-out lg:sticky lg:top-0 shrink-0 select-none shadow-xs',
          // Mobile state
          isMobileOpen ? 'translate-x-0 shadow-2xl w-60' : '-translate-x-full lg:translate-x-0',
          // Desktop width
          isExpanded ? 'w-60' : 'w-16',
          // Shadow when hovered in collapsed mode
          isCollapsed && isHovered && 'shadow-2xl z-50'
        )}
      >
        {/* Brand Logo Header */}
        <div className="flex h-14 shrink-0 items-center justify-between px-3.5 border-b border-slate-100 bg-white">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2.5 group overflow-hidden',
              !isExpanded && 'justify-center w-full'
            )}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-xs group-hover:scale-105 transition-transform bg-white border border-slate-100 p-0.5">
              <img src="/logo.png" alt="Logo RME" className="h-full w-full object-contain" />
            </div>

            {isExpanded && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <span className="text-xs font-bold tracking-tight text-slate-900 leading-none truncate">
                  {effectiveRole === 'SAAS_ADMIN' ? 'SaaS Platform' : 'RME Klinik'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                  {effectiveRole === 'SAAS_ADMIN'
                    ? 'SaaS Admin — Multi-Tenant'
                    : config.appMode === 'DOCTOR_ONLY'
                    ? 'Dokter Mandiri'
                    : effectiveRole === 'DOCTOR'
                    ? 'Role: Dokter'
                    : effectiveRole === 'NURSE'
                    ? 'Role: Perawat'
                    : effectiveRole === 'PHARMACIST'
                    ? 'Role: Farmasi'
                    : effectiveRole === 'SUPERADMIN'
                    ? 'Role: Super Admin'
                    : 'Role: Admin / Pelayanan'}
                </span>
              </div>
            )}
          </Link>

          {/* Toggle Button in Sidebar Header (Desktop) */}
          {isExpanded && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title={isCollapsed ? 'Kunci Sidebar Terbuka' : 'Perkecil Sidebar'}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Menu Area */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3 space-y-3.5 overflow-x-hidden">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && isExpanded && (
                <div className="px-2.5 pt-2 pb-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 transition-opacity duration-200">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const active = isLinkActive(item);
                const Icon = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isSubOpen = openSubmenus[item.href] ?? false;
                const isLocked = isItemLocked(item.href);
                const isUnlockedSaaS = false;

                return (
                  <div key={`${item.href}-${item.label}-${sIdx}`} className="space-y-1">
                    {/* Main Nav Item Row */}
                    {hasSubItems ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          if (isLocked) {
                            handleLockedClick(e, item.label);
                          } else {
                            toggleSubmenu(item.href, e);
                          }
                        }}
                        className={cn(
                          'group relative flex items-center rounded-xl text-xs transition-all duration-150 w-full text-left select-none',
                          isExpanded
                            ? 'justify-between px-3 py-2'
                            : 'justify-center h-10 w-10 mx-auto my-1',
                          isLocked
                            ? 'opacity-60 bg-slate-50/60 hover:bg-rose-50/60 text-slate-400 hover:text-rose-700 cursor-not-allowed border border-dashed border-slate-200'
                            : active
                            ? 'bg-emerald-50/80 text-emerald-950 font-bold border border-emerald-200/70 shadow-2xs cursor-pointer'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium cursor-pointer'
                        )}
                        title={!isExpanded ? (isLocked ? `${item.label} (Terkunci)` : item.label) : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {isLocked ? (
                            <Lock className="h-4 w-4 shrink-0 text-rose-500" />
                          ) : (
                            <Icon
                              className={cn(
                                'h-4 w-4 shrink-0 transition-colors',
                                active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'
                              )}
                            />
                          )}
                          {isExpanded && (
                            <span className={cn('truncate', isLocked && 'line-through opacity-75')}>
                              {item.label}
                            </span>
                          )}
                        </div>

                        {/* Submenu Expand Chevron & Count Badge / Locked Badge */}
                        {isExpanded && (
                          <div className="flex items-center gap-1 shrink-0">
                            {isLocked ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200 flex items-center gap-0.5">
                                <Lock className="h-2.5 w-2.5 text-rose-600" />
                                <span>Terkunci</span>
                              </span>
                            ) : (
                              <>
                                {item.badge !== undefined && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                                    {item.badge}
                                  </span>
                                )}
                                <span className="p-0.5 text-slate-400 group-hover:text-slate-700 transition-colors">
                                  {isSubOpen ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Floating Flyout Popover in Collapsed Mode */}
                        {!isExpanded && (
                          <div className="pointer-events-none absolute left-full ml-2.5 hidden rounded-xl bg-slate-900 p-2 text-[11px] font-semibold text-white shadow-xl group-hover:block z-50 whitespace-nowrap animate-in fade-in zoom-in-95 group-hover:pointer-events-auto text-left">
                            <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-200 flex items-center gap-1.5">
                              {isLocked && <Lock className="h-3 w-3 text-rose-400" />}
                              <span>{item.label}</span>
                              {isLocked && <span className="text-[9px] text-rose-400 font-normal">(Terkunci)</span>}
                            </div>
                            {!isLocked && (
                              <div className="space-y-1 pt-0.5">
                                {item.subItems!.map((sub) => {
                                  const SubIcon = sub.icon || Dot;
                                  return (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onMobileClose();
                                      }}
                                      className="flex items-center justify-between px-2 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 text-[11px] transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <SubIcon className="h-3.5 w-3.5 text-emerald-400" />
                                        <span>{sub.label}</span>
                                      </div>
                                      {sub.badge !== undefined && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-900/80 text-purple-200 font-mono font-bold">
                                          {sub.badge}
                                        </span>
                                      )}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    ) : (
                      <div
                        className={cn(
                          'group relative flex items-center rounded-xl text-xs transition-all duration-150',
                          isExpanded
                            ? 'justify-between px-3 py-2'
                            : 'justify-center h-10 w-10 mx-auto my-1',
                          isLocked
                            ? 'opacity-60 bg-slate-50/60 hover:bg-rose-50/60 text-slate-400 hover:text-rose-700 cursor-not-allowed border border-dashed border-slate-200'
                            : isUnlockedSaaS
                            ? 'bg-emerald-50 text-emerald-950 font-bold border-2 border-emerald-500 shadow-sm cursor-pointer'
                            : active
                            ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-2xs cursor-pointer'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium cursor-pointer'
                        )}
                      >
                        <Link
                          href={isLocked ? '#' : item.href}
                          onClick={(e) => {
                            if (isLocked) {
                              handleLockedClick(e, item.label);
                            } else {
                              onMobileClose();
                            }
                          }}
                          className={cn(
                            'flex items-center gap-2.5 min-w-0 flex-1',
                            isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                          )}
                          title={!isExpanded ? (isLocked ? `${item.label} (Terkunci)` : item.label) : undefined}
                        >
                          {isLocked ? (
                            <Lock className="h-4 w-4 shrink-0 text-rose-500" />
                          ) : (
                            <Icon
                              className={cn(
                                'h-4 w-4 shrink-0 transition-colors',
                                active ? 'text-emerald-600' : isUnlockedSaaS ? 'text-emerald-700' : 'text-slate-400 group-hover:text-emerald-600'
                              )}
                            />
                          )}
                          {isExpanded && (
                            <span className={cn('truncate', isLocked && 'line-through opacity-75', isUnlockedSaaS && 'text-emerald-950 font-bold')}>
                              {item.label}
                            </span>
                          )}
                        </Link>

                        {/* Locked Badge or Normal Badge or Unlocked SaaS Badge */}
                        {isLocked && isExpanded && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200 flex items-center gap-0.5 shrink-0">
                            <Lock className="h-2.5 w-2.5 text-rose-600" />
                            <span>Terkunci</span>
                          </span>
                        )}

                        {!isLocked && isUnlockedSaaS && isExpanded && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold shadow-2xs animate-pulse shrink-0">
                            Akses Terbuka
                          </span>
                        )}

                        {!isLocked && !isUnlockedSaaS && item.badge !== undefined && (
                          <span
                            className={cn(
                              'inline-flex items-center justify-center font-bold font-sans',
                              isExpanded
                                ? 'px-2 py-0.5 rounded-full text-[11px]'
                                : 'absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[10px] shadow-xs',
                              active
                                ? 'bg-emerald-700 text-white'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Floating Flyout Popover in Collapsed Mode */}
                        {!isExpanded && (
                          <div className="pointer-events-none absolute left-full ml-2.5 hidden rounded-xl bg-slate-900 p-2 text-[11px] font-semibold text-white shadow-xl group-hover:block z-50 whitespace-nowrap animate-in fade-in zoom-in-95 group-hover:pointer-events-auto">
                            <div className="font-bold text-slate-200 flex items-center gap-1.5">
                              {isLocked && <Lock className="h-3 w-3 text-rose-400" />}
                              <span>{item.label}</span>
                              {isLocked && <span className="text-rose-400 text-[10px]">(Terkunci)</span>}
                              {item.badge && <span className="text-slate-400">({item.badge})</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expanded Submenu Items List */}
                    {hasSubItems && isExpanded && isSubOpen && (
                      <div className="ml-4 pl-3 border-l-2 border-emerald-100 space-y-0.5 py-1 animate-in slide-in-from-top-1 fade-in duration-150">
                        {item.subItems!.map((sub) => {
                          const SubIcon = sub.icon || Dot;
                          const subActive = isSubItemActive(sub);
                          const subLocked = isItemLocked(sub.href);

                          return (
                            <Link
                              key={sub.href}
                              href={subLocked ? '#' : sub.href}
                              onClick={(e) => {
                                if (subLocked) {
                                  handleLockedClick(e, sub.label);
                                } else {
                                  onMobileClose();
                                }
                              }}
                              className={cn(
                                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                                subLocked
                                  ? 'opacity-60 text-slate-400 hover:text-rose-600 hover:bg-rose-50/40 cursor-not-allowed'
                                  : 'cursor-pointer',
                                subActive
                                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                              )}
                            >
                              {subLocked ? (
                                <Lock className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                              ) : (
                                <SubIcon
                                  className={cn(
                                    'h-3.5 w-3.5 shrink-0',
                                    subActive ? 'text-emerald-600' : 'text-slate-400'
                                  )}
                                />
                              )}
                              <span className={cn('truncate flex-1', subLocked && 'line-through opacity-75')}>
                                {sub.label}
                              </span>
                              {sub.badge !== undefined && !subLocked && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono font-bold shrink-0">
                                  {sub.badge}
                                </span>
                              )}
                              {subLocked && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-rose-100 text-rose-700 font-bold shrink-0">
                                  Kunci
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Profile Footer (Clean, elegant, non-dark) */}
        <div className="shrink-0 p-2.5 border-t border-slate-100 bg-white">
          <div
            className={cn(
              'flex items-center rounded-xl bg-slate-50 border border-slate-200/80 transition-all group',
              isExpanded ? 'justify-between p-2' : 'justify-center h-10 w-10 mx-auto'
            )}
          >
            <Link
              href="/settings"
              title={!isExpanded ? (currentUser?.name || config.doctorName) : undefined}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            >
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border ${
                effectiveRole === 'SAAS_ADMIN'
                  ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}>
                {effectiveRole === 'DOCTOR'
                  ? 'DR'
                  : effectiveRole === 'NURSE'
                  ? 'NS'
                  : effectiveRole === 'PHARMACIST'
                  ? 'AP'
                  : effectiveRole === 'SUPERADMIN'
                  ? 'SA'
                  : effectiveRole === 'SAAS_ADMIN'
                  ? 'SP'
                  : 'AD'}
              </div>

              {isExpanded && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                    {currentUser?.name || (effectiveRole === 'DOCTOR' ? config.doctorName : effectiveRole === 'SAAS_ADMIN' ? 'Penyedia Sistem RME' : 'Petugas Front Office')}
                  </span>
                  <span className="truncate text-[10px] text-slate-400 font-medium">
                    {effectiveRole === 'DOCTOR'
                      ? 'Dokter Pemeriksa'
                      : effectiveRole === 'NURSE'
                      ? 'Perawat / Triase'
                      : effectiveRole === 'PHARMACIST'
                      ? 'Apoteker / Farmasi'
                      : effectiveRole === 'SUPERADMIN'
                      ? 'Super Admin / Eksekutif'
                      : effectiveRole === 'SAAS_ADMIN'
                      ? 'Penyedia Sistem RME'
                      : 'Pelayanan Pasien & Kasir'}
                  </span>
                </div>
              )}
            </Link>

            {isExpanded && (
              <button
                onClick={() => {
                  logout();
                  toast.success('Berhasil keluar dari akun.');
                  router.push('/login');
                }}
                title="Keluar (Logout)"
                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
