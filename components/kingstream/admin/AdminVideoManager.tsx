'use client';

import React, { useState } from 'react';
import {
  Upload,
  Film,
  Plus,
  Trash2,
  Edit,
  Play,
  Eye,
  Clock,
  Check,
  Search,
  Sparkles,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  FileVideo,
} from 'lucide-react';
import { useKingStream } from '../KingStreamContext';
import {
  KingStreamVideo,
  VideoCategory,
  formatViews,
  formatTimeAgo,
} from '@/lib/kingstream-storage';
import { toast } from 'sonner';

const CATEGORIES: VideoCategory[] = [
  'Indo Viral',
  'Trending',
  'Eksklusif',
  'Terbaru',
  'Populer',
];

const BADGES = ['', 'VIRAL', 'HOT', 'VIP HD', 'TERBARU', 'POPULER'];

export function AdminVideoManager() {
  const { videos, addVideo, updateVideo, deleteVideo } = useKingStream();

  // Upload Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<VideoCategory>('Indo Viral');
  const [duration, setDuration] = useState('12:45');
  const [views, setViews] = useState(154000);
  const [badge, setBadge] = useState('VIRAL');
  const [thumbnailMode, setThumbnailMode] = useState<'upload' | 'url'>('url');
  const [thumbnailUrl, setThumbnailUrl] = useState(
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80'
  );
  const [videoMode, setVideoMode] = useState<'url' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('ALL');

  // Preview / Edit Modal State
  const [previewVideo, setPreviewVideo] = useState<KingStreamVideo | null>(null);
  const [editingVideo, setEditingVideo] = useState<KingStreamVideo | null>(null);

  // File Upload Handlers (Saves permanently to server /public/uploads + auto duration detection)
  const handleThumbnailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, WebP)');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/kingstream/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setThumbnailUrl(data.url);
        toast.success('Thumbnail berhasil diunggah ke server!');
        return;
      }
    } catch (err) {
      // Fallback to base64
    }

    const reader = new FileReader();
    reader.onload = () => {
      setThumbnailUrl(reader.result as string);
      toast.success('Thumbnail berhasil diunggah!');
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('File harus berupa video (MP4, WebM)');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);

    // Auto-detect exact duration & capture thumbnail frame
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;
    tempVideo.muted = true;
    tempVideo.onloadedmetadata = () => {
      const sec = Math.floor(tempVideo.duration || 0);
      if (sec > 0) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const formattedDur = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        setDuration(formattedDur);
        toast.info(`Durasi video terdeteksi otomatis: ${formattedDur}`);
      }
      // Seek to 1 second to capture frame if default thumbnail is still used
      tempVideo.currentTime = Math.min(1.5, (tempVideo.duration || 2) / 2);
    };
    tempVideo.onseeked = () => {
      if (thumbnailUrl.includes('unsplash.com')) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = tempVideo.videoWidth || 640;
          canvas.height = tempVideo.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            if (dataUrl && dataUrl.length > 100) {
              setThumbnailUrl(dataUrl);
            }
          }
        } catch (err) {
          // ignore canvas error
        }
      }
    };

    // Upload permanently to server /public/uploads
    setIsUploadingFile(true);
    try {
      toast.info(`Mengunggah video "${file.name}" ke server...`);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/kingstream/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setVideoUrl(data.url);
        toast.success(`Video "${file.name}" berhasil disimpan permanen!`);
        return;
      }
    } catch (err) {
      // Fallback to objectUrl
    } finally {
      setIsUploadingFile(false);
    }

    toast.success(`Video lokal "${file.name}" siap diputar!`);
  };

  const handleSubmitUpload = (e: React.FormEvent) => {
    e.preventDefault();

    if (isUploadingFile) {
      toast.warning('Mohon tunggu hingga proses unggah file video selesai...');
      return;
    }

    if (!title.trim()) {
      toast.error('Judul video wajib diisi!');
      return;
    }

    if (!thumbnailUrl) {
      toast.error('Thumbnail video wajib ada!');
      return;
    }

    const newVideo = addVideo({
      title: title.trim(),
      category,
      duration: duration.trim() || '10:00',
      views: Number(views) || 0,
      badge: badge || undefined,
      thumbnailUrl,
      videoUrl: videoUrl.trim() || 'https://www.w3schools.com/html/mov_bbb.mp4',
    });

    toast.success(`Video "${newVideo.title}" berhasil diupload ke landing page!`);

    // Reset Form
    setTitle('');
    setShowUploadForm(false);
  };

  // Mock / Demo Video Generator
  const handleGenerateSampleVideos = () => {
    const sampleItems = [
      {
        title: 'DJ Goyang Pargoy Viral Terbaru 2026 Full Bass Jedag Jedug',
        category: 'Indo Viral' as VideoCategory,
        duration: '14:20',
        views: 420000,
        badge: 'VIRAL',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      },
      {
        title: 'Koleksi Video Eksklusif Premium Trending Minggu Ini No Cut',
        category: 'Eksklusif' as VideoCategory,
        duration: '22:15',
        views: 1250000,
        badge: 'VIP HD',
        thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      },
      {
        title: 'Momen Tak Terduga Live Streaming Paling Heboh Se-Indonesia',
        category: 'Trending' as VideoCategory,
        duration: '08:45',
        views: 890000,
        badge: 'HOT',
        thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      },
      {
        title: 'Top 10 Video Terpopuler Pilihan Netizen Rating Tertinggi',
        category: 'Populer' as VideoCategory,
        duration: '18:50',
        views: 2450000,
        badge: 'TOP 1',
        thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      },
    ];

    sampleItems.forEach((item) => addVideo(item));
    toast.success('4 video contoh berhasil ditambahkan ke landing page!');
  };

  const handleDelete = (id: string, videoTitle: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus video "${videoTitle}"?`)) {
      deleteVideo(id);
      toast.success('Video berhasil dihapus dari landing page');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    updateVideo(editingVideo.id, {
      title: editingVideo.title,
      category: editingVideo.category,
      duration: editingVideo.duration,
      views: Number(editingVideo.views),
      badge: editingVideo.badge,
      thumbnailUrl: editingVideo.thumbnailUrl,
      videoUrl: editingVideo.videoUrl,
    });

    toast.success('Perubahan video berhasil disimpan!');
    setEditingVideo(null);
  };

  // Filtered list
  const filteredList = videos.filter((v) => {
    const matchCat =
      selectedFilterCategory === 'ALL' || v.category === selectedFilterCategory;
    const matchSearch =
      !searchQuery ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#130A24] border border-[#2b1848] rounded-2xl p-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-purple-400" />
            <span>Kelola & Upload Video</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Total {videos.length} video aktif di landing page KingStream
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Mock Sample Generator */}
          <button
            onClick={handleGenerateSampleVideos}
            className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 px-3.5 py-2 rounded-xl transition cursor-pointer"
            title="Tambahkan 4 video simulasi"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Contoh Video</span>
          </button>

          {/* Toggle Upload Form Button */}
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-4 py-2 rounded-xl transition shadow-md shadow-purple-950 cursor-pointer active:scale-95"
          >
            {showUploadForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showUploadForm ? 'Tutup Form' : 'Upload Video Baru'}</span>
          </button>
        </div>
      </div>

      {/* Upload Video Form Card (Collapsible) */}
      {showUploadForm && (
        <div className="bg-[#150B2A] border border-purple-700/50 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-purple-900/40">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              <span>Formulir Upload Video Baru</span>
            </h3>
            <span className="text-xs text-slate-400">Video langsung tampil di homepage</span>
          </div>

          <form onSubmit={handleSubmitUpload} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Judul Video */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Judul Video <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Video Viral Paling Trending 2026 Kualitas HD"
                  className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                  required
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kategori Video <span className="text-rose-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VideoCategory)}
                  className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#130A24] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Badge Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Label / Badge Tambahan (Opsional)
                </label>
                <select
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition cursor-pointer"
                >
                  <option value="">(Tanpa Badge)</option>
                  <option value="VIRAL">VIRAL (Merah)</option>
                  <option value="HOT">HOT (Api)</option>
                  <option value="VIP HD">VIP HD (Emas)</option>
                  <option value="TERBARU">TERBARU (Hijau)</option>
                  <option value="POPULER">POPULER (Biru)</option>
                </select>
              </div>

              {/* Durasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Durasi Video (mm:ss)
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Contoh: 12:45"
                  className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              {/* Views Awal */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Jumlah Tayangan Awal (Views)
                </label>
                <input
                  type="number"
                  value={views}
                  onChange={(e) => setViews(Number(e.target.value))}
                  placeholder="Contoh: 150000"
                  className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              {/* Thumbnail Selector */}
              <div className="md:col-span-2 bg-[#0D061A] border border-[#2b1848] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>Thumbnail Video</span>
                  </label>
                  <div className="flex rounded-lg bg-[#160a2c] p-0.5 border border-purple-900/30">
                    <button
                      type="button"
                      onClick={() => setThumbnailMode('url')}
                      className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                        thumbnailMode === 'url' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      URL Gambar
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnailMode('upload')}
                      className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                        thumbnailMode === 'upload' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                {thumbnailMode === 'url' ? (
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-[#130A24] border border-[#2b1848] focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailFileUpload}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-900/50 file:text-purple-200 hover:file:bg-purple-800 cursor-pointer"
                  />
                )}

                {/* Thumbnail Preview */}
                {thumbnailUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail Preview"
                      className="w-24 h-14 object-cover rounded-lg border border-purple-800/50"
                    />
                    <span className="text-[11px] text-slate-400">Pratinjau thumbnail terpilih</span>
                  </div>
                )}
              </div>

              {/* Video URL / File Selector */}
              <div className="md:col-span-2 bg-[#0D061A] border border-[#2b1848] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileVideo className="w-4 h-4 text-purple-400" />
                    <span>Sumber File Video / Embed Link</span>
                  </label>
                  <div className="flex rounded-lg bg-[#160a2c] p-0.5 border border-purple-900/30">
                    <button
                      type="button"
                      onClick={() => setVideoMode('url')}
                      className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                        videoMode === 'url' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      URL Link / Embed
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMode('upload')}
                      className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                        videoMode === 'upload' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      Upload File Video
                    </button>
                  </div>
                </div>

                {videoMode === 'url' ? (
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Masukkan URL MP4 langsung, HLS, atau link streaming (opsional)"
                    className="w-full bg-[#130A24] border border-[#2b1848] focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                ) : (
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileUpload}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-900/50 file:text-purple-200 hover:file:bg-purple-800 cursor-pointer"
                  />
                )}
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/30">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUploadingFile}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-emerald-950 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isUploadingFile ? 'Sedang Mengunggah Video...' : 'Simpan & Tayangkan Sekarang'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#130A24] border border-[#2b1848] rounded-xl p-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari video berdasarkan judul..."
            className="w-full bg-[#0D061A] border border-[#2b1848] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedFilterCategory('ALL')}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              selectedFilterCategory === 'ALL'
                ? 'bg-purple-600 text-white font-semibold'
                : 'bg-[#0D061A] text-slate-400 hover:text-white'
            }`}
          >
            Semua ({videos.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = videos.filter((v) => v.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedFilterCategory(cat)}
                className={`text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                  selectedFilterCategory === cat
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-[#0D061A] text-slate-400 hover:text-white'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Table List */}
      <div className="bg-[#130A24] border border-[#2b1848] rounded-2xl overflow-hidden shadow-lg">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <Film className="w-12 h-12 text-purple-900/60 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">Belum ada video ditemukan</p>
            <p className="text-xs text-slate-500 mt-1">
              Klik &quot;Upload Video Baru&quot; atau &quot;+ Contoh Video&quot; untuk menambahkan konten.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-900/30 bg-[#0D061A]/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Video & Info</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Tayangan (Views)</th>
                  <th className="py-3 px-4">Tanggal Upload</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/20 text-xs">
                {filteredList.map((video) => (
                  <tr key={video.id} className="hover:bg-purple-950/20 transition-colors">
                    {/* Video Info & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-12 shrink-0 rounded-lg overflow-hidden bg-black/60 border border-purple-900/30">
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          {video.badge && (
                            <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-extrabold px-1 rounded">
                              {video.badge}
                            </span>
                          )}
                        </div>
                        <div className="max-w-xs">
                          <h4 className="font-semibold text-slate-100 line-clamp-1">{video.title}</h4>
                          <span className="text-[11px] text-slate-500 font-mono">ID: {video.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-4">
                      <span className="inline-block bg-[#1a0f33] text-purple-300 px-2.5 py-0.5 rounded-full text-[11px] border border-purple-800/40">
                        {video.category}
                      </span>
                    </td>

                    {/* Durasi */}
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {video.duration}
                    </td>

                    {/* Views */}
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {formatViews(video.views)}
                    </td>

                    {/* Tanggal */}
                    <td className="py-3 px-4 text-slate-400">
                      {formatTimeAgo(video.createdAt)}
                    </td>

                    {/* Aksi Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview Player */}
                        <button
                          onClick={() => setPreviewVideo(video)}
                          className="p-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-white transition cursor-pointer"
                          title="Preview Video Player"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {/* Edit Video */}
                        <button
                          onClick={() => setEditingVideo(video)}
                          className="p-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 hover:text-white transition cursor-pointer"
                          title="Edit Video"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Video */}
                        <button
                          onClick={() => handleDelete(video.id, video.title)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white transition cursor-pointer"
                          title="Hapus Video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Video Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#150B2A] border border-purple-800/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingVideo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Edit className="w-4 h-4 text-purple-400" />
              <span>Edit Video</span>
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Video</label>
                <input
                  type="text"
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full bg-[#0D061A] border border-[#2b1848] rounded-xl px-3 py-2 text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={editingVideo.category}
                    onChange={(e) =>
                      setEditingVideo({ ...editingVideo, category: e.target.value as VideoCategory })
                    }
                    className="w-full bg-[#0D061A] border border-[#2b1848] rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Badge</label>
                  <select
                    value={editingVideo.badge || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, badge: e.target.value })}
                    className="w-full bg-[#0D061A] border border-[#2b1848] rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {BADGES.map((b) => (
                      <option key={b} value={b}>
                        {b || '(Tanpa Badge)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Durasi</label>
                  <input
                    type="text"
                    value={editingVideo.duration}
                    onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                    className="w-full bg-[#0D061A] border border-[#2b1848] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Views</label>
                  <input
                    type="number"
                    value={editingVideo.views}
                    onChange={(e) =>
                      setEditingVideo({ ...editingVideo, views: Number(e.target.value) })
                    }
                    className="w-full bg-[#0D061A] border border-[#2b1848] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Thumbnail URL</label>
                <input
                  type="text"
                  value={editingVideo.thumbnailUrl}
                  onChange={(e) => setEditingVideo({ ...editingVideo, thumbnailUrl: e.target.value })}
                  className="w-full bg-[#0D061A] border border-[#2b1848] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2 rounded-xl bg-purple-950/40 text-slate-300 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-950"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Player Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#120824] border border-purple-800/60 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative">
            <div className="p-4 bg-[#160b2e] border-b border-purple-900/40 flex items-center justify-between">
              <span className="text-xs font-bold text-white line-clamp-1">{previewVideo.title}</span>
              <button
                onClick={() => setPreviewVideo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="aspect-video w-full bg-black flex items-center justify-center select-none"
            >
              {previewVideo.videoUrl &&
              (previewVideo.videoUrl.endsWith('.mp4') ||
                previewVideo.videoUrl.endsWith('.webm') ||
                previewVideo.videoUrl.startsWith('/uploads/') ||
                previewVideo.videoUrl.startsWith('blob:')) ? (
                <video
                  src={previewVideo.videoUrl}
                  controls
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6">
                  <Play className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-300">Player Preview: {previewVideo.title}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{previewVideo.videoUrl || 'URL Default'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

