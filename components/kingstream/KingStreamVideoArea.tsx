'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Eye, Clock, X, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { NavItem } from './KingStreamNavbar';
import { useKingStream } from './KingStreamContext';
import { KingStreamVideo, formatViews, formatTimeAgo } from '@/lib/kingstream-storage';

interface KingStreamVideoAreaProps {
  activeCategory: NavItem;
  searchQuery: string;
  itemsPerPage: number;
}

export function KingStreamVideoArea({
  activeCategory,
  searchQuery,
  itemsPerPage,
}: KingStreamVideoAreaProps) {
  const { videos, updateVideo, adConfig } = useKingStream();
  const [selectedVideo, setSelectedVideo] = useState<KingStreamVideo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Filter videos by category and search
  const filteredVideos = videos.filter((video) => {
    const matchCategory =
      activeCategory === 'Home' || video.category.toLowerCase() === activeCategory.toLowerCase();
    const matchSearch =
      !searchQuery ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

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

    // 2. Increment view count di storage
    updateVideo(video.id, { views: (video.views || 0) + 1 });
    setSelectedVideo({ ...video, views: (video.views || 0) + 1 });
    setIsPlaying(true);
  };

  const handlePlayerOverlayPlay = () => {
    // Direct ke iklan juga saat play di dalam player modal diklik
    triggerAdDirect();
    setIsPlaying(true);
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

          {/* Quick link to Admin Upload Dashboard */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Login Admin & Upload Video</span>
            </Link>
          </div>
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
                  <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                    {video.duration || '00:00'}
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
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatTimeAgo(video.createdAt)}</span>
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

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#120824] border border-purple-800/60 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-900/40 bg-[#160b2e]">
              <div className="flex items-center gap-2">
                <span className="bg-purple-900/50 text-purple-300 text-xs px-2.5 py-0.5 rounded-full border border-purple-700/40">
                  {selectedVideo.category}
                </span>
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {selectedVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Screen */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center group/player">
              {selectedVideo.videoUrl &&
              (selectedVideo.videoUrl.endsWith('.mp4') ||
                selectedVideo.videoUrl.endsWith('.webm') ||
                selectedVideo.videoUrl.startsWith('data:video') ||
                selectedVideo.videoUrl.startsWith('blob:')) ? (
                <video
                  src={selectedVideo.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  onPlay={triggerAdDirect}
                />
              ) : selectedVideo.videoUrl &&
                (selectedVideo.videoUrl.includes('youtube.com') ||
                  selectedVideo.videoUrl.includes('youtu.be') ||
                  selectedVideo.videoUrl.includes('player') ||
                  selectedVideo.videoUrl.includes('embed')) ? (
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
              ) : (
                /* Interactive Play Click Overlay */
                <div
                  onClick={handlePlayerOverlayPlay}
                  className="relative w-full h-full flex flex-col items-center justify-center bg-black cursor-pointer select-none"
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
                    <span className="text-[11px] text-purple-300 mt-1 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>Didukung oleh Sponsor Resmi KingStream</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Video Details & Sponsor Ad Notice */}
            <div className="p-4 bg-[#120824] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300 border-t border-purple-900/30">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-purple-400" />
                  {formatViews(selectedVideo.views)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {formatTimeAgo(selectedVideo.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {adConfig.targetUrl && (
                  <button
                    onClick={triggerAdDirect}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-300 hover:text-white transition cursor-pointer text-[11px] font-semibold"
                  >
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Buka Link Iklan Sponsor</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-slate-200 transition cursor-pointer text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
