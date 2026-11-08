'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminSession } from '@/lib/kingstream-storage';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/admin/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0D061A] flex items-center justify-center text-slate-300">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Mengarahkan ke Admin Portal...</span>
      </div>
    </div>
  );
}

