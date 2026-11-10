'use client';

export type VideoCategory = 'Indo Viral' | 'Trending' | 'Eksklusif' | 'Terbaru' | 'Populer';

export interface KingStreamVideo {
  id: string;
  title: string;
  category: VideoCategory;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  views: number;
  playClicks?: number;
  badge?: string;
  createdAt: string;
  description?: string;
}

export interface AdBannerItem {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  targetUrl: string;
  imageUrl: string;
  tagline: string;
  isActive: boolean;
}

export interface AdBannerConfig {
  title: string;
  subtitle: string;
  buttonText: string;
  targetUrl: string;
  imageUrl: string;
  tagline: string;
  isActive: boolean;
  openInNewTab: boolean;
  playerAdEnabled?: boolean;
  directAdOnPlay: boolean;
  directAdMode: 'new_tab' | 'same_tab';
  rotationIntervalSeconds?: number;
  adItems?: AdBannerItem[];
}

export interface TelegramConfig {
  channelName: string;
  channelUrl: string;
  channelHandle: string;
}

// Default initial ad banner configuration matching the user's design
export const DEFAULT_AD_CONFIG: AdBannerConfig = {
  title: 'BONUS SPESIAL',
  subtitle: 'ANTI ZONK HARI INI',
  buttonText: 'KLIK PROMO AKTIF',
  targetUrl: 'https://t.me/KingStreamOfficial',
  imageUrl: '/images/promo-model.png',
  tagline: 'PROMO VIP RESMI',
  isActive: true,
  openInNewTab: true,
  playerAdEnabled: true,
  directAdOnPlay: true,
  directAdMode: 'new_tab',
  rotationIntervalSeconds: 5,
  adItems: [
    {
      id: 'ad-default-1',
      title: 'BONUS SPESIAL',
      subtitle: 'ANTI ZONK HARI INI',
      buttonText: 'KLIK PROMO AKTIF',
      targetUrl: 'https://t.me/KingStreamOfficial',
      imageUrl: '/images/promo-model.png',
      tagline: 'PROMO VIP RESMI',
      isActive: true,
    },
  ],
};

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  channelName: 'Channel Tele KingStream',
  channelUrl: 'https://t.me/KingStreamOfficial',
  channelHandle: '@KingStreamOfficial',
};

const STORAGE_KEYS = {
  VIDEOS: 'kingstream_videos_v1',
  AD_CONFIG: 'kingstream_ad_config_v1',
  TELEGRAM_CONFIG: 'kingstream_telegram_config_v1',
  ADMIN_AUTH: 'kingstream_admin_auth_v1',
};

// Safe localStorage getter
function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

// Safe localStorage setter
function safeSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // Dispatch custom event so other components in the same tab update immediately
    window.dispatchEvent(new CustomEvent('kingstream-storage-change', { detail: { key } }));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

/* ─────────────────────────────────────────────
   Video Operations
───────────────────────────────────────────── */
export function getStoredVideos(): KingStreamVideo[] {
  return safeGet<KingStreamVideo[]>(STORAGE_KEYS.VIDEOS, []);
}

export function saveStoredVideos(videos: KingStreamVideo[]): void {
  safeSet(STORAGE_KEYS.VIDEOS, videos);
}

export function addStoredVideo(
  videoData: Omit<KingStreamVideo, 'id' | 'createdAt'>
): KingStreamVideo {
  const current = getStoredVideos();
  const newVideo: KingStreamVideo = {
    ...videoData,
    id: `ks-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newVideo, ...current];
  saveStoredVideos(updated);
  return newVideo;
}

export function updateStoredVideo(
  id: string,
  updates: Partial<KingStreamVideo>
): KingStreamVideo | null {
  const current = getStoredVideos();
  const index = current.findIndex((v) => v.id === id);
  if (index === -1) return null;

  const updatedVideo = { ...current[index], ...updates };
  current[index] = updatedVideo;
  saveStoredVideos([...current]);
  return updatedVideo;
}

export function deleteStoredVideo(id: string): boolean {
  const current = getStoredVideos();
  const filtered = current.filter((v) => v.id !== id);
  if (filtered.length === current.length) return false;
  saveStoredVideos(filtered);
  return true;
}

/* ─────────────────────────────────────────────
   Ad Configuration Operations & Rotation Helpers
───────────────────────────────────────────── */
export function getActiveAdItems(adConfig: AdBannerConfig): AdBannerItem[] {
  if (Array.isArray(adConfig?.adItems) && adConfig.adItems.length > 0) {
    const activeList = adConfig.adItems.filter(
      (item) => item && item.isActive !== false && item.targetUrl?.trim()
    );
    if (activeList.length > 0) {
      return activeList;
    }
  }
  return [
    {
      id: 'ad-fallback-primary',
      title: adConfig?.title || 'BONUS SPESIAL',
      subtitle: adConfig?.subtitle || 'ANTI ZONK HARI INI',
      buttonText: adConfig?.buttonText || 'KLIK PROMO AKTIF',
      targetUrl: adConfig?.targetUrl || 'https://t.me/KingStreamOfficial',
      imageUrl: adConfig?.imageUrl || '/images/promo-model.png',
      tagline: adConfig?.tagline || 'PROMO VIP RESMI',
      isActive: adConfig?.isActive !== false,
    },
  ];
}

export function getNextRotatingAdUrl(adConfig: AdBannerConfig): string {
  const activeItems = getActiveAdItems(adConfig);
  if (activeItems.length === 0) {
    return adConfig?.targetUrl || '';
  }
  if (typeof window === 'undefined') {
    return activeItems[0].targetUrl;
  }
  try {
    const rotKey = 'kingstream_ad_rotation_idx_v1';
    const rawIdx = window.localStorage.getItem(rotKey);
    const currentIdx = rawIdx ? parseInt(rawIdx, 10) || 0 : 0;
    const picked = activeItems[currentIdx % activeItems.length];
    window.localStorage.setItem(rotKey, String((currentIdx + 1) % activeItems.length));
    return picked.targetUrl;
  } catch {
    return activeItems[0].targetUrl;
  }
}

export function getStoredAdConfig(): AdBannerConfig {
  return safeGet<AdBannerConfig>(STORAGE_KEYS.AD_CONFIG, DEFAULT_AD_CONFIG);
}

export function saveStoredAdConfig(config: AdBannerConfig): void {
  safeSet(STORAGE_KEYS.AD_CONFIG, config);
}

/* ─────────────────────────────────────────────
   Telegram Configuration Operations
───────────────────────────────────────────── */
export function getStoredTelegramConfig(): TelegramConfig {
  return safeGet<TelegramConfig>(STORAGE_KEYS.TELEGRAM_CONFIG, DEFAULT_TELEGRAM_CONFIG);
}

export function saveStoredTelegramConfig(config: TelegramConfig): void {
  safeSet(STORAGE_KEYS.TELEGRAM_CONFIG, config);
}

/* ─────────────────────────────────────────────
   Admin Authentication
───────────────────────────────────────────── */
export interface AdminUser {
  username: string;
  name: string;
  role: string;
  token: string;
  loginTime: string;
}

export function getAdminSession(): AdminUser | null {
  return safeGet<AdminUser | null>(STORAGE_KEYS.ADMIN_AUTH, null);
}

export function setAdminSession(user: AdminUser): void {
  safeSet(STORAGE_KEYS.ADMIN_AUTH, user);
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  window.dispatchEvent(new CustomEvent('kingstream-storage-change', { detail: { key: STORAGE_KEYS.ADMIN_AUTH } }));
}

export function formatViews(count: number): string {
  const safe = Number(count) || 0;
  if (safe >= 1000000) {
    return `${(safe / 1000000).toFixed(1)}M views`;
  }
  if (safe >= 1000) {
    return `${(safe / 1000).toFixed(0)}K views`;
  }
  return `${safe} views`;
}

export function formatNumber(count: number): string {
  return (Number(count) || 0).toLocaleString('id-ID');
}

export function formatTimeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari yang lalu`;
}

