import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import {
  KingStreamVideo,
  VideoCategory,
  AdBannerConfig,
  TelegramConfig,
  DEFAULT_AD_CONFIG,
  DEFAULT_TELEGRAM_CONFIG,
} from '@/lib/kingstream-storage';

const JSON_DB_PATH = path.join(process.cwd(), 'data', 'kingstream-db.json');

interface JsonDbShape {
  videos: KingStreamVideo[];
  adConfig: Partial<AdBannerConfig>;
  telegramConfig: Partial<TelegramConfig>;
}

// =============================================================================
// JSON Fallback / Mirror Helpers
// =============================================================================

export function readJsonDb(): JsonDbShape {
  try {
    if (!fs.existsSync(JSON_DB_PATH)) {
      return { videos: [], adConfig: DEFAULT_AD_CONFIG, telegramConfig: DEFAULT_TELEGRAM_CONFIG };
    }
    const raw = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      videos: Array.isArray(parsed.videos) ? parsed.videos : [],
      adConfig: parsed.adConfig || DEFAULT_AD_CONFIG,
      telegramConfig: parsed.telegramConfig || DEFAULT_TELEGRAM_CONFIG,
    };
  } catch (error) {
    console.error('Error reading kingstream-db.json:', error);
    return { videos: [], adConfig: DEFAULT_AD_CONFIG, telegramConfig: DEFAULT_TELEGRAM_CONFIG };
  }
}

export function writeJsonDb(data: JsonDbShape): boolean {
  try {
    const dir = path.dirname(JSON_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing kingstream-db.json:', error);
    return false;
  }
}

// =============================================================================
// PostgreSQL Connection Pool & Auto-Migration
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __kingstreamPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __kingstreamPgInitPromise: Promise<boolean> | undefined;
}

function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (!global.__kingstreamPgPool) {
    global.__kingstreamPgPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    global.__kingstreamPgPool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err.message);
    });
  }

  return global.__kingstreamPgPool;
}

function mapRowToVideo(row: any): KingStreamVideo {
  return {
    id: String(row.id),
    title: row.title || '',
    category: (row.category || 'Trending') as VideoCategory,
    videoUrl: row.video_url || '',
    thumbnailUrl: row.thumbnail_url || '',
    duration: row.duration || '00:00',
    views: Number(row.views) || 0,
    playClicks: Number(row.play_clicks) || 0,
    badge: row.badge || undefined,
    description: row.description || '',
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at || new Date().toISOString()),
  };
}

export async function ensurePgInitialized(): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;

  if (global.__kingstreamPgInitPromise) {
    return global.__kingstreamPgInitPromise;
  }

  global.__kingstreamPgInitPromise = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS videos (
          id VARCHAR(120) PRIMARY KEY,
          title TEXT NOT NULL,
          thumbnail_url TEXT NOT NULL DEFAULT '',
          video_url TEXT DEFAULT '',
          duration VARCHAR(32) NOT NULL DEFAULT '00:00',
          views BIGINT NOT NULL DEFAULT 0,
          play_clicks BIGINT NOT NULL DEFAULT 0,
          upload_date VARCHAR(64) NOT NULL DEFAULT 'Baru saja',
          category VARCHAR(100) NOT NULL DEFAULT 'Trending',
          badge VARCHAR(100) DEFAULT '',
          badge_type VARCHAR(32) DEFAULT 'default',
          rank INTEGER,
          is_featured BOOLEAN NOT NULL DEFAULT FALSE,
          ad_redirect_url TEXT DEFAULT '',
          description TEXT DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ad_banners (
          id VARCHAR(120) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          target_url TEXT NOT NULL,
          banner_image_url TEXT DEFAULT '',
          badge_text VARCHAR(100) DEFAULT 'PROMO',
          title_text TEXT DEFAULT '',
          subtitle_text TEXT DEFAULT '',
          cta_text VARCHAR(100) DEFAULT 'KLIK DI SINI',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS site_settings (
          setting_key VARCHAR(100) PRIMARY KEY,
          setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password_plain VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'superadmin',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        INSERT INTO admin_users (username, password_plain, role)
        VALUES ('admin', 'admin123', 'superadmin')
        ON CONFLICT (username) DO NOTHING;
      `);

      // Seed initial data from kingstream-db.json if PostgreSQL tables are empty
      const countRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM videos');
      const currentCount = countRes.rows[0]?.cnt || 0;
      const jsonDb = readJsonDb();

      if (currentCount === 0 && jsonDb.videos.length > 0) {
        for (const v of jsonDb.videos) {
          await pool.query(
            `INSERT INTO videos (
              id, title, thumbnail_url, video_url, duration, views, play_clicks,
              category, badge, description, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, $10, $11, NOW()
            ) ON CONFLICT (id) DO NOTHING`,
            [
              v.id,
              v.title || '',
              v.thumbnailUrl || '',
              v.videoUrl || '',
              v.duration || '00:00',
              Number(v.views) || 0,
              Number(v.playClicks) || 0,
              v.category || 'Trending',
              v.badge || '',
              v.description || '',
              v.createdAt ? new Date(v.createdAt) : new Date(),
            ]
          );
        }
      }

      // Seed site_settings if empty
      const settingsRes = await pool.query('SELECT setting_key FROM site_settings');
      const existingKeys = new Set(settingsRes.rows.map((r: any) => r.setting_key));

      if (!existingKeys.has('adConfig')) {
        const mergedAd = { ...DEFAULT_AD_CONFIG, ...jsonDb.adConfig };
        await pool.query(
          `INSERT INTO site_settings (setting_key, setting_value, updated_at)
           VALUES ('adConfig', $1::jsonb, NOW())
           ON CONFLICT (setting_key) DO NOTHING`,
          [JSON.stringify(mergedAd)]
        );
      }

      if (!existingKeys.has('telegramConfig')) {
        const mergedTele = { ...DEFAULT_TELEGRAM_CONFIG, ...jsonDb.telegramConfig };
        await pool.query(
          `INSERT INTO site_settings (setting_key, setting_value, updated_at)
           VALUES ('telegramConfig', $1::jsonb, NOW())
           ON CONFLICT (setting_key) DO NOTHING`,
          [JSON.stringify(mergedTele)]
        );
      }

      return true;
    } catch (error) {
      console.warn('PostgreSQL unavailable, falling back to JSON database:', (error as Error).message);
      global.__kingstreamPgInitPromise = undefined;
      return false;
    }
  })();

  return global.__kingstreamPgInitPromise;
}

// =============================================================================
// Video Database Operations
// =============================================================================

export async function getAllVideosFromDb(): Promise<KingStreamVideo[]> {
  const isPgReady = await ensurePgInitialized();
  const pool = getPool();

  if (isPgReady && pool) {
    try {
      const res = await pool.query('SELECT * FROM videos ORDER BY created_at DESC');
      return res.rows.map(mapRowToVideo);
    } catch (error) {
      console.error('Error querying PostgreSQL videos:', error);
    }
  }

  return readJsonDb().videos;
}

export async function upsertVideoInDb(body: Partial<KingStreamVideo>): Promise<{
  video: KingStreamVideo;
  videos: KingStreamVideo[];
}> {
  const videoId = body.id || `ks-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newVideo: KingStreamVideo = {
    id: videoId,
    title: body.title || 'Untitled Video',
    category: (body.category || 'Trending') as VideoCategory,
    videoUrl: body.videoUrl || '',
    thumbnailUrl: body.thumbnailUrl || '',
    duration: body.duration || '00:00',
    views: Number(body.views) || 0,
    playClicks: Number(body.playClicks) || 0,
    badge: body.badge,
    description: body.description || '',
    createdAt: body.createdAt || new Date().toISOString(),
  };

  const isPgReady = await ensurePgInitialized();
  const pool = getPool();

  if (isPgReady && pool) {
    try {
      await pool.query(
        `INSERT INTO videos (
          id, title, thumbnail_url, video_url, duration, views, play_clicks,
          category, badge, description, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          thumbnail_url = EXCLUDED.thumbnail_url,
          video_url = EXCLUDED.video_url,
          duration = EXCLUDED.duration,
          views = EXCLUDED.views,
          play_clicks = EXCLUDED.play_clicks,
          category = EXCLUDED.category,
          badge = EXCLUDED.badge,
          description = EXCLUDED.description,
          updated_at = NOW()`,
        [
          newVideo.id,
          newVideo.title,
          newVideo.thumbnailUrl,
          newVideo.videoUrl || '',
          newVideo.duration,
          newVideo.views,
          newVideo.playClicks || 0,
          newVideo.category,
          newVideo.badge || '',
          newVideo.description || '',
          new Date(newVideo.createdAt),
        ]
      );

      const allVideos = await getAllVideosFromDb();
      const jsonDb = readJsonDb();
      jsonDb.videos = allVideos;
      writeJsonDb(jsonDb);

      return { video: newVideo, videos: allVideos };
    } catch (error) {
      console.error('Error upserting video in PostgreSQL:', error);
    }
  }

  // Fallback to JSON
  const db = readJsonDb();
  const currentVideos = db.videos || [];
  const existingIndex = currentVideos.findIndex((v) => v.id === videoId);
  let updatedVideos: KingStreamVideo[] = [];
  if (existingIndex !== -1) {
    currentVideos[existingIndex] = { ...currentVideos[existingIndex], ...newVideo };
    updatedVideos = currentVideos;
  } else {
    updatedVideos = [newVideo, ...currentVideos];
  }
  db.videos = updatedVideos;
  writeJsonDb(db);

  return { video: newVideo, videos: updatedVideos };
}

export async function updateVideoInDb(
  id: string,
  updates: Partial<KingStreamVideo>,
  incrementViews?: number,
  incrementPlayClicks?: number
): Promise<{ video: KingStreamVideo | null; videos: KingStreamVideo[] }> {
  const isPgReady = await ensurePgInitialized();
  const pool = getPool();

  if (isPgReady && pool) {
    try {
      const existingRes = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
      if (existingRes.rows.length === 0) {
        return { video: null, videos: await getAllVideosFromDb() };
      }

      const current = mapRowToVideo(existingRes.rows[0]);
      const nextViews =
        typeof incrementViews === 'number'
          ? (Number(current.views) || 0) + incrementViews
          : updates.views !== undefined
          ? Number(updates.views) || 0
          : Number(current.views) || 0;

      const nextPlayClicks =
        typeof incrementPlayClicks === 'number'
          ? (Number(current.playClicks) || 0) + incrementPlayClicks
          : updates.playClicks !== undefined
          ? Number(updates.playClicks) || 0
          : Number(current.playClicks) || 0;

      const merged: KingStreamVideo = {
        ...current,
        ...updates,
        id,
        views: nextViews,
        playClicks: nextPlayClicks,
      };

      const updateRes = await pool.query(
        `UPDATE videos SET
          title = $2,
          thumbnail_url = $3,
          video_url = $4,
          duration = $5,
          views = CASE WHEN $10::bigint IS NOT NULL THEN views + $10::bigint ELSE $6::bigint END,
          play_clicks = CASE WHEN $11::bigint IS NOT NULL THEN play_clicks + $11::bigint ELSE $7::bigint END,
          category = $8,
          badge = $9,
          description = $12,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [
          id,
          merged.title,
          merged.thumbnailUrl,
          merged.videoUrl || '',
          merged.duration,
          merged.views,
          merged.playClicks || 0,
          merged.category,
          merged.badge || '',
          typeof incrementViews === 'number' ? incrementViews : null,
          typeof incrementPlayClicks === 'number' ? incrementPlayClicks : null,
          merged.description || '',
        ]
      );

      const updatedVideo = mapRowToVideo(updateRes.rows[0]);
      const allVideos = await getAllVideosFromDb();

      // Mirror to JSON backup
      const jsonDb = readJsonDb();
      jsonDb.videos = allVideos;
      writeJsonDb(jsonDb);

      return { video: updatedVideo, videos: allVideos };
    } catch (error) {
      console.error('Error updating video in PostgreSQL:', error);
    }
  }

  // Fallback to JSON
  const db = readJsonDb();
  const videos = db.videos || [];
  const index = videos.findIndex((v) => v.id === id);
  if (index === -1) {
    return { video: null, videos };
  }

  const current = videos[index];
  const currentViews = Number(current.views) || 0;
  const currentPlayClicks = Number(current.playClicks) || 0;

  const updatedVideo: KingStreamVideo = {
    ...current,
    ...updates,
    views:
      typeof incrementViews === 'number'
        ? currentViews + incrementViews
        : updates.views !== undefined
        ? Number(updates.views) || 0
        : currentViews,
    playClicks:
      typeof incrementPlayClicks === 'number'
        ? currentPlayClicks + incrementPlayClicks
        : updates.playClicks !== undefined
        ? Number(updates.playClicks) || 0
        : currentPlayClicks,
  };

  videos[index] = updatedVideo;
  db.videos = videos;
  writeJsonDb(db);

  return { video: updatedVideo, videos };
}

export async function deleteVideoFromDb(id: string): Promise<KingStreamVideo[]> {
  const isPgReady = await ensurePgInitialized();
  const pool = getPool();

  if (isPgReady && pool) {
    try {
      await pool.query('DELETE FROM videos WHERE id = $1', [id]);
      const allVideos = await getAllVideosFromDb();
      const jsonDb = readJsonDb();
      jsonDb.videos = allVideos;
      writeJsonDb(jsonDb);
      return allVideos;
    } catch (error) {
      console.error('Error deleting video from PostgreSQL:', error);
    }
  }

  const db = readJsonDb();
  const videos = (db.videos || []).filter((v) => v.id !== id);
  db.videos = videos;
  writeJsonDb(db);
  return videos;
}

// =============================================================================
// Ads & Telegram Settings Operations
// =============================================================================

export async function getSettingsFromDb(): Promise<{
  adConfig: AdBannerConfig;
  telegramConfig: TelegramConfig;
}> {
  const isPgReady = await ensurePgInitialized();
  const pool = getPool();

  if (isPgReady && pool) {
    try {
      const res = await pool.query(
        `SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('adConfig', 'telegramConfig')`
      );
      let adConfig: AdBannerConfig = { ...DEFAULT_AD_CONFIG };
      let telegramConfig: TelegramConfig = { ...DEFAULT_TELEGRAM_CONFIG };

      for (const row of res.rows) {
        if (row.setting_key === 'adConfig' && row.setting_value) {
          adConfig = { ...DEFAULT_AD_CONFIG, ...row.setting_value };
        }
        if (row.setting_key === 'telegramConfig' && row.setting_value) {
          telegramConfig = { ...DEFAULT_TELEGRAM_CONFIG, ...row.setting_value };
        }
      }

      return { adConfig, telegramConfig };
    } catch (error) {
      console.error('Error querying settings from PostgreSQL:', error);
    }
  }

  const jsonDb = readJsonDb();
  return {
    adConfig: { ...DEFAULT_AD_CONFIG, ...jsonDb.adConfig },
    telegramConfig: { ...DEFAULT_TELEGRAM_CONFIG, ...jsonDb.telegramConfig },
  };
}

export async function updateSettingsInDb(payload: {
  adConfig?: Partial<AdBannerConfig>;
  telegramConfig?: Partial<TelegramConfig>;
}): Promise<{
  adConfig: AdBannerConfig;
  telegramConfig: TelegramConfig;
}> {
  const current = await getSettingsFromDb();
  const nextAdConfig: AdBannerConfig = payload.adConfig
    ? { ...current.adConfig, ...payload.adConfig }
    : current.adConfig;
  const nextTelegramConfig: TelegramConfig = payload.telegramConfig
    ? { ...current.telegramConfig, ...payload.telegramConfig }
    : current.telegramConfig;

  const isPgReady = await ensurePgInitialized();
  const pool = getPool();

  if (isPgReady && pool) {
    try {
      if (payload.adConfig) {
        await pool.query(
          `INSERT INTO site_settings (setting_key, setting_value, updated_at)
           VALUES ('adConfig', $1::jsonb, NOW())
           ON CONFLICT (setting_key) DO UPDATE SET
             setting_value = EXCLUDED.setting_value,
             updated_at = NOW()`,
          [JSON.stringify(nextAdConfig)]
        );

        // Sync ad_banners table for SQL visibility
        if (Array.isArray(nextAdConfig.adItems)) {
          await pool.query('DELETE FROM ad_banners');
          for (let i = 0; i < nextAdConfig.adItems.length; i++) {
            const item = nextAdConfig.adItems[i];
            await pool.query(
              `INSERT INTO ad_banners (
                id, name, target_url, banner_image_url, badge_text,
                title_text, subtitle_text, cta_text, is_active, sort_order, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
              [
                item.id,
                item.title || `Banner #${i + 1}`,
                item.targetUrl || '',
                item.imageUrl || '',
                item.tagline || 'PROMO',
                item.title || '',
                item.subtitle || '',
                item.buttonText || 'KLIK DI SINI',
                item.isActive !== false,
                i,
              ]
            );
          }
        }
      }

      if (payload.telegramConfig) {
        await pool.query(
          `INSERT INTO site_settings (setting_key, setting_value, updated_at)
           VALUES ('telegramConfig', $1::jsonb, NOW())
           ON CONFLICT (setting_key) DO UPDATE SET
             setting_value = EXCLUDED.setting_value,
             updated_at = NOW()`,
          [JSON.stringify(nextTelegramConfig)]
        );
      }
    } catch (error) {
      console.error('Error updating settings in PostgreSQL:', error);
    }
  }

  // Mirror to JSON backup
  const jsonDb = readJsonDb();
  jsonDb.adConfig = nextAdConfig;
  jsonDb.telegramConfig = nextTelegramConfig;
  writeJsonDb(jsonDb);

  return { adConfig: nextAdConfig, telegramConfig: nextTelegramConfig };
}

export async function getDatabaseStatus() {
  const isPgReady = await ensurePgInitialized();
  const pool = getPool();

  if (isPgReady && pool) {
    try {
      const statsRes = await pool.query(`
        SELECT
          COUNT(*)::int AS total_videos,
          COALESCE(SUM(views), 0)::bigint AS total_views,
          COALESCE(SUM(play_clicks), 0)::bigint AS total_play_clicks
        FROM videos
      `);
      const row = statsRes.rows[0] || {};
      return {
        engine: 'PostgreSQL 16',
        connected: true,
        totalVideos: Number(row.total_videos) || 0,
        totalViews: Number(row.total_views) || 0,
        totalPlayClicks: Number(row.total_play_clicks) || 0,
      };
    } catch {}
  }

  const jsonDb = readJsonDb();
  const videos = jsonDb.videos || [];
  return {
    engine: 'JSON File (Fallback)',
    connected: true,
    totalVideos: videos.length,
    totalViews: videos.reduce((acc, v) => acc + (Number(v.views) || 0), 0),
    totalPlayClicks: videos.reduce((acc, v) => acc + (Number(v.playClicks) || 0), 0),
  };
}
