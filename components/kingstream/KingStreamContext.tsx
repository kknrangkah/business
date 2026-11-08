'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  addVideo: (video: Omit<KingStreamVideo, 'id' | 'createdAt'>) => KingStreamVideo;
  updateVideo: (id: string, updates: Partial<KingStreamVideo>) => KingStreamVideo | null;
  deleteVideo: (id: string) => boolean;
  updateAdConfig: (config: AdBannerConfig) => void;
  updateTelegramConfig: (config: TelegramConfig) => void;
  refreshData: () => void;
}

const KingStreamContext = createContext<KingStreamContextType | undefined>(undefined);

export function KingStreamProvider({ children }: { children: React.ReactNode }) {
  const [videos, setVideos] = useState<KingStreamVideo[]>([]);
  const [adConfig, setAdConfig] = useState<AdBannerConfig>(DEFAULT_AD_CONFIG);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(DEFAULT_TELEGRAM_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Sync data from both localStorage and server API
  const loadData = useCallback(async () => {
    // 1. Instant local read for zero delay
    const localVideos = getStoredVideos();
    const localAd = getStoredAdConfig();
    const localTele = getStoredTelegramConfig();

    setVideos(localVideos);
    setAdConfig(localAd);
    setTelegramConfig(localTele);
    setIsLoading(false);

    // 2. Fetch from server API in background
    try {
      const [videoRes, adRes] = await Promise.all([
        fetch('/api/kingstream/videos'),
        fetch('/api/kingstream/ads'),
      ]);

      if (videoRes.ok) {
        const videoData = await videoRes.json();
        if (Array.isArray(videoData.videos) && videoData.videos.length > 0) {
          // Deduplicate by ID
          const seen = new Set();
          const unique = videoData.videos.filter((v: KingStreamVideo) => {
            if (seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          });
          setVideos(unique);
          saveStoredVideos(unique);
        } else if (localVideos.length > 0) {
          // Sync local videos to server if server is empty
          localVideos.forEach((v) => {
            fetch('/api/kingstream/videos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(v),
            }).catch(() => {});
          });
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
    } catch (e) {
      // Offline fallback: keep local storage
    }
  }, []);

  useEffect(() => {
    loadData();

    // Event listener for storage changes across windows and custom same-window events
    const handleStorageChange = () => {
      setVideos(getStoredVideos());
      setAdConfig(getStoredAdConfig());
      setTelegramConfig(getStoredTelegramConfig());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kingstream-storage-change', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kingstream-storage-change', handleStorageChange);
    };
  }, [loadData]);

  const handleAddVideo = (videoData: Omit<KingStreamVideo, 'id' | 'createdAt'>) => {
    const created = addStoredVideo(videoData);
    setVideos(getStoredVideos());

    // Sync to server API
    fetch('/api/kingstream/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created),
    }).catch(() => {});

    return created;
  };

  const handleUpdateVideo = (id: string, updates: Partial<KingStreamVideo>) => {
    const updated = updateStoredVideo(id, updates);
    setVideos(getStoredVideos());

    // Sync to server API
    fetch('/api/kingstream/videos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    }).catch(() => {});

    return updated;
  };

  const handleDeleteVideo = (id: string) => {
    const result = deleteStoredVideo(id);
    setVideos(getStoredVideos());

    // Sync to server API
    fetch(`/api/kingstream/videos?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});

    return result;
  };

  const handleUpdateAdConfig = (config: AdBannerConfig) => {
    saveStoredAdConfig(config);
    setAdConfig(config);

    // Sync to server API
    fetch('/api/kingstream/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adConfig: config }),
    }).catch(() => {});
  };

  const handleUpdateTelegramConfig = (config: TelegramConfig) => {
    saveStoredTelegramConfig(config);
    setTelegramConfig(config);

    // Sync to server API
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
        addVideo: handleAddVideo,
        updateVideo: handleUpdateVideo,
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
