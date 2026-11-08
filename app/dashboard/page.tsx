'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { AdminDashboard } from '@/components/dashboard/roles/admin-dashboard';
import { DoctorDashboard } from '@/components/dashboard/roles/doctor-dashboard';
import { NurseDashboard } from '@/components/dashboard/roles/nurse-dashboard';
import { PharmacistDashboard } from '@/components/dashboard/roles/pharmacist-dashboard';
import { SuperadminDashboard } from '@/components/dashboard/roles/superadmin-dashboard';
import { SaasAdminDashboard } from '@/components/dashboard/roles/saas-admin-dashboard';
import { Role } from '@/types/rme';

export default function DashboardPage() {
  const { config, currentUser } = useRME();

  // Active role resolves from authenticated currentUser or practice config
  const activeRole: Role = (currentUser?.role as Role) || config.currentRole || 'ADMIN';

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Dynamic Role Dashboard Content based on authenticated user role */}
        {activeRole === 'DOCTOR' && <DoctorDashboard />}
        {activeRole === 'ADMIN' && <AdminDashboard />}
        {activeRole === 'NURSE' && <NurseDashboard />}
        {activeRole === 'PHARMACIST' && <PharmacistDashboard />}
        {activeRole === 'SUPERADMIN' && <SuperadminDashboard />}
        {activeRole === 'SAAS_ADMIN' && <SaasAdminDashboard />}
      </div>
    </MainLayout>
  );
}
