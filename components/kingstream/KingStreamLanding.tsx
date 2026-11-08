'use client';

import React, { useState } from 'react';
import { KingStreamNavbar, NavItem } from './KingStreamNavbar';
import { KingStreamSearchBar } from './KingStreamSearchBar';
import { KingStreamPromoBanner } from './KingStreamPromoBanner';
import { KingStreamHeaderSection } from './KingStreamHeaderSection';
import { KingStreamVideoArea } from './KingStreamVideoArea';
import { KingStreamFloatingButton } from './KingStreamFloatingButton';
import { KingStreamFooter } from './KingStreamFooter';
import { KingStreamProvider } from './KingStreamContext';

function KingStreamContent() {
  const [activeTab, setActiveTab] = useState<NavItem>('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectTab = (tab: NavItem) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#0D061A] text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white font-sans antialiased">
      {/* 1. Header / Navbar */}
      <KingStreamNavbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-12 flex flex-col">
        {/* 2. Full-Width Search Bar */}
        <KingStreamSearchBar
          onSearch={handleSearch}
          defaultValue={searchQuery}
        />

        {/* 3. Centered Promo Banner with Emerald Glow & Configurable Target Ad Link */}
        <KingStreamPromoBanner />

        {/* 4. Section Title & 'Tampilkan' Dropdown */}
        <KingStreamHeaderSection
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          categoryTitle={activeTab}
        />

        {/* 5. Video Area (Real-time storage: displays videos when uploaded, empty state when 0) */}
        <div className="flex-1 flex flex-col justify-center">
          <KingStreamVideoArea
            activeCategory={activeTab}
            searchQuery={searchQuery}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </main>

      {/* 6. Floating Bottom-Right Telegram Channel Widget */}
      <KingStreamFloatingButton />

      {/* 7. Footer */}
      <KingStreamFooter />
    </div>
  );
}

export function KingStreamLanding() {
  return (
    <KingStreamProvider>
      <KingStreamContent />
    </KingStreamProvider>
  );
}

export default KingStreamLanding;
