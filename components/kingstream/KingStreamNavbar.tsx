'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CrownIcon } from './icons/CrownIcon';
import { Menu, X } from 'lucide-react';

export const NAV_ITEMS = [
  'Home',
  'Indo Viral',
  'Trending',
  'Eksklusif',
  'Terbaru',
  'Populer',
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

interface KingStreamNavbarProps {
  activeTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
}

export function KingStreamNavbar({ activeTab, onSelectTab }: KingStreamNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-[#0D061A]/95 backdrop-blur-md sticky top-0 z-40 border-b border-purple-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link
            href="/"
            onClick={() => onSelectTab('Home')}
            className="flex items-center gap-3 group select-none transition-transform active:scale-98"
          >
            {/* Purple Circle Crown Badge */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6b21a8] to-[#9333ea] flex items-center justify-center text-white shadow-md shadow-purple-950/50 group-hover:from-[#7e22ce] group-hover:to-[#a855f7] transition-all">
              <CrownIcon className="w-5 h-5 text-white drop-shadow" />
            </div>

            {/* Brand Title: King (White) Stream (Purple) */}
            <div className="flex items-baseline font-bold text-xl sm:text-2xl tracking-tight">
              <span className="text-white">King</span>
              <span className="text-[#c084fc] drop-shadow-[0_0_12px_rgba(192,132,252,0.35)]">Stream</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item;
              return (
                <button
                  key={item}
                  onClick={() => onSelectTab(item)}
                  className={`text-sm transition-all duration-150 py-1.5 cursor-pointer relative ${
                    isActive
                      ? 'text-[#c084fc] font-semibold drop-shadow-[0_0_8px_rgba(192,132,252,0.3)]'
                      : 'text-slate-300 hover:text-white font-normal'
                  }`}
                >
                  {item}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c084fc] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#130A24] border-b border-[#281745] px-4 pt-2 pb-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item;
            return (
              <button
                key={item}
                onClick={() => {
                  onSelectTab(item);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-purple-900/30 text-[#c084fc] font-semibold border-l-2 border-[#c084fc]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

