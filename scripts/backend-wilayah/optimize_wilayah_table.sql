-- =============================================================================
-- SCRIPT OPTIMASI TABEL WILAYAH (Kepmendagri No 300.2.2-2138 Tahun 2025)
-- Penulis: PM Backend Architecture
-- Tujuan : Menjadikan query pencarian & hierarki 83.762 wilayah sangat cepat (<3ms)
-- =============================================================================

-- 1. Pastikan Primary Key dan Index Nama sudah ada
ALTER TABLE wilayah MODIFY COLUMN kode VARCHAR(13) NOT NULL;
ALTER TABLE wilayah ADD PRIMARY KEY (kode);
CREATE INDEX IF NOT EXISTS wilayah_name_idx ON wilayah (nama);

-- 2. Tambahkan Kolom Generated 'level', 'parent_kode', dan 'tipe'
-- Kolom ini dihitung otomatis oleh database tanpa memakan proses aplikasi
ALTER TABLE wilayah 
ADD COLUMN IF NOT EXISTS level TINYINT GENERATED ALWAYS AS (
    CASE 
        WHEN CHAR_LENGTH(kode) = 2 THEN 1
        WHEN CHAR_LENGTH(kode) = 5 THEN 2
        WHEN CHAR_LENGTH(kode) = 8 THEN 3
        WHEN CHAR_LENGTH(kode) = 13 THEN 4
        ELSE 0
    END
) STORED,
ADD COLUMN IF NOT EXISTS parent_kode VARCHAR(8) GENERATED ALWAYS AS (
    CASE 
        WHEN CHAR_LENGTH(kode) = 5 THEN SUBSTRING(kode, 1, 2)
        WHEN CHAR_LENGTH(kode) = 8 THEN SUBSTRING(kode, 1, 5)
        WHEN CHAR_LENGTH(kode) = 13 THEN SUBSTRING(kode, 1, 8)
        ELSE NULL
    END
) STORED,
ADD COLUMN IF NOT EXISTS tipe VARCHAR(10) GENERATED ALWAYS AS (
    CASE 
        WHEN CHAR_LENGTH(kode) = 5 AND (SUBSTRING(kode, 4, 1) >= '7' OR nama LIKE 'KOTA %' OR nama LIKE 'Kota %') THEN 'kota'
        WHEN CHAR_LENGTH(kode) = 5 THEN 'kabupaten'
        WHEN CHAR_LENGTH(kode) = 13 AND SUBSTRING(kode, 10, 1) = '1' THEN 'kelurahan'
        WHEN CHAR_LENGTH(kode) = 13 THEN 'desa'
        ELSE NULL
    END
) STORED;

-- 3. Index Performa Tinggi untuk Relasi Cepat & Filter
CREATE INDEX IF NOT EXISTS idx_wilayah_level_parent ON wilayah (level, parent_kode);
CREATE INDEX IF NOT EXISTS idx_wilayah_level_nama ON wilayah (level, nama);
CREATE INDEX IF NOT EXISTS idx_wilayah_tipe ON wilayah (tipe);

-- 4. Query Verifikasi Data Sesuai Standar Kemendagri RI 2025
SELECT 
    CASE level
        WHEN 1 THEN '1. Provinsi'
        WHEN 2 THEN '2. Kabupaten & Kota'
        WHEN 3 THEN '3. Kecamatan'
        WHEN 4 THEN '4. Kelurahan & Desa'
        ELSE 'Lainnya'
    END AS tingkatan,
    COUNT(*) AS total_wilayah
FROM wilayah
GROUP BY level
ORDER BY level ASC;
