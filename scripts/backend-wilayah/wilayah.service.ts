import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface WilayahResponse<T> {
  response_code: number;
  response_message: string;
  responseResult: boolean;
  data: {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class WilayahService {
  constructor(private readonly dataSource: DataSource) {}

  private createResponse<T>(data: T[], total: number, page: number, limit: number): WilayahResponse<T> {
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

  /**
   * Mengubah format kode tanpa titik (cth: '1101' atau '317106')
   * menjadi format titik Kemendagri ('11.01' atau '31.71.06') jika diperlukan.
   */
  private formatKodeInput(rawKode?: string): string | null {
    if (!rawKode || !rawKode.trim()) return null;
    const clean = rawKode.replace(/\./g, '').trim();
    if (clean.length === 2) return clean; // 11
    if (clean.length === 4) return `${clean.slice(0, 2)}.${clean.slice(2, 4)}`; // 11.01
    if (clean.length === 6) return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4, 6)}`; // 11.01.01
    if (clean.length === 10) return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4, 6)}.${clean.slice(6, 10)}`; // 11.01.01.2001
    return rawKode.trim();
  }

  // =========================================================================
  // 1. GET PROVINSI (Level 1: 38 Provinsi)
  // =========================================================================
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

  // =========================================================================
  // 2. GET KABUPATEN & KOTA (Level 2: 514 Kab/Kota)
  // =========================================================================
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

  // =========================================================================
  // 3. GET KECAMATAN (Level 3: 7.285 Kecamatan)
  // =========================================================================
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

  // =========================================================================
  // 4. GET KELURAHAN & DESA (Level 4: 83.762 Kelurahan & Desa)
  // =========================================================================
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
