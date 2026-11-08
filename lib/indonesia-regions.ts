import rawRegions from '@/data/wilayah/indonesia-regions.json';

export interface DistrictHierarchy {
  code?: string;
  name: string;
  subdistricts: string[];
}

export interface CityHierarchy {
  code?: string;
  name: string;
  districts: DistrictHierarchy[];
}

export interface RegionHierarchy {
  code?: string;
  province: string;
  cities: CityHierarchy[];
}

// Normalizer for province aliases (e.g. DKI Jakarta <-> Daerah Khusus Ibukota Jakarta)
export function normalizeRegionName(name: string): string {
  if (!name) return '';
  const lower = name.toLowerCase().trim();
  if (lower === 'dki jakarta' || lower === 'jakarta' || lower === 'daerah khusus ibukota jakarta') {
    return 'DKI Jakarta';
  }
  if (lower === 'di yogyakarta' || lower === 'yogyakarta' || lower === 'diy' || lower === 'daerah istimewa yogyakarta') {
    return 'DI Yogyakarta';
  }
  return name.trim();
}

// Cleaned and normalized list of all 38 Indonesian provinces with all 514 cities, 7,265 districts, and 83,345 subdistricts
export const INDONESIA_REGIONS: RegionHierarchy[] = (rawRegions as unknown as RegionHierarchy[]).map((r) => {
  let provinceName = r.province;
  if (r.code === '31') provinceName = 'DKI Jakarta';
  else if (r.code === '34') provinceName = 'DI Yogyakarta';

  return {
    ...r,
    province: provinceName,
  };
});

// Helper lookup functions
export function getProvinces(): string[] {
  return INDONESIA_REGIONS.map((r) => r.province);
}

export function getCitiesByProvince(provinceName: string): CityHierarchy[] {
  const norm = normalizeRegionName(provinceName).toLowerCase();
  const prov = INDONESIA_REGIONS.find(
    (r) =>
      r.province.toLowerCase() === norm ||
      normalizeRegionName(r.province).toLowerCase() === norm ||
      r.code === provinceName
  );
  return prov?.cities || [];
}

export function getDistrictsByCity(provinceName: string, cityName: string): DistrictHierarchy[] {
  const cities = getCitiesByProvince(provinceName);
  const normCity = cityName.toLowerCase().trim();
  const city = cities.find(
    (c) =>
      c.name.toLowerCase() === normCity ||
      c.name.toLowerCase().replace(/^(kota|kabupaten|kab|kota administrasi)\s+/i, '') ===
        normCity.replace(/^(kota|kabupaten|kab|kota administrasi)\s+/i, '') ||
      c.code === cityName
  );
  return city?.districts || [];
}

export function getSubdistrictsByDistrict(
  provinceName: string,
  cityName: string,
  districtName: string
): string[] {
  const districts = getDistrictsByCity(provinceName, cityName);
  const normDist = districtName.toLowerCase().trim();
  const dist = districts.find(
    (d) => d.name.toLowerCase() === normDist || d.code === districtName
  );
  return dist?.subdistricts || [];
}

export interface RegionSearchResult {
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  type: 'province' | 'city' | 'district' | 'subdistrict';
  label: string;
}

export function searchRegions(query: string, limit = 8): RegionSearchResult[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results: RegionSearchResult[] = [];

  // 1. Search in subdistricts first (most specific)
  for (const p of INDONESIA_REGIONS) {
    for (const c of p.cities) {
      for (const d of c.districts) {
        for (const s of d.subdistricts) {
          if (s.toLowerCase().includes(q)) {
            results.push({
              province: p.province,
              city: c.name,
              district: d.name,
              subdistrict: s,
              type: 'subdistrict',
              label: `Kel. ${s}, Kec. ${d.name}, ${c.name}, ${p.province}`,
            });
            if (results.length >= limit) return results;
          }
        }
      }
    }
  }

  // 2. Search in districts
  if (results.length < limit) {
    for (const p of INDONESIA_REGIONS) {
      for (const c of p.cities) {
        for (const d of c.districts) {
          if (d.name.toLowerCase().includes(q)) {
            results.push({
              province: p.province,
              city: c.name,
              district: d.name,
              subdistrict: d.subdistricts[0] || '',
              type: 'district',
              label: `Kec. ${d.name}, ${c.name}, ${p.province}`,
            });
            if (results.length >= limit) return results;
          }
        }
      }
    }
  }

  // 3. Search in cities
  if (results.length < limit) {
    for (const p of INDONESIA_REGIONS) {
      for (const c of p.cities) {
        if (c.name.toLowerCase().includes(q)) {
          results.push({
            province: p.province,
            city: c.name,
            district: c.districts[0]?.name || '',
            subdistrict: c.districts[0]?.subdistricts[0] || '',
            type: 'city',
            label: `${c.name}, ${p.province}`,
          });
          if (results.length >= limit) return results;
        }
      }
    }
  }

  return results;
}
