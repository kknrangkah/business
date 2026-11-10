-- =============================================================================
-- KingStream PostgreSQL Database Schema (init.sql)
-- =============================================================================

-- 1. Tabel Videos (Menyimpan daftar video, views real-time, dan klik play button)
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

CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_views ON videos(views DESC);
CREATE INDEX IF NOT EXISTS idx_videos_play_clicks ON videos(play_clicks DESC);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- 2. Tabel Ad Banners (Menyimpan daftar multi-link & banner iklan berganti-ganti)
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

-- 3. Tabel Site Settings (Menyimpan konfigurasi global: adConfig & telegramConfig)
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabel Admin Users (Menyimpan akun admin dashboard)
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_plain VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'superadmin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default Admin Account (admin / admin123)
INSERT INTO admin_users (username, password_plain, role)
VALUES ('admin', 'admin123', 'superadmin')
ON CONFLICT (username) DO NOTHING;
