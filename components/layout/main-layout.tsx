'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';
import { ClinicalChatBot } from '@/components/ai/clinical-chat-bot';
import { TrialReminderBanner } from '@/components/trial/trial-reminder-banner';
import { TrialExpiredLockView } from '@/components/trial/trial-expired-lock-view';
import { TrialModal } from '@/components/trial/trial-modal';
import { useRME } from '@/context/rme-context';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated,
    isLoaded,
    isTrialExpired,
    currentUser,
    refreshPatients,
    refreshVisits,
    refreshMedications,
    refreshDoctors,
  } = useRME();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-fetch backend endpoints automatically on route change (SPA navigation)
  useEffect(() => {
    if (!pathname || !isAuthenticated) return;

    if (pathname === '/patients' || pathname.startsWith('/patients/')) {
      refreshPatients();
    } else if (pathname === '/queue' || pathname === '/dashboard') {
      refreshVisits();
      refreshPatients();
    } else if (pathname === '/medications') {
      refreshMedications();
    } else if (pathname.startsWith('/settings/doctors')) {
      refreshDoctors();
    }
  }, [pathname, isAuthenticated, refreshPatients, refreshVisits, refreshMedications, refreshDoctors]);

  // Auth Guard: If not authenticated and context has loaded, redirect to /login
  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoaded, isAuthenticated, router]);

  // Load collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rme_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rme_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Clean, bright, anti-glare loading screen
  if (!isLoaded || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-600">Memuat Sesi RME...</span>
        </div>
      </div>
    );
  }

  // Determine if current route is a locked clinical/service menu when trial expires
  const isSuperAdmin = currentUser?.role === 'SAAS_ADMIN' || currentUser?.email?.toLowerCase() === 'provider@rme.id';
  const isSubscriptionRoute = pathname?.startsWith('/saas/plans') || pathname?.startsWith('/saas/billing');
  const isServiceRouteLocked = isTrialExpired && !isSuperAdmin && !isSubscriptionRoute;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Sidebar Navigation */}
      <AppSidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 transition-all duration-200">
        <AppHeader
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
          onToggleCollapse={toggleCollapse}
          isCollapsed={isCollapsed}
        />

        {/* Global Trial Reminder Banner */}
        <TrialReminderBanner />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          {isServiceRouteLocked ? <TrialExpiredLockView /> : children}
        </main>
      </div>

      {/* Floating Live AI Chat Bot in Bottom Right Corner */}
      <ClinicalChatBot />

      {/* Global Trial License Modal */}
      <TrialModal />
    </div>
  );
}
