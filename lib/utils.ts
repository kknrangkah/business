import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number to Indonesian Rupiah currency string (e.g., Rp 150.000)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format standard date string (YYYY-MM-DD or ISO) to Indonesian human date
 */
export function formatIndonesianDate(dateString?: string, withDay: boolean = false): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...(withDay ? { weekday: 'long' } : {}),
    };
    return new Intl.DateTimeFormat('id-ID', options).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format short date (e.g. 30 Agu 2026)
 */
export function formatShortDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Calculate age in years from birthdate
 */
export function calculateAge(birthDateString?: string): number {
  if (!birthDateString) return 0;
  try {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(0, age);
  } catch {
    return 0;
  }
}

/**
 * Calculate BMI (Body Mass Index) and return value with category
 */
export function calculateBMI(weightKg: number, heightCm: number): {
  bmi: number;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obesitas';
  color: string;
} {
  if (!weightKg || !heightCm || heightCm <= 0) {
    return { bmi: 0, category: 'Normal', color: 'text-slate-500' };
  }

  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  let category: 'Underweight' | 'Normal' | 'Overweight' | 'Obesitas' = 'Normal';
  let color = 'text-emerald-600 bg-emerald-50 border-emerald-200';

  if (bmi < 18.5) {
    category = 'Underweight';
    color = 'text-amber-600 bg-amber-50 border-amber-200';
  } else if (bmi >= 18.5 && bmi < 23.0) {
    category = 'Normal';
    color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  } else if (bmi >= 23.0 && bmi < 25.0) {
    category = 'Overweight';
    color = 'text-orange-600 bg-orange-50 border-orange-200';
  } else {
    category = 'Obesitas';
    color = 'text-rose-600 bg-rose-50 border-rose-200';
  }

  return { bmi, category, color };
}

/**
 * Generate medical record number (No RM) e.g., RM-2026-0012
 */
export function generateNoRM(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequenceNumber).padStart(4, '0');
  return `RM-${year}-${padded}`;
}

/**
 * Generate Invoice number e.g. INV-260830-001
 */
export function generateInvoiceNumber(sequenceNumber: number): string {
  const d = new Date();
  const dateStr = `${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const padded = String(sequenceNumber).padStart(3, '0');
  return `INV-${dateStr}-${padded}`;
}

/**
 * Generate next queue number e.g. A-005
 */
export function generateQueueNumber(sequenceNumber: number, prefix: string = 'A'): string {
  const padded = String(sequenceNumber).padStart(3, '0');
  return `${prefix}-${padded}`;
}
