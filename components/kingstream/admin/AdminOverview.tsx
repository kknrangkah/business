'use client';

import React from 'react';
import Link from 'next/link';
import {
  Film,
  Eye,
  Megaphone,
  Send,
  Plus,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useKingStream } from '../KingStreamContext';
import { formatViews, formatTimeAgo } from '@/lib/kingstream-storage';

interface AdminOverviewProps {
  onNavigateTab: (tab: 'video' | 'ads' | 'telegram') => void;
}

export function AdminOverview({ onNavigateTab }: AdminOverviewProps) {
  const { videos, adConfig, telegramConfig } = useKingStream();

  const totalViews = videos.reduce((acc, curr) => acc + (curr.views || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950/60 via-[#190c33] to-[#120824] border border-purple-800/40 rounded-2xl p-6 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-900/50 px-3 py-1 rounded-full mb-3 border border-purple-700/40">
            Pusat Kontrol KingStream 2026
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Selamat Datang di Panel Admin KingStream
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Kelola katalog video streaming, atur banner promosi & link iklan sponsor, serta pantau performa tayangan konten secara real-time.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => onNavigateTab('video')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-950 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Video Baru</span>
            </button>

            <button
              onClick={() => onNavigateTab('ads')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-purple-300 hover:text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-emerald-400" />
              <span>Ganti Link Iklan Banner</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D061A] hover:bg-[#150a28] border border-purple-900/40 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition cursor-pointer"
            >
              <span>Lihat Landing Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Videos */}
        <div className="bg-[#130A24] border border-[#2b1848] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Video</span>
            <h3 className="text-2xl font-black text-white mt-1">{videos.length}</h3>
            <span className="text-[11px] text-purple-400 mt-1 inline-block">
              {videos.length === 0 ? 'Belum ada video' : 'Tayang di homepage'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400">
            <Film className="w-6 h-6" />
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-[#130A24] border border-[#2b1848] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Tayangan</span>
            <h3 className="text-2xl font-black text-white mt-1">{formatViews(totalViews)}</h3>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>Real-time tracker</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* Status Iklan Banner */}
        <div className="bg-[#130A24] border border-[#2b1848] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Banner Promo Iklan</span>
            <h3 className="text-lg font-black text-white mt-1">
              {adConfig.isActive ? (
                <span className="text-emerald-400">Aktif</span>
              ) : (
                <span className="text-rose-400">Nonaktif</span>
              )}
            </h3>
            <span className="text-[11px] text-slate-400 mt-1 line-clamp-1 max-w-[140px]" title={adConfig.targetUrl}>
              Link: {adConfig.targetUrl || 'Default'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400">
            <Megaphone className="w-6 h-6" />
          </div>
        </div>

        {/* Channel Telegram */}
        <div className="bg-[#130A24] border border-[#2b1848] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Telegram Channel</span>
            <h3 className="text-sm font-bold text-white mt-1 line-clamp-1">
              {telegramConfig.channelHandle || '@KingStream'}
            </h3>
            <span className="text-[11px] text-sky-400 mt-1 inline-block">
              Widget kanan bawah
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-950/40 border border-sky-800/40 flex items-center justify-center text-sky-400">
            <Send className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Videos (2 Cols) */}
        <div className="lg:col-span-2 bg-[#130A24] border border-[#2b1848] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              <span>Video Terbaru di Website</span>
            </h3>
            <button
              onClick={() => onNavigateTab('video')}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Kelola Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {videos.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-purple-900/40 rounded-xl">
              Belum ada video diupload. Klik tombol &quot;Upload Video Baru&quot; di atas.
            </div>
          ) : (
            <div className="divide-y divide-purple-900/20">
              {videos.slice(0, 5).map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-14 h-9 rounded-md object-cover bg-black/60 shrink-0 border border-purple-900/40"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white line-clamp-1">{v.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="text-purple-300 font-medium">{v.category}</span>
                        <span>•</span>
                        <span>{v.duration}</span>
                        <span>•</span>
                        <span>{formatViews(v.views)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {formatTimeAgo(v.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ad Target Summary (1 Col) */}
        <div className="bg-[#130A24] border border-[#2b1848] rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-3">
              <Megaphone className="w-4 h-4 text-emerald-400" />
              <span>Iklan Banner Terpasang</span>
            </h3>

            <div className="p-3.5 bg-[#0D061A] rounded-xl border border-purple-900/40 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Judul:</span>
                <span className="font-bold text-white">{adConfig.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sub-judul:</span>
                <span className="text-slate-200">{adConfig.subtitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Teks Tombol:</span>
                <span className="text-rose-400 font-semibold">{adConfig.buttonText}</span>
              </div>
              <div className="pt-2 border-t border-purple-900/30">
                <span className="text-[11px] text-slate-400 block mb-1">Target Link Pengunjung:</span>
                <span className="font-mono text-purple-300 text-[11px] break-all block bg-purple-950/40 p-1.5 rounded">
                  {adConfig.targetUrl || '(Belum diset)'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ads')}
            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-950 cursor-pointer"
          >
            Ubah Pengaturan Link Iklan
          </button>
        </div>
      </div>
    </div>
  );
}

