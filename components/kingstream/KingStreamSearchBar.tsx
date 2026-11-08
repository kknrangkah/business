'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface KingStreamSearchBarProps {
  onSearch: (query: string) => void;
  defaultValue?: string;
}

export function KingStreamSearchBar({ onSearch, defaultValue = '' }: KingStreamSearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-[#130A24] border border-[#2b1848] rounded-xl px-3.5 py-1.5 flex items-center shadow-lg shadow-black/20 focus-within:border-purple-600/60 focus-within:ring-1 focus-within:ring-purple-600/30 transition-all duration-200"
    >
      {/* Search Icon */}
      <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1 mr-3" />

      {/* Input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Pencarian Video..."
        className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400/90 focus:outline-none py-1.5 font-normal"
      />

      {/* Clear button if text is entered */}
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 mr-2 transition"
          title="Hapus pencarian"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Cari Button */}
      <button
        type="submit"
        className="shrink-0 bg-[#1e1338] hover:bg-[#2c1c52] border border-[#3c256e]/70 active:scale-95 text-slate-200 text-xs sm:text-sm font-medium px-5 py-2 rounded-lg transition-all duration-150 shadow-sm cursor-pointer"
      >
        Cari
      </button>
    </form>
  );
}

