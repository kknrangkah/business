# PANDUAN IMPLEMENTASI BACKEND: MASTER DATA WILAYAH 4 LEVEL
## Sumber Data: Tabel `wilayah` Sesuai Kepmendagri No 300.2.2-2138 Tahun 2025

Dokumen ini berisi spesifikasi arsitektur query SQL, skema database, dan implementasi kode **NestJS** (TypeORM / Prisma / Raw SQL) untuk menyajikan data wilayah administrasi Indonesia secara otomatis ke frontend melalui endpoint:
1. `GET /v1/wilayah/provinsi` (Level 1 - 38 Provinsi)
2. `GET /v1/wilayah/kabupaten-kota` (Level 2 - 514 Kabupaten & Kota)
3. `GET /v1/wilayah/kecamatan` (Level 3 - 7.285 Kecamatan)
4. `GET /v1/wilayah/kelurahan` (Level 4 - 83.762 Kelurahan & Desa)

---

## 1. Analisis Struktur Kode Tabel `wilayah`

Skema tabel bawaan dari dump `db/wilayah.sql`:
```sql
CREATE TABLE IF NOT EXISTS wilayah (
    kode varchar(13) NOT NULL,
    nama varchar(100) NOT NULL,
    PRIMARY KEY (kode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX wilayah_name_idx ON wilayah (nama);
```

### Pola Hierarki Kemendagri pada Kolom `kode`:
| Tingkat Administrasi | Format Kode | Karakter | Jumlah Titik | Contoh | Keterangan Relasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Provinsi** | `XX` | 2 | 0 | `11` (Aceh), `31` (DKI Jakarta) | Root / Top Level |
| **2. Kab / Kota** | `XX.YY` | 5 | 1 | `11.01` (Kab. Aceh Selatan), `11.71` (Kota Banda Aceh) | Parent: `SUBSTRING(kode, 1, 2)` = `XX`. Jika digit ke-4 `7` atau nama berawalan "Kota" &rarr; `tipe: 'kota'` |
| **3. Kecamatan** | `XX.YY.ZZ` | 8 | 2 | `11.01.01` (Bakongan), `31.71.06` (Menteng) | Parent: `SUBSTRING(kode, 1, 5)` = `XX.YY` |
| **4. Kelurahan / Desa**| `XX.YY.ZZ.WWWW` | 13 | 3 | `11.01.01.2001` (Desa), `31.71.06.1004` (Kelurahan) | Parent: `SUBSTRING(kode, 1, 8)` = `XX.YY.ZZ`. Digit ke-10 bernilai `1` &rarr; `kelurahan`, `2` &rarr; `desa` |

---

## 2. Optimasi Database (Rekomendasi Query Cepat < 3ms)

Untuk memastikan query pada 83.762 baris berjalan instan, tambahkan kolom tergenerasi (Generated Columns) dan indeks:

```sql
-- 1. Tambah Kolom Generated 'level' dan 'parent_kode' (MySQL 5.7+ / MariaDB / PostgreSQL)
ALTER TABLE wilayah 
ADD COLUMN level TINYINT GENERATED ALWAYS AS (
    CASE 
        WHEN CHAR_LENGTH(kode) = 2 THEN 1
        WHEN CHAR_LENGTH(kode) = 5 THEN 2
        WHEN CHAR_LENGTH(kode) = 8 THEN 3
        WHEN CHAR_LENGTH(kode) = 13 THEN 4
        ELSE 0
    END
) STORED,
ADD COLUMN parent_kode VARCHAR(8) GENERATED ALWAYS AS (
    CASE 
        WHEN CHAR_LENGTH(kode) = 5 THEN SUBSTRING(kode, 1, 2)
        WHEN CHAR_LENGTH(kode) = 8 THEN SUBSTRING(kode, 1, 5)
        WHEN CHAR_LENGTH(kode) = 13 THEN SUBSTRING(kode, 1, 8)
        ELSE NULL
    END
) STORED,
ADD COLUMN tipe VARCHAR(10) GENERATED ALWAYS AS (
    CASE 
        WHEN CHAR_LENGTH(kode) = 5 AND (SUBSTRING(kode, 4, 1) >= '7' OR nama LIKE 'KOTA %' OR nama LIKE 'Kota %') THEN 'kota'
        WHEN CHAR_LENGTH(kode) = 5 THEN 'kabupaten'
        WHEN CHAR_LENGTH(kode) = 13 AND SUBSTRING(kode, 10, 1) = '1' THEN 'kelurahan'
        WHEN CHAR_LENGTH(kode) = 13 THEN 'desa'
        ELSE NULL
    END
) STORED;

-- 2. Buat Index Performa Tinggi
CREATE INDEX idx_wilayah_level_parent ON wilayah (level, parent_kode);
CREATE INDEX idx_wilayah_level_nama ON wilayah (level, nama);
CREATE INDEX idx_wilayah_tipe ON wilayah (tipe);
```

---

## 3. Query SQL Dasar per Endpoint

### A. Endpoint 1: `GET /v1/wilayah/provinsi`
```sql
SELECT 
    REPLACE(kode, '.', '') AS kode,
    kode AS kode_kemendagri,
    nama
FROM wilayah
WHERE CHAR_LENGTH(kode) = 2
  AND (:search IS NULL OR nama LIKE CONCAT('%', :search, '%'))
ORDER BY kode ASC
LIMIT :limit OFFSET :offset;
```

### B. Endpoint 2: `GET /v1/wilayah/kabupaten-kota`
```sql
SELECT 
    REPLACE(k.kode, '.', '') AS kode,
    k.kode AS kode_kemendagri,
    REPLACE(SUBSTRING(k.kode, 1, 2), '.', '') AS kode_provinsi,
    k.nama,
    CASE 
        WHEN SUBSTRING(k.kode, 4, 1) >= '7' OR k.nama LIKE 'KOTA %' OR k.nama LIKE 'Kota %' THEN 'kota' 
        ELSE 'kabupaten' 
    END AS tipe,
    JSON_OBJECT(
        'kode', REPLACE(p.kode, '.', ''),
        'nama', p.nama
    ) AS provinsi
FROM wilayah k
LEFT JOIN wilayah p ON p.kode = SUBSTRING(k.kode, 1, 2)
WHERE CHAR_LENGTH(k.kode) = 5
  AND (:kode_provinsi IS NULL OR k.kode LIKE CONCAT(:kode_provinsi, '.%') OR REPLACE(k.kode, '.', '') LIKE CONCAT(:kode_provinsi, '%'))
  AND (:tipe IS NULL OR (
        CASE 
            WHEN SUBSTRING(k.kode, 4, 1) >= '7' OR k.nama LIKE 'KOTA %' OR k.nama LIKE 'Kota %' THEN 'kota' 
            ELSE 'kabupaten' 
        END = :tipe
  ))
  AND (:search IS NULL OR k.nama LIKE CONCAT('%', :search, '%') OR REPLACE(k.kode, '.', '') LIKE CONCAT('%', :search, '%'))
ORDER BY k.kode ASC
LIMIT :limit OFFSET :offset;
```

### C. Endpoint 3: `GET /v1/wilayah/kecamatan`
```sql
SELECT 
    REPLACE(kc.kode, '.', '') AS kode,
    kc.kode AS kode_kemendagri,
    REPLACE(SUBSTRING(kc.kode, 1, 5), '.', '') AS kode_kabupaten_kota,
    kc.nama,
    JSON_OBJECT(
        'kode', REPLACE(kb.kode, '.', ''),
        'nama', kb.nama,
        'tipe', CASE WHEN SUBSTRING(kb.kode, 4, 1) >= '7' OR kb.nama LIKE 'KOTA %' THEN 'kota' ELSE 'kabupaten' END
    ) AS kabupaten_kota
FROM wilayah kc
LEFT JOIN wilayah kb ON kb.kode = SUBSTRING(kc.kode, 1, 5)
WHERE CHAR_LENGTH(kc.kode) = 8
  AND (:kode_kabupaten IS NULL OR kc.kode LIKE CONCAT(:kode_kabupaten, '.%') OR REPLACE(kc.kode, '.', '') LIKE CONCAT(:kode_kabupaten, '%'))
  AND (:search IS NULL OR kc.nama LIKE CONCAT('%', :search, '%') OR REPLACE(kc.kode, '.', '') LIKE CONCAT('%', :search, '%'))
ORDER BY kc.kode ASC
LIMIT :limit OFFSET :offset;
```

### D. Endpoint 4: `GET /v1/wilayah/kelurahan`
```sql
SELECT 
    REPLACE(kl.kode, '.', '') AS kode,
    kl.kode AS kode_kemendagri,
    REPLACE(SUBSTRING(kl.kode, 1, 8), '.', '') AS kode_kecamatan,
    kl.nama,
    CASE 
        WHEN SUBSTRING(kl.kode, 10, 1) = '1' OR kl.nama LIKE 'KELURAHAN %' THEN 'kelurahan' 
        ELSE 'desa' 
    END AS tipe,
    NULL AS kode_pos,
    JSON_OBJECT(
        'kode', REPLACE(kc.kode, '.', ''),
        'nama', kc.nama
    ) AS kecamatan
FROM wilayah kl
LEFT JOIN wilayah kc ON kc.kode = SUBSTRING(kl.kode, 1, 8)
WHERE CHAR_LENGTH(kl.kode) = 13
  AND (:kode_kecamatan IS NULL OR kl.kode LIKE CONCAT(:kode_kecamatan, '.%') OR REPLACE(kl.kode, '.', '') LIKE CONCAT(:kode_kecamatan, '%'))
  AND (:tipe IS NULL OR (
        CASE 
            WHEN SUBSTRING(kl.kode, 10, 1) = '1' OR kl.nama LIKE 'KELURAHAN %' THEN 'kelurahan' 
            ELSE 'desa' 
        END = :tipe
  ))
  AND (:search IS NULL OR kl.nama LIKE CONCAT('%', :search, '%') OR REPLACE(kl.kode, '.', '') LIKE CONCAT('%', :search, '%'))
ORDER BY kl.kode ASC
LIMIT :limit OFFSET :offset;
```

---

## 4. Implementasi Lengkap NestJS (Siap Pakai)

### File: `src/wilayah/wilayah.controller.ts`
```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WilayahService } from './wilayah.service';
// Jika endpoint dilindungi auth guard:
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('v1/wilayah')
// @UseGuards(JwtAuthGuard)
export class WilayahController {
  constructor(private readonly wilayahService: WilayahService) {}

  @Get('provinsi')
  async getProvinsi(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 38,
  ) {
    return this.wilayahService.getProvinsi(search, Number(page), Number(limit));
  }

  @Get('kabupaten-kota')
  async getKabupatenKota(
    @Query('search') search?: string,
    @Query('kode_provinsi') kodeProvinsi?: string,
    @Query('tipe') tipe?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.wilayahService.getKabupatenKota(
      search,
      kodeProvinsi,
      tipe,
      Number(page),
      Number(limit),
    );
  }

  @Get('kecamatan')
  async getKecamatan(
    @Query('search') search?: string,
    @Query('kode_kabupaten_kota') kodeKabupaten?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 25,
  ) {
    return this.wilayahService.getKecamatan(
      search,
      kodeKabupaten,
      Number(page),
      Number(limit),
    );
  }

  @Get('kelurahan')
  async getKelurahan(
    @Query('search') search?: string,
    @Query('kode_kecamatan') kodeKecamatan?: string,
    @Query('tipe') tipe?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 25,
  ) {
    return this.wilayahService.getKelurahan(
      search,
      kodeKecamatan,
      tipe,
      Number(page),
      Number(limit),
    );
  }
}
```

---

### File: `src/wilayah/wilayah.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm'; // Atau gunakan PrismaClient / Knex

@Injectable()
export class WilayahService {
  constructor(private readonly dataSource: DataSource) {}

  // Helper normalisasi response standar SATUSEHAT / PM-Frontend
  private createResponse(data: any[], total: number, page: number, limit: number) {
    return {
      response_code: 200,
      response_message: 'Berhasil',
      responseResult: true,
      data: {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // Normalisasi kode input (memastikan titik sesuai format Kemendagri jika user mengirim '317106')
  private formatKodeInput(rawKode?: string): string | null {
    if (!rawKode || !rawKode.trim()) return null;
    const clean = rawKode.replace(/\./g, '').trim();
    if (clean.length === 2) return clean; // 11
    if (clean.length === 4) return `${clean.slice(0, 2)}.${clean.slice(2, 4)}`; // 11.01
    if (clean.length === 6) return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4, 6)}`; // 11.01.01
    return rawKode.trim();
  }

  // 1. GET PROVINSI
  async getProvinsi(search?: string, page = 1, limit = 38) {
    const offset = (page - 1) * limit;
    let whereClause = `WHERE CHAR_LENGTH(kode) = 2`;
    const params: any[] = [];

    if (search && search.trim()) {
      whereClause += ` AND (nama LIKE ? OR REPLACE(kode, '.', '') LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const countSql = `SELECT COUNT(*) AS total FROM wilayah ${whereClause}`;
    const [countResult] = await this.dataSource.query(countSql, params);
    const total = Number(countResult?.total || 0);

    const querySql = `
      SELECT 
        REPLACE(kode, '.', '') AS kode,
        kode AS kode_kemendagri,
        nama
      FROM wilayah
      ${whereClause}
      ORDER BY kode ASC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.dataSource.query(querySql, [...params, limit, offset]);

    return this.createResponse(rows, total, page, limit);
  }

  // 2. GET KABUPATEN & KOTA
  async getKabupatenKota(
    search?: string,
    kodeProvinsi?: string,
    tipe?: string,
    page = 1,
    limit = 20,
  ) {
    const offset = (page - 1) * limit;
    let whereClause = `WHERE CHAR_LENGTH(k.kode) = 5`;
    const params: any[] = [];

    const formattedProv = this.formatKodeInput(kodeProvinsi);
    if (formattedProv) {
      whereClause += ` AND k.kode LIKE ?`;
      params.push(`${formattedProv}.%`);
    }

    if (tipe && tipe.toUpperCase() !== 'ALL') {
      const t = tipe.toLowerCase().trim();
      if (t === 'kota') {
        whereClause += ` AND (SUBSTRING(k.kode, 4, 1) >= '7' OR k.nama LIKE 'KOTA %' OR k.nama LIKE 'Kota %')`;
      } else if (t === 'kabupaten') {
        whereClause += ` AND (SUBSTRING(k.kode, 4, 1) < '7' AND k.nama NOT LIKE 'KOTA %' AND k.nama NOT LIKE 'Kota %')`;
      }
    }

    if (search && search.trim()) {
      whereClause += ` AND (k.nama LIKE ? OR REPLACE(k.kode, '.', '') LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const countSql = `SELECT COUNT(*) AS total FROM wilayah k ${whereClause}`;
    const [countResult] = await this.dataSource.query(countSql, params);
    const total = Number(countResult?.total || 0);

    const querySql = `
      SELECT 
        REPLACE(k.kode, '.', '') AS kode,
        k.kode AS kode_kemendagri,
        REPLACE(SUBSTRING(k.kode, 1, 2), '.', '') AS kode_provinsi,
        k.nama,
        CASE 
          WHEN SUBSTRING(k.kode, 4, 1) >= '7' OR k.nama LIKE 'KOTA %' OR k.nama LIKE 'Kota %' THEN 'kota'
          ELSE 'kabupaten'
        END AS tipe,
        JSON_OBJECT(
          'kode', REPLACE(p.kode, '.', ''),
          'nama', p.nama
        ) AS provinsi
      FROM wilayah k
      LEFT JOIN wilayah p ON p.kode = SUBSTRING(k.kode, 1, 2)
      ${whereClause}
      ORDER BY k.kode ASC
      LIMIT ? OFFSET ?
    `;
    const rawRows = await this.dataSource.query(querySql, [...params, limit, offset]);

    const formattedRows = rawRows.map((r: any) => ({
      ...r,
      provinsi: typeof r.provinsi === 'string' ? JSON.parse(r.provinsi) : r.provinsi,
    }));

    return this.createResponse(formattedRows, total, page, limit);
  }

  // 3. GET KECAMATAN
  async getKecamatan(
    search?: string,
    kodeKabupaten?: string,
    page = 1,
    limit = 25,
  ) {
    const offset = (page - 1) * limit;
    let whereClause = `WHERE CHAR_LENGTH(kc.kode) = 8`;
    const params: any[] = [];

    const formattedKab = this.formatKodeInput(kodeKabupaten);
    if (formattedKab) {
      whereClause += ` AND kc.kode LIKE ?`;
      params.push(`${formattedKab}.%`);
    }

    if (search && search.trim()) {
      whereClause += ` AND (kc.nama LIKE ? OR REPLACE(kc.kode, '.', '') LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const countSql = `SELECT COUNT(*) AS total FROM wilayah kc ${whereClause}`;
    const [countResult] = await this.dataSource.query(countSql, params);
    const total = Number(countResult?.total || 0);

    const querySql = `
      SELECT 
        REPLACE(kc.kode, '.', '') AS kode,
        kc.kode AS kode_kemendagri,
        REPLACE(SUBSTRING(kc.kode, 1, 5), '.', '') AS kode_kabupaten_kota,
        kc.nama,
        JSON_OBJECT(
          'kode', REPLACE(kb.kode, '.', ''),
          'nama', kb.nama,
          'tipe', CASE WHEN SUBSTRING(kb.kode, 4, 1) >= '7' OR kb.nama LIKE 'KOTA %' THEN 'kota' ELSE 'kabupaten' END
        ) AS kabupaten_kota
      FROM wilayah kc
      LEFT JOIN wilayah kb ON kb.kode = SUBSTRING(kc.kode, 1, 5)
      ${whereClause}
      ORDER BY kc.kode ASC
      LIMIT ? OFFSET ?
    `;
    const rawRows = await this.dataSource.query(querySql, [...params, limit, offset]);

    const formattedRows = rawRows.map((r: any) => ({
      ...r,
      kabupaten_kota: typeof r.kabupaten_kota === 'string' ? JSON.parse(r.kabupaten_kota) : r.kabupaten_kota,
    }));

    return this.createResponse(formattedRows, total, page, limit);
  }

  // 4. GET KELURAHAN & DESA
  async getKelurahan(
    search?: string,
    kodeKecamatan?: string,
    tipe?: string,
    page = 1,
    limit = 25,
  ) {
    const offset = (page - 1) * limit;
    let whereClause = `WHERE CHAR_LENGTH(kl.kode) = 13`;
    const params: any[] = [];

    const formattedKec = this.formatKodeInput(kodeKecamatan);
    if (formattedKec) {
      whereClause += ` AND kl.kode LIKE ?`;
      params.push(`${formattedKec}.%`);
    }

    if (tipe && tipe.toUpperCase() !== 'ALL') {
      const t = tipe.toLowerCase().trim();
      if (t === 'kelurahan') {
        whereClause += ` AND (SUBSTRING(kl.kode, 10, 1) = '1' OR kl.nama LIKE 'KELURAHAN %')`;
      } else if (t === 'desa') {
        whereClause += ` AND (SUBSTRING(kl.kode, 10, 1) = '2' AND kl.nama NOT LIKE 'KELURAHAN %')`;
      }
    }

    if (search && search.trim()) {
      whereClause += ` AND (kl.nama LIKE ? OR REPLACE(kl.kode, '.', '') LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const countSql = `SELECT COUNT(*) AS total FROM wilayah kl ${whereClause}`;
    const [countResult] = await this.dataSource.query(countSql, params);
    const total = Number(countResult?.total || 0);

    const querySql = `
      SELECT 
        REPLACE(kl.kode, '.', '') AS kode,
        kl.kode AS kode_kemendagri,
        REPLACE(SUBSTRING(kl.kode, 1, 8), '.', '') AS kode_kecamatan,
        kl.nama,
        CASE 
          WHEN SUBSTRING(kl.kode, 10, 1) = '1' OR kl.nama LIKE 'KELURAHAN %' THEN 'kelurahan'
          ELSE 'desa'
        END AS tipe,
        NULL AS kode_pos,
        JSON_OBJECT(
          'kode', REPLACE(kc.kode, '.', ''),
          'nama', kc.nama
        ) AS kecamatan
      FROM wilayah kl
      LEFT JOIN wilayah kc ON kc.kode = SUBSTRING(kl.kode, 1, 8)
      ${whereClause}
      ORDER BY kl.kode ASC
      LIMIT ? OFFSET ?
    `;
    const rawRows = await this.dataSource.query(querySql, [...params, limit, offset]);

    const formattedRows = rawRows.map((r: any) => ({
      ...r,
      kecamatan: typeof r.kecamatan === 'string' ? JSON.parse(r.kecamatan) : r.kecamatan,
    }));

    return this.createResponse(formattedRows, total, page, limit);
  }
}
```

---

### File: `src/wilayah/wilayah.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { WilayahController } from './wilayah.controller';
import { WilayahService } from './wilayah.service';

@Module({
  controllers: [WilayahController],
  providers: [WilayahService],
  exports: [WilayahService],
})
export class WilayahModule {}
```

---

## 5. Panduan Menjalankan Dump `db/wilayah.sql` ke Database Server

Jalankan perintah berikut di terminal server database MySQL / MariaDB backend:

```bash
# 1. Masuk dan import dump wilayah.sql ke database Anda (misal nama database: pm_database)
mysql -u root -p pm_database < db/wilayah.sql

# 2. Verifikasi total data yang berhasil masuk:
mysql -u root -p -e "
  SELECT 
    CASE 
      WHEN CHAR_LENGTH(kode) = 2 THEN '1. Provinsi'
      WHEN CHAR_LENGTH(kode) = 5 THEN '2. Kab/Kota'
      WHEN CHAR_LENGTH(kode) = 8 THEN '3. Kecamatan'
      WHEN CHAR_LENGTH(kode) = 13 THEN '4. Kelurahan/Desa'
      ELSE 'Lainnya'
    END AS level,
    COUNT(*) AS total
  FROM pm_database.wilayah
  GROUP BY level
  ORDER BY level;
"
```

Output yang diharapkan:
```
+-------------------+-------+
| level             | total |
+-------------------+-------+
| 1. Provinsi       |    38 |
| 2. Kab/Kota       |   514 |
| 3. Kecamatan      |  7285 |
| 4. Kelurahan/Desa | 83762 |
+-------------------+-------+
```
