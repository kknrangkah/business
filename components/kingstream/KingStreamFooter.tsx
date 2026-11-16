'use client';

import React from 'react';

export function KingStreamFooter() {
  return (
    <footer className="w-full mt-auto border-t border-purple-950/20 py-6 text-center">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <img
            src="/images/kingstream-logo.png"
            alt="KingStream 18+"
            className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
          />
          <span className="font-bold text-sm tracking-tight">
            <span className="text-white">King</span>
            <span className="text-[#c084fc]">Stream</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 font-normal tracking-wide">
          © 2026 KingStream. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
