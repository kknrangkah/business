import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let provincesCache: Array<{ code: string; name: string }> | null = null;
let regenciesCache: Record<string, Array<{ code: string; name: string }>> | null = null;
let districtsCache: Record<string, Array<{ code: string; name: string }>> | null = null;
let villagesCache: Record<string, string[]> | null = null;

function loadData() {
  if (!provincesCache) {
    const baseDir = path.join(process.cwd(), 'data', 'wilayah');
    provincesCache = JSON.parse(fs.readFileSync(path.join(baseDir, 'provinces.json'), 'utf8'));
    regenciesCache = JSON.parse(fs.readFileSync(path.join(baseDir, 'regencies.json'), 'utf8'));
    districtsCache = JSON.parse(fs.readFileSync(path.join(baseDir, 'districts.json'), 'utf8'));
    villagesCache = JSON.parse(fs.readFileSync(path.join(baseDir, 'villages.json'), 'utf8'));
  }
}

// Common aliases mapping
const PROVINCE_ALIASES: Record<string, string> = {
  'dki jakarta': 'Daerah Khusus Ibukota Jakarta',
  'jakarta': 'Daerah Khusus Ibukota Jakarta',
  'di yogyakarta': 'Daerah Istimewa Yogyakarta',
  'yogyakarta': 'Daerah Istimewa Yogyakarta',
  'diy': 'Daerah Istimewa Yogyakarta',
  'kep bangka belitung': 'Kepulauan Bangka Belitung',
  'kep riau': 'Kepulauan Riau',
};

export async function GET(request: Request) {
  try {
    loadData();
    const { searchParams } = new URL(request.url);
    const level = (searchParams.get('level') || searchParams.get('type') || 'provinces').toLowerCase();
    const provinceQuery = searchParams.get('provinceCode') || searchParams.get('province') || '';
    const regencyQuery = searchParams.get('regencyCode') || searchParams.get('regency') || searchParams.get('city') || '';
    const districtQuery = searchParams.get('districtCode') || searchParams.get('district') || '';
    const searchQuery = searchParams.get('search') || searchParams.get('q') || '';

    // 1. Search Mode
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const results: Array<{ level: string; code: string; name: string; parent?: string }> = [];

      for (const p of provincesCache || []) {
        if (p.name.toLowerCase().includes(q)) {
          results.push({ level: 'province', code: p.code, name: p.name });
        }
      }
      for (const [pCode, regs] of Object.entries(regenciesCache || {})) {
        for (const r of regs) {
          if (r.name.toLowerCase().includes(q)) {
            results.push({ level: 'regency', code: r.code, name: r.name, parent: pCode });
          }
        }
      }
      for (const [rCode, dists] of Object.entries(districtsCache || {})) {
        if (results.length >= 50) break;
        for (const d of dists) {
          if (d.name.toLowerCase().includes(q)) {
            results.push({ level: 'district', code: d.code, name: d.name, parent: rCode });
            if (results.length >= 50) break;
          }
        }
      }
      return NextResponse.json({ response_code: 200, success: true, data: results });
    }

    // 2. Provinces
    if (level === 'provinces' || level === 'provinsi') {
      return NextResponse.json({ response_code: 200, success: true, data: provincesCache });
    }

    // 3. Regencies (Kota / Kabupaten)
    if (level === 'regencies' || level === 'cities' || level === 'kabupaten' || level === 'kota') {
      let targetProvCode = provinceQuery;
      if (provinceQuery && !/^[0-9]+$/.test(provinceQuery)) {
        const norm = provinceQuery.toLowerCase().trim();
        const aliased = PROVINCE_ALIASES[norm] || norm;
        const found = (provincesCache || []).find(
          (p) => p.name.toLowerCase() === norm || p.name.toLowerCase() === aliased.toLowerCase()
        );
        if (found) targetProvCode = found.code;
      }
      const list = targetProvCode && regenciesCache ? regenciesCache[targetProvCode] || [] : [];
      return NextResponse.json({ response_code: 200, success: true, provinceCode: targetProvCode, data: list });
    }

    // 4. Districts (Kecamatan)
    if (level === 'districts' || level === 'kecamatan') {
      let targetRegCode = regencyQuery;
      if (regencyQuery && !/^[0-9\.]+$/.test(regencyQuery)) {
        const norm = regencyQuery.toLowerCase().trim();
        for (const [pCode, regs] of Object.entries(regenciesCache || {})) {
          const found = regs.find(
            (r) =>
              r.name.toLowerCase() === norm ||
              r.name.toLowerCase().replace(/^(kota|kabupaten|kab|kota administrasi)\s+/i, '') ===
                norm.replace(/^(kota|kabupaten|kab|kota administrasi)\s+/i, '')
          );
          if (found) {
            targetRegCode = found.code;
            break;
          }
        }
      }
      const list = targetRegCode && districtsCache ? districtsCache[targetRegCode] || [] : [];
      return NextResponse.json({ response_code: 200, success: true, regencyCode: targetRegCode, data: list });
    }

    // 5. Villages (Kelurahan / Desa)
    if (level === 'villages' || level === 'subdistricts' || level === 'kelurahan' || level === 'desa') {
      let targetDistCode = districtQuery;
      if (districtQuery && !/^[0-9\.]+$/.test(districtQuery)) {
        const norm = districtQuery.toLowerCase().trim();
        for (const [rCode, dists] of Object.entries(districtsCache || {})) {
          const found = dists.find((d) => d.name.toLowerCase() === norm);
          if (found) {
            targetDistCode = found.code;
            break;
          }
        }
      }
      const list = targetDistCode && villagesCache ? villagesCache[targetDistCode] || [] : [];
      return NextResponse.json({ response_code: 200, success: true, districtCode: targetDistCode, data: list });
    }

    return NextResponse.json({ response_code: 200, success: true, data: provincesCache });
  } catch (err: any) {
    console.error('[API /api/wilayah Error]:', err);
    return NextResponse.json(
      { response_code: 500, success: false, error: err?.message || 'Failed to process wilayah request' },
      { status: 500 }
    );
  }
}
