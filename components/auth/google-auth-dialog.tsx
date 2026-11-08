'use client';

import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Sparkles, Check, ArrowRight, ShieldCheck, Mail, User } from 'lucide-react';

export interface GoogleAuthUser {
  name: string;
  email: string;
  avatarUrl?: string;
  rawResponse?: any;
}

interface GoogleAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAccount: (user: GoogleAuthUser) => Promise<void>;
  title?: string;
  description?: string;
}

const PRESET_GOOGLE_ACCOUNTS: (GoogleAuthUser & { subtitle: string; initials: string; bgColor: string })[] = [
  {
    name: 'Adhitya Prayogo',
    email: 'adhityogo@gmail.com',
    subtitle: 'Akun Google Terverifikasi • Token & Sesi Aktif',
    initials: 'AP',
    bgColor: 'bg-emerald-600',
    rawResponse: {
      response_code: 200,
      response_message: 'Berhasil',
      responseResult: true,
      data: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU4ZGVjMjhhLWZkODgtNDcyOS05YjkxLWYzNzJjZDdhYTQxMCIsIm5hbWUiOiJBZGhpdHlhIFByYXlvZ28iLCJ1c2VybmFtZSI6ImFkaGl0eW9nb0BnbWFpbC5jb20iLCJ1c2VyX25hbWUiOiJhZGhpdHlvZ29AZ21haWwuY29tIiwiaWRfdXNlciI6IjU4ZGVjMjhhLWZkODgtNDcyOS05YjkxLWYzNzJjZDdhYTQxMCIsImlkX3BpY19jdXN0b21lciI6bnVsbCwiaWRfa2FyeWF3YW4iOm51bGwsImlkX3JvbGUiOiJhMWIyYzNkNC1lNWY2LTdhOGItOWMwZC0xZTJmM2E0YjVjNmUiLCJuYW1hX3JvbGUiOiJ1c2VyIiwiaXNfZ2V0X2FsbF9kYXRhIjp0cnVlLCJpZF9ndWRhbmciOm51bGwsImlkX2phYmF0YW4iOm51bGwsInRpbWV6b25lX25hbWUiOm51bGwsInNlc3Npb25JZCI6ImEzODcyMDBjLWJhYWYtNGEwYS04MTcxLTMyY2Q5YTBlZDk2NyIsImRldmljZV9maW5nZXJwcmludCI6bnVsbCwiaWF0IjoxNzg5Mzk2MTYxLCJleHAiOjE3ODk0ODI1NjF9.j8OIBA-_SRoYN526UWnGmz89_C06M-7q0hD_akU2SNA',
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU4ZGVjMjhhLWZkODgtNDcyOS05YjkxLWYzNzJjZDdhYTQxMCIsIm5hbWUiOiJBZGhpdHlhIFByYXlvZ28iLCJ1c2VybmFtZSI6ImFkaGl0eW9nb0BnbWFpbC5jb20iLCJ1c2VyX25hbWUiOiJhZGhpdHlvZ29AZ21haWwuY29tIiwiaWRfdXNlciI6IjU4ZGVjMjhhLWZkODgtNDcyOS05YjkxLWYzNzJjZDdhYTQxMCIsImlkX3BpY19jdXN0b21lciI6bnVsbCwiaWRfa2FyeWF3YW4iOm51bGwsImlkX3JvbGUiOiJhMWIyYzNkNC1lNWY2LTdhOGItOWMwZC0xZTJmM2E0YjVjNmUiLCJuYW1hX3JvbGUiOiJ1c2VyIiwiaXNfZ2V0X2FsbF9kYXRhIjp0cnVlLCJpZF9ndWRhbmciOm51bGwsImlkX2phYmF0YW4iOm51bGwsInRpbWV6b25lX25hbWUiOm51bGwsInNlc3Npb25JZCI6ImEzODcyMDBjLWJhYWYtNGEwYS04MTcxLTMyY2Q5YTBlZDk2NyIsImRldmljZV9maW5nZXJwcmludCI6bnVsbCwiaWF0IjoxNzg5Mzk2MTYxLCJleHAiOjE3ODk0ODI1NjF9.j8OIBA-_SRoYN526UWnGmz89_C06M-7q0hD_akU2SNA',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU4ZGVjMjhhLWZkODgtNDcyOS05YjkxLWYzNzJjZDdhYTQxMCIsIm5hbWUiOiJBZGhpdHlhIFByYXlvZ28iLCJ1c2VybmFtZSI6ImFkaGl0eW9nb0BnbWFpbC5jb20iLCJ1c2VyX25hbWUiOiJhZGhpdHlvZ29AZ21haWwuY29tIiwiaWRfdXNlciI6IjU4ZGVjMjhhLWZkODgtNDcyOS05YjkxLWYzNzJjZDdhYTQxMCIsImlkX3BpY19jdXN0b21lciI6bnVsbCwiaWRfa2FyeWF3YW4iOm51bGwsImlkX3JvbGUiOiJhMWIyYzNkNC1lNWY2LTdhOGItOWMwZC0xZTJmM2E0YjVjNmUiLCJuYW1hX3JvbGUiOiJ1c2VyIiwiaXNfZ2V0X2FsbF9kYXRhIjp0cnVlLCJpZF9ndWRhbmciOm51bGwsImlkX2phYmF0YW4iOm51bGwsInRpbWV6b25lX25hbWUiOm51bGwsInNlc3Npb25JZCI6ImEzODcyMDBjLWJhYWYtNGEwYS04MTcxLTMyY2Q5YTBlZDk2NyIsImRldmljZV9maW5nZXJwcmludCI6bnVsbCwiaWF0IjoxNzg5Mzk2MTYxLCJleHAiOjE3ODk5OTg1NjF9.Pnyhdf_IawLeufTPHSOduN1TIVlonfgRktNuvxTS7T4',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU4ZGVjMjhhLWZkODgtNDcyOS05YjkxLWYzNzJjZDdhYTQxMCIsIm5hbWUiOiJBZGhpdHlhIFByYXlvZ28iLCJ1c2VybmFtZSI6ImFkaGl0eW9nb0BnbWFpbC5jb20iLCJ1c2VyX25hbWUiOiJhZGhpdHlvZ29AZ21haWwuY29tIiwiaWRfdXNlciI6IjU4ZGVjMjhhLWZkODgtNDcyOS05YjkxLWYzNzJjZDdhYTQxMCIsImlkX3BpY19jdXN0b21lciI6bnVsbCwiaWRfa2FyeWF3YW4iOm51bGwsImlkX3JvbGUiOiJhMWIyYzNkNC1lNWY2LTdhOGItOWMwZC0xZTJmM2E0YjVjNmUiLCJuYW1hX3JvbGUiOiJ1c2VyIiwiaXNfZ2V0X2FsbF9kYXRhIjp0cnVlLCJpZF9ndWRhbmciOm51bGwsImlkX2phYmF0YW4iOm51bGwsInRpbWV6b25lX25hbWUiOm51bGwsInNlc3Npb25JZCI6ImEzODcyMDBjLWJhYWYtNGEwYS04MTcxLTMyY2Q5YTBlZDk2NyIsImRldmljZV9maW5nZXJwcmludCI6bnVsbCwiaWF0IjoxNzg5Mzk2MTYxLCJleHAiOjE3ODk5OTg1NjF9.Pnyhdf_IawLeufTPHSOduN1TIVlonfgRktNuvxTS7T4',
        result: true,
        user: {
          id: '58dec28a-fd88-4729-9b91-f372cd7aa410',
          name: 'Adhitya Prayogo',
          phone: null,
          email: 'adhityogo@gmail.com',
          email_verified_at: null,
          remember_token: null,
          bucket: null,
          object: null,
          created_at: '2026-09-14T15:05:48.330+07:00',
          updated_at: '2026-09-14T15:05:48.330+07:00',
          deleted_at: null,
          timezone_id: null,
          tenant_id: null,
          modelHasRoles: [
            {
              role_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e',
              model_id: '58dec28a-fd88-4729-9b91-f372cd7aa410',
              created_at: '2026-09-14T15:05:47.966+07:00',
              updated_at: '2026-09-14T15:05:47.966+07:00',
              Role: {
                id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e',
                name: 'user',
                guard_name: 'web',
                created_at: '2026-09-11T16:21:47.364+07:00',
                updated_at: '2026-09-11T16:21:47.364+07:00',
                deleted_at: null,
              },
            },
          ],
          timezone: null,
          roleId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e',
          nama_role: 'user',
          is_get_all_data: true,
        },
        session: {
          id: 'a387200c-baaf-4a0a-8171-32cd9a0ed967',
          device_name: 'Chrome on Windows',
          device_type: 'desktop',
          browser_name: 'Chrome',
          os_name: 'Windows',
          expires_at: '2026-09-15T21:03:18.161+07:00',
        },
      },
    },
  },
];

export function GoogleAuthDialog({
  open,
  onOpenChange,
  onSelectAccount,
  title = 'Masuk dengan Google',
  description = 'Pilih akun Google Anda untuk melanjutkan ke RME Klinik',
}: GoogleAuthDialogProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAccountClick = async (account: GoogleAuthUser) => {
    setSelectedEmail(account.email);
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onSelectAccount(account);
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal autentikasi dengan akun Google ini.');
      setIsProcessing(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim();
    const cleanName = customName.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Alamat email Google tidak valid.');
      return;
    }
    if (!cleanName) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onSelectAccount({
        name: cleanName,
        email: cleanEmail,
      });
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mendaftar dengan akun Google.');
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="md">
      <div className="space-y-4 text-slate-800">
        {/* Google Header */}
        <div className="flex flex-col items-center text-center pt-1 pb-2 space-y-2">
          {/* Official Google 4-Color Logo */}
          <div className="p-2.5 rounded-full bg-slate-50 border border-slate-200 shadow-xs">
            <svg className="h-7 w-7" viewBox="0 0 24 24" width="28" height="28">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Loading Overlay */}
        {isProcessing && (
          <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex flex-col items-center justify-center gap-3 text-center animate-in fade-in">
            <span className="h-7 w-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-xs font-bold text-emerald-950">Memverifikasi Akun Google...</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Mengaktifkan sesi faskes &amp; trial 14 hari tanpa mengisi data formulir
              </p>
            </div>
          </div>
        )}

        {!isProcessing && !isCustomMode && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Pilih Akun Tersedia (1-Klik Masuk)
            </div>

            {/* List of preset Google accounts */}
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs">
              {PRESET_GOOGLE_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleAccountClick(acc)}
                  className="w-full p-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                >
                  <div
                    className={`h-10 w-10 rounded-full ${acc.bgColor} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}
                  >
                    {acc.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <span>{acc.name}</span>
                      {selectedEmail === acc.email && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{acc.email}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{acc.subtitle}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}

              {/* Option to use custom Google account */}
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="w-full p-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left group cursor-pointer bg-slate-50/50"
              >
                <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-800">
                    Gunakan Akun Google / Gmail Lainnya
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Ketik nama dan alamat email Google pribadi Anda
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* Custom Google Account Form */}
        {!isProcessing && isCustomMode && (
          <form onSubmit={handleCustomSubmit} className="space-y-3 pt-1">
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
              <span>
                Cukup masukkan nama &amp; email Google Anda. Kata sandi tidak diperlukan!
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nama Lengkap Dokter / Faskes</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  required
                  placeholder="contoh: dr. Ahmad Dahlan atau Klinik Sehat"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="pl-9 h-10.5 text-xs sm:text-sm rounded-xl"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Alamat Email Google (Gmail)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  required
                  placeholder="contoh: nama.dokter@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="pl-9 h-10.5 text-xs sm:text-sm rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomMode(false)}
                className="flex-1 h-10.5 text-xs rounded-xl font-bold"
              >
                Kembali
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs rounded-xl font-bold gap-1.5 shadow-sm"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        )}

        {/* Security Trust Note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Login Aman Terverifikasi</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-slate-500 hover:text-slate-800 font-medium hover:underline cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </Dialog>
  );
}
