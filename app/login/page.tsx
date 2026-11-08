'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Stethoscope,
  FileText,
  KeyRound,
  Info,
  Phone,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useRME } from '@/context/rme-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { checkBackendHealth, GOOGLE_AUTH_ENDPOINT, openGoogleOAuthPopup, parseJwt } from '@/lib/api-client';
import { toast } from 'sonner';
import { GoogleButton } from '@/components/auth/google-button';
import { GoogleAuthDialog, GoogleAuthUser } from '@/components/auth/google-auth-dialog';
import { GoogleResponseModal } from '@/components/auth/google-response-modal';
import { GoogleSetPasswordDialog, GooglePendingUser } from '@/components/auth/google-set-password-dialog';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, loginWithGoogleToken, loginWithGoogleResponse, checkAccountStatus, registerGoogleUserWithPassword, isAuthenticated, isLoaded } = useRME();

  // Redirect if already authenticated
  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoaded, isAuthenticated, router]);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

  // Mandatory Google Password Creation Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<GooglePendingUser | null>(null);

  // Backend Health State
  const [backendStatus, setBackendStatus] = useState<{ checked: boolean; online: boolean }>({
    checked: false,
    online: false,
  });

  useEffect(() => {
    checkBackendHealth().then((h) => setBackendStatus({ checked: true, online: h.online }));
  }, []);

  // 1. Check for response or token in URL query parameters / hash (e.g. redirected from OAuth)
  useEffect(() => {
    // A. Check if the full JSON response was passed in URL query param (?response=... or ?data=...)
    let jsonString: string | null = null;
    const responseParam = searchParams.get('response') || searchParams.get('res');
    const dataParam = searchParams.get('data');

    if (responseParam) {
      jsonString = decodeURIComponent(responseParam);
    } else if (dataParam) {
      jsonString = decodeURIComponent(dataParam);
    }

    // Also inspect hash fragment (#response=... or #data=...)
    if (!jsonString && typeof window !== 'undefined' && window.location.hash) {
      const hashStr = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hashStr);
      const hashResp = hashParams.get('response') || hashParams.get('res') || hashParams.get('data');
      if (hashResp) {
        jsonString = decodeURIComponent(hashResp);
      }
    }

    if (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.response_code === 200 || parsed.responseResult === true || parsed.data?.token || parsed.token) {
          setIsGoogleLoading(true);
          loginWithGoogleResponse(parsed).then((res) => {
            setIsGoogleLoading(false);
            if (res.success && res.user) {
              const status = checkAccountStatus(res.user.email);
              if (!status.hasPassword) {
                toast.info('Langkah terakhir: Silakan buat kata sandi untuk akun Anda.');
                router.replace(`/auth/set-password?email=${encodeURIComponent(res.user.email)}&name=${encodeURIComponent(res.user.name)}`);
                return;
              }
              const isSaasAdmin = res.user.role === 'SAAS_ADMIN';
              toast.success(`Selamat datang, ${res.user.name}!`, {
                id: 'oauth-success',
                description: isSaasAdmin
                  ? 'Login berhasil sebagai SaaS Platform Admin. Mengarahkan ke SaaS Hub...'
                  : `Login Google berhasil (${res.user.email}). Mengarahkan ke Dashboard...`,
              });
              router.replace(isSaasAdmin ? '/saas' : '/dashboard');
            } else {
              setErrorMessage(res.error || 'Gagal memproses respon autentikasi Google.');
              toast.error(res.error || 'Gagal memproses respon autentikasi Google.');
            }
          });
          return;
        }
      } catch (e) {
        console.warn('[OAuth URL] Failed parsing JSON from query parameter:', e);
      }
    }

    // B. Check for individual token params in searchParams or hash
    let token =
      searchParams.get('token') ||
      searchParams.get('access_token') ||
      searchParams.get('accessToken') ||
      searchParams.get('jwt');
    let refreshToken =
      searchParams.get('refreshToken') ||
      searchParams.get('refresh_token') ||
      undefined;

    if (!token && typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      token = hashParams.get('token') || hashParams.get('access_token');
      if (!refreshToken) {
        refreshToken = hashParams.get('refreshToken') || hashParams.get('refresh_token') || undefined;
      }
    }

    const errorParam =
      searchParams.get('error') ||
      searchParams.get('error_description') ||
      searchParams.get('message');

    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
      toast.error('Autentikasi Google gagal atau dibatalkan.');
      return;
    }

    if (token) {
      setIsGoogleLoading(true);
      loginWithGoogleToken(token, refreshToken).then((res) => {
        setIsGoogleLoading(false);
        if (res.success && res.user) {
          const status = checkAccountStatus(res.user.email);
          if (!status.hasPassword) {
            toast.info('Langkah terakhir: Silakan buat kata sandi untuk akun Anda.');
            router.replace(`/auth/set-password?email=${encodeURIComponent(res.user.email)}&name=${encodeURIComponent(res.user.name)}&token=${encodeURIComponent(token)}`);
            return;
          }
          const isSaasAdmin = res.user.role === 'SAAS_ADMIN';
          toast.success(`Selamat datang, ${res.user.name}!`, {
            id: 'oauth-success',
            description: isSaasAdmin
              ? 'Login berhasil sebagai SaaS Platform Admin. Mengarahkan ke SaaS Hub...'
              : `Login Google berhasil (${res.user.email}). Mengarahkan ke Dashboard...`,
          });
          router.replace(isSaasAdmin ? '/saas' : '/dashboard');
        } else {
          setErrorMessage(res.error || 'Gagal memproses sesi login Google.');
          toast.error(res.error || 'Gagal memproses sesi login Google.');
        }
      });
    }
  }, [searchParams, loginWithGoogleResponse, loginWithGoogleToken, checkAccountStatus, router]);

  // 2. Listen for postMessage from popup OAuth window
  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      if (!event.data) return;
      let payload = event.data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {}
      }
      if (!payload || typeof payload !== 'object') return;

      // Case A: Full backend response structure
      if (
        payload.response_code === 200 ||
        payload.responseResult === true ||
        (payload.data && (payload.data.token || payload.data.access_token))
      ) {
        setIsGoogleLoading(true);
        const res = await loginWithGoogleResponse(payload);
        setIsGoogleLoading(false);
        if (res.success && res.user) {
          const status = checkAccountStatus(res.user.email);
          if (!status.hasPassword) {
            router.replace(`/auth/set-password?email=${encodeURIComponent(res.user.email)}&name=${encodeURIComponent(res.user.name)}`);
            return;
          }
          const isSaasAdmin = res.user.role === 'SAAS_ADMIN';
          toast.success(`Selamat datang, ${res.user.name}!`, {
            id: 'oauth-success',
            description: isSaasAdmin
              ? 'Login berhasil sebagai SaaS Platform Admin. Mengarahkan ke SaaS Hub...'
              : `Login Google berhasil (${res.user.email}). Mengarahkan ke Dashboard...`,
          });
          router.replace(isSaasAdmin ? '/saas' : '/dashboard');
        } else {
          setErrorMessage(res.error || 'Gagal memproses respon Google.');
          toast.error(res.error || 'Gagal memproses respon Google.');
        }
        return;
      }

      // Case B: Explicit GOOGLE_AUTH_SUCCESS event
      if (payload.type === 'GOOGLE_AUTH_SUCCESS') {
        const { token, refreshToken, user } = payload;
        if (token) {
          setIsGoogleLoading(true);
          const res = await loginWithGoogleToken(token, refreshToken, user);
          setIsGoogleLoading(false);
          if (res.success && res.user) {
            const status = checkAccountStatus(res.user.email);
            if (!status.hasPassword) {
              router.replace(`/auth/set-password?email=${encodeURIComponent(res.user.email)}&name=${encodeURIComponent(res.user.name)}&token=${encodeURIComponent(token)}`);
              return;
            }
            const isSaasAdmin = res.user.role === 'SAAS_ADMIN';
            toast.success(`Selamat datang, ${res.user.name}!`, {
            id: 'oauth-success',
              description: isSaasAdmin
                ? 'Login berhasil sebagai SaaS Platform Admin. Mengarahkan ke SaaS Hub...'
                : `Login berhasil dengan Akun Google (${res.user.email}). Mengarahkan ke Dashboard...`,
            });
            router.replace(isSaasAdmin ? '/saas' : '/dashboard');
          } else {
            setErrorMessage(res.error || 'Gagal memproses sesi login Google.');
            toast.error(res.error || 'Gagal memproses sesi login Google.');
          }
        }
      } else if (payload.type === 'GOOGLE_AUTH_ERROR') {
        setIsGoogleLoading(false);
        setErrorMessage(payload.error || 'Autentikasi Google dibatalkan.');
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [loginWithGoogleResponse, loginWithGoogleToken, checkAccountStatus, router]);

  // 3. Initiate Google OAuth via direct full-page redirect or dialog
  const handleInitiateGoogleOAuth = () => {
    // If backend is offline, open interactive GoogleAuthDialog directly for seamless flow
    if (backendStatus.checked && !backendStatus.online) {
      setIsGoogleModalOpen(true);
      return;
    }

    setIsGoogleLoading(true);
    setErrorMessage(null);

    // Determine frontend origin dynamically
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const authEndpointWithState = currentOrigin
      ? `${GOOGLE_AUTH_ENDPOINT}?state=${encodeURIComponent(currentOrigin)}`
      : GOOGLE_AUTH_ENDPOINT;

    toast.info('Mengalihkan ke halaman autentikasi Google...');
    window.location.href = authEndpointWithState;
  };

  const handleGoogleAccountSelect = async (gUser: GoogleAuthUser) => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      // Step A: Check if account already exists & has password
      const status = checkAccountStatus(gUser.email);
      if (status.exists && status.hasPassword) {
        let res;
        if (gUser.rawResponse) {
          res = await loginWithGoogleResponse(gUser.rawResponse);
        } else {
          res = await loginWithGoogle(gUser);
        }
        if (res.success && res.user) {
          const isSaasAdmin = res.user.role === 'SAAS_ADMIN';
          toast.success(`Selamat datang, ${res.user.name}!`, {
            id: 'oauth-success',
            description: isSaasAdmin
              ? 'Login berhasil sebagai SaaS Platform Admin. Mengarahkan ke SaaS Hub...'
              : `Login berhasil dengan Akun Google (${gUser.email}). Mengarahkan ke Dashboard...`,
          });
          router.push(isSaasAdmin ? '/saas' : '/dashboard');
        } else {
          setErrorMessage(res.error || 'Gagal masuk dengan akun Google.');
          toast.error(res.error || 'Gagal masuk dengan akun Google.');
        }
      } else {
        // Step B: Account doesn't exist or has no password -> Direct to /auth/set-password
        try {
          localStorage.setItem('rme_pending_google_user', JSON.stringify(gUser));
        } catch {}
        setIsGoogleModalOpen(false);
        router.push(`/auth/set-password?email=${encodeURIComponent(gUser.email)}&name=${encodeURIComponent(gUser.name)}`);
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kendala saat proses autentikasi Google.');
      toast.error('Gagal menghubungkan akun Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCompleteGooglePassword = async (password: string) => {
    if (!pendingGoogleUser) return;
    const res = await registerGoogleUserWithPassword({
      name: pendingGoogleUser.name,
      email: pendingGoogleUser.email,
      username: pendingGoogleUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, ''),
      avatarUrl: pendingGoogleUser.avatarUrl,
      password,
      token: pendingGoogleUser.token,
      refreshToken: pendingGoogleUser.refreshToken,
    });

    if (res.success && res.user) {
      setIsPasswordModalOpen(false);
      const isSaasAdmin = res.user.role === 'SAAS_ADMIN';
      toast.success(`Akun Google Berhasil Didaftarkan!`, {
        description: `Kata sandi Anda telah tersimpan. Anda sekarang dapat login menggunakan form email & kata sandi.`,
        duration: 6000,
      });
      router.replace(isSaasAdmin ? '/saas' : '/dashboard');
    } else {
      throw new Error(res.error || 'Gagal menyimpan kata sandi akun.');
    }
  };

  // Restore remembered email or prefill registered email on mount
  useEffect(() => {
    const regEmail = searchParams.get('registered_email');
    if (regEmail) {
      setEmail(decodeURIComponent(regEmail));
      toast.success('Kata sandi Anda siap digunakan!', {
        description: `Silakan masuk menggunakan form login dengan email (${regEmail}) dan kata sandi Anda.`,
        duration: 7000,
      });
      return;
    }
    try {
      const remembered = localStorage.getItem('rme_remembered_email');
      if (remembered) {
        setEmail(remembered);
      }
    } catch {}
  }, [searchParams]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Alamat email atau nama pengguna wajib diisi.');
      return;
    }

    if (!password) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      // Remember email preference
      if (rememberMe && cleanEmail.includes('@')) {
        try {
          localStorage.setItem('rme_remembered_email', cleanEmail);
        } catch {}
      } else {
        try {
          localStorage.removeItem('rme_remembered_email');
        } catch {}
      }

      const res = await login(cleanEmail, password);
      if (res.success && res.user) {
        const isSaasAdmin = res.user.role === 'SAAS_ADMIN';
        toast.success(`Selamat datang, ${res.user.name}!`, {
            id: 'oauth-success',
          description: isSaasAdmin
            ? 'Login berhasil sebagai SaaS Platform Admin. Mengarahkan ke SaaS Hub...'
            : `Sesi login aktif sebagai ${res.user.role === 'DOCTOR' ? 'Dokter' : 'Petugas'}.`,
        });
        router.push(isSaasAdmin ? '/saas' : '/dashboard');
      } else {
        setErrorMessage(res.error || 'Gagal masuk. Periksa kembali kredensial Anda.');
        toast.error(res.error || 'Gagal masuk. Periksa kembali kredensial Anda.');
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kendala saat proses autentikasi. Silakan coba kembali.');
      toast.error('Gagal menghubungkan ke server autentikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoaded && isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-600">Mengarahkan ke Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* LEFT COLUMN: Doctor in Practice Showcase & Clinical Trust Badges (Desktop) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-emerald-500/20 bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-900 text-white shadow-2xl">
        {/* Ambient Decorative Light Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl bg-emerald-400/20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-72 h-72 rounded-full blur-3xl bg-teal-300/15 pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg bg-white p-1.5 overflow-hidden border border-white/40">
              <img src="/logo.png" alt="Logo RME" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white drop-shadow-xs">
                  RME Klinik
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md">
                  v2.0 Pro • Kemenkes RI
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Sistem Rekam Medis Elektronik Terintegrasi Standar Kemenkes RI
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white border border-white/25 backdrop-blur-md transition-all duration-200"
            title="Kunjungi Beranda"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Beranda
          </Link>
        </div>

        {/* Center Doctor Practice Showcase */}
        <div className="relative z-10 my-auto py-6 space-y-6">
          <div className="relative group">
            <div className="relative rounded-3xl p-3 sm:p-4 overflow-hidden border border-white/30 backdrop-blur-md bg-white/15 shadow-2xl transition-all duration-300">
              <div className="relative w-full h-72 sm:h-80 xl:h-88 rounded-2xl overflow-hidden shadow-inner bg-slate-900">
                <img
                  src="/images/doctor_in_practice.jpg"
                  alt="Dokter Sedang Praktik Melayani Rekam Medis Pasien"
                  className="w-full h-full object-cover object-center transform group-hover:scale-103 transition-transform duration-500 ease-out"
                />

                {/* Floating Active Doctor Practice Status Badge */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/85 text-white border border-slate-700/80 backdrop-blur-md shadow-lg">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <div className="text-[11px] font-medium leading-none">
                    <span className="text-slate-300 font-bold">Praktik Dokter Aktif</span> •{' '}
                    <span className="text-emerald-400 font-bold">Sistem Terintegrasi</span>
                  </div>
                </div>

                {/* Floating SatuSehat & Compliance Badge */}
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-700/90 text-white border border-emerald-400/50 backdrop-blur-md shadow-lg">
                  <ShieldCheck className="h-4 w-4 text-emerald-200" />
                  <span className="text-[11px] font-bold">SatuSehat &amp; Permenkes No. 24/2022</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Features Pills */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl border border-white/20 bg-white/15 backdrop-blur-md text-white">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-white/20 text-white">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold">SOAP &amp; ICD-10</span>
              </div>
              <p className="text-[11px] text-emerald-100 leading-snug">
                Diagnosis akurat dengan kamus ICD-10 otomatis &amp; riwayat klinis.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-white/20 bg-white/15 backdrop-blur-md text-white">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-white/20 text-white">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold">E-Resep &amp; Stok</span>
              </div>
              <p className="text-[11px] text-emerald-100 leading-snug">
                Signa resep standar &amp; pemotongan kuantitas obat otomatis.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="relative z-10 flex items-center justify-between text-[11px] pt-4 border-t border-white/20 text-emerald-100 font-medium">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>Koneksi Enkripsi SSL 256-bit Aman</span>
          </div>
          <span>Kementerian Kesehatan Republik Indonesia</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Focused Login Card */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-6 sm:px-8 lg:px-12 relative w-full overflow-y-auto">
        <div className="w-full max-w-xl space-y-3.5 mx-auto">
          {/* Top Row: Back to Landing */}
          <div className="flex items-center pb-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Kembali ke Beranda
            </Link>
          </div>

          {/* Mobile Header (Visible on Mobile/Tablet) */}
          <div className="lg:hidden flex flex-col items-center text-center space-y-1.5 py-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg bg-white p-1.5 overflow-hidden border border-slate-200">
              <img src="/logo.png" alt="Logo RME" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900">RME Klinik</div>
              <p className="text-xs text-slate-500">
                Sistem Rekam Medis Elektronik Terintegrasi Kemenkes RI
              </p>
            </div>
          </div>

          {/* Main Auth Card Container - Full width inside max-w-xl */}
          <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200 bg-white shadow-xl shadow-slate-200/60 w-full space-y-5">
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-1">
                Masuk ke Sistem
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Silakan masukkan alamat email atau username dan kata sandi Anda.
              </p>
            </div>



            {/* Error Banner Alert */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Identifier Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Alamat Email atau Nama Pengguna</span>
                  <span className="text-[10px] text-slate-400 font-normal">Wajib</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    required
                    placeholder="contoh: admin@gmail.com atau dr.budi@rme.id"
                    value={email}
                    disabled={isLoading}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="h-11 pl-10 text-xs sm:text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 rounded-xl w-full"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Kata Sandi</label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Lupa Sandi?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi akun"
                    value={password}
                    disabled={isLoading}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="h-11 pl-10 pr-10 text-xs sm:text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 rounded-xl w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <span>Ingat alamat email saya di perangkat ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11.5 gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Kredensial...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span>Masuk ke Sistem RME</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                atau masuk dengan google
              </span>
            </div>

            {/* Google One-Click Login Button */}
            <div className="space-y-2">
              <GoogleButton
                label="Masuk dengan Akun Google"
                isLoading={isGoogleLoading}
                onClick={handleInitiateGoogleOAuth}
              />
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(true)}
                  className="text-[11px] text-slate-400 hover:text-emerald-700 transition-colors font-medium cursor-pointer"
                >
                  Atau gunakan akun pengujian demo lokal →
                </button>
              </div>
            </div>

            {/* Link to Dedicated Register Page */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Belum memiliki akun faskes?{' '}
                <Link
                  href="/register"
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
                >
                  Daftar Akun Baru Sekarang →
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Security Compliance */}
          <div className="text-center space-y-1 pb-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Standar Permenkes No. 24/2022 • SatuSehat Terintegrasi</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Hak Cipta © 2026 RME Klinik Indonesia.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password / Credential Helper Dialog */}
      <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-slate-900">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Bantuan Akses Akun</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">Informasi pemulihan kata sandi</p>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 text-xs space-y-2 text-slate-700">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-xs">Lupa Kata Sandi?</span>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
                    Untuk menjaga keamanan data medis pasien sesuai standar kepatuhan medis, pemulihan atau reset kata sandi dapat dilakukan melalui administrator faskes atau kontak bantuan teknis.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-slate-50 text-[10px] sm:text-[11px] space-y-1 text-slate-600">
              <div className="font-bold text-slate-800">Kontak Bantuan Helpdesk:</div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-700" />
                <span>WA: 0812-3456-7890 / support@rme.id</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-xs rounded-xl font-bold"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Google Account Selector Dialog */}
      <GoogleAuthDialog
        open={isGoogleModalOpen}
        onOpenChange={setIsGoogleModalOpen}
        onSelectAccount={handleGoogleAccountSelect}
        title="Masuk dengan Akun Google"
        description="Pilih akun Google Anda untuk langsung masuk ke RME tanpa repot mengisi data"
      />
      {/* Direct Google Response Resolver Modal */}
      <GoogleResponseModal
        open={isResponseModalOpen}
        onOpenChange={setIsResponseModalOpen}
      />

      {/* Mandatory Password Creation Dialog for Google Account */}
      <GoogleSetPasswordDialog
        open={isPasswordModalOpen}
        onOpenChange={setIsPasswordModalOpen}
        pendingUser={pendingGoogleUser}
        onComplete={handleCompleteGooglePassword}
        onCancel={() => {
          setPendingGoogleUser(null);
          toast.info('Pendaftaran kata sandi Google dibatalkan.');
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc]">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
