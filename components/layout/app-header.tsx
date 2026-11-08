'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Shield,
  Stethoscope,
  ChevronDown,
  RotateCcw,
  User,
  Check,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  ChevronRight,
  Zap,
  Building2,
} from 'lucide-react';
import { useRME } from '@/context/rme-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PatientFormModal } from '@/components/patients/patient-form-modal';
import { Role } from '@/types/rme';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AppHeaderProps {
  onToggleMobile: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

export function AppHeader({ onToggleMobile, onToggleCollapse, isCollapsed }: AppHeaderProps) {
  const router = useRouter();
  const {
    config,
    currentUser,
    users,
    logout,
    theme,
    toggleTheme,
    setAppMode,
    setCurrentRole,
    tenants,
    activeTenant,
    switchTenant,
  } = useRME();

  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModeChange = (mode: 'DOCTOR_ONLY' | 'DOCTOR_AND_ADMIN') => {
    setIsMenuDropdownOpen(false);
    toast.success(
      mode === 'DOCTOR_ONLY'
        ? 'Mode: Dokter Saja Aktif'
        : 'Mode: Dokter + Admin Aktif'
    );
  };

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    setIsMenuDropdownOpen(false);
    toast.info(`Beralih ke Role: ${role}`);
  };

  const handleLogout = () => {
    setIsMenuDropdownOpen(false);
    logout();
    toast.success('Anda telah berhasil keluar.');
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md lg:px-6">
        {/* Left: Sidebar Toggle Button (Mobile & Desktop) & Practice Info */}
        <div className="flex items-center gap-2.5">
          {/* Mobile Sidebar Trigger */}
          <button
            onClick={onToggleMobile}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
            aria-label="Toggle Mobile Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop Sidebar Collapse/Expand Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            title={isCollapsed ? 'Tampilkan Sidebar Penuh' : 'Sembunyikan / Perkecil Sidebar'}
            aria-label="Toggle Sidebar Collapse"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4 text-slate-600" />
            ) : (
              <PanelLeftClose className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {/* Active Tenant Switcher Dropdown */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setShowTenantDropdown(!showTenantDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs transition-all cursor-pointer shadow-2xs group"
              title="Klik untuk beralih faskes / tenant aktif"
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-slate-900 truncate max-w-[150px] md:max-w-[210px]">
                  {activeTenant?.name || config.practiceName}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {activeTenant?.planId || 'pro'}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 group-hover:text-slate-600 transition-transform" />
            </button>

            {showTenantDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTenantDropdown(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Beralih Faskes / Tenant
                    </span>
                    <Link
                      href="/saas/tenants"
                      onClick={() => setShowTenantDropdown(false)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline"
                    >
                      Kelola Faskes →
                    </Link>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {tenants.map((t) => {
                      const isCurrent = t.id === activeTenant?.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            switchTenant(t.id);
                            setShowTenantDropdown(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-50/90 text-emerald-950 font-bold border border-emerald-200'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="truncate font-bold text-xs">{t.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {t.faskesCode} • {t.city}
                            </div>
                          </div>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>



        {/* Right: Sleek User Profile & Role Selector */}
        <div className="flex items-center gap-2">


          {/* Mode & Role Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
              className="flex items-center gap-1.5 h-8.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer"
            >
              {config.currentRole === 'DOCTOR' ? (
                <Stethoscope className="h-4 w-4 text-emerald-700" />
              ) : (
                <Shield className="h-4 w-4 text-emerald-700" />
              )}
              <span className="hidden md:inline font-bold">
                {currentUser?.name
                  ? currentUser.name.split(',')[0]
                  : config.appMode === 'DOCTOR_ONLY'
                    ? 'Mode: Dokter Saja'
                    : `Role: ${config.currentRole === 'DOCTOR' ? 'Dokter' : 'Admin'}`}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {/* Dropdown Menu */}
            {isMenuDropdownOpen && (
              <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl animate-in fade-in zoom-in-95 text-xs space-y-2.5">
                {/* Active User Card */}
                {currentUser && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Akun Aktif
                      </span>
                      <Badge variant="outline" className={`text-[9px] bg-white ${currentUser.role === 'SAAS_ADMIN' ? 'border-indigo-200 text-indigo-700' : ''}`}>
                        {currentUser.role === 'DOCTOR'
                          ? 'Dokter'
                          : currentUser.role === 'NURSE'
                          ? 'Perawat'
                          : currentUser.role === 'PHARMACIST'
                          ? 'Apoteker'
                          : currentUser.role === 'SUPERADMIN'
                          ? 'Super Admin'
                          : currentUser.role === 'SAAS_ADMIN'
                          ? '🌐 Penyedia Sistem RME'
                          : 'Admin / Kasir'}
                      </Badge>
                    </div>
                    <div className="font-bold text-slate-900 truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {currentUser.email}
                    </div>
                    {currentUser.sip && (
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {currentUser.sip}
                      </div>
                    )}
                  </div>
                )}

                {/* Skenario Mode Switch */}
                <div className="pt-1.5 border-t border-slate-100">
                  <div className="px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Skenario Aplikasi
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => handleModeChange('DOCTOR_ONLY')}
                      className={`flex w-full items-center justify-between px-2 py-1.5 rounded-md transition-colors ${config.appMode === 'DOCTOR_ONLY'
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <span>Mode 1: Dokter Saja</span>
                      {config.appMode === 'DOCTOR_ONLY' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                    </button>
                    <button
                      onClick={() => handleModeChange('DOCTOR_AND_ADMIN')}
                      className={`flex w-full items-center justify-between px-2 py-1.5 rounded-md transition-colors ${config.appMode === 'DOCTOR_AND_ADMIN'
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <span>Mode 2: Dokter + Admin</span>
                      {config.appMode === 'DOCTOR_AND_ADMIN' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                    </button>
                  </div>
                </div>

                {/* Account Settings & Logout Actions */}
                <div className="pt-1.5 border-t border-slate-100 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsMenuDropdownOpen(false);
                      router.push('/settings/account');
                    }}
                    className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span>Pengaturan Akun</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md text-rose-600 hover:bg-rose-50 font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 text-rose-500" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>


        </div>
      </header>

      {/* Patient Registration Modal */}
      <PatientFormModal
        open={isPatientModalOpen}
        onOpenChange={setIsPatientModalOpen}
        onSuccess={(newPat) => {
          toast.success(`Pasien ${newPat.name} (${newPat.noRM}) berhasil didaftarkan!`);
        }}
      />
    </>
  );
}
