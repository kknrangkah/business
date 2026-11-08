'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/kingstream/admin/AdminNavbar';
import { AdminOverview } from '@/components/kingstream/admin/AdminOverview';
import { AdminVideoManager } from '@/components/kingstream/admin/AdminVideoManager';
import { AdminAdsManager } from '@/components/kingstream/admin/AdminAdsManager';
import { AdminTelegramManager } from '@/components/kingstream/admin/AdminTelegramManager';
import { KingStreamProvider } from '@/components/kingstream/KingStreamContext';
import { getAdminSession, AdminUser } from '@/lib/kingstream-storage';
import { LayoutDashboard, Film, Megaphone, Send } from 'lucide-react';

type AdminTab = 'overview' | 'video' | 'ads' | 'telegram';

function AdminDashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      router.replace('/admin/login');
    } else {
      setUser(session);
      setIsCheckingAuth(false);
    }
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0D061A] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Memeriksa autentikasi admin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D061A] text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white font-sans antialiased">
      {/* Admin Navbar */}
      <AdminNavbar user={user} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-purple-900/30 pb-4 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/60'
                : 'text-slate-400 hover:text-white hover:bg-[#130A24]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Ringkasan</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'video'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/60'
                : 'text-slate-400 hover:text-white hover:bg-[#130A24]'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Kelola & Upload Video</span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'ads'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/60'
                : 'text-slate-400 hover:text-white hover:bg-[#130A24]'
            }`}
          >
            <Megaphone className="w-4 h-4 text-emerald-400" />
            <span>Kelola Iklan & Link Promo</span>
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'telegram'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/60'
                : 'text-slate-400 hover:text-white hover:bg-[#130A24]'
            }`}
          >
            <Send className="w-4 h-4 text-sky-400" />
            <span>Channel Telegram</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        {activeTab === 'overview' && (
          <AdminOverview onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'video' && <AdminVideoManager />}

        {activeTab === 'ads' && <AdminAdsManager />}

        {activeTab === 'telegram' && <AdminTelegramManager />}
      </main>

      {/* Admin Footer */}
      <footer className="w-full border-t border-purple-950/30 py-4 text-center text-xs text-slate-500">
        KingStream Admin Control System © 2026. Seluruh hak cipta dilindungi.
      </footer>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <KingStreamProvider>
      <AdminDashboardContent />
    </KingStreamProvider>
  );
}

