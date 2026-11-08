'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { User, UserRole, UserStatus, RolePermission, SidebarMenuKey } from '@/types/rme';
import { SIDEBAR_MENU_DEFINITIONS, DEFAULT_ROLE_PERMISSIONS } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Plus,
  Edit2,
  Trash2,
  Search,
  KeyRound,
  Stethoscope,
  Building2,
  HeartPulse,
  Pill,
  Crown,
  Sparkles,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  Phone,
  FileBadge,
  Save,
  RotateCcw,
  LogOut,
  LayoutDashboard,
  CalendarPlus,
  Clock,
  FileText,
  CreditCard,
  BarChart3,
  Settings as SettingsIcon,
  Info,
  Eye,
  EyeOff,
  Key,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchBackendAllPermissions,
  updateBackendRolePermissions,
  fetchBackendRoles,
  fetchBackendUsers,
  createBackendUser,
  updateBackendUser,
  assignBackendUserRoles,
  deleteBackendUser,
  changeBackendUserPassword,
  BackendRoleItem,
  ROLE_NAME_TO_BACKEND_MAP,
} from '@/lib/api-client';


function convertPermissionsToNames(p: RolePermission['permissions']): string[] {
  const names: string[] = [];
  if (p.medicalRecords?.view) names.push('view_medical_record');
  if (p.medicalRecords?.create) names.push('create_medical_record');
  if (p.medicalRecords?.edit) names.push('edit_medical_record');
  if (p.medicalRecords?.delete) names.push('delete_medical_record');

  if (p.queue?.view) names.push('view_visit');
  if (p.queue?.register) names.push('create_visit');
  if (p.queue?.call) names.push('update_visit_status');

  if (p.billing?.view) names.push('view_billing');
  if (p.billing?.process) names.push('process_payment');
  if (p.billing?.discount) names.push('give_discount');
  if (p.billing?.receipt) names.push('create_billing');

  if (p.pharmacy?.view) names.push('view_medication');
  if (p.pharmacy?.createEdit) names.push('create_medication', 'edit_medication');
  if (p.pharmacy?.restock) names.push('stock_opname');
  if (p.pharmacy?.delete) names.push('delete_medication');

  if (p.procedures?.view) names.push('view_procedure');
  if (p.procedures?.createEdit) names.push('create_procedure', 'edit_procedure');
  if (p.procedures?.delete) names.push('delete_procedure');

  if (p.reports?.viewClinical) names.push('view_clinical_report');
  if (p.reports?.viewFinancial) names.push('view_financial_report');
  if (p.reports?.export) names.push('export_report');

  if (p.settings?.view) names.push('view_settings');
  if (p.settings?.editClinic) names.push('edit_settings');
  if (p.settings?.manageUsers) names.push('manage_users', 'view_user', 'add_user', 'edit_user');

  names.push('view_patient', 'create_patient', 'edit_patient');
  return names;
}

export default function SettingsUsersPage() {
  const router = useRouter();
  const {
    currentUser,
    users,
    refreshUsers,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    rolePermissions,
    updateRolePermissions,
    updateRoleSidebarMenus,
    resetRolePermissionsToDefault,
    logout,
  } = useRME();

  // Active Sub-Tab: 'USERS' | 'ROLES' | 'ACCOUNT'
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES' | 'ACCOUNT'>('USERS');

  // Backend Integration States
  const [backendRoles, setBackendRoles] = useState<BackendRoleItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  // Sync users & roles from backend on mount
  React.useEffect(() => {
    let isMounted = true;
    setIsSyncing(true);
    Promise.allSettled([
      refreshUsers(),
      fetchBackendRoles().then((res) => {
        if (isMounted && res.success && res.data) {
          setBackendRoles(res.data);
        }
      }),
    ]).finally(() => {
      if (isMounted) setIsSyncing(false);
    });
    return () => {
      isMounted = false;
    };
  }, [refreshUsers]);

  const getBackendRoleId = (appRole: UserRole): string | undefined => {
    const norm = appRole.toUpperCase();
    let searchName = 'admin tenant';
    if (norm === 'DOCTOR') searchName = 'dokter';
    else if (norm === 'NURSE') searchName = 'perawat';
    else if (norm === 'PHARMACIST') searchName = 'apoteker';
    else if (norm === 'SUPERADMIN') searchName = 'superadmin';
    else if (norm === 'ADMIN') searchName = 'admin tenant';

    const found =
      backendRoles.find((r) => r.name.toLowerCase() === searchName.toLowerCase()) ||
      backendRoles.find((r) => r.name.toLowerCase() === (ROLE_NAME_TO_BACKEND_MAP[norm] || '').toLowerCase()) ||
      backendRoles.find((r) => r.name.toLowerCase() === 'admin');

    return found?.id;
  };

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Form State for User Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DOCTOR' as UserRole,
    appMode: 'DOCTOR_AND_ADMIN' as 'DOCTOR_ONLY' | 'DOCTOR_AND_ADMIN',
    title: '',
    sip: '',
    ihsId: '',
    phone: '',
    status: 'ACTIVE' as UserStatus,
    customSidebarMenus: {} as Partial<Record<SidebarMenuKey, boolean>>,
  });

  // Modal Step & Visual Controls
  const [formStep, setFormStep] = useState<'IDENTITY' | 'ROLE_ACCESS' | 'MENUS'>('IDENTITY');
  const [showPassword, setShowPassword] = useState(false);
  const [useCustomSidebarMenus, setUseCustomSidebarMenus] = useState(false);

  const getDefaultTitleForRole = (role: UserRole) => {
    switch (role) {
      case 'DOCTOR':
        return 'Dokter Pemeriksa';
      case 'ADMIN':
        return 'Admin Kasir & Front Office';
      case 'NURSE':
        return 'Perawat / Asisten Medis';
      case 'PHARMACIST':
        return 'Apoteker Farmasi';
      case 'SUPERADMIN':
        return 'Super Admin / Pemilik';
      default:
        return 'Staf Faskes';
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pwd = 'Klinik';
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += '!2026';
    setFormData((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
    toast.info('Kata sandi acak berhasil dibuat.');
  };

  const getActiveMenusForFormData = () => {
    const role = formData.role;
    const roleConfig = editablePerms.find((r) => r.roleId === role)?.sidebarMenus;
    return SIDEBAR_MENU_DEFINITIONS.filter((m) => {
      if (m.key === 'saas') return false;
      if (useCustomSidebarMenus) {
        return formData.customSidebarMenus[m.key] !== undefined
          ? Boolean(formData.customSidebarMenus[m.key])
          : Boolean(roleConfig?.[m.key]);
      }
      return Boolean(roleConfig?.[m.key]);
    });
  };

  const getMenuIcon = (key: SidebarMenuKey) => {
    switch (key) {
      case 'dashboard':
        return LayoutDashboard;
      case 'registration':
        return CalendarPlus;
      case 'queue':
        return Clock;
      case 'patients':
        return Users;
      case 'medicalRecord':
        return FileText;
      case 'billing':
        return CreditCard;
      case 'medications':
        return Pill;
      case 'reports':
        return BarChart3;
      case 'settings':
        return SettingsIcon;
      case 'saas':
        return Sparkles;
      default:
        return Shield;
    }
  };

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Local Editable Role Permissions State
  const [editablePerms, setEditablePerms] = useState<RolePermission[]>(rolePermissions);

  // Synchronize with context rolePermissions
  React.useEffect(() => {
    setEditablePerms(rolePermissions);
  }, [rolePermissions]);

  // Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status !== 'INACTIVE').length;
    const inactive = total - active;
    const doctors = users.filter((u) => u.role === 'DOCTOR').length;
    const staff = total - doctors;
    return { total, active, inactive, doctors, staff };
  }, [users]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.sip && u.sip.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        u.title.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.status !== 'INACTIVE') ||
        (statusFilter === 'INACTIVE' && u.status === 'INACTIVE');

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Role Badge Helper
  const getRoleBadge = (role: UserRole | string) => {
    switch (role) {
      case 'DOCTOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Stethoscope className="h-3 w-3" />
            <span>Dokter Pemeriksa</span>
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Building2 className="h-3 w-3" />
            <span>Admin Kasir</span>
          </span>
        );
      case 'NURSE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
            <HeartPulse className="h-3 w-3" />
            <span>Perawat / Medis</span>
          </span>
        );
      case 'PHARMACIST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <Pill className="h-3 w-3" />
            <span>Apoteker Farmasi</span>
          </span>
        );
      case 'SUPERADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Crown className="h-3 w-3" />
            <span>Super Admin</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            {role}
          </span>
        );
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormStep('IDENTITY');
    setShowPassword(false);
    setUseCustomSidebarMenus(false);
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      role: 'DOCTOR',
      appMode: 'DOCTOR_AND_ADMIN',
      title: 'Dokter Klinik',
      sip: '',
      ihsId: '',
      phone: '',
      status: 'ACTIVE',
      customSidebarMenus: {},
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setFormStep('IDENTITY');
    setShowPassword(false);
    const hasCustom = Boolean(u.customSidebarMenus && Object.keys(u.customSidebarMenus).length > 0);
    setUseCustomSidebarMenus(hasCustom);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: (u.role as UserRole) || 'DOCTOR',
      appMode: u.appMode || 'DOCTOR_AND_ADMIN',
      title: u.title || '',
      sip: u.sip || '',
      ihsId: u.ihsId || '',
      phone: u.phone || '',
      status: u.status || 'ACTIVE',
      customSidebarMenus: u.customSidebarMenus || {},
    });
    setIsFormModalOpen(true);
  };

  // Submit User Save with Backend Integration
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nama lengkap pengguna wajib diisi!');
      setFormStep('IDENTITY');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Alamat email login wajib diisi!');
      setFormStep('IDENTITY');
      return;
    }

    const finalCustomMenus = useCustomSidebarMenus ? formData.customSidebarMenus : undefined;
    const targetRoleId = getBackendRoleId(formData.role);

    setIsSavingUser(true);
    try {
      if (editingUser) {
        // 1. Update user fields
        const updatePayload: { email?: string; password?: string; name?: string; phone?: string } = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || undefined,
        };
        if (formData.password.trim()) {
          updatePayload.password = formData.password.trim();
        }

        const updateRes = await updateBackendUser(editingUser.id, updatePayload);
        if (!updateRes.success) {
          toast.error(updateRes.error || 'Gagal memperbarui data pengguna di backend.');
          setIsSavingUser(false);
          return;
        }

        // 2. Assign role if target role id resolved
        if (targetRoleId) {
          await assignBackendUserRoles(editingUser.id, [targetRoleId]);
        }

        // 3. Update context state & refresh
        updateUser(editingUser.id, {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          roleId: targetRoleId,
          appMode: formData.appMode,
          title: formData.title.trim() || getDefaultTitleForRole(formData.role),
          sip: formData.sip.trim() || undefined,
          ihsId: formData.ihsId.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          status: formData.status,
          customSidebarMenus: finalCustomMenus,
        });

        await refreshUsers();
        toast.success(`Data pengguna ${formData.name} berhasil diperbarui di server backend!`);
      } else {
        // Create user in backend
        if (!formData.password.trim()) {
          toast.error('Kata sandi pengguna baru wajib diisi!');
          setFormStep('IDENTITY');
          setIsSavingUser(false);
          return;
        }

        const createRes = await createBackendUser({
          email: formData.email.trim().toLowerCase(),
          password: formData.password.trim(),
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          roles: targetRoleId ? [targetRoleId] : undefined,
        });

        if (!createRes.success) {
          toast.error(createRes.error || 'Gagal menambahkan pengguna baru ke backend.');
          setIsSavingUser(false);
          return;
        }

        const createdData = createRes.data;
        addUser({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          roleId: targetRoleId,
          appMode: formData.appMode,
          title: formData.title.trim() || getDefaultTitleForRole(formData.role),
          sip: formData.sip.trim() || undefined,
          ihsId: formData.ihsId.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          status: formData.status,
          customSidebarMenus: finalCustomMenus,
          ...(createdData?.id ? { id: createdData.id } : {}),
        });

        await refreshUsers();
        toast.success(`Pengguna baru ${formData.name} berhasil ditambahkan ke database backend!`);
      }

      setIsFormModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat menyimpan data pengguna.');
    } finally {
      setIsSavingUser(false);
    }
  };

  // Submit Delete with Backend Integration
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (currentUser?.id === deleteTarget.id) {
      toast.error('Anda tidak dapat menghapus akun yang sedang aktif digunakan!');
      return;
    }

    setIsDeletingUser(true);
    try {
      const delRes = await deleteBackendUser(deleteTarget.id);
      if (!delRes.success) {
        toast.error(delRes.error || 'Gagal menghapus pengguna dari server backend.');
        setIsDeletingUser(false);
        return;
      }

      deleteUser(deleteTarget.id);
      await refreshUsers();
      toast.success(`Pengguna ${deleteTarget.name} telah dihapus dari sistem.`);
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat menghapus pengguna.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Toggle Permission Checkbox
  const handleTogglePermission = (
    roleId: UserRole,
    moduleKey: keyof RolePermission['permissions'],
    permAction: string
  ) => {
    setEditablePerms((prev) =>
      prev.map((role) => {
        if (role.roleId === roleId) {
          const currentModule = role.permissions[moduleKey] as Record<string, boolean>;
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [moduleKey]: {
                ...currentModule,
                [permAction]: !currentModule[permAction],
              },
            },
          };
        }
        return role;
      })
    );
  };

  // Toggle Sidebar Menu Checkbox for a Role
  const handleToggleSidebarMenu = (roleId: UserRole, menuKey: SidebarMenuKey) => {
    setEditablePerms((prev) =>
      prev.map((role) => {
        if (role.roleId === roleId) {
          const currentMenus = (role.sidebarMenus || {}) as Record<SidebarMenuKey, boolean>;
          return {
            ...role,
            sidebarMenus: {
              ...currentMenus,
              [menuKey]: !currentMenus[menuKey],
            },
          };
        }
        return role;
      })
    );
  };

  // Save Role Permissions Matrix & Sidebar Menus with Dynamic Backend Sync
  const handleSavePermissions = async () => {
    setIsSavingPerms(true);
    editablePerms.forEach((rp) => {
      updateRolePermissions(rp.roleId, rp.permissions);
      if (rp.sidebarMenus) {
        updateRoleSidebarMenus(rp.roleId, rp.sidebarMenus);
      }
    });

    try {
      const res = await fetchBackendAllPermissions();
      if (res.success && Array.isArray(res.data)) {
        const allPerms = res.data;
        const permsMap = new Map<string, string>();
        allPerms.forEach((p: any) => permsMap.set(p.name, p.id));

        // Dynamically update permissions for all backend roles
        let rolesToUpdate = backendRoles;
        if (rolesToUpdate.length === 0) {
          const rRes = await fetchBackendRoles();
          if (rRes.success && rRes.data) rolesToUpdate = rRes.data;
        }

        const updatePromises = rolesToUpdate.map(async (bRole) => {
          const rName = bRole.name.toLowerCase();
          let matchedAppRole: UserRole = 'ADMIN';
          if (rName.includes('dokter') || rName === 'doctor') matchedAppRole = 'DOCTOR';
          else if (rName.includes('perawat') || rName === 'nurse') matchedAppRole = 'NURSE';
          else if (rName.includes('apotek') || rName === 'pharmacist') matchedAppRole = 'PHARMACIST';
          else if (rName === 'superadmin' || rName === 'saas_admin') matchedAppRole = 'SUPERADMIN';

          const roleDef = editablePerms.find((p) => p.roleId === matchedAppRole);
          if (roleDef) {
            const names = convertPermissionsToNames(roleDef.permissions);
            const ids = names.map((n) => permsMap.get(n)).filter(Boolean) as string[];
            return updateBackendRolePermissions(bRole.id, ids);
          }
        });

        await Promise.allSettled(updatePromises);
      }
      toast.success('Matriks hak akses dan visibilitas menu sidebar peran berhasil disimpan ke sistem & database backend!');
    } catch (err: any) {
      console.warn('[handleSavePermissions] Error:', err);
      toast.error('Gagal menyimpan matriks hak akses ke server backend.');
    } finally {
      setIsSavingPerms(false);
    }
  };

  // Reset Role Permissions & Sidebar Menus to Defaults
  const handleResetToDefault = () => {
    resetRolePermissionsToDefault();
    setEditablePerms(DEFAULT_ROLE_PERMISSIONS);
    toast.info('Pengaturan peran dan menu sidebar telah dikembalikan ke standar bawaan sistem.');
  };

  // Password Change Submission with Backend Integration
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.newPassword) {
      toast.error('Kata sandi baru tidak boleh kosong!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter!');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok!');
      return;
    }

    setIsSavingPassword(true);
    try {
      if (passwordForm.currentPassword) {
        const res = await changeBackendUserPassword(
          passwordForm.currentPassword,
          passwordForm.newPassword
        );
        if (!res.success) {
          toast.error(res.error || 'Gagal memperbarui kata sandi. Pastikan kata sandi saat ini benar.');
          setIsSavingPassword(false);
          return;
        }
      } else if (currentUser?.id) {
        const res = await updateBackendUser(currentUser.id, {
          password: passwordForm.newPassword,
        });
        if (!res.success) {
          toast.error(res.error || 'Gagal memperbarui kata sandi.');
          setIsSavingPassword(false);
          return;
        }
      }

      if (currentUser) {
        updateUser(currentUser.id, { password: passwordForm.newPassword });
      }
      toast.success('Kata sandi Anda berhasil diperbarui di server backend!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengganti kata sandi.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar dari sesi akun.');
    router.push('/login');
  };

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Manajemen Pengguna, Peran & Hak Akses (RBAC)
              </h1>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              Kelola daftar akun staf faskes, matriks izin modul rekam medis, dan keamanan hak akses pengguna.
            </p>
          </div>

          {activeTab === 'USERS' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSyncing(true);
                  refreshUsers()
                    .then(() => toast.success('Data pengguna berhasil disinkronkan dari server backend.'))
                    .catch(() => toast.error('Gagal menyinkronkan data pengguna.'))
                    .finally(() => setIsSyncing(false));
                }}
                disabled={isSyncing}
                className="h-9 gap-1.5 text-xs font-semibold rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-emerald-700' : 'text-slate-600'}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
              </Button>
              <Button
                onClick={handleOpenCreateModal}
                size="sm"
                className="h-9 gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Pengguna Baru</span>
              </Button>
            </div>
          )}
        </div>

        {/* Sub-Navigation Tabs within User Management */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'USERS'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Daftar Pengguna ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ROLES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ROLES'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Matriks Hak Akses (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveTab('ACCOUNT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ACCOUNT'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Akun Saya & Keamanan</span>
          </button>
        </div>

        {/* TAB 1: DAFTAR PENGGUNA (USER MANAGEMENT) */}
        {activeTab === 'USERS' && (
          <div className="space-y-4">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl">
                <p className="text-[11px] font-bold text-slate-500">Total Pengguna</p>
                <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.total}</div>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Terdaftar di sistem</p>
              </Card>
              <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl">
                <p className="text-[11px] font-bold text-slate-500">Pengguna Aktif</p>
                <div className="text-2xl font-black text-emerald-700 mt-0.5">{metrics.active}</div>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Dapat login & beroperasi</p>
              </Card>
              <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl">
                <p className="text-[11px] font-bold text-slate-500">Dokter Terdaftar</p>
                <div className="text-2xl font-black text-teal-700 mt-0.5">{metrics.doctors}</div>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Memiliki nomor SIP</p>
              </Card>
              <Card className="p-4 border border-slate-200 bg-white shadow-xs rounded-2xl">
                <p className="text-[11px] font-bold text-slate-500">Staf & Asisten</p>
                <div className="text-2xl font-black text-blue-700 mt-0.5">{metrics.staff}</div>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Admin, Perawat & Apoteker</p>
              </Card>
            </div>

            {/* Filter & Search Bar */}
            <Card className="p-3.5 border border-slate-200 bg-white shadow-xs rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari nama, email, SIP, no HP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800"
                >
                  <option value="ALL">Semua Peran (Role)</option>
                  <option value="DOCTOR">Dokter Pemeriksa</option>
                  <option value="ADMIN">Admin Kasir</option>
                  <option value="NURSE">Perawat / Medis</option>
                  <option value="PHARMACIST">Apoteker Farmasi</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="ACTIVE">Status Aktif</option>
                  <option value="INACTIVE">Status Nonaktif</option>
                </select>
              </div>
            </Card>

            {/* Users Table */}
            <Card className="border border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-700 text-white border-b border-emerald-800 shadow-2xs font-bold uppercase tracking-wider text-[10px] select-none">
                    <tr>
                      <th className="py-3 px-4 text-white">Pengguna / Nama Lengkap</th>
                      <th className="py-3 px-4 text-white">Peran (Role)</th>
                      <th className="py-3 px-4 text-white">Email & Kontak</th>
                      <th className="py-3 px-4 text-white">Identitas Medis (SIP / IHS)</th>
                      <th className="py-3 px-4 text-center text-white">Status</th>
                      <th className="py-3 px-4 text-right text-white">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isSyncing && filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                            <span className="font-semibold text-xs text-slate-600">
                              Memuat dan menyinkronkan data pengguna dari backend...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          Tidak ada data pengguna yang cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isCurrent = currentUser?.id === u.id;
                        const isActive = u.status !== 'INACTIVE';

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Name & Title */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center justify-center font-bold text-sm shrink-0">
                                  {u.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 text-sm truncate">
                                      {u.name}
                                    </span>
                                    {isCurrent && (
                                      <span className="text-[9px] font-bold bg-emerald-700 text-white px-1.5 py-0.2 rounded-md">
                                        Anda
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-medium text-slate-500 truncate">
                                    {u.title || 'Staf Praktik'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role Badge */}
                            <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                            {/* Email & Phone */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-800 flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-slate-400" />
                                  <span>{u.email}</span>
                                </div>
                                {u.phone && (
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-slate-400" />
                                    <span>{u.phone}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* SIP & IHS ID */}
                            <td className="py-3.5 px-4">
                              {u.sip ? (
                                <div className="space-y-0.5">
                                  <div className="font-mono text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                                    {u.sip}
                                  </div>
                                  {u.ihsId && (
                                    <div className="text-[10px] font-mono text-slate-500">
                                      IHS: {u.ihsId}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">-</span>
                              )}
                            </td>

                            {/* Status Pill & Switch */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => toggleUserStatus(u.id)}
                                title="Klik untuk mengubah status aktif/nonaktif"
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                                  isActive
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                {isActive ? (
                                  <>
                                    <UserCheck className="h-3 w-3 text-emerald-700" />
                                    <span>Aktif</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-3 w-3 text-slate-500" />
                                    <span>Nonaktif</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(u)}
                                  title="Edit Pengguna"
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget(u);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  title="Hapus Pengguna"
                                  disabled={isCurrent}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isCurrent
                                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer'
                                  }`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: MATRIKS HAK AKSES PERAN (ROLE & PERMISSION MATRIX) */}
        {activeTab === 'ROLES' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-700" />
                  Konfigurasi Hak Akses Modul & Visibilitas Menu Sidebar (RBAC)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tentukan wewenang spesifik setiap peran serta menu bilah sisi (sidebar) yang tampil pada akun pengguna masing-masing peran.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={handleResetToDefault}
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-xs font-semibold rounded-xl cursor-pointer border-slate-300 hover:bg-slate-100"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-600" />
                  <span>Reset Default</span>
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  size="sm"
                  disabled={isSavingPerms}
                  className="h-9 gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {isSavingPerms ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Simpan Perubahan Hak Akses</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Role Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {editablePerms.map((rp) => (
                <Card key={rp.roleId} className="p-3.5 border border-slate-200 bg-white shadow-xs rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rp.badgeColor}`}>
                      {rp.roleName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {users.filter((u) => u.role === rp.roleId).length} User
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-snug">
                    {rp.description}
                  </p>
                </Card>
              ))}
            </div>

            {/* SECTION 1: MATRIKS VISIBILITAS MENU BILAH SISI (SIDEBAR) */}
            <Card className="border border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden">
              <div className="p-4 bg-linear-to-r from-slate-50 via-emerald-50/30 to-blue-50/20 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      1. Visibilitas Menu Bilah Sisi (Sidebar) Peran
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Live Sidebar Sync
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilih menu sidebar yang diizinkan untuk setiap peran. Misalnya: berikan centang <strong>Antrian Pasien</strong> pada peran <strong>Dokter</strong> agar dokter dapat langsung mengakses antrian pasien dari bilah sisi.
                    </p>
                  </div>
                </div>

                {/* Quick Helper Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditablePerms((prev) =>
                        prev.map((rp) => {
                          if (rp.roleId === 'DOCTOR') {
                            const cur = rp.sidebarMenus?.queue ?? true;
                            return {
                              ...rp,
                              sidebarMenus: {
                                ...(rp.sidebarMenus || ({} as Record<SidebarMenuKey, boolean>)),
                                queue: !cur,
                              },
                            };
                          }
                          return rp;
                        })
                      );
                      const isNowEnabled = !editablePerms.find((r) => r.roleId === 'DOCTOR')?.sidebarMenus?.queue;
                      toast.info(`Menu Antrian Pasien untuk Dokter diubah ke: ${isNowEnabled ? 'AKTIF' : 'NONAKTIF'}. Klik Simpan untuk menerapkan.`);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-emerald-300 rounded-xl font-bold text-xs text-emerald-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Toggle Antrian Pasien (Dokter)</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 text-slate-700 border-b border-slate-200 uppercase tracking-wider text-[10px] font-bold select-none">
                    <tr>
                      <th className="py-3 px-4 w-80 text-slate-800">Menu Bilah Sisi (Sidebar)</th>
                      {editablePerms.map((rp) => (
                        <th key={rp.roleId} className="py-3 px-4 text-center text-slate-800 font-bold min-w-[120px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs">{rp.roleName}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${rp.badgeColor}`}>
                              {rp.roleId}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SIDEBAR_MENU_DEFINITIONS.map((menu) => {
                      const MenuIcon = getMenuIcon(menu.key);
                      const isSaas = menu.key === 'saas';
                      const isQueue = menu.key === 'queue';
                      return (
                        <tr
                          key={menu.key}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isQueue ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                                isQueue
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                <MenuIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs">{menu.label}</span>
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {menu.href}
                                  </span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                    menu.category === 'Pelayanan'
                                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                                      : menu.category === 'Klinis'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : menu.category === 'Administrasi'
                                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}>
                                    {menu.category}
                                  </span>
                                  {isQueue && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                      Direkomendasikan Dokter
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                  {menu.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          {editablePerms.map((rp) => {
                            const isChecked = rp.sidebarMenus ? Boolean(rp.sidebarMenus[menu.key]) : false;
                            return (
                              <td key={rp.roleId} className="py-3 px-4 text-center">
                                {isSaas ? (
                                  <span className="text-[10px] text-slate-400 italic">
                                    Khusus SaaS Admin
                                  </span>
                                ) : (
                                  <label className="inline-flex items-center justify-center cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleSidebarMenu(rp.roleId, menu.key)}
                                      className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                                    />
                                  </label>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* SECTION 2: MATRIKS HAK AKSES TINDAKAN MODUL & DATA (CRUD) */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-slate-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. Matriks Hak Akses Tindakan Data (CRUD)
                </h4>
              </div>
            </div>

            {/* Permission Matrix Table */}
            <Card className="border border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-700 text-white border-b border-emerald-800 shadow-2xs font-bold uppercase tracking-wider text-[10px] select-none">
                    <tr>
                      <th className="py-3 px-4 w-64 text-white">Modul & Tindakan Sistem</th>
                      {editablePerms.map((rp) => (
                        <th key={rp.roleId} className="py-3 px-4 text-center text-white">
                          {rp.roleName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* SECTION: REKAM MEDIS */}
                    <tr className="bg-emerald-50/30">
                      <td colSpan={6} className="py-2 px-4 font-bold text-emerald-950 text-xs">
                        📋 1. Modul Pelayanan & Rekam Medis (SOAP, ICD-10 & Resep)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Melihat Riwayat Rekam Medis Pasien
                      </td>
                      {editablePerms.map((rp) => (
                        <td key={rp.roleId} className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={rp.permissions.medicalRecords.view}
                            onChange={() => handleTogglePermission(rp.roleId, 'medicalRecords', 'view')}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Input SOAP, Anamnesis, Diagnosis & Tindakan
                      </td>
                      {editablePerms.map((rp) => (
                        <td key={rp.roleId} className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={rp.permissions.medicalRecords.create}
                            onChange={() => handleTogglePermission(rp.roleId, 'medicalRecords', 'create')}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Mengedit Rekam Medis yang Telah Selesai
                      </td>
                      {editablePerms.map((rp) => (
                        <td key={rp.roleId} className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={rp.permissions.medicalRecords.edit}
                            onChange={() => handleTogglePermission(rp.roleId, 'medicalRecords', 'edit')}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>

                    {/* SECTION: PENDAFTARAN & ANTRIAN */}
                    <tr className="bg-blue-50/30">
                      <td colSpan={6} className="py-2 px-4 font-bold text-blue-950 text-xs">
                        ⏰ 2. Modul Pendaftaran & Antrian Pasien
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Registrasi Pasien Baru & Kunjungan
                      </td>
                      {editablePerms.map((rp) => (
                        <td key={rp.roleId} className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={rp.permissions.queue.register}
                            onChange={() => handleTogglePermission(rp.roleId, 'queue', 'register')}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Memanggil Nomor Antrian Pasien
                      </td>
                      {editablePerms.map((rp) => (
                        <td key={rp.roleId} className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={rp.permissions.queue.call}
                            onChange={() => handleTogglePermission(rp.roleId, 'queue', 'call')}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>

                    {/* SECTION: KASIR & BILLING */}
                    <tr className="bg-purple-50/30">
                      <td colSpan={6} className="py-2 px-4 font-bold text-purple-950 text-xs">
                        💳 3. Modul Kasir, Pembayaran & Billing
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Memproses Pembayaran (Tunai, QRIS, Transfer)
                      </td>
                      {editablePerms.map((rp) => (
                        <td key={rp.roleId} className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={rp.permissions.billing.process}
                            onChange={() => handleTogglePermission(rp.roleId, 'billing', 'process')}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Memberikan Diskon Tagihan Khusus
                      </td>
                      {editablePerms.map((rp) => (
                        <td key={rp.roleId} className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={rp.permissions.billing.discount}
                            onChange={() => handleTogglePermission(rp.roleId, 'billing', 'discount')}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>

                    {/* SECTION: FARMASI & OBAT */}
                    <tr className="bg-teal-50/30">
                      <td colSpan={6} className="py-2 px-4 font-bold text-teal-950 text-xs">
                        💊 4. Modul Farmasi & Master Obat
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Kelola Formularium Obat & Tarif Satuan
                      </td>
                      {editablePerms.map((rp) => (
                        <td key={rp.roleId} className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={rp.permissions.pharmacy.createEdit}
                            onChange={() => handleTogglePermission(rp.roleId, 'pharmacy', 'createEdit')}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Restock Cepat Stok Obat Farmasi
                      </td>
                      {editablePerms.map((rp) => (
                        <td key={rp.roleId} className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={rp.permissions.pharmacy.restock}
                            onChange={() => handleTogglePermission(rp.roleId, 'pharmacy', 'restock')}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>

                    {/* SECTION: PENGATURAN & USER MANAGEMENT */}
                    <tr className="bg-amber-50/30">
                      <td colSpan={6} className="py-2 px-4 font-bold text-amber-950 text-xs">
                        ⚙️ 5. Modul Pengaturan & Manajemen Pengguna (RBAC)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Mengubah Profil Faskes & SIP
                      </td>
                      {editablePerms.map((rp) => (
                        <td key={rp.roleId} className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={rp.permissions.settings.editClinic}
                            onChange={() => handleTogglePermission(rp.roleId, 'settings', 'editClinic')}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Menambah, Mengedit & Mengelola User Akun
                      </td>
                      {editablePerms.map((rp) => (
                        <td key={rp.roleId} className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={rp.permissions.settings.manageUsers}
                            onChange={() => handleTogglePermission(rp.roleId, 'settings', 'manageUsers')}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: AKUN SAYA & KEAMANAN */}
        {activeTab === 'ACCOUNT' && (
          <div className="max-w-4xl space-y-6">
            {/* Active User Card Profile */}
            <Card className="p-6 border border-slate-200 bg-white shadow-xs rounded-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-xl font-bold shadow-xs">
                    {currentUser?.name.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{currentUser?.name}</h2>
                      {getRoleBadge(currentUser?.role || 'DOCTOR')}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{currentUser?.email}</p>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs gap-1.5 rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar Akun</span>
                </Button>
              </div>

              {/* Account Details Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Nama Faskes / Klinik
                  </span>
                  <p className="font-bold text-slate-900">
                    {currentUser?.clinicName || 'Klinik Pratama'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Nomor Surat Izin Praktik (SIP)
                  </span>
                  <p className="font-mono font-bold text-slate-900">
                    {currentUser?.sip || 'SIP Terverifikasi Kemenkes'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Nomor Kontak Telepon
                  </span>
                  <p className="font-bold text-slate-900">
                    {currentUser?.phone || '0812-3456-7890'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Sesi Login Terakhir
                  </span>
                  <p className="font-bold text-emerald-800">
                    Aktif saat ini (Terotentikasi)
                  </p>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">Perbarui Kata Sandi</h3>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Kata Sandi Saat Ini</label>
                    <Input
                      type="password"
                      placeholder="Masukkan kata sandi lama/saat ini"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      className="h-9 text-xs rounded-xl"
                    />
                    <p className="text-[10px] text-slate-400">
                      Wajib diisi jika mengubah sandi sendiri untuk verifikasi keamanan.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Kata Sandi Baru *</label>
                    <Input
                      type="password"
                      placeholder="Masukkan kata sandi baru (min. 6 karakter)"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      className="h-9 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Konfirmasi Kata Sandi Baru *
                    </label>
                    <Input
                      type="password"
                      placeholder="Ketik ulang kata sandi baru"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      className="h-9 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingPassword}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer gap-1.5"
                  >
                    {isSavingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Simpan Kata Sandi Baru</span>
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* MODAL: TAMBAH / EDIT PENGGUNA (Revamped User-Friendly Form) */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 my-4">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 text-white flex items-center justify-center shadow-xs">
                  {editingUser ? <Edit2 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {editingUser ? 'Edit Data Pengguna & Hak Akses' : 'Tambah Pengguna Baru'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white border border-white/30 hidden sm:inline-block">
                      {editingUser ? 'Perbarui Profil' : 'Staf / Tenaga Medis'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/90 mt-0.5">
                    Konfigurasi data profil, peran faskes, kredensial medis, dan hak akses menu bilah sisi (sidebar)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="bg-slate-50/90 border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center justify-between gap-1 overflow-x-auto shrink-0 select-none">
              <div className="flex items-center gap-1 sm:gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setFormStep('IDENTITY')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    formStep === 'IDENTITY'
                      ? 'bg-white text-emerald-800 shadow-xs border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    formStep === 'IDENTITY' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    1
                  </span>
                  <KeyRound className="h-3.5 w-3.5 hidden sm:inline-block" />
                  <span>Identitas & Login</span>
                </button>

                <div className="h-4 w-px bg-slate-200 shrink-0" />

                <button
                  type="button"
                  onClick={() => setFormStep('ROLE_ACCESS')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    formStep === 'ROLE_ACCESS'
                      ? 'bg-white text-emerald-800 shadow-xs border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    formStep === 'ROLE_ACCESS' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    2
                  </span>
                  <Stethoscope className="h-3.5 w-3.5 hidden sm:inline-block" />
                  <span>Peran & Kredensial Medis</span>
                </button>

                <div className="h-4 w-px bg-slate-200 shrink-0" />

                <button
                  type="button"
                  onClick={() => setFormStep('MENUS')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    formStep === 'MENUS'
                      ? 'bg-white text-emerald-800 shadow-xs border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    formStep === 'MENUS' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    3
                  </span>
                  <LayoutDashboard className="h-3.5 w-3.5 hidden sm:inline-block" />
                  <span>Menu Sidebar</span>
                  {useCustomSidebarMenus && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Menu dikustomisasi" />
                  )}
                </button>
              </div>
            </div>

            {/* Modal Body: 2 Columns */}
            <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Form Fields according to formStep */}
                <div className="lg:col-span-8 space-y-4">
                  {/* STEP 1: IDENTITAS & AKSES LOGIN */}
                  {formStep === 'IDENTITY' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5">
                        <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div className="text-xs text-slate-700 leading-relaxed">
                          Masukkan nama lengkap staf dengan gelar resmi, alamat email faskes untuk masuk ke sistem, dan kata sandi login.
                        </div>
                      </div>

                      {/* Nama Lengkap */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                          <span>Nama Lengkap & Gelar Resmi <span className="text-red-500">*</span></span>
                          <span className="text-[10px] font-normal text-slate-400">Wajib diisi</span>
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g. dr. Amanda Pratama, Sp.KK / Ns. Ratna Dewi, S.Kep"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="h-10 text-xs rounded-xl border-slate-300 focus:border-emerald-600 focus:ring-emerald-600"
                          required
                        />
                      </div>

                      {/* Email & Password */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                            <span>Email Login <span className="text-red-500">*</span></span>
                            <span className="text-[10px] font-normal text-slate-400">Username masuk</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                              type="email"
                              placeholder="nama@klinik.id"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="h-10 pl-9 text-xs rounded-xl border-slate-300 focus:border-emerald-600 focus:ring-emerald-600"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800">
                              <span>Kata Sandi (Password) {!editingUser && <span className="text-red-500">*</span>}</span>
                            </label>
                            <button
                              type="button"
                              onClick={generateRandomPassword}
                              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Key className="h-2.5 w-2.5" />
                              <span>Buat Otomatis</span>
                            </button>
                          </div>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder={editingUser ? 'Biarkan kosong jika tidak diubah' : 'Min. 6 karakter'}
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              className="h-10 pr-9 text-xs rounded-xl border-slate-300 focus:border-emerald-600 focus:ring-emerald-600 font-mono"
                              required={!editingUser}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                              title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Phone & Status */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-800">Nomor WhatsApp / HP</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                              type="text"
                              placeholder="0812-3456-7890"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="h-10 pl-9 text-xs rounded-xl border-slate-300 focus:border-emerald-600 focus:ring-emerald-600"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-800">Status Akun Sistem</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, status: 'ACTIVE' })}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                                formData.status === 'ACTIVE'
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                              <span className="text-xs">Aktif (Dapat Login)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, status: 'INACTIVE' })}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                                formData.status === 'INACTIVE'
                                  ? 'bg-red-50 border-red-400 text-red-900 font-bold shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className="h-2.5 w-2.5 rounded-full bg-red-400 shrink-0" />
                              <span className="text-xs">Dibekukan</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: PERAN & KREDENSIAL MEDIS */}
                  {formStep === 'ROLE_ACCESS' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Interactive Visual Role Cards */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                          <span>Pilih Peran Akun Faskes (Role) <span className="text-red-500">*</span></span>
                          <span className="text-[10px] text-slate-500">Klik salah satu kartu peran di bawah</span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            {
                              role: 'DOCTOR' as UserRole,
                              title: 'Dokter Pemeriksa',
                              desc: 'Pemeriksaan klinis SOAP, diagnosis ICD-10, resep & antrian poli',
                              icon: Stethoscope,
                              badge: 'Klinis & Medis',
                              color: 'emerald',
                            },
                            {
                              role: 'ADMIN' as UserRole,
                              title: 'Admin Kasir & FO',
                              desc: 'Pendaftaran loket, antrian pasien, kasir & kwitansi pembayaran',
                              icon: Building2,
                              badge: 'Pelayanan & Kasir',
                              color: 'blue',
                            },
                            {
                              role: 'NURSE' as UserRole,
                              title: 'Perawat & Medis',
                              desc: 'Triase vital signs (TTV), pemanggilan antrian & tindakan perawat',
                              icon: HeartPulse,
                              badge: 'Keperawatan',
                              color: 'teal',
                            },
                            {
                              role: 'PHARMACIST' as UserRole,
                              title: 'Apoteker / Farmasis',
                              desc: 'Peracikan e-resep, inventaris obat, stock opname & formularium',
                              icon: Pill,
                              badge: 'Farmasi & Apotek',
                              color: 'purple',
                            },
                            {
                              role: 'SUPERADMIN' as UserRole,
                              title: 'Super Admin Faskes',
                              desc: 'Hak akses tingkat tertinggi, audit trail & manajemen faskes penuh',
                              icon: Crown,
                              badge: 'Pemilik / Root',
                              color: 'amber',
                            },
                          ].map((item) => {
                            const isSelected = formData.role === item.role;
                            const RoleIcon = item.icon;
                            return (
                              <button
                                key={item.role}
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    role: item.role,
                                    title: formData.title ? formData.title : getDefaultTitleForRole(item.role),
                                  });
                                }}
                                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                                  isSelected
                                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                                }`}
                              >
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSelected
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  <RoleIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 pr-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-900">{item.title}</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                      {item.role}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                    {item.desc}
                                  </p>
                                </div>
                                {isSelected && (
                                  <div className="absolute right-2.5 top-2.5 h-5 w-5 rounded-full bg-emerald-700 text-white flex items-center justify-center">
                                    <Check className="h-3 w-3" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Jabatan / Title with Suggestions */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800">
                            Jabatan / Keterangan Spesialisasi
                          </label>
                          <span className="text-[10px] text-slate-400">Pilih rekomendasi di bawah</span>
                        </div>
                        <Input
                          type="text"
                          placeholder="e.g. Dokter Umum / Kepala Bagian Farmasi / Kasir Front Office"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="h-10 text-xs rounded-xl border-slate-300 focus:border-emerald-600 focus:ring-emerald-600"
                        />
                        {/* Quick Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {(formData.role === 'DOCTOR'
                            ? ['Dokter Umum', 'Dokter Spesialis Anak', 'Dokter Spesialis Penyakit Dalam', 'Dokter Gigi']
                            : formData.role === 'ADMIN'
                            ? ['Admin Kasir Front Office', 'Petugas Pendaftaran & Loket', 'Kepala Rekam Medis']
                            : formData.role === 'NURSE'
                            ? ['Perawat Poliklinik', 'Bidan KIA & Imunisasi', 'Perawat Triase']
                            : formData.role === 'PHARMACIST'
                            ? ['Apoteker Pengelola Apotek (APA)', 'Asisten Apoteker', 'Kepala Depo Obat']
                            : ['Direktur Klinik', 'Pemilik Faskes', 'Kepala Tata Usaha']
                          ).map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => setFormData({ ...formData, title: chip })}
                              className="px-2.5 py-0.8 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-600 text-[10px] font-semibold transition-colors cursor-pointer border border-slate-200"
                            >
                              + {chip}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mode Operasional Faskes */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-bold text-slate-800">Mode Operasional Alur Kerja</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, appMode: 'DOCTOR_AND_ADMIN' })}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              formData.appMode === 'DOCTOR_AND_ADMIN'
                                ? 'bg-emerald-50 border-emerald-500 font-bold text-slate-900 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">Mode Kolaborasi (Tim Faskes)</span>
                              {formData.appMode === 'DOCTOR_AND_ADMIN' && <Check className="h-4 w-4 text-emerald-700" />}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 font-normal leading-tight">
                              Pendaftaran, antrian, ruang periksa dokter, dan kasir ditangani terpisah.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, appMode: 'DOCTOR_ONLY' })}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              formData.appMode === 'DOCTOR_ONLY'
                                ? 'bg-emerald-50 border-emerald-500 font-bold text-slate-900 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">Mode Dokter Saja (Solo Practice)</span>
                              {formData.appMode === 'DOCTOR_ONLY' && <Check className="h-4 w-4 text-emerald-700" />}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 font-normal leading-tight">
                              Klinik mandiri tanpa admin: dokter melayani pendaftaran hingga cetak kwitansi.
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Kredensial Medis Khusus (SIP & SATUSEHAT) */}
                      {(formData.role === 'DOCTOR' || formData.role === 'NURSE' || formData.role === 'PHARMACIST') && (
                        <div className="p-3.5 rounded-2xl bg-linear-to-r from-blue-50/50 to-emerald-50/40 border border-blue-200/80 space-y-3">
                          <div className="flex items-center gap-2">
                            <FileBadge className="h-4 w-4 text-blue-700" />
                            <span className="text-xs font-bold text-slate-900">
                              Kredensial Medis & Bridging SATUSEHAT Kemenkes
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Kemenkes RI
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700">Nomor SIP / SIKP / STRA</label>
                              <Input
                                type="text"
                                placeholder="e.g. SIP.503/442.1/045/Dinkes/2025"
                                value={formData.sip}
                                onChange={(e) => setFormData({ ...formData, sip: e.target.value })}
                                className="h-9 text-xs font-mono rounded-xl bg-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700">IHS Practitioner ID (SatuSehat)</label>
                              <Input
                                type="text"
                                placeholder="e.g. N10000001"
                                value={formData.ihsId}
                                onChange={(e) => setFormData({ ...formData, ihsId: e.target.value })}
                                className="h-9 text-xs font-mono rounded-xl bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 3: HAK AKSES MENU BILAH SISI (SIDEBAR) */}
                  {formStep === 'MENUS' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Mode Choice */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Sliders className="h-4 w-4 text-emerald-700" />
                          <span>Pilihan Sumber Hak Akses Menu Sidebar</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setUseCustomSidebarMenus(false)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              !useCustomSidebarMenus
                                ? 'bg-emerald-50 border-emerald-500 font-bold text-slate-900 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">1. Mengikuti Standar Peran ({formData.role})</span>
                              {!useCustomSidebarMenus && <Check className="h-4 w-4 text-emerald-700" />}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 font-normal leading-tight">
                              Menu sidebar otomatis sinkron dengan matriks hak akses peran global faskes.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setUseCustomSidebarMenus(true)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              useCustomSidebarMenus
                                ? 'bg-amber-50 border-amber-400 font-bold text-slate-900 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">2. Kustomisasi Khusus Akun Ini</span>
                              {useCustomSidebarMenus && <Check className="h-4 w-4 text-amber-700" />}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 font-normal leading-tight">
                              Pilih menu sidebar khusus staf ini (misal: tambah menu Antrian Pasien untuk dokter ini).
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Quick Action Toolbar if Custom */}
                      {useCustomSidebarMenus && (
                        <div className="flex items-center justify-between gap-2 p-2 bg-slate-100 rounded-xl text-xs">
                          <span className="text-[11px] text-slate-600 font-medium px-1">
                            Aksi Cepat Menu:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const all: Record<string, boolean> = {};
                                SIDEBAR_MENU_DEFINITIONS.filter(m => m.key !== 'saas').forEach(m => {
                                  all[m.key] = true;
                                });
                                setFormData({ ...formData, customSidebarMenus: all });
                              }}
                              className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                            >
                              Pilih Semua
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const none: Record<string, boolean> = {};
                                SIDEBAR_MENU_DEFINITIONS.filter(m => m.key !== 'saas').forEach(m => {
                                  none[m.key] = false;
                                });
                                setFormData({ ...formData, customSidebarMenus: none });
                              }}
                              className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                            >
                              Batal Semua
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const roleMenus = editablePerms.find(r => r.roleId === formData.role)?.sidebarMenus || {};
                                setFormData({ ...formData, customSidebarMenus: { ...roleMenus } });
                              }}
                              className="px-2 py-1 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Reset Sesuai Peran
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Menu Checkbox Grid */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {SIDEBAR_MENU_DEFINITIONS.filter((m) => m.key !== 'saas').map((menu) => {
                            const MenuIcon = getMenuIcon(menu.key);
                            const isQueue = menu.key === 'queue';
                            const roleDefaultChecked = Boolean(
                              editablePerms.find((r) => r.roleId === formData.role)?.sidebarMenus?.[menu.key]
                            );
                            const isChecked = useCustomSidebarMenus
                              ? formData.customSidebarMenus[menu.key] !== undefined
                                ? Boolean(formData.customSidebarMenus[menu.key])
                                : roleDefaultChecked
                              : roleDefaultChecked;

                            return (
                              <label
                                key={menu.key}
                                className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                                  useCustomSidebarMenus ? 'cursor-pointer' : 'cursor-default opacity-85'
                                } ${
                                  isChecked
                                    ? isQueue
                                      ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                                      : 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={!useCustomSidebarMenus}
                                  checked={isChecked}
                                  onChange={() => {
                                    if (!useCustomSidebarMenus) return;
                                    setFormData({
                                      ...formData,
                                      customSidebarMenus: {
                                        ...formData.customSidebarMenus,
                                        [menu.key]: !isChecked,
                                      },
                                    });
                                  }}
                                  className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 mt-0.5 cursor-pointer disabled:cursor-not-allowed"
                                />

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <MenuIcon className={`h-3.5 w-3.5 ${isChecked ? 'text-emerald-700' : 'text-slate-400'}`} />
                                    <span className="font-bold text-xs text-slate-900 truncate">
                                      {menu.label}
                                    </span>
                                    {isQueue && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                        Antrian Pasien
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                                    {menu.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Live Account Preview Card */}
                <div className="lg:col-span-4">
                  <div className="sticky top-0 p-4 rounded-2xl border border-slate-200 bg-linear-to-b from-slate-50 via-white to-slate-50 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>Pratinjau Akun Pengguna</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">Live View</span>
                    </div>

                    {/* Avatar & Identitas */}
                    <div className="text-center space-y-2 py-1">
                      <div className="relative inline-block">
                        <div className="h-16 w-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-2xl font-bold mx-auto shadow-md">
                          {formData.name.trim() ? formData.name.trim().charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                          formData.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-400'
                        }`} />
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {formData.name.trim() || 'Nama Pengguna Baru'}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium truncate">
                          {formData.title || getDefaultTitleForRole(formData.role)}
                        </p>
                      </div>

                      <div className="pt-0.5 flex justify-center">
                        {getRoleBadge(formData.role)}
                      </div>
                    </div>

                    {/* Info Contact */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-600 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{formData.email.trim() || 'email@klinik.id'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 truncate">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{formData.phone.trim() || 'Belum diisi'}</span>
                      </div>
                    </div>

                    {/* Sidebar Menus Active Summary */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <LayoutDashboard className="h-3.5 w-3.5 text-emerald-700" />
                          <span>Menu Bilah Sisi Aktif</span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          {getActiveMenusForFormData().length} Menu
                        </span>
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-white rounded-xl border border-slate-200/80 text-[11px]">
                        {getActiveMenusForFormData().map((m) => {
                          const Icon = getMenuIcon(m.key);
                          const isQueue = m.key === 'queue';
                          return (
                            <div
                              key={m.key}
                              className={`flex items-center justify-between px-2 py-1 rounded-lg ${
                                isQueue ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-700'
                              }`}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <Icon className="h-3 w-3 shrink-0 text-emerald-700" />
                                <span className="truncate">{m.label}</span>
                              </span>
                              <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                            </div>
                          );
                        })}
                      </div>

                      {formData.role === 'DOCTOR' && (
                        <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-xl text-[10px] text-amber-900 flex items-start gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            {getActiveMenusForFormData().some(m => m.key === 'queue')
                              ? 'Menu Antrian Pasien aktif: Dokter dapat memanggil antrian poli langsung dari sidebar.'
                              : 'Tips: Buka tab "Menu Sidebar" untuk menambahkan menu Antrian Pasien untuk dokter ini.'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFormModalOpen(false)}
                    className="h-10 text-xs rounded-xl cursor-pointer w-full sm:w-auto"
                  >
                    Batal
                  </Button>

                  {formStep !== 'IDENTITY' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (formStep === 'MENUS') setFormStep('ROLE_ACCESS');
                        else if (formStep === 'ROLE_ACCESS') setFormStep('IDENTITY');
                      }}
                      className="h-10 text-xs gap-1.5 rounded-xl cursor-pointer text-slate-600 hover:text-slate-900"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Sebelumnya</span>
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {formStep !== 'MENUS' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (formStep === 'IDENTITY') {
                          if (!formData.name.trim()) {
                            toast.error('Silakan isi nama lengkap pengguna terlebih dahulu.');
                            return;
                          }
                          setFormStep('ROLE_ACCESS');
                        } else if (formStep === 'ROLE_ACCESS') {
                          setFormStep('MENUS');
                        }
                      }}
                      className="h-10 text-xs gap-1.5 rounded-xl cursor-pointer font-semibold border-slate-300 hover:bg-slate-50 w-full sm:w-auto"
                    >
                      <span>Selanjutnya</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingUser}
                    className="h-10 gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer w-full sm:w-auto"
                  >
                    {isSavingUser ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Menyimpan ke Backend...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{editingUser ? 'Simpan Perubahan' : 'Tambahkan Pengguna'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </Dialog>

      {/* MODAL: KONFIRMASI HAPUS PENGGUNA */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Akun Pengguna?</h3>
                <p className="text-xs text-slate-400">Konfirmasi tindakan penghapusan</p>
              </div>
            </div>

            {deleteTarget && (
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda yakin ingin menghapus akun <strong>{deleteTarget.name}</strong> ({deleteTarget.email})? Pengguna ini tidak akan dapat login lagi ke sistem.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-xs rounded-xl cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={isDeletingUser}
                onClick={handleConfirmDelete}
                className="font-bold text-xs rounded-xl shadow-xs cursor-pointer gap-1.5"
              >
                {isDeletingUser && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Ya, Hapus Akun</span>
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </MainLayout>
  );
}
