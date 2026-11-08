'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Megaphone,
  Link as LinkIcon,
  ExternalLink,
  Check,
  RefreshCw,
  Zap,
  Image as ImageIcon,
  Eye,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Play,
} from 'lucide-react';
import { useKingStream } from '../KingStreamContext';
import { AdBannerConfig, DEFAULT_AD_CONFIG } from '@/lib/kingstream-storage';
import { toast } from 'sonner';

export function AdminAdsManager() {
  const { adConfig, updateAdConfig } = useKingStream();

  // Local form state
  const [formData, setFormData] = useState<AdBannerConfig>({
    ...adConfig,
  });

  const [imageMode, setImageMode] = useState<'default' | 'upload' | 'url'>(
    formData.imageUrl === '/images/promo-model.png' ? 'default' : 'url'
  );

  // File Upload for Custom Banner Model
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      toast.success('Gambar iklan berhasil dimuat!');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.targetUrl.trim()) {
      toast.error('Link iklan tujuan wajib diisi!');
      return;
    }

    updateAdConfig(formData);
    toast.success('Pengaturan iklan dan link tujuan berhasil disimpan ke landing page!');
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan pengaturan iklan ke default asli?')) {
      setFormData(DEFAULT_AD_CONFIG);
      updateAdConfig(DEFAULT_AD_CONFIG);
      setImageMode('default');
      toast.info('Pengaturan iklan telah direset ke default');
    }
  };

  const handleTestLink = () => {
    if (!formData.targetUrl) {
      toast.error('Masukkan URL iklan terlebih dahulu');
      return;
    }
    let url = formData.targetUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#130A24] border border-[#2b1848] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-400" />
            <span>Kelola Iklan & Banner Promo</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Atur link iklan sponsor/promo yang diklik oleh pengunjung pada banner landing page
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Toggle Button */}
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
            }
            className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer ${
              formData.isActive
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/50'
                : 'bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/50'
            }`}
          >
            {formData.isActive ? (
              <ToggleRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-rose-400" />
            )}
            <span>Status: {formData.isActive ? 'Iklan Aktif' : 'Iklan Nonaktif'}</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetDefault}
            className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-slate-300 hover:text-white border border-purple-800/40 transition cursor-pointer"
            title="Reset ke Default"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="bg-[#150B2A] border border-purple-800/50 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-emerald-400" />
            Pratinjau Langsung (Tampilan di Landing Page)
          </span>
          <span className="text-[11px] text-slate-400">
            {formData.isActive ? '✅ Tampil di Landing Page' : '❌ Disembunyikan'}
          </span>
        </div>

        {/* Live Promo Banner Card Component */}
        <div className="w-full flex justify-center py-4 bg-[#0D061A]/80 rounded-xl border border-purple-950/60">
          <div
            onClick={handleTestLink}
            className="group relative cursor-pointer border-2 border-[#10b981] rounded-2xl overflow-hidden bg-[#0c1619] shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all duration-300 w-full max-w-[490px] flex items-stretch select-none"
            title="Klik untuk test link tujuan"
          >
            {/* Left Model Photo */}
            <div className="relative w-[130px] sm:w-[150px] shrink-0 bg-[#0d161a] overflow-hidden">
              <Image
                src={formData.imageUrl || '/images/promo-model.png'}
                alt="Promo Model Preview"
                width={150}
                height={90}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
              <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-r from-transparent to-[#0c1619]" />
            </div>

            {/* Right Promotional Content */}
            <div className="flex-1 py-3 px-3 sm:px-4 flex flex-col items-center justify-center text-center bg-gradient-to-r from-[#0c1619] via-[#0f1d22] to-[#0c1619]">
              <h3 className="text-white font-black text-sm sm:text-base tracking-wider drop-shadow-sm leading-tight">
                {formData.title || 'BONUS SPESIAL'}
              </h3>

              <p className="text-slate-100 font-bold text-[11px] sm:text-xs tracking-wide mt-0.5">
                {formData.subtitle || 'ANTI ZONK HARI INI'}
              </p>

              <div className="mt-1.5">
                <span className="inline-block bg-[#dc2626] group-hover:bg-[#ef4444] text-white text-[10px] sm:text-[11px] font-black px-3 py-0.5 sm:py-1 rounded uppercase tracking-wider shadow-sm shadow-red-900/50 transition-colors">
                  {formData.buttonText || 'KLIK PROMO AKTIF'}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1 mt-1.5 text-[10px] sm:text-[11px] font-black tracking-wide text-[#10b981]">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                <span>{formData.tagline || 'PROMO VIP RESMI'}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-500 mt-2">
          💡 Pengunjung yang mengklik banner atau tombol di atas akan langsung diarahkan ke: <span className="text-purple-300 font-mono underline">{formData.targetUrl || '(Belum diset)'}</span>
        </p>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="bg-[#130A24] border border-[#2b1848] rounded-2xl p-6 space-y-5">
        <h3 className="font-bold text-base text-white border-b border-purple-900/30 pb-3 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-purple-400" />
          <span>Pengaturan Link & Konten Iklan</span>
        </h3>

        {/* 1. Target URL (CRITICAL FEATURE) */}
        <div className="bg-[#0D061A] border-2 border-purple-600/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-emerald-400" />
              <span>Link Iklan Tujuan (Target URL)</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                Sponsor / Promo
              </span>
            </label>
            <button
              type="button"
              onClick={handleTestLink}
              className="text-xs text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer underline"
            >
              <span>Test Buka Link</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <input
            type="text"
            value={formData.targetUrl}
            onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
            placeholder="https://t.me/KingStreamOfficial atau link website sponsor/promosi"
            className="w-full bg-[#130A24] border border-purple-700/60 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition font-mono"
            required
          />

          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.openInNewTab}
                onChange={(e) => setFormData({ ...formData, openInNewTab: e.target.checked })}
                className="rounded border-purple-800 bg-[#130A24] text-purple-600"
              />
              <span>Buka banner iklan di tab browser baru (target=&quot;_blank&quot;)</span>
            </label>
            <span className="text-[11px] text-slate-500">Mendukung link http, https, telegram, whatsapp, dll.</span>
          </div>
        </div>

        {/* Feature: Direct ke Iklan saat Play Video */}
        <div className="bg-[#0D061A] border-2 border-amber-500/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-white">Direct ke Iklan saat Klik Tombol Play Video</span>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded-full font-bold">
                Fitur Monetisasi
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.directAdOnPlay !== false}
                onChange={(e) => setFormData({ ...formData, directAdOnPlay: e.target.checked })}
                className="w-4 h-4 rounded border-amber-600 bg-[#130A24] text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-amber-300">
                {formData.directAdOnPlay !== false ? 'Aktif' : 'Nonaktif'}
              </span>
            </label>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Saat pengunjung mengklik kartu video atau tombol <strong className="text-white">Play</strong> di halaman web, sistem akan otomatis mengarahkan pengunjung ke link iklan sponsor (<span className="text-purple-300 font-mono text-[11px]">{formData.targetUrl || 'Link Target'}</span>).
          </p>

          <div className="pt-2 border-t border-purple-900/30 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="text-slate-400 font-medium">Metode Pengalihan:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="directAdMode"
                checked={formData.directAdMode !== 'same_tab'}
                onChange={() => setFormData({ ...formData, directAdMode: 'new_tab' })}
                className="text-purple-600"
              />
              <span>Buka di Tab Baru (Disarankan: Pengunjung tetap menonton video di KingStream)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="directAdMode"
                checked={formData.directAdMode === 'same_tab'}
                onChange={() => setFormData({ ...formData, directAdMode: 'same_tab' })}
                className="text-purple-600"
              />
              <span>Redirect Langsung di Halaman Ini</span>
            </label>
          </div>
        </div>

        {/* 2. Banner Texts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Judul Banner Promo
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="BONUS SPESIAL"
              className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Sub-judul Promo
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="ANTI ZONK HARI INI"
              className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Teks Tombol Merah
            </label>
            <input
              type="text"
              value={formData.buttonText}
              onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
              placeholder="KLIK PROMO AKTIF"
              className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tagline Bawah (Hijau)
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="PROMO VIP RESMI"
              className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>
        </div>

        {/* 3. Banner Image Source */}
        <div className="bg-[#0D061A] border border-[#2b1848] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>Gambar Model / Banner Promo</span>
            </label>
            <div className="flex rounded-lg bg-[#160a2c] p-0.5 border border-purple-900/30">
              <button
                type="button"
                onClick={() => {
                  setImageMode('default');
                  setFormData((prev) => ({ ...prev, imageUrl: '/images/promo-model.png' }));
                }}
                className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                  imageMode === 'default' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Model Asli (Default)
              </button>
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                  imageMode === 'upload' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Upload File Baru
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                  imageMode === 'url' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                URL Gambar
              </button>
            </div>
          </div>

          {imageMode === 'upload' && (
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileUpload}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-900/50 file:text-purple-200 hover:file:bg-purple-800 cursor-pointer"
            />
          )}

          {imageMode === 'url' && (
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/banner.jpg"
              className="w-full bg-[#130A24] border border-[#2b1848] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
            />
          )}

          {imageMode === 'default' && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Menggunakan gambar model asli KingStream (/images/promo-model.png)</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-purple-900/30">
          <div className="text-xs text-slate-400">
            Perubahan langsung tersimpan ke browser dan terlihat oleh pengunjung landing page.
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Pengaturan Iklan</span>
          </button>
        </div>
      </form>
    </div>
  );
}

