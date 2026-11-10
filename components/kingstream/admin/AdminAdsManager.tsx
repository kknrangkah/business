'use client';

import React, { useState, useEffect } from 'react';
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
  ToggleLeft,
  ToggleRight,
  Play,
  Plus,
  Trash2,
  Edit,
  Clock,
  X,
  Repeat,
} from 'lucide-react';
import { useKingStream } from '../KingStreamContext';
import {
  AdBannerConfig,
  AdBannerItem,
  DEFAULT_AD_CONFIG,
  getActiveAdItems,
} from '@/lib/kingstream-storage';
import { toast } from 'sonner';

export function AdminAdsManager() {
  const { adConfig, updateAdConfig } = useKingStream();

  // Ensure adItems array is initialized from adConfig
  const initialItems: AdBannerItem[] =
    Array.isArray(adConfig.adItems) && adConfig.adItems.length > 0
      ? adConfig.adItems
      : getActiveAdItems(adConfig);

  const [formData, setFormData] = useState<AdBannerConfig>({
    ...adConfig,
    rotationIntervalSeconds: adConfig.rotationIntervalSeconds || 5,
    adItems: initialItems,
  });

  // Sync local state if context loads updated adConfig from server
  useEffect(() => {
    const items =
      Array.isArray(adConfig.adItems) && adConfig.adItems.length > 0
        ? adConfig.adItems
        : getActiveAdItems(adConfig);
    setFormData((prev) => ({
      ...prev,
      ...adConfig,
      rotationIntervalSeconds: adConfig.rotationIntervalSeconds || prev.rotationIntervalSeconds || 5,
      adItems: items,
    }));
  }, [adConfig]);

  // Live preview rotation state
  const activePreviewItems = (formData.adItems || []).filter(
    (item) => item.isActive !== false && item.targetUrl?.trim()
  );
  const [previewIdx, setPreviewIdx] = useState(0);

  useEffect(() => {
    if (activePreviewItems.length <= 1) {
      setPreviewIdx(0);
      return;
    }
    const sec = Math.max(2, Number(formData.rotationIntervalSeconds) || 5);
    const timer = setInterval(() => {
      setPreviewIdx((prev) => (prev + 1) % activePreviewItems.length);
    }, sec * 1000);
    return () => clearInterval(timer);
  }, [activePreviewItems.length, formData.rotationIntervalSeconds]);

  // Add / Edit Ad Item Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemTargetUrl, setItemTargetUrl] = useState('');
  const [itemTitle, setItemTitle] = useState('BONUS SPESIAL');
  const [itemSubtitle, setItemSubtitle] = useState('ANTI ZONK HARI INI');
  const [itemButtonText, setItemButtonText] = useState('KLIK PROMO AKTIF');
  const [itemTagline, setItemTagline] = useState('PROMO VIP RESMI');
  const [itemImageUrl, setItemImageUrl] = useState('/images/promo-model.png');
  const [itemImageMode, setItemImageMode] = useState<'default' | 'upload' | 'url'>('default');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const persistConfig = (nextConfig: AdBannerConfig) => {
    const firstActive =
      (nextConfig.adItems || []).find((i) => i.isActive !== false) ||
      nextConfig.adItems?.[0];
    const synced: AdBannerConfig = {
      ...nextConfig,
      targetUrl: firstActive?.targetUrl || nextConfig.targetUrl || DEFAULT_AD_CONFIG.targetUrl,
      title: firstActive?.title || nextConfig.title || DEFAULT_AD_CONFIG.title,
      subtitle: firstActive?.subtitle || nextConfig.subtitle || DEFAULT_AD_CONFIG.subtitle,
      buttonText: firstActive?.buttonText || nextConfig.buttonText || DEFAULT_AD_CONFIG.buttonText,
      imageUrl: firstActive?.imageUrl || nextConfig.imageUrl || DEFAULT_AD_CONFIG.imageUrl,
      tagline: firstActive?.tagline || nextConfig.tagline || DEFAULT_AD_CONFIG.tagline,
    };
    setFormData(synced);
    updateAdConfig(synced);
  };

  const openAddNewItem = () => {
    setEditingItemId(null);
    setItemTargetUrl('');
    setItemTitle('BONUS SPESIAL');
    setItemSubtitle('ANTI ZONK HARI INI');
    setItemButtonText('KLIK PROMO AKTIF');
    setItemTagline('PROMO VIP RESMI');
    setItemImageUrl('/images/promo-model.png');
    setItemImageMode('default');
    setShowAddModal(true);
  };

  const openEditItem = (item: AdBannerItem) => {
    setEditingItemId(item.id);
    setItemTargetUrl(item.targetUrl);
    setItemTitle(item.title || 'BONUS SPESIAL');
    setItemSubtitle(item.subtitle || 'ANTI ZONK HARI INI');
    setItemButtonText(item.buttonText || 'KLIK PROMO AKTIF');
    setItemTagline(item.tagline || 'PROMO VIP RESMI');
    setItemImageUrl(item.imageUrl || '/images/promo-model.png');
    setItemImageMode(
      !item.imageUrl || item.imageUrl === '/images/promo-model.png' ? 'default' : 'url'
    );
    setShowAddModal(true);
  };

  // File Upload for Banner Image (saves permanently via /api/kingstream/upload)
  const handleItemImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, WebP)');
      return;
    }

    setIsUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/kingstream/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setItemImageUrl(data.url);
        toast.success('Gambar banner berhasil diunggah ke server!');
        setIsUploadingImage(false);
        return;
      }
    } catch {}

    const reader = new FileReader();
    reader.onload = () => {
      setItemImageUrl(reader.result as string);
      setIsUploadingImage(false);
      toast.success('Gambar iklan berhasil dimuat!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAdItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTargetUrl.trim()) {
      toast.error('Link iklan tujuan wajib diisi!');
      return;
    }

    const currentList = formData.adItems || [];
    let updatedList: AdBannerItem[];

    if (editingItemId) {
      updatedList = currentList.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              targetUrl: itemTargetUrl.trim(),
              title: itemTitle.trim() || 'BONUS SPESIAL',
              subtitle: itemSubtitle.trim() || 'ANTI ZONK HARI INI',
              buttonText: itemButtonText.trim() || 'KLIK PROMO AKTIF',
              tagline: itemTagline.trim() || 'PROMO VIP RESMI',
              imageUrl: itemImageUrl || '/images/promo-model.png',
            }
          : item
      );
      toast.success('Link banner iklan berhasil diperbarui!');
    } else {
      const newItem: AdBannerItem = {
        id: `ad-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        targetUrl: itemTargetUrl.trim(),
        title: itemTitle.trim() || 'BONUS SPESIAL',
        subtitle: itemSubtitle.trim() || 'ANTI ZONK HARI INI',
        buttonText: itemButtonText.trim() || 'KLIK PROMO AKTIF',
        tagline: itemTagline.trim() || 'PROMO VIP RESMI',
        imageUrl: itemImageUrl || '/images/promo-model.png',
        isActive: true,
      };
      updatedList = [...currentList, newItem];
      toast.success(`Link iklan baru (#${updatedList.length}) berhasil ditambahkan ke rotasi!`);
    }

    persistConfig({
      ...formData,
      adItems: updatedList,
    });
    setShowAddModal(false);
    setEditingItemId(null);
  };

  const handleToggleItemActive = (id: string) => {
    const currentList = formData.adItems || [];
    const updatedList = currentList.map((item) =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    persistConfig({ ...formData, adItems: updatedList });
    toast.info('Status rotasi link iklan diperbarui');
  };

  const handleDeleteItem = (id: string, index: number) => {
    const currentList = formData.adItems || [];
    if (currentList.length <= 1) {
      toast.error('Minimal harus ada 1 link iklan yang tersimpan.');
      return;
    }
    if (confirm(`Hapus Link Iklan #${index + 1} dari daftar rotasi?`)) {
      const updatedList = currentList.filter((item) => item.id !== id);
      persistConfig({ ...formData, adItems: updatedList });
      toast.success('Link iklan berhasil dihapus dari rotasi');
    }
  };

  const handleSaveGlobalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    persistConfig(formData);
    toast.success('Seluruh pengaturan rotasi link iklan berhasil disimpan ke landing page!');
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan pengaturan iklan ke default asli?')) {
      setFormData(DEFAULT_AD_CONFIG);
      updateAdConfig(DEFAULT_AD_CONFIG);
      toast.info('Pengaturan iklan telah direset ke default');
    }
  };

  const handleTestSpecificLink = (rawUrl?: string) => {
    if (!rawUrl) {
      toast.error('URL iklan kosong');
      return;
    }
    let url = rawUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentPreviewItem =
    activePreviewItems[previewIdx % Math.max(1, activePreviewItems.length)] ||
    formData.adItems?.[0] ||
    DEFAULT_AD_CONFIG;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#130A24] border border-[#2b1848] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-400" />
            <span>Kelola Multi-Link Iklan & Rotasi Banner Promo</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload lebih dari 1 link iklan — banner di landing page & direct klik play akan otomatis berganti-ganti
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add New Ad Link Button */}
          <button
            type="button"
            onClick={openAddNewItem}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-4 py-2 rounded-xl transition shadow-md shadow-purple-950 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Link Iklan</span>
          </button>

          {/* Status Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const next = { ...formData, isActive: !formData.isActive };
              persistConfig(next);
            }}
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

      {/* Add / Edit Ad Link Form Card */}
      {showAddModal && (
        <div className="bg-[#150B2A] border-2 border-purple-600/60 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-purple-900/40">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>
                {editingItemId ? 'Edit Link & Banner Iklan' : 'Tambah Link / Banner Iklan Baru ke Rotasi'}
              </span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveAdItem} className="space-y-4">
            {/* Link Target URL */}
            <div className="bg-[#0D061A] border border-purple-700/50 rounded-xl p-4 space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-emerald-400" />
                <span>Link Iklan Tujuan (Target URL) *</span>
              </label>
              <input
                type="text"
                value={itemTargetUrl}
                onChange={(e) => setItemTargetUrl(e.target.value)}
                placeholder="Contoh: https://t.me/SponsorSatu atau https://link-promo-2.com"
                className="w-full bg-[#130A24] border border-purple-700/60 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none font-mono"
                required
              />
            </div>

            {/* Banner Texts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Banner Promo
                </label>
                <input
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="BONUS SPESIAL"
                  className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sub-judul Promo
                </label>
                <input
                  type="text"
                  value={itemSubtitle}
                  onChange={(e) => setItemSubtitle(e.target.value)}
                  placeholder="ANTI ZONK HARI INI"
                  className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teks Tombol Merah
                </label>
                <input
                  type="text"
                  value={itemButtonText}
                  onChange={(e) => setItemButtonText(e.target.value)}
                  placeholder="KLIK PROMO AKTIF"
                  className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tagline Bawah (Hijau)
                </label>
                <input
                  type="text"
                  value={itemTagline}
                  onChange={(e) => setItemTagline(e.target.value)}
                  placeholder="PROMO VIP RESMI"
                  className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Banner Image Selector */}
            <div className="bg-[#0D061A] border border-[#2b1848] rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span>Gambar Banner untuk Link Ini</span>
                </label>
                <div className="flex rounded-lg bg-[#160a2c] p-0.5 border border-purple-900/30">
                  <button
                    type="button"
                    onClick={() => {
                      setItemImageMode('default');
                      setItemImageUrl('/images/promo-model.png');
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                      itemImageMode === 'default' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                    }`}
                  >
                    Model Default
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemImageMode('upload')}
                    className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                      itemImageMode === 'upload' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                    }`}
                  >
                    Upload Gambar
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemImageMode('url')}
                    className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                      itemImageMode === 'url' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                    }`}
                  >
                    URL Gambar
                  </button>
                </div>
              </div>

              {itemImageMode === 'upload' && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleItemImageFileUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-900/50 file:text-purple-200 hover:file:bg-purple-800 cursor-pointer"
                />
              )}

              {itemImageMode === 'url' && (
                <input
                  type="url"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full bg-[#130A24] border border-[#2b1848] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              )}

              {itemImageMode === 'default' && (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Menggunakan gambar model asli (/images/promo-model.png)</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/30">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-purple-950/40 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUploadingImage}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingItemId ? 'Simpan Perubahan Iklan' : 'Tambahkan ke Rotasi Banner'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Uploaded Rotating Ad Links */}
      <div className="bg-[#130A24] border border-[#2b1848] rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/30 pb-4">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-emerald-400" />
              <span>
                Daftar Link Banner Iklan Berganti-ganti ({activePreviewItems.length} Aktif dari{' '}
                {(formData.adItems || []).length} Link)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Semua link yang berstatus <strong className="text-emerald-400">Aktif</strong> akan otomatis bergantian di banner landing page dan saat tombol Play diklik.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddNewItem}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/50 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Link Iklan Lagi</span>
          </button>
        </div>

        <div className="space-y-3">
          {(formData.adItems || []).map((item, idx) => (
            <div
              key={item.id || idx}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition ${
                item.isActive !== false
                  ? 'bg-[#0D061A] border-purple-800/50 hover:border-emerald-600/50'
                  : 'bg-[#0D061A]/50 border-purple-950/30 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Badge Number */}
                <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-xs font-black text-purple-300 shrink-0">
                  #{idx + 1}
                </div>

                {/* Mini Banner Thumbnail */}
                <img
                  src={item.imageUrl || '/images/promo-model.png'}
                  alt={item.title}
                  className="w-16 h-10 rounded-lg object-cover border border-emerald-700/50 shrink-0 bg-black"
                />

                {/* Info & Target URL */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.title || 'BONUS SPESIAL'}</span>
                    <span className="text-[10px] bg-red-600/90 text-white font-bold px-2 py-0.5 rounded uppercase">
                      {item.buttonText || 'KLIK PROMO AKTIF'}
                    </span>
                    {item.isActive !== false ? (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/40 px-2 py-0.5 rounded-full font-semibold">
                        Aktif Berputar
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-700/40 px-2 py-0.5 rounded-full font-semibold">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-mono text-purple-300 truncate">
                    <LinkIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{item.targetUrl}</span>
                  </div>
                </div>
              </div>

              {/* Item Actions */}
              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleTestSpecificLink(item.targetUrl)}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/70 text-purple-200 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                  title="Test Buka Link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleItemActive(item.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    item.isActive !== false
                      ? 'bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {item.isActive !== false ? 'Aktif' : 'Off'}
                </button>

                <button
                  type="button"
                  onClick={() => openEditItem(item)}
                  className="p-1.5 rounded-lg bg-blue-950/50 hover:bg-blue-900/70 text-blue-300 hover:text-white transition cursor-pointer"
                  title="Edit Link / Banner Ini"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id, idx)}
                  className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 hover:text-white transition cursor-pointer"
                  title="Hapus Link Ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Rotating Preview Box */}
      <div className="bg-[#150B2A] border border-purple-800/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-emerald-400" />
            Pratinjau Rotasi Banner Langsung (Iklan #{(previewIdx % Math.max(1, activePreviewItems.length)) + 1} dari{' '}
            {Math.max(1, activePreviewItems.length)})
          </span>
          <div className="flex items-center gap-2">
            {activePreviewItems.length > 1 &&
              activePreviewItems.map((it, idx) => (
                <button
                  key={it.id || idx}
                  type="button"
                  onClick={() => setPreviewIdx(idx)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                    idx === previewIdx % activePreviewItems.length
                      ? 'bg-emerald-600 text-white'
                      : 'bg-purple-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Iklan #{idx + 1}
                </button>
              ))}
          </div>
        </div>

        {/* Live Promo Banner Card Component */}
        <div className="w-full flex justify-center py-4 bg-[#0D061A]/80 rounded-xl border border-purple-950/60">
          <div
            onClick={() => handleTestSpecificLink(currentPreviewItem.targetUrl)}
            className="group relative cursor-pointer border-2 border-[#10b981] rounded-2xl overflow-hidden bg-[#0c1619] shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all duration-300 w-full max-w-[490px] flex items-stretch select-none"
            title="Klik untuk test link tujuan saat ini"
          >
            {/* Left Model Photo */}
            <div className="relative w-[130px] sm:w-[150px] min-h-[88px] shrink-0 bg-[#0d161a] overflow-hidden">
              <Image
                src={currentPreviewItem.imageUrl || '/images/promo-model.png'}
                alt="Promo Model Preview"
                fill
                sizes="150px"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
              <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-r from-transparent to-[#0c1619]" />
            </div>

            {/* Right Promotional Content */}
            <div className="flex-1 py-3 px-3 sm:px-4 flex flex-col items-center justify-center text-center bg-gradient-to-r from-[#0c1619] via-[#0f1d22] to-[#0c1619]">
              <h3 className="text-white font-black text-sm sm:text-base tracking-wider drop-shadow-sm leading-tight">
                {currentPreviewItem.title || 'BONUS SPESIAL'}
              </h3>

              <p className="text-slate-100 font-bold text-[11px] sm:text-xs tracking-wide mt-0.5">
                {currentPreviewItem.subtitle || 'ANTI ZONK HARI INI'}
              </p>

              <div className="mt-1.5">
                <span className="inline-block bg-[#dc2626] group-hover:bg-[#ef4444] text-white text-[10px] sm:text-[11px] font-black px-3 py-0.5 sm:py-1 rounded uppercase tracking-wider shadow-sm shadow-red-900/50 transition-colors">
                  {currentPreviewItem.buttonText || 'KLIK PROMO AKTIF'}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1 mt-1.5 text-[10px] sm:text-[11px] font-black tracking-wide text-[#10b981]">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                <span>{currentPreviewItem.tagline || 'PROMO VIP RESMI'}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-400 mt-2">
          🔄 Target Link Aktif Saat Ini:{' '}
          <span className="text-emerald-300 font-mono underline">
            {currentPreviewItem.targetUrl || '(Belum diset)'}
          </span>
        </p>
      </div>

      {/* Global Rotation & Play Direct Settings */}
      <form
        onSubmit={handleSaveGlobalSettings}
        className="bg-[#130A24] border border-[#2b1848] rounded-2xl p-6 space-y-5"
      >
        <h3 className="font-bold text-base text-white border-b border-purple-900/30 pb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          <span>Pengaturan Rotasi Banner & Direct Klik Play</span>
        </h3>

        {/* Rotation Interval Setting */}
        <div className="bg-[#0D061A] border border-purple-700/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-emerald-400" />
              <span>Durasi Pergantian Otomatis Banner di Landing Page</span>
            </label>
            <p className="text-[11px] text-slate-400 mt-1">
              Menentukan berapa detik sekali banner dan link iklan berganti otomatis saat ada lebih dari 1 iklan aktif.
            </p>
          </div>

          <select
            value={formData.rotationIntervalSeconds || 5}
            onChange={(e) =>
              setFormData({ ...formData, rotationIntervalSeconds: Number(e.target.value) })
            }
            className="bg-[#130A24] border border-purple-700/60 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none cursor-pointer shrink-0"
          >
            <option value={3}>Setiap 3 Detik (Cepat)</option>
            <option value={5}>Setiap 5 Detik (Disarankan)</option>
            <option value={8}>Setiap 8 Detik</option>
            <option value={10}>Setiap 10 Detik</option>
            <option value={15}>Setiap 15 Detik</option>
          </select>
        </div>

        {/* Feature: Direct ke Iklan saat Play Video */}
        <div className="bg-[#0D061A] border-2 border-amber-500/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-white">
                Direct ke Iklan Berganti-ganti saat Klik Tombol Play Video
              </span>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded-full font-bold">
                Rotasi Otomatis
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
            Saat pengunjung mengklik tombol <strong className="text-white">Play</strong> pada video, sistem otomatis mengarahkan pengunjung secara bergiliran ke daftar link iklan aktif (Klik ke-1 ke Iklan #1, Klik ke-2 ke Iklan #2, dst.).
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
              <span>Buka di Tab Baru (Disarankan)</span>
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

        {/* Save Global Button */}
        <div className="flex items-center justify-between pt-3 border-t border-purple-900/30">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.openInNewTab}
              onChange={(e) => setFormData({ ...formData, openInNewTab: e.target.checked })}
              className="rounded border-purple-800 bg-[#130A24] text-purple-600"
            />
            <span>Buka klik banner promo di tab baru</span>
          </label>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Semua Pengaturan Iklan</span>
          </button>
        </div>
      </form>
    </div>
  );
}
