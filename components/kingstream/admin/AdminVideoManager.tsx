'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Link as LinkIcon,
  ExternalLink,
  Copy,
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
  resolveVideoPlayback,
  getSameOriginVideoForCapture,
  getAutoThumbnailFromVideoUrl,
  isPlaceholderThumbnail,
} from '@/lib/kingstream-storage';
import { VideoThumbnail } from '../VideoThumbnail';
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
  const [videoMode, setVideoMode] = useState<'url' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [urlPlayMode, setUrlPlayMode] = useState<'play' | 'direct'>('play');
  const [localVideoPreviewUrl, setLocalVideoPreviewUrl] = useState('');
  const [resolvedCaptureVideoUrl, setResolvedCaptureVideoUrl] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);
  const [videoDurationSec, setVideoDurationSec] = useState<number>(0);
  const [scrubTimeSec, setScrubTimeSec] = useState<number>(1);
  const lastResolvedUrlRef = useRef<string>('');

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

  // Extract 4 frames automatically from an uploaded video OR external video URL (proxied same-origin to avoid CORS)
  const extractFramesFromVideoSource = useCallback(
    (rawSourceUrl: string, silent = false) => {
      const sameOriginSrc =
        rawSourceUrl.startsWith('blob:') ||
        rawSourceUrl.startsWith('/uploads/') ||
        rawSourceUrl.startsWith('/api/')
          ? rawSourceUrl
          : getSameOriginVideoForCapture(rawSourceUrl) ||
            `/api/kingstream/video-proxy?url=${encodeURIComponent(rawSourceUrl)}`;

      setResolvedCaptureVideoUrl(sameOriginSrc);
      setIsGeneratingThumb(true);
      setCapturedFrames([]);

      const tempVideo = document.createElement('video');
      tempVideo.preload = 'auto';
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.src = sameOriginSrc;

      const frames: CapturedFrame[] = [];
      const percentages = [0.12, 0.35, 0.6, 0.82];
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
            const chosen = frames[0];
            setThumbnailUrl(chosen.dataUrl);
            uploadDataUrlAsThumbnail(chosen.dataUrl).then((uploadedUrl) => {
              setThumbnailUrl(uploadedUrl);
            });
            if (!silent) {
              toast.success('Thumbnail otomatis berhasil diambil dari potongan video!');
            }
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
          // Immediately show first captured frame as active thumbnail while remaining frames finish
          if (frames.length === 1) {
            setThumbnailUrl(dataUrl);
          }
        }
        currentIdx += 1;
        seekNext();
      };

      tempVideo.onerror = () => {
        setIsGeneratingThumb(false);
      };

      tempVideo.load();
    },
    []
  );

  // Resolve any external video URL (Videy, MP4, YouTube, Drive, or webpage with og:video / og:image)
  const resolveThumbnailFromVideoUrl = useCallback(
    async (rawUrl: string, silent = false) => {
      const cleaned = rawUrl.trim();
      if (!cleaned) return;

      lastResolvedUrlRef.current = cleaned;
      setIsGeneratingThumb(true);
      setCapturedFrames([]);
      setResolvedCaptureVideoUrl('');

      // Quick local resolution first for YouTube/Drive
      const quickThumb = getAutoThumbnailFromVideoUrl(cleaned);
      if (quickThumb) {
        setThumbnailUrl(quickThumb);
      }

      const resolved = resolveVideoPlayback(cleaned);
      if (resolved.kind === 'native' && resolved.src) {
        extractFramesFromVideoSource(resolved.src, silent);
        return;
      }

      try {
        const res = await fetch(
          `/api/kingstream/video-meta?url=${encodeURIComponent(cleaned)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();

        if (data?.title && !title.trim()) {
          setTitle(String(data.title).slice(0, 140));
        }

        if (data?.directVideoUrl) {
          extractFramesFromVideoSource(data.directVideoUrl, silent);
          return;
        }

        if (data?.thumbnailUrl) {
          setThumbnailUrl(data.thumbnailUrl);
          if (!silent) {
            toast.success('Thumbnail otomatis berhasil diambil dari URL video!');
          }
        } else if (!silent) {
          toast.info('URL video berupa halaman embed tanpa frame langsung. Anda dapat upload gambar thumbnail manual jika diperlukan.');
        }
      } catch {
        // Fallback silently if offline
      } finally {
        setIsGeneratingThumb(false);
      }
    },
    [extractFramesFromVideoSource, title]
  );

  // Auto-resolve thumbnail whenever admin pastes or types an external video URL
  useEffect(() => {
    if (!showUploadForm || videoMode !== 'url') return;
    const trimmed = videoUrl.trim();
    if (!trimmed || trimmed.length < 8) return;
    if (!trimmed.includes('.') && !trimmed.startsWith('/uploads/')) return;
    if (trimmed === lastResolvedUrlRef.current) return;

    const timer = setTimeout(() => {
      resolveThumbnailFromVideoUrl(trimmed, true);
    }, 750);

    return () => clearTimeout(timer);
  }, [showUploadForm, videoMode, videoUrl, resolveThumbnailFromVideoUrl]);

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
      toast.error('Server eksternal membatasi capture frame otomatis. Silakan upload gambar thumbnail manual.');
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

  // File Upload Handlers
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
    } catch {}

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
    setUrlPlayMode('play');

    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      setTitle(cleanName);
    }

    setThumbnailMode('video');
    extractFramesFromVideoSource(objectUrl);

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

  const handleCopyWatchUrl = (video: KingStreamVideo) => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/watch/${video.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success(`URL Video berhasil disalin: ${shareUrl}`);
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isUploadingFile) {
      toast.warning('Mohon tunggu hingga proses unggah file video selesai...');
      return;
    }

    if (!title.trim()) {
      toast.error('Judul video wajib diisi!');
      return;
    }

    if (!videoUrl.trim()) {
      toast.error('Masukkan URL Video atau pilih File Video terlebih dahulu!');
      return;
    }

    let finalThumb =
      thumbnailUrl ||
      capturedFrames[0]?.dataUrl ||
      getAutoThumbnailFromVideoUrl(videoUrl.trim()) ||
      '';

    // Jika URL video masih belum punya thumbnail (misal user langsung klik Simpan tanpa menunggu debounce), tarik metadata sekarang
    if ((!finalThumb || isPlaceholderThumbnail(finalThumb)) && videoUrl.trim().startsWith('http')) {
      try {
        toast.info('Mengambil thumbnail dari URL video...');
        const metaRes = await fetch(
          `/api/kingstream/video-meta?url=${encodeURIComponent(videoUrl.trim())}`,
          { cache: 'no-store' }
        );
        const meta = await metaRes.json();
        if (meta?.thumbnailUrl) {
          finalThumb = meta.thumbnailUrl;
        }
      } catch {}
    }

    if (finalThumb.startsWith('data:image/')) {
      finalThumb = await uploadDataUrlAsThumbnail(finalThumb);
    }

    const newVideo = addVideo({
      title: title.trim(),
      category,
      duration: duration.trim() || '01:00',
      views: Number(views) || 0,
      badge: badge || undefined,
      thumbnailUrl: finalThumb || DEFAULT_FALLBACK_THUMB,
      videoUrl: videoUrl.trim(),
      urlPlayMode,
    });

    toast.success(`Video "${newVideo.title}" berhasil ditayangkan!`);

    // Reset Form completely
    setTitle('');
    setDuration('00:00');
    setViews(0);
    setThumbnailUrl('');
    setVideoUrl('');
    setUrlPlayMode('play');
    setLocalVideoPreviewUrl('');
    setResolvedCaptureVideoUrl('');
    lastResolvedUrlRef.current = '';
    setCapturedFrames([]);
    setShowUploadForm(false);
  };

  // Tarik ulang thumbnail dari URL video untuk video yang sudah ada di tabel atau sedang diedit
  const handleExtractThumbForExistingVideo = async (video: KingStreamVideo, updateInEditModal = false) => {
    if (!video.videoUrl?.trim()) {
      toast.error('URL video kosong');
      return;
    }
    try {
      toast.info(`Mengekstrak thumbnail dari URL "${video.title}"...`);
      const res = await fetch(
        `/api/kingstream/video-meta?url=${encodeURIComponent(video.videoUrl.trim())}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (data?.thumbnailUrl) {
        if (updateInEditModal) {
          setEditingVideo((prev) => (prev ? { ...prev, thumbnailUrl: data.thumbnailUrl } : prev));
        } else {
          updateVideo(video.id, { thumbnailUrl: data.thumbnailUrl });
        }
        toast.success('Thumbnail berhasil diekstrak dari URL video!');
      } else {
        toast.warning('Thumbnail tidak ditemukan di halaman URL tersebut.');
      }
    } catch {
      toast.error('Gagal mengekstrak thumbnail dari URL');
    }
  };

  const handleGenerateSampleVideos = () => {
    const sampleItems = [
      {
        title: 'DJ Goyang Pargoy Viral Terbaru 2026 Full Bass Jedag Jedug',
        category: 'Indo Viral' as VideoCategory,
        duration: '14:20',
        views: 0,
        badge: 'VIRAL',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        urlPlayMode: 'play' as const,
      },
      {
        title: 'Koleksi Video Eksklusif Premium Trending Minggu Ini No Cut',
        category: 'Eksklusif' as VideoCategory,
        duration: '22:15',
        views: 0,
        badge: 'VIP HD',
        thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        urlPlayMode: 'play' as const,
      },
    ];

    sampleItems.forEach((item) => addVideo(item));
    toast.success('2 video contoh berhasil ditambahkan ke landing page!');
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
      urlPlayMode: editingVideo.urlPlayMode || 'play',
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

  const activePreviewResolved = resolveVideoPlayback(localVideoPreviewUrl || videoUrl);
  const activePreviewVideoSrc =
    resolvedCaptureVideoUrl ||
    getSameOriginVideoForCapture(localVideoPreviewUrl || videoUrl) ||
    (activePreviewResolved.kind === 'native' ? activePreviewResolved.src : '');
  const canScrubPreviewVideo = Boolean(activePreviewVideoSrc);

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#130A24] border border-[#2b1848] rounded-2xl p-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-purple-400" />
            <span>Kelola & Upload Video (URL / File)</span>
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
            title="Tambahkan video simulasi"
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
            <span>{showUploadForm ? 'Tutup Form' : 'Upload Video / URL Baru'}</span>
          </button>
        </div>
      </div>

      {/* Upload Video Form Card (Collapsible) */}
      {showUploadForm && (
        <div className="bg-[#150B2A] border border-purple-700/50 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-purple-900/40">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              <span>Upload Video melalui URL atau File Lokal</span>
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">
              ✨ Mendukung Play langsung dari URL maupun Direct ke URL
            </span>
          </div>

          <form onSubmit={handleSubmitUpload} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Sumber Video: URL Video (Play / Direct) atau Upload File */}
              <div className="md:col-span-2 bg-[#0D061A] border-2 border-purple-600/60 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4 text-emerald-400" />
                    <span>1. Sumber Video (Masukkan URL Video atau Upload File) *</span>
                  </label>
                  <div className="flex rounded-lg bg-[#160a2c] p-0.5 border border-purple-900/30">
                    <button
                      type="button"
                      onClick={() => setVideoMode('url')}
                      className={`text-xs px-3 py-1.5 rounded-md transition cursor-pointer ${
                        videoMode === 'url' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'
                      }`}
                    >
                      🔗 Masukkan URL Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMode('upload')}
                      className={`text-xs px-3 py-1.5 rounded-md transition cursor-pointer ${
                        videoMode === 'upload' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'
                      }`}
                    >
                      📁 Upload File Video
                    </button>
                  </div>
                </div>

                {videoMode === 'url' ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="Paste URL Video (cth: https://cdn.videy.co/...mp4, https://videy.co/v?id=..., Doodstream, MP4, dll)"
                        className="flex-1 bg-[#130A24] border border-purple-700/60 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!videoUrl.trim()) {
                            toast.error('Masukkan URL video terlebih dahulu');
                            return;
                          }
                          resolveThumbnailFromVideoUrl(videoUrl.trim(), false);
                          toast.info('Memuat video & mengambil potongan thumbnail dari URL...');
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl cursor-pointer shrink-0 shadow"
                      >
                        📸 Muat & Ambil Frame dari URL
                      </button>
                    </div>

                    {/* Pilihan Mode URL: Play dari URL vs Direct ke URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <label
                        onClick={() => setUrlPlayMode('play')}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          urlPlayMode === 'play'
                            ? 'bg-purple-950/50 border-emerald-500/80 text-white'
                            : 'bg-[#130A24]/60 border-purple-900/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="urlPlayMode"
                          checked={urlPlayMode === 'play'}
                          onChange={() => setUrlPlayMode('play')}
                          className="mt-0.5 accent-emerald-500"
                        />
                        <div>
                          <span className="text-xs font-bold block flex items-center gap-1.5">
                            <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                            <span>Play Video dari URL di Player</span>
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Video diputar langsung di dalam layar player website KingStream (dan klik Play tetap membuka iklan sponsor).
                          </span>
                        </div>
                      </label>

                      <label
                        onClick={() => setUrlPlayMode('direct')}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          urlPlayMode === 'direct'
                            ? 'bg-purple-950/50 border-emerald-500/80 text-white'
                            : 'bg-[#130A24]/60 border-purple-900/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="urlPlayMode"
                          checked={urlPlayMode === 'direct'}
                          onChange={() => setUrlPlayMode('direct')}
                          className="mt-0.5 accent-emerald-500"
                        />
                        <div>
                          <span className="text-xs font-bold block flex items-center gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                            <span>Direct Langsung ke URL Tersebut</span>
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Saat pengunjung mengklik video di halaman depan, langsung membuka / direct ke URL yang Anda masukkan.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileUpload}
                      className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400">
                      Pilih file video (.mp4 / .webm) dari perangkat Anda. Durasi dan potongan thumbnail akan otomatis diambil.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Thumbnail dari Potongan Video / Upload */}
              <div className="md:col-span-2 bg-[#0D061A] border border-emerald-700/50 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-emerald-400" />
                    <span>2. Thumbnail Video (Potongan Video / Upload Gambar / URL)</span>
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
                      <div className="py-5 px-4 text-center border border-dashed border-purple-800/50 rounded-xl text-xs text-slate-400">
                        Masukkan URL video (.mp4 / Videy) lalu klik <strong>&quot;Muat &amp; Ambil Frame dari URL&quot;</strong> atau upload file video pada langkah 1 di atas, atau pilih tab <strong>Upload Gambar Sendiri</strong> jika menggunakan link website eksternal.
                      </div>
                    ) : (
                      <>
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

                        {canScrubPreviewVideo && (
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
                              </div>
                            </div>
                          </div>
                        )}
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
                        Gambar di samping akan tampil sebagai sampul video di halaman depan.
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
              Klik &quot;Upload Video / URL Baru&quot; untuk menambahkan konten.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-900/30 bg-[#0D061A]/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Video & Sumber URL</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Klik Play Button</th>
                  <th className="py-3 px-4">Total Dilihat (Views)</th>
                  <th className="py-3 px-4 text-right">Aksi & Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/20 text-xs">
                {filteredList.map((video) => (
                  <tr key={video.id} className="hover:bg-purple-950/20 transition-colors">
                    {/* Video Info & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-12 shrink-0 rounded-lg overflow-hidden bg-black/60 border border-purple-900/30">
                          <VideoThumbnail
                            video={video}
                            className="w-full h-full object-cover"
                          />
                          {video.badge && (
                            <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-extrabold px-1 rounded">
                              {video.badge}
                            </span>
                          )}
                        </div>
                        <div className="max-w-xs min-w-0">
                          <h4 className="font-semibold text-slate-100 line-clamp-1">{video.title}</h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                video.urlPlayMode === 'direct'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                              }`}
                            >
                              {video.urlPlayMode === 'direct' ? '↗ Direct URL' : '▶ Play Player'}
                            </span>
                            <span className="text-[11px] text-purple-300/80 font-mono truncate max-w-[180px]">
                              {video.videoUrl}
                            </span>
                          </div>
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

                    {/* Aksi Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Extract Thumbnail Button for External URL Videos using placeholder */}
                        {video.videoUrl?.startsWith('http') && isPlaceholderThumbnail(video.thumbnailUrl) && (
                          <button
                            onClick={() => handleExtractThumbForExistingVideo(video, false)}
                            className="px-2 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 hover:text-white border border-amber-700/40 transition cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                            title="Ambil Thumbnail Otomatis dari URL Video Ini"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Ambil Thumb</span>
                          </button>
                        )}

                        {/* Copy Watch URL */}
                        <button
                          onClick={() => handleCopyWatchUrl(video)}
                          className="px-2 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 hover:text-white transition cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                          title="Salin Link Halaman Tonton Video Ini"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin URL</span>
                        </button>

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
                            setEditingVideo({
                              ...video,
                              urlPlayMode: video.urlPlayMode || 'play',
                            });
                            setEditScrubTimeSec(1);
                          }}
                          className="p-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 hover:text-white transition cursor-pointer"
                          title="Edit Video & Sumber URL"
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
              <span>Edit Video & Pengaturan URL</span>
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

              {/* Sumber URL Video & Mode Play/Direct */}
              <div className="bg-[#0D061A] border border-purple-700/50 rounded-xl p-3.5 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    URL Video (Play / Direct URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingVideo.videoUrl}
                      onChange={(e) => setEditingVideo({ ...editingVideo, videoUrl: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 bg-[#130A24] border border-purple-700/60 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                    {editingVideo.videoUrl?.startsWith('http') && (
                      <button
                        type="button"
                        onClick={() => handleExtractThumbForExistingVideo(editingVideo, true)}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer shrink-0 transition"
                        title="Ekstrak Thumbnail dari URL Ini"
                      >
                        📸 Ambil Thumb URL
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingVideo({ ...editingVideo, urlPlayMode: 'play' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      editingVideo.urlPlayMode !== 'direct'
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                        : 'bg-[#130A24] border-purple-900/40 text-slate-400'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play di Player</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingVideo({ ...editingVideo, urlPlayMode: 'direct' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      editingVideo.urlPlayMode === 'direct'
                        ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                        : 'bg-[#130A24] border-purple-900/40 text-slate-400'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Direct ke URL</span>
                  </button>
                </div>
              </div>

              {/* Ambil Potongan Frame dari Video di Modal Edit */}
              {editingVideo.videoUrl && resolveVideoPlayback(editingVideo.videoUrl).kind === 'native' && (
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
                        src={getSameOriginVideoForCapture(editingVideo.videoUrl)}
                        muted
                        playsInline
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
              className="aspect-video w-full bg-black flex items-center justify-center select-none relative"
            >
              {(() => {
                const resolved = resolveVideoPlayback(previewVideo.videoUrl);
                if (resolved.kind === 'native') {
                  return (
                    <video
                      src={resolved.src}
                      controls
                      controlsList="nodownload"
                      onContextMenu={(e) => e.preventDefault()}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  );
                }
                if (resolved.kind === 'embed') {
                  return (
                    <iframe
                      src={resolved.src}
                      title={previewVideo.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
