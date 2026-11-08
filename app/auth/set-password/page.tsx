'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  KeyRound,
  CheckCircle2,
  XCircle,
  Mail,
  User as UserIcon,
  LogIn,
} from 'lucide-react';
import { useRME } from '@/context/rme-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseJwt } from '@/lib/api-client';
import { toast } from 'sonner';

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerGoogleUserWithPassword, checkAccountStatus, currentUser } = useRME();

  // Extract query parameters
  const paramEmail = searchParams.get('email') || '';
  const paramName = searchParams.get('name') || '';
  const paramToken = searchParams.get('token') || searchParams.get('access_token') || '';
  const paramRefreshToken = searchParams.get('refreshToken') || searchParams.get('refresh_token') || '';
  const paramAvatarUrl = searchParams.get('avatarUrl') || searchParams.get('picture') || '';

  // Resolved user info
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [token, setToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  // Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let resolvedEmail = paramEmail;
    let resolvedName = paramName;
    let resolvedToken = paramToken;
    let resolvedRefreshToken = paramRefreshToken;
    let resolvedAvatar = paramAvatarUrl;

    // Fallback to token decoding
    if (!resolvedEmail && resolvedToken) {
      const decoded = parseJwt(resolvedToken);
      if (decoded) {
        resolvedEmail = decoded.email || decoded.username || decoded.user_name || '';
        resolvedName = decoded.name || (resolvedEmail ? resolvedEmail.split('@')[0] : '');
      }
    }

    // Fallback to localStorage or currentUser
    if (!resolvedEmail && typeof window !== 'undefined') {
      try {
        const savedPending = localStorage.getItem('rme_pending_google_user');
        if (savedPending) {
          const parsed = JSON.parse(savedPending);
          resolvedEmail = parsed.email || resolvedEmail;
          resolvedName = parsed.name || resolvedName;
          resolvedAvatar = parsed.avatarUrl || resolvedAvatar;
          resolvedToken = parsed.token || resolvedToken;
          resolvedRefreshToken = parsed.refreshToken || resolvedRefreshToken;
        }
      } catch {}
    }

    if (!resolvedEmail && currentUser?.email) {
      resolvedEmail = currentUser.email;
      resolvedName = currentUser.name || resolvedName;
      resolvedAvatar = currentUser.avatarUrl || resolvedAvatar;
    }

    const cleanE = resolvedEmail.trim();
    const cleanN = resolvedName || (cleanE ? cleanE.split('@')[0] : 'Pengguna');
    const derivedUser = (cleanE ? cleanE.split('@')[0] : cleanN.toLowerCase().replace(/[^a-z0-9]/g, '')).toLowerCase();

    setEmail(cleanE);
    setName(cleanN);
    setUsername(derivedUser);
    setAvatarUrl(resolvedAvatar);
    setToken(resolvedToken);
    setRefreshToken(resolvedRefreshToken);
  }, [paramEmail, paramName, paramToken, paramRefreshToken, paramAvatarUrl, currentUser]);

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

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Alamat email tidak valid. Harap periksa kembali.');
      return;
    }

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
      const res = await registerGoogleUserWithPassword({
        name: name.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        username,
        avatarUrl,
        password,
        token: token || undefined,
        refreshToken: refreshToken || undefined,
      });

      if (res.success && res.user) {
        setIsSuccess(true);
        // Clear pending storage
        try {
          localStorage.removeItem('rme_pending_google_user');
        } catch {}

        toast.success(`Kata sandi akun berhasil disimpan!`, {
          description: `Akun ${cleanEmail} telah aktif. Anda kini dapat login menggunakan form email & kata sandi kapan saja.`,
          duration: 6000,
        });
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan kata sandi akun.');
        toast.error(res.error || 'Gagal menyimpan kata sandi.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat menyimpan kata sandi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-slate-50 via-emerald-50/25 to-slate-100 p-4 sm:p-6 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="w-full max-w-lg space-y-4">
        {/* Top Brand Link */}
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Kembali ke Halaman Login</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-500">Langkah Terakhir Pendaftaran</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl p-6 sm:p-7 border border-slate-200/90 bg-white shadow-xl shadow-slate-200/70 space-y-5">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-bold">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Pendaftaran via Akun Google Berhasil</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Buat Kata Sandi Akun Anda
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Buatlah kata sandi untuk akun faskes Anda agar nantinya Anda dapat masuk menggunakan{' '}
              <strong className="text-slate-700 font-semibold">formulir Username/Email dan Kata Sandi</strong>.
              Opsi login dengan Akun Google tetap dapat Anda gunakan sewaktu-waktu sebagai alternatif.
            </p>
          </div>

          {/* User Profile Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 border border-slate-200 flex items-center gap-3.5 shadow-xs">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-12 w-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-base flex items-center justify-center shadow-xs shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-slate-900 truncate">{name}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md">
                  <Check className="h-3 w-3" />
                  Google Verified
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  1 Akun Tunggal
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5 flex-wrap">
                <span className="truncate">{email || 'email@google.com'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-bold font-sans">User: @{username || 'user'}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-600 font-medium mt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Hak Akses: <strong className="text-slate-800 font-bold">Super Admin Faskes (Trial 14 Hari)</strong></span>
              </div>
            </div>
          </div>

          {/* Single Unified Account Guarantee Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span>1 Akun Tunggal Terverifikasi Google</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-200/80 text-emerald-900 uppercase tracking-wider">
                  Satu Akun
                </span>
              </div>
              <p className="text-emerald-800/90 text-[11px] leading-relaxed">
                Username (<strong>@{username}</strong>) dan Alamat Email (<strong>{email}</strong>) otomatis diambil langsung dari akun Google Anda. Tidak ada 2 akun yang dibuat. Cukup tentukan kata sandi agar akun tunggal ini dapat dibuka melalui formulir username/email maupun tombol Google.
              </p>
            </div>
          </div>

          {/* SUCCESS VIEW */}
          {isSuccess ? (
            <div className="space-y-4 py-2 animate-in fade-in zoom-in-95">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Kata Sandi Berhasil Disimpan &amp; Akun Siap Digunakan!</span>
                </div>
                <p className="text-xs text-emerald-900/90 leading-relaxed">
                  Akun Anda untuk <strong className="font-bold">{email}</strong> (@{username}) kini telah memiliki kata sandi aktif.
                  Anda dapat langsung menuju Dashboard sistem, atau mencoba masuk menggunakan form login username/email &amp; kata sandi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <Link
                  href="/dashboard"
                  className="w-full h-10 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>Buka Dashboard Faskes</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href={`/login?registered_email=${encodeURIComponent(email)}`}
                  className="w-full h-10 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <LogIn className="h-4 w-4 text-emerald-600" />
                  <span>Uji Form Login Mandiri</span>
                </Link>
              </div>
            </div>
          ) : (
            /* PASSWORD CREATION FORM */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Email & Username Grid (Read-only confirmation) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email (Read-only) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>Alamat Email</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Dari Google
                    </span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="h-9.5 bg-slate-100/80 border-slate-200 text-slate-700 text-xs font-mono rounded-xl cursor-not-allowed"
                  />
                </div>

                {/* Username (Read-only) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span>Username Login</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Otomatis
                    </span>
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={`@${username}`}
                      disabled
                      className="h-9.5 bg-slate-100/80 border-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Kata Sandi Baru</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {password && (
                    <span className={`text-[11px] font-bold ${strength.score <= 2 ? 'text-amber-600' : strength.score <= 4 ? 'text-blue-600' : 'text-emerald-600'}`}>
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
                    className="h-10 pl-3.5 pr-10 text-xs sm:text-sm bg-white border-slate-200 focus:border-emerald-600 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Strength Meter Bar */}
                {password && (
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div className={`h-full transition-all duration-300 ${strength.color} ${strength.barWidth}`} />
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Konfirmasi Kata Sandi</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {confirmPassword && (
                    <span className="text-[11px] font-semibold flex items-center gap-1">
                      {isMatch ? (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Kata sandi cocok
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-0.5">
                          <XCircle className="h-3.5 w-3.5" /> Kata sandi belum cocok
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
                    placeholder="Ketik ulang kata sandi"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className={`h-10 pl-3.5 pr-10 text-xs sm:text-sm bg-white border-slate-200 focus:border-emerald-600 rounded-xl ${
                      confirmPassword && !isMatch ? 'border-rose-300 focus:border-rose-500' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showConfirmPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Informational Callout */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Cara Masuk ke Akun Anda:</span>
                </div>
                <ul className="list-disc pl-4 text-slate-500 text-[11px] leading-relaxed space-y-0.5">
                  <li>
                    <strong className="text-slate-700">Login Utama:</strong> Gunakan form username/email dan kata sandi yang Anda buat ini di halaman Login.
                  </li>
                  <li>
                    <strong className="text-slate-700">Login Alternatif:</strong> Masuk 1-klik dengan Akun Google tetap aktif sebagai alternatif praktis.
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !isLengthValid || !isMatch}
                className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan Kata Sandi Akun...</span>
                  </div>
                ) : (
                  <>
                    <span>Simpan Kata Sandi Akun</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Security & Compliance Footer */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Sistem RME Terenkripsi Standar Kemenkes RI • Permenkes No. 24/2022</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Hak Cipta © 2026 RME Klinik Indonesia.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc]">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <SetPasswordContent />
    </Suspense>
  );
}
