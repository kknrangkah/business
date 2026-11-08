'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  Eye,
  Clock,
  ArrowLeft,
  Share2,
  Check,
  Send,
  Zap,
  ExternalLink,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { KingStreamNavbar, NavItem } from '@/components/kingstream/KingStreamNavbar';
import { KingStreamFooter } from '@/components/kingstream/KingStreamFooter';
import { KingStreamFloatingButton } from '@/components/kingstream/KingStreamFloatingButton';
import { KingStreamProvider, useKingStream } from '@/components/kingstream/KingStreamContext';
import { KingStreamVideo, formatViews, formatTimeAgo } from '@/lib/kingstream-storage';
import { toast } from 'sonner';

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

function WatchContent({ videoId }: { videoId: string }) {
  const router = useRouter();
  const { videos, updateVideo, adConfig } = useKingStream();
  const [activeTab, setActiveTab] = useState<NavItem>('Home');
  const [currentTime, setCurrentTime] = useState(0);
  const [copied, setCopied] = useState(false);

  // Find video by ID or fallback
  const currentVideo =
    videos.find((v) => v.id === videoId) ||
    videos[0] ||
    null;

  useEffect(() => {
    if (currentVideo) {
      updateVideo(currentVideo.id, { views: (currentVideo.views || 0) + 1 });
    }
  }, [currentVideo?.id]);

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

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link video berhasil disalin!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== 'undefined' && currentVideo) {
      const text = encodeURIComponent(
        `Nonton video viral "${currentVideo.title}" di KingStream: ${window.location.href}`
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    }
  };

  const handleShareTelegram = () => {
    if (typeof window !== 'undefined' && currentVideo) {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(currentVideo.title);
      window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    }
  };

  function formatSeconds(sec: number): string {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Recommendations: exclude current video and sort by Most Viewed & Most Popular
  const recommendations = videos
    .filter((v) => v.id !== currentVideo?.id)
    .sort((a, b) => {
      const viewDiff = (b.views || 0) - (a.views || 0);
      if (viewDiff !== 0) return viewDiff;
      const isPopA = a.category === 'Populer' || a.category === 'Trending' ? 1 : 0;
      const isPopB = b.category === 'Populer' || b.category === 'Trending' ? 1 : 0;
      return isPopB - isPopA;
    })
    .slice(0, 8);

  if (!currentVideo) {
    return (
      <div className="min-h-screen bg-[#0D061A] text-slate-100 flex flex-col justify-between">
        <KingStreamNavbar activeTab={activeTab} onSelectTab={(t) => router.push('/')} />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <p className="text-slate-400 text-sm">Video tidak ditemukan atau belum diunggah.</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 text-xs text-purple-300 hover:text-white bg-purple-950/40 px-4 py-2 rounded-xl border border-purple-800/40 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
        <KingStreamFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D061A] text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white font-sans antialiased">
      {/* Navbar */}
      <KingStreamNavbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          router.push('/');
        }}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-purple-950/20 hover:bg-purple-900/30 border border-purple-900/30 px-3 py-1.5 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda KingStream</span>
          </Link>
        </div>

        {/* Video Player Theater */}
        <div className="bg-[#120824] border border-purple-800/50 rounded-2xl overflow-hidden shadow-2xl">
          {/* Screen - Natural Ratio */}
          <div
            onContextMenu={(e) => e.preventDefault()}
            className="relative w-full bg-black flex items-center justify-center shrink-0 overflow-hidden select-none"
          >
            {/* Overlay Duration Pill */}
            <div className="absolute top-3 right-3 z-10 bg-black/85 backdrop-blur-md border border-purple-900/50 text-white text-xs font-mono font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg pointer-events-none">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{currentVideo.duration || '12:45'}</span>
            </div>

            {currentVideo.videoUrl &&
              (currentVideo.videoUrl.endsWith('.mp4') ||
                currentVideo.videoUrl.endsWith('.webm') ||
                currentVideo.videoUrl.startsWith('/uploads/') ||
                currentVideo.videoUrl.startsWith('data:video') ||
                currentVideo.videoUrl.startsWith('blob:')) ? (
              <video
                src={currentVideo.videoUrl}
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                autoPlay
                className="w-full max-h-[65vh] object-contain"
                onPlay={triggerAdDirect}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              />
            ) : currentVideo.videoUrl &&
              (currentVideo.videoUrl.includes('youtube.com') ||
                currentVideo.videoUrl.includes('youtu.be') ||
                currentVideo.videoUrl.includes('embed')) ? (
              <div className="aspect-video w-full max-h-[65vh]">
                <iframe
                  src={
                    currentVideo.videoUrl.includes('watch?v=')
                      ? currentVideo.videoUrl.replace('watch?v=', 'embed/')
                      : currentVideo.videoUrl
                  }
                  title={currentVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div
                onClick={triggerAdDirect}
                className="relative w-full h-[360px] sm:h-[440px] flex flex-col items-center justify-center bg-black cursor-pointer select-none"
              >
                <img
                  src={currentVideo.thumbnailUrl}
                  alt={currentVideo.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-35 blur-xs"
                />
                <div className="relative z-10 flex flex-col items-center text-center p-6">
                  <button className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mb-3 shadow-2xl shadow-purple-950">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </button>
                  <span className="text-sm font-bold text-white">Klik Play untuk Memutar Video</span>
                  <span className="text-xs font-mono text-purple-300 mt-1">
                    Durasi: {currentVideo.duration || '12:45'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Video Metadata & Share Bar */}
          <div className="p-4 sm:p-5 bg-[#160b2e] border-t border-purple-900/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-purple-900/60 text-purple-300 text-xs px-2.5 py-0.5 rounded-full border border-purple-700/50 font-medium">
                    {currentVideo.category}
                  </span>
                  {currentVideo.badge && (
                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      {currentVideo.badge}
                    </span>
                  )}
                  {/* Duration Badge */}
                  <span className="bg-purple-950/70 text-purple-300 border border-purple-800/50 text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Durasi: {currentVideo.duration || '00:00'}</span>
                  </span>
                </div>

                <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">
                  {currentVideo.title}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-purple-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {currentTime > 0
                        ? `${formatSeconds(currentTime)} / ${currentVideo.duration || '00:00'}`
                        : currentVideo.duration}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>{formatViews(currentVideo.views)} tayangan</span>
                  </span>
                  <span>•</span>
                  <span>Diupload {formatTimeAgo(currentVideo.createdAt)}</span>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-300 hover:text-white transition text-xs font-semibold cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleShareTelegram}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/40 text-sky-300 hover:text-white transition text-xs font-semibold cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 text-purple-300 hover:text-white transition text-xs font-semibold cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Link'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sponsor Banner Below Player */}
        {adConfig.isActive && adConfig.targetUrl && (
          <div className="my-6">
            <div
              onClick={triggerAdDirect}
              className="group cursor-pointer border-2 border-[#10b981] rounded-2xl overflow-hidden bg-[#0c1619] shadow-[0_0_18px_rgba(16,185,129,0.3)] hover:shadow-[0_0_24px_rgba(16,185,129,0.55)] transition-all duration-300 max-w-xl mx-auto flex items-stretch select-none"
            >
              <div className="relative w-[130px] sm:w-[150px] shrink-0 bg-[#0d161a] overflow-hidden">
                <img
                  src={adConfig.imageUrl || '/images/promo-model.png'}
                  alt="Promo Model"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="flex-1 py-3 px-3 sm:px-4 flex flex-col items-center justify-center text-center bg-gradient-to-r from-[#0c1619] via-[#0f1d22] to-[#0c1619]">
                <h3 className="text-white font-black text-sm sm:text-base tracking-wider">
                  {adConfig.title || 'BONUS SPESIAL'}
                </h3>
                <p className="text-slate-100 font-bold text-[11px] sm:text-xs mt-0.5">
                  {adConfig.subtitle || 'ANTI ZONK HARI INI'}
                </p>
                <span className="mt-1.5 inline-block bg-[#dc2626] group-hover:bg-[#ef4444] text-white text-[10px] font-black px-3 py-0.5 rounded uppercase">
                  {adConfig.buttonText || 'KLIK PROMO AKTIF'}
                </span>
                <div className="flex items-center gap-1 mt-1.5 text-[10px] font-black text-[#10b981]">
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>{adConfig.tagline || 'PROMO VIP RESMI'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Rekomendasi Video Terkait
                </h2>
              </div>
              <span className="text-xs text-slate-400">Koleksi Viral Terpopuler</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => {
                    triggerAdDirect();
                    router.push(`/watch/${rec.id}`);
                  }}
                  className="group bg-[#130A24] border border-[#2b1848] hover:border-purple-600/60 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/40 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                    <img
                      src={rec.thumbnailUrl}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Prominent Duration Badge */}
                    <div className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-400" />
                      <span>{rec.duration || '00:00'}</span>
                    </div>

                    {rec.badge && (
                      <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        {rec.badge}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-purple-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <h4 className="text-xs font-semibold text-slate-100 line-clamp-2 group-hover:text-purple-300 transition-colors">
                      {rec.title}
                    </h4>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{formatViews(rec.views)}</span>
                      <span className="font-mono text-purple-300">{rec.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Telegram Floating Widget */}
      <KingStreamFloatingButton />

      {/* Footer */}
      <KingStreamFooter />
    </div>
  );
}

export default function WatchPage({ params }: WatchPageProps) {
  const resolvedParams = use(params);

  return (
    <KingStreamProvider>
      <WatchContent videoId={resolvedParams.id} />
    </KingStreamProvider>
  );
}
