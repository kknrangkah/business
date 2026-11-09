'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Play,
  Eye,
  Clock,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  Film,
  Timer,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { NavItem } from './KingStreamNavbar';
import { useKingStream } from './KingStreamContext';
import { KingStreamVideo, formatViews, formatTimeAgo } from '@/lib/kingstream-storage';

interface KingStreamVideoAreaProps {
  activeCategory: NavItem;
  searchQuery: string;
  itemsPerPage: number;
}

// Fallback high quality recommendation catalogue if database has few videos
const DEFAULT_RECOMMENDATIONS: KingStreamVideo[] = [
  {
    id: 'rec-1',
    title: 'DJ Goyang Pargoy Viral Terbaru 2026 Full Bass Jedag Jedug',
    category: 'Indo Viral',
    duration: '14:20',
    views: 420000,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    badge: 'VIRAL',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'rec-2',
    title: 'Koleksi Video Eksklusif Premium Trending Minggu Ini No Cut',
    category: 'Eksklusif',
    duration: '22:15',
    views: 1250000,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    badge: 'VIP HD',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'rec-3',
    title: 'Momen Tak Terduga Live Streaming Paling Heboh Se-Indonesia',
    category: 'Trending',
    duration: '08:45',
    views: 890000,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    badge: 'HOT',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'rec-4',
    title: 'Top 10 Video Terpopuler Pilihan Netizen Rating Tertinggi',
    category: 'Populer',
    duration: '18:50',
    views: 2450000,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    badge: 'TOP 1',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'rec-5',
    title: 'Bocoran Konten Viral FYP TikTok Hari Ini Paling Banyak Dicari',
    category: 'Indo Viral',
    duration: '06:12',
    views: 540000,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    badge: 'VIRAL',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: 'rec-6',
    title: 'Behind the Scenes & Klip Eksklusif Khusus Member VIP',
    category: 'Eksklusif',
    duration: '25:40',
    views: 780000,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    badge: 'VIP',
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
];

function formatSeconds(sec: number): string {
  if (isNaN(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

export function KingStreamVideoArea({
  activeCategory,
  searchQuery,
  itemsPerPage,
}: KingStreamVideoAreaProps) {
  const { videos, recordVideoPlay, recordPlayClickOnly, adConfig } = useKingStream();
  const [selectedVideo, setSelectedVideo] = useState<KingStreamVideo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(0);
  const [recSortMode, setRecSortMode] = useState<'all' | 'most_viewed' | 'most_popular'>('all');
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Filter & sort videos by category and search
  const filteredVideos = (() => {
    const searchMatched = videos.filter((video) => {
      return (
        !searchQuery ||
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    if (activeCategory === 'Home') {
      return searchMatched;
    }

    const categoryMatched = searchMatched.filter(
      (video) => video.category.toLowerCase() === activeCategory.toLowerCase()
    );

    // If 'Populer' or 'Trending' is selected and no video explicitly has that category, fallback to sorting all videos by views
    if (
      (activeCategory === 'Populer' || activeCategory === 'Trending') &&
      categoryMatched.length === 0
    ) {
      return [...searchMatched].sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    if (activeCategory === 'Populer' || activeCategory === 'Trending') {
      return [...categoryMatched].sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    if (activeCategory === 'Terbaru') {
      return [...categoryMatched].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return categoryMatched;
  })();

  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage) || 1;
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Direct ke iklan function
  const triggerAdDirect = () => {
    if (adConfig && adConfig.directAdOnPlay !== false && adConfig.targetUrl) {
      let targetUrl = adConfig.targetUrl.trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      if (adConfig.directAdMode === 'same_tab') {
        window.location.href = targetUrl;
      } else {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handlePlayVideo = (video: KingStreamVideo, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    // 1. Direct ke link iklan sponsor/promo saat play diklik
    triggerAdDirect();

    // 2. Increment view count & play button click count secara real-time di server & storage
    const nextViews = (Number(video.views) || 0) + 1;
    const nextPlayClicks = (Number(video.playClicks) || 0) + 1;
    recordVideoPlay(video.id);
    setSelectedVideo({
      ...video,
      views: nextViews,
      playClicks: nextPlayClicks,
    });
    setCurrentTime(0);

    // Scroll to top of modal if opened
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePlayerOverlayPlay = () => {
    if (selectedVideo) {
      const nextPlayClicks = (Number(selectedVideo.playClicks) || 0) + 1;
      recordPlayClickOnly(selectedVideo.id);
      setSelectedVideo({ ...selectedVideo, playClicks: nextPlayClicks });
    }
    triggerAdDirect();
  };

  // Get recommended videos for selected video (Sorted by Most Viewed & Most Popular)
  const getRecommendations = () => {
    if (!selectedVideo) return [];

    const isPopularTag = (v: KingStreamVideo) =>
      v.category === 'Populer' ||
      v.category === 'Trending' ||
      ['POPULER', 'TOP 1', 'VIRAL', 'HOT'].includes((v.badge || '').toUpperCase());

    const sortList = (list: KingStreamVideo[]) => {
      return [...list].sort((a, b) => {
        if (recSortMode === 'most_popular') {
          const popA = isPopularTag(a) ? 1 : 0;
          const popB = isPopularTag(b) ? 1 : 0;
          if (popB !== popA) return popB - popA;
          return (b.views || 0) - (a.views || 0);
        }
        if (recSortMode === 'most_viewed') {
          return (b.views || 0) - (a.views || 0);
        }
        // Default ('all'): Combine Most Viewed & Most Popular
        const viewDiff = (b.views || 0) - (a.views || 0);
        if (viewDiff !== 0) return viewDiff;
        return (isPopularTag(b) ? 1 : 0) - (isPopularTag(a) ? 1 : 0);
      });
    };

    // Filter other uploaded videos and sort them by views & popularity
    const otherUploadedVideos = sortList(videos.filter((v) => v.id !== selectedVideo.id));

    // Fill with default popular catalog if fewer than 4 uploaded videos exist
    const fallbackSorted = sortList(
      DEFAULT_RECOMMENDATIONS.filter(
        (rec) =>
          rec.id !== selectedVideo.id &&
          !otherUploadedVideos.some((v) => v.title.toLowerCase() === rec.title.toLowerCase())
      )
    );

    const combined = [...otherUploadedVideos, ...fallbackSorted];
    return sortList(combined).slice(0, 4);
  };

  // If there are no videos in storage matching search / category
  if (videos.length === 0) {
    return (
      <div className="w-full">
        {/* Exact empty state matching user screenshot */}
        <div className="py-28 sm:py-36 text-center flex flex-col items-center justify-center">
          <p className="text-slate-400 text-sm sm:text-base font-normal tracking-wide">
            Belum ada video yang ditampilkan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-12 animate-in fade-in duration-300">
      {filteredVideos.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-slate-400 text-sm">
            Tidak ditemukan video dengan filter &quot;{activeCategory}&quot;{' '}
            {searchQuery ? `atau pencarian "${searchQuery}"` : ''}.
          </p>
        </div>
      ) : (
        <>
          {/* Video Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {paginatedVideos.map((video) => (
              <div
                key={video.id}
                onClick={(e) => handlePlayVideo(video, e)}
                className="group bg-[#130A24] border border-[#2b1848] hover:border-purple-600/60 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/40 cursor-pointer flex flex-col"
                title={`Putar video & Buka sponsor: ${video.title}`}
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/50">
                  <img
                    src={video.thumbnailUrl || '/images/video-placeholder.png'}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80';
                    }}
                  />

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <span>{video.duration || '00:00'}</span>
                  </div>

                  {/* Optional Tag Badge */}
                  {video.badge && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow">
                      {video.badge}
                    </div>
                  )}

                  {/* Category Pill */}
                  <div className="absolute top-2 right-2 bg-[#130A24]/85 text-purple-300 text-[10px] font-medium px-2 py-0.5 rounded-full border border-purple-800/40">
                    {video.category}
                  </div>

                  {/* Play Icon Overlay - Clicking triggers direct to ad */}
                  <div className="absolute inset-0 bg-purple-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-purple-950 transform scale-90 group-hover:scale-105 transition-all">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-100 line-clamp-2 group-hover:text-purple-300 transition-colors leading-snug">
                    {video.title}
                  </h4>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatViews(video.views || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-300 font-mono">
                      <Timer className="w-3.5 h-3.5" />
                      <span>{video.duration || '00:00'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg text-xs bg-[#130A24] border border-[#2b1848] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-900/30 transition cursor-pointer"
              >
                Sebelumnya
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentPage === idx + 1
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900'
                      : 'bg-[#130A24] border border-[#2b1848] text-slate-300 hover:bg-purple-900/30'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg text-xs bg-[#130A24] border border-[#2b1848] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-900/30 transition cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </>
      )}

      {/* Video Player Modal with Duration & Recommendations */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div
            ref={modalScrollRef}
            className="bg-[#120824] border border-purple-800/60 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-900/40 bg-[#160b2e] sticky top-0 z-20 backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                <span className="bg-purple-900/50 text-purple-300 text-xs px-2.5 py-0.5 rounded-full border border-purple-700/40 font-medium shrink-0">
                  {selectedVideo.category}
                </span>

                {/* Prominent Duration Badge in Header */}
                <span className="inline-flex items-center gap-1.5 bg-purple-950/70 text-purple-300 border border-purple-800/60 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold shrink-0">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Durasi: {selectedVideo.duration || '00:00'}</span>
                </span>

                <h3 className="text-sm font-bold text-white line-clamp-1 max-w-md">
                  {selectedVideo.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedVideo(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0 ml-2"
                title="Tutup Player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Screen - Natural Ratio without Squashing/Cropping */}
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="relative w-full bg-black flex items-center justify-center shrink-0 overflow-hidden select-none"
            >
              {/* Overlay Duration Pill (Top Right) */}
              <div className="absolute top-3 right-3 z-10 bg-black/85 backdrop-blur-md border border-purple-900/50 text-white text-xs font-mono font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg pointer-events-none">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>{selectedVideo.duration || '12:45'}</span>
              </div>

              {selectedVideo.videoUrl &&
              (selectedVideo.videoUrl.endsWith('.mp4') ||
                selectedVideo.videoUrl.endsWith('.webm') ||
                selectedVideo.videoUrl.startsWith('/uploads/') ||
                selectedVideo.videoUrl.startsWith('data:video') ||
                selectedVideo.videoUrl.startsWith('blob:')) ? (
                <video
                  src={selectedVideo.videoUrl}
                  controls
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                  autoPlay
                  className="w-full max-h-[62vh] object-contain"
                  onPlay={triggerAdDirect}
                  onTimeUpdate={(e) => {
                    const videoEl = e.currentTarget;
                    setCurrentTime(videoEl.currentTime);
                    if (videoEl.duration && !isNaN(videoEl.duration)) {
                      setVideoDurationSeconds(videoEl.duration);
                    }
                  }}
                />
              ) : selectedVideo.videoUrl &&
                (selectedVideo.videoUrl.includes('youtube.com') ||
                  selectedVideo.videoUrl.includes('youtu.be') ||
                  selectedVideo.videoUrl.includes('player') ||
                  selectedVideo.videoUrl.includes('embed')) ? (
                <div className="aspect-video w-full max-h-[62vh]">
                  <iframe
                    src={
                      selectedVideo.videoUrl.includes('watch?v=')
                        ? selectedVideo.videoUrl.replace('watch?v=', 'embed/')
                        : selectedVideo.videoUrl
                    }
                    title={selectedVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                /* Interactive Play Click Overlay */
                <div
                  onClick={handlePlayerOverlayPlay}
                  className="relative w-full h-[340px] sm:h-[400px] flex flex-col items-center justify-center bg-black cursor-pointer select-none"
                >
                  <img
                    src={selectedVideo.thumbnailUrl}
                    alt={selectedVideo.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-35 blur-xs"
                  />
                  <div className="relative z-10 flex flex-col items-center text-center p-6">
                    <button
                      onClick={handlePlayerOverlayPlay}
                      className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:scale-110 active:scale-95 text-white flex items-center justify-center mb-3 shadow-2xl shadow-purple-950 transition-all cursor-pointer"
                    >
                      <Play className="w-8 h-8 fill-current ml-1" />
                    </button>
                    <span className="text-sm font-bold text-white">
                      Klik Play untuk Memutar Video
                    </span>
                    <span className="text-xs font-mono text-purple-300 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Durasi Video: {selectedVideo.duration || '12:45'}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Video Details & Duration Tracker Bar (Without Sponsor Button) */}
            <div className="p-4 bg-[#120824] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300 border-b border-purple-900/30">
              <div className="flex flex-wrap items-center gap-4">
                {/* Real-time Time & Duration */}
                <span className="flex items-center gap-1.5 text-purple-300 font-mono font-semibold bg-purple-950/50 px-2.5 py-1 rounded-lg border border-purple-800/40">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    {currentTime > 0
                      ? `${formatSeconds(currentTime)} / ${selectedVideo.duration || formatSeconds(videoDurationSeconds)}`
                      : `Durasi: ${selectedVideo.duration || '00:00'}`}
                  </span>
                </span>

                {/* Views */}
                <span className="flex items-center gap-1 text-slate-300">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span>{formatViews(selectedVideo.views)} tayangan</span>
                </span>

                {/* Time Ago */}
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Diupload {formatTimeAgo(selectedVideo.createdAt)}</span>
                </span>
              </div>

              {/* Close Button Only */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="px-4 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800/70 text-slate-200 transition cursor-pointer text-xs font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Rekomendasi Video Section (Paling Banyak Dilihat & Paling Populer) */}
            <div className="p-4 sm:p-5 bg-[#0e061a]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    Rekomendasi Video Terkait
                  </h4>
                  <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-700/40 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Paling Banyak Dilihat & Populer</span>
                  </span>
                </div>

                {/* Filter Mode Pills */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRecSortMode('all')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
                      recSortMode === 'all'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-[#150B2A] border border-[#2b1848] text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecSortMode('most_viewed')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg transition cursor-pointer font-medium flex items-center gap-1 ${
                      recSortMode === 'most_viewed'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-[#150B2A] border border-[#2b1848] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Paling Banyak Dilihat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecSortMode('most_popular')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg transition cursor-pointer font-medium flex items-center gap-1 ${
                      recSortMode === 'most_popular'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-[#150B2A] border border-[#2b1848] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flame className="w-3 h-3" />
                    <span>Paling Populer</span>
                  </button>
                </div>
              </div>

              {/* Recommendations Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {getRecommendations().map((rec, index) => (
                  <div
                    key={rec.id}
                    onClick={(e) => handlePlayVideo(rec, e)}
                    className="group bg-[#150B2A] border border-[#2b1848] hover:border-purple-600/60 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-950/50 cursor-pointer flex flex-col"
                  >
                    {/* Thumbnail with duration & rank */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                      <img
                        src={rec.thumbnailUrl}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80';
                        }}
                      />

                      {/* Prominent Duration Badge */}
                      <div className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 text-purple-400" />
                        <span>{rec.duration || '00:00'}</span>
                      </div>

                      {/* Rank + Popularity Badge */}
                      <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase shadow flex items-center gap-1">
                        <span>#{index + 1}</span>
                        <span>{rec.badge || 'POPULER'}</span>
                      </div>

                      {/* Category Pill */}
                      <div className="absolute top-1.5 right-1.5 bg-[#130A24]/90 text-purple-300 text-[8px] font-semibold px-1.5 py-0.5 rounded border border-purple-800/40">
                        {rec.category}
                      </div>

                      {/* Play hover overlay */}
                      <div className="absolute inset-0 bg-purple-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <h5 className="text-[11px] font-semibold text-slate-100 line-clamp-2 group-hover:text-purple-300 transition-colors leading-tight">
                        {rec.title}
                      </h5>

                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <Eye className="w-3 h-3" />
                          <span>{formatViews(rec.views)}</span>
                        </span>
                        <span className="font-mono text-purple-300">{rec.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
