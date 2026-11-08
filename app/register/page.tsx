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
  AlertCircle,
  Sparkles,
  User as UserIcon,
  CheckCircle2,
} from 'lucide-react';
import { useRME } from '@/context/rme-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkBackendHealth, registerWithBackend, GOOGLE_AUTH_ENDPOINT, openGoogleOAuthPopup, parseJwt } from '@/lib/api-client';
import { toast } from 'sonner';
import { GoogleButton } from '@/components/auth/google-button';
import { GoogleAuthDialog, GoogleAuthUser } from '@/components/auth/google-auth-dialog';
import { GoogleResponseModal } from '@/components/auth/google-response-modal';
import { GoogleSetPasswordDialog, GooglePendingUser } from '@/components/auth/google-set-password-dialog';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    isLoaded,
    addUser,
    startNewUserTrial,
    loginWithGoogle,
    loginWithGoogleToken,
    loginWithGoogleResponse,
    checkAccountStatus,
    registerGoogleUserWithPassword,
  } = useRME();

  // Redirect if already authenticated
  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoaded, isAuthenticated, router]);

  // Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState<string | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

  // Single Unified Google Account State
  const [linkedGoogleUser, setLinkedGoogleUser] = useState<GoogleAuthUser | null>(null);
  const regUsername = linkedGoogleUser
    ? (regEmail.split('@')[0] || regName.toLowerCase().replace(/[^a-z0-9]/g, '')).toLowerCase()
    : '';

  // Mandatory Google Password Creation Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<GooglePendingUser | null>(null);

  // Restore pending google user if previously saved
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rme_pending_google_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          setLinkedGoogleUser(parsed);
          setRegName(parsed.name || parsed.email.split('@')[0]);
          setRegEmail(parsed.email);
        }
      }
    } catch {}
  }, []);

  // 1. Check for token in URL parameters (e.g. returning from OAuth redirect)
  useEffect(() => {
    const token =
      searchParams.get('token') ||
      searchParams.get('access_token') ||
      searchParams.get('accessToken') ||
      searchParams.get('jwt');
    const refreshToken =
      searchParams.get('refreshToken') ||
      searchParams.get('refresh_token') ||
      undefined;
    const errorParam =
      searchParams.get('error') ||
      searchParams.get('error_description') ||
      searchParams.get('message');

    if (errorParam) {
      setRegisterError(decodeURIComponent(errorParam));
      toast.error('Autentikasi Google gagal atau dibatalkan.');
      return;
    }

    if (token) {
      // Decode user profile if possible
      const decoded = parseJwt(token);
      const email = searchParams.get('email') || decoded?.email || decoded?.user_name || decoded?.username;
      const name = searchParams.get('name') || decoded?.name || (email ? email.split('@')[0] : 'Pengguna Google');

      if (email) {
        const status = checkAccountStatus(email);
        if (status.exists && status.hasPassword) {
          setIsGoogleLoading(true);
          loginWithGoogleToken(token, refreshToken).then((res) => {
            setIsGoogleLoading(false);
            if (res.success && res.user) {
              toast.success(`Selamat datang kembali, ${res.user.name}!`, {
                description: `Akun Google (${res.user.email}) terverifikasi. Membuka Dashboard...`,
              });
              router.replace('/dashboard');
            }
          });
          return;
        } else {
          // Account doesn't exist yet or has no password -> Route to /auth/set-password to fill in password
          toast.info('Pendaftaran Google terhubung. Silakan buat kata sandi untuk akun Anda.');
          router.replace(`/auth/set-password?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&token=${encodeURIComponent(token)}`);
          return;
        }
      }

      setIsGoogleLoading(true);
      loginWithGoogleToken(token, refreshToken).then((res) => {
        setIsGoogleLoading(false);
        if (res.success && res.user) {
          const status = checkAccountStatus(res.user.email);
          if (!status.hasPassword) {
            toast.info('Pendaftaran Google terhubung. Silakan buat kata sandi untuk akun Anda.');
            router.replace(`/auth/set-password?email=${encodeURIComponent(res.user.email)}&name=${encodeURIComponent(res.user.name)}&token=${encodeURIComponent(token)}`);
          } else {
            toast.success(`Selamat datang, ${res.user.name}!`, {
              description: `Akun Google (${res.user.email}) berhasil terdaftar dan trial 14 hari aktif.`,
              duration: 6000,
            });
            router.replace('/dashboard');
          }
        } else {
          setRegisterError(res.error || 'Gagal memproses sesi login Google.');
          toast.error(res.error || 'Gagal memproses sesi login Google.');
        }
      });
    }
  }, [searchParams, loginWithGoogleToken, checkAccountStatus, router]);

  // 2. Listen for postMessage from popup OAuth window
  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const { token, refreshToken, user } = event.data;
        const email = user?.email;
        if (email) {
          const status = checkAccountStatus(email);
          if (status.exists && status.hasPassword) {
            if (token) {
              setIsGoogleLoading(true);
              const res = await loginWithGoogleToken(token, refreshToken, user);
              setIsGoogleLoading(false);
              if (res.success && res.user) {
                toast.success(`Selamat datang kembali, ${res.user.name}!`);
                router.replace('/dashboard');
              }
            }
            return;
          }
        }

        // Account needs mandatory password setup -> direct to /auth/set-password
        router.replace(`/auth/set-password?email=${encodeURIComponent(email)}&name=${encodeURIComponent(user?.name || '')}&token=${encodeURIComponent(token || '')}`);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        setIsGoogleLoading(false);
        setRegisterError(event.data.error || 'Pendaftaran Google dibatalkan.');
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [loginWithGoogleToken, checkAccountStatus, router]);

  // 3. Initiate Google OAuth via direct full-page redirect or interactive dialog
  const handleInitiateGoogleOAuth = () => {
    // If backend is offline, open interactive GoogleAuthDialog directly for seamless flow
    if (backendStatus.checked && !backendStatus.online) {
      setIsGoogleModalOpen(true);
      return;
    }

    setIsGoogleLoading(true);
    setRegisterError(null);

    // Determine frontend origin dynamically
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const authEndpointWithState = currentOrigin
      ? `${GOOGLE_AUTH_ENDPOINT}?state=${encodeURIComponent(currentOrigin)}`
      : GOOGLE_AUTH_ENDPOINT;

    toast.info('Mengalihkan ke halaman autentikasi Google...');
    window.location.href = authEndpointWithState;
  };

  // 4. Handle Google Account Selection (from Dialog or OAuth flow)
  const handleGoogleRegister = async (gUser: GoogleAuthUser) => {
    setIsGoogleLoading(true);
    setRegisterError(null);
    try {
      // Step A: Check if account already exists & has password
      const status = checkAccountStatus(gUser.email);
      if (status.exists && status.hasPassword) {
        // Account already available with password -> log in directly
        let res;
        if (gUser.rawResponse) {
          res = await loginWithGoogleResponse(gUser.rawResponse);
        } else {
          res = await loginWithGoogle(gUser);
        }
        if (res.success && res.user) {
          toast.success(`Selamat datang kembali, ${res.user.name}!`, {
            description: `Akun Google Anda (${res.user.email}) sudah terdaftar. Mengalihkan ke Dashboard...`,
          });
          router.replace('/dashboard');
        } else {
          setRegisterError(res.error || 'Gagal masuk dengan akun Google.');
          toast.error(res.error || 'Gagal masuk dengan akun Google.');
        }
      } else {
        // Step B: Account does NOT exist yet or has NO password
        // Link Google user directly into registration form on this page!
        setLinkedGoogleUser(gUser);
        setRegName(gUser.name);
        setRegEmail(gUser.email);
        setRegPassword('');
        setRegConfirmPassword('');
        try {
          localStorage.setItem('rme_pending_google_user', JSON.stringify(gUser));
        } catch {}
        setIsGoogleModalOpen(false);
        toast.info('Akun Google terhubung sebagai 1 Akun Tunggal.', {
          description: `Username (@${gUser.email.split('@')[0]}) dan email diambil langsung dari profil Google. Silakan buat kata sandi untuk akun ini.`,
          duration: 6000,
        });
      }
    } catch (err: any) {
      setRegisterError('Terjadi kendala saat memeriksa akun Google.');
      toast.error('Gagal menghubungkan pendaftaran akun Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 5. Complete Google User Registration With Mandatory Password
  const handleCompleteGooglePassword = async (password: string) => {
    if (!pendingGoogleUser) return;
    const res = await registerGoogleUserWithPassword({
      name: pendingGoogleUser.name,
      email: pendingGoogleUser.email,
      avatarUrl: pendingGoogleUser.avatarUrl,
      password,
      token: pendingGoogleUser.token,
      refreshToken: pendingGoogleUser.refreshToken,
    });

    if (res.success && res.user) {
      setIsPasswordModalOpen(false);
      toast.success(`Akun faskes berhasil didaftarkan via Google!`, {
        description: `Selamat datang, ${res.user.name}! Kata sandi Anda telah tersimpan dan masa uji coba 14 hari penuh telah aktif.`,
        duration: 6000,
      });
      router.replace('/dashboard');
    } else {
      throw new Error(res.error || 'Gagal menyimpan kata sandi untuk akun ini.');
    }
  };

  // Backend Health State
  const [backendStatus, setBackendStatus] = useState<{
    checked: boolean;
    online: boolean;
    message?: string;
  }>({
    checked: false,
    online: false,
  });

  useEffect(() => {
    const checkStatus = async () => {
      const health = await checkBackendHealth();
      setBackendStatus({
        checked: true,
        online: health.online,
        message: health.message,
      });
    };
    checkStatus();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccessMsg(null);

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanName) {
      setRegisterError('Nama lengkap dokter atau admin tenant wajib diisi.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setRegisterError('Format alamat email tidak valid.');
      return;
    }

    if (regPassword.length < 6) {
      setRegisterError('Kata sandi minimal 6 karakter sesuai standar keamanan.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegisterError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (linkedGoogleUser) {
      setIsRegistering(true);
      try {
        const res = await registerGoogleUserWithPassword({
          name: cleanName,
          email: cleanEmail,
          username: regUsername,
          avatarUrl: linkedGoogleUser.avatarUrl,
          password: regPassword,
          token: linkedGoogleUser.rawResponse?.data?.token || linkedGoogleUser.rawResponse?.token,
          refreshToken: linkedGoogleUser.rawResponse?.data?.refreshToken || linkedGoogleUser.rawResponse?.refreshToken,
        });

        if (res.success && res.user) {
          try {
            localStorage.removeItem('rme_pending_google_user');
          } catch {}
          toast.success(`Akun faskes berhasil didaftarkan via Google!`, {
            description: `Selamat datang, ${res.user.name}! Akun tunggal Anda aktif dengan trial 14 hari. Anda dapat login menggunakan Username (@${regUsername}) atau Email & kata sandi.`,
            duration: 6000,
          });
          router.replace('/dashboard');
        } else {
          setRegisterError(res.error || 'Gagal menyimpan kata sandi akun.');
          toast.error(res.error || 'Gagal mendaftar akun.');
        }
      } catch (err: any) {
        setRegisterError(err?.message || 'Terjadi kendala saat mendaftarkan akun.');
        toast.error('Gagal menyelesaikan pendaftaran.');
      } finally {
        setIsRegistering(false);
      }
      return;
    }

    setIsRegistering(true);
    try {
      const res = await registerWithBackend(cleanName, cleanEmail, regPassword);

      if (res.success) {
        // Register account in state as role SUPERADMIN with full clinical & management access
        addUser({
          name: cleanName,
          email: cleanEmail,
          password: regPassword,
          role: 'SUPERADMIN',
          appMode: 'DOCTOR_AND_ADMIN',
          title: 'Super Admin Faskes / Pemilik Praktik',
          status: 'ACTIVE',
        });

        // Start 14-day trial countdown
        startNewUserTrial(14);

        const successTitle = res.message || 'Registrasi berhasil sebagai Super Admin Faskes!';
        toast.success(successTitle, {
          description: `Akun ${cleanEmail} aktif sebagai Super Admin dengan masa uji coba (trial) 14 hari penuh. Silakan masuk.`,
          duration: 6000,
        });
        setRegisterSuccessMsg(
          `Akun faskes untuk ${cleanEmail} telah berhasil terdaftar! Anda mendapatkan masa trial gratis 14 hari dengan hak akses Super Admin penuh (Pendaftaran, Rekam Medis SOAP, Kasir, hingga Pembayaran Invoice).`
        );
      } else {
        setRegisterError(res.error || 'Gagal mendaftarkan akun ke server backend.');
        toast.error(res.error || 'Gagal mendaftarkan akun.');
      }
    } catch (err: any) {
      console.warn('[Register] Request failed:', err);
      setRegisterError(err?.message || 'Terjadi kendala saat menghubungkan ke server registrasi.');
      toast.error('Tidak dapat menghubungi server registrasi.');
    } finally {
      setIsRegistering(false);
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
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-y-auto lg:overflow-hidden">
      {/* LEFT COLUMN: Doctor in Practice Showcase & Clinical Trust Badges (Desktop) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-6 xl:p-8 overflow-hidden border-r border-emerald-500/20 bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-900 text-white shadow-2xl h-full">
        {/* Ambient Decorative Light Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl bg-emerald-400/20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-72 h-72 rounded-full blur-3xl bg-teal-300/15 pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg bg-white p-1 overflow-hidden border border-white/40">
              <img src="/logo.png" alt="Logo RME" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white drop-shadow-xs">
                  RME Klinik
                </span>
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md">
                  v2.0 Pro • Kemenkes RI
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
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
        <div className="relative z-10 my-auto py-2 space-y-3 flex flex-col justify-center">
          <div className="relative group">
            <div className="relative rounded-2xl p-2.5 overflow-hidden border border-white/30 backdrop-blur-md bg-white/15 shadow-xl transition-all duration-300">
              <div className="relative w-full h-44 xl:h-56 rounded-xl overflow-hidden shadow-inner bg-slate-900">
                <img
                  src="/images/doctor_in_practice.jpg"
                  alt="Dokter Sedang Praktik Melayani Rekam Medis Pasien"
                  className="w-full h-full object-cover object-center transform group-hover:scale-103 transition-transform duration-500 ease-out"
                />

                {/* Floating Active Doctor Practice Status Badge */}
                <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/85 text-white border border-slate-700/80 backdrop-blur-md shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <div className="text-[10px] font-medium leading-none">
                    <span className="text-slate-300 font-bold">Layanan Dokter Aktif</span> •{' '}
                    <span className="text-emerald-400 font-bold">Klinik</span>
                  </div>
                </div>

                {/* Floating SatuSehat & Compliance Badge */}
                <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-700/90 text-white border border-emerald-400/50 backdrop-blur-md shadow-lg">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" />
                  <span className="text-[10px] font-bold">SatuSehat &amp; Permenkes No. 24/2022</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Features Pills */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl border border-white/20 bg-white/15 backdrop-blur-md text-white">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="p-1 rounded bg-white/20 text-white">
                  <Stethoscope className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold">Trial 14 Hari Gratis</span>
              </div>
              <p className="text-[10px] text-emerald-100 leading-tight">
                Nikmati akses seluruh modul rekam medis, antrian &amp; kasir tanpa biaya.
              </p>
            </div>

            <div className="p-2.5 rounded-xl border border-white/20 bg-white/15 backdrop-blur-md text-white">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="p-1 rounded bg-white/20 text-white">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold">Aktivasi Otomatis</span>
              </div>
              <p className="text-[10px] text-emerald-100 leading-tight">
                Akun langsung aktif dan siap digunakan untuk input data pasien.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="relative z-10 flex items-center justify-between text-[10px] pt-3 border-t border-white/20 text-emerald-100 font-medium shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span>Koneksi Enkripsi SSL 256-bit Aman</span>
          </div>
          <span>Kementerian Kesehatan RI</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Focused Registration Card */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-2 sm:px-6 lg:px-8 relative w-full h-full lg:overflow-hidden overflow-y-auto">
        <div className="w-full max-w-lg mx-auto flex flex-col justify-center h-full max-h-[100vh] py-1">
          {/* Back to landing page link */}
          <div className="flex items-center pb-1 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Kembali ke Beranda
            </Link>
          </div>

          {/* Mobile Header (Visible on Mobile/Tablet) */}
          <div className="lg:hidden flex flex-col items-center text-center space-y-1 py-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg bg-white p-1 overflow-hidden border border-slate-200">
              <img src="/logo.png" alt="Logo RME" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-slate-900">RME Klinik</div>
              <p className="text-[11px] text-slate-500">
                Registrasi Akun Baru Faskes &amp; Klinik
              </p>
            </div>
          </div>

          {/* Main Auth Card Container */}
          <div className="rounded-2xl p-4 sm:p-5 border border-slate-200 bg-white shadow-xl shadow-slate-200/60 w-full space-y-2.5 shrink-0">
            {/* Header */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight mb-0.5">
                {linkedGoogleUser ? 'Daftar Akun Baru (Terhubung Google)' : 'Daftar Akun Baru'}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-tight">
                {linkedGoogleUser
                  ? 'Buat kata sandi akun faskes Anda agar dapat masuk lewat form username/email maupun 1-klik Google.'
                  : 'Daftarkan faskes Anda sebagai Admin Tenant dengan masa coba (trial) gratis 14 hari penuh.'}
              </p>
            </div>

            {/* Single Account Google Linked Banner */}
            {linkedGoogleUser && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5 animate-in fade-in">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="font-bold text-emerald-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>Akun Google Terhubung (1 Akun Tunggal)</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-200 text-emerald-900">
                        Terverifikasi
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkedGoogleUser(null);
                        setRegName('');
                        setRegEmail('');
                        setRegPassword('');
                        setRegConfirmPassword('');
                        try {
                          localStorage.removeItem('rme_pending_google_user');
                        } catch {}
                      }}
                      className="text-[10.5px] text-slate-500 hover:text-rose-600 underline cursor-pointer"
                    >
                      Ganti Akun
                    </button>
                  </div>
                  <p className="text-emerald-800/90 text-[11px] leading-relaxed">
                    Username (<strong>@{regUsername}</strong>) dan Alamat Email (<strong>{regEmail}</strong>) otomatis diambil langsung dari profil Akun Google Anda. Tidak ada pembuatan 2 akun terpisah; cukup tentukan kata sandi untuk akun ini.
                  </p>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {registerSuccessMsg ? (
              <div className="space-y-3 py-2">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs sm:text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Registrasi Akun Faskes Berhasil!</span>
                  </div>
                  <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                    {registerSuccessMsg}
                  </p>
                </div>

                <Link
                  href="/login"
                  className="w-full h-10 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>Lanjut Masuk ke Akun Anda</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                <form onSubmit={handleRegisterSubmit} className="space-y-2">
                  {registerError && (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 mt-0.5" />
                      <div className="flex-1 font-medium">{registerError}</div>
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span>Nama Lengkap / Admin Tenant <span className="text-rose-500">*</span></span>
                      {linkedGoogleUser && (
                        <span className="text-[9.5px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Dari Google
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        type="text"
                        required
                        placeholder="e.g. dr. Budi Santoso atau Klinik Sehat Mandiri"
                        value={regName}
                        disabled={isRegistering || Boolean(linkedGoogleUser)}
                        onChange={(e) => {
                          setRegName(e.target.value);
                          if (registerError) setRegisterError(null);
                        }}
                        className={`h-9 pl-9 text-xs sm:text-sm border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 rounded-xl w-full ${
                          linkedGoogleUser ? 'bg-slate-100/80 font-semibold cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span>Alamat Email Resmi Faskes <span className="text-rose-500">*</span></span>
                      {linkedGoogleUser && (
                        <span className="text-[9.5px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Dari Google
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        type="email"
                        required
                        placeholder="e.g. faskes@klinik.id"
                        value={regEmail}
                        disabled={isRegistering || Boolean(linkedGoogleUser)}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          if (registerError) setRegisterError(null);
                        }}
                        className={`h-9 pl-9 text-xs sm:text-sm border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 rounded-xl w-full ${
                          linkedGoogleUser ? 'bg-slate-100/80 font-mono cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Username Login (Derived automatically from Google Account) */}
                  {linkedGoogleUser && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Username Login Akun</span>
                        <span className="text-[9.5px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Otomatis dari Akun Google
                        </span>
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          type="text"
                          value={`@${regUsername}`}
                          disabled
                          className="h-9 pl-9 text-xs sm:text-sm bg-slate-100/80 border-slate-200 text-slate-700 font-semibold rounded-xl w-full cursor-not-allowed"
                        />
                      </div>
                    </div>
                  )}

                  {/* Passwords in 2-column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        {linkedGoogleUser ? 'Buat Kata Sandi Akun' : 'Kata Sandi (Min. 6)'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          placeholder="Min. 6 karakter"
                          value={regPassword}
                          disabled={isRegistering}
                          onChange={(e) => {
                            setRegPassword(e.target.value);
                            if (registerError) setRegisterError(null);
                          }}
                          className="h-9 pl-9 pr-8 text-xs sm:text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 rounded-xl w-full"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2 top-2 h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Konfirmasi Sandi <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          placeholder="Ketik ulang sandi"
                          value={regConfirmPassword}
                          disabled={isRegistering}
                          onChange={(e) => {
                            setRegConfirmPassword(e.target.value);
                            if (registerError) setRegisterError(null);
                          }}
                          className="h-9 pl-9 text-xs sm:text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 rounded-xl w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Benefit Box */}
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10.5px] text-slate-600 space-y-0.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Benefit Akun Faskes Baru:</span>
                    </div>
                    <ul className="list-disc pl-4 text-slate-500 leading-tight space-y-0.5 text-[10px]">
                      <li>Masa evaluasi sistem (trial) 14 hari tanpa biaya komitmen</li>
                      <li>Hak akses penuh Super Admin Tenant (Pendaftaran, SOAP, Kasir, Apotek)</li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full h-9.5 gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer mt-0.5"
                  >
                    {isRegistering ? (
                      <div className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{linkedGoogleUser ? 'Menyimpan Akun Google...' : 'Mendaftarkan Akun Faskes...'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span>{linkedGoogleUser ? 'Simpan Sandi & Selesaikan Pendaftaran' : 'Daftarkan Akun Baru'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Google Options / Divider */}
                {linkedGoogleUser ? (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setIsGoogleModalOpen(true)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
                    >
                      Ingin mendaftar dengan akun Google yang lain? Klik di sini →
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative flex items-center justify-center my-0.5">
                      <div className="w-full border-t border-slate-200" />
                      <span className="absolute bg-white px-2.5 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                        atau daftar dengan google
                      </span>
                    </div>

                    <div className="space-y-1">
                      <GoogleButton
                        label="Daftar Cepat dengan Akun Google"
                        isLoading={isGoogleLoading}
                        onClick={handleInitiateGoogleOAuth}
                        className="py-1.5 text-xs h-9"
                      />
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setIsGoogleModalOpen(true)}
                          className="text-[10px] text-slate-400 hover:text-emerald-700 transition-colors font-medium cursor-pointer"
                        >
                          Atau daftar cepat via akun simulasi demo lokal →
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Link to Login */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500">
                Sudah memiliki akun faskes?{' '}
                <Link
                  href="/login"
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
                >
                  Masuk ke Sistem Sekarang →
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Security Compliance */}
          <div className="text-center space-y-0.5 pt-1">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Standar Permenkes No. 24/2022 • SatuSehat Terintegrasi</span>
            </div>
            <p className="text-[9px] text-slate-400">
              Hak Cipta © 2026 RME Klinik Indonesia.
            </p>
          </div>
        </div>
      </div>

      {/* Google Account Selector Dialog */}
      <GoogleAuthDialog
        open={isGoogleModalOpen}
        onOpenChange={setIsGoogleModalOpen}
        onSelectAccount={handleGoogleRegister}
        title="Daftar Cepat dengan Akun Google"
        description="Pilih akun Google Anda untuk mendaftar akun faskes baru dan langsung masuk dengan trial 14 hari aktif"
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc]">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
