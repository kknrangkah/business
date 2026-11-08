'use client';

import React from 'react';
import Image from 'next/image';
import { Zap } from 'lucide-react';
import { useKingStream } from './KingStreamContext';

export function KingStreamPromoBanner() {
  const { adConfig } = useKingStream();

  // If ad is toggled off by admin, don't show it
  if (!adConfig.isActive) {
    return null;
  }

  const handleBannerClick = () => {
    if (adConfig.targetUrl) {
      if (adConfig.openInNewTab) {
        window.open(adConfig.targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = adConfig.targetUrl;
      }
    }
  };

  return (
    <div className="w-full flex justify-center my-6">
      <div
        onClick={handleBannerClick}
        className="group relative cursor-pointer border-2 border-[#10b981] rounded-2xl overflow-hidden bg-[#0c1619] shadow-[0_0_18px_rgba(16,185,129,0.3)] hover:shadow-[0_0_24px_rgba(16,185,129,0.55)] transition-all duration-300 w-full max-w-[490px] flex items-stretch select-none hover:scale-[1.01]"
        title={`Buka Iklan: ${adConfig.targetUrl || 'Promo'}`}
      >
        {/* Left Model / Banner Photo */}
        <div className="relative w-[130px] sm:w-[150px] min-h-[88px] shrink-0 bg-[#0d161a] overflow-hidden">
          <Image
            src={adConfig.imageUrl || '/images/promo-model.png'}
            alt="Promo Model KingStream"
            fill
            sizes="150px"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
            priority
            unoptimized={adConfig.imageUrl?.startsWith('data:') || adConfig.imageUrl?.startsWith('http')}
          />
          {/* Subtle inner gradient shadow on right edge of image */}
          <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-r from-transparent to-[#0c1619]" />
        </div>

        {/* Right Promotional Content */}
        <div className="flex-1 py-3 px-3 sm:px-4 flex flex-col items-center justify-center text-center bg-gradient-to-r from-[#0c1619] via-[#0f1d22] to-[#0c1619]">
          {/* Title */}
          <h3 className="text-white font-black text-sm sm:text-base tracking-wider drop-shadow-sm leading-tight">
            {adConfig.title || 'BONUS SPESIAL'}
          </h3>

          {/* Subtitle */}
          <p className="text-slate-100 font-bold text-[11px] sm:text-xs tracking-wide mt-0.5">
            {adConfig.subtitle || 'ANTI ZONK HARI INI'}
          </p>

          {/* Red Promo Button */}
          <div className="mt-1.5">
            <span className="inline-block bg-[#dc2626] group-hover:bg-[#ef4444] text-white text-[10px] sm:text-[11px] font-black px-3 py-0.5 sm:py-1 rounded uppercase tracking-wider shadow-sm shadow-red-900/50 transition-colors">
              {adConfig.buttonText || 'KLIK PROMO AKTIF'}
            </span>
          </div>

          {/* Tagline with lightning icon */}
          <div className="flex items-center justify-center gap-1 mt-1.5 text-[10px] sm:text-[11px] font-black tracking-wide text-[#10b981]">
            <Zap className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
            <span>{adConfig.tagline || 'PROMO VIP RESMI'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
