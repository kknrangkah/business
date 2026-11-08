'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { useRME } from '@/context/rme-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Users,
  LogOut,
  ShieldCheck,
  Stethoscope,
  Building2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsAccountPage() {
  const router = useRouter();
  const {
    currentUser,
    logout,
    sessionRemainingSeconds,
    extendSession,
  } = useRME();

  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar dari sesi akun.');
    router.push('/login');
  };

  return (
    <MainLayout>
      <div className="space-y-6 w-full max-w-4xl">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <User className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Akun & Sesi Login
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Rincian profil pengguna aktif dan manajemen sesi login faskes.
          </p>
        </div>

        {/* Active Session Card */}
        <Card className="border border-slate-200/90 bg-white shadow-xs p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900">
                Informasi Akun yang Sedang Masuk
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Hak akses dan identitas klinis yang aktif saat ini pada sistem RME.
              </p>
            </div>
            <Button
              onClick={() => router.push('/settings/users')}
              variant="outline"
              size="sm"
              className="text-xs font-bold gap-1.5 rounded-xl border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 cursor-pointer"
            >
              <Users className="h-4 w-4 text-emerald-700" />
              <span>Kelola Seluruh Pengguna & RBAC</span>
            </Button>
          </div>

          {currentUser ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
                  {currentUser.role === 'DOCTOR' ? (
                    <Stethoscope className="h-7 w-7" />
                  ) : (
                    <Building2 className="h-7 w-7" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-slate-900">
                      {currentUser.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-white font-bold text-emerald-800 border-emerald-200">
                      {currentUser.role === 'DOCTOR' ? 'Dokter Pemeriksa' : 'Admin & Kasir'}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{currentUser.email}</div>
                  {currentUser.sip && (
                    <div className="text-[11px] font-mono text-slate-400 font-semibold">
                      SIP: {currentUser.sip}
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="text-xs gap-2 rounded-xl font-bold shadow-xs cursor-pointer self-start md:self-auto"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar (Logout)</span>
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200">
              Tidak ada sesi pengguna aktif. Silakan login terlebih dahulu.
            </div>
          )}

          {/* Active Inactivity Timeout Card */}
          {currentUser && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>Otomatis Logout Saat Tidak Digunakan</span>
                    <Badge variant="outline" className="text-[10px] bg-white font-bold text-slate-700">
                      Inaktif 1 Jam
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sistem otomatis logout jika tidak digunakan selama 1 jam. Setiap pergerakan kursor atau ketikan keyboard akan otomatis membatalkan waktu logout dan mereset hitungan mundur.{' '}
                    {sessionRemainingSeconds > 0 ? (
                      <span className="font-bold text-emerald-700">
                        Sisa waktu inaktif saat ini:{' '}
                        <span className="font-mono">
                          {(() => {
                            const h = Math.floor(sessionRemainingSeconds / 3600);
                            const m = Math.floor((sessionRemainingSeconds % 3600) / 60);
                            const s = sessionRemainingSeconds % 60;
                            return h > 0
                              ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                              : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                          })()}
                        </span>
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  extendSession();
                  toast.success('Waktu inaktif berhasil di-reset ke 1 jam.');
                }}
                className="text-xs font-bold gap-1.5 rounded-xl border-slate-300 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5 text-emerald-700" />
                <span>Reset Waktu (1 Jam)</span>
              </Button>
            </div>
          )}

          {/* Security Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
            <span>
              Sesi login Anda tersimpan secara lokal dan dilindungi enkripsi standar rekam medis elektronik Kementerian Kesehatan RI.
            </span>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
