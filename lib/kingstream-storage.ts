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
  urlPlayMode?: 'play' | 'direct';
  adRedirectUrl?: string;
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
  adblockPopupEnabled?: boolean;
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
  adblockPopupEnabled: true,
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
  channelName: 'Channel Tele Stream18+',
  channelUrl: 'https://t.me/Stream18Official',
  channelHandle: '@Stream18Official',
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

export interface ResolvedVideoSource {
  kind: 'native' | 'embed' | 'none';
  src: string;
  originalUrl: string;
}

/**
 * Resolves any uploaded file path, direct video file URL (.mp4/.webm/.mov),
 * Videy link (videy.co/v?id=...), YouTube, Google Drive, Doodstream, Streamtape,
 * or general external video URL into a playable source.
 */
export function resolveVideoPlayback(rawUrl?: string): ResolvedVideoSource {
  if (!rawUrl || !rawUrl.trim()) {
    return { kind: 'none', src: '', originalUrl: '' };
  }

  let url = rawUrl.trim();

  // Local uploads, blob, or data URLs -> native HTML5 <video>
  if (
    url.startsWith('/uploads/') ||
    url.startsWith('blob:') ||
    url.startsWith('data:video')
  ) {
    return { kind: 'native', src: url, originalUrl: url };
  }

  // Ensure external URLs have protocol
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = 'https://' + url;
  }

  // Videy.co share URL -> convert to direct MP4 CDN URL so it plays natively in <video>!
  try {
    if (url.includes('videy.co/v')) {
      const parsed = new URL(url);
      const videyId = parsed.searchParams.get('id');
      if (videyId) {
        return {
          kind: 'native',
          src: `https://cdn.videy.co/${videyId}.mp4`,
          originalUrl: url,
        };
      }
    }
  } catch {}

  // Check if URL path or query points to a direct video file (.mp4, .webm, .mov, .ogg, .m3u8)
  const cleanUrlWithoutHash = url.split('#')[0].split('?')[0].toLowerCase();
  if (
    cleanUrlWithoutHash.endsWith('.mp4') ||
    cleanUrlWithoutHash.endsWith('.webm') ||
    cleanUrlWithoutHash.endsWith('.mov') ||
    cleanUrlWithoutHash.endsWith('.ogg') ||
    cleanUrlWithoutHash.endsWith('.m3u8') ||
    url.toLowerCase().includes('.mp4?') ||
    url.toLowerCase().includes('.webm?') ||
    url.toLowerCase().includes('cdn.videy.co/')
  ) {
    return { kind: 'native', src: url, originalUrl: url };
  }

  // YouTube watch / youtu.be / shorts -> embed URL
  try {
    if (url.includes('youtube.com/watch')) {
      const parsed = new URL(url);
      const v = parsed.searchParams.get('v');
      if (v) {
        return {
          kind: 'embed',
          src: `https://www.youtube.com/embed/${v}?autoplay=1`,
          originalUrl: url,
        };
      }
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
      if (id) {
        return {
          kind: 'embed',
          src: `https://www.youtube.com/embed/${id}?autoplay=1`,
          originalUrl: url,
        };
      }
    }
    if (url.includes('youtube.com/shorts/')) {
      const id = url.split('youtube.com/shorts/')[1]?.split(/[?#]/)[0];
      if (id) {
        return {
          kind: 'embed',
          src: `https://www.youtube.com/embed/${id}?autoplay=1`,
          originalUrl: url,
        };
      }
    }
  } catch {}

  // Google Drive file link -> preview embed
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/file\/d\/([^/]+)/);
    if (match?.[1]) {
      return {
        kind: 'embed',
        src: `https://drive.google.com/file/d/${match[1]}/preview`,
        originalUrl: url,
      };
    }
  }

  // Doodstream / Streamtape / general /d/ -> /e/ conversion
  if ((url.includes('dood') || url.includes('ds2play') || url.includes('d000')) && url.includes('/d/')) {
    return {
      kind: 'embed',
      src: url.replace('/d/', '/e/'),
      originalUrl: url,
    };
  }
  if (url.includes('streamtape.com/v/')) {
    return {
      kind: 'embed',
      src: url.replace('streamtape.com/v/', 'streamtape.com/e/'),
      originalUrl: url,
    };
  }

  // Any other http/https URL -> embed in iframe + allow direct open
  return {
    kind: 'embed',
    src: url,
    originalUrl: url,
  };
}

export function isPlaceholderThumbnail(thumbUrl?: string): boolean {
  if (!thumbUrl || !thumbUrl.trim()) return true;
  const trimmed = thumbUrl.trim();
  return (
    trimmed.includes('photo-1516450360452-9312f5e86fc7') ||
    trimmed === '/images/video-placeholder.png'
  );
}

/**
 * Derives an automatic image thumbnail URL for YouTube / Google Drive video URLs.
 */
export function getAutoThumbnailFromVideoUrl(rawUrl?: string): string | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('youtu.be')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    if (host.includes('youtube.com')) {
      let id: string | null = null;
      if (parsed.pathname.startsWith('/shorts/')) {
        id = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || null;
      } else if (parsed.pathname.startsWith('/embed/')) {
        id = parsed.pathname.split('/embed/')[1]?.split('/')[0] || null;
      } else {
        id = parsed.searchParams.get('v');
      }
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/file\/d\/([^/]+)/);
      if (match?.[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
      }
    }
  } catch {}

  return null;
}

/**
 * Returns a same-origin URL suitable for <video> + <canvas> frame capture without CORS errors.
 */
export function getSameOriginVideoForCapture(rawUrl?: string): string {
  const resolved = resolveVideoPlayback(rawUrl);
  if (resolved.kind !== 'native' || !resolved.src) return '';
  if (
    resolved.src.startsWith('/uploads/') ||
    resolved.src.startsWith('blob:') ||
    resolved.src.startsWith('data:video')
  ) {
    return resolved.src;
  }
  if (resolved.src.startsWith('http://') || resolved.src.startsWith('https://')) {
    return `/api/kingstream/video-proxy?url=${encodeURIComponent(resolved.src)}`;
  }
  return resolved.src;
}



