'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CrownIcon } from '@/components/kingstream/icons/CrownIcon';
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminSession, setAdminSession } from '@/lib/kingstream-storage';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Harap masukkan username dan password');
      toast.error('Harap isi username dan password');
      return;
    }

    setIsLoading(true);

    // Verify credentials (default: admin / admin123 or flexible)
    setTimeout(() => {
      const validUsername = username.trim().toLowerCase();
      if ((validUsername === 'admin' && password === 'admin123') || (validUsername === 'admin' && password === 'admin')) {
        const sessionData = {
          username: username.trim(),
          name: 'Super Administrator',
          role: 'ADMIN',
          token: `ks_tok_${Date.now()}`,
          loginTime: new Date().toISOString(),
        };

        setAdminSession(sessionData);
        toast.success('Login berhasil! Selamat datang di Admin Dashboard KingStream.');
        router.push('/admin/dashboard');
      } else {
        setIsLoading(false);
        setErrorMsg('Username atau password salah! Gunakan: admin / admin123');
        toast.error('Kredensial tidak valid');
      }
    }, 600);
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMsg('');
    toast.info('Akun demo berhasil diisi: admin / admin123');
  };

  return (
    <div className="min-h-screen bg-[#0D061A] text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-900/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-emerald-950/15 blur-[100px] pointer-events-none rounded-full" />

      {/* Top Bar with Back to Website */}
      <header className="p-4 sm:p-6 flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors bg-purple-950/20 hover:bg-purple-900/30 border border-purple-800/20 px-3.5 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Website</span>
        </Link>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400">Portal Keamanan Terenkripsi</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-[#130A24]/90 backdrop-blur-xl border border-[#2e1d52] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-200">
          {/* Logo & Heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#6b21a8] to-[#9333ea] text-white shadow-lg shadow-purple-950/60 mb-3">
              <CrownIcon className="w-6 h-6 text-white" />
            </div>

            <div className="flex items-baseline justify-center font-bold text-2xl tracking-tight">
              <span className="text-white">King</span>
              <span className="text-[#c084fc] drop-shadow-[0_0_12px_rgba(192,132,252,0.4)]">Stream</span>
              <span className="ml-2 text-xs font-semibold uppercase bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-700/50">
                Admin
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Masuk untuk upload video, kelola konten, dan atur link banner promo/iklan
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username Administrator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username (cth: admin)"
                  className="w-full bg-[#0D061A] border border-[#2e1d52] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full bg-[#0D061A] border border-[#2e1d52] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-purple-800 bg-[#0D061A] text-purple-600 focus:ring-purple-500"
                />
                <span>Ingat sesi saya</span>
              </label>

              <button
                type="button"
                onClick={handleQuickFill}
                className="text-purple-400 hover:text-purple-300 transition underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Isi Demo (admin/admin123)</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#6d28d9] hover:to-[#7e22ce] text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="mt-6 p-3 bg-purple-950/20 border border-purple-800/30 rounded-xl text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">🔑 Kredensial Default Admin:</div>
            <div>Username: <span className="text-purple-300 font-mono">admin</span></div>
            <div>Password: <span className="text-purple-300 font-mono">admin123</span></div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 relative z-10">
        © 2026 KingStream Admin Portal. Seluruh hak cipta dilindungi.
      </footer>
    </div>
  );
}

