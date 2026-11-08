'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  AlertCircle,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  XCircle,
  AtSign,
  Mail,
} from 'lucide-react';

export interface GooglePendingUser {
  name: string;
  email: string;
  avatarUrl?: string;
  token?: string;
  refreshToken?: string;
  rawResponse?: any;
}

interface GoogleSetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingUser: GooglePendingUser | null;
  onComplete: (password: string) => Promise<void>;
  onCancel?: () => void;
}

export function GoogleSetPasswordDialog({
  open,
  onOpenChange,
  pendingUser,
  onComplete,
  onCancel,
}: GoogleSetPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password strength calculation
  const calculateStrength = (pwd: string): { score: number; label: string; color: string; barWidth: string } => {
    if (!pwd) return { score: 0, label: 'Belum diisi', color: 'bg-slate-200', barWidth: 'w-0' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { score, label: 'Lemah', color: 'bg-amber-500', barWidth: 'w-1/3' };
    } else if (score <= 4) {
      return { score, label: 'Sedang', color: 'bg-blue-500', barWidth: 'w-2/3' };
    } else {
      return { score, label: 'Kuat & Aman', color: 'bg-emerald-500', barWidth: 'w-full' };
    }
  };

  const strength = calculateStrength(password);
  const isLengthValid = password.length >= 6;
  const isMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isLengthValid) {
      setErrorMsg('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete(password);
      // Reset form on success
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat menyimpan kata sandi. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    if (isSubmitting) return;
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  if (!pendingUser) return null;

  const initials = pendingUser.name
    ? pendingUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const derivedUsername = pendingUser
    ? pendingUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '')
    : '';

  return (
    <Dialog open={open} onOpenChange={handleDismiss} maxWidth="md">
      <div className="space-y-4 text-slate-900">
        {/* Header with Trust Badges */}
        <div className="flex items-start gap-3.5 pb-3 border-b border-slate-100">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0 mt-0.5">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Buat Kata Sandi Akun Google Anda
              </h3>
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                1 Akun Tunggal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              Username dan alamat email akun faskes Anda diambil langsung dari profil Google. Buat kata sandi agar akun yang sama ini dapat Anda akses lewat formulir username/email.
            </p>
          </div>
        </div>

        {/* User Identity Preview Card */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 border border-slate-200/80 flex items-center gap-3">
          {pendingUser.avatarUrl ? (
            <img
              src={pendingUser.avatarUrl}
              alt={pendingUser.name}
              className="h-11 w-11 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
            />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900 truncate">
                {pendingUser.name}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-md">
                <Check className="h-3 w-3" />
                Google Verified
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono truncate mt-0.5">
              <span>{pendingUser.email}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold font-sans">User: @{derivedUsername}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-600 font-medium">
              <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
              <span>Hak Akses: <strong className="text-slate-800">Super Admin Faskes (Trial 14 Hari)</strong></span>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Read-Only Linked Credentials from Google */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-400" />
                  Alamat Email
                </span>
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                  Dari Google
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 truncate shadow-xs">
                {pendingUser.email}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <AtSign className="h-3 w-3 text-slate-400" />
                  Username Login
                </span>
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                  Otomatis
                </span>
              </div>
              <div className="text-xs font-bold text-emerald-800 font-mono bg-emerald-50/50 border border-emerald-200 rounded-lg px-2.5 py-1.5 truncate shadow-xs">
                @{derivedUsername}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* New Password Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Lock className="h-3 w-3 text-slate-400" />
                <span>Kata Sandi Baru</span>
                <span className="text-rose-500">*</span>
              </label>
              {password && (
                <span className={`text-[10px] font-bold ${strength.score <= 2 ? 'text-amber-600' : strength.score <= 4 ? 'text-blue-600' : 'text-emerald-600'}`}>
                  Kekuatan: {strength.label}
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isSubmitting}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="h-9.5 pl-3.5 pr-10 text-xs sm:text-sm bg-white border-slate-200 focus:border-emerald-600 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength Progress Bar */}
            {password && (
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-300 ${strength.color} ${strength.barWidth}`}
                />
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Lock className="h-3 w-3 text-slate-400" />
                <span>Konfirmasi Kata Sandi</span>
                <span className="text-rose-500">*</span>
              </label>
              {confirmPassword && (
                <span className="text-[10px] font-semibold flex items-center gap-1">
                  {isMatch ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Cocok
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-0.5">
                      <XCircle className="h-3 w-3" /> Tidak Cocok
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                disabled={isSubmitting}
                placeholder="Ketik ulang kata sandi baru"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className={`h-9.5 pl-3.5 pr-10 text-xs sm:text-sm bg-white border-slate-200 focus:border-emerald-600 rounded-xl ${
                  confirmPassword && !isMatch ? 'border-rose-300 focus:border-rose-500' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-2.5 h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showConfirmPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Benefit Explanation Box */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Fleksibilitas Login 2-in-1:</span>
            </div>
            <ul className="list-disc pl-4 text-slate-500 leading-tight space-y-0.5 text-[10.5px]">
              <li>Bisa login cepat 1-klik dengan Akun Google</li>
              <li>Bisa login manual tanpa Google menggunakan email ini &amp; kata sandi yang dibuat</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDismiss}
              className="text-xs h-9 px-3 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Batalkan Pendaftaran
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isLengthValid || !isMatch}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold h-9 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan Kata Sandi...</span>
                </div>
              ) : (
                <>
                  <span>Simpan Sandi &amp; Buka Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
