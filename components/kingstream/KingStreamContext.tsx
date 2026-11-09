'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  KingStreamVideo,
  AdBannerConfig,
  TelegramConfig,
  getStoredVideos,
  saveStoredVideos,
  addStoredVideo,
  updateStoredVideo,
  deleteStoredVideo,
  getStoredAdConfig,
  saveStoredAdConfig,
  getStoredTelegramConfig,
  saveStoredTelegramConfig,
  DEFAULT_AD_CONFIG,
  DEFAULT_TELEGRAM_CONFIG,
} from '@/lib/kingstream-storage';

interface KingStreamContextType {
  videos: KingStreamVideo[];
  adConfig: AdBannerConfig;
  telegramConfig: TelegramConfig;
  isLoading: boolean;
  lastSyncedAt: number;
  addVideo: (video: Omit<KingStreamVideo, 'id' | 'createdAt'>) => KingStreamVideo;
  updateVideo: (id: string, updates: Partial<KingStreamVideo>) => KingStreamVideo | null;
  recordVideoPlay: (id: string) => void;
  recordPlayClickOnly: (id: string) => void;
  deleteVideo: (id: string) => boolean;
  updateAdConfig: (config: AdBannerConfig) => void;
  updateTelegramConfig: (config: TelegramConfig) => void;
  refreshData: () => void;
}

const KingStreamContext = createContext<KingStreamContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'kingstream_realtime_sync_v1';

export function KingStreamProvider({ children }: { children: React.ReactNode }) {
  const [videos, setVideos] = useState<KingStreamVideo[]>([]);
  const [adConfig, setAdConfig] = useState<AdBannerConfig>(DEFAULT_AD_CONFIG);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(DEFAULT_TELEGRAM_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(Date.now());
  const bcRef = useRef<BroadcastChannel | null>(null);

  const broadcastUpdate = useCallback(() => {
    try {
      bcRef.current?.postMessage({ type: 'SYNC_NOW', timestamp: Date.now() });
    } catch {}
  }, []);

  // Sync videos only (lightweight real-time poll)
  const syncVideosFromServer = useCallback(async () => {
    try {
      const videoRes = await fetch(`/api/kingstream/videos?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (videoRes.ok) {
        const videoData = await videoRes.json();
        if (Array.isArray(videoData.videos)) {
          const seen = new Set<string>();
          const unique = videoData.videos.filter((v: KingStreamVideo) => {
            if (seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          });
          setVideos(unique);
          saveStoredVideos(unique);
          setLastSyncedAt(Date.now());
        }
      }
    } catch {
      // keep existing state if offline
    }
  }, []);

  // Full initial load (videos + ads + telegram)
  const loadData = useCallback(async () => {
    const localVideos = getStoredVideos();
    const localAd = getStoredAdConfig();
    const localTele = getStoredTelegramConfig();

    setVideos(localVideos);
    setAdConfig(localAd);
    setTelegramConfig(localTele);
    setIsLoading(false);

    try {
      const [videoRes, adRes] = await Promise.all([
        fetch(`/api/kingstream/videos?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/kingstream/ads?t=${Date.now()}`, { cache: 'no-store' }),
      ]);

      if (videoRes.ok) {
        const videoData = await videoRes.json();
        if (Array.isArray(videoData.videos)) {
          const seen = new Set<string>();
          const unique = videoData.videos.filter((v: KingStreamVideo) => {
            if (seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          });
          setVideos(unique);
          saveStoredVideos(unique);
          setLastSyncedAt(Date.now());
        }
      }

      if (adRes.ok) {
        const adData = await adRes.json();
        if (adData.adConfig && Object.keys(adData.adConfig).length > 0) {
          const mergedAd = { ...DEFAULT_AD_CONFIG, ...adData.adConfig };
          setAdConfig(mergedAd);
          saveStoredAdConfig(mergedAd);
        }
        if (adData.telegramConfig && Object.keys(adData.telegramConfig).length > 0) {
          const mergedTele = { ...DEFAULT_TELEGRAM_CONFIG, ...adData.telegramConfig };
          setTelegramConfig(mergedTele);
          saveStoredTelegramConfig(mergedTele);
        }
      }
    } catch {
      // Offline fallback: keep local storage
    }
  }, []);

  useEffect(() => {
    loadData();

    // Setup BroadcastChannel for instant cross-tab real-time updates
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.onmessage = () => {
          syncVideosFromServer();
        };
        bcRef.current = bc;
      } catch {}
    }

    // Real-time polling interval (every 2 seconds) so views & playClicks update live
    const pollInterval = setInterval(() => {
      syncVideosFromServer();
    }, 2000);

    const handleStorageChange = () => {
      setVideos(getStoredVideos());
      setAdConfig(getStoredAdConfig());
      setTelegramConfig(getStoredTelegramConfig());
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        syncVideosFromServer();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kingstream-storage-change', handleStorageChange);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(pollInterval);
      try {
        bcRef.current?.close();
      } catch {}
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kingstream-storage-change', handleStorageChange);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [loadData, syncVideosFromServer]);

  const handleAddVideo = (videoData: Omit<KingStreamVideo, 'id' | 'createdAt'>) => {
    const created = addStoredVideo({
      ...videoData,
      views: Number(videoData.views) || 0,
      playClicks: Number(videoData.playClicks) || 0,
    });
    setVideos(getStoredVideos());

    fetch('/api/kingstream/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created),
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.videos)) {
          setVideos(data.videos);
          saveStoredVideos(data.videos);
        }
        broadcastUpdate();
      })
      .catch(() => {});

    return created;
  };

  const handleUpdateVideo = (id: string, updates: Partial<KingStreamVideo>) => {
    const updated = updateStoredVideo(id, updates);
    setVideos(getStoredVideos());

    fetch('/api/kingstream/videos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.videos)) {
          setVideos(data.videos);
          saveStoredVideos(data.videos);
        }
        broadcastUpdate();
      })
      .catch(() => {});

    return updated;
  };

  // Atomic real-time increment for both Views (+1) and Play Button Click (+1)
  const handleRecordVideoPlay = useCallback(
    (id: string) => {
      // Optimistic instant update in current tab
      setVideos((prev) => {
        const next = prev.map((v) =>
          v.id === id
            ? {
                ...v,
                views: (Number(v.views) || 0) + 1,
                playClicks: (Number(v.playClicks) || 0) + 1,
              }
            : v
        );
        saveStoredVideos(next);
        return next;
      });

      // Atomic server increment
      fetch('/api/kingstream/videos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          incrementViews: 1,
          incrementPlayClicks: 1,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data?.videos)) {
            setVideos(data.videos);
            saveStoredVideos(data.videos);
            setLastSyncedAt(Date.now());
          }
          broadcastUpdate();
        })
        .catch(() => {});
    },
    [broadcastUpdate]
  );

  // Atomic real-time increment for Play Button Click (+1)
  const handleRecordPlayClickOnly = useCallback(
    (id: string) => {
      setVideos((prev) => {
        const next = prev.map((v) =>
          v.id === id
            ? {
                ...v,
                playClicks: (Number(v.playClicks) || 0) + 1,
              }
            : v
        );
        saveStoredVideos(next);
        return next;
      });

      fetch('/api/kingstream/videos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          incrementPlayClicks: 1,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data?.videos)) {
            setVideos(data.videos);
            saveStoredVideos(data.videos);
            setLastSyncedAt(Date.now());
          }
          broadcastUpdate();
        })
        .catch(() => {});
    },
    [broadcastUpdate]
  );

  const handleDeleteVideo = (id: string) => {
    const result = deleteStoredVideo(id);
    setVideos(getStoredVideos());

    fetch(`/api/kingstream/videos?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.videos)) {
          setVideos(data.videos);
          saveStoredVideos(data.videos);
        }
        broadcastUpdate();
      })
      .catch(() => {});

    return result;
  };

  const handleUpdateAdConfig = (config: AdBannerConfig) => {
    saveStoredAdConfig(config);
    setAdConfig(config);

    fetch('/api/kingstream/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adConfig: config }),
    }).catch(() => {});
  };

  const handleUpdateTelegramConfig = (config: TelegramConfig) => {
    saveStoredTelegramConfig(config);
    setTelegramConfig(config);

    fetch('/api/kingstream/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramConfig: config }),
    }).catch(() => {});
  };

  return (
    <KingStreamContext.Provider
      value={{
        videos,
        adConfig,
        telegramConfig,
        isLoading,
        lastSyncedAt,
        addVideo: handleAddVideo,
        updateVideo: handleUpdateVideo,
        recordVideoPlay: handleRecordVideoPlay,
        recordPlayClickOnly: handleRecordPlayClickOnly,
        deleteVideo: handleDeleteVideo,
        updateAdConfig: handleUpdateAdConfig,
        updateTelegramConfig: handleUpdateTelegramConfig,
        refreshData: loadData,
      }}
    >
      {children}
    </KingStreamContext.Provider>
  );
}

export function useKingStream() {
  const context = useContext(KingStreamContext);
  if (!context) {
    throw new Error('useKingStream must be used within a KingStreamProvider');
  }
  return context;
}
