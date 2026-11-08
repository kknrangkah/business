'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export function KingStreamFooter() {
  return (
    <footer className="w-full mt-auto border-t border-purple-950/20 py-6 text-center">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-normal">
        <p className="tracking-wide">
          © 2026 KingStream. Seluruh hak cipta dilindungi.
        </p>

        {/* Discreet Admin Login Access */}
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-purple-400 transition-colors py-1 px-2.5 rounded-lg hover:bg-purple-950/30"
          title="Masuk ke Panel Admin KingStream"
        >
          <Lock className="w-3 h-3 text-purple-400/70" />
          <span>Admin Portal</span>
        </Link>
      </div>
    </footer>
  );
}
