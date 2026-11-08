import { StockOpnameSession } from '@/types/rme';

export const STOCK_OPNAME_REASONS = [
  'Sesuai (Tanpa Selisih)',
  'Selisih Hitung / Salah Catat',
  'Obat Rusak / Pecah / Meleleh',
  'Obat Kedaluwarsa (Expired)',
  'Pemberian Darurat / Luar Resep',
  'Koreksi Penerimaan Suplier',
  'Barang Hilang / Selisih Fisik',
  'Lainnya (Keterangan Khusus)',
] as const;

export type StockOpnameReason = typeof STOCK_OPNAME_REASONS[number];

export const MOCK_STOCK_OPNAME_HISTORY: StockOpnameSession[] = [];
