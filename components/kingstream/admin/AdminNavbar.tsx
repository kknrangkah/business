'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CrownIcon } from '@/components/kingstream/icons/CrownIcon';
import { ExternalLink, LogOut, ShieldCheck, User } from 'lucide-react';
import { clearAdminSession, AdminUser } from '@/lib/kingstream-storage';
import { toast } from 'sonner';

interface AdminNavbarProps {
  user: AdminUser | null;
}

export function AdminNavbar({ user }: AdminNavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari Admin Dashboard?')) {
      clearAdminSession();
      toast.success('Berhasil logout dari sistem');
      router.push('/admin/login');
    }
  };

  return (
    <header className="bg-[#130A24] border-b border-[#2b1848] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6b21a8] to-[#9333ea] flex items-center justify-center text-white shadow-md shadow-purple-950/60">
              <CrownIcon className="w-5 h-5 text-white" />
            </div>

            <div className="flex items-baseline">
              <span className="text-white font-bold text-xl">King</span>
              <span className="text-[#c084fc] font-bold text-xl">Stream</span>
              <span className="ml-2.5 text-[11px] font-bold uppercase bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full border border-purple-700/50">
                Dashboard Admin
              </span>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* View Website Button */}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 px-3 py-1.5 rounded-xl transition cursor-pointer"
              title="Buka Website KingStream di Tab Baru"
            >
              <span>Lihat Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
            </Link>

            {/* Admin Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#1c0f38] border border-purple-900/40 rounded-xl text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-medium text-white">{user?.username || 'Admin'}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 px-3 py-1.5 rounded-xl transition cursor-pointer"
              title="Keluar dari Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

