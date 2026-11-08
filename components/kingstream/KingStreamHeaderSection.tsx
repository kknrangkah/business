'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface KingStreamHeaderSectionProps {
  itemsPerPage: number;
  onItemsPerPageChange: (val: number) => void;
  categoryTitle?: string;
}

export function KingStreamHeaderSection({
  itemsPerPage,
  onItemsPerPageChange,
  categoryTitle,
}: KingStreamHeaderSectionProps) {
  const options = [8, 12, 16, 24, 32];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 mb-4">
      {/* Title & Description */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {categoryTitle && categoryTitle !== 'Home'
            ? `KingStream - Video ${categoryTitle} 2026`
            : 'KingStream - Nonton Video Terbaru 2026'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          KingStream adalah situs streaming video viral, koleksi terbaru, dan video terupdate setiap hari
        </p>
      </div>

      {/* Tampilkan Dropdown Filter */}
      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
        <label htmlFor="items-per-page" className="text-xs sm:text-sm text-slate-400">
          Tampilkan:
        </label>
        <div className="relative">
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="appearance-none bg-[#0D061A] border border-[#2b1848] text-slate-200 text-xs sm:text-sm rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer transition shadow-sm"
          >
            {options.map((opt) => (
              <option key={opt} value={opt} className="bg-[#130A24] text-slate-200">
                {opt} Video / Halaman
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

