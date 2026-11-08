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

  const loadData = useCallback(() => {
    setVideos(getStoredVideos());
    setAdConfig(getStoredAdConfig());
    setTelegramConfig(getStoredTelegramConfig());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    // Event listener for storage changes across windows and custom same-window events
    const handleStorageChange = () => {
      loadData();
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
    return created;
  };

  const handleUpdateVideo = (id: string, updates: Partial<KingStreamVideo>) => {
    const updated = updateStoredVideo(id, updates);
    setVideos(getStoredVideos());
    return updated;
  };

  const handleDeleteVideo = (id: string) => {
    const result = deleteStoredVideo(id);
    setVideos(getStoredVideos());
    return result;
  };

  const handleUpdateAdConfig = (config: AdBannerConfig) => {
    saveStoredAdConfig(config);
    setAdConfig(config);
  };

  const handleUpdateTelegramConfig = (config: TelegramConfig) => {
    saveStoredTelegramConfig(config);
    setTelegramConfig(config);
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

