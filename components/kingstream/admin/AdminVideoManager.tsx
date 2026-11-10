'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Film,
  Plus,
  Trash2,
  Edit,
  Play,
  Eye,
  Check,
  Search,
  Sparkles,
  Image as ImageIcon,
  X,
  FileVideo,
  MousePointerClick,
  Camera,
  Scissors,
} from 'lucide-react';
import { useKingStream } from '../KingStreamContext';
import {
  KingStreamVideo,
  VideoCategory,
  formatViews,
  formatNumber,
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

const DEFAULT_FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80';

interface CapturedFrame {
  timeSec: number;
  label: string;
  dataUrl: string;
}

export function AdminVideoManager() {
  const { videos, addVideo, updateVideo, deleteVideo } = useKingStream();

  // Upload Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<VideoCategory>('Indo Viral');
  const [duration, setDuration] = useState('00:00');
  const [views, setViews] = useState(0);
  const [badge, setBadge] = useState('VIRAL');
  const [thumbnailMode, setThumbnailMode] = useState<'video' | 'upload' | 'url'>('video');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoMode, setVideoMode] = useState<'upload' | 'url'>('upload');
  const [videoUrl, setVideoUrl] = useState('');
  const [localVideoPreviewUrl, setLocalVideoPreviewUrl] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);
  const [videoDurationSec, setVideoDurationSec] = useState<number>(0);
  const [scrubTimeSec, setScrubTimeSec] = useState<number>(1);

  const customScrubVideoRef = useRef<HTMLVideoElement | null>(null);
  const editScrubVideoRef = useRef<HTMLVideoElement | null>(null);
  const [editScrubTimeSec, setEditScrubTimeSec] = useState<number>(1);
  const [editVideoDurationSec, setEditVideoDurationSec] = useState<number>(0);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('ALL');

  // Preview / Edit Modal State
  const [previewVideo, setPreviewVideo] = useState<KingStreamVideo | null>(null);
  const [editingVideo, setEditingVideo] = useState<KingStreamVideo | null>(null);

  const formatSecToMMSS = (secTotal: number) => {
    const sec = Math.max(0, Math.floor(secTotal || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Upload a base64 JPEG dataUrl to /api/kingstream/upload so it becomes a clean /uploads/*.jpg URL
  const uploadDataUrlAsThumbnail = async (dataUrl: string): Promise<string> => {
    try {
      const resBlob = await fetch(dataUrl);
      const blob = await resBlob.blob();
      const file = new File([blob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch('/api/kingstream/upload', {
        method: 'POST',
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.success && uploadData.url) {
        return uploadData.url;
      }
    } catch {
      // Fallback to dataUrl if upload fails
    }
    return dataUrl;
  };

  // Extract 4 frames automatically from a video source (10%, 30%, 55%, 80%)
  const extractFramesFromVideoSource = (srcUrl: string) => {
    setIsGeneratingThumb(true);
    setCapturedFrames([]);

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'auto';
    tempVideo.muted = true;
    tempVideo.playsInline = true;
    tempVideo.crossOrigin = 'anonymous';
    tempVideo.src = srcUrl;

    const frames: CapturedFrame[] = [];
    let percentages = [0.12, 0.35, 0.6, 0.82];
    let currentIdx = 0;

    const captureFrameAtCurrentTime = (): string | null => {
      try {
        const vw = tempVideo.videoWidth || 640;
        const vh = tempVideo.videoHeight || 360;
        const targetW = Math.min(800, vw);
        const targetH = Math.round((targetW / vw) * vh) || 360;
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(tempVideo, 0, 0, targetW, targetH);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        return dataUrl && dataUrl.length > 200 ? dataUrl : null;
      } catch {
        return null;
      }
    };

    const seekNext = () => {
      const totalDur = tempVideo.duration || 0;
      if (currentIdx >= percentages.length || totalDur <= 0) {
        setIsGeneratingThumb(false);
        if (frames.length > 0) {
          setCapturedFrames(frames);
          // Pick the 1st or 2nd frame automatically and upload to server
          const chosen = frames[0];
          setThumbnailUrl(chosen.dataUrl);
          uploadDataUrlAsThumbnail(chosen.dataUrl).then((uploadedUrl) => {
            setThumbnailUrl(uploadedUrl);
          });
          toast.success('Thumbnail otomatis berhasil diambil dari potongan video!');
        }
        return;
      }

      const targetSec = Math.max(0.2, Math.min(totalDur - 0.1, totalDur * percentages[currentIdx]));
      tempVideo.currentTime = targetSec;
    };

    tempVideo.onloadedmetadata = () => {
      const sec = Math.floor(tempVideo.duration || 0);
      setVideoDurationSec(sec || 10);
      setScrubTimeSec(Math.min(2, Math.max(0.5, (tempVideo.duration || 2) * 0.2)));
      if (sec > 0) {
        const formattedDur = formatSecToMMSS(sec);
        setDuration(formattedDur);
      }
      seekNext();
    };

    tempVideo.onseeked = () => {
      const dataUrl = captureFrameAtCurrentTime();
      if (dataUrl) {
        const t = tempVideo.currentTime;
        frames.push({
          timeSec: t,
          label: formatSecToMMSS(t),
          dataUrl,
        });
      }
      currentIdx += 1;
      seekNext();
    };

    tempVideo.onerror = () => {
      setIsGeneratingThumb(false);
    };

    tempVideo.load();
  };

  // Manual capture from the interactive video scrubber in Upload Form
  const handleCaptureCurrentScrubFrame = async () => {
    const vid = customScrubVideoRef.current;
    if (!vid) return;
    try {
      const vw = vid.videoWidth || 640;
      const vh = vid.videoHeight || 360;
      const targetW = Math.min(800, vw);
      const targetH = Math.round((targetW / vw) * vh) || 360;
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(vid, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      if (dataUrl && dataUrl.length > 200) {
        setThumbnailUrl(dataUrl);
        const serverUrl = await uploadDataUrlAsThumbnail(dataUrl);
        setThumbnailUrl(serverUrl);
        toast.success(`Potongan video pada detik ${formatSecToMMSS(vid.currentTime)} dijadikan thumbnail!`);
      }
    } catch {
      toast.error('Gagal mengambil potongan frame dari video ini');
    }
  };

  // Manual capture from the interactive video scrubber in Edit Modal
  const handleCaptureEditScrubFrame = async () => {
    const vid = editScrubVideoRef.current;
    if (!vid || !editingVideo) return;
    try {
      const vw = vid.videoWidth || 640;
      const vh = vid.videoHeight || 360;
      const targetW = Math.min(800, vw);
      const targetH = Math.round((targetW / vw) * vh) || 360;
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(vid, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      if (dataUrl && dataUrl.length > 200) {
        const serverUrl = await uploadDataUrlAsThumbnail(dataUrl);
        setEditingVideo({
          ...editingVideo,
          thumbnailUrl: serverUrl,
        });
        toast.success(`Potongan video (${formatSecToMMSS(vid.currentTime)}) berhasil diambil sebagai thumbnail!`);
      }
    } catch {
      toast.error('Gagal mengambil potongan frame dari video');
    }
  };

  // File Upload Handlers (Saves permanently to server /public/uploads + auto duration & frame detection)
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
    } catch {
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
    setLocalVideoPreviewUrl(objectUrl);
    setVideoUrl(objectUrl);

    // If title is still empty, prefill with clean filename
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      setTitle(cleanName);
    }

    // Always extract 4 thumbnail frames from the newly uploaded video!
    setThumbnailMode('video');
    extractFramesFromVideoSource(objectUrl);

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
    } catch {
      // Fallback to objectUrl
    } finally {
      setIsUploadingFile(false);
    }

    toast.success(`Video lokal "${file.name}" siap diputar!`);
  };

  const handleSelectCapturedFrame = async (frame: CapturedFrame) => {
    setThumbnailUrl(frame.dataUrl);
    const serverUrl = await uploadDataUrlAsThumbnail(frame.dataUrl);
    setThumbnailUrl(serverUrl);
    toast.success(`Potongan video detik ${frame.label} dipilih sebagai thumbnail!`);
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

    const finalThumb = thumbnailUrl || capturedFrames[0]?.dataUrl || DEFAULT_FALLBACK_THUMB;

    const newVideo = addVideo({
      title: title.trim(),
      category,
      duration: duration.trim() || '01:00',
      views: Number(views) || 0,
      badge: badge || undefined,
      thumbnailUrl: finalThumb,
      videoUrl: videoUrl.trim() || 'https://www.w3schools.com/html/mov_bbb.mp4',
    });

    toast.success(`Video "${newVideo.title}" beserta thumbnail potongan video berhasil ditayangkan!`);

    // Reset Form completely so the next upload starts fresh
    setTitle('');
    setDuration('00:00');
    setViews(0);
    setThumbnailUrl('');
    setVideoUrl('');
    setLocalVideoPreviewUrl('');
    setCapturedFrames([]);
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
      views: Number(editingVideo.views) || 0,
      playClicks: Number(editingVideo.playClicks) || 0,
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

  const totalViews = videos.reduce((acc, curr) => acc + (Number(curr.views) || 0), 0);
  const totalPlayClicks = videos.reduce((acc, curr) => acc + (Number(curr.playClicks) || 0), 0);

  const activePreviewVideoSrc = localVideoPreviewUrl || videoUrl;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#130A24] border border-[#2b1848] rounded-2xl p-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-purple-400" />
            <span>Kelola & Upload Video</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
            <span>Total <strong className="text-white">{videos.length}</strong> video aktif</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-purple-300 font-semibold">
              <MousePointerClick className="w-3.5 h-3.5 text-purple-400" />
              <span>Total Klik Play: {formatNumber(totalPlayClicks)}</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Dilihat: {formatNumber(totalViews)} ({formatViews(totalViews)})</span>
            </span>
          </div>
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
            <span className="text-xs text-emerald-400 font-semibold">
              ✨ Thumbnail otomatis diambil dari potongan video
            </span>
          </div>

          <form onSubmit={handleSubmitUpload} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Sumber File Video / Embed Link (Diletakkan di paling atas agar begitu pilih video langsung ambil potongan thumbnail & durasi) */}
              <div className="md:col-span-2 bg-[#0D061A] border-2 border-purple-600/50 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileVideo className="w-4 h-4 text-emerald-400" />
                    <span>1. Pilih File Video yang Ingin Diupload *</span>
                  </label>
                  <div className="flex rounded-lg bg-[#160a2c] p-0.5 border border-purple-900/30">
                    <button
                      type="button"
                      onClick={() => setVideoMode('upload')}
                      className={`text-xs px-3 py-1 rounded-md transition cursor-pointer ${
                        videoMode === 'upload' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      Upload File Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMode('url')}
                      className={`text-xs px-3 py-1 rounded-md transition cursor-pointer ${
                        videoMode === 'url' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      URL Link / MP4
                    </button>
                  </div>
                </div>

                {videoMode === 'upload' ? (
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileUpload}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="Masukkan URL MP4 langsung (contoh: https://.../video.mp4)"
                      className="flex-1 bg-[#130A24] border border-[#2b1848] focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (videoUrl.trim()) {
                          extractFramesFromVideoSource(videoUrl.trim());
                        }
                      }}
                      className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0"
                    >
                      Ambil Frame
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Thumbnail dari Potongan Video */}
              <div className="md:col-span-2 bg-[#0D061A] border border-emerald-700/50 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-emerald-400" />
                    <span>2. Thumbnail dari Potongan Video</span>
                  </label>
                  <div className="flex rounded-lg bg-[#160a2c] p-0.5 border border-purple-900/30">
                    <button
                      type="button"
                      onClick={() => setThumbnailMode('video')}
                      className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                        thumbnailMode === 'video' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      Potongan Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnailMode('upload')}
                      className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                        thumbnailMode === 'upload' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      Upload Gambar Sendiri
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnailMode('url')}
                      className={`text-xs px-2.5 py-1 rounded-md transition cursor-pointer ${
                        thumbnailMode === 'url' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      URL Gambar
                    </button>
                  </div>
                </div>

                {thumbnailMode === 'video' && (
                  <div className="space-y-4">
                    {!activePreviewVideoSrc ? (
                      <div className="py-6 px-4 text-center border border-dashed border-purple-800/50 rounded-xl text-xs text-slate-400">
                        Silakan pilih file video pada langkah <strong>1</strong> di atas terlebih dahulu, maka 4 potongan frame video akan otomatis muncul di sini.
                      </div>
                    ) : (
                      <>
                        {/* 4 Auto-Captured Frames */}
                        {isGeneratingThumb ? (
                          <div className="text-xs text-emerald-400 animate-pulse py-3">
                            ⏳ Sedang mengambil potongan frame terbaik dari video...
                          </div>
                        ) : (
                          capturedFrames.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[11px] text-slate-300 font-semibold block">
                                Pilih Cepat dari 4 Potongan Otomatis Video:
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {capturedFrames.map((frame, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectCapturedFrame(frame)}
                                    className="group relative aspect-video rounded-lg overflow-hidden border-2 border-purple-800/60 hover:border-emerald-400 transition cursor-pointer bg-black"
                                  >
                                    <img
                                      src={frame.dataUrl}
                                      alt={`Potongan ${frame.label}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition"
                                    />
                                    <span className="absolute bottom-1 right-1 bg-black/80 text-emerald-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                                      {frame.label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        )}

                        {/* Interactive Video Scrubber to Capture Any Exact Frame */}
                        <div className="bg-[#130A24] border border-purple-800/50 rounded-xl p-3.5 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                              <Camera className="w-4 h-4 text-emerald-400" />
                              <span>Geser Detik Video untuk Ambil Potongan Frame Bebas:</span>
                            </span>
                            <button
                              type="button"
                              onClick={handleCaptureCurrentScrubFrame}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer transition active:scale-95"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>📸 Ambil Potongan Detik Ini ({formatSecToMMSS(scrubTimeSec)})</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-purple-900/60">
                              <video
                                ref={customScrubVideoRef}
                                src={activePreviewVideoSrc}
                                muted
                                playsInline
                                crossOrigin="anonymous"
                                onLoadedMetadata={(e) => {
                                  const dur = e.currentTarget.duration || 10;
                                  setVideoDurationSec(dur);
                                }}
                                onTimeUpdate={(e) => {
                                  setScrubTimeSec(e.currentTarget.currentTime);
                                }}
                                className="w-full h-full object-contain"
                              />
                            </div>

                            <div className="sm:col-span-2 space-y-2">
                              <input
                                type="range"
                                min={0}
                                max={Math.max(1, videoDurationSec)}
                                step={0.1}
                                value={scrubTimeSec}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setScrubTimeSec(val);
                                  if (customScrubVideoRef.current) {
                                    customScrubVideoRef.current.currentTime = val;
                                  }
                                }}
                                className="w-full accent-emerald-500 cursor-pointer"
                              />
                              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                                <span>00:00</span>
                                <span className="text-emerald-400 font-bold">
                                  Posisi: {formatSecToMMSS(scrubTimeSec)}
                                </span>
                                <span>{formatSecToMMSS(videoDurationSec)}</span>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                Geser slider di atas sampai menemukan adegan video yang diinginkan, lalu klik tombol hijau <strong>&quot;Ambil Potongan Detik Ini&quot;</strong>.
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {thumbnailMode === 'upload' && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailFileUpload}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-900/50 file:text-purple-200 hover:file:bg-purple-800 cursor-pointer"
                  />
                )}

                {thumbnailMode === 'url' && (
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-[#130A24] border border-[#2b1848] focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                )}

                {/* Active Thumbnail Preview */}
                {thumbnailUrl && (
                  <div className="pt-3 border-t border-purple-900/40 flex items-center gap-3.5">
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail Aktif"
                      className="w-28 h-16 object-cover rounded-lg border-2 border-emerald-500 shadow-md bg-black shrink-0"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>Thumbnail Siap Dipakai</span>
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Gambar potongan video di samping akan tampil di halaman depan.
                      </span>
                    </div>
                  </div>
                )}
              </div>

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
                  Durasi Video (Otomatis Terdeteksi)
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
                  placeholder="0"
                  className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                />
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
                  <th className="py-3 px-4">Klik Play Button</th>
                  <th className="py-3 px-4">Total Dilihat (Views)</th>
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
                            src={video.thumbnailUrl || DEFAULT_FALLBACK_THUMB}
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

                    {/* Klik Play Button */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 bg-purple-950/60 border border-purple-700/40 text-purple-200 px-2.5 py-1 rounded-lg font-semibold">
                        <Play className="w-3 h-3 fill-current text-purple-400" />
                        <span>{formatNumber(video.playClicks || 0)} klik</span>
                      </span>
                    </td>

                    {/* Total Dilihat (Views) */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-700/40 text-emerald-300 px-2.5 py-1 rounded-lg font-semibold">
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{formatNumber(video.views || 0)} ({formatViews(video.views || 0)})</span>
                      </span>
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
                          onClick={() => {
                            setEditingVideo(video);
                            setEditScrubTimeSec(1);
                          }}
                          className="p-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 hover:text-white transition cursor-pointer"
                          title="Edit Video & Ganti Potongan Thumbnail"
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

      {/* Edit Video Modal (With Frame Capture from Uploaded Video) */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-[#150B2A] border border-purple-800/60 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setEditingVideo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Edit className="w-4 h-4 text-purple-400" />
              <span>Edit Video & Potongan Thumbnail</span>
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

              {/* Ambil Potongan Frame dari Video di Modal Edit */}
              {editingVideo.videoUrl && (
                <div className="bg-[#0D061A] border border-emerald-700/50 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Ambil Thumbnail dari Potongan Video Ini:</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCaptureEditScrubFrame}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer transition"
                    >
                      📸 Jadikan Detik Ini ({formatSecToMMSS(editScrubTimeSec)}) Thumbnail
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-purple-900/50">
                      <video
                        ref={editScrubVideoRef}
                        src={editingVideo.videoUrl}
                        muted
                        playsInline
                        crossOrigin="anonymous"
                        onLoadedMetadata={(e) => {
                          setEditVideoDurationSec(e.currentTarget.duration || 10);
                          e.currentTarget.currentTime = Math.min(1.5, (e.currentTarget.duration || 2) / 3);
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <input
                        type="range"
                        min={0}
                        max={Math.max(1, editVideoDurationSec)}
                        step={0.1}
                        value={editScrubTimeSec}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setEditScrubTimeSec(v);
                          if (editScrubVideoRef.current) {
                            editScrubVideoRef.current.currentTime = v;
                          }
                        }}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex items-center gap-2">
                        <img
                          src={editingVideo.thumbnailUrl}
                          alt="Current Thumb"
                          className="w-16 h-10 object-cover rounded border border-emerald-500/60 bg-black shrink-0"
                        />
                        <span className="text-[11px] text-slate-400">
                          Geser slider untuk memilih potongan video lalu klik tombol hijau di atas.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

              <div className="grid grid-cols-3 gap-3">
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Klik Play</label>
                  <input
                    type="number"
                    value={editingVideo.playClicks || 0}
                    onChange={(e) =>
                      setEditingVideo({ ...editingVideo, playClicks: Number(e.target.value) })
                    }
                    className="w-full bg-[#0D061A] border border-[#2b1848] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Dilihat</label>
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
                  className="px-4 py-2 rounded-xl bg-purple-950/40 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-950 cursor-pointer"
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
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
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
